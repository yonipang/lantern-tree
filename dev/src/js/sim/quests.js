// ================= 퀘스트: 길잡이·곁가지 진행과 보상, 목표 글·화살표, 지역 알림 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
// ---- 퀘스트 보상·능력치·스킬 ----
import { BIOME, ITEMS } from '../data/items.js';
import { GUIDE, Q_GO, Q_PROG, QSIDE } from '../data/quests.js';
import { BOSSES } from '../data/rpg-nature.js';
import { ANIMALS } from '../data/gear-animals.js';
import { OBJ, STN } from '../data/items.js';
import { G, started } from '../save/state.js';
import { defineCmd } from './commands.js';
import { spawnDrop } from './drops.js';
import { emit } from './events.js';
import { inOtherSet, rarOf, wearing } from './gear.js';
import { addItem, countItem } from './inventory.js';
import { WATER } from './nature.js';
import { gainXp } from './player.js';
import { suggestWear } from '../ui/hud.js';
import { BX, BY, dirKo, H, idx, inB, LAY, SA, SB, SI, SL, W } from '../world/map.js';
import { checkUnlocks } from '../world/tiles.js';
import { NARU_BELL, NARU_CALL, NARU_Q } from '../data/npc.js';
import { naruHolds, naruSpot } from './npc.js';
import { askOpen, isAsk, leadPrep, leadTarget } from './naru.js';
import { NARU_LEAD_GO } from '../data/npc.js';
defineCmd('claim', c => claimQuest(c.id));
defineCmd('claimAll', () => { for (const q of [...GUIDE, ...QSIDE]) if (!naruHolds(q)) claimQuest(q.id); emit('toast', '보상을 모두 받았어요', 'good'); });
// ================= guide =================
export function nearestObjOf(t, rad = 24) { const p = G.p; let best = null, bd = 1e9; for (let y = Math.floor(p.y - rad); y <= p.y + rad; y++) for (let x = Math.floor(p.x - rad); x <= p.x + rad; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && o.t === t) { const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = { x: x + .5, y: y + .5 }; } } } return best; }
export const hasItem = id => countItem(id) > 0 || wearing(id) || inOtherSet(id); // v83: 다른 장비 세트에 넣어 둔 것도
// v47: quest texts name directions from the old map; on the ring map they are rewritten from where things really are
export function dirFix() { if (LAY !== 2) return null; const d = (x, y) => dirKo(x, y);
  return { '서쪽 버섯숲': `${d(SA.x, SA.y)} 버섯숲`, '동쪽 동굴의 말랑대왕': `${d(BX, BY)} 이끼 동굴의 말랑대왕`, '화살표를 따라 서쪽으로!': `화살표를 따라 ${d(SA.x, SA.y)}으로!`, '화살표를 따라 동쪽으로!': `화살표를 따라 ${d(BX, BY)}으로!`,
    '북쪽 수정동굴': `${d(SB.x, SB.y)} 수정동굴`, '남쪽 용암 동굴': `${d(SL.x, SL.y)} 용암 동굴`, '서쪽 얼음 동굴': `${d(SI.x, SI.y)} 얼음 동굴`,
    '아주 단단한 벽에 막혀 있어서 수정 곡괭이가 있어야 들어갈 수 있어요.': '벽이 아주 단단해서 수정 곡괭이가 있어야 캘 수 있어요. 열린 굴로 걸어 들어갈 수는 있지만 덥고 추우니 준비해서 가요.',
    '수정 곡괭이로 남쪽·서쪽 깊은 곳의 단단한 벽을 뚫어요.': `바깥 고리의 ${d(SL.x, SL.y)} 용암 동굴과 ${d(SI.x, SI.y)} 얼음 동굴로 가 봐요.` }; }
