import { GS } from "./state.js";
import { normalizeCamp } from "./camp-data.js";

/* ================== Save ==================
   Version 2 keeps every player profile and the parent settings under one key.
   The single-player save of version 1 is migrated on first start and left in
   place untouched, as a backup. */
// Storage keys keep the game's first name ("Leśna Wyprawa") on purpose: renaming them would lose saves.
export const KEY = "lesna-wyprawa"; // v1, read-only from now on
export const KEY2 = "lesna-wyprawa-v2";
export const SAVE_VERSION = 2;
// PIN 66647 of the first, single-player version: kept for players migrated from it
export const LEGACY_PIN_HASH = "9f09a3853e2cc699d01ed23d54c0ba2aa4c9ad5502a604c38d35dd271d986975";

const newId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function normalizeProfile(s, id) {
  s = s && typeof s === "object" ? s : {};
  const pets = Array.isArray(s.pets) ? s.pets.slice() : ["cat", "dog"];
  const petNames = s.petNames && typeof s.petNames === "object" ? Object.assign({}, s.petNames) : {};
  if (s.hero && s.hero.pet && !pets.includes(s.hero.pet)) pets.push(s.hero.pet);
  if (s.hero && s.hero.petName && !petNames[s.hero.pet]) petNames[s.hero.pet] = s.hero.petName;
  return {
    id: s.id || id || newId(), created: s.created || new Date().toISOString(),
    hero: s.hero || null, coins: s.coins | 0, owned: Array.isArray(s.owned) ? s.owned.slice() : ["none"],
    pets, petNames,
    level: [1, 2, 3].includes(s.level) ? s.level : 1, trips: s.trips | 0, fights: s.fights | 0,
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

export function save() {
  const db = GS.DB;
  if (GS.G && db.profiles[GS.G.id]) db.profiles[GS.G.id] = GS.G;
  try { localStorage.setItem(KEY2, JSON.stringify(db)); } catch (e) {}
}

export const profiles = () => GS.DB.order.map((id) => GS.DB.profiles[id]).filter(Boolean);
export function addProfile(p) {
  GS.DB.profiles[p.id] = p; if (!GS.DB.order.includes(p.id)) GS.DB.order.push(p.id);
  GS.DB.active = p.id; GS.G = p; save();
}
export function selectProfile(id) { if (!GS.DB.profiles[id]) return; GS.DB.active = id; GS.G = GS.DB.profiles[id]; save(); }
export function removeProfile(id) {
  delete GS.DB.profiles[id]; GS.DB.order = GS.DB.order.filter((x) => x !== id);
  GS.DB.active = GS.DB.order[0] || null; GS.G = GS.DB.active ? GS.DB.profiles[GS.DB.active] : null; save();
}

/* ---------- export / import: a plain-text file a parent can keep or move to another device ---------- */
export function exportText() {
  save();
  return JSON.stringify({ app: "mapa-przygod", v: SAVE_VERSION, exported: new Date().toISOString(), data: GS.DB });
}
// Replaces everything on this device with the imported save. Throws a message for the parent on bad input.
export function importText(text) {
  let o;
  try { o = JSON.parse(String(text).trim()); } catch (e) { throw new Error("To nie wygląda na zapis Mapy Przygód."); }
  const raw = o && (o.app === "mapa-przygod" || o.app === "lesna-wyprawa") ? o.data : o;
  const db = migrate(raw);
  if (!db.order.length) throw new Error("W tym zapisie nie ma żadnego gracza.");
  if (!db.settings.pinHash && GS.DB.settings.pinHash) db.settings.pinHash = GS.DB.settings.pinHash;
  GS.DB = db; GS.G = db.active ? db.profiles[db.active] : null; save();
  return db.order.length;
}
