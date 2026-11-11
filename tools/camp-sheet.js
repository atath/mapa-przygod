import { HOUSE, WELL, LIBRARY, PLANT_SPR, DECOR_SPR } from "../src/camp-art.js";
window.sheet = () => {
  const c = document.createElement("canvas"); c.width = 1300; c.height = 560; const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
  x.fillStyle = "#74c24f"; x.fillRect(0, 0, 1300, 560);
  let X = 10; const put = (s, y, k = 4) => { x.drawImage(s, X, y, s.width * k, s.height * k); X += s.width * k + 14; };
  HOUSE.forEach((s) => put(s, 6, 3.6)); [1, 2, 3].forEach((l) => put(WELL[l], 30, 3)); [1, 2, 3].forEach((l) => put(LIBRARY[l], 30, 3));
  X = 10; for (const t in PLANT_SPR) PLANT_SPR[t].forEach((s) => put(s, 200, 2.6));
  X = 10; for (const k in DECOR_SPR) put(DECOR_SPR[k], 330, 4);
  return c.toDataURL();
};
