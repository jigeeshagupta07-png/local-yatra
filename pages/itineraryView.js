/**
 * YatraLocal Itinerary View (Phases 3, 11, 12)
 * Day-wise timeline, interactive Leaflet map, polyline routes, crowd-aware layer,
 * activity swap, sticky budget bar, and 'Ask YatraLocal' conversational refinement.
 */

import { store } from '../js/store.js';
import { llmPlanProvider } from '../js/llmProvider.js';
import { YatraMap } from '../js/map.js';
import { fetchDestinations } from '../js/itinerary.js';
import { renderReviewsSection } from '../js/reviews.js';

let currentPlan = null;
let yatraMapInstance = null;
let allDestinations = [];

export function renderItineraryView() {
  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 120px;">
      <!-- Loading Skeleton Container -->
      <div id="itinerary-loading" style="display: block;">
        <div style="text-align: center; max-width: 600px; margin: 40px auto;">
          <div class="skeleton" style="width: 140px; height: 28px; margin: 0 auto 16px auto;"></div>
          <div class="skeleton" style="width: 80%; height: 42px; margin: 0 auto 12px auto;"></div>
          <div class="skeleton" style="width: 60%; height: 20px; margin: 0 auto 32px auto;"></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px; max-width: 800px; margin: 0 auto;">
          <div class="skeleton" style="height: 180px; border-radius: 16px;"></div>
          <div class="skeleton" style="height: 180px; border-radius: 16px;"></div>
          <div class="skeleton" style="height: 180px; border-radius: 16px;"></div>
        </div>
      </div>

      <!-- Main Itinerary Content (Populated after load) -->
      <div id="itinerary-content" style="display: none;">
        <!-- Header & AI Badge -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: var(--space-6);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span id="ai-status-badge" class="badge badge-simulated">Simulated AI Planner</span>
              <span class="badge badge-local" id="dest-state-badge">Himachal Pradesh</span>
            </div>
            <h1 style="margin: 0; font-size: clamp(1.8rem, 4vw, 2.4rem);" id="itinerary-header-title">
              Your Customized Journey
            </h1>
          </div>

          <div style="display: flex; gap: 8px;">
            <a href="#/plan" class="btn btn-secondary btn-sm">Edit Preferences</a>
            <button id="btn-print-plan" class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Print Plan</button>
          </div>
        </div>

        <!-- 'Why This Plan' Explanation Card -->
        <div class="card" style="background: #e8f5f4; border: 1.5px solid #b2dfdb; border-radius: var(--radius-lg); margin-bottom: var(--space-6); padding: var(--space-5);">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <div style="font-size: 1.6rem; line-height: 1;">💡</div>
            <div>
              <strong style="color: var(--color-primary); font-size: var(--text-sm);">WHY THIS LOCAL PLAN:</strong>
              <p style="margin: 4px 0 0 0; font-size: var(--text-sm); color: var(--color-text);" id="why-this-plan-text">
                Balanced pace matching your preferences while avoiding overcrowded peak times.
              </p>
              <div style="font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 6px;" id="crowd-tip-text"></div>
            </div>
          </div>
        </div>

        <!-- Interactive Leaflet Map Wrapper (Phase 11) -->
        <div class="map-wrapper" style="margin-bottom: var(--space-8);">
          <div class="map-toolbar">
            <button id="btn-toggle-crowd" class="map-toggle-btn">
              🚦 Toggle Crowd Heatmap
            </button>
            <button id="btn-fit-map" class="map-toggle-btn">
              🎯 Center All Activities
            </button>
          </div>
          <div id="itinerary-map" class="map-container"></div>
        </div>

        <!-- Layout Grid: Timeline on Left, Assistant Chat on Right -->
        <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-8);" id="main-plan-grid">
          <!-- Day-by-Day Timeline -->
          <div id="days-timeline-container" style="display: flex; flex-direction: column; gap: var(--space-6);">
            <!-- Populated dynamically -->
          </div>

          <!-- 'Ask YatraLocal' Chat Box (Phase 12) -->
          <div class="card" style="border-radius: var(--radius-lg); border: 1px solid var(--color-border); height: fit-content; padding: var(--space-6);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
              <span style="font-size: 1.5rem;">🤖</span>
              <div>
                <h3 style="font-size: 1.1rem; margin: 0;">Refine with YatraLocal Assistant</h3>
                <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                  E.g., "Make Day 2 slower", "Add more temple walks", "Swap for authentic street food"
                </div>
              </div>
            </div>

            <div id="chat-messages" style="background: var(--color-surface-subtle); border-radius: var(--radius-md); padding: 12px; max-height: 200px; overflow-y: auto; margin-bottom: 12px; font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px;">
              <div style="background: #fff; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);">
                Namaste! Need to slow down the walking pace or swap any activity? Just ask.
              </div>
            </div>

            <form id="ask-chat-form" style="display: flex; gap: 8px;">
              <input type="text" id="chat-user-input" class="input-control" placeholder="Type an adjustment request..." style="font-size: 0.9rem;" required>
              <button type="submit" class="btn btn-primary" id="btn-send-chat" style="white-space: nowrap;">Ask</button>
            </form>
            <div style="font-size: 0.75rem; color: var(--color-text-subtle); margin-top: 6px;">
              All suggestions are constrained to real verified destination spots within budget.
            </div>
          </div>
        </div>

        <!-- Destination Reviews & Feedback (Phase 15) -->
        <div id="destination-reviews-mount"></div>
      </div>

      <!-- Sticky Bottom Cost & Booking Summary Bar -->
      <div id="sticky-itinerary-bar" style="position: fixed; bottom: 0; left: 0; right: 0; background: #ffffff; border-top: 2px solid var(--color-border); box-shadow: 0 -4px 15px rgba(0,0,0,0.08); z-index: 990; padding: var(--space-3) var(--space-4);">
        <div class="container" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3);">
          <div style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span style="font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">ESTIMATED TOTAL:</span>
              <strong style="font-size: var(--text-xl); color: var(--color-primary); font-family: var(--font-heading);" id="sticky-total-cost">₹0</strong>
              <span style="font-size: var(--text-xs); color: var(--color-text-muted);" id="sticky-budget-target">Target: ₹0</span>
            </div>
            <div id="budget-status-pill" style="font-size: var(--text-xs); font-weight: 600; color: var(--color-success);">
              ✓ Within your budget target
            </div>
          </div>

          <div style="display: flex; gap: var(--space-3); align-items: center;">
            <a href="#/stays" class="btn btn-primary btn-lg" style="box-shadow: 0 4px 12px rgba(13, 92, 88, 0.3);">
              Choose Local Stay & Guide &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initItineraryEvents() {
  const loadingEl = document.getElementById('itinerary-loading');
  const contentEl = document.getElementById('itinerary-content');
  if (!loadingEl || !contentEl) return;

  allDestinations = await fetchDestinations();
  const prefs = store.get().preferences;

  // 1-second delay for realistic prototype generation animation
  try {
    const plan = await llmPlanProvider.generate(prefs);
    currentPlan = plan;
    store.setItinerary(plan);

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    renderPlanDetails(plan);
    initMap(plan);
    initChat(plan);
  } catch (err) {
    console.error('[Itinerary] Generation error:', err);
    loadingEl.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <h3>Could not generate plan</h3>
        <p>Please try adjusting your budget or destination.</p>
        <a href="#/plan" class="btn btn-primary">Back to Trip Form</a>
      </div>
    `;
  }
}

function renderPlanDetails(plan) {
  const titleEl = document.getElementById('itinerary-header-title');
  const stateBadge = document.getElementById('dest-state-badge');
  const aiBadge = document.getElementById('ai-status-badge');
  const whyPlanEl = document.getElementById('why-this-plan-text');
  const crowdTipEl = document.getElementById('crowd-tip-text');
  const timelineEl = document.getElementById('days-timeline-container');
  const stickyCost = document.getElementById('sticky-total-cost');
  const stickyTarget = document.getElementById('sticky-budget-target');
  const budgetPill = document.getElementById('budget-status-pill');

  const dest = plan.destination;
  titleEl.textContent = `${plan.days.length}-Day Unhurried Journey in ${dest?.name || 'India'}`;
  stateBadge.textContent = dest?.state || 'India';

  // AI Badge
  if (plan.provider === 'real-llm') {
    aiBadge.textContent = '⚡ Real AI Generated';
    aiBadge.className = 'badge badge-verified';
  } else {
    aiBadge.textContent = 'Simulated AI (Rule-Based Engine)';
    aiBadge.className = 'badge badge-simulated';
  }

  whyPlanEl.textContent = plan.whyThisPlan || 'Optimized for local immersion and crowd-avoidance.';
  crowdTipEl.textContent = plan.crowdTips || '';

  // Sticky costs
  stickyCost.textContent = `₹${plan.totalCost.toLocaleString('en-IN')}`;
  stickyTarget.textContent = `Target: ₹${Number(store.get().preferences.budget).toLocaleString('en-IN')}`;

  if (plan.budgetStatus === 'within_budget') {
    budgetPill.textContent = '✓ Within your budget target';
    budgetPill.style.color = 'var(--color-success)';
  } else {
    budgetPill.textContent = '⚠️ Exceeds budget target (adjust days or activities)';
    budgetPill.style.color = 'var(--color-danger)';
  }

  // Render Days Timeline
  timelineEl.innerHTML = '';
  plan.days.forEach((dayObj, dayIdx) => {
    const dayCard = document.createElement('div');
    dayCard.className = 'card';
    dayCard.style.padding = 'var(--space-6)';
    dayCard.style.borderLeft = `5px solid ${['#0d5c58', '#d97706', '#0284c7', '#7c3aed', '#db2777'][dayIdx % 5]}`;

    let actsHtml = '';
    dayObj.activities.forEach(act => {
      const crowdClass = act.crowdLevel === 'low' ? 'badge-crowd-low' : act.crowdLevel === 'high' ? 'badge-crowd-high' : 'badge-crowd-med';
      actsHtml += `
        <div style="background: var(--color-bg); border-radius: var(--radius-md); padding: var(--space-4); margin-top: var(--space-3); border: 1px solid var(--color-border-subtle); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span class="badge ${crowdClass}">${act.crowdLevel} crowd</span>
                ${act.isHiddenGem ? '<span class="badge badge-verified">🌿 Hidden Gem</span>' : ''}
                ${act.seniorFriendly ? '<span class="badge badge-local">♿ Senior-Friendly</span>' : ''}
              </div>
              <h4 style="margin: 0; font-size: 1.05rem;">${act.name}</h4>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px;">
                ${act.area} &bull; ${act.durationHours} hrs &bull; Walking: ${act.walkingLevel}
              </div>
            </div>
            <div style="text-align: right; white-space: nowrap;">
              <strong style="font-size: var(--text-sm); color: var(--color-text);">₹${act.cost}</strong>
            </div>
          </div>
          <p style="font-size: var(--text-sm); margin: 0; color: var(--color-text-secondary); line-height: 1.5;">
            ${act.shortDescription}
          </p>

          <!-- Swap button & Offbeat alternative suggestion -->
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-top: 6px; border-top: 1px dashed var(--color-border); padding-top: 6px;">
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
              ${act.offbeatAlternativeId ? '🌱 Less crowded alternative available' : '✨ Verified local recommendation'}
            </div>
            <button class="btn btn-sm btn-secondary btn-swap-act" data-day="${dayObj.day}" data-act-id="${act.id}" style="font-size: 12px; min-height: 32px; padding: 2px 10px;">
              🔄 Swap Activity
            </button>
          </div>
        </div>
      `;
    });

    dayCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 1.25rem;">${dayObj.title}</h3>
        <span style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted);">
          Day Cost: ₹${dayObj.estCost}
        </span>
      </div>
      <div style="font-size: var(--text-xs); color: var(--color-accent-hover); font-weight: 500; margin-bottom: 12px;">
        💡 ${dayObj.localTip}
      </div>
      <div class="day-activities-list">
        ${actsHtml}
      </div>
    `;

    timelineEl.appendChild(dayCard);
  });

  // Attach swap handlers
  document.querySelectorAll('.btn-swap-act').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dayNum = Number(btn.dataset.day);
      const actId = btn.dataset.actId;
      swapActivityInPlan(dayNum, actId);
    });
  });

  // Render Destination Feedback & Reviews (Phase 15)
  const destReviewsMount = document.getElementById('destination-reviews-mount');
  if (destReviewsMount && dest) {
    renderReviewsSection(destReviewsMount, 'destination', dest.id, `${dest.name} Destination`);
  }
}

