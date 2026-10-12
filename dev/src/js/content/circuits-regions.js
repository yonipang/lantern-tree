// ---- circuits: wires, power (battery → generator → crystal generator), switches, powered devices ----
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
Object.assign(ITEMS, {
  wire: { n: '전선', kind: 'wire', d: '바닥에 깔아 전기를 이어요. 위·아래·옆으로 붙은 전선끼리 연결돼요. 전선을 들고 전선 칸을 누르면 걷어요.' },
  battery: { n: '건전지', kind: 'place', obj: 'battery', stack: 1, d: '붙은 전선에 전기를 보내요. 쓰면 줄어들고, 작업대 [수리]에서 다시 충전해요.' },
  generator: { n: '발전기', kind: 'place', obj: 'generator', d: '연료(나무·젤·송진)를 넣으면 건전지 없이 전기를 계속 만들어요. 기계가 일할 때만 연료를 써요.' },
  crystalGen: { n: '수정 발전기', kind: 'place', obj: 'crystalGen', d: '수정의 힘으로 연료 없이 영원히 전기를 만들어요.' },
  lever: { n: '레버', kind: 'place', obj: 'lever', d: '누르면 켜고 꺼요. 켜져 있을 때만 양쪽 전선을 이어 줘요.' },
  plate: { n: '압력판', kind: 'place', obj: 'plate', d: '누군가 올라서 있는 동안만 양쪽 전선을 이어 줘요.' },
  timer: { n: '타이머 회로', kind: 'place', obj: 'timer', d: '정해진 간격으로 켜졌다 꺼졌다 하며 양쪽 전선을 이어요. 누르면 간격이 바뀌어요.' },
  eLamp: { n: '전기 램프', kind: 'place', obj: 'eLamp', d: '전기가 들어오면 환하게 켜져요.' },
  eDoor: { n: '전기 문', kind: 'place', obj: 'eDoor', d: '전기가 들어오면 열리고, 끊기면 닫혀요.' },
  drillCu: { n: '구리 채굴기', kind: 'place', obj: 'drillCu', d: '놓을 때 바라보는 쪽의 벽에서 광물을 계속 캐요(벽은 사라지지 않아요). 흙·구리·돌·철 광맥까지. 전기가 필요해요.' },
  drillFe: { n: '철 채굴기', kind: 'place', obj: 'drillFe', d: '화강암 벽·석영 광맥까지 더 빠르게 캐는 채굴기. 전기가 필요해요.' },
});
Object.assign(OBJ, {
  battery: { n: '건전지', solid: 1, item: 'battery', src: 'batt' },
  generator: { n: '발전기', solid: 1, item: 'generator', src: 'gen', light: [2.5, '#ff9a4a'] },
  crystalGen: { n: '수정 발전기', solid: 1, item: 'crystalGen', src: 'cgen', light: [4, '#c6b0ff'] },
  lever: { n: '레버', solid: 1, item: 'lever', sw: 'lever' },
  plate: { n: '압력판', flat: 1, item: 'plate', sw: 'plate' },
  timer: { n: '타이머 회로', solid: 1, item: 'timer', sw: 'timer' },
  eLamp: { n: '전기 램프', solid: 1, item: 'eLamp', dev: 'lamp', light: [7, '#fff1c0'], idle: .02 },
  eDoor: { n: '전기 문', solid: 1, item: 'eDoor', dev: 'door', door: 1, idle: .01 },
  drillCu: { n: '구리 채굴기', solid: 1, item: 'pitCu', dev: 'drill', tier: 1, every: 12, draw: .5, idle: 0 },
  drillFe: { n: '철 채굴기', solid: 1, item: 'pitFe', dev: 'drill', tier: 2, every: 7, draw: .8, idle: 0 },
});
ITEMS.drillGold = { n: '황금 채굴기', kind: 'place', obj: 'drillGold', d: '용암·얼음 동굴의 금·서리 광맥까지 빠르게 캐는 채굴기. 전기가 필요해요.' };
OBJ.drillGold = { n: '황금 채굴기', solid: 1, item: 'pitGold', dev: 'drill', tier: 3, every: 5, draw: 1, idle: 0 };
Object.assign(USE, { battery: 'batt', generator: 'fuel', crystalGen: 'cinfo', lever: 'lever', plate: 'cinfo', timer: 'timer', eLamp: 'cinfo', eDoor: 'cinfo', drillCu: 'drill', drillFe: 'drill', drillGold: 'drill' });
Object.assign(USE_LBL, { batt: '확인', fuel: '연료 넣기', cinfo: '살펴보기', lever: '레버 당기기', timer: '간격 바꾸기', drill: '꺼내기' });
const BATT_MAX = 600, FUEL = { wood: 30, gel: 45, resin: 90 }, FUEL_MAX = 3600, DRILL_CAP = 60;
const drillSpr = dir => A => { A.r(3, 8, 10, 10, '#5a5468'); A.r(3, 8, 10, 2, '#8d97a8'); A.r(3, 8, 1, 10, '#787090'); A.r(12, 8, 1, 10, '#36334a'); A.r(5, 12, 6, 3, '#e5884a'); A.r(5, 12, 6, 1, '#ffb57a'); A.p(7, 16, '#7fe0b5');
  const [dx, dy] = dir, cx = 8 + dx * 5, cy = 12 + dy * 5; if (dy < 0) A.poly([[5, 9], [11, 9], [8, 1]], '#c8d0dc'); else if (dy > 0) A.poly([[5, 17], [11, 17], [8, 21]], '#c8d0dc'); else if (dx > 0) A.poly([[12, 10], [12, 16], [16, 13]], '#c8d0dc'); else A.poly([[4, 10], [4, 16], [0, 13]], '#c8d0dc'); A.p(cx, cy, '#ffffff'); };
