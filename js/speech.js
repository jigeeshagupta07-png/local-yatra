/**
 * YatraLocal Web Speech API Module
 * Text-to-Speech (speechSynthesis) with EN & Hindi support
 * Speech Recognition for accessible destination input
 */

import { store } from './store.js';

let synth = window.speechSynthesis;
let currentUtterance = null;

export function speakText(text, langOverride = null) {
  if (!synth) {
    console.warn('[Speech] Web Speech API not supported in this browser.');
    return;
  }

  stopSpeech();

  const lang = langOverride || store.get().language || 'en';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9; // Slightly slower for senior accessibility
  utterance.pitch = 1.0;

  // Find preferred voice
  const voices = synth.getVoices();
  if (lang === 'hi') {
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    utterance.lang = 'hi-IN';
  } else {
    const enVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (enVoice) {
      utterance.voice = enVoice;
    }
    utterance.lang = 'en-IN';
  }

  currentUtterance = utterance;
  synth.speak(utterance);
}

export function stopSpeech() {
  if (synth && synth.speaking) {
    synth.cancel();
    currentUtterance = null;
  }
}

export function initSpeechRecognition(onResult, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError('Voice recognition not supported on this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = store.get().language === 'hi' ? 'hi-IN' : 'en-IN';

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    if (onResult) onResult(speechResult);
  };

  recognition.onerror = (event) => {
    console.warn('[SpeechRecognition] Error:', event.error);
    if (onError) onError(event.error);
  };

  return recognition;
}
