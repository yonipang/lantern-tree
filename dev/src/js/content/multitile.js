// ---- multi-tile objects (2×1, 2×2, 3×2 …): the top-left tile holds the object, the other tiles hold {t:'_part', a: anchor} ----
OBJ._part = { n: '', part: 1 };
const fpOf = o => { const d = OBJ[o.t]; if (!d || !d.sz) return [1, 1]; return o.rot && d.rotV ? [d.sz[1], d.sz[0]] : d.sz; };
function fpTiles(i, o, fp) { fp = fp || fpOf(o); const x = i % W, y = (i / W) | 0, out = []; for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) out.push(idx(x + dx, y + dy)); return out; }
function setParts(i, o) { for (const j of fpTiles(i, o)) if (j !== i) G.objs.set(j, { t: '_part', a: i }); }
function clearParts(i, o) { for (const j of fpTiles(i, o)) { if (j === i) continue; const q = G.objs.get(j); if (q && q.t === '_part' && q.a === i) G.objs.delete(j); } }
function delObj(i) { const o = G.objs.get(i); if (o && OBJ[o.t] && OBJ[o.t].sz) clearParts(i, o); G.objs.delete(i); }
function anchorAt(i) { const o = G.objs.get(i); if (o && o.t === '_part') { const a = G.objs.get(o.a); return a && a.t !== '_part' ? o.a : -1; } return o ? i : -1; }
function fpFree(x, y, fp, solid, own) { for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) { const tx = x + dx, ty = y + dy; if (!inB(tx, ty)) return false; const j = idx(tx, ty); if (G.wall[j] || G.floor[j] === WATER || G.floor[j] === LAVA) return false; const q = G.objs.get(j); if (q && !(own != null && (j === own || (q.t === '_part' && q.a === own)))) return false; if (solid && occupied(tx, ty)) return false; } return true; }
function placeAnchor(t, fp) { const f = G.p.face; let x = t.x, y = t.y; if (Math.abs(f.x) >= Math.abs(f.y)) { if (f.x < 0) x -= fp[0] - 1; y -= Math.floor((fp[1] - 1) / 2); } else { if (f.y < 0) y -= fp[1] - 1; x -= Math.floor((fp[0] - 1) / 2); } return { x, y }; }
let placeRot = 0, placeRotFor = null;
const pRot = () => { const s0 = G && selItem(); return s0 && s0.id === placeRotFor ? placeRot : 0; };
const DIRN = ['아래', '오른쪽', '위', '왼쪽'];
const canRotObj = t => { const d = OBJ[t]; return !!(d && d.item && !d.tw && !d.dev && !d.src && !d.sw && !d.chest && !(d.sz && !d.rotV && d.sz[0] === d.sz[1])); };
const placeFp = d => d.sz ? (pRot() % 2 && d.rotV ? [d.sz[1], d.sz[0]] : d.sz) : [1, 1];
function rotateObjAt(i) { const o = G.objs.get(i); if (!o || !canRotObj(o.t)) return false; const d = OBJ[o.t];
  if (d.sz && d.rotV) { const nf = o.rot ? d.sz : [d.sz[1], d.sz[0]], x = i % W, y = (i / W) | 0; if (!fpFree(x, y, nf, !!d.solid, i)) { toast('돌릴 자리가 부족해요', null, 'norot'); return false; } clearParts(i, o); o.rot = o.rot ? 0 : 1; setParts(i, o); }
  else if (d.dir4) o.dir = ((o.dir || 0) + 1) % 4;
  else o.flip = !o.flip;
  SFX.place(); puff((i % W) + .5, ((i / W) | 0) + .6, '#e8d8c0', 4, 1.4); lightDirty = true; return true; }
function rotateAction() {
  if (!started || paused || !G || G.p.dead > 0) return; const s = selItem(), it = s && ITEMS[s.id];
  if (it && it.kind === 'place' && canRotObj(it.obj)) { const d = OBJ[it.obj]; if (placeRotFor !== s.id) { placeRotFor = s.id; placeRot = 0; } placeRot = d.dir4 ? (placeRot + 1) % 4 : (placeRot % 2 ? 0 : 1);
    toast(d.sz && d.rotV ? (placeRot % 2 ? '세로로 놓아요' : '가로로 놓아요') : d.dir4 ? `${josa(DIRN[placeRot], '을', '를')} 보게 놓아요` : (placeRot % 2 ? '반대 방향으로 놓아요' : '원래 방향으로 놓아요'), null, 'prot'); SFX.click(); return; }
  const a = G.act; if (a && a.o && a.t && inB(a.t.x, a.t.y)) { const ai = anchorAt(idx(a.t.x, a.t.y)); if (ai >= 0 && canRotObj(G.objs.get(ai).t)) { rotateObjAt(ai); return; } }
  toast('돌릴 수 있는 가구를 들거나 바라봐 주세요', null, 'norot2'); }