Object.assign(OSPR, {
  battery: [16, 16, A => { A.r(4, 4, 8, 11, '#3e4a5a'); A.r(4, 4, 2, 11, '#5a6a80'); A.r(11, 4, 1, 11, '#2a3240'); A.r(6, 2, 4, 2, '#e5884a'); A.r(6, 2, 4, 1, '#ffb57a'); A.r(5, 7, 6, 5, '#2a3240'); A.r(7, 8, 2, 3, '#ffd25c'); A.r(6, 9, 4, 1, '#ffd25c'); }],
  generator: [16, 22, A => { A.r(10, 1, 3, 9, '#5a5468'); A.r(10, 1, 1, 9, '#8d97a8'); A.r(2, 8, 12, 13, '#4a4558'); A.r(2, 8, 12, 2, '#8d97a8'); A.r(2, 8, 1, 13, '#6c7688'); A.r(13, 8, 1, 13, '#2a2836'); A.r(4, 13, 8, 5, '#2a1810'); A.r(4, 13, 8, 1, '#1a1018'); A.r(3, 20, 10, 1, '#24222e'); A.p(5, 11, '#ffd25c'); A.p(7, 11, '#7fe0b5'); }],
  crystalGen: [16, 24, A => { A.r(3, 17, 10, 6, '#625d78'); A.r(3, 17, 10, 1, '#b9b4cc'); A.r(2, 16, 12, 2, '#8f8aa3'); A.poly([[8, 2], [12, 9], [8, 15], [4, 9]], '#9d7fe0'); A.poly([[8, 2], [8, 15], [4, 9]], '#c1a8f5'); A.p(7, 6, '#ffffff'); A.r(5, 19, 6, 2, '#3a3450'); A.p(6, 20, '#c6b0ff'); A.p(9, 20, '#c6b0ff'); }],
  lever: [16, 16, A => { A.r(4, 11, 8, 4, '#5a5468'); A.r(4, 11, 8, 1, '#8d97a8'); A.line(8, 12, 4, 5, '#8a6a52', 2); A.e(4, 4, 1.8, 1.8, '#e05a5a'); A.p(3, 3, '#ffb0b0'); }],
  leverOn: [16, 16, A => { A.r(4, 11, 8, 4, '#5a5468'); A.r(4, 11, 8, 1, '#8d97a8'); A.line(8, 12, 12, 5, '#8a6a52', 2); A.e(12, 4, 1.8, 1.8, '#5ad08a'); A.p(11, 3, '#c0ffd8'); }],
  plate: [16, 16, A => { A.r(2, 2, 12, 12, '#5a5468'); A.r(3, 3, 10, 10, '#8d97a8'); A.r(3, 3, 10, 1, '#c8d0dc'); A.r(3, 12, 10, 1, '#5a5468'); A.p(4, 4, '#ffffff'); }],
  plateOn: [16, 16, A => { A.r(2, 2, 12, 12, '#5a5468'); A.r(3, 4, 10, 9, '#6c7688'); A.r(3, 4, 10, 1, '#5ad08a'); }],
  timer: [16, 16, A => { A.r(3, 5, 10, 10, '#4a4558'); A.r(3, 5, 10, 2, '#787090'); A.e(8, 10, 3.4, 3.4, '#fff1d6'); A.line(8, 10, 8, 8, INK); A.line(8, 10, 10, 10, INK); A.r(7, 3, 2, 2, '#e5884a'); }],
  eLamp: [16, 24, A => { A.e(8, 22, 4, 1.4, '#36334a'); A.r(7, 9, 2, 13, '#8d97a8'); A.r(7, 9, 1, 13, '#c8d0dc'); A.r(4, 7, 8, 2, '#5a5468'); A.e(8, 4.5, 3.6, 3.6, '#fff1c0'); A.e(7, 3.6, 1.6, 1.4, '#ffffff'); A.r(5, 7, 6, 1, '#787090'); }],
  eDoor: [16, 18, A => { A.r(2, 1, 12, 17, '#5a5468'); A.r(3, 2, 10, 15, '#8d97a8'); A.r(3, 2, 10, 1, '#c8d0dc'); A.r(7, 2, 2, 15, '#6c7688'); A.r(4, 8, 2, 2, '#ffd25c'); A.r(10, 8, 2, 2, '#ffd25c'); }],
  eDoorOpen: [16, 18, A => { A.r(1, 1, 3, 17, '#8d97a8'); A.r(12, 1, 3, 17, '#8d97a8'); A.r(1, 1, 3, 1, '#c8d0dc'); A.r(12, 1, 3, 1, '#c8d0dc'); A.r(2, 8, 1, 2, '#5ad08a'); A.r(13, 8, 1, 2, '#5ad08a'); }],
  drillCu: [16, 22, drillSpr([0, -1])],
});
OSPR.drillFe = [16, 22, A => { drillSpr([0, -1])(A); A.r(5, 12, 6, 3, '#c8d0dc'); A.r(5, 12, 6, 1, '#ffffff'); }];
const goldTrim = A => { A.r(5, 12, 6, 3, '#ffd25c'); A.r(5, 12, 6, 1, '#fff1b0'); A.r(3, 8, 10, 1, '#ffc23a'); };
OSPR.drillGold = [16, 22, A => { drillSpr([0, -1])(A); goldTrim(A); }];
for (const [k, d] of [['U', [0, -1]], ['D', [0, 1]], ['L', [-1, 0]], ['R', [1, 0]]]) { OSPR['drillGold' + k] = [16, 22, A => { drillSpr(d)(A); goldTrim(A); }]; OSPR['drillCu' + k] = [16, 22, drillSpr(d)]; OSPR['drillFe' + k] = [16, 22, A => { drillSpr(d)(A); A.r(5, 12, 6, 3, '#c8d0dc'); A.r(5, 12, 6, 1, '#ffffff'); }]; }
Object.assign(ICON, { wire: A => { A.e(8, 9, 6, 4.6, '#b8642f'); A.e(8, 9, 4.4, 3.2, '#e5884a'); A.e(8, 9, 2.8, 2, '#b8642f'); A.e(8, 9, 1.4, 1, '#5a3a14'); A.line(12, 11, 15, 14, '#e5884a', 2); A.p(15, 15, '#c8d0dc'); } });
RECIPES.push(Rc('wire', 10, [['copperBar', 1], ['rope', 1]], 'forge', 'circuit'), Rc('battery', 1, [['copperBar', 2], ['gel', 3], ['glowcap', 1]], 'forge', 'circuit'),
  Rc('lever', 1, [['copperBar', 1], ['wood', 2]], 'forge', 'circuit'), Rc('plate', 1, [['copperBar', 1], ['stone', 3]], 'forge', 'circuit'), Rc('timer', 1, [['copperBar', 2], ['glowcap', 1], ['ironBar', 1]], 'forge', 'circuit'),
  Rc('eLamp', 1, [['copperBar', 1], ['glowcap', 2]], 'forge', 'circuit'), Rc('eDoor', 1, [['ironBar', 2], ['copperBar', 2], ['wood', 2]], 'forge', 'circuit'),
  Rc('generator', 1, [['ironBar', 6], ['stone', 16], ['copperBar', 4]], 'forge', 'circuit'), Rc('crystalGen', 1, [['crystal', 16], ['ironBar', 8], ['glowcap', 6]], 'forge', 'circuit'));
