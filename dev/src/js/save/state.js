// ================= state =================
import { ANIMALS } from '../data/gear-animals.js';
import { BAG0, BAG_MAX_LV, HOT, ITEMS, OBJ } from '../data/items.js';
import { BKEYS, BOSSES } from '../data/rpg-nature.js';
import { BUFF_MAX, DISH, EFF } from '../data/farming-cooking.js';
import { CHARS, LOOK_DEF, cleanLook } from '../art/characters.js';
import { clamp } from '../engine/util.js';
import { ensureDeepAltars, fixParts, grantAccs, grantUniques, grow122, growFootprints, loadEquip, loadSets, mergeShovelful93, migrateBagV2, migrateDark130, migrateForges60, migrateGbench124, migrateGear61, migrateNaru110, migrateNaru119, migrateRecipes, migrateSeen77, migrateTools65, migrateV2, migrateV3, moveOldWeapon, noticeRename58, refundAuto113, refundPieces, refundRoofItems, refundRoofTiles, syncNotes, syncTiers128 } from './migrations.js';
import { rand } from '../engine/random.js';
import { spawnDrop } from '../sim/drops.js';
import { ANCH, CX, CY, H, MAPV, SA, SB, SI, SL, W, devLayout, idx, setLayout } from '../world/map.js';
import { addQuartzVeins, cleanRooms, genWorld, makeWorld3, placeRooms, refreshDoors } from '../world/gen.js';
import { emit } from '../sim/events.js';
import { FPV, setFootprints } from '../sim/building.js';
import { activeBuffs } from '../sim/cooking.js';
import { advanceOffline } from '../sim/crafting.js';
import { freshEquip, freshSets } from '../sim/gear.js';
import { addItem, invSize, isTool, moveInto, seenAll } from '../sim/inventory.js';
import { cleanZones, genFlowerZones } from '../sim/nature.js';
import { cleanRpg, freshRpg, maxHp, maxMp } from '../sim/player.js';
import { unstick } from '../sim/survival.js';
import { placeWarps } from '../sim/warp.js';
import { placeCocoons } from '../sim/npc.js';
import { placeArchives } from '../sim/archive.js';
import { deepOnLoad } from '../sim/deep.js';
import { shadowOnLoad } from '../sim/shadow.js';
import { archBossOnLoad } from '../sim/archboss.js';
export const SAVE_KEY = 'lantern-tree-save-v1';
// each playthrough gets its own id so cloud sync never mixes two different adventures
export const newRunId = () => Date.now().toString(36) + rand().toString(36).slice(2, 8);
// play time: counts only while the game is open, visible and someone touched it in the last 2 minutes
export let lastInputAt = 0; const IDLE_LIMIT = 120;
export const noteInput = () => { lastInputAt = performance.now(); }; // 마지막으로 조작한 때 (놀고 있는 시간은 플레이 시간에서 빼요)
export function fmtPlay(sec, est) { sec = Math.max(0, Math.floor(sec || 0)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); const t = h ? `${h}시간 ${m}분` : m ? `${m}분` : '1분 미만'; return (est ? '약 ' : '') + t; }
export let G = null;
export const cam = { x: CX + .5, y: CY + 2 };
export let paused = true, started = false, soundOn = true;
export const setPaused = v => { paused = v; }, setStarted = v => { started = v; }, setSound = v => { soundOn = v; };
export const beat = k => !!(G && ((G.bossDead || {})[k] || (G.stats && G.stats.beaten || {})[k]));
export const freshStats = () => ({ wood: 0, bench: 0, torch: 0, copperOre: 0, copperBar: 0, seedsFound: 0 });
export const freshBoss = k => { const h = BOSSES[k].home(); return { k, x: h.x, y: h.y, hp: BOSSES[k].hp, max: BOSSES[k].hp, st: 'sleep', t: 0, z: 0, air: 0, airMax: 1, vx: 0, vy: 0, lands: 0, hurt: 0, ph: 'walk', casts: 0, rot: 0, dx: 0, dy: 1, d: 99, poison: null, burn: null, stage: 1, inv: 0, pillars: [] }; };
export const freshBosses = () => Object.fromEntries(BKEYS.map(k => [k, freshBoss(k)]));
export const freshDead = () => Object.fromEntries(BKEYS.map(k => [k, false]));
export const guardOf = (x, y) => (x === SA.x && y === SA.y) ? 'queen' : (x === SB.x && y === SB.y) ? 'golem' : (x === SL.x && y === SL.y) ? 'turtle' : (x === SI.x && y === SI.y) ? 'spirit' : null;
export function newGame(seed) {
  const lv = devLayout() || 3; setFootprints(2); let w; // v70 (BF-04): new worlds get map version 3 (boss rooms at per-seed places, world/gen.js makeWorld3)
  if (lv === 3) w = makeWorld3(seed).w; else { setLayout(lv); w = genWorld(seed); }
  G = { seed, ...w, explored: new Uint8Array(W * H), inv: Array(HOT + BAG0).fill(null), sel: 0, bagLv: 0, tools: [], tsel: 0, lastW: null,
    p: { x: CX + .5, y: CY + 1.7, hp: 100, hunger: 100, face: { x: 0, y: 1 }, dir: 'down', flip: false, anim: 0, moving: false, inv: 0, hurt: 0, kx: 0, ky: 0, dead: 0 },
    enemies: [], drops: [], parts: [], texts: [], bosses: freshBosses(), bossDead: freshDead(), shots: [], fish: null, fishFx: null, stats: freshStats(), time: 0, spawnPt: null, treeSeeds: 0, won: false, guide: 0, wdmg: new Map(), swing: null, biomeNow: 0 };
  bindPlayers(G);
  G.inv[0] = { id: 'berry', c: 4 }; G.inv[1] = { id: 'berrySeed', c: 2 }; [['pickWood', 1], ['swordWood', 1]].forEach(([id, c]) => addItem(id, c, false)); G.seen = {}; seenAll(); // v77: 처음 가진 물건은 본 것
  G.stats.nm58 = 1; G.stats.nm61 = 1; G.stats.nm65 = 1; G.stats.grow122 = { moved: 0, back: 0, boxes: 0 }; /* v122: 새 판은 커진 가구 옮기기를 하지 않아요 */ G.sel = -1; G.tsel = 0; G.lastW = 'swordWood'; /* v65: start holding the wooden pickaxe in the tool slot (berries · seeds · wooden sword in hotbar slots 1–3) */ G.outfit = 0; G.char = 'sprout'; G.pname = null; G.look = cleanLook(); G.marks = []; G.under = new Map(); G.terrain = {}; G.rpg = freshRpg(); G.qclaim = {}; G.wire = new Map(); G.bwall = new Set(); G.hz = []; G.pshots = []; G.skcd = {}; G.p.mp = maxMp(); G.fzones = genFlowerZones(); G.regen = []; G.run = newRunId(); G.playT = 0; G.playTEst = false; G.qt = {}; G.stats.naru110 = 1; G.stats.naru119 = 1; G.stats.gb124 = 1; G.stats.tier128 = 1; G.stats.dark130 = 1; /* v119 · v124 · v128 · v130 */ /* v110: 새 게임은 나루 첫 장면부터 */ G.rooms = placeRooms(w); refreshDoors(); placeWarps(); placeArchives(); placeCocoons(); deepOnLoad(); archBossOnLoad(); /* v104·v106·v108 · v131 기록관 마지막 방 */ /* v89 워프포인트 */ G.recipes = {}; G.buffs = []; G.equip = freshEquip(); G.eqSets = freshSets(); G.eqSet = 0; G.stats.qv = 1; G.qAct = 'main'; G.pets = {}; G.petOn = null; G.wild = []; G.petE = null; G.env = { k: null, v: 0, lv: 0, t: 0 }; emit('look');
  emit('loaded'); // 화면: 지도 그림 다시 만들기·카메라 옮기기 (ui/feedback.js)
}
export const rle = a => { const o = []; let p = a[0], n = 1; for (let i = 1; i < a.length; i++) { if (a[i] === p && n < 65535) n++; else { o.push(p, n); p = a[i]; n = 1; } } o.push(p, n); return o; };
export const unrle = (r, len) => { const a = new Uint8Array(len); let k = 0; for (let i = 0; i < r.length; i += 2) { a.fill(r[i], k, k + r[i + 1]); k += r[i + 1]; } return a; };
// ---- 세이브 나누기 (구조 변경 4단계, 멀티플레이 준비) ----
// 세이브는 「세계」(방장 기기에 저장, 같이 씀)와 「캐릭터」(내 기기에 저장, 여러 세계로 들고 다님)로 나눠요.
// 한 사람이 할 때는 지금처럼 둘을 합친 한 덩어리(v: 3, 같은 저장 키)로 저장해요 — joinSave(splitSave(s))는 s와 글자까지 같아요.
// 정한 것 (2026-10-12): 퀘스트 진행·보상·기록(stats)은 세계별 · 지도에서 밝힌 곳은 플레이어마다 따로 · 펫은 캐릭터가 데리고 다님
export const SAVE_ORDER = ['v', 'seed', 'wall', 'floor', 'biome', 'explored', 'objs', 'inv', 'invV', 'tools', 'tsel', 'tHand', 'lastW', 'bagLv', 'sel', 'outfit', 'char', 'look',
  'p', 'rpg', 'qclaim', 'wire', 'fzones', 'regen', 'stats', 'time', 'spawnPt', 'treeSeeds', 'won', 'won2', 'bossDead', 'guide', 'at', 'marks', 'under', 'terrain', 'run',
  'playT', 'playTEst', 'qt', 'rooms', 'recipes', 'buffs', 'mapV', 'mapA', 'fpV', 'equip', 'pets', 'petOn', 'backPt', 'recallCd', 'env', 'seen', 'eqSets', 'eqSet', 'qAct', 'natDay', 'bwall', 'pname'];
