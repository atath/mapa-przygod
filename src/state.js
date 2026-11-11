// Shared mutable game state. Modules read and write GS.G (the save), GS.RUN (the
// current expedition), GS.scene (what the canvas loop draws) and GS.HERO (hero sprite).
export const GS = { DB: null, G: null, RUN: null, scene: null, HERO: null };
