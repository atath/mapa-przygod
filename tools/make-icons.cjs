const { chromium } = require("playwright"); const { build } = require("esbuild"); const fs = require("fs");
(async () => {
  const js = (await build({ entryPoints: ["tools/icon.js"], bundle: true, write: false, format: "iife" })).outputFiles[0].text;
  const b = await chromium.launch(); const p = await b.newPage();
  p.on("pageerror", (e) => console.log("ERR", e.message)); await p.setContent(`<!doctype html><body><canvas id="fx"></canvas><div id="praise"></div><main id="app"></main><script>${js}</script>`);
  for (const s of [192, 512]) fs.writeFileSync(`public/icon-${s}.png`, Buffer.from((await p.evaluate((s) => makeIcon(s), s)).split(",")[1], "base64"));
  await b.close(); console.log("icons written");
})();
