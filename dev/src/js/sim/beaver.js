// ================= v114 자동 생산 2: 비버 둥지 · 먹이통 (규칙) =================
// 기획: dev/design/자동생산.md 3장. 수치·먹이 표는 data/beaver.js.
// 둥지 o: bv(비버가 들어 있음) · fd(먹은 먹이로 남은 초) · prog(이번 나무까지 일한 초) · tgt(베는 나무 칸) · from(방금 벤 나무 칸, 돌아오는 걸음 그림용)
//        store(옆 상자가 없을 때 쌓인 것) · work · why('beaver' 비버 없음 · 'tree' 다 자란 나무 없음 · 'food' 먹이 없음 · 'full' 가득 참)
// 먹이통 o: feed(FEED_SLOTS칸, 먹이만 들어가요)
// 일은 비버가 먹이를 먹은 동안만 하고, 먹이는 일하는 동안만 줄어요 (둘레에 다 자란 나무가 없으면 먹이도 안 먹어요).
import { BEAVER_WATER_R, FEED, FEED_SLOTS, NEST_CAP, NEST_EVERY, NEST_R } from '../data/beaver.js';
import { ITEMS, OBJ } from '../data/items.js';
import { YOUNG_T, YOUNG_TREES } from '../data/rpg-nature.js';
import { rand, rint } from '../engine/random.js';
import { josa } from '../engine/util.js';
import { G } from '../save/state.js';
import { D4 } from './circuits.js';
import { defineCmd } from './commands.js';
import { emit } from './events.js';
import { addItem, countItem, moveInto, removeItem, storeAt } from './inventory.js';
import { markLight } from './loop.js';
import { isYoung, WATER } from './nature.js';
import { onFrame } from './systems.js';
import { idx, inB, W } from '../world/map.js';
import { anchorAt, delObj, fpOf } from '../world/tiles.js';

export const storeN = o => (o.store || []).reduce((a, s) => a + s.c, 0);
export const feedSec = o => (o.feed || []).reduce((a, s) => a + (s && FEED[s.id] ? FEED[s.id] * s.c : 0), 0);
// 다 자란 나무 (베면 나무가 나오는 것 — 뿌리기둥·큰버섯·벚꽃나무·둥근 나무·큰 고목. 젊은 나무는 아직 안 벰)
export const grownTree = o => !!o && YOUNG_TREES.includes(o.t) && !isYoung(o);
// 둥지 둘레 NEST_R칸(7×7) 안에서 test에 맞는 것 (여러 칸 나무는 한 칸만 걸쳐도), 가까운 순
function around(i, test) { const x = i % W, y = (i / W) | 0, out = [], seen = new Set();
  for (let dy = -NEST_R; dy <= NEST_R; dy++) for (let dx = -NEST_R; dx <= NEST_R; dx++) { if ((!dx && !dy) || !inB(x + dx, y + dy)) continue; const j0 = idx(x + dx, y + dy), j = anchorAt(j0); if (j < 0 || seen.has(j)) continue; const o = G.objs.get(j); if (!o || !test(o)) continue; seen.add(j); out.push({ j, o, d: Math.hypot(dx, dy) }); }
  return out.sort((a, b) => a.d - b.d || a.j - b.j); }
