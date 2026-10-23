/**
 * YatraLocal Trip Planner Form (Phases 2 & 16)
 * Destination picker, seasonal demand insights, month selector,
 * live weather advisories (on-season) & host offers (off-season),
 * budget slider, day stepper, mood chips, and accessibility needs.
 */

import { store } from '../js/store.js';
import { 
  getSeason, 
  getSeasonBadgeConfig, 
  render12MonthDemandBar, 
  getOffersForDestination, 
  MONTH_NAMES, 
  getCurrentMonth 
} from '../js/season.js';
import { getLiveWeather } from '../js/api.js';

let destinationsData = null;

async function getDestinationsList() {
  if (destinationsData) return destinationsData;
  try {
    const res = await fetch('/data/destinations.json');
    if (res.ok) {
      const data = await res.json();
      destinationsData = data.destinations || [];
    }
  } catch (e) {
    console.warn('[Plan] Could not load destinations.json:', e);
    destinationsData = [];
  }
  return destinationsData;
}

export function renderPlan() {
  const current = store.get().preferences;
  const currentMonth = current.travelMonth || getCurrentMonth();

  const monthOptions = MONTH_NAMES.map((name, idx) => {
    const mNum = idx + 1;
    const isSelected = mNum === currentMonth;
    const isToday = mNum === getCurrentMonth();
    return `<option value="${mNum}" ${isSelected ? 'selected' : ''}>${name}${isToday ? ' (Current Month)' : ''}</option>`;
  }).join('');

  return `
    <div class="container" style="padding-top: var(--space-8); padding-bottom: var(--space-12); max-width: 820px;">
      <div style="text-align: center; margin-bottom: var(--space-8);">
        <span class="badge badge-local" style="margin-bottom: 8px;">Step 1 &bull; Trip Preferences</span>
        <h1>Design Your Local Journey</h1>
        <p style="font-size: var(--text-base); color: var(--color-text-secondary); max-width: 600px; margin: 0 auto;">
          Tell us where you want to explore, your budget, and the month you wish to travel. We'll balance seasons, avoid crowds, and support local families.
        </p>
      </div>

      <div class="card" style="box-shadow: var(--shadow-md); border-radius: var(--radius-xl); padding: var(--space-8);">
        <form id="trip-plan-form" novalidate>
          
          <!-- Destination Field & Month Selector Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-4);">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="plan-destination">
                Choose Destination <span style="color: var(--color-danger);">*</span>
              </label>
              <select id="plan-destination" class="select-control" required>
                <option value="manali" ${current.destination === 'manali' ? 'selected' : ''}>
                  Manali (Himachal)
                </option>
                <option value="jaipur" ${current.destination === 'jaipur' ? 'selected' : ''}>
                  Jaipur (Rajasthan)
                </option>
                <option value="varanasi" ${current.destination === 'varanasi' ? 'selected' : ''}>
                  Varanasi (Uttar Pradesh)
                </option>
                <option value="rishikesh" ${current.destination === 'rishikesh' ? 'selected' : ''}>
                  Rishikesh (Uttarakhand)
                </option>
                <option value="hampi" ${current.destination === 'hampi' ? 'selected' : ''}>
                  Hampi (Karnataka)
                </option>
                <option value="munnar" ${current.destination === 'munnar' ? 'selected' : ''}>
                  Munnar (Kerala)
                </option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="plan-month">
                Travel Month <span style="font-size: 11px; font-weight: normal; color: var(--color-text-muted);">(Best time to avoid crowds)</span>
              </label>
              <select id="plan-month" class="select-control">
                ${monthOptions}
              </select>
            </div>
          </div>

          <!-- Seasonal Demand Badge & Disclaimer Mount -->
          <div id="season-badge-mount" style="margin-bottom: var(--space-3);"></div>

          <!-- 12-Month Demand Bar Mount -->
          <div id="season-bar-mount" style="margin-bottom: var(--space-5);"></div>

          <!-- Reactive Seasonal Detail Card (On-season live advisory vs Off-season host discounts) -->
          <div id="season-card-mount" style="margin-bottom: var(--space-6);"></div>

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
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-5);">
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

export async function initPlanEvents() {
  const form = document.getElementById('trip-plan-form');
  if (!form) return;

  const destSelect = document.getElementById('plan-destination');
  const monthSelect = document.getElementById('plan-month');
  const badgeMount = document.getElementById('season-badge-mount');
  const barMount = document.getElementById('season-bar-mount');
  const cardMount = document.getElementById('season-card-mount');

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

  // Load destination list for coordinates
  const destinations = await getDestinationsList();

  /**
   * Updates seasonal demand views (Badge, 12-Month Bar, Card)
   */
  async function updateSeasonality() {
    const destId = destSelect.value;
    const selectedMonth = Number(monthSelect.value) || getCurrentMonth();
    const destMeta = destinations.find(d => d.id === destId);
    const destLat = destMeta?.coordinates?.lat || destMeta?.lat || 32.2396;
    const destLng = destMeta?.coordinates?.lng || destMeta?.lng || 77.1887;

    const season = await getSeason(destId, selectedMonth);
    const badgeCfg = getSeasonBadgeConfig(season.level);

    // 1. Render Season Badge & Honest Estimate Note
    if (badgeMount) {
      badgeMount.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge ${badgeCfg.tagClass}" style="font-size: 13px; padding: 4px 12px;">
              ${badgeCfg.icon} ${badgeCfg.label} (${season.monthName})
            </span>
            <span style="font-size: 11px; color: var(--color-text-muted); background: var(--color-surface-subtle); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--color-border);">
              Estimate
            </span>
          </div>
          <span style="font-size: 11px; color: var(--color-text-muted); font-style: italic;">
            ${season.disclaimer}
          </span>
        </div>
      `;
    }

    // 2. Render 12-Month Demand Bar
    if (barMount) {
      barMount.innerHTML = render12MonthDemandBar(season.allMonths, selectedMonth);

      // Attach click events to bars
      barMount.querySelectorAll('.season-month-col').forEach(col => {
        col.addEventListener('click', () => {
          const m = Number(col.dataset.month);
          if (m) {
            monthSelect.value = m;
            updateSeasonality();
          }
        });
        col.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const m = Number(col.dataset.month);
            if (m) {
              monthSelect.value = m;
              updateSeasonality();
            }
          }
        });
      });
    }

    // 3. Render Detail Card
    if (!cardMount) return;

    if (season.isOffSeason) {
      // -------------------------------------------------------------
      // OFF-SEASON: No weather API call. Highlight lower crowds & host discounts.
      // -------------------------------------------------------------
      const offersData = await getOffersForDestination(destId);
      const hostOffers = [
        ...offersData.dynamicOffers,
        ...offersData.staysWithDiscounts.map(s => ({
          stayName: s.name,
          discountPercent: s.offPeakDiscountPercent,
          message: s.shortStory,
          isSample: true
        }))
      ];

      const offersHtml = hostOffers.slice(0, 3).map(o => `
        <div style="background: #fff; border: 1px solid #ceead6; border-radius: var(--radius-sm); padding: 10px 14px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <div>
            <div style="font-weight: 700; font-size: var(--text-sm); color: #0f5132;">
              🏡 ${o.stayName || 'Local Family Homestay'}
            </div>
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 2px;">
              ${o.message || 'Quiet off-season hospitality & home-cooked meals.'}
            </div>
          </div>
          <div style="text-align: right; white-space: nowrap;">
            <span class="badge" style="background: #16a34a; color: #fff; font-weight: 700; font-size: 11px;">
              ${o.discountPercent || 20}% OFF
            </span>
            <div style="font-size: 9px; color: var(--color-text-muted); margin-top: 2px;">Demo / Sample Offer</div>
          </div>
        </div>
      `).join('');

      cardMount.innerHTML = `
        <div class="season-card-off">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 1.2rem;">🌿</span>
                <strong style="color: #137333; font-size: 1.05rem;">Quiet Season: Great Time to Visit</strong>
              </div>
              <p style="margin: 0; font-size: var(--text-sm); color: var(--color-text);">
                <strong>Why visit in ${season.monthName}:</strong> ${season.reason}. You'll experience peaceful trails, relaxed hosts, and zero highway gridlock.
              </p>
            </div>
            <a href="#/stays" class="btn btn-sm btn-primary" style="background: #16a34a; border-color: #16a34a; white-space: nowrap;">
              Book in off-season &rarr;
            </a>
          </div>

          ${offersHtml ? `
            <div style="margin-top: 12px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #137333;">
                🎁 Active Local Host Offers (${season.monthName}) &bull; Demo
              </span>
              ${offersHtml}
            </div>
          ` : ''}
        </div>
      `;

    } else if (season.isOnSeason) {
      // -------------------------------------------------------------
      // ON-SEASON: Show high-demand warning, smart tips, and alternatives.
      // Call Open-Meteo only for current/near-future months!
      // -------------------------------------------------------------
      const isNearFuture = selectedMonth === getCurrentMonth();

      // Skeleton placeholder to prevent layout shift while weather loads
      cardMount.innerHTML = `
        <div class="season-card-on">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 1.3rem;">⚠️</span>
            <strong style="color: #c5221f; font-size: 1.05rem;">Plan carefully: high demand period</strong>
          </div>
          <p style="margin: 0 0 12px 0; font-size: var(--text-sm); color: var(--color-text);">
            <strong>Peak Season Context (${season.monthName}):</strong> ${season.reason}. Higher footfalls expected across popular spots.
          </p>

          <!-- Tips Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-bottom: 12px;">
            <div style="background: #fff; border: 1px solid #fad2cf; border-radius: 6px; padding: 8px 10px; font-size: 12px;">
              📌 <strong>Book Early:</strong> Homestays sell out 2-3 weeks in advance.
            </div>
            <div style="background: #fff; border: 1px solid #fad2cf; border-radius: 6px; padding: 8px 10px; font-size: 12px;">
              ⏰ <strong>Start Early:</strong> Begin activities before 8:30 AM to beat queues.
            </div>
            <div style="background: #fff; border: 1px solid #fad2cf; border-radius: 6px; padding: 8px 10px; font-size: 12px;">
              🚶 <strong>Avoid Peak Hours:</strong> 11 AM – 4 PM has heaviest crowd density.
            </div>
          </div>

          <!-- Weather Mount (Skeleton first) -->
          <div id="weather-section-mount">
            ${isNearFuture ? `
              <div class="weather-skeleton" style="height: 68px; width: 100%;"></div>
            ` : `
              <div style="font-size: 12px; color: var(--color-text-muted); padding: 8px 0;">
                ℹ️ Live 7-day weather forecast is available for current travel dates.
              </div>
            `}
          </div>

          <!-- Less Crowded Alternatives -->
          <div id="alternatives-section-mount" style="margin-top: 14px;"></div>
        </div>
      `;

      // Render Alternatives
      const altMount = document.getElementById('alternatives-section-mount');
      if (altMount && season.alternatives.length > 0) {
        const altCards = season.alternatives.map(altId => {
          const altMeta = destinations.find(d => d.id === altId);
          if (!altMeta) return '';
          return `
            <div style="background: #fff; border: 1px solid #e2ddd5; border-radius: var(--radius-sm); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
              <div>
                <strong style="font-size: var(--text-sm); color: var(--color-primary);">${altMeta.name}</strong>
                <div style="font-size: 11px; color: var(--color-text-muted);">${altMeta.tagline || altMeta.state}</div>
              </div>
              <button type="button" class="btn btn-sm btn-secondary btn-switch-dest" data-alt-dest="${altId}" style="white-space: nowrap;">
                Switch to ${altMeta.name}
              </button>
            </div>
          `;
        }).filter(Boolean).join('');

        if (altCards) {
          altMount.innerHTML = `
            <div style="border-top: 1px dashed #fad2cf; padding-top: 12px;">
              <span style="font-size: 12px; font-weight: 700; color: var(--color-text-main); display: block; margin-bottom: 6px;">
                🌿 Try a less crowded alternative nearby:
              </span>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${altCards}
              </div>
            </div>
          `;

          // Handle switch destination buttons
          altMount.querySelectorAll('.btn-switch-dest').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetDest = btn.dataset.altDest;
              if (targetDest && destSelect) {
                destSelect.value = targetDest;
                updateSeasonality();
              }
            });
          });
        }
      }

      // Fetch live weather if near-future
      if (isNearFuture) {
        const weatherMount = document.getElementById('weather-section-mount');
        try {
          const weather = await getLiveWeather(destLat, destLng, destId);
          if (weatherMount) {
            if (weather.available) {
              const warningHtml = weather.warnings.map(w => `
                <div style="font-size: 12px; color: ${w.level === 'warning' ? '#b91c1c' : '#0d5c58'}; font-weight: 600; margin-top: 4px;">
                  ${w.icon} ${w.text}
                </div>
              `).join('');

              weatherMount.innerHTML = `
                <div style="background: #fff; border: 1px solid #fad2cf; border-radius: var(--radius-sm); padding: 10px 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 1.6rem;">${weather.today.icon}</span>
                      <div>
                        <strong style="font-size: var(--text-sm);">${weather.today.condition}</strong>
                        <div style="font-size: 11px; color: var(--color-text-muted);">
                          Temp: ${weather.today.tempMin}°C – ${weather.today.tempMax}°C &bull; Rain chance: ${weather.today.precipProb}%
                        </div>
                      </div>
                    </div>
                    <span style="font-size: 10px; color: var(--color-text-muted);">
                      ${weather.attribution} ${weather.fromCache ? '(Cached)' : ''}
                    </span>
                  </div>
                  ${warningHtml}
                </div>
              `;
            } else {
              weatherMount.innerHTML = `
                <div style="background: #fff; border: 1px solid #e2ddd5; border-radius: var(--radius-sm); padding: 8px 12px; font-size: 12px; color: var(--color-text-muted);">
                  ⛅ ${weather.error}. ${weather.tip}
                  <div style="font-size: 10px; margin-top: 2px;">${weather.attribution}</div>
                </div>
              `;
            }
          }
        } catch (weatherErr) {
          if (weatherMount) {
            weatherMount.innerHTML = `
              <div style="background: #fff; border: 1px solid #e2ddd5; border-radius: var(--radius-sm); padding: 8px 12px; font-size: 12px; color: var(--color-text-muted);">
                ⛅ Live weather not available right now. Tip: Check local hill station/monument advisory boards on arrival.
              </div>
            `;
          }
        }
      }

    } else {
      // -------------------------------------------------------------
      // SHOULDER SEASON: Balanced footfalls
      // -------------------------------------------------------------
      cardMount.innerHTML = `
        <div class="season-card-shoulder">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 1.2rem;">⛅</span>
            <strong style="color: #b06000; font-size: 1.05rem;">Shoulder Season: Moderate Footfall</strong>
          </div>
          <p style="margin: 0; font-size: var(--text-sm); color: var(--color-text);">
            <strong>Season Insight (${season.monthName}):</strong> ${season.reason}. Moderate traveller volume; good balance of pleasant conditions and availability.
          </p>
        </div>
      `;
    }
  }

  // Trigger initial seasonality display
  updateSeasonality();

  // Listeners for destination & month changes
  destSelect.addEventListener('change', updateSeasonality);
  monthSelect.addEventListener('change', updateSeasonality);

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
      travelMonth: Number(monthSelect.value) || getCurrentMonth(),
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
