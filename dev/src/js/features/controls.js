// ================= v65 controls: attack / interact buttons, tool pouch, small button, hitting things loose =================
// · The attack button always attacks: the held weapon, else the last weapon used, else the strongest one, else the fist.
//   It aims at the nearest monster by itself (on PC the mouse aims). With no monster near it hits a placed piece in front:
//   three quick hits and the piece falls on the floor as an item (the fist works too, the weapon does not wear).
// · Interact (decide() in game/actions.js) does what fits the thing in front; other things that fit go to the small button.
// · Tools (pickaxe · axe · sickle · shovel · watering can · rod · lasso) live in their own pouch and the tool slot at the
//   front of the hotbar holds one. Interact takes the pickaxe, axe, sickle or shovel out by itself and keeps it in hand.

// ---- tools ----
const TOOL_KINDS = ['pick', 'axe', 'sickle', 'shovel', 'wcan', 'rod', 'lasso'];
const isTool = id => !!ITEMS[id] && TOOL_KINDS.includes(ITEMS[id].kind);
// axes stop being weapons and become the tree-cutting tool (power = how fast they cut, like a pickaxe's power)
const AXE_TOOL = { axeStone: [1.6, 0, '돌로 만든 도끼. 나무를 손이나 곡괭이보다 빨리 베어요.'], axeCopper: [3.2, 1, '단단한 구리 도끼. 큰 나무도 금방 베어요.'], axeIron: [4.8, 2, '날이 선 철 도끼. 어떤 나무든 몇 번이면 베어요.'] };
for (const id in AXE_TOOL) { const it = ITEMS[id]; if (!it) continue; it.kind = 'axe'; [it.power, it.tier, it.d] = AXE_TOOL[id]; delete it.dmg; delete it.wt; }
for (const r of RECIPES) if (AXE_TOOL[r.out]) r.cat = 'tool';
const toolPow = s => ((ITEMS[s.id] && ITEMS[s.id].power) || 1) * (1 + UPG_POW * lvOf(s));
const heldTool = () => (G && G.sel < 0 && G.tools && G.tools[G.tsel]) || null;
// the tool of a kind to use: the one in hand if it is that kind, else the best working one (pouch first, then the bag)
// (a tool the player chose on purpose — from the tool row, the pouch or the hotbar — is used even if a better one exists; one interact took out by itself is not)
function bestTool(kind) { if (!G) return null; const h = selItem(); if (h && ITEMS[h.id] && ITEMS[h.id].kind === kind && !isBroken(h) && (G.sel >= 0 || G.tHand)) return h;
  let b = null; for (const s of (G.tools || []).concat(G.inv)) { if (!s || !ITEMS[s.id] || ITEMS[s.id].kind !== kind || isBroken(s)) continue; if (!b || toolPow(s) > toolPow(b)) b = s; } return b; }
function holdTool(s, chosen) { if (!s || !G.tools) return; G.tHand = !!chosen; let k = G.tools.indexOf(s);
  if (k < 0) { const j = G.inv.indexOf(s); if (j < 0) return; G.inv[j] = null; G.tools.push(s); k = G.tools.length - 1; } // a tool still in the bag moves into the pouch
  G.tsel = k; G.sel = -1; invDirty = true; }
