/**
 * YatraLocal Saral Mode (सरल मोड) Wizard & Results (Phase 5)
 * Simplified 5-step high-contrast, large-button wizard with Web Speech API voice readouts,
 * Hindi/English switch, and single-click booking for seniors & pilgrims.
 */

import { store } from '../js/store.js';
import { speakText, stopSpeech, initSpeechRecognition } from '../js/speech.js';
import { generateItinerary, fetchDestinations } from '../js/itinerary.js';
import { renderSaralReviewSummary } from '../js/reviews.js';
import { getSeason, getCurrentMonth } from '../js/season.js';

let step = 1; // 1 to 5, then 6 for results
let saralPrefs = {
  destination: 'varanasi',
  destName: 'Varanasi',
  days: 3,
  budget: 15000,
  budgetTier: 'Medium (₹15,000)',
  preference: 'Temples & Holy Shrines',
  mood: 'Spiritual/Pilgrimage'
};
let saralPlan = null;
let destinationsList = [];
let hostsData = { stays: [], guides: [] };

export function renderSaral() {
  const isHi = store.get().language === 'hi';

  return `
    <div class="container" style="padding-top: 24px; padding-bottom: 80px; max-width: 820px;">
      <!-- Saral Mode Header Banner -->
      <div class="saral-voice-toolbar">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.8rem;">👵</span>
          <div>
            <strong style="font-size: 1.15rem; color: #083c39;">
              ${isHi ? 'सरल मोड (Saral Mode)' : 'Saral Mode — Simple & Easy Travel'}
            </strong>
            <div style="font-size: 0.85rem; color: #4b5563;">
              ${isHi ? 'बड़े बटन और बोलकर मार्गदर्शन' : 'Big buttons, clear text & voice guidance'}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="btn-saral-read" class="saral-voice-btn" aria-label="Read screen aloud">
            🔊 ${isHi ? 'बोलकर सुनाएं' : 'Read Aloud'}
          </button>
          <button id="btn-saral-stop" class="saral-voice-btn" aria-label="Stop speech">
            ⏹ ${isHi ? 'आवाज़ रोकें' : 'Stop Voice'}
          </button>
          <button id="btn-saral-lang" class="saral-voice-btn" style="border-color: #d97706; color: #d97706;">
            🌐 ${isHi ? 'English' : 'हिंदी'}
          </button>
        </div>
      </div>

      <!-- Main Step Container -->
      <div id="saral-step-container">
        <!-- Rendered dynamically -->
      </div>

      <!-- Always-Visible Emergency / Family Assistance Strip -->
      <div style="margin-top: 32px; background: #fff8eb; border: 2px dashed #d97706; border-radius: 16px; padding: 18px 22px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.8rem;">👨‍👩‍👧</span>
          <div>
            <strong style="color: #92400e; font-size: 1.05rem;">
              ${isHi ? 'मदद चाहिए या परिवार से बात करनी है?' : 'Need help or want family to book for you?'}
            </strong>
            <div style="font-size: 0.9rem; color: #78350f;">
              ${isHi ? 'एक बटन दबाकर अपने परिवार से संपर्क करें।' : 'Tap to connect with your designated family contact.'}
            </div>
          </div>
        </div>
        <button id="btn-saral-call-family" class="btn btn-primary" style="background: #d97706; border-color: #b45309;">
          📞 ${isHi ? 'परिवार को कॉल करें' : 'Call Family Member'}
        </button>
      </div>
    </div>
  `;
}