const CIRC = { net: new Map(), pRoots: new Set(), find: x => x };
function circuitTick(dt) {
  const comps = []; for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (d && (d.src || d.sw || d.dev)) comps.push([i, o, d]); }
  if (!comps.length) { CIRC.net = new Map(); CIRC.pRoots = new Set(); return; }
  const swT = new Set(comps.filter(c => c[2].sw).map(c => c[0])), net = new Map(); let nid = 0;
  for (const i of G.wire.keys()) { if (net.has(i) || swT.has(i)) continue; const id = nid++, st = [i]; net.set(i, id);
    while (st.length) { const j = st.pop(), x = j % W, y = (j / W) | 0; for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (!inB(nx, ny)) continue; const k = idx(nx, ny); if (G.wire.has(k) && !net.has(k) && !swT.has(k)) { net.set(k, id); st.push(k); } } } }
  const par = Array.from({ length: nid }, (_, k) => k), find = a => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; }, uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
  const adj = (i, own) => { const x = i % W, y = (i / W) | 0, out = new Set(); if (own && net.has(i)) out.add(net.get(i)); for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (inB(nx, ny) && net.has(idx(nx, ny))) out.add(net.get(idx(nx, ny))); } return [...out]; };
  const px = Math.floor(G.p.x), py = Math.floor(G.p.y);
  for (const [i, o, d] of comps) { if (!d.sw) continue; let on = false; const x = i % W, y = (i / W) | 0;
    if (d.sw === 'lever') on = !!o.on; else if (d.sw === 'plate') on = (px === x && py === y && G.p.dead <= 0) || G.enemies.some(e => Math.floor(e.x) === x && Math.floor(e.y) === y);
    else { o.tt = (o.tt || 0) + dt; on = Math.floor(o.tt / (o.per || 2)) % 2 === 0; }
    o.lit = on; if (on) { const a = adj(i, false); for (let k = 1; k < a.length; k++) uni(a[0], a[k]); } }
  const rs = new Map();
  for (const [i, o, d] of comps) { if (!d.src) continue; const ok = d.src === 'cgen' || (d.src === 'gen' && (o.fuel || 0) > 0) || (d.src === 'batt' && (o.e || 0) > 0); o.lit = ok; if (!ok) continue;
    for (const n of adj(i, true)) { const r = find(n); let e = rs.get(r); if (!e) rs.set(r, e = { inf: false, b: [], g: [], load: 0 }); if (d.src === 'cgen') e.inf = true; else if (d.src === 'gen') { if (!e.g.includes(o)) e.g.push(o); } else if (!e.b.includes(o)) e.b.push(o); } }
  for (const [i, o, d] of comps) { if (!d.dev) continue; let pr = null; for (const n of (d.sz ? [...new Set(fpTiles(i, o).flatMap(j => adj(j, true)))] : adj(i, true))) { const r = find(n); if (rs.has(r)) { pr = r; break; } }
    deviceStep(i, o, d, pr != null, dt); if (pr != null) rs.get(pr).load += (o.work ? (d.draw || 0) : (d.idle || 0)) * dt; }
  for (const [, e] of rs) { if (!e.load || e.inf) continue; if (e.g.length) { for (const g of e.g) { g.fuel = Math.max(0, g.fuel - dt); G.stats.genRun = 1; } continue; } if (e.b.length) { const per = e.load / e.b.length; for (const b of e.b) b.e = Math.max(0, b.e - per); } }
  CIRC.net = net; CIRC.pRoots = new Set(rs.keys()); CIRC.find = find;
}
function deviceStep(i, o, d, on, dt) {
  if (d.dev === 'sprk' || d.dev === 'harv') { farmDevStep(i, o, d, on, dt); return; }
  const x = i % W, y = (i / W) | 0;
  if (d.dev === 'lamp') { if (o.off !== !on) { o.off = !on; lightDirty = true; } o.work = on; if (on) G.stats.litLamp = 1; return; }
  if (d.dev === 'farm') { const ready = farmStage(o) >= 3; o.work = on && ready; if (on && ready) farmHarvest(i, o, true); return; }
  if (d.dev === 'door') { if (!!o.open !== on) { if (!on && occupied(x, y)) return; o.open = on; SFX.place(); } o.work = false; return; }
  if (d.dev === 'slide') { o.work = false; if (on) SLIDE_PW.set(o, G.time); // powered (or joined to a powered leaf): opens while the player is close, closes when they walk away
    const grp = doorGroup(x, y); o.pw = grp.some(([, g]) => (SLIDE_PW.get(g) ?? -9) > G.time - .5) ? 1 : 0; if (!o.pw) return;
    const near = G.p.dead <= 0 && grp.some(([j]) => Math.hypot(j % W + .5 - G.p.x, ((j / W) | 0) + .5 - G.p.y) < SLIDE_NEAR);
    if (!!o.open !== near) { if (!near && occupied(x, y)) return; o.open = near ? 1 : 0; if (Math.hypot(x + .5 - G.p.x, y + .5 - G.p.y) < 8) SFX.place(); } return; }
  if (d.dev === 'drill') { const dir = o.dir || { x: 0, y: -1 }, tx = x + dir.x, ty = y + dir.y, w = inB(tx, ty) ? G.wall[idx(tx, ty)] : 0, cnt = (o.store || []).reduce((a, s2) => a + s2.c, 0);
    const tierOk = w && WALLS[w] && (d.only ? d.only.includes(w) : WALLS[w].tier <= d.tier);
    const can = on && w && WALLS[w] && tierOk && w !== 6 && w !== 7 && w !== 8 && cnt < DRILL_CAP; o.work = !!can; o.why = !on ? 'power' : !w || w === 6 || w === 7 || w === 8 ? 'wall' : !tierOk ? 'tier' : cnt >= DRILL_CAP ? 'full' : '';
    if (!can) return; o.prog = (o.prog || 0) + dt;
    if (Math.hypot(tx + .5 - G.p.x, ty + .5 - G.p.y) < 14 && Math.random() < dt * 3) puff(tx + .5 - dir.x * .45, ty + .7 - dir.y * .45, WPAL[w][1], 2, 1.4, .1);
    if (o.prog >= d.every) { o.prog = 0; const dr0 = WALLS[w].drop[0]; if (Math.random() > (dr0[3] == null ? 1 : dr0[3])) return; const id = dr0[0]; G.stats.drilled = (G.stats.drilled || 0) + 1;
      let put = false; for (const [dx, dy] of [[-dir.x, -dir.y], ...D4]) { const cx = x + dx, cy = y + dy; if (!inB(cx, cy)) continue; const c = G.objs.get(idx(cx, cy)); if (c && c.t === 'chest' && c.items && !moveInto(c.items, { id, c: 1 })) { put = true; break; } }
      if (!put) { o.store = o.store || []; const s2 = o.store.find(z => z.id === id); if (s2) s2.c++; else o.store.push({ id, c: 1 }); } } }
}
function returnObj(o, x, y) {
  if (o.job) cancelJob(o, x, y); // v59: a furnace / pot picked up mid-job gives back the finished items and the unused materials
  const d = OBJ[o.t]; if (o.store) for (const s2 of o.store) { const l = moveInto(G.inv, s2); if (l) spawnDrop(s2.id, l, x, y); }
  if (DUR[d.item]) { const it = { id: d.item, c: 1, dur: Math.round(o.e != null ? o.e : DUR[d.item][0]) }; if (moveInto(G.inv, it)) { spawnDrop(d.item, 1, x, y); G.drops[G.drops.length - 1].dur = it.dur; } }
  else { const it = TIER_IT[o.t] && o.lv ? TIER_IT[o.t][o.lv] : d.item; const l = addItem(it, 1, false); if (l) spawnDrop(it, 1, x, y); } // v60: an upgraded workbench comes back as its tier item
  invDirty = true;
}
function wirePowered(i) { const n = CIRC.net.get(i); return n != null && CIRC.pRoots.has(CIRC.find(n)); }

