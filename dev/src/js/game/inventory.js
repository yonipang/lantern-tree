// ================= inventory =================
const invSize = () => HOT + BAG0 + BAG_STEP * ((G && G.bagLv) || 0);
const isMat = it => !it.kind || it.kind === 'ground' || it === ITEMS.dirt || !!it.mat;
const stackMax = id => ITEMS[id].stack || (isMat(ITEMS[id]) ? 999 : 99);
// bag kinds for the tabs and for sorting
const BAG_TABS = [['all', '전체'], ['equip', '장비'], ['mat', '재료'], ['food', '음식'], ['deco', '꾸미기'], ['seed', '씨앗']];
function bagCat(id) { const it = ITEMS[id], k = it.kind; if (['pick', 'sword', 'rod', 'shovel', 'sickle', 'wcan', 'wear', 'recall', 'arrow'].includes(k)) return 'equip'; if (k === 'food') return 'food'; if (k === 'seed' || k === 'fert') return 'seed'; if (isMat(it) || k === 'key') return 'mat'; return 'deco'; }
let invDirty = true;
function addItem(id, c, count = true) {
  if (ITEMS[id] && ITEMS[id].note) { learnRecipe(ITEMS[id].note); return 0; } // recipe notes teach a dish instead of taking a bag slot
  let left = c; const inv = G.inv, mx = stackMax(id);
  for (let i = 0; i < inv.length && left > 0; i++) { const s = inv[i]; if (s && s.id === id && s.c < mx) { const k = Math.min(mx - s.c, left); s.c += k; left -= k; } }
  // new stacks go into the bag; the hotbar is only used when the bag is full (the player arranges the hotbar)
  const order = [...Array(inv.length - HOT).keys()].map(k => k + HOT).concat([...Array(HOT).keys()]);
  for (const i of order) { if (left <= 0) break; if (!inv[i]) { const k = Math.min(mx, left); inv[i] = { id, c: k }; if (DUR[id]) inv[i].dur = DUR[id][0]; left -= k; G.newIds = G.newIds || {}; G.newIds[id] = 1; } }
  const got = c - left;
  if (got > 0 && rarOf(id) >= 3 && (ITEMS[id].kind === 'sword' || ITEMS[id].kind === 'pick')) { G.stats.epicSeen = G.stats.epicSeen || {}; G.stats.epicSeen[id] = 1; }
  if (got > 0 && ITEMS[id].kind === 'sword') autoHotWeapon(id);
  if (count && got > 0) { const S = G.stats; if (id === 'wood') S.wood += got; if (id === 'copperOre') S.copperOre += got; if (id === 'copperBar') S.copperBar += got; if (id === 'lightSeed') S.seedsFound += got; }
  invDirty = true; return left;
}
// 'anyFish' / 'anyPetal' in a recipe take any fish / any petal
const WILD = { anyFish: it => !!it.fish, anyPetal: it => !!it.petal };
const idIs = (sid, id) => sid === id || (!!WILD[id] && !!ITEMS[sid] && WILD[id](ITEMS[sid]));
const countItem = id => G.inv.reduce((a, s) => a + (s && idIs(s.id, id) ? s.c : 0), 0);
function removeItem(id, c) { for (let i = G.inv.length - 1; i >= 0 && c > 0; i--) { const s = G.inv[i]; if (s && idIs(s.id, id)) { const k = Math.min(s.c, c); s.c -= k; c -= k; if (!s.c) G.inv[i] = null; } } invDirty = true; }
// ---- durability: tools wear with use; at 0 they are broken (kept, but unusable) until repaired at a workbench ----
// [max uses, full repair cost]
const DUR = { pickWood: [200, [['wood', 3]]], pickCopper: [400, [['copperBar', 2]]], pickIron: [800, [['ironBar', 2]]],
  swordWood: [120, [['wood', 3]]], swordCopper: [250, [['copperBar', 2]]], swordIron: [450, [['ironBar', 2]]], swordCrystal: [800, [['crystal', 3]]],
  rod: [150, [['fiber', 2]]], shovel: [250, [['copperBar', 1]]] };
