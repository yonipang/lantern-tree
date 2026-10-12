// ---- dishes for the deep caves: cold / heat protection and the tier-3 dishes made with fire berries and frost radishes ----
Object.assign(EFF, { cold: { n: '추위 대비', v: [.75, .5, 0], t: v => v ? `추위 게이지 ${pct(v)} 속도` : '추위 게이지 안 오름' }, heat: { n: '더위 대비', v: [.75, .5, 0], t: v => v ? `더위 게이지 ${pct(v)} 속도` : '더위 게이지 안 오름' } });
const DEEP_DISHES = [
  ['hotTea', '따끈 버섯차', 'cold', 1, 'cup', ['#c98a5a', '#e36b6b'], [['mushroom', 1], ['gWater', 1]], 'guide:cpick'],
  ['hotSoup', '따끈 버섯 수프', 'cold', 2, 'bowl', ['#d9774a', '#6ff2e6'], [['mushroom', 2], ['glowcap', 1], ['gWater', 1]], 'guide:cpick'],
  ['fireStew', '불꽃 열매 스튜', 'cold', 3, 'bowl', ['#ff6a3d', '#ffd25c'], [['fireBerry', 2], ['mushroom', 1]], 'boss:turtle'],
  ['coolTea', '시원 베리차', 'heat', 1, 'cup', ['#ff9ab0', '#bfe6ff'], [['berry', 1], ['gWater', 1]], 'guide:cpick'],
  ['coolPunch', '시원 베리 화채', 'heat', 2, 'bowl', ['#ffb3c6', '#ff7aa2'], [['berry', 3], ['gWater', 1]], 'guide:cpick'],
  ['radishSoup', '서리 무 냉국', 'heat', 3, 'bowl', ['#d8f2ff', '#9fd8f0'], [['radish', 2], ['gWater', 1]], 'boss:spirit'],
  ['fireSkewer', '불꽃 버섯 꼬치', 'atk', 3, 'skewer', ['#ff6a3d', '#b9573f'], [['fireBerry', 1], ['shroomCap', 2]], 'boss:turtle'],
  ['radishSalad', '서리 무 베리 냉채', 'move', 3, 'plate', ['#e8f8ff', '#ff7aa2'], [['radish', 1], ['berry', 2]], 'boss:spirit'],
  ['fireBeans', '불꽃 콩 볶음', 'mine', 3, 'plate', ['#b99bff', '#ff8a3d'], [['cbean', 2], ['fireBerry', 1]], 'boss:turtle'],
  ['fireJelly', '불꽃 열매 젤리', 'regen', 3, 'jelly', ['#ff8a3d', '#ffd25c'], [['fireBerry', 1], ['gel', 3]], 'room:r30'],
  ['frostTea', '서리 꽃잎 냉차', 'hunger', 3, 'cup', ['#bfe6ff', '#f7b8cf'], [['radish', 1], ['anyPetal', 2], ['gWater', 1]], 'boss:spirit'],
  ['firePie', '불꽃 꽃잎 파이', 'xp', 3, 'cake', ['#ff8a3d', '#f7b8cf'], [['fireBerry', 1], ['anyPetal', 2], ['berry', 2]], 'room:r40'],
];
for (const d of DEEP_DISHES) { DISHES.push(d); DISH[d[0]] = { id: d[0], n: d[1], ef: d[2], tier: d[3], shape: d[4], col: d[5], req: d[6], src: d[7] }; const [fd, hl] = DISH_FOOD[d[3]];
  ITEMS[d[0]] = { n: d[1], kind: 'food', food: fd, heal: hl, buff: [d[2], d[3]], d: d[2] === 'cold' || d[2] === 'heat' ? '깊은 동굴에 가기 전에 먹어 두면 든든해요.' : '버프 요리예요. 먹으면 효과가 생겨요.' }; ICON[d[0]] = dishIcon(d[4], d[5]);
  const r = Rc(d[0], 1, d[6], 'pot', 'food'); r.dish = d[0]; RECIPES.push(r);
  ITEMS['rn_' + d[0]] = { n: `레시피 쪽지 · ${d[1]}`, note: d[0], d: '주우면 바로 요리솥 레시피를 알게 돼요.' }; ICON['rn_' + d[0]] = noteIcon;
  const k = d[6].findIndex(([m]) => STAR_OF[m]); if (k >= 0) { const [m, c] = d[6][k], sm = STAR_OF[m], base = ITEMS[d[0]], id = d[0];
    ITEMS[id + 'S'] = { ...base, n: '별 ' + base.n, food: Math.round(base.food * 1.2), star: 1, base: id, d: '별 작물로 만든 특별한 요리. 효과가 1.5배 오래가고 배가 더 불러요.' }; ICON[id + 'S'] = (f => A => { f(A); starMark(A); })(ICON[id]);
    const req = d[6].map(x => x.slice()); if (c > 1) { req[k][1] = c - 1; req.push([sm, 1]); } else req[k] = [sm, 1]; const sr = Rc(id + 'S', 1, req, 'pot', 'food'); sr.dish = id; sr.star = 1; sr.need = () => knows(id) && availCount0(sm) > 0; RECIPES.push(sr); } }
