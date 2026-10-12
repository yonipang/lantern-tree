// ================= getting around and the cost of fainting =================
// homestone: hold still for 1.5 s to go home (bed, or the lantern tree); it leaves a marker so you can come straight back once
const RECALL_T = 1.5, RECALL_CD = 60;
ITEMS.homeStone = { n: '귀환석', kind: 'recall', stack: 1, d: `들고 누른 뒤 ${RECALL_T}초 동안 가만히 있으면 침대(없으면 등불나무)로 돌아가요. 떠난 자리에 표지가 남아서, 집 근처에서 다시 쓰면 그곳으로 한 번 돌아갈 수 있어요. 한 번 쓰면 1분 쉬어요.` };
ICON.homeStone = A => { A.e(8, 9, 5.4, 5.8, '#4a4290'); A.e(8, 8.6, 4.6, 5, '#6a62b8'); A.e(7, 7, 2.4, 2.6, '#a99cf0'); A.e(8, 9, 2, 2, '#ffd27a'); A.p(8, 8, '#fff1c0'); A.p(5, 5, '#e3d4ff'); A.p(11, 12, '#3a3270'); };
RECIPES.push(Rc('homeStone', 1, [['crystal', 6], ['glowcap', 3], ['copperBar', 2]], 'forge', 'tool'));
{ const g = GUIDE.find(q => q.id === 'cpick'); if (g) g.rw = g.rw.concat([['homeStone', 1]]); }
// bug fix: a home point (the lantern tree or a bed) fenced in on every side left you stuck after fainting or recalling;
// if the spot is closed in (no way out within 16 tiles, doors count as a way out), you wake up just outside instead
function closedIn(x, y, lim = 900, far = 16) { const sx = Math.floor(x), sy = Math.floor(y); if (!inB(sx, sy) || isSolid(sx, sy)) return null; /* only a free spot can be fenced in */ const seen = new Set([idx(sx, sy)]), st = [[sx, sy]];
  while (st.length) { const [cx, cy] = st.pop(); if (Math.hypot(cx - sx, cy - sy) > far || seen.size > lim) return null;
    for (const [dx, dy] of D4) { const nx = cx + dx, ny = cy + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j)) continue; const o = G.objs.get(j), a = o && (o.t === '_part' ? G.objs.get(o.a) : o);
      if (isSolid(nx, ny) && !(a && OBJ[a.t] && OBJ[a.t].door)) continue; seen.add(j); st.push([nx, ny]); } }
  return seen; }
function safeSpot(x, y) { const inside = closedIn(x, y); if (!inside) return null; const sx = Math.floor(x), sy = Math.floor(y);
  for (let r = 1; r <= 40; r++) { let best = null, bd = 1e9; for (let ty = sy - r; ty <= sy + r; ty++) for (let tx = sx - r; tx <= sx + r; tx++) { if (Math.max(Math.abs(tx - sx), Math.abs(ty - sy)) !== r || !inB(tx, ty) || inside.has(idx(tx, ty)) || isSolid(tx, ty) || boxHits(tx + .5, ty + .6, .28)) continue;
      const d = Math.hypot(tx - sx, ty - sy); if (d < bd && !closedIn(tx + .5, ty + .6)) { bd = d; best = { x: tx + .5, y: ty + .6 }; } }
    if (best) return best; }
  return null; }
// v57 emergency escape (menu): a fenced yard bigger than closedIn's 16 tiles still trapped a player. regionOf flood-fills the
// walkable area (doors count as a way out); it is "closed" when it ends within lim tiles and far tiles of the start.
function regionOf(x, y, lim = 3000, far = 60) { const sx = Math.floor(x), sy = Math.floor(y); if (!inB(sx, sy)) return null; const seen = new Set([idx(sx, sy)]), st = [[sx, sy]];
  while (st.length) { const [cx, cy] = st.pop(); if (Math.abs(cx - sx) > far || Math.abs(cy - sy) > far || seen.size > lim) return null;
    for (const [dx, dy] of D4) { const nx = cx + dx, ny = cy + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j)) continue; const o = G.objs.get(j), a = o && (o.t === '_part' ? G.objs.get(o.a) : o);
      if (isSolid(nx, ny) && !(a && OBJ[a.t] && OBJ[a.t].door)) continue; seen.add(j); st.push([nx, ny]); } }
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
  R.t -= dt; if (Math.random() < .5) puff(p.x + (Math.random() - .5) * .8, p.y - .2, '#b99bff', 1, 1.6, .05);
  if (R.t > 0) return; G.recall = null; G.recallCd = G.time + RECALL_CD;
  let to; if (R.mode === 'back' && G.backPt) { to = G.backPt; G.backPt = null; } else { G.backPt = { x: p.x, y: p.y }; to = homePt(); }
  puff(p.x, p.y - .3, '#b99bff', 18, 3, .4); p.x = to.x; p.y = to.y; p.kx = p.ky = 0; if (R.mode !== 'back') unstick(p, '집이 사방으로 막혀 있어서 바로 바깥으로 왔어요'); /* bug fix (v49.1): going back to the marker (a spot you stood on) never moves you out of a closed cave pocket */ cam.x = p.x; cam.y = p.y; G.enemies.length = 0; G.fish = null; lightDirty = true; puff(p.x, p.y - .3, '#e3d4ff', 18, 3, .4); SFX.win();
  toast(R.mode === 'back' ? '표지가 있던 곳으로 돌아왔어요' : '집으로 돌아왔어요 · 집 근처에서 귀환석을 다시 쓰면 떠난 자리로 갈 수 있어요', 'good', 'recall'); }
// fainting drops a quarter of each material stack in a bundle where you fell; walk back to pick it up (not during the first steps of the story)
const LOST_SHARE = .25, LOST_MAX = 5;
OBJ.lostBag = { n: '잃어버린 꾸러미', lost: 1, light: [2, '#ffe9a8'] };
OSPR.lostBag = [16, 16, A => { A.e(8, 13.5, 5, 1.4, 'rgba(0,0,0,.25)'); A.e(8, 10, 5, 4, '#b8903f'); A.e(7, 9, 3.4, 2.6, '#d9b66a'); A.poly([[5, 7], [6, 3.5], [10, 3.5], [11, 7]], '#c9a46b'); A.r(5, 6, 6, 1, '#7a5a2a'); A.p(12, 3, '#fff1b0'); A.p(13, 2, '#ffffff'); A.p(3, 5, '#fff1b0'); }];
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
TIPS.push('귀환석을 쓰면 집으로 돌아오고, 집 근처에서 다시 쓰면 떠난 자리로 돌아가요.', '쓰러지면 재료 일부를 그 자리에 떨어뜨려요. 지도에 꾸러미가 표시돼요.');
