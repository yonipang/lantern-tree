// ================= v115 자동 생산 3: 광석 그물 (규칙) =================
// 기획: dev/design/자동생산.md 4장. 수치·표는 data/sieve.js.
// 그물 o.job = { out: 넣은 재료, sv: 1, n: 1, q: 개수, per: SIEVE_T, t0, used: [[재료, 개수]] } — 용광로·요리솥의 시간 작업(v59)과 같은 모양이라
// 진행 막대(render/world.js)·회수하면 돌려받기(cancelJob)·옮기기(건축 모드)·저장은 그대로 써요. 다른 점은 꺼낼 때 하나마다 표대로 굴리는 것.
import { SIEVE, SIEVE_MAX, SIEVE_T } from '../data/sieve.js';
import { ITEMS } from '../data/items.js';
import { rand } from '../engine/random.js';
import { clamp, josa } from '../engine/util.js';
import { G } from '../save/state.js';
import { defineCmd } from './commands.js';
import { fmtT, jobDone, nowS } from './crafting.js';
import { spawnDrop } from './drops.js';
import { emit } from './events.js';
import { addItem, availCount, resetPool, takeAvail } from './inventory.js';
import { gainXp } from './player.js';
import { checkGuide } from './quests.js';
import { idx } from '../world/map.js';

// 재료 하나를 거르면 나오는 것 (null = 꽝)
export function sieveRoll(id) { const tb = SIEVE[id]; if (!tb) return null; let r = rand() * 100; for (const [o, p] of tb) { if (r < p) return o; r -= p; } return null; }
// 그물 앞에서 할 일: 다 된 게 있으면 [꺼내기], 늘 [열기], 회수는 작은 버튼
export function sieveOptions(t, o) { const L = [], d = o.job ? jobDone(o.job) : 0;
  if (d > 0) L.push({ k: 'use', u: 'sieveTake', lbl: '꺼내기', icon: 'oreNet', t, o });
  L.push({ k: 'use', u: 'sieve', lbl: '열기', icon: 'hand', t, o });
  L.push({ k: 'pickup', lbl: '회수', icon: 'hand', t, o, onlyAlt: 1 }); return L; }
export function sieveUse(a) { const t = a.t; if (a.u === 'sieveTake') { sieveTake(a.o, t.x + .5, t.y + .5); return; } emit('open', 'sieve', { i: idx(t.x, t.y) }); }
// 넣기 { o: 그물 칸, id: 재료, q: 개수 } — 가방과 가까운 상자의 재료를 써요(용광로와 같음)
defineCmd('sievePut', c => { const o = G.objs.get(c.o); if (!o || o.t !== 'oreNet' || !SIEVE[c.id]) return false;
  if (o.job) { emit('toast', '거르는 게 끝나면 넣을 수 있어요', null, 'jobbusy'); return false; }
  resetPool(); const q = clamp(Math.floor(c.q || 1), 1, Math.min(SIEVE_MAX, availCount(c.id))); if (!(q >= 1) || availCount(c.id) < 1) return false;
  takeAvail(c.id, q); o.job = { out: c.id, sv: 1, n: 1, q, per: SIEVE_T, t0: nowS(), used: [[c.id, q]] };
  emit('sfx', 'place'); emit('toast', `광석 그물에 ${ITEMS[c.id].n} ${q}개를 넣었어요 · ${fmtT(q * SIEVE_T)} 뒤에 다 돼요`, 'good', 'jobput'); emit('inv'); });
// 꺼내기: 다 거른 것만큼 하나씩 굴려서 가방으로 (넘치면 발밑). sim/crafting.js takeJob이 그물이면 여기로 와요.
export function sieveTake(o, x, y, quiet) { const j = o && o.job; if (!j || !j.sv) return 0; const d = jobDone(j); if (!d) return 0;
  const got = {}; for (let k = 0; k < d; k++) { const r = sieveRoll(j.out); if (r) got[r] = (got[r] || 0) + 1; }
  let total = 0; for (const id in got) { total += got[id]; const left = addItem(id, got[id]); if (left) spawnDrop(id, left, x, y); }
  G.stats.sieved = (G.stats.sieved || 0) + d; gainXp(Math.min(8, d));
  if (d >= j.q) delete o.job; else { j.used = j.used.map(([id, c]) => [id, c - d]); j.q -= d; j.t0 += d * j.per; }
  if (!quiet) { const list = Object.keys(got).sort((a, b) => got[b] - got[a]).map(id => `${ITEMS[id].n} ${got[id]}`);
    emit('sfx', total ? 'craft' : 'pick'); emit('toast', total ? `${ITEMS[j.out] ? josa(ITEMS[j.out].n, '을', '를') : '재료를'} ${d}개 걸렀어요 · ${list.join(' · ')}` : `${d}개를 걸렀는데 아무것도 걸리지 않았어요`, total ? 'good' : null, 'sieve'); }
  emit('inv'); checkGuide(); return total; }