function fixTsel(h) { if (!G.tools.length) { G.tsel = 0; if (G.sel < 0) G.sel = 0; return; } const k = h ? G.tools.indexOf(h) : -1; if (k >= 0) G.tsel = k; else { G.tsel = Math.min(G.tsel || 0, G.tools.length - 1); const kd = h && ITEMS[h.id].kind, nx = kd && bestTool(kd); if (nx && G.tools.includes(nx)) G.tsel = G.tools.indexOf(nx); } }
// tools that ended up in the bag (from a chest, an old save …) go to the pouch
function sweepTools() { if (!G || !G.tools) return; const h = heldTool(); for (let i = 0; i < G.inv.length; i++) { const s = G.inv[i]; if (s && isTool(s.id)) { if (i === G.sel) { G.inv[i] = null; G.tools.push(s); G.tsel = G.tools.length - 1; G.sel = -1; } else { G.inv[i] = null; G.tools.push(s); } invDirty = true; } } if (h && G.sel < 0) fixTsel(h); }
// the bag and the pouch together for repair · salvage · upgrade lists ('t:3' = pouch slot 3)
const slotList = () => G.inv.map((s, i) => ({ s, i })).concat((G.tools || []).map((s, k) => ({ s, i: 't:' + k })));
const itemAt = i => typeof i === 'string' ? (i.startsWith('e:') ? G.equip[i.slice(2)] : i.startsWith('t:') ? (G.tools || [])[+i.slice(2)] : null) : G.inv[i];
function clearSlot(i) { if (typeof i === 'string' && i.startsWith('t:')) { const h = heldTool(), k = +i.slice(2), gone = G.tools[k]; G.tools.splice(k, 1); if (h && h === gone) { G.tsel = 0; if (!G.tools.length && G.sel < 0) G.sel = 0; } else fixTsel(h); } else G.inv[i] = null; invDirty = true; }
// one of each kind for the tool row: the best working one, broken ones hidden
function toolRowList() { const by = {}; for (const s of G.tools || []) { if (isBroken(s)) continue; const k = ITEMS[s.id].kind; if (!by[k] || toolPow(s) > toolPow(by[k])) by[k] = s; } return TOOL_KINDS.map(k => by[k]).filter(Boolean); }

// ---- the small button: the other things that fit ----
let altI = 0, altKey = '';
function curAlt() { const L = (G && G.alts) || []; if (!L.length) return null; const a = G.act || {}, key = a.k + '|' + (a.t ? a.t.x + ',' + a.t.y : '') + '|' + L.map(x => x.k + x.lbl).join(',');
  if (key !== altKey) { altKey = key; altI = 0; } return L[altI % L.length]; }
function doAlt() { const a = curAlt(); if (!a || actCd > 0) return; if (a.k === 'rot') { rotatePlace(); return; } perform(a); }
function cycleAlt() { const L = (G && G.alts) || []; if (L.length < 2) return; curAlt(); altI = (altI + 1) % L.length; SFX.click(); }

// ---- the attack button ----
let atkBtnHeld = false, atkQ = 0, atkT = 0;
const atkDown = () => atkBtnHeld || mouse.down || keys.has('KeyJ');
function attackTick(dt) { const p = G.p; atkT -= dt; atkQ = Math.max(0, atkQ - dt); if (p.dead > 0 || p.sleep) { atkQ = 0; return; } if ((atkQ > 0 || atkDown()) && atkT <= 0) { atkQ = 0; doAttack(); } }
function doAttack() {
  const p = G.p; if (p.dead > 0 || p.sleep) return; if (p.sit) standUp(); G.fish = null;
  const w = curWeapon(), WT = wtOf(w); if (w.id !== 'hand') G.lastW = w.id;
  let en = nearestEnemy(WT.ranged ? wRange(WT) : Math.max(WT.reach + .9, 2));
  if (en && WT.ranged && !los(Math.floor(p.x), Math.floor(p.y), Math.floor(en.x), Math.floor(en.y))) en = null;
  if (en && !aimMouse()) faceTo(en.x - p.x, en.y - p.y); // the nearest monster first
  if (!en && !nearestEnemy(4)) { const tg = recoverTarget(); if (tg) { hitRecover(tg, w); atkT = .32; return; } }
  atkT = swingAttack() === false ? .3 : atkCd();
}
// ---- hit a placed piece three times and it falls on the floor ----
const RECOVER_HITS = 3, RECOVER_GAP = 2; // hits · seconds (game time) the hits may be apart
const HITS = new Map();
function recoverTarget() { const t = targetTile(); if (!inB(t.x, t.y)) return null; let i = idx(t.x, t.y); const w = G.wall[i];
  if (w === 6 || w === 7) return { t, i, wall: w }; // the wood and brick walls players build (natural walls only by pickaxe)
  let o = G.objs.get(i); if (o && o.t === '_part') { const ai = anchorAt(i); if (ai < 0) return null; i = ai; o = G.objs.get(ai); }
  const d = o && OBJ[o.t]; if (!d || !d.item || d.nat || d.crop || d.lost || d.tree || d.shrine || d.tchest || d.ranch || d.bush || d.growTo) return null;
  return { t: { x: i % W, y: (i / W) | 0 }, i, o, full: !!(d.chest && o.items && o.items.some(x => x)) }; }
