/**
 * YatraLocal Internationalization (i18n) Helper
 * Bilingual support: English & Hindi (हिंदी)
 */

import { store } from './store.js';

let translations = null;

export async function initI18n() {
  if (!translations) {
    try {
      const res = await fetch('/data/i18n.json');
      translations = await res.json();
    } catch (e) {
      console.warn('[i18n] Failed to fetch i18n.json:', e);
      translations = { en: {}, hi: {} };
    }
  }
  updateDomTranslations();
}

export function t(key, fallback = '') {
  const lang = store.get().language || 'en';
  if (translations && translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  if (translations && translations['en'] && translations['en'][key]) {
    return translations['en'][key];
  }
  return fallback || key;
}

export function updateDomTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (translated) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    }
  });
}

export function toggleLanguage() {
  const current = store.get().language;
  const next = current === 'hi' ? 'en' : 'hi';
  store.setLanguage(next);
  updateDomTranslations();
  // Dispatch custom event for views to re-render if necessary
  window.dispatchEvent(new CustomEvent('yatralocal:langchange', { detail: { lang: next } }));
}