ROOM_NOTES[3].push('fireJelly'); ROOM_NOTES[4].push('firePie');
Object.assign(BOSS_NOTES, { turtle: ['fireStew', 'fireSkewer', 'fireBeans'], spirit: ['radishSoup', 'radishSalad', 'frostTea'] });
{ const g = GUIDE.find(q => q.id === 'cpick'); if (g) g.rw = g.rw.concat(['hotTea', 'hotSoup', 'coolTea', 'coolPunch'].map(id => ['rn_' + id, 1])); }
// ---- cold / heat gauge: only in the lava and ice caves ----
const ENV_TXT = { hot: ['후끈해요', '더워요', '너무 더워요!', '타 버릴 것 같아요!'], cold: ['으슬으슬해요', '추워요', '너무 추워요!', '얼어붙을 것 같아요!'] };
const envLv = k => G && G.env && G.env.k === k ? (G.env.v >= 100 ? 3 : G.env.v >= 70 ? 2 : G.env.v >= 40 ? 1 : 0) : 0;
function bmul(ef) { if (!G || !G.buffs) return 1; let best = null; for (const b of G.buffs) if (b.ef === ef && b.end > G.time && (!best || b.tier > best.tier)) best = b; return best ? EFF[ef].v[best.tier - 1] : 1; }
const inDeepArena = () => { const p = G.p; return Math.hypot(p.x - SL.x - .5, p.y - SL.y - .5) < 9.6 || Math.hypot(p.x - SI.x - .5, p.y - SI.y - .5) < 9.6; };
function envRelief(k) { const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y);
  for (let y = py - 3; y <= py + 3; y++) for (let x = px - 3; x <= px + 3; x++) { if (!inB(x, y) || Math.hypot(x + .5 - p.x, y + .5 - p.y) > 3.5) continue; const i = idx(x, y);
    if (k === 'hot') { if (G.floor[i] === WATER && !G.wall[i]) return true; continue; }
    const o = G.objs.get(i); if (!o) continue; const d = OBJ[o.t]; if (d && d.light && !d.nat && !d.crop && !o.off && o.t !== 'tchest') return true; }
  return false; }
let envFxV = 0, envFxShown = -1;
function envTick(dt) {
  const p = G.p, E = G.env || (G.env = { k: null, v: 0, lv: 0, t: 0 }), b = G.biome[idx(Math.floor(p.x), Math.floor(p.y))], zone = b === 3 ? 'hot' : b === 4 ? 'cold' : null;
  if (zone && E.k !== zone) { E.k = zone; E.v = 0; E.lv = -1; E.t = 0; }
  let rate = -4; if (zone && !envRelief(zone)) rate = (inDeepArena() ? .5 : 1) * bmul(zone === 'hot' ? 'heat' : 'cold') * (G.equip && G.equip.body && ITEMS[G.equip.body.id].guard === zone ? guardMul(lvOf(G.equip.body)) : 1) * (zone === 'cold' ? hatMul() : 1);
  E.v = clamp(E.v + rate * dt, 0, 100); if (!zone && E.v <= 0) E.k = null;
  const lv = !E.k ? 0 : E.v >= 100 ? 3 : E.v >= 70 ? 2 : E.v >= 40 ? 1 : 0;
  if (E.k && started && (lv > E.lv)) { if (lv || E.lv < 0) toast(ENV_TXT[E.k][lv], lv >= 2 ? 'warn' : null, 'env'); } if (E.k) E.lv = lv;
  if (lv === 3 && p.dead <= 0) { E.t += dt; if (E.t >= 5) { E.t = 0; p.hp -= 2; ftext(p.x, p.y - 1.2, '-2', E.k === 'hot' ? '#ff9b4a' : '#9fd8f0'); if (p.hp <= 0) { p.hp = 0; p.dead = 1.8; G.fish = null; $('#fade').textContent = '기절했어요…'; $('#fade').hidden = false; } } } else E.t = 0;
  // the screen edge: fades in and out over a second or two, never stronger than 30% during a boss fight
  let tgt = [0, .15, .30, .375 + Math.sin(performance.now() / 420) * .075][lv]; if (!$('#bossbar').hidden) tgt = Math.min(tgt, .30);
  envFxV += (tgt - envFxV) * Math.min(1, dt / (tgt > envFxV ? 1.2 : 1.6));
}
// v43: every region has its own terrain, mineral and special material (shown on the map once visited)
const REGION_MAT = [['dirt', 'copperOre', 'fiber'], ['stone', 'ironOre', 'shroomCap'], ['granite', 'crystal', 'cryGem'], ['basalt', 'goldOre', 'obsidian'], ['iceBlock', 'frostShard', 'radish']];
function regionMatHTML() { const seen = new Set(); for (let i = 0; i < G.explored.length; i++) if (G.explored[i]) seen.add(G.biome[i]);
  return `<div class="lbl">지역 재료</div><div class="rmat">${REGION_MAT.map((m, b) => `<div><b>${seen.has(b) ? BIOME[b] : '???'}</b>${seen.has(b) ? ['지형', '광물', '고유'].map((t, k) => `<span><img class="px" src="${iconURL(m[k])}" alt="">${t} · ${ITEMS[m[k]].n}</span>`).join('') : '<span>아직 가 보지 않은 곳</span>'}</div>`).join('')}</div>`; }