// ---- deep regions: lava cave (south) and ice cave (west) ----
Object.assign(ITEMS, {
  goldOre: { n: '금광석', d: '용암 동굴의 금 광맥에서 나와요. 용광로에서 녹여요.' },
  goldBar: { n: '금괴', d: '반짝이는 금괴. 깊은 동굴 장비를 만들어요.' },
  obsidian: { n: '흑요석', d: '현무암벽을 캐면 가끔 나오는 검은 돌. 아주 날카로워요.' },
  frostShard: { n: '서리 결정', d: '얼음 동굴의 서리 광맥에서 나오는 차가운 결정.' },
  fireBerry: { n: '불꽃 열매', kind: 'food', food: 22, heal: 20, d: '용암 동굴 불꽃풀에 열리는 따끈한 열매.' },
  lavaCore: { n: '용암 핵', d: '용암 거북의 등껍질 속에서 끓던 핵. 전설 장비 재료예요.' },
  frostCore: { n: '서리 핵', d: '서리 정령의 마음이었던 차가운 핵. 전설 장비 재료예요.' },
});
Object.assign(ICON, {
  goldOre: A => { A.e(8, 9, 5.6, 4.6, '#4a414f'); A.e(6.5, 7.5, 2.4, 1.3, '#5a4f58'); A.e(6, 10, 1.7, 1.3, '#ffd25c'); A.e(10, 8, 1.5, 1.3, '#ffd25c'); A.p(9, 11, '#fff1b0'); A.p(10, 7, '#fff1b0'); },
  goldBar: A => { A.r(3, 8, 10, 4, '#ffc23a'); A.poly([[3, 8], [5, 5], [11, 5], [13, 8]], '#ffe28a'); A.r(3, 11, 10, 1, '#c9902a'); A.p(6, 6, '#ffffff'); A.p(7, 6, '#fff7d0'); },
  obsidian: A => { A.poly([[3, 12], [6, 4], [11, 3], [13, 9], [9, 14]], '#2a2238'); A.poly([[6, 4], [11, 3], [9, 8]], '#4a3f68'); A.p(8, 5, '#9a8ad0'); A.p(10, 10, '#4a3f68'); },
  frostShard: A => { A.poly([[8, 1], [11, 7], [8, 14], [5, 7]], '#7fd8f0'); A.poly([[8, 1], [8, 14], [5, 7]], '#d4f6ff'); A.poly([[12, 6], [14, 10], [12, 14], [10.5, 10]], '#5ab8e0'); A.p(7, 5, '#ffffff'); },
  fireBerry: A => { A.e(6, 10, 3.6, 3.6, '#ff6a2a'); A.e(10.5, 9, 3.2, 3.2, '#ff8a3d'); A.p(5, 8, '#ffd0a0'); A.p(10, 7, '#ffe0b0'); A.line(8, 6, 9, 2, C.leafD); A.e(10, 3, 1.6, .9, C.leaf); },
  lavaCore: A => { A.e(8, 8, 6, 6, '#7a2a14'); A.e(8, 8, 4.6, 4.6, '#e8501f'); A.e(8, 8, 2.6, 2.6, '#ffc861'); A.p(6, 6, '#ffffff'); A.p(12, 11, '#ff8a3d'); },
  frostCore: A => { A.e(8, 8, 6, 6, '#3a6fa8'); A.e(8, 8, 4.6, 4.6, '#7fd8f0'); A.e(8, 8, 2.6, 2.6, '#ffffff'); A.p(4, 4, '#d4f6ff'); A.p(12, 12, '#d4f6ff'); A.p(12, 4, '#d4f6ff'); A.p(4, 12, '#d4f6ff'); },
});
RECIPES.push(Rc('goldBar', 1, [['goldOre', 2]], 'furnace', 'mat'));
ITEMS.meadow = { n: '풀밭', kind: 'floor', floor: 21, d: '씨앗을 심는 밭이에요. 이끼 포자는 풀밭에서만 자라요.' };
ITEMS.mossSpore = { n: '이끼 포자', kind: 'seed', crop: 'cropMoss', d: '풀밭에 심으면 1분 30초쯤 뒤 이끼가 소복이 자라요. 거두면 이끼 한 삽과 포자를 다시 얻어요.' };
ICON.mossSpore = packet('#4f8f57', A => { A.e(8, 9, 2.6, 2, '#62ad62'); A.p(6, 7, '#9be37a'); A.p(10, 8, '#9be37a'); A.p(8, 11, '#3c7a46'); });
OBJ.cropMoss = { n: '이끼', crop: 'moss', grow: 90, yield: [['gMoss', 2, 3, 1], ['mossSpore', 1, 2, 1], ['fiber', 1, 1, 0.5]] };
OBJ.grass.drops.push(['mossSpore', 1, 1, 0.25]);
RECIPES.push(Rc('meadow', 4, [['dirt', 2], ['fiber', 2]], 'bench', 'nature'), Rc('mossSpore', 2, [['fiber', 3]], null, 'mat'));
OSPR.fireBloom = [16, 16, A => { A.line(5, 15, 5, 9, '#5a3a2e'); A.line(10, 15, 11, 8, '#5a3a2e'); A.e(4, 14, 2, .9, '#4a3a30'); A.e(11, 14.5, 2, .9, '#4a3a30'); for (const [x, y] of [[5, 7], [11, 6]]) { A.poly([[x - 2.6, y + 2], [x, y - 4], [x + 2.6, y + 2]], '#ff6a2a'); A.poly([[x - 1.4, y + 2], [x, y - 1.6], [x + 1.4, y + 2]], '#ffc861'); A.p(x, y + 1, '#fff1b0'); } A.e(8, 12, 1.6, 1.4, '#ff8a3d'); A.p(8, 11, '#ffd0a0'); }];
OSPR.iceCluster = [16, 18, A => { A.poly([[3, 16], [4, 7], [7, 16]], '#5a9ac8'); A.poly([[6, 16], [8, 2], [11, 16]], '#9fd8f0'); A.poly([[6, 16], [8, 2], [8, 16]], '#e8f8ff'); A.poly([[10, 16], [13, 8], [14, 16]], '#7fc0e8'); A.p(7, 6, '#fff'); A.e(8, 16.5, 6, 1.2, '#5a88b0'); }];
OBJ.fireBloom = { n: '불꽃풀', hp: 1, nat: 'cut', light: [2.6, '#ff9b4a'], drops: [['fireBerry', 1, 1, 0.6], ['fiber', 1, 1, 0.4]] };
OBJ.iceCluster = { n: '얼음 결정', solid: 1, hp: 4, tier: 2, nat: 'mine', light: [3, '#9fe8ff'], drops: [['frostShard', 1, 2, 1]] };
Object.assign(ENEMY, {
  magmaSlime: { n: '용암 말랑이', hp: 95, dmg: 20, spd: 3.0, r: 0.36, hop: 1, drops: [['gel', 1, 2, 0.8], ['obsidian', 1, 1, 0.25], ['goldOre', 1, 1, 0.2]], col: '#ff7a3d' },
  cinder: { n: '불씨 도깨비', hp: 80, dmg: 19, spd: 2.5, r: 0.3, hop: 0, drops: [['fireBerry', 1, 1, 0.4], ['goldOre', 1, 1, 0.3]], col: '#ff9b4a' },
  frostSlime: { n: '얼음 말랑이', hp: 90, dmg: 18, spd: 2.9, r: 0.36, hop: 1, drops: [['gel', 1, 2, 0.8], ['frostShard', 1, 1, 0.35]], col: '#9fd8f0' },
  snowling: { n: '눈뭉치', hp: 85, dmg: 18, spd: 2.3, r: 0.32, hop: 0, drops: [['frostShard', 1, 1, 0.35], ['fiber', 1, 2, 0.4]], col: '#e8f4ff' },
});
// tougher monsters everywhere (bloom critters stay gentle); deeper places notice you from farther away
Object.assign(ENEMY.slimeG, { hp: 18, dmg: 7 }); Object.assign(ENEMY.slimeO, { hp: 40, dmg: 12, aggro: 8.5 }); Object.assign(ENEMY.slimeP, { hp: 75, dmg: 18, aggro: 9 }); Object.assign(ENEMY.shroomy, { hp: 34, dmg: 11, spd: 2.3, aggro: 8.5 });
Object.assign(ENEMY.magmaSlime, { hp: 120, dmg: 24, aggro: 10 }); Object.assign(ENEMY.cinder, { hp: 105, dmg: 22, spd: 2.7, aggro: 10 }); Object.assign(ENEMY.frostSlime, { hp: 115, dmg: 22, aggro: 10 }); Object.assign(ENEMY.snowling, { hp: 110, dmg: 22, spd: 2.5, aggro: 10 });
const SPAWN_CAP = [6, 8, 9, 10, 10], SPAWN_EVERY = [2.6, 2.3, 2.0, 1.6, 1.6], SPAWN_PACK = [0, .2, .3, .4, .4];
CATCH[3] = CATCH[2]; CATCH[4] = [['smelt', 50], ['shrimp', 26], ['crucian', 10], ['boot', 6], ['koi', 8]];
// deep gear (영웅) and legendary (전설)
const GEAR2 = {
  swordGold: ['황금 검', 'sword', 36, [['goldBar', 6], ['obsidian', 2], ['ironBar', 2]], 1100, [['goldBar', 2]], swordIcon('#ffd25c', '#fff1b0', '#c9902a'), '묵직하게 빛나는 황금 검.'],
  daggerObsidian: ['흑요석 단검', 'dagger', 24, [['obsidian', 4], ['goldBar', 1], ['rope', 1]], 900, [['obsidian', 2]], daggerIcon('#3a2a4a', '#9a8ad0', '#c9902a'), '유리처럼 날카로운 단검. 치명타가 잘 터져요.'],
  hammerObsidian: ['흑요석 망치', 'hammer', 54, [['obsidian', 6], ['goldBar', 3], ['wood', 2]], 1000, [['obsidian', 3]], hammerIcon('#3a2a4a', '#6a5a8a', '#1a1424'), '땅이 갈라질 만큼 무거운 한 방.'],
  spearFrost: ['서리 창', 'spear', 34, [['frostShard', 8], ['goldBar', 2], ['wood', 3]], 1000, [['frostShard', 3]], spearIcon('#7fd8f0', '#e8f8ff'), '찌르면 적이 꽁꽁 얼어붙어요.', null, 'chill'],
  staffFrost: ['눈꽃 지팡이', 'staff', 28, [['frostShard', 6], ['crystal', 4], ['glowcap', 3]], 1000, [['frostShard', 3]], staffIcon('#9fd8f0', '#ffffff'), '눈꽃 구슬이 적을 꿰뚫고 얼려요.', '#d4f6ff', 'chill'],
  bowGold: ['황금 활', 'bow', 28, [['goldBar', 4], ['rope', 3], ['frostShard', 2]], 1000, [['goldBar', 2]], bowIcon('#c9902a', '#ffd25c', '#fff1b0'), '황금빛 화살이 멀리 날아가요.'],
};
for (const id in GEAR2) { const [n, wt, dmg, req, dur, fix, icon, d, orb, fx] = GEAR2[id]; ITEMS[id] = { n, kind: 'sword', wt, dmg, stack: 1, d, orb, fx }; ICON[id] = icon; DUR2[id] = [dur, fix]; RAR[id] = 3; RECIPES.push(Rc(id, 1, req, 'forge', 'weapon')); }
ITEMS.pickGold = { n: '황금 곡괭이', kind: 'pick', power: 5, tier: 3, stack: 1, d: '깊은 동굴의 벽도 빠르게 캐는 곡괭이.' }; ICON.pickGold = pickIcon('#ffd25c', '#fff1b0'); DUR2.pickGold = [1800, [['goldBar', 2]]]; RAR.pickGold = 3;
RECIPES.push(Rc('pickGold', 1, [['goldBar', 6], ['obsidian', 2], ['frostShard', 2]], 'forge', 'tool'));
Object.assign(UNIQ_OF, { turtle: 'swordLava', spirit: 'bowFrost' });
ITEMS.swordLava = { n: '용암 거북의 대검', kind: 'sword', wt: 'sword', dmg: 44, stack: 1, fx: 'burn', d: '용암 거북의 등껍질을 깎아 만든 대검. 벤 자리에 불꽃이 일어요.' }; ICON.swordLava = swordIcon('#e8501f', '#ffc861', '#5a3a2e'); DUR2.swordLava = [1300, [['obsidian', 3]]]; RAR.swordLava = 3;
ITEMS.bowFrost = { n: '서리 정령의 활', kind: 'sword', wt: 'bow', dmg: 32, stack: 1, fx: 'chill', d: '서리 정령이 남긴 활. 화살에 맞은 적이 얼어붙어요.' }; ICON.bowFrost = bowIcon('#5a9ac8', '#e8f8ff', '#7fd8f0'); DUR2.bowFrost = [1300, [['frostShard', 3]]]; RAR.bowFrost = 3;
ITEMS.swordDawn = { n: '새벽빛 검', kind: 'sword', wt: 'sword', dmg: 62, stack: 1, fx: 'burn', d: '용암과 서리의 핵을 함께 벼린 전설의 검. 새벽처럼 환하게 타올라요.' }; ICON.swordDawn = swordIcon('#ffe9a8', '#ffffff', '#ff8fa3'); DUR2.swordDawn = [2400, [['goldBar', 2], ['crystal', 2]]]; RAR.swordDawn = 4;
ITEMS.pickStar = { n: '별빛 곡괭이', kind: 'pick', power: 7, tier: 3, stack: 1, d: '별빛이 깃든 전설의 곡괭이. 어떤 벽이든 순식간에 캐요.' }; ICON.pickStar = pickIcon('#ffe9a8', '#ffffff'); DUR2.pickStar = [3000, [['goldBar', 2], ['frostShard', 2]]]; RAR.pickStar = 4;
RECIPES.push(Rc('swordDawn', 1, [['lavaCore', 1], ['frostCore', 1], ['goldBar', 8], ['crystal', 10]], 'forge', 'weapon'), Rc('pickStar', 1, [['lavaCore', 1], ['frostCore', 1], ['goldBar', 8], ['frostShard', 8]], 'forge', 'tool'));
Object.assign(RAR, { goldBar: 2, frostShard: 2, obsidian: 2, lavaCore: 3, frostCore: 3 });
// ---- v42 mineral arrows: optional ammo — a bow shoots plain wooden arrows forever, but carries the best arrows in the bag first (one per shot) ----
// id: [name, damage ×, tip colour, recipe (makes 10), station, pierce, effect]
const ARROWS = {
  arrowStone: ['돌 화살', 1.15, '#b9b4cc', [['stone', 2], ['wood', 1]], 'bench', 0],
  arrowCopper: ['구리 화살', 1.3, '#e5884a', [['copperBar', 1], ['wood', 1], ['fiber', 1]], 'forge', 0],
  arrowIron: ['철 화살', 1.5, '#d8e0ea', [['ironBar', 1], ['wood', 1], ['fiber', 1]], 'forge', 0],
  arrowCrystal: ['수정 화살', 1.7, '#c1a8f5', [['crystal', 2], ['wood', 1], ['fiber', 1]], 'forge', 1],
  arrowGold: ['금 화살', 1.9, '#ffd25c', [['goldBar', 1], ['wood', 2], ['fiber', 1]], 'forge', 0, 'burn'],
};
const ARROW_ORD = Object.keys(ARROWS).reverse(); // best first
const arrowIcon = (h, hl) => A => { A.line(2, 14, 11, 5, '#8a6a52', 1); A.line(3, 14, 11, 6, '#b8946a', 1); A.poly([[9.5, 3.5], [14.5, 1.5], [12.5, 6.5]], h); A.p(12, 4, hl); A.r(1, 11, 2, 2, '#eef2f7'); A.r(3, 13, 2, 2, '#eef2f7'); A.p(2, 12, '#ff8fa3'); };
for (const id in ARROWS) { const [n, mul, tip, req, at, pierce, fx] = ARROWS[id];
  ITEMS[id] = { n, kind: 'arrow', stack: 999, arw: { mul, tip, pierce, fx }, d: `활을 쓸 때 가방에 있으면 한 발에 하나씩 써요. 화살이 없으면 나무 화살을 써요.` }; ICON[id] = arrowIcon(tip, '#ffffff'); RECIPES.push(Rc(id, 10, req, at, 'weapon')); }
