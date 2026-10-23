/**
 * YatraLocal Season Engine Module
 * 
 * Provides honest, transparent seasonal demand insights:
 * - Reads from /data/seasons.json
 * - Categorises demand as "low" (Off-Season), "medium" (Shoulder), "high" (On-Season)
 * - Identifies offbeat alternatives for crowded peaks
 * - Renders accessible 12-month demand bar charts with zero layout shift
 * - Strict honesty: no invented visitor percentages or fake booking counts
 */

let seasonsData = null;
let loadPromise = null;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Loads season dataset from /data/seasons.json
 */
export async function loadSeasonsData() {
  if (seasonsData) return seasonsData;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch('/data/seasons.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      seasonsData = await res.json();
    } catch (e) {
      console.warn('[Season Engine] Failed to load seasons.json, using fallback:', e);
      seasonsData = {
        _disclaimer: "Seasonality is an estimate based on general travel patterns, not live booking data.",
        isEstimate: true,
        destinations: {}
      };
    }
    return seasonsData;
  })();

  return loadPromise;
}

/**
 * Returns the current calendar month (1 - 12)
 */
export function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

/**
 * Returns seasonal demand metadata for a destination and month
 * @param {string} destinationId e.g. "manali"
 * @param {number} month 1 to 12 (defaults to current month)
 */
export async function getSeason(destinationId, month = getCurrentMonth()) {
  const data = await loadSeasonsData();
  const destKey = (destinationId || '').toLowerCase().trim();
  const destConfig = data.destinations && data.destinations[destKey];

  const mNum = Math.min(12, Math.max(1, Number(month) || getCurrentMonth()));

  if (!destConfig || !Array.isArray(destConfig.months)) {
    return {
      destinationId: destKey,
      month: mNum,
      monthName: MONTH_NAMES[mNum - 1],
      level: 'medium',
      reason: 'General travel season',
      isOnSeason: false,
      isOffSeason: false,
      isShoulder: true,
      alternatives: [],
      allMonths: [],
      isEstimate: true,
      disclaimer: data._disclaimer || "Seasonality is an estimate based on general travel patterns, not live booking data."
    };
  }

  const monthObj = destConfig.months.find(m => m.month === mNum) || {
    month: mNum,
    name: MONTH_SHORT[mNum - 1],
    demandLevel: 'medium',
    reason: 'Standard travel period'
  };

  const level = monthObj.demandLevel || 'medium';
  const isOnSeason = level === 'high';
  const isOffSeason = level === 'low';
  const isShoulder = level === 'medium';

  return {
    destinationId: destKey,
    destinationName: destConfig.name || destKey,
    month: mNum,
    monthName: MONTH_NAMES[mNum - 1],
    monthShort: MONTH_SHORT[mNum - 1],
    level,
    reason: monthObj.reason || '',
    isOnSeason,
    isOffSeason,
    isShoulder,
    alternatives: destConfig.alternatives || [],
    allMonths: destConfig.months,
    isEstimate: true,
    disclaimer: data._disclaimer || "Seasonality is an estimate based on general travel patterns, not live booking data."
  };
}

/**
 * Returns badge styling and accessible label based on season level
 */
export function getSeasonBadgeConfig(level) {
  if (level === 'low') {
    return {
      key: 'off-season',
      label: 'Off-season: fewer crowds',
      hindiLabel: 'ऑफ-सीजन: कम भीड़',
      tagClass: 'badge-season-off',
      bg: '#e6f4ea',
      color: '#137333',
      border: '#ceead6',
      icon: '🌿'
    };
  }
  if (level === 'high') {
    return {
      key: 'on-season',
      label: 'On-season: high demand',
      hindiLabel: 'ऑन-सीजन: भारी मांग',
      tagClass: 'badge-season-on',
      bg: '#fce8e6',
      color: '#c5221f',
      border: '#fad2cf',
      icon: '🔥'
    };
  }
  return {
    key: 'shoulder',
    label: 'Shoulder season',
    hindiLabel: 'सामान्य मौसम',
    tagClass: 'badge-season-shoulder',
    bg: '#fef7e0',
    color: '#b06000',
    border: '#feefc3',
    icon: '⛅'
  };
}

/**
 * Renders an accessible 12-month demand bar component
 * @param {Array} allMonths Array of 12 month objects
 * @param {number} selectedMonth Currently active month (1-12)
 * @param {Function} onSelectMonth Optional callback when user clicks a month
 * @returns {string} HTML string
 */
