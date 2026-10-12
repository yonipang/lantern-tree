// ================= guide =================
function nearestObjOf(t, rad = 24) { const p = G.p; let best = null, bd = 1e9; for (let y = Math.floor(p.y - rad); y <= p.y + rad; y++) for (let x = Math.floor(p.x - rad); x <= p.x + rad; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && o.t === t) { const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = { x: x + .5, y: y + .5 }; } } } return best; }
const hasItem = id => countItem(id) > 0 || wearing(id);
// v47: quest texts name directions from the old map; on the ring map they are rewritten from where things really are
function dirFix() { if (LAY !== 2) return null; const d = (x, y) => dirKo(x, y);
  return { '서쪽 버섯숲': `${d(SA.x, SA.y)} 버섯숲`, '동쪽 동굴의 말랑대왕': `${d(BX, BY)} 이끼 동굴의 말랑대왕`, '화살표를 따라 서쪽으로!': `화살표를 따라 ${d(SA.x, SA.y)}으로!`, '화살표를 따라 동쪽으로!': `화살표를 따라 ${d(BX, BY)}으로!`,
    '북쪽 수정동굴': `${d(SB.x, SB.y)} 수정동굴`, '남쪽 용암 동굴': `${d(SL.x, SL.y)} 용암 동굴`, '서쪽 얼음 동굴': `${d(SI.x, SI.y)} 얼음 동굴`,
    '아주 단단한 벽에 막혀 있어서 수정 곡괭이가 있어야 들어갈 수 있어요.': '벽이 아주 단단해서 수정 곡괭이가 있어야 캘 수 있어요. 열린 굴로 걸어 들어갈 수는 있지만 덥고 추우니 준비해서 가요.',
    '수정 곡괭이로 남쪽·서쪽 깊은 곳의 단단한 벽을 뚫어요.': `바깥 고리의 ${d(SL.x, SL.y)} 용암 동굴과 ${d(SI.x, SI.y)} 얼음 동굴로 가 봐요.` }; }
function dirText(str) { const m = dirFix(); if (!m || typeof str !== 'string') return str; const re = new RegExp(Object.keys(m).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'); return str.replace(re, a => m[a]); }
function layoutTexts() { if (typeof GUIDE === 'undefined') return; for (const q of [...GUIDE, ...QSIDE]) { if (!('_t0' in q)) { q._t0 = q.t; q._h0 = q.h; }
  q.t = typeof q._t0 === 'function' ? (() => dirText(q._t0())) : dirText(q._t0); q.h = typeof q._h0 === 'function' ? (() => dirText(q._h0())) : dirText(q._h0); } }
const qText = q => typeof q.t === 'function' ? q.t() : q.t;
const epicOwned = () => { const got = new Set(); for (const s2 of G.inv) if (s2 && rarOf(s2.id) >= 3 && (ITEMS[s2.id].kind === 'sword' || ITEMS[s2.id].kind === 'pick')) got.add(s2.id); for (const id in (G.stats.epicSeen || {})) got.add(id); return got.size; };
function questState(q, k) { const side = k == null; const done = side ? q.done() : k < G.guide; const cur = !side && k === G.guide; return { done, cur, claimed: !!(G.qclaim || {})[q.id], has: (q.rw && q.rw.length) || q.xp }; }
const canClaim = () => GUIDE.some((q, k) => { const st = questState(q, k); return st.done && !st.claimed && st.has; }) || QSIDE.some(q => { const st = questState(q); return st.done && !st.claimed && st.has; });
function claimQuest(id) {
  const q = GUIDE.find(x => x.id === id) || QSIDE.find(x => x.id === id); if (!q) return; const k = GUIDE.indexOf(q), st = questState(q, k < 0 ? null : k); if (!st.done || st.claimed) return;
  G.qclaim = G.qclaim || {}; G.qclaim[id] = 1; for (const [it, c] of q.rw) { const l = addItem(it, c, false); if (l) spawnDrop(it, l, G.p.x, G.p.y); } if (q.xp) gainXp(q.xp, G.p.x, G.p.y);
  emit('sfx', 'craft'); emit('puff', G.p.x, G.p.y - .5, '#ffe9a8', 16, 2.6, .6);
}
let goalTarget = null;
function checkGuide() {
  let n = 0; while (G.guide < GUIDE.length - 1 && GUIDE[G.guide].done() && n < 20) { if (started && !G.qt[GUIDE[G.guide].id]) G.qt[GUIDE[G.guide].id] = Math.max(1, Math.round(G.playT || 0)); G.guide++; n++; }
  if (n === 1 && started) { emit('toast', '목표 달성!', 'good'); emit('sfx', 'craft'); }
  const g = GUIDE[G.guide]; emit('goal', g.t());
  goalTarget = g.target ? g.target() : null;
  checkUnlocks();
}
function checkBiome() {
  const p = G.p; if (!G.stats.waterTip && started) { outer: for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = Math.floor(p.x) + dx, y = Math.floor(p.y) + dy; if (inB(x, y) && G.floor[idx(x, y)] === WATER && !G.wall[idx(x, y)]) { G.stats.waterTip = 1; emit('toast', hasItem('rod') ? '물가예요! 물을 바라보고 눌러 낚시해요' : '물가예요! 낚싯대를 만들면 낚시할 수 있어요 (장비제작대 → 도구)', 'good'); break outer; } } }
  checkBiome0();
}
function checkBiome0() { const p = G.p, b = G.biome[idx(Math.floor(p.x), Math.floor(p.y))]; if (b !== G.biomeNow) { G.biomeNow = b; if (b >= 3) G.stats['seen' + b] = 1; if (started) { emit('toast', BIOME[b] || '', null, 'biome' + b); suggestWear(b); } } }
