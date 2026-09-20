export const STATE_SCHEMA_VERSION = 2;
const DB_NAME = 'leola-learning-library';
const STORE = 'state';
const ROOT_KEY = 'app';
const FALLBACK_KEY = 'leola.learning.library.state.v2';
const LEGACY_KEYS = {
  learning: 'leola.learning.v1',
  cozy: 'leola.cozy.member.v1',
  member: 'leola.learning.library.member.v2',
  games: 'leola.game.progress.v1'
};
const ROOMS = ['loop', 'tension', 'pattern', 'amigurumi', 'yarnfolk'];
const BOOKS = ['needle-and-yarn', 'crochet-mastery'];

export function freshState() {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    migrationVersion: 1,
    guest: { name: '', cardId: null, issuedAt: null },
    location: { route: 'index.html', view: 'outside', updatedAt: null },
    carryingBook: null,
    books: {},
    lessons: {},
    games: Object.fromEntries(ROOMS.map(id => [id, { complete: false, bestScore: 0, progress: 0, updatedAt: null }])),
    settings: { sound: true, reducedMotion: false, captions: true },
    updatedAt: null
  };
}

function object(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function text(v, max = 120) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function iso(v) { return typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null; }
function num(v, min = 0, max = Number.MAX_SAFE_INTEGER) { v = Number(v); return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min; }

export function normalizeState(raw) {
  const base = freshState();
  if (!object(raw)) return base;
  const guest = object(raw.guest) ? raw.guest : {};
  base.guest = { name: text(guest.name, 60), cardId: text(guest.cardId, 40) || null, issuedAt: iso(guest.issuedAt) };
  const loc = object(raw.location) ? raw.location : {};
  base.location = { route: text(loc.route, 100) || 'index.html', view: text(loc.view, 40) || 'outside', updatedAt: iso(loc.updatedAt) };
  
  if (object(raw.books)) {
    base.books = { ...raw.books };
  }
  if (object(raw.settings)) {
    base.settings = { ...base.settings, ...raw.settings };
  }

  if (object(raw.games)) {
    for (const id of ROOMS) {
      const g = raw.games[id];
      if (object(g)) {
        base.games[id] = {
          complete: Boolean(g.complete || g.isComplete),
          bestScore: num(g.bestScore ?? g.score),
          progress: num(g.progress ?? g.completed),
          updatedAt: iso(g.updatedAt || g.savedAt)
        };
      }
    }
  }
  return base;
}

export function migrateLegacy(read = (k) => localStorage.getItem(k)) {
  const next = freshState();
  const parse = k => { try { return JSON.parse(read(k) || 'null'); } catch { return null; } };
  const learning = parse(LEGACY_KEYS.learning);
  if (object(learning)) {
    next.guest.name = text(learning.displayName, 60);
    next.guest.cardId = text(learning.cardId, 40) || null;
  }
  return normalizeState(next);
}

class StateManager extends EventTarget {
  constructor() {
    super();
    this.state = freshState();
    this.ready = this.init();
    this.channel = null;
    try {
      this.channel = new BroadcastChannel('leola-learning-library-v2');
      this.channel.onmessage = e => this.receive(e.data);
    } catch (e) {}
  }

  async init() {
    let raw = null;
    try { raw = await idbGet(); } catch (e) { raw = fallbackRead(); }
    if (!raw) { raw = migrateLegacy(); await this.write(raw); }
    this.state = normalizeState(raw);
    return this.snapshot();
  }

  snapshot() { return structuredClone ? structuredClone(this.state) : JSON.parse(JSON.stringify(this.state)); }

  async write(value, { broadcast = true } = {}) {
    const next = normalizeState({ ...value, updatedAt: new Date().toISOString() });
    let persisted = false;
    try { persisted = await idbSet(next); } catch (e) { persisted = fallbackWrite(next); }
    this.state = next;
    if (broadcast) this.channel?.postMessage({ type: 'state', state: next });
    this.dispatchEvent(new CustomEvent('change', { detail: { state: this.snapshot(), persisted } }));
    return persisted;
  }

  async patch(patch) {
    await this.ready;
    const next = { ...this.state, ...patch };
    return this.write(next);
  }

  async setGame(id, record) {
    if (!ROOMS.includes(id)) throw Error('Unknown game room');
    return this.patch({
      games: {
        ...this.state.games,
        [id]: { ...this.state.games[id], ...record, updatedAt: new Date().toISOString() }
      }
    });
  }

  async setBook(id, record) {
    if (!BOOKS.includes(id)) throw Error('Unknown book');
    return this.patch({
      books: {
        ...this.state.books,
        [id]: { ...(this.state.books[id] || {}), ...record, lastRead: new Date().toISOString() }
      }
    });
  }

  receive(msg) {
    if (msg?.type !== 'state' || !object(msg.state)) return;
    const incoming = normalizeState(msg.state);
    if ((Date.parse(incoming.updatedAt) || 0) <= (Date.parse(this.state.updatedAt) || 0)) return;
    this.state = incoming;
    this.dispatchEvent(new CustomEvent('change', { detail: { state: this.snapshot(), remote: true } }));
  }
}

// IndexedDB Helpers
function idbGet() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess = e => {
      const tx = e.target.result.transaction(STORE, 'readonly');
      const getReq = tx.objectStore(STORE).get(ROOT_KEY);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = reject;
    };
    req.onerror = reject;
  });
}

function idbSet(value) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess = e => {
      const tx = e.target.result.transaction(STORE, 'readwrite');
      const putReq = tx.objectStore(STORE).put(value, ROOT_KEY);
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = reject;
    };
    req.onerror = reject;
  });
}

function fallbackRead() { try { return JSON.parse(localStorage.getItem(FALLBACK_KEY)); } catch { return null; } }
function fallbackWrite(value) { try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(value)); return true; } catch { return false; } }

export const stateManager = new StateManager();