export const treesNear = i => around(i, grownTree);
export const feedersNear = i => around(i, o => o.t === 'feeder' && !!o.feed);
// 둘레 먹이통에서 먹이 하나 먹기 → 그 먹이로 일하는 초 (없으면 0)
function eatOne(i) { for (const { o } of feedersNear(i)) for (let k = 0; k < o.feed.length; k++) { const s = o.feed[k]; if (!s || !FEED[s.id]) continue; const sec = FEED[s.id]; s.c--; if (!s.c) o.feed[k] = null; return sec; } return 0; }
function chestsBy(i) { const x = i % W, y = (i / W) | 0, out = []; for (const [dx, dy] of D4) { if (!inB(x + dx, y + dy)) continue; const sc = storeAt(idx(x + dx, y + dy)); if (sc) out.push({ c: sc.o, x: x + dx, y: y + dy }); } return out; }
const roomy = i => chestsBy(i).some(({ c }) => c.items.some(z => !z));
// 벤 나무에서 나오는 것: 손으로 벨 때의 나무 개수·송진 확률 그대로 (이끼 섬유·버섯·꽃잎·묘목은 안 나옴)
export function beaverYield(t) { const out = []; for (const [id, a, b, ch] of OBJ[t].drops || []) { if (id !== 'wood' && id !== 'resin') continue; if (rand() < (ch == null ? 1 : ch)) { const c = rint(a, b); if (c > 0) out.push([id, c]); } } return out; }
function chop(i, o, j, tree) { const tx = j % W, ty = (j / W) | 0, nx = i % W, ny = (i / W) | 0, d = OBJ[tree.t], fp = d.sz ? fpOf(tree) : [1, 1];
  const got = beaverYield(tree.t), cx = tx + fp[0] / 2, cy = ty + fp[1] / 2, near = Math.hypot(cx - G.p.x, cy - G.p.y) < 14;
  // 벤 나무는 어린나무(4단계 중 2단계)로 돌아가 YOUNG_T×2초 뒤 다 자라요 — 옛 그루터기처럼 원래 나무로 (sim/nature.js growTick)
  delObj(j); G.objs.set(j, { t: tree.t === 'bigShroom' ? 'capStump' : 'stump', g: tree.t, at: G.time + 2 * YOUNG_T }); markLight(); emit('tile', tx, ty);
  const ch = chestsBy(i);
  for (const [id, c] of got) { let left = c; for (const { c: box, x, y } of ch) { if (!left) break; const l = moveInto(box.items, { id, c: left }); if (l < left && near) emit('oreFly', cx, cy, x + .5, y + .6, id === 'resin' ? '#e8a838' : '#b07a48'); left = l; }
    if (left) { o.store = o.store || []; const add = Math.min(left, NEST_CAP - storeN(o)); if (add > 0) { const s = o.store.find(z => z.id === id); if (s) s.c += add; else o.store.push({ id, c: add }); if (near) emit('oreFly', cx, cy, nx + .5, ny + .6, id === 'resin' ? '#e8a838' : '#b07a48'); } }
    if (id === 'wood') G.stats.farmed = (G.stats.farmed || 0) + c; } // 퀘스트 「비버 둥지로 나무 30개」
  if (near) { emit('sfx', 'brk'); emit('puff', cx, cy - .4, '#7fc06a', 12, 2.6, .4); emit('puff', cx, cy + .2, '#b07a48', 6, 1.8, .2); } }
export function nestStep(i, o, dt) {
  if (!o.bv) { o.work = false; o.why = 'beaver'; return; }
  if (storeN(o) >= NEST_CAP && !roomy(i)) { o.work = false; o.why = 'full'; return; }
  let tg = o.tgt != null ? G.objs.get(o.tgt) : null; if (!grownTree(tg) || !treesNear(i).some(e => e.j === o.tgt)) { const L = treesNear(i); if (!L.length) { o.tgt = null; o.work = false; o.why = 'tree'; return; } o.tgt = L[0].j; tg = L[0].o; }
  if ((o.fd || 0) <= 0) { const sec = eatOne(i); if (!sec) { o.fd = 0; o.work = false; o.why = 'food'; return; } o.fd = sec; }
  o.work = true; o.why = ''; o.fd = Math.max(0, o.fd - dt); o.prog = (o.prog || 0) + dt;
  if (o.prog >= NEST_EVERY - 4 && Math.hypot(o.tgt % W + .5 - G.p.x, ((o.tgt / W) | 0) + .5 - G.p.y) < 20) tg.shake = .15; // 쓰러지기 전 흔들흔들
  if (o.prog >= NEST_EVERY) { o.prog = 0; o.from = o.tgt; chop(i, o, o.tgt, tg); o.tgt = null; G.stats.beaverCut = (G.stats.beaverCut || 0) + 1; } }
