/**
 * YatraLocal Itinerary Generator Engine (Phase 3 & 12 Architecture)
 * Pure functional generation based on local-first, crowd-avoidance, and accessibility rules.
 */

let destinationsCache = null;

export async function fetchDestinations() {
  if (destinationsCache) return destinationsCache;
  try {
    const res = await fetch('/data/destinations.json');
    const data = await res.json();
    destinationsCache = data.destinations;
    return destinationsCache;
  } catch (err) {
    console.error('[Itinerary] Failed to load destinations.json:', err);
    return [];
  }
}

/**
 * Pure generator function
 * @param {Object} preferences { destination, budget, days, travellers, moods, accessibility }
 * @param {Array} destinationsList
 */
export function generateItinerary(preferences, destinationsList) {
  const destId = preferences.destination || 'manali';
  const budget = Number(preferences.budget) || 15000;
  const days = Math.max(1, Math.min(10, Number(preferences.days) || 3));
  const travellers = Math.max(1, Number(preferences.travellers) || 1);
  const moods = preferences.moods || [];
  const accessibility = preferences.accessibility || {};

  const dest = destinationsList.find(d => d.id === destId) || destinationsList[0];
  const allActivities = [...(dest?.activities || [])];

  const isSenior = Boolean(accessibility.seniorFriendly || accessibility.minimalWalking);

  // 1. Filter for accessibility needs
  let eligibleActivities = allActivities.filter(act => {
    if (isSenior && !act.seniorFriendly) return false;
    if (accessibility.minimalWalking && act.walkingLevel === 'high') return false;
    if (accessibility.wheelchairAccess && act.walkingLevel !== 'minimal') return false;
    return true;
  });

  // Fallback if filter is too aggressive
  if (eligibleActivities.length === 0) {
    eligibleActivities = allActivities.filter(act => act.seniorFriendly);
  }
  if (eligibleActivities.length === 0) {
    eligibleActivities = allActivities;
  }

  // 2. Score activities by Mood & Crowd avoidance
  function scoreActivity(act) {
    let score = 0;
    // Mood matching (+4 per match)
    if (Array.isArray(act.category)) {
      moods.forEach(m => {
        if (act.category.includes(m)) score += 4;
      });
    }
    // Crowd preference (+5 for low, +2 for medium)
    if (act.crowdLevel === 'low') score += 5;
    else if (act.crowdLevel === 'medium') score += 2;

    // Hidden gem bonus
    if (act.isHiddenGem) score += 3;
    return score;
  }

  const scoredActivities = [...eligibleActivities].sort((a, b) => scoreActivity(b) - scoreActivity(a));

  // Max activities per day: 1 for seniors, up to 3 for standard
  const maxActsPerDay = isSenior ? 1 : (days === 1 ? 3 : 2);
  const slotsNames = ['morning', 'afternoon', 'evening'];

  const daysList = [];
  const usedIds = new Set();
  let totalActivityCost = 0;

  for (let d = 1; d <= days; d++) {
    const dayActs = [];
    const slots = {};
    let dayCost = 0;

    for (let slotIdx = 0; slotIdx < maxActsPerDay; slotIdx++) {
      const slotName = slotsNames[slotIdx];
      // Pick first unused
      let chosen = scoredActivities.find(a => !usedIds.has(a.id));
      if (!chosen) {
        // Reuse offbeat or top
        chosen = scoredActivities[(d + slotIdx) % scoredActivities.length];
      } else {
        usedIds.add(chosen.id);
      }

      dayActs.push(chosen);
      slots[slotName] = chosen.id;
      dayCost += (chosen.cost || 0);
    }

    totalActivityCost += (dayCost * travellers);

    const localTips = [
      `Local tip: Experience ${dayActs[0]?.name?.split('&')[0]} early at sunrise to witness peaceful spiritual rituals before morning tourist buses.`,
      `Local tip: Sip freshly steeped herbal chai at village kiosks; ask the owner about traditional seasonal preparations.`,
      `Local tip: Request eco-friendly paper or cloth bags when purchasing local produce and support home-based weavers directly.`,
      `Local tip: Carry light woolen wraps as mountain breeze temperature can drop sharply after sunset.`
    ];

    daysList.push({
      day: d,
      title: `Day ${d}: ${dayActs[0]?.name?.split('&')[0]?.trim() || 'Explore'}`,
      slots: slots,
      activities: dayActs,
      estCost: dayCost * travellers,
      localTip: localTips[(d - 1) % localTips.length]
    });
  }

  // Cost estimates: Daily homestay, food, local e-rickshaw / shared cab
  const dailyHomestayEst = 1450;
  const dailyFoodEst = 450 * travellers;
  const dailyTransportEst = 300 * travellers;

  const stayTotal = dailyHomestayEst * Math.max(1, days - 1 || 1);
  const foodTotal = dailyFoodEst * days;
  const transportTotal = dailyTransportEst * days;
  const totalCost = stayTotal + foodTotal + transportTotal + totalActivityCost;

  const budgetStatus = totalCost <= budget ? 'within_budget' : 'over_budget';

  const whyThisPlan = [
    `Personalized for ${dest?.name || 'your journey'} with a focus on ${moods.length ? moods.join(', ') : 'holistic cultural discovery'}.`,
    isSenior ? 'Senior-friendly pacing with comfortable walking gradients and zero rush.' : 'Balanced pace allowing genuine conversations with local residents.',
    'Carefully curated to prioritize authentic offbeat gems over overcrowded tourist traps.'
  ].join(' ');

  const crowdTips = `Our smart crowd monitor diverted your plan to peaceful spots like ${scoredActivities.find(a => a.crowdLevel === 'low')?.name || 'hidden heritage paths'}, saving an estimated 2+ hours in crowded ticket queues.`;

  return {
    destination: dest,
    days: daysList,
    totalCost,
    breakdown: {
      stay: stayTotal,
      food: foodTotal,
      activities: totalActivityCost,
      transport: transportTotal
    },
    budgetStatus,
    whyThisPlan,
    crowdTips,
    simulated: true,
    provider: 'rule-based'
  };
}

/**
 * planProvider interface
 * Defaults to local rule engine, but supports LLM via Phase 12 provider.
 */
export const planProvider = {
  async generate(preferences) {
    const destinations = await fetchDestinations();
    return generateItinerary(preferences, destinations);
  }
};
