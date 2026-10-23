/**
 * YatraLocal Stays & Guides Discovery (Phases 4 & 11)
 * Local-first discovery, Stays/Guides tabs, verified filter, Haversine distance,
 * off-season offer ribbons, modal drawer, and sticky booking bar.
 */

import { store } from '../js/store.js';
import { YatraMap, calculateHaversineKm } from '../js/map.js';
import { getReviewsForTarget, calculateRatingSummary, renderReviewsSection } from '../js/reviews.js';

let hostsData = { stays: [], guides: [] };
let activeTab = 'stays'; // 'stays' | 'guides'
let selectedStay = null;
let selectedGuide = null;
let currentFilters = {
  verifiedOnly: false,
  seniorOnly: false,
  maxPrice: 3000,
  sortBy: 'recommended'
};
let yatraStaysMap = null;
let isMapView = false;
let publishedOffers = [];

export function renderStaysView() {
  const destination = store.get().preferences.destination || 'manali';
  const destName = destination.charAt(0).toUpperCase() + destination.slice(1);

  return `
    <div class="container" style="padding-top: var(--space-6); padding-bottom: 120px;">
      <!-- Title & View Toggles -->
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: var(--space-6);">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge badge-local">Local-First Discovery</span>
            <span class="badge badge-simulated">Sample data for demo</span>
          </div>
          <h1 style="margin: 0; font-size: clamp(1.8rem, 4vw, 2.3rem);">
            Local Stays & Guides in ${destName}
          </h1>
          <p style="margin: 4px 0 0 0; color: var(--color-text-secondary); font-size: var(--text-sm);">
            Stay with local families and hire authentic heritage storytellers. 90% of payments go directly into the community.
          </p>
        </div>

        <div style="display: flex; gap: 8px;">
          <button id="btn-toggle-list" class="btn btn-sm btn-primary">📋 List View</button>
          <button id="btn-toggle-map" class="btn btn-sm btn-secondary">🗺️ Map View</button>
        </div>
      </div>

      <!-- Stays vs Guides Tabs -->
      <div class="tab-list">
        <button class="tab-btn active" id="tab-stays">
          🏡 Homestays & Small Inns (<span id="stays-count">0</span>)
        </button>
        <button class="tab-btn" id="tab-guides">
          🧭 Verified Local Guides (<span id="guides-count">0</span>)
        </button>
      </div>

      <!-- Filter Controls Row -->
      <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-6); background: #ffffff;">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
            <label class="checkbox-label" style="padding: 0; font-size: var(--text-sm);">
              <input type="checkbox" id="filter-verified" style="width: 16px; height: 16px;">
              <span>✓ Verified Only</span>
            </label>

            <label class="checkbox-label" style="padding: 0; font-size: var(--text-sm);">
              <input type="checkbox" id="filter-senior" style="width: 16px; height: 16px;">
              <span>♿ Senior-Friendly</span>
            </label>

            <div style="display: flex; align-items: center; gap: 6px; font-size: var(--text-sm);">
              <span>Max ₹:</span>
              <input type="number" id="filter-price" value="3000" min="500" max="10000" step="100" class="input-control" style="width: 90px; min-height: 32px; padding: 2px 6px; font-size: 13px;">
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; font-size: var(--text-sm);">
            <span>Sort by:</span>
            <select id="sort-select" class="select-control" style="width: auto; min-height: 34px; padding: 2px 8px; font-size: 13px;">
              <option value="recommended">🌟 Recommended (Local-First)</option>
              <option value="price-asc">₹ Price (Low to High)</option>
              <option value="rating-desc">★ Rating (Highest First)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Map Container (Hidden by default, shown when Map View clicked) -->
      <div id="stays-map-wrapper" class="map-wrapper" style="display: none; margin-bottom: var(--space-8);">
        <div id="stays-map" class="map-container"></div>
      </div>

      <!-- Cards Grid -->
      <div id="listings-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-6);">
        <!-- Loaded dynamically -->
      </div>

      <!-- Detail Modal / Drawer -->
      <div id="detail-modal-container"></div>

      <!-- Sticky Continue to Booking Bar -->
      <div id="sticky-booking-bar" style="position: fixed; bottom: 0; left: 0; right: 0; background: #ffffff; border-top: 2px solid var(--color-border); box-shadow: 0 -4px 15px rgba(0,0,0,0.08); z-index: 990; padding: var(--space-3) var(--space-4);">
        <div class="container" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3);">
          <div style="display: flex; flex-direction: column;">
            <div style="font-size: var(--text-sm); color: var(--color-text);">
              Selected: <strong id="selected-summary-stay">None</strong> &bull; Guide: <strong id="selected-summary-guide">None</strong>
            </div>
            <div style="font-size: var(--text-xs); color: var(--color-primary); font-weight: 600;">
              🤝 90% of booking fees flow directly to host families
            </div>
          </div>

          <button id="btn-proceed-booking" class="btn btn-primary btn-lg" style="box-shadow: 0 4px 12px rgba(13, 92, 88, 0.3);">
            Continue to Booking &rarr;
          </button>
        </div>
      </div>
    </div>
  `;
}

