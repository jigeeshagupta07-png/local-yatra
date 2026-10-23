/**
 * YatraLocal Leaflet & OpenStreetMap Module (Phase 11)
 * Interactive, zero-key mapping with Haversine distance, day polylines, crowd layers, and directions deep links.
 */

// Haversine distance formula in kilometers
export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

export function createDirectionsUrl(lat, lng, label = 'Destination') {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`;
}

export class YatraMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.map = null;
    this.markersLayer = null;
    this.routesLayer = null;
    this.crowdLayer = null;
    this.isCrowdLayerActive = false;
    this.options = options;
  }

  isLeafletLoaded() {
    return typeof window.L !== 'undefined';
  }

  init(center = [32.2396, 77.1887], zoom = 13) {
    if (!this.isLeafletLoaded()) {
      console.warn('[YatraMap] Leaflet not loaded. Falling back to text view.');
      return false;
    }

    const container = document.getElementById(this.containerId);
    if (!container) return false;

    // Destroy existing instance if any
    if (this.map) {
      this.map.remove();
    }

    try {
      this.map = window.L.map(this.containerId, {
        center,
        zoom,
        zoomControl: !this.options.simpleMode,
        scrollWheelZoom: false
      });

      // OpenStreetMap standard tile layer with required attribution
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.markersLayer = window.L.layerGroup().addTo(this.map);
      this.routesLayer = window.L.layerGroup().addTo(this.map);
      this.crowdLayer = window.L.layerGroup().addTo(this.map);

      return true;
    } catch (err) {
      console.error('[YatraMap] Failed to initialize map:', err);
      return false;
    }
  }

  renderItinerary(days) {
    if (!this.map || !days || !days.length) return;

    this.markersLayer.clearLayers();
    this.routesLayer.clearLayers();

    const bounds = [];
    const dayColors = ['#0d5c58', '#d97706', '#0284c7', '#7c3aed', '#db2777'];

    days.forEach((dayObj, dayIdx) => {
      const color = dayColors[dayIdx % dayColors.length];
      const dayCoords = [];

      dayObj.activities.forEach((act, actIdx) => {
        if (!act.lat || !act.lng) return;

        const pos = [act.lat, act.lng];
        bounds.push(pos);
        dayCoords.push(pos);

        // Custom Numbered HTML Pin
        const pinHtml = `
          <div class="custom-day-pin pin-day-${(dayIdx % 5) + 1}">
            <span>${actIdx + 1}</span>
          </div>
        `;

        const icon = window.L.divIcon({
          className: 'day-pin-wrapper',
          html: pinHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -30]
        });

        const directionsUrl = createDirectionsUrl(act.lat, act.lng, act.name);

        const popupContent = `
          <div class="map-popup-title">${act.name}</div>
          <div class="map-popup-meta">
            <span>Day ${dayObj.day}</span> &bull; 
            <span>${act.durationHours} hrs</span> &bull; 
            <span class="badge ${act.crowdLevel === 'low' ? 'badge-crowd-low' : act.crowdLevel === 'high' ? 'badge-crowd-high' : 'badge-crowd-med'}">${act.crowdLevel} crowd</span>
          </div>
          <p style="font-size:12px; margin-bottom:8px;">${act.shortDescription}</p>
          <div class="map-popup-actions">
            <a href="${directionsUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="font-size:11px;">
              Directions ↗
            </a>
          </div>
        `;

        const marker = window.L.marker(pos, { icon }).bindPopup(popupContent);
        this.markersLayer.addLayer(marker);
      });

      // Draw polyline connecting day's activities
      if (dayCoords.length > 1) {
        const polyline = window.L.polyline(dayCoords, {
          color: color,
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 8'
        });
        this.routesLayer.addLayer(polyline);
      }
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  toggleCrowdLayer(activities, enabled) {
    if (!this.map) return;
    this.crowdLayer.clearLayers();
    this.isCrowdLayerActive = enabled;

    if (!enabled || !activities) return;

    activities.forEach(act => {
      if (!act.lat || !act.lng) return;
      const isLow = act.crowdLevel === 'low' || act.isHiddenGem;
      const color = isLow ? '#10b981' : '#ef4444';

      const circle = window.L.circle([act.lat, act.lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.25,
        radius: isLow ? 200 : 350
      }).bindPopup(`<strong>${act.name}</strong><br>${isLow ? '🌿 Offbeat / Low Crowd Alternative' : '⚠️ Heavy Tourist Traffic Point'}`);

      this.crowdLayer.addLayer(circle);
    });
  }

  renderStays(stays, onSelectStay) {
    if (!this.map || !stays) return;
    this.markersLayer.clearLayers();
    const bounds = [];

    stays.forEach(stay => {
      if (!stay.coordinates) return;
      const pos = [stay.coordinates.lat, stay.coordinates.lng];
      bounds.push(pos);

      const isHomestay = stay.type === 'homestay';
      const iconHtml = `
        <div style="background:${isHomestay ? '#0d5c58' : '#d97706'}; color:#fff; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:16px; border:2px solid #fff; box-shadow:0 3px 6px rgba(0,0,0,0.3);">
          ${isHomestay ? '🏡' : '🏨'}
        </div>
      `;

      const icon = window.L.divIcon({
        className: 'stay-marker',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const popupContent = `
        <div class="map-popup-title">${stay.name}</div>
        <div class="map-popup-meta">
          <span>₹${stay.pricePerNight}/night</span> &bull; 
          <span>★ ${stay.rating} (${stay.reviewsCount})</span>
        </div>
        <p style="font-size:12px; margin-bottom:8px;">${stay.area} &bull; ${stay.shortStory}</p>
        <button id="marker-btn-${stay.id}" class="btn btn-sm btn-primary" style="font-size:11px; width:100%;">
          View Details & Select
        </button>
      `;

      const marker = window.L.marker(pos, { icon }).bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`marker-btn-${stay.id}`);
        if (btn && onSelectStay) {
          btn.addEventListener('click', () => onSelectStay(stay));
        }
      });

      this.markersLayer.addLayer(marker);
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  fitAll() {
    if (!this.map || !this.markersLayer) return;
    const layers = this.markersLayer.getLayers();
    if (!layers.length) return;
    const group = window.L.featureGroup(layers);
    this.map.fitBounds(group.getBounds(), { padding: [40, 40] });
  }
}
