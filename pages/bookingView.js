/**
 * YatraLocal Booking Flow & Family-Assisted Booking (Phase 6)
 * 5-Step Stepper: 1 Review -> 2 Traveller Info -> 3 Who is booking? -> 4 Confirm & Pay -> 5 Confirmation (.ics download & family share).
 */

import { store } from '../js/store.js';

let bookingStep = 1;
let bookingData = {
  travellerName: 'Aarav Sharma',
  travellerAge: 68,
  travellerPhone: '+91 98765 43210',
  emergencyPhone: '+91 91234 56789',
  specialNeeds: 'Senior citizen ground floor room preferred, minimal walking.',
  bookerType: 'self', // 'self' | 'family'
  bookerName: '',
  bookerRelation: 'Son',
  bookerPhone: '',
  paymentMethod: 'upi',
  upiId: 'traveller@okhdfcbank'
};

export function renderBooking() {
  const isSaral = store.get().saralMode;

  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 80px; max-width: 800px;">
      <!-- Stepper Nav -->
      <div class="stepper-nav" id="booking-stepper">
        <div class="step-item ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}" data-step="1">
          <div class="step-circle">${bookingStep > 1 ? '✓' : '1'}</div>
          <span class="step-title">Review</span>
        </div>
        <div class="step-item ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}" data-step="2">
          <div class="step-circle">${bookingStep > 2 ? '✓' : '2'}</div>
          <span class="step-title">Traveller</span>
        </div>
        <div class="step-item ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}" data-step="3">
          <div class="step-circle">${bookingStep > 3 ? '✓' : '3'}</div>
          <span class="step-title">Booker</span>
        </div>
        <div class="step-item ${bookingStep >= 4 ? 'active' : ''} ${bookingStep > 4 ? 'completed' : ''}" data-step="4">
          <div class="step-circle">${bookingStep > 4 ? '✓' : '4'}</div>
          <span class="step-title">Payment</span>
        </div>
        <div class="step-item ${bookingStep === 5 ? 'active' : ''}" data-step="5">
          <div class="step-circle">5</div>
          <span class="step-title">Confirmed</span>
        </div>
      </div>

      <!-- Main Step Body Container -->
      <div id="booking-step-content">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;
}

export function initBookingEvents() {
  renderCurrentBookingStep();
}

