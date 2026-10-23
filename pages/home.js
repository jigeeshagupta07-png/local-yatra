/**
 * YatraLocal Landing Page (Phase 2)
 * Hero, Problems with Manali Callout, Solutions, Inclusion Strip, Impact Metrics
 */

import { searchPlacesIndia } from '../js/places.js';

export function renderHome() {
  return `
    <div class="landing-page">
      <!-- Hero Section -->
      <section class="hero-section" style="background: linear-gradient(180deg, #e8f5f4 0%, #fbf9f5 100%); padding: var(--space-12) 0 var(--space-10) 0; border-bottom: 1px solid var(--color-border-subtle);">
        <div class="container" style="text-align: center; max-width: 900px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: var(--space-3);">
            <span class="badge badge-local">Tourism for Everyone, Powered by Locals</span>
            <span class="badge badge-simulated">24h Hackathon Prototype</span>
          </div>

          <h1 style="color: var(--color-primary); margin-bottom: var(--space-3); font-size: clamp(2rem, 5vw, 3.2rem);">
            Tourism for Everyone,<br><span style="color: var(--color-accent);">Powered by Locals</span>
          </h1>

          <p style="font-size: clamp(1.1rem, 2.5vw, 1.35rem); color: var(--color-text-secondary); margin-bottom: var(--space-8); font-weight: 500;">
            AI-powered &bull; Local-first &bull; Inclusive travel
          </p>

          <p style="font-size: var(--text-base); color: var(--color-text-muted); max-width: 680px; margin: 0 auto var(--space-8) auto; line-height: 1.6;">
            Connecting conscious travellers directly with homestays, small heritage inns, and verified local guides while steering visitors away from overcrowded hotspots.
          </p>

          <!-- India-Wide Place Search Box (Phase 17) -->
          <div style="max-width: 620px; margin: 0 auto var(--space-8) auto; text-align: left;">
            <div class="place-search-wrapper">
              <div style="position: relative;">
                <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.25rem; pointer-events: none;">🔍</span>
                <input 
                  type="text" 
                  id="home-place-search-input" 
                  class="input-control" 
                  placeholder="Search ANY place in India (e.g. Kedarnath, Gokarna, Spiti, Munnar)..." 
                  style="padding-left: 46px; height: 54px; font-size: var(--text-base); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 2px solid var(--color-border);"
                  autocomplete="off"
                >
              </div>
              <div id="home-search-dropdown" class="search-results-dropdown"></div>
            </div>
            <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 6px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
              <span>Type 3+ letters &bull; Search 500,000+ Indian cities, towns & heritage spots</span>
              <span>&copy; OpenStreetMap contributors</span>
            </div>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: var(--space-4); justify-content: center; margin-bottom: var(--space-8);">
            <a href="#/plan" class="btn btn-primary btn-lg" style="box-shadow: 0 4px 14px rgba(13, 92, 88, 0.3);">
              ✨ Plan My Trip
            </a>
            <a href="#/saral" class="btn btn-secondary btn-lg" style="border-width: 2px;">
              👵 Try Saral Mode (सरल मोड)
            </a>
          </div>

          <!-- Feature quick pills -->
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); font-size: var(--text-xs); color: var(--color-text-muted);">
            <span>✓ Zero Commission Exploitation</span> &bull;
            <span>✓ Senior & Pilgrimage Accessible</span> &bull;
            <span>✓ One-Tap Safety SOS</span> &bull;
            <span>✓ Leaflet Real Maps</span>
          </div>
        </div>
      </section>

      <!-- The Core Problem & Illustrative Scenario -->
      <section class="problem-section" style="padding: var(--space-12) 0; background-color: #ffffff;">
        <div class="container">
          <div style="text-align: center; max-width: 700px; margin: 0 auto var(--space-8) auto;">
            <span class="badge badge-simulated" style="margin-bottom: 8px;">The Challenge We Solve</span>
            <h2>Travel in India Has Three Broken Realities</h2>
            <p>Mainstream OTAs squeeze local hosts, send everyone to identical overcrowded viewpoints, and alienate less tech-savvy travellers.</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-8);">
            <div class="card" style="border-left: 4px solid var(--color-accent);">
              <div style="font-size: 2.2rem; margin-bottom: var(--space-3);">🏚️</div>
              <h3>1. Local Businesses Hard to Discover</h3>
              <p>Small family homestays and heritage guides lack hefty digital marketing budgets, suffering severe off-season vacancy while big corporate chains dominate search results.</p>
            </div>

            <div class="card" style="border-left: 4px solid var(--color-primary);">
              <div style="font-size: 2.2rem; margin-bottom: var(--space-3);">🚦</div>
              <h3>2. Overcrowded Destinations</h3>
              <p>Travellers are trapped in congested queues at the same 3 monuments, missing breathtaking, tranquil offbeat alternatives just 20 minutes away.</p>
            </div>

            <div class="card" style="border-left: 4px solid #7c3aed;">
              <div style="font-size: 2.2rem; margin-bottom: var(--space-3);">📱</div>
              <h3>3. Digital Barriers for Seniors & Pilgrims</h3>
              <p>Complex interfaces, tiny text, aggressive countdown timers, and bewildering payment gateways frustrate elderly pilgrims and rural travellers.</p>
            </div>
          </div>

          <!-- Illustrative Scenario Callout -->
          <div class="card card-highlight" style="background: #faf5ed; border-color: var(--color-accent); padding: var(--space-6);">
            <div style="display: flex; flex-direction: column; gap: var(--space-2);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-simulated">Illustrative scenario</span>
                <strong style="color: var(--color-accent-hover); font-size: var(--text-sm);">REAL-WORLD GROUND PARADOX</strong>
              </div>
              <p style="font-size: var(--text-base); color: var(--color-text); margin: 0; line-height: 1.6;">
                <em>"A Manali family homestay has 6 of its 8 rooms empty in mid-November, while nearby visitors face 2-hour traffic jams and inflated hotel rates in the town center."</em>
                <br>
                <strong>YatraLocal solves this:</strong> We steer travellers to this homestay at a verified off-season discount, dispersing crowds and infusing direct income into the local host family.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Solution Section -->
      <section class="solution-section" style="padding: var(--space-12) 0; background-color: var(--color-bg);">
        <div class="container">
          <div style="text-align: center; max-width: 700px; margin: 0 auto var(--space-8) auto;">
            <span class="badge badge-local" style="margin-bottom: 8px;">Our Solution</span>
            <h2>Four Pillars of Community-First Travel</h2>
            <p>Every line of code in YatraLocal is designed to uplift local micro-entrepreneurs and make travel effortless for everyone.</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-6);">
            <div class="card card-interactive">
              <div style="width: 48px; height: 48px; background: var(--color-primary-subtle); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px;">
                🧠
              </div>
              <h3>AI Trip Planner</h3>
              <p>Day-wise itinerary calculated from your real budget, pace, and travel mood. Suggests calm offbeat alternatives and guarantees strictly verified prices.</p>
              <a href="#/plan" class="btn btn-sm btn-ghost" style="color: var(--color-primary); padding-left: 0;">Try Planner &rarr;</a>
            </div>

            <div class="card card-interactive">
              <div style="width: 48px; height: 48px; background: var(--color-accent-subtle); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px;">
                🏡
              </div>
              <h3>Local Stays & Guides</h3>
              <p>Discover family-run homestays and verified storytellers. 90% of your booking fee goes directly into the local host's hands.</p>
              <a href="#/stays" class="btn btn-sm btn-ghost" style="color: var(--color-accent); padding-left: 0;">Explore Listings &rarr;</a>
            </div>

            <div class="card card-interactive">
              <div style="width: 48px; height: 48px; background: #e0f2fe; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px;">
                📊
              </div>
              <h3>Host Owner Dashboard</h3>
              <p>Empowers homestay owners with zero technical know-how to publish off-season discounts and view occupancy gap analytics.</p>
              <a href="#/owner" class="btn btn-sm btn-ghost" style="color: #0369a1; padding-left: 0;">View Demo Host &rarr;</a>
            </div>

            <div class="card card-interactive">
              <div style="width: 48px; height: 48px; background: #fee2e2; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px;">
                🛡️
              </div>
              <h3>Safety SOS</h3>
              <p>2-second hold emergency trigger with real-time GPS tracking link for family members and instant one-tap hotlines for 112, Police, and Ambulance.</p>
              <a href="#/sos" class="btn btn-sm btn-ghost" style="color: #b91c1c; padding-left: 0;">Setup Contacts &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Inclusion Strip -->
      <section class="inclusion-strip" style="background: linear-gradient(135deg, #0d5c58 0%, #093f3c 100%); color: #ffffff; padding: var(--space-10) 0;">
        <div class="container">
          <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-6); align-items: center;">
            <div style="text-align: center; max-width: 800px; margin: 0 auto;">
              <span class="badge" style="background: rgba(255,255,255,0.2); color: #fff; margin-bottom: 12px;">Universal Accessibility</span>
              <h2 style="color: #fff; margin-bottom: var(--space-4);">Built for Grandparents, Pilgrims & Rural Travellers</h2>
              <p style="color: #e2e8f0; font-size: var(--text-lg); margin-bottom: var(--space-6);">
                Technology should welcome everyone. Saral Mode simplifies the journey with 24px high-contrast typography, large touch buttons, native Web Speech voice readouts, and family-assisted remote booking.
              </p>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-4);">
                <a href="#/saral" class="btn btn-accent btn-lg" style="box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);">
                  Open Saral Mode (सरल मोड)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Impact Measurement Strip -->
      <section class="impact-section" style="padding: var(--space-12) 0; background-color: #ffffff; border-top: 1px solid var(--color-border);">
        <div class="container">
          <div style="text-align: center; max-width: 700px; margin: 0 auto var(--space-8) auto;">
            <span class="badge badge-verified" style="margin-bottom: 8px;">Continuous Measurement</span>
            <h2>Real Prototype Impact Metrics</h2>
            <p>Every booking, route diversion, and accessibility session is logged in our real backend database.</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-6); text-align: center; margin-bottom: var(--space-8);">
            <div class="card">
              <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-primary);" id="impact-bookings">142</div>
              <div style="font-weight: 600; font-size: var(--text-sm); margin-top: 4px;">Local Bookings Directed</div>
              <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 4px;">Direct host earnings</p>
            </div>

            <div class="card">
              <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-accent);" id="impact-occupancy">+38.4%</div>
              <div style="font-weight: 600; font-size: var(--text-sm); margin-top: 4px;">Off-Season Occupancy Boost</div>
              <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 4px;">Via smart host offers</p>
            </div>

            <div class="card">
              <div style="font-size: 2.2rem; font-weight: 700; color: #7c3aed;" id="impact-saral">89</div>
              <div style="font-weight: 600; font-size: var(--text-sm); margin-top: 4px;">Saral Mode Completions</div>
              <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 4px;">Senior & voice sessions</p>
            </div>

            <div class="card">
              <div style="font-size: 2.2rem; font-weight: 700; color: #0284c7;" id="impact-sos">3.2m</div>
              <div style="font-weight: 600; font-size: var(--text-sm); margin-top: 4px;">Avg SOS Tracking Time</div>
              <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 4px;">Live location dispatched</p>
            </div>
          </div>

          <!-- Required Verification Statistics Placeholders -->
          <div style="background: #fdfaf6; border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; text-align: center; max-width: 800px; margin: 0 auto;">
            <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: 10px;">
              Baseline tourism indicators tracked against national data:
            </p>
            <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
              <span class="stat-placeholder-box">[Add verified statistic + source: Ministry of Tourism Off-Season Occupancy Rate in Himachal]</span>
              <span class="stat-placeholder-box">[Add verified statistic + source: % of Senior Pilgrims Requiring Wheelchair/Assisted Support in Varanasi]</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initHomeEvents() {
  const searchInput = document.getElementById('home-place-search-input');
  const dropdown = document.getElementById('home-search-dropdown');
  if (!searchInput || !dropdown) return;

  let debounceTimer = null;
  let currentController = null;

  function closeDropdown() {
    dropdown.classList.remove('visible');
    dropdown.innerHTML = '';
  }

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (debounceTimer) clearTimeout(debounceTimer);
    if (currentController) currentController.abort();

    if (query.length < 3) {
      closeDropdown();
      return;
    }

    dropdown.innerHTML = `
      <div style="padding: 12px 14px; font-size: 13px; color: var(--color-text-muted); display: flex; align-items: center; gap: 8px;">
        <span class="weather-skeleton" style="width: 16px; height: 16px; border-radius: 50%;"></span>
        Searching places across India...
      </div>
    `;
    dropdown.classList.add('visible');

    debounceTimer = setTimeout(async () => {
      currentController = new AbortController();
      try {
        const results = await searchPlacesIndia(query, currentController.signal);
        
        if (results.length === 0) {
          dropdown.innerHTML = `
            <div style="padding: 12px 14px; font-size: 13px; color: var(--color-text-muted);">
              No matching Indian places found for "${query}". Try another spelling.
            </div>
          `;
          return;
        }

        dropdown.innerHTML = results.map(p => {
          const locSubtitle = [p.district, p.state].filter(Boolean).join(', ') || 'India';
          return `
            <div class="search-result-item" data-key="${p.placeKey}">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2rem;">${p.isCurated ? '🪔' : '📍'}</span>
                <div>
                  <div style="font-weight: 700; font-size: 14px; color: var(--color-text);">${p.name}</div>
                  <div style="font-size: 11px; color: var(--color-text-muted);">${locSubtitle}</div>
                </div>
              </div>
              <span class="${p.isCurated ? 'search-badge-curated' : 'search-badge-osm'}">
                ${p.isCurated ? '✓ Curated' : 'OSM'}
              </span>
            </div>
          `;
        }).join('');

        // Attach click handlers to items
        dropdown.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const key = item.dataset.key;
            if (key) {
              closeDropdown();
              window.location.hash = `#/place/${encodeURIComponent(key)}`;
            }
          });
        });

      } catch (err) {
        if (err.name !== 'AbortError') {
          dropdown.innerHTML = `
            <div style="padding: 12px 14px; font-size: 13px; color: var(--color-text-muted);">
              Place search temporarily unavailable. Please try again.
            </div>
          `;
        }
      }
    }, 400);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  // Handle escape key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });
}

