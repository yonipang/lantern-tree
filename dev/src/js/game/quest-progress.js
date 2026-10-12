const qText = q => typeof q.t === 'function' ? q.t() : q.t;
const epicOwned = () => { const got = new Set(); for (const s2 of G.inv) if (s2 && rarOf(s2.id) >= 3 && (ITEMS[s2.id].kind === 'sword' || ITEMS[s2.id].kind === 'pick')) got.add(s2.id); for (const id in (G.stats.epicSeen || {})) got.add(id); return got.size; };
function questState(q, k) { const side = k == null; const done = side ? q.done() : k < G.guide; const cur = !side && k === G.guide; return { done, cur, claimed: !!(G.qclaim || {})[q.id], has: (q.rw && q.rw.length) || q.xp }; }
const canClaim = () => GUIDE.some((q, k) => { const st = questState(q, k); return st.done && !st.claimed && st.has; }) || QSIDE.some(q => { const st = questState(q); return st.done && !st.claimed && st.has; });
function claimQuest(id) {
  const q = GUIDE.find(x => x.id === id) || QSIDE.find(x => x.id === id); if (!q) return; const k = GUIDE.indexOf(q), st = questState(q, k < 0 ? null : k); if (!st.done || st.claimed) return;
  G.qclaim = G.qclaim || {}; G.qclaim[id] = 1; for (const [it, c] of q.rw) { const l = addItem(it, c, false); if (l) spawnDrop(it, l, G.p.x, G.p.y); } if (q.xp) gainXp(q.xp, G.p.x, G.p.y);
  SFX.craft(); puff(G.p.x, G.p.y - .5, '#ffe9a8', 16, 2.6, .6);
}
let goalTarget = null, lastGoalTxt = '';
function checkGuide() {
  let n = 0; while (G.guide < GUIDE.length - 1 && GUIDE[G.guide].done() && n < 20) { if (started && !G.qt[GUIDE[G.guide].id]) G.qt[GUIDE[G.guide].id] = Math.max(1, Math.round(G.playT || 0)); G.guide++; n++; }
  if (n === 1 && started) { toast('목표 달성!', 'good'); SFX.craft(); }
  const g = GUIDE[G.guide]; const txt = g.t(); if (txt !== lastGoalTxt) { $('#goalTxt').textContent = txt; lastGoalTxt = txt; }
  goalTarget = g.target ? g.target() : null;
  checkUnlocks();
}
function checkBiome() {
  const p = G.p; if (!G.stats.waterTip && started) { outer: for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = Math.floor(p.x) + dx, y = Math.floor(p.y) + dy; if (inB(x, y) && G.floor[idx(x, y)] === WATER && !G.wall[idx(x, y)]) { G.stats.waterTip = 1; toast(hasItem('rod') ? '물가예요! 물을 바라보고 눌러 낚시해요' : '물가예요! 낚싯대를 만들면 낚시할 수 있어요 (장비제작대 → 도구)', 'good'); break outer; } } }
  checkBiome0();
}
function checkBiome0() { const p = G.p, b = G.biome[idx(Math.floor(p.x), Math.floor(p.y))]; if (b !== G.biomeNow) { G.biomeNow = b; if (b >= 3) G.stats['seen' + b] = 1; if (started) { toast(BIOME[b] || '', null, 'biome' + b); suggestWear(b); } } }

