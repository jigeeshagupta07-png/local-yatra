/**
 * YatraLocal 7-Day Weather Forecasting System
 * Real-time meteorological forecasts powered by Open-Meteo API.
 * Supports India-wide search, popular destination presets, and current GPS location.
 */

import { getLiveWeather, render7DayForecastGrid } from '../js/api.js';
import { searchPlacesIndia, getCuratedDestinations } from '../js/places.js';
import { store } from '../js/store.js';

const POPULAR_DESTINATIONS = [
  { name: 'Manali', state: 'Himachal Pradesh', lat: 32.2396, lng: 77.1887, key: 'manali' },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, key: 'varanasi' },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, key: 'jaipur' },
  { name: 'Rishikesh', state: 'Uttarakhand', lat: 30.0869, lng: 78.2676, key: 'rishikesh' },
  { name: 'Goa', state: 'Goa', lat: 15.2993, lng: 74.1240, key: 'goa' },
  { name: 'Munnar', state: 'Kerala', lat: 10.0889, lng: 77.0595, key: 'munnar' },
  { name: 'Leh Ladakh', state: 'Ladakh', lat: 34.1526, lng: 77.5771, key: 'leh' },
  { name: 'Kedarnath', state: 'Uttarakhand', lat: 30.7346, lng: 79.0669, key: 'kedarnath' },
  { name: 'Hampi', state: 'Karnataka', lat: 15.3350, lng: 76.4600, key: 'hampi' },
  { name: 'Ooty', state: 'Tamil Nadu', lat: 11.4102, lng: 76.6950, key: 'ooty' }
];

let activePlace = POPULAR_DESTINATIONS[0];
let searchDebounceTimer = null;

