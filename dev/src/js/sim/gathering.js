// ================= 모으기: 벽 캐기·나무 베기·수확, 쳐서 회수(공격 버튼으로 가구 떼기) =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
function breakWall(tx, ty) { const i = idx(tx, ty), w = G.wall[i], def = WALLS[w]; G.wall[i] = 0; G.wdmg.delete(i); rollDrops(def.drop, tx + .5, ty + .5); emit('puff', tx + .5, ty + .6, WPAL[w][0], 10, 3); emit('sfx', 'brk'); lightDirty = true; emit('tile', tx, ty); gainXp(w >= 9 && w <= 12 ? (w === 10 || w === 12 ? 6 : 3) : w === 3 || w === 4 || w === 5 ? 3 : w === 2 ? 1 : 0); }
function mineWall(t) {
  const p = G.p, i = idx(t.x, t.y), w = G.wall[i], def = WALLS[w], pk = bestPick();
  faceTo(t.x + .5 - p.x, t.y + .5 - p.y);
  G.swing = { t: 0.2, max: 0.2, ang: Math.atan2(p.face.y, p.face.x), icon: pk.id === 'hand' ? null : pk.id };
  if (def.tier > pk.tier) { emit('sfx', 'clink'); emit('puff', t.x + .5, t.y + .9, '#ffffff', 3, 1.5); emit('toast', `${def.n}은(는) ${TIERNAME[def.tier] || '더 좋은 곡괭이'}가 필요해요`, null, 'tier' + w); return; }
  const dm = (G.wdmg.get(i) || 0) + pk.power * mineMul(); wear(pk.slot); emit('sfx', 'mine'); emit('puff', t.x + .5, t.y + .95, WPAL[w][1], 4, 2, 0.2); emit('shake', 0.06);
  if (dm >= def.hp) {
    breakWall(t.x, t.y);
  } else G.wdmg.set(i, dm);
}
function hitObj(t, o) {
  const d = OBJ[o.t], tl = natTool(d), i = idx(t.x, t.y), tier = tl ? ITEMS[tl.id].tier || 0 : 0; // v65: an axe (or else a pickaxe) from the tool pouch
  faceTo(t.x + .5 - G.p.x, t.y + .5 - G.p.y);
  G.swing = { t: 0.2, max: 0.2, ang: Math.atan2(G.p.face.y, G.p.face.x), icon: d.nat === 'pick' || !tl ? null : tl.id };
  if ((d.tier || 0) > tier) { emit('sfx', 'clink'); emit('toast', `${d.n}은(는) ${TIERNAME[d.tier]}가 필요해요`, null, 'otier'); return; }
  o.dmg = (o.dmg || 0) + (d.nat === 'pick' ? 9 : Math.max(1, tl ? toolPow(tl) : 0.5) * mineMul()); if (d.nat !== 'pick' && tl) wear(tl);
  emit('sfx', 'mine'); emit('puff', t.x + .5, t.y + .7, o.t === 'cluster' ? C.cry : o.t === 'bigShroom' ? '#e07b5f' : '#7fbf6a', 4, 2);
  const yg = isYoung(o);
  if (o.dmg >= (yg ? Math.max(1, Math.ceil(d.hp / 2)) : d.hp)) { delObj(i); const fpc = d.sz ? fpOf(o) : [1, 1]; rollDrops(yg ? youngDrops(d.drops) : d.drops, t.x + fpc[0] / 2, t.y + fpc[1] / 2); if (d.dropFn) d.dropFn(t.x + fpc[0] / 2, t.y + fpc[1] / 2); if ((d.nat === 'cut' && !d.ntree) || d.nat === 'pick') maybeNote('gather', t.x + .5, t.y + .5); afterCut(t, o); emit('sfx', 'brk'); lightDirty = true; gainXp(o.t === 'cluster' ? 3 : o.t === 'root' || o.t === 'bigShroom' || d.ntree ? 1 : 0); } else o.shake = 0.15;
}
function harvest(t, o) {
  const d = OBJ[o.t];
  const sk = hasItem('sickle'); // a copper sickle in the bag gives one more of the main crop
  if (d.crop) { const i = idx(t.x, t.y); if (o.star == null) rollStar(i, o); G.objs.delete(i); // a star crop gives its main harvest as star items
    rollDrops(d.yield.map(([id, a, b, ch], k) => [!k && o.star && STAR_OF[id] ? STAR_OF[id] : id, a + (sk && !k ? 1 : 0), b + (sk && !k ? 1 : 0), id === 'glowcap' && o.f === 2 ? .6 : ch]), t.x + .5, t.y + .5);
    const S = G.stats; S.cropH = (S.cropH || 0) + 1; if (o.star) { S.starH = (S.starH || 0) + 1; emit('ftext', t.x + .5, t.y - .3, '★ 별 작물!', '#ffe9a8'); } if (o.t === 'cropBerry') S.berryH = (S.berryH || 0) + 1; if (o.w) S.wetH = (S.wetH || 0) + 1; }
  else { o.r = G.time + 150; rollDrops([['berry', 2 + (sk ? 1 : 0), 3 + (sk ? 1 : 0), 1], ['berrySeed', 1, 1, 0.3]], t.x + .5, t.y + .6); }
  emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .5, '#9be37a', 6, 2); gainXp(2); maybeNote('gather', t.x + .5, t.y + .5);
}
const HITS = new Map();
function recoverTarget() { const t = targetTile(); if (!inB(t.x, t.y)) return null; let i = idx(t.x, t.y); const w = G.wall[i];
  if (w === 6 || w === 7) return { t, i, wall: w }; // the wood and brick walls players build (natural walls only by pickaxe)
  let o = G.objs.get(i); if (o && o.t === '_part') { const ai = anchorAt(i); if (ai < 0) return null; i = ai; o = G.objs.get(ai); }
  const d = o && OBJ[o.t]; if (!d || !d.item || d.nat || d.crop || d.lost || d.tree || d.shrine || d.tchest || d.ranch || d.bush || d.growTo) return null;
  return { t: { x: i % W, y: (i / W) | 0 }, i, o, full: !!(d.chest && o.items && o.items.some(x => x)) }; }
