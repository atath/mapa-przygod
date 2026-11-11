// Draws the app icon from the game's own sprites (run by tools/make-icons.cjs in a headless browser).
import { heroSprite } from "../src/hero.js";
import { PETSPR } from "../src/pets.js";
import { SPR } from "../src/props.js";

window.makeIcon = (size) => {
  const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
  const k = size / 64;
  x.fillStyle = "#f4ead3"; x.fillRect(0, 0, size, size);
  x.fillStyle = "#74c24f"; x.fillRect(0, 38 * k, size, 26 * k);
  const put = (spr, lx, ly, sc) => x.drawImage(spr, lx * k, ly * k, (spr.width / 2) * sc * k, (spr.height / 2) * sc * k);
  put(SPR.tree, -2, 6, 2.2); put(SPR.tree, 34, 4, 2.2);
  put(heroSprite({ gender: "girl", hair: "tails", hairColor: "#8a5a2b", skin: "#f5d0b5", outfit: "#e2445c", hat: "none" }), 12, 16, 2.1);
  put(PETSPR.fox, 36, 34, 1.4);
  return c.toDataURL("image/png");
};
