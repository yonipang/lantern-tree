// ---- v45 pets: wild animals roam their home region; catch one with the lasso mini-game (spin the rope, throw in the green zone) and it follows you with a small buff ----
const ANIMALS = {
  dog: { n: '강아지', pn: '멍멍이', biome: 0, pet: 1, spd: 1.3, fx: '떨어진 물건을 끌어오는 범위 +60%', col: '#c98a5a' },
  rabbit: { n: '토끼', pn: '깡총이', biome: 1, pet: 1, spd: 1.7, fx: '희귀 이상 재료가 나올 확률 +25%', col: '#f4f0f8' },
  cat: { n: '고양이', pn: '야옹이', biome: 2, pet: 1, spd: 1.2, fx: '낚시 운 1단계 (별빛 잉어가 잘 낚여요)', col: '#f0a860' },
};
const petIs = k => !!(G && G.petOn === k);
ITEMS.lasso = { n: '올가미 밧줄', kind: 'lasso', stack: 1, d: '들고 동물 가까이에서 누르면 [포획]. 빙글빙글 도는 밧줄이 초록 구간에 왔을 때 던져요. 세 번 성공하면 친구가 돼요.' };
ICON.lasso = A => { A.e(10, 6, 4.4, 4, '#b8903f'); A.e(10, 6, 3, 2.6, 'rgba(0,0,0,0)'); A.g.globalCompositeOperation = 'destination-out'; A.e(10, 6, 3, 2.6, '#000'); A.g.globalCompositeOperation = 'source-over'; A.e(5, 12, 3.6, 2.6, '#d9b66a'); A.e(5, 12, 2.2, 1.4, '#b8903f'); A.line(7, 9, 8, 10, '#b8903f', 2); A.p(9, 3, '#f0d898'); A.p(13, 5, '#f0d898'); };
RECIPES.push(Rc('lasso', 1, [['rope', 4], ['wood', 2], ['gel', 1]], 'bench', 'tool'));
const animalSpr = {};
const ANIM_DRAW = {
    dog: A => { A.r(3, 8, 9, 5, '#c98a5a'); A.r(3, 8, 9, 1, '#e0a878'); A.r(10, 4, 5, 5, '#c98a5a'); A.r(10, 4, 5, 1, '#e0a878'); A.r(9, 4, 2, 4, '#8a5a3e'); A.r(13, 7, 3, 2, '#fff1d6'); A.p(15, 7, INK); A.p(12, 5, INK); A.r(4, 13, 2, 2, '#8a5a3e'); A.r(9, 13, 2, 2, '#8a5a3e'); A.line(3, 9, 1, 6, '#c98a5a', 2); A.r(5, 10, 3, 2, '#fff1d6'); },
    rabbit: A => { A.e(7, 10.5, 4.5, 3.4, '#f4f0f8'); A.e(11.5, 8, 3, 2.8, '#f4f0f8'); A.r(10, 1, 2, 6, '#f4f0f8'); A.r(12, 2, 2, 5, '#e8e2f0'); A.p(10.5, 3, '#ff9ab0'); A.p(10, 4, '#ff9ab0'); A.p(13, 7, INK); A.p(14, 9, '#ff8fa3'); A.e(2.6, 10, 1.6, 1.5, '#ffffff'); A.r(5, 13, 3, 1, '#d9d2e6'); A.r(9, 13, 3, 1, '#d9d2e6'); },
    cat: A => { A.r(3, 8, 8, 5, '#f0a860'); A.r(3, 8, 8, 1, '#ffc88a'); A.e(12, 7, 3.4, 3.2, '#f0a860'); A.poly([[9, 5], [10, 1.5], [11.5, 4.5]], '#f0a860'); A.poly([[12.5, 4.5], [14, 1.5], [15, 5]], '#f0a860'); A.p(10, 3, '#ff9ab0'); A.p(14, 3, '#ff9ab0'); A.p(11, 7, INK); A.p(14, 7, INK); A.p(12, 8, '#ff8fa3');
      for (const x of [4, 7]) A.r(x, 9, 1, 3, '#d9884a'); A.r(4, 13, 2, 2, '#d9884a'); A.r(9, 13, 2, 2, '#d9884a'); A.line(3, 10, 1, 4, '#f0a860', 2); A.p(1, 4, '#ffc88a'); },
  cow: A => { A.r(2, 6, 10, 6, '#f4f0f0'); A.r(2, 6, 10, 1, '#ffffff'); A.r(4, 7, 3, 3, '#3a3340'); A.r(8, 9, 3, 2, '#3a3340'); A.r(11, 4, 4, 6, '#f4f0f0'); A.r(10, 4, 1, 2, '#3a3340'); A.r(12, 8, 4, 3, '#f7b8c8'); A.p(13, 9, '#d9607d'); A.p(15, 9, '#d9607d'); A.p(13, 6, INK); A.p(11, 2, '#e8d8b0'); A.p(14, 2, '#e8d8b0'); A.r(11, 3, 4, 1, '#e8d8b0');
    for (const x of [3, 5, 8, 10]) A.r(x, 12, 1, 3, '#d9d2e6'); A.r(3, 14, 1, 1, '#3a3340'); A.r(10, 14, 1, 1, '#3a3340'); A.line(2, 7, 1, 11, '#d9d2e6'); A.p(1, 12, '#3a3340'); A.r(6, 11, 2, 1, '#f7b8c8'); },
  chicken: A => { A.e(7, 10, 4.4, 3.4, '#ffffff'); A.e(6, 9, 2.6, 1.6, '#f0ecf4'); A.e(11, 6.5, 2.4, 2.4, '#ffffff'); A.r(10, 3, 3, 2, '#ff5a5a'); A.p(11, 2, '#ff5a5a'); A.r(13, 6, 2, 1, '#ffc23a'); A.p(11, 9, '#ff5a5a'); A.p(12, 6, INK); A.poly([[2, 7], [4, 9], [2.5, 11]], '#e8e2f0'); A.r(6, 13, 1, 2, '#ffa53a'); A.r(9, 13, 1, 2, '#ffa53a'); },
  sheep: A => { for (const [x, y] of [[4, 8], [7, 7], [10, 8], [5, 11], [9, 11], [3, 10], [11, 10]]) A.e(x, y, 2.6, 2.4, '#fff4e0'); A.e(7, 9.5, 4.8, 3.2, '#fff4e0'); for (const [x, y] of [[5, 7], [9, 8], [6, 11]]) A.p(x, y, '#ffffff'); A.e(13, 7.5, 2.2, 2.4, '#5a4a52'); A.p(14, 7, '#fff4e0'); A.r(11, 6, 2, 1, '#5a4a52');
    for (const x of [4, 6, 9, 11]) A.r(x, 12, 1, 3, '#5a4a52'); },
};
function animalImg(k) { if (animalSpr[k]) return animalSpr[k]; if (ARTC['animal/' + k]) return animalSpr[k] = artPaint('animal/' + k, MKDEF || INK); return animalSpr[k] = ANIM_DRAW[k] ? mk(16, 16, ANIM_DRAW[k]) : null; }
const wildNear = r => { const p = G.p; let best = null, bd = r; for (const w of G.wild || []) { const d = Math.hypot(w.x - p.x, w.y - p.y); if (d < bd) { bd = d; best = w; } } return best; };
let wildT = 0;
function wildTick(dt) {
  const p = G.p; G.wild = G.wild || []; wildT -= dt;
  G.wild = G.wild.filter(w => Math.hypot(w.x - p.x, w.y - p.y) < 30);
  if (wildT <= 0) { wildT = 6; const pb = G.biome[idx(Math.floor(p.x), Math.floor(p.y))] || 0;
    const kinds = Object.keys(ANIMALS).filter(k => ANIMALS[k].biome === pb && !(ANIMALS[k].pet && (G.pets || {})[k]) && !G.wild.some(w => w.k === k));
    if (kinds.length && G.wild.length < 2 && Math.random() < .35) for (let tries = 0; tries < 12; tries++) { const a = Math.random() * 6.283, r = 7 + Math.random() * 6, x = Math.floor(p.x + Math.cos(a) * r), y = Math.floor(p.y + Math.sin(a) * r);
      if (!inB(x, y) || isSolid(x, y) || G.objs.get(idx(x, y)) || G.biome[idx(x, y)] !== pb || G.floor[idx(x, y)] === WATER || G.floor[idx(x, y)] === LAVA) continue;
      G.wild.push({ k: kinds[(Math.random() * kinds.length) | 0], x: x + .5, y: y + .6, vx: 0, vy: 0, t: 1, flip: false, anim: 0 }); break; } }
  const mdt = Math.min(dt, .1);
  for (const w of G.wild) { w.t -= dt; if (w.t <= 0) { w.t = 1.2 + Math.random() * 2; if (Math.random() < .45) { w.vx = 0; w.vy = 0; } else { const a = Math.random() * 6.283, sp = ANIMALS[w.k].spd; w.vx = Math.cos(a) * sp; w.vy = Math.sin(a) * sp; } }
    if (w.vx || w.vy) { moveEnt(w, w.vx * mdt, w.vy * mdt, .25); w.anim += mdt; if (w.vx) w.flip = w.vx < 0; } }
  // the pet walks behind you, and hops over walls when it gets left too far behind
  if (G.petOn && ANIMALS[G.petOn]) { let e = G.petE; if (!e) e = G.petE = { x: p.x - .8, y: p.y + .2, flip: false, anim: 0, moving: false };
    const dx = p.x - e.x, dy = p.y + .15 - e.y, d = Math.hypot(dx, dy);
    if (d > 10) { e.x = p.x - .6; e.y = p.y + .2; }
    else if (d > 1.3) { const sp = Math.min(7, 1.5 + d * 2.2); moveEnt(e, dx / d * sp * dt, dy / d * sp * dt, .22); e.moving = true; e.anim += dt; if (Math.abs(dx) > .1) e.flip = dx < 0; }
    else e.moving = false; } else G.petE = null; }
