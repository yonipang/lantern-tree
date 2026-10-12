const envLv = k => G && G.env && G.env.k === k ? (G.env.v >= 100 ? 3 : G.env.v >= 70 ? 2 : G.env.v >= 40 ? 1 : 0) : 0;
function bmul(ef) { if (!G || !G.buffs) return 1; let best = null; for (const b of G.buffs) if (b.ef === ef && b.end > G.time && (!best || b.tier > best.tier)) best = b; return best ? EFF[ef].v[best.tier - 1] : 1; }
const inDeepArena = () => { const p = G.p; return Math.hypot(p.x - SL.x - .5, p.y - SL.y - .5) < 9.6 || Math.hypot(p.x - SI.x - .5, p.y - SI.y - .5) < 9.6; };
function envRelief(k) { const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y);
  for (let y = py - 3; y <= py + 3; y++) for (let x = px - 3; x <= px + 3; x++) { if (!inB(x, y) || Math.hypot(x + .5 - p.x, y + .5 - p.y) > 3.5) continue; const i = idx(x, y);
    if (k === 'hot') { if (G.floor[i] === WATER && !G.wall[i]) return true; continue; }
    const o = G.objs.get(i); if (!o) continue; const d = OBJ[o.t]; if (d && d.light && !d.nat && !d.crop && !o.off && o.t !== 'tchest') return true; }
  return false; }
let envFxV = 0, envFxShown = -1;
function envTick(dt) {
  const p = G.p, E = G.env || (G.env = { k: null, v: 0, lv: 0, t: 0 }), b = G.biome[idx(Math.floor(p.x), Math.floor(p.y))], zone = b === 3 ? 'hot' : b === 4 ? 'cold' : null;
  if (zone && E.k !== zone) { E.k = zone; E.v = 0; E.lv = -1; E.t = 0; }
  let rate = -4; if (zone && !envRelief(zone)) rate = (inDeepArena() ? .5 : 1) * bmul(zone === 'hot' ? 'heat' : 'cold') * (G.equip && G.equip.body && ITEMS[G.equip.body.id].guard === zone ? guardMul(lvOf(G.equip.body)) : 1) * (zone === 'cold' ? hatMul() : 1);
  E.v = clamp(E.v + rate * dt, 0, 100); if (!zone && E.v <= 0) E.k = null;
  const lv = !E.k ? 0 : E.v >= 100 ? 3 : E.v >= 70 ? 2 : E.v >= 40 ? 1 : 0;
  if (E.k && started && (lv > E.lv)) { if (lv || E.lv < 0) toast(ENV_TXT[E.k][lv], lv >= 2 ? 'warn' : null, 'env'); } if (E.k) E.lv = lv;
  if (lv === 3 && p.dead <= 0) { E.t += dt; if (E.t >= 5) { E.t = 0; p.hp -= 2; ftext(p.x, p.y - 1.2, '-2', E.k === 'hot' ? '#ff9b4a' : '#9fd8f0'); if (p.hp <= 0) { p.hp = 0; p.dead = 1.8; G.fish = null; $('#fade').textContent = '기절했어요…'; $('#fade').hidden = false; } } } else E.t = 0;
  // the screen edge: fades in and out over a second or two, never stronger than 30% during a boss fight
  let tgt = [0, .15, .30, .375 + Math.sin(performance.now() / 420) * .075][lv]; if (!$('#bossbar').hidden) tgt = Math.min(tgt, .30);
  envFxV += (tgt - envFxV) * Math.min(1, dt / (tgt > envFxV ? 1.2 : 1.6));
}
function regionMatHTML() { const seen = new Set(); for (let i = 0; i < G.explored.length; i++) if (G.explored[i]) seen.add(G.biome[i]);
  return `<div class="lbl">지역 재료</div><div class="rmat">${REGION_MAT.map((m, b) => `<div><b>${seen.has(b) ? BIOME[b] : '???'}</b>${seen.has(b) ? ['지형', '광물', '고유'].map((t, k) => `<span><img class="px" src="${iconURL(m[k])}" alt="">${t} · ${ITEMS[m[k]].n}</span>`).join('') : '<span>아직 가 보지 않은 곳</span>'}</div>`).join('')}</div>`; }
