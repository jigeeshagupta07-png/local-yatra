/**
 * YatraLocal Application Bootstrap
 * Header bindings, Saral Mode toggle, i18n language toggle, floating SOS button setup.
 */

import { store } from './store.js';
import { initRouter } from './router.js';
import { initI18n, toggleLanguage } from './i18n.js';
import { setupSosFloatingButton } from './sos.js';

export async function bootstrapApp() {
  console.log('[YatraLocal] Initializing application...');

  // Initialize i18n
  await initI18n();

  // Restore Saral Mode class
  if (store.get().saralMode) {
    document.documentElement.classList.add('saral');
  }

  // Bind Header Controls
  setupHeaderControls();

  // Bind Persistent Floating SOS Button
  setupSosFloatingButton();

  // Initialize Router
  initRouter();
}

function setupHeaderControls() {
  const saralToggleBtn = document.getElementById('saral-toggle-btn');
  const langToggleBtn = document.getElementById('lang-toggle-btn');

  if (saralToggleBtn) {
    const isSaral = store.get().saralMode;
    saralToggleBtn.setAttribute('aria-pressed', isSaral ? 'true' : 'false');
    saralToggleBtn.classList.toggle('active', isSaral);

    saralToggleBtn.addEventListener('click', () => {
      const next = !store.get().saralMode;
      store.setSaralMode(next);
      saralToggleBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
      saralToggleBtn.classList.toggle('active', next);
      showToast(next ? 'Saral Mode Activated (सरल मोड)' : 'Standard Mode Activated');
    });
  }

  if (langToggleBtn) {
    const lang = store.get().language || 'en';
    langToggleBtn.textContent = lang === 'hi' ? 'English' : 'हिंदी';

    langToggleBtn.addEventListener('click', () => {
      toggleLanguage();
      const current = store.get().language;
      langToggleBtn.textContent = current === 'hi' ? 'English' : 'हिंदी';
      showToast(current === 'hi' ? 'भाषा: हिंदी' : 'Language: English');
    });
  }
}

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Auto-run when DOM ready
document.addEventListener('DOMContentLoaded', bootstrapApp);
