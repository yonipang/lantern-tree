// ================= 세계 그리기: 반딧불이 같은 주변 효과, 물체·몬스터·플레이어·보스 그리기(renderWorld·drawEntity), 겹쳐 그리기 =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// ---- ambient particles: fireflies, spores, sparkles ----
import { glowSprite, SPR, TREE_SPREAD } from '../art/world.js';
import { BENCH_COL, TIERED } from '../data/automation-tiers.js';
import { BATT_MAX } from '../data/circuits-regions.js';
import { ITEMS, OBJ, WALLS, WTYPE } from '../data/items.js';
import { BKEYS, BOSSES, ENEMY } from '../data/rpg-nature.js';
import { effH, effW, hdCtx, INK, whiten } from '../engine/canvas.js';
import { fxRand, hash2 } from '../engine/random.js';
import { WARP_FRAME } from '../data/warp.js';
import { clamp } from '../engine/util.js';
import { CHN, chunkEdge, getChunk, prefetchChunk } from './chunks.js';
import { iconCanvas } from './icons.js';
import { LH, lightCv, LIGHTS, LW, LX0, LY0 } from './light.js';
import { animalImg, drawHazards, drawHitBars, drawSpread, drawTree, drawTreeGlow, drawTreeLeaves, rotImg, twSprite, visibleShakers } from './parts.js';
import { ctx, DPR, drawImg, LIFT, pxFont, pxText, setCtx, shadow, TP, VIEW, Z } from './view.js';
import { drawKind, emCtxFor } from './glight.js';
import { G, guardOf, paused } from '../save/state.js';
import { canDev } from '../save/storage.js';
import { cropStage, curAlt, inReach } from '../sim/actions.js';
import { ranchReady } from '../sim/animals.js';
import { nearestBag } from '../sim/survival.js';
import { canRotObj, isGround, placeFp, pRot, rotN, rotOf, slideStep, twMask } from '../sim/building.js';
import { CIRC, wirePowered } from '../sim/circuits.js';
import { jobDone, nowS } from '../sim/crafting.js';
import { farmStage, growOf } from '../sim/farming.js';
import { selItem } from '../sim/inventory.js';
import { maxHp, maxMp } from '../sim/player.js';
import { isYoung, treeStep, WATER, WFLOOR } from '../sim/nature.js';
import { goalTarget } from '../sim/quests.js';
import { onFrame } from '../sim/systems.js';
import { treeStage } from '../sim/tree.js';
import { aimMouse } from '../ui/input.js';
import { DOORS } from '../world/gen.js';
import { CX, CY, H, idx, inB, LAVA, W } from '../world/map.js';
import { anchorAt, fpOf, placeAnchor } from '../world/tiles.js';
import { WALL_H, WALL_TOP, wallShade } from '../art/tilemap.js';
import { GLOW_RULE, rippleOf, TR, wallArt } from './terrain.js';
import { flushWallAtlas, ICE_W, SLANT, slantWallArt, wallBudget } from './icecave.js';
export const AMB = [];
onFrame('ambient', dt => updateAmbient(dt));
export function updateAmbient(dt) {
  const p = G.p;
  for (let i = AMB.length - 1; i >= 0; i--) { const a = AMB[i]; a.t += dt; if (a.t > a.life) { AMB.splice(i, 1); continue; }
    if (a.k === 0) { a.vx += (fxRand() - .5) * dt * 3; a.vy += (fxRand() - .5) * dt * 3; a.vx = clamp(a.vx, -.6, .6); a.vy = clamp(a.vy, -.6, .6); }
    a.x += a.vx * dt; a.y += a.vy * dt; }
  if (AMB.length < 22 && fxRand() < dt * 8) {
    const x = p.x + (fxRand() - .5) * 18, y = p.y + (fxRand() - .5) * 22, tx = Math.floor(x), ty = Math.floor(y);
    if (inB(tx, ty) && !G.wall[idx(tx, ty)]) { const b = G.biome[idx(tx, ty)], water = G.floor[idx(tx, ty)] === WATER;
      const k = water ? 0 : b; AMB.push({ k, x, y, vx: k === 1 || k === 3 ? (fxRand() - .5) * .2 : (fxRand() - .5) * .4, vy: k === 1 ? -.25 - fxRand() * .2 : k === 3 ? -.6 - fxRand() * .4 : k === 4 ? .35 + fxRand() * .3 : (fxRand() - .5) * .4, t: 0, life: 4 + fxRand() * 5, ph: fxRand() * 6.28 }); }
  }
}
export function renderWorld(cw, ch, glOn = false) {
  drawKind('floor'); // v73: what the light pass should treat these pixels as (render/glight.js)
  const T = TP, camX = VIEW.camX, camY = VIEW.camY, t = G.time;
  const x0 = Math.max(0, Math.floor(camX / T) - 1), x1 = Math.min(W - 1, Math.ceil((camX + cw) / T) + 1);
  const y0 = Math.max(0, Math.floor(camY / T) - 1), y1 = Math.min(H - 1, Math.ceil((camY + ch) / T) + 3);
  // floors (cached chunks)
  for (let cy = Math.floor(y0 / CHN); cy <= Math.floor(y1 / CHN); cy++) for (let cx = Math.floor(x0 / CHN); cx <= Math.floor(x1 / CHN); cx++) ctx.drawImage(getChunk(cx, cy), cx * 256 - camX, cy * 256 - camY);
  for (let cy = Math.floor(y0 / CHN); cy <= Math.floor(y1 / CHN); cy++) for (let cx = Math.floor(x0 / CHN); cx <= Math.floor(x1 / CHN); cx++) { const ed = chunkEdge(cx, cy); if (!ed) continue; // v79 glow beside ice walls · v80 shadow beside rock walls
    if (ed.shadow) ctx.drawImage(ed.shadow, cx * 256 - camX, cy * 256 - camY); if (ed.glow) { drawKind('fglow'); ctx.drawImage(ed.glow, cx * 256 - camX, cy * 256 - camY); drawKind('floor'); } }
  prefetchChunk(Math.floor(x0 / CHN), Math.floor(y0 / CHN), Math.floor(x1 / CHN), Math.floor(y1 / CHN));
  drawHazards(T, camX, camY);
  // water, rugs and ground plants (change often, drawn live)
  const spR = TREE_SPREAD[treeStage()], spIn = spR && Math.abs((x0 + x1) / 2 - CX) < (x1 - x0) / 2 + spR + 1 && Math.abs((y0 + y1) / 2 - CY) < (y1 - y0) / 2 + spR + 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = idx(x, y); if (G.wall[i]) continue; const sx = x * T - camX, sy = y * T - camY;
    if (spIn && Math.abs(x - CX) <= spR && Math.abs(y - CY) <= spR) drawSpread(x, y, sx, sy, spR);
    if (G.floor[i] === WATER) {
      const land = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return -1; const j = idx(xx, yy); if (G.wall[j]) return -1; return G.floor[j] === WATER || WFLOOR.has(G.floor[j]) ? 0 : G.floor[j]; };
      if (TR.ready) { const wb = SPR.waterB[G.biome[i]] || SPR.water; if (land(0, -1) === 0 && land(1, 0) === 0 && land(0, 1) === 0 && land(-1, 0) === 0) ctx.drawImage(rippleOf(G.biome[i], wb)[(Math.floor(t * 1.4 + hash2(x, y, 3) * 2)) % 2], sx, sy); } // v73: still water is in the baked floor, ripples only away from the shore
      else {
      ctx.drawImage((SPR.waterB[G.biome[i]] || SPR.water)[(Math.floor(t * 1.4 + hash2(x, y, 3) * 2)) % 2], sx, sy); // v71: water colour per region
      if (y > 0 && G.wall[i - W]) { ctx.fillStyle = 'rgba(10,20,45,0.6)'; ctx.fillRect(sx, sy, 16, 3); }
      const wl = [land(0, -1), land(1, 0), land(0, 1), land(-1, 0)];
      wl.forEach((b, q) => { if (b > 0) ctx.drawImage(SPR.fringeWX[b][q], sx, sy); }); wl.forEach((b, q) => { if (b > 0) ctx.drawImage(SPR.fringeWL[b][q], sx, sy); });
      [[-1, -1, 0], [1, -1, 1], [1, 1, 2], [-1, 1, 3]].forEach(([dx, dy, q]) => { const b = land(dx, dy); if (b > 0 && land(dx, 0) === 0 && land(0, dy) === 0) ctx.drawImage(SPR.cornerW[b][q], sx, sy); });
      }
      const hl = hash2(x, y, 43); if (hl < .12 && land(0, -1) === 0 && land(0, 1) === 0) { const lp = SPR.lily[hl < .04 ? 1 : 0]; ctx.drawImage(lp, sx + 3 + ((hash2(x, y, 44) * 4) | 0), sy + 4 + Math.round(Math.sin(t * 1.3 + hl * 50) * .6)); }
    }
    if (G.floor[i] === LAVA) { const ph = (t * .7 + hash2(x, y, 6)) % 1; if (hash2(x, y, 8) < .5) { ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.fillStyle = '#ffe0a0'; const bx = sx + 3 + ((hash2(x, y, 7) * 9) | 0), by = sy + 3 + ((hash2(x, y, 9) * 9) | 0); ctx.fillRect(bx, by, 2 + Math.round(ph * 2), 2); ctx.globalAlpha = 1; } }
    if (WFLOOR.has(G.floor[i])) { const ph = (t * .5 + hash2(x, y, 6)) % 1; ctx.globalAlpha = Math.sin(ph * Math.PI) * .55; ctx.fillStyle = '#e8f8ff'; ctx.fillRect(sx + 3 + ((hash2(x, y, 7) * 8) | 0), sy + 3 + Math.floor(ph * 9), 3, 1); ctx.globalAlpha = 1; }
    if (G.wire.has(i)) { const pw = wirePowered(i), c1 = pw ? '#ffd25c' : '#8a5a34', c2 = pw ? '#fff1b0' : '#b8784a', hw = (dx, dy) => { const nx = x + dx, ny = y + dy; if (!inB(nx, ny)) return false; const j = idx(nx, ny), oo0 = G.objs.get(j), oo = oo0 && oo0.t === '_part' ? G.objs.get(oo0.a) : oo0; return G.wire.has(j) || !!(oo && OBJ[oo.t] && (OBJ[oo.t].src || OBJ[oo.t].sw || OBJ[oo.t].dev)); };
      ctx.fillStyle = 'rgba(20,12,30,.45)'; ctx.fillRect(sx + 6, sy + 7, 4, 4); ctx.fillStyle = c1; ctx.fillRect(sx + 6, sy + 6, 4, 4);
      if (hw(1, 0)) ctx.fillRect(sx + 10, sy + 7, 6, 2); if (hw(-1, 0)) ctx.fillRect(sx, sy + 7, 6, 2); if (hw(0, 1)) ctx.fillRect(sx + 7, sy + 10, 2, 6); if (hw(0, -1)) ctx.fillRect(sx + 7, sy, 2, 6);
      ctx.fillStyle = c2; ctx.fillRect(sx + 7, sy + 7, 1, 1); }
    const o = G.objs.get(i); if (o && OBJ[o.t].flat && !OBJ[o.t].sz) { const [im, fl] = rotImg(o.t, rotOf(o), o.t === 'plate' && o.lit ? SPR.obj.plateOn : SPR.obj[o.t]); if (fl) { ctx.save(); ctx.translate(sx + 16, sy); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0); ctx.restore(); } else ctx.drawImage(im, sx, sy); }
  }
  for (let y = y0 - 3; y <= y1; y++) for (let x = x0 - 3; x <= x1; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (!o || o.t === '_part') continue; const d = OBJ[o.t]; if (!d || !d.sz || !d.flat) continue; const [img] = rotImg(o.t, rotOf(o), SPR.obj[o.t]); if (img) ctx.drawImage(img, x * T - camX, y * T - camY); }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y); if (G.wall[i]) continue; const o = G.objs.get(i); if (o && isGround(o)) drawEntity({ k: 'o', x, y, o }, t); }
  drawKind('up');
  // rows: walls interleaved with everything that stands
  const rows = []; for (let y = y0; y <= y1; y++) rows.push([]);
  const push = (y, item) => { const r = Math.floor(y) - y0; if (r >= 0 && r < rows.length) rows[r].push(item); };
  visibleShakers.clear();
  const seenA = new Set();
  for (let y = y0; y <= y1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) { if (!inB(x, y)) continue; let ii = idx(x, y), o = G.objs.get(ii); if (o && o.t === '_part') { ii = o.a; o = G.objs.get(ii); if (!o || o.t === '_part') continue; }
    if (o && OBJ[o.t] && OBJ[o.t].sz) { if (seenA.has(ii)) continue; seenA.add(ii); if (OBJ[o.t].flat) continue; const ax = ii % W, ay = (ii / W) | 0, by = ay + fpOf(o)[1] - 1; push(Math.min(by, y1), { k: 'o', x: ax, y: ay, o, s: OBJ[o.t].solid ? by + 1 : by + .01 }); if (o.shake) visibleShakers.add(o); continue; }
    if (o && o.t !== 'treeP' && !OBJ[o.t].flat && !isGround(o)) { push(y, { k: 'o', x, y, o, s: OBJ[o.t].solid && !(OBJ[o.t].door && o.open) ? y + 1 : y + 0.01 }); if (o.shake) visibleShakers.add(o); } }
  if (CY >= y0 && CY <= y1 + 5) push(Math.min(CY, y1), { k: 'tree', s: CY + 1 });
  const p = G.p; if (p.sit) push(p.sit.y, { k: 'p', s: p.sit.y + 1.01 }); else push(p.y, { k: 'p', s: p.y });
  for (const e of G.enemies) push(e.y, { k: 'e', e, s: e.y });
  for (const w of G.wild || []) push(w.y, { k: 'w', w, s: w.y }); if (G.petE && G.petOn) push(G.petE.y, { k: 'w', w: G.petE, pk: G.petOn, s: G.petE.y });
  for (const k of BKEYS) if (!G.bossDead[k]) push(G.bosses[k].y, { k: 'b', b: G.bosses[k], s: G.bosses[k].y });
  for (const d of G.drops) push(d.y, { k: 'd', d, s: d.y });
  const L = LIFT;
  // v81: make the slanted-wall pictures first, then send the changed atlas pages once (render/icecave.js)
  wallBudget(28); const SW = new Map(); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y), w = G.wall[i]; if (w && SLANT.has(w)) { const wa = wallArt(x, y, w); if (w === ICE_W || wa) { const a = slantWallArt(x, y, w, w === ICE_W ? null : wa, wa ? GLOW_RULE[wa.ore] : null); if (a) SW.set(i, a); } } }
  flushWallAtlas();
  for (let r = 0; r < rows.length; r++) {
    const y = y0 + r, sy = y * T - camY;
    for (let x = x0; x <= x1; x++) {
      const i = idx(x, y), w = G.wall[i]; if (!w) continue; const sx = x * T - camX;
      const ia = SW.get(i); // v81: made just above
      if (ia) { const AT = ia.img; // v79 ice / v80 rock: slanted edges (render/icecave.js) — top 16px covers this tile's row above + the 4px gap, a front wherever the bottom edge is open
        drawKind('itop', ia.ore); ctx.drawImage(AT, ia.u, ia.v, 16, 16, sx, sy - L, 16, 16); drawKind('shade'); ctx.drawImage(AT, ia.u, ia.v + 16, 16, 16, sx, sy - L, 16, 16); // v81: one shared atlas (fast)
        if (ia.front) { drawKind('front', ia.ore); ctx.drawImage(AT, ia.u, ia.v + 32, 16, 28, sx, sy - ia.frontUp, 16, 28); }
        if (ia.shadow) { drawKind('floor'); ctx.drawImage(AT, ia.u, ia.v + 60, 16, 31, sx, sy - ia.frontUp, 16, 31); } drawKind('up'); // v81: soft shadow on the floor under a rock wall
        const dm = G.wdmg.get(i), ck = c => ctx.drawImage(c, 0, (16 - WALL_TOP) >> 1, 16, WALL_TOP, sx, sy - L, 16, WALL_TOP); if (dm) ck(SPR.crack[Math.min(2, Math.floor(dm / WALLS[w].hp * 3))]);
        if (DOORS.has(i)) { if (!dm) ck(SPR.crack[0]); if (ia.front) { const a = .35 + .35 * Math.sin(t * 2.2 + x), fy = sy + T - WALL_H; ctx.fillStyle = '#1b1426'; ctx.fillRect(sx + 7, fy, 1, 2); ctx.fillRect(sx + 8, fy + 2, 1, 2); ctx.fillStyle = `rgba(255,233,168,${a})`; ctx.fillRect(sx + 7, fy + 2, 1, 2); ctx.fillRect(sx + 6, fy + 1, 1, 1); } }
        continue; }
      const wa = wallArt(x, y, w); // v73: new rock art, ore inside the rock around it (render/terrain.js)
      const below = y + 1 < H ? G.wall[i + W] : 1, fy = sy + T - WALL_H; // v72: front 16px on its own tile, top 12px right above it
      const topImg = wa ? wa.top : SPR.wtop[w][(hash2(x, y, 9) * 4) | 0], shd = wallShade(wallOpen(x, y));
      // v77 버그 수정: 아래도 벽이면 앞면을 안 그려서, 내 칸의 위쪽 4px(윗면 12px 아래 ~ 아래 벽 윗면 시작)이 비어 틈이 보였어요 → 윗면을 4px 내려 한 번 더 깔아 메워요
      if (below) { const gap = T - WALL_TOP; drawKind('top', wa ? wa.ore : 0); ctx.drawImage(topImg, sx, sy - L + gap); drawKind('shade'); ctx.drawImage(shd, sx, sy - L + gap); }
      drawKind('top', wa ? wa.ore : 0); ctx.drawImage(topImg, sx, sy - L);
      drawKind('shade'); ctx.drawImage(shd, sx, sy - L); // v71: the top fades to black away from its open edges
      if (!below) { drawKind('front', wa ? wa.ore : 0); ctx.drawImage(wa ? wa.front : SPR.wfront[w], sx, fy); }
      drawKind('up');
      ctx.fillStyle = 'rgba(20,12,30,0.55)';
      const th = WALL_TOP + (below ? T - WALL_TOP : 0); if (x > 0 && !G.wall[i - 1]) ctx.fillRect(sx, sy - L, 1, th);
      if (x < W - 1 && !G.wall[i + 1]) ctx.fillRect(sx + T - 1, sy - L, 1, th);
      if (y > 0 && !G.wall[i - W]) { ctx.fillRect(sx, sy - L, T, 1); ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fillRect(sx, sy - L + 1, T, 1); }
      const ck = c => ctx.drawImage(c, 0, (16 - WALL_TOP) >> 1, 16, WALL_TOP, sx, sy - L, 16, WALL_TOP); // cracks: the middle rows on the 12px top
      const dm = G.wdmg.get(i); if (dm) ck(SPR.crack[Math.min(2, Math.floor(dm / WALLS[w].hp * 3))]);
      if (DOORS.has(i)) { if (!dm) ck(SPR.crack[0]); if (!below) { const a = .35 + .35 * Math.sin(t * 2.2 + x); ctx.fillStyle = '#1b1426'; ctx.fillRect(sx + 7, fy, 1, 2); ctx.fillRect(sx + 8, fy + 2, 1, 2); ctx.fillStyle = `rgba(255,233,168,${a})`; ctx.fillRect(sx + 7, fy + 2, 1, 2); ctx.fillRect(sx + 6, fy + 1, 1, 1); } }
    }
    const list = rows[r]; if (!list.length) continue; list.sort((a, b) => a.s - b.s);
    for (const it of list) drawEntity(it, t);
  }
  // swing arc
  if (G.swing) {
    const s = G.swing, pr = 1 - s.t / s.max, hx = p.x, hy = p.y - .45, SW = WTYPE[s.wt];
    const held = (d, a) => { if (!s.icon) return; const ix = Math.round((hx + Math.cos(s.ang) * d) * T - camX), iy = Math.round((hy + Math.sin(s.ang) * d) * T - camY); ctx.save(); ctx.translate(ix, iy); ctx.rotate(a + Math.PI / 4); ctx.drawImage(SPR.item[s.icon], -8, -8); ctx.restore(); };
    if (s.wt === 'spear') { const d = .3 + Math.sin(pr * Math.PI) * 1.2; ctx.strokeStyle = `rgba(255,244,220,${0.5 * (1 - pr)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo((hx + Math.cos(s.ang) * .5) * T - camX, (hy + Math.sin(s.ang) * .5) * T - camY); ctx.lineTo((hx + Math.cos(s.ang) * (d + .5)) * T - camX, (hy + Math.sin(s.ang) * (d + .5)) * T - camY); ctx.stroke(); held(d, s.ang); }
    else if (s.wt === 'fist') { const d = .3 + Math.sin(pr * Math.PI) * .55, fx = Math.round((hx + Math.cos(s.ang) * d) * T - camX), fy = Math.round((hy + Math.sin(s.ang) * d) * T - camY);
      ctx.strokeStyle = `rgba(255,244,220,${0.5 * (1 - pr)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(fx, fy, 4 + pr * 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#5a3a2e'; ctx.fillRect(fx - 3, fy - 3, 6, 6); ctx.fillStyle = '#ffe0c4'; ctx.fillRect(fx - 2, fy - 2, 4, 4); ctx.fillStyle = '#e8b896'; ctx.fillRect(fx - 2, fy + 1, 4, 1); }
    else if (SW && SW.ranged) held(.5 - Math.sin(pr * Math.PI) * .15, s.ang);
    else { const arc = s.arc || 1.2, rad = s.rad || .95, a = s.ang - arc + pr * arc * 2;
      ctx.strokeStyle = `rgba(255,244,220,${0.55 * (1 - pr)})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(hx * T - camX, hy * T - camY, rad * T, s.ang - arc, a); ctx.stroke();
      if (s.icon) { const ix = Math.round((hx + Math.cos(a) * rad * .58) * T - camX), iy = Math.round((hy + Math.sin(a) * rad * .58) * T - camY); ctx.save(); ctx.translate(ix, iy); ctx.rotate(a + Math.PI / 4); ctx.drawImage(SPR.item[s.icon], -8, -8); ctx.restore(); } }
  }
  for (const q of G.pshots) { const X = Math.round(q.x * T - camX), Y = Math.round((q.y - .45) * T - camY);
    if (q.k === 'arrow') { ctx.save(); ctx.translate(X, Y); ctx.rotate(q.ang); ctx.fillStyle = '#7d4d2a'; ctx.fillRect(-5, 0, 8, 1); ctx.fillStyle = q.tip || '#eef2f7'; ctx.fillRect(3, -1, 2, 3); ctx.fillStyle = '#ff8fa3'; ctx.fillRect(-6, -1, 2, 3); ctx.restore(); }
    else { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite(q.col), X - 7, Y - 7, 14, 14); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = q.col; ctx.fillRect(X - 2, Y - 2, 4, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(X - 1, Y - 1, 2, 2); } }
  for (const q of G.parts) { ctx.fillStyle = q.col; ctx.globalAlpha = Math.min(1, q.life / q.max * 1.6); const s = q.sz; ctx.fillRect(Math.round(q.x * T - camX - s / 2), Math.round((q.y - q.z) * T - camY - s / 2), s, s); }
  ctx.globalAlpha = 1; drawTreeLeaves(T, camX, camY);
  // fishing line
  if (G.fish) {
    const f = G.fish, hx = p.x + p.face.x * .35, hy = p.y - .55; let bx = f.bx, by = f.by, bz = 0;
    if (f.fly > 0) { const pr = 1 - f.fly / 0.3; bx = hx + (f.bx - hx) * pr; by = hy + (f.by - hy) * pr; bz = Math.sin(pr * Math.PI) * .8; }
    else { by += f.st === 'bite' ? .12 : f.nib > 0 ? .06 : Math.sin(t * 3) * .03; }
    const X0 = hx * T - camX, Y0 = hy * T - camY, X1 = Math.round(bx * T - camX), Y1 = Math.round((by - bz) * T - camY);
    ctx.strokeStyle = 'rgba(240,235,250,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.quadraticCurveTo((X0 + X1) / 2, Math.max(Y0, Y1) + .35 * T, X1, Y1); ctx.stroke();
    if (f.fly <= 0) { const k = (t * .8) % 1; ctx.strokeStyle = `rgba(220,245,255,${0.5 - k * .5})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(X1, f.by * T - camY + 1.5, 2 + k * 5, 1 + k * 2.2, 0, 0, 6.283); ctx.stroke(); }
    ctx.fillStyle = '#ff6b6b'; ctx.fillRect(X1 - 1, Y1 - 2, 3, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(X1 - 1, Y1, 3, 1);
  }
  if (G.fishFx) { const fx = G.fishFx, pr = Math.min(1, fx.t / .5); drawImg(iconCanvas(fx.id), fx.x0 + (fx.x1 - fx.x0) * pr, fx.y0 + (fx.y1 - fx.y0) * pr + .3, { sx: .8, sy: .8, z: Math.sin(pr * Math.PI) * 1.4 }); }
  // lighting (per game pixel)
  const lowG = ctx; drawKind('off'); if (glOn) setCtx(hdCtx(emCtxFor(lowG))); // v73 new light: the glows below go into the glow layer (render/glight.js), the darkness is worked out on the GPU
  if (lightCv && LW) {
    if (!glOn) { ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lightCv, 0, 0, LW, LH, LX0 * T - camX, LY0 * T - camY - L * 0.5, LW * T, LH * T); }
    ctx.globalCompositeOperation = 'lighter';
    if (!glOn) for (const Lt of LIGHTS) { if (!Lt.col) continue; const gx = Lt.x * T - camX, gy = (Lt.y - (Lt.tall ? .9 : .35)) * T - camY, rr = Math.min(Lt.r, 7) * T * 0.38; if (gx < -rr || gy < -rr || gx > cw + rr || gy > ch + rr) continue; ctx.drawImage(glowSprite(Lt.col), gx - rr, gy - rr, rr * 2, rr * 2); }
    // light shafts over water
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y); if (G.wall[i] || G.floor[i] !== WATER) continue; const h = hash2(x, y, 41); if (h > .07) continue;
      const a = .07 + .05 * Math.sin(t * .6 + h * 90), sx = x * T - camX + 4, sy = y * T - camY + 14, gr = ctx.createLinearGradient(0, sy - 46, 0, sy);
      gr.addColorStop(0, 'rgba(150,210,255,0)'); gr.addColorStop(.6, `rgba(150,210,255,${a})`); gr.addColorStop(1, 'rgba(150,210,255,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx - 12, sy - 46); ctx.lineTo(sx - 4, sy - 46); ctx.lineTo(sx + 8, sy); ctx.lineTo(sx, sy); ctx.closePath(); ctx.fill(); }
    // ambient particles
    for (const a of AMB) { const life = Math.sin(Math.PI * a.t / a.life); const X = Math.round(a.x * T - camX), Y = Math.round(a.y * T - camY); if (X < -8 || Y < -8 || X > cw + 8 || Y > ch + 8) continue;
      if (a.k === 0) { const al = life * (.55 + .45 * Math.sin(t * 5 + a.ph)); ctx.globalAlpha = al; ctx.drawImage(glowSprite('#d8ff8a'), X - 6, Y - 6, 12, 12); ctx.fillStyle = '#f4ffc0'; ctx.fillRect(X, Y, 1, 1); }
      else if (a.k === 3) { ctx.globalAlpha = life; ctx.fillStyle = Math.sin(t * 9 + a.ph) > 0 ? '#ffc861' : '#ff6a2a'; ctx.fillRect(X, Y, 1, 1); }
      else if (a.k === 4) { ctx.globalAlpha = life * .9; ctx.fillStyle = '#ffffff'; ctx.fillRect(X, Y, 1, 1); ctx.fillStyle = '#d4f0ff'; ctx.fillRect(X + 1, Y, 1, 1); }
      else if (a.k === 1) { ctx.globalAlpha = life * .8; ctx.drawImage(glowSprite('#d59bff'), X - 4, Y - 4, 8, 8); ctx.fillStyle = '#ecd2ff'; ctx.fillRect(X, Y, 1, 1); }
      else { const al = life * Math.max(0, Math.sin(t * 4 + a.ph)); ctx.globalAlpha = al; ctx.fillStyle = '#e6dcff'; ctx.fillRect(X, Y - 1, 1, 3); ctx.fillRect(X - 1, Y, 3, 1); } }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
  }
  drawTreeGlow(t, T, camX, camY, cw, ch);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false; setCtx(lowG);
}
// v73: drawn after the light (also after the new light pass): boss shots, marks, reach area, target highlight
export function renderWorldPost(cw, ch) {
  const T = TP, camX = VIEW.camX, camY = VIEW.camY, p = G.p, L = LIFT;
  // boss shots (after lighting so they read in the dark)
  if (G.shots.length) { ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true; for (const s of G.shots) { const gx = s.x * T - camX, gy = (s.y - .3) * T - camY, rr = .55 * T; ctx.drawImage(glowSprite(s.k === 'spore' ? '#d59bff' : '#b9a8ff'), gx - rr, gy - rr, rr * 2, rr * 2); } ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
    for (const s of G.shots) { const img = SPR.shot[s.k], w = effW(img), gx = Math.round(s.x * T - camX), gy = Math.round((s.y - .3) * T - camY); if (s.k === 'shard' || s.k === 'ice') { ctx.save(); ctx.translate(gx, gy); ctx.rotate((s.a || 0) + Math.PI / 2); ctx.drawImage(img, -w / 2, -w / 2); ctx.restore(); } else ctx.drawImage(img, gx - w / 2, gy - w / 2); } }
  // village marks (developer mode only)
  if (canDev() && G.marks && G.marks.length) {
    const M = G.marks;
    for (let k = 0; k + 1 < M.length; k += 2) { const a = M[k], b = M[k + 1], x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x, b.x) + 1, y1 = Math.max(a.y, b.y) + 1;
      ctx.fillStyle = 'rgba(255,143,163,0.08)'; ctx.fillRect(x0 * T - camX, y0 * T - camY, (x1 - x0) * T, (y1 - y0) * T);
      ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(255,143,163,0.85)'; ctx.lineWidth = 1; ctx.strokeRect(x0 * T - camX + .5, y0 * T - camY + .5, (x1 - x0) * T - 1, (y1 - y0) * T - 1); ctx.setLineDash([]); }
    M.forEach((m, k) => { const X = Math.round(m.x * T - camX), Y = Math.round(m.y * T - camY); ctx.fillStyle = INK; ctx.fillRect(X + 3, Y + 1, 2, 14); ctx.fillStyle = '#e8dcc8'; ctx.fillRect(X + 4, Y + 2, 1, 12);
      ctx.fillStyle = k % 2 ? '#7fe0b5' : '#ff8fa3'; ctx.fillRect(X + 5, Y + 2, 7, 5); ctx.fillStyle = INK; ctx.fillRect(X + 5, Y + 7, 7, 1); ctx.fillRect(X + 12, Y + 2, 1, 5); ctx.fillRect(X + 5, Y + 1, 8, 1);
      ctx.fillStyle = '#fff'; const n = Math.floor(k / 2) + 1; if (n < 10) { ctx.font = '6px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2a1830'; ctx.fillText(String(n), X + 8.5, Y + 5); } });
  }
  // reach area (mouse aiming)
  if (G.act && aimMouse() && p.dead <= 0 && !paused && !p.sit) {
    const tt = G.act.t, s0 = selItem(), it0 = s0 && ITEMS[s0.id], placing = it0 && ['place', 'wall', 'floor', 'seed'].includes(it0.kind);
    if ((tt && tt.far) || placing) {
      const ptx = Math.floor(p.x), pty = Math.floor(p.y);
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const tx = ptx + dx, ty = pty + dy; if ((!dx && !dy) || !inReach(tx, ty)) continue; const X = tx * T - camX, Y = ty * T - camY - (G.wall[idx(tx, ty)] ? L : 0);
        ctx.fillStyle = 'rgba(255,241,214,0.07)'; ctx.fillRect(X + 1, Y + 1, T - 2, T - 2); ctx.strokeStyle = 'rgba(255,241,214,0.16)'; ctx.lineWidth = 1; ctx.strokeRect(X + 1.5, Y + 1.5, T - 3, T - 3); }
    }
    if (tt && tt.far) { const X = tt.far.x * T - camX, Y = tt.far.y * T - camY - (inB(tt.far.x, tt.far.y) && G.wall[idx(tt.far.x, tt.far.y)] ? L : 0);
      ctx.setLineDash([3, 2]); ctx.strokeStyle = 'rgba(255,143,163,0.75)'; ctx.lineWidth = 1; ctx.strokeRect(X + 1.5, Y + 1.5, T - 3, T - 3); ctx.setLineDash([]); }
  }
  // target highlight
  if (G.act && G.act.t && p.dead <= 0 && !paused) {
    const tt = G.act.t, k = G.act.k; let hx = tt.x * T - camX, hy = tt.y * T - camY - (G.wall[idx(tt.x, tt.y)] ? L : 0), hw = T, hh = T;
    // v77: 여러 칸 가구(작업대 2×1·부엌 세트 3×1 …)는 놓은 뒤에도 차지한 칸 전체를 표시해요 (놓기 전 테두리와 같은 크기)
    if (k !== 'place' && inB(tt.x, tt.y)) { const ai = anchorAt(idx(tt.x, tt.y)), o = ai >= 0 ? G.objs.get(ai) : null; if (o && OBJ[o.t] && OBJ[o.t].sz) { const fp = fpOf(o); hx = (ai % W) * T - camX; hy = ((ai / W) | 0) * T - camY; hw = fp[0] * T; hh = fp[1] * T; } }
    const col = k === 'mine' || k === 'chop' ? '255,241,214' : k === 'place' ? '127,224,181' : k === 'info' ? '191,174,211' : '255,200,97';
    const pulse = 0.6 + Math.sin(performance.now() / 160) * 0.25; ctx.fillStyle = `rgba(${col},${pulse * .16})`; ctx.fillRect(hx, hy, hw, hh); ctx.fillStyle = `rgba(${col},${pulse})`; // v65: the target tile shows clearly
    for (const [ax, ay, sx, sy] of [[hx, hy, 1, 1], [hx + hw, hy, -1, 1], [hx, hy + hh, 1, -1], [hx + hw, hy + hh, -1, -1]]) { ctx.fillRect(sx > 0 ? ax : ax - 4, sy > 0 ? ay : ay - 1, 4, 1); ctx.fillRect(sx > 0 ? ax : ax - 1, sy > 0 ? ay : ay - 4, 1, 4); }
    if (k === 'place') { const s = selItem(); if (s) { const it = ITEMS[s.id], d = it.kind === 'place' ? OBJ[it.obj] : null; ctx.globalAlpha = 0.45;
      if (d && d.sz) { const fp = placeFp(d), a = placeAnchor(tt, fp), [img] = rotImg(it.obj, pRot() % rotN(it.obj), SPR.obj[it.obj]), X = a.x * T - camX, Y = a.y * T - camY; if (d.flat) ctx.drawImage(img, X, Y); else ctx.drawImage(img, X + fp[0] * T / 2 - effW(img) / 2, Y + fp[1] * T - effH(img)); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(127,224,181,.85)'; ctx.lineWidth = 1; ctx.strokeRect(X + .5, Y + .5, fp[0] * T - 1, fp[1] * T - 1); }
      else { let img = it.kind === 'place' ? SPR.obj[it.obj] : iconCanvas(s.id), fl = false; const pr = pRot(); if (d && pr && canRotObj(it.obj)) [img, fl] = rotImg(it.obj, pr % rotN(it.obj), img);
        if (fl) { ctx.save(); ctx.translate(hx + T / 2, 0); ctx.scale(-1, 1); ctx.drawImage(img, -effW(img) / 2, hy + T - effH(img)); ctx.restore(); } else ctx.drawImage(img, hx + T / 2 - effW(img) / 2, hy + T - effH(img)); }
      ctx.globalAlpha = 1; } }
  }
}
// v71: which of the 8 neighbours are open (not a wall) — 1 N · 2 E · 4 S · 8 W · 16 NE · 32 SE · 64 SW · 128 NW (outside the map counts as wall)
function wallOpen(x, y) { const o = (dx, dy) => { const xx = x + dx, yy = y + dy; return inB(xx, yy) && !G.wall[idx(xx, yy)]; };
  return (o(0, -1) ? 1 : 0) | (o(1, 0) ? 2 : 0) | (o(0, 1) ? 4 : 0) | (o(-1, 0) ? 8 : 0) | (o(1, -1) ? 16 : 0) | (o(1, 1) ? 32 : 0) | (o(-1, 1) ? 64 : 0) | (o(-1, -1) ? 128 : 0); }
// ---- v77: 머리 위 체력(빨강)·기력(주황) 막대 ----
// 싸우는 중(맞음·내가 때림·몬스터가 쫓음 — 끝나고 3초까지, 보스와 싸우는 동안)이거나 체력이 덜 찼을 때만 보여요. 가득 찬 채 안 싸울 때는 숨김
export const FIGHT_HOLD = 3;
const ago = t => Number.isFinite(t) ? G.time - t : 1e9;
export function inFight(p = G.p) { if (Math.min(ago(p.hitAt), ago(p.fightAt), ago(p.chasedAt)) < FIGHT_HOLD) return true;
  for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b && b.st === 'fight' && Math.hypot(b.x - p.x, b.y - p.y) < 18) return true; } return false; }
export const headBarsOn = (p = G.p) => p.dead <= 0 && !p.sleep && (inFight(p) || p.hp < maxHp() - .5);
const headTop = p => p.y + .15 - (SPR.player ? effH(SPR.player.down[0]) : 24) / 16; // 머리 꼭대기 (칸 단위)
const HB = () => ({ hh: Math.max(3, Math.round(Z * 1.6)), mh: Math.max(2, Math.round(Z)), gap: Math.round(Z * 3) }); // 막대 높이·머리와 띄우기 (화면 픽셀)
function drawHeadBars(T, camX, camY) { const p = G.p; if (!headBarsOn(p)) return;
  const { hh, mh, gap } = HB(), b = Math.max(1, Math.round(Z / 2)), w = Math.round(T * .95), x = Math.round(p.x * T - camX - w / 2), y = Math.round(headTop(p) * T - camY) - gap - hh - mh - b;
  ctx.fillStyle = 'rgba(20,14,30,.92)'; ctx.fillRect(x - b, y - b, w + b * 2, hh + mh + b * 3);
  ctx.fillStyle = '#4a1d2a'; ctx.fillRect(x, y, w, hh); ctx.fillStyle = '#ff4f64'; ctx.fillRect(x, y, Math.round(w * clamp(p.hp / maxHp(), 0, 1)), hh);
  ctx.fillStyle = '#4a3418'; ctx.fillRect(x, y + hh + b, w, mh); ctx.fillStyle = '#ffa640'; ctx.fillRect(x, y + hh + b, Math.round(w * clamp((p.mp || 0) / maxMp(), 0, 1)), mh); }
// 알림 자리: 머리 위 막대 살짝 위 (화면 CSS 픽셀, 화면 흔들림은 무시)
export function headNoteY() { if (!G || !SPR.player) return null; const { hh, mh, gap } = HB(); return (headTop(G.p) * TP - VIEW.baseY - gap - hh - mh - Math.round(Z * 2)) / DPR - 4; }
export function renderOverlay(cw, ch) {
  const T = TP, camX = VIEW.camX, camY = VIEW.camY, p = G.p, L = LIFT * Z; ctx.imageSmoothingEnabled = true;
  // soft vignette
  if (G.act && aimMouse() && p.dead <= 0 && !paused && !p.sit) { const tt = G.act.t;
    if (tt && tt.far) { const X = tt.far.x * T - camX, Y = tt.far.y * T - camY - (inB(tt.far.x, tt.far.y) && G.wall[idx(tt.far.x, tt.far.y)] ? L : 0);
      ctx.font = pxFont(4.6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const tw2 = ctx.measureText('닿지 않아요').width / 2 + 3 * Z, LX = clamp(X + T / 2, tw2, cw - tw2), LY = clamp(Y - 3.5 * Z, 4 * Z, ch - 4 * Z); pxText('닿지 않아요', LX, LY, '#ffb4c0', INK); } }
  if (G.act && G.act.t && p.dead <= 0 && !paused && !document.body.classList.contains('touch') && G.act.lbl) {
    const tt = G.act.t, k = G.act.k, hx = tt.x * T - camX, hy = tt.y * T - camY - (G.wall[idx(tt.x, tt.y)] ? L : 0);
    const col = k === 'mine' || k === 'chop' ? '255,241,214' : k === 'place' ? '127,224,181' : k === 'info' ? '191,174,211' : '255,200,97';
    const alt = curAlt(), lb = 'E ' + G.act.lbl + (alt ? ' · R ' + alt.lbl + (G.alts.length > 1 ? ' (Q)' : '') : ''); /* v65 */ ctx.font = pxFont(5.4); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const fh = parseFloat(ctx.font), tw = Math.round(ctx.measureText(lb).width + 6 * Z), lx = Math.round(hx + T / 2), ly = Math.round(hy - 5 * Z), bh = Math.round(Math.max(9 * Z, fh + 2 * Z)); ctx.fillStyle = 'rgba(27,20,38,0.85)'; ctx.fillRect(lx - Math.round(tw / 2), ly - Math.round(bh / 2), tw, bh); pxText(lb, lx, ly, `rgb(${col})`); /* v78: 도트 글꼴, 네모 상자 */
  }
  drawHitBars(T, camX, camY); // v65: hit to recover
  drawHeadBars(T, camX, camY); // v77: 머리 위 체력·기력
  // goal arrow (drawn at screen resolution so it stays crisp)
  if (goalTarget && p.dead <= 0) { const dx = goalTarget.x - p.x, dy = goalTarget.y - p.y, d = Math.hypot(dx, dy); if (d > 5) { const a = Math.atan2(dy, dx), r = 1.35, ax = Math.round((p.x + Math.cos(a) * r) * T - camX), ay = Math.round((p.y - .4 + Math.sin(a) * r) * T - camY); ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); const bob = Math.round(Math.sin(performance.now() / 200)) * Z; ctx.fillStyle = '#ffc861'; ctx.strokeStyle = INK; ctx.lineWidth = Z; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(4 * Z + bob, 0); ctx.lineTo(-3 * Z + bob, -4 * Z); ctx.lineTo(-1 * Z + bob, 0); ctx.lineTo(-3 * Z + bob, 4 * Z); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } }
  // v68 (BF-08): my nearest lost bundle — an orange arrow with the bundle's own picture, a little further out than the quest arrow so both
  // can show at once; hidden when the bundle is close (it is in sight then)
  { const bag = p.dead <= 0 ? nearestBag(p.x, p.y) : null; if (bag && bag.d > 3) { const a = Math.atan2(bag.y - p.y, bag.x - p.x), r = 2.05, cx = (p.x + Math.cos(a) * r) * T - camX, cy = (p.y - .4 + Math.sin(a) * r) * T - camY;
    ctx.save(); ctx.translate(Math.round(cx), Math.round(cy)); ctx.rotate(a); const bob = Math.round(Math.sin(performance.now() / 230)) * Z; ctx.fillStyle = '#ff9b4a'; ctx.strokeStyle = INK; ctx.lineWidth = Z; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(7 * Z + bob, 0); ctx.lineTo(3 * Z + bob, -3 * Z); ctx.lineTo(3 * Z + bob, 3 * Z); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const im = SPR.obj.lostBag; if (im) { const sz = 9 * Z; ctx.imageSmoothingEnabled = false; ctx.drawImage(im, Math.round(cx - sz / 2), Math.round(cy - sz / 2), sz, sz); } } }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = pxFont(6.2); ctx.lineJoin = 'round';
  for (const tx of G.texts) { ctx.globalAlpha = Math.min(1, tx.life * 2); pxText(tx.txt, tx.x * T - camX, tx.y * T - camY, tx.col, INK); } // v78: 도트 글꼴 + 도트 테두리
  ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
}
export function drawEntity(it, t) {
  const T = TP, camX = VIEW.camX, camY = VIEW.camY;
  if (it.k === 'o') {
    const o = it.o, d = OBJ[o.t]; if (d.warp) { drawWarp(it, o, d, t); return; } if (d.tw) { drawImg(twSprite(o.t, twMask(it.x, it.y, d.tw.type), d.dev === 'slide' ? slideStep(o, t) : !!o.open), it.x + .5, it.y + 1); return; }
    let img = o.off && SPR.objOff[o.t] ? SPR.objOff[o.t] : SPR.obj[o.t]; const fpD = d.sz ? fpOf(o) : null, wx = it.x + (fpD ? fpD[0] / 2 : .5), wy = it.y + (fpD ? fpD[1] : 1) - 1 / 16; let flipX = !!o.flip;
    if (d.dev === 'farm') img = SPR.obj[o.t + (farmStage(o) || '')] || img; { const r = rotOf(o); if (r && !d.dev) { const [im, fl] = rotImg(o.t, r, img); img = im; flipX = fl; } } // v65
    if (d.crop) img = SPR.crop[d.crop][Math.max(0, cropStage(o))][(o.w ? 1 : 0) + (o.f ? 2 : 0)];
    if (o.t === 'giantCrop') img = (OBJ[o.c] && SPR.giant[OBJ[o.c].crop]) || SPR.crop.berry[3][0];
    if (d.bush) img = SPR.bush[(o.r || 0) <= G.time ? 1 : 0];
    if (o.t === 'tchest' && o.open) img = SPR.obj.tchestOpen;
    if (o.t === 'wildF') img = SPR.wild[o.c] || SPR.wild.R;
    if (o.t === 'lever' && o.on) img = SPR.obj.leverOn; if (o.t === 'eDoor' && o.open) img = SPR.obj.eDoorOpen;
    if (d.dev === 'drill' && o.dir) img = SPR.obj[o.t + (o.dir.y < 0 ? 'U' : o.dir.y > 0 ? 'D' : o.dir.x < 0 ? 'L' : 'R')] || img;
    if (d.growTo) { const st = treeStep(o); if (st >= 0) { const base = o.t === 'capSapling' || o.t === 'capStump' ? 'capSapling' : 'sapling'; img = SPR.obj[st ? base + 'B' : base]; } }
    if (o.yg && isYoung(o) && SPR.young[o.t]) img = SPR.young[o.t];
    const sx = o.shake ? 1 + Math.sin(o.shake * 60) * 0.06 : 1;
    if (d.solid && effH(img) > 17) shadow(wx, wy - .08, .38 * (fpD ? fpD[0] : 1), .25);
    if (TIERED[o.t] && o.lv) { const px = Math.round(wx * T - camX), py = Math.round((wy - effH(img) / 16) * T - camY) + 2; ctx.fillStyle = INK; ctx.fillRect(px - 4, py, 8, 5); ctx.fillStyle = BENCH_COL[o.lv]; ctx.fillRect(px - 3, py + 1, 6, 3); } // v60 tier plate
    if (o.job) { const j = o.job, prog = clamp((nowS() - j.t0) / (j.q * j.per), 0, 1), top = wy - effH(img) / 16 - .2, bx = Math.round(wx * T - camX) - 10, by = Math.round(top * T - camY);
      ctx.fillStyle = INK; ctx.fillRect(bx, by, 20, 4); ctx.fillStyle = prog >= 1 ? '#ffd25c' : '#7fe0b5'; ctx.fillRect(bx + 1, by + 1, Math.round(18 * prog), 2);
      if (jobDone(j) > 0) drawImg(iconCanvas(j.out), wx, top - .1 + Math.sin(t * 3 + it.x) * .06, { sx: .55, sy: .55 }); }
    if (d.ranch && ranchReady(o)) drawImg(iconCanvas(d.ranch), wx, it.y - .55 + Math.sin(t * 3 + it.x) * .06, { sx: .55, sy: .55 });
    let see = null; if (d.solid && effH(img) > 34) { const p = G.p, hw = effW(img) / 32, top = wy - effH(img) / 16; if (p.y < wy - .2 && p.y > top + .35 && Math.abs(p.x - wx) < hw * .9) see = .45; }
    const glowL = d.light && !o.off; if (glowL) drawKind('up', 'lamp'); // v79: lit light objects' flames glow in the new light
    drawImg(img, wx, wy, { sx: d.dev === 'drill' && o.work ? 1 + Math.sin(t * 40) * .03 : d.ranch ? 1 + Math.sin(t * 2.5 + it.x * 1.7) * .03 : sx, flip: flipX, alpha: see });
    if (glowL) drawKind('up');
    if (d.dev === 'farm' && farmStage(o) < 3) { const f = clamp((G.time - (o.p || 0)) / growOf(o), 0, 1), bx = Math.round((it.x + 1) * T - camX) - 10, by = Math.round((it.y - .55) * T - camY); ctx.fillStyle = INK; ctx.fillRect(bx, by, 20, 4); ctx.fillStyle = '#7fe0b5'; ctx.fillRect(bx + 1, by + 1, Math.round(18 * f), 2); }
    if (d.dev === 'farm' && ((o.store || []).length || farmStage(o) >= 3)) { ctx.fillStyle = (o.store || []).length ? '#ffd25c' : `rgba(255,241,214,${.5 + Math.sin(t * 5) * .3})`; ctx.fillRect(Math.round((it.x + 1.8) * T - camX), Math.round((it.y - .3) * T - camY), 3, 3); }
    if (o.t === 'battery') { const f = clamp((o.e || 0) / BATT_MAX, 0, 1); ctx.fillStyle = INK; ctx.fillRect(Math.round(wx * T - camX) - 5, Math.round((it.y + .05) * T - camY), 10, 3); ctx.fillStyle = f > .5 ? '#7fe0b5' : f > .2 ? '#ffc861' : '#ff6b7a'; ctx.fillRect(Math.round(wx * T - camX) - 4, Math.round((it.y + .05) * T - camY) + 1, Math.round(8 * f), 1); }
    if (o.t === 'generator' && o.lit && CIRC.pRoots.size) { const fl = (t * 8) % 1; ctx.fillStyle = fl < .5 ? '#ff8a3d' : '#ffc861'; ctx.fillRect(Math.round(wx * T - camX) - 3, Math.round((it.y + 1) * T - camY) - 8, 6, 3); }
    if ((o.t === 'timer' || o.t === 'crystalGen') && o.lit) { ctx.fillStyle = '#7fe0b5'; ctx.fillRect(Math.round(wx * T - camX) - 1, Math.round((it.y + 1) * T - camY) - (o.t === 'timer' ? 14 : 6), 2, 2); }
    if (o.cake) drawImg(SPR.item.festCake, wx, wy - effH(img) / 16 * .55, { sx: .85, sy: .85 });
    if (d.dev === 'harv' && (o.store || []).length) { ctx.fillStyle = '#ffd25c'; ctx.fillRect(Math.round(wx * T - camX) + 4, Math.round((it.y + 1) * T - camY) - 20, 3, 3); }
    if (d.dev === 'drill' && (o.store || []).length) { ctx.fillStyle = '#ffd25c'; ctx.fillRect(Math.round(wx * T - camX) + 4, Math.round((it.y + 1) * T - camY) - 20, 3, 3); }
    if (o.t === 'cherryTree') { for (let k = 0; k < 3; k++) { const ph = (t * .3 + k / 3 + hash2(it.x, it.y, k)) % 1, px = it.x + .5 + (k - 1) * .7 + Math.sin(ph * 9 + k) * .35, py = it.y - 1.6 + ph * 2.3; ctx.globalAlpha = Math.min(1, (1 - ph) * 3); ctx.fillStyle = k % 2 ? '#ffffff' : '#f7b8cf'; ctx.fillRect(Math.round(px * T - camX), Math.round(py * T - camY), Z, Z); } ctx.globalAlpha = 1; }
    if (o.t === 'torch' || o.t === 'furnace') { /* flame flicker handled by light */ }
    if (d.bed && G.p.sleep && G.p.sleep.x === it.x && G.p.sleep.y === it.y) { drawImg(SPR.sleepHead, wx, it.y - .2); ctx.font = pxFont(6); ctx.fillStyle = '#d9d2ff'; ctx.textAlign = 'center'; const zz = (t * .7) % 1; ctx.globalAlpha = 1 - zz; ctx.fillText('z', (wx + .5 + zz * .3) * T - camX, (it.y - 1.2 - zz * .5) * T - camY); ctx.globalAlpha = 1; }
    if (d.shrine && o.has) { const gk = guardOf(it.x, it.y), sealed = gk && !G.bossDead[gk]; const bob = Math.sin(t * 2.5) * 0.08; drawImg(SPR.item.lightSeed, wx, it.y + .25 + bob, { sx: .9, sy: .9, alpha: sealed ? .55 : 1 });
      if (sealed) { ctx.strokeStyle = `rgba(190,140,255,${.45 + Math.sin(t * 3) * .2})`; ctx.lineWidth = Z; ctx.beginPath(); ctx.arc(wx * T - camX, (it.y - .3) * T - camY, .55 * T, 0, 6.283); ctx.stroke(); } }
    if (d.crop && cropStage(o) >= 3) { ctx.fillStyle = `rgba(255,241,214,${0.5 + Math.sin(t * 5) * 0.3})`; ctx.fillRect(Math.round((it.x + .78) * T - camX), Math.round((it.y + .1) * T - camY), Z, Z);
      if (o.star) { const sx2 = Math.round((it.x + .22) * T - camX), sy2 = Math.round((it.y + .02) * T - camY), on = Math.sin(t * 4 + it.x) > -.3; ctx.fillStyle = on ? '#fff1b0' : '#ffd25c'; ctx.fillRect(sx2 - Z, sy2, Z * 3, Z); ctx.fillRect(sx2, sy2 - Z, Z, Z * 3); if (on) { ctx.fillStyle = '#ffffff'; ctx.fillRect(sx2, sy2, Z, Z); } } }
    return;
  }
  if (it.k === 'tree') { drawTree(t); return; }
  if (it.k === 'p') {
    const p = G.p; if (p.dead > 0) { drawImg(SPR.player.down[0], p.x, p.y + .15, { alpha: .5, sy: .6 }); return; }
    if (p.sleep) return;
    if (p.sit) { const sd = p.sit.dir || 0; if (sd) { drawImg((p.hurt > 0 ? SPR.playerW : SPR.player)[sd === 2 ? 'up' : 'side'][0], p.x, p.y + .15, { flip: sd === 3 }); if (sd === 2) { const so = G.objs.get(idx(p.sit.x, p.sit.y)); if (so && SPR.obj[so.t + 'Ub']) drawImg(SPR.obj[so.t + 'Ub'], p.sit.x + .5, p.sit.y + 1 - 1 / 16); } return; } drawImg(p.hurt > 0 ? whiten(SPR.playerSit) : SPR.playerSit, p.x, p.sit.y + .78); return; }
    if (p.inv > 0 && p.inv < 0.7 && Math.floor(performance.now() / 70) % 2) return;
    shadow(p.x, p.y + .1, .3); const fr = p.moving ? Math.floor(p.anim * 7) % 2 : 0; const bob = p.moving ? (fr ? 1 / 16 : 0) : Math.sin(t * 2) > .7 ? 1 / 16 : 0;
    drawImg((p.hurt > 0 ? SPR.playerW : SPR.player)[p.dir][fr], p.x, p.y + .15 - bob, { flip: p.flip });
    return;
  }
  if (it.k === 'w') { const w = it.w, img = animalImg(it.pk || w.k); shadow(w.x, w.y + .1, .28, .3); const mv = it.pk ? w.moving : (w.vx || w.vy), bob = mv && Math.floor((w.anim || 0) * 8) % 2 ? 1 / 16 : 0; if (img) drawImg(img, w.x, w.y + .12 - bob, { flip: w.flip });
    if (it.pk && Math.sin(t * 1.3 + w.x) > .97) { ctx.fillStyle = '#ff8fa3'; ctx.fillRect(Math.round(w.x * T - camX), Math.round((w.y - 1.05) * T - camY), Z, Z); } return; }
  if (it.k === 'e') {
    const e = it.e, def = ENEMY[e.k]; shadow(e.x, e.y + .1, def.r * 0.95, .3 - (e.z || 0) * .3);
    let sx = 1, sy = 1; if (def.hop) { if (e.air > 0) { sx = .9; sy = 1.12; } else if (e.land > 0) { sx = 1.18; sy = .82; } else { const b = Math.sin(t * 5 + e.x) * .04; sx = 1 + b; sy = 1 - b; } }
    else { const b = Math.floor((e.anim || 0) * 8) % 2; sy = b ? .95 : 1; }
    drawImg(e.hurt > 0 ? SPR[e.k + 'W'] : SPR[e.k], e.x, e.y + .12, { sx, sy, z: e.z || 0, flip: e.flip });
    if (e.slow > 0 || e.poison || e.burn) { ctx.fillStyle = e.burn ? '#ff9b4a' : e.poison ? '#9be37a' : '#bfe6ff'; ctx.fillRect(Math.round(e.x * T - camX) - Z, Math.round((e.y - 1.15 - (e.z || 0)) * T - camY), 2 * Z, 2 * Z); }
    if (e.hp < (e.mh || def.hp)) { const w = 12 * Z, hx = e.x * T - camX - w / 2, hy = (e.y - .95 - (e.z || 0)) * T - camY; ctx.fillStyle = INK; ctx.fillRect(hx - Z, hy - Z, w + 2 * Z, 3 * Z); ctx.fillStyle = '#ff8fa3'; ctx.fillRect(hx, hy, w * Math.max(0, e.hp / (e.mh || def.hp)), Z); }
    return;
  }
  if (it.k === 'b') {
    const b = it.b, def = BOSSES[b.k]; shadow(b.x, b.y + .2, 1.1 - b.z * .15, .35);
    let sx = 1, sy = 1;
    if (b.st === 'sleep') { const k = Math.sin(t * 1.5) * .04; sx = 1 + k; sy = 1 - k; }
    else if (b.k === 'slime') { if (b.air > 0) { sx = .92; sy = 1.1; } else { const k = Math.min(1, b.t) * .1; sx = 1 + k; sy = 1 - k; } }
    else if (b.k === 'turtle') { if (b.ph === 'hide') { sx = 1.06; sy = .92; } else if (b.ph === 'spit') { sx = .96; sy = 1.06; } else if (b.ph !== 'shell') { const k = Math.sin((b.anim || 0) * 6) * .03; sx = 1 + k; sy = 1 - k; } }
    else if (b.k === 'spirit') { const k = Math.sin(t * 3) * .04; sx = 1 - k; sy = 1 + k; }
    else if (b.k === 'queen') { if (b.ph === 'cast') { sx = 1.05 + Math.sin(t * 30) * .03; sy = .96; } else { const k = Math.sin((b.anim || 0) * 8) * .04; sx = 1 - k; sy = 1 + k; } }
    else { if (b.ph === 'aim') { sx = 1.07; sy = .93; } else if (b.ph === 'dash') { sx = 1.1; sy = .92; } else if (b.ph === 'stun') sx = 1 + Math.sin(t * 40) * .03; }
    if (b.st === 'fight' && b.k === 'queen' && b.ph === 'cast') { const pr = 1 - Math.max(0, b.t) / .75; ctx.strokeStyle = `rgba(213,155,255,${.35 + pr * .45})`; ctx.lineWidth = Z; ctx.beginPath(); ctx.ellipse(b.x * T - camX, (b.y + .2) * T - camY, (.6 + pr * 1.4) * T, (.3 + pr * .7) * T, 0, 0, 6.283); ctx.stroke(); }
    if (b.st === 'fight' && b.k === 'golem' && b.ph === 'aim') { ctx.strokeStyle = 'rgba(255,110,130,0.7)'; ctx.lineWidth = 1.5 * Z; ctx.setLineDash([3 * Z, 2 * Z]); ctx.beginPath(); ctx.moveTo(b.x * T - camX, b.y * T - camY); ctx.lineTo((b.x + b.dx * 7) * T - camX, (b.y + b.dy * 7) * T - camY); ctx.stroke(); ctx.setLineDash([]); }
    if (b.k === 'turtle' && b.ph === 'open') { const pr = .5 + Math.sin(t * 8) * .3; ctx.strokeStyle = `rgba(255,210,92,${pr})`; ctx.lineWidth = 1.5 * Z; ctx.beginPath(); ctx.ellipse(b.x * T - camX, (b.y + .25) * T - camY, 1.4 * T, .6 * T, 0, 0, 6.283); ctx.stroke(); }
    const sk = b.k === 'turtle' ? (b.ph === 'shell' ? 'turtleS' : 'turtle') + ((b.stage || 1) >= 2 ? 'C' : '') : def.spr, bz = b.k === 'spirit' ? .45 + Math.sin(t * 2) * .12 : (b.z || 0), ba = b.k === 'spirit' && b.ph === 'fade' ? Math.max(.1, b.t / .6) : null;
    if (b.k === 'spirit' && b.st === 'fight' && b.ph === 'ring') { const pr = 1 - Math.max(0, b.t) / .7; ctx.strokeStyle = `rgba(191,230,255,${.3 + pr * .5})`; ctx.lineWidth = Z; ctx.beginPath(); ctx.ellipse(b.x * T - camX, (b.y + .2) * T - camY, (.5 + pr * 1.5) * T, (.3 + pr * .8) * T, 0, 0, 6.283); ctx.stroke(); }
    drawImg(b.hurt > 0 ? SPR[sk + 'W'] : SPR[sk], b.x, b.y + .3, { sx: sx * def.scale, sy: sy * def.scale, z: bz, alpha: ba }); ctx.globalAlpha = 1;
    if (b.st === 'sleep') { ctx.font = pxFont(7); ctx.fillStyle = '#d2f7b8'; ctx.textAlign = 'center'; const zz = (t * .6) % 1; ctx.globalAlpha = 1 - zz; ctx.fillText('z', (b.x + .9 + zz * .4) * T - camX, (b.y - 2 - zz * .6) * T - camY); ctx.globalAlpha = 1; }
    if (b.k === 'golem' && b.ph === 'stun') { ctx.fillStyle = '#ffe9a8'; for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.09; ctx.fillRect(Math.round((b.x + Math.cos(a) * .7) * T - camX), Math.round((b.y - 2.2 + Math.sin(a) * .2) * T - camY), 2 * Z, 2 * Z); } }
    return;
  }
  if (it.k === 'd') { const d = it.d; shadow(d.x, d.y + .05, .16, .3); const bob = d.z === 0 ? Math.sin(t * 4 + d.x * 3) * 0.05 + 0.05 : 0; drawImg(iconCanvas(d.id), d.x, d.y + .05, { sx: .6, sy: .6, z: d.z + bob }); }
}
// v89 워프포인트·포탈: 켜진 것은 그림이 돌고(한 장 0.083초) 빛나는 부분이 새 빛에서 스스로 빛나요. 안 켜진 워프포인트는 첫 장을 어둡게, 멈춘 채.
export function drawWarp(it, o, d, t) { const F = SPR.warpF && SPR.warpF[d.warp], on = d.warp === 'portal' || !!o.on, wx = it.x + .5, wy = it.y + 1 - 1 / 16;
  if (!F) { drawImg(SPR.obj[o.t], wx, wy); return; }
  const k = on ? Math.floor(t / WARP_FRAME + hash2(it.x, it.y, 3) * F.base.length) % F.base.length : 0;
  drawKind('up'); drawImg(on ? F.base[k] : F.off, wx, wy, { sx: o.shake ? 1 + Math.sin(o.shake * 60) * 0.06 : 1 });
  if (on && F.glow[k]) { drawKind('fglow'); drawImg(F.glow[k], wx, wy); drawKind('up'); } }