function swapActivityInPlan(dayNum, actId) {
  if (!currentPlan) return;
  const destActivities = currentPlan.destination.activities || [];
  const currentAct = destActivities.find(a => a.id === actId);

  // Find candidate: preferably the paired alternative
  let replacement = null;
  if (currentAct?.offbeatAlternativeId) {
    replacement = destActivities.find(a => a.id === currentAct.offbeatAlternativeId);
  } else if (currentAct?.popularAlternativeId) {
    replacement = destActivities.find(a => a.id === currentAct.popularAlternativeId);
  }

  if (!replacement) {
    // Pick another activity not yet in this day
    const day = currentPlan.days.find(d => d.day === dayNum);
    const existingIds = day ? day.activities.map(a => a.id) : [];
    replacement = destActivities.find(a => !existingIds.includes(a.id));
  }

  if (replacement) {
    const day = currentPlan.days.find(d => d.day === dayNum);
    if (day) {
      const idx = day.activities.findIndex(a => a.id === actId);
      if (idx !== -1) {
        day.activities[idx] = replacement;
        // Recalculate day cost
        day.estCost = day.activities.reduce((s, a) => s + (a.cost || 0), 0) * (store.get().preferences.travellers || 1);
        // Recalculate total cost
        const actTotal = currentPlan.days.reduce((s, d) => s + d.estCost, 0);
        currentPlan.totalCost = currentPlan.breakdown.stay + currentPlan.breakdown.food + currentPlan.breakdown.transport + actTotal;
        store.setItinerary(currentPlan);

        // Re-render
        renderPlanDetails(currentPlan);
        if (yatraMapInstance) {
          yatraMapInstance.renderItinerary(currentPlan.days);
        }
      }
    }
  }
}