export let nestT = 0;
onFrame('beaver', dt => { nestT += dt; if (nestT < .25) return; const step = nestT; nestT = 0; for (const [i, o] of G.objs) if (o && o.t === 'beaverNest') nestStep(i, o, step); });

// ---- 둥지 앞에서 할 일 (sim/actions.js autoOptions·useObj에서 불러요) ----
export const NEST_WHY = { beaver: '비버가 없어요 · 이끼 동굴 물가의 비버를 올가미로 데려와 넣어 주세요', tree: `둘레 ${NEST_R}칸 안에 다 자란 나무가 없어요 · 묘목을 심어 비버 숲을 만들어요`, food: `배가 고파 잠들었어요 · 둘레 ${NEST_R}칸 안의 먹이통에 먹이를 넣어 주세요`, full: '둥지가 가득 찼어요 · 꺼내거나 옆에 보관상자를 놓아 주세요' };
export function nestInfo(o, i) { if (o.work) { const left = Math.ceil(NEST_EVERY - (o.prog || 0)), food = Math.floor(((o.fd || 0) + feedersNear(i).reduce((a, e) => a + feedSec(e.o), 0)) / 60); return `나무를 갉는 중이에요 · 다음 나무까지 ${left}초 · 먹이로 약 ${food}분 더 일해요`; }
  return NEST_WHY[o.why] || NEST_WHY.beaver; }
export function nestOptions(t, o) { const L = [], i = idx(t.x, t.y), n = storeN(o);
  if (o.t === 'feeder') { L.push({ k: 'use', u: 'feeder', lbl: '먹이통 열기', icon: 'hand', t, o }); L.push({ k: 'pickup', lbl: '회수', icon: 'hand', t, o, onlyAlt: 1 }); return L; }
  if (!o.bv && countItem('beaver')) L.push({ k: 'use', u: 'nestIn', lbl: '비버 넣기', icon: 'beaver', t, o });
  if (n) L.push({ k: 'use', u: 'nestTake', lbl: '꺼내기', icon: o.store[0].id, t, o });
  L.push({ k: 'use', u: 'nestInfo', lbl: '살펴보기', icon: 'hand', t, o, msg: nestInfo(o, i) });
  L.push({ k: 'pickup', lbl: '회수', icon: 'hand', t, o, onlyAlt: 1 }); return L; }
export function nestUse(a) { const o = a.o, t = a.t, i = idx(t.x, t.y);
  if (a.u === 'feeder') { emit('open', 'feeder', { i }); return; }
  if (a.u === 'nestIn') { if (o.bv || !countItem('beaver')) return; removeItem('beaver', 1); o.bv = 1; o.prog = 0; o.tgt = null; o.from = null; emit('inv'); emit('sfx', 'seed'); emit('hearts', t.x + .5, t.y, 4); nestStep(i, o, 0);
    emit('toast', o.why ? `비버가 둥지에 들어갔어요 · ${NEST_WHY[o.why]}` : '비버가 둥지에 들어갔어요! 둘레의 나무를 베어 와요', 'good', 'nest'); return; }
  if (a.u === 'nestTake') { const n = storeN(o); if (!n) return; for (const s of o.store) s.c = moveInto(G.inv, s); o.store = o.store.filter(s => s.c > 0); emit('sfx', 'pick'); emit('inv');
    emit('toast', o.store.length ? '가방이 가득 차서 일부만 꺼냈어요' : `비버 둥지에서 ${n - storeN(o)}개를 꺼냈어요`, 'good', 'nest'); return; }
  emit('toast', nestInfo(o, i), null, 'nest'); }
// 둥지·먹이통을 회수하면: 둥지의 비버와 쌓인 것, 먹이통의 먹이도 돌려줘요 (sim/inventory.js returnObj · sim/gathering.js dropObj)
export function nestContents(o) { const out = []; if (o.bv) out.push(['beaver', 1]); if (o.feed) for (const s of o.feed) if (s) out.push([s.id, s.c]); return out; }

