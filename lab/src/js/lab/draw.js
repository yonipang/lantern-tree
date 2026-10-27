// ================= 실험판 세계 그리기 (L1) =================
// 본 게임 render/world.js의 renderWorld에서 실험판에 필요한 부분만 같은 방법으로 그려요:
// 바닥 덩어리(render/chunks.js) → 물결 → 줄마다 [벽(render/icecave.js·terrain.js 그림) + 서 있는 것(플레이어·횃불)] → 조각 → (새 빛이 없으면) 어둠 덮기.
// 그림은 모두 본 게임 것(SPR)을 써요 — 그림을 바꾸면 실험판에도 같이 들어가요.
import { SPR } from '../art/world.js';
import { hash2 } from '../engine/random.js';
import { CHN, chunkEdge, getChunk, prefetchChunk } from '../render/chunks.js';
import { lightCv, LH, LW, LX0, LY0 } from '../render/light.js';
import { ctx, drawImg, LIFT, shadow, TP, VIEW } from '../render/view.js';
import { drawKind } from '../render/glight.js';
import { G } from '../save/state.js';
import { WATER, WFLOOR } from '../sim/nature.js';
import { H, idx, inB, W } from '../world/map.js';
import { WALL_H, WALL_TOP, wallShade } from '../art/tilemap.js';
import { GLOW_RULE, rippleOf, TR, wallArt } from '../render/terrain.js';
import { flushWallAtlas, ICE_W, SLANT, slantWallArt, wallBudget } from '../render/icecave.js';
import { frontTile } from './dig.js';
import { OBJ, WALLS } from '../data/items.js';
import { iconCanvas } from '../render/icons.js';
import { CHARS, charFrame, lookDef } from '../art/characters.js';
import { CUSTOMERS } from './shopdata.js';
import { fpOf } from '../world/tiles.js';
import { floats } from './fx.js';
// 둘레 8칸 중 열린 쪽 (본 게임 render/world.js wallOpen과 같음): 1 북 · 2 동 · 4 남 · 8 서 · 16 북동 · 32 남동 · 64 남서 · 128 북서
function wallOpen(x, y) { const o = (dx, dy) => { const xx = x + dx, yy = y + dy; return inB(xx, yy) && !G.wall[idx(xx, yy)]; };
  return (o(0, -1) ? 1 : 0) | (o(1, 0) ? 2 : 0) | (o(0, 1) ? 4 : 0) | (o(-1, 0) ? 8 : 0) | (o(1, -1) ? 16 : 0) | (o(1, 1) ? 32 : 0) | (o(-1, 1) ? 64 : 0) | (o(-1, -1) ? 128 : 0); }
