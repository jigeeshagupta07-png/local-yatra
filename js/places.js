/**
 * YatraLocal India-Wide Place Search Engine (Phase 17)
 * 
 * Provides:
 * 1. Curated destination suggestions (instant local lookup)
 * 2. Photon API typeahead search restricted to India (bbox: 68.1, 6.7, 97.4, 35.7)
 * 3. Nominatim API fallback with 1 request/sec throttling and OSM attribution
 * 4. Normalization to standard Place object { placeKey, name, state, district, lat, lng, source, isCurated }
 * 5. Wikipedia summary extractor (plain text introduction)
 * 6. Overpass API nearby attractions fetcher (10km radius, max 15 items)
 * 7. 5s AbortController timeouts and 1-hour sessionStorage caching
 */

const CACHE_PREFIX_SEARCH = 'yl_search_';
const CACHE_PREFIX_PLACE = 'yl_place_';
const CACHE_PREFIX_OVERPASS = 'yl_overpass_';
const CACHE_PREFIX_WIKI = 'yl_wiki_';
const TIMEOUT_MS = 5000;
const OVERPASS_TIMEOUT_MS = 6000;

// Nominatim usage policy rate limiter (at most 1 request per second)
let lastNominatimRequestTime = 0;

let curatedDestinationsCache = null;

/**
 * Loads our 6 curated destinations from /data/destinations.json
 */
export async function getCuratedDestinations() {
  if (curatedDestinationsCache) return curatedDestinationsCache;
  try {
    const res = await fetch('/data/destinations.json');
    if (res.ok) {
      const data = await res.json();
      curatedDestinationsCache = (data.destinations || []).map(d => ({
        placeKey: `curated:${d.id}`,
        id: d.id,
        name: d.name,
        state: d.state,
        district: d.state,
        lat: d.coordinates?.lat || d.lat,
        lng: d.coordinates?.lng || d.lng,
        tagline: d.tagline,
        source: 'curated',
        isCurated: true
      }));
      return curatedDestinationsCache;
    }
  } catch (e) {
    console.warn('[Places] Could not load curated destinations:', e);
  }
  return [];
}

/**
 * Normalizes OSM Photon feature into Place object
 */
function normalizePhotonFeature(feature) {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [0, 0];
  const osmType = (props.osm_type || 'N').toLowerCase();
  const osmId = props.osm_id || Math.floor(Math.random() * 1000000);

  const placeKey = `osm:${osmType}:${osmId}`;
  const name = props.name || props.street || 'Unnamed Location';
  const state = props.state || '';
  const district = props.district || props.city || props.county || '';

  return {
    placeKey,
    id: `${osmType}-${osmId}`,
    name,
    state,
    district,
    country: 'India',
    lat: coords[1],
    lng: coords[0],
    osmType,
    osmId,
    type: props.osm_value || props.type || 'place',
    source: 'osm',
    isCurated: false
  };
}

/**
 * Normalizes Nominatim item into Place object
 */
function normalizeNominatimItem(item) {
  const osmType = (item.osm_type ? item.osm_type[0] : 'n').toLowerCase();
  const osmId = item.osm_id;
  const placeKey = `osm:${osmType}:${osmId}`;

  const address = item.address || {};
  const name = item.name || address.city || address.town || address.village || address.suburb || item.display_name.split(',')[0];
  const state = address.state || '';
  const district = address.state_district || address.county || address.city || '';

  return {
    placeKey,
    id: `${osmType}-${osmId}`,
    name,
    state,
    district,
    country: 'India',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    osmType,
    osmId,
    type: item.type || 'place',
    source: 'osm',
    isCurated: false
  };
}

/**
 * Search places across India:
 * 1. Checks local curated destinations first
 * 2. Photon API query with India bbox (68.1, 6.7, 97.4, 35.7)
 * 3. Fallback to Nominatim API (1 req/sec limit)
 * @param {string} query Search query (min 3 chars)
 * @param {AbortSignal} signal Optional AbortSignal
 * @returns {Promise<Array>} List of place objects
 */