function eqEffect(sl, s) {
  if (!s) return sl === 'ring' ? '비어 있어요 · 장비제작대에서 만들어요' : '비어 있어요';
  return (s.lv ? `강화 +${s.lv} · ` : '') + upgText(s.id, lvOf(s)); }
// v48: the equipment rows sit at the top of the bag (no separate menu); pets at the bottom
function eqRowHTML() {
  let h = `<div class="lbl">장비 <span style="color:var(--muted);font-size:13px">칸을 누르면 벗어요 · 가방에서 옷·장신구를 고르고 [입기]·[달기]</span></div><div class="eqlist eq2">`;
  for (const [sl, n] of EQ_SLOTS) { const s = G.equip[sl];
    h += `<div class="eqr">${slotHTML(s, 'eqSlot', sl, 'eq' + (s ? '' : ' empty')).replace(/<\/button>$/, s ? '</button>' : `<span>${{ head: '머리', neck: '목' }[sl] || n}</span></button>`)}<div><b>${n}${s ? ' · ' + rarName(s.id) + (s.lv ? ` +${s.lv}` : '') : ''}</b><small>${eqEffect(sl, s)}</small></div></div>`; }
  return h + `</div>`; }
let wearAskT = 0;
function suggestWear(b) { const need = b === 3 ? 'hot' : b === 4 ? 'cold' : null, el = $('#wearAsk'); if (!need || !started) return; const cur = G.equip.body;
  if (cur && ITEMS[cur.id].guard === need) return; const k = G.inv.findIndex(x => x && ITEMS[x.id].kind === 'wear' && ITEMS[x.id].guard === need); if (k < 0) return;
  el.textContent = `${ITEMS[G.inv[k].id].n}${roJosa(ITEMS[G.inv[k].id].n).slice(ITEMS[G.inv[k].id].n.length)} 갈아입을까요?`; el.dataset.id = G.inv[k].id; el.hidden = false; clearTimeout(wearAskT); wearAskT = setTimeout(() => { el.hidden = true; }, 8000); }
function drawEnv() { const E = G.env || {}, bar = $('#envBar'), on = !!E.k; if (bar.hidden === on) bar.hidden = !on;
  if (on) { const k = E.k + '|' + Math.round(E.v); if (bar.dataset.k !== k) { bar.dataset.k = k; bar.className = 'bar env ' + E.k; $('#envFill').style.width = E.v + '%'; $('#envTxt').textContent = Math.round(E.v); const ic = E.k === 'hot' ? 'fireBerry' : 'frostShard'; if ($('#icEnv').dataset.ic !== ic) { $('#icEnv').dataset.ic = ic; $('#icEnv').src = iconURL(ic); } } }
  const fx = $('#envFx'), v = Math.round(envFxV * 200) / 200; if (v !== envFxShown) { envFxShown = v; fx.style.opacity = (v / .45).toFixed(3); } const cls = E.k || (envFxV > .005 ? fx.dataset.k : ''); if (fx.dataset.k !== cls) { fx.dataset.k = cls || ''; fx.className = cls || ''; } }
// v63: natural rock a pickaxe can dig is not a trap — a rock wall on a tile that was rock in the world first generated counts as open (quartz veins
// turn granite into quartz later). Wood/brick walls, walls built on open ground, fences, furniture, bedrock, water and lava still close you in.
// Some new worlds start in a rock-ringed clearing. Used by closedIn (fainting, recall, loading — v64) and regionOf (emergency escape — v63).
let NATW = null, NATW_K = '';
function naturalWalls() { const k = G.seed + '|' + W + 'x' + H; if (NATW_K !== k) { NATW = genWorld(G.seed).wall; NATW_K = k; } return NATW; }
function shutsIn(x, y, j, nat) { if (!isSolid(x, y)) return false; const o = G.objs.get(j), a = o && (o.t === '_part' ? G.objs.get(o.a) : o); if (a && OBJ[a.t] && OBJ[a.t].door) return false;
  return !(nat && nat[j] && nat[j] !== 8 && G.wall[j] && G.wall[j] !== 8 && G.wall[j] !== 6 && G.wall[j] !== 7); } // nat null: every solid tile shuts you in
