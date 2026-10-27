// ================= 실험판 L2 가게·대장장이·발견 (재미중심.md 13장, 세계관-NPC.md 「플레이어 상점」) =================
// 가게 주인은 플레이어: 진열대에 물건과 값을 올려 두면 손님이 길(팻말)로 들어와 → 진열대 앞에서 값을 보고 표정(좋아함·괜찮음·비싸다)
// → 사면 물건을 들고 계산대에서 돈을 내고 나가요. 비싸다면 그냥 나가요. 결과는 장부(G.ledger)에 남아요.
// 거점 안에 있으면 손님이 자주(12초), 비웠으면 드물게(36초) 와요. 거점에 꾸민 물건이 있으면 조금 더 자주 + 가끔 좋은 손님.
// 판매 종류는 상인을 따라 늘어나요: 처음엔 원재료·기본 아이템(마을 손님), 대장장이가 오면 금속 물건(연장 찾는 손님).
// 대장장이는 이끼 동굴 버려진 채굴 쉼터에서 만나면 마을로 와요. 마을에서 말을 걸면 돈으로 레시피를 사요(실험판은 살 때만 돈).
// 규칙은 화면을 직접 건드리지 않고 사건만 남겨요: emit('open', 창 이름, …) → js/lab/ui.js가 창을 열어요.
import { ITEMS, OBJ } from '../data/items.js';
import { rand } from '../engine/random.js';
import { emit } from '../sim/events.js';
import { defineCmd } from '../sim/commands.js';
import { onFrame } from '../sim/systems.js';
import { G } from '../save/state.js';
import { idx, W } from '../world/map.js';
import { addBag, countBag, hasAll, takeBag } from './bag.js';
import { GATE, inBase, removeObj, ROOMS, SMITH_HOME } from './world.js';
import { CAT_NAME, CUSTOMERS, SHOP_DECOR, GOODS, RECIPES_L, SHOP, SMITH_SHOP, priceStep } from './shopdata.js';
const shopNm = id => (ITEMS[id] && ITEMS[id].n) || id;
// ---------- 만지기 ----------
export function smithNear(p) { const s = G.smith; if (!s) return false; const dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy); return d < 1.6 && (dx * p.face.x + dy * p.face.y) > -.2; }
export function touchObj(t) {
  const o = t.o;
  if (o.shelf != null) return emit('open', 'shelf', o.shelf);
  if (o.counter) return emit('open', 'ledger');
  if (o.t === 'bench') return emit('open', 'craft');
  if (o.loot) { for (const [id, n] of o.loot) { addBag(id, n); emit('got', id, n); } o.loot = null; o.t = 'chest'; o.opened = 1; emit('sfx', 'pick'); emit('toast', '상자 안에 쓸 만한 게 들어 있었어요', 'good', 'loot'); return; }
  if (o.mine) { removeObj(t.a); addBag(o.t, 1); emit('sfx', 'pick'); emit('lit'); emit('got', o.t, 1); return; }
  if (o.gate) return emit('toast', '마을로 이어지는 길이에요. 손님들이 여기로 와요', '', 'gate');
  if (o.t === 'crateS' || o.t === 'barrelS') return emit('toast', G.smith.at === 'shelter' ? '오래 쓴 연장 자국이 남아 있어요' : '대장장이가 쓰던 낡은 상자예요', '', 'old');
  if (o.opened) return emit('toast', '빈 상자예요', '', 'empty');
}
export function touchSmith() {
  const s = G.smith;
  if (s.at === 'shelter') { s.at = 'village'; s.x = SMITH_HOME.x; s.y = SMITH_HOME.y; if (!G.cats.includes('metal')) G.cats.push('metal'); G.log.push(['smith', G.time]);
    emit('open', 'talk', ['…! 사람이다. 망치 소리를 듣고 온 거야?', '길을 잃고 여기서 연장만 두드리고 있었어. 마을이 있다고? 같이 가자!', '마을에 가면 내가 레시피를 팔게. 구리 곡괭이가 있으면 돌벽도 뚫을 수 있지.']);
    emit('toast', '대장장이 하람이 마을로 왔어요 — 이제 금속 물건을 찾는 손님도 와요', 'good', 'smith'); emit('sfx', 'win'); return; }
  emit('open', 'smith');
}
// ---------- 만들기 (작업대) ----------
defineCmd('craft', c => { const r = RECIPES_L[c.id]; if (!r || !G.recipes.includes(c.id)) return; if (!hasAll(r.req)) { emit('toast', '재료가 모자라요', '', 'noreq'); return; }
  if (r.tool && G.pick === r.out[0]) { emit('toast', '이미 가지고 있어요', '', 'have'); return; }
  for (const [id, n] of r.req) takeBag(id, n);
  if (r.tool) { G.pick = r.out[0]; emit('toast', `${shopNm(r.out[0])}을 만들었어요 — 이제 돌벽도 캘 수 있어요`, 'good', 'tool'); emit('bag'); }
  else { addBag(r.out[0], r.out[1]); emit('toast', `${shopNm(r.out[0])} ${r.out[1]}개를 만들었어요`, 'good', 'craft'); }
  emit('sfx', 'craft'); G.log.push(['craft', c.id, G.time]); });