// ---- 먹이통 창 (ui/panels.js 「feeder」, 명령은 ui/panel-actions.js에서) ----
const fdOf = c => { const o = G.objs.get(c.o); return o && o.t === 'feeder' ? (o.feed = o.feed || Array(FEED_SLOTS).fill(null), o) : null; };
defineCmd('feedIn', c => { const o = fdOf(c), s = o && G.inv[c.i]; if (!s || !FEED[s.id]) return false; const l = moveInto(o.feed, s); if (l === s.c) { emit('toast', '먹이통이 가득 찼어요', null, 'full'); return false; } if (l) s.c = l; else G.inv[c.i] = null; emit('sfx', 'pick'); emit('inv'); });
defineCmd('feedOut', c => { const o = fdOf(c), s = o && o.feed[c.i]; if (!s) return false; const l = moveInto(G.inv, s); if (l === s.c) { emit('toast', '가방이 가득 찼어요', null, 'full'); return false; } if (l) s.c = l; else o.feed[c.i] = null; emit('sfx', 'pick'); emit('inv'); });
defineCmd('feedAll', c => { const o = fdOf(c); if (!o) return false; let n = 0, full = false;
  for (let k = 0; k < G.inv.length; k++) { const s = G.inv[k]; if (!s || !FEED[s.id]) continue; const l = moveInto(o.feed, s); n += s.c - l; if (l) { s.c = l; full = true; } else G.inv[k] = null; }
  emit('toast', n ? `먹이 ${n}개를 넣었어요${full ? ' · 먹이통이 가득 차서 일부는 남았어요' : ''}` : full ? '먹이통이 가득 찼어요' : '가방에 먹이가 없어요 (통통베리·버섯·수정 콩·불꽃 열매·서리 무)', n ? 'good' : null, 'feed'); if (n) emit('sfx', 'place'); emit('inv'); });

// ---- 비버가 사는 곳: 이끼 동굴 물가 (sim/animals.js wildTick) ----
export function waterNear(x, y, r) { const cx = Math.floor(x), cy = Math.floor(y); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (!inB(cx + dx, cy + dy)) continue; const j = idx(cx + dx, cy + dy); if (G.floor[j] === WATER && !G.wall[j]) return true; } return false; }
export const beaverHome = (x, y) => G.biome[idx(Math.floor(x), Math.floor(y))] === 0 && waterNear(x, y, BEAVER_WATER_R);
export const caughtMsg = k => `${josa(ITEMS[k].n, '을', '를')} 데려왔어요! 비버 둥지 앞에서 눌러 넣어 주세요`;

// ---- 그림용: 둥지의 비버가 지금 어디서 무엇을 하는지 (규칙 값에서 계산만, 바꾸지 않아요) ----
// 한 그루 NEST_EVERY초: 0~4초 방금 벤 나무에서 둥지로 · 4~8초 둥지 · 8~12초 다음 나무로 · 12초~ 갉기
export function beaverPose(i, o) { const hx = i % W + .5, hy = ((i / W) | 0) + 1.55, home = { x: hx, y: hy, img: o.why === 'food' ? 'beaverZ' : 'beaver', flip: false, moving: false };
  if (!o.work) return home;
  const spot = j => { if (j == null) return null; const tx = j % W + .5, ty = ((j / W) | 0) + .5, dx = hx - tx, dy = hy - ty, d = Math.hypot(dx, dy) || 1; return { x: tx + dx / d * .7, y: ty + dy / d * .7 + .3, fx: tx }; };
  const p = o.prog || 0, tg = spot(o.tgt), fr = spot(o.from), lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
  if (p < 4 && fr) { const q = lerp(fr, home, p / 4); return { ...q, img: 'beaver', flip: home.x < fr.x, moving: true }; }
  if (p < 8 || !tg) return home;
  if (p < 12) { const q = lerp(home, tg, (p - 8) / 4); return { ...q, img: 'beaver', flip: tg.x < home.x, moving: true }; }
  return { x: tg.x, y: tg.y, img: Math.floor(p * 4) % 2 ? 'beaverG' : 'beaver', flip: tg.fx < tg.x, moving: false }; }
