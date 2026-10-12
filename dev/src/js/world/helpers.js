// ================= world helpers =================
const inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
function isSolid(tx, ty) { if (!inB(tx, ty)) return true; const i = idx(tx, ty); if (G.wall[i] || G.floor[i] === WATER || G.floor[i] === LAVA) return true; let o = G.objs.get(i); if (o && o.t === '_part') o = G.objs.get(o.a); return !!(o && OBJ[o.t] && OBJ[o.t].solid && !(OBJ[o.t].door && o.open)); }
function boxHits(x, y, r) { for (let ty = Math.floor(y - r); ty <= Math.floor(y + r * 0.7); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) if (isSolid(tx, ty)) return true; return false; }
function moveEnt(e, dx, dy, r) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.15)); let bx = false, by = false;
  for (let k = 0; k < n; k++) {
    if (!bx) { const nx = e.x + dx / n; if (!boxHits(nx, e.y, r)) e.x = nx; else bx = true; }
    if (!by) { const ny = e.y + dy / n; if (!boxHits(e.x, ny, r)) e.y = ny; else by = true; }
  }
  return bx || by;
}
function occupied(tx, ty) {
  const p = G.p, r = 0.28; if (p.x + r > tx && p.x - r < tx + 1 && p.y + r * .7 > ty && p.y - r < ty + 1) return true;
  for (const e of G.enemies) if (Math.floor(e.x) === tx && Math.floor(e.y) === ty) return true; return false;
}
// ---- terrain: ground you can dig with a shovel and lay elsewhere, unlocked one by one ----
const FLOOR_ITEM = { 5: 'floorWood', 6: 'floorStone', 7: 'floorMoss', 8: 'floorShroom', 9: 'floorCrystal' };
for (const f in NFLOOR) FLOOR_ITEM[f] = NFLOOR[f][0];
FLOOR_ITEM[21] = 'meadow';
const isPlacedFloor = f => !!FLOOR_ITEM[f];
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 ? a : b); };
// how: shown while locked · when: unlock condition (checked often, so it also works for old saves)
const TERRAIN = {
  2: { n: '흙', item: 'gDirt', base: true },
  1: { n: '이끼', item: 'gMoss', how: '퀘스트 「구리 곡괭이 만들기」를 마치면 배워요', when: () => G.guide > 5 },
  10: { n: '물', item: 'gWater', how: '물고기를 10마리 낚으면 배워요', when: () => (G.stats.fishCaught || 0) >= 10 },
  3: { n: '버섯흙', item: 'gShroom', how: '버섯 여왕을 물리치면 배워요', when: () => beat('queen') },
  4: { n: '수정바닥', item: 'gCrystal', how: '수정골렘을 물리치면 배워요', when: () => beat('golem') },
};
const terrainOk = f => !!(TERRAIN[f] && (TERRAIN[f].base || (G.terrain && G.terrain[f])));
function checkUnlocks() {
  if (!G.terrain) G.terrain = {};
  for (const f in TERRAIN) { const T = TERRAIN[f]; if (T.base || G.terrain[f] || !T.when()) continue; G.terrain[f] = 1;
    if (started) { toast(`새 지형을 배웠어요: ${T.n}! 삽을 들고 떠서 다른 곳에 옮길 수 있어요${hasItem('shovel') ? '' : ' (삽은 장비제작대에서 만들어요)'}`, 'good', 'terrain' + f); SFX.craft(); } }
  if (started && !G.stats.starTip && beat('golem')) { G.stats.starTip = 1; setTimeout(() => toast('이제 맞는 흙에 심은 작물이 가끔 별 작물로 자라요 (베리=이끼, 버섯·빛버섯=버섯흙, 수정 콩=수정 모래)', 'good', 'startip'), 1500); }
}
function shovelDesc() {
  const ks = Object.keys(TERRAIN).map(Number), ok = ks.filter(terrainOk).map(f => TERRAIN[f].n), no = ks.filter(f => !terrainOk(f));
  return `단축칸에서 삽을 들고 바닥을 바라보며 누르면 깔아 둔 바닥을 걷고, 땅을 누르면 배운 지형을 떠서 옮길 수 있어요. 배운 지형: ${ok.join(' · ')}${no.length ? ' / 아직: ' + no.map(f => `${TERRAIN[f].n}(${TERRAIN[f].how.replace(/ ?배워요$/, '')})`).join(', ') : ''}`;
}
function digGround(t) {
  const i = idx(t.x, t.y), f = G.floor[i]; if (G.wall[i] || G.objs.get(i)) return;
  if (isPlacedFloor(f)) { G.floor[i] = G.under.has(i) ? G.under.get(i) : 2; G.under.delete(i); const l = addItem(FLOOR_ITEM[f], 1, false); if (l) spawnDrop(FLOOR_ITEM[f], 1, t.x + .5, t.y + .5); SFX.pick(); puff(t.x + .5, t.y + .7, '#e8d8c0', 6, 2); }
  else { if (f === 2 || !terrainOk(f)) return; const id = TERRAIN[f].item; G.floor[i] = 2; const l = addItem(id, 1, false); if (l) spawnDrop(id, 1, t.x + .5, t.y + .5);
    SFX.pick(); puff(t.x + .5, t.y + .7, f === WATER ? '#8fd0ff' : f === 1 ? '#7fd06a' : f === 3 ? '#c49ae0' : '#b9a8ff', 7, 2.2); G.stats.dug = (G.stats.dug || 0) + 1; }
  mapPixel(t.x, t.y); invDirty = true; const sv = selItem(); if (sv && sv.id === 'shovel') wear(sv);
}
function canPlace(tx, ty, it) {
  if (it.kind === 'place' && OBJ[it.obj] && OBJ[it.obj].sz) { const d = OBJ[it.obj], fp = placeFp(d), a = placeAnchor({ x: tx, y: ty }, fp); return fpFree(a.x, a.y, fp, !!d.solid); }
  if (!inB(tx, ty)) return false; const i = idx(tx, ty); if (G.wall[i]) return false; const o = G.objs.get(i);
  if (it.kind === 'wire') return !G.wire.has(i) && G.floor[i] !== WATER && G.floor[i] !== LAVA && (!o || !OBJ[o.t].tree);
  if (it.kind === 'floor') return G.floor[i] !== it.floor && (!o || !OBJ[o.t].tree);
  if (it.kind === 'ground') return !o && G.floor[i] !== it.ground && !isPlacedFloor(G.floor[i]) && !(it.ground === WATER && (occupied(tx, ty) || (tx === Math.floor(G.p.x) && ty === Math.floor(G.p.y))));
  if (o) return false;
  if ((G.floor[i] === WATER || G.floor[i] === LAVA) && it.kind !== 'wall') return false;
  if (it.kind === 'seed') return it.crop === 'cropMoss' ? G.floor[i] === 21 : [1, 2, 3, 4, 21].includes(G.floor[i]);
  if (it.kind === 'wall') return !occupied(tx, ty);
  if (it.kind === 'place') { const d = OBJ[it.obj]; return !(d.solid && occupied(tx, ty)); }
  return false;
}