// ---------- 대장장이 레시피 사기 ----------
defineCmd('buyRecipe', c => { const row = SMITH_SHOP.find(r => r[0] === c.id); if (!row || G.smith.at !== 'village' || G.recipes.includes(c.id)) return;
  if (G.gold < row[1]) { emit('toast', `돈이 ${row[1] - G.gold} 모자라요`, '', 'nogold'); return; }
  G.gold -= row[1]; G.recipes.push(c.id); emit('gold', G.gold); emit('sfx', 'blip'); emit('toast', `${shopNm(c.id)} 레시피를 샀어요 — 작업대에서 만들어요`, 'good', 'recipe'); G.log.push(['recipe', c.id, G.time]); });
// ---------- 진열대 ----------
export const wantedNow = cat => Object.values(CUSTOMERS).some(t => t.wants.includes(cat) && (!t.need || G.cats.includes(t.need)));
export const sellable = id => !!GOODS[id];
export const ledgerPrice = id => { const L = G.ledger[id]; return L && L.ok ? L.ok : 0; };
defineCmd('shelfPut', c => { const s = G.shelves[c.s], id = c.id; if (!s || !sellable(id)) return; if (s.id && s.id !== id) { emit('toast', '먼저 올려 둔 물건을 내려요', '', 'shelfbusy'); return; }
  const n = Math.min(c.n || 1, countBag(id), SHOP.shelfMax - s.n); if (n <= 0) return; takeBag(id, n);
  if (!s.id) { s.id = id; s.price = ledgerPrice(id) || Math.max(1, Math.round(GOODS[id].v * 1.2)); }
  s.n += n; emit('shelf', c.s); emit('sfx', 'place');
  if (!wantedNow(GOODS[id].cat)) emit('toast', '사 갈 손님이 아직 없어요', '', 'nobuyer'); });
defineCmd('shelfTake', c => { const s = G.shelves[c.s]; if (!s || !s.id) return; if (s.n) addBag(s.id, s.n); s.id = null; s.n = 0; emit('shelf', c.s); });
defineCmd('shelfPrice', c => { const s = G.shelves[c.s]; if (!s || !s.id) return; const st = priceStep(s.price); s.price = Math.max(1, Math.min(9999, s.price + (c.d > 0 ? st : -priceStep(Math.max(1, s.price - 1))))); emit('shelf', c.s); });
// ---------- 손님 ----------
export const decorCount = () => { let n = 0; for (const [i, o] of G.objs) if (o.t !== '_part' && SHOP_DECOR.has(o.t) && inBase(i % W, (i / W) | 0)) n++; return n; };
export const present = () => inBase(Math.floor(G.p.x), Math.floor(G.p.y));
export const custGap = () => (present() ? SHOP.gapHere : SHOP.gapAway) * (1 - Math.min(SHOP.decorMax, decorCount() * SHOP.decorStep));
const shelfFront = s => ({ x: s.x + .5, y: s.y + 1.7 });
const counterOf = () => { for (const [i, o] of G.objs) if (o.counter) return { x: (i % W) + 1, y: ((i / W) | 0) + 1.7 }; return { x: 103, y: 98.7 }; };
function wantedShelves(type) { const T = CUSTOMERS[type]; return G.shelves.map((s, k) => k).filter(k => { const s = G.shelves[k]; return s.id && s.n > 0 && T.wants.includes(GOODS[s.id].cat) && !G.customers.some(c => c.s === k && c.st !== 'out'); }); }
function spawnCustomer() {
  const types = Object.keys(CUSTOMERS).filter(t => (!CUSTOMERS[t].need || G.cats.includes(CUSTOMERS[t].need)) && wantedShelves(t).length);
  if (!types.length) return false;
  const type = types[Math.floor(rand() * types.length)], ks = wantedShelves(type), k = ks[Math.floor(rand() * ks.length)];
  const dec = decorCount(), good = rand() < Math.min(SHOP.goodMax, SHOP.goodBase + dec * SHOP.goodStep);
  G.custN++; G.customers.push({ id: G.custN, type, look: Math.floor(rand() * CUSTOMERS[type].looks.length), good, s: k, st: 'in', x: GATE.x, y: GATE.y, tx: 0, ty: 0, t: 0, mood: null, moodT: 0, carry: null, pay: 0, face: 'side', flip: true, anim: 0 });
  emit('sfx', 'click'); return true;
}
function walk(c, tx, ty, dt) { const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy), st = SHOP.speed * dt; c.anim += dt;
  if (Math.abs(dx) > Math.abs(dy)) { c.face = 'side'; c.flip = dx < 0; } else c.face = dy < 0 ? 'up' : 'down';
  if (d <= st) { c.x = tx; c.y = ty; return true; } c.x += dx / d * st; c.y += dy / d * st; return false; }
