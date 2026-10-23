# YatraLocal — Development & Testing Progress

Prototype verification checklist covering all 14 development phases for **YatraLocal — Tourism for Everyone, Powered by Locals**.

---

## 🚦 Phase Checklist

- [x] **Phase 1: Design System & App Shell**
  - [x] `css/tokens.css`: Warm Indian-travel palette (Deep Teal `#0d5c58`, Saffron `#d97706`, Off-White `#fbf9f5`, Dark Slate `#1f2937`).
  - [x] `css/base.css` & `css/components.css`: WCAG AA contrast, min 44px touch targets, visible focus rings, skip-to-content link.
  - [x] `js/router.js`: Hash-based SPA routing (`#/`, `#/plan`, `#/itinerary`, `#/stays`, `#/booking`, `#/owner`, `#/saral`, `#/sos`, `#/trips`, `#/styleguide`, 404).
  - [x] `js/store.js`: LocalStorage-backed state management.
  - [x] `pages/styleguideView.js`: Component style guide at `#/styleguide`.

- [x] **Phase 2: Landing Page & Trip-Preference Form**
  - [x] Hero headline, problems section with 3 cards, Manali illustrative scenario callout.
  - [x] Solution cards, inclusion strip, impact strip with 2 `[Add verified statistic + source]` dashed boxes.
  - [x] `#/plan`: Destination selector with crowd badges, budget slider + sync input, day stepper, travel mood chips (max 3), accessibility checkboxes.
  - [x] Friendly inline validation and responsive layout.

- [x] **Phase 3: Day-Wise Itinerary Generator Engine**
  - [x] `data/destinations.json`: 6 destinations with 8–12 activities each, exact lat/lng coordinates, popular vs offbeat alternatives.
  - [x] `js/itinerary.js`: Pure functional rule engine honoring budget, moods, and senior walking limits.
  - [x] `#/itinerary`: Timeline view, "Why this plan", "Swap activity" handler, sticky cost summary, 1s simulated animation.
  - [x] `tests/itinerary.test.html`: Plain browser unit assertions test suite.

- [x] **Phase 4: Local Stays & Verified Guides Discovery**
  - [x] `data/hosts.json`: 12 homestays and 8 local guides, Manali 8-room homestay with 6 empty off-season rooms.
  - [x] `#/stays`: Stays | Guides tabs, filters (price, rating, verified, senior-friendly), local-first ranking.
  - [x] Card with off-season ribbons, detail modal with host stories and simulated calendar.
  - [x] Sticky continue-to-booking bar with updated budget progress.

- [x] **Phase 5: Saral Mode (सरल मोड) Inclusive Experience**
  - [x] Global toggle in header & landing page card adding `.saral` to `<html>`.
  - [x] High-contrast 22px+ font, min 64px tall buttons, distraction-free UI.
  - [x] 5-step single-question wizard: 1) Destination, 2) Days, 3) Budget tier, 4) Preference, 5) Review.
  - [x] Web Speech API (`speechSynthesis`) with Hindi/English voice readouts and speech recognition.
  - [x] Results view with large day cards, 1 stay, 1 guide, and 1 large "Book this" button.

- [x] **Phase 6: Booking Flow & Family-Assisted Booking**
  - [x] 5-step stepper: 1 Review -> 2 Traveller info -> 3 Booker selection -> 4 Confirm -> 5 Confirmation.
  - [x] Local income indicator (90% direct payout).
  - [x] Family-assisted booking flow with booker relationship, phone, and simulated consent.
  - [x] Demo payment (fake UPI / Card) with prominent "SIMULATED — no money charged" warning banner.
  - [x] `.ics` calendar file generator and WhatsApp deep link sharing.
  - [x] `#/trips` dashboard displaying all confirmed trips.

- [x] **Phase 7: Hotel Owner Dashboard**
  - [x] Demo login as Manali Homestay (8 rooms, 6 empty off-season).
  - [x] KPI metrics: 25% occupancy, confirmed bookings count, monthly payout.
  - [x] Pure SVG seasonal demand vs occupancy gap chart.
  - [x] Off-season offer builder with live card preview synced directly to `/api/offers` and `#/stays`.
  - [x] Bookings audit table reflecting new bookings made in Phase 6.

- [x] **Phase 8: Safety SOS Module**
  - [x] Persistent floating SOS button on all pages with 2-second circular SVG progress ring.
  - [x] 5-second cancel countdown overlay to prevent false alarms.
  - [x] Dispatches live coordinates via `navigator.geolocation.watchPosition`.
  - [x] Official one-tap hotlines: Call 112, Police 100, Ambulance 108.
  - [x] Voice announcement in Saral Mode.