export function render12MonthDemandBar(allMonths, selectedMonth = getCurrentMonth()) {
  if (!Array.isArray(allMonths) || allMonths.length === 0) return '';

  const barsHtml = allMonths.map(m => {
    const isSelected = m.month === selectedMonth;
    const isCurrent = m.month === getCurrentMonth();
    const badge = getSeasonBadgeConfig(m.demandLevel);

    const levelColor = m.demandLevel === 'high'
      ? '#dc2626'
      : m.demandLevel === 'low'
      ? '#16a34a'
      : '#d97706';

    const levelHeight = m.demandLevel === 'high'
      ? '36px'
      : m.demandLevel === 'medium'
      ? '24px'
      : '14px';

    return `
      <div 
        class="season-month-col ${isSelected ? 'is-selected' : ''}" 
        data-month="${m.month}"
        role="button"
        tabindex="0"
        aria-label="${MONTH_NAMES[m.month - 1]}: ${badge.label} (${m.reason})"
        title="${MONTH_NAMES[m.month - 1]}: ${badge.label} — ${m.reason}"
        style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; padding: 4px 2px; border-radius: var(--radius-sm); position: relative; transition: all 0.2s ease;"
      >
        <div style="height: 40px; display: flex; align-items: flex-end; width: 100%; justify-content: center;">
          <div 
            class="season-bar-fill" 
            style="width: 80%; max-width: 18px; height: ${levelHeight}; background: ${levelColor}; border-radius: 3px 3px 1px 1px; transition: transform 0.2s;"
          ></div>
        </div>
        <span style="font-size: 10px; font-weight: ${isSelected ? '800' : '600'}; color: ${isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'}; margin-top: 4px;">
          ${m.name}
        </span>
        ${isCurrent ? '<span style="font-size: 8px; color: var(--color-primary); position: absolute; top: -10px;">•</span>' : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="season-demand-container" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 14px; margin-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
        <span style="font-size: var(--text-xs); font-weight: 700; color: var(--color-text-main); display: flex; align-items: center; gap: 4px;">
          📊 12-Month Estimated Demand Pattern
        </span>
        <span style="font-size: 11px; color: var(--color-text-muted); background: var(--color-bg); padding: 2px 8px; border-radius: 12px; border: 1px solid var(--color-border);">
          ℹ️ Estimate
        </span>
      </div>
      
      <!-- Chart Area -->
      <div 
        class="season-demand-bars" 
        role="group" 
        aria-label="12-month demand comparison"
        style="display: flex; align-items: flex-end; gap: 2px; height: 60px; padding: 4px 0 2px 0; border-bottom: 1px dashed var(--color-border);"
      >
        ${barsHtml}
      </div>

      <!-- Legend -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 11px; color: var(--color-text-muted); flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #16a34a; border-radius: 2px;"></span> Off-season (Low)
          </span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #d97706; border-radius: 2px;"></span> Shoulder
          </span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #dc2626; border-radius: 2px;"></span> On-season (High)
          </span>
        </div>
        <span style="font-size: 10px; font-style: italic;">Click any month to inspect</span>
      </div>
    </div>
  `;
}

/**
 * Returns host offers and discounts for a destination
 */
export async function getOffersForDestination(destId) {
  let stays = [];
  try {
    const res = await fetch('/data/hosts.json');
    if (res.ok) {
      const data = await res.json();
      stays = (data.stays || []).filter(s => s.destination === destId && (s.offPeakDiscountPercent > 0 || s.roomsAvailableOffSeason > 0));
    }
  } catch (e) {
    console.warn('[Season] Could not fetch hosts.json:', e);
  }

  let localOffers = [];
  try {
    const raw = localStorage.getItem('yl_host_offers');
    if (raw) {
      const parsed = JSON.parse(raw);
      localOffers = Array.isArray(parsed) ? parsed.filter(o => o.destination === destId) : [];
    }
  } catch (e) {
    // localStorage error
  }

  return {
    staysWithDiscounts: stays,
    dynamicOffers: localOffers
  };
}

/**
 * Save a host offer to localStorage with Demo/Sample tag
 */
export function saveHostOffer(offer) {
  try {
    const raw = localStorage.getItem('yl_host_offers');
    const existing = raw ? JSON.parse(raw) : [];
    const newOffer = {
      ...offer,
      id: 'offer-' + Date.now(),
      createdAt: new Date().toISOString(),
      isSample: true,
      tag: 'Demo / Sample Offer'
    };
    existing.unshift(newOffer);
    localStorage.setItem('yl_host_offers', JSON.stringify(existing));
    return newOffer;
  } catch (e) {
    console.warn('[Season] Failed to save host offer:', e);
    return null;
  }
}

/**
 * Retrieve all host offers from localStorage
 */
export function getHostOffers() {
  try {
    const raw = localStorage.getItem('yl_host_offers');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