function decide(c) { const s = G.shelves[c.s];
  if (!s.id || s.n <= 0) { c.mood = 'huh'; c.moodT = 1.4; c.st = 'out'; return; }
  const v = GOODS[s.id].v, tol = c.good ? SHOP.goodTol : 1, r = s.price / v, L = G.ledger[s.id] = G.ledger[s.id] || { ok: 0, no: 0 };
  if (r <= SHOP.love * tol || r <= SHOP.ok * tol) { c.mood = r <= SHOP.love * tol ? 'love' : 'ok'; c.carry = s.id; c.pay = s.price; s.n--; if (!s.n) s.id = null;
    L.ok = Math.max(L.ok, s.price);
    c.st = 'pay'; emit('shelf', c.s); }
  else { c.mood = 'no'; L.no = L.no ? Math.min(L.no, s.price) : s.price; c.st = 'out'; }
  c.moodT = 1.8; emit('mood', c.mood, c.x, c.y); }
onFrame('shop', dt => {
  // 손님 오기
  G.custCd -= dt;
  if (G.custCd <= 0) { if (G.customers.length < SHOP.maxCust && spawnCustomer()) G.custCd = custGap() * (.8 + rand() * .4); else G.custCd = 2; }
  for (const c of G.customers) { c.moodT = Math.max(0, c.moodT - dt);
    if (c.st === 'in') { const f = shelfFront(G.shelves[c.s]); if (walk(c, f.x, f.y, dt)) { c.st = 'think'; c.t = SHOP.think; c.face = 'up'; } }
    else if (c.st === 'think') { c.t -= dt; if (c.t <= 0) decide(c); }
    else if (c.st === 'pay') { const k = counterOf(); if (walk(c, k.x, k.y, dt)) { G.gold += c.pay; G.sold++; emit('gold', G.gold); emit('coin', c.x, c.y - 1.2, c.pay); emit('sfx', 'blip'); G.log.push(['sale', c.carry, c.pay, c.good ? 1 : 0, present() ? 1 : 0, G.time]); c.carry = null; c.st = 'out'; } }
    else if (c.st === 'out') { if (c.moodT > 1.2) continue; if (walk(c, GATE.x, GATE.y, dt)) c.st = 'gone'; } }
  G.customers = G.customers.filter(c => c.st !== 'gone');
});
// ---------- 발견 공간: 단서와 처음 들어감 ----------
let clueT = 0;
onFrame('clues', dt => { clueT += dt; const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y);
  for (const [key, R] of Object.entries(ROOMS)) {
    if (!G.opened[key] && px >= R.x0 && px <= R.x1 && py >= R.y0 && py <= R.y1) { G.opened[key] = G.time; G.log.push(['room', key, G.time]); emit('toast', `${R.n}을(를) 찾았어요!`, 'good', 'room' + key); emit('sfx', 'win'); }
    if (!R.plug) continue; const shut = R.plug.some(([x, y]) => G.wall[idx(x, y)]); if (!shut) continue; const [ax, ay] = R.plug[0], d = Math.hypot(ax + .5 - p.x, ay + .5 - p.y);
    if (R.clue === 'spore' && d < 14 && Math.floor(clueT / 1.5) !== Math.floor((clueT - dt) / 1.5)) for (const [x, y] of R.plug) if (G.wall[idx(x, y)]) emit('spore', x + .5, y + .9);
    if (R.clue === 'hammer' && G.smith.at === 'shelter' && d < 11 && Math.floor(clueT / 2.4) !== Math.floor((clueT - dt) / 2.4)) { emit('sparks', ax + .5, ay + .7); emit('sfx', 'clink'); } }
});
export const catName = id => CAT_NAME[GOODS[id] && GOODS[id].cat] || '';
export const isPlaceable = id => !!(OBJ[id] && !OBJ[id].sz && ITEMS[id] && ITEMS[id].kind === 'place');