// bug fix: a home point (the lantern tree or a bed) fenced in on every side left you stuck after fainting or recalling;
// if the spot is closed in (no way out within 16 tiles, doors count as a way out), you wake up just outside instead
// (it looks at natural rock only when the spot reads as closed without it, so loading and waking up seldom rebuild the first world)
function closedIn(x, y, lim = 900, far = 16, nat = null) { const sx = Math.floor(x), sy = Math.floor(y); if (!inB(sx, sy) || isSolid(sx, sy)) return null; /* only a free spot can be fenced in */ const seen = new Set([idx(sx, sy)]), st = [[sx, sy]];
  while (st.length) { const [cx, cy] = st.pop(); if (Math.hypot(cx - sx, cy - sy) > far || seen.size > lim) return null;
    for (const [dx, dy] of D4) { const nx = cx + dx, ny = cy + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j) || shutsIn(nx, ny, j, nat)) continue; seen.add(j); st.push([nx, ny]); } }
  return nat ? seen : closedIn(x, y, lim, far, naturalWalls()); }
function safeSpot(x, y) { const inside = closedIn(x, y); if (!inside) return null; const sx = Math.floor(x), sy = Math.floor(y);
  for (let r = 1; r <= 40; r++) { let best = null, bd = 1e9; for (let ty = sy - r; ty <= sy + r; ty++) for (let tx = sx - r; tx <= sx + r; tx++) { if (Math.max(Math.abs(tx - sx), Math.abs(ty - sy)) !== r || !inB(tx, ty) || inside.has(idx(tx, ty)) || isSolid(tx, ty) || boxHits(tx + .5, ty + .6, .28)) continue;
      const d = Math.hypot(tx - sx, ty - sy); if (d < bd && !closedIn(tx + .5, ty + .6)) { bd = d; best = { x: tx + .5, y: ty + .6 }; } }
    if (best) return best; }
  return null; }
// v57 emergency escape (menu): a fenced yard bigger than closedIn's 16 tiles still trapped a player. regionOf flood-fills the
// walkable area (doors count as a way out); it is "closed" when it ends within lim tiles and far tiles of the start.
function regionOf(x, y, lim = 3000, far = 60) { const nat = naturalWalls(); const sx = Math.floor(x), sy = Math.floor(y); if (!inB(sx, sy)) return null; const seen = new Set([idx(sx, sy)]), st = [[sx, sy]];
  while (st.length) { const [cx, cy] = st.pop(); if (Math.abs(cx - sx) > far || Math.abs(cy - sy) > far || seen.size > lim) return null;
    for (const [dx, dy] of D4) { const nx = cx + dx, ny = cy + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j) || shutsIn(nx, ny, j, nat)) continue; seen.add(j); st.push([nx, ny]); } }
  return seen; }
function openSpotNear(x, y, skip) { const sx = Math.floor(x), sy = Math.floor(y), bad = new Set(skip || []); let tries = 0;
  for (let r = 1; r <= 90; r++) { const ring = [];
    for (let ty = sy - r; ty <= sy + r; ty++) for (let tx = sx - r; tx <= sx + r; tx++) { if (Math.max(Math.abs(tx - sx), Math.abs(ty - sy)) !== r || !inB(tx, ty)) continue; const j = idx(tx, ty); if (bad.has(j) || isSolid(tx, ty) || boxHits(tx + .5, ty + .6, .28)) continue; ring.push([Math.hypot(tx - sx, ty - sy), tx, ty]); }
    ring.sort((a, b) => a[0] - b[0]);
    for (const [, tx, ty] of ring) { if (bad.has(idx(tx, ty))) continue; const reg = regionOf(tx + .5, ty + .6); if (!reg) return { x: tx + .5, y: ty + .6 }; for (const j of reg) bad.add(j); if (++tries > 400) return null; } }
  return null; }
