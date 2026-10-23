/**
 * YatraLocal Safety SOS Setup & Health Profile Page
 * 
 * Allows travellers to manage:
 * 1. Personal Traveller Identity (Name, Age, Phone)
 * 2. Dynamic Emergency Contacts (Add, Remove, Set Primary, Relationship dropdown)
 * 3. Comprehensive Health Details (Blood group, Chronic conditions, Allergies, Daily medications, Mobility, Doctor contact)
 * 4. Critical First-Aid Note
 * 5. Live Geolocation Toggle
 * 6. Live Emergency Card Preview & SOS Simulation
 */

import { store } from '../js/store.js';
import { triggerSosWorkflow } from '../js/sos.js';

const CHRONIC_CONDITIONS_LIST = [
  'Hypertension (High BP)',
  'Diabetes',
  'Asthma / Respiratory',
  'Heart Condition',
  'Epilepsy / Seizures',
  'Arthritis / Joint Pain',
  'Thyroid',
  'None'
];

export function renderSos() {
  const state = store.get();
  const profile = state.userProfile || { name: 'Ramesh Sharma', age: 62, gender: 'Male', phone: '+91 98765 43210' };
  const contacts = (state.emergencyContacts && state.emergencyContacts.length > 0)
    ? state.emergencyContacts
    : [
        { name: 'Dr. Ramesh Sharma', relationship: 'Brother', phone: '+91 98765 43210', isPrimary: true },
        { name: 'Ananya Sharma', relationship: 'Daughter', phone: '+91 91234 56789', isPrimary: false }
      ];
  const health = state.healthDetails || {
    bloodGroup: 'O+',
    conditions: ['Hypertension (High BP)', 'Arthritis / Joint Pain'],
    allergies: 'Penicillin',
    medications: 'Amlodipine 5mg morning',
    mobility: 'Cannot climb steep stairs; requires flat ground drop-off',
    doctorName: 'Dr. K. Patel',
    doctorPhone: '+91 98765 11111',
    criticalNotes: state.medicalNote || 'Mild hypertension; carrying prescribed tablets in backpack front pocket.'
  };

  const selectedConditions = new Set(health.conditions || []);

  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 80px; max-width: 820px;">
      <!-- Page Header -->
      <div style="text-align: center; margin-bottom: var(--space-8);">
        <div style="font-size: 3rem; margin-bottom: 8px;">🛡️</div>
        <span class="badge badge-simulated" style="margin-bottom: 8px;">Safety First &bull; 24x7 Traveler Guard</span>
        <h1>Emergency Contacts & Health Profile</h1>
        <p style="color: var(--color-text-secondary); max-width: 620px; margin: 0 auto;">
          Configure your trusted emergency contacts and critical health details. Stored privately on your device and instantly dispatched when SOS is triggered.
        </p>
      </div>

      <!-- Government National Emergency Numbers Quick Dial Row -->
      <div class="card" style="border: 2px solid #ef4444; background: #fff5f5; margin-bottom: var(--space-8); padding: var(--space-6);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
          <h3 style="color: #b91c1c; margin: 0; font-size: 1.15rem;">
            🚨 Pan-India Official Helplines (Direct Tap to Call)
          </h3>
          <span class="badge" style="background: #b91c1c; color: #fff; font-size: 10px;">Free &bull; 24x7</span>
        </div>
        <p style="font-size: var(--text-xs); color: #7f1d1d; margin-bottom: 14px;">
          Direct government emergency services available pan-India without internet:
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

      <!-- Main SOS Configuration Form -->
      <form id="sos-master-form" novalidate>
        
        <!-- Section 1: Traveller Personal Identity -->
        <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <span style="font-size: 1.6rem;">👤</span>
            <div>
              <h3 style="margin: 0; font-size: 1.2rem;">Traveller Profile</h3>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                Used to identify the traveller in emergency SMS, WhatsApp alerts, and live tracking view.
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="user-full-name">Full Name <span style="color: var(--color-danger);">*</span></label>
              <input type="text" id="user-full-name" class="input-control" value="${profile.name || ''}" placeholder="e.g. Ramesh Sharma" required>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="user-phone">Mobile Phone <span style="color: var(--color-danger);">*</span></label>
              <input type="tel" id="user-phone" class="input-control" value="${profile.phone || ''}" placeholder="+91 98765 43210" required>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="user-age">Age &bull; Gender</label>
              <div style="display: flex; gap: 8px;">
                <input type="number" id="user-age" class="input-control" value="${profile.age || 60}" min="1" max="110" style="width: 80px;" placeholder="Age">
                <select id="user-gender" class="select-control">
                  <option value="Male" ${profile.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option value="Female" ${profile.gender === 'Female' ? 'selected' : ''}>Female</option>
                  <option value="Other" ${profile.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Emergency Contacts -->
        <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.6rem;">👨‍👩‍👧</span>
              <div>
                <h3 style="margin: 0; font-size: 1.2rem;">Emergency Contacts</h3>
                <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                  These contacts receive your live GPS tracking link and emergency call/message.
                </div>
              </div>
            </div>
            <button type="button" id="btn-add-contact" class="btn btn-sm btn-secondary" style="border-color: var(--color-primary); color: var(--color-primary);">
              ➕ Add Contact
            </button>
          </div>

          <div id="contacts-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
            <!-- Rendered dynamically -->
          </div>
          <div id="contacts-error" class="form-error">Please provide at least 1 valid emergency contact name and phone number.</div>
        </div>

        <!-- Section 3: Critical Health & Medical Details -->
        <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6); border-left: 5px solid #0d5c58;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <span style="font-size: 1.6rem;">🩺</span>
            <div>
              <h3 style="margin: 0; font-size: 1.2rem;">Critical Health & Medical Profile</h3>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                Equips first responders, local doctors, and family with immediate life-saving health context.
              </div>
            </div>
          </div>

          <!-- Blood Group & Primary Doctor Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="health-blood-group">
                🩸 Blood Group
              </label>
              <select id="health-blood-group" class="select-control">
                <option value="O+" ${health.bloodGroup === 'O+' ? 'selected' : ''}>O+ (Positive)</option>
                <option value="O-" ${health.bloodGroup === 'O-' ? 'selected' : ''}>O- (Negative)</option>
                <option value="A+" ${health.bloodGroup === 'A+' ? 'selected' : ''}>A+ (Positive)</option>
                <option value="A-" ${health.bloodGroup === 'A-' ? 'selected' : ''}>A- (Negative)</option>
                <option value="B+" ${health.bloodGroup === 'B+' ? 'selected' : ''}>B+ (Positive)</option>
                <option value="B-" ${health.bloodGroup === 'B-' ? 'selected' : ''}>B- (Negative)</option>
                <option value="AB+" ${health.bloodGroup === 'AB+' ? 'selected' : ''}>AB+ (Positive)</option>
                <option value="AB-" ${health.bloodGroup === 'AB-' ? 'selected' : ''}>AB- (Negative)</option>
                <option value="Unknown" ${health.bloodGroup === 'Unknown' ? 'selected' : ''}>Unknown / Not Tested</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="health-doctor-name">
                👨‍⚕️ Family Doctor / Physician Name
              </label>
              <input type="text" id="health-doctor-name" class="input-control" value="${health.doctorName || ''}" placeholder="e.g. Dr. K. Patel">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="health-doctor-phone">
                📞 Doctor Emergency Phone
              </label>
              <input type="tel" id="health-doctor-phone" class="input-control" value="${health.doctorPhone || ''}" placeholder="e.g. +91 98765 11111">
            </div>
          </div>

          <!-- Chronic Illnesses / Conditions Multi-select Chips -->
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label">
              Known Medical Conditions &bull; Chronic Illnesses <span style="font-weight: normal; color: var(--color-text-muted);">(Select all that apply)</span>
            </label>
            <div class="chip-grid" id="condition-chips-group">
              ${CHRONIC_CONDITIONS_LIST.map(cond => {
                const isSelected = selectedConditions.has(cond);
                return `
                  <button type="button" class="chip-btn ${isSelected ? 'selected' : ''}" data-condition="${cond}">
                    ${isSelected ? '✓ ' : '+ '} ${cond}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Severe Allergies & Medications Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="health-allergies">
                ⚠️ Severe Drug & Food Allergies
              </label>
              <input type="text" id="health-allergies" class="input-control" value="${health.allergies || ''}" placeholder="e.g. Penicillin, Peanuts, Sulfa, Dust, None">
              <div class="form-hint">Crucial for emergency clinics before administering injections.</div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="health-medications">
                💊 Regular Daily Medications & Dosages
              </label>
              <input type="text" id="health-medications" class="input-control" value="${health.medications || ''}" placeholder="e.g. Amlodipine 5mg morning, Insulin before dinner">
              <div class="form-hint">Medicines you carry and take regularly.</div>
            </div>
          </div>

          <!-- Mobility & Senior Accessibility Needs -->
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" for="health-mobility">
              ♿ Mobility Assistance & Physical Limitations
            </label>
            <input type="text" id="health-mobility" class="input-control" value="${health.mobility || ''}" placeholder="e.g. Wheelchair user, walking stick, cannot climb steep stairs, requires ground floor room">
          </div>

          <!-- Critical Emergency First-Aid Instructions / Note -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="health-critical-notes">
              📝 Critical Emergency Instructions / Bag Location
            </label>
            <textarea id="health-critical-notes" class="textarea-control" rows="2" placeholder="e.g. Tablets in front backpack pocket. If dizzy, make sit down and give sweet water.">${health.criticalNotes || ''}</textarea>
            <div class="form-hint">Directly sent in the emergency SMS & live family tracking screen.</div>
          </div>
        </div>

        <!-- Section 4: Live Geolocation Sharing Permission -->
        <div class="card" style="padding: var(--space-4) var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6); background: var(--color-surface-subtle); border: 1px solid var(--color-border);">
          <label class="checkbox-label" style="margin-bottom: 0;">
            <input type="checkbox" id="sos-location-check" ${state.shareLiveLocation ? 'checked' : ''} style="width: 20px; height: 20px;">
            <div>
              <strong style="color: var(--color-primary); font-size: var(--text-sm);">Share Live GPS Geolocation when SOS is triggered</strong>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted); line-height: 1.4;">
                Automatically tracks your location via browser GPS every 15 seconds during an active emergency. Zero background tracking happens when SOS is inactive.
              </div>
            </div>
          </label>
        </div>

        <!-- Section 5: Form Action Buttons -->
        <div style="display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: var(--space-8);">
          <button type="submit" id="btn-save-sos-profile" class="btn btn-primary btn-lg" style="flex: 2; min-width: 220px;">
            💾 Save Contacts & Health Profile
          </button>
          <button type="button" id="btn-test-sos" class="btn btn-danger btn-lg" style="flex: 1; min-width: 180px;">
            🚨 Test SOS Alert
          </button>
        </div>
      </form>

      <!-- Live Emergency Card Preview (How Responders & Family See It) -->
      <div class="card" style="border: 2px dashed var(--color-primary); background: #fbfdfc; padding: var(--space-6); margin-bottom: var(--space-8);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">👁️</span>
            <strong style="font-size: var(--text-sm); color: var(--color-primary);">LIVE EMERGENCY CARD PREVIEW:</strong>
          </div>
          <span class="badge badge-local">What First Responders See</span>
        </div>
        <div id="preview-health-card" style="background: #ffffff; border: 1px solid var(--color-border); border-radius: 12px; padding: 16px;">
          <!-- Dynamically updated -->
        </div>
      </div>

      <!-- Privacy & Compliance Statement -->
      <div class="card" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: var(--space-6);">
        <h4 style="font-size: 0.95rem; color: #334155; margin-bottom: 6px;">🔒 Privacy & On-Device Security:</h4>
        <p style="font-size: var(--text-xs); color: #64748b; margin: 0; line-height: 1.6;">
          Your health profile and contacts are stored strictly in your browser's private local storage. They are never sold or sent to advertisers. They are only dispatched to your designated tracking URL when you affirmatively hold the red SOS button. Tracking sessions automatically expire within 6 hours.
        </p>
      </div>
    </div>
  `;
}

export function initSosEvents() {
  const form = document.getElementById('sos-master-form');
  const contactsContainer = document.getElementById('contacts-list');
  const btnAddContact = document.getElementById('btn-add-contact');
  const testBtn = document.getElementById('btn-test-sos');
  const contactsError = document.getElementById('contacts-error');
  const conditionBtns = document.querySelectorAll('.chip-btn[data-condition]');
  const previewCard = document.getElementById('preview-health-card');

  const state = store.get();
  let contactsList = (state.emergencyContacts && state.emergencyContacts.length > 0)
    ? [...state.emergencyContacts]
    : [
        { name: 'Dr. Ramesh Sharma', relationship: 'Brother', phone: '+91 98765 43210', isPrimary: true },
        { name: 'Ananya Sharma', relationship: 'Daughter', phone: '+91 91234 56789', isPrimary: false }
      ];

  const selectedConditions = new Set(state.healthDetails?.conditions || ['Hypertension (High BP)', 'Arthritis / Joint Pain']);

  // Render contacts rows
  function renderContacts() {
    if (!contactsContainer) return;
    contactsContainer.innerHTML = contactsList.map((c, idx) => `
      <div class="contact-row" data-idx="${idx}" style="background: #ffffff; border: 1px solid var(--color-border); border-radius: 10px; padding: 12px 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) auto; gap: 10px; align-items: center;">
        <div>
          <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Name</label>
          <input type="text" class="input-control contact-name" value="${c.name || ''}" placeholder="Contact Name" style="font-size: 13px;">
        </div>

        <div>
          <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Relationship</label>
          <select class="select-control contact-relation" style="font-size: 13px;">
            ${['Spouse', 'Daughter', 'Son', 'Mother', 'Father', 'Brother', 'Sister', 'Friend', 'Doctor', 'Neighbor', 'Other'].map(r => `
              <option value="${r}" ${c.relationship === r ? 'selected' : ''}>${r}</option>
            `).join('')}
          </select>
        </div>

        <div>
          <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Phone Number</label>
          <input type="tel" class="input-control contact-phone" value="${c.phone || ''}" placeholder="+91 98765 00000" style="font-size: 13px;">
        </div>

        <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end; padding-top: 14px;">
          <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; color: ${c.isPrimary ? 'var(--color-primary)' : 'var(--color-text-muted)'}; font-weight: ${c.isPrimary ? '700' : 'normal'};">
            <input type="radio" name="primary-contact" class="contact-primary-radio" ${c.isPrimary ? 'checked' : ''}>
            ${c.isPrimary ? '★ Primary' : 'Set Primary'}
          </label>

          ${contactsList.length > 1 ? `
            <button type="button" class="btn btn-sm btn-ghost btn-remove-contact" title="Remove Contact" style="color: #b91c1c; padding: 4px 8px;">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Attach listeners inside rows
    contactsContainer.querySelectorAll('.contact-row').forEach(row => {
      const idx = Number(row.dataset.idx);

      row.querySelector('.contact-name')?.addEventListener('input', (e) => {
        contactsList[idx].name = e.target.value;
        updatePreview();
      });

      row.querySelector('.contact-relation')?.addEventListener('change', (e) => {
        contactsList[idx].relationship = e.target.value;
        updatePreview();
      });

      row.querySelector('.contact-phone')?.addEventListener('input', (e) => {
        contactsList[idx].phone = e.target.value;
        updatePreview();
      });

      row.querySelector('.contact-primary-radio')?.addEventListener('change', () => {
        contactsList.forEach((item, i) => { item.isPrimary = (i === idx); });
        renderContacts();
        updatePreview();
      });

      row.querySelector('.btn-remove-contact')?.addEventListener('click', () => {
        if (contactsList.length > 1) {
          contactsList.splice(idx, 1);
          if (!contactsList.some(item => item.isPrimary)) {
            contactsList[0].isPrimary = true;
          }
          renderContacts();
          updatePreview();
        }
      });
    });
  }

  // Add Contact Handler
  btnAddContact?.addEventListener('click', () => {
    if (contactsList.length >= 5) {
      alert('You can add up to 5 emergency contacts.');
      return;
    }
    contactsList.push({
      name: '',
      relationship: 'Friend',
      phone: '+91 ',
      isPrimary: false
    });
    renderContacts();
    updatePreview();
  });

  // Condition chips toggle
  conditionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const condition = btn.dataset.condition;
      if (condition === 'None') {
        selectedConditions.clear();
        selectedConditions.add('None');
        conditionBtns.forEach(b => {
          if (b.dataset.condition !== 'None') b.classList.remove('selected');
        });
        btn.classList.add('selected');
      } else {
        selectedConditions.delete('None');
        document.querySelector('.chip-btn[data-condition="None"]')?.classList.remove('selected');

        if (selectedConditions.has(condition)) {
          selectedConditions.delete(condition);
          btn.classList.remove('selected');
        } else {
          selectedConditions.add(condition);
          btn.classList.add('selected');
        }
      }
      updatePreview();
    });
  });

  // Live Preview Generator
  function updatePreview() {
    if (!previewCard) return;

    const nameVal = document.getElementById('user-full-name')?.value || 'Ramesh Sharma';
    const ageVal = document.getElementById('user-age')?.value || 62;
    const genderVal = document.getElementById('user-gender')?.value || 'Male';
    const bloodVal = document.getElementById('health-blood-group')?.value || 'O+';
    const allergiesVal = document.getElementById('health-allergies')?.value || 'None';
    const medsVal = document.getElementById('health-medications')?.value || 'None';
    const doctorVal = document.getElementById('health-doctor-name')?.value;
    const doctorPhoneVal = document.getElementById('health-doctor-phone')?.value;
    const criticalVal = document.getElementById('health-critical-notes')?.value || '';

    const primaryContact = contactsList.find(c => c.isPrimary) || contactsList[0] || { name: 'Emergency Contact', phone: '' };

    const conditionsArray = Array.from(selectedConditions).filter(c => c !== 'None');

    previewCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
        <div>
          <h4 style="margin: 0; font-size: 1.2rem; color: var(--color-primary);">${nameVal}</h4>
          <div style="font-size: 12px; color: var(--color-text-muted);">
            ${ageVal} yrs &bull; ${genderVal} &bull; Primary SOS Contact: <strong>${primaryContact.name} (${primaryContact.relationship || 'Emergency'}) - ${primaryContact.phone}</strong>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="background: #fee2e2; color: #b91c1c; border: 1.5px solid #f87171; font-weight: 800; font-size: 13px; padding: 4px 10px; border-radius: 8px;">
            🩸 Blood: ${bloodVal}
          </span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 12px;">
        <div>
          <strong style="color: #374151;">Conditions:</strong>
          <div style="color: #1f2937; margin-top: 2px;">
            ${conditionsArray.length > 0 ? conditionsArray.join(', ') : 'No chronic conditions reported'}
          </div>
        </div>

        <div>
          <strong style="color: #374151;">Allergies:</strong>
          <div style="color: #b91c1c; font-weight: 600; margin-top: 2px;">
            ${allergiesVal || 'None'}
          </div>
        </div>

        <div>
          <strong style="color: #374151;">Medications:</strong>
          <div style="color: #1f2937; margin-top: 2px;">
            ${medsVal || 'None'}
          </div>
        </div>

        ${doctorVal ? `
          <div>
            <strong style="color: #374151;">Physician:</strong>
            <div style="color: #1f2937; margin-top: 2px;">
              ${doctorVal} (${doctorPhoneVal || 'Phone on file'})
            </div>
          </div>
        ` : ''}
      </div>

      ${criticalVal ? `
        <div style="margin-top: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 10px; font-size: 12px; color: #92400e;">
          <strong>First-Aid Instruction:</strong> "${criticalVal}"
        </div>
      ` : ''}
    `;
  }

  // Attach live preview updates to all inputs
  ['user-full-name', 'user-age', 'user-gender', 'health-blood-group', 'health-allergies', 'health-medications', 'health-doctor-name', 'health-doctor-phone', 'health-critical-notes'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePreview);
    document.getElementById(id)?.addEventListener('change', updatePreview);
  });

  renderContacts();
  updatePreview();

  // Master Form Submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('user-full-name')?.value.trim();
    const phone = document.getElementById('user-phone')?.value.trim();
    const age = Number(document.getElementById('user-age')?.value) || 60;
    const gender = document.getElementById('user-gender')?.value || 'Male';

    const validContacts = contactsList.filter(c => c.name.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      if (contactsError) contactsError.classList.add('visible');
      alert('Please provide at least 1 emergency contact with name and phone number.');
      return;
    }
    if (contactsError) contactsError.classList.remove('visible');

    const bloodGroup = document.getElementById('health-blood-group')?.value || 'Unknown';
    const doctorName = document.getElementById('health-doctor-name')?.value.trim() || '';
    const doctorPhone = document.getElementById('health-doctor-phone')?.value.trim() || '';
    const allergies = document.getElementById('health-allergies')?.value.trim() || '';
    const medications = document.getElementById('health-medications')?.value.trim() || '';
    const mobility = document.getElementById('health-mobility')?.value.trim() || '';
    const criticalNotes = document.getElementById('health-critical-notes')?.value.trim() || '';
    const shareLoc = document.getElementById('sos-location-check')?.checked ?? true;

    const userProfile = {
      name: fullName || 'Traveller',
      phone: phone || '',
      age,
      gender
    };

    const healthDetails = {
      bloodGroup,
      conditions: Array.from(selectedConditions).filter(c => c !== 'None'),
      allergies,
      medications,
      mobility,
      doctorName,
      doctorPhone,
      criticalNotes
    };

    // Save to centralized store
    store.setUserProfile(userProfile);
    store.setEmergencyContacts(validContacts);
    store.setHealthDetails(healthDetails);
    store.state.shareLiveLocation = shareLoc;
    store.saveState();

    alert('✅ Emergency contacts and health profile saved successfully to your device!');
  });

  // Test SOS Alert
  testBtn?.addEventListener('click', () => {
    triggerSosWorkflow();
  });
}
