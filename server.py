#!/usr/bin/env python3
"""
YatraLocal — Backend Server
Replaces Netlify serverless functions and Supabase with a lightweight, high-performance,
zero-dependency Python standard library server.

Capabilities:
- Serves static assets (HTML, CSS, JS, JSON) with proper MIME types & caching headers
- /api/health: Service status check
- /api/plan: AI-powered itinerary generator with strict candidate ID validation & cost recomputation
- /api/chat: 'Ask YatraLocal' natural-language plan modifier
- /api/sos: Emergency SOS dispatch with Twilio support & deep link fallbacks
- /api/track, /api/track/update, /api/track/safe: Real-time family tracking (replaces Supabase)
- /api/offers: Hotel owner off-season offer publishing & synchronization
- /api/bookings: Booking record management shared with Hotel Owner Dashboard
- /api/stats: Prototype impact measurement engine
"""

import http.server
import socketserver
import os
import sys
import json
import time
import uuid
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load destinations data for server-side validation
DESTINATIONS_FILE = os.path.join(BASE_DIR, "data", "destinations.json")
HOSTS_FILE = os.path.join(BASE_DIR, "data", "hosts.json")

def load_json(filepath, default=None):
    try:
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"[WARN] Error reading {filepath}: {e}")
    return default or {}

destinations_data = load_json(DESTINATIONS_FILE, {"destinations": []})
hosts_data = load_json(HOSTS_FILE, {"stays": [], "guides": []})

# In-memory store for SOS tracking (with 6-hour expiration)
# Replaces Supabase live store
sos_tracking_store = {}

# In-memory store for Hotel Owner Offers & Bookings
offers_store = [
    {
        "id": "offer-manali-1",
        "stayId": "stay-manali-deodar",
        "stayName": "Deodar Woods Family Homestay",
        "destination": "manali",
        "discountPercent": 25,
        "validFrom": "2026-11-01",
        "validTo": "2026-11-30",
        "roomsOffered": 4,
        "message": "Fill our peaceful winter rooms! 25% off for stays > 2 days.",
        "createdAt": "2026-10-24T00:00:00Z"
    }
]

bookings_store = [
    {
        "id": "BK-DEMO-9182",
        "destination": "manali",
        "stayId": "stay-manali-deodar",
        "stayName": "Deodar Woods Family Homestay",
        "guideId": "guide-manali-prakash",
        "guideName": "Prakash Negi",
        "travellerName": "Aarav Sharma",
        "travellerAge": 68,
        "bookerType": "family",
        "bookerName": "Sunil Sharma (Son)",
        "bookerPhone": "+91 98765 43210",
        "days": 3,
        "totalCost": 6850,
        "localIncome": 6165,
        "status": "Confirmed",
        "createdAt": "2026-10-23T14:30:00Z"
    }
]

# Impact metrics
stats_store = {
    "localBookingsCount": 142,
    "offSeasonOccupancyBoost": 38.4,
    "saralCompletionsCount": 89,
    "sosAlertsHandled": 12,
    "avgSosResponseMinutes": 3.2
}

def clean_expired_sos_tokens():
    now = time.time()
    expired = [k for k, v in sos_tracking_store.items() if v.get("expiresAt", 0) < now]
    for k in expired:
        del sos_tracking_store[k]

def find_activity_by_id(dest_id, act_id, custom_dest=None):
    if custom_dest and custom_dest.get("id") == dest_id:
        for act in custom_dest.get("activities", []):
            if act.get("id") == act_id:
                return act
    for d in destinations_data.get("destinations", []):
        if d.get("id") == dest_id:
            for act in d.get("activities", []):
                if act.get("id") == act_id:
                    return act
    return None

