// ================= 장비·옷·장신구·반지: 입기·벗기, 강화 단계와 효과, 무기 종류·희귀도 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { broochMul, EQ_SLOTS, guardMul, pct2, RING_TXT, RINGS, turtleCut, UPG_DMG, UPG_MAT, UPG_POW } from '../data/gear-animals.js';
import { HOT, ITEMS, RAR, RARITY, WTYPE } from '../data/items.js';
import { AR_K } from '../data/growth.js';
import { josa } from '../engine/util.js';
import { G, started } from '../save/state.js';
import { emit } from './events.js';
import { moveInto } from './inventory.js';
import { defineCmd } from './commands.js';
import { ANIMALS } from '../data/gear-animals.js';
import { head } from '../ui/panels.js';
export const wtOf = w => WTYPE[(w && w.wt) || 'sword'];
export const rarOf = id => RAR[id] != null ? RAR[id] : -1;
export const rarCol = id => rarOf(id) >= 1 ? RARITY[rarOf(id)][1] : null;
// ---- clothes (body) and charms (accessory): two slots; clothes halve the cold or heat gauge, charms come from the deep bosses ----
export const WEAR_PAL = { obsCoat: ['#5a4a78', '#3a2f52', '#8a7ab0'], frostRobe: ['#8fd0f0', '#5a9ac8', '#d8f2ff'] };
export const freshEquip = () => ({ body: null, head: null, neck: null, ring: null, legs: null });
// ---- v83 장비 세트 I·II·III: 세트마다 장비 칸·함께 다니는 펫을 따로 (가방 밖) ----
// 지금 세트는 G.equip·G.petOn이 그대로 맡고, G.eqSets[k]에는 다른 세트의 것만 들어 있어요 (지금 세트 자리는 비어 있음).
export const SET_N = ['I', 'II', 'III'];
export const freshSets = () => [0, 1, 2].map(() => ({ e: null, pet: null }));
// 세트 k의 장비 (지금 세트면 G.equip)
export const setEquip = k => k === (G.eqSet || 0) ? G.equip : (G.eqSets && G.eqSets[k] && G.eqSets[k].e) || null;
export const setPet = k => k === (G.eqSet || 0) ? G.petOn : (G.eqSets && G.eqSets[k] && G.eqSets[k].pet) || null;
export function switchSet(n) { if (!Number.isInteger(n) || n < 0 || n > 2) return false; if (!G.eqSets) G.eqSets = freshSets(); const cur = G.eqSet || 0; if (n === cur) return false;
  const was = G.equip.body && G.equip.body.id;
  G.eqSets[cur] = { e: G.equip, pet: G.petOn }; const nx = G.eqSets[n] || { e: null, pet: null };
  G.equip = nx.e || freshEquip(); G.petOn = nx.pet && (G.pets || {})[nx.pet] ? nx.pet : null; G.petE = G.petOn ? { x: G.p.x - .6, y: G.p.y + .2, flip: false, anim: 0, moving: false } : null;
  G.eqSets[n] = { e: null, pet: null }; G.eqSet = n;
  if ((G.equip.body && G.equip.body.id) !== was) emit('look'); emit('sfx', 'craft'); emit('inv');
  emit('toast', `장비 세트 ${SET_N[n]}로 바꿨어요${G.petOn ? ` · ${ANIMALS[G.petOn].pn}와 함께` : ''}`, 'good', 'eqset'); return true; }
defineCmd('eqSet', c => switchSet(c.n));
// 다른 세트에 넣어 둔 장비도 「가진 것」 (퀘스트 확인용)
export const inOtherSet = id => !!(G && G.eqSets && G.eqSets.some((x, k) => k !== (G.eqSet || 0) && x && x.e && EQ_SLOTS.some(([sl]) => x.e[sl] && x.e[sl].id === id)));
export const eqSlotOf = id => { const it = ITEMS[id]; return !it ? null : it.kind === 'wear' ? it.slot : null; };
export const wearing = id => !!(G && G.equip && EQ_SLOTS.some(([sl]) => G.equip[sl] && G.equip[sl].id === id));
export const eqCopy = s => { const c = { id: s.id, c: 1 }; if (s.dur != null) c.dur = s.dur; if (s.lv) c.lv = s.lv; return c; };
export function wearItem(i) { const s = G.inv[i], it = s && ITEMS[s.id], sl = s && eqSlotOf(s.id); if (!sl) return;
  if (!rlvOk(s.id)) { emit('toast', `${it.n}은(는) Lv.${rlvOf(s.id)}부터 입을 수 있어요`, 'bad', 'rlv'); emit('sfx', 'clink'); return; } // v100 착용 레벨
  const old = G.equip[sl];
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
// v100: 방어력이 있는 옷은 「방어력 N」을 앞에
export function upgText(id, lv) { const it = ITEMS[id], t = upgText0(id, lv); if (!it || !it.def) return t; const d = `방어력 ${defOf(it, lv)}`; return t ? `${d} · ${t}` : d; }
function upgText0(id, lv) { const it = ITEMS[id];
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
// v99 착용 레벨: 레벨이 모자라면 들 수 없어요 (무기 rlv, v100부터 방어구도)
export const rlvOf = id => (ITEMS[id] && ITEMS[id].rlv) || 1;
export const rlvOk = id => rlvOf(id) <= ((G && G.rpg && G.rpg.lv) || 1);
// v100 방어력: 입은 옷(지금 세트)의 방어력 합계, 강화 +8%/단계 · 받는 피해 × 50 / (50 + 방어력)
export const defOf = (it, lv) => Math.round(it.def * (1 + UPG_DMG * (lv || 0)));
export const armorDef = () => { let d = 0; if (!G || !G.equip) return 0; for (const [sl] of EQ_SLOTS) { const e = G.equip[sl], it = e && ITEMS[e.id]; if (it && it.def) d += defOf(it, lvOf(e)); } return d; };
export const armorMul = () => AR_K / (AR_K + armorDef());
// 방어구 상의 색 (Claude 임시: 단계 재료 색)
Object.assign(WEAR_PAL, { armorMoss: ['#7fb069', '#4f7a45', '#b8dca0'], armorCopper: ['#d9824a', '#a85a2e', '#f0b080'], armorIron: ['#aab4c4', '#6e7888', '#dfe6ee'], armorCrystal: ['#b493f5', '#7d5fc0', '#e0d0ff'], armorObsidian: ['#4a3a5a', '#2a2238', '#ffd25c'], armorFrost: ['#9fd8f0', '#5a9ac8', '#e8f8ff'] });
