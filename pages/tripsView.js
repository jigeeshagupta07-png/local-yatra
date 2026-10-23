/**
 * YatraLocal My Trips View (Phase 6)
 * Displays booked itineraries, local stay & guide contacts, .ics download, and share options.
 */

import { store } from '../js/store.js';

export function renderTrips() {
  const bookings = store.get().bookings || [];

  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 80px; max-width: 840px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
        <div>
          <h1 style="margin: 0; font-size: clamp(1.8rem, 4vw, 2.3rem);">My Journeys</h1>
          <p style="margin: 4px 0 0 0; color: var(--color-text-secondary); font-size: var(--text-sm);">
            Your upcoming and past local travel bookings with verified homestays and guides.
          </p>
        </div>
        <a href="#/plan" class="btn btn-primary btn-sm">+ Plan New Trip</a>
      </div>

      <div id="my-trips-list" style="display: flex; flex-direction: column; gap: var(--space-5);">
        ${bookings.length === 0 ? `
          <div class="card" style="text-align: center; padding: 48px 24px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">🎒</div>
            <h3>No trips booked yet</h3>
            <p style="color: var(--color-text-muted); max-width: 400px; margin: 0 auto 20px auto;">
              Plan a journey to Manali, Varanasi, Jaipur, or Hampi and stay with authentic local host families.
            </p>
            <a href="#/plan" class="btn btn-primary btn-lg">Plan My Trip Now</a>
          </div>
        ` : bookings.map(b => `
          <div class="card" style="border-left: 5px solid var(--color-primary); padding: var(--space-6);">
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
              <div>
                <span class="badge badge-verified" style="margin-bottom: 4px;">Confirmed Booking</span>
                <h3 style="margin: 0; font-size: 1.25rem;">${b.stayName}</h3>
                <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px;">
                  Destination: ${b.destination.toUpperCase()} &bull; Duration: ${b.days} Days &bull; Ref: <strong>${b.id}</strong>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--color-primary);">₹${Number(b.totalCost).toLocaleString('en-IN')}</div>
                <div style="font-size: 11px; color: var(--color-success); font-weight: 600;">₹${Number(b.localIncome).toLocaleString('en-IN')} paid to local hosts</div>
              </div>
            </div>

            <div style="background: var(--color-surface-subtle); border-radius: 8px; padding: 12px; font-size: var(--text-sm); margin-bottom: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
              <div>
                <span style="color: var(--color-text-muted); font-size: 11px; display: block;">PRIMARY TRAVELLER:</span>
                <strong>${b.travellerName}</strong> (Age ${b.travellerAge || 60})
              </div>
              <div>
                <span style="color: var(--color-text-muted); font-size: 11px; display: block;">LOCAL GUIDE:</span>
                <strong>${b.guideName}</strong>
              </div>
              <div>
                <span style="color: var(--color-text-muted); font-size: 11px; display: block;">BOOKING MODE:</span>
                ${b.bookerType === 'family' ? '<span class="badge badge-family">Family-Assisted</span>' : 'Self Booked'}
              </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="btn btn-sm btn-secondary btn-ics-download" data-id="${b.id}" data-stay="${b.stayName}">
                📅 Calendar (.ics)
              </button>
              <button class="btn btn-sm btn-ghost btn-share-trip" data-id="${b.id}" data-stay="${b.stayName}">
                💬 Share Summary
              </button>
              <a href="#/sos" class="btn btn-sm btn-ghost" style="color: #b91c1c; margin-left: auto;">
                🛡️ SOS Safety
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function initTripsEvents() {
  document.querySelectorAll('.btn-share-trip').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const stay = btn.dataset.stay;
      const text = `Namaste! My trip booking for ${stay} is confirmed on YatraLocal (Ref: ${id}).`;
      if (navigator.share) {
        navigator.share({ title: 'My YatraLocal Booking', text, url: window.location.href });
      } else {
        navigator.clipboard.writeText(text);
        alert('Booking summary copied to clipboard!');
      }
    });
  });
}
