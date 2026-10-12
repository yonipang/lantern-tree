// ---- hidden rooms: small walled rooms behind a cracked wall, one or two per region, each with a treasure chest ----
// placed on untouched rock only (compared with the world as first generated), so old saves get them too without touching anything the player built
const ROOM_N = [2, 2, 2, 1, 1], ROOM_DECO = ['mossLantern', 'sporeChime', 'cryVase', 'emberBowl', 'iceSwan'];
const ROOM_LOOT = [
  [[['berrySeed', 4], ['glowSpore', 2], ['copperBar', 4], ['rope', 3]], [['mossSpore', 3], ['resin', 3], ['gel', 5], ['berryS', 3]]],
  [[['glowSpore', 3], ['spore', 4], ['shroomCap', 4], ['ironBar', 2]], [['glowcapS', 3], ['gShroom', 6], ['gel', 6], ['copperBar', 5]]],
  [[['cbeanSeed', 3], ['crystal', 8], ['ironBar', 3]], [['cbeanS', 3], ['gCrystal', 6], ['crystal', 6], ['goldBar', 1]]],
  [[['obsidian', 4], ['goldBar', 2], ['fireBerry', 4], ['crystal', 4]]],
  [[['frostShard', 6], ['goldBar', 2], ['ironBar', 3], ['crystal', 4]]]];
let DOORS = new Set();
const refreshDoors = () => { DOORS = new Set((G.rooms || []).filter(r => !r.found).map(r => idx(r.dx, r.dy))); };
function placeRooms(w0) {
  const rooms = [], safe = [[CX, CY], [BX, BY], [SA.x, SA.y], [SB.x, SB.y], [SL.x, SL.y], [SI.x, SI.y]], cand = [[], [], [], [], []];
  for (let y = 4; y < H - 8; y += 2) for (let x = 4; x < W - 8; x += 2) { const b = G.biome[idx(x + 1, y + 1)]; if (b <= 4) cand[b].push([x, y, hash2(x, y, (G.seed | 0) + 77)]); }
  const natural = i => G.wall[i] && G.wall[i] !== 8 && G.wall[i] === w0.wall[i] && !G.objs.get(i) && !G.wire.has(i) && !G.under.has(i);
  const open = i => !G.wall[i] && G.floor[i] !== WATER && G.floor[i] !== LAVA && !G.objs.get(i);
  // the cracked wall faces an open tunnel on any side; a region that still has no room after that takes a door into plain rock
  for (let pass = 0; pass < 2; pass++) for (let b = 0; b < 5; b++) { cand[b].sort((a, c) => a[2] - c[2]); let n = rooms.filter(r => r.b === b).length; if (pass && n) continue;
    for (const [x, y] of cand[b]) { if (n >= ROOM_N[b]) break;
      if (safe.some(([sx, sy]) => Math.hypot(x + 2 - sx, y + 1 - sy) < 16) || rooms.some(r => Math.hypot(r.x - x, r.y - y) < 24)) continue;
      let ok = true; for (let yy = y - 1; yy <= y + 3 && ok; yy++) for (let xx = x - 1; xx <= x + 4; xx++) { const i = idx(xx, yy); if (!natural(i) || G.biome[i] !== b) { ok = false; break; } }
      if (!ok) continue;
      const h = hash2(x, y, 5) < .5 ? 0 : 1, sides = [[x + 1 + h, y + 3, 0, 1], [x - 1, y + 1, -1, 0], [x + 4, y + 1, 1, 0], [x + 1 + h, y - 1, 0, -1]];
      const door = sides.find(([dx, dy, ox, oy]) => inB(dx + ox, dy + oy) && open(idx(dx + ox, dy + oy))) || (pass ? sides[0] : null);
      if (!door) continue; const [dx, dy] = door;
      for (let yy = y; yy <= y + 2; yy++) for (let xx = x; xx <= x + 3; xx++) { const i = idx(xx, yy); G.wall[i] = 0; G.floor[i] = 6; G.wdmg.delete(i); }
      const spots = [[x + 1, y], [x + 2, y], [x + 1, y + 2], [x + 2, y + 2]].sort((a, c) => Math.hypot(c[0] - dx, c[1] - dy) - Math.hypot(a[0] - dx, a[1] - dy)), [cx, cy] = spots[0];
      G.objs.set(idx(cx, cy), { t: 'tchest', hid: 1 }); // stays dark until the room is found
      rooms.push({ id: 'r' + b + n, b, k: n, x, y, dx, dy, cx, cy, found: 0, open: 0, hint: 0 }); n++; } }
  return rooms;
}
const cleanRooms = a => a.filter(r => r && Number.isInteger(r.x) && Number.isInteger(r.y) && Number.isInteger(r.b) && r.b >= 0 && r.b < 5).map(r => ({ id: String(r.id || ''), b: r.b, k: r.k | 0, x: r.x, y: r.y, dx: r.dx | 0, dy: r.dy | 0, cx: r.cx | 0, cy: r.cy | 0, found: r.found ? 1 : 0, open: r.open ? 1 : 0, hint: r.hint ? 1 : 0 }));
function roomTick() {
  const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y); let ch = false;
  for (const r of G.rooms || []) { if (r.found) continue;
    if ((px >= r.x && px <= r.x + 3 && py >= r.y && py <= r.y + 2) || !G.wall[idx(r.dx, r.dy)]) { r.found = 1; ch = true; const tc = G.objs.get(idx(r.cx, r.cy)); if (tc) delete tc.hid; G.stats.rooms = (G.stats.rooms || 0) + 1; toast('숨은 방을 찾았어요! 보물상자를 열어 봐요', 'good', 'room'); SFX.seed(); continue; }
    if (!r.hint && Math.hypot(p.x - r.dx - .5, p.y - r.dy - .5) < 3.2) { r.hint = 1; toast('금 간 벽 틈으로 바람이 새어 나와요… 이 벽 너머에 뭔가 있는 것 같아요', null, 'roomhint'); } }
  if (ch) { refreshDoors(); lightDirty = true; }
}
function openTreasure(t, o) {
  if (o.open) return; o.open = 1; const r = (G.rooms || []).find(q => q.cx === t.x && q.cy === t.y); const loot = r ? (ROOM_LOOT[r.b][r.k] || ROOM_LOOT[r.b][0]).slice() : [['crystal', 3], ['gel', 3]];
  delete o.hid; if (r) { r.open = 1; if (!r.found) { r.found = 1; refreshDoors(); } if (r.k === 0) loot.push([ROOM_DECO[r.b], 1]); for (const id of roomNotes(r)) if (!knows(id)) loot.push(['rn_' + id, 1]); }
  for (const [id, c] of loot) spawnDrop(id, c, t.x + .5, t.y + .9);
  G.stats.chests = (G.stats.chests || 0) + 1; SFX.win(); puff(t.x + .5, t.y + .4, '#ffe9a8', 18, 2.8, .5); gainXp(20); toast('보물상자를 열었어요!', 'good'); lightDirty = true; checkGuide();
}