export function renderWeatherView() {
  const isHi = store.get().language === 'hi';

  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 80px; max-width: 900px;">
      
      <!-- Page Header -->
      <div style="text-align: center; margin-bottom: var(--space-8);">
        <div style="font-size: 3rem; margin-bottom: 8px;">🌦️</div>
        <span class="badge badge-local" style="margin-bottom: 8px;">
          ${isHi ? '7-दिवसीय लाइव मौसम पूर्वानुमान' : 'Live 7-Day Weather Forecast'}
        </span>
        <h1>${isHi ? 'भारत मौसम पूर्वानुमान व यात्रा परामर्श' : 'Pan-India 7-Day Weather Forecasting'}</h1>
        <p style="color: var(--color-text-secondary); max-width: 640px; margin: 0 auto; font-size: var(--text-base);">
          ${isHi 
            ? 'भारत के किसी भी शहर, हिल स्टेशन, तीर्थ या गांव का आगामी 7 दिनों का मौसम देखें और अपनी यात्रा की सुरक्षित योजना बनाएं।' 
            : 'Check accurate 7-day weather forecasts, rainfall chances, and practical clothing/travel advisories for any destination in India.'}
        </p>
      </div>

      <!-- Search & Location Controls Card -->
      <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6); box-shadow: var(--shadow-md);">
        
        <div style="position: relative; margin-bottom: 14px;">
          <label class="form-label" for="weather-search-input" style="font-weight: 700;">
            🔍 ${isHi ? 'भारत का कोई भी स्थान खोजें:' : 'Search ANY Place in India:'}
          </label>
          <div style="display: flex; gap: 8px;">
            <div style="position: relative; flex: 1;">
              <input 
                type="text" 
                id="weather-search-input" 
                class="input-control" 
                placeholder="${isHi ? 'उदा. मनाली, शिमला, केदारनाथ, मुन्नार, गोवा...' : 'e.g. Manali, Shimla, Kedarnath, Munnar, Goa...'}"
                autocomplete="off"
                style="padding-left: 36px;"
              >
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 16px;">📍</span>
              <ul id="weather-autocomplete-dropdown" class="place-autocomplete-list" style="display: none;"></ul>
            </div>
            <button type="button" id="btn-detect-location" class="btn btn-secondary" style="white-space: nowrap; font-size: 13px;" title="Use My Current GPS Location">
              🎯 ${isHi ? 'मेरी लोकेशन' : 'My Location'}
            </button>
          </div>
        </div>

        <!-- Quick Popular Destination Chips -->
        <div>
          <div style="font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 8px;">
            ${isHi ? 'लोकप्रिय पर्यटन स्थल:' : 'Popular Destinations:'}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="weather-quick-chips">
            ${POPULAR_DESTINATIONS.map(d => `
              <button type="button" class="btn-quick-chip ${d.key === activePlace.key ? 'active' : ''}" data-key="${d.key}">
                ${d.name}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Weather Content Mount (Today Hero + 7-Day Grid) -->
      <div id="weather-display-mount">
        <!-- Rendered dynamically -->
        <div class="card" style="padding: 40px; text-align: center;">
          <div class="weather-skeleton" style="height: 180px; width: 100%; margin-bottom: 20px;"></div>
          <div class="weather-skeleton" style="height: 120px; width: 100%;"></div>
        </div>
      </div>

      <!-- Open-Meteo & Community Disclaimer Footer -->
      <div style="margin-top: var(--space-8); text-align: center; font-size: 12px; color: var(--color-text-muted);">
        <p style="margin: 0;">
          ☀️ Weather data provided by <a href="https://open-meteo.com/" target="_blank" rel="noopener" style="color: var(--color-primary); text-decoration: underline;">Open-Meteo</a> under CC BY 4.0.
          Search powered by OpenStreetMap &amp; Photon. Zero API keys required.
        </p>
      </div>
    </div>
  `;
}

export async function initWeatherEvents() {
  const searchInput = document.getElementById('weather-search-input');
  const dropdown = document.getElementById('weather-autocomplete-dropdown');
  const locationBtn = document.getElementById('btn-detect-location');
  const chipsContainer = document.getElementById('weather-quick-chips');

  // Load initial default destination weather (Manali)
  loadPlaceWeather(activePlace);

  // Quick Chips click handler
  chipsContainer?.addEventListener('click', (e) => {
    const chip = e.target.closest('.btn-quick-chip');
    if (!chip) return;
    const key = chip.dataset.key;
    const place = POPULAR_DESTINATIONS.find(d => d.key === key);
    if (place) {
      activePlace = place;
      chipsContainer.querySelectorAll('.btn-quick-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (searchInput) searchInput.value = '';
      loadPlaceWeather(place);
    }
  });

  // Current Location Geolocation handler
  locationBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    locationBtn.textContent = '⏳ Locating...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationBtn.textContent = '🎯 My Location';
        const userLoc = {
          name: 'My Current Location',
          state: 'Live GPS',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          key: 'user-geo'
        };
        activePlace = userLoc;
        chipsContainer?.querySelectorAll('.btn-quick-chip').forEach(c => c.classList.remove('active'));
        if (searchInput) searchInput.value = 'My Current Location';
        loadPlaceWeather(userLoc);
      },
      (err) => {
        locationBtn.textContent = '🎯 My Location';
        alert('Could not access current location. Please ensure location permission is allowed.');
      },
      { timeout: 8000 }
    );
  });

  // Autocomplete search input
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchDebounceTimer);

    if (query.length < 2) {
      if (dropdown) dropdown.style.display = 'none';
      return;
    }

    searchDebounceTimer = setTimeout(async () => {
      try {
        const results = await searchPlacesIndia(query);
        renderDropdown(results);
      } catch (err) {
        console.warn('[Weather Search Error]', err);
      }
    }, 350);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.style.display = 'none';
    }
  });

  function renderDropdown(places) {
    if (!dropdown) return;
    if (!places || places.length === 0) {
      dropdown.innerHTML = `<li style="padding: 10px; color: var(--color-text-muted); font-size: 13px;">No matching places found.</li>`;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = places.slice(0, 7).map((p, idx) => `
      <li class="place-autocomplete-item" data-idx="${idx}" style="cursor: pointer; padding: 10px 14px; border-bottom: 1px solid var(--color-border-subtle); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: var(--color-text); font-size: 13px;">${p.name}</strong>
          <div style="font-size: 11px; color: var(--color-text-muted);">${p.district ? p.district + ', ' : ''}${p.state || 'India'}</div>
        </div>
        <span class="badge ${p.isCurated ? 'badge-verified' : 'badge-local'}" style="font-size: 10px;">
          ${p.isCurated ? 'Curated' : 'OSM'}
        </span>
      </li>
    `).join('');

    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.place-autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = Number(item.dataset.idx);
        const selected = places[idx];
        if (selected) {
          activePlace = {
            name: selected.name,
            state: selected.state || 'India',
            district: selected.district || '',
            lat: selected.lat,
            lng: selected.lng,
            key: selected.placeKey
          };
          if (searchInput) searchInput.value = `${selected.name}, ${selected.state || 'India'}`;
          dropdown.style.display = 'none';
          chipsContainer?.querySelectorAll('.btn-quick-chip').forEach(c => c.classList.remove('active'));
          loadPlaceWeather(activePlace);
        }
      });
    });
  }
}