function escapeSpot() { const p = G.p, here = regionOf(p.x, p.y);
  if (here) return openSpotNear(p.x, p.y, here); // closed in where you stand: the nearest open place outside it
  const h = homePt(), home = regionOf(h.x, h.y); if (!home && !boxHits(h.x, h.y, .28)) return h; // otherwise home, unless home is the trap
  return openSpotNear(h.x, h.y, home || []); }
function emergencyEscape() { const p = G.p; if (p.dead > 0) return false; if ((G.escCd || 0) > G.time) { toast(`긴급 탈출은 ${Math.ceil(G.escCd - G.time)}초 뒤에 다시 쓸 수 있어요`, 'warn', 'esc'); return false; }
  if (p.sit) standUp(); G.recall = null; G.fish = null; const to = escapeSpot(); if (!to) { toast('빠져나갈 곳을 찾지 못했어요', 'warn', 'esc'); return false; }
  puff(p.x, p.y - .3, '#b99bff', 18, 3, .4); p.x = to.x; p.y = to.y; p.kx = p.ky = 0; cam.x = p.x; cam.y = p.y; G.enemies.length = 0; lightDirty = true; puff(p.x, p.y - .3, '#e3d4ff', 18, 3, .4);
  G.escCd = G.time + 30; toast('긴급 탈출! 트인 곳으로 옮겼어요', 'good', 'esc'); return true; }
function unstick(p, why) { const to = safeSpot(p.x, p.y); if (!to) return false; p.x = to.x; p.y = to.y; cam.x = p.x; cam.y = p.y; lightDirty = true; if (why) setTimeout(() => toast(why, 'warn', 'unstick'), 900); return true; }
function homePt() { const so = G.spawnPt && G.objs.get(idx(G.spawnPt.x, G.spawnPt.y)); if (so && OBJ[so.t].bed) { const fp = fpOf(so), x = G.spawnPt.x + .5, y = G.spawnPt.y + fp[1] + .6; return boxHits(x, y, .28) ? { x: G.spawnPt.x + fp[0] + .5, y: G.spawnPt.y + .5 } : { x, y }; } return { x: CX + .5, y: CY + 1.7 }; }
const nearHome = () => { const h = homePt(); return Math.hypot(G.p.x - h.x, G.p.y - h.y) < 12; };
function recallDecide(s) { const cd = (G.recallCd || 0) - G.time; if (cd > 0) return { k: 'info', lbl: `쉬는 중 ${Math.ceil(cd)}초`, icon: s.id, msg: `귀환석이 쉬고 있어요 · ${Math.ceil(cd)}초 뒤에 다시 쓸 수 있어요` };
  if (G.recall) return { k: 'none', lbl: '돌아가는 중…', icon: s.id };
  if (nearHome()) return G.backPt ? { k: 'recall', lbl: '표지로 돌아가기', icon: s.id, mode: 'back' } : { k: 'info', lbl: '집 근처', icon: s.id, msg: '여기는 집 근처예요. 멀리 나가서 쓰면 집으로 돌아와요' };
  return { k: 'recall', lbl: '집으로', icon: s.id, mode: 'home' }; }
