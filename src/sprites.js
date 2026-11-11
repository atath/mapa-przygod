
/* ================== Sprites ================== */
export const OUT = "#2a1d2e";
// Scale2x (EPX): doubles the pixel grid and rounds diagonal edges, so pixels are half as big
export function scale2x(rows) {
  const h = rows.length, w = rows[0].length, out = [];
  const at = (r, c) => (r < 0 || c < 0 || r >= h || c >= w) ? "." : rows[r][c];
  for (let r = 0; r < h; r++) {
    let a = "", b = "";
    for (let c = 0; c < w; c++) {
      const E = at(r, c), B = at(r - 1, c), D = at(r, c - 1), F = at(r, c + 1), H = at(r + 1, c);
      if (B !== H && D !== F) { a += (D === B ? D : E) + (B === F ? F : E); b += (D === H ? D : E) + (H === F ? F : E); }
      else { a += E + E; b += E + E; }
    }
    out.push(a, b);
  }
  return out;
}
export function sprite(rows0, pal, outline = true, texture = false) {
  const rows = rows0[0].length >= 28 ? rows0 : scale2x(rows0);
  const h = rows.length, w = rows[0].length, W2 = w + 2, H2 = h + 2, c = document.createElement("canvas");
  c._res = 2;
  c.width = W2; c.height = H2;
  const x = c.getContext("2d");
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) { const ch = rows[r][q]; if (ch !== "." && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(q + 1, r + 1, 1, 1); } }
  if (outline) {
    const d = x.getImageData(0, 0, W2, H2), D = d.data, src = new Uint8ClampedArray(D);
    const I = (i, j) => (j * W2 + i) * 4, A = (i, j) => (i < 0 || j < 0 || i >= W2 || j >= H2) ? 0 : src[I(i, j) + 3];
    // soft volume: light from top-left — top rim lighter, bottom rim darker
    for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) {
      if (!A(i, j)) continue; const k = I(i, j);
      let f = 1;
      if (!A(i, j - 1)) f = 1.18; else if (!A(i, j - 2)) f = 1.08;
      else if (!A(i, j + 1) || !A(i, j + 2)) f = 0.76; else if (!A(i, j + 3)) f = 0.88;
      else if (!A(i + 1, j) || !A(i + 2, j)) f = 0.86; else if (!A(i - 1, j)) f = 1.06;
      else if (texture && ((i * 7 + j * 13) % 11) === 0) f = 0.9; // leaf / stone texture only
      else if (texture && ((i * 5 + j * 3) % 17) === 0) f = 1.08;
      if (f !== 1) for (let ch = 0; ch < 3; ch++) D[k + ch] = Math.min(255, src[k + ch] * f + (f > 1 ? 8 : 0));
    }
    // coloured outline: a dark shade of the neighbouring colour instead of flat black
    for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) {
      if (A(i, j)) continue;
      const nb = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].find(([a, b]) => A(a, b));
      if (!nb) continue;
      const s_ = I(nb[0], nb[1]), k = I(i, j);
      D[k] = src[s_] * 0.32 + 14; D[k + 1] = src[s_ + 1] * 0.28 + 10; D[k + 2] = src[s_ + 2] * 0.32 + 22; D[k + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    // footprint for drop shadows
    let bottom = 0, left = W2, right = 0;
    for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) if (D[I(i, j) + 3]) { bottom = j; left = Math.min(left, i); right = Math.max(right, i); }
    c._sh = { bottom, left, right };
  }
  return c;
}
const URLS = new WeakMap();
export const url = (c) => { let u = URLS.get(c); if (!u) { u = c.toDataURL(); URLS.set(c, u); } return u; };

/* ---------- Pixel brush: shapes snapped to a 32px grid ---------- */
export function P(w = 32, h = 32) {
  const g = Array.from({ length: h }, () => Array(w).fill("."));
  const ok = (i, j, only) => i >= 0 && j >= 0 && i < w && j < h && (!only || (only === true ? g[j][i] !== "." : only.includes(g[j][i])));
  const A = {
    px(x, y, c, only) { x = Math.floor(x); y = Math.floor(y); if (ok(x, y, only)) g[y][x] = c; return A; },
    rect(x, y, ww, hh, c, only) { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) A.px(i, j, c, only); return A; },
    ell(cx, cy, rx, ry, c, only, y0 = -99, y1 = 99) {
      for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry); j++) {
        if (j < y0 || j > y1) continue;
        for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx); i++) {
          const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1 && ok(i, j, only)) g[j][i] = c;
        }
      }
      return A;
    },
    poly(pts, c, only) {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      for (let j = Math.floor(Math.min(...ys)); j <= Math.ceil(Math.max(...ys)); j++)
        for (let i = Math.floor(Math.min(...xs)); i <= Math.ceil(Math.max(...xs)); i++) {
          const x = i + 0.5, y = j + 0.5; let inside = false;
          for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
            const [xa, ya] = pts[a], [xb, yb] = pts[b];
            if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
          }
          if (inside && ok(i, j, only)) g[j][i] = c;
        }
      return A;
    },
    line(x0, y0, x1, y1, c, t = 1, only) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
      for (let k = 0; k <= n; k++) { const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n; if (t === 1) A.px(x, y, c, only); else A.rect(Math.floor(x - t / 2 + 0.5), Math.floor(y - t / 2 + 0.5), t, t, c, only); }
      return A;
    },
    rows() { return g.map((r) => r.join("")); }
  };
  return A;
}
export function lighten(hex, f) { const n = parseInt(hex.slice(1), 16); const ch = (v) => Math.round(v + (255 - v) * f).toString(16).padStart(2, "0"); return "#" + ch((n >> 16) & 255) + ch((n >> 8) & 255) + ch(n & 255); }