/**
 * Fetch and render 7-day weather for the selected destination
 */
async function loadPlaceWeather(place) {
  const mount = document.getElementById('weather-display-mount');
  if (!mount) return;

  const isHi = store.get().language === 'hi';

  mount.innerHTML = `
    <div class="card" style="padding: 30px; text-align: center; border-radius: var(--radius-xl);">
      <div class="weather-skeleton" style="height: 140px; border-radius: 12px; margin-bottom: 16px;"></div>
      <div class="weather-skeleton" style="height: 100px; border-radius: 12px;"></div>
    </div>
  `;

  try {
    const weather = await getLiveWeather(place.lat, place.lng, place.key);

    if (!weather || !weather.available) {
      mount.innerHTML = `
        <div class="card" style="padding: 30px; text-align: center; border-radius: var(--radius-xl); border-left: 6px solid #d97706;">
          <div style="font-size: 2.5rem; margin-bottom: 10px;">⛅</div>
          <h3>${isHi ? 'मौसम डेटा अस्थायी रूप से उपलब्ध नहीं है' : 'Live Weather Currently Unavailable'}</h3>
          <p style="color: var(--color-text-muted); font-size: 13px; max-width: 480px; margin: 0 auto 16px auto;">
            ${weather.tip || 'Please check local hill station advisory boards or try again in a few moments.'}
          </p>
          <a href="#/plan" class="btn btn-primary btn-sm">Plan Trip Anyway</a>
        </div>
      `;
      return;
    }

    const today = weather.today || {};
    const forecast = weather.dailyForecast || [];
    const warnings = weather.warnings || [];

    // Practical Packing & Trip Advice based on forecast
    const packingTips = generatePackingTips(forecast, isHi);

    mount.innerHTML = `
      <!-- Destination Hero Card -->
      <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6); border-left: 6px solid var(--color-primary); box-shadow: var(--shadow-md);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 16px; margin-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="badge badge-local">${place.state || 'India'}</span>
              <span style="font-size: 11px; color: var(--color-text-muted);">
                GPS: ${place.lat.toFixed(3)}, ${place.lng.toFixed(3)}
              </span>
            </div>
            <h2 style="margin: 0; font-size: 1.8rem; color: var(--color-text);">
              ${place.name}
            </h2>
          </div>

          <div style="display: flex; gap: 8px;">
            <a href="#/plan" class="btn btn-primary btn-sm" id="btn-plan-for-place">
              🧭 ${isHi ? 'इस शहर की यात्रा प्लान करें' : 'Plan Trip Here'}
            </a>
          </div>
        </div>

        <!-- Today High-Contrast Highlight Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; align-items: center; margin-bottom: 16px;">
          
          <div style="display: flex; align-items: center; gap: 16px; background: #fdfaf6; padding: 14px 18px; border-radius: var(--radius-lg); border: 1.5px solid var(--color-border);">
            <div style="font-size: 3.5rem; line-height: 1;">${today.icon || '☀️'}</div>
            <div>
              <div style="font-size: 2.2rem; font-weight: 800; color: var(--color-text); line-height: 1.1;">
                ${today.tempMax}°C
              </div>
              <div style="font-size: 13px; font-weight: 700; color: var(--color-primary); margin-top: 2px;">
                ${today.condition || 'Clear'}
              </div>
              <div style="font-size: 12px; color: var(--color-text-muted);">
                ${isHi ? 'रात/न्यूनतम:' : 'Night / Low:'} ${today.tempMin}°C
              </div>
            </div>
          </div>

          <!-- Quick Metrics Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: #eff6ff; padding: 12px; border-radius: var(--radius-md); border: 1px solid #bfdbfe;">
              <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase;">
                💧 ${isHi ? 'बारिश की संभावना' : 'Rain Chance'}
              </div>
              <div style="font-size: 1.3rem; font-weight: 800; color: #1e3a8a; margin-top: 2px;">
                ${today.precipProb ?? 0}%
              </div>
            </div>

            <div style="background: #f8fafc; padding: 12px; border-radius: var(--radius-md); border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">
                💨 ${isHi ? 'हवा की गति' : 'Wind Speed'}
              </div>
              <div style="font-size: 1.3rem; font-weight: 800; color: #1e293b; margin-top: 2px;">
                ${today.windMax ?? 0} <span style="font-size: 11px; font-weight: normal;">km/h</span>
              </div>
            </div>

            <div style="background: #fdf4ff; padding: 12px; border-radius: var(--radius-md); border: 1px solid #f5d0fe;">
              <div style="font-size: 11px; font-weight: 700; color: #86198f; text-transform: uppercase;">
                🌡️ ${isHi ? 'तापमान विस्तार' : 'Daily Range'}
              </div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #701a75; margin-top: 2px;">
                ${today.tempMin}° – ${today.tempMax}°C
              </div>
            </div>

            <div style="background: #f0fdf4; padding: 12px; border-radius: var(--radius-md); border: 1px solid #bbf7d0;">
              <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase;">
                🚶 ${isHi ? 'घूमने की स्थिति' : 'Sightseeing'}
              </div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #14532d; margin-top: 2px;">
                ${(today.precipProb ?? 0) > 50 ? (isHi ? 'छाता रखें' : 'Carry Umbrella') : (isHi ? 'अनुकूल' : 'Comfortable')}
              </div>
            </div>
          </div>
        </div>

        <!-- Weather Advisories -->
        ${warnings.length > 0 ? `
          <div style="margin-top: 10px;">
            ${warnings.map(w => `
              <div style="display: flex; align-items: center; gap: 8px; background: ${w.level === 'warning' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${w.level === 'warning' ? '#fca5a5' : '#86efac'}; padding: 8px 12px; border-radius: var(--radius-md); font-size: 12px; font-weight: 600; color: ${w.level === 'warning' ? '#991b1b' : '#166534'}; margin-bottom: 6px;">
                <span style="font-size: 16px;">${w.icon}</span>
                <span>${w.text}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- 7-Day Day-by-Day Forecast Section -->
      <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); margin-bottom: var(--space-6);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem;">
              📅 ${isHi ? '7-दिवसीय विस्तृत मौसम पूर्वानुमान' : '7-Day Day-by-Day Forecast'}
            </h3>
            <div style="font-size: 12px; color: var(--color-text-muted);">
              ${isHi ? 'आगामी 7 दिनों के तापमान, धूप और बारिश का अनुमान' : 'Daily forecast, min/max temperatures, and rain probability'}
            </div>
          </div>
          <span class="badge badge-verified" style="font-size: 11px;">
            7 Days Open-Meteo
          </span>
        </div>

        <!-- 7-Day Cards Component -->
        ${render7DayForecastGrid(forecast, isHi)}
      </div>

      <!-- Packing & Travel Guidance Card -->
      <div class="card" style="padding: var(--space-6); border-radius: var(--radius-xl); background: #fcfbf9; border: 1.5px solid var(--color-border);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <span style="font-size: 1.5rem;">🧳</span>
          <h3 style="margin: 0; font-size: 1.15rem;">
            ${isHi ? '7-दिवसीय मौसम अनुसार पैकिंग व यात्रा सुझाव' : 'Packing & Travel Recommendations based on this Forecast'}
          </h3>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; font-size: 13px;">
          ${packingTips.map(tip => `
            <div style="background: #ffffff; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 12px 14px;">
              <div style="font-weight: 700; color: var(--color-primary); margin-bottom: 4px;">
                ${tip.icon} ${tip.title}
              </div>
              <div style="color: var(--color-text-secondary); line-height: 1.4;">
                ${tip.desc}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Hook up "Plan Trip Here" button to prefill planner
    document.getElementById('btn-plan-for-place')?.addEventListener('click', (e) => {
      e.preventDefault();
      store.state.preferences = {
        ...store.state.preferences,
        destination: place.key.startsWith('osm:') ? place.key : (place.key || 'manali'),
        selectedPlace: place
      };
      store.saveState();
      window.location.hash = '#/plan';
    });

  } catch (err) {
    console.error('[Weather Load Error]', err);
    mount.innerHTML = `
      <div class="card" style="padding: 24px; text-align: center;">
        <p style="color: var(--color-danger);">Could not load weather forecast. Please check your network connection.</p>
      </div>
    `;
  }
}

/**
 * Generate smart packing advice based on the 7-day temperature & precipitation ranges
 */
function generatePackingTips(forecast, isHi) {
  if (!forecast || forecast.length === 0) return [];

  const maxTemps = forecast.map(d => d.tempMax);
  const minTemps = forecast.map(d => d.tempMin);
  const rainChances = forecast.map(d => d.precipProb);

  const highestMax = Math.max(...maxTemps);
  const lowestMin = Math.min(...minTemps);
  const maxRain = Math.max(...rainChances);

  const tips = [];

  // Clothing tip
  if (lowestMin < 10) {
    tips.push({
      icon: '🧥',
      title: isHi ? 'गर्म ऊनी कपड़े अवश्य रखें' : 'Warm Woollens & Layers Required',
      desc: isHi 
        ? `न्यूनतम तापमान ${lowestMin}°C तक गिरने का अनुमान है। शाम और सुबह के लिए जैकेट, शॉल या थर्मल आवश्यक है।`
        : `Night temperatures drop to ${lowestMin}°C. Carry fleece jackets, thermal layers, and woollen caps.`
    });
  } else if (highestMax > 34) {
    tips.push({
      icon: '👕',
      title: isHi ? 'हल्के सूती कपड़े व धूप से बचाव' : 'Breathable Cottons & Sun Protection',
      desc: isHi 
        ? `दोपहर में तापमान ${highestMax}°C तक पहुंच सकता है। सनग्लासेस, सनस्क्रीन और पानी की बोतल साथ रखें।`
        : `Afternoon highs reach ${highestMax}°C. Wear light, breathable fabrics, sunglasses, and carry water.`
    });
  } else {
    tips.push({
      icon: '👕',
      title: isHi ? 'आरामदायक सामान्य परिधान' : 'Comfortable Casual Wear',
      desc: isHi 
        ? `मौसम सुहावना रहेगा (${lowestMin}°C – ${highestMax}°C)। सामान्य सूती कपड़े और हल्की चादर पर्याप्त होगी।`
        : `Pleasant weather throughout the week (${lowestMin}°C to ${highestMax}°C). Standard casual wear is ideal.`
    });
  }

  // Rain gear tip
  if (maxRain >= 40) {
    tips.push({
      icon: '☂️',
      title: isHi ? 'छाता या रेनकोट साथ रखें' : 'Carry Rain Gear & Waterproof Pouch',
      desc: isHi 
        ? `आगामी 7 दिनों में बारिश की संभावना ${maxRain}% तक है। वाटरप्रूफ बैग कवर और छाता साथ रखें।`
        : `Up to ${maxRain}% rain chance forecasted. Pack a compact umbrella and waterproof phone pouch.`
    });
  } else {
    tips.push({
      icon: '☀️',
      title: isHi ? 'साफ़ मौसम व उत्कृष्ट दृश्य' : 'Clear Skies for Sightseeing',
      desc: isHi 
        ? 'सप्ताह भर बारिश की संभावना बहुत कम है। खुले में घूमने और तस्वीरें लेने के लिए बेहतरीन मौसम।'
        : 'Low rain probability across all 7 days. Ideal conditions for outdoor monument visits and heritage walks.'
    });
  }

  // Footwear tip
  tips.push({
    icon: '👟',
    title: isHi ? 'आरामदायक चलने वाले जूते' : 'Sturdy Walking Shoes',
    desc: isHi 
      ? 'घाट्स, मंदिरों या ट्रेल्स पर सुरक्षित चलने के लिए बिना फिसलन वाले जूते पहनें।'
      : 'Cobblestone paths, steps, and nature trails require well-cushioned shoes with good traction.'
  });

  return tips;
}
