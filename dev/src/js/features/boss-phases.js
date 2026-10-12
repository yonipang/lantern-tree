// ================= the deep bosses fight in three stages (66% / 33%): a short roar with no damage taken, then one new thing per stage =================
const PHASE_BOSS = { turtle: 1, spirit: 1 };
const PHASE_TIP = { turtle: ['등껍질에 금이 갔어요! 굴러오다 벽에 부딪힐 때마다 불씨가 튀어요', '화산 등껍질! 바닥이 빨갛게 빛나는 곳을 피하고, 분화가 끝나면 등껍질이 열려요 (피해 1.5배)'],
  spirit: ['얼음 기둥이 솟았어요! 기둥 뒤에 숨으면 얼음 고리를 막아 줘요 (몇 번 맞으면 부서져요)', '눈보라 분신! 반투명한 분신은 한 대면 사라지고, 진짜만 얼음 고리를 쏴요'] };
const bossStage = b => b.hp > b.max * 2 / 3 ? 1 : b.hp > b.max / 3 ? 2 : 3;
function phaseCheck(b) { if (!PHASE_BOSS[b.k] || b.hp <= 0) return; b.stage = b.stage || 1; const s = bossStage(b); if (s <= b.stage) return;
  b.stage = s; b.ph = 'roar'; b.t = 1.5; b.inv = 1.5; G.shots.length = 0; shake = Math.max(shake, .5); SFX.boss(); puff(b.x, b.y - .5, BOSSES[b.k].col, 30, 4, .6); puff(b.x, b.y - .5, '#ffe9a8', 12, 3, .8); ftext(b.x, b.y - 2.6, '!!', '#ffd25c');
  G.stats.phaseTip = G.stats.phaseTip || {}; const key = b.k + s; if (!G.stats.phaseTip[key]) { G.stats.phaseTip[key] = 1; toast(PHASE_TIP[b.k][s - 2], 'warn', 'phase'); }
  if (b.k === 'spirit' && s >= 2 && !(b.pillars || []).length) spiritPillars(b); if (b.k === 'spirit' && s === 3) spiritClones(b, 2); }
function bossCleanup(b) { for (const i of b.pillars || []) { const o = G.objs.get(i); if (o && o.t === 'icePillar') G.objs.delete(i); } b.pillars = []; if (G.enemies.some(e => e.k === 'spiritClone')) G.enemies = G.enemies.filter(e => e.k !== 'spiritClone'); lightDirty = true; }
// lava turtle: stage 2 sparks off every wall bounce, stage 3 erupts around you and then opens its shell
function emberBurst(b) { const p = G.p, base = Math.atan2(p.y - b.y, p.x - b.x); for (const da of [-.45, .45]) { const a = base + da + (Math.random() - .5) * .3; G.shots.push({ x: b.x, y: b.y - .3, vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2, life: 2.4, dmg: 12, k: 'fire' }); } }
function turtleErupt(b) { const p = G.p; G.hz = G.hz || []; for (let k = 0; k < 6; k++) { const a = Math.random() * 6.283, r = k ? 1.3 + Math.random() * 2.4 : 0, hx = p.x + Math.cos(a) * r, hy = p.y + Math.sin(a) * r; if (!isSolid(Math.floor(hx), Math.floor(hy))) G.hz.push({ x: hx, y: hy, r: 1.0, t: 0, warn: .9, life: 2.6, dmg: 18, k: 'lava' }); }
  shake = Math.max(shake, .45); SFX.brk(); puff(b.x, b.y - .6, '#ff8a3d', 22, 4, .5); }
