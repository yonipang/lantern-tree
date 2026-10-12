// ================= inventory =================
const invSize = () => HOT + BAG0 + BAG_STEP * ((G && G.bagLv) || 0);
const isMat = it => !it.kind || it.kind === 'ground' || it === ITEMS.dirt || !!it.mat;
const stackMax = id => ITEMS[id].stack || (isMat(ITEMS[id]) ? 999 : 99);
// bag kinds for the tabs and for sorting
const BAG_TABS = [['all', '전체'], ['equip', '장비'], ['mat', '재료'], ['food', '음식'], ['deco', '꾸미기'], ['seed', '씨앗']];
function bagCat(id) { const it = ITEMS[id], k = it.kind; if (['pick', 'axe', 'lasso', 'sword', 'rod', 'shovel', 'sickle', 'wcan', 'wear', 'recall', 'arrow'].includes(k)) return 'equip'; if (k === 'food') return 'food'; if (k === 'seed' || k === 'fert') return 'seed'; if (isMat(it) || k === 'key') return 'mat'; return 'deco'; }
let invDirty = true;
function addItem(id, c, count = true) {
  if (ITEMS[id] && ITEMS[id].note) { learnRecipe(ITEMS[id].note); return 0; } // recipe notes teach a dish instead of taking a bag slot
  if (isTool(id) && G.tools) { for (let k = 0; k < c; k++) { const t = { id, c: 1 }; if (DUR[id]) t.dur = DUR[id][0]; G.tools.push(t); } G.newIds = G.newIds || {}; G.newIds[id] = 1; invDirty = true; return 0; } // v65: tools go into the tool pouch
  let left = c; const inv = G.inv, mx = stackMax(id);
  for (let i = 0; i < inv.length && left > 0; i++) { const s = inv[i]; if (s && s.id === id && s.c < mx) { const k = Math.min(mx - s.c, left); s.c += k; left -= k; } }
  // v65: new stacks go into an empty hotbar slot first, then the bag
  const order = [...Array(HOT).keys()].concat([...Array(inv.length - HOT).keys()].map(k => k + HOT));
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
const countItem = id => G.inv.concat(G.tools || []).reduce((a, s) => a + (s && idIs(s.id, id) ? s.c : 0), 0);
function removeItem(id, c) { for (let i = G.inv.length - 1; i >= 0 && c > 0; i--) { const s = G.inv[i]; if (s && idIs(s.id, id)) { const k = Math.min(s.c, c); s.c -= k; c -= k; if (!s.c) G.inv[i] = null; } }
  const T = G.tools || []; for (let i = T.length - 1; i >= 0 && c > 0; i--) if (idIs(T[i].id, id)) { const h = heldTool(); T.splice(i, 1); c--; fixTsel(h); } invDirty = true; }
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
function salvageGet(id) { const r = RECIPES.find(r => r.out === id), req = r ? r.req : SALVAGE_BASE[id]; if (!req) return null; return req.map(([m, c]) => [m, Math.round(c * SALVAGE_RATE)]).filter(([, c]) => c > 0); }
function salvGet2(s) { const m = new Map(); for (const [id, c] of salvageGet(s.id) || []) m.set(id, (m.get(id) || 0) + c); for (const [id, c] of upgSpent(s.id, lvOf(s))) m.set(id, (m.get(id) || 0) + Math.floor(c / 2)); const out = [...m].filter(([, c]) => c > 0); return out.length ? out : null; }
const canSalv = near => near.has('smelter'); // v61: only at the 장비제작대
const upgSlot = i => itemAt(i);
function upgListHTML(ok) {
  const list = [...EQ_SLOTS.map(([sl, n]) => ({ s: G.equip[sl], i: 'e:' + sl, tag: n + ' 칸' })), ...slotList().map(x => ({ ...x, tag: typeof x.i === 'string' ? '도구' : '' }))].filter(({ s }) => s && upgOk(s.id));
  let h = `<div class="sh-body"><p class="hint">${ok ? `재료를 넣어 장비를 강화해요 (최대 +${UPG_MAX}). 무기는 공격력, 곡괭이는 캐는 힘, 옷·장신구·반지는 효과가 좋아져요.` : '장비제작대 근처에서 강화할 수 있어요.'}</p><div class="list">`;
  if (!list.length) h += `<p class="prose" style="color:var(--muted);text-align:center;margin-top:18px">강화할 장비가 없어요</p>`;
  for (const { s, i, tag } of list) { const lv = lvOf(s), max = lv >= UPG_MAX, cost = max ? [] : upgCost(s.id, lv), can = ok && !max && cost.every(([id, c]) => availCount(id) >= c);
    h += `<div class="rc ${can ? 'ok' : 'no'}"><div class="ri"><img class="px" src="${iconURL(s.id)}" alt=""></div><div class="rn">${rarName(s.id)}${lv ? ` +${lv}` : ''}${tag ? `<small>${tag}</small>` : ''}<div class="ings"><span class="ing">${upgText(s.id, lv)}${max ? ' · 최고 단계' : ` → ${upgText(s.id, lv + 1)}`}</span>${cost.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c}</span>`; }).join('')}</div></div><button type="button" class="btn mk" data-a="upg" data-i="${i}" ${can ? '' : 'disabled'}>${max ? '최고' : `+${lv + 1}`}</button></div>`; }
  return h + `</div></div>`; }
const usableItem = id => G.inv.concat(G.tools || []).some(s => s && s.id === id && !isBroken(s));
function bestPick() { let b = { power: 0.5, tier: 0, id: 'hand' }; const h = selItem(); // v48: a pickaxe held is the one used (v65: from the tool slot)
  if (h && ITEMS[h.id] && ITEMS[h.id].kind === 'pick' && !isBroken(h) && (G.sel >= 0 || G.tHand)) return { ...ITEMS[h.id], id: h.id, slot: h, power: ITEMS[h.id].power * (1 + UPG_POW * lvOf(h)) };
  for (const s of G.inv.concat(G.tools || [])) { if (!s || ITEMS[s.id].kind !== 'pick' || isBroken(s)) continue; const pw = ITEMS[s.id].power * (1 + UPG_POW * lvOf(s)); if (pw > b.power) b = { ...ITEMS[s.id], id: s.id, slot: s, power: pw }; } return b; }
// v48: the weapon held in the hotbar is the weapon (there is no weapon slot any more); otherwise the fist
const FIST = { n: '주먹', dmg: 3, id: 'hand', wt: 'fist' };
const wpOf = s => { const it = ITEMS[s.id]; return { ...it, id: s.id, slot: s, dmg: it.dmg * (1 + UPG_DMG * lvOf(s)) }; }; // v43: each upgrade level adds 8% damage
function curWeapon() { const s = selItem(), it = s && ITEMS[s.id]; if (it && it.kind === 'sword' && !isBroken(s)) return wpOf(s); // v65: the attack button always has a weapon
  const all = G.inv.filter(x => x && ITEMS[x.id] && ITEMS[x.id].kind === 'sword' && !isBroken(x)); if (!all.length) return FIST;
  const last = G.lastW && all.find(x => x.id === G.lastW); if (last) return wpOf(last);
  let b = all[0]; for (const x of all) if (wpOf(x).dmg > wpOf(b).dmg) b = x; return wpOf(b); }
const wRange = W => W.range * (W.ranged === 'arrow' ? 1 + skl('hawk') * .15 : 1); // v44 매의 눈
const atkCd = () => { const W = wtOf(curWeapon()); return W.cd * atkSpd() * (W.ranged ? 1 : 1 - skl('warrior') * .03); };
const selItem = () => G.sel < 0 ? ((G.tools && G.tools[G.tsel]) || null) : G.inv[G.sel]; // v65: sel −1 = the tool slot

// ================= input =================
const keys = new Set();
const joy = { active: false, id: null, ox: 0, oy: 0, vx: 0, vy: 0 };
const dpad = { id: null, vx: 0, vy: 0 };
let ctrlPref = 'joy'; try { ctrlPref = localStorage.getItem('lantern-tree-ctrl') === 'pad' ? 'pad' : 'joy'; } catch (e) { }
const mouse = { x: 0, y: 0, down: false, last: 0, used: false, over: false };
let btnHeld = false, actCd = 0, holdGroup = null, actQ = 0, holdT = 0, holdK = null;
const aimMouse = () => mouse.used && mouse.over && (mouse.down || performance.now() - mouse.last < 3500);
const actHeld = () => btnHeld || keys.has('Space') || keys.has('KeyE'); // v65: interact (the mouse and J attack)
function mouseWorld() { return { x: (mouse.x * DPR + VIEW.baseX) / TP, y: (mouse.y * DPR + VIEW.baseY) / TP }; }
const REACH = 2.4;
const inReach = (tx, ty) => Math.hypot(tx + .5 - G.p.x, ty + .5 - G.p.y) <= REACH;
function mouseTile() {
  const m = mouseWorld(); let tx = Math.floor(m.x), ty = Math.floor(m.y);
  // wall tops are drawn lifted, so the lower strip of a floor tile visually belongs to the wall below it
  if (inB(tx, ty + 1) && G.wall[idx(tx, ty + 1)] && !(inB(tx, ty) && G.wall[idx(tx, ty)]) && m.y - ty > 1 - LIFT / 16) ty += 1;
  return { x: tx, y: ty, mx: m.x, my: m.y };
}

// ================= actions =================
const GROUP = { attack: 'work', swing: 'work', mine: 'work', chop: 'work', harvest: 'work', harvest3: 'work', water: 'water', fert: 'fert', place: 'place', dig: 'dig', unwire: 'dig' };
function targetTile() {
  const p = G.p; const ptx = Math.floor(p.x), pty = Math.floor(p.y);
  if (aimMouse()) {
    const m = mouseTile();
    if (m.x !== ptx || m.y !== pty) {
      if (inReach(m.x, m.y)) return { x: m.x, y: m.y };
      let best = null, bd = 1e9;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const tx = ptx + dx, ty = pty + dy; if ((!dx && !dy) || !inReach(tx, ty)) continue; const d = Math.hypot(tx + .5 - m.mx, ty + .5 - m.my); if (d < bd) { bd = d; best = { x: tx, y: ty }; } }
      if (best) { best.far = { x: m.x, y: m.y }; return best; }
    }
  }
  const f = p.face; if (Math.abs(f.x) > Math.abs(f.y)) return { x: ptx + Math.sign(f.x), y: pty }; return { x: ptx, y: pty + (f.y < 0 ? -1 : 1) };
}
function nearestEnemy(range) {
  let best = null, bd = 1e9; const p = G.p;
  for (const e of G.enemies) { const d = Math.hypot(e.x - p.x, e.y - p.y) - ENEMY[e.k].r; if (d < range && d < bd) { bd = d; best = e; } }
  for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st !== 'fight' || b.z > 0.8) continue; const d = Math.hypot(b.x - p.x, b.y - p.y) - BOSSES[k].hr; if (d < range && d < bd) { bd = d; best = b; } }
  return best;
}
// v65: two buttons. The attack button (doAttack in features/controls.js) always attacks. This one — interact — does what fits the
// thing in front: an item held on purpose comes first (seed · watering can · furniture · food …), otherwise a recommendation
// (open · harvest · chop · mine · pick up …) that takes the right tool out of the tool pouch by itself (pickaxe · axe · sickle ·
// shovel; the fishing rod and the watering can only from the small button or when held). Other things that fit go to the small button.
const HOLD_MODE = { sword: 'weapon', pick: 'pick', axe: 'axe', shovel: 'shovel', wcan: 'wcan', fert: 'fert', lasso: 'lasso', rod: 'rod', sickle: 'sickle', food: 'food', wear: 'wear', key: 'key', summon: 'summon', recall: 'recall' };
const holdMode = it => !it ? 'hand' : BUILD_KINDS.includes(it.kind) ? 'build' : HOLD_MODE[it.kind] || 'hand';
const NOTGT = ['eat', 'wear']; // held food · clothes: after a real action in front (opening a chest, …), or first when there is nothing to do
const swingAct = sw => ({ k: 'swing', lbl: wtOf(sw).ranged ? '쏘기' : '휘두르기', icon: sw.id === 'hand' ? 'hand' : sw.id });
// the tool a natural thing needs: trees take an axe (or a pickaxe), rocks and crystals a pickaxe; small plants the hand
function natTool(d) { if (d.nat === 'pick') return null; if (d.nat === 'chop') return bestTool('axe') || bestTool('pick'); return bestTool('pick'); }
function natAct(d, o, t) { const tl = natTool(d); return { k: 'chop', lbl: d.nat === 'pick' ? '줍기' : d.nat === 'mine' ? '캐기' : isYoung(o) ? '베기 3/4' : '베기', icon: tl ? tl.id : 'hand', t, o, tool: tl }; }
function decide() {
  const p = G.p; G.alts = []; if (p.dead > 0 || p.sleep) return { k: 'none', lbl: '…', icon: 'dots' };
  if (p.sit) return { k: 'stand', lbl: '일어나기', icon: 'hand' };
  if (G.fish) return { k: 'reel', lbl: G.fish.st === 'bite' ? '당기기!' : '거두기', icon: 'rod' };
  let s = selItem(); if (s && G.sel < 0 && isBroken(s)) { const nx = bestTool(ITEMS[s.id].kind); if (nx) { holdTool(nx); s = nx; } } // a broken tool gives way to the next one
  const it = s && ITEMS[s.id], md0 = holdMode(it), md = G.sel < 0 && !G.tHand && ['pick', 'axe', 'sickle', 'shovel'].includes(md0) ? 'hand' : md0; // a tool interact took out by itself does not decide anything
  let t = targetTile(), i = inB(t.x, t.y) ? idx(t.x, t.y) : -1, o = i >= 0 ? G.objs.get(i) : null;
  if (o && o.t === '_part') { const ai = anchorAt(i); if (ai >= 0) { i = ai; t = { x: ai % W, y: (ai / W) | 0, far: t.far }; o = G.objs.get(ai); } else o = null; }
  { const ox = Math.floor(p.x), oy = Math.floor(p.y), own = inB(ox, oy) ? G.objs.get(idx(ox, oy)) : null;
    const front = o || (i >= 0 && (G.wall[i] || G.floor[i] === WATER)) || (md === 'build' && canPlace(t.x, t.y, it));
    if (own && isGround(own) && !front) { t = { x: ox, y: oy }; i = idx(ox, oy); o = own; } }
  if (o && OBJ[o.t] && OBJ[o.t].lost) return { k: 'lost', lbl: '되찾기', icon: 'hand', t, o }; // your own dropped bundle comes back whatever you hold
  if (holdT >= .3 && (holdK === 'harvest' || holdK === 'harvest3')) { const sk = bestTool('sickle'); if (sk) { const list = ripeAround(t.x, t.y); if (list.length) return { k: 'harvest3', lbl: '모두 거두기', icon: 'sickle', t, list, tool: sk }; } }
  const main = [], alt = [], has = a => main.concat(alt).some(b => b.k === a.k && b.lbl === a.lbl), push = a => { if (a && !has(a)) (a.onlyAlt ? alt : main).push(a); };
  let h = null, hInfo = null;
  if (md !== 'hand' && md !== 'weapon') { h = heldDecide(md, s, it, t, i, o); if (!h || ['info', 'swing', 'none'].includes(h.k)) { hInfo = h && h.k === 'info' ? h : null; h = null; } }
  if (h && !NOTGT.includes(h.k)) { push(h); if (h.k === 'place' && it.kind === 'place' && rotN(it.obj) > 1) push({ k: 'rot', lbl: '방향', icon: s.id, onlyAlt: 1 }); }
  // when the thing in front is only to look at for now (a growing crop, an animal not ready …) or a held piece cannot go there,
  // picking it up or digging it out is never the big button — those stay on the small one
  const auto = autoOptions(t, i, o), quiet = (auto[0] && auto[0].k === 'info') || (md === 'build' && !h);
  for (const a of auto) if (a.k !== 'info') push(quiet && (a.k === 'pickup' || a.k === 'dig') ? { ...a, onlyAlt: 1 } : a);
  if (h && NOTGT.includes(h.k)) push(h); // food, clothes …: after a real action in front, or first when there is nothing to do
  // a held watering can, rod, fertiliser … explains itself first ("가득 참", "물 없음"); a pickaxe or axe with nothing to do lets the thing in front speak
  const info = (hInfo && !['pick', 'axe', 'sickle', 'shovel'].includes(md) && hInfo) || auto.find(a => a.k === 'info') || hInfo;
  if (!main.length) { G.alts = alt; return info || { k: 'none', lbl: '…', icon: 'dots' }; }
  G.alts = main.slice(1).concat(alt); return main[0];
}
function heldDecide(md, s, it, t, i, o) {
  const d = o && OBJ[o.t], water = i >= 0 && !G.wall[i] && G.floor[i] === WATER, no = (lbl, msg) => ({ k: 'info', lbl, icon: s.id, msg, t });
  const crop = d && d.crop ? Math.max(0, cropStage(o)) : -1;
  switch (md) {
    case 'summon': return summonDecide(it, s);
    case 'recall': return recallDecide(s);
    case 'lasso': { const wa = wildNear(2.8); return wa ? { k: 'lasso', lbl: '포획', icon: 'lasso', w: wa } : no('포획', '올가미 밧줄을 든 채 동물에게 다가가서 눌러요'); }
    case 'build': {
      if (canPlace(t.x, t.y, it)) return { k: 'place', lbl: placeLbl(it), icon: s.id, t };
      if (it.kind === 'wire' && i >= 0 && G.wire.has(i)) return { k: 'unwire', lbl: '전선 걷기', icon: s.id, t };
      if (it.kind === 'seed' && crop >= 3) return { k: 'harvest', lbl: o.star ? '별 수확!' : '수확', icon: d.yield[0][0], t, o }; // harvest, then plant again
      return no(it.kind === 'seed' ? '심을 수 없음' : '놓을 수 없음', it.kind === 'seed' ? '여기엔 심을 수 없어요 · 빈 흙·이끼·버섯흙·수정 모래를 바라보고 눌러요' : '여기엔 놓을 수 없어요 · 빈 곳을 바라보고 눌러요'); }
    case 'shovel': {
      if (isBroken(s)) return no('삽 고장', '삽이 망가졌어요. 장비제작대에서 고칠 수 있어요');
      if (d && (d.bush || d.growTo)) return { k: 'dig', lbl: d.stump ? '뽑기' : '퍼내기', icon: 'shovel', t, o };
      if (i >= 0 && !G.wall[i] && !o) { const f = G.floor[i];
        if (isPlacedFloor(f)) return { k: 'dig', lbl: '걷기', icon: 'shovel', t };
        if (f === 2) return no('흙 땅', '흙은 더 팔 수 없어요. 흙 한 삽은 제작에서 흙으로 만들어요');
        if (TERRAIN[f]) return terrainOk(f) ? { k: 'dig', lbl: f === WATER ? '물 뜨기' : '파기', icon: 'shovel', t } : { k: 'info', lbl: '아직 몰라요', icon: 'dots', msg: `${josa(TERRAIN[f].n, '은', '는')} 아직 옮길 수 없어요 · ${TERRAIN[f].how}`, t }; }
      return no('팔 수 없음', '삽으로는 깔아 둔 바닥·배운 지형·덤불·묘목만 떠요'); }
    case 'wcan':
      if (crop >= 0 && crop < 3) return o.w ? { k: 'info', lbl: `자라는 중 ${crop + 1}/4`, icon: 'dots', msg: cropMsg(o, crop, i), t } : (s.w || 0) > 0 ? { k: 'water', lbl: '물 주기', icon: 'wcan', t, o } : no('물 없음', '물뿌리개가 비었어요 · 물가를 바라보고 눌러 채워요');
      if (water) return (s.w || 0) >= WCAN_MAX ? no('가득 참', '물뿌리개에 물이 가득해요') : { k: 'fill', lbl: '물 채우기', icon: 'wcan', t };
      return no('물 주기', '자라는 작물에 물을 주거나, 물가를 바라보고 눌러 채워요');
    case 'fert':
      if (crop >= 0 && crop < 3) return o.f ? { k: 'info', lbl: `자라는 중 ${crop + 1}/4`, icon: 'dots', msg: cropMsg(o, crop, i), t } : { k: 'fert', lbl: '비료 주기', icon: s.id, t, o };
      return no('비료 주기', '자라는 작물을 바라보고 눌러요');
    case 'sickle':
      if (crop >= 3) return { k: 'harvest', lbl: o.star ? '별 수확!' : '수확', icon: d.yield[0][0], t, o };
      if (d && d.giant) return { k: 'giant', lbl: '거대 수확!', icon: OBJ[o.c] ? OBJ[o.c].yield[0][0] : 'berry', t, o };
      if (d && d.bush && (o.r || 0) <= G.time) return { k: 'harvest', lbl: '따기', icon: 'berry', t, o };
      return no('거두기', '다 자란 작물 앞에서 눌러요 · 꾹 누르면 둘레 3×3을 한 번에 거둬요');
    case 'rod':
      if (water) return isBroken(s) ? no('낚싯대 고장', '낚싯대가 망가졌어요. 장비제작대에서 고칠 수 있어요') : { k: 'fish', lbl: '낚시', icon: 'rod', t };
      return no('낚시', '물을 바라보고 눌러 찌를 던져요');
    case 'food':
      if (it.cake && o && CAKE_TABLES.includes(o.t) && !o.cake) return { k: 'cakeOn', lbl: '올리기', icon: 'festCake', t, o };
      return { k: 'eat', lbl: '먹기', icon: s.id };
    case 'wear': return { k: 'wear', lbl: it.slot === 'body' ? '입기' : '달기', icon: s.id };
    case 'key': return d && d.tree ? { k: 'insert', lbl: '씨앗 심기', icon: 'lightSeed', t } : { k: 'info', lbl: '등불나무로', icon: 'lightSeed', msg: '등불나무 앞에서 누르면 심을 수 있어요' };
    case 'pick': {
      if (isBroken(s)) return no('곡괭이 고장', `${josa(it.n, '이', '가')} 망가졌어요. 장비제작대에서 고칠 수 있어요`);
      if (i >= 0 && G.wall[i] && G.wall[i] !== 8) return { k: 'mine', lbl: '캐기', icon: s.id, t, tool: s };
      if (d && d.nat && d.nat !== 'pick') return { ...natAct(d, o, t), icon: s.id, tool: d.nat === 'chop' && bestTool('axe') ? bestTool('axe') : s };
      return no('캐기', '벽이나 바위를 바라보고 눌러요'); }
    case 'axe': {
      if (isBroken(s)) return no('도끼 고장', `${josa(it.n, '이', '가')} 망가졌어요. 장비제작대에서 고칠 수 있어요`);
      if (d && d.nat === 'chop') return { ...natAct(d, o, t), icon: s.id, tool: s };
      return no('베기', '나무를 바라보고 눌러요'); }
  }
  return null;
}
// what fits the thing in front, best first (onlyAlt: never on the big button, only on the small one)
function autoOptions(t, i, o) {
  const p = G.p, L = [], A = a => { if (a) L.push(a); }, sh = bestTool('shovel'), rod = bestTool('rod'), can = bestTool('wcan');
  const dig = (lbl, oo) => sh ? { k: 'dig', lbl, icon: 'shovel', t, o: oo, tool: sh, onlyAlt: 1 } : null;
  if (o) {
    const d = OBJ[o.t];
    if (d.growTo) { const st = treeStep(o), into = d.stump && OBJ[o.g] ? OBJ[o.g].n : d.into, mins = s2 => Math.max(1, Math.ceil(s2 / 60)), r = (o.at || 0) - G.time;
      A(st < 0 ? { k: 'info', lbl: d.n, icon: 'dots', msg: `${d.n} · ${mins(r - 3 * YOUNG_T)}분쯤 뒤 새순이 돋아요 (삽으로 뽑을 수 있어요)`, t }
        : { k: 'info', lbl: `자라는 중 ${st + 1}/4`, icon: 'dots', msg: `${into} ${['묘목', '어린나무'][st]} (${st + 1}/4단계) · ${mins(r)}분쯤 뒤 다 자라요${st ? ' · 한 단계 더 크면 벨 수 있어요' : ''}`, t });
      A(dig(d.stump ? '뽑기' : '퍼내기', o)); return L; }
    if (d.tree) { A(countItem('lightSeed') ? { k: 'insert', lbl: '씨앗 심기', icon: 'lightSeed', t } : { k: 'tree', lbl: '살펴보기', icon: 'hand', t }); return L; }
    if (d.giant) { A({ k: 'giant', lbl: '거대 수확!', icon: OBJ[o.c] ? OBJ[o.c].yield[0][0] : 'berry', t, o, tool: bestTool('sickle') }); return L; }
    if (o.cake) A({ k: 'cakeTake', lbl: '가져오기', icon: 'festCake', t, o });
    if (d.lost) { A({ k: 'lost', lbl: '되찾기', icon: 'hand', t, o }); return L; }
    if (d.tchest) { A(o.open ? { k: 'info', lbl: '빈 보물상자', icon: 'dots', msg: '이미 열어 본 보물상자예요', t } : { k: 'treasure', lbl: '상자 열기', icon: 'hand', t, o }); return L; }
    if (d.ranch) { A(ranchReady(o) ? { k: 'ranch', lbl: ANIMALS[o.t].verb, icon: d.ranch, t, o } : { k: 'info', lbl: d.n, icon: 'dots', msg: `${d.n} · ${Math.max(1, Math.ceil(((o.p || 0) - G.time) / 60))}분쯤 뒤에 ${ITEMS[d.ranch].n}${josa(ITEMS[d.ranch].n, '을', '를').slice(ITEMS[d.ranch].n.length)} 얻을 수 있어요`, t });
      if (d.item) A({ k: 'pickup', lbl: '회수', icon: 'hand', t, o }); return L; }
    if (d.station || d.chest) { if (d.station && o.job && jobDone(o.job) > 0) A({ k: 'jobTake', lbl: '꺼내기', icon: o.job.out, t, o }); // v59
      A({ k: 'open', lbl: '열기', icon: 'hand', t, o }); if (!(d.chest && o.items && o.items.some(x => x))) A({ k: 'pickup', lbl: '회수', icon: 'hand', t, o }); return L; }
    if (d.crop) { const cs = Math.max(0, cropStage(o));
      if (cs >= 3) A({ k: 'harvest', lbl: o.star ? '별 수확!' : '수확', icon: d.yield[0][0], t, o, tool: bestTool('sickle') });
      else { A({ k: 'info', lbl: `자라는 중 ${cs + 1}/4`, icon: 'dots', msg: cropMsg(o, cs, i), t }); if (!o.w && can && (can.w || 0) > 0) A({ k: 'water', lbl: '물 주기', icon: 'wcan', t, o, tool: can, onlyAlt: 1 }); }
      return L; }
    if (d.bush) { A((o.r || 0) <= G.time ? { k: 'harvest', lbl: '따기', icon: 'berry', t, o, tool: bestTool('sickle') } : { k: 'info', lbl: '열매 없음', icon: 'dots', msg: '열매가 다시 열리려면 조금 기다려요', t }); A(dig('퍼내기', o)); return L; }
    if (d.shrine) { const gk = guardOf(t.x, t.y); if (o.has && gk && !G.bossDead[gk]) A({ k: 'info', lbl: '봉인됨', icon: 'dots', msg: `${BOSSES[gk].n}을 물리치면 봉인이 풀려요`, t });
      else A(o.has ? { k: 'take', lbl: '빛씨앗', icon: 'lightSeed', t, o } : { k: 'info', lbl: '빈 제단', icon: 'dots', msg: '빈 제단이에요', t }); return L; }
    if (d.nat) { A(natAct(d, o, t)); return L; }
    if (d.item) { const u = USE[o.t]; if (u) A({ k: 'use', u, lbl: u === 'lamp' ? (o.off ? '켜기' : '끄기') : u === 'door' ? (OBJ[o.t].dev === 'slide' && o.pw ? '자동문' : o.open ? '닫기' : '열기') : u === 'farm' ? farmLbl(o) : USE_LBL[u], icon: u === 'farm' ? farmT(o)[4] : 'hand', t, o });
      A({ k: 'pickup', lbl: '회수', icon: 'hand', t, o }); return L; }
  }
  if (i >= 0 && !G.wall[i] && G.floor[i] === WATER) {
    A(rod && !isBroken(rod) ? { k: 'fish', lbl: '낚시', icon: 'rod', t, tool: rod, onlyAlt: 1 } : { k: 'info', lbl: rod ? '낚싯대 고장' : '낚싯대 필요', icon: 'rod', msg: rod ? '낚싯대가 망가졌어요. 장비제작대에서 고칠 수 있어요' : '낚싯대가 있으면 낚시할 수 있어요 (장비제작대 → 도구)', t });
    if (can && (can.w || 0) < WCAN_MAX) A({ k: 'fill', lbl: '물 채우기', icon: 'wcan', t, tool: can, onlyAlt: 1 });
    if (rod) A({ k: 'info', lbl: '물가', icon: 'rod', msg: '작은 버튼의 [낚시]를 누르거나, 도구 칸에서 낚싯대를 들고 눌러요', t }); }
  if (i >= 0 && G.wall[i] && G.wall[i] !== 8) { const pk = bestTool('pick'); A({ k: 'mine', lbl: '캐기', icon: pk ? pk.id : 'hand', t, tool: pk }); }
  if (i >= 0 && !G.wall[i] && !o && isPlacedFloor(G.floor[i])) A(dig('걷기'));
  if (G.petE && G.petOn && Math.hypot(G.petE.x - p.x, G.petE.y - p.y) < 1.4) A({ k: 'petpet', lbl: '쓰다듬기', icon: 'hand' });
  { const wa = wildNear(1.8); if (wa) A({ k: 'info', lbl: ANIMALS[wa.k].n, icon: 'dots', msg: `${ANIMALS[wa.k].n}예요 · 올가미 밧줄(장비제작대)을 도구 칸에서 들고 다가가면 데려갈 수 있어요`, t: { x: Math.floor(wa.x), y: Math.floor(wa.y) } }); }
  return L;
}
const BUILD_KINDS = ['place', 'wall', 'floor', 'ground', 'seed', 'wire'];
const placeLbl = it => it.kind === 'wire' ? '전선 깔기' : it.kind === 'seed' ? '심기' : it.kind === 'wall' ? '쌓기' : it.kind === 'floor' ? '깔기' : it.kind === 'ground' ? (it.ground === WATER ? '붓기' : '덮기') : '놓기';
function pickupObj(t, o) {
  const d = OBJ[o.t]; if (!d.item || (d.chest && o.items && o.items.some(x => x))) return;
  delObj(idx(t.x, t.y)); if (d.bed && G.spawnPt && G.spawnPt.x === t.x && G.spawnPt.y === t.y) G.spawnPt = null;
  returnObj(o, t.x + .5, t.y + .5); SFX.pick(); puff(t.x + .5, t.y + .6, '#e8d8c0', 5, 2); lightDirty = true;
}
function subAction() { if (!started || paused || !G || G.p.dead > 0) return; ensureAudio(); doAlt(); } // v65: the small button
const isGround = o => { const d = OBJ[o.t]; return !d.solid && !!(d.nat || d.crop); };
const cropStage = o => Math.min(3, Math.floor((G.time - o.p) / OBJ[o.t].grow * 3));
function tryAct(edge) {
  const a = G.act; const grp = GROUP[a.k] || null;
  if (edge) { holdGroup = grp; holdK = a.k; }
  else { if (a.k !== 'attack' && (!grp || grp !== holdGroup)) return; }
  perform(a);
}
function faceTo(dx, dy) { const l = Math.hypot(dx, dy) || 1; G.p.face = { x: dx / l, y: dy / l }; }
function perform(a) {
  const p = G.p;
  if (a.tool && a.tool !== selItem() && G.tools && G.tools.includes(a.tool)) holdTool(a.tool, ['rod', 'wcan', 'lasso'].includes(ITEMS[a.tool.id].kind)); // the rod / watering can from the small button stay chosen // v65: the tool the job needs comes out of the pouch and stays in hand
  switch (a.k) {
    case 'attack': {
      if (!aimMouse()) faceTo(a.en.x - p.x, a.en.y - p.y);
      actCd = swingAttack() === false ? 0.3 : atkCd(); break;
    }
    case 'rot': rotatePlace(); actCd = 0.15; break;
    case 'swing': actCd = swingAttack() === false ? 0.3 : atkCd(); break;
    case 'mine': mineWall(a.t); actCd = 0.27; break;
    case 'chop': hitObj(a.t, a.o); actCd = 0.28; break;
    case 'place': placeItem(a.t); actCd = 0.14; break;
    case 'dig': if (a.o) digPlant(a.t, a.o); else digGround(a.t); actCd = 0.22; break;
    case 'unwire': { G.wire.delete(idx(a.t.x, a.t.y)); const l = addItem('wire', 1, false); if (l) spawnDrop('wire', 1, a.t.x + .5, a.t.y + .5); SFX.pick(); actCd = 0.15; break; }
    case 'open': if (a.o.t === 'chest') openPanel('chest', { i: idx(a.t.x, a.t.y) }); else openPanel('craft', { st: OBJ[a.o.t].station, i: idx(a.t.x, a.t.y) }); actCd = 0.3; break;
    case 'harvest': harvest(a.t, a.o); actCd = 0.3; break;
    case 'treasure': openTreasure(a.t, a.o); actCd = 0.4; break;
    case 'harvest3': for (const [x, y, o] of a.list) harvest({ x, y }, o); actCd = 0.35; break;
    case 'water': waterCrop(a.t, a.o); actCd = 0.25; break;
    case 'fert': fertCrop(a.t, a.o); actCd = 0.3; break;
    case 'fill': fillCan(a.t); actCd = 0.4; break;
    case 'eat': eat(G.sel); actCd = 0.4; break;
    case 'wear': wearItem(G.sel); actCd = 0.4; break;
    case 'recall': startRecall(a.mode); actCd = 0.4; break;
    case 'lost': pickLost(a.t, a.o); actCd = 0.3; break;
    case 'giant': harvestGiant(a.t, a.o); actCd = 0.4; break;
    case 'cakeOn': { const s2 = selItem(); if (!s2 || !ITEMS[s2.id].cake || a.o.cake) break; a.o.cake = 1; s2.c--; if (!s2.c) { G.inv[G.sel] = null; refillHot(G.sel, s2.id); } invDirty = true; SFX.place(); puff(a.t.x + .5, a.t.y + .3, '#ffe9a8', 10, 2, .5); toast('탁자 위에 케이크를 올렸어요', 'good', 'cake'); actCd = .4; break; }
    case 'cakeTake': { if (moveInto(G.inv, { id: 'festCake', c: 1 })) { toast('가방이 가득 찼어요', null, 'full'); break; } delete a.o.cake; invDirty = true; SFX.pick(); actCd = .4; break; }
    case 'insert': insertSeeds(); actCd = 0.4; break;
    case 'tree': openPanel('tree'); actCd = 0.3; break;
    case 'summon': summonBoss(a.boss); actCd = 0.6; break;
    case 'take': a.o.has = 0; const left = addItem('lightSeed', 1); if (left) spawnDrop('lightSeed', 1, a.t.x + .5, a.t.y + 1.2); SFX.seed(); puff(a.t.x + .5, a.t.y + .5, '#ffd25c', 14, 3); toast('빛씨앗을 찾았어요! 등불나무로 가져가요', 'good'); actCd = 0.4; break;
    case 'pickup': { const d = OBJ[a.o.t]; delObj(idx(a.t.x, a.t.y)); if (OBJ[a.o.t].bed && G.spawnPt && G.spawnPt.x === a.t.x && G.spawnPt.y === a.t.y) G.spawnPt = null; returnObj(a.o, a.t.x + .5, a.t.y + .5); SFX.pick(); puff(a.t.x + .5, a.t.y + .6, '#e8d8c0', 5, 2); actCd = 0.3; lightDirty = true; break; }
    case 'fish': startFish(a.t); actCd = 0.4; break;
    case 'stand': standUp(); actCd = 0.25; break;
    case 'use': useObj(a); actCd = 0.4; break;
    case 'reel': reel(); actCd = 0.35; break;
    case 'lasso': openCatch(a.w); actCd = .4; break;
    case 'ranch': ranchCollect(a.t, a.o); actCd = .4; break;
    case 'jobTake': takeJob(a.o, a.t.x + .5, a.t.y + .5); actCd = .4; break;
    case 'petpet': { const e = G.petE; hearts(e.x, e.y - .4, 4); SFX.purr ? SFX.purr() : SFX.pick(); toast(`${ANIMALS[G.petOn].pn}${josa(ANIMALS[G.petOn].pn, '이', '가').slice(ANIMALS[G.petOn].pn.length)} 좋아해요`, 'good', 'petpet'); actCd = .6; break; }
    case 'info': if (a.msg) toast(a.msg, null, 'info' + a.msg); actCd = 0.4; break;
  }
}
function swingAttack() {
  const p = G.p, w = curWeapon(), W = wtOf(w); if (aimMouse()) { const m = mouseWorld(); faceTo(m.x - p.x, m.y - (p.y - .45)); } const ang = Math.atan2(p.face.y, p.face.x); G.fish = null;
  if (W.ranged) {
    if (W.mp && (p.mp || 0) < W.mp) { toast('기력이 부족해요. 잠깐 기다리면 다시 차요', null, 'nomp'); SFX.clink(); return false; }
    if (W.mp) p.mp -= W.mp;
    const ar = W.ranged === 'arrow' ? takeArrow() : null; // mineral arrows from the bag, best first
    const crit = rand() < 0.1, dmg = Math.round(w.dmg * (ar ? ar.mul : 1) * (W.magic ? magicMul() : rangeMul()) * (crit ? 1.6 : 1) * (0.9 + rand() * 0.2));
    shootP(ang, { k: W.ranged, dmg, crit, spd: W.spd, range: wRange(W), pierce: W.magic ? 1 : ar ? ar.pierce : 0, col: w.orb || '#bff7ef', tip: ar ? ar.tip : null, slot: w.slot, kb: W.kb != null ? W.kb : W.magic ? 4 : 6, fx: w.fx || (ar && ar.fx) });
    G.swing = { t: 0.18, max: 0.18, ang, icon: w.id, wt: w.wt }; SFX.swing(); return true;
  }
  const big = W.arc > 2, dur = big ? 0.3 : W === WTYPE.dagger ? 0.14 : 0.22;
  G.swing = { t: dur, max: dur, ang, icon: w.id === 'hand' ? null : w.id, wt: w.wt, arc: big ? 2 : 1.2, rad: big ? 1.2 : 0.95 };
  SFX.swing(); if (big) shake = Math.max(shake, 0.12);
  const hit = (e, rr) => { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > W.reach + rr) return false; let da = Math.abs(Math.atan2(dy, dx) - ang); if (da > Math.PI) da = 2 * Math.PI - da; return da < W.arc || d < 0.6 + rr; };
  const roll = () => { const crit = rand() < 0.1 + (W.crit || 0); return [Math.round(w.dmg * meleeMul() * (crit ? 1.6 : 1) * (0.9 + rand() * 0.2)), crit]; };
  let landed = false;
  for (const e of G.enemies.slice()) if (hit(e, ENEMY[e.k].r)) { const [dmg, crit] = roll(); hitEnemy(e, dmg, crit, W.kb, w.fx); landed = true; }
  for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && hit(b, BOSSES[k].hr)) { if (b.z > 0.7) ftext(b.x, b.y - 2, '빗나감', '#bfaed3'); else { const [dmg, crit] = roll(); hitBoss(b, dmg, crit, w.fx); landed = true; } } }
  if (landed) wear(w.slot);
  return true;
}
function shootP(ang, o) { const p = G.p; G.pshots.push(Object.assign({ x: p.x + Math.cos(ang) * .3, y: p.y + Math.sin(ang) * .3, vx: Math.cos(ang) * o.spd, vy: Math.sin(ang) * o.spd, life: o.range / o.spd, hit: [], ang }, o)); }
function updatePShots(dt) {
  for (let i = G.pshots.length - 1; i >= 0; i--) {
    const s = G.pshots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; const tx = Math.floor(s.x), ty = Math.floor(s.y);
    if (s.life <= 0 || !inB(tx, ty) || G.wall[idx(tx, ty)]) { puff(s.x, s.y - .3, s.k === 'arrow' ? '#e8d8c0' : s.col, 4, 1.5, .2); G.pshots.splice(i, 1); continue; }
    let done = false;
    for (const e of G.enemies.slice()) { if (s.hit.includes(e)) continue; if (Math.hypot(e.x - s.x, e.y - s.y) < ENEMY[e.k].r + 0.28) { hitEnemy(e, s.dmg, s.crit, s.kb || 6, s.fx); s.hit.push(e); s.landed = true; if (!s.pierce) { done = true; break; } } }
    if (!done) for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st !== 'fight' || b.z > 0.7 || s.hit.includes(b)) continue; if (Math.hypot(b.x - s.x, b.y - s.y) < BOSSES[k].hr + 0.28) { hitBoss(b, s.dmg, s.crit, s.fx); s.hit.push(b); s.landed = true; if (!s.pierce) { done = true; break; } } }
    if (s.landed && s.slot && !s.worn) { wear(s.slot); s.worn = true; }
    if (done) G.pshots.splice(i, 1);
  }
}