function hitRecover(tg, w) { const p = G.p, t = tg.t; faceTo(t.x + .5 - p.x, t.y + .5 - p.y);
  G.swing = { t: .22, max: .22, ang: Math.atan2(p.face.y, p.face.x), icon: w.id === 'hand' ? null : w.id, wt: w.wt, arc: 1.2, rad: .95 }; emit('sfx', 'swing');
  if (tg.full) { emit('sfx', 'clink'); emit('toast', '물건이 든 상자는 비워야 떨어져요', null, 'fullchest'); return; }
  const h = HITS.get(tg.i), n = h && G.time - h.t < RECOVER_GAP ? h.n + 1 : 1; HITS.set(tg.i, { n, t: G.time, x: t.x, y: t.y });
  emit('sfx', 'mine'); emit('puff', t.x + .5, t.y + .7, '#e8d8c0', 4, 1.6); if (tg.o) tg.o.shake = .15; emit('shake', .04);
  if (n >= RECOVER_HITS) { HITS.delete(tg.i); if (tg.wall) breakWall(t.x, t.y); else dropObj(t, tg.o); } }
function dropObj(t, o) { const i = idx(t.x, t.y), d = OBJ[o.t], fp = d.sz ? fpOf(o) : [1, 1], x = t.x + fp[0] / 2, y = t.y + fp[1] / 2 + .3;
  delObj(i); if (d.bed && G.spawnPt && G.spawnPt.x === t.x && G.spawnPt.y === t.y) G.spawnPt = null;
  if (o.job) cancelJob(o, x, y); if (o.store) for (const s2 of o.store) spawnDrop(s2.id, s2.c, x, y);
  const it = TIER_IT[o.t] && o.lv ? TIER_IT[o.t][o.lv] : d.item; spawnDrop(it, 1, x, y);
  if (DUR[d.item]) G.drops[G.drops.length - 1].dur = Math.round(o.e != null ? o.e : DUR[d.item][0]);
  emit('sfx', 'brk'); emit('puff', x, y, '#e8d8c0', 10, 2.4); lightDirty = true; emit('tile', t.x, t.y); invDirty = true; }
