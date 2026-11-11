const { chromium } = require("playwright"); const { build } = require("esbuild"); const fs = require("fs");
(async () => {
  const [entry, out] = process.argv.slice(2);
  const js = (await build({ entryPoints: [entry], bundle: true, write: false, format: "iife" })).outputFiles[0].text;
  const b = await chromium.launch(); const p = await b.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.setContent(`<!doctype html><body><canvas id="fx"></canvas><div id="praise"></div><main id="app"></main><script>${js}</script>`);
  fs.writeFileSync(out, Buffer.from((await p.evaluate(() => sheet())).split(",")[1], "base64")); await b.close(); console.log("ok");
})();