- [x] **Phase 9: Accessibility Audit, Polish & Bilingual Layer**
  - [x] Bilingual English & Hindi translations in `data/i18n.json` via `js/i18n.js`.
  - [x] Accessible focus management moving focus to `<h1>` on route change.
  - [x] Semantic landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`), visible focus rings.
  - [x] Custom 404 handler for invalid hashes.

- [x] **Phase 10: Submission Documentation & Demo Script**
  - [x] Comprehensive `README.md` with architecture, local run instructions, and roadmap.
  - [x] `docs/DEMO_SCRIPT.md` with 3-minute pitch run-sheet, 8 judge Q&As, and git commands.

- [x] **Phase 11: Real Leaflet & OpenStreetMap Interactive Map**
  - [x] Leaflet 1.9.4 loaded via CDN with standard OpenStreetMap tile attribution.
  - [x] Itinerary map with numbered day-coded pins, dashed polyline routes per day.
  - [x] Stays list / map toggle with homestay pins and Haversine distance calculations.
  - [x] Crowd Heatmap layer shading congested hubs red and serene offbeat gems green.
  - [x] Directions deep link button opening Google Maps in a new tab.

- [x] **Phase 12: Real AI Integration & Serverless Proxy Backend**
  - [x] Native Python standard library backend in `server.py` replacing Netlify and Supabase.
  - [x] `/api/plan` endpoint with prompt constrained exclusively to `destinations.json` IDs.
  - [x] Deterministic cost recomputation on server so LLM cannot invent prices.
  - [x] `/api/chat` conversational endpoint for "Ask YatraLocal" refinement.
  - [x] Automatic fallback to rule-based engine when offline or if no LLM key is configured.

- [x] **Phase 13: Real SOS Alert & Live Family Tracking**
  - [x] Backend `/api/sos` generating 6-hour expiring tokens (`TRK-XXXX`).
  - [x] `/track.html?id=TOKEN`: Dedicated family tracking view with live Leaflet map and 15s polling.
  - [x] `/api/track/update` and `/api/track/safe` endpoints replacing Supabase.
  - [x] Zero-backend SMS (`sms:`) and WhatsApp (`wa.me`) deep links.

- [x] **Phase 14: Final Verification & End-to-End Test**
  - [x] End-to-end user flow verified from Home -> Plan -> Itinerary -> Stays -> Booking -> Owner Dashboard -> SOS.

---

## 🔍 How to Test Each Feature

1. **Start the Native Server:**
   ```bash
   ./start.sh
   # Or: python3 server.py
   # Opens at http://localhost:8000
   ```
2. **Test Trip Planning & Map (Phases 2, 3, 11, 12):**
   - Go to `http://localhost:8000/#/plan`
   - Select **Manali**, budget **₹18,000**, **3 days**, moods: **Relaxed** & **Cultural**.
   - Click **Generate Smart Itinerary**.
   - Check day cards, verify Leaflet map with polyline routes, toggle **Crowd Heatmap**, click **Swap Activity**, and try the **Ask YatraLocal** chat box.
3. **Test Stays & Guides Discovery (Phase 4):**
   - Click **Choose Local Stay & Guide** or visit `#/stays`.
   - Toggle **Stays** and **Guides** tabs, try the **Map View** toggle.
   - Click **Details** to see the host story and simulated calendar, then click **Select**.
4. **Test Booking Flow & Family-Assisted Booking (Phase 6):**
   - Click **Continue to Booking**.
   - In Step 3, choose **A family member is booking for the traveller**.
   - Enter family booker details, click continue to simulated payment, and authorize demo payment.
   - On the confirmation screen, test **Add to Calendar (.ics)** and verify `YatraLocal_BK-XXXX.ics` downloads.
5. **Test Hotel Owner Dashboard & Live Sync (Phase 7):**
   - Visit `#/owner`.
   - Verify the 25% occupancy and your recent booking appearing in the bookings table.
   - In the **Publish Off-Season Offer** builder, change discount to **30%**, click **Publish Offer**.
   - Return to `#/stays` and verify the homestay now carries the updated **30% OFF-SEASON** ribbon!
6. **Test Saral Mode (Phase 5):**
   - Tap **👵 Saral Mode** in the header.
   - Notice font size increases to 22px+, buttons become 64px tall.
   - Tap **🔊 Read Aloud** to test voice speech.
   - Walk through the 5 steps using the big cards.
7. **Test Safety SOS (Phases 8 & 13):**
   - Press and hold the floating red **SOS** button for 2 seconds.
   - Watch the 5-second countdown cancel dialog.
   - Upon completion, copy the **Family Live Tracking Link** (e.g., `http://localhost:8000/track.html?id=TRK-XXXX`).
   - Open that URL in a new browser window and watch the real-time location marker!
   - Tap **I'm Safe — Stop Sharing** to close.
8. **Test Unit Test Suite:**
   - Open `http://localhost:8000/tests/itinerary.test.html` and verify all tests pass.
