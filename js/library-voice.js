import { LeeWayVoiceClient } from './vendor/leeway-voice-sdk.js';

const ORIGIN = 'https://4citeb4u.github.io/LeeWay-Voice-Fabric';
const STORAGE = 'leola.voice-role-assignments.v1';
const ROLES = { narrator: 'Book narrator', desk: 'Seated librarian', helper: 'Roaming assistant', Needle: 'Needle', Yarn: 'Yarn', Leola: 'Leola — book author passages' };

export function installLibraryVoice(world) {
  if (world.libraryVoice) return world.libraryVoice;
  const client = new LeeWayVoiceClient({ origin: ORIGIN, timeoutMs: 45000 });
  let assignments = {}, voices = [], generation = 0, narrationGeneration = 0, connection, preparation;
  try { const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    for (const role of Object.keys(ROLES)) if (typeof saved[role] === 'string') assignments[role] = saved[role];
  } catch { /* Local storage can be unavailable; session assignments still work. */ }
  const state = { connection: 'disconnected', engine: 'unprepared', speaking: false, error: '', progress: '' };
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'library-voice-heading');
  dialog.style.cssText = 'max-width:540px;width:calc(100% - 40px);max-height:85vh;overflow:auto;background:#fff8e9;color:#392616;border:3px solid #9a6b35;border-radius:16px;padding:24px;';
  const title = document.createElement('h2'); title.id = 'library-voice-heading'; title.textContent = 'Library voice setup'; dialog.append(title);
  const explanation = document.createElement('p'); explanation.textContent = 'Choose a voice for each character or narrator. No voice is assigned automatically. The three Chatterbox Default styles share one reference voice; their labels do not identify separate female voices. Preparing a voice downloads the speech model to this browser.'; dialog.append(explanation);
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
      for (const voice of voices) select.add(new Option(voice.name || voice.displayName || voice.id, voice.id));
      if (assignments[role] && !voices.some(v => v.id === assignments[role])) select.add(new Option('Previously chosen voice — unavailable', assignments[role]));
      select.value = assignments[role] || '';
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
  button('Refresh voices', async () => {
    try { await connect(); const result = await client.listVoices(); voices = result.voices || []; populate(); state.error = ''; publish(); }
    catch (error) { state.error = error.message; publish(); }
  });
  button('Stop speech', () => { api.stop().catch(() => {}); });
  button('Close', () => dialog.close());
  document.body.append(dialog); populate();
  client.on('voice.state', event => { state.progress = event?.message || event?.status || ''; publish(); });
  client.on('voice.error', event => { state.error = event?.message || 'Voice Fabric reported an error.'; state.speaking = false; publish(); });
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
      if (narrationToken === null) narrationGeneration++;
      if (!Object.hasOwn(ROLES, role)) throw new Error('Unknown library voice role.');
      if (!String(text).trim()) return { skipped: true };
      const id = assignments[role];
      if (!id) { state.error = `Choose a voice for ${ROLES[role]} in Library voices first.`; publish(); api.openSetup(); throw new Error(state.error); }
      const turn = ++generation;
      try {
        await connect();
        if (!voices.some(v => v.id === id)) throw new Error('The assigned voice is unavailable in this browser. Choose an available voice.');
        await client.stop(); if (turn !== generation) return { stopped: true };
        // Prepare first: the bridge restores its default reference during prepare.
        if (state.engine !== 'prepared') {
          state.engine = 'preparing'; state.error = ''; publish();
          preparation ||= client.prepare().finally(() => { preparation = null; });
          await preparation; state.engine = 'prepared'; publish();
        }
        if (turn !== generation) return { stopped: true };
        await client.selectVoice(id); if (turn !== generation) return { stopped: true };
        state.speaking = true; state.error = ''; publish();
        const result = await client.speak(String(text));
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
      const missing = [...new Set(segments.map(segment => segment.speaker))].filter(role => !Object.hasOwn(ROLES, role) || !assignments[role]);
      if (missing.length) { state.error = `Choose voices for ${missing.join(', ')} before reading this book.`; publish(); api.openSetup(); throw new Error(state.error); }
      for (const segment of segments) {
        // Slice exact source text without paraphrasing or adding speaker labels.
        let remaining = segment.text;
        while (remaining.length) {
          if (token !== narrationGeneration) return { stopped: true };
          let end = Math.min(remaining.length, 500);
          if (end < remaining.length) { const gap = remaining.lastIndexOf(' ', end); if (gap > 200) end = gap + 1; }
          const chunk = remaining.slice(0, end); remaining = remaining.slice(end);
          window.dispatchEvent(new CustomEvent('library-narration-page', { detail: { bookId, pageIndex: segment.pageIndex, speaker: segment.speaker } }));
          try { await api.speak(chunk, segment.speaker, token); }
          catch (error) { if (token !== narrationGeneration) return { stopped: true }; throw error; }
        }
      }
      return token === narrationGeneration ? { completed: true } : { stopped: true };
    },
    async stop() { narrationGeneration++; generation++; state.speaking = false; publish(); if (state.connection === 'connected') return client.stop(); return { stopped: true }; }
  };
  world.libraryVoice = api;
  connect().catch(() => {});
  return api;
}