export async function initStaysEvents() {
  // Fetch hosts data
  try {
    const res = await fetch('/data/hosts.json');
    hostsData = await res.json();
  } catch (e) {
    console.error('[Stays] Failed to fetch hosts.json:', e);
  }

  // Fetch published owner offers from backend
  try {
    const resOffers = await fetch('/api/offers');
    if (resOffers.ok) {
      const data = await resOffers.json();
      publishedOffers = data.offers || [];
    }
  } catch (e) {
    console.warn('[Stays] Could not fetch active backend offers:', e);
  }

  selectedStay = store.get().selectedStay;
  selectedGuide = store.get().selectedGuide;
  updateStickySummary();

  const tabStays = document.getElementById('tab-stays');
  const tabGuides = document.getElementById('tab-guides');
  const filterVerified = document.getElementById('filter-verified');
  const filterSenior = document.getElementById('filter-senior');
  const filterPrice = document.getElementById('filter-price');
  const sortSelect = document.getElementById('sort-select');

  const btnList = document.getElementById('btn-toggle-list');
  const btnMap = document.getElementById('btn-toggle-map');
  const mapWrapper = document.getElementById('stays-map-wrapper');

  // Tab switching
  tabStays.addEventListener('click', () => {
    activeTab = 'stays';
    tabStays.classList.add('active');
    tabGuides.classList.remove('active');
    renderListings();
  });

  tabGuides.addEventListener('click', () => {
    activeTab = 'guides';
    tabGuides.classList.add('active');
    tabStays.classList.remove('active');
    renderListings();
  });

  // Filter handlers
  filterVerified.addEventListener('change', (e) => {
    currentFilters.verifiedOnly = e.target.checked;
    renderListings();
  });

  filterSenior.addEventListener('change', (e) => {
    currentFilters.seniorOnly = e.target.checked;
    renderListings();
  });

  filterPrice.addEventListener('input', (e) => {
    currentFilters.maxPrice = Number(e.target.value) || 10000;
    renderListings();
  });

  sortSelect.addEventListener('change', (e) => {
    currentFilters.sortBy = e.target.value;
    renderListings();
  });

  // Map view toggle
  btnMap.addEventListener('click', () => {
    isMapView = true;
    btnMap.className = 'btn btn-sm btn-primary';
    btnList.className = 'btn btn-sm btn-secondary';
    mapWrapper.style.display = 'block';

    const dest = store.get().preferences.destination || 'manali';
    const stays = (hostsData.stays || []).filter(s => s.destination === dest);

    if (!yatraStaysMap) {
      yatraStaysMap = new YatraMap('stays-map');
      yatraStaysMap.init([32.2396, 77.1887], 13);
    }
    yatraStaysMap.renderStays(stays, (stay) => openDetailModal(stay, 'stay'));
  });

  btnList.addEventListener('click', () => {
    isMapView = false;
    btnList.className = 'btn btn-sm btn-primary';
    btnMap.className = 'btn btn-sm btn-secondary';
    mapWrapper.style.display = 'none';
  });

  // Proceed booking
  document.getElementById('btn-proceed-booking')?.addEventListener('click', () => {
    if (!selectedStay) {
      alert('Please select a local homestay or inn to continue.');
      return;
    }
    window.location.hash = '#/booking';
  });

  renderListings();
}