Object.assign(RAR, { arrowIron: 1, arrowCrystal: 2, arrowGold: 2 });
function bestArrow() { for (const id of ARROW_ORD) { const k = G.inv.findIndex(s => s && s.id === id); if (k >= 0) return k; } return -1; }
function takeArrow() { const k = bestArrow(); if (k < 0) return null; const s = G.inv[k], a = ITEMS[s.id].arw; s.c--; if (s.c <= 0) G.inv[k] = null; invDirty = true; G.stats.arrows = (G.stats.arrows || 0) + 1; return a; }
// ---- v42 stone drill: an electric drill like the ore drills, cheaper and quicker, but only for terrain (dirt and stone walls) ----
ITEMS.drillStone = { n: '돌 채굴기', kind: 'place', obj: 'drillStone', d: '놓을 때 바라보는 쪽의 지형(흙벽·돌벽·화강암 벽)에서 흙·돌·화강암을 계속 캐요(벽은 사라지지 않아요). 광맥은 못 캐는 대신 구리 채굴기보다 빨라요. 전기가 필요해요.' };
OBJ.drillStone = { n: '돌 채굴기', solid: 1, item: 'quarry', dev: 'drill', tier: 1, only: [1, 2, 3], every: 8, draw: .4, idle: 0 };
USE.drillStone = 'drill';
const stoneDrill = dir => A => { A.r(3, 8, 10, 10, '#8f8aa3'); A.r(3, 8, 10, 2, '#b9b4cc'); A.r(3, 8, 1, 10, '#a39eb5'); A.r(12, 8, 1, 10, '#625d78'); A.p(5, 15, '#625d78'); A.p(10, 11, '#625d78'); A.p(9, 16, '#625d78');
  A.r(5, 12, 6, 3, '#9c6a4a'); A.r(5, 12, 6, 1, '#c99560'); A.e(8, 13.5, 1.4, 1.4, '#5a3929'); A.line(8, 13, 11, 11, '#5a3929'); A.p(7, 16, '#7fe0b5');
  const [dx, dy] = dir; if (dy < 0) A.poly([[5, 9], [11, 9], [8, 1]], '#b9b4cc'); else if (dy > 0) A.poly([[5, 17], [11, 17], [8, 21]], '#b9b4cc'); else if (dx > 0) A.poly([[12, 10], [12, 16], [16, 13]], '#b9b4cc'); else A.poly([[4, 10], [4, 16], [0, 13]], '#b9b4cc'); A.p(8 + dx * 5, 12 + dy * 5, '#ffffff'); };
