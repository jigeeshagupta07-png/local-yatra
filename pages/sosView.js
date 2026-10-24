/**
 * YatraLocal Safety SOS Setup & Health Emergency Profile Page
 * 
 * Features:
 * 1. Traveller Identity (Name, Age, Gender, Phone)
 * 2. Family Members & Emergency Contacts (Add Son, Daughter, Spouse, Brother, etc., Set Primary, Delete)
 * 3. Health Emergency Details (Blood Group, Chronic Conditions, Allergies, Daily Medications, Doctor, First-Aid Notes)
 * 4. Interactive Emergency Medical ID Card View & Print
 * 5. Live Geolocation Toggle
 * 6. One-tap Test Emergency SOS Alert
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
        <span class="badge badge-local" style="margin-bottom: 8px;">24x7 Traveler Guard</span>
        <h1>Family Contacts & Health Emergency Profile</h1>
        <p style="color: var(--color-text-secondary); max-width: 640px; margin: 0 auto; font-size: var(--text-base);">
          Add your trusted family members and critical medical details. Saved securely on your device and instantly dispatched with live GPS when SOS is activated.
        </p>
      </div>

      <!-- Save Success Toast / Banner Mount -->
      <div id="sos-save-success-banner" style="display: none; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: var(--space-6); color: #166534; font-weight: 600;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">✅</span>
            <span>Family contacts and health emergency profile saved successfully on your device!</span>
          </div>
          <button type="button" onclick="document.getElementById('sos-save-success-banner').style.display='none'" style="background:none; border:none; color:#166534; cursor:pointer; font-size:18px;">&times;</button>
        </div>
      </div>

      <!-- Pan-India National Emergency Helplines Card -->
      <div class="card" style="border: 2px solid #ef4444; background: #fff5f5; margin-bottom: var(--space-8); padding: var(--space-6); border-radius: var(--radius-xl);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
          <h3 style="color: #b91c1c; margin: 0; font-size: 1.15rem;">
            🚨 Official National Emergency Helplines (Direct Tap to Call)
          </h3>
          <span class="badge" style="background: #b91c1c; color: #fff; font-size: 10px;">Free &bull; 24x7 &bull; Pan-India</span>
        </div>
        <p style="font-size: var(--text-xs); color: #7f1d1d; margin-bottom: 14px;">
          Available pan-India on any mobile network even with zero internet balance:
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <a href="tel:112" class="btn btn-danger" style="flex: 1; min-width: 140px; font-weight: 700;">
            📞 112 (National Emergency)
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
                Identifies who is travelling in emergency alerts and live family tracking.
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="user-full-name">Full Name <span style="color: var(--color-danger);">*</span></label>
              <input type="text" id="user-full-name" class="input-control" value="${profile.name || ''}" placeholder="e.g. Ramesh Sharma" required>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="user-phone">Traveller Mobile Phone <span style="color: var(--color-danger);">*</span></label>
              <input type="tel" id="user-phone" class="input-control" value="${profile.phone || ''}" placeholder="+91 98765 43210" required>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="user-age">Age &bull; Gender</label>
              <div style="display: flex; gap: 8px;">
                <input type="number" id="user-age" class="input-control" value="${profile.age || 60}" min="1" max="110" style="width: 85px;" placeholder="Age">
                <select id="user-gender" class="select-control">
                  <option value="Male" ${profile.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option value="Female" ${profile.gender === 'Female' ? 'selected' : ''}>Female</option>
                  <option value="Other" ${profile.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Family Members & Emergency Contacts -->
        <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.6rem;">👨‍👩‍👧</span>
              <div>
                <h3 style="margin: 0; font-size: 1.2rem;">Family Members & Trusted Contacts</h3>
                <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                  Add up to 5 family members (Daughter, Son, Spouse, Brother, etc.). They will receive your live GPS tracking link and alerts.
                </div>
              </div>
            </div>
            <button type="button" id="btn-add-contact-custom" class="btn btn-sm btn-primary">
              ➕ Add Family Member
            </button>
          </div>

          <!-- Quick Family Presets Bar -->
          <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Quick Add:</span>
            <button type="button" class="btn btn-sm btn-secondary btn-quick-family" data-rel="Daughter">+ Daughter</button>
            <button type="button" class="btn btn-sm btn-secondary btn-quick-family" data-rel="Son">+ Son</button>
            <button type="button" class="btn btn-sm btn-secondary btn-quick-family" data-rel="Spouse">+ Spouse</button>
            <button type="button" class="btn btn-sm btn-secondary btn-quick-family" data-rel="Brother">+ Brother</button>
            <button type="button" class="btn btn-sm btn-secondary btn-quick-family" data-rel="Mother">+ Mother</button>
            <button type="button" class="btn btn-sm btn-secondary btn-quick-family" data-rel="Father">+ Father</button>
          </div>

          <!-- Contacts Container -->
          <div id="contacts-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
            <!-- Rendered dynamically -->
          </div>

          <div id="contacts-error" class="form-error">Please provide at least 1 valid family member or emergency contact name and phone number.</div>
        </div>

        <!-- Section 3: Critical Health & Medical Emergency Profile -->
        <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6); border-left: 6px solid #0d5c58;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <span style="font-size: 1.6rem;">🩺</span>
            <div>
              <h3 style="margin: 0; font-size: 1.2rem;">Medical Emergency & Health Profile</h3>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                Provides first responders, emergency doctors, and homestay hosts with life-saving health context.
              </div>
            </div>
          </div>

          <!-- Blood Group & Primary Doctor Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="health-blood-group">
                🩸 Blood Group
              </label>
              <select id="health-blood-group" class="select-control" style="font-weight: 700; color: #b91c1c;">
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
              Known Medical Conditions & Chronic Illnesses <span style="font-weight: normal; color: var(--color-text-muted);">(Select all that apply)</span>
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
              📝 Critical Emergency Instructions / Medicine Bag Location
            </label>
            <textarea id="health-critical-notes" class="textarea-control" rows="2" placeholder="e.g. Tablets in front backpack pocket. If dizzy, make sit down and give sweet water.">${health.criticalNotes || ''}</textarea>
            <div class="form-hint">Displayed prominently to first responders and sent in emergency alerts.</div>
          </div>
        </div>

        <!-- Section 4: Live Geolocation Sharing Permission -->
        <div class="card" style="padding: var(--space-4) var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6); background: var(--color-surface-subtle); border: 1px solid var(--color-border);">
          <label class="checkbox-label" style="margin-bottom: 0;">
            <input type="checkbox" id="sos-location-check" ${state.shareLiveLocation ? 'checked' : ''} style="width: 20px; height: 20px;">
            <div>
              <strong style="color: var(--color-primary); font-size: var(--text-sm);">Share Live GPS Geolocation when SOS is triggered</strong>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted); line-height: 1.4;">
                Automatically tracks your location via browser GPS during an active emergency so family can locate you.
              </div>
            </div>
          </label>
        </div>

        <!-- Section 5: Form Action Buttons -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: var(--space-8);">
          <button type="submit" id="btn-save-sos-profile" class="btn btn-primary btn-lg" style="flex: 2; min-width: 220px; box-shadow: 0 4px 14px rgba(13, 92, 88, 0.3);">
            💾 Save Family Contacts & Health Profile
          </button>
          <button type="button" id="btn-show-medical-card" class="btn btn-secondary btn-lg" style="flex: 1; min-width: 170px;">
            🪪 View Medical ID Card
          </button>
          <button type="button" id="btn-test-sos" class="btn btn-danger btn-lg" style="flex: 1; min-width: 160px;">
            🚨 Test SOS Alert
          </button>
        </div>
      </form>

      <!-- Live Emergency Card Preview (How Responders & Family See It) -->
      <div class="card" style="border: 2px dashed #0d5c58; background: #fbfdfc; padding: var(--space-6); margin-bottom: var(--space-8); border-radius: var(--radius-xl);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">👁️</span>
            <strong style="font-size: var(--text-sm); color: var(--color-primary);">LIVE EMERGENCY CARD PREVIEW:</strong>
          </div>
          <span class="badge badge-local">What First Responders & Family See</span>
        </div>
        <div id="preview-health-card" style="background: #ffffff; border: 1.5px solid var(--color-border); border-radius: 12px; padding: 18px;">
          <!-- Dynamically updated -->
        </div>
      </div>

      <!-- Medical ID Modal Container (Populated when user clicks "View Medical ID Card") -->
      <div id="medical-id-modal-container"></div>
    </div>
  `;
}

export function initSosEvents() {
  const form = document.getElementById('sos-master-form');
  const contactsContainer = document.getElementById('contacts-list');
  const btnAddCustom = document.getElementById('btn-add-contact-custom');
  const testBtn = document.getElementById('btn-test-sos');
  const showCardBtn = document.getElementById('btn-show-medical-card');
  const contactsError = document.getElementById('contacts-error');
  const conditionBtns = document.querySelectorAll('.chip-btn[data-condition]');
  const previewCard = document.getElementById('preview-health-card');
  const saveBanner = document.getElementById('sos-save-success-banner');

  const state = store.get();
  let contactsList = (state.emergencyContacts && state.emergencyContacts.length > 0)
    ? [...state.emergencyContacts]
    : [
        { name: 'Dr. Ramesh Sharma', relationship: 'Brother', phone: '+91 98765 43210', isPrimary: true },
        { name: 'Ananya Sharma', relationship: 'Daughter', phone: '+91 91234 56789', isPrimary: false }
      ];

  const selectedConditions = new Set(state.healthDetails?.conditions || ['Hypertension (High BP)', 'Arthritis / Joint Pain']);

  // Synchronize values from current DOM rows into contactsList to prevent loss on re-render
  function syncContactsFromDom() {
    if (!contactsContainer) return;
    contactsContainer.querySelectorAll('.contact-row').forEach(row => {
      const idx = Number(row.dataset.idx);
      if (contactsList[idx]) {
        const nameInput = row.querySelector('.contact-name');
        const relSelect = row.querySelector('.contact-relation');
        const phoneInput = row.querySelector('.contact-phone');
        if (nameInput) contactsList[idx].name = nameInput.value;
        if (relSelect) contactsList[idx].relationship = relSelect.value;
        if (phoneInput) contactsList[idx].phone = phoneInput.value;
      }
    });
  }

  // Render contacts rows
  function renderContacts() {
    if (!contactsContainer) return;
    contactsContainer.innerHTML = contactsList.map((c, idx) => `
      <div class="contact-row" data-idx="${idx}" style="background: #ffffff; border: 1.5px solid var(--color-border); border-radius: 12px; padding: 14px 16px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 4px;">
            👨‍👩‍👧 Family Contact #${idx + 1} &bull; <span class="badge badge-local" style="font-size: 10px;">${c.relationship || 'Emergency'}</span>
          </span>
          <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; color: ${c.isPrimary ? '#16a34a' : 'var(--color-text-muted)'}; font-weight: ${c.isPrimary ? '700' : 'normal'};">
            <input type="radio" name="primary-contact" class="contact-primary-radio" ${c.isPrimary ? 'checked' : ''}>
            ${c.isPrimary ? '★ Primary SOS Contact' : 'Set as Primary'}
          </label>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) auto; gap: 12px; align-items: center;">
          <div>
            <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Full Name <span style="color:var(--color-danger)">*</span></label>
            <input type="text" class="input-control contact-name" value="${c.name || ''}" placeholder="e.g. Pooja Sharma" style="font-size: 13px;" required>
          </div>

          <div>
            <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Relationship</label>
            <select class="select-control contact-relation" style="font-size: 13px;">
              ${['Daughter', 'Son', 'Spouse', 'Mother', 'Father', 'Brother', 'Sister', 'Doctor', 'Friend', 'Neighbor', 'Relative', 'Other'].map(r => `
                <option value="${r}" ${c.relationship === r ? 'selected' : ''}>${r}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Mobile Phone <span style="color:var(--color-danger)">*</span></label>
            <input type="tel" class="input-control contact-phone" value="${c.phone || ''}" placeholder="+91 98765 43210" style="font-size: 13px;" required>
          </div>

          <div style="padding-top: 18px;">
            ${contactsList.length > 1 ? `
              <button type="button" class="btn btn-sm btn-ghost btn-remove-contact" title="Remove Contact" style="color: #b91c1c; font-size: 14px; padding: 4px 8px;">
                🗑️
              </button>
            ` : ''}
          </div>
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
        syncContactsFromDom();
        contactsList[idx].relationship = e.target.value;
        renderContacts();
        updatePreview();
      });

      row.querySelector('.contact-phone')?.addEventListener('input', (e) => {
        contactsList[idx].phone = e.target.value;
        updatePreview();
      });

      row.querySelector('.contact-primary-radio')?.addEventListener('change', () => {
        syncContactsFromDom();
        contactsList.forEach((item, i) => { item.isPrimary = (i === idx); });
        renderContacts();
        updatePreview();
      });

      row.querySelector('.btn-remove-contact')?.addEventListener('click', () => {
        if (contactsList.length > 1) {
          syncContactsFromDom();
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

  // Quick Preset Add Family Member
  document.querySelectorAll('.btn-quick-family').forEach(btn => {
    btn.addEventListener('click', () => {
      if (contactsList.length >= 5) {
        alert('You can add up to 5 family and emergency contacts.');
        return;
      }
      syncContactsFromDom();
      const rel = btn.dataset.rel || 'Family Member';
      contactsList.push({
        name: '',
        relationship: rel,
        phone: '+91 ',
        isPrimary: contactsList.length === 0
      });
      renderContacts();
      updatePreview();
      
      // Focus on the newly added name field
      const names = contactsContainer.querySelectorAll('.contact-name');
      if (names.length > 0) {
        names[names.length - 1].focus();
      }
    });
  });

  // Custom Add Contact Button
  btnAddCustom?.addEventListener('click', () => {
    if (contactsList.length >= 5) {
      alert('You can add up to 5 family and emergency contacts.');
      return;
    }
    syncContactsFromDom();
    contactsList.push({
      name: '',
      relationship: 'Friend',
      phone: '+91 ',
      isPrimary: contactsList.length === 0
    });
    renderContacts();
    updatePreview();
    
    const names = contactsContainer.querySelectorAll('.contact-name');
    if (names.length > 0) {
      names[names.length - 1].focus();
    }
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

  // Live Emergency Card Preview Generator
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

    const primaryContact = contactsList.find(c => c.isPrimary) || contactsList[0] || { name: 'Family Contact', phone: '' };
    const conditionsArray = Array.from(selectedConditions).filter(c => c !== 'None');

    previewCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 12px;">
        <div>
          <h4 style="margin: 0; font-size: 1.25rem; color: var(--color-primary);">${nameVal}</h4>
          <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 3px;">
            ${ageVal} yrs &bull; ${genderVal} &bull; Primary Emergency Contact: <strong style="color: #b91c1c;">${primaryContact.name} (${primaryContact.relationship || 'Family'}) &bull; ${primaryContact.phone}</strong>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="background: #fee2e2; color: #b91c1c; border: 1.5px solid #f87171; font-weight: 800; font-size: 14px; padding: 4px 12px; border-radius: 8px;">
            🩸 Blood: ${bloodVal}
          </span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12px;">
        <div style="background: #faf8f5; padding: 8px 12px; border-radius: 8px;">
          <strong style="color: #374151;">Medical Conditions:</strong>
          <div style="color: #1f2937; margin-top: 3px; font-weight: 500;">
            ${conditionsArray.length > 0 ? conditionsArray.join(', ') : 'No chronic conditions reported'}
          </div>
        </div>

        <div style="background: #faf8f5; padding: 8px 12px; border-radius: 8px;">
          <strong style="color: #374151;">Severe Allergies:</strong>
          <div style="color: #b91c1c; font-weight: 600; margin-top: 3px;">
            ${allergiesVal || 'None reported'}
          </div>
        </div>

        <div style="background: #faf8f5; padding: 8px 12px; border-radius: 8px;">
          <strong style="color: #374151;">Regular Medications:</strong>
          <div style="color: #1f2937; margin-top: 3px; font-weight: 500;">
            ${medsVal || 'None reported'}
          </div>
        </div>

        ${doctorVal ? `
          <div style="background: #faf8f5; padding: 8px 12px; border-radius: 8px;">
            <strong style="color: #374151;">Emergency Physician:</strong>
            <div style="color: #1f2937; margin-top: 3px;">
              ${doctorVal} (${doctorPhoneVal || 'Phone on file'})
            </div>
          </div>
        ` : ''}
      </div>

      ${criticalVal ? `
        <div style="margin-top: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #92400e;">
          <strong>First-Aid / Medicine Location:</strong> "${criticalVal}"
        </div>
      ` : ''}
    `;
  }

  // Interactive Medical ID Card Popup
  showCardBtn?.addEventListener('click', () => {
    const modalContainer = document.getElementById('medical-id-modal-container');
    if (!modalContainer) return;

    const nameVal = document.getElementById('user-full-name')?.value || 'Ramesh Sharma';
    const ageVal = document.getElementById('user-age')?.value || 62;
    const genderVal = document.getElementById('user-gender')?.value || 'Male';
    const phoneVal = document.getElementById('user-phone')?.value || '+91 98765 43210';
    const bloodVal = document.getElementById('health-blood-group')?.value || 'O+';
    const allergiesVal = document.getElementById('health-allergies')?.value || 'None';
    const medsVal = document.getElementById('health-medications')?.value || 'None';
    const doctorVal = document.getElementById('health-doctor-name')?.value;
    const doctorPhoneVal = document.getElementById('health-doctor-phone')?.value;
    const criticalVal = document.getElementById('health-critical-notes')?.value || '';
    const conditionsArray = Array.from(selectedConditions).filter(c => c !== 'None');

    modalContainer.innerHTML = `
      <div class="modal-backdrop open" style="z-index: 100000; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px);">
        <div class="card" style="max-width: 520px; width: 90%; border: 3px solid #b91c1c; border-radius: 20px; padding: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.8rem;">🚨</span>
              <div>
                <h3 style="margin: 0; color: #b91c1c; font-size: 1.3rem;">EMERGENCY MEDICAL ID</h3>
                <div style="font-size: 11px; color: var(--color-text-muted);">YatraLocal Traveller Health Pass</div>
              </div>
            </div>
            <button type="button" id="btn-close-medical-id" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b;">&times;</button>
          </div>

          <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 1.3rem; font-weight: 800; color: #111827;">${nameVal}</div>
              <div style="font-size: 12px; color: #4b5563;">${ageVal} Years &bull; ${genderVal} &bull; ${phoneVal}</div>
            </div>
            <div style="background: #b91c1c; color: #fff; font-weight: 800; font-size: 16px; padding: 6px 14px; border-radius: 8px;">
              🩸 ${bloodVal}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; margin-bottom: 16px;">
            <div style="padding: 6px 10px; background: #f8fafc; border-radius: 6px;">
              <strong>Medical Conditions:</strong> ${conditionsArray.length > 0 ? conditionsArray.join(', ') : 'None reported'}
            </div>
            <div style="padding: 6px 10px; background: #f8fafc; border-radius: 6px;">
              <strong>Severe Allergies:</strong> <span style="color:#b91c1c; font-weight:700;">${allergiesVal || 'None'}</span>
            </div>
            <div style="padding: 6px 10px; background: #f8fafc; border-radius: 6px;">
              <strong>Current Medications:</strong> ${medsVal || 'None'}
            </div>
            ${doctorVal ? `
              <div style="padding: 6px 10px; background: #f8fafc; border-radius: 6px;">
                <strong>Physician / Doctor:</strong> ${doctorVal} (${doctorPhoneVal || 'No phone'})
              </div>
            ` : ''}
            ${criticalVal ? `
              <div style="padding: 8px 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; color: #92400e;">
                <strong>First-Aid Instructions:</strong> "${criticalVal}"
              </div>
            ` : ''}
          </div>

          <div style="margin-bottom: 16px;">
            <strong style="font-size: 12px; color: #374151;">Emergency Family Contacts to Call:</strong>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
              ${contactsList.map(c => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 10px; border-radius: 6px; font-size: 12px;">
                  <span><strong>${c.name}</strong> (${c.relationship}) &bull; ${c.phone} ${c.isPrimary ? '★' : ''}</span>
                  <a href="tel:${c.phone}" class="btn btn-sm btn-primary" style="font-size: 11px; padding: 2px 8px;">📞 Call</a>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="window.print()" style="flex: 1;">🖨️ Print Card</button>
            <button type="button" class="btn btn-primary" id="btn-done-medical-id" style="flex: 1;">Close</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-medical-id')?.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
    document.getElementById('btn-done-medical-id')?.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
  });

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
    syncContactsFromDom();

    const fullName = document.getElementById('user-full-name')?.value.trim();
    const phone = document.getElementById('user-phone')?.value.trim();
    const age = Number(document.getElementById('user-age')?.value) || 60;
    const gender = document.getElementById('user-gender')?.value || 'Male';

    const validContacts = contactsList.filter(c => c.name.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      if (contactsError) contactsError.classList.add('visible');
      alert('Please provide at least 1 family member or emergency contact with name and phone number.');
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

    // Show on-screen confirmation banner
    if (saveBanner) {
      saveBanner.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Test SOS Alert
  testBtn?.addEventListener('click', () => {
    triggerSosWorkflow();
  });
}
