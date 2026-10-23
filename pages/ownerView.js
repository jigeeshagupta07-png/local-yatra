/**
 * YatraLocal Hotel & Homestay Owner Dashboard (Phase 7)
 * Demo login (Manali Homestay: 8 rooms, 6 empty), KPI row, plain SVG analytics charts,
 * off-season offer builder with live preview synced to backend API, and bookings audit table.
 */

import { store } from '../js/store.js';
import { getReviewsForTarget, calculateRatingSummary } from '../js/reviews.js';
import { 
  getSeason, 
  getSeasonBadgeConfig, 
  getCurrentMonth, 
  MONTH_NAMES, 
  saveHostOffer, 
  getHostOffers 
} from '../js/season.js';

let isOwnerLoggedIn = true;
let hostBookings = [];
let hostOffers = [];

export function renderOwner() {
  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 80px;">
      <!-- Header & Demo Login Switcher -->
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: var(--space-6);">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span class="badge badge-local">Micro-Entrepreneur Suite</span>
            <span class="badge badge-simulated">Demo Host Account</span>
          </div>
          <h1 style="margin: 0; font-size: clamp(1.8rem, 4vw, 2.3rem);">
            Host Dashboard &bull; Deodar Woods Homestay
          </h1>
          <p style="margin: 4px 0 0 0; color: var(--color-text-secondary); font-size: var(--text-sm);">
            Managed by Thakur Uncle & Family &bull; Old Manali Village (8 Rooms Total)
          </p>
        </div>

        <div style="display: flex; gap: 8px;">
          <button id="btn-toggle-owner-auth" class="btn btn-secondary btn-sm">
            ${isOwnerLoggedIn ? '✓ Logged In as Owner' : 'Login as Demo Owner'}
          </button>
        </div>
      </div>

      <!-- KPI Row -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-8);">
        <div class="card" style="border-left: 4px solid var(--color-danger);">
          <div style="font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Current Occupancy</div>
          <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-danger); margin: 6px 0;" id="kpi-occupancy">25%</div>
          <div style="font-size: var(--text-xs); color: #b91c1c;">
            <strong>6 of 8 rooms empty</strong> (Off-Season Gap)
          </div>
        </div>

        <div class="card" style="border-left: 4px solid var(--color-primary);">
          <div style="font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Confirmed Bookings</div>
          <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-primary); margin: 6px 0;" id="kpi-bookings-count">0</div>
          <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
            Via YatraLocal Community
          </div>
        </div>

        <div class="card" style="border-left: 4px solid var(--color-accent);">
          <div style="font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Estimated Monthly Payout</div>
          <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-accent); margin: 6px 0;" id="kpi-revenue">₹28,400</div>
          <div style="font-size: var(--text-xs); color: var(--color-success); font-weight: 600;">
            ✓ 90% direct payout (No hidden cuts)
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #7c3aed;">
          <div style="font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Off-Season Recovery</div>
          <div style="font-size: 2.2rem; font-weight: 700; color: #7c3aed; margin: 6px 0;">+4 Rooms</div>
          <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
            Targeted for Nov &bull; Feb
          </div>
        </div>
      </div>

      <!-- Season Outlook Card Mount (Phase 16) -->
      <div id="owner-season-outlook-mount" style="margin-bottom: var(--space-8);"></div>

      <!-- Demand Insights: Pure SVG Charts (No external libs) -->
      <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-6); margin-bottom: var(--space-8);">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h3 style="margin: 0; font-size: 1.15rem;">Manali Seasonal Demand vs Room Occupancy Gap</h3>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                Monthly search volume (Orange) vs Empty Room Count (Teal). <span class="badge badge-simulated">Sample data</span>
              </div>
            </div>
            <div style="display: flex; gap: 12px; font-size: 12px;">
              <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #d97706; display: inline-block; border-radius: 2px;"></span> Demand</span>
              <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #0d5c58; display: inline-block; border-radius: 2px;"></span> Host Rooms Filled</span>
            </div>
          </div>

          <!-- Pure SVG Bar Chart -->
          <div style="overflow-x: auto;">
            <svg viewBox="0 0 700 220" style="width: 100%; min-width: 550px; height: auto;">
              <!-- Axis lines -->
              <line x1="50" y1="180" x2="680" y2="180" stroke="#e2ddd5" stroke-width="2"/>
              <line x1="50" y1="20" x2="50" y2="180" stroke="#e2ddd5" stroke-width="2"/>

              <!-- Grid reference lines -->
              <line x1="50" y1="140" x2="680" y2="140" stroke="#f1eee7" stroke-dasharray="4"/>
              <line x1="50" y1="100" x2="680" y2="100" stroke="#f1eee7" stroke-dasharray="4"/>
              <line x1="50" y1="60" x2="680" y2="60" stroke="#f1eee7" stroke-dasharray="4"/>

              <!-- Months & Bars: Jun, Jul, Aug, Sep, Oct, Nov (Current), Dec, Jan -->
              ${[
                { month: 'Jun (Peak)', demand: 160, filled: 150 },
                { month: 'Jul', demand: 130, filled: 120 },
                { month: 'Aug (Monsoon)', demand: 50, filled: 40 },
                { month: 'Sep', demand: 90, filled: 70 },
                { month: 'Oct', demand: 110, filled: 80 },
                { month: 'Nov (Off-Peak)', demand: 45, filled: 35, highlight: true },
                { month: 'Dec (Snow)', demand: 140, filled: 110 },
                { month: 'Jan', demand: 120, filled: 90 }
              ].map((item, idx) => {
                const x = 75 + idx * 75;
                const dH = item.demand;
                const fH = item.filled;
                return `
                  <!-- Demand bar -->
                  <rect x="${x}" y="${180 - dH}" width="20" height="${dH}" fill="${item.highlight ? '#d97706' : '#f59e0b'}" rx="3"/>
                  <!-- Filled bar -->
                  <rect x="${x + 24}" y="${180 - fH}" width="20" height="${fH}" fill="#0d5c58" rx="3"/>
                  <!-- Label -->
                  <text x="${x + 22}" y="200" font-size="11" fill="#64748b" text-anchor="middle" font-family="sans-serif">${item.month}</text>
                `;
              }).join('')}
            </svg>
          </div>
        </div>
      </div>

      <!-- AI-Style Demand Suggestions Panel -->
      <div class="card" style="background: #f0fdf4; border: 1.5px solid #bbf7d0; margin-bottom: var(--space-8); padding: var(--space-5);">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <div style="font-size: 1.6rem; line-height: 1;">💡</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: #166534; font-size: var(--text-sm);">AI REVENUE ADVISOR (SIMULATED INSIGHT):</strong>
              <span class="badge badge-simulated">Rule-based</span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: var(--text-sm); color: #1f2937;">
              <em>"Notice the November drop? Offering a <strong>20% to 25% weekday discount</strong> for stays of 2+ nights will attract remote workers and senior pilgrims seeking peace, filling approximately 4 of your 6 empty rooms and generating an additional ₹18,000 this month."</em>
            </p>
          </div>
        </div>
      </div>

      <!-- Two Column: Off-Season Offer Builder + Live Preview -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-8);">
        <!-- Builder Form -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
            <h3 style="margin: 0;">🏷️ Publish Off-Season Offer</h3>
            <span class="badge badge-simulated">Demo Offer</span>
          </div>
          <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-4);">
            Offers appear on the traveller Stays page with an off-season ribbon during low-demand months.
          </p>

          <form id="offer-builder-form">
            <div class="form-group">
              <label class="form-label" for="offer-title">Offer Title / Discount Text</label>
              <input type="text" id="offer-title" class="input-control" value="20% off weekdays" placeholder="e.g., 20% off weekdays" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="offer-discount">Discount Percentage (%)</label>
              <input type="number" id="offer-discount" class="input-control" value="25" min="5" max="50" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="offer-rooms">Rooms to Offer at this Rate</label>
              <input type="number" id="offer-rooms" class="input-control" value="4" min="1" max="6" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label" for="offer-valid-from">Valid From</label>
                <input type="date" id="offer-valid-from" class="input-control" value="2026-11-01" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="offer-valid-to">Valid To</label>
                <input type="date" id="offer-valid-to" class="input-control" value="2026-11-30" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Applicable Off-Season Months</label>
              <div id="offer-months-selection" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                <label class="checkbox-label" style="font-size: 12px;"><input type="checkbox" name="offer-month" value="11" checked> Nov</label>
                <label class="checkbox-label" style="font-size: 12px;"><input type="checkbox" name="offer-month" value="3" checked> Mar</label>
                <label class="checkbox-label" style="font-size: 12px;"><input type="checkbox" name="offer-month" value="7"> Jul</label>
                <label class="checkbox-label" style="font-size: 12px;"><input type="checkbox" name="offer-month" value="8"> Aug</label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="offer-msg">Custom Traveller Message</label>
              <input type="text" id="offer-msg" class="input-control" value="Warm winter discount for peaceful stays in Old Manali!" required>
            </div>

            <button type="submit" id="btn-publish-offer" class="btn btn-primary" style="width: 100%;">
              🚀 Publish Offer to Traveller App
            </button>
          </form>
        </div>

        <!-- Live Preview of Offer Card -->
        <div class="card" style="background: #faf8f5;">
          <h3 style="margin-bottom: var(--space-2);">Live Traveller Preview</h3>
          <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-4);">
            How travellers see your homestay in real-time on the discovery page:
          </p>

          <div class="card" style="position: relative; overflow: hidden; background: #fff; box-shadow: var(--shadow-md);">
            <div id="preview-ribbon" style="background: var(--color-accent); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-sm); position: absolute; top: 12px; right: 12px; z-index: 2;">
              🏷️ 25% OFF-SEASON
            </div>

            <div style="height: 100px; background: linear-gradient(135deg, #0d5c58 0%, #167a75 100%); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin-bottom: 12px; color: #fff;">
              🏡
            </div>

            <div style="display: flex; gap: 4px; margin-bottom: 6px;">
              <span class="badge badge-verified">✓ Verified Local</span>
              <span class="badge badge-family">Supports a local family</span>
            </div>

            <h4 style="margin: 0 0 4px 0;">Deodar Woods Family Homestay</h4>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 6px;">Old Manali Village &bull; ₹1,088/night (after discount)</div>
            <p id="preview-msg" style="font-size: var(--text-xs); color: var(--color-text-secondary); margin-bottom: 10px;">
              "Warm winter discount for peaceful stays in Old Manali!"
            </p>

            <div style="font-size: 11px; color: #b45309; background: #fffbeb; padding: 4px 8px; border-radius: 6px; border: 1px solid #fde68a;">
              <span id="preview-rooms">4</span> rooms offered at this special community rate
            </div>
          </div>
        </div>
      </div>

      <!-- Host Bookings Table -->
      <div class="card" style="margin-bottom: var(--space-8);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 1.15rem;">Incoming Guest Bookings</h3>
          <span class="badge badge-local" id="bookings-badge-count">0 Records</span>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: var(--text-sm);" id="owner-bookings-table">
            <thead>
              <tr style="border-bottom: 2px solid var(--color-border); color: var(--color-text-muted);">
                <th style="padding: 10px;">ID</th>
                <th style="padding: 10px;">Traveller</th>
                <th style="padding: 10px;">Booker Type</th>
                <th style="padding: 10px;">Days</th>
                <th style="padding: 10px;">Payout (90%)</th>
                <th style="padding: 10px;">Status</th>
              </tr>
            </thead>
            <tbody id="owner-bookings-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Guest Reviews & Reputation (Phase 15) -->
      <div class="card" style="margin-bottom: var(--space-8);">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem;">Guest Feedback & Reputation</h3>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
              Read-only view: Hosts can monitor feedback but cannot edit or delete traveller reviews.
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.4rem; font-weight: 700; color: #d97706;" id="host-avg-rating">★ 4.9</span>
            <span class="badge badge-verified" id="host-reviews-badge">0 Reviews</span>
          </div>
        </div>

        <!-- Tag Summary -->
        <div style="background: var(--color-surface-subtle); padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; border: 1px solid var(--color-border);">
          <strong style="font-size: 12px; color: var(--color-primary); display: block; margin-bottom: 6px;">TOP TRAVELLER PRAISE TAGS:</strong>
          <div id="host-tags-summary" style="display: flex; flex-wrap: wrap; gap: 6px;">
            <!-- Populated dynamically -->
          </div>
        </div>

        <!-- Recent Reviews List -->
        <div id="host-recent-reviews" style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Concept Teaser: Business Model Card -->
      <div class="card" style="background: #f8fafc; border: 1.5px dashed #94a3b8; padding: var(--space-6);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span class="badge badge-simulated">Concept / Hackathon Roadmap</span>
          <strong style="color: #475569; font-size: 0.9rem;">YATRALOCAL SUSTAINABLE BUSINESS MODEL</strong>
        </div>
        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin: 0; line-height: 1.6;">
          <strong>1. Fair Platform Commission:</strong> Transparent 10% booking commission (compared to 25–35% on mainstream OTAs).<br>
          <strong>2. Host Pro Dashboard:</strong> ₹499/quarter for AI occupancy forecasting, WhatsApp auto-reminders, and dynamic pricing.<br>
          <strong>3. Direct Guide Verifications:</strong> Zero fees for local guides; revenue shared only when bookings occur.
        </p>
      </div>
    </div>
  `;
}

export async function initOwnerEvents() {
  const tableBody = document.getElementById('owner-bookings-body');
  const kpiCount = document.getElementById('kpi-bookings-count');
  const badgeCount = document.getElementById('bookings-badge-count');

  // Fetch bookings from backend
  try {
    const res = await fetch('/api/bookings');
    if (res.ok) {
      const data = await res.json();
      hostBookings = data.bookings || [];
    }
  } catch (e) {
    console.warn('[Owner] Could not fetch bookings:', e);
    hostBookings = store.get().bookings || [];
  }

  // Filter for this host (or show all demo bookings)
  const manaliBookings = hostBookings.filter(b => b.stayId === 'stay-manali-deodar' || b.destination === 'manali' || true);

  if (kpiCount) kpiCount.textContent = manaliBookings.length;
  if (badgeCount) badgeCount.textContent = `${manaliBookings.length} Records`;

  if (tableBody) {
    tableBody.innerHTML = '';
    if (manaliBookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: var(--color-text-muted);">No bookings received yet. Book a trip in Phase 6 to see it appear here!</td></tr>`;
    } else {
      manaliBookings.forEach(b => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--color-border-subtle)';
        tr.innerHTML = `
          <td style="padding: 10px; font-weight: 700; color: var(--color-primary);">${b.id || 'BK-DEMO'}</td>
          <td style="padding: 10px;">
            <strong>${b.travellerName}</strong> (Age ${b.travellerAge || 60})
          </td>
          <td style="padding: 10px;">
            ${b.bookerType === 'family' ? '<span class="badge badge-family">Family-Assisted</span>' : '<span class="badge badge-local">Self</span>'}
          </td>
          <td style="padding: 10px;">${b.days} Days</td>
          <td style="padding: 10px; font-weight: 700; color: var(--color-success);">
            ₹${(b.localIncome || Math.round((b.totalCost || 5000) * 0.9)).toLocaleString('en-IN')}
          </td>
          <td style="padding: 10px;">
            <span class="badge badge-verified">✓ Confirmed</span>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // Populate Host Reviews & Tag Summary (Phase 15)
  const hostStayId = 'stay-manali-deodar';
  const hostReviews = getReviewsForTarget('stay', hostStayId);
  const hostSummary = calculateRatingSummary(hostReviews);

  const avgRatingEl = document.getElementById('host-avg-rating');
  const reviewsBadgeEl = document.getElementById('host-reviews-badge');
  const tagsSummaryEl = document.getElementById('host-tags-summary');
  const recentReviewsEl = document.getElementById('host-recent-reviews');

  if (avgRatingEl) avgRatingEl.textContent = `★ ${hostSummary.average || 4.9}`;
  if (reviewsBadgeEl) reviewsBadgeEl.textContent = `${hostSummary.count} Total Reviews`;

  if (tagsSummaryEl) {
    tagsSummaryEl.innerHTML = '';
    if (hostSummary.highlights.length > 0) {
      hostSummary.highlights.forEach(t => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-local';
        badge.textContent = `✓ ${t}`;
        tagsSummaryEl.appendChild(badge);
      });
    } else {
      tagsSummaryEl.innerHTML = '<span style="font-size: 12px; color: var(--color-text-muted);">No tags yet</span>';
    }
  }

  if (recentReviewsEl) {
    recentReviewsEl.innerHTML = '';
    if (hostReviews.length === 0) {
      recentReviewsEl.innerHTML = '<div style="font-size: 12px; color: var(--color-text-muted);">No reviews received yet.</div>';
    } else {
      hostReviews.slice(0, 4).forEach(r => {
        const item = document.createElement('div');
        item.style.cssText = 'background: #ffffff; border: 1px solid var(--color-border); border-radius: 8px; padding: 12px; font-size: 13px;';

        const head = document.createElement('div');
        head.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 4px;';
        head.innerHTML = `
          <strong>${r.name || 'Traveller'}</strong>
          <span style="color: #d97706; font-weight: 700;">★ ${r.rating}</span>
        `;
        item.appendChild(head);

        const comment = document.createElement('p');
        comment.style.cssText = 'margin: 0; color: var(--color-text-secondary); line-height: 1.4;';
        comment.textContent = r.comment; // Strictly textContent (XSS-safe)
        item.appendChild(comment);

        recentReviewsEl.appendChild(item);
      });
    }
  }

  // Populate Season Outlook Card (Phase 16)
  const outlookMount = document.getElementById('owner-season-outlook-mount');
  if (outlookMount) {
    try {
      const currM = getCurrentMonth();
      const m1 = (currM % 12) + 1;
      const m2 = ((currM + 1) % 12) + 1;
      const m3 = ((currM + 2) % 12) + 1;

      const [sCurr, s1, s2, s3] = await Promise.all([
        getSeason('manali', currM),
        getSeason('manali', m1),
        getSeason('manali', m2),
        getSeason('manali', m3)
      ]);

      const lowMonths = [s1, s2, s3].filter(s => s.isOffSeason);
      const suggestionText = lowMonths.length > 0
        ? `Next ${lowMonths.length === 1 ? 'month (' + lowMonths[0].monthName + ') is' : lowMonths.length + ' months are'} low-demand (${lowMonths.map(m => m.monthName).join(', ')}): publish an off-season offer below to fill your 6 vacant rooms!`
        : 'Upcoming months are high-demand: ensure advance calendar quotas are open for travellers.';

      outlookMount.innerHTML = `
        <div class="card" style="border-left: 5px solid var(--color-primary); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.5rem;">📅</span>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem;">Destination Season Outlook &bull; Manali</h3>
                <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                  Current season and 3-month forward demand projection. <span class="badge badge-simulated">Estimate</span>
                </div>
              </div>
            </div>
            <span style="font-size: 11px; color: var(--color-text-muted); font-style: italic;">
              Estimated from travel trends, not live booking data.
            </span>
          </div>

          <!-- 4-Month Cards Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 14px;">
            ${[sCurr, s1, s2, s3].map((s, idx) => {
              const b = getSeasonBadgeConfig(s.level);
              const isCurrent = idx === 0;
              return `
                <div style="background: ${isCurrent ? '#f4fbf7' : '#faf8f5'}; border: 1px solid ${isCurrent ? '#b2dfdb' : '#e2ddd5'}; border-radius: 8px; padding: 10px; text-align: center;">
                  <div style="font-size: 11px; font-weight: 700; color: ${isCurrent ? 'var(--color-primary)' : 'var(--color-text-muted)'}; margin-bottom: 4px;">
                    ${s.monthName} ${isCurrent ? '(Now)' : ''}
                  </div>
                  <div class="badge ${b.tagClass}" style="font-size: 10px; padding: 2px 6px;">
                    ${b.icon} ${s.level.toUpperCase()}
                  </div>
                  <div style="font-size: 10px; color: var(--color-text-secondary); margin-top: 6px; line-height: 1.2;">
                    ${s.reason}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Proactive Suggestion Banner -->
          <div style="background: ${lowMonths.length > 0 ? '#fffbeb' : '#f0fdf4'}; border: 1px solid ${lowMonths.length > 0 ? '#fde68a' : '#bbf7d0'}; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.3rem;">💡</span>
            <div style="font-size: var(--text-sm); color: #1f2937;">
              <strong>Strategic Recommendation:</strong> ${suggestionText}
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      console.warn('[Owner] Could not render season outlook:', e);
    }
  }

  // Live preview update in offer builder
  const discInput = document.getElementById('offer-discount');
  const roomsInput = document.getElementById('offer-rooms');
  const msgInput = document.getElementById('offer-msg');
  const prevRibbon = document.getElementById('preview-ribbon');
  const prevMsg = document.getElementById('preview-msg');
  const prevRooms = document.getElementById('preview-rooms');

  function updatePreview() {
    if (prevRibbon && discInput) prevRibbon.textContent = `🏷️ ${discInput.value}% OFF-SEASON`;
    if (prevMsg && msgInput) prevMsg.textContent = `"${msgInput.value}"`;
    if (prevRooms && roomsInput) prevRooms.textContent = roomsInput.value;
  }

  discInput?.addEventListener('input', updatePreview);
  roomsInput?.addEventListener('input', updatePreview);
  msgInput?.addEventListener('input', updatePreview);

  // Form submit
  document.getElementById('offer-builder-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('offer-title');
    const checkedMonths = Array.from(document.querySelectorAll('input[name="offer-month"]:checked')).map(cb => Number(cb.value));

    const offerPayload = {
      stayId: 'stay-manali-deodar',
      stayName: 'Deodar Woods Family Homestay',
      destination: 'manali',
      title: titleInput ? titleInput.value : '20% off weekdays',
      discountPercent: Number(discInput.value) || 20,
      roomsOffered: Number(roomsInput.value) || 4,
      validFrom: document.getElementById('offer-valid-from').value,
      validTo: document.getElementById('offer-valid-to').value,
      applicableMonths: checkedMonths.length > 0 ? checkedMonths : [11, 3],
      message: msgInput.value,
      isSample: true,
      tag: 'Demo / Sample Offer'
    };

    // Save to localStorage
    saveHostOffer(offerPayload);

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerPayload)
      });
      if (res.ok) {
        alert('🎉 Off-season offer published successfully! It is saved to prototype storage and synced to the traveller Stays page.');
      } else {
        alert('Offer saved to prototype local storage (Demo)!');
      }
    } catch (err) {
      alert('Offer saved to prototype local storage (Demo)!');
    }
  });
}
