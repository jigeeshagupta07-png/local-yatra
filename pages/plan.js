/**
 * YatraLocal Trip Planner Form (Phase 2)
 * Destination picker with crowd badges, budget slider & sync input,
 * day stepper, multi-select mood chips (max 3), accessibility needs, and friendly inline validation.
 */

import { store } from '../js/store.js';

export function renderPlan() {
  const current = store.get().preferences;

  return `
    <div class="container" style="padding-top: var(--space-8); padding-bottom: var(--space-12); max-width: 800px;">
      <div style="text-align: center; margin-bottom: var(--space-8);">
        <span class="badge badge-local" style="margin-bottom: 8px;">Step 1 &bull; Trip Preferences</span>
        <h1>Design Your Local Journey</h1>
        <p style="font-size: var(--text-base); color: var(--color-text-secondary); max-width: 580px; margin: 0 auto;">
          Tell us where you want to explore, your real budget, and how you love to travel. We'll craft a relaxed, crowd-free itinerary.
        </p>
      </div>

      <div class="card" style="box-shadow: var(--shadow-md); border-radius: var(--radius-xl); padding: var(--space-8);">
        <form id="trip-plan-form" novalidate>
          <!-- Destination Field -->
          <div class="form-group">
            <label class="form-label" for="plan-destination">
              Choose Destination <span style="color: var(--color-danger);">*</span>
            </label>
            <select id="plan-destination" class="select-control" required>
              <option value="manali" ${current.destination === 'manali' ? 'selected' : ''}>
                Manali (Himachal) — 🔴 High Tourist Volume
              </option>
              <option value="jaipur" ${current.destination === 'jaipur' ? 'selected' : ''}>
                Jaipur (Rajasthan) — 🔴 High Heritage Volume
              </option>
              <option value="varanasi" ${current.destination === 'varanasi' ? 'selected' : ''}>
                Varanasi (Uttar Pradesh) — 🔴 High Pilgrim Volume
              </option>
              <option value="rishikesh" ${current.destination === 'rishikesh' ? 'selected' : ''}>
                Rishikesh (Uttarakhand) — 🟡 Medium Adventure Volume
              </option>
              <option value="hampi" ${current.destination === 'hampi' ? 'selected' : ''}>
                Hampi (Karnataka) — 🟢 Low Crowd / Historic Ruin Gems
              </option>
              <option value="munnar" ${current.destination === 'munnar' ? 'selected' : ''}>
                Munnar (Kerala) — 🟡 Medium Tea Valley Volume
              </option>
            </select>
            <div class="form-hint">Each location includes offbeat crowd-avoidance alternatives.</div>
          </div>

          <!-- Budget Controls (Slider + Number input synchronized) -->
          <div class="form-group">
            <div class="range-header">
              <label class="form-label" for="plan-budget-input" style="margin-bottom: 0;">
                Total Trip Budget (₹ INR) <span style="color: var(--color-danger);">*</span>
              </label>
              <div class="range-val-badge">₹<span id="budget-display">${Number(current.budget).toLocaleString('en-IN')}</span></div>
            </div>
            <div style="display: flex; gap: var(--space-4); align-items: center; margin-top: var(--space-2);">
              <input 
                type="range" 
                id="plan-budget-slider" 
                class="range-input" 
                min="3000" 
                max="100000" 
                step="500" 
                value="${current.budget}"
              >
              <input 
                type="number" 
                id="plan-budget-input" 
                class="input-control" 
                style="max-width: 140px; font-weight: 600;" 
                min="3000" 
                max="100000" 
                value="${current.budget}"
              >
            </div>
            <div id="budget-error" class="form-error">Please enter a budget between ₹3,000 and ₹1,00,000.</div>
          </div>

          <!-- Trip Length (Stepper 1-10 days) & Travellers count -->
          <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-6); margin-bottom: var(--space-5);">
            <div style="display: flex; flex-direction: column;">
              <label class="form-label">Trip Length (Days)</label>
              <div class="stepper-box">
                <button type="button" class="stepper-btn" id="btn-days-minus" aria-label="Decrease days">&minus;</button>
                <span class="stepper-value" id="days-val">${current.days}</span>
                <button type="button" class="stepper-btn" id="btn-days-plus" aria-label="Increase days">&plus;</button>
              </div>
              <div class="form-hint">Select between 1 to 10 days.</div>
            </div>

            <div style="display: flex; flex-direction: column;">
              <label class="form-label">Number of Travellers</label>
              <div class="stepper-box">
                <button type="button" class="stepper-btn" id="btn-travellers-minus" aria-label="Decrease travellers">&minus;</button>
                <span class="stepper-value" id="travellers-val">${current.travellers}</span>
                <button type="button" class="stepper-btn" id="btn-travellers-plus" aria-label="Increase travellers">&plus;</button>
              </div>
            </div>
          </div>

          <!-- Travel Mood Chips (Multi-select, Max 3) -->
          <div class="form-group">
            <label class="form-label">
              Travel Mood <span style="font-weight: normal; color: var(--color-text-muted);">(Pick up to 3)</span>
            </label>
            <div class="chip-grid" id="mood-chip-group">
              ${[
                { id: 'Relaxed', icon: '🌿', label: 'Relaxed & Unhurried' },
                { id: 'Adventure', icon: '🧗', label: 'Adventure & Trails' },
                { id: 'Spiritual/Pilgrimage', icon: '🪔', label: 'Spiritual / Pilgrimage' },
                { id: 'Cultural', icon: '🏛️', label: 'Cultural & Heritage' },
                { id: 'Nature', icon: '🌲', label: 'Nature & Scenery' },
                { id: 'Family', icon: '👨‍👩‍👧‍👦', label: 'Family Friendly' },
                { id: 'Foodie', icon: '🍲', label: 'Local Food & Street Eateries' }
              ].map(m => {
                const isSelected = current.moods.includes(m.id);
                return `
                  <button type="button" class="chip-btn ${isSelected ? 'selected' : ''}" data-mood="${m.id}">
                    <span>${m.icon}</span> ${m.label}
                  </button>
                `;
              }).join('')}
            </div>
            <div id="mood-error" class="form-error">You can pick at most 3 moods for a balanced itinerary.</div>
          </div>

          <!-- Accessibility Needs Checkboxes -->
          <div class="form-group" style="background-color: var(--color-surface-subtle); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <label class="form-label" style="margin-bottom: var(--space-2);">
              ♿ Accessibility & Comfort Preferences
            </label>
            <div style="display: flex; flex-direction: column; gap: var(--space-2);">
              <label class="checkbox-label">
                <input type="checkbox" id="check-senior" ${current.accessibility.seniorFriendly ? 'checked' : ''} style="width: 18px; height: 18px;">
                <div>
                  <strong>Senior-friendly pace</strong>
                  <div style="font-size: var(--text-xs); color: var(--color-text-muted);">Limits walking to max 1 calm activity per day; zero steep stairs.</div>
                </div>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" id="check-walking" ${current.accessibility.minimalWalking ? 'checked' : ''} style="width: 18px; height: 18px;">
                <div>
                  <strong>Minimal walking / E-rickshaw reachable</strong>
                  <div style="font-size: var(--text-xs); color: var(--color-text-muted);">Selects sites with direct vehicle or flat road drop-offs.</div>
                </div>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" id="check-wheelchair" ${current.accessibility.wheelchairAccess ? 'checked' : ''} style="width: 18px; height: 18px;">
                <div>
                  <strong>Wheelchair access</strong>
                  <div style="font-size: var(--text-xs); color: var(--color-text-muted);">Filters for ramp-equipped monuments and paved paths.</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Submit Button -->
          <div style="margin-top: var(--space-8);">
            <button type="submit" id="btn-generate-plan" class="btn btn-primary btn-lg" style="width: 100%;">
              ⚡ Generate Smart Itinerary
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function initPlanEvents() {
  const form = document.getElementById('trip-plan-form');
  if (!form) return;

  const destSelect = document.getElementById('plan-destination');
  const budgetSlider = document.getElementById('plan-budget-slider');
  const budgetInput = document.getElementById('plan-budget-input');
  const budgetDisplay = document.getElementById('budget-display');
  const budgetError = document.getElementById('budget-error');

  const daysVal = document.getElementById('days-val');
  const btnDaysMinus = document.getElementById('btn-days-minus');
  const btnDaysPlus = document.getElementById('btn-days-plus');

  const travellersVal = document.getElementById('travellers-val');
  const btnTravellersMinus = document.getElementById('btn-travellers-minus');
  const btnTravellersPlus = document.getElementById('btn-travellers-plus');

  const moodButtons = document.querySelectorAll('.chip-btn[data-mood]');
  const moodError = document.getElementById('mood-error');

  const checkSenior = document.getElementById('check-senior');
  const checkWalking = document.getElementById('check-walking');
  const checkWheelchair = document.getElementById('check-wheelchair');

  // Budget Sync
  budgetSlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    budgetInput.value = val;
    budgetDisplay.textContent = val.toLocaleString('en-IN');
    budgetError.classList.remove('visible');
  });

  budgetInput.addEventListener('input', (e) => {
    let val = Number(e.target.value);
    if (val >= 3000 && val <= 100000) {
      budgetSlider.value = val;
      budgetDisplay.textContent = val.toLocaleString('en-IN');
      budgetError.classList.remove('visible');
    }
  });

  // Stepper days
  let days = Number(daysVal.textContent) || 3;
  btnDaysMinus.addEventListener('click', () => {
    if (days > 1) {
      days--;
      daysVal.textContent = days;
    }
  });
  btnDaysPlus.addEventListener('click', () => {
    if (days < 10) {
      days++;
      daysVal.textContent = days;
    }
  });

  // Stepper travellers
  let travellers = Number(travellersVal.textContent) || 2;
  btnTravellersMinus.addEventListener('click', () => {
    if (travellers > 1) {
      travellers--;
      travellersVal.textContent = travellers;
    }
  });
  btnTravellersPlus.addEventListener('click', () => {
    if (travellers < 12) {
      travellers++;
      travellersVal.textContent = travellers;
    }
  });

  // Mood chips multi-select (max 3)
  const selectedMoods = new Set(store.get().preferences.moods || []);
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      if (selectedMoods.has(mood)) {
        selectedMoods.delete(mood);
        btn.classList.remove('selected');
        moodError.classList.remove('visible');
      } else {
        if (selectedMoods.size >= 3) {
          moodError.classList.add('visible');
          return;
        }
        selectedMoods.add(mood);
        btn.classList.add('selected');
        moodError.classList.remove('visible');
      }
    });
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const budget = Number(budgetInput.value);
    if (!budget || budget < 3000 || budget > 100000) {
      budgetError.classList.add('visible');
      budgetInput.focus();
      return;
    }

    const preferences = {
      destination: destSelect.value,
      budget,
      days,
      travellers,
      moods: Array.from(selectedMoods),
      accessibility: {
        seniorFriendly: checkSenior.checked,
        minimalWalking: checkWalking.checked,
        wheelchairAccess: checkWheelchair.checked
      }
    };

    store.setPreferences(preferences);
    // Route to itinerary
    window.location.hash = '#/itinerary';
  });
}