export async function initSaralEvents() {
  // Ensure .saral class is on html
  store.setSaralMode(true);
  destinationsList = await fetchDestinations();

  try {
    const res = await fetch('/data/hosts.json');
    if (res.ok) hostsData = await res.json();
  } catch (e) {
    console.warn('[Saral] hosts.json error:', e);
  }

  document.getElementById('btn-saral-read')?.addEventListener('click', readCurrentStep);
  document.getElementById('btn-saral-stop')?.addEventListener('click', stopSpeech);

  document.getElementById('btn-saral-lang')?.addEventListener('click', () => {
    const next = store.get().language === 'hi' ? 'en' : 'hi';
    store.setLanguage(next);
    // Re-render
    const app = document.getElementById('app');
    if (app) app.innerHTML = renderSaral();
    initSaralEvents();
  });

  document.getElementById('btn-saral-call-family')?.addEventListener('click', () => {
    const contacts = store.get().emergencyContacts || [];
    const primary = contacts.find(c => c.isPrimary) || contacts[0] || { name: 'Family Contact', phone: '+91 98765 43210' };
    speakText(`Calling ${primary.name}`);
    window.location.href = `tel:${primary.phone}`;
  });

  renderStep();
}

async function renderStep() {
  const container = document.getElementById('saral-step-container');
  if (!container) return;

  const isHi = store.get().language === 'hi';

  if (step === 1) {
    container.innerHTML = `
      <div class="saral-wizard-card">
        <div style="font-size: 1rem; color: #0d5c58; font-weight: 700; margin-bottom: 8px;">
          ${isHi ? 'कदम 1 / 5' : 'Step 1 of 5'}
        </div>
        <h1>${isHi ? 'आप कहाँ जाना चाहते हैं?' : 'Where do you want to go?'}</h1>
        <p>${isHi ? 'नीचे दिए गए किसी भी पवित्र शहर या सुंदर स्थान को चुनें:' : 'Please choose one of the peaceful heritage or holy places below:'}</p>

        <div style="margin-bottom: 14px;">
          <button id="btn-voice-mic" class="saral-voice-btn" style="width: 100%; justify-content: center; min-height: 52px; background: #e8f5f4;">
            🎙️ ${isHi ? 'माइक दबाकर शहर का नाम बोलें' : 'Tap to speak destination name'}
          </button>
          <div id="mic-status" style="font-size: 0.9rem; color: #0d5c58; text-align: center; margin-top: 6px;"></div>
        </div>

        <div class="saral-option-grid">
          <div class="saral-choice-card ${saralPrefs.destination === 'varanasi' ? 'selected' : ''}" data-val="varanasi" data-name="Varanasi">
            <span class="saral-choice-icon">🪔</span>
            <div class="saral-choice-title">वाराणसी (Varanasi)</div>
            <div class="saral-choice-sub">${isHi ? 'पवित्र गंगा घाट व आरती' : 'Holy Ganga Ghats & Temples'}</div>
          </div>

          <div class="saral-choice-card ${saralPrefs.destination === 'manali' ? 'selected' : ''}" data-val="manali" data-name="Manali">
            <span class="saral-choice-icon">🏔️</span>
            <div class="saral-choice-title">मनाली (Manali)</div>
            <div class="saral-choice-sub">${isHi ? 'शांत पहाड़ और सेब के बगीचे' : 'Snow Peaks & Apple Orchards'}</div>
          </div>

          <div class="saral-choice-card ${saralPrefs.destination === 'rishikesh' ? 'selected' : ''}" data-val="rishikesh" data-name="Rishikesh">
            <span class="saral-choice-icon">🌿</span>
            <div class="saral-choice-title">ऋषिकेश (Rishikesh)</div>
            <div class="saral-choice-sub">${isHi ? 'योग, ध्यान व शांत नदियां' : 'Ashrams & Holy Riverbanks'}</div>
          </div>

          <div class="saral-choice-card ${saralPrefs.destination === 'jaipur' ? 'selected' : ''}" data-val="jaipur" data-name="Jaipur">
            <span class="saral-choice-icon">🏰</span>
            <div class="saral-choice-title">जयपुर (Jaipur)</div>
            <div class="saral-choice-sub">${isHi ? 'राजस्थानी महल व कला' : 'Royal Palaces & Handicrafts'}</div>
          </div>
        </div>

        <button id="btn-saral-next-1" class="btn btn-primary saral-action-btn" style="width: 100%;">
          ${isHi ? 'आगे बढ़ें &rarr;' : 'Next Step &rarr;'}
        </button>
      </div>
    `;

    // Voice recognition setup
    const micBtn = document.getElementById('btn-voice-mic');
    const micStatus = document.getElementById('mic-status');
    const recognition = initSpeechRecognition(
      (text) => {
        micStatus.textContent = `Heard: "${text}"`;
        const lower = text.toLowerCase();
        if (lower.includes('varanasi') || lower.includes('banaras') || lower.includes('kashi')) {
          setDestination('varanasi', 'Varanasi');
        } else if (lower.includes('manali') || lower.includes('himachal')) {
          setDestination('manali', 'Manali');
        } else if (lower.includes('rishikesh')) {
          setDestination('rishikesh', 'Rishikesh');
        } else if (lower.includes('jaipur')) {
          setDestination('jaipur', 'Jaipur');
        }
      },
      (err) => {
        micStatus.textContent = 'Voice input not detected, please tap a button.';
      }
    );

    micBtn?.addEventListener('click', () => {
      if (recognition) {
        micStatus.textContent = 'Listening... Speak destination name now.';
        try { recognition.start(); } catch (e) {}
      }
    });

    function setDestination(id, name) {
      saralPrefs.destination = id;
      saralPrefs.destName = name;
      speakText(isHi ? `आपने ${name} चुना है।` : `You selected ${name}.`);
      renderStep();
    }

    container.querySelectorAll('.saral-choice-card').forEach(c => {
      c.addEventListener('click', () => {
        setDestination(c.dataset.val, c.dataset.name);
      });
    });

    document.getElementById('btn-saral-next-1')?.addEventListener('click', () => {
      step = 2;
      renderStep();
      readCurrentStep();
    });

  } else if (step === 2) {
    container.innerHTML = `
      <div class="saral-wizard-card">
        <div style="font-size: 1rem; color: #0d5c58; font-weight: 700; margin-bottom: 8px;">
          ${isHi ? 'कदम 2 / 5' : 'Step 2 of 5'}
        </div>
        <h1>${isHi ? 'आप कितने दिन यात्रा करना चाहते हैं?' : 'How many days will you travel?'}</h1>
        <p>${isHi ? 'आरामदायक यात्रा के लिए दिन चुनें:' : 'Select your trip duration:'}</p>

        <div class="saral-option-grid">
          ${[
            { days: 1, label: isHi ? '1 दिन (1 Day)' : '1 Day', sub: isHi ? 'एक दिन का दर्शन' : 'Short Day Tour' },
            { days: 2, label: isHi ? '2 दिन (2 Days)' : '2 Days', sub: isHi ? 'सप्ताहांत यात्रा' : 'Weekend Stay' },
            { days: 3, label: isHi ? '3 दिन (3 Days)' : '3 Days', sub: isHi ? 'सबसे पसंदीदा आराम' : 'Most Recommended' },
            { days: 5, label: isHi ? '5 दिन (5 Days)' : '5 Days', sub: isHi ? 'गहरी आध्यात्मिक शांति' : 'Relaxed Immersion' }
          ].map(d => `
            <div class="saral-choice-card ${saralPrefs.days === d.days ? 'selected' : ''}" data-days="${d.days}">
              <span class="saral-choice-icon">🗓️</span>
              <div class="saral-choice-title">${d.label}</div>
              <div class="saral-choice-sub">${d.sub}</div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button id="btn-saral-back" class="btn btn-secondary saral-action-btn" style="flex: 1;">
            &larr; ${isHi ? 'पीछे' : 'Back'}
          </button>
          <button id="btn-saral-next-2" class="btn btn-primary saral-action-btn" style="flex: 2;">
            ${isHi ? 'आगे बढ़ें &rarr;' : 'Next Step &rarr;'}
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.saral-choice-card').forEach(c => {
      c.addEventListener('click', () => {
        saralPrefs.days = Number(c.dataset.days);
        speakText(isHi ? `आपने ${saralPrefs.days} दिन चुना है।` : `You selected ${saralPrefs.days} days.`);
        renderStep();
      });
    });

    document.getElementById('btn-saral-back')?.addEventListener('click', () => { step--; renderStep(); readCurrentStep(); });
    document.getElementById('btn-saral-next-2')?.addEventListener('click', () => { step = 3; renderStep(); readCurrentStep(); });

  } else if (step === 3) {
    container.innerHTML = `
      <div class="saral-wizard-card">
        <div style="font-size: 1rem; color: #0d5c58; font-weight: 700; margin-bottom: 8px;">
          ${isHi ? 'कदम 3 / 5' : 'Step 3 of 5'}
        </div>
        <h1>${isHi ? 'आपका अनुमानित खर्च (बजट) कितना है?' : 'What is your rough budget?'}</h1>
        <p>${isHi ? 'कोई छुपा खर्च नहीं — स्थानीय परिवारों को उचित आय:' : 'No hidden fees. Transparent local travel:'}</p>

        <div class="saral-option-grid">
          ${[
            { tier: 'Low', budget: 6000, label: isHi ? 'कम बजट (₹6,000 तक)' : 'Affordable (Up to ₹6,000)', sub: isHi ? 'सरल व साफ होमस्टे' : 'Clean pilgrim stays' },
            { tier: 'Medium', budget: 15000, label: isHi ? 'मध्यम बजट (₹15,000 तक)' : 'Comfort (Up to ₹15,000)', sub: isHi ? 'उत्तम पारिवारिक सुविधा' : 'Family rooms + guide' },
            { tier: 'High', budget: 30000, label: isHi ? 'उत्कृष्ट बजट (₹30,000 तक)' : 'Premium (Up to ₹30,000)', sub: isHi ? 'विरासत हवेली व पूर्ण सहायता' : 'Heritage cottage & car' }
          ].map(b => `
            <div class="saral-choice-card ${saralPrefs.budget === b.budget ? 'selected' : ''}" data-budget="${b.budget}" data-label="${b.label}">
              <span class="saral-choice-icon">💰</span>
              <div class="saral-choice-title">${b.label}</div>
              <div class="saral-choice-sub">${b.sub}</div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button id="btn-saral-back" class="btn btn-secondary saral-action-btn" style="flex: 1;">
            &larr; ${isHi ? 'पीछे' : 'Back'}
          </button>
          <button id="btn-saral-next-3" class="btn btn-primary saral-action-btn" style="flex: 2;">
            ${isHi ? 'आगे बढ़ें &rarr;' : 'Next Step &rarr;'}
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.saral-choice-card').forEach(c => {
      c.addEventListener('click', () => {
        saralPrefs.budget = Number(c.dataset.budget);
        saralPrefs.budgetTier = c.dataset.label;
        speakText(isHi ? `आपने चुना: ${saralPrefs.budgetTier}` : `You selected: ${saralPrefs.budgetTier}`);
        renderStep();
      });
    });

    document.getElementById('btn-saral-back')?.addEventListener('click', () => { step--; renderStep(); readCurrentStep(); });
    document.getElementById('btn-saral-next-3')?.addEventListener('click', () => { step = 4; renderStep(); readCurrentStep(); });

  } else if (step === 4) {
    container.innerHTML = `
      <div class="saral-wizard-card">
        <div style="font-size: 1rem; color: #0d5c58; font-weight: 700; margin-bottom: 8px;">
          ${isHi ? 'कदम 4 / 5' : 'Step 4 of 5'}
        </div>
        <h1>${isHi ? 'आपको क्या सबसे ज्यादा पसंद है?' : 'What do you prefer?'}</h1>
        <p>${isHi ? 'हम उसी के अनुसार बिना भीड़ वाली जगह चुनेंगे:' : 'We will curate uncrowded spots matching this:'}</p>

        <div class="saral-option-grid">
          ${[
            { mood: 'Spiritual/Pilgrimage', title: isHi ? 'मंदिर व आध्यात्मिक दर्शन' : 'Temples & Spiritual Shrines', icon: '🪔' },
            { mood: 'Nature', title: isHi ? 'प्रकृति, बगीचे व पहाड़' : 'Nature & Quiet Scenery', icon: '🌲' },
            { mood: 'Relaxed', title: isHi ? 'आराम, भजन व शांति' : 'Peaceful Rest & Sitting', icon: '🧘' },
            { mood: 'Foodie', title: isHi ? 'पारंपरिक भोजन व स्वाद' : 'Local Traditional Food', icon: '🍲' }
          ].map(p => `
            <div class="saral-choice-card ${saralPrefs.mood === p.mood ? 'selected' : ''}" data-mood="${p.mood}" data-title="${p.title}">
              <span class="saral-choice-icon">${p.icon}</span>
              <div class="saral-choice-title">${p.title}</div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button id="btn-saral-back" class="btn btn-secondary saral-action-btn" style="flex: 1;">
            &larr; ${isHi ? 'पीछे' : 'Back'}
          </button>
          <button id="btn-saral-next-4" class="btn btn-primary saral-action-btn" style="flex: 2;">
            ${isHi ? 'आगे बढ़ें &rarr;' : 'Next Step &rarr;'}
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.saral-choice-card').forEach(c => {
      c.addEventListener('click', () => {
        saralPrefs.mood = c.dataset.mood;
        saralPrefs.preference = c.dataset.title;
        speakText(isHi ? `आपने चुना: ${saralPrefs.preference}` : `You selected: ${saralPrefs.preference}`);
        renderStep();
      });
    });

    document.getElementById('btn-saral-back')?.addEventListener('click', () => { step--; renderStep(); readCurrentStep(); });
    document.getElementById('btn-saral-next-4')?.addEventListener('click', () => { step = 5; renderStep(); readCurrentStep(); });

  } else if (step === 5) {
    // Step 5: Review & Seasonal Advice (Phase 16)
    let seasonInfo = null;
    try {
      seasonInfo = await getSeason(saralPrefs.destination, getCurrentMonth());
    } catch (e) {
      console.warn('[Saral] Season fetch error:', e);
    }

    let seasonSentence = '';
    if (seasonInfo?.isOnSeason) {
      seasonSentence = isHi ? 'यह व्यस्त मौसम है। जल्दी बुक करें।' : 'This is a busy season. Book early.';
    } else if (seasonInfo?.isOffSeason) {
      seasonSentence = isHi ? 'यह शांत मौसम है। यात्रा के लिए अच्छा समय है।' : 'This is a quiet season. Good time to visit.';
    } else {
      seasonSentence = isHi ? 'यह सामान्य मौसम है। आरामदायक यात्रा।' : 'This is a moderate season. Comfortable travel.';
    }

    container.innerHTML = `
      <div class="saral-wizard-card">
        <div style="font-size: 1rem; color: #0d5c58; font-weight: 700; margin-bottom: 8px;">
          ${isHi ? 'कदम 5 / 5 &bull; समीक्षा' : 'Step 5 of 5 • Review'}
        </div>
        <h1>${isHi ? 'आपकी यात्रा की तैयारी' : 'Your Trip Summary'}</h1>
        <p>${isHi ? 'कृपया जांच लें, क्या सब कुछ सही है:' : 'Please confirm your choices:'}</p>

        <!-- Big Seasonal Sentence Card -->
        <div style="background: ${seasonInfo?.isOnSeason ? '#fff5f5' : seasonInfo?.isOffSeason ? '#f0fdf4' : '#fffbeb'}; border: 3px solid ${seasonInfo?.isOnSeason ? '#dc2626' : seasonInfo?.isOffSeason ? '#16a34a' : '#d97706'}; border-radius: 16px; padding: 18px 20px; margin: 16px 0; text-align: center;">
          <div style="font-size: 1.55rem; font-weight: 800; color: ${seasonInfo?.isOnSeason ? '#b91c1c' : seasonInfo?.isOffSeason ? '#15803d' : '#b45309'}; line-height: 1.3;">
            ${seasonSentence}
          </div>
          <div style="font-size: 0.9rem; color: #4b5563; margin-top: 6px;">
            ${isHi ? 'अनुमानित मौसमी सलाह (General Estimate)' : 'Seasonal Demand Advice (General Estimate)'}
          </div>
          <button type="button" class="btn btn-secondary saral-voice-btn" style="margin-top: 12px; display: inline-flex; align-items: center; gap: 6px;" id="btn-saral-read-season">
            🔊 ${isHi ? 'यह सलाह बोलकर सुनें' : 'Read Aloud This Advice'}
          </button>
        </div>

        <div style="background: #f7faf9; border: 2px solid #0d5c58; border-radius: 16px; padding: 20px; margin: 20px 0; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 1.25rem;">📍 <strong>${isHi ? 'स्थान:' : 'Destination:'}</strong> ${saralPrefs.destName}</div>
          <div style="font-size: 1.25rem;">🗓️ <strong>${isHi ? 'दिन:' : 'Duration:'}</strong> ${saralPrefs.days} ${isHi ? 'दिन' : 'Days'}</div>
          <div style="font-size: 1.25rem;">💰 <strong>${isHi ? 'बजट:' : 'Budget:'}</strong> ₹${saralPrefs.budget.toLocaleString('en-IN')}</div>
          <div style="font-size: 1.25rem;">❤️ <strong>${isHi ? 'पसंद:' : 'Preference:'}</strong> ${saralPrefs.preference}</div>
          <div style="font-size: 1.15rem; color: #15803d; font-weight: 700;">
            ✓ ${isHi ? 'वरिष्ठ नागरिक गति (कम चलना, कोई सीढ़ियां नहीं)' : 'Senior-friendly pace (minimal walking, gentle slopes)'}
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button id="btn-saral-back" class="btn btn-secondary saral-action-btn" style="flex: 1;">
            &larr; ${isHi ? 'बदलें' : 'Change'}
          </button>
          <button id="btn-saral-make-plan" class="btn btn-primary saral-action-btn" style="flex: 2; font-size: 1.35rem;">
            ⚡ ${isHi ? 'यात्रा योजना बनाएं' : 'Show Simple Plan &rarr;'}
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-saral-read-season')?.addEventListener('click', () => {
      speakText(seasonSentence);
    });

    document.getElementById('btn-saral-back')?.addEventListener('click', () => { step--; renderStep(); readCurrentStep(); });
    document.getElementById('btn-saral-make-plan')?.addEventListener('click', async () => {
      // Build Plan
      const prefs = {
        destination: saralPrefs.destination,
        budget: saralPrefs.budget,
        days: saralPrefs.days,
        travellers: 2,
        moods: [saralPrefs.mood],
        accessibility: { seniorFriendly: true, minimalWalking: true }
      };
      store.setPreferences(prefs);
      saralPlan = generateItinerary(prefs, destinationsList);
      store.setItinerary(saralPlan);
      step = 6;
      renderStep();
      readCurrentStep();
    });

  } else if (step === 6) {
    // Step 6: Saral Results Page (Large collapsible day cards + ONE stay + ONE guide + ONE Book button)
    const dest = saralPlan?.destination;
    const stay = (hostsData.stays || []).find(s => s.destination === saralPrefs.destination && s.seniorFriendly) || hostsData.stays[0];
    const guide = (hostsData.guides || []).find(g => g.destination === saralPrefs.destination && g.seniorFriendly) || hostsData.guides[0];

    store.setSelectedStay(stay);
    store.setSelectedGuide(guide);

    let seasonInfo = null;
    try {
      seasonInfo = await getSeason(saralPrefs.destination, getCurrentMonth());
    } catch (e) {}

    let seasonSentence = '';
    if (seasonInfo?.isOnSeason) {
      seasonSentence = isHi ? 'यह व्यस्त मौसम है। जल्दी बुक करें।' : 'This is a busy season. Book early.';
    } else if (seasonInfo?.isOffSeason) {
      seasonSentence = isHi ? 'यह शांत मौसम है। यात्रा के लिए अच्छा समय है।' : 'This is a quiet season. Good time to visit.';
    } else {
      seasonSentence = isHi ? 'यह सामान्य मौसम है। आरामदायक यात्रा।' : 'This is a moderate season. Comfortable travel.';
    }

    container.innerHTML = `
      <div class="saral-wizard-card" style="max-width: 900px;">
        <div style="display: inline-block; background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 12px; font-weight: 700; margin-bottom: 12px;">
          ✓ ${isHi ? 'सरल यात्रा कार्यक्रम तैयार है' : 'Your Simple Accessible Plan is Ready'}
        </div>

        <h1 style="margin-bottom: 8px;">
          ${dest?.name} ${saralPrefs.days}-${isHi ? 'दिवसीय आरामदायक यात्रा' : 'Day Peaceful Journey'}
        </h1>

        <!-- One Big Seasonal Sentence Card -->
        <div style="background: ${seasonInfo?.isOnSeason ? '#fff5f5' : seasonInfo?.isOffSeason ? '#f0fdf4' : '#fffbeb'}; border: 3px solid ${seasonInfo?.isOnSeason ? '#dc2626' : seasonInfo?.isOffSeason ? '#16a34a' : '#d97706'}; border-radius: 14px; padding: 14px 18px; margin: 12px 0 16px 0; text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 800; color: ${seasonInfo?.isOnSeason ? '#b91c1c' : seasonInfo?.isOffSeason ? '#15803d' : '#b45309'};">
            ${seasonSentence}
          </div>
          <button type="button" class="btn btn-secondary saral-voice-btn" style="margin-top: 8px; font-size: 0.9rem;" id="btn-saral-read-season-res">
            🔊 ${isHi ? 'यह सलाह सुनें' : 'Read Aloud This Advice'}
          </button>
        </div>

        <p style="font-size: 1.15rem; color: #374151;">
          ${isHi 
            ? 'हर दिन केवल 1 या 2 शांत जगहें चुनी गई हैं जहां सीढ़ियां नहीं चढ़नी पड़तीं और भीड़ बहुत कम है।' 
            : 'Carefully paced with 1 gentle activity per day, zero steep stairs, and verified peaceful spots.'}
        </p>

        <!-- Large Day Cards -->
        <div style="display: flex; flex-direction: column; gap: 16px; margin: 24px 0;">
          ${saralPlan.days.map(d => `
            <div style="background: #ffffff; border: 3px solid #0d5c58; border-radius: 18px; padding: 20px;">
              <div style="font-size: 1.4rem; font-weight: 800; color: #083c39; margin-bottom: 8px;">
                ${d.title}
              </div>
              <p style="font-size: 1.1rem; color: #1f2937; margin-bottom: 8px;">
                ${d.activities[0]?.shortDescription}
              </p>
              <div style="font-size: 1rem; color: #d97706; font-weight: 700;">
                💡 ${d.localTip}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 1 Recommended Stay & 1 Guide -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin: 24px 0;">
          <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 16px; padding: 20px;">
            <div style="font-size: 1.25rem; font-weight: 800; color: #166534; margin-bottom: 4px;">
              🏡 ${isHi ? 'सुझाया गया पारिवारिक होमस्टे:' : 'Recommended Family Homestay:'} ${stay?.name}
            </div>
            <div style="font-size: 1.05rem; color: #374151;">
              ${stay?.shortStory}
            </div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #166534; margin-top: 8px;">
              ₹${stay?.pricePerNight} / ${isHi ? 'रात' : 'night'} &bull; ${isHi ? 'वरिष्ठ नागरिकों हेतु भूतल कमरा' : 'Ground floor senior access'}
            </div>
          </div>

          <div style="background: #eff6ff; border: 2px solid #93c5fd; border-radius: 16px; padding: 20px;">
            <div style="font-size: 1.25rem; font-weight: 800; color: #1e40af; margin-bottom: 4px;">
              🧭 ${isHi ? 'सुझाए गए स्थानीय मार्गदर्शक (गाइड):' : 'Recommended Local Guide:'} ${guide?.name}
            </div>
            <div style="font-size: 1.05rem; color: #374151;">
              ${guide?.shortStory}
            </div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #1e40af; margin-top: 8px;">
              ₹${guide?.pricePerDay} / ${isHi ? 'दिन' : 'day'} &bull; ${isHi ? 'धीमी गति से चलने वाले मार्गदर्शक' : 'Patient, slow-paced guide'}
            </div>
          </div>
        </div>

        <!-- Accessible Reviews & Feedback Summary (Phase 15) -->
        <div id="saral-reviews-mount"></div>

        <!-- Single Big Booking Action -->
        <div style="margin-top: 32px;">
          <a href="#/booking" class="btn btn-primary saral-action-btn" style="width: 100%; font-size: 1.5rem; min-height: 72px; background: #059669; border-color: #047857; box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);">
            ✅ ${isHi ? 'यह यात्रा बुक करें' : 'Book This Entire Trip Now'}
          </a>
        </div>
      </div>
    `;

    document.getElementById('btn-saral-read-season-res')?.addEventListener('click', () => {
      speakText(seasonSentence);
    });

    const saralRevMount = document.getElementById('saral-reviews-mount');
    if (saralRevMount) {
      renderSaralReviewSummary(saralRevMount, 'stay', stay?.id || 'stay-manali-deodar');
    }
  }
}

async function readCurrentStep() {
  const isHi = store.get().language === 'hi';
  let speech = '';

  if (step === 1) {
    speech = isHi ? 'कदम 1: आप कहाँ जाना चाहते हैं? वाराणसी, मनाली, ऋषिकेश या जयपुर?' : 'Step 1: Where do you want to go? Varanasi, Manali, Rishikesh, or Jaipur?';
  } else if (step === 2) {
    speech = isHi ? 'कदम 2: आप कितने दिन यात्रा करना चाहते हैं? 1 दिन, 2 दिन, 3 दिन या 5 दिन?' : 'Step 2: How many days will you travel? 1 day, 2 days, 3 days, or 5 days?';
  } else if (step === 3) {
    speech = isHi ? 'कदम 3: आपका बजट कितना है? कम, मध्यम या अधिक?' : 'Step 3: What is your rough budget? Low, Medium, or High?';
  } else if (step === 4) {
    speech = isHi ? 'कदम 4: आपको क्या पसंद है? मंदिर दर्शन, प्रकृति, आराम या स्वादिष्ट भोजन?' : 'Step 4: What do you prefer? Temples, Nature, Rest, or Food?';
  } else if (step === 5) {
    let seasonAdvice = '';
    try {
      const s = await getSeason(saralPrefs.destination, getCurrentMonth());
      if (s.isOnSeason) seasonAdvice = isHi ? ' यह व्यस्त मौसम है, जल्दी बुकिंग करें।' : ' This is a busy season, book early.';
      else if (s.isOffSeason) seasonAdvice = isHi ? ' यह शांत मौसम है, यात्रा के लिए अच्छा समय है।' : ' This is a quiet season, good time to visit.';
    } catch (e) {}
    speech = (isHi ? `समीक्षा: आपने ${saralPrefs.destName} के लिए ${saralPrefs.days} दिन की यात्रा चुनी है।` : `Review: You selected ${saralPrefs.destName} for ${saralPrefs.days} days.`) + seasonAdvice;
  } else if (step === 6) {
    let seasonAdvice = '';
    try {
      const s = await getSeason(saralPrefs.destination, getCurrentMonth());
      if (s.isOnSeason) seasonAdvice = isHi ? ' ध्यान दें: यह व्यस्त मौसम है, जल्दी बुकिंग करें।' : ' Note: This is a busy season, book early.';
      else if (s.isOffSeason) seasonAdvice = isHi ? ' यह शांत मौसम है, यात्रा के लिए अच्छा समय है।' : ' This is a quiet season, good time to visit.';
    } catch (e) {}
    speech = (isHi ? 'आपकी सरल यात्रा योजना तैयार है। नीचे बड़ा हरा बटन दबाकर इसे बुक करें।' : 'Your simple plan is ready. Press the big green button to book.') + seasonAdvice;
  }

  speakText(speech);
}
