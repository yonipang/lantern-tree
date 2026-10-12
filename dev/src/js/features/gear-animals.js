// ---- clothes (body) and charms (accessory): two slots; clothes halve the cold or heat gauge, charms come from the deep bosses ----
const WEAR_PAL = { obsCoat: ['#5a4a78', '#3a2f52', '#8a7ab0'], frostRobe: ['#8fd0f0', '#5a9ac8', '#d8f2ff'] };
const freshEquip = () => ({ body: null, head: null, neck: null, ring: null });
const eqSlotOf = id => { const it = ITEMS[id]; return !it ? null : it.kind === 'wear' ? it.slot : null; };
const wearing = id => !!(G && G.equip && EQ_SLOTS.some(([sl]) => G.equip[sl] && G.equip[sl].id === id));
const eqCopy = s => { const c = { id: s.id, c: 1 }; if (s.dur != null) c.dur = s.dur; if (s.lv) c.lv = s.lv; return c; };
function wearItem(i) { const s = G.inv[i], it = s && ITEMS[s.id], sl = s && eqSlotOf(s.id); if (!sl) return; const old = G.equip[sl];
  G.equip[sl] = eqCopy(s);
  G.inv[i] = old ? eqCopy(old) : null; // the clothes taken off go where the new ones were
  if (sl === 'body') buildPlayer(G.outfit || 0); emit('sfx', 'craft'); emit('puff', G.p.x, G.p.y - .5, sl === 'body' ? (WEAR_PAL[s.id] || ['#fff'])[0] : '#ffe9a8', 12, 2.2, .5);
  emit('toast', `${josa(it.n, '을', '를')} ${sl === 'body' ? '입었어요' : '달았어요'}`, 'good', 'wear'); invDirty = true; }
function unwear(slot) { const s = G.equip[slot]; if (!s) return; const left = moveInto(G.inv, eqCopy(s)); if (left) { emit('toast', '가방이 가득 찼어요', null, 'full'); return; } G.equip[slot] = null; if (slot === 'body') buildPlayer(G.outfit || 0); emit('sfx', 'place'); invDirty = true; }
// v48: a weapon picked up or made while no weapon sits in the hotbar goes into an empty hotbar slot, ready to hold
function autoHotWeapon(id) { if (!G || ITEMS[id].kind !== 'sword') return; for (let k = 0; k < HOT; k++) { const x = G.inv[k]; if (x && ITEMS[x.id] && ITEMS[x.id].kind === 'sword') return; }
  const to = G.inv.slice(0, HOT).findIndex(x => !x), k = G.inv.findIndex((x, j) => j >= HOT && x && x.id === id); if (to < 0 || k < 0) return;
  G.inv[to] = G.inv[k]; G.inv[k] = null; invDirty = true; if (started) emit('toast', `${josa(ITEMS[id].n, '을', '를')} 단축칸에 넣었어요 · 골라 들면 칼 버튼이 그 무기로 싸워요`, 'good', 'wphot'); }
const GROW_SPR = { bench: [2, 2], logBench: [2, 1], stoneBench: [2, 1],
  roundTree: [1.75, 1.75], root: [1.35, 1.35], bigShroom: [1.75, 1.75], cherryTree: [1.4, 1.4], bigTree: [1.5, 1.5] };
// v50: workstations and benches take as many tiles as in other games (stations 2×1, benches 2×1) — in games started
// from v50 on (save fpV: 2). Saves from before keep them at one tile. Benches can be turned; stations only flip.
// v51: beds are one tile again (1 wide, 1.5 tall picture); the extra tile of beds placed as 1×2 in v50 is dropped by fixParts.
// v55: the copper workbench (anvil), furnace and smelter are one tile again; their extra tile from v50~v54 is dropped by fixParts the same way.
const GREW = { bench: [2, 1], logBench: [2, 1, 1], stoneBench: [2, 1, 1] };
let FPV = 2;
function setFootprints(v) { FPV = v === 2 ? 2 : 1;
  for (const id in GREW) { const d = OBJ[id]; if (!d) continue; const [w, h, rv] = GREW[id];
    if (FPV === 2) { d.sz = [w, h]; if (rv) d.rotV = 1; } else { delete d.sz; delete d.rotV; }
    const f = SPR.fp && SPR.fp[id]; if (f) { SPR.obj[id] = FPV === 2 ? f.big : f.small; if (FPV === 2 && f.bigV) SPR.obj[id + 'V'] = f.bigV; else delete SPR.obj[id + 'V']; delete ICONURL[id]; } } }