function renderListings() {
  const container = document.getElementById('listings-grid');
  const staysCountEl = document.getElementById('stays-count');
  const guidesCountEl = document.getElementById('guides-count');
  if (!container) return;

  const destId = store.get().preferences.destination || 'manali';
  const allStays = (hostsData.stays || []).filter(s => s.destination === destId);
  const allGuides = (hostsData.guides || []).filter(g => g.destination === destId);

  if (staysCountEl) staysCountEl.textContent = allStays.length;
  if (guidesCountEl) guidesCountEl.textContent = allGuides.length;

  const rawList = activeTab === 'stays' ? allStays : allGuides;

  // Filter
  let filtered = rawList.filter(item => {
    const price = item.pricePerNight || item.pricePerDay || 0;
    if (price > currentFilters.maxPrice) return false;
    if (currentFilters.verifiedOnly && !item.verified) return false;
    if (currentFilters.seniorOnly && !item.seniorFriendly) return false;
    return true;
  });

  // Sort
  if (currentFilters.sortBy === 'price-asc') {
    filtered.sort((a, b) => (a.pricePerNight || a.pricePerDay) - (b.pricePerNight || b.pricePerDay));
  } else if (currentFilters.sortBy === 'rating-desc') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else {
    // Recommended: homestays first (support local family), verified first
    filtered.sort((a, b) => {
      const aWeight = (a.type === 'homestay' ? 2 : 1) + (a.verified ? 1 : 0);
      const bWeight = (b.type === 'homestay' ? 2 : 1) + (b.verified ? 1 : 0);
      return bWeight - aWeight;
    });
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <h3>No matches found</h3>
        <p style="font-size: 0.95rem; color: var(--color-text-muted);">Try adjusting the price range or removing some filters.</p>
      </div>
    `;
    return;
  }

  // Get destination first activity coordinates for Haversine distance
  const currentItinerary = store.get().itinerary;
  const firstAct = currentItinerary?.days?.[0]?.activities?.[0];
  const refLat = firstAct?.lat || 32.2396;
  const refLng = firstAct?.lng || 77.1887;

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card card-interactive';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    const isStay = activeTab === 'stays';
    const isSelected = isStay ? selectedStay?.id === item.id : selectedGuide?.id === item.id;
    if (isSelected) {
      card.style.borderColor = 'var(--color-primary)';
      card.style.boxShadow = '0 0 0 2px var(--color-primary)';
    }

    // Distance calculation
    let distText = '';
    if (item.coordinates) {
      const km = calculateHaversineKm(refLat, refLng, item.coordinates.lat, item.coordinates.lng);
      distText = `📍 ${km} km from Day 1 activity`;
    }

    // Check for dynamic off-season offers
    const dynamicOffer = publishedOffers.find(o => o.stayId === item.id);
    const discount = dynamicOffer ? dynamicOffer.discountPercent : item.offPeakDiscountPercent;

    // Compute real-time reviews & rating from merged data
    const itemReviews = getReviewsForTarget(isStay ? 'stay' : 'guide', item.id);
    const itemSummary = calculateRatingSummary(itemReviews);
    const displayRating = itemSummary.count > 0 ? itemSummary.average : item.rating;
    const displayCount = itemSummary.count > 0 ? itemSummary.count : item.reviewsCount;

    card.innerHTML = `
      <!-- Off season ribbon -->
      ${discount ? `
        <div style="background: var(--color-accent); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-sm); position: absolute; top: 12px; right: 12px; z-index: 2;">
          🏷️ ${discount}% OFF-SEASON
        </div>
      ` : ''}

      <!-- CSS Gradient / Emoji Thumbnail (no external images) -->
      <div style="height: 120px; background: linear-gradient(135deg, ${isStay ? '#0d5c58 0%, #167a75 100%' : '#d97706 0%, #b45309 100%'}); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 3rem; margin-bottom: 12px; color: #fff;">
        ${isStay ? '🏡' : '🧭'}
      </div>

      <div style="display: flex; flex-direction: column; flex: 1;">
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
          ${item.verified ? '<span class="badge badge-verified">✓ Verified Local</span>' : ''}
          ${isStay ? '<span class="badge badge-family">Supports a local family</span>' : ''}
          ${item.seniorFriendly ? '<span class="badge badge-local">♿ Senior-Friendly</span>' : ''}
        </div>

        <h3 style="font-size: 1.15rem; margin-bottom: 4px;">${item.name}</h3>
        <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 8px;">
          ${item.area} &bull; ${distText}
        </div>

        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 12px; flex: 1;">
          ${item.shortStory}
        </p>

        <!-- Rooms or Experience indicator -->
        ${isStay ? `
          <div style="font-size: 11px; color: #b45309; background: #fffbeb; padding: 4px 8px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #fde68a;">
            🍂 Off-season gap: <strong>${item.roomsAvailableOffSeason} of ${item.roomsTotal} rooms empty</strong>
          </div>
        ` : `
          <div style="font-size: 11px; color: #1e3a8a; background: #eff6ff; padding: 4px 8px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #bfdbfe;">
            🎓 <strong>${item.experienceYears} years</strong> experience in local folklore
          </div>
        `}

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--color-border); padding-top: 10px; margin-top: auto;">
          <div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--color-text);">
              ₹${item.pricePerNight || item.pricePerDay}
              <span style="font-size: 11px; font-weight: normal; color: var(--color-text-muted);">
                ${isStay ? '/ night' : '/ day'}
              </span>
            </div>
            <div style="font-size: 11px; color: var(--color-text-muted);">
              ★ ${displayRating} (${displayCount} reviews)
            </div>
          </div>

          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-ghost btn-view-detail" data-id="${item.id}">Details</button>
            <button class="btn btn-sm ${isSelected ? 'btn-secondary' : 'btn-primary'} btn-select-item" data-id="${item.id}">
              ${isSelected ? '✓ Selected' : 'Select'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach listeners
    card.querySelector('.btn-view-detail').addEventListener('click', () => openDetailModal(item, activeTab));
    card.querySelector('.btn-select-item').addEventListener('click', () => {
      if (isStay) {
        selectedStay = item;
        store.setSelectedStay(item);
      } else {
        selectedGuide = item;
        store.setSelectedGuide(item);
      }
      updateStickySummary();
      renderListings();
    });

    container.appendChild(card);
  });
}

