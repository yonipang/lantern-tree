// ================= state =================
const SAVE_KEY = 'lantern-tree-save-v1';
// each playthrough gets its own id so cloud sync never mixes two different adventures
const newRunId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// play time: counts only while the game is open, visible and someone touched it in the last 2 minutes
let lastInputAt = 0; const IDLE_LIMIT = 120;
function fmtPlay(sec, est) { sec = Math.max(0, Math.floor(sec || 0)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); const t = h ? `${h}시간 ${m}분` : m ? `${m}분` : '1분 미만'; return (est ? '약 ' : '') + t; }
let G = null;
let TP = 48, Z = 3, DPR = 1;
const cam = { x: CX + .5, y: CY + 2 };
let shake = 0, paused = true, started = false, soundOn = true;
const beat = k => !!(G && ((G.bossDead || {})[k] || (G.stats && G.stats.beaten || {})[k]));
const freshStats = () => ({ wood: 0, bench: 0, torch: 0, copperOre: 0, copperBar: 0, seedsFound: 0 });
const BOSSES = {
  slime: { n: '말랑대왕', hp: 720, home: () => ({ x: BX + .5, y: BY + .5 }), wake: 8.5, hr: .95, col: '#86d96b', spr: 'boss', scale: 1.25 },
  queen: { n: '버섯 여왕', hp: 700, home: () => ({ x: SA.x + .5, y: SA.y - 3 }), wake: 8, hr: 1.0, col: '#b673de', spr: 'queen', scale: 1.15 },
  golem: { n: '수정골렘', hp: 1500, home: () => ({ x: SB.x + .5, y: SB.y + 4.2 }), wake: 8, hr: 1.1, col: '#b493f5', spr: 'golem', scale: 1.2 },
  turtle: { n: '용암 거북', hp: 2300, home: () => ({ x: SL.x + .5, y: SL.y - 3.5 }), wake: 8, hr: 1.2, col: '#ff8a3d', spr: 'turtle', scale: 1.2 },
  spirit: { n: '서리 정령', hp: 2000, home: () => ({ x: SI.x + 4, y: SI.y + .5 }), wake: 8, hr: 1.0, col: '#9fd8f0', spr: 'spirit', scale: 1.15 },
};
const BKEYS = ['slime', 'queen', 'golem', 'turtle', 'spirit'];
const freshBoss = k => { const h = BOSSES[k].home(); return { k, x: h.x, y: h.y, hp: BOSSES[k].hp, max: BOSSES[k].hp, st: 'sleep', t: 0, z: 0, air: 0, airMax: 1, vx: 0, vy: 0, lands: 0, hurt: 0, ph: 'walk', casts: 0, rot: 0, dx: 0, dy: 1, d: 99, poison: null, burn: null, stage: 1, inv: 0, pillars: [] }; };
const freshBosses = () => Object.fromEntries(BKEYS.map(k => [k, freshBoss(k)]));
const freshDead = () => Object.fromEntries(BKEYS.map(k => [k, false]));
const guardOf = (x, y) => (x === SA.x && y === SA.y) ? 'queen' : (x === SB.x && y === SB.y) ? 'golem' : (x === SL.x && y === SL.y) ? 'turtle' : (x === SI.x && y === SI.y) ? 'spirit' : null;
function newGame(seed) {
  setLayout(devLayout() || 2); setFootprints(2); const w = genWorld(seed);
  G = { seed, ...w, explored: new Uint8Array(W * H), inv: Array(HOT + BAG0).fill(null), sel: 0, bagLv: 0,
    p: { x: CX + .5, y: CY + 1.7, hp: 100, hunger: 100, face: { x: 0, y: 1 }, dir: 'down', flip: false, anim: 0, moving: false, inv: 0, hurt: 0, kx: 0, ky: 0, dead: 0 },
    enemies: [], drops: [], parts: [], texts: [], bosses: freshBosses(), bossDead: freshDead(), shots: [], fish: null, fishFx: null, stats: freshStats(), time: 0, spawnPt: null, treeSeeds: 0, won: false, guide: 0, wdmg: new Map(), swing: null, biomeNow: 0 };
  G.inv[0] = { id: 'berry', c: 4 }; G.inv[1] = { id: 'berrySeed', c: 2 }; [['pickWood', 1], ['swordWood', 1]].forEach(([id, c]) => addItem(id, c, false)); G.newIds = {};
  G.stats.nm58 = 1; G.stats.nm61 = 1; G.sel = 3; /* v48: start with an empty hand (berries · seeds · wooden sword sit in slots 1–3) */ G.outfit = 0; G.char = 'sprout'; G.look = cleanLook(); CHARS.custom = lookDef(G.look); G.marks = []; G.under = new Map(); G.terrain = {}; G.rpg = freshRpg(); G.qclaim = {}; G.wire = new Map(); G.hz = []; G.pshots = []; G.skcd = {}; G.p.mp = maxMp(); G.fzones = genFlowerZones(); G.regen = []; G.run = newRunId(); G.playT = 0; G.playTEst = false; G.qt = {}; G.rooms = placeRooms(w); refreshDoors(); G.recipes = {}; G.buffs = []; G.equip = freshEquip(); G.stats.qv = 1; G.pets = {}; G.petOn = null; G.wild = []; G.petE = null; G.env = { k: null, v: 0, lv: 0, t: 0 }; buildPlayer(0);
  rebuildMap(); cam.x = G.p.x; cam.y = G.p.y;
}
const rle = a => { const o = []; let p = a[0], n = 1; for (let i = 1; i < a.length; i++) { if (a[i] === p && n < 65535) n++; else { o.push(p, n); p = a[i]; n = 1; } } o.push(p, n); return o; };
const unrle = (r, len) => { const a = new Uint8Array(len); let k = 0; for (let i = 0; i < r.length; i += 2) { a.fill(r[i], k, k + r[i + 1]); k += r[i + 1]; } return a; };
function serialize() {
  if (!G) return null; const p = G.p;
  return { v: 3, seed: G.seed, wall: rle(G.wall), floor: rle(G.floor), biome: rle(G.biome), explored: rle(G.explored), objs: [...G.objs], inv: G.inv, invV: 2, bagLv: G.bagLv || 0, sel: G.sel, outfit: G.outfit || 0, char: G.char || 'sprout', look: G.look || LOOK_DEF,
    p: { x: p.x, y: p.y, hp: p.hp, hunger: p.hunger, mp: p.mp }, rpg: G.rpg, qclaim: G.qclaim || {}, wire: [...(G.wire || new Map())], fzones: G.fzones || [], regen: G.regen || [], stats: G.stats, time: G.time, spawnPt: G.spawnPt, treeSeeds: G.treeSeeds, won: G.won, won2: !!G.won2, bossDead: G.bossDead, guide: G.guide, at: Date.now(), marks: G.marks || [], under: [...G.under], terrain: G.terrain || {}, run: G.run || newRunId(), playT: Math.round(G.playT || 0), playTEst: !!G.playTEst, qt: G.qt || {}, rooms: G.rooms || [], recipes: G.recipes || {}, buffs: activeBuffs(), mapV: LAY, fpV: FPV, equip: G.equip || freshEquip(), pets: G.pets || {}, petOn: G.petOn || null, backPt: G.backPt || null, recallCd: G.recallCd || 0, env: G.env ? { k: G.env.k, v: Math.round(G.env.v) } : null };
}
function deserialize(s) {
  setLayout(s.mapV === 2 ? 2 : 1); // saves from before v47 keep the original 200×200 map
  setFootprints(2); const oldFp = s.fpV !== 2; // v56: saves from before v50 get the 2×1 workbench and benches too (growFootprints below)
  const N = W * H;
  G = { seed: s.seed, wall: unrle(s.wall, N), floor: unrle(s.floor, N), biome: unrle(s.biome, N), explored: unrle(s.explored, N), objs: new Map(s.objs), inv: s.inv, sel: s.sel || 0,
    p: { x: s.p.x, y: s.p.y, hp: s.p.hp, hunger: s.p.hunger, face: { x: 0, y: 1 }, dir: 'down', flip: false, anim: 0, moving: false, inv: 0, hurt: 0, kx: 0, ky: 0, dead: 0 },
    enemies: [], drops: [], parts: [], texts: [], bosses: freshBosses(), bossDead: (s.bossDead && typeof s.bossDead === 'object') ? Object.assign(freshDead(), s.bossDead) : Object.assign(freshDead(), { slime: !!s.bossDead }), shots: [], fish: null, fishFx: null, stats: Object.assign(freshStats(), s.stats), time: s.time || 0, spawnPt: s.spawnPt, treeSeeds: s.treeSeeds || 0,
    won: !!s.won, won2: !!s.won2, guide: s.guide || 0, wdmg: new Map(), swing: null, biomeNow: 0 };
  G.bagLv = clamp(Math.floor(+s.bagLv || 0), 0, BAG_MAX_LV);
  if ((s.invV || 1) < 2) migrateBagV2();
  while (G.inv.length < invSize()) G.inv.push(null); if (G.inv.length > invSize()) { const extra = G.inv.splice(invSize()).filter(Boolean); G.inv.push(...[]); G.__extra = extra; }
  if ((s.v || 1) < 2) migrateV2();
  G.wire = new Map(Array.isArray(s.wire) ? s.wire : []); G.under = new Map(Array.isArray(s.under) ? s.under : []);
  if ((s.v || 1) < 3) migrateV3();
  if (!G.stats.qv) { addQuartzVeins(); G.stats.qv = 1; } // v43: older crystal caves get the new quartz veins inside their granite
  const oldWp = loadEquip(s.equip); // v42 equipment slots; v48: the weapon of the old weapon slot (moved to the hotbar below)
  G.pets = {}; if (s.pets && typeof s.pets === 'object') for (const k in s.pets) if (ANIMALS[k] && ANIMALS[k].pet && s.pets[k]) G.pets[k] = 1; G.petOn = G.pets[s.petOn] ? s.petOn : null; G.wild = []; G.petE = null; // v45 pets
  G.env = s.env && ['hot', 'cold'].includes(s.env.k) && Number.isFinite(s.env.v) ? { k: s.env.k, v: clamp(s.env.v, 0, 100), lv: 9, t: 0 } : { k: null, v: 0, lv: 0, t: 0 };
  G.backPt = s.backPt && Number.isFinite(s.backPt.x) && Number.isFinite(s.backPt.y) ? { x: s.backPt.x, y: s.backPt.y } : null; G.recallCd = Number.isFinite(s.recallCd) ? s.recallCd : 0; G.recall = null;
  G.look = cleanLook(s.look); CHARS.custom = lookDef(G.look); G.char = CHARS[s.char] ? s.char : 'sprout'; G.outfit = s.outfit || 0; buildPlayer(G.outfit);
  const roofBack = refundRoofItems(); // v41: roofs were removed — roof items turn back into their material
  const known = x => x && ITEMS[x.id] && !ITEMS[x.id].virtual ? x : null;
  G.inv = G.inv.map(known); for (const o of G.objs.values()) if (o.items) o.items = o.items.map(known);
  if (!(G.sel >= 0 && G.sel < HOT)) G.sel = 0; G.newIds = {};
  if (G.__extra) { for (const x of G.__extra) moveInto(G.inv, x); delete G.__extra; }
  convertDrills(); // v46: old stone drills become stone pits
  if (oldWp) moveOldWeapon(oldWp);
  if (!G.stats.nm58) noticeRename58(); // v58 rename notice for older saves
  G.guide = 0; G.marks = Array.isArray(s.marks) ? s.marks.filter(m => m && Number.isInteger(m.x) && Number.isInteger(m.y)) : [];
  G.under = new Map(Array.isArray(s.under) ? s.under : []); refundRoofTiles(s.roof, roofBack); G.terrain = (s.terrain && typeof s.terrain === 'object') ? s.terrain : {};
  G.fzones = Array.isArray(s.fzones) && s.fzones.length ? cleanZones(s.fzones) : genFlowerZones(); G.regen = Array.isArray(s.regen) ? s.regen.filter(r => Array.isArray(r) && Number.isInteger(r[0]) && OBJ[r[1]]).slice(0, 600) : [];
  G.qclaim = (s.qclaim && typeof s.qclaim === 'object') ? s.qclaim : {}; G.wire = new Map(Array.isArray(s.wire) ? s.wire : []);
  G.buffs = Array.isArray(s.buffs) ? s.buffs.filter(b => b && EFF[b.ef] && [1, 2, 3].includes(b.tier) && Number.isFinite(b.end) && b.end > G.time && ITEMS[b.id]).slice(0, BUFF_MAX).map(b => ({ ef: b.ef, tier: b.tier, end: b.end, max: Number.isFinite(b.max) ? b.max : b.end - G.time, id: b.id })) : [];
  G.rpg = cleanRpg(s.rpg); G.hz = []; G.pshots = []; G.skcd = {}; G.p.mp = Number.isFinite(s.p.mp) ? Math.min(s.p.mp, maxMp()) : maxMp(); G.p.hp = Math.min(G.p.hp, maxHp());
  G.stats.beaten = G.stats.beaten || {}; for (const k of BKEYS) if (G.bossDead[k]) G.stats.beaten[k] = 1;
  G.run = typeof s.run === 'string' && s.run ? s.run : newRunId();
  G.playTEst = !Number.isFinite(s.playT) || !!s.playTEst; G.playT = Number.isFinite(s.playT) ? s.playT : Math.max(0, Math.round(+s.time || 0));
  G.qt = {}; if (s.qt && typeof s.qt === 'object') for (const k in s.qt) if (Number.isFinite(s.qt[k])) G.qt[k] = s.qt[k];
  for (const [i, o] of [...G.objs]) if (o.t === 'icePillar') G.objs.delete(i); // ice pillars only last for one fight
  if (!G.stats.nm61) migrateGear61();
  migrateForges60(oldFp); // v60
  if (oldFp) growFootprints(); fixParts(); grantUniques(); ensureDeepAltars();
  G.rooms = Array.isArray(s.rooms) ? cleanRooms(s.rooms) : placeRooms(genWorld(G.seed)); refreshDoors(); // saves from before hidden rooms get them carved in now
  G.recipes = {}; if (s.recipes && typeof s.recipes === 'object') { for (const k in s.recipes) if (DISH[k]) G.recipes[k] = 1; } else migrateRecipes(); syncNotes(); grantAccs(); buffDirty = true;
  unstick(G.p, '사방이 막혀 있어서 바로 바깥으로 옮겨 드렸어요'); // a save left stuck inside a closed fence
  if (Number.isFinite(s.at) && s.at > 1.6e12) advanceOffline((Date.now() - s.at) / 1000); // v59: time passed while the game was closed
  rebuildMap(); cam.x = G.p.x; cam.y = G.p.y;
}
// the deep bosses drop their light seed themselves (the altar empties), so it can never go missing
function deepSeedDrop(k, S, b) { G.stats.deepSeed = G.stats.deepSeed || {}; if (G.stats.deepSeed[k]) return; G.stats.deepSeed[k] = 1; const sh = G.objs.get(idx(S.x, S.y)); if (sh && sh.t === 'shrine') sh.has = 0; spawnDrop('lightSeed', 1, b.x, b.y); }