OSPR.drillStone = [16, 22, stoneDrill([0, -1])];
for (const [k, d] of [['U', [0, -1]], ['D', [0, 1]], ['L', [-1, 0]], ['R', [1, 0]]]) OSPR['drillStone' + k] = [16, 22, stoneDrill(d)];
// v46: what was asked for was a Palworld-style stone pit (돌 채굴장, a 2×2 site that only gives stone), so the wall drill has no recipe any more;
// drills already set down keep working, and picking one up (or loading a save that holds one) gives a 돌 채굴장 instead
// ---- v43 crystal cave materials: granite (terrain) · quartz 석영 (mineral, the old 'crystal' item) · 수정결정 (the region's own core material) ----
RECIPES.push(Rc('quartzR', 1, [['crystal', 2]], 'furnace', 'mat'));
Object.assign(RAR, { quartzR: 1, cryGem: 2 });
{ const setReq = (out, req) => { const r = RECIPES.find(q => q.out === out); if (r) { r.req = req; r.at = 'forge'; } };
  setReq('swordCrystal', [['quartzR', 4], ['cryGem', 2], ['ironBar', 3]]);
  setReq('staffCrystal', [['quartzR', 4], ['cryGem', 2], ['ironBar', 4], ['glowcap', 4]]);
  setReq('bowCrystal', [['quartzR', 4], ['cryGem', 2], ['ironBar', 4], ['rope', 4]]);
  setReq('pickCrystal', [['quartzR', 5], ['ironBar', 4], ['golemCore', 1], ['glowcap', 2]]);
  setReq('staffFrost', [['frostShard', 6], ['quartzR', 2], ['cryGem', 1], ['glowcap', 3]]);
  setReq('swordDawn', [['lavaCore', 1], ['frostCore', 1], ['goldBar', 8], ['quartzR', 6], ['cryGem', 2]]);
  setReq('arrowCrystal', [['quartzR', 1], ['wood', 1], ['fiber', 1]]);
  setReq('lampCrystal', [['cryGem', 1], ['crystal', 2], ['ironBar', 1]]); }
function emberSpr() { return mk(16, 16, A => { A.r(5, 14, 2, 1, '#3a2a26'); A.r(9, 14, 2, 1, '#3a2a26'); A.e(8, 11, 3.8, 3.3, '#5a3a2e'); A.p(7, 11, '#ffc861'); A.p(9, 11, '#ffc861'); A.p(6, 12, '#ff8a3d'); A.p(10, 12, '#ff8a3d');
  A.poly([[2.5, 9], [5, 3], [7, 5.5], [8, 0.5], [10, 5.5], [11.5, 3], [13.5, 9]], '#ff6a2a'); A.poly([[4.5, 9], [6.5, 5], [8, 3], [9.5, 5], [11.5, 9]], '#ffc861'); A.r(3, 8, 10, 1, '#c4441a'); }); }
function snowSpr() { return mk(16, 16, A => { A.e(8, 11.5, 4.6, 3.6, '#c8dcef'); A.e(8, 11, 4.3, 3.3, '#ffffff'); A.e(8, 6, 3.4, 3, '#c8dcef'); A.e(8, 5.6, 3.1, 2.7, '#ffffff'); A.p(7, 5, INK); A.p(9, 5, INK); A.p(6, 6, C.blush); A.p(10, 6, C.blush); A.p(8, 7, '#ff9b4a');
  A.line(3, 9, 1, 7, '#7a5a3a'); A.line(13, 9, 15, 7, '#7a5a3a'); A.p(8, 10, '#5a88b0'); A.p(8, 12, '#5a88b0'); A.r(5, 2, 6, 1, '#7fd8f0'); A.r(6, 1, 4, 1, '#7fd8f0'); }); }
function turtleSpr(shell) { return mk(40, 32, A => {
  if (!shell) { A.e(7, 26, 3.4, 2.6, '#a8784e'); A.e(33, 26, 3.4, 2.6, '#a8784e'); A.e(9, 13, 3, 2.4, '#a8784e'); A.e(31, 13, 3, 2.4, '#a8784e'); }
  A.e(20, 18, 17, 11, '#3a2620'); A.e(20, 17, 16, 10, '#5a3a2e'); A.e(20, 16, 13, 7.5, '#7a4a34');
  for (const [x, y] of [[14, 13], [20, 11], [26, 13], [17, 19], [23, 19]]) { A.poly([[x - 3, y], [x, y - 2.5], [x + 3, y], [x, y + 2.5]], '#4a2e24'); A.line(x - 2, y, x + 2, y, '#ff8a3d'); A.p(x, y - 1, '#ffc861'); }
  A.poly([[12, 8], [14, 3], [16, 8]], '#2a1c18'); A.poly([[18, 6], [20, 0.5], [22, 6]], '#2a1c18'); A.poly([[24, 8], [26, 3], [28, 8]], '#2a1c18'); A.p(20, 2, '#ff8a3d');
  A.r(4, 25, 32, 2, '#2a1c18');
  if (!shell) { A.e(20, 27, 6, 4.6, '#c9a070'); A.e(18.5, 25.5, 3, 1.6, '#e0c090'); A.r(16, 26, 2, 2, INK); A.r(22, 26, 2, 2, INK); A.p(16, 26, '#fff'); A.p(22, 26, '#fff'); A.r(19, 29, 2, 1, INK); A.e(15, 29, 1.2, .8, C.blush); A.e(25, 29, 1.2, .8, C.blush); }
}); }
function spiritSpr() { return mk(32, 36, A => {
  A.poly([[9, 24], [16, 35], [23, 24]], '#bfe6ff'); A.poly([[12, 24], [16, 32], [20, 24]], '#e8f8ff');
  A.e(5, 18, 2.6, 2.6, '#9fd8f0'); A.e(27, 18, 2.6, 2.6, '#9fd8f0'); A.p(4, 17, '#fff'); A.p(26, 17, '#fff');
  A.e(16, 17, 10, 9.5, '#7fc0e8'); A.e(16, 16.5, 9.2, 8.8, '#d4f0ff'); A.e(13, 13, 4, 2.6, '#ffffff');
  A.r(12, 16, 2, 3, '#2a4f88'); A.r(18, 16, 2, 3, '#2a4f88'); A.p(12, 16, '#fff'); A.p(18, 16, '#fff'); A.r(15, 21, 2, 1, '#2a4f88'); A.e(10.5, 20, 1.4, .9, '#ffc0d0'); A.e(21.5, 20, 1.4, .9, '#ffc0d0');
  for (const [x, h] of [[9, 5], [13, 8], [16, 10], [19, 8], [23, 5]]) { A.poly([[x - 1.8, 9], [x, 9 - h], [x + 1.8, 9]], '#7fd8f0'); A.poly([[x - .6, 9], [x, 9 - h + 2], [x + .6, 9]], '#ffffff'); }
}); }
// hazards on the floor: lava pools, frost nova warnings
function updateHazards(dt) {
  const p = G.p; G.hz = G.hz || [];
  for (let i = G.hz.length - 1; i >= 0; i--) { const h = G.hz[i]; h.t += dt; if (h.t > h.life) { G.hz.splice(i, 1); continue; } if (h.t < h.warn || p.dead > 0) continue;
    const d = Math.hypot(p.x - h.x, p.y - h.y);
    if (h.k === 'lava') { if (d < h.r) hurtPlayer(h.dmg, h.x, h.y, 'fire'); }
    else if (!h.done) { h.done = 1; puff(h.x, h.y, '#d4f6ff', 26, 4.5, .4); shake = Math.max(shake, .3); if (d < h.r) { hurtPlayer(h.dmg, h.x, h.y); p.slowT = (h.slow || 2) * (wearing('snowBrooch') ? broochMul(eqLv('snowBrooch')) : 1); ftext(p.x, p.y - 1.6, '꽁꽁!', '#bfe6ff'); } } }
}
function drawHazards(T, camX, camY) {
  const t = performance.now() / 1000;
  for (const h of G.hz || []) { const X = h.x * T - camX, Y = h.y * T - camY, warn = h.t < h.warn;
    if (h.k === 'lava') { const a = warn ? .25 + .25 * Math.sin(t * 20) : Math.min(1, (h.life - h.t) * 1.5); ctx.globalAlpha = a; ctx.fillStyle = warn ? '#ff8a3d' : '#e8501f'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.fill(); if (!warn) { ctx.fillStyle = '#ffc861'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T * .55, h.r * T * .32, 0, 0, 6.283); ctx.fill(); } ctx.globalAlpha = 1; }
    else if (warn) { const pr = h.t / h.warn; ctx.strokeStyle = `rgba(191,230,255,${.4 + pr * .5})`; ctx.lineWidth = 2 * Z; ctx.setLineDash([4 * Z, 3 * Z]); ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = `rgba(191,230,255,${pr * .25})`; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T * pr, h.r * T * .62 * pr, 0, 0, 6.283); ctx.fill(); } }
}