function initMap(plan) {
  const dest = plan.destination;
  const centerLat = dest?.coordinates?.lat || 32.2396;
  const centerLng = dest?.coordinates?.lng || 77.1887;

  yatraMapInstance = new YatraMap('itinerary-map');
  const ok = yatraMapInstance.init([centerLat, centerLng], 12);
  if (ok) {
    yatraMapInstance.renderItinerary(plan.days);

    let crowdOn = false;
    document.getElementById('btn-toggle-crowd')?.addEventListener('click', (e) => {
      crowdOn = !crowdOn;
      e.target.classList.toggle('active', crowdOn);
      yatraMapInstance.toggleCrowdLayer(dest.activities, crowdOn);
    });

    document.getElementById('btn-fit-map')?.addEventListener('click', () => {
      yatraMapInstance.fitAll();
    });
  }
}

function initChat(plan) {
  const form = document.getElementById('ask-chat-form');
  const input = document.getElementById('chat-user-input');
  const msgBox = document.getElementById('chat-messages');
  if (!form || !input || !msgBox) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Append user message
    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'background: #0d5c58; color: #fff; padding: 8px 12px; border-radius: 8px; align-self: flex-end; max-width: 85%;';
    userBubble.textContent = text;
    msgBox.appendChild(userBubble);
    input.value = '';
    msgBox.scrollTop = msgBox.scrollHeight;

    // Call LLM Chat Assistant
    const res = await llmPlanProvider.askChat(text, currentPlan);
    const botBubble = document.createElement('div');
    botBubble.style.cssText = 'background: #fff; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border); align-self: flex-start; max-width: 85%;';
    botBubble.textContent = res.reply || 'Preferences recorded. Itinerary updated.';
    msgBox.appendChild(botBubble);
    msgBox.scrollTop = msgBox.scrollHeight;

    if (res.updatedPlan) {
      currentPlan = res.updatedPlan;
      renderPlanDetails(currentPlan);
      if (yatraMapInstance) {
        yatraMapInstance.renderItinerary(currentPlan.days);
      }
    }
  });
}
