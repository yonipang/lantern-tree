// ================= 상호작용 버튼: 무엇을 할지 고르기(decide)·하기(perform)·목표 칸, 물체 쓰기, 작은 버튼 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { CAKE_TABLES } from '../data/automation-tiers.js';
import { BATT_MAX, FUEL, FUEL_MAX } from '../data/circuits-regions.js';
import { WCAN_MAX } from '../data/farming-cooking.js';
import { ANIMALS } from '../data/gear-animals.js';
import { COMPLIMENTS, ITEMS, OBJ, TIPS, USE, USE_LBL } from '../data/items.js';
import { BKEYS, BOSSES, ENEMY, TERRAIN, YOUNG_T } from '../data/rpg-nature.js';
import { fxRand } from '../engine/random.js';
import { josa } from '../engine/util.js';
import { G, guardOf } from '../save/state.js';
import { openCatch, ranchCollect, ranchReady, wildNear } from './animals.js';
import { summonBoss, summonDecide } from './bosses.js';
import { BUILD_KINDS, doorGroup, isGround, placeItem, placeLbl, rotatePlace, rotN, rotOf } from './building.js';
import { atkCd, swingAttack } from './combat.js';
import { ctlOf, defineCmd } from './commands.js';
import { jobDone, takeJob } from './crafting.js';
import { spawnDrop } from './drops.js';
import { emit } from './events.js';
import { cropMsg, farmHarvest, farmLbl, farmStage, farmT, fertCrop, fillCan, growOf, harvestGiant, ripeAround, waterCrop } from './farming.js';
import { reel, startFish } from './fishing.js';
import { harvest, hitObj, mineWall } from './gathering.js';
import { wearItem, wtOf } from './gear.js';
import { addItem, bestTool, countItem, holdTool, isBroken, moveInto, refillHot, removeItem, returnObj, selItem, wear } from './inventory.js';
import { digPlant, isYoung, treeStep, WATER } from './nature.js';
import { eat, maxHp, sleepIn, standUp } from './player.js';
import { pickLost, recallDecide, startRecall } from './survival.js';
import { onFrame } from './systems.js';
import { insertSeeds } from './tree.js';
import { openTreasure } from '../world/gen.js';
import { idx, inB, W } from '../world/map.js';
import { anchorAt, canPlace, delObj, digGround, fpOf, isPlacedFloor, occupied, terrainOk } from '../world/tiles.js';
import { markLight } from './loop.js';
onFrame('act', dt => { // 상호작용 버튼 (매 프레임 순서표 sim/systems.js)
  const p = G.p, ctl = ctlOf(p);
  G.act = decide(); G.actCd -= dt; if (G.swing) { G.swing.t -= dt; if (G.swing.t <= 0) G.swing = null; }
  const held = ctl.act && p.dead <= 0 && !p.sleep; G.actQ = Math.max(0, G.actQ - dt);
  if (p.dead > 0) G.actQ = 0;
  if (G.actQ > 0 && G.actCd <= 0) { G.actQ = 0; tryAct(true); } else if (held && G.actCd <= 0) tryAct(false);
  if (!held && G.actQ <= 0) { G.holdGroup = null; G.holdK = null; }
  G.holdT = held ? G.holdT + dt : 0;
});
export const REACH = 2.4;
export const inReach = (tx, ty) => Math.hypot(tx + .5 - G.p.x, ty + .5 - G.p.y) <= REACH;
// ================= actions =================
export const GROUP = { attack: 'work', swing: 'work', mine: 'work', chop: 'work', harvest: 'work', harvest3: 'work', water: 'water', fert: 'fert', place: 'place', dig: 'dig', unwire: 'dig' };
export function targetTile() {
  const p = G.p; const ptx = Math.floor(p.x), pty = Math.floor(p.y);
  const aim = ctlOf(p).aim;
  if (aim) {
    const m = { x: aim.tx, y: aim.ty, mx: aim.x, my: aim.y };
    if (m.x !== ptx || m.y !== pty) {
      if (inReach(m.x, m.y)) return { x: m.x, y: m.y };
      let best = null, bd = 1e9;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const tx = ptx + dx, ty = pty + dy; if ((!dx && !dy) || !inReach(tx, ty)) continue; const d = Math.hypot(tx + .5 - m.mx, ty + .5 - m.my); if (d < bd) { bd = d; best = { x: tx, y: ty }; } }
      if (best) { best.far = { x: m.x, y: m.y }; return best; }
    }
  }
  const f = p.face; if (Math.abs(f.x) > Math.abs(f.y)) return { x: ptx + Math.sign(f.x), y: pty }; return { x: ptx, y: pty + (f.y < 0 ? -1 : 1) };
}
export function nearestEnemy(range) {
  let best = null, bd = 1e9; const p = G.p;
  for (const e of G.enemies) { const d = Math.hypot(e.x - p.x, e.y - p.y) - ENEMY[e.k].r; if (d < range && d < bd) { bd = d; best = e; } }
  for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st !== 'fight' || b.z > 0.8) continue; const d = Math.hypot(b.x - p.x, b.y - p.y) - BOSSES[k].hr; if (d < range && d < bd) { bd = d; best = b; } }
  return best;
}
// v65: two buttons. The attack button (doAttack in features/controls.js) always attacks. This one — interact — does what fits the
// thing in front: an item held on purpose comes first (seed · watering can · furniture · food …), otherwise a recommendation
// (open · harvest · chop · mine · pick up …) that takes the right tool out of the tool pouch by itself (pickaxe · axe · sickle ·
// shovel; the fishing rod and the watering can only from the small button or when held). Other things that fit go to the small button.
export const HOLD_MODE = { sword: 'weapon', pick: 'pick', axe: 'axe', shovel: 'shovel', wcan: 'wcan', fert: 'fert', lasso: 'lasso', rod: 'rod', sickle: 'sickle', food: 'food', wear: 'wear', key: 'key', summon: 'summon', recall: 'recall' };
export const holdMode = it => !it ? 'hand' : BUILD_KINDS.includes(it.kind) ? 'build' : HOLD_MODE[it.kind] || 'hand';
export const NOTGT = ['eat', 'wear']; // held food · clothes: after a real action in front (opening a chest, …), or first when there is nothing to do
export const swingAct = sw => ({ k: 'swing', lbl: wtOf(sw).ranged ? '쏘기' : '휘두르기', icon: sw.id === 'hand' ? 'hand' : sw.id });
// the tool a natural thing needs: trees take an axe (or a pickaxe), rocks and crystals a pickaxe; small plants the hand
export function natTool(d) { if (d.nat === 'pick') return null; if (d.nat === 'chop') return bestTool('axe') || bestTool('pick'); return bestTool('pick'); }
export function natAct(d, o, t) { const tl = natTool(d); return { k: 'chop', lbl: d.nat === 'pick' ? '줍기' : d.nat === 'mine' ? '캐기' : isYoung(o) ? '베기 3/4' : '베기', icon: tl ? tl.id : 'hand', t, o, tool: tl }; }
export function decide() {
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
  if (G.holdT >= .3 && (G.holdK === 'harvest' || G.holdK === 'harvest3')) { const sk = bestTool('sickle'); if (sk) { const list = ripeAround(t.x, t.y); if (list.length) return { k: 'harvest3', lbl: '모두 거두기', icon: 'sickle', t, list, tool: sk }; } }
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
export function heldDecide(md, s, it, t, i, o) {
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
export function autoOptions(t, i, o) {
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
export const cropStage = o => Math.min(3, Math.floor((G.time - o.p) / OBJ[o.t].grow * 3));
export function tryAct(edge) {
  const a = G.act; const grp = GROUP[a.k] || null;
  if (edge) { G.holdGroup = grp; G.holdK = a.k; }
  else { if (a.k !== 'attack' && (!grp || grp !== G.holdGroup)) return; }
  perform(a);
}
defineCmd('ctl', c => { G.p.ctl = c; }); // 조작 의도 (sim/commands.js) — 매 프레임 화면 쪽이 보내요
export function faceTo(dx, dy) { const l = Math.hypot(dx, dy) || 1; G.p.face = { x: dx / l, y: dy / l }; }
export function perform(a) {
  const p = G.p;
  if (a.tool && a.tool !== selItem() && G.tools && G.tools.includes(a.tool)) holdTool(a.tool, ['rod', 'wcan', 'lasso'].includes(ITEMS[a.tool.id].kind)); // the rod / watering can from the small button stay chosen // v65: the tool the job needs comes out of the pouch and stays in hand
  switch (a.k) {
    case 'attack': {
      if (!ctlOf(p).aim) faceTo(a.en.x - p.x, a.en.y - p.y);
      G.actCd = swingAttack() === false ? 0.3 : atkCd(); break;
    }
    case 'rot': rotatePlace(); G.actCd = 0.15; break;
    case 'swing': G.actCd = swingAttack() === false ? 0.3 : atkCd(); break;
    case 'mine': mineWall(a.t); G.actCd = 0.27; break;
    case 'chop': hitObj(a.t, a.o); G.actCd = 0.28; break;
    case 'place': placeItem(a.t); G.actCd = 0.14; break;
    case 'dig': if (a.o) digPlant(a.t, a.o); else digGround(a.t); G.actCd = 0.22; break;
    case 'unwire': { G.wire.delete(idx(a.t.x, a.t.y)); const l = addItem('wire', 1, false); if (l) spawnDrop('wire', 1, a.t.x + .5, a.t.y + .5); emit('sfx', 'pick'); G.actCd = 0.15; break; }
    case 'open': if (a.o.t === 'chest') emit('open', 'chest', { i: idx(a.t.x, a.t.y) }); else emit('open', 'craft', { st: OBJ[a.o.t].station, i: idx(a.t.x, a.t.y) }); G.actCd = 0.3; break;
    case 'harvest': harvest(a.t, a.o); G.actCd = 0.3; break;
    case 'treasure': openTreasure(a.t, a.o); G.actCd = 0.4; break;
    case 'harvest3': for (const [x, y, o] of a.list) harvest({ x, y }, o); G.actCd = 0.35; break;
    case 'water': waterCrop(a.t, a.o); G.actCd = 0.25; break;
    case 'fert': fertCrop(a.t, a.o); G.actCd = 0.3; break;
    case 'fill': fillCan(a.t); G.actCd = 0.4; break;
    case 'eat': eat(G.sel); G.actCd = 0.4; break;
    case 'wear': wearItem(G.sel); G.actCd = 0.4; break;
    case 'recall': startRecall(a.mode); G.actCd = 0.4; break;
    case 'lost': pickLost(a.t, a.o); G.actCd = 0.3; break;
    case 'giant': harvestGiant(a.t, a.o); G.actCd = 0.4; break;
    case 'cakeOn': { const s2 = selItem(); if (!s2 || !ITEMS[s2.id].cake || a.o.cake) break; a.o.cake = 1; s2.c--; if (!s2.c) { G.inv[G.sel] = null; refillHot(G.sel, s2.id); } emit('inv'); emit('sfx', 'place'); emit('puff', a.t.x + .5, a.t.y + .3, '#ffe9a8', 10, 2, .5); emit('toast', '탁자 위에 케이크를 올렸어요', 'good', 'cake'); G.actCd = .4; break; }
    case 'cakeTake': { if (moveInto(G.inv, { id: 'festCake', c: 1 })) { emit('toast', '가방이 가득 찼어요', null, 'full'); break; } delete a.o.cake; emit('inv'); emit('sfx', 'pick'); G.actCd = .4; break; }
    case 'insert': insertSeeds(); G.actCd = 0.4; break;
    case 'tree': emit('open', 'tree'); G.actCd = 0.3; break;
    case 'summon': summonBoss(a.boss); G.actCd = 0.6; break;
    case 'take': a.o.has = 0; const left = addItem('lightSeed', 1); if (left) spawnDrop('lightSeed', 1, a.t.x + .5, a.t.y + 1.2); emit('sfx', 'seed'); emit('puff', a.t.x + .5, a.t.y + .5, '#ffd25c', 14, 3); emit('toast', '빛씨앗을 찾았어요! 등불나무로 가져가요', 'good'); G.actCd = 0.4; break;
    case 'pickup': { const d = OBJ[a.o.t]; delObj(idx(a.t.x, a.t.y)); if (OBJ[a.o.t].bed && G.spawnPt && G.spawnPt.x === a.t.x && G.spawnPt.y === a.t.y) G.spawnPt = null; returnObj(a.o, a.t.x + .5, a.t.y + .5); emit('sfx', 'pick'); emit('puff', a.t.x + .5, a.t.y + .6, '#e8d8c0', 5, 2); G.actCd = 0.3; markLight(); break; }
    case 'fish': startFish(a.t); G.actCd = 0.4; break;
    case 'stand': standUp(); G.actCd = 0.25; break;
    case 'use': useObj(a); G.actCd = 0.4; break;
    case 'reel': reel(); G.actCd = 0.35; break;
    case 'lasso': openCatch(a.w); G.actCd = .4; break;
    case 'ranch': ranchCollect(a.t, a.o); G.actCd = .4; break;
    case 'jobTake': takeJob(a.o, a.t.x + .5, a.t.y + .5); G.actCd = .4; break;
    case 'petpet': { const e = G.petE; emit('hearts', e.x, e.y - .4, 4); emit('sfx', 'purr'); emit('toast', `${ANIMALS[G.petOn].pn}${josa(ANIMALS[G.petOn].pn, '이', '가').slice(ANIMALS[G.petOn].pn.length)} 좋아해요`, 'good', 'petpet'); G.actCd = .6; break; }
    case 'info': if (a.msg) emit('toast', a.msg, null, 'info' + a.msg); G.actCd = 0.4; break;
  }
}
export const pickOne = a => a[Math.floor(fxRand() * a.length)];
export function useObj(a) {
  const o = a.o, t = a.t, p = G.p, x = t.x + .5;
  switch (a.u) {
    case 'farm': { const n = (o.store || []).reduce((a2, s2) => a2 + s2.c, 0);
      if (n) { for (const s2 of o.store) { const l = moveInto(G.inv, s2); s2.c = l; } o.store = o.store.filter(s2 => s2.c > 0); emit('sfx', 'pick'); emit('toast', o.store.length ? '가방이 가득 차서 일부만 꺼냈어요' : `${OBJ[o.t].n}에서 ${n}개를 꺼냈어요`, 'good', 'farm'); emit('inv'); break; }
      if (farmStage(o) >= 3) { farmHarvest(idx(t.x, t.y), o, false); emit('toast', farmT(o)[1], null, 'farm'); break; }
      emit('toast', `${farmT(o)[2]} (${Math.round(Math.min(1, (G.time - (o.p || 0)) / growOf(o)) * 100)}%) · 건전지·발전기와 전선으로 이으면 다 될 때마다 저절로 ${farmT(o)[0] === '캐기' ? '캐서' : '베어'} 옆 상자에 담아요`, null, 'farm'); break; }
    case 'lever': o.on = !o.on; emit('sfx', 'click'); emit('toast', o.on ? '레버를 켰어요' : '레버를 껐어요', null, 'lever'); break;
    case 'timer': { const L = [1, 2, 4, 8], k = (L.indexOf(o.per || 2) + 1) % L.length; o.per = L[k]; emit('sfx', 'click'); emit('toast', `타이머 간격: ${o.per}초마다 켜고 꺼요`, null, 'timer'); break; }
    case 'batt': emit('toast', `건전지 ${Math.round((o.e || 0) / BATT_MAX * 100)}% 남았어요${(o.e || 0) <= 0 ? ' · 회수해서 작업대 [수리]로 충전해요' : ''}`, null, 'batt'); break;
    case 'fuel': { let added = 0; for (const f of ['resin', 'gel', 'wood']) { while ((o.fuel || 0) + FUEL[f] <= FUEL_MAX && countItem(f) > 0) { removeItem(f, 1); o.fuel = (o.fuel || 0) + FUEL[f]; added++; } }
      emit('toast', added ? `연료를 넣었어요 · 약 ${Math.round((o.fuel || 0) / 60)}분 동안 일할 수 있어요` : (o.fuel || 0) >= FUEL_MAX - 30 ? '연료가 가득 찼어요' : `연료가 없어요 (나무·젤·송진) · 남은 연료 약 ${Math.round((o.fuel || 0) / 60)}분`, added ? 'good' : null, 'fuel'); if (added) emit('sfx', 'place'); break; }
    case 'sprk': emit('toast', o.work ? '물을 주는 중이에요 · 둘레 5×5 칸의 자라는 작물에 2초마다 물을 줘요' : '전기가 들어오지 않아요. 수정 발전기·건전지와 전선으로 이어 주세요', null, 'sprk'); break;
    case 'harv': { const n = (o.store || []).reduce((a2, s2) => a2 + s2.c, 0);
      if (n) { for (const s2 of o.store) { const l = moveInto(G.inv, s2); s2.c = l; } o.store = o.store.filter(s2 => s2.c > 0); emit('sfx', 'pick'); emit('toast', o.store.length ? '가방이 가득 차서 일부만 꺼냈어요' : `자동 수확기에서 ${n}개를 꺼냈어요`, 'good', 'harv'); emit('inv'); break; }
      emit('toast', o.work ? '둘레 3×3 칸의 다 자란 작물을 거둬서 옆 상자에 담아요' : '전기가 들어오지 않아요. 수정 발전기·건전지와 전선으로 이어 주세요', null, 'harv'); break; }
    case 'drill': { const n = (o.store || []).reduce((a2, s2) => a2 + s2.c, 0);
      if (n) { for (const s2 of o.store) { const l = moveInto(G.inv, s2); s2.c = l; } o.store = o.store.filter(s2 => s2.c > 0); emit('sfx', 'pick'); emit('toast', o.store.length ? '가방이 가득 차서 일부만 꺼냈어요' : `채굴기에서 ${n}개를 꺼냈어요`, 'good', 'drill'); emit('inv'); break; }
      const d2 = OBJ[o.t]; emit('toast', o.work ? `캐는 중이에요 · 다음 광물까지 ${Math.ceil(d2.every - (o.prog || 0))}초` : o.why === 'power' || !o.why ? '전기가 들어오지 않아요. 건전지·발전기와 전선으로 이어 주세요' : o.why === 'wall' ? '앞에 캘 벽이 없어요. 광맥을 바라보게 다시 놓아 주세요' : o.why === 'tier' ? (d2.only ? '돌 채굴기는 흙벽·돌벽·화강암 벽(지형)만 캘 수 있어요. 광맥은 구리·철·황금 채굴기로 캐요' : '이 채굴기로는 못 캐는 벽이에요') : '안이 가득 찼어요. 꺼내거나 옆에 상자를 두세요', null, 'drill'); break; }
    case 'cinfo': { const d2 = OBJ[o.t]; emit('toast', d2.src === 'cgen' ? '수정 발전기 · 연료 없이 계속 전기를 만들어요' : d2.sw === 'plate' ? '압력판 · 올라서 있는 동안 양쪽 전선을 이어 줘요' : d2.dev === 'door' ? (o.open ? '전기 문 · 전기가 들어와 열려 있어요' : '전기 문 · 전기가 들어오면 열려요') : (o.off === false ? '전기 램프 · 켜져 있어요' : '전기 램프 · 전기가 들어오면 켜져요'), null, 'cinfo'); break; }
    case 'door': { if (OBJ[o.t].dev === 'slide' && o.pw) { emit('toast', '자동 미닫이문 · 전기가 들어와 있어서 다가가면 저절로 열려요', null, 'cinfo'); break; }
      const grp = doorGroup(t.x, t.y), nv = !o.open; // a double door opens and closes together
      if (!nv && grp.some(([j]) => occupied(j % W, (j / W) | 0))) { emit('toast', '문 사이에 누가 있어서 닫을 수 없어요', null, 'doorblk'); break; }
      for (const [, g] of grp) g.open = nv; emit('sfx', 'place'); emit('puff', x, t.y + .6, '#e8d8c0', 3, 1.2); break; }
    case 'sit': { const sd = rotN(o.t) === 4 ? rotOf(o) : 0, fp2 = fpOf(o); p.sit = { x: t.x, y: t.y, px: p.x, py: p.y, dir: sd }; p.x = t.x + (fp2[0] > 1 ? fp2[0] / 2 : .5); p.y = t.y + (fp2[1] > 1 ? fp2[1] / 2 : .62); p.face = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }][sd]; p.dir = ['down', 'side', 'up', 'side'][sd]; p.flip = sd === 3; } G.fish = null; emit('sfx', 'place'); emit('toast', '편안하게 앉았어요. 체력이 조금씩 차올라요', null, 'sit'); break;
    case 'sleep': sleepIn(t); break;
    case 'pet': emit('hearts', x, t.y, 5); emit('sfx', 'purr'); if ((o.cd || 0) <= G.time) { o.cd = G.time + 20; p.hp = Math.min(maxHp(), p.hp + 5); emit('ftext', p.x, p.y - 1.3, '♥ +5', '#ff8fa3'); } emit('toast', pickOne(['골골골…', '말랑말랑해요', '쿠션이 기분 좋아 보여요']), null, 'pet'); break;
    case 'lamp': o.off = !o.off; markLight(); emit('sfx', 'click'); break;
    case 'feed': emit('puff', x, t.y + .4, '#d4f1ff', 8, 1.2, .5); emit('hearts', x, t.y, 3); emit('sfx', 'plop'); emit('toast', '물고기들이 반가워해요', null, 'feed'); break;
    case 'read': G.tipN = ((G.tipN || 0) + 1) % TIPS.length; emit('toast', TIPS[G.tipN]); emit('sfx', 'page'); break;
    case 'mirror': emit('puff', p.x, p.y - .8, '#fff7c2', 10, 2, .8); emit('sfx', 'seed'); emit('toast', pickOne(COMPLIMENTS), null, 'mirror'); break;
    case 'dress': emit('open', 'look'); break;
    case 'wish': if ((o.cd || 0) > G.time) { emit('toast', '분수가 쉬고 있어요. 조금 뒤에 다시 빌어요', null, 'wish'); break; } o.cd = G.time + 120; G.luck = G.time + 120; emit('puff', x, t.y, '#bfefff', 16, 2.5, 1); emit('sfx', 'seed'); emit('toast', '행운이 깃들었어요! 2분 동안 낚시 운 2단계 (요리의 낚시 운과 겹치면 더 높은 쪽만)', 'good'); break;
    case 'water': o.shake = .3; emit('drips', x, t.y + .6); emit('sfx', 'plop'); emit('toast', '촉촉해졌어요', null, 'water'); break;
    case 'tea': if ((o.cd || 0) > G.time) { emit('toast', '찻잔이 비었어요. 조금 뒤에 다시 마셔요', null, 'tea'); break; } o.cd = G.time + 45; p.hp = Math.min(maxHp(), p.hp + 6); p.hunger = Math.min(100, p.hunger + 4); emit('ftext', p.x, p.y - 1.3, '♥ +6', '#ff8fa3'); emit('sfx', 'eat'); emit('toast', '따뜻한 차 한 잔, 기운이 나요', null, 'tea'); break;
  }
}
// ---- the small button: the other things that fit ----
export let altI = 0, altKey = '';
export function curAlt() { const L = (G && G.alts) || []; if (!L.length) return null; const a = G.act || {}, key = a.k + '|' + (a.t ? a.t.x + ',' + a.t.y : '') + '|' + L.map(x => x.k + x.lbl).join(',');
  if (key !== altKey) { altKey = key; altI = 0; } return L[altI % L.length]; }
// 명령: 누름(상호작용 act·공격 atk을 잠깐 기억, t: 0이면 지우기) · 작은 버튼 · 도구 들기
defineCmd('tap', c => { const t = c.t == null ? .3 : c.t; if (c.b === 'atk') G.atkQ = t; else G.actQ = t; });
defineCmd('alt', () => doAlt());
export function doAlt() { const a = curAlt(); if (!a || G.actCd > 0) return; if (a.k === 'rot') { rotatePlace(); return; } perform(a); }
export function cycleAlt() { const L = (G && G.alts) || []; if (L.length < 2) return; curAlt(); altI = (altI + 1) % L.length; emit('sfx', 'click'); }