// ---- multi-tile objects (2×1, 2×2, 3×2 …): the top-left tile holds the object, the other tiles hold {t:'_part', a: anchor} ----
OBJ._part = { n: '', part: 1 };
const fpOf = o => { const d = OBJ[o.t]; if (!d || !d.sz) return [1, 1]; return o.rot && d.sz[0] !== d.sz[1] ? [d.sz[1], d.sz[0]] : d.sz; };
function fpTiles(i, o, fp) { fp = fp || fpOf(o); const x = i % W, y = (i / W) | 0, out = []; for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) out.push(idx(x + dx, y + dy)); return out; }
function setParts(i, o) { for (const j of fpTiles(i, o)) if (j !== i) G.objs.set(j, { t: '_part', a: i }); }
function clearParts(i, o) { for (const j of fpTiles(i, o)) { if (j === i) continue; const q = G.objs.get(j); if (q && q.t === '_part' && q.a === i) G.objs.delete(j); } }
function delObj(i) { const o = G.objs.get(i); if (o && OBJ[o.t] && OBJ[o.t].sz) clearParts(i, o); G.objs.delete(i); }
function anchorAt(i) { const o = G.objs.get(i); if (o && o.t === '_part') { const a = G.objs.get(o.a); return a && a.t !== '_part' ? o.a : -1; } return o ? i : -1; }
function fpFree(x, y, fp, solid, own) { for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) { const tx = x + dx, ty = y + dy; if (!inB(tx, ty)) return false; const j = idx(tx, ty); if (G.wall[j] || G.floor[j] === WATER || G.floor[j] === LAVA) return false; const q = G.objs.get(j); if (q && !(own != null && (j === own || (q.t === '_part' && q.a === own)))) return false; if (solid && occupied(tx, ty)) return false; } return true; }
function placeAnchor(t, fp) { const f = G.p.face; let x = t.x, y = t.y; if (Math.abs(f.x) >= Math.abs(f.y)) { if (f.x < 0) x -= fp[0] - 1; y -= Math.floor((fp[1] - 1) / 2); } else { if (f.y < 0) y -= fp[1] - 1; x -= Math.floor((fp[0] - 1) / 2); } return { x, y }; }
let placeRot = 0, placeRotFor = null;
const pRot = () => { const s0 = G && selItem(); return s0 && s0.id === placeRotFor ? placeRot : 0; };
const DIRN = ['아래', '오른쪽', '위', '왼쪽'];
// v65 (stardew-like): each piece turns 1, 2 or 4 ways, chosen before placing (to turn a placed one, pick it up and place it again).
// Seats face 4 ways (the sitter faces the same way); other furniture 2 (front / turned 90°); front-only and round things do not turn.
// A turned piece uses its own drawing when there is one (obj/<id>S.png side, obj/<id>U.png back), otherwise the drawing turned 90°.
const ROT4 = new Set(['chair', 'cryChair', 'mossSofa', 'ironChair', 'shroomStool', 'stumpStool', 'sofa2', 'logBench', 'stoneBench', 'cushion']);
const NOROT = new Set(['pictureFrame', 'vase', 'table', 'rugRound', 'cryMirror', 'cryFountain', 'fountainBig', 'fishTank', 'bootPlanter', 'torch']);
function rotN(t) { const d = OBJ[t]; if (!d || !d.item || d.tw || d.dev || d.src || d.sw || d.chest || d.ranch || d.nat || d.crop || d.tree || d.lost || NOROT.has(t)) return 1; return ROT4.has(t) || d.dir4 ? 4 : 2; }
const canRotObj = t => rotN(t) > 1;
const rotSwaps = d => !!(d && d.sz && d.sz[0] !== d.sz[1]);
const placeFp = d => d.sz ? (pRot() % 2 && rotSwaps(d) ? [d.sz[1], d.sz[0]] : d.sz) : [1, 1];
const rotOf = o => typeof o.dir === 'number' ? o.dir : o.rot ? 1 : 0;
const ROTC = new WeakMap(), turned = c => { let k = ROTC.get(c); if (!k) { k = rot90(c); ROTC.set(c, k); } return k; };
function rotImg(t, r, base) { // → [image, flip]
  if (!r || !base) return [base, false]; const main = base === SPR.obj[t];
  if (r === 2 && rotN(t) === 4) return [(main && SPR.obj[t + 'U']) || base, false];
  return [(main && (SPR.obj[t + 'S'] || SPR.obj[t + 'V'])) || turned(base), r === 3]; }
function rotatePlace() { const s = selItem(), it = s && ITEMS[s.id]; if (!it || it.kind !== 'place' || rotN(it.obj) < 2) return; const n = rotN(it.obj);
  if (placeRotFor !== s.id) { placeRotFor = s.id; placeRot = 0; } placeRot = (placeRot + 1) % n;
  toast(n === 4 ? `${josa(DIRN[placeRot], '을', '를')} 보게 놓아요` : placeRot ? '옆으로 돌려 놓아요' : '정면으로 놓아요', null, 'prot'); SFX.click(); }