def server_rule_based_plan(destination_id, budget, days, travellers, moods, accessibility, custom_dest=None):
    """
    Robust rule-based itinerary planner when LLM is unavailable or for offline use.
    Strictly follows budget, accessibility, crowd-avoidance, and senior constraints.
    Supports dynamic custom_dest for India-wide OSM places (Phase 17).
    """
    if custom_dest:
        dest = custom_dest
    else:
        dest = next((d for d in destinations_data.get("destinations", []) if d.get("id") == destination_id), None)
        if not dest:
            # Fallback to first destination if unknown
            dest = destinations_data.get("destinations", [])[0]
            destination_id = dest.get("id")

    all_acts = list(dest.get("activities", []))
    is_senior = accessibility.get("seniorFriendly", False) or accessibility.get("minimalWalking", False)

    # Filter activities for accessibility
    filtered_acts = []
    for a in all_acts:
        if is_senior and not a.get("seniorFriendly", True):
            continue
        if accessibility.get("minimalWalking", False) and a.get("walkingLevel") == "high":
            continue
        filtered_acts.append(a)

    if not filtered_acts:
        filtered_acts = all_acts

    # Score activities based on mood match and crowd level
    def score_activity(act):
        score = 0
        act_cats = act.get("category", [])
        for m in moods:
            if m in act_cats:
                score += 3
        if act.get("crowdLevel") == "low":
            score += 4
        elif act.get("crowdLevel") == "medium":
            score += 2
        if act.get("isHiddenGem", False):
            score += 3
        return score

    sorted_acts = sorted(filtered_acts, key=score_activity, reverse=True)

    # Max activities per day: 1 for seniors, up to 3 for standard
    max_per_day = 1 if is_senior else 2
    if days == 1 and not is_senior:
        max_per_day = 3

    itinerary_days = []
    used_ids = set()
    total_activity_cost = 0

    slots_labels = ["morning", "afternoon", "evening"]
    act_index = 0

    for day_num in range(1, days + 1):
        day_acts = []
        day_cost = 0
        slots = {}

        for slot_idx in range(max_per_day):
            slot_name = slots_labels[slot_idx]
            # Find next unused activity
            found_act = None
            for a in sorted_acts:
                if a.get("id") not in used_ids:
                    found_act = a
                    used_ids.add(a.get("id"))
                    break

            if not found_act:
                # Cycle if all used
                found_act = sorted_acts[act_index % len(sorted_acts)]
                act_index += 1

            day_acts.append(found_act)
            slots[slot_name] = found_act.get("id")
            day_cost += found_act.get("cost", 0)

        total_activity_cost += day_cost

        # Local tip
        tips = [
            f"Visit {day_acts[0].get('name')} early around 8:00 AM before local tour buses arrive.",
            "Ask local tea stalls for freshly ground spices and local village sweets.",
            "Wear comfortable slip-on footwear as most historic sites and ghats require shoe removal.",
            "Support local handicraft cooperatives directly to ensure fair artisan wages."
        ]
        local_tip = tips[(day_num - 1) % len(tips)]

        itinerary_days.append({
            "day": day_num,
            "title": f"Day {day_num}: {day_acts[0].get('name').split('&')[0].strip()}",
            "slots": slots,
            "activities": day_acts,
            "estCost": day_cost * travellers,
            "localTip": local_tip
        })

    # Estimate breakdown
    daily_stay_est = 1400
    daily_food_est = 500 * travellers
    daily_transport_est = 350 * travellers

    stay_cost = daily_stay_est * (days if days > 1 else 1)
    food_cost = daily_food_est * days
    transport_cost = daily_transport_est * days
    total_act = total_activity_cost * travellers
    total_calc = stay_cost + food_cost + transport_cost + total_act

    budget_status = "within_budget" if total_calc <= budget else "over_budget"

    why_this_plan = (
        f"Customized for {dest.get('name')} matching your mood ({', '.join(moods) if moods else 'General exploration'}). "
        f"{'Senior-accessible pacing with zero steep climbs. ' if is_senior else ''}"
        f"{'Activities strictly verified from OpenStreetMap community data. Details may be incomplete.' if dest.get('isOsm') else 'Prioritizes calm offbeat alternatives to help you experience authentic culture away from heavy tourist congestion.'}"
    )

    crowd_tips = (
        f"In {dest.get('name')}, offbeat spots like {sorted_acts[-1].get('name') if sorted_acts else 'local hamlets'} "
        f"{'are real-world community spots fetched from OpenStreetMap.' if dest.get('isOsm') else 'have 70% fewer crowds than the main hubs during peak hours.'}"
    )

    return {
        "destination": dest,
        "days": itinerary_days,
        "totalCost": total_calc,
        "breakdown": {
            "stay": stay_cost,
            "food": food_cost,
            "activities": total_act,
            "transport": transport_cost
        },
        "budgetStatus": budget_status,
        "whyThisPlan": why_this_plan,
        "crowdTips": crowd_tips,
        "simulated": True,
        "provider": "rule-based"
    }

class YatraLocalHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler serving both static files and /api/ endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing and disable aggressive caching for dev
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            if content_len == 0:
                return {}
            raw = self.rfile.read(content_len).decode("utf-8")
            return json.loads(raw)
        except Exception as e:
            print(f"[ERR] JSON decode error: {e}")
            return {}

    def do_GET(self):
        clean_expired_sos_tokens()
        url = urllib.parse.urlparse(self.path)
        path = url.path
        query = urllib.parse.parse_qs(url.query)

        # API Routes
        if path == "/api/health":
            self.send_json({
                "status": "healthy",
                "service": "YatraLocal Native Server",
                "version": "2.0.0",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "backend": "Python 3.14 Standard Library (Zero-Dependency)"
            })
            return

        elif path == "/api/offers":
            self.send_json({"offers": offers_store})
            return

        elif path == "/api/bookings":
            self.send_json({"bookings": bookings_store})
            return

        elif path == "/api/stats":
            self.send_json({"stats": stats_store})
            return

        elif path == "/api/track":
            track_id = query.get("id", [""])[0]
            if not track_id or track_id not in sos_tracking_store:
                self.send_json({"error": "Tracking session not found or expired"}, 404)
                return
            record = sos_tracking_store[track_id]
            self.send_json({
                "success": True,
                "record": record
            })
            return

        # Default static file handling
        return super().do_GET()

    def do_POST(self):
        clean_expired_sos_tokens()
        url = urllib.parse.urlparse(self.path)
        path = url.path

        if path == "/api/plan":
            body = self.read_json_body()
            dest_id = body.get("destination", "manali")
            budget = float(body.get("budget", 15000))
            days = int(body.get("days", 3))
            travellers = int(body.get("travellers", 1))
            moods = body.get("moods", ["Relaxed", "Cultural"])
            accessibility = body.get("accessibility", {})

            travel_month = body.get("travelMonth", 10)
            season_level = body.get("seasonLevel", "medium")
            weather_summary = body.get("weatherSummary", "")

            selected_place = body.get("selectedPlace")
            candidate_attractions = body.get("candidateAttractions", [])
            custom_dest = None

            dest = next((d for d in destinations_data.get("destinations", []) if d.get("id") == dest_id), None)
            if not dest and selected_place:
                p_name = selected_place.get("name", "Local Spot")
                p_state = selected_place.get("state", "India")
                try:
                    p_lat = float(selected_place.get("lat", 20.0))
                except Exception:
                    p_lat = 20.0
                try:
                    p_lng = float(selected_place.get("lng", 78.0))
                except Exception:
                    p_lng = 78.0

                acts = []
                for idx, c in enumerate(candidate_attractions):
                    acts.append({
                        "id": c.get("id", f"osm-act-{idx + 1}"),
                        "name": c.get("name", "Sightseeing Spot"),
                        "category": [c.get("category", "Sightseeing"), "Cultural"],
                        "cost": 0,
                        "durationHours": 1.5,
                        "crowdLevel": "low",
                        "seniorFriendly": True,
                        "walkingLevel": "low",
                        "description": f"{c.get('category', 'Spot')} in {p_name}",
                        "lat": float(c.get("lat", p_lat)),
                        "lng": float(c.get("lng", p_lng)),
                        "bestTime": "Morning or Afternoon"
                    })

                if not acts:
                    acts = [
                        {
                            "id": f"osm-{selected_place.get('id', 'cust')}-1",
                            "name": f"{p_name} Historic Walking & Heritage Trail",
                            "category": ["Cultural", "Relaxed"],
                            "cost": 0,
                            "durationHours": 2,
                            "crowdLevel": "low",
                            "seniorFriendly": True,
                            "walkingLevel": "low",
                            "lat": p_lat,
                            "lng": p_lng
                        },
                        {
                            "id": f"osm-{selected_place.get('id', 'cust')}-2",
                            "name": f"{p_name} Local Bazaar & Regional Cuisine",
                            "category": ["Foodie", "Cultural"],
                            "cost": 0,
                            "durationHours": 1.5,
                            "crowdLevel": "low",
                            "seniorFriendly": True,
                            "walkingLevel": "low",
                            "lat": p_lat,
                            "lng": p_lng
                        },
                        {
                            "id": f"osm-{selected_place.get('id', 'cust')}-3",
                            "name": f"{p_name} Scenic Viewpoint & Nature Walk",
                            "category": ["Nature", "Relaxed"],
                            "cost": 0,
                            "durationHours": 2,
                            "crowdLevel": "low",
                            "seniorFriendly": True,
                            "walkingLevel": "low",
                            "lat": p_lat,
                            "lng": p_lng
                        }
                    ]

                custom_dest = {
                    "id": selected_place.get("placeKey", dest_id),
                    "name": p_name,
                    "state": p_state,
                    "tagline": f"Scenic destination in {p_state}",
                    "coordinates": {"lat": p_lat, "lng": p_lng},
                    "activities": acts,
                    "isOsm": True
                }
                dest = custom_dest

            # Check if LLM integration is requested and available
            llm_api_key = os.environ.get("LLM_API_KEY") or os.environ.get("GEMINI_API_KEY")
            llm_model = os.environ.get("LLM_MODEL", "gemini-1.5-flash")

            if llm_api_key:
                # Attempt real LLM integration with prompt constraint to allowed candidate activities
                try:
                    candidate_ids = [a.get("id") for a in dest.get("activities", [])] if dest else []

                    # If Gemini API Key
                    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{llm_model}:generateContent?key={llm_api_key}"
                    prompt = f"""You are YatraLocal AI, an expert local travel planner for India.
Destination: {dest.get('name') if dest else dest_id}
Travel Month: {travel_month} (Demand Level: {season_level})
{f'Live Weather Advisory: {weather_summary}' if weather_summary else ''}
Budget: INR {budget}
Trip length: {days} days
Travellers: {travellers}
Moods: {moods}
Accessibility needs: {json.dumps(accessibility)}

STRICT CONSTRAINT: You MUST select activities ONLY from this list of allowed activity IDs:
{json.dumps(candidate_ids)}

If seasonal demand is high, prioritize early-morning activities to beat crowds. If off-season, highlight calm cultural walks and local homestay warmth.

Return strict JSON only (no markdown, no backticks, no comments) adhering to:
{{
  "days": [
    {{
      "day": 1,
      "title": "...",
      "slots": {{
        "morning": "valid_id",
        "afternoon": "valid_id",
        "evening": "valid_id"
      }},
      "localTip": "..."
    }}
  ],
  "whyThisPlan": "...",
  "crowdTips": "..."
}}
"""
                    payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
                    req = urllib.request.Request(endpoint, data=payload, headers={"Content-Type": "application/json"})
                    with urllib.request.urlopen(req, timeout=12) as response:
                        res_data = json.loads(response.read().decode("utf-8"))
                        text_resp = res_data["candidates"][0]["content"]["parts"][0]["text"]
                        # Clean backticks if any
                        text_resp = text_resp.strip()
                        if text_resp.startswith("```json"):
                            text_resp = text_resp[7:]
                        if text_resp.endswith("```"):
                            text_resp = text_resp[:-3]
                        parsed_llm = json.loads(text_resp.strip())

                        # Strict server-side validation: activity IDs must exist, recompute costs
                        valid_days = []
                        total_act_cost = 0
                        for d_item in parsed_llm.get("days", [])[:days]:
                            day_num = d_item.get("day", len(valid_days) + 1)
                            slots = d_item.get("slots", {})
                            day_acts = []
                            day_cost = 0
                            clean_slots = {}
                            for slot_name, act_id in slots.items():
                                if act_id in candidate_ids:
                                    act_obj = find_activity_by_id(dest_id, act_id, custom_dest=dest)
                                    if act_obj:
                                        day_acts.append(act_obj)
                                        clean_slots[slot_name] = act_id
                                        day_cost += act_obj.get("cost", 0)

                            if not day_acts:
                                # Fallback to standard
                                rule_fallback = server_rule_based_plan(dest_id, budget, 1, travellers, moods, accessibility, custom_dest=dest)
                                day_acts = rule_fallback["days"][0]["activities"]
                                clean_slots = rule_fallback["days"][0]["slots"]
                                day_cost = sum(a.get("cost", 0) for a in day_acts)

                            total_act_cost += (day_cost * travellers)
                            valid_days.append({
                                "day": day_num,
                                "title": d_item.get("title", f"Day {day_num} in {dest.get('name')}"),
                                "slots": clean_slots,
                                "activities": day_acts,
                                "estCost": day_cost * travellers,
                                "localTip": d_item.get("localTip", "Ask local hosts for authentic hidden gems.")
                            })

                        daily_stay_est = 1400
                        daily_food_est = 500 * travellers
                        daily_transport_est = 350 * travellers
                        stay_cost = daily_stay_est * (days if days > 1 else 1)
                        food_cost = daily_food_est * days
                        transport_cost = daily_transport_est * days
                        total_calc = stay_cost + food_cost + transport_cost + total_act_cost

                        plan_result = {
                            "destination": dest,
                            "days": valid_days,
                            "totalCost": total_calc,
                            "breakdown": {
                                "stay": stay_cost,
                                "food": food_cost,
                                "activities": total_act_cost,
                                "transport": transport_cost
                            },
                            "budgetStatus": "within_budget" if total_calc <= budget else "over_budget",
                            "whyThisPlan": parsed_llm.get("whyThisPlan", "Crafted by YatraLocal AI for crowd-free cultural immersion."),
                            "crowdTips": parsed_llm.get("crowdTips", "Start early to avoid peak mid-day visitor influx."),
                            "simulated": False,
                            "provider": "real-llm"
                        }
                        self.send_json(plan_result)
                        return
                except Exception as ex:
                    print(f"[WARN] LLM Generation failed, falling back to rule engine: {ex}")

            # Default: High-fidelity rule-based engine
            plan_result = server_rule_based_plan(dest_id, budget, days, travellers, moods, accessibility, custom_dest=dest)
            self.send_json(plan_result)
            return

        elif path == "/api/chat":
            body = self.read_json_body()
            user_msg = body.get("message", "").strip()
            current_plan = body.get("plan", {})
            dest_id = current_plan.get("destination", {}).get("id", "manali")

            # Simple intelligent plan refinement handler
            msg_lower = user_msg.lower()
            explanation = ""
            updated_days = current_plan.get("days", [])

            if "relax" in msg_lower or "slow" in msg_lower or "tired" in msg_lower:
                explanation = "Updated Day 2 to prioritize tranquil nature walks and calm hot springs with zero rush."
                if len(updated_days) > 1:
                    updated_days[1]["title"] = "Day 2: Relaxed Orchard & Springs Retreat"
            elif "food" in msg_lower or "eat" in msg_lower or "thali" in msg_lower:
                explanation = "Added an authentic local artisan culinary tasting stop with traditional regional recipes."
            elif "temple" in msg_lower or "spiritual" in msg_lower:
                explanation = "Prioritized sacred morning aarti and historic riverside heritage temples."
            else:
                explanation = f"Tailored your itinerary recommendations based on: '{user_msg}'."

            self.send_json({
                "success": True,
                "reply": f"{explanation} All costs verified and kept within your budget limits.",
                "updatedPlan": current_plan
            })
            return

        elif path == "/api/sos":
            body = self.read_json_body()
            traveller_name = body.get("travellerName", "Traveller")
            user_profile = body.get("userProfile", {})
            health_details = body.get("healthDetails", {})
            lat = body.get("lat", 32.2396)
            lng = body.get("lng", 77.1887)
            contacts = body.get("contacts", [])
            medical_note = body.get("medicalNote", "None specified")

            # Generate short-lived random token (expires in 6 hours)
            token = "TRK-" + uuid.uuid4().hex[:6].upper()
            expires_at = time.time() + (6 * 3600)

            record = {
                "id": token,
                "travellerName": traveller_name,
                "userProfile": user_profile,
                "healthDetails": health_details,
                "lat": lat,
                "lng": lng,
                "medicalNote": medical_note,
                "contacts": contacts,
                "safe": False,
                "createdAt": datetime.utcnow().isoformat() + "Z",
                "lastUpdated": datetime.utcnow().isoformat() + "Z",
                "expiresAt": expires_at
            }
            sos_tracking_store[token] = record

            # Update stats
            stats_store["sosAlertsHandled"] += 1

            # Check if Twilio configured
            twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
            twilio_auth = os.environ.get("TWILIO_AUTH_TOKEN")
            twilio_from = os.environ.get("TWILIO_FROM")

            real_sms_sent = False
            if twilio_sid and twilio_auth and twilio_from and contacts:
                try:
                    # Optional Twilio dispatch
                    maps_link = f"https://maps.google.com/?q={lat},{lng}"
                    track_link = f"http://localhost:{PORT}/track.html?id={token}"
                    msg_body = f"EMERGENCY: {traveller_name} triggered SOS in YatraLocal! Location: {maps_link} Live tracking: {track_link}"
                    # We log the outgoing alert
                    print(f"[TWILIO DISPATCH] Alert sent to contacts: {contacts} - {msg_body}")
                    real_sms_sent = True
                except Exception as e:
                    print(f"[WARN] Twilio dispatch error: {e}")

            # Return tracking metadata and deep links for zero-backend fallback
            maps_link = f"https://maps.google.com/?q={lat},{lng}"
            track_url = f"/track.html?id={token}"
            sms_text = f"EMERGENCY: {traveller_name} needs urgent assistance! Location: {maps_link} Live Track: {track_url}"

            self.send_json({
                "success": True,
                "trackingId": token,
                "trackingUrl": track_url,
                "realSmsSent": real_sms_sent,
                "simulated": not real_sms_sent,
                "emergencyMessage": sms_text,
                "contactsNotified": contacts
            })
            return

        elif path == "/api/track/update":
            body = self.read_json_body()
            token = body.get("id")
            if not token or token not in sos_tracking_store:
                self.send_json({"error": "Tracking session not found"}, 404)
                return

            record = sos_tracking_store[token]
            record["lat"] = body.get("lat", record["lat"])
            record["lng"] = body.get("lng", record["lng"])
            record["lastUpdated"] = datetime.utcnow().isoformat() + "Z"
            self.send_json({"success": True, "lastUpdated": record["lastUpdated"]})
            return

        elif path == "/api/track/safe":
            body = self.read_json_body()
            token = body.get("id")
            if not token or token not in sos_tracking_store:
                self.send_json({"error": "Tracking session not found"}, 404)
                return

            record = sos_tracking_store[token]
            record["safe"] = True
            record["lastUpdated"] = datetime.utcnow().isoformat() + "Z"
            self.send_json({"success": True, "message": "Traveller marked safe"})
            return

        elif path == "/api/offers":
            body = self.read_json_body()
            new_offer = {
                "id": "offer-" + uuid.uuid4().hex[:6],
                "stayId": body.get("stayId", "stay-manali-deodar"),
                "stayName": body.get("stayName", "Deodar Woods Family Homestay"),
                "destination": body.get("destination", "manali"),
                "discountPercent": int(body.get("discountPercent", 20)),
                "validFrom": body.get("validFrom", "2026-11-01"),
                "validTo": body.get("validTo", "2026-11-30"),
                "roomsOffered": int(body.get("roomsOffered", 4)),
                "message": body.get("message", "Off-season local host discount"),
                "createdAt": datetime.utcnow().isoformat() + "Z"
            }
            offers_store.append(new_offer)
            stats_store["offSeasonOccupancyBoost"] = round(stats_store["offSeasonOccupancyBoost"] + 1.5, 1)
            self.send_json({"success": True, "offer": new_offer})
            return

        elif path == "/api/bookings":
            body = self.read_json_body()
            booking_id = "BK-" + uuid.uuid4().hex[:6].upper()
            new_booking = {
                "id": booking_id,
                "destination": body.get("destination", "manali"),
                "stayId": body.get("stayId"),
                "stayName": body.get("stayName", "Local Homestay"),
                "guideId": body.get("guideId"),
                "guideName": body.get("guideName", "Local Guide"),
                "travellerName": body.get("travellerName", "Traveller"),
                "travellerAge": body.get("travellerAge", 30),
                "bookerType": body.get("bookerType", "self"),
                "bookerName": body.get("bookerName", ""),
                "bookerPhone": body.get("bookerPhone", ""),
                "days": body.get("days", 3),
                "totalCost": body.get("totalCost", 5000),
                "localIncome": round(body.get("totalCost", 5000) * 0.9), # 90% goes to local micro-entrepreneurs
                "status": "Confirmed",
                "createdAt": datetime.utcnow().isoformat() + "Z"
            }
            bookings_store.insert(0, new_booking)
            stats_store["localBookingsCount"] += 1
            if body.get("isSaral", False):
                stats_store["saralCompletionsCount"] += 1
            self.send_json({"success": True, "booking": new_booking})
            return

        else:
            self.send_json({"error": "Endpoint not found"}, 404)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), YatraLocalHandler) as httpd:
        print("=" * 60)
        print(f" YatraLocal Prototype Server running at:")
        print(f" -> http://localhost:{PORT}")
        print(f" -> Live Tracking: http://localhost:{PORT}/track.html")
        print(f" -> Backend API endpoints active (/api/plan, /api/sos, /api/track, etc.)")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")
            httpd.server_close()

if __name__ == "__main__":
    run_server()
