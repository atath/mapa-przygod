import { GS } from "./state.js";
import { normalizeCamp } from "./camp-data.js";

/* ================== Save ==================
   Version 2 keeps every player profile and the parent settings under one key.
   The single-player save of version 1 is migrated on first start and left in
   place untouched, as a backup. */
// Storage keys keep the game's first name ("Leśna Wyprawa") on purpose: renaming them would lose saves.
export const KEY = "lesna-wyprawa"; // v1, read-only from now on
export const KEY2 = "lesna-wyprawa-v2";
export const KEY_UNDO = "lesna-wyprawa-v2-undo"; // the whole save from before the last import or player deletion
export const SAVE_VERSION = 2;
// PIN 66647 of the first, single-player version: kept for players migrated from it
export const LEGACY_PIN_HASH = "9f09a3853e2cc699d01ed23d54c0ba2aa4c9ad5502a604c38d35dd271d986975";

const newId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// names are typed by a child or come from an imported file: short plain text only
export const cleanName = (v) => (typeof v === "string" ? v.replace(/[<>&"\u0000-\u001f]/g, "").trim().slice(0, 14) : "");
export function normalizeProfile(s, id) {
  s = s && typeof s === "object" ? s : {};
  const pets = Array.isArray(s.pets) ? s.pets.slice() : ["cat", "dog"];
  const petNames = s.petNames && typeof s.petNames === "object" ? Object.assign({}, s.petNames) : {};
  if (s.hero && s.hero.pet && !pets.includes(s.hero.pet)) pets.push(s.hero.pet);
  if (s.hero && s.hero.petName && !petNames[s.hero.pet]) petNames[s.hero.pet] = s.hero.petName;
  for (const k in petNames) { petNames[k] = cleanName(petNames[k]); if (!petNames[k]) delete petNames[k]; }
  const hero = s.hero && typeof s.hero === "object" ? Object.assign({}, s.hero, { name: cleanName(s.hero.name) }) : null;
  return {
    id: s.id || id || newId(), created: s.created || new Date().toISOString(),
    hero, coins: Math.max(0, s.coins | 0), owned: Array.isArray(s.owned) ? s.owned.slice() : ["none"],
    pets, petNames,
    level: [1, 2, 3].includes(s.level) ? s.level : 1, trips: Math.max(0, s.trips | 0), fights: Math.max(0, s.fights | 0),
    voice: s.voice !== false, sound: s.sound !== false,
    camp: normalizeCamp(s.camp)
  };
}
export const blankProfile = () => normalizeProfile({}, newId());
export const emptyDB = () => ({ v: SAVE_VERSION, settings: { pinHash: null }, profiles: {}, order: [], active: null });

// Turns a stored object of any known version into a version-2 database.
export function migrate(raw) {
  const db = emptyDB();
  if (raw && raw.v === 2 && raw.profiles && typeof raw.profiles === "object") {
    db.settings.pinHash = raw.settings && typeof raw.settings.pinHash === "string" ? raw.settings.pinHash : null;
    const order = Array.isArray(raw.order) ? raw.order : Object.keys(raw.profiles);
    for (const id of order) if (raw.profiles[id]) { db.profiles[id] = normalizeProfile(raw.profiles[id], id); db.order.push(id); }
    db.active = db.profiles[raw.active] ? raw.active : db.order[0] || null;
    return db;
  }
  if (raw && raw.hero) {
    const p = normalizeProfile(raw, newId());
    db.profiles[p.id] = p; db.order.push(p.id); db.active = p.id;
    db.settings.pinHash = LEGACY_PIN_HASH;
  }
  return db;
}

export function loadDB() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY2)); } catch (e) {}
  if (raw) return migrate(raw);
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  return migrate(raw);
}

GS.DB = loadDB();
GS.G = GS.DB.active ? GS.DB.profiles[GS.DB.active] : null;

/* The game may be open twice (two tabs, or the parent checks the panel while the child plays).
   Each copy keeps the whole save in memory, so the one that writes last would wipe the other's
   progress. When another copy writes, this one stops saving and asks to reload. */
