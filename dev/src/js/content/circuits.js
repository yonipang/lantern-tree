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