const rotTarget = () => { if (!G) return false; const s = selItem(), it = s && ITEMS[s.id]; if (it && it.kind === 'place' && canRotObj(it.obj)) return true; const a = G.act; return !!(a && a.o && a.t && inB(a.t.x, a.t.y) && anchorAt(idx(a.t.x, a.t.y)) >= 0 && canRotObj((G.objs.get(anchorAt(idx(a.t.x, a.t.y))) || {}).t)); };
function rot90(c) { const k = document.createElement('canvas'); k.width = c.height; k.height = c.width; k.hd = c.hd; const g = k.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(k.width, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return k; }
// ---- tree workshop: a 2×2 plot of saplings; chop when grown, or power it to chop by itself into a chest next to it ----
const FARM_GROW = 90, FARM_CAP = 60;
const growOf = o => (OBJ[o.t] && OBJ[o.t].grow) || FARM_GROW;
const farmStage = o => Math.max(0, Math.min(3, Math.floor((G.time - (o.p || 0)) / growOf(o) * 3)));
const farmLbl = o => (o.store || []).length ? '꺼내기' : farmStage(o) >= 3 ? farmT(o)[0] : '살펴보기';
const FARM_TXT = { treeFarm: ['베기', '나무를 베었어요! 묘목이 다시 자라요', '나무가 자라는 중이에요', '#7fbf6a', 'wood'], quarry: ['캐기', '돌을 캤어요! 바위가 다시 차올라요', '바위가 차오르는 중이에요', '#a29db6', 'stone'],
  pitCu: ['캐기', '구리광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', C.copper, 'copperOre'], pitFe: ['캐기', '철광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', C.iron, 'ironOre'], pitGold: ['캐기', '금광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', '#ffd25c', 'goldOre'] };
const PIT_Y = { quarry: ['stone', 5, 7], pitCu: ['copperOre', 3, 4], pitFe: ['ironOre', 3, 4], pitGold: ['goldOre', 2, 3] }; // v46: each pit gives one material only
function pitStat(o, n) { G.stats.quarried = (G.stats.quarried || 0) + n; if (o.t !== 'quarry') G.stats.drilled = (G.stats.drilled || 0) + n; }
const farmT = o => FARM_TXT[o.t] || FARM_TXT.treeFarm;
function farmYield(o) { const py = o && PIT_Y[o.t]; if (py) return [[py[0], py[1] + (Math.random() * (py[2] - py[1] + 1) | 0)]]; // v46: the stone pit gives only stone
  const out = [['wood', 5 + (Math.random() * 3 | 0)]]; if (Math.random() < .35) out.push(['resin', 1]); if (Math.random() < .12) out.push(['sapling', 1]); if (Math.random() < .5) out.push(['fiber', 1 + (Math.random() * 2 | 0)]); return out; }
function farmHarvest(i, o, auto) { const x = i % W, y = (i / W) | 0;
  if (!auto) { const got = farmYield(o); o.p = G.time; if (PIT_Y[o.t]) pitStat(o, got[0][1]); else G.stats.farmed = (G.stats.farmed || 0) + got[0][1]; for (const [id, c] of got) spawnDrop(id, c, x + 1, y + 1.2); SFX.brk(); puff(x + 1, y + 1, farmT(o)[3], 10, 2.5); gainXp(2); return true; }
  const chests = []; for (const j of fpTiles(i, o)) { const jx = j % W, jy = (j / W) | 0; for (const [dx, dy] of D4) { if (!inB(jx + dx, jy + dy)) continue; const c = G.objs.get(idx(jx + dx, jy + dy)); if (c && c.t === 'chest' && c.items && !chests.includes(c)) chests.push(c); } }
  const stN = (o.store || []).reduce((a, s2) => a + s2.c, 0); if (stN >= FARM_CAP && !chests.some(c => c.items.some(z => !z))) { o.why = 'full'; return false; }
  const got = farmYield(o); o.p = G.time; o.why = ''; if (PIT_Y[o.t]) pitStat(o, got[0][1]); else G.stats.farmed = (G.stats.farmed || 0) + got[0][1];
  for (const [id, c] of got) { let left = c; for (const ch of chests) { if (!left) break; left = moveInto(ch.items, { id, c: left }); } if (left) { o.store = o.store || []; const n = o.store.reduce((a, s2) => a + s2.c, 0), add = Math.min(left, FARM_CAP - n); if (add > 0) { const s2 = o.store.find(z => z.id === id); if (s2) s2.c += add; else o.store.push({ id, c: add }); } } }
  if (Math.hypot(x + 1 - G.p.x, y + 1 - G.p.y) < 14) { puff(x + 1, y + 1, farmT(o)[3], 8, 2); SFX.brk(); } return true; }
const farmTree = (A, x, yb, st) => { const s = [0.55, 1.1, 1.65, 2.2][st]; if (st === 0) { A.e(x, yb, 3, 1.2, '#4a3428'); A.line(x, yb, x, yb - 5, C.woodD); A.e(x - 2, yb - 4.5, 2.2, 1.4, C.leaf); A.e(x + 2, yb - 5.5, 2.2, 1.4, C.leafL); A.e(x, yb - 6.5, 1.6, 1.2, '#9be37a'); A.p(x - 2, yb - 5, '#c8f58a'); return; }
  A.r(x - 1, Math.round(yb - 4 * s), 2, Math.round(4 * s), C.wood); A.r(x - 1, Math.round(yb - 4 * s), 1, Math.round(4 * s), C.woodL); A.e(x, yb - 4 * s - 2.4 * s, 2.8 * s + 1, 2.4 * s + 1, C.leafD); A.e(x - .6, yb - 4 * s - 2.8 * s, 2.1 * s + .6, 1.8 * s + .6, C.leaf); A.p(Math.round(x - 1.5 * s), Math.round(yb - 4 * s - 3.8 * s), C.leafL); if (st === 3) { A.p(Math.round(x + s), Math.round(yb - 5.5 * s), '#ffd36b'); } };
const quarryRock = (A, x, yb, st, oc, ol) => { const s = [.45, .75, 1, 1.25][st]; A.e(x, yb - 3 * s, 6 * s + 1, 4 * s + 1, '#625d78'); A.e(x - .5, yb - 3.6 * s, 5.4 * s + .6, 3.4 * s + .6, '#8e89a3'); A.e(x - 2 * s, yb - 5 * s, 2.4 * s, 1.4 * s, '#b9b4cc'); A.p(Math.round(x + 2 * s), Math.round(yb - 2 * s), '#625d78'); if (st === 3) { A.p(Math.round(x - 3), Math.round(yb - 6), '#ffffff'); A.p(Math.round(x + 3), Math.round(yb - 5), '#e3d4ff'); }
  if (oc && st) for (const [dx, dy] of [[-2, -3], [2, -4], [0, -1.6], [3, -1.4]].slice(0, st + 1)) { A.e(x + dx * s, yb + dy * s, 1.1 * s + .4, .9 * s + .4, oc); A.p(Math.round(x + dx * s - .5), Math.round(yb + dy * s - .5), ol); } };
const quarrySpr = (st, oc, ol) => [32, 40, A => { A.r(1, 10, 30, 29, '#5a5468'); for (let k = 0; k < 14; k++) { const R = rng(4100 + k); A.p(2 + R() * 28 | 0, 11 + R() * 27 | 0, k % 2 ? '#6f6a86' : '#46405a'); }
  A.r(0, 9, 32, 2, C.woodD); A.r(0, 37, 32, 2, C.woodD); A.r(0, 9, 2, 30, C.woodD); A.r(30, 9, 2, 30, C.woodD); for (const x of [0, 10, 20, 30]) { A.r(x, 7, 2, 4, C.wood); A.r(x, 36, 2, 4, C.wood); }
  quarryRock(A, 10, 25, st, oc, ol); quarryRock(A, 22, 24, st, oc, ol); quarryRock(A, 16, 36, st, oc, ol); A.line(25, 34, 29, 28, C.woodD); A.line(27, 27, 30, 30, C.stoneL); A.p(26, 28, C.stoneL); }];
const farmSpr = st => [32, 40, A => { A.r(1, 10, 30, 29, '#6b4838'); for (let y = 13; y < 38; y += 5) A.r(2, y, 28, 1, '#5a3a2c'); for (let k = 0; k < 8; k++) A.p(3 + k * 3.5 | 0, 37 - (k % 3) * 9, '#62ad62');
  A.r(0, 9, 32, 2, C.woodD); A.r(0, 37, 32, 2, C.woodD); A.r(0, 9, 2, 30, C.woodD); A.r(30, 9, 2, 30, C.woodD); for (const x of [0, 10, 20, 30]) { A.r(x, 7, 2, 4, C.wood); A.r(x, 36, 2, 4, C.wood); } A.r(0, 9, 32, 1, C.woodL);
  farmTree(A, 9, 23, st); farmTree(A, 23, 23, st); farmTree(A, 16, 35, st); }];