function startRecall(mode) { if (G.recall || (G.recallCd || 0) > G.time) return; G.recall = { t: RECALL_T, mode, x: G.p.x, y: G.p.y }; SFX.seed(); toast(mode === 'home' ? '귀환석이 빛나요… 가만히 있어요' : '표지로 돌아가요… 가만히 있어요', null, 'recall'); }
function recallTick(dt) { const R = G.recall; if (!R) return; const p = G.p;
  if (p.dead > 0 || p.hurt > 0 || Math.hypot(p.x - R.x, p.y - R.y) > .25) { G.recall = null; toast('움직여서 귀환을 멈췄어요', null, 'recallStop'); return; }
  R.t -= dt; if (fxRand() < .5) puff(p.x + (fxRand() - .5) * .8, p.y - .2, '#b99bff', 1, 1.6, .05);
  if (R.t > 0) return; G.recall = null; G.recallCd = G.time + RECALL_CD;
  let to; if (R.mode === 'back' && G.backPt) { to = G.backPt; G.backPt = null; } else { G.backPt = { x: p.x, y: p.y }; to = homePt(); }
  puff(p.x, p.y - .3, '#b99bff', 18, 3, .4); p.x = to.x; p.y = to.y; p.kx = p.ky = 0; if (R.mode !== 'back') unstick(p, '집이 사방으로 막혀 있어서 바로 바깥으로 왔어요'); /* bug fix (v49.1): going back to the marker (a spot you stood on) never moves you out of a closed cave pocket */ cam.x = p.x; cam.y = p.y; G.enemies.length = 0; G.fish = null; lightDirty = true; puff(p.x, p.y - .3, '#e3d4ff', 18, 3, .4); SFX.win();
  toast(R.mode === 'back' ? '표지가 있던 곳으로 돌아왔어요' : '집으로 돌아왔어요 · 집 근처에서 귀환석을 다시 쓰면 떠난 자리로 갈 수 있어요', 'good', 'recall'); }
function dropLost() {
  if ((G.guide || 0) < 6) return 0; // no loss before the copper pickaxe
  const p = G.p, items = []; for (let i = 0; i < G.inv.length; i++) { const s = G.inv[i]; if (!s || bagCat(s.id) !== 'mat' || ITEMS[s.id].kind === 'key') continue; const n = Math.floor(s.c * LOST_SHARE); if (n <= 0) continue; s.c -= n; if (!s.c) G.inv[i] = null; const e = items.find(x => x.id === s.id); if (e) e.c += n; else items.push({ id: s.id, c: n }); }
  if (!items.length) return 0; invDirty = true;
  const bags = []; for (const [i, o] of G.objs) if (o.t === 'lostBag') bags.push([i, o]);
  if (bags.length >= LOST_MAX) { bags.sort((a, b) => (a[1].at || 0) - (b[1].at || 0)); const [oi, oo] = bags[0]; for (const s of oo.items) if (s) { const e = items.find(x => x.id === s.id); if (e) e.c += s.c; else items.push({ ...s }); } G.objs.delete(oi); }
  const px = Math.floor(p.x), py = Math.floor(p.y); let at = -1;
  for (let r = 0; r <= 4 && at < 0; r++) for (let dy = -r; dy <= r && at < 0; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = px + dx, y = py + dy; if (!inB(x, y)) continue; const i = idx(x, y); if (G.wall[i] || G.objs.get(i) || G.floor[i] === WATER || G.floor[i] === LAVA) continue; at = i; break; }
  if (at < 0) { for (const s of items) moveInto(G.inv, s); return 0; }
  G.objs.set(at, { t: 'lostBag', items, at: Date.now() }); mapPixel(at % W, (at / W) | 0); return items.reduce((a, s) => a + s.c, 0);
}
function pickLost(t, o) { const i = idx(t.x, t.y); let got = 0; for (let k = 0; k < o.items.length; k++) { const s = o.items[k]; if (!s) continue; const left = moveInto(G.inv, s); got += s.c - left; if (left) s.c = left; else o.items[k] = null; }
  o.items = o.items.filter(Boolean); invDirty = true; SFX.pick();
  if (!o.items.length) { G.objs.delete(i); lightDirty = true; puff(t.x + .5, t.y + .6, '#ffe9a8', 10, 2, .3); toast(`잃어버린 재료를 모두 되찾았어요 (${got}개)`, 'good', 'lost'); } else toast(`가방이 가득 차서 일부만 되찾았어요 (${got}개)`, null, 'lost'); }
