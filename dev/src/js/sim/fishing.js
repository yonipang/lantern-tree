// ================= 낚시: 던지기·입질·거두기, 낚시 표·병 편지 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
function startFish(t) { const p = G.p; faceTo(t.x + .5 - p.x, t.y + .5 - p.y); G.fish = { tx: t.x, ty: t.y, bx: t.x + .5 + (fxRand() - .5) * .3, by: t.y + .55, st: 'wait', t: 1.6 + rand() * 3.4, bite: 0, win: .95, fly: 0.3, nib: 0 }; emit('sfx', 'cast'); }
onFrame('fish', dt => updateFish(dt));
function updateFish(dt) {
  if (G.fishFx) { G.fishFx.t += dt; if (G.fishFx.t > 0.55) G.fishFx = null; }
  const f = G.fish; if (!f) return; const p = G.p;
  if (p.moving || p.dead > 0 || p.sit || p.sleep || !usableItem('rod')) { G.fish = null; return; }
  if (f.fly > 0) { f.fly -= dt; if (f.fly <= 0) { emit('sfx', 'plop'); emit('splash', f.bx, f.by, 5); } return; }
  f.nib = Math.max(0, f.nib - dt);
  if (f.st === 'wait') { f.t -= dt; if (f.t > 0.7 && f.nib <= 0 && rand() < dt * 0.7) { f.nib = 0.22; emit('sfx', 'plop'); }
    if (f.t <= 0) { f.st = 'bite'; f.bite = f.win; emit('sfx', 'bite'); emit('splash', f.bx, f.by, 8); emit('ftext', p.x, p.y - 1.7, '!', '#ffc861'); try { navigator.vibrate && navigator.vibrate(40); } catch (e) { } } }
  else { f.bite -= dt; if (f.bite <= 0) { emit('toast', '놓쳤어요… 다시 던져 봐요', null, 'miss'); G.fish = null; } }
}
function reel() {
  const f = G.fish; if (!f) return; G.fish = null;
  if (f.st !== 'bite') { emit('sfx', 'place'); return; }
  const tbl = catchTable(G.biome[idx(f.tx, f.ty)]); let r = rand() * tbl.reduce((a, x) => a + x[1], 0), id = tbl[0][0];
  for (const [k, w] of tbl) { r -= w; if (r <= 0) { id = k; break; } }
  if (id === 'bottle') fishBottle(); else { const left = addItem(id, 1); if (left) spawnDrop(id, 1, G.p.x, G.p.y); } maybeNote('fish', G.p.x, G.p.y);
  G.fishFx = { id, t: 0, x0: f.bx, y0: f.by, x1: G.p.x, y1: G.p.y - .5 }; emit('splash', f.bx, f.by, 12); emit('sfx', 'catch');
  const seen = G.stats.fishSeen || (G.stats.fishSeen = {});
  if (id === 'bottle') { } else if (!seen[id]) { seen[id] = 1; emit('toast', `처음 낚았어요: ${ITEMS[id].n}!`, 'good'); } else emit('ftext', G.p.x, G.p.y - 1.5, ITEMS[id].n, '#bfe6ff');
  G.stats.fishCaught = (G.stats.fishCaught || 0) + 1; gainXp(id === 'koi' ? 12 : id === 'boot' ? 1 : 4, G.p.x, G.p.y);
  wear(bestTool('rod'));
}
function catchTable(b) { const L = luckTier(), base = (CATCH[b] || CATCH[0]).map(([k, w]) => [k, k === 'koi' ? w * LUCK_KOI[L] : k === 'boot' ? w * LUCK_BOOT[L] : w]); const tot = base.reduce((a, x) => a + x[1], 0), pb = LUCK_BOTTLE[L]; base.push(['bottle', tot * pb / (1 - pb)]); return base; }
function fishBottle() {
  if (!knows('koiSteam')) { learnRecipe('koiSteam', true); emit('toast', '병 속에서 쪽지가 나왔어요! 새 레시피: 별빛 잉어찜', 'good'); emit('sfx', 'seed'); return; }
  const cs = Object.keys(FLOWERS), pool = [['petal' + cs[(rand() * cs.length) | 0], 2], ['crystal', 2], ['gel', 2], [['glowSpore', 'cbeanSeed', 'berrySeed'][(rand() * 3) | 0], 2]];
  pool.sort(() => rand() - .5); for (const [id, c] of pool.slice(0, 3)) { const l = addItem(id, c); if (l) spawnDrop(id, l, G.p.x, G.p.y); } emit('toast', '작은 보물상자를 낚았어요!', 'good'); }
