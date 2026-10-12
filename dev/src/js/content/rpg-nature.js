// skill points earned by a level: one per level up, plus a bonus one at the top level (10 skills × 3 steps = 30)
const spDue = lv => lv - 1 + (lv >= MAX_LV ? 1 : 0);
const freshRpg = () => ({ lv: 1, xp: 0, pts: 0, sp: 0, str: 0, dex: 0, vit: 0, int: 0, sk: {}, slot: [null, null] });
function cleanRpg(r) {
  const f = freshRpg(); if (!r || typeof r !== 'object') return f;
  for (const k of ['lv', 'xp', 'pts', 'sp', 'str', 'dex', 'vit', 'int']) f[k] = Math.max(0, Math.floor(+r[k] || 0)); f.lv = clamp(f.lv || 1, 1, MAX_LV);
  if (r.sk && typeof r.sk === 'object') for (const k in r.sk) if (SKILLS[k]) { const l = clamp(Math.floor(+r.sk[k] || 0), 0, SKILLS[k].max); if (l) f.sk[k] = l; }
  const spent = Object.values(f.sk).reduce((a, l) => a + l, 0), due = spDue(f.lv); if (spent + f.sp < due) f.sp = due - spent; // older saves at the top level never got the bonus point
  if (Array.isArray(r.slot)) f.slot = [0, 1].map(i => { const k = r.slot[i]; return SKILLS[k] && SKILLS[k].act && f.sk[k] ? k : null; });
  return f;
}
const skl = k => (G && G.rpg && G.rpg.sk[k]) || 0;
const RS = k => (G && G.rpg ? G.rpg[k] : 0);
const maxHp = () => 100 + RS('vit') * 8 + bval('maxhp');
const maxMp = () => 40 + RS('int') * 6 + skl('arcane') * 8;
const meleeMul = () => (1 + RS('str') * 0.05) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('warrior') * .06);
const rangeMul = () => (1 + RS('dex') * 0.03) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('hawk') * .08);
const magicMul = () => (1 + RS('int') * 0.035) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('arcane') * .06);
const atkSpd = () => (1 - Math.min(0.2, RS('dex') * 0.01)) * (envLv('cold') >= 2 ? 1.1 : 1);
const moveMul = () => (1 + Math.min(0.15, RS('dex') * 0.01) + skl('swift') * 0.06) * (1 + bval('move')) * [1, .9, .8, .8][envLv('cold')];
const mineMul = () => (1 + RS('str') * 0.03) * (1 + skl('miner') * 0.25) * (1 + bval('mine')) * (1 + ringV('mine'));
const hungerMul = () => Math.max(0.4, (1 - Math.min(0.3, RS('vit') * 0.02)) * (1 - skl('gourmet') * 0.15)) * (bval('hunger') || 1) * [1, 1.3, 1.6, 1.6][envLv('hot')];
function gainXp(n, x, y) {
  const R = G && G.rpg; if (!R || !(n > 0) || R.lv >= MAX_LV) return; n = Math.max(n, Math.round(n * (1 + bval('xp') + ringV('xp')))); R.xp += n;
  if (x != null && n >= 3) ftext(x, y - 0.9, `+${n} 경험치`, '#b8e0ff');
  let up = 0; while (R.lv < MAX_LV && R.xp >= XP_NEED(R.lv)) { R.xp -= XP_NEED(R.lv); R.lv++; R.pts += 2; R.sp += 1; up++; }
  if (R.lv >= MAX_LV) { R.xp = 0; if (up) R.sp += 1; } // reaching the top level gives one more skill point (since v44 there are more skills than points: 스킬 다시 배우기 is free)
  if (up) { const p = G.p; p.hp = maxHp(); p.mp = maxMp(); puff(p.x, p.y - .5, '#ffe9a8', 26, 3.5, .8); ftext(p.x, p.y - 1.6, `Lv.${R.lv}!`, '#ffd25c'); SFX.seed(); toast(R.lv >= MAX_LV ? `최고 레벨 Lv.${R.lv}! 보너스 스킬 포인트 +1 · [능력]에서 올려요` : `레벨 업! Lv.${R.lv} · [능력]에서 능력치와 스킬을 올려요`, 'good'); if (panel && panel.kind === 'stat') renderPanel(); }
}
const WATER = 10;
function genFlowerZones() {
  const R = rng((G.seed | 0) * 7 + 99), zones = [];
  for (const c of ['R', 'B', 'Y', 'W', 'K', 'R', 'B', 'Y', 'W', 'K']) {
    for (let tries = 0; tries < 1200; tries++) {
      const loose = tries >= 500, far = c === 'K', a = R() * 6.283, d = loose ? 14 + R() * 50 : (far ? 40 : 16) + R() * (far ? 22 : 28), x = Math.floor(CX + Math.cos(a) * d), y = Math.floor(CY + Math.sin(a) * d);
      if (x < 4 || y < 4 || x >= W - 4 || y >= H - 4 || G.biome[idx(x, y)] !== 0) continue;
      if (zones.some(z => Math.hypot(z.x - x, z.y - y) < (loose ? 10 : 13)) || Math.hypot(x - BX, y - BY) < 12) continue;
      let open = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const j = idx(x + dx, y + dy); if (!G.wall[j] && G.floor[j] !== WATER) open++; }
      if (open < (loose ? 12 : 17)) continue;
      zones.push({ x, y, c, dead: [] });
      for (let k = 0; k < 14; k++) { const fx = x + Math.round((R() - .5) * 7), fy = y + Math.round((R() - .5) * 7), j = idx(fx, fy); if (!G.wall[j] && !G.objs.get(j) && [1, 2].includes(G.floor[j])) G.objs.set(j, { t: 'wildF', c }); }
      break;
    }
  }
  return zones;
}
const cleanZones = zs => zs.filter(z => z && Number.isInteger(z.x) && Number.isInteger(z.y) && FLOWERS[z.c]).map(z => ({ x: z.x, y: z.y, c: z.c, dead: Array.isArray(z.dead) ? z.dead.filter(Number.isFinite) : [] }));
function zoneTick() {
  const p = G.p; if (p.dead > 0 || !G.fzones) return;
  G.fzones.forEach((z, zi) => {
    z.dead = z.dead.filter(t => t > G.time);
    if (Math.hypot(z.x + .5 - p.x, z.y + .5 - p.y) > 26 || (z.next || 0) > G.time) return;
    const alive = G.enemies.reduce((n, e) => n + (e.zone === zi ? 1 : 0), 0), cap = z.c === 'K' ? 2 : 3;
    if (alive + z.dead.length >= cap) return;
    for (let k = 0; k < 10; k++) { const x = Math.floor(z.x + (rand() - .5) * 6), y = Math.floor(z.y + (rand() - .5) * 6);
      if (!inB(x, y) || isSolid(x, y) || Math.hypot(x + .5 - p.x, y + .5 - p.y) < 3.5) continue;
      const e = mkEnemy('bloom' + z.c, x + .5, y + .6); e.zone = zi; G.enemies.push(e); puff(x + .5, y + .4, FLOWERS[z.c][2], 8, 2, .3); z.next = G.time + 1.5; break; }
  });
}
const isYoung = o => !!(o && o.yg && G.time < o.yg);
// -1 bare stump, 0 sapling, 1 young sapling, 2 young tree (can be cut for a little wood), 3 grown. Worked out from times already saved, so old saves need nothing new
function treeStep(o) { const d = OBJ[o.t]; if (d.growTo) { const r = (o.at || 0) - G.time; return d.stump && r > 3 * YOUNG_T ? -1 : r > 2 * YOUNG_T ? 0 : 1; } return isYoung(o) ? 2 : 3; }
const youngDrops = drops => drops.filter(([id, , , ch]) => ch >= 1 && !['sapling', 'capSapling', 'resin'].includes(id)).map(([id, a, b]) => [id, Math.max(1, Math.ceil(a / 2)), Math.max(1, Math.ceil(b / 2)), 1]);
function afterCut(t, o) {
  const i = idx(t.x, t.y);
  if (o.t === 'root' || o.t === 'bigShroom') G.objs.set(i, { t: o.t === 'root' ? 'stump' : 'capStump', g: o.t, at: G.time + REGROW_TIME });
  else if (OBJ[o.t] && OBJ[o.t].ntree) G.objs.set(i, { t: 'stump', g: o.t, at: G.time + REGROW_TIME });
  else if (o.t === 'grass' || o.t === 'glow' || o.t === 'wildF') { G.regen = G.regen || []; if (G.regen.length < 600) G.regen.push([i, o.t, G.time + (o.t === 'grass' ? 120 : 200), o.c || null]); }
  if (o.t === 'wildF') rollDrops([['petal' + (FLOWERS[o.c] ? o.c : 'R'), 1, 1, 0.35]], t.x + .5, t.y + .5);
}
function growTick(dt = 2) {
  // crops: lantern-tree blessing (time ×0.8) and water (time ×0.75) add up, but never below half the normal time
  const BR = TREE_BLESS(treeStage());
  for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (!d || !d.crop || o.p == null) continue; if (G.time - o.p >= d.grow) { if (o.star == null) rollStar(i, o); giantTry(i, o); continue; } let k = 0; if (BR && Math.hypot(i % W - CX, ((i / W) | 0) - CY) <= BR) k += .25; if (o.w) k += 1 / 3; if (k) { o.p -= dt * k; clampCrop(o); } }
  const p = G.p, inside = (x, y) => Math.abs(x + .5 - p.x) < .8 && Math.abs(y + .5 - p.y) < .8;
  for (const [i, o] of G.objs) { if (o.yg && G.time >= o.yg) { delete o.yg; const x = i % W, y = (i / W) | 0; if (Math.hypot(x - p.x, y - p.y) < 20) puff(x + .5, y + .2, '#9be37a', 6, 2, .3); } }
  for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (!d || !d.growTo || G.time < (o.at || 0) - YOUNG_T) continue; const x = i % W, y = (i / W) | 0;
    if (inside(x, y)) { o.at = Math.max(o.at || 0, G.time + 4 + YOUNG_T); continue; }
    const nt = d.growTo === 'g' ? (OBJ[o.g] ? o.g : 'root') : d.growTo, yg = (o.at || 0) > G.time ? o.at : 0, no = yg ? { t: nt, yg } : { t: nt };
    if (OBJ[nt].sz) { G.objs.delete(i); if (!fpFree(x, y, fpOf(no), true)) { G.objs.set(i, o); o.at = G.time + 10 + YOUNG_T; continue; } G.objs.set(i, no); setParts(i, no); } else G.objs.set(i, no); if (Math.hypot(x - p.x, y - p.y) < 20) puff(x + .5, y + .6, '#9be37a', 8, 2, .3); lightDirty = true; }
  if (G.regen && G.regen.length) G.regen = G.regen.filter(([i, t, at, c]) => { if (at > G.time) return true; if (!OBJ[t] || G.wall[i] || G.objs.get(i) || ![1, 2, 3].includes(G.floor[i])) return false; const x = i % W, y = (i / W) | 0; if (inside(x, y)) return true; const o = { t }; if (c) o.c = c; G.objs.set(i, o); return false; });
}
function digPlant(t, o) {
  const d = OBJ[o.t], i = idx(t.x, t.y); delObj(i);
  const id = d.bush ? 'berryBush' : o.t === 'sapling' ? 'sapling' : o.t === 'capSapling' ? 'capSapling' : d.stump && o.g && OBJ[o.g] && OBJ[o.g].ntree && ITEMS[o.g] ? o.g : 'wood';
  const l = addItem(id, 1, false); if (l) spawnDrop(id, 1, t.x + .5, t.y + .5);
  SFX.pick(); puff(t.x + .5, t.y + .7, '#9be37a', 7, 2.2); invDirty = true; lightDirty = true; const sv = selItem(); if (sv && sv.id === 'shovel') wear(sv);
  toast(d.bush ? '베리덤불을 퍼냈어요. 원하는 곳에 다시 심어요' : d.stump ? `${d.n}을(를) 뽑았어요` : `${d.n}을(를) 퍼냈어요`, null, 'digplant');
}
// ---- nature decorations ----
const WFLOOR = new Set([11, 12, 13, 14, 15]);