function updateStickySummary() {
  const stayEl = document.getElementById('selected-summary-stay');
  const guideEl = document.getElementById('selected-summary-guide');
  if (stayEl) stayEl.textContent = selectedStay ? selectedStay.name : 'None';
  if (guideEl) guideEl.textContent = selectedGuide ? selectedGuide.name : 'None';
}

function openDetailModal(item, type) {
  const container = document.getElementById('detail-modal-container');
  if (!container) return;

  const isStay = type === 'stay' || activeTab === 'stays';

  container.innerHTML = `
    <div class="modal-backdrop open" id="detail-modal">
      <div class="modal-dialog">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.5rem;">${isStay ? '🏡' : '🧭'}</span>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem;">${item.name}</h3>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted);">${item.area}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-close-detail" style="font-size: 1.2rem;">&times;</button>
        </div>

        <div class="modal-body">
          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 0.95rem; margin-bottom: 6px;">Host Story:</h4>
            <p style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text);">${item.shortStory}</p>
          </div>

          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 0.95rem; margin-bottom: 6px;">Languages Spoken:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${(item.languages || []).map(l => `<span class="badge badge-local">${l}</span>`).join('')}
            </div>
          </div>

          ${isStay && item.amenities ? `
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 0.95rem; margin-bottom: 6px;">Amenities:</h4>
              <ul style="font-size: 0.85rem; color: var(--color-text-secondary); padding-left: 20px; line-height: 1.6;">
                ${item.amenities.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Simulated Mini Calendar -->
          <div style="background: var(--color-surface-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--color-border); margin-bottom: 16px;">
            <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">AVAILABILITY THIS MONTH (SIMULATED):</div>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 11px;">
              ${Array.from({ length: 14 }).map((_, i) => `
                <div style="background: ${i % 3 === 0 ? '#dcfce7' : '#ffffff'}; border: 1px solid #e5e7eb; padding: 4px; border-radius: 4px;">
                  Day ${i + 1}<br><span style="color: ${i % 3 === 0 ? '#166534' : '#6b7280'}; font-size: 9px;">${i % 3 === 0 ? 'Avail' : 'Open'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="font-size: 11px; color: var(--color-text-muted); font-style: italic; margin-bottom: 16px;">
            Note: All hosts and stories are fictional prototype data representing local tourism micro-entrepreneurs.
          </div>

          <!-- Reviews & Feedback Container (Phase 15) -->
          <div id="modal-reviews-mount"></div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-close-modal-footer">Close</button>
          <button class="btn btn-primary" id="btn-modal-select">Select This ${isStay ? 'Stay' : 'Guide'}</button>
        </div>
      </div>
    </div>
  `;

  const closeFn = () => { container.innerHTML = ''; };
  document.getElementById('btn-close-detail')?.addEventListener('click', closeFn);
  document.getElementById('btn-close-modal-footer')?.addEventListener('click', closeFn);

  // Mount Reviews & Feedback Section (Phase 15)
  const reviewsMount = document.getElementById('modal-reviews-mount');
  if (reviewsMount) {
    renderReviewsSection(reviewsMount, isStay ? 'stay' : 'guide', item.id, item.name);
  }

  document.getElementById('btn-modal-select')?.addEventListener('click', () => {
    if (isStay) {
      selectedStay = item;
      store.setSelectedStay(item);
    } else {
      selectedGuide = item;
      store.setSelectedGuide(item);
    }
    updateStickySummary();
    renderListings();
    closeFn();
  });
}