function hitRecover(tg, w) { const p = G.p, t = tg.t; faceTo(t.x + .5 - p.x, t.y + .5 - p.y);
  G.swing = { t: .22, max: .22, ang: Math.atan2(p.face.y, p.face.x), icon: w.id === 'hand' ? null : w.id, wt: w.wt, arc: 1.2, rad: .95 }; SFX.swing();
  if (tg.full) { SFX.clink(); toast('물건이 든 상자는 비워야 떨어져요', null, 'fullchest'); return; }
  const h = HITS.get(tg.i), n = h && G.time - h.t < RECOVER_GAP ? h.n + 1 : 1; HITS.set(tg.i, { n, t: G.time, x: t.x, y: t.y });
  SFX.mine(); puff(t.x + .5, t.y + .7, '#e8d8c0', 4, 1.6); if (tg.o) tg.o.shake = .15; shake = Math.max(shake, .04);
  if (n >= RECOVER_HITS) { HITS.delete(tg.i); if (tg.wall) breakWall(t.x, t.y); else dropObj(t, tg.o); } }
function dropObj(t, o) { const i = idx(t.x, t.y), d = OBJ[o.t], fp = d.sz ? fpOf(o) : [1, 1], x = t.x + fp[0] / 2, y = t.y + fp[1] / 2 + .3;
  delObj(i); if (d.bed && G.spawnPt && G.spawnPt.x === t.x && G.spawnPt.y === t.y) G.spawnPt = null;
  if (o.job) cancelJob(o, x, y); if (o.store) for (const s2 of o.store) spawnDrop(s2.id, s2.c, x, y);
  const it = TIER_IT[o.t] && o.lv ? TIER_IT[o.t][o.lv] : d.item; spawnDrop(it, 1, x, y);
  if (DUR[d.item]) G.drops[G.drops.length - 1].dur = Math.round(o.e != null ? o.e : DUR[d.item][0]);
  SFX.brk(); puff(x, y, '#e8d8c0', 10, 2.4); lightDirty = true; mapPixel(t.x, t.y); invDirty = true; }
function drawHitBars(T, camX, camY) { for (const [i, h] of HITS) { if (G.time - h.t >= RECOVER_GAP) { HITS.delete(i); continue; }
  const X = Math.round(h.x * T - camX + T * .15), Y = Math.round(h.y * T - camY - T * .35), w = Math.round(T * .7), f = 1 - h.n / RECOVER_HITS;
  ctx.fillStyle = 'rgba(20,14,30,.85)'; ctx.fillRect(X - 1, Y - 1, w + 2, Math.max(3, Math.round(T / 8)) + 2); ctx.fillStyle = '#ffc861'; ctx.fillRect(X, Y, Math.round(w * f), Math.max(3, Math.round(T / 8))); } }

// ---- the tool slot (front of the hotbar) and its row ----
let toolRowOpen = false;
function toolSlotHTML() { const s = heldTool() || toolRowList()[0] || null, on = G.sel < 0;
  return `<button type="button" class="slot tslot ${on ? 'sel' : ''} ${s && isBroken(s) ? 'broken' : ''}" data-tool="1" aria-label="도구 칸${s ? ' · ' + ITEMS[s.id].n : ''}">${s ? `<img class="px" src="${iconURL(s.id)}" alt="">${s.lv ? `<span class="lvb">+${s.lv}</span>` : ''}${durBar(s)}` : '<span class="tnone">도구</span>'}<span class="tup">▲</span></button>`; }