QSIDE.push({ id: 's_pet', t: '동물 친구 데려오기', h: '장비제작대에서 올가미 밧줄을 만들어 들고, 이끼 동굴의 강아지·버섯숲의 토끼·수정 동굴의 고양이에게 다가가 [포획]해요.', done: () => Object.keys(G.pets || {}).length > 0, rw: [['stew', 2], ['gel', 4]], xp: 40 });
function openCatch(w) { if (!w || !G.wild.includes(w)) return; openPanel('catch', { w, hits: 0, miss: 0, t0: performance.now(), spd: ANIMALS[w.k].spd * 1.9, za: Math.random() * 6.283, zw: 1.0 }); requestAnimationFrame(catchLoop); }
const catchAng = c => ((performance.now() - c.t0) / 1000 * c.spd) % 6.283;
const inZone = (a, c) => { let d = Math.abs(a - c.za) % 6.283; if (d > Math.PI) d = 6.283 - d; return d < c.zw / 2; };
function catchThrow() { const c = panel && panel.kind === 'catch' ? panel : null; if (!c || (c.cool || 0) > performance.now()) return; c.cool = performance.now() + 250; const w = c.w, a = catchAng(c);
  if (inZone(a, c)) { c.hits++; SFX.pick(); if (c.hits >= 3 && ANIMALS[w.k].ranch) { G.wild = G.wild.filter(x => x !== w); const l = addItem(w.k, 1); if (l) spawnDrop(w.k, l, G.p.x, G.p.y); G.stats.ranchK = G.stats.ranchK || {}; G.stats.ranchK[w.k] = 1; closePanel(); hearts(w.x, w.y - .5, 6); SFX.seed(); toast(`${ANIMALS[w.k].n}${josa(ANIMALS[w.k].n, '을', '를').slice(ANIMALS[w.k].n.length)} 데려왔어요! 원하는 곳에 내려놓으면 ${ANIMALS[w.k].verb.split(' ')[0]}${ANIMALS[w.k].ranch === 'wool' ? '을' : '를'} 줘요`, 'good'); invDirty = true; return; }
    if (c.hits >= 3) { G.pets = G.pets || {}; G.pets[w.k] = 1; G.wild = G.wild.filter(x => x !== w); if (!G.petOn) { G.petOn = w.k; G.petE = { x: w.x, y: w.y, flip: false, anim: 0, moving: false }; } G.stats.pets = Object.keys(G.pets).length;
      closePanel(); hearts(w.x, w.y - .5, 8); SFX.seed(); toast(`${ANIMALS[w.k].n} ${ANIMALS[w.k].pn}${josa(ANIMALS[w.k].pn, '이', '가').slice(ANIMALS[w.k].pn.length)} 친구가 됐어요! [가방]에서 함께 다닐 펫을 골라요`, 'good'); return; }
    c.za = Math.random() * 6.283; c.zw *= .78; c.spd *= 1.18; }
  else { c.miss++; SFX.clink(); if (c.miss >= 2) { G.wild = G.wild.filter(x => x !== w); closePanel(); toast(`${ANIMALS[w.k].n}${josa(ANIMALS[w.k].n, '이', '가').slice(ANIMALS[w.k].n.length)} 놀라서 도망갔어요`, null, 'flee'); return; } }
  renderPanel(); }
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
// ---- v46 ranch: catch cows, chickens and sheep with the same lasso, set them down anywhere and collect milk, eggs and wool ----
Object.assign(ANIMALS, {
  cow: { n: '소', biome: 0, ranch: 'milk', spd: .8, every: 300, verb: '우유 짜기' },
  chicken: { n: '닭', biome: 0, ranch: 'egg', spd: 1.4, every: 240, verb: '달걀 줍기' },
  sheep: { n: '양', biome: 1, ranch: 'wool', spd: .9, every: 360, verb: '털 깎기' },
});
for (const k of ['cow', 'chicken', 'sheep']) { const A2 = ANIMALS[k];
  ITEMS[k] = { n: A2.n, kind: 'place', obj: k, stack: 9, d: `원하는 곳에 내려놓으면 ${Math.round(A2.every / 60)}분마다 ${A2.verb.split(' ')[0]}${A2.ranch === 'wool' ? '을' : '를'} 얻어요. [회수]로 다시 데려올 수 있어요.` };
  OBJ[k] = { n: A2.n, solid: 1, item: k, ranch: A2.ranch, every: A2.every }; OSPR[k] = [16, 16, ANIM_DRAW[k]]; }