const crackOf = (dm, w) => SPR.crack[Math.min(3, Math.floor(dm / ((WALLS[w] && WALLS[w].hp) || 3) * 4))];
export function drawLab(cw, ch, glOn) {
  drawKind('floor');
  const T = TP, camX = VIEW.camX, camY = VIEW.camY, t = G.time, L = LIFT;
  const x0 = Math.max(0, Math.floor(camX / T) - 1), x1 = Math.min(W - 1, Math.ceil((camX + cw) / T) + 1), y0 = Math.max(0, Math.floor(camY / T) - 1), y1 = Math.min(H - 1, Math.ceil((camY + ch) / T) + 3);
  for (let cy = Math.floor(y0 / CHN); cy <= Math.floor(y1 / CHN); cy++) for (let cx = Math.floor(x0 / CHN); cx <= Math.floor(x1 / CHN); cx++) ctx.drawImage(getChunk(cx, cy), cx * 256 - camX, cy * 256 - camY);
  for (let cy = Math.floor(y0 / CHN); cy <= Math.floor(y1 / CHN); cy++) for (let cx = Math.floor(x0 / CHN); cx <= Math.floor(x1 / CHN); cx++) { const ed = chunkEdge(cx, cy); if (!ed) continue;
    if (ed.shadow) ctx.drawImage(ed.shadow, cx * 256 - camX, cy * 256 - camY); if (ed.glow) { drawKind('fglow'); ctx.drawImage(ed.glow, cx * 256 - camX, cy * 256 - camY); drawKind('floor'); } }
  prefetchChunk(Math.floor(x0 / CHN), Math.floor(y0 / CHN), Math.floor(x1 / CHN), Math.floor(y1 / CHN));
  // 물결 (물가에서 떨어진 물만 — 잔잔한 물은 바닥 덩어리에 구워져 있어요)
  if (TR.ready) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y); if (G.wall[i] || G.floor[i] !== WATER) continue;
    const land = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return -1; const j = idx(xx, yy); if (G.wall[j]) return -1; return G.floor[j] === WATER || WFLOOR.has(G.floor[j]) ? 0 : G.floor[j]; };
    if (land(0, -1) === 0 && land(1, 0) === 0 && land(0, 1) === 0 && land(-1, 0) === 0) { const wb = SPR.waterB[G.biome[i]] || SPR.water; ctx.drawImage(rippleOf(G.biome[i], wb)[(Math.floor(t * 1.4 + hash2(x, y, 3) * 2)) % 2], x * T - camX, y * T - camY); } }
  drawKind('up');
  const rows = []; for (let y = y0; y <= y1; y++) rows.push([]);
  const push = (y, it) => { const r = Math.floor(y) - y0; if (r >= 0 && r < rows.length) rows[r].push(it); };
  for (let y = y0 - 3; y <= y1; y++) for (let x = x0 - 2; x <= x1; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (!o || o.t === '_part') continue; const [, h] = fpOf(o), by = y + h - 1; push(Math.min(by, y1), { k: 'o', x, y, o, s: by + (OBJ[o.t] && OBJ[o.t].solid ? .9 : .01) }); }
  push(G.p.y, { k: 'p', s: G.p.y });
  if (G.smith) push(G.smith.y, { k: 'smith', s: G.smith.y });
  for (const c of G.customers) push(c.y, { k: 'c', c, s: c.y });
  wallBudget(28); const SW = new Map();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y), w = G.wall[i]; if (w && SLANT.has(w)) { const wa = wallArt(x, y, w); if (w === ICE_W || wa) { const a = slantWallArt(x, y, w, w === ICE_W ? null : wa, wa ? GLOW_RULE[wa.ore] : null); if (a) SW.set(i, a); } } }
  flushWallAtlas();
  const ck = (c, sx, sy) => ctx.drawImage(c, 0, (16 - WALL_TOP) >> 1, 16, WALL_TOP, sx, sy - L, 16, WALL_TOP);
  for (let r = 0; r < rows.length; r++) { const y = y0 + r, sy = y * T - camY;
    for (let x = x0; x <= x1; x++) { const i = idx(x, y), w = G.wall[i]; if (!w) continue; const sx = x * T - camX, ia = SW.get(i), dm = G.wdmg.get(i);
      if (ia) { const AT = ia.img; drawKind('itop', ia.ore); ctx.drawImage(AT, ia.u, ia.v, 16, 16, sx, sy - L, 16, 16); drawKind('shade'); ctx.drawImage(AT, ia.u, ia.v + 16, 16, 16, sx, sy - L, 16, 16);
        if (ia.front) { drawKind('front', ia.ore); ctx.drawImage(AT, ia.u, ia.v + 32, 16, 28, sx, sy - ia.frontUp, 16, 28); }
        if (ia.shadow) { drawKind('floor'); ctx.drawImage(AT, ia.u, ia.v + 60, 16, 31, sx, sy - ia.frontUp, 16, 31); } drawKind('up');
        if (dm) ck(crackOf(dm, w), sx, sy); continue; }
      const wa = wallArt(x, y, w), below = y + 1 < H ? G.wall[i + W] : 1, fy = sy + T - WALL_H, topImg = wa ? wa.top : SPR.wtop[w][(hash2(x, y, 9) * 4) | 0], shd = wallShade(wallOpen(x, y));
      if (below) { const gap = T - WALL_TOP; drawKind('top', wa ? wa.ore : 0); ctx.drawImage(topImg, sx, sy - L + gap); drawKind('shade'); ctx.drawImage(shd, sx, sy - L + gap); }
      drawKind('top', wa ? wa.ore : 0); ctx.drawImage(topImg, sx, sy - L); drawKind('shade'); ctx.drawImage(shd, sx, sy - L);
      if (!below) { drawKind('front', wa ? wa.ore : 0); ctx.drawImage(wa ? wa.front : SPR.wfront[w], sx, fy); }
      drawKind('up'); if (dm) ck(crackOf(dm, w), sx, sy); }
    const list = rows[r]; list.sort((a, b) => a.s - b.s);
    for (const it of list) {
      if (it.k === 'o') { const o = it.o, [w, h] = fpOf(o), img = SPR.obj[o.t] || SPR.obj.chest, wob = o.shk > 0 ? Math.sin(t * 60) * o.shk * .6 : 0; if (o.shk > 0) o.shk = Math.max(0, o.shk - 1 / 60);
        if (OBJ[o.t] && OBJ[o.t].solid) shadow(it.x + w / 2, it.y + h - .1, .32 * w, .22);
        if (img) drawImg(img, it.x + w / 2 + wob / 16, it.y + h - 1 / 16);
        if (o.shelf != null) { const s = G.shelves[o.shelf]; if (s && s.id) { const ic = iconCanvas(s.id); if (ic) drawImg(ic, it.x + .5, it.y + .45, { sx: .75, sy: .75 }); } } }
      else if (it.k === 'smith') { const s = G.smith, im = SPR.npc_smith; shadow(s.x, s.y + .1, .3); if (im) drawImg(im, s.x, s.y + .15); }
      else if (it.k === 'c') { const c = it.c, im = custFrame(c); shadow(c.x, c.y + .1, .3); if (im) drawImg(im, c.x, c.y + .15 - ((Math.floor(c.anim * 7) % 2) && c.st !== 'think' ? 1 / 16 : 0), { flip: c.face === 'side' && c.flip });
        if (c.carry) { const ic = iconCanvas(c.carry); if (ic) drawImg(ic, c.x, c.y - .55, { sx: .6, sy: .6 }); } }
      else { const p = G.p; shadow(p.x, p.y + .1, .3); const fr = p.moving ? Math.floor(p.anim * 7) % 2 : 0, bob = p.moving ? (fr ? 1 / 16 : 0) : Math.sin(t * 2) > .7 ? 1 / 16 : 0;
        drawImg(SPR.player[p.dir][fr], p.x, p.y + .15 - bob, { flip: p.flip }); } } }
  for (const q of G.parts) { ctx.fillStyle = q.col; ctx.globalAlpha = Math.min(1, q.life / q.max * 1.6); ctx.fillRect(Math.round(q.x * T - camX - q.sz / 2), Math.round((q.y - q.z) * T - camY - q.sz / 2), q.sz, q.sz); }
  ctx.globalAlpha = 1;
  drawKind('off');
  if (!glOn && lightCv && LW) { ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true; ctx.drawImage(lightCv, 0, 0, LW, LH, LX0 * T - camX, LY0 * T - camY - L * .5, LW * T, LH * T); ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false; }
}
// 빛 뒤에 그려서 어두운 곳에서도 보이는 것: 캘 칸 표시
export function drawLabPost() {
  for (const c of G.customers) if (c.mood && c.moodT > 0) mood(c.mood, c.x * TP - VIEW.camX, (c.y - 1.55) * TP - VIEW.camY);
  const t = G.act || frontTile(); if (!t) return; const T = TP, o = t.a != null && t.a >= 0 ? G.objs.get(t.a) : null, [fw, fh] = o ? fpOf(o) : [1, 1], lift = o ? 0 : LIFT;
  const hx = t.x * T - VIEW.camX, hy = t.y * T - VIEW.camY - lift, bw = fw * T, bh = fh * T, pulse = .6 + Math.sin(performance.now() / 160) * .25;
  ctx.fillStyle = `rgba(255,241,214,${pulse * .16})`; ctx.fillRect(hx, hy, bw, bh); ctx.fillStyle = `rgba(255,241,214,${pulse})`;
  for (const [ax, ay, sx, sy] of [[hx, hy, 1, 1], [hx + bw, hy, -1, 1], [hx, hy + bh, 1, -1], [hx + bw, hy + bh, -1, -1]]) { ctx.fillRect(sx > 0 ? ax : ax - 4, sy > 0 ? ay : ay - 1, 4, 1); ctx.fillRect(sx > 0 ? ax : ax - 1, sy > 0 ? ay : ay - 4, 1, 4); }
}
// 손님 표정 말풍선 (도트로 직접): love 하트 · ok 웃음 · no 찡그림 · huh 물음표
const MOOD = { love: ['#ff7aa8', ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..']], ok: ['#7fe0b5', ['.....', 'x...x', '.....', 'x...x', '.xxx.']], no: ['#ff6b5e', ['x...x', '.x.x.', '.....', '.xxx.', 'x...x']], huh: ['#bfaed3', ['.xxx.', '...x.', '..x..', '.....', '..x..']] };
function mood(k, sx, sy) { const [col, rows] = MOOD[k] || MOOD.huh, x = Math.round(sx - 5), y = Math.round(sy - 9);
  ctx.fillStyle = '#fbefd9'; ctx.fillRect(x, y + 1, 11, 7); ctx.fillRect(x + 1, y, 9, 9); ctx.fillRect(x + 4, y + 9, 2, 1); ctx.fillStyle = col;
  rows.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === 'x') ctx.fillRect(x + 3 + i, y + 2 + j, 1, 1); }); }