function toggleToolRow(force) { toolRowOpen = force != null ? force : !toolRowOpen; renderToolRow(); }
function renderToolRow() { let el = $('#toolRow'); if (!el) { el = document.createElement('div'); el.id = 'toolRow'; $('#game').appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-tk]'); if (!b) return; ensureAudio(); const s = G.tools[+b.dataset.tk]; if (s) { holdTool(s, true); SFX.click(); } toggleToolRow(false); }); }
  const L = toolRowList(); el.hidden = !toolRowOpen || !G;
  if (!toolRowOpen || !G) return; if (!L.length) { el.innerHTML = '<span class="tnone">도구가 없어요 · 작업대·장비제작대에서 만들어요</span>'; return; }
  el.innerHTML = L.map(s => slotHTML(s, 'tk', G.tools.indexOf(s), s === heldTool() ? 'sel' : '').replace('data-a="tk" data-i=', 'data-tk=')).join(''); }
function toolSlotClick() { ensureAudio(); if (!G.tools.length) { toast('도구가 없어요 · 작업대·장비제작대에서 만들어요', null, 'notool'); return; }
  if (G.sel >= 0) { const s = heldTool() || G.tools[G.tsel] || toolRowList()[0]; if (s) holdTool(s, true); } toggleToolRow(); }

// ---- buttons on screen ----
function updateCtrlHud() { const a = G.act || {};
  const w = curWeapon(), ab = $('#atkBtn'); if (ab && ab.dataset.w !== w.id) { ab.dataset.w = w.id; $('#atkIcon').src = iconURL(w.id === 'hand' ? 'hand' : w.id); $('#atkLbl').textContent = w.id === 'hand' ? '주먹' : '공격'; }
  const ib = $('#actBtn'); if (ib) ib.classList.toggle('dim', a.k === 'info' || a.k === 'none');
  const alt = curAlt(), sb = $('#subBtn'); if (sb) { if (sb.hidden === !!alt) sb.hidden = !alt; const key = alt ? alt.lbl + '|' + alt.icon : ''; if (alt && sb.dataset.k !== key) { sb.dataset.k = key; $('#subIcon').src = iconURL(alt.k === 'rot' ? 'rotate' : alt.icon || 'hand'); $('#subLbl').textContent = alt.lbl; sb.setAttribute('aria-label', alt.lbl); } }
  const nx = $('#altNext'); if (nx) { const v = !!alt && G.alts.length > 1; if (nx.hidden === v) nx.hidden = !v; } }
// an arrow icon for the 「방향」 option
ICON.rotate = A => { for (let k = 0; k <= 20; k++) { const a = -0.4 + k / 20 * 4.6; A.r(8 + Math.cos(a) * 5 - .5, 8 + Math.sin(a) * 5 - .5, 2, 2, '#7fe0b5'); } A.poly([[10.5, 1], [15, 3.5], [10.5, 6.5]], '#7fe0b5'); };

// ---- the tool pouch in the bag window ----
function pouchHTML() { const T = G.tools || []; let h = `<div class="lbl">도구 주머니 · ${T.length}개 <span style="color:var(--muted)">(가방 칸을 차지하지 않아요 · 단축칸 맨 앞 도구 칸에서 골라 들어요)</span></div><div class="grid">`;
  T.forEach((s, k) => { h += slotHTML(s, 'pouch', k, (UIS.toolSel === k ? 'pick' : '') + (s === heldTool() ? ' sel' : '')); });
  if (!T.length) h += `<p class="prose" style="grid-column:1/-1;color:var(--muted);font-size:14px">아직 도구가 없어요</p>`;
  h += `</div>`; const s = UIS.toolSel != null ? T[UIS.toolSel] : null;
  if (s) { const it = ITEMS[s.id], st = itemStat(it, s); h += `<div class="detail"><img class="px" src="${iconURL(s.id)}" alt=""><div><h3>${rarName(s.id)}${s.lv ? ` +${s.lv}` : ''}</h3><p>${it.d || ''}</p>${st ? `<div class="st">${st}</div>` : ''}</div><div class="btns">${isBroken(s) ? '' : `<button class="btn" data-a="holdTool" type="button">${s === heldTool() ? '들고 있어요' : '들기'}</button>`}<button class="btn ${UIS.trash ? 'warn' : 'ghost'}" data-a="trashTool" type="button">${UIS.trash ? '정말 버릴까요?' : '버리기'}</button></div></div>`; }
  return h; }
