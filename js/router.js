/**
 * YatraLocal Hash-based Router
 * Supported Routes: #/, #/plan, #/itinerary, #/stays, #/booking, #/owner, #/saral, #/sos, #/trips, #/styleguide + 404
 * Accessible focus management (moves focus to h1 on route transition)
 */

import { renderHome, initHomeEvents } from '../pages/home.js';
import { renderPlan, initPlanEvents } from '../pages/plan.js';
import { renderItineraryView, initItineraryEvents } from '../pages/itineraryView.js';
import { renderStaysView, initStaysEvents } from '../pages/staysView.js';
import { renderSaral, initSaralEvents } from '../pages/saralView.js';
import { renderBooking, initBookingEvents } from '../pages/bookingView.js';
import { renderOwner, initOwnerEvents } from '../pages/ownerView.js';
import { renderSos, initSosEvents } from '../pages/sosView.js';
import { renderTrips, initTripsEvents } from '../pages/tripsView.js';
import { renderStyleguide } from '../pages/styleguideView.js';
import { renderPlaceView, initPlaceEvents } from '../pages/placeView.js';
import { renderWeatherView, initWeatherEvents } from '../pages/weatherView.js';

const routes = {
  '#/': { render: renderHome, init: initHomeEvents },
  '#/plan': { render: renderPlan, init: initPlanEvents },
  '#/itinerary': { render: renderItineraryView, init: initItineraryEvents },
  '#/stays': { render: renderStaysView, init: initStaysEvents },
  '#/weather': { render: renderWeatherView, init: initWeatherEvents },
  '#/saral': { render: renderSaral, init: initSaralEvents },
  '#/booking': { render: renderBooking, init: initBookingEvents },
  '#/owner': { render: renderOwner, init: initOwnerEvents },
  '#/sos': { render: renderSos, init: initSosEvents },
  '#/trips': { render: renderTrips, init: initTripsEvents },
  '#/styleguide': { render: renderStyleguide }
};

export function navigateTo(hash) {
  window.location.hash = hash;
}

export function handleRoute() {
  const hash = window.location.hash || '#/';
  const app = document.getElementById('app');
  if (!app) return;

  const route = routes[hash];

  if (route) {
    app.innerHTML = route.render();
    if (route.init) {
      route.init();
    }
  } else if (hash.startsWith('#/place/')) {
    // Dynamic Place Route (Phase 17)
    const placeKey = decodeURIComponent(hash.slice('#/place/'.length));
    app.innerHTML = renderPlaceView(placeKey);
    initPlaceEvents(placeKey);
  } else {
    // Custom 404 Route
    app.innerHTML = `
      <div class="container" style="padding: 80px 20px; text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 12px;">🧭</div>
        <h1>404 &bull; Path Not Found</h1>
        <p style="color: var(--color-text-muted); max-width: 480px; margin: 0 auto 24px auto;">
          The trail you are exploring seems to have wandered off the map. Let's guide you back to safety.
        </p>
        <a href="#/" class="btn btn-primary btn-lg">Return to Homepage</a>
      </div>
    `;
  }

  // Update Nav Link Active States
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Accessibility: Move focus to the primary heading for screen readers
  setTimeout(() => {
    const h1 = app.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus();
    }
  }, 100);
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
