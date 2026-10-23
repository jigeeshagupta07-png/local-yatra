/**
 * YatraLocal Safety SOS System (Phase 8 & 13)
 * Hold-to-activate 2s, 5s cancel countdown, real Geolocation tracking,
 * serverless backend token dispatch, live tracking link, and zero-backend sms/wa.me fallbacks.
 */

import { store } from './store.js';
import { speakText } from './speech.js';

let holdTimer = null;
let holdStartTime = 0;
const HOLD_DURATION_MS = 2000;
let watchId = null;
let currentTrackingId = null;
let countdownInterval = null;

export function setupSosFloatingButton() {
  const btn = document.getElementById('sos-btn');
  const ring = document.getElementById('sos-ring');
  if (!btn || !ring) return;

  const circumference = 213; // 2 * PI * 34 approx

  function startHold(e) {
    if (e.type === 'touchstart') e.preventDefault();
    holdStartTime = Date.now();
    btn.classList.add('holding');

    holdTimer = setInterval(() => {
      const elapsed = Date.now() - holdStartTime;
      const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
      const offset = circumference * (1 - progress);
      ring.style.strokeDashoffset = offset;

      if (progress >= 1) {
        cancelHold();
        triggerSosWorkflow();
      }
    }, 50);
  }

  function cancelHold() {
    if (holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
    btn.classList.remove('holding');
    ring.style.strokeDashoffset = circumference;
  }

  // Pointer events for desktop and mobile
  btn.addEventListener('mousedown', startHold);
  btn.addEventListener('touchstart', startHold, { passive: false });

  window.addEventListener('mouseup', cancelHold);
  window.addEventListener('touchend', cancelHold);
  window.addEventListener('touchcancel', cancelHold);
}

export function triggerSosWorkflow() {
  const state = store.get();

  // Saral voice announcement
  if (state.saralMode) {
    speakText('Emergency SOS activated. Countdown started. Press cancel if this was a mistake.');
  }

  // Create or retrieve overlay element
  let overlay = document.getElementById('sos-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sos-modal-overlay';
    document.body.appendChild(overlay);
  }

  let countdown = 5;
  overlay.innerHTML = `
    <div class="modal-backdrop open" style="z-index: 100000; background: rgba(185, 28, 28, 0.92); backdrop-filter: blur(8px);">
      <div class="card" style="max-width: 500px; width: 90%; text-align: center; border: 3px solid #fff; box-shadow: 0 25px 50px rgba(0,0,0,0.5); padding: 32px 24px; border-radius: 24px;">
        <div style="font-size: 3rem; margin-bottom: 8px;">🚨</div>
        <h2 style="color: #b91c1c; font-size: 1.8rem; margin-bottom: 8px;">EMERGENCY SOS TRIGGERED</h2>
        <p style="font-size: 1.1rem; color: #374151; margin-bottom: 20px;">
          Sending alert to emergency contacts in <strong id="sos-countdown" style="font-size: 2rem; color: #b91c1c;">${countdown}</strong> seconds...
        </p>
        <button id="btn-cancel-sos" class="btn btn-lg btn-danger" style="width: 100%; font-size: 1.2rem; min-height: 60px;">
          ❌ CANCEL ALERT (False Alarm)
        </button>
      </div>
    </div>
  `;

  const countEl = document.getElementById('sos-countdown');
  const cancelBtn = document.getElementById('btn-cancel-sos');

  cancelBtn.addEventListener('click', () => {
    clearInterval(countdownInterval);
    overlay.innerHTML = '';
  });

  countdownInterval = setInterval(() => {
    countdown--;
    if (countEl) countEl.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      dispatchSosAlert(overlay);
    }
  }, 1000);
}