// 손님 그림 (본 게임 캐릭터 조립을 그대로 — 생김새만 다르게)
const CUST = {};
function custFrame(c) { const L = CUSTOMERS[c.type].looks[c.look], st = c.st === 'think' ? 0 : Math.floor(c.anim * 7) % 2, key = 'cust_' + c.type + c.look + c.face + st;
  if (!CUST[key]) { CHARS[key] = lookDef(L); CUST[key] = charFrame(key, c.face, st, CHARS[key].pal); delete CHARS[key]; } return CUST[key]; }
// 떠오르는 글자 (+12 · +흙 1) — 화면 크기 캔버스에 도트 글꼴로 (render/view.js가 그 위에 불러요)
export function drawLabTop(g, TPx, camX, camY, dpr) { if (!floats.length) return; g.font = `${16 * dpr}px "NeoDunggeunmo Pro", sans-serif`; g.textAlign = 'center';
  for (const f of floats) { const a = Math.max(0, 1 - f.t / 1.3), x = Math.round(f.x * TPx - camX), y = Math.round((f.y - f.t * .6) * TPx - camY); g.globalAlpha = a; g.fillStyle = '#120f1c';
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(f.txt, x + dx * dpr, y + dy * dpr); g.fillStyle = f.col; g.fillText(f.txt, x, y); }
  g.globalAlpha = 1; }
