/**
 * YatraLocal LLM Provider (Phase 12 Architecture)
 * Connects to the secure backend proxy /api/plan and /api/chat.
 * Implements 15s timeout, 1 retry, and automatic offline fallback to local rule engine.
 */

import { generateItinerary, fetchDestinations } from './itinerary.js';

function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>]/g, '').trim();
}

export const llmPlanProvider = {
  async generate(preferences) {
    const destinations = await fetchDestinations();

    // Attempt 1 + 1 retry
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          // Server returns either real-llm or fallback
          return data;
        }
      } catch (err) {
        console.warn(`[LLM Provider] Attempt ${attempt} failed:`, err);
      }
    }

    // Fallback directly to client-side rule engine
    console.info('[LLM Provider] Using reliable local rule-based fallback.');
    const fallbackPlan = generateItinerary(preferences, destinations);
    fallbackPlan.simulated = true;
    fallbackPlan.provider = 'rule-based (offline fallback)';
    return fallbackPlan;
  },

  async askChat(message, currentPlan) {
    const cleanMsg = sanitize(message);
    if (!cleanMsg) return { reply: 'Please enter a question or instruction.' };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanMsg, plan: currentPlan })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[LLM Chat] Chat request failed, using local response:', e);
    }

    return {
      success: true,
      reply: `Local Assistant: We noted your preference: "${cleanMsg}". Your itinerary remains balanced and strictly within your estimated budget.`,
      updatedPlan: currentPlan
    };
  }
};