let stale = false, onStale = null, lastJSON = null;
export const isStale = () => stale;
export function whenStale(fn) { onStale = fn; }
addEventListener("storage", (e) => {
  if (e.key !== KEY2 || stale || e.newValue == null) return;
  if (e.newValue === JSON.stringify(GS.DB)) { lastJSON = e.newValue; return; } // the same data: nothing to lose
  stale = true; if (onStale) onStale();
});
export function reloadDB() {
  const keep = GS.DB && GS.DB.active;
  GS.DB = loadDB(); if (keep && GS.DB.profiles[keep]) GS.DB.active = keep;
  GS.G = GS.DB.active ? GS.DB.profiles[GS.DB.active] : null; stale = false;
}

export let saveFailed = false;
export function save() {
  if (stale) return;
  const db = GS.DB;
  if (GS.G && db.profiles[GS.G.id]) db.profiles[GS.G.id] = GS.G;
  const json = JSON.stringify(db); if (json === lastJSON) return; // unchanged: no write, so other open copies are not disturbed
  try { localStorage.setItem(KEY2, json); lastJSON = json; saveFailed = false; } catch (e) { saveFailed = true; }
}
// keeps the current save so the parent can undo an import or a player deletion
function keepUndo() { try { localStorage.setItem(KEY_UNDO, JSON.stringify({ at: new Date().toISOString(), data: GS.DB })); } catch (e) {} }
export function undoInfo() { try { const u = JSON.parse(localStorage.getItem(KEY_UNDO)); return u && u.data ? u : null; } catch (e) { return null; } }
export function undoLast() {
  const u = undoInfo(); if (!u) return false;
  const db = migrate(u.data); if (!db.order.length) return false;
  db.settings.pinHash = GS.DB.settings.pinHash || db.settings.pinHash; // the PIN the parent just typed stays
  GS.DB = db; GS.G = db.active ? db.profiles[db.active] : null; save();
  try { localStorage.removeItem(KEY_UNDO); } catch (e) {}
  return true;
}
// asks the browser not to clear the save when space runs low (Chrome/Android honour it for installed apps)
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}

export const profiles = () => GS.DB.order.map((id) => GS.DB.profiles[id]).filter(Boolean);
export function addProfile(p) {
  GS.DB.profiles[p.id] = p; if (!GS.DB.order.includes(p.id)) GS.DB.order.push(p.id);
  GS.DB.active = p.id; GS.G = p; save();
}
export function selectProfile(id) { if (!GS.DB.profiles[id]) return; GS.DB.active = id; GS.G = GS.DB.profiles[id]; save(); }
export function removeProfile(id, undoable) {
  if (undoable) keepUndo();
  delete GS.DB.profiles[id]; GS.DB.order = GS.DB.order.filter((x) => x !== id);
  GS.DB.active = GS.DB.order[0] || null; GS.G = GS.DB.active ? GS.DB.profiles[GS.DB.active] : null; save();
}

/* ---------- export / import: a plain-text file a parent can keep or move to another device ---------- */
export function exportText() {
  save();
  // the PIN stays on the device: an unsalted hash of 4–8 digits would be easy to read back from a shared file
  const data = Object.assign({}, GS.DB, { settings: Object.assign({}, GS.DB.settings, { pinHash: null }) });
  return JSON.stringify({ app: "mapa-przygod", v: SAVE_VERSION, exported: new Date().toISOString(), data });
}
// Replaces everything on this device with the imported save. Throws a message for the parent on bad input.
export function importText(text) {
  let o;
  if (String(text).length > 2e6) throw new Error("Ten plik jest za duży jak na zapis Mapy Przygód.");
  try { o = JSON.parse(String(text).trim()); } catch (e) { throw new Error("To nie wygląda na zapis Mapy Przygód."); }
  const raw = o && (o.app === "mapa-przygod" || o.app === "lesna-wyprawa") ? o.data : o;
  const db = migrate(raw);
  if (!db.order.length) throw new Error("W tym zapisie nie ma żadnego gracza.");
  // this device's PIN wins: a save from someone else must not lock the parent out
  if (GS.DB.settings.pinHash) db.settings.pinHash = GS.DB.settings.pinHash;
  keepUndo();
  GS.DB = db; GS.G = db.active ? db.profiles[db.active] : null; save();
  return db.order.length;
}
