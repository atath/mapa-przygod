import { GS } from "./state.js";
import { DIRT, GRASS, ICON, PAINT, SPR, tile } from "./props.js";
import { PETSPR } from "./pets.js";
import { url } from "./sprites.js";
import { pick, shuffle } from "./util.js";

/* ================== Lands ==================
   A land decides WHAT the expedition is about (look, story, kinds of rooms);
   the player's level decides how hard the tasks are. Every land keeps all subjects. */

// Built on first use: this module is imported while props.js may still be loading.
export let MSPR = null;
export const LANDS = {};
function init() {
  if (MSPR) return;
  MSPR = {
    pine: PAINT(32, 32, { G: "#2f7d55", g: "#1f5c3e", H: "#58b07f", W: "#f4f8fb", T: "#7a4b2a" }, (g) => {
      g.rect(14, 26, 4, 5, "T");
      g.poly([[16, 1], [24, 12], [8, 12]], "G"); g.poly([[16, 6], [27, 19], [5, 19]], "G"); g.poly([[16, 12], [29, 27], [3, 27]], "G");
      g.poly([[16, 6], [27, 19], [16, 19]], "g", "G"); g.poly([[16, 12], [29, 27], [16, 27]], "g", "G");
      g.line(10, 11, 13, 9, "H"); g.line(8, 18, 12, 16, "H"); g.line(6, 26, 10, 24, "H");
      g.poly([[16, 1], [19, 5], [13, 5]], "W"); g.line(8, 12, 12, 11, "W"); g.line(20, 11, 24, 12, "W");
      g.line(5, 19, 10, 18, "W"); g.line(22, 18, 27, 19, "W"); g.line(3, 27, 8, 26, "W"); g.line(24, 26, 29, 27, "W");
    }),
    edelweiss: PAINT(32, 32, { W: "#ffffff", Y: "#ffd23f", g: "#5f9b6a" }, (g) => {
      g.line(16, 25, 16, 30, "g"); g.ell(14, 28, 1.6, 0.8, "g");
      for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; g.ell(16 + Math.cos(a) * 2.6, 22 + Math.sin(a) * 2.6, 1.5, 1.5, "W"); }
      g.ell(16, 22, 1.2, 1.2, "Y");
    }, false),
    clock: PAINT(32, 32, { B: "#7a4b2a", C: "#fff6dc", K: "#2a1d2e", R: "#e8442c", Y: "#ffcf3a" }, (g) => {
      g.ell(16, 16, 12.4, 12.4, "B"); g.ell(16, 16, 10.2, 10.2, "C");
      for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.px(Math.round(16 + Math.cos(a) * 8.4), Math.round(16 + Math.sin(a) * 8.4), "K"); }
      g.line(16, 16, 16, 10, "K"); g.line(16, 16, 20, 16, "R"); g.ell(16, 16, 1.2, 1.2, "Y");
      g.rect(14, 2, 4, 2, "B");
    }),
    hourglass: PAINT(32, 32, { T: "#b07440", t: "#7a4b2a", G: "#d9f0ff", Y: "#f0c35a" }, (g) => {
      g.rect(8, 3, 16, 3, "T"); g.rect(8, 26, 16, 3, "T"); g.rect(9, 6, 2, 20, "t"); g.rect(21, 6, 2, 20, "t");
      g.poly([[11, 6], [21, 6], [16, 16]], "G"); g.poly([[16, 16], [21, 26], [11, 26]], "G");
      g.poly([[13, 9], [19, 9], [16, 14]], "Y"); g.poly([[16, 19], [20, 26], [12, 26]], "Y"); g.line(16, 15, 16, 19, "Y");
    }),
    stone: PAINT(32, 32, { S: "#9aa3ad", s: "#6f7882", A: "#c9d1db" }, (g) => {
      g.rect(6, 14, 20, 16, "S"); g.rect(4, 12, 24, 3, "s"); g.rect(4, 29, 24, 2, "s");
      g.line(8, 18, 12, 18, "s"); g.line(18, 23, 23, 23, "s"); g.line(6, 15, 10, 15, "A");
    })
  };
  Object.assign(ICON, { pine: url(MSPR.pine), clock: url(MSPR.clock), time: url(MSPR.hourglass), logic: url(PETSPR.owl) });
  const ALP = [1, 2, 3].map((s) => tile("#8dbb72", [["#7da862", 18], ["#a2c98a", 10], ["#9aa3ad", 4], ["#c7ced6", 3]], s * 71, s === 2 ? 2 : 1));
  const GRAVEL = [1, 2].map((s) => tile("#cfc6b6", [["#b9af9d", 16], ["#ded7ca", 10], ["#9a917f", 5], ["#efeae0", 3]], s * 53, 0));

  Object.assign(LANDS, {
    forest: {
      key: "forest", name: "Las", desc: "Ścieżki ze strzałek, potwory, zaczarowane drzwi i drogowskazy.",
      pathLabel: "Leśna ścieżka", go: "Ruszamy do lasu!", ground: GRASS, lane: DIRT, tree: SPR.tree, treeHit: "Bum! Drzewo na drodze.",
      flowers: [SPR.flower1, SPR.flower2], hedge: ["#2c6e36", "#3f9b4a", "#357f3e", "#7ccf6a"],
      exits: (n) => shuffle(["monster", "door", "sign"]).slice(0, n)
    },
    mountains: {
      key: "mountains", name: "Góry Zegarowe", desc: "Wieża zegarowa i kamień czasu: odczytaj zegar i wyczuj, ile co trwa.",
      pathLabel: "Górski szlak", go: "Ruszamy w góry!", ground: ALP, lane: GRAVEL, tree: MSPR.pine, treeHit: "Bum! Świerk na drodze.",
      flowers: [MSPR.edelweiss, SPR.flower2], hedge: ["#4d5560", "#6b7580", "#5b646e", "#b4bec8"],
      // every choice of exits offers something about time; the rest keeps maths and reading in play
      exits: (n) => { const t = pick(["clock", "time"]); return shuffle([t, ...shuffle(["monster", "door", "sign", t === "clock" ? "time" : "clock"]).slice(0, n - 1)]); }
    }
  });
}
export const LAND_ORDER = ["forest", "mountains"];
export const UNLOCK_TRIPS = 8; // a new player opens the mountains after this many expeditions
export const lands = () => { init(); return LANDS; };
export const land = () => { init(); return LANDS[(GS.RUN && GS.RUN.land) || "forest"] || LANDS.forest; };
export const msprites = () => { init(); return MSPR; };
