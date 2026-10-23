/**
 * YatraLocal Safety SOS Setup Page (Phase 8 & 13)
 * Emergency contacts setup (up to 3), medical note, live location toggle, test trigger, and disclaimers.
 */

import { store } from '../js/store.js';
import { triggerSosWorkflow } from '../js/sos.js';

export function renderSos() {
  const state = store.get();
  const contacts = state.emergencyContacts || [];

  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 80px; max-width: 780px;">
      <div style="text-align: center; margin-bottom: var(--space-8);">
        <div style="font-size: 3rem; margin-bottom: 8px;">🛡️</div>
        <span class="badge badge-simulated" style="margin-bottom: 8px;">Safety First &bull; 24x7 Traveler Guard</span>
        <h1>Emergency SOS Setup & Hotline</h1>
        <p style="color: var(--color-text-secondary); max-width: 580px; margin: 0 auto;">
          Configure your emergency contacts and medical preferences. In an emergency, hold the red floating button for 2 seconds to dispatch your live location.
        </p>
      </div>

      <!-- Emergency Hotline Quick Dial Row -->
      <div class="card" style="border: 2px solid #ef4444; background: #fff5f5; margin-bottom: var(--space-8); padding: var(--space-6);">
        <h3 style="color: #b91c1c; margin-bottom: 8px; font-size: 1.15rem;">
          🚨 Government National Emergency Numbers (Direct Call)
        </h3>
        <p style="font-size: var(--text-xs); color: #7f1d1d; margin-bottom: 16px;">
          These are official pan-India government helplines. Tap to call directly on mobile:
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <a href="tel:112" class="btn btn-danger" style="flex: 1; min-width: 140px; font-weight: 700;">
            📞 112 (All-in-One Helpline)
          </a>
          <a href="tel:100" class="btn btn-secondary" style="flex: 1; min-width: 110px; border-color: #b91c1c; color: #b91c1c;">
            🚓 100 (Police)
          </a>
          <a href="tel:108" class="btn btn-secondary" style="flex: 1; min-width: 110px; border-color: #b91c1c; color: #b91c1c;">
            🚑 108 (Ambulance)
          </a>
          <a href="tel:1091" class="btn btn-secondary" style="flex: 1; min-width: 110px; border-color: #b91c1c; color: #b91c1c;">
            👩 1091 (Women Safety)
          </a>
        </div>
      </div>

      <!-- Emergency Contacts Form -->
      <div class="card" style="padding: var(--space-8); border-radius: var(--radius-xl); margin-bottom: var(--space-8);">
        <h3 style="margin-bottom: var(--space-2);">Your Emergency Contacts (Max 3)</h3>
        <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-6);">
          These trusted contacts receive an instant SMS, WhatsApp link, and live GPS map if SOS is triggered.
        </p>

        <form id="sos-contacts-form">
          <div id="contacts-list-container" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
            ${[0, 1, 2].map(idx => {
              const c = contacts[idx] || { name: '', phone: '' };
              return `
                <div style="background: var(--color-surface-subtle); padding: 14px; border-radius: 10px; border: 1px solid var(--color-border); display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">Contact ${idx + 1} Name</label>
                    <input type="text" class="input-control contact-name-input" data-idx="${idx}" value="${c.name}" placeholder="e.g. Sister, Doctor, Spouse">
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">Phone Number</label>
                    <input type="tel" class="input-control contact-phone-input" data-idx="${idx}" value="${c.phone}" placeholder="+91 98765 00000">
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Medical Note -->
          <div class="form-group">
            <label class="form-label" for="sos-medical-note">Critical Medical Note (Optional)</label>
            <textarea id="sos-medical-note" class="textarea-control" rows="2" placeholder="e.g. Diabetic, blood group O+, carries asthma inhaler">${state.medicalNote || ''}</textarea>
            <div class="form-hint">Included in the emergency SMS so first responders know critical info immediately.</div>
          </div>

          <!-- Location Permission Toggle -->
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="sos-location-check" ${state.shareLiveLocation ? 'checked' : ''} style="width: 18px; height: 18px;">
              <div>
                <strong>Share Live Geolocation when SOS is triggered</strong>
                <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                  Uses browser GPS to generate real-time family tracking coordinates. No background tracking occurs when SOS is inactive.
                </div>
              </div>
            </label>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button type="submit" class="btn btn-primary btn-lg" style="flex: 2;">
              💾 Save SOS Settings
            </button>
            <button type="button" id="btn-test-sos" class="btn btn-danger btn-lg" style="flex: 1;">
              🚨 Test SOS Alert
            </button>
          </div>
        </form>
      </div>

      <!-- Privacy & Compliance Statement -->
      <div class="card" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: var(--space-6);">
        <h4 style="font-size: 0.95rem; color: #334155; margin-bottom: 6px;">Privacy & Safety Disclaimer:</h4>
        <p style="font-size: var(--text-xs); color: #64748b; margin: 0; line-height: 1.6;">
          Your location data is strictly processed on-device and shared only upon affirmative hold-to-activate trigger. Tracking sessions automatically expire within 6 hours. This prototype does not substitute for local law enforcement or hospital dispatch.
        </p>
      </div>
    </div>
  `;
}

export function initSosEvents() {
  const form = document.getElementById('sos-contacts-form');
  const testBtn = document.getElementById('btn-test-sos');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const names = document.querySelectorAll('.contact-name-input');
    const phones = document.querySelectorAll('.contact-phone-input');
    const note = document.getElementById('sos-medical-note').value;
    const shareLoc = document.getElementById('sos-location-check').checked;

    const newContacts = [];
    names.forEach((n, idx) => {
      const nameVal = n.value.trim();
      const phoneVal = phones[idx].value.trim();
      if (nameVal && phoneVal) {
        newContacts.push({ name: nameVal, phone: phoneVal });
      }
    });

    store.setEmergencyContacts(newContacts);
    store.setMedicalNote(note);
    store.state.shareLiveLocation = shareLoc;
    store.saveState();

    alert('✅ Emergency contacts and medical note saved successfully!');
  });

  testBtn?.addEventListener('click', () => {
    triggerSosWorkflow();
  });
}
