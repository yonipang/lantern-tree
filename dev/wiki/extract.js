// 게임 안에서 실행해서 위키에 쓸 데이터를 모아요 (build_wiki.py가 페이지에 넣어 실행)
// 게임 코드 속 레지스트리를 그대로 읽어서, 게임이 바뀌면 다시 돌리기만 하면 위키도 따라 바뀌어요
async () => {
  const T = window.__W();
  const { ITEMS, OBJ, RECIPES, ENEMY, BOSSES, GUIDE, QSIDE, SKILLS, SK_CAT, STATN, ANIMALS, RINGS, REGION_MAT, WALLS, BIOME, CATCH, STN, RARITY, RAR, TIERNAME, DISH, EFF, BUFF_DUR, REMATCH, UNIQ_OF, ACC_OF, SPR, CROP_SOIL, SOIL_N, STAR_OF, MAX_LV, BAG_UPS, MULTI, TIPS, KNOWN0 } = T;
  const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const val = v => { try { return typeof v === 'function' ? v() : v; } catch (e) { return ''; } };
  const cv2url = c => { try { if (Array.isArray(c)) c = c[0]; if (!c) return null; if (c.toDataURL) return c.toDataURL(); } catch (e) {} return null; };
  const icon = id => { try { return T.iconURL(id); } catch (e) { return null; } };
  const skip = id => id.startsWith('rn_') || id === 'anyPetal';

  // ---- 아이템 ----
  const items = {};
  for (const id in ITEMS) {
    if (skip(id)) continue; const it = ITEMS[id];
    const o = { n: it.n, d: strip(val(it.d)), kind: it.kind || 'mat' };
    for (const k of ['wt', 'dmg', 'power', 'tier', 'food', 'heal', 'slot', 'ring', 'star', 'wall', 'floor', 'obj', 'bagUp', 'mat', 'stack']) if (it[k] != null && typeof it[k] !== 'function') o[k] = it[k];
    if (it.buff) o.buff = it.buff;
    if (RAR[id] != null) o.rar = RAR[id];
    try { const b = T.buffText(it); if (b) o.buffT = b; } catch (e) {}
    o.icon = icon(id);
    items[id] = o;
  }
  // 요리에 쓰는 "아무 꽃잎"
  items.anyPetal = { n: '아무 꽃잎', d: '어느 색 꽃잎이든 쓸 수 있어요.', kind: 'mat', icon: icon('petalR'), virtual: 1 };

  // ---- 제작법 ----
  const stn = Object.assign({ hand: '손 제작' }, STN);
  const lockText = r => { if (!r.need) return ''; const s = String(r.need); const m = s.match(/beat\('(\w+)'\)/); if (m && BOSSES[m[1]]) return BOSSES[m[1]].n + ' 처치 후';
    if (/hasCgen/.test(s)) return '수정 발전기를 만든 뒤'; if (/knows/.test(s)) return '별 작물이 있을 때'; return '조건이 맞으면'; };
  const recipes = RECIPES.filter(r => ITEMS[r.out]).map(r => ({ out: r.out, n: r.n, req: r.req.map(([id, c]) => [id, c]), at: r.at || 'hand', tier: r.tier || 0, cat: r.cat || '', dish: r.dish || null, star: r.star || null, lock: lockText(r) }));
  for (const [id, n, req, at] of BAG_UPS || []) if (!recipes.some(r => r.out === id)) recipes.push({ out: id, n: 1, req, at, cat: 'tool' });

  // ---- 요리 ----
  const dishes = {};
  for (const id in DISH) { const d = DISH[id]; let hint = ''; try { hint = strip(T.noteHint(d)); } catch (e) {}
    dishes[id] = { ef: d.ef, tier: d.tier, src: d.src, hint }; }
  const eff = {}; for (const k in EFF) eff[k] = { n: EFF[k].n, t: EFF[k].v.map(v => EFF[k].t(v)) };

  // ---- 벽·광맥 ----
  const walls = {}; for (const k in WALLS) { const w = WALLS[k]; if (w.tier >= 9) continue; walls[k] = { n: w.n, tier: w.tier, tierN: TIERNAME[w.tier] || '', hp: w.hp, drop: w.drop }; }

  // ---- 자연물 (나무·바위·풀·작물) ----
  const objs = {};
  for (const k in OBJ) { const o = OBJ[k]; if (o.drops && o.drops.length && !o.station) objs[k] = { n: o.n, drops: o.drops, img: cv2url(SPR.obj && SPR.obj[k]) }; }
  const crops = {};
  for (const k in OBJ) { const o = OBJ[k]; if (o.grow && o.yield) crops[k] = { n: o.n, crop: o.crop, grow: o.grow, yield: o.yield, soil: CROP_SOIL[k] ? SOIL_N[CROP_SOIL[k]] : '', seed: Object.keys(ITEMS).find(i => ITEMS[i].crop === k) || null }; }

  // ---- 몬스터 ----
  const SPAWN = { 0: [['slimeG', 100]], 1: [['slimeO', 55], ['shroomy', 45]], 2: [['slimeP', 75], ['shroomy', 25]], 3: [['magmaSlime', 55], ['cinder', 45]], 4: [['frostSlime', 55], ['snowling', 45]] };
  const enemies = {};
  for (const k in ENEMY) { const e = ENEMY[k]; if (k === 'spiritClone') continue;
    const where = []; for (const b in SPAWN) for (const [kk, w] of SPAWN[b]) if (kk === k) where.push([+b, w]);
    enemies[k] = { n: e.n, hp: e.hp, dmg: e.dmg, spd: e.spd, calm: !!e.calm, drops: e.drops || [], where, img: cv2url(SPR[k]) }; }

  // ---- 보스 ----
  const FIRST = { queen: [['shroomCap', 10], ['glowcap', 6], ['ironBar', 4], ['spore', 3]], slime: [['lightSeed', 1], ['gel', 8], ['copperBar', 5], ['ironOre', 4]],
    golem: [['golemCore', 1], ['crystal', 8], ['cryGem', 3], ['ironBar', 5]], turtle: [['lightSeed', 1], ['lavaCore', 2], ['goldBar', 6], ['obsidian', 4]], spirit: [['lightSeed', 1], ['frostCore', 2], ['frostShard', 10], ['goldBar', 3]] };
  const BXP = { queen: 120, slime: 200, golem: 320, turtle: 450, spirit: 500 };
  const BREG = { slime: 0, queen: 1, golem: 2, turtle: 3, spirit: 4 };
  const bosses = {};
  for (const k of ['queen', 'slime', 'golem', 'turtle', 'spirit']) { const b = BOSSES[k];
    const notes = Object.keys(DISH).filter(id => DISH[id].src === 'boss:' + k);
    bosses[k] = { n: b.n, hp: b.hp, xp: BXP[k], region: BREG[k], first: FIRST[k], rematch: REMATCH[k] || [], uniq: UNIQ_OF[k] || null, acc: ACC_OF[k] || null, notes, img: cv2url(SPR[b.spr]) }; }

  // ---- 퀘스트 ----
  const story = GUIDE.map(q => ({ id: q.id, t: strip(val(q.t)).replace(/ \([^)]*\)$/, ''), h: strip(q.h), rw: q.rw || [], xp: q.xp || 0 }));
  const side = QSIDE.map(q => ({ id: q.id, t: strip(val(q.t)).replace(/ \([^)]*\)$/, ''), h: strip(q.h), rw: q.rw || [], xp: q.xp || 0 }));

  // ---- 스킬·능력치 ----
  const skills = {};
  for (const k in SKILLS) { const s = SKILLS[k]; const lv = []; for (let l = 1; l <= s.max; l++) lv.push({ d: strip(s.d(l)), mp: s.mp ? s.mp(l) : null, cd: s.cd ? s.cd(l) : null });
    skills[k] = { n: s.n, act: !!s.act, lv: s.lv, max: s.max, steps: lv, icon: icon('sk_' + k) }; }
  const skcat = SK_CAT.map(([id, n, ks]) => ({ id, n, ks }));
  const stats = {}; for (const k in STATN) stats[k] = { n: STATN[k][0], d: STATN[k][1] };

  // ---- 동물·반지·지역 ----
  const animals = {};
  for (const k in ANIMALS) { const a = ANIMALS[k]; let img = null; try { img = cv2url(T.animalImg(k)); } catch (e) {}
    animals[k] = { n: a.n, pn: a.pn || '', biome: a.biome, pet: !!a.pet, fx: a.fx || '', ranch: a.ranch || null, every: a.every || null, img }; }
  const rings = {}; for (const id in RINGS) { const [n, k, b, per, req, rar] = RINGS[id]; rings[id] = { n, k, b, per, req, rar }; }
  const catchT = {}; for (const b in CATCH) catchT[b] = CATCH[b];

  return { ver: T.VER || '', benchN: T.BENCH_N || [], items, recipes, stn, dishes, eff, buffDur: BUFF_DUR, walls, objs, crops, enemies, bosses, story, side, skills, skcat, stats, maxLv: MAX_LV,
    tips: (TIPS || []).map(strip), known0: KNOWN0 || [],
    animals, rings, regionMat: REGION_MAT, biome: BIOME, catch: catchT, rarity: RARITY, tierN: TIERNAME, star: STAR_OF };
}