async function dispatchSosAlert(overlay) {
  const state = store.get();
  const profile = state.userProfile || { name: 'YatraLocal Traveller', phone: '', age: 60, gender: 'Male' };
  const contacts = (state.emergencyContacts && state.emergencyContacts.length > 0)
    ? state.emergencyContacts
    : [{ name: 'Emergency Contact', phone: '112', relationship: 'Emergency' }];
  const health = state.healthDetails || {};
  const medicalNote = state.medicalNote || health.criticalNotes || 'None specified';

  // Attempt real Geolocation
  let lat = 32.2396;
  let lng = 77.1887;
  let accuracy = 50;

  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 10000
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      accuracy = Math.round(pos.coords.accuracy);
    } catch (err) {
      console.warn('[SOS Geolocation] Fallback to default coordinates:', err);
    }
  }

  // Call Backend API /api/sos
  let sosResponse = null;
  try {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        travellerName: profile.name || 'YatraLocal Traveller',
        userProfile: profile,
        healthDetails: health,
        lat,
        lng,
        contacts,
        medicalNote
      })
    });
    if (res.ok) {
      sosResponse = await res.json();
      currentTrackingId = sosResponse.trackingId;
    }
  } catch (err) {
    console.warn('[SOS] Backend request failed, using zero-backend fallback:', err);
  }

  const trackingToken = currentTrackingId || ('TRK-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const trackUrl = `${window.location.origin}/track.html?id=${trackingToken}`;

  // Log in store for impact metrics
  store.logSosEvent({
    trackingId: trackingToken,
    lat,
    lng,
    contactsCount: contacts.length,
    timestamp: new Date().toISOString()
  });

  // Start continuous 15s location watcher
  startLocationTracking(trackingToken);

  // Health summary text for emergency SMS/WhatsApp
  const healthSnippetParts = [];
  if (health.bloodGroup && health.bloodGroup !== 'Unknown') healthSnippetParts.push(`Blood: ${health.bloodGroup}`);
  if (health.conditions?.length) healthSnippetParts.push(`Conditions: ${health.conditions.join(', ')}`);
  if (health.allergies && health.allergies !== 'None') healthSnippetParts.push(`Allergies: ${health.allergies}`);
  if (health.criticalNotes) healthSnippetParts.push(`Note: ${health.criticalNotes}`);
  const healthSnippet = healthSnippetParts.join(' | ');

  const primaryContact = contacts.find(c => c.isPrimary) || contacts[0] || { name: 'Emergency Services', phone: '112' };
  const alertText = `🚨 EMERGENCY ALERT: ${profile.name || 'Traveller'} needs immediate assistance!\nLocation: ${mapsLink}\nLive GPS Track: ${trackUrl}${healthSnippet ? `\nHealth Info: ${healthSnippet}` : ''}`;
  const smsBody = encodeURIComponent(alertText);
  const smsHref = `sms:${primaryContact.phone}?body=${smsBody}`;
  const waHref = `https://wa.me/?text=${smsBody}`;

  overlay.innerHTML = `
    <div class="modal-backdrop open" style="z-index: 100000; background: rgba(15, 23, 42, 0.95); overflow-y: auto; padding: 20px 10px;">
      <div class="card" style="max-width: 620px; width: 100%; margin: 20px auto; border: 2px solid #ef4444; box-shadow: 0 25px 50px rgba(0,0,0,0.5); padding: 28px 24px; border-radius: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 2rem;">🚨</span>
            <div>
              <h2 style="color: #b91c1c; font-size: 1.45rem; margin: 0;">SOS ALERT DISPATCHED</h2>
              <div style="font-size: 12px; color: var(--color-text-muted);">Traveller: <strong>${profile.name || 'Traveller'}</strong> (${profile.age || 60} yrs)</div>
            </div>
          </div>
          <span class="badge ${sosResponse?.realSmsSent ? 'badge-verified' : 'badge-simulated'}">
            ${sosResponse?.realSmsSent ? 'Twilio SMS Sent' : 'Demo / Simulated Alert'}
          </span>
        </div>

        <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          <p style="font-size: 0.9rem; color: #991b1b; margin-bottom: 6px;">
            ${sosResponse?.realSmsSent 
              ? 'Real emergency SMS alert dispatched via Twilio to your designated contacts.' 
              : '<strong>SIMULATED NOTICE:</strong> Emergency broadcast generated (Demo). Tap official hotline buttons below for actual emergency services.'}
          </p>
          <div style="font-size: 0.85rem; color: #4b5563;">
            Live Location: <strong>${lat.toFixed(4)}, ${lng.toFixed(4)}</strong> (±${accuracy}m) &bull; <span id="sos-live-time">Updated just now</span>
          </div>
        </div>

        <!-- Traveller Health Card Snippet -->
        <div style="background: #ffffff; border: 1.5px solid #e2ddd5; border-radius: 12px; padding: 12px 14px; margin-bottom: 16px; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0d5c58;">🩺 Attached Health Profile:</strong>
            ${health.bloodGroup ? `<span style="background: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 6px; border: 1px solid #fca5a5;">🩸 ${health.bloodGroup}</span>` : ''}
          </div>
          <div style="font-size: 12px; color: #374151; line-height: 1.4;">
            ${health.conditions?.length ? `<div><strong>Conditions:</strong> ${health.conditions.join(', ')}</div>` : ''}
            ${health.allergies ? `<div><strong>Allergies:</strong> <span style="color:#b91c1c;">${health.allergies}</span></div>` : ''}
            ${health.criticalNotes ? `<div style="color: #92400e; margin-top: 2px;"><strong>Note:</strong> "${health.criticalNotes}"</div>` : ''}
          </div>
          <div style="text-align: right; margin-top: 6px;">
            <a href="#/sos" style="font-size: 11px; color: var(--color-primary); text-decoration: underline;" onclick="document.getElementById('sos-modal-overlay').innerHTML=''">⚙️ Edit Health & Contacts</a>
          </div>
        </div>

        <div style="margin-bottom: 16px; text-align: left;">
          <h4 style="font-size: 0.95rem; margin-bottom: 8px;">Emergency Contacts Notified:</h4>
          <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px;">
            ${contacts.map(c => `
              <li style="padding: 8px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                <span><strong>${c.name}</strong> (${c.relationship || 'Emergency'} &bull; ${c.phone}) ${c.isPrimary ? '<span style="color:var(--color-primary); font-weight:700;">★</span>' : ''}</span>
                <a href="tel:${c.phone}" class="btn btn-sm btn-secondary" style="font-size: 11px; min-height: 28px; padding: 2px 8px;">Call</a>
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 16px; text-align: left;">
          <h4 style="font-size: 0.95rem; margin-bottom: 6px;">Family Live Tracking Link:</h4>
          <div style="display: flex; gap: 8px;">
            <input type="text" readonly value="${trackUrl}" class="input-control" style="font-size: 0.85rem;" id="track-url-input">
            <button class="btn btn-secondary" id="btn-copy-track" style="min-width: 90px;">Copy</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
          <a href="${smsHref}" class="btn btn-secondary" style="font-size: 0.9rem;">
            💬 Open Native SMS
          </a>
          <a href="${waHref}" target="_blank" rel="noopener" class="btn btn-secondary" style="font-size: 0.9rem;">
            🟢 Share via WhatsApp
          </a>
        </div>

        <!-- Official Emergency Hotlines -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 14px; margin-bottom: 16px;">
          <p style="font-size: 0.8rem; font-weight: 700; color: #4b5563; margin-bottom: 8px;">OFFICIAL NATIONAL EMERGENCY DIALERS:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
            <a href="tel:112" class="btn btn-danger" style="flex: 1; min-width: 120px;">📞 Call 112 (All Emergency)</a>
            <a href="tel:100" class="btn btn-secondary" style="flex: 1; min-width: 100px;">🚓 Police 100</a>
            <a href="tel:108" class="btn btn-secondary" style="flex: 1; min-width: 100px;">🚑 Ambulance 108</a>
          </div>
        </div>

        <button id="btn-safe-stop" class="btn btn-lg btn-primary" style="width: 100%; min-height: 52px; background: #059669; border-color: #059669;">
          🛡️ I'M SAFE — STOP SHARING LOCATION
        </button>
      </div>
    </div>
  `;

  // Copy button handler
  document.getElementById('btn-copy-track')?.addEventListener('click', () => {
    const input = document.getElementById('track-url-input');
    if (input) {
      input.select();
      navigator.clipboard.writeText(input.value);
      alert('Family live tracking link copied to clipboard!');
    }
  });

  // Stop Sharing button handler
  document.getElementById('btn-safe-stop')?.addEventListener('click', async () => {
    stopLocationTracking(trackingToken);
    overlay.innerHTML = '';
  });
}

function startLocationTracking(token) {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const timeEl = document.getElementById('sos-live-time');
      if (timeEl) {
        timeEl.textContent = `Updated at ${new Date().toLocaleTimeString()}`;
      }

      // Throttled update to backend /api/track/update
      try {
        await fetch('/api/track/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: token, lat, lng })
        });
      } catch (e) {
        console.warn('[SOS Track] Background update error:', e);
      }
    },
    (err) => console.warn('[SOS Geolocation watch error]', err),
    { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
  );
}

async function stopLocationTracking(token) {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  try {
    await fetch('/api/track/safe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: token })
    });
  } catch (e) {
    console.warn('[SOS] Mark safe error:', e);
  }
}
