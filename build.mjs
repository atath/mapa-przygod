// Builds dist/: one self-contained index.html (JS bundled, CSS and fonts inlined),
// plus the PWA files. Works from a folder, any static host, or the Docker image.
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";

const FONTS = [
  ["Pixelify Sans", 500, "@fontsource/pixelify-sans/files/pixelify-sans-latin-ext-500-normal.woff2"],
  ["Pixelify Sans", 700, "@fontsource/pixelify-sans/files/pixelify-sans-latin-ext-700-normal.woff2"],
  ["Pixelify Sans", 500, "@fontsource/pixelify-sans/files/pixelify-sans-latin-500-normal.woff2"],
  ["Pixelify Sans", 700, "@fontsource/pixelify-sans/files/pixelify-sans-latin-700-normal.woff2"],
  ...[700, 800, 900].flatMap((w) => [
    ["Nunito", w, `@fontsource/nunito/files/nunito-latin-ext-${w}-normal.woff2`],
    ["Nunito", w, `@fontsource/nunito/files/nunito-latin-${w}-normal.woff2`],
  ]),
];

const fontCss = FONTS.map(([family, weight, file]) => {
  const data = readFileSync(`node_modules/${file}`).toString("base64");
  const range = file.includes("latin-ext")
    ? "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"
    : "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  return `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${data}) format("woff2");unicode-range:${range}}`;
}).join("\n");

const js = await build({ entryPoints: ["src/main.js"], bundle: true, format: "iife", write: false, target: "es2019", legalComments: "none" });
const code = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const html = readFileSync("src/index.html", "utf8")
  .replace("/*FONTS*/", () => fontCss)
  .replace("/*CSS*/", () => readFileSync("src/styles.css", "utf8"))
  .replace("/*JS*/", () => code);

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
for (const f of ["manifest.webmanifest", "icon-192.png", "icon-512.png"]) if (existsSync(`public/${f}`)) copyFileSync(`public/${f}`, `dist/${f}`);
if (existsSync("public/sw.js")) writeFileSync("dist/sw.js", readFileSync("public/sw.js", "utf8").replace("__VERSION__", version));
console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB, v${version}`);