Object.assign(ITEMS, {
  milk: { n: '우유', kind: 'food', food: 12, heal: 8, d: '소에게서 짠 고소한 우유. 그냥 마셔도 되고 팬케이크에도 들어가요.' },
  egg: { n: '달걀', d: '닭이 낳은 따끈한 달걀. 요리솥에서 부치거나 팬케이크를 만들어요.' },
  wool: { n: '양모', d: '양에게서 깎은 폭신한 털. 털모자와 양털 러그를 만들어요.' },
  friedEgg: { n: '달걀 프라이', kind: 'food', food: 20, heal: 12, d: '노른자가 반짝이는 달걀 프라이.' },
  pancake: { n: '베리 팬케이크', kind: 'food', food: 36, heal: 24, d: '우유와 달걀로 구운 폭신한 팬케이크에 베리를 올렸어요.' },
  woolHat: { n: '털모자', kind: 'wear', slot: 'head', stack: 1, d: '머리에 쓰면 얼음 동굴의 추위 게이지가 천천히 올라요 (옷과 함께 쓰면 더 좋아요).' },
  woolRug: { n: '양털 러그', kind: 'place', obj: 'woolRug', d: '폭신폭신한 양털 러그. 위로 걸어 다닐 수 있어요.' },
});
OBJ.woolRug = { n: '양털 러그', flat: 1, item: 'woolRug' };
OSPR.woolRug = [16, 16, A => { A.r(1, 2, 14, 12, '#e8dcc4'); A.r(2, 3, 12, 10, '#fff4e0'); for (let y = 4; y < 12; y += 3) for (let x = 3 + (y % 2); x < 13; x += 3) A.p(x, y, '#e8dcc4'); A.r(1, 13, 14, 1, '#c9b89a'); for (const x of [1, 4, 7, 10, 13]) A.p(x, 14, '#c9b89a'); }];
Object.assign(ICON, {
  milk: A => { A.r(5, 4, 6, 10, '#f4f0f8'); A.r(5, 4, 6, 1, '#ffffff'); A.r(6, 2, 4, 2, '#c8d0dc'); A.r(5, 8, 6, 3, '#7fb8ff'); A.r(6, 9, 4, 1, '#bfe0ff'); A.r(10, 4, 1, 10, '#d9d2e6'); },
  egg: A => { A.e(8, 9, 4.4, 5.4, '#fff4e0'); A.e(7, 7.4, 1.6, 2.2, '#ffffff'); A.e(9.5, 11.5, 2, 1.4, '#efe2c8'); },
  wool: A => { for (const [x, y] of [[5, 9], [8, 7], [11, 9], [7, 11], [10, 11]]) A.e(x, y, 3, 2.8, '#fff4e0'); A.p(6, 7, '#ffffff'); A.p(9, 6, '#ffffff'); A.e(8, 10, 2, 1.4, '#efe2c8'); },
  friedEgg: A => { A.e(8, 9, 6.4, 4.6, '#ffffff'); A.e(6, 7.6, 2, 1.2, '#f4f0f8'); A.e(9, 9, 2.6, 2.2, '#ffc23a'); A.p(8, 8, '#fff1b0'); },
  pancake: A => { A.e(8, 12, 6.6, 2.4, '#d9d2e6'); for (const y of [10, 8, 6]) { A.e(8, y, 5.4, 2, '#d9944a'); A.e(8, y - .6, 4.8, 1.3, '#f0b870'); } A.e(8, 4.6, 2.4, 1.2, '#fff4e0'); A.p(6, 4, '#ff7aa2'); A.p(10, 4, '#ff7aa2'); A.p(8, 3, '#ff7aa2'); },
  woolHat: A => { A.e(8, 10, 6, 4.4, '#ff8fa3'); A.r(2, 10, 12, 3, '#d9607d'); for (const x of [3, 6, 9, 12]) A.p(x, 11, '#ffb3c6'); A.e(8, 4, 2.2, 2.2, '#fff4e0'); A.p(7, 3, '#ffffff'); A.p(6, 8, '#ffb3c6'); },
});
RECIPES.push(Rc('friedEgg', 1, [['egg', 1]], 'pot', 'food'), Rc('pancake', 1, [['egg', 1], ['milk', 1], ['berry', 2]], 'pot', 'food'), Rc('woolHat', 1, [['wool', 4], ['fiber', 2]], 'bench', 'tool'), Rc('woolRug', 1, [['wool', 3]], 'bench', 'furn'));
const hatMul = () => wearing('woolHat') ? .85 - .03 * eqLv('woolHat') : 1;
function ranchReady(o) { return G.time >= (o.p || 0); }
function ranchCollect(t, o) { const d = OBJ[o.t]; if (!ranchReady(o)) return; o.p = G.time + d.every; const l = addItem(d.ranch, 1); if (l) spawnDrop(d.ranch, l, t.x + .5, t.y + .5);
  G.stats.ranch = (G.stats.ranch || 0) + 1; hearts(t.x + .5, t.y, 3); SFX.pick(); puff(t.x + .5, t.y + .3, '#fff4e0', 6, 1.6, .2); toast(`${ITEMS[d.ranch].n}${josa(ITEMS[d.ranch].n, '을', '를').slice(ITEMS[d.ranch].n.length)} 얻었어요`, 'good', 'ranch'); invDirty = true; }
