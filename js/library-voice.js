import { LeeWayVoiceClient } from './vendor/leeway-voice-sdk.js';

const ORIGIN = 'https://4citeb4u.github.io/LeeWay-Voice-Fabric';
const STORAGE = 'leola.voice-role-assignments.v1';
const ROLES = {
  narrator: 'Book narrator',
  desk: 'Seated librarian',
  helper: 'Roaming assistant',
  Leola: 'Leola — book author passages',
  Needle: 'Needle (Silver Needle)',
  Yarn: 'Yarn (Soft Yarn)',
  Scissors: 'Scissors (Old Scissors)',
  Marker: 'Marker (Stitch Marker)',
  Tape: 'Measuring Tape',
  Hook: 'Crochet Hook'
};

export const DEFAULT_VOICES = {
  narrator: 'kokoro-af_heart', // Female narrator to read books (Heart · Kokoro)
  desk: 'kokoro-af_bella',      // Female seated librarian behind reception desk (Bella · Kokoro)
  helper: 'kokoro-af_sky',      // Female roaming assistant walking around (Sky · Kokoro)
  Leola: 'kokoro-af_sarah',     // Dedicated female voice for Leola reading her stories (Sarah · Kokoro)
  Needle: 'kokoro-am_michael',  // Male voice for Needle (Michael · Kokoro)
  Yarn: 'kokoro-af_alloy',      // Female voice for Yarn (Alloy · Kokoro)
  Scissors: 'kokoro-am_adam',   // Male voice for Scissors (Adam · Kokoro)
  Marker: 'kokoro-am_puck',     // Male voice for Marker (Puck · Kokoro)
  Tape: 'kokoro-af_nicole',     // Female voice for Measuring Tape (Nicole · Kokoro)
  Hook: 'kokoro-af_aoede'       // Female voice for Crochet Hook (Aoede · Kokoro)
};