Object.assign(DUR, WEAPON_DUR, DUR2); DUR.battery = [600, [['glowcap', 1], ['gel', 2]]];
const durMax = id => DUR[id] ? DUR[id][0] : 0;
const durOf = s => !s || !DUR[s.id] ? 0 : (s.dur == null ? DUR[s.id][0] : s.dur);
const isBroken = s => !!(s && DUR[s.id] && durOf(s) <= 0);
function wear(s, n = 1) {
  if (!s || !DUR[s.id] || isBroken(s)) return; const mx = DUR[s.id][0], before = durOf(s); s.dur = Math.max(0, before - n); invDirty = true;
  const nm = ITEMS[s.id].n;
  if (s.dur <= 0) { toast(`${josa(nm, '이', '가')} 망가졌어요! 장비제작대에서 고칠 수 있어요`, null, 'broke' + s.id); SFX.clink(); }
  else if (before > mx * .2 && s.dur <= mx * .2) toast(`${josa(nm, '이', '가')} 많이 닳았어요 (${s.dur}/${mx})`, null, 'worn' + s.id);
}
function repairCost(s) { const mx = durMax(s.id), frac = 1 - durOf(s) / mx; return DUR[s.id][1].map(([id, c]) => [id, Math.max(1, Math.ceil(c * frac))]); }
// ---- salvage: break equipment down at a workbench and get 70% of its crafting materials back (rounded) ----
const SALVAGE_RATE = 0.7, SALVAGE_BASE = { pickWood: [['wood', 3]], swordWood: [['wood', 3]] }; // starter tools have no recipe
function salvageGet(id) { const r = RECIPES.find(r => r.out === id), req = r ? r.req : SALVAGE_BASE[id]; if (!req) return null; return req.map(([m, c]) => [m, Math.round(c * SALVAGE_RATE)]).filter(([, c]) => c > 0); }
function salvGet2(s) { const m = new Map(); for (const [id, c] of salvageGet(s.id) || []) m.set(id, (m.get(id) || 0) + c); for (const [id, c] of upgSpent(s.id, lvOf(s))) m.set(id, (m.get(id) || 0) + Math.floor(c / 2)); const out = [...m].filter(([, c]) => c > 0); return out.length ? out : null; }
const canSalv = near => near.has('smelter'); // v61: only at the 장비제작대
const upgSlot = i => typeof i === 'string' && i.startsWith('e:') ? G.equip[i.slice(2)] : G.inv[i];
function upgListHTML(ok) {
  const list = [...EQ_SLOTS.map(([sl, n]) => ({ s: G.equip[sl], i: 'e:' + sl, tag: n + ' 칸' })), ...G.inv.map((s, i) => ({ s, i, tag: '' }))].filter(({ s }) => s && upgOk(s.id));
  let h = `<div class="sh-body"><p class="hint">${ok ? `재료를 넣어 장비를 강화해요 (최대 +${UPG_MAX}). 무기는 공격력, 곡괭이는 캐는 힘, 옷·장신구·반지는 효과가 좋아져요.` : '장비제작대 근처에서 강화할 수 있어요.'}</p><div class="list">`;
  if (!list.length) h += `<p class="prose" style="color:var(--muted);text-align:center;margin-top:18px">강화할 장비가 없어요</p>`;
  for (const { s, i, tag } of list) { const lv = lvOf(s), max = lv >= UPG_MAX, cost = max ? [] : upgCost(s.id, lv), can = ok && !max && cost.every(([id, c]) => availCount(id) >= c);
    h += `<div class="rc ${can ? 'ok' : 'no'}"><div class="ri"><img class="px" src="${iconURL(s.id)}" alt=""></div><div class="rn">${rarName(s.id)}${lv ? ` +${lv}` : ''}${tag ? `<small>${tag}</small>` : ''}<div class="ings"><span class="ing">${upgText(s.id, lv)}${max ? ' · 최고 단계' : ` → ${upgText(s.id, lv + 1)}`}</span>${cost.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c}</span>`; }).join('')}</div></div><button type="button" class="btn mk" data-a="upg" data-i="${i}" ${can ? '' : 'disabled'}>${max ? '최고' : `+${lv + 1}`}</button></div>`; }
  return h + `</div></div>`; }
const usableItem = id => G.inv.some(s => s && s.id === id && !isBroken(s));
function bestPick() { let b = { power: 0.5, tier: 0, id: 'hand' }; const h = G.inv[G.sel]; // v48: a pickaxe held in the hotbar is the one used
  if (h && ITEMS[h.id] && ITEMS[h.id].kind === 'pick' && !isBroken(h)) return { ...ITEMS[h.id], id: h.id, slot: h, power: ITEMS[h.id].power * (1 + UPG_POW * lvOf(h)) };
  for (const s of G.inv) { if (!s || ITEMS[s.id].kind !== 'pick' || isBroken(s)) continue; const pw = ITEMS[s.id].power * (1 + UPG_POW * lvOf(s)); if (pw > b.power) b = { ...ITEMS[s.id], id: s.id, slot: s, power: pw }; } return b; }
// v48: the weapon held in the hotbar is the weapon (there is no weapon slot any more); otherwise the fist
const FIST = { n: '주먹', dmg: 3, id: 'hand', wt: 'fist' };
const wpOf = s => { const it = ITEMS[s.id]; return { ...it, id: s.id, slot: s, dmg: it.dmg * (1 + UPG_DMG * lvOf(s)) }; }; // v43: each upgrade level adds 8% damage
function curWeapon() { const s = selItem(), it = s && ITEMS[s.id]; return it && it.kind === 'sword' && !isBroken(s) ? wpOf(s) : FIST; }
const wRange = W => W.range * (W.ranged === 'arrow' ? 1 + skl('hawk') * .15 : 1); // v44 매의 눈
const atkCd = () => { const W = wtOf(curWeapon()); return W.cd * atkSpd() * (W.ranged ? 1 : 1 - skl('warrior') * .03); };
const selItem = () => G.inv[G.sel];

