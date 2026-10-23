/**
 * YatraLocal Place Detail View (Phase 17)
 * Route: #/place/<placeKey>
 * 
 * Displays:
 * 1. Place header with state, district, and curated vs OSM badge
 * 2. Wikipedia plain-text description & source link
 * 3. Interactive Leaflet map with place center & nearby pins
 * 4. Live Open-Meteo 7-day weather forecast
 * 5. Nearby attractions from Overpass API within 10 km
 * 6. Community Reviews & Feedback (Phase 15 integration)
 * 7. Action to plan trip to this destination
 */

import { getPlaceByKey, getWikipediaSummary, getNearbyAttractionsOverpass } from '../js/places.js';
import { getLiveWeather } from '../js/api.js';
import { calculateHaversineKm } from '../js/map.js';
import { renderReviewsSection } from '../js/reviews.js';
import { store } from '../js/store.js';

let currentPlace = null;
let placeMapInstance = null;

export function renderPlaceView(placeKey) {
  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 80px; max-width: 960px;">
      
      <!-- Skeleton Loading State -->
      <div id="place-loading-skeleton">
        <div class="weather-skeleton" style="height: 36px; width: 40%; margin-bottom: 12px;"></div>
        <div class="weather-skeleton" style="height: 20px; width: 25%; margin-bottom: 24px;"></div>
        <div class="weather-skeleton" style="height: 180px; border-radius: 16px; margin-bottom: 24px;"></div>
        <div class="weather-skeleton" style="height: 340px; border-radius: 16px;"></div>
      </div>

      <!-- Loaded Content Container -->
      <div id="place-content" style="display: none;">
        
        <!-- Header Bar -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: var(--space-6);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
              <span id="place-source-badge" class="badge"></span>
              <span id="place-location-badge" class="badge badge-local"></span>
            </div>
            <h1 id="place-title" style="margin: 0; font-size: clamp(2rem, 4vw, 2.8rem);"></h1>
            <p id="place-subtitle" style="margin: 4px 0 0 0; color: var(--color-text-secondary); font-size: var(--text-sm);"></p>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="btn-plan-this-place" class="btn btn-primary btn-lg" style="box-shadow: 0 4px 14px rgba(13, 92, 88, 0.3);">
              ✨ Plan Trip Here
            </button>
            <a href="#/plan" class="btn btn-secondary btn-lg">
              &larr; Back to Planner
            </a>
          </div>
        </div>

        <!-- Wikipedia / Encyclopedic Overview Card -->
        <div class="card" style="margin-bottom: var(--space-6); padding: var(--space-6); border-radius: var(--radius-lg);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">📖</span>
              <strong style="color: var(--color-primary); font-size: var(--text-sm);">ABOUT THIS DESTINATION:</strong>
            </div>
            <a id="wiki-source-link" href="#" target="_blank" rel="noopener" style="font-size: 11px; color: var(--color-text-muted); text-decoration: underline;">
              Source: Wikipedia
            </a>
          </div>
          <div id="place-wiki-container" style="display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap;">
            <p id="place-wiki-text" style="margin: 0; font-size: var(--text-base); color: var(--color-text); line-height: 1.6; flex: 1; min-width: 280px;">
              Loading verified encyclopedic description...
            </p>
          </div>
        </div>

        <!-- Live Weather Forecast & Travel Advisory -->
        <div id="place-weather-mount" style="margin-bottom: var(--space-6);"></div>

        <!-- Interactive Leaflet Map with Nearby Sightseeing Pins -->
        <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-6); border-radius: var(--radius-lg);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
            <strong style="font-size: var(--text-sm); color: var(--color-text-main); display: flex; align-items: center; gap: 6px;">
              🗺️ Interactive Destination & Nearby Attractions Map
            </strong>
            <span style="font-size: 11px; color: var(--color-text-muted);">
              &copy; OpenStreetMap contributors
            </span>
          </div>
          <div id="place-map" style="height: 380px; width: 100%; border-radius: var(--radius-md); border: 1px solid var(--color-border);"></div>
        </div>

        <!-- Nearby Sightseeing & Highlights (from Overpass API) -->
        <div class="card" style="margin-bottom: var(--space-8); padding: var(--space-6); border-radius: var(--radius-lg);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <div>
              <h3 style="margin: 0; font-size: 1.25rem;">📍 Nearby Things to See (Within 10 km)</h3>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
                Real-world heritage spots, viewpoints, and natural monuments fetched from OpenStreetMap:
              </div>
            </div>
            <span id="nearby-count-badge" class="badge badge-local">0 Spots</span>
          </div>

          <div id="nearby-attractions-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
            <div class="weather-skeleton" style="height: 70px;"></div>
            <div class="weather-skeleton" style="height: 70px;"></div>
          </div>
        </div>

        <!-- Community Reviews & Feedback Section (Phase 15 integration) -->
        <div id="place-reviews-mount"></div>
      </div>
    </div>
  `;
}

export async function initPlaceEvents(placeKey) {
  const loadingEl = document.getElementById('place-loading-skeleton');
  const contentEl = document.getElementById('place-content');
  if (!loadingEl || !contentEl) return;

  currentPlace = await getPlaceByKey(placeKey);

  if (!currentPlace) {
    loadingEl.innerHTML = `
      <div class="card" style="text-align: center; padding: 48px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🧭</div>
        <h2>Place Not Found</h2>
        <p style="color: var(--color-text-muted); margin-bottom: 20px;">
          We couldn't retrieve coordinates for "${placeKey}". Try searching for another Indian city or hill station.
        </p>
        <a href="#/plan" class="btn btn-primary">Go to Trip Planner</a>
      </div>
    `;
    return;
  }

  // Populate basic text
  const titleEl = document.getElementById('place-title');
  const subtitleEl = document.getElementById('place-subtitle');
  const srcBadgeEl = document.getElementById('place-source-badge');
  const locBadgeEl = document.getElementById('place-location-badge');

  if (titleEl) titleEl.textContent = currentPlace.name;
  if (subtitleEl) {
    subtitleEl.textContent = [currentPlace.district, currentPlace.state, 'India'].filter(Boolean).join(', ');
  }

  if (srcBadgeEl) {
    if (currentPlace.isCurated) {
      srcBadgeEl.className = 'badge badge-verified';
      srcBadgeEl.textContent = '✓ Verified Curated Destination';
    } else {
      srcBadgeEl.className = 'badge';
      srcBadgeEl.style.cssText = 'background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 700;';
      srcBadgeEl.textContent = '🌐 Community / OSM Data • Details may be incomplete';
    }
  }

  if (locBadgeEl) {
    locBadgeEl.textContent = currentPlace.state || 'India';
  }

  // Reveal main content
  loadingEl.style.display = 'none';
  contentEl.style.display = 'block';

  // 1. Fetch Wikipedia overview
  getWikipediaSummary(currentPlace.name).then(wiki => {
    const textEl = document.getElementById('place-wiki-text');
    const linkEl = document.getElementById('wiki-source-link');
    const containerEl = document.getElementById('place-wiki-container');

    if (wiki && wiki.extract) {
      if (textEl) textEl.textContent = wiki.extract;
      if (linkEl) {
        linkEl.href = wiki.sourceUrl;
        linkEl.textContent = 'Read more on Wikipedia ↗';
      }
      if (wiki.thumbnail && containerEl) {
        const img = document.createElement('img');
        img.src = wiki.thumbnail;
        img.alt = currentPlace.name;
        img.style.cssText = 'width: 140px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid var(--color-border);';
        containerEl.prepend(img);
      }
    } else {
      if (textEl) {
        textEl.textContent = `${currentPlace.name} is a scenic destination situated in ${currentPlace.district || currentPlace.state || 'India'}. Discover historic sites, cultural monuments, and offbeat trails using our interactive map.`;
      }
    }
  });

  // 2. Fetch Live Weather via Open-Meteo
  const weatherMount = document.getElementById('place-weather-mount');
  if (weatherMount) {
    getLiveWeather(currentPlace.lat, currentPlace.lng, currentPlace.id).then(weather => {
      if (weather && weather.available) {
        weatherMount.innerHTML = `
          <div class="card" style="padding: 16px; border-left: 5px solid var(--color-accent); border-radius: var(--radius-lg);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.8rem;">${weather.today.icon}</span>
                <div>
                  <strong style="font-size: 1.05rem;">Current Weather: ${weather.today.condition}</strong>
                  <div style="font-size: 12px; color: var(--color-text-muted);">
                    Temp: ${weather.today.tempMin}°C – ${weather.today.tempMax}°C &bull; Precipitation: ${weather.today.precipProb}% &bull; Wind: ${weather.today.windMax} km/h
                  </div>
                </div>
              </div>
              <span style="font-size: 11px; color: var(--color-text-muted);">${weather.attribution}</span>
            </div>

            ${weather.warnings.map(w => `
              <div style="background: #fff8f8; border: 1px solid #fad2cf; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #b91c1c; font-weight: 600; margin-top: 6px;">
                ${w.icon} ${w.text}
              </div>
            `).join('')}
          </div>
        `;
      }
    });
  }

  // 3. Initialize Leaflet Map
  const mapEl = document.getElementById('place-map');
  if (mapEl && typeof L !== 'undefined') {
    if (placeMapInstance) {
      placeMapInstance.remove();
      placeMapInstance = null;
    }

    placeMapInstance = L.map('place-map').setView([currentPlace.lat, currentPlace.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(placeMapInstance);

    // Primary place marker
    const mainIcon = L.divIcon({
      className: 'place-main-pin',
      html: `<div style="background: var(--color-primary); color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">📍</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    L.marker([currentPlace.lat, currentPlace.lng], { icon: mainIcon })
      .addTo(placeMapInstance)
      .bindPopup(`<strong>${currentPlace.name}</strong><br>${currentPlace.state || 'India'}`)
      .openPopup();
  }

  // 4. Fetch Nearby Overpass Attractions
  const nearbyGrid = document.getElementById('nearby-attractions-grid');
  const nearbyBadge = document.getElementById('nearby-count-badge');

  getNearbyAttractionsOverpass(currentPlace.lat, currentPlace.lng).then(attractions => {
    if (nearbyBadge) nearbyBadge.textContent = `${attractions.length} Spots`;

    if (nearbyGrid) {
      if (attractions.length === 0) {
        nearbyGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 16px; background: #faf8f5; border-radius: 8px; font-size: 13px; color: var(--color-text-muted); text-align: center;">
            No registered monuments found in OpenStreetMap within 10 km. Explore serene local paths on arrival.
          </div>
        `;
      } else {
        nearbyGrid.innerHTML = attractions.map(a => {
          const distKm = calculateHaversineKm(currentPlace.lat, currentPlace.lng, a.lat, a.lng);
          return `
            <div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: 10px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px; transition: transform 0.2s;">
              <span style="font-size: 1.5rem; line-height: 1;">${a.icon}</span>
              <div style="flex: 1;">
                <strong style="font-size: 13px; color: var(--color-text);">${a.name}</strong>
                <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px;">
                  ${a.category} &bull; 📍 ${distKm} km away
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Add pins to Leaflet map
        if (placeMapInstance && typeof L !== 'undefined') {
          const attractionGroup = L.featureGroup();
          attractions.forEach(a => {
            const smallIcon = L.divIcon({
              className: 'attraction-pin',
              html: `<div style="background:#d97706; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.2);">${a.icon}</div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            });

            const marker = L.marker([a.lat, a.lng], { icon: smallIcon })
              .bindPopup(`<strong>${a.name}</strong><br><small>${a.category}</small>`);
            attractionGroup.addLayer(marker);
          });
          attractionGroup.addTo(placeMapInstance);
        }
      }
    }
  });

  // 5. Mount Community Reviews for this place
  const reviewsMount = document.getElementById('place-reviews-mount');
  if (reviewsMount) {
    renderReviewsSection(reviewsMount, 'destination', placeKey);
  }

  // 6. Action button: Plan trip to this place
  document.getElementById('btn-plan-this-place')?.addEventListener('click', () => {
    // Set in store preferences
    store.setPreferences({
      destination: currentPlace.id || currentPlace.placeKey,
      selectedPlace: currentPlace
    });
    window.location.hash = '#/plan';
  });
}
