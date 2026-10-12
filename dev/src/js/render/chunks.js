// ================= 바닥 조각: 바닥·벽 타일을 큰 조각으로 미리 그려 두기(drawChunk·getChunk) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// ---- floor chunks: 16x16 tiles pre-rendered once, redrawn only when their tiles change ----
const CHN = 16, chunks = new Map();
function chunkSig(cx, cy) { let h = 7; for (let y = cy * CHN - 1; y <= cy * CHN + CHN; y++) for (let x = cx * CHN - 1; x <= cx * CHN + CHN; x++) { if (!inB(x, y)) continue; const i = idx(x, y); h = (Math.imul(h, 31) + G.wall[i] * 16 + G.floor[i] + (wallPiece(i) ? 7919 : 0)) | 0; } return h; }
const natural = f => !!PRI[f];
function drawChunk(c, cx, cy) {
  const g = c.cv.getContext('2d'); g.clearRect(0, 0, 256, 256); g.imageSmoothingEnabled = false;
  for (let ty = 0; ty < CHN; ty++) for (let tx = 0; tx < CHN; tx++) {
    const x = cx * CHN + tx, y = cy * CHN + ty; if (!inB(x, y)) continue; const i = idx(x, y); if (G.wall[i]) continue; const f = G.floor[i]; if (f === WATER) continue;
    const X = tx * 16, Y = ty * 16, hv = hash2(x, y, 5), vr = (hv * (SPR.floor[f] ? SPR.floor[f].length : 4)) | 0; // drawn floors can have more than 4 variants (v54)
    if (wallPiece(i)) { // a thin wall's tile: each quarter takes the floor of the open side it faces, so floors stop right at the wall line
      const side = (hx, vy) => { for (const [dx, dy] of [[hx, 0], [0, vy], [hx, vy]]) { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) continue; const j = idx(xx, yy); if (G.wall[j] || wallPiece(j)) continue; const nf = G.floor[j]; if (nf === WATER || nf === LAVA || !SPR.floor[nf]) continue; return nf; } return f; };
      for (const [qx, qy] of [[0, 0], [8, 0], [0, 8], [8, 8]]) { const qf = side(qx ? 1 : -1, qy ? 1 : -1); const FQ = SPR.floor[qf]; g.drawImage(FQ[(hv * FQ.length) | 0], qx, qy, 8, 8, X + qx, Y + qy, 8, 8); } }
    else g.drawImage(SPR.floor[f][vr], X, Y);
    if (natural(f) && !wallPiece(i)) {
      const nb = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return 0; const j = idx(xx, yy); return G.wall[j] ? 0 : G.floor[j]; };
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      const fr = dirs.map(([dx, dy]) => { const b = nb(dx, dy); return natural(b) && PRI[b] > PRI[f] ? b : 0; });
      fr.forEach((b, q) => { if (b) g.drawImage(SPR.fringeX[b][q], X, Y); }); fr.forEach((b, q) => { if (b) g.drawImage(SPR.fringeL[b][q], X, Y); });
      [[-1, -1, 0], [1, -1, 1], [1, 1, 2], [-1, 1, 3]].forEach(([dx, dy, q]) => { const b = nb(dx, dy); if (natural(b) && PRI[b] > PRI[f] && nb(dx, 0) !== b && nb(0, dy) !== b) g.drawImage(SPR.corner[b][q], X, Y); });
      const hd = hash2(x, y, 77), dens = f === 1 ? .17 : .1;
      if (hd < dens && SPR.deco[f]) { const list = SPR.deco[f], d = list[(hash2(x, y, 78) * list.length) | 0]; g.drawImage(d, X + 2 + ((hash2(x, y, 79) * 8) | 0), Y + 3 + ((hash2(x, y, 80) * 7) | 0)); }
    }
    if (WFLOOR.has(f) && !wallPiece(i)) { const nw = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return false; const j = idx(xx, yy); return !G.wall[j] && (WFLOOR.has(G.floor[j]) || G.floor[j] === WATER); };
      if (!nw(0, -1)) { g.fillStyle = '#5d5872'; g.fillRect(X, Y, 16, 1); g.fillStyle = '#a7a2bb'; g.fillRect(X, Y + 1, 16, 1); }
      if (!nw(0, 1)) { g.fillStyle = '#a7a2bb'; g.fillRect(X, Y + 14, 16, 1); g.fillStyle = '#5d5872'; g.fillRect(X, Y + 15, 16, 1); }
      if (!nw(-1, 0)) { g.fillStyle = '#5d5872'; g.fillRect(X, Y, 1, 16); g.fillStyle = '#a7a2bb'; g.fillRect(X + 1, Y, 1, 16); }
      if (!nw(1, 0)) { g.fillStyle = '#a7a2bb'; g.fillRect(X + 14, Y, 1, 16); g.fillStyle = '#5d5872'; g.fillRect(X + 15, Y, 1, 16); } }
    // contact shadows next to walls
    if (y > 0 && G.wall[i - W]) { g.fillStyle = 'rgba(14,8,22,0.38)'; g.fillRect(X, Y, 16, 1); g.fillStyle = 'rgba(14,8,22,0.22)'; g.fillRect(X, Y + 1, 16, 1); g.fillStyle = 'rgba(14,8,22,0.1)'; g.fillRect(X, Y + 2, 16, 1); }
    if (x > 0 && G.wall[i - 1]) { g.fillStyle = 'rgba(14,8,22,0.28)'; g.fillRect(X, Y, 1, 16); g.fillStyle = 'rgba(14,8,22,0.12)'; g.fillRect(X + 1, Y, 1, 16); }
    if (x < W - 1 && G.wall[i + 1]) { g.fillStyle = 'rgba(14,8,22,0.28)'; g.fillRect(X + 15, Y, 1, 16); g.fillStyle = 'rgba(14,8,22,0.12)'; g.fillRect(X + 14, Y, 1, 16); }
  }
}
function getChunk(cx, cy) {
  const key = cx * 1000 + cy; let c = chunks.get(key);
  if (!c) { c = { cv: document.createElement('canvas'), sig: null }; c.cv.width = c.cv.height = 256; chunks.set(key, c); }
  const sig = chunkSig(cx, cy); if (sig !== c.sig) { c.sig = sig; drawChunk(c, cx, cy); }
  return c.cv;
}