export function installLibraryVoice(world) {
  if (world.libraryVoice) return world.libraryVoice;
  const client = new LeeWayVoiceClient({ origin: ORIGIN, timeoutMs: 45000 });
  let assignments = { ...DEFAULT_VOICES }, voices = [], generation = 0, narrationGeneration = 0, connection, preparation, activeLocalAudio = null;
  try { const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    for (const role of Object.keys(ROLES)) if (typeof saved[role] === 'string' && saved[role]) assignments[role] = saved[role];
  } catch { /* Local storage can be unavailable; session assignments still work. */ }
  const state = { connection: 'disconnected', engine: 'unprepared', speaking: false, error: '', progress: '' };
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'library-voice-heading');
  dialog.style.cssText = 'max-width:540px;width:calc(100% - 40px);max-height:85vh;overflow:auto;background:#fff8e9;color:#392616;border:3px solid #9a6b35;border-radius:16px;padding:24px;';
  const title = document.createElement('h2'); title.id = 'library-voice-heading'; title.textContent = 'Library voice setup'; dialog.append(title);
  const explanation = document.createElement('p'); explanation.textContent = 'Choose a voice for each character or narrator. Pre-selected female voices are assigned for the narrator, seated librarian, walking assistant (Sky), and Leola. Male voices are assigned for Needle (Michael), Scissors (Adam), and Marker (Puck), with Yarn in her signature voice (Alloy). Preparing a voice downloads the speech model to this browser.'; dialog.append(explanation);
  const notice = document.createElement('p'); notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite'); dialog.append(notice);
  const form = document.createElement('form'); form.method = 'dialog'; dialog.append(form);
  const selectors = {};
  for (const [role, labelText] of Object.entries(ROLES)) {
    const label = document.createElement('label'); label.style.cssText = 'display:block;margin:12px 0;'; label.textContent = labelText;
    const select = document.createElement('select'); select.style.cssText = 'display:block;width:100%;padding:8px;'; select.setAttribute('aria-label', labelText);
    label.append(select); form.append(label); selectors[role] = select;
  }
  const button = (text, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.style.cssText = 'margin:6px;padding:9px 12px;'; b.addEventListener('click', fn); form.append(b); return b; };
  function publish() {
    notice.textContent = `Voice Fabric: ${state.connection}. Speech engine: ${state.engine}. ${state.progress} ${state.error}`.trim();
    window.dispatchEvent(new CustomEvent('library-voice-state', { detail: { ...state, assignments: { ...assignments }, voiceCount: voices.length } }));
  }
  function populate() {
    for (const role of Object.keys(ROLES)) {
      const select = selectors[role]; select.replaceChildren(new Option('Not assigned', ''));
      for (const voice of voices) {
        const isFemale = voice.gender === 'female' || voice.id?.startsWith('kokoro-af_') || voice.id?.startsWith('kokoro-bf_');
        const tag = isFemale ? ' [Female]' : (voice.gender === 'male' || voice.id?.startsWith('kokoro-am_') || voice.id?.startsWith('kokoro-bm_') ? ' [Male]' : '');
        select.add(new Option((voice.name || voice.displayName || voice.id) + tag, voice.id));
      }
      const current = assignments[role] || DEFAULT_VOICES[role];
      if (current && !voices.some(v => v.id === current)) {
        const cleanName = current.replace(/^kokoro-/, '') + ' [Default assigned]';
        select.add(new Option(cleanName, current));
      }
      select.value = current || '';
    }
  }
  async function connect() {
    if (connection) return connection;
    state.connection = 'connecting'; state.error = ''; publish();
    connection = (async () => {
      try { await client.connect(); const result = await client.listVoices();
        voices = Array.isArray(result.voices) ? result.voices.filter(v => typeof v.id === 'string') : [];
        state.connection = 'connected'; populate(); publish(); return voices;
      } catch (error) { state.connection = 'unavailable'; state.error = error.message; publish(); throw error; }
    })();
    return connection;
  }
  button('Save choices', () => {
    assignments = Object.fromEntries(Object.entries(selectors).filter(([, select]) => select.value).map(([role, select]) => [role, select.value]));
    try { localStorage.setItem(STORAGE, JSON.stringify(assignments)); state.error = ''; }
    catch { state.error = 'Choices work this session but could not be saved on this device.'; }
    state.progress = 'Voice choices saved. Speech starts only when you request it.'; publish();
  });
  button('Reset to defaults', () => {
    assignments = { ...DEFAULT_VOICES };
    try { localStorage.setItem(STORAGE, JSON.stringify(assignments)); state.error = ''; } catch {}
    populate();
    state.progress = 'Reset to default female voices.'; publish();
  });
  button('Refresh voices', async () => {
    try { await connect(); const result = await client.listVoices(); voices = result.voices || []; populate(); state.error = ''; publish(); }
    catch (error) { state.error = error.message; publish(); }
  });
  button('Stop speech', () => { api.stop().catch(() => {}); });
  button('Close', () => dialog.close());
  document.body.append(dialog); populate();
  client.on('voice.state', event => { state.progress = event?.message || event?.status || ''; publish(); });
  client.on('voice.error', event => { state.error = event?.message || 'Voice Fabric reported an error.'; state.speaking = false; publish(); });
  let currentVoiceId = null;
  const api = {
    client, connect,
    get status() { return { ...state, assignments: { ...assignments }, voiceCount: voices.length }; },
    getVoices: () => voices.map(v => ({ ...v })),
    openSetup() { populate(); if (!dialog.open) dialog.showModal(); connect().catch(() => {}); },
    attachMenu(target) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) return null;
      const existing = container.querySelector('[data-library-voice-setup]'); if (existing) return existing;
      const entry = document.createElement('button'); entry.type = 'button'; entry.dataset.libraryVoiceSetup = ''; entry.textContent = 'Library voices';
      entry.addEventListener('click', () => api.openSetup()); container.append(entry); return entry;
    },
    async speak(text, role = 'narrator', narrationToken = null) {
      if (narrationToken === null) {
        narrationGeneration++;
        await api.stop().catch(() => {});
      }
      if (!Object.hasOwn(ROLES, role)) throw new Error('Unknown library voice role.');
      const clean = String(text || '').trim();
      if (!clean) return { skipped: true };
      let id = assignments[role] || DEFAULT_VOICES[role];
      if (!id) { state.error = `Choose a voice for ${ROLES[role]} in Library voices first.`; publish(); api.openSetup(); throw new Error(state.error); }
      const turn = ++generation;
      const cleanVoiceId = id.replace(/^kokoro-/, '');

      // Instant speech synthesis path via fast local Kokoro service proxy (<1 second)
      try {
        const response = await fetch('/api/voice/synthesize.wav', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId: cleanVoiceId, text: clean })
        });
        if (response.ok) {
          const blob = await response.blob();
          if (turn !== generation) return { stopped: true };
          if (blob && blob.size > 100) {
            state.speaking = true; state.error = ''; publish();
            return await new Promise((resolve, reject) => {
              const audioUrl = URL.createObjectURL(blob);
              const audio = new Audio(audioUrl);
              audio.playbackRate = 1.14;
              activeLocalAudio = audio;
              const cleanup = () => {
                URL.revokeObjectURL(audioUrl);
                if (activeLocalAudio === audio) activeLocalAudio = null;
                if (turn === generation) { state.speaking = false; publish(); }
              };
              audio.onended = () => {
                cleanup();
                resolve({ completed: true, localFast: true });
              };
              audio.onerror = (e) => {
                cleanup();
                reject(new Error('Audio playback failed'));
              };
              audio.play().catch(err => {
                cleanup();
                reject(err);
              });
            });
          }
        }
      } catch (fastErr) {
        console.warn('Fast local voice proxy bypassed, using client bridge fallback:', fastErr.message);
      }

      try {
        await connect();
        if (!voices.some(v => v.id === id)) {
          const isMale = id.startsWith('kokoro-am_') || id.startsWith('kokoro-bm_');
          const fallback = voices.find(v => isMale ? (v.gender === 'male' || v.id.startsWith('kokoro-am_') || v.id.startsWith('kokoro-bm_')) : (v.gender === 'female' || v.id.startsWith('kokoro-af_') || v.id.startsWith('kokoro-bf_'))) || voices[0];
          if (fallback) id = fallback.id;
          else throw new Error('The assigned voice is unavailable in this browser. Choose an available voice.');
        }
        if (turn !== generation) return { stopped: true };
        // Prepare first: the bridge restores its default reference during prepare.
        if (state.engine !== 'prepared') {
          state.engine = 'preparing'; state.error = ''; publish();
          preparation ||= client.prepare().finally(() => { preparation = null; });
          await preparation; state.engine = 'prepared'; publish();
        }
        if (turn !== generation) return { stopped: true };
        if (currentVoiceId !== id) {
          await client.selectVoice(id);
          currentVoiceId = id;
        }
        await client.configure({ pace: 1.14 }).catch(() => {});
        if (turn !== generation) return { stopped: true };
        state.speaking = true; state.error = ''; publish();
        const result = await client.speak(clean);
        return result;
      } catch (error) {
        if (state.engine === 'preparing') state.engine = 'unprepared';
        state.error = error.message; publish(); throw error;
      } finally { if (turn === generation) { state.speaking = false; publish(); } }
    },
    async readBook(bookId, { pageIndex = 0 } = {}) {
      await api.stop(); const token = ++narrationGeneration;
      const path = bookId === 'needle-and-yarn' ? 'content/needle-and-yarn-audiobook-script.json' : bookId === 'crochet-mastery' ? 'content/crochet-mastery-chapters.json' : null;
      if (!path) throw new Error('No verified narration text is available for this book.');
      const response = await fetch(path); if (!response.ok) throw new Error('The original book narration text could not load.');
      const data = await response.json();
      if (token !== narrationGeneration) return { stopped: true };
      const start = Math.max(0, Math.floor(Number(pageIndex) || 0));
      const segments = bookId === 'needle-and-yarn'
        ? data.pages.filter(page => page.pageIndex >= start).flatMap(page => page.segments.map(segment => ({ ...segment, pageIndex: page.pageIndex })))
        : data.chapters.slice(start).map((chapter, index) => ({ speaker: 'narrator', text: chapter.text, pageIndex: start + index }));
      const missing = [...new Set(segments.map(segment => segment.speaker))].filter(role => !Object.hasOwn(ROLES, role) || !(assignments[role] || DEFAULT_VOICES[role]));
      if (missing.length) { state.error = `Choose voices for ${missing.join(', ')} before reading this book.`; publish(); api.openSetup(); throw new Error(state.error); }
      for (const segment of segments) {
        if (token !== narrationGeneration) return { stopped: true };
        window.dispatchEvent(new CustomEvent('library-narration-page', { detail: { bookId, pageIndex: segment.pageIndex, speaker: segment.speaker } }));
        // Split long passages at natural sentence boundaries for fluid continuous reading
        const sentences = segment.text
          .split(/(?<=[.!?]["']?)\s+/)
          .map(s => s.trim())
          .filter(Boolean);
        const list = sentences.length ? sentences : [segment.text.trim()];
        for (const sentence of list) {
          if (token !== narrationGeneration) return { stopped: true };
          try { await api.speak(sentence, segment.speaker, token); }
          catch (error) { if (token !== narrationGeneration) return { stopped: true }; throw error; }
        }
      }
      return token === narrationGeneration ? { completed: true } : { stopped: true };
    },
    async stop() {
      narrationGeneration++;
      generation++;
      currentVoiceId = null;
      if (activeLocalAudio) {
        try { activeLocalAudio.pause(); activeLocalAudio.currentTime = 0; } catch {}
        activeLocalAudio = null;
      }
      state.speaking = false;
      publish();
      if (state.connection === 'connected') return client.stop();
      return { stopped: true };
    }
  };
  world.libraryVoice = api;
  connect().then(() => {
    if (state.engine !== 'prepared') {
      state.engine = 'preparing'; publish();
      preparation ||= client.prepare().then(() => { state.engine = 'prepared'; publish(); }).catch(() => {});
    }
  }).catch(() => {});
  return api;
}