setFootprints(2);
const lvOf = s => (s && s.lv) || 0;
const upgOk = id => { const it = ITEMS[id]; return !!it && (it.kind === 'sword' || it.kind === 'pick' || it.kind === 'axe' || it.kind === 'wear'); };
const upgTier = id => { const r = rarOf(id); return r >= 0 ? Math.min(4, r) : 3; }; // clothes and charms from the deep caves count as heroic
function upgCost(id, lv) { const t = upgTier(id), c = [[UPG_MAT[t], 2 + 2 * lv]]; if (lv >= 2) c.push(t <= 1 ? ['glowcap', 2 * (lv - 1)] : ['cryGem', lv - 1]); return c; }
function upgSpent(id, lv) { const m = {}; for (let k = 0; k < lv; k++) for (const [x, c] of upgCost(id, k)) m[x] = (m[x] || 0) + c; return Object.entries(m); }
const eqLv = id => { if (!G || !G.equip) return -1; for (const [sl] of EQ_SLOTS) { const e = G.equip[sl]; if (e && e.id === id) return lvOf(e); } return -1; };
const ringV = k => { const e = G && G.equip && G.equip.ring, R = e && RINGS[e.id]; return R && R[1] === k ? R[2] + R[3] * lvOf(e) : 0; };
function upgText(id, lv) { const it = ITEMS[id];
  if (it.kind === 'sword') return `공격력 ${Math.round(it.dmg * (1 + UPG_DMG * lv))}`;
  if (it.kind === 'pick') return `캐는 힘 ${+(it.power * (1 + UPG_POW * lv)).toFixed(1)}`;
  if (it.kind === 'axe') return `베는 힘 ${+(it.power * (1 + UPG_POW * lv)).toFixed(1)}`;
  if (it.ring) return RING_TXT[it.ring](RINGS[id][2] + RINGS[id][3] * lv);
  if (it.guard) return `${it.guard === 'hot' ? '더위' : '추위'} 게이지 ${pct2(guardMul(lv))} 속도`;
  if (id === 'turtleCharm') return `불·용암 피해 -${pct2(turtleCut(lv))}`;
  if (id === 'snowBrooch') return `얼어 느려지는 시간 ${pct2(broochMul(lv))}`;
  if (id === 'woolHat') return `추위 게이지 ${pct2(.85 - .03 * lv)} 속도`;
  return ''; }
