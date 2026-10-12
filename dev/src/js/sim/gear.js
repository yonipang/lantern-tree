// ================= 장비·옷·장신구·반지: 입기·벗기, 강화 단계와 효과, 무기 종류·희귀도 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { broochMul, EQ_SLOTS, guardMul, pct2, RING_TXT, RINGS, turtleCut, UPG_DMG, UPG_MAT, UPG_POW } from '../data/gear-animals.js';
import { HOT, ITEMS, RAR, RARITY, WTYPE } from '../data/items.js';
import { josa } from '../engine/util.js';
import { G, started } from '../save/state.js';
import { emit } from './events.js';
import { moveInto } from './inventory.js';
import { head } from '../ui/panels.js';
export const wtOf = w => WTYPE[(w && w.wt) || 'sword'];
export const rarOf = id => RAR[id] != null ? RAR[id] : -1;
export const rarCol = id => rarOf(id) >= 1 ? RARITY[rarOf(id)][1] : null;
// ---- clothes (body) and charms (accessory): two slots; clothes halve the cold or heat gauge, charms come from the deep bosses ----
export const WEAR_PAL = { obsCoat: ['#5a4a78', '#3a2f52', '#8a7ab0'], frostRobe: ['#8fd0f0', '#5a9ac8', '#d8f2ff'] };
export const freshEquip = () => ({ body: null, head: null, neck: null, ring: null });
export const eqSlotOf = id => { const it = ITEMS[id]; return !it ? null : it.kind === 'wear' ? it.slot : null; };
export const wearing = id => !!(G && G.equip && EQ_SLOTS.some(([sl]) => G.equip[sl] && G.equip[sl].id === id));
export const eqCopy = s => { const c = { id: s.id, c: 1 }; if (s.dur != null) c.dur = s.dur; if (s.lv) c.lv = s.lv; return c; };
export function wearItem(i) { const s = G.inv[i], it = s && ITEMS[s.id], sl = s && eqSlotOf(s.id); if (!sl) return; const old = G.equip[sl];
  G.equip[sl] = eqCopy(s);
  G.inv[i] = old ? eqCopy(old) : null; // the clothes taken off go where the new ones were
  if (sl === 'body') emit('look'); emit('sfx', 'craft'); emit('puff', G.p.x, G.p.y - .5, sl === 'body' ? (WEAR_PAL[s.id] || ['#fff'])[0] : '#ffe9a8', 12, 2.2, .5);
  emit('toast', `${josa(it.n, '을', '를')} ${sl === 'body' ? '입었어요' : '달았어요'}`, 'good', 'wear'); emit('inv'); }
export function unwear(slot) { const s = G.equip[slot]; if (!s) return; const left = moveInto(G.inv, eqCopy(s)); if (left) { emit('toast', '가방이 가득 찼어요', null, 'full'); return; } G.equip[slot] = null; if (slot === 'body') emit('look'); emit('sfx', 'place'); emit('inv'); }
// v48: a weapon picked up or made while no weapon sits in the hotbar goes into an empty hotbar slot, ready to hold
export function autoHotWeapon(id) { if (!G || ITEMS[id].kind !== 'sword') return; for (let k = 0; k < HOT; k++) { const x = G.inv[k]; if (x && ITEMS[x.id] && ITEMS[x.id].kind === 'sword') return; }
  const to = G.inv.slice(0, HOT).findIndex(x => !x), k = G.inv.findIndex((x, j) => j >= HOT && x && x.id === id); if (to < 0 || k < 0) return;
  G.inv[to] = G.inv[k]; G.inv[k] = null; emit('inv'); if (started) emit('toast', `${josa(ITEMS[id].n, '을', '를')} 단축칸에 넣었어요 · 골라 들면 칼 버튼이 그 무기로 싸워요`, 'good', 'wphot'); }
export const lvOf = s => (s && s.lv) || 0;
export const upgOk = id => { const it = ITEMS[id]; return !!it && (it.kind === 'sword' || it.kind === 'pick' || it.kind === 'axe' || it.kind === 'wear'); };
export const upgTier = id => { const r = rarOf(id); return r >= 0 ? Math.min(4, r) : 3; }; // clothes and charms from the deep caves count as heroic
export function upgCost(id, lv) { const t = upgTier(id), c = [[UPG_MAT[t], 2 + 2 * lv]]; if (lv >= 2) c.push(t <= 1 ? ['glowcap', 2 * (lv - 1)] : ['cryGem', lv - 1]); return c; }
export function upgSpent(id, lv) { const m = {}; for (let k = 0; k < lv; k++) for (const [x, c] of upgCost(id, k)) m[x] = (m[x] || 0) + c; return Object.entries(m); }
export const eqLv = id => { if (!G || !G.equip) return -1; for (const [sl] of EQ_SLOTS) { const e = G.equip[sl]; if (e && e.id === id) return lvOf(e); } return -1; };
export const ringV = k => { const e = G && G.equip && G.equip.ring, R = e && RINGS[e.id]; return R && R[1] === k ? R[2] + R[3] * lvOf(e) : 0; };
export function upgText(id, lv) { const it = ITEMS[id];
  if (it.kind === 'sword') return `공격력 ${Math.round(it.dmg * (1 + UPG_DMG * lv))}`;
  if (it.kind === 'pick') return `캐는 힘 ${+(it.power * (1 + UPG_POW * lv)).toFixed(1)}`;
  if (it.kind === 'axe') return `베는 힘 ${+(it.power * (1 + UPG_POW * lv)).toFixed(1)}`;
  if (it.ring) return RING_TXT[it.ring](RINGS[id][2] + RINGS[id][3] * lv);
  if (it.guard) return `${it.guard === 'hot' ? '더위' : '추위'} 게이지 ${pct2(guardMul(lv))} 속도`;
  if (id === 'turtleCharm') return `불·용암 피해 -${pct2(turtleCut(lv))}`;
  if (id === 'snowBrooch') return `얼어 느려지는 시간 ${pct2(broochMul(lv))}`;
  if (id === 'woolHat') return `추위 게이지 ${pct2(.85 - .03 * lv)} 속도`;
  return ''; }
export const hatMul = () => wearing('woolHat') ? .85 - .03 * eqLv('woolHat') : 1;
export function eqEffect(sl, s) {
  if (!s) return sl === 'ring' ? '비어 있어요 · 장비제작대에서 만들어요' : '비어 있어요';
  return (s.lv ? `강화 +${s.lv} · ` : '') + upgText(s.id, lvOf(s)); }
