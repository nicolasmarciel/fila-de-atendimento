/**
 * Professional Web Audio Chime and Brazilian Portuguese Speech Synthesis
 * Pure browser native, zero external audio asset dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a classic, pleasant 4-tone airport/hospital reception chime
 * Notes: F5 (698.46Hz) -> A5 (880Hz) -> C6 (1046.5Hz) -> F6 (1396.9Hz) with smooth decay
 */
export async function playQueueChime(volume = 0.8): Promise<void> {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1), now);
    masterGain.connect(ctx.destination);

    // Chime notes sequence (pitch in Hz, start offset in seconds, duration)
    const notes = [
      { freq: 587.33, start: 0.0, dur: 0.4 },   // D5
      { freq: 739.99, start: 0.15, dur: 0.45 }, // F#5
      { freq: 880.00, start: 0.32, dur: 0.5 },  // A5
      { freq: 1174.66, start: 0.50, dur: 0.8 }, // D6
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      // Sine wave with soft harmonic
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Natural chime envelope: rapid attack, smooth exponential decay
      noteGain.gain.setValueAtTime(0.0001, now + start);
      noteGain.gain.linearRampToValueAtTime(0.28, now + start + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    // Wait until chime finishes
    return new Promise((resolve) => setTimeout(resolve, 1100));
  } catch (err) {
    console.warn('Audio chime could not be played:', err);
  }
}

/**
 * Pronunciation helper for Brazilian Portuguese ticket formats
 * E.g., "SP-042" -> "Senha Preferencial S P zero quarenta e dois"
 */
export function formatSpeechText(ticketDisplay: string, categoryName: string, counterName: string, room?: string): string {
  // Extract letters and numbers
  const [prefix, numStr] = ticketDisplay.split('-');
  const cleanNumber = parseInt(numStr || '0', 10);
  
  let prefixPronunciation = '';
  if (prefix === 'SP') prefixPronunciation = 'Preferencial';
  else if (prefix === 'SG') prefixPronunciation = 'Geral';
  else if (prefix === 'SE') prefixPronunciation = 'Rápido';
  else if (prefix === 'SC') prefixPronunciation = 'Comercial';
  else prefixPronunciation = prefix.split('').join(' ');

  const destination = room ? `${counterName}, ${room}` : counterName;
  return `Senha ${prefixPronunciation}, ${cleanNumber}, dirija-se ao ${destination}`;
}

let speechQueue: string[] = [];
let isSpeaking = false;

function processSpeechQueue(rate = 0.95, pitch = 1.0) {
  if (isSpeaking || speechQueue.length === 0) return;
  if (!('speechSynthesis' in window)) return;

  const text = speechQueue.shift();
  if (!text) return;

  isSpeaking = true;
  window.speechSynthesis.cancel(); // Clear any hung speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = rate;
  utterance.pitch = pitch;

  // Try to find a Brazilian Portuguese voice
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang.startsWith('pt')) ||
                  voices.find(v => v.name.toLowerCase().includes('brazil') || v.name.toLowerCase().includes('portuguese'));
  if (ptVoice) {
    utterance.voice = ptVoice;
  }

  utterance.onend = () => {
    isSpeaking = false;
    setTimeout(() => processSpeechQueue(rate, pitch), 200);
  };

  utterance.onerror = () => {
    isSpeaking = false;
    setTimeout(() => processSpeechQueue(rate, pitch), 200);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Announces ticket via speech synthesis in Portuguese
 */
export function announceTicketSpeech(text: string, rate = 0.95, pitch = 1.0): void {
  if (!('speechSynthesis' in window)) return;
  speechQueue.push(text);
  processSpeechQueue(rate, pitch);
}

/**
 * Triggers chime followed by vocal announcement
 */
export async function playCallAlert(
  ticketDisplay: string,
  categoryName: string,
  counterName: string,
  room?: string,
  settings?: { soundEnabled: boolean; voiceEnabled: boolean; chimeVolume: number; speechRate: number; speechPitch: number }
): Promise<void> {
  const soundEnabled = settings?.soundEnabled ?? true;
  const voiceEnabled = settings?.voiceEnabled ?? true;
  const volume = settings?.chimeVolume ?? 0.8;
  const rate = settings?.speechRate ?? 0.95;
  const pitch = settings?.speechPitch ?? 1.0;

  if (soundEnabled) {
    await playQueueChime(volume);
  }

  if (voiceEnabled) {
    const text = formatSpeechText(ticketDisplay, categoryName, counterName, room);
    announceTicketSpeech(text, rate, pitch);
  }
}