// 캐릭터: 가방·도구·장비·옷·생김새·레벨과 스킬·배운 요리·버프·더위추위·귀환석 쉬는 시간·펫 (+ p의 체력·배고픔·기력)
export const CHAR_KEYS = new Set(['inv', 'invV', 'tools', 'tsel', 'tHand', 'lastW', 'bagLv', 'sel', 'outfit', 'char', 'look', 'rpg', 'recipes', 'buffs', 'equip', 'pets', 'petOn', 'recallCd', 'env', 'seen', 'eqSets', 'eqSet', 'pname']); // v117 pname: 첫 장면에서 지은 이름
// 세계 안에서 플레이어마다: 지도에서 밝힌 곳·침대·귀환 표지 (+ p의 위치 x·y). 나머지는 모두 세계 (지형·물체·시간·보스·퀘스트 …)
export const PLAYER_KEYS = new Set(['explored', 'spawnPt', 'backPt', 'qAct']); // v84: 활성 퀘스트는 사람마다
export const ME = 'me'; // 내 플레이어 (13단계에서 캐릭터마다 이름표)
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// ---- 플레이어 여럿 (구조 변경 8단계) ----
// 세계(G) 안에 플레이어가 여럿: G.players[id] = { id, p: 몸, 가방·장비 … 캐릭터 칸, 지도·침대 … 플레이어별 칸, 낚시·휘두르기·고른 행동·타이머 … 지금 하는 일 }.
// 옛 코드의 G.inv·G.p·G.actCd … (PER_PLAYER)는 「지금 플레이어」(curPl)의 것을 가리켜요:
//   명령은 보낸 플레이어(sim/commands.js), 매 프레임 플레이어별 일은 한 명씩(sim/systems.js), 그 밖(화면·저장)은 내 플레이어(ME).
// 다른 플레이어의 것을 보려면 withPlayer(pl, () => …) 또는 pl.inv처럼 직접.
export const PER_PLAYER = ['p', 'inv', 'invV', 'tools', 'tsel', 'tHand', 'lastW', 'bagLv', 'sel', 'outfit', 'char', 'look', 'rpg', 'recipes', 'buffs', 'equip', 'pets', 'petOn', 'recallCd', 'env', 'seen', 'eqSets', 'eqSet', 'pname',
  'explored', 'spawnPt', 'backPt', 'qAct', // 세계 안 플레이어별 (PLAYER_KEYS)
  'fish', 'fishFx', 'swing', 'act', 'alts', 'skcd', 'recall', 'warpGo', 'petE', 'pshots', 'biomeNow', 'escCd', 'luck', 'tipN', // 지금 하는 일 (저장 안 함)
  'actCd', 'holdGroup', 'actQ', 'holdT', 'holdK', 'atkQ', 'atkT', 'hungerT', 'regenT', 'spawnT']; // 행동·공격 버튼 타이머, 배고픔·회복 시간, 주변 몬스터 생기기