function eqEffect(sl, s) {
  if (!s) return sl === 'ring' ? '비어 있어요 · 장비제작대에서 만들어요' : '비어 있어요';
  return (s.lv ? `강화 +${s.lv} · ` : '') + upgText(s.id, lvOf(s)); }
// v48: the equipment rows sit at the top of the bag (no separate menu); pets at the bottom
function eqRowHTML() {
  let h = `<div class="lbl">장비 <span style="color:var(--muted);font-size:13px">칸을 누르면 벗어요 · 가방에서 옷·장신구를 고르고 [입기]·[달기]</span></div><div class="eqlist eq2">`;
  for (const [sl, n] of EQ_SLOTS) { const s = G.equip[sl];
    h += `<div class="eqr">${slotHTML(s, 'eqSlot', sl, 'eq' + (s ? '' : ' empty')).replace(/<\/button>$/, s ? '</button>' : `<span>${{ head: '머리', neck: '목' }[sl] || n}</span></button>`)}<div><b>${n}${s ? ' · ' + rarName(s.id) + (s.lv ? ` +${s.lv}` : '') : ''}</b><small>${eqEffect(sl, s)}</small></div></div>`; }
  return h + `</div>`; }
let wearAskT = 0;
function suggestWear(b) { const need = b === 3 ? 'hot' : b === 4 ? 'cold' : null, el = $('#wearAsk'); if (!need || !started) return; const cur = G.equip.body;
  if (cur && ITEMS[cur.id].guard === need) return; const k = G.inv.findIndex(x => x && ITEMS[x.id].kind === 'wear' && ITEMS[x.id].guard === need); if (k < 0) return;
  el.textContent = `${ITEMS[G.inv[k].id].n}${roJosa(ITEMS[G.inv[k].id].n).slice(ITEMS[G.inv[k].id].n.length)} 갈아입을까요?`; el.dataset.id = G.inv[k].id; el.hidden = false; clearTimeout(wearAskT); wearAskT = setTimeout(() => { el.hidden = true; }, 8000); }
function drawEnv() { const E = G.env || {}, bar = $('#envBar'), on = !!E.k; if (bar.hidden === on) bar.hidden = !on;
  if (on) { const k = E.k + '|' + Math.round(E.v); if (bar.dataset.k !== k) { bar.dataset.k = k; bar.className = 'bar env ' + E.k; $('#envFill').style.width = E.v + '%'; $('#envTxt').textContent = Math.round(E.v); const ic = E.k === 'hot' ? 'fireBerry' : 'frostShard'; if ($('#icEnv').dataset.ic !== ic) { $('#icEnv').dataset.ic = ic; $('#icEnv').src = iconURL(ic); } } }
  const fx = $('#envFx'), v = Math.round(envFxV * 200) / 200; if (v !== envFxShown) { envFxShown = v; fx.style.opacity = (v / .45).toFixed(3); } const cls = E.k || (envFxV > .005 ? fx.dataset.k : ''); if (fx.dataset.k !== cls) { fx.dataset.k = cls || ''; fx.className = cls || ''; } }
TIPS.push('용암 동굴과 얼음 동굴에서는 더위·추위 게이지가 올라요. 대비 요리와 옷으로 늦출 수 있어요.', '얼음 동굴에서는 횃불이나 램프 곁, 용암 동굴에서는 물웅덩이 곁에서 게이지가 내려가요.');