const petIs = k => !!(G && G.petOn === k);
const animalSpr = {};
function animalImg(k) { if (animalSpr[k]) return animalSpr[k]; if (ARTC['animal/' + k]) return animalSpr[k] = artPaint('animal/' + k, MKDEF || INK); return animalSpr[k] = ANIM_DRAW[k] ? mk(16, 16, ANIM_DRAW[k]) : null; }
const wildNear = r => { const p = G.p; let best = null, bd = r; for (const w of G.wild || []) { const d = Math.hypot(w.x - p.x, w.y - p.y); if (d < bd) { bd = d; best = w; } } return best; };
let wildT = 0;
function wildTick(dt) {
  const p = G.p; G.wild = G.wild || []; wildT -= dt;
  G.wild = G.wild.filter(w => Math.hypot(w.x - p.x, w.y - p.y) < 30);
  if (wildT <= 0) { wildT = 6; const pb = G.biome[idx(Math.floor(p.x), Math.floor(p.y))] || 0;
    const kinds = Object.keys(ANIMALS).filter(k => ANIMALS[k].biome === pb && !(ANIMALS[k].pet && (G.pets || {})[k]) && !G.wild.some(w => w.k === k));
    if (kinds.length && G.wild.length < 2 && rand() < .35) for (let tries = 0; tries < 12; tries++) { const a = rand() * 6.283, r = 7 + rand() * 6, x = Math.floor(p.x + Math.cos(a) * r), y = Math.floor(p.y + Math.sin(a) * r);
      if (!inB(x, y) || isSolid(x, y) || G.objs.get(idx(x, y)) || G.biome[idx(x, y)] !== pb || G.floor[idx(x, y)] === WATER || G.floor[idx(x, y)] === LAVA) continue;
      G.wild.push({ k: kinds[(rand() * kinds.length) | 0], x: x + .5, y: y + .6, vx: 0, vy: 0, t: 1, flip: false, anim: 0 }); break; } }
  const mdt = Math.min(dt, .1);
  for (const w of G.wild) { w.t -= dt; if (w.t <= 0) { w.t = 1.2 + rand() * 2; if (rand() < .45) { w.vx = 0; w.vy = 0; } else { const a = rand() * 6.283, sp = ANIMALS[w.k].spd; w.vx = Math.cos(a) * sp; w.vy = Math.sin(a) * sp; } }
    if (w.vx || w.vy) { moveEnt(w, w.vx * mdt, w.vy * mdt, .25); w.anim += mdt; if (w.vx) w.flip = w.vx < 0; } }
  // the pet walks behind you, and hops over walls when it gets left too far behind
  if (G.petOn && ANIMALS[G.petOn]) { let e = G.petE; if (!e) e = G.petE = { x: p.x - .8, y: p.y + .2, flip: false, anim: 0, moving: false };
    const dx = p.x - e.x, dy = p.y + .15 - e.y, d = Math.hypot(dx, dy);
    if (d > 10) { e.x = p.x - .6; e.y = p.y + .2; }
    else if (d > 1.3) { const sp = Math.min(7, 1.5 + d * 2.2); moveEnt(e, dx / d * sp * dt, dy / d * sp * dt, .22); e.moving = true; e.anim += dt; if (Math.abs(dx) > .1) e.flip = dx < 0; }
    else e.moving = false; } else G.petE = null; }
function openCatch(w) { if (!w || !G.wild.includes(w)) return; openPanel('catch', { w, hits: 0, miss: 0, t0: performance.now(), spd: ANIMALS[w.k].spd * 1.9, za: rand() * 6.283, zw: 1.0 }); requestAnimationFrame(catchLoop); }
const catchAng = c => ((performance.now() - c.t0) / 1000 * c.spd) % 6.283;
const inZone = (a, c) => { let d = Math.abs(a - c.za) % 6.283; if (d > Math.PI) d = 6.283 - d; return d < c.zw / 2; };
function catchThrow() { const c = panel && panel.kind === 'catch' ? panel : null; if (!c || (c.cool || 0) > performance.now()) return; c.cool = performance.now() + 250; const w = c.w, a = catchAng(c);
  if (inZone(a, c)) { c.hits++; emit('sfx', 'pick'); if (c.hits >= 3 && ANIMALS[w.k].ranch) { G.wild = G.wild.filter(x => x !== w); const l = addItem(w.k, 1); if (l) spawnDrop(w.k, l, G.p.x, G.p.y); G.stats.ranchK = G.stats.ranchK || {}; G.stats.ranchK[w.k] = 1; emit('close'); emit('hearts', w.x, w.y - .5, 6); emit('sfx', 'seed'); emit('toast', `${ANIMALS[w.k].n}${josa(ANIMALS[w.k].n, '을', '를').slice(ANIMALS[w.k].n.length)} 데려왔어요! 원하는 곳에 내려놓으면 ${ANIMALS[w.k].verb.split(' ')[0]}${ANIMALS[w.k].ranch === 'wool' ? '을' : '를'} 줘요`, 'good'); invDirty = true; return; }
    if (c.hits >= 3) { G.pets = G.pets || {}; G.pets[w.k] = 1; G.wild = G.wild.filter(x => x !== w); if (!G.petOn) { G.petOn = w.k; G.petE = { x: w.x, y: w.y, flip: false, anim: 0, moving: false }; } G.stats.pets = Object.keys(G.pets).length;
      emit('close'); emit('hearts', w.x, w.y - .5, 8); emit('sfx', 'seed'); emit('toast', `${ANIMALS[w.k].n} ${ANIMALS[w.k].pn}${josa(ANIMALS[w.k].pn, '이', '가').slice(ANIMALS[w.k].pn.length)} 친구가 됐어요! [가방]에서 함께 다닐 펫을 골라요`, 'good'); return; }
    c.za = rand() * 6.283; c.zw *= .78; c.spd *= 1.18; }
  else { c.miss++; emit('sfx', 'clink'); if (c.miss >= 2) { G.wild = G.wild.filter(x => x !== w); emit('close'); emit('toast', `${ANIMALS[w.k].n}${josa(ANIMALS[w.k].n, '이', '가').slice(ANIMALS[w.k].n.length)} 놀라서 도망갔어요`, null, 'flee'); return; } }
  emit('refresh', 'catch'); }