// frost spirit: stage 2 raises four ice pillars to hide behind, stage 3 adds two see-through decoys and turns the gap in its rings
OBJ.icePillar = { n: '얼음 기둥', solid: 1, light: [2.2, '#9fd8f0'] };
OSPR.icePillar = [16, 26, A => { A.e(8, 24.5, 5.4, 1.6, '#7ab8d8'); A.r(4, 6, 8, 18, '#9fd8f0'); A.r(4, 6, 3, 18, '#d8f2ff'); A.r(11, 6, 1, 18, '#6a9cc8'); A.poly([[4, 6], [8, 1], [12, 6]], '#e8f8ff'); A.p(6, 10, '#ffffff'); A.p(9, 16, '#ffffff'); A.line(7, 13, 10, 18, '#bfe6ff'); }];
ENEMY.spiritClone = { n: '눈보라 분신', hp: 1, dmg: 0, spd: 0, r: .5, hop: 0, calm: 1, drops: [], col: '#d4f6ff' };
function spiritPillars(b) { b.pillars = []; const p = G.p; for (const [dx, dy] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) { const x = SI.x + dx, y = SI.y + dy, i = idx(x, y); if (!inB(x, y) || G.wall[i] || G.objs.get(i) || (Math.floor(p.x) === x && Math.floor(p.y) === y)) continue; G.objs.set(i, { t: 'icePillar', hp: 4 }); b.pillars.push(i); puff(x + .5, y + .5, '#d4f6ff', 10, 2.5, .4); } lightDirty = true; }
function spiritClones(b, n) { for (let k = 0; k < n; k++) { const e = mkEnemy('spiritClone', b.x + (k ? 2 : -2), b.y); e.z = .45; G.enemies.push(e); puff(e.x, e.y - .5, '#d4f6ff', 10, 2.5); } }
function cloneTick(b, dt) { const cl = G.enemies.filter(e => e.k === 'spiritClone'); cl.forEach((e, i) => { const a = (b.anim || 0) * .9 + i * Math.PI + .8, tx = b.x + Math.cos(a) * 2.8, ty = b.y + Math.sin(a) * 1.8, k = Math.min(1, dt * 3); if (!boxHits(e.x + (tx - e.x) * k, e.y + (ty - e.y) * k, .3)) { e.x += (tx - e.x) * k; e.y += (ty - e.y) * k; } e.z = .45; e.anim = b.anim; }); return cl; }
function pillarBlocks(s, tx, ty) { const i = idx(tx, ty), o = G.objs.get(i); if (!o || o.t !== 'icePillar') return false; o.hp = (o.hp || 4) - 1; puff(s.x, s.y, '#d4f6ff', 4, 1.6, .2); if (o.hp <= 0) { G.objs.delete(i); puff(tx + .5, ty + .5, '#e8f8ff', 14, 3, .4); SFX.brk(); lightDirty = true; } return true; }
function bossExtraSprites() {
  const crack = src => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.hd = src.hd; const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop'; const w = c.width, h = c.height;
    const pts = [[.28, .42], [.38, .3], [.47, .46], [.56, .32], [.66, .48], [.74, .36]]; g.fillStyle = '#ff6a2a'; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; const n = 12; for (let j = 0; j <= n; j++) g.fillRect(Math.round((x0 + (x1 - x0) * j / n) * w), Math.round((y0 + (y1 - y0) * j / n) * h), 1, 1); }
    g.fillStyle = '#ffd25c'; for (const [x, y] of pts) g.fillRect(Math.round(x * w), Math.round(y * h), 1, 1); return c; };
  const alpha = (src, a) => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.hd = src.hd; const g = c.getContext('2d'); g.globalAlpha = a; g.drawImage(src, 0, 0); return c; };
  SPR.turtleC = crack(SPR.turtle); SPR.turtleCW = whiten(SPR.turtleC); SPR.turtleSC = crack(SPR.turtleS); SPR.turtleSCW = whiten(SPR.turtleSC);
  SPR.spiritClone = alpha(SPR.spirit, .5); SPR.spiritCloneW = alpha(whiten(SPR.spirit), .7); }
TIPS.push('용암 거북과 서리 정령은 체력이 3분의 2, 3분의 1로 줄 때마다 새 기술을 꺼내요. 체력 막대의 눈금을 봐요.');