export function dirText(str) { const m = dirFix(); if (!m || typeof str !== 'string') return str; const re = new RegExp(Object.keys(m).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'); return str.replace(re, a => m[a]); }
export function layoutTexts() { if (typeof GUIDE === 'undefined') return; for (const q of [...GUIDE, ...QSIDE]) { if (!('_t0' in q)) { q._t0 = q.t; q._h0 = q.h; }
  q.t = typeof q._t0 === 'function' ? (() => dirText(q._t0())) : dirText(q._t0); q.h = typeof q._h0 === 'function' ? (() => dirText(q._h0())) : dirText(q._h0); } }
export const qText = q => typeof q.t === 'function' ? q.t() : q.t;
export const epicOwned = () => { const got = new Set(); for (const s2 of G.inv) if (s2 && rarOf(s2.id) >= 3 && (ITEMS[s2.id].kind === 'sword' || ITEMS[s2.id].kind === 'pick')) got.add(s2.id); for (const id in (G.stats.epicSeen || {})) got.add(id); return got.size; };
export function questState(q, k) { const side = k == null; const done = side ? q.done() : k < G.guide; const cur = !side && k === G.guide; const nh = naruHolds(q); /* v118: 나루의 부탁도 */ return { done, cur, claimed: !!(G.qclaim || {})[q.id], has: nh ? q.rw.length > 0 : (q.rw && q.rw.length) || q.xp, nh }; } // v117 nh: 보상은 마을의 나루에게
export const canClaim = () => GUIDE.some((q, k) => { const st = questState(q, k); return st.done && !st.claimed && st.has && !st.nh; }) || QSIDE.some(q => { const st = questState(q); return st.done && !st.claimed && st.has && !st.nh; });
export function claimQuest(id) {
  const q = GUIDE.find(x => x.id === id) || QSIDE.find(x => x.id === id); if (!q) return; const k = GUIDE.indexOf(q), st = questState(q, k < 0 ? null : k); if (!st.done || st.claimed || st.nh) return; /* v117: 1부 보상은 나루에게 */
  G.qclaim = G.qclaim || {}; G.qclaim[id] = 1; if (G.qAct === id) G.qAct = 'none'; /* v84: 활성화한 도전은 보상을 받으면 활성이 비어요 */ for (const [it, c] of q.rw) { const l = addItem(it, c, false); if (l) spawnDrop(it, l, G.p.x, G.p.y); } const qx = G.stats.qxp = G.stats.qxp || {}; if (q.xp && !qx[id]) { qx[id] = 1; gainXp(q.xp, G.p.x, G.p.y); }
  emit('sfx', 'craft'); emit('puff', G.p.x, G.p.y - .5, '#ffe9a8', 16, 2.6, .6);
}
export let goalTarget = null;
// ---- v84 활성 퀘스트: 이야기·도전 통틀어 하나 (사람마다 따로, G.qAct: 'main' 진행 중인 이야기 · 'none' 없음 · 도전 퀘스트 id) ----
export const questById = id => GUIDE.find(q => q.id === id) || QSIDE.find(q => q.id === id) || (id === 'naruCall' ? CALL_Q : null);
export const isSide = q => !!q && QSIDE.includes(q);
// v117 나루가 마을로 부름(6·8번 뒤): 이야기는 마을에서 나루와 이야기한 뒤에 이어져요 — 그동안 이야기 자리에 「나루에게 가기」
export const CALL_Q = { id: 'naruCall', t: () => '마을에서 나루와 이야기하기', h: '마을로 와 줄래요? 할 얘기가 있어요. 머리 위에 물음표가 뜬 저한테 말을 걸어 줘요.', done: () => !G.stats.naruCall, target: () => naruSpot(), rw: [], xp: 0 };
export const mainQuest = () => G.stats.naruCall && naruSpot() ? CALL_Q : GUIDE[G.guide];
export function activeQuest() { const a = G.qAct || 'main'; if (a === 'none') return null; if (a === 'main') return mainQuest(); const q = QSIDE.find(x => x.id === a); return q && (!isAsk(q) || askOpen(q.id)) ? q : mainQuest(); }
export const qProg = q => { const f = q && Q_PROG[q.id]; if (!f) return null; const [a, b] = f(); return [Math.max(0, Math.min(b, a | 0)), b]; };
defineCmd('qAct', c => { if (c.id === 'none') { G.qAct = 'none'; } else if (c.id === 'main' || GUIDE.some(q => q.id === c.id)) { const k = GUIDE.findIndex(q => q.id === c.id); if (k > G.guide) return false; G.qAct = 'main'; }
  else { const q = QSIDE.find(x => x.id === c.id); if (!q || (isAsk(q) && !askOpen(q.id))) return false; G.qAct = q.id; } /* v118: 아직 안 받은 부탁은 못 골라요 */ QTGT.t = -9; checkGuide(); emit('sfx', 'pick'); });
// 「가장 가까운 할 곳」 — 지도에서 밝힌 곳만 (Q_GO 종류별). 찾으면 {x, y}, 장소가 있는 퀘스트인데 못 찾으면 null, 장소가 없는 퀘스트면 undefined
const qSeen = (x, y) => inB(x | 0, y | 0) && !!G.explored[idx(x | 0, y | 0)];
function nearestTile(test, R) { const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y); let best = null, bd = 1e9;
  for (let y = Math.max(0, py - R); y <= Math.min(H - 1, py + R); y++) for (let x = Math.max(0, px - R); x <= Math.min(W - 1, px + R); x++) { const i = idx(x, y); if (!G.explored[i] || !test(i)) continue; const d = (x - px) * (x - px) + (y - py) * (y - py); if (d < bd) { bd = d; best = { x: x + .5, y: y + .5 }; } }
  return best; }
function nearestOf(list) { const p = G.p; let best = null, bd = 1e9; for (const t of list) { if (!t || !qSeen(t.x, t.y)) continue; const d = Math.hypot(t.x - p.x, t.y - p.y); if (d < bd) { bd = d; best = { x: t.x, y: t.y }; } } return best; }
export function questGo(q) {
  if (q && isAsk(q) && q.done() && !(G.qclaim || {})[q.id]) return naruSpot(); // v118: 끝낸 부탁 = 마을의 나루에게
  if (q && q.id === 'ore') { const t = leadTarget(); if (t) return t; } // v118: 나루가 먼저 가 있는 광맥
  const g = q && Q_GO[q.id]; if (!g) return undefined; const [k, ...a] = g;
  if (k === 'obj') { const list = []; for (const [i, o] of G.objs) if (o && a.includes(o.t)) list.push({ x: i % W + .5, y: ((i / W) | 0) + .5 }); return nearestOf(list); }
  if (k === 'stn') { const list = []; for (const [i, o] of G.objs) if (o && OBJ[o.t] && (o.t === a[0] || OBJ[o.t].station === a[0])) list.push({ x: i % W + .5, y: ((i / W) | 0) + .5 }); return nearestOf(list); }
  if (k === 'wall') return nearestTile(i => G.wall[i] === a[0], 70);
  if (k === 'water') return nearestTile(i => G.floor[i] === WATER && !G.wall[i], 60);
  if (k === 'biome') { const want = a.filter(b => !G.stats['seen' + b]); return want.length ? nearestTile(i => want.includes(G.biome[i]) && !G.wall[i], 140) : null; }
  if (k === 'boss') { if (G.bossDead[a[0]]) return null; const h = BOSSES[a[0]].home(); return qSeen(h.x, h.y) ? { x: h.x, y: h.y } : null; }
  if (k === 'tgt') { const t = q.target && q.target(); return t && qSeen(t.x, t.y) ? t : null; }
  if (k === 'near') { const t = q.target && q.target(); return t || null; } // v110: 나루처럼 처음부터 아는 곳 (밝히지 않아도)
  if (k === 'enemy') return nearestOf(G.enemies.map(e => ({ x: e.x, y: e.y })));
  if (k === 'zone') return nearestOf((G.fzones || []).map(z => ({ x: z.x + .5, y: z.y + .5 })));
  if (k === 'room') return nearestOf((G.rooms || []).filter(r => r.found && !r.open).map(r => ({ x: r.cx + .5, y: r.cy + .5 })));
  if (k === 'wild') return nearestOf((G.wild || []).filter(w => ANIMALS[w.k] && !ANIMALS[w.k].worker).map(w => ({ x: w.x, y: w.y })));
  if (k === 'beaver') { // v114: 비버가 든 둥지(또는 비버를 가졌으면 빈 둥지), 아니면 비버, 없으면 가장 가까운 이끼 동굴 물가
    const nests = [], hasB = countItem('beaver') > 0; for (const [i, o] of G.objs) if (o && o.t === 'beaverNest' && (o.bv || hasB)) nests.push({ x: i % W + .5, y: ((i / W) | 0) + .5 }); if (nests.length) return nearestOf(nests);
    const bw = (G.wild || []).filter(w => w.k === 'beaver'); if (bw.length && !countItem('beaver')) return nearestOf(bw.map(w => ({ x: w.x, y: w.y })));
    return nearestTile(i => G.floor[i] === WATER && !G.wall[i] && G.biome[i] === 0, 80); }
  return undefined; }
// 장소가 있는데 화살표가 없을 때 안내
export function questGoMsg(q) { const g = q && Q_GO[q.id]; if (!g) return ''; if (g[0] === 'stn') return `${STN[g[1]] || g[1]}를 먼저 놓아요`; return '아직 찾지 못했어요'; }
const QTGT = { t: -9, q: null, v: null };
// HUD 퀘스트 한 줄: [작은 글자, 글]
export function activeLine() { const a = G.qAct || 'main', q = activeQuest(); if (!q) return ['', '퀘스트 고르기'];
  const side = isSide(q), st = side ? questState(q) : null, ask = side && isAsk(q); if (side && st.done && !st.claimed && st.has) return [ask ? '부탁' : '도전', `${st.nh ? '나루에게 가기' : '보상 받기'} · ${qText(q)}`]; return [ask ? '부탁' : side ? '도전' : '이야기', qText(q)]; }
export function checkGuide() {
  if (G.stats.naruCall && !naruSpot()) G.stats.naruCall = null; // 나루가 마을에 없으면 부르지 않아요
  let n = 0, last = null; while (!G.stats.naruCall && G.guide < GUIDE.length - 1 && GUIDE[G.guide].done() && n < 20) { const q = GUIDE[G.guide]; if (started && !G.qt[q.id]) G.qt[q.id] = Math.max(1, Math.round(G.playT || 0));
    // v117 1부(나루에게 받는 이야기): 경험치는 끝날 때 바로, 물건은 마을의 나루에게 · 6·8번은 마을로 부름
    if (NARU_Q.includes(q.id) && naruSpot()) { const qx = G.stats.qxp = G.stats.qxp || {}; if (q.xp && !qx[q.id] && !(G.qclaim || {})[q.id]) { qx[q.id] = 1; gainXp(q.xp, G.p.x, G.p.y); } if (started && NARU_CALL[q.id] && !(G.stats.callSeen || {})[q.id]) G.stats.naruCall = q.id; } // 한 장면은 한 번 (stats.callSeen)
    last = q; G.guide++; n++; }
  if (n && started && last) { const bell = NARU_Q.includes(last.id) && naruSpot() && NARU_BELL[last.id];
    if (bell) { const L = bell.slice(); if (last.id === 'torch' && leadPrep()) { L[L.length - 1] = NARU_LEAD_GO; emit('bell', L, 0, { k: 'naruLead' }); } else emit('bell', L); emit('sfx', 'craft'); /* v118: 4번 끝 → 나루가 광맥까지 먼저 */ if (last.rw.length && !G.stats.naruRwTip && !(G.qclaim || {})[last.id]) { G.stats.naruRwTip = 1; emit('toast', '보상은 마을의 나루에게 받아요 (머리 위 ?)', 'good', 'naruRwTip'); } }
    else if (n === 1 && !(NARU_Q.includes(last.id) && naruSpot())) { emit('toast', '목표 달성!', 'good'); emit('sfx', 'craft'); } } // 첫 퀘스트(나루에게 말 걸기)는 첫 장면이 대신해요
  const [tag, txt] = activeLine(); emit('goal', txt, tag);
  // v84: 화살표는 활성 퀘스트 하나 — 가장 가까운 할 곳을 1초에 한 번 찾아요 (밝힌 곳만)
  const q = activeQuest(); if (q !== QTGT.q || G.time - QTGT.t >= 1 || G.time < QTGT.t) { QTGT.q = q; QTGT.t = G.time; const v = q && !(isSide(q) && q.done() && !(isAsk(q) && !(G.qclaim || {})[q.id])) ? questGo(q) : null; QTGT.v = v || null; }
  goalTarget = QTGT.v;
  checkUnlocks();
}
export function checkBiome() {
  const p = G.p; if (!G.stats.waterTip && started) { outer: for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = Math.floor(p.x) + dx, y = Math.floor(p.y) + dy; if (inB(x, y) && G.floor[idx(x, y)] === WATER && !G.wall[idx(x, y)]) { G.stats.waterTip = 1; emit('toast', hasItem('rod') ? '물가예요! 물을 바라보고 눌러 낚시해요' : '물가예요! 낚싯대를 만들면 낚시할 수 있어요 (장비제작대 → 도구)', 'good'); break outer; } } }
  checkBiome0();
}
export function checkBiome0() { const p = G.p, b = G.biome[idx(Math.floor(p.x), Math.floor(p.y))]; if (b !== G.biomeNow) { G.biomeNow = b; if (b >= 3) G.stats['seen' + b] = 1; if (started) { emit('toast', BIOME[b] || '', null, 'biome' + b); suggestWear(b); } } }