const freshTimers = () => ({ actCd: 0, holdGroup: null, actQ: 0, holdT: 0, holdK: null, atkQ: 0, atkT: 0, hungerT: 0, regenT: 0, spawnT: 0 });
export let curPl = null;
export function withPlayer(pl, fn) { const old = curPl; curPl = pl; try { return fn(); } finally { curPl = old; } }
export const playerList = () => (G && G.players ? Object.values(G.players) : []);
export const myPlayer = () => G && G.players && G.players[ME];
// (x, y)에서 가장 가까운 살아 있는 플레이어 (모두 쓰러졌으면 가장 가까운 플레이어) — 몬스터·보스·떨어진 물건이 누구를 볼지
export function nearestPlayer(x, y) { let best = null, bd = 1e9, live = false;
  for (const pl of playerList()) { const a = pl.p.dead <= 0, d = Math.hypot(pl.p.x - x, pl.p.y - y); if ((a && !live) || (a === live && d < bd)) { best = pl; bd = d; live = a; } }
  return best; }
export const alivePlayers = () => playerList().filter(pl => pl.p.dead <= 0);
let turn = 0;
export const nextTurn = () => { const L = playerList(); return L[(turn = (turn + 1) % L.length)]; }; // 세계에 한 번 하는 일을 플레이어 돌아가며 (자연 다시 자라기·들짐승 생기기)
// G를 새로 만든 바로 뒤: G 안의 플레이어 칸을 첫 플레이어(나)에게 옮기고, G.inv 같은 이름이 지금 플레이어를 가리키게 해요
function bindPlayers(g, id = ME) {
  const pl = { id, ...freshTimers() }; g.players = { [id]: pl };
  for (const k of PER_PLAYER) { if (hasOwn(g, k)) { pl[k] = g[k]; delete g[k]; } Object.defineProperty(g, k, { get: () => curPl[k], set: v => { curPl[k] = v; }, enumerable: false, configurable: true }); }
  curPl = pl; return pl;
}
// 같은 세계에 플레이어 더하기 (지금은 테스트용 — 12단계 「혼자서 둘이 하기」·13단계 친구 들어오기에서 씀). 캐릭터는 새로 시작
export function addPlayer(id, x, y) {
  const me = G.players[ME], pl = { id, ...freshTimers(), p: { x, y, hp: 100, hunger: 100, face: { x: 0, y: 1 }, dir: 'down', flip: false, anim: 0, moving: false, inv: 0, hurt: 0, kx: 0, ky: 0, dead: 0 },
    inv: Array(HOT + BAG0).fill(null), invV: 2, tools: [], tsel: 0, tHand: false, lastW: null, bagLv: 0, sel: 0, outfit: 0, char: me.char, look: me.look, rpg: freshRpg(), recipes: {}, buffs: [], equip: freshEquip(), eqSets: freshSets(), eqSet: 0,
    pets: {}, petOn: null, recallCd: 0, env: { k: null, v: 0, lv: 0, t: 0 }, seen: {}, pname: null, explored: new Uint8Array(W * H), spawnPt: null, backPt: null, qAct: 'main',
    fish: null, fishFx: null, swing: null, act: null, alts: [], skcd: {}, recall: null, warpGo: null, petE: null, pshots: [], biomeNow: 0, escCd: 0 };
  G.players[id] = pl; withPlayer(pl, () => { pl.p.mp = maxMp(); }); return pl;
}
export function splitSave(s, id = ME) {
  const world = {}, char = { v: s.v }, pl = {};
  for (const k of Object.keys(s)) {
    if (k === 'p') { pl.x = s.p.x; pl.y = s.p.y; char.p = { hp: s.p.hp, hunger: s.p.hunger, mp: s.p.mp }; }
    else if (CHAR_KEYS.has(k)) char[k] = s[k]; else if (PLAYER_KEYS.has(k)) pl[k] = s[k]; else world[k] = s[k];
  }
  world.players = { [id]: pl }; return { world, char };
}
export function joinSave(world, char, id = ME) {
  const pl = (world.players && world.players[id]) || {}, s = {};
  const extra = [...Object.keys(world), ...Object.keys(char), ...Object.keys(pl).filter(k => k !== 'x' && k !== 'y')].filter(k => k !== 'players' && !SAVE_ORDER.includes(k)); // 나중에 생긴 칸도 잃지 않게
  for (const k of [...SAVE_ORDER, ...new Set(extra)]) {
    if (k === 'p') { if (char.p || hasOwn(pl, 'x')) s.p = { x: pl.x, y: pl.y, hp: char.p && char.p.hp, hunger: char.p && char.p.hunger, mp: char.p && char.p.mp }; }
    else if (k === 'v') s.v = hasOwn(world, 'v') ? world.v : char.v;
    else if (CHAR_KEYS.has(k)) { if (hasOwn(char, k)) s[k] = char[k]; } else if (PLAYER_KEYS.has(k)) { if (hasOwn(pl, k)) s[k] = pl[k]; }
    else if (hasOwn(world, k)) s[k] = world[k]; else if (hasOwn(char, k)) s[k] = char[k]; else if (hasOwn(pl, k)) s[k] = pl[k];
  }
  return s;
}
export const serializeWorld = (id = ME) => { const s = serialize(); return s && splitSave(s, id).world; };
export const serializeChar = () => { const s = serialize(); return s && splitSave(s).char; };
export const deserializeParts = (world, char, id = ME) => deserialize(joinSave(world, char, id));
export function serialize() {
  if (!G) return null; return withPlayer(myPlayer(), () => { const p = G.p; // 저장은 내 플레이어 기준 (다른 플레이어 저장은 13단계)
  const { world, char } = splitSave(saveAll(p)); return joinSave(world, char); }); // 늘 나누기·합치기를 거쳐요 (둘이 어긋나면 바로 드러나게)
}
function saveAll(p) {
  return { v: 3, seed: G.seed, wall: rle(G.wall), floor: rle(G.floor), biome: rle(G.biome), explored: rle(G.explored), objs: [...G.objs], inv: G.inv, invV: 2, tools: G.tools || [], tsel: G.tsel || 0, tHand: !!G.tHand, lastW: G.lastW || null, bagLv: G.bagLv || 0, sel: G.sel, outfit: G.outfit || 0, char: G.char || 'sprout', look: G.look || LOOK_DEF,
    p: { x: p.x, y: p.y, hp: p.hp, hunger: p.hunger, mp: p.mp }, rpg: G.rpg, qclaim: G.qclaim || {}, wire: [...(G.wire || new Map())], fzones: G.fzones || [], regen: G.regen || [], stats: G.stats, time: G.time, spawnPt: G.spawnPt, treeSeeds: G.treeSeeds, won: G.won, won2: !!G.won2, bossDead: G.bossDead, guide: G.guide, at: Date.now(), marks: G.marks || [], under: [...G.under], terrain: G.terrain || {}, run: G.run || newRunId(), playT: Math.round(G.playT || 0), playTEst: !!G.playTEst, qt: G.qt || {}, rooms: G.rooms || [], recipes: G.recipes || {}, buffs: activeBuffs(), mapV: MAPV, ...(ANCH ? { mapA: ANCH } : {}), fpV: FPV, equip: G.equip || freshEquip(), eqSets: (G.eqSets || freshSets()).map((x, k) => k === (G.eqSet || 0) ? { e: null, pet: null } : { e: x.e && Object.values(x.e).some(Boolean) ? x.e : null, pet: x.pet || null }), eqSet: G.eqSet || 0, pets: G.pets || {}, petOn: G.petOn || null, backPt: G.backPt || null, qAct: G.qAct || 'main', natDay: Number.isFinite(G.natDay) ? G.natDay : null, recallCd: G.recallCd || 0, env: G.env ? { k: G.env.k, v: Math.round(G.env.v) } : null, seen: G.seen || {}, ...(G.bwall && G.bwall.size ? { bwall: [...G.bwall] } : {}), ...(G.pname ? { pname: G.pname } : {}) }; // v117: 지은 이름 (지었을 때만) // v92: 직접 쌓은 자연 재료 벽 (건축 모드 뜯기)
}
export function deserialize(s) {
  setLayout(s.mapV === 3 ? 3 : s.mapV === 2 ? 2 : 1, s.mapA); // saves from before v47 keep the original 200×200 map; v70 worlds keep their own boss places (mapA)
  setFootprints(2); const oldFp = s.fpV !== 2; // v56: saves from before v50 get the 2×1 workbench and benches too (growFootprints below)
  const N = W * H;
  G = { seed: s.seed, wall: unrle(s.wall, N), floor: unrle(s.floor, N), biome: unrle(s.biome, N), explored: unrle(s.explored, N), objs: new Map(s.objs), inv: s.inv, sel: Number.isInteger(s.sel) ? s.sel : 0, tools: Array.isArray(s.tools) ? s.tools : [], tsel: Number.isInteger(s.tsel) ? s.tsel : 0, tHand: !!s.tHand, lastW: typeof s.lastW === 'string' ? s.lastW : null,
    p: { x: s.p.x, y: s.p.y, hp: s.p.hp, hunger: s.p.hunger, face: { x: 0, y: 1 }, dir: 'down', flip: false, anim: 0, moving: false, inv: 0, hurt: 0, kx: 0, ky: 0, dead: 0 },
    enemies: [], drops: [], parts: [], texts: [], bosses: freshBosses(), bossDead: (s.bossDead && typeof s.bossDead === 'object') ? Object.assign(freshDead(), s.bossDead) : Object.assign(freshDead(), { slime: !!s.bossDead }), shots: [], fish: null, fishFx: null, stats: Object.assign(freshStats(), s.stats), time: s.time || 0, spawnPt: s.spawnPt, treeSeeds: s.treeSeeds || 0,
    won: !!s.won, won2: !!s.won2, guide: s.guide || 0, wdmg: new Map(), swing: null, biomeNow: 0 };
  bindPlayers(G);
  G.bagLv = clamp(Math.floor(+s.bagLv || 0), 0, BAG_MAX_LV);
  if ((s.invV || 1) < 2) migrateBagV2();
  while (G.inv.length < invSize()) G.inv.push(null); if (G.inv.length > invSize()) { const extra = G.inv.splice(invSize()).filter(Boolean); G.inv.push(...[]); G.__extra = extra; }
  if ((s.v || 1) < 2) migrateV2();
  G.wire = new Map(Array.isArray(s.wire) ? s.wire : []); G.under = new Map(Array.isArray(s.under) ? s.under : []);
  if ((s.v || 1) < 3) migrateV3();
  if (!G.stats.qv) { addQuartzVeins(); G.stats.qv = 1; } // v43: older crystal caves get the new quartz veins inside their granite
  const oldWp = loadEquip(s.equip); // v42 equipment slots; v48: the weapon of the old weapon slot (moved to the hotbar below)
  G.pets = {}; if (s.pets && typeof s.pets === 'object') for (const k in s.pets) if (ANIMALS[k] && ANIMALS[k].pet && s.pets[k]) G.pets[k] = 1; G.petOn = G.pets[s.petOn] ? s.petOn : null; G.wild = []; G.petE = null; // v45 pets
  loadSets(s.eqSets, s.eqSet); // v83: equipment sets I·II·III (old saves: what is worn now is set I)
  G.env = s.env && ['hot', 'cold'].includes(s.env.k) && Number.isFinite(s.env.v) ? { k: s.env.k, v: clamp(s.env.v, 0, 100), lv: 9, t: 0 } : { k: null, v: 0, lv: 0, t: 0 };
  G.backPt = s.backPt && Number.isFinite(s.backPt.x) && Number.isFinite(s.backPt.y) ? { x: s.backPt.x, y: s.backPt.y } : null; G.recallCd = Number.isFinite(s.recallCd) ? s.recallCd : 0; G.recall = null; G.qAct = typeof s.qAct === 'string' ? s.qAct : 'main'; G.natDay = Number.isFinite(s.natDay) ? s.natDay : null; // v87: 하루 하나 새 자연물 — 마지막으로 센 날 (없으면 오늘부터) // v84 (옛 세이브: 진행 중인 이야기)
  G.look = cleanLook(s.look); G.char = CHARS[s.char] ? s.char : 'sprout'; G.outfit = s.outfit || 0; emit('look');
  const roofBack = refundRoofItems(); // v41: roofs were removed — roof items turn back into their material
  mergeShovelful93(); // v93: 흙 한 삽·얼음 한 삽 → 흙·얼음 덩이
  refundAuto113(); // v113: 채굴장·나무 작업장 → 재료 (모르는 물건을 지우기 전에)
  refundPieces(); // v69 (BF-05): removed building pieces turn back into their materials — before unknown items are cleared out just below
  const known = x => x && ITEMS[x.id] && !ITEMS[x.id].virtual ? x : null;
  G.inv = G.inv.map(known); for (const o of G.objs.values()) if (o.items) o.items = o.items.map(known);
  G.tools = G.tools.filter(x => known(x) && isTool(x.id)).map(x => ({ ...x, c: 1 })); if (!(G.tsel >= 0 && G.tsel < G.tools.length)) G.tsel = 0;
  if (!(G.sel >= (G.tools.length ? -1 : 0) && G.sel < HOT)) G.sel = 0;
  if (G.__extra) { for (const x of G.__extra) moveInto(G.inv, x); delete G.__extra; }
  if (oldWp) moveOldWeapon(oldWp);
  if (!G.stats.nm58) noticeRename58(); // v58 rename notice for older saves
  G.guide = 0; G.marks = Array.isArray(s.marks) ? s.marks.filter(m => m && Number.isInteger(m.x) && Number.isInteger(m.y)) : [];
  G.under = new Map(Array.isArray(s.under) ? s.under : []); refundRoofTiles(s.roof, roofBack); G.terrain = (s.terrain && typeof s.terrain === 'object') ? s.terrain : {};
  G.fzones = Array.isArray(s.fzones) && s.fzones.length ? cleanZones(s.fzones) : genFlowerZones(); G.regen = Array.isArray(s.regen) ? s.regen.filter(r => Array.isArray(r) && Number.isInteger(r[0]) && OBJ[r[1]]).slice(0, 600) : [];
  G.qclaim = (s.qclaim && typeof s.qclaim === 'object') ? s.qclaim : {}; G.wire = new Map(Array.isArray(s.wire) ? s.wire : []); G.bwall = new Set(Array.isArray(s.bwall) ? s.bwall.filter(Number.isInteger) : []);
  G.buffs = Array.isArray(s.buffs) ? s.buffs.filter(b => b && EFF[b.ef] && [1, 2, 3].includes(b.tier) && Number.isFinite(b.end) && b.end > G.time && ITEMS[b.id]).slice(0, BUFF_MAX).map(b => ({ ef: b.ef, tier: b.tier, end: b.end, max: Number.isFinite(b.max) ? b.max : b.end - G.time, id: b.id })) : [];
  G.rpg = cleanRpg(s.rpg); G.hz = []; G.pshots = []; G.skcd = {}; G.p.mp = Number.isFinite(s.p.mp) ? Math.min(s.p.mp, maxMp()) : maxMp(); G.p.hp = Math.min(G.p.hp, maxHp());
  G.stats.beaten = G.stats.beaten || {}; for (const k of BKEYS) if (G.bossDead[k]) G.stats.beaten[k] = 1;
  G.run = typeof s.run === 'string' && s.run ? s.run : newRunId();
  G.playTEst = !Number.isFinite(s.playT) || !!s.playTEst; G.playT = Number.isFinite(s.playT) ? s.playT : Math.max(0, Math.round(+s.time || 0));
  G.qt = {}; if (s.qt && typeof s.qt === 'object') for (const k in s.qt) if (Number.isFinite(s.qt[k])) G.qt[k] = s.qt[k];
  for (const [i, o] of [...G.objs]) if (o.t === 'icePillar') G.objs.delete(i); // ice pillars only last for one fight
  if (!G.stats.nm61) migrateGear61();
  if (!G.stats.nm65) migrateTools65(); // v65 tool pouch
  migrateForges60(oldFp); // v60
  syncTiers128(); // v128: 작업대·장비제작대 같은 단계
  grow122(); // v122: 커진 침대·탁자·긴 식탁
  if (oldFp) growFootprints(); fixParts(); grantUniques(); ensureDeepAltars();
  G.rooms = Array.isArray(s.rooms) ? cleanRooms(s.rooms) : placeRooms(genWorld(G.seed)); refreshDoors(); G.warpGo = null; migrateNaru110(); placeWarps(); placeArchives(); placeCocoons(); deepOnLoad(); archBossOnLoad(); /* v131 */ shadowOnLoad(); /* v129 */ migrateDark130(); /* v130 */ migrateNaru119(); migrateGbench124(); /* v104·v106·v108 · v119 · v124 */ // v89: 옛 세계에도 워프포인트를 한 번 (G.stats.warpV) // saves from before hidden rooms get them carved in now
  G.recipes = {}; if (s.recipes && typeof s.recipes === 'object') { for (const k in s.recipes) if (DISH[k]) G.recipes[k] = 1; } else migrateRecipes(); syncNotes(); grantAccs(); emit('buffs');
  unstick(G.p, '사방이 막혀 있어서 바로 바깥으로 옮겨 드렸어요'); // a save left stuck inside a closed fence
  if (Number.isFinite(s.at) && s.at > 1.6e12) advanceOffline((Date.now() - s.at) / 1000); // v59: time passed while the game was closed
  G.pname = typeof s.pname === 'string' && s.pname.trim() ? Array.from(s.pname).slice(0, 8).join('') : null; // v117 지은 이름 (옛 세이브는 없음 = 고른 캐릭터 이름)
  G.seen = {}; if (s.seen && typeof s.seen === 'object') { for (const k in s.seen) if (ITEMS[k] && [1, 2, 3].includes(s.seen[k])) G.seen[k] = s.seen[k]; } else migrateSeen77(); // v77: 본 적 있는 물건 (빨간 점)
  emit('loaded'); // 화면: 지도 그림 다시 만들기·카메라 옮기기 (ui/feedback.js)
}
// the deep bosses drop their light seed themselves (the altar empties), so it can never go missing
export function deepSeedDrop(k, S, b) { G.stats.deepSeed = G.stats.deepSeed || {}; if (G.stats.deepSeed[k]) return; G.stats.deepSeed[k] = 1; const sh = G.objs.get(idx(S.x, S.y)); if (sh && sh.t === 'shrine') sh.has = 0; spawnDrop('lightSeed', 1, b.x, b.y); }