const bossStage = b => b.hp > b.max * 2 / 3 ? 1 : b.hp > b.max / 3 ? 2 : 3;
function phaseCheck(b) { if (!PHASE_BOSS[b.k] || b.hp <= 0) return; b.stage = b.stage || 1; const s = bossStage(b); if (s <= b.stage) return;
  b.stage = s; b.ph = 'roar'; b.t = 1.5; b.inv = 1.5; G.shots.length = 0; shake = Math.max(shake, .5); SFX.boss(); puff(b.x, b.y - .5, BOSSES[b.k].col, 30, 4, .6); puff(b.x, b.y - .5, '#ffe9a8', 12, 3, .8); ftext(b.x, b.y - 2.6, '!!', '#ffd25c');
  G.stats.phaseTip = G.stats.phaseTip || {}; const key = b.k + s; if (!G.stats.phaseTip[key]) { G.stats.phaseTip[key] = 1; toast(PHASE_TIP[b.k][s - 2], 'warn', 'phase'); }
  if (b.k === 'spirit' && s >= 2 && !(b.pillars || []).length) spiritPillars(b); if (b.k === 'spirit' && s === 3) spiritClones(b, 2); }
function bossCleanup(b) { for (const i of b.pillars || []) { const o = G.objs.get(i); if (o && o.t === 'icePillar') G.objs.delete(i); } b.pillars = []; if (G.enemies.some(e => e.k === 'spiritClone')) G.enemies = G.enemies.filter(e => e.k !== 'spiritClone'); lightDirty = true; }
// lava turtle: stage 2 sparks off every wall bounce, stage 3 erupts around you and then opens its shell
function emberBurst(b) { const p = G.p, base = Math.atan2(p.y - b.y, p.x - b.x); for (const da of [-.45, .45]) { const a = base + da + (rand() - .5) * .3; G.shots.push({ x: b.x, y: b.y - .3, vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2, life: 2.4, dmg: 12, k: 'fire' }); } }
function turtleErupt(b) { const p = G.p; G.hz = G.hz || []; for (let k = 0; k < 6; k++) { const a = rand() * 6.283, r = k ? 1.3 + rand() * 2.4 : 0, hx = p.x + Math.cos(a) * r, hy = p.y + Math.sin(a) * r; if (!isSolid(Math.floor(hx), Math.floor(hy))) G.hz.push({ x: hx, y: hy, r: 1.0, t: 0, warn: .9, life: 2.6, dmg: 18, k: 'lava' }); }
  shake = Math.max(shake, .45); SFX.brk(); puff(b.x, b.y - .6, '#ff8a3d', 22, 4, .5); }
function spiritPillars(b) { b.pillars = []; const p = G.p; for (const [dx, dy] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) { const x = SI.x + dx, y = SI.y + dy, i = idx(x, y); if (!inB(x, y) || G.wall[i] || G.objs.get(i) || (Math.floor(p.x) === x && Math.floor(p.y) === y)) continue; G.objs.set(i, { t: 'icePillar', hp: 4 }); b.pillars.push(i); puff(x + .5, y + .5, '#d4f6ff', 10, 2.5, .4); } lightDirty = true; }
function spiritClones(b, n) { for (let k = 0; k < n; k++) { const e = mkEnemy('spiritClone', b.x + (k ? 2 : -2), b.y); e.z = .45; G.enemies.push(e); puff(e.x, e.y - .5, '#d4f6ff', 10, 2.5); } }
function cloneTick(b, dt) { const cl = G.enemies.filter(e => e.k === 'spiritClone'); cl.forEach((e, i) => { const a = (b.anim || 0) * .9 + i * Math.PI + .8, tx = b.x + Math.cos(a) * 2.8, ty = b.y + Math.sin(a) * 1.8, k = Math.min(1, dt * 3); if (!boxHits(e.x + (tx - e.x) * k, e.y + (ty - e.y) * k, .3)) { e.x += (tx - e.x) * k; e.y += (ty - e.y) * k; } e.z = .45; e.anim = b.anim; }); return cl; }
function pillarBlocks(s, tx, ty) { const i = idx(tx, ty), o = G.objs.get(i); if (!o || o.t !== 'icePillar') return false; o.hp = (o.hp || 4) - 1; puff(s.x, s.y, '#d4f6ff', 4, 1.6, .2); if (o.hp <= 0) { G.objs.delete(i); puff(tx + .5, ty + .5, '#e8f8ff', 14, 3, .4); SFX.brk(); lightDirty = true; } return true; }
