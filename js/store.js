/**
 * YatraLocal Central State Store
 * Persistent across reloads via localStorage + reactive subscriber pattern.
 */

const STORAGE_KEY = 'yatralocal_state_v1';

const defaultState = {
  language: 'en', // 'en' | 'hi'
  saralMode: false,
  preferences: {
    destination: 'manali',
    budget: 15000,
    days: 3,
    travellers: 2,
    moods: ['Relaxed', 'Cultural'],
    accessibility: {
      seniorFriendly: false,
      minimalWalking: false,
      wheelchairAccess: false
    }
  },
  itinerary: null,
  selectedStay: null,
  selectedGuide: null,
  bookings: [],
  emergencyContacts: [
    { name: 'Dr. Ramesh Sharma (Brother)', phone: '+91 98765 43210' },
    { name: 'Ananya (Daughter)', phone: '+91 91234 56789' }
  ],
  medicalNote: 'Mild hypertension; carrying prescribed tablets in backpack.',
  shareLiveLocation: true,
  sosHistory: []
};

class Store {
  constructor() {
    this.subscribers = new Set();
    this.state = this.loadState();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaultState, ...parsed };
      }
    } catch (e) {
      console.warn('[Store] Could not load localStorage:', e);
    }
    return { ...defaultState };
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('[Store] Could not save to localStorage:', e);
    }
    this.notify();
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  notify() {
    this.subscribers.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error('[Store] Subscriber callback error:', err);
      }
    });
  }

  get() {
    return this.state;
  }

  setPreferences(newPrefs) {
    this.state.preferences = { ...this.state.preferences, ...newPrefs };
    this.saveState();
  }

  setItinerary(itinerary) {
    this.state.itinerary = itinerary;
    this.saveState();
  }

  setSelectedStay(stay) {
    this.state.selectedStay = stay;
    this.saveState();
  }

  setSelectedGuide(guide) {
    this.state.selectedGuide = guide;
    this.saveState();
  }

  setSaralMode(val) {
    this.state.saralMode = Boolean(val);
    if (this.state.saralMode) {
      document.documentElement.classList.add('saral');
    } else {
      document.documentElement.classList.remove('saral');
    }
    this.saveState();
  }

  setLanguage(lang) {
    this.state.language = lang === 'hi' ? 'hi' : 'en';
    this.saveState();
  }

  addBooking(booking) {
    this.state.bookings.unshift(booking);
    this.saveState();
  }

  setEmergencyContacts(contacts) {
    this.state.emergencyContacts = contacts;
    this.saveState();
  }

  setMedicalNote(note) {
    this.state.medicalNote = note;
    this.saveState();
  }

  logSosEvent(event) {
    this.state.sosHistory.unshift({
      ...event,
      timestamp: new Date().toISOString()
    });
    this.saveState();
  }

  resetTrip() {
    this.state.itinerary = null;
    this.state.selectedStay = null;
    this.state.selectedGuide = null;
    this.saveState();
  }
}

export const store = new Store();