QSIDE.push({ id: 's_ranch', t: () => `목장 동물 세 종류 데려오기 (${Object.keys(G.stats.ranchK || {}).length}/3)`, h: '올가미 밧줄을 들고 이끼 동굴의 소·닭, 버섯숲의 양을 [포획]해요. 원하는 곳에 내려놓으면 우유·달걀·양모를 줘요.', done: () => Object.keys(G.stats.ranchK || {}).length >= 3, rw: [['pancake', 3], ['wool', 4]], xp: 60 });
function petHTML() { const own = Object.keys(ANIMALS).filter(k => ANIMALS[k].pet && (G.pets || {})[k]);
  if (!own.length) return `<div class="lbl">펫</div><p class="prose" style="color:var(--muted)">아직 펫이 없어요 · 올가미 밧줄(작업대)을 들고 강아지(이끼 동굴)·토끼(버섯숲)·고양이(수정 동굴)에게 다가가 포획해요</p>`;
  return `<div class="lbl">펫 <span style="color:var(--muted);font-size:13px">한 마리만 함께 다녀요</span></div><div class="eqlist">${own.map(k => `<div class="eqr"><button type="button" class="slot eq ${G.petOn === k ? 'pick' : ''}" data-a="petOn" data-i="${k}" aria-label="${ANIMALS[k].pn}"><img class="px" src="${animalImg(k).toDataURL()}" alt=""></button><div><b>${ANIMALS[k].n} ${ANIMALS[k].pn}${G.petOn === k ? ' · 함께 다니는 중' : ''}</b><small>${ANIMALS[k].fx}</small></div></div>`).join('')}</div>`; }