function rotateAction() { if (!started || paused || !G || G.p.dead > 0) return; rotatePlace(); }
function rot90(c) { const k = document.createElement('canvas'); k.width = c.height; k.height = c.width; k.hd = c.hd; const g = k.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(k.width, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return k; }
// ---- tree workshop: a 2×2 plot of saplings; chop when grown, or power it to chop by itself into a chest next to it ----
const FARM_GROW = 90, FARM_CAP = 60;
const growOf = o => (OBJ[o.t] && OBJ[o.t].grow) || FARM_GROW;
const farmStage = o => Math.max(0, Math.min(3, Math.floor((G.time - (o.p || 0)) / growOf(o) * 3)));
const farmLbl = o => (o.store || []).length ? '꺼내기' : farmStage(o) >= 3 ? farmT(o)[0] : '살펴보기';
const FARM_TXT = { treeFarm: ['베기', '나무를 베었어요! 묘목이 다시 자라요', '나무가 자라는 중이에요', '#7fbf6a', 'wood'], quarry: ['캐기', '돌을 캤어요! 바위가 다시 차올라요', '바위가 차오르는 중이에요', '#a29db6', 'stone'],
  pitCu: ['캐기', '구리광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', C.copper, 'copperOre'], pitFe: ['캐기', '철광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', C.iron, 'ironOre'], pitGold: ['캐기', '금광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', '#ffd25c', 'goldOre'] };
const PIT_Y = { quarry: ['stone', 5, 7], pitCu: ['copperOre', 3, 4], pitFe: ['ironOre', 3, 4], pitGold: ['goldOre', 2, 3] }; // v46: each pit gives one material only
function pitStat(o, n) { G.stats.quarried = (G.stats.quarried || 0) + n; if (o.t !== 'quarry') G.stats.drilled = (G.stats.drilled || 0) + n; }
const farmT = o => FARM_TXT[o.t] || FARM_TXT.treeFarm;
function farmYield(o) { const py = o && PIT_Y[o.t]; if (py) return [[py[0], py[1] + (Math.random() * (py[2] - py[1] + 1) | 0)]]; // v46: the stone pit gives only stone
  const out = [['wood', 5 + (Math.random() * 3 | 0)]]; if (Math.random() < .35) out.push(['resin', 1]); if (Math.random() < .12) out.push(['sapling', 1]); if (Math.random() < .5) out.push(['fiber', 1 + (Math.random() * 2 | 0)]); return out; }
function farmHarvest(i, o, auto) { const x = i % W, y = (i / W) | 0;
  if (!auto) { const got = farmYield(o); o.p = G.time; if (PIT_Y[o.t]) pitStat(o, got[0][1]); else G.stats.farmed = (G.stats.farmed || 0) + got[0][1]; for (const [id, c] of got) spawnDrop(id, c, x + 1, y + 1.2); SFX.brk(); puff(x + 1, y + 1, farmT(o)[3], 10, 2.5); gainXp(2); return true; }
  const chests = []; for (const j of fpTiles(i, o)) { const jx = j % W, jy = (j / W) | 0; for (const [dx, dy] of D4) { if (!inB(jx + dx, jy + dy)) continue; const c = G.objs.get(idx(jx + dx, jy + dy)); if (c && c.t === 'chest' && c.items && !chests.includes(c)) chests.push(c); } }
  const stN = (o.store || []).reduce((a, s2) => a + s2.c, 0); if (stN >= FARM_CAP && !chests.some(c => c.items.some(z => !z))) { o.why = 'full'; return false; }
  const got = farmYield(o); o.p = G.time; o.why = ''; if (PIT_Y[o.t]) pitStat(o, got[0][1]); else G.stats.farmed = (G.stats.farmed || 0) + got[0][1];
  for (const [id, c] of got) { let left = c; for (const ch of chests) { if (!left) break; left = moveInto(ch.items, { id, c: left }); } if (left) { o.store = o.store || []; const n = o.store.reduce((a, s2) => a + s2.c, 0), add = Math.min(left, FARM_CAP - n); if (add > 0) { const s2 = o.store.find(z => z.id === id); if (s2) s2.c += add; else o.store.push({ id, c: add }); } } }
  if (Math.hypot(x + 1 - G.p.x, y + 1 - G.p.y) < 14) { puff(x + 1, y + 1, farmT(o)[3], 8, 2); SFX.brk(); } return true; }
const farmTree = (A, x, yb, st) => { const s = [0.55, 1.1, 1.65, 2.2][st]; if (st === 0) { A.e(x, yb, 3, 1.2, '#4a3428'); A.line(x, yb, x, yb - 5, C.woodD); A.e(x - 2, yb - 4.5, 2.2, 1.4, C.leaf); A.e(x + 2, yb - 5.5, 2.2, 1.4, C.leafL); A.e(x, yb - 6.5, 1.6, 1.2, '#9be37a'); A.p(x - 2, yb - 5, '#c8f58a'); return; }
  A.r(x - 1, Math.round(yb - 4 * s), 2, Math.round(4 * s), C.wood); A.r(x - 1, Math.round(yb - 4 * s), 1, Math.round(4 * s), C.woodL); A.e(x, yb - 4 * s - 2.4 * s, 2.8 * s + 1, 2.4 * s + 1, C.leafD); A.e(x - .6, yb - 4 * s - 2.8 * s, 2.1 * s + .6, 1.8 * s + .6, C.leaf); A.p(Math.round(x - 1.5 * s), Math.round(yb - 4 * s - 3.8 * s), C.leafL); if (st === 3) { A.p(Math.round(x + s), Math.round(yb - 5.5 * s), '#ffd36b'); } };
const quarryRock = (A, x, yb, st, oc, ol) => { const s = [.45, .75, 1, 1.25][st]; A.e(x, yb - 3 * s, 6 * s + 1, 4 * s + 1, '#625d78'); A.e(x - .5, yb - 3.6 * s, 5.4 * s + .6, 3.4 * s + .6, '#8e89a3'); A.e(x - 2 * s, yb - 5 * s, 2.4 * s, 1.4 * s, '#b9b4cc'); A.p(Math.round(x + 2 * s), Math.round(yb - 2 * s), '#625d78'); if (st === 3) { A.p(Math.round(x - 3), Math.round(yb - 6), '#ffffff'); A.p(Math.round(x + 3), Math.round(yb - 5), '#e3d4ff'); }
  if (oc && st) for (const [dx, dy] of [[-2, -3], [2, -4], [0, -1.6], [3, -1.4]].slice(0, st + 1)) { A.e(x + dx * s, yb + dy * s, 1.1 * s + .4, .9 * s + .4, oc); A.p(Math.round(x + dx * s - .5), Math.round(yb + dy * s - .5), ol); } };
const quarrySpr = (st, oc, ol) => [32, 40, A => { A.r(1, 10, 30, 29, '#5a5468'); for (let k = 0; k < 14; k++) { const R = rng(4100 + k); A.p(2 + R() * 28 | 0, 11 + R() * 27 | 0, k % 2 ? '#6f6a86' : '#46405a'); }
  A.r(0, 9, 32, 2, C.woodD); A.r(0, 37, 32, 2, C.woodD); A.r(0, 9, 2, 30, C.woodD); A.r(30, 9, 2, 30, C.woodD); for (const x of [0, 10, 20, 30]) { A.r(x, 7, 2, 4, C.wood); A.r(x, 36, 2, 4, C.wood); }
  quarryRock(A, 10, 25, st, oc, ol); quarryRock(A, 22, 24, st, oc, ol); quarryRock(A, 16, 36, st, oc, ol); A.line(25, 34, 29, 28, C.woodD); A.line(27, 27, 30, 30, C.stoneL); A.p(26, 28, C.stoneL); }];
const farmSpr = st => [32, 40, A => { A.r(1, 10, 30, 29, '#6b4838'); for (let y = 13; y < 38; y += 5) A.r(2, y, 28, 1, '#5a3a2c'); for (let k = 0; k < 8; k++) A.p(3 + k * 3.5 | 0, 37 - (k % 3) * 9, '#62ad62');
  A.r(0, 9, 32, 2, C.woodD); A.r(0, 37, 32, 2, C.woodD); A.r(0, 9, 2, 30, C.woodD); A.r(30, 9, 2, 30, C.woodD); for (const x of [0, 10, 20, 30]) { A.r(x, 7, 2, 4, C.wood); A.r(x, 36, 2, 4, C.wood); } A.r(0, 9, 32, 1, C.woodL);
  farmTree(A, 9, 23, st); farmTree(A, 23, 23, st); farmTree(A, 16, 35, st); }];