function catchLoop() { if (!panel || panel.kind !== 'catch') return; const cv2 = $('#catchCv'); if (cv2) { const g = cv2.getContext('2d'), c = panel, R = 86, cx = 110, cy = 110, a = catchAng(c);
    g.clearRect(0, 0, 220, 220); g.lineWidth = 14; g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.stroke();
    g.strokeStyle = '#7fe0b5'; g.beginPath(); g.arc(cx, cy, R, c.za - c.zw / 2, c.za + c.zw / 2); g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#d9b66a'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)); g.stroke();
    g.fillStyle = inZone(a, c) ? '#7fe0b5' : '#ffd25c'; g.beginPath(); g.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 11, 0, 6.283); g.fill();
    const im = animalImg(c.w.k); if (im) { g.imageSmoothingEnabled = false; g.drawImage(im, cx - 32, cy - 32, 64, 64); } }
  requestAnimationFrame(catchLoop); }
function catchHTML() { const c = panel, W2 = ANIMALS[c.w.k]; return head(`${W2.n} 포획`, 'lasso') + `<div class="sh-body" style="text-align:center"><p class="hint">빙글빙글 도는 밧줄이 <b style="color:#7fe0b5">초록 구간</b>에 왔을 때 던져요. 세 번 성공하면 친구가 되고, 두 번 놓치면 도망가요.</p>
  <canvas id="catchCv" width="220" height="220" style="width:220px;height:220px;margin:4px auto;display:block"></canvas><p class="prose">성공 ${'●'.repeat(c.hits)}${'○'.repeat(3 - c.hits)} · 실패 ${'✕'.repeat(c.miss)}${'·'.repeat(2 - c.miss)}</p>
  <button type="button" class="btn" data-a="catchThrow" style="min-height:64px;font-size:22px;width:100%">던지기!</button></div>`; }
const hatMul = () => wearing('woolHat') ? .85 - .03 * eqLv('woolHat') : 1;
function ranchReady(o) { return G.time >= (o.p || 0); }
function ranchCollect(t, o) { const d = OBJ[o.t]; if (!ranchReady(o)) return; o.p = G.time + d.every; const l = addItem(d.ranch, 1); if (l) spawnDrop(d.ranch, l, t.x + .5, t.y + .5);
  G.stats.ranch = (G.stats.ranch || 0) + 1; emit('hearts', t.x + .5, t.y, 3); emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .3, '#fff4e0', 6, 1.6, .2); emit('toast', `${ITEMS[d.ranch].n}${josa(ITEMS[d.ranch].n, '을', '를').slice(ITEMS[d.ranch].n.length)} 얻었어요`, 'good', 'ranch'); invDirty = true; }
function petHTML() { const own = Object.keys(ANIMALS).filter(k => ANIMALS[k].pet && (G.pets || {})[k]);
  if (!own.length) return `<div class="lbl">펫</div><p class="prose" style="color:var(--muted)">아직 펫이 없어요 · 올가미 밧줄(작업대)을 들고 강아지(이끼 동굴)·토끼(버섯숲)·고양이(수정 동굴)에게 다가가 포획해요</p>`;
  return `<div class="lbl">펫 <span style="color:var(--muted);font-size:13px">한 마리만 함께 다녀요</span></div><div class="eqlist">${own.map(k => `<div class="eqr"><button type="button" class="slot eq ${G.petOn === k ? 'pick' : ''}" data-a="petOn" data-i="${k}" aria-label="${ANIMALS[k].pn}"><img class="px" src="${animalImg(k).toDataURL()}" alt=""></button><div><b>${ANIMALS[k].n} ${ANIMALS[k].pn}${G.petOn === k ? ' · 함께 다니는 중' : ''}</b><small>${ANIMALS[k].fx}</small></div></div>`).join('')}</div>`; }
