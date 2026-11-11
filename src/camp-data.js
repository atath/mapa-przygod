/* ================== Camp: buildings, decorations, effects ==================
   Every building has 3 levels. Each level changes how the camp looks and gives
   something concrete on expeditions — never an easier task, only more room to act. */

export const BUILDINGS = {
  house: {
    name: "Dom", cost: [20, 50, 100],
    levels: ["Namiot", "Szałas", "Chatka", "Domek na drzewie"],
    effect: (l) => (l ? `+${l} ${l === 1 ? "moneta" : "monety"} w każdej skrzyni` : "Tu śpicie po wyprawie"),
    tile: [0, 1], size: 2
  },
  well: {
    name: "Studnia", cost: [15, 35, 70],
    levels: ["", "Studnia", "Studnia z daszkiem", "Studnia z wiadrem"],
    effect: (l) => `+${l} ${l === 1 ? "serduszko" : "serduszka"} na wyprawie`,
    tile: [6, 1], size: 1
  },
  garden: {
    name: "Ogródek", cost: [10, 30, 60],
    levels: ["", "Jedna grządka", "Dwie grządki", "Trzy grządki"],
    effect: (l) => `${l} ${l === 1 ? "grządka" : "grządki"}: rośliny rosną po każdej wyprawie, plon daje 3 monety`,
    tile: [5, 4], size: 1
  },
  library: {
    name: "Biblioteczka", cost: [25, 50, 90],
    levels: ["", "Skrzynka z książkami", "Półka z daszkiem", "Biblioteczka z latarenką"],
    effect: (l) => `${l} ${l === 1 ? "podpowiedź" : "podpowiedzi"} na wyprawę (drzwi, drogowskazy, skrzynia)`,
    tile: [3, 1], size: 1
  },
  pen: {
    name: "Zagroda", cost: [20, 40, 80],
    levels: ["", "Mała zagroda", "Średnia zagroda", "Duża zagroda"],
    effect: (l) => `${[0, 2, 4, 9][l]} ${l === 1 ? "zwierzaki zostają" : "zwierzaków zostaje"} w obozie`,
    tile: [0, 3], size: 2
  }
};
export const BUILD_ORDER = ["house", "well", "garden", "library", "pen"];

export const DECOR = {
  flowers: { name: "Kwiaty", price: 5 },
  mushroom: { name: "Grzybek", price: 5 },
  fence: { name: "Płotek", price: 8 },
  bench: { name: "Ławka", price: 10 },
  lantern: { name: "Lampion", price: 12 },
  flag: { name: "Flaga", price: 15 },
  runestone: { name: "Kamień z runą", price: 15 },
  snowman: { name: "Bałwanek", price: 20 }
};

export const PLANTS = ["carrot", "pumpkin", "strawberry"];
export const PLANT_NAME = { carrot: "marchewka", pumpkin: "dynia", strawberry: "truskawka" };
export const RIPE = 3; // growth stages: 0 seed, 1 sprout, 2 leaves, 3 ripe

// camp grid: 8 × 5 tiles; row 0 is the tree line
export const CAMP_COLS = 8, CAMP_ROWS = 5;
export const FIRE_TILE = [3, 3];
export const HERO_TILES = [[2, 3], [4, 3]];

export function defaultCamp() {
  return { b: { house: 0, well: 0, garden: 0, library: 0, pen: 0 }, inv: {}, decor: [], beds: [] };
}
export function normalizeCamp(c) {
  const d = defaultCamp();
  if (!c || typeof c !== "object") return d;
  for (const k of BUILD_ORDER) d.b[k] = Math.max(0, Math.min(3, (c.b && c.b[k]) | 0));
  if (c.inv && typeof c.inv === "object") for (const k in c.inv) if (DECOR[k]) d.inv[k] = Math.max(0, c.inv[k] | 0);
  if (Array.isArray(c.decor)) {
    const used = new Set();
    d.decor = c.decor.filter((x) => x && DECOR[x.k] && Number.isInteger(x.c) && Number.isInteger(x.r) && x.c >= 0 && x.c < CAMP_COLS && x.r >= 1 && x.r < CAMP_ROWS && !used.has(x.c + "," + x.r) && used.add(x.c + "," + x.r))
      .map((x) => ({ k: x.k, c: x.c, r: x.r }));
  }
  if (Array.isArray(c.beds)) d.beds = c.beds.filter((x) => x && PLANTS.includes(x.p)).map((x) => ({ p: x.p, s: Math.max(0, Math.min(RIPE, x.s | 0)) }));
  d.beds = d.beds.slice(0, d.b.garden);
  while (d.beds.length < d.b.garden) d.beds.push({ p: PLANTS[d.beds.length % PLANTS.length], s: 0 });
  return d;
}

// tiles taken by buildings (built or not, so the layout never shifts) and the campfire area
export function blockedTiles() {
  const set = new Set();
  for (const k of BUILD_ORDER) {
    const B = BUILDINGS[k], [c, r] = B.tile;
    if (k === "garden") { for (let i = 0; i < 3; i++) set.add(`${c + i},${r}`); continue; }
    for (let dc = 0; dc < B.size; dc++) for (let dr = 0; dr < B.size; dr++) set.add(`${c + dc},${r + dr}`);
  }
  set.add(FIRE_TILE.join(",")); HERO_TILES.forEach((t) => set.add(t.join(",")));
  for (let c = 0; c < CAMP_COLS; c++) set.add(`${c},0`);
  return set;
}

// expedition effects
export const wellHearts = (camp) => camp.b.well;
export const houseBonus = (camp) => camp.b.house;
export const libraryHints = (camp) => camp.b.library;
export function growGarden(camp) { for (const b of camp.beds) if (b.s < RIPE) b.s++; }