function renderCurrentBookingStep() {
  const container = document.getElementById('booking-step-content');
  if (!container) return;

  const state = store.get();
  const plan = state.itinerary;
  const stay = state.selectedStay;
  const guide = state.selectedGuide;
  const days = plan?.days?.length || state.preferences.days || 3;
  const travellers = state.preferences.travellers || 2;

  // Cost calculation
  const stayTotal = (stay ? stay.pricePerNight : 1450) * Math.max(1, days - 1);
  const guideTotal = (guide ? guide.pricePerDay : 750) * days;
  const activitiesTotal = plan ? plan.days.reduce((s, d) => s + (d.estCost || 0), 0) : 1500;
  const subtotal = stayTotal + guideTotal + activitiesTotal;
  const localIncome = Math.round(subtotal * 0.9); // 90% goes to local hosts

  if (bookingStep === 1) {
    // Step 1: Review Trip
    container.innerHTML = `
      <div class="card" style="padding: var(--space-8); border-radius: var(--radius-xl);">
        <h2 style="margin-bottom: var(--space-2);">1. Review Your Local Trip</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">
          Review your chosen itinerary, local stay, and guide before entering details.
        </p>

        <!-- Local Income Message Nudge -->
        <div style="background: #e8f5f4; border: 1.5px solid #0d5c58; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-6); display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 2rem;">🤝</span>
          <div>
            <strong style="color: #0d5c58; font-size: 1.05rem;">Direct Community Impact:</strong>
            <div style="font-size: 0.95rem; color: #1f2937;">
              <strong>₹${localIncome.toLocaleString('en-IN')}</strong> of your total goes directly to local families, homestay owners, and guides.
            </div>
          </div>
        </div>

        <!-- Trip Summary Breakdown -->
        <div style="background: var(--color-surface-subtle); border-radius: var(--radius-md); padding: var(--space-5); margin-bottom: var(--space-6); display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
            <span>📍 Destination:</span>
            <strong>${plan?.destination?.name || 'Manali'} (${days} Days, ${travellers} Travellers)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
            <span>🏡 Local Homestay:</span>
            <strong>${stay ? stay.name : 'Deodar Woods Family Homestay'} (₹${stayTotal})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
            <span>🧭 Verified Guide:</span>
            <strong>${guide ? guide.name : 'Prakash Negi'} (₹${guideTotal})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
            <span>🎟️ Verified Activities:</span>
            <strong>₹${activitiesTotal}</strong>
          </div>
          <div style="border-top: 1.5px solid var(--color-border); padding-top: 8px; display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 700; color: var(--color-primary);">
            <span>Total Estimated Cost:</span>
            <span>₹${subtotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button id="btn-next-step-1" class="btn btn-primary btn-lg" style="width: 100%;">
          Continue to Traveller Details &rarr;
        </button>
      </div>
    `;

    document.getElementById('btn-next-step-1')?.addEventListener('click', () => {
      bookingStep = 2;
      renderCurrentBookingStep();
    });

  } else if (bookingStep === 2) {
    // Step 2: Traveller Details
    container.innerHTML = `
      <div class="card" style="padding: var(--space-8); border-radius: var(--radius-xl);">
        <h2 style="margin-bottom: var(--space-2);">2. Who is Travelling?</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">
          Please enter the main traveller's details for local host and emergency verification.
        </p>

        <form id="traveller-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="input-tr-name">Primary Traveller's Full Name *</label>
            <input type="text" id="input-tr-name" class="input-control" value="${bookingData.travellerName}" required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="input-tr-age">Age *</label>
              <input type="number" id="input-tr-age" class="input-control" value="${bookingData.travellerAge}" required min="1" max="110">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="input-tr-phone">Mobile Phone (for updates) *</label>
              <input type="tel" id="input-tr-phone" class="input-control" value="${bookingData.travellerPhone}" required>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="input-tr-emergency">Emergency Contact Phone Number *</label>
            <input type="tel" id="input-tr-emergency" class="input-control" value="${bookingData.emergencyPhone}" required>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="input-tr-needs">Accessibility or Medical Needs (optional)</label>
            <textarea id="input-tr-needs" class="textarea-control" rows="2">${bookingData.specialNeeds}</textarea>
            <div class="form-hint">Shared with your homestay host so ground floor rooms and ramps can be prepared.</div>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 16px;">
            <button type="button" id="btn-back-step-2" class="btn btn-secondary btn-lg" style="flex: 1;">&larr; Back</button>
            <button type="submit" class="btn btn-primary btn-lg" style="flex: 2;">Next: Who is Booking? &rarr;</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('btn-back-step-2')?.addEventListener('click', () => { bookingStep = 1; renderCurrentBookingStep(); });
    document.getElementById('traveller-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      bookingData.travellerName = document.getElementById('input-tr-name').value;
      bookingData.travellerAge = document.getElementById('input-tr-age').value;
      bookingData.travellerPhone = document.getElementById('input-tr-phone').value;
      bookingData.emergencyPhone = document.getElementById('input-tr-emergency').value;
      bookingData.specialNeeds = document.getElementById('input-tr-needs').value;

      bookingStep = 3;
      renderCurrentBookingStep();
    });

  } else if (bookingStep === 3) {
    // Step 3: Who is booking? (Family-Assisted Booking Flow)
    container.innerHTML = `
      <div class="card" style="padding: var(--space-8); border-radius: var(--radius-xl);">
        <h2 style="margin-bottom: var(--space-2);">3. Who is Completing This Booking?</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">
          We support family members booking on behalf of parents, grandparents, or less tech-savvy relatives.
        </p>

        <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
          <label style="border: 2px solid ${bookingData.bookerType === 'self' ? 'var(--color-primary)' : 'var(--color-border)'}; border-radius: 12px; padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; background: ${bookingData.bookerType === 'self' ? '#f0fdf4' : '#fff'};">
            <input type="radio" name="booker-type" value="self" ${bookingData.bookerType === 'self' ? 'checked' : ''} style="width: 20px; height: 20px;">
            <div>
              <strong style="font-size: 1.05rem;">I am booking for myself</strong>
              <div style="font-size: 0.85rem; color: var(--color-text-muted);">I am the primary traveller embarking on this journey.</div>
            </div>
          </label>

          <label style="border: 2px solid ${bookingData.bookerType === 'family' ? 'var(--color-primary)' : 'var(--color-border)'}; border-radius: 12px; padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; background: ${bookingData.bookerType === 'family' ? '#f0fdf4' : '#fff'};">
            <input type="radio" name="booker-type" value="family" ${bookingData.bookerType === 'family' ? 'checked' : ''} style="width: 20px; height: 20px;">
            <div>
              <strong style="font-size: 1.05rem;">👨‍👩‍👧 A family member is booking for the traveller</strong>
              <div style="font-size: 0.85rem; color: var(--color-text-muted);">I am helping an elderly parent or family member organize their trip.</div>
            </div>
          </label>
        </div>

        <!-- Family Fields (Shown if family is selected) -->
        <div id="family-fields-container" style="display: ${bookingData.bookerType === 'family' ? 'block' : 'none'}; background: #faf5ed; border: 1.5px solid #d97706; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <h4 style="color: #92400e; margin-bottom: 12px; font-size: 1rem;">Family Booker Details:</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div>
              <label class="form-label" for="input-fam-name">Your Full Name</label>
              <input type="text" id="input-fam-name" class="input-control" value="${bookingData.bookerName || 'Sunil Sharma'}" placeholder="e.g. Sunil Sharma">
            </div>
            <div>
              <label class="form-label" for="input-fam-rel">Relationship</label>
              <input type="text" id="input-fam-rel" class="input-control" value="${bookingData.bookerRelation || 'Son'}" placeholder="e.g. Son, Daughter, Grandchild">
            </div>
          </div>
          <div>
            <label class="form-label" for="input-fam-phone">Your Phone (for co-notifications)</label>
            <input type="tel" id="input-fam-phone" class="input-control" value="${bookingData.bookerPhone || '+91 98765 11223'}">
          </div>
          <div style="font-size: 0.85rem; color: #78350f; margin-top: 10px; line-height: 1.5;">
            ✓ <em>Simulated consent:</em> An SMS confirmation and live tracking access link will automatically be copied to both the traveller and you.
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button type="button" id="btn-back-step-3" class="btn btn-secondary btn-lg" style="flex: 1;">&larr; Back</button>
          <button type="button" id="btn-next-step-3" class="btn btn-primary btn-lg" style="flex: 2;">Continue to Confirmation &rarr;</button>
        </div>
      </div>
    `;

    document.querySelectorAll('input[name="booker-type"]').forEach(r => {
      r.addEventListener('change', (e) => {
        bookingData.bookerType = e.target.value;
        const famEl = document.getElementById('family-fields-container');
        if (famEl) famEl.style.display = bookingData.bookerType === 'family' ? 'block' : 'none';
      });
    });

    document.getElementById('btn-back-step-3')?.addEventListener('click', () => { bookingStep = 2; renderCurrentBookingStep(); });
    document.getElementById('btn-next-step-3')?.addEventListener('click', () => {
      if (bookingData.bookerType === 'family') {
        bookingData.bookerName = document.getElementById('input-fam-name')?.value || 'Family Member';
        bookingData.bookerRelation = document.getElementById('input-fam-rel')?.value || 'Relative';
        bookingData.bookerPhone = document.getElementById('input-fam-phone')?.value || '';
      }
      bookingStep = 4;
      renderCurrentBookingStep();
    });

  } else if (bookingStep === 4) {
    // Step 4: Confirm & Simulated Payment
    container.innerHTML = `
      <div class="card" style="padding: var(--space-8); border-radius: var(--radius-xl);">
        <h2 style="margin-bottom: var(--space-2);">4. Confirm & Simulated Payment</h2>
        
        <!-- Big Simulated Banner -->
        <div style="background: #fef3c7; border: 2px dashed #d97706; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 1.1rem; font-weight: 700; color: #92400e;">
            ⚠️ SIMULATED DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED
          </div>
          <p style="font-size: 0.85rem; color: #78350f; margin: 4px 0 0 0;">
            This prototype is built for demonstration purposes. Live payment gateway integration is planned on the roadmap.
          </p>
        </div>

        <div style="border: 1px solid var(--color-border); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <h4 style="margin-bottom: 12px;">Final Price Breakdown:</h4>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px;">
            <span>Accommodation (${days - 1} nights):</span>
            <span>₹${stayTotal.toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px;">
            <span>Verified Local Guide (${days} days):</span>
            <span>₹${guideTotal.toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px;">
            <span>Verified Sightseeing & Transport:</span>
            <span>₹${activitiesTotal.toLocaleString('en-IN')}</span>
          </div>
          <div style="border-top: 1.5px solid var(--color-divider); padding-top: 8px; display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700; color: var(--color-primary);">
            <span>Payable Amount:</span>
            <span>₹${subtotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin-bottom: 8px;">Select Demo Payment Mode:</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <label style="border: 1.5px solid var(--color-border); border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="radio" name="pay-mode" value="upi" checked>
              <strong>UPI (GPay / PhonePe / Paytm)</strong>
            </label>
            <label style="border: 1.5px solid var(--color-border); border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="radio" name="pay-mode" value="card">
              <strong>Debit / Credit Card (Demo)</strong>
            </label>
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button type="button" id="btn-back-step-4" class="btn btn-secondary btn-lg" style="flex: 1;">&larr; Back</button>
          <button type="button" id="btn-confirm-pay" class="btn btn-primary btn-lg" style="flex: 2; background: #059669; border-color: #047857;">
            🔒 Authorize Simulated ₹${subtotal.toLocaleString('en-IN')} Booking &rarr;
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-back-step-4')?.addEventListener('click', () => { bookingStep = 3; renderCurrentBookingStep(); });
    document.getElementById('btn-confirm-pay')?.addEventListener('click', async () => {
      // Create confirmed booking
      const bookingPayload = {
        destination: plan?.destination?.id || 'manali',
        stayId: stay?.id || 'stay-manali-deodar',
        stayName: stay?.name || 'Deodar Woods Family Homestay',
        guideId: guide?.id || 'guide-manali-prakash',
        guideName: guide?.name || 'Prakash Negi',
        travellerName: bookingData.travellerName,
        travellerAge: bookingData.travellerAge,
        bookerType: bookingData.bookerType,
        bookerName: bookingData.bookerName,
        bookerPhone: bookingData.bookerPhone,
        days,
        totalCost: subtotal,
        isSaral: state.saralMode
      };

      // Call backend API /api/bookings to save and update owner dashboard
      let bookingId = 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload)
        });
        if (res.ok) {
          const resData = await res.json();
          bookingId = resData.booking.id;
        }
      } catch (err) {
        console.warn('[Booking] Saved locally:', err);
      }

      const finalizedBooking = {
        ...bookingPayload,
        id: bookingId,
        createdAt: new Date().toISOString()
      };

      store.addBooking(finalizedBooking);
      bookingStep = 5;
      renderCurrentBookingStep();
    });

  } else if (bookingStep === 5) {
    // Step 5: Confirmation Page (.ics calendar download & family share link)
    const latest = store.get().bookings[0] || {};
    const bookingId = latest.id || 'BK-DEMO-9182';

    container.innerHTML = `
      <div class="card" style="padding: var(--space-8); border-radius: var(--radius-xl); text-align: center;">
        <div style="width: 72px; height: 72px; background: #dcfce7; color: #166534; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 16px auto;">
          ✓
        </div>

        <span class="badge badge-verified" style="margin-bottom: 8px;">Booking Confirmed</span>
        <h2 style="color: #0d5c58; margin-bottom: 4px;">Thank You, ${bookingData.travellerName}!</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 20px;">
          Your booking has been received and confirmed with local hosts in ${plan?.destination?.name || 'Manali'}.
        </p>

        <!-- Simulated QR Code SVG -->
        <div style="background: #ffffff; border: 2px solid var(--color-border); border-radius: 12px; width: 140px; height: 140px; margin: 0 auto 16px auto; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px;">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#f8fafc"/>
            <rect x="10" y="10" width="25" height="25" fill="#0d5c58"/>
            <rect x="65" y="10" width="25" height="25" fill="#0d5c58"/>
            <rect x="10" y="65" width="25" height="25" fill="#0d5c58"/>
            <rect x="40" y="40" width="20" height="20" fill="#d97706"/>
            <rect x="45" y="15" width="10" height="15" fill="#0d5c58"/>
            <rect x="15" y="45" width="15" height="10" fill="#0d5c58"/>
            <rect x="70" y="70" width="15" height="15" fill="#0d5c58"/>
          </svg>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 4px;">${bookingId}</div>
        </div>

        <!-- Booking Details Card -->
        <div style="background: var(--color-surface-subtle); border-radius: 12px; padding: 18px; text-align: left; max-width: 500px; margin: 0 auto 24px auto; font-size: 0.95rem; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-muted);">Booking Reference:</span>
            <strong>${bookingId}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-muted);">Local Homestay:</span>
            <strong>${latest.stayName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-muted);">Local Guide:</span>
            <strong>${latest.guideName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-muted);">Duration:</span>
            <strong>${days} Days (${travellers} Travellers)</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-muted);">Total Paid:</span>
            <strong style="color: var(--color-primary);">₹${subtotal.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-bottom: 24px;">
          <button id="btn-download-ics" class="btn btn-secondary">
            📅 Add to Calendar (.ics)
          </button>
          <button id="btn-share-family" class="btn btn-secondary">
            💬 Share with Family
          </button>
          <a href="#/sos" class="btn btn-primary" style="background: #b91c1c; border-color: #991b1b;">
            🛡️ Set Up SOS Emergency Contacts
          </a>
        </div>

        <div>
          <a href="#/trips" class="btn btn-ghost">View All My Trips &rarr;</a>
        </div>
      </div>
    `;

    // .ics calendar generation
    document.getElementById('btn-download-ics')?.addEventListener('click', () => {
      generateIcsFile(latest, days);
    });

    // Share link
    document.getElementById('btn-share-family')?.addEventListener('click', () => {
      const shareText = `Namaste! My trip to ${plan?.destination?.name || 'India'} is confirmed via YatraLocal (Ref: ${bookingId}). Staying at ${latest.stayName}.`;
      if (navigator.share) {
        navigator.share({ title: 'YatraLocal Trip Booking', text: shareText, url: window.location.href });
      } else {
        navigator.clipboard.writeText(shareText);
        alert('Booking summary copied to clipboard! You can paste it into WhatsApp.');
      }
    });
  }
}

function generateIcsFile(booking, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // 1 week from now
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  const formatIcsDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YatraLocal//Local Travel Engine//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id || 'booking'}@yatralocal.in`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:YatraLocal Journey: ${booking.stayName}`,
    `DESCRIPTION:Trip to ${booking.destination} staying at ${booking.stayName}. Local Guide: ${booking.guideName}. Booking Ref: ${booking.id}`,
    'LOCATION:India',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `YatraLocal_${booking.id || 'trip'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