export async function searchPlacesIndia(query, signal = null) {
  const cleanQ = (query || '').trim().toLowerCase();
  if (cleanQ.length < 3) return [];

  // Check sessionStorage cache
  const cacheKey = `${CACHE_PREFIX_SEARCH}${cleanQ}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  // 1. Check local curated matches
  const curated = await getCuratedDestinations();
  const curatedMatches = curated.filter(c => 
    c.name.toLowerCase().includes(cleanQ) || 
    c.state.toLowerCase().includes(cleanQ) ||
    c.id.toLowerCase().includes(cleanQ)
  );

  let osmResults = [];

  // 2. Query Photon API (restricted to India bbox roughly 68.1, 6.7, 97.4, 35.7)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ)}&bbox=68.1,6.7,97.4,35.7&limit=10`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Merge signals if passed
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const res = await fetch(photonUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const features = data.features || [];
      // Filter strictly to India
      osmResults = features
        .filter(f => {
          const country = (f.properties?.country || '').toLowerCase();
          const countryCode = (f.properties?.countrycode || '').toUpperCase();
          return country === 'india' || countryCode === 'IN';
        })
        .map(normalizePhotonFeature);
    }
  } catch (photonErr) {
    console.warn('[Places] Photon API failed or timed out, trying Nominatim fallback:', photonErr.message);
  }

  // 3. Nominatim Fallback if Photon yielded no results
  if (osmResults.length === 0) {
    try {
      const now = Date.now();
      const timeSinceLastReq = now - lastNominatimRequestTime;
      if (timeSinceLastReq < 1000) {
        await new Promise(r => setTimeout(r, 1000 - timeSinceLastReq));
      }
      lastNominatimRequestTime = Date.now();

      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQ)}&countrycodes=in&format=json&addressdetails=1&limit=8`;
      const nomController = new AbortController();
      const timeoutId = setTimeout(() => nomController.abort(), TIMEOUT_MS);

      if (signal) {
        signal.addEventListener('abort', () => nomController.abort());
      }

      const res = await fetch(nomUrl, { 
        headers: { 'Accept': 'application/json' },
        signal: nomController.signal 
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const items = await res.json();
        osmResults = (items || []).map(normalizeNominatimItem);
      }
    } catch (nomErr) {
      console.warn('[Places] Nominatim fallback failed:', nomErr.message);
    }
  }

  // Deduplicate results by name & state
  const seen = new Set();
  const merged = [];

  // Curated first
  for (const c of curatedMatches) {
    const key = `${c.name.toLowerCase()}|${c.state.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(c);
    }
  }

  // OSM places
  for (const o of osmResults) {
    const key = `${o.name.toLowerCase()}|${o.state.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(o);
    }
  }

  // Cache in sessionStorage
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(merged));
  } catch (e) {}

  return merged;
}

/**
 * Get place by placeKey ("curated:manali" or "osm:node:123456")
 */
export async function getPlaceByKey(placeKey) {
  if (!placeKey) return null;

  // 1. Curated destination
  if (placeKey.startsWith('curated:')) {
    const destId = placeKey.replace('curated:', '');
    const curated = await getCuratedDestinations();
    return curated.find(c => c.id === destId) || null;
  }

  // 2. Check cached place in sessionStorage
  const cacheKey = `${CACHE_PREFIX_PLACE}${placeKey}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  // 3. Fallback reverse lookups or query
  const parts = placeKey.split(':');
  if (parts.length >= 3 && parts[0] === 'osm') {
    const osmType = parts[1].toUpperCase();
    const osmId = parts[2];
    try {
      const url = `https://nominatim.openstreetmap.org/lookup?osm_ids=${osmType}${osmId}&format=json&addressdetails=1`;
      const res = await fetch(url);
      if (res.ok) {
        const items = await res.json();
        if (items && items.length > 0) {
          const place = normalizeNominatimItem(items[0]);
          place.placeKey = placeKey;
          try { sessionStorage.setItem(cacheKey, JSON.stringify(place)); } catch (e) {}
          return place;
        }
      }
    } catch (e) {
      console.warn('[Places] Reverse lookup error:', e);
    }
  }

  return null;
}

/**
 * Fetch short plain-text introduction from Wikipedia
 * @param {string} placeName e.g. "Kedarnath"
 * @returns {Promise<Object>} { extract, sourceUrl, thumbnail }
 */
export async function getWikipediaSummary(placeName) {
  if (!placeName) return null;
  const cleanName = placeName.trim();
  const cacheKey = `${CACHE_PREFIX_WIKI}${cleanName.toLowerCase()}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.extract) {
        const result = {
          title: data.title,
          extract: data.extract,
          thumbnail: data.thumbnail?.source || null,
          sourceUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanName)}`,
          sourceName: 'Wikipedia'
        };
        try { sessionStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) {}
        return result;
      }
    }
  } catch (err) {
    console.warn('[Places] Wikipedia summary fetch failed:', err.message);
  }

  return null;
}

/**
 * Fetch nearby attractions, viewpoints, historic monuments, waterfalls via Overpass API
 * Radius: 10,000 meters (10 km). Limit: 15 items.
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {Promise<Array>} List of nearby attraction objects
 */
export async function getNearbyAttractionsOverpass(lat, lng) {
  if (!lat || !lng) return [];

  const roundLat = lat.toFixed(3);
  const roundLng = lng.toFixed(3);
  const cacheKey = `${CACHE_PREFIX_OVERPASS}${roundLat}_${roundLng}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const query = `
    [out:json][timeout:6];
    (
      nwr["tourism"~"attraction|viewpoint|museum"](around:10000, ${lat}, ${lng});
      nwr["historic"](around:10000, ${lat}, ${lng});
      nwr["natural"~"waterfall|peak"](around:10000, ${lat}, ${lng});
    );
    out center 15;
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const elements = data.elements || [];

      const seenNames = new Set();
      const attractions = [];

      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'] || tags.tourism || tags.historic;
        if (!name || seenNames.has(name.toLowerCase())) continue;
        seenNames.add(name.toLowerCase());

        const elLat = el.lat || el.center?.lat;
        const elLng = el.lon || el.center?.lon;
        if (!elLat || !elLng) continue;

        // Determine category label & icon
        let category = 'Attraction';
        let icon = '📍';
        if (tags.tourism === 'viewpoint') { category = 'Scenic Viewpoint'; icon = '🌄'; }
        else if (tags.tourism === 'museum') { category = 'Museum / Heritage'; icon = '🏛️'; }
        else if (tags.historic) { category = `Historic ${tags.historic}`; icon = '🏰'; }
        else if (tags.natural === 'waterfall') { category = 'Waterfall'; icon = '🌊'; }
        else if (tags.natural === 'peak') { category = 'Mountain Peak'; icon = '🏔️'; }

        attractions.push({
          id: `osm-${el.type}-${el.id}`,
          name,
          category,
          icon,
          lat: elLat,
          lng: elLng,
          tags
        });

        if (attractions.length >= 15) break;
      }

      try { sessionStorage.setItem(cacheKey, JSON.stringify(attractions)); } catch (e) {}
      return attractions;
    }
  } catch (err) {
    console.warn('[Places] Overpass nearby fetch failed:', err.message);
  }

  return [];
}
