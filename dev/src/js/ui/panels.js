// ================= UI =================
const UIS = { invSel: null, tab: 'all', trash: false, confirmNew: false, mapAll: false, qty: {}, craftOrder: null };
let panel = null, panelAt = 0;
function durBar(s) { if (s && s.id === 'wcan') return `<span class="dur"><i style="width:${Math.max(4, Math.round((s.w || 0) / WCAN_MAX * 100))}%;background:${s.w ? '#6fb8ff' : '#ff6b7a'}"></i></span>`; if (!s || !DUR[s.id]) return ''; const mx = DUR[s.id][0], d = durOf(s); if (d >= mx) return ''; const f = d / mx, col = f > .5 ? '#7fe0b5' : f > .2 ? '#ffc861' : '#ff6b7a'; return `<span class="dur"><i style="width:${Math.max(4, Math.round(f * 100))}%;background:${col}"></i></span>`; }
function slotHTML(s, a, i, cls = '') { const br = isBroken(s), rr = s ? rarOf(s.id) : -1; return `<button type="button" class="slot ${cls} ${br ? 'broken' : ''} ${rr >= 1 ? 'r' + rr : ''}" data-a="${a}" data-i="${i}" aria-label="${s ? ITEMS[s.id].n + (br ? ' (망가짐)' : '') + ' ' + s.c + '개' : '빈 칸'}">${s ? `<img class="px" src="${iconURL(s.id)}" alt=""><span class="cnt">${s.c > 1 ? s.c : ''}</span>${s.lv ? `<span class="lvb">+${s.lv}</span>` : ''}${durBar(s)}${br ? '<span class="brk">!</span>' : ''}` : ''}</button>`; }
function refreshHotbar() {
  const hb = $('#hbSlots'); let h = '';
  for (let i = 0; i < HOT; i++) { const s = G.inv[i]; h += slotHTML(s, 'hot', i, i === G.sel ? 'sel' : '').replace('</button>', `<span class="key">${document.body.classList.contains('touch') ? '' : i + 1}</span></button>`); }
  hb.innerHTML = h; invDirty = false; if (panel) renderPanel();
  if (hbSel !== G.sel) { hbSel = G.sel; const el = hb.children[G.sel]; if (el && hb.scrollWidth > hb.clientWidth) { const l = el.offsetLeft - hb.offsetLeft, r = l + el.offsetWidth; if (l < hb.scrollLeft) hb.scrollLeft = l - 4; else if (r > hb.scrollLeft + hb.clientWidth) hb.scrollLeft = r - hb.clientWidth + 4; } }
  const full = G.inv.slice(HOT).every(Boolean); $('#bInv').classList.toggle('dot', full);
}
let lastHud = '', lastAct = '', hbSel = -1;
function updateHud() {
  const p = G.p; const k = Math.round(p.hp) + '|' + Math.round(p.hunger) + '|' + maxHp();
  drawBuffs(); drawEnv();
  if (k !== lastHud) { lastHud = k; $('#hpFill').style.width = (p.hp / maxHp() * 100) + '%'; $('#hpTxt').textContent = Math.round(p.hp); $('#huFill').style.width = p.hunger + '%'; $('#huTxt').textContent = Math.round(p.hunger); }
  const a = G.act || { lbl: '', icon: 'dots' }; const ak = a.lbl + a.icon;
  { const rb = $('#rotBtn'), rv = rotTarget(); if (rb && rb.hidden === rv) rb.hidden = !rv; }
  const sb = $('#subBtn'), sv = !!(a.sub); if (sb.hidden === sv) sb.hidden = !sv; if (sv) { const sk = subLabel(a); if (sb.dataset.k !== sk) { sb.dataset.k = sk; $('#subIcon').src = iconURL(sk === '걷기' ? 'shovel' : 'hand'); $('#subLbl').textContent = sk; sb.setAttribute('aria-label', sk); } }
  if (ak !== lastAct) { lastAct = ak; $('#actLbl').textContent = a.lbl; $('#actIcon').src = iconURL(a.icon); }
  const R = G.rpg, mk2 = Math.round(p.mp) + '|' + maxMp() + '|' + R.lv + '|' + R.xp + '|' + (R.pts > 0 || R.sp > 0);
  if (mk2 !== lastMp) { lastMp = mk2; $('#mpFill').style.width = (p.mp / maxMp() * 100) + '%'; $('#mpTxt').textContent = Math.round(p.mp); $('#lvTxt').textContent = 'Lv.' + R.lv; $('#xpFill').style.width = (R.lv >= MAX_LV ? 100 : R.xp / XP_NEED(R.lv) * 100) + '%'; $('#bStat').classList.toggle('dot', R.pts > 0 || R.sp > 0); }
  updateSkBar();
  if (G.time - (G.__qt || 0) > .5 || G.__qt == null) { G.__qt = G.time; $('#goal').classList.toggle('dot', canClaim()); }
  if (invDirty) refreshHotbar();
}
let lastMp = '';
function updateSkBar() {
  const R = G.rpg, bar = $('#skBar'), any = Object.keys(R.sk).some(k => SKILLS[k].act && R.sk[k]);
  if (bar.hidden === any) bar.hidden = !any; if (!any) return;
  const st = R.slot.map(k => { if (!k) return null; const S = SKILLS[k], l = R.sk[k], cd = Math.max(0, G.skcd[k] || 0); return { k, f: cd > 0 ? Math.ceil(cd / S.cd(l) * 24) / 24 : 0, nomp: (G.p.mp || 0) < S.mp(l) }; });
  const key = JSON.stringify(st); if (key === bar.dataset.k) return; bar.dataset.k = key;
  bar.querySelectorAll('.skb').forEach((b, n) => { const x = st[n]; b.classList.toggle('empty', !x); b.classList.toggle('nomp', !!(x && x.nomp)); const img = b.querySelector('img'), src = iconURL(x ? 'sk_' + x.k : 'star'); if (img.dataset.src !== src) { img.src = src; img.dataset.src = src; }
    b.querySelector('.cd').style.background = x && x.f > 0 ? `conic-gradient(rgba(14,10,22,.72) ${Math.round(x.f * 360)}deg, transparent 0)` : ''; b.setAttribute('aria-label', x ? SKILLS[x.k].n : '빈 스킬 칸'); });
}
function openPanel(kind, data = {}) { if (kind === 'equip') kind = 'inv'; if (kind === 'craft' && data.st === 'forge') data = { ...data, st: 'bench', tier: 1 }; /* v60 */ /* v48: the equipment lives in the bag again */ if (kind === 'inv' && G) setTimeout(() => { if (G) G.newIds = {}; }, 50); if (importFrom === 'menu') pendingImp = null; $('#sheet').dataset.key = ''; UIS.craftOrder = null; UIS.qty = {}; UIS.salvAsk = null; UIS.statAsk = false; UIS.skAsk = false; if (kind === 'look') { UIS.look = cleanLook(G.look); UIS.lookTab = UIS.lookTab || 'hair'; } panel = { kind, ...data }; panelAt = performance.now(); UIS.invSel = null; UIS.trash = false; UIS.confirmNew = false; UIS.confirmEsc = false; if (kind === 'craft') { UIS.tab = 'all'; UIS.tab2 = 'all'; } /* 'here' was never a tab: the first re-render changed the panel key and jumped the list back to the top */ $('#sheetWrap').hidden = false; paused = true; btnHeld = false; actQ = 0; mouse.down = false; keys.clear(); joyEnd(); renderPanel(); }
function closePanel() { panel = null; $('#sheetWrap').hidden = true; paused = !started; keys.clear(); btnHeld = false; mouse.down = false; actQ = 0; refocusGame(); }
// hand keyboard focus back to the game (a focused button/field inside a closed panel, or focus that slipped out of the page frame, would swallow WASD)
function refocusGame() { const ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); try { window.focus(); } catch (_) { } }
function head(title, icon, extra = '') { return `<div class="sh-head"><h2>${icon ? `<img class="px" src="${iconURL(icon)}" alt="">` : ''}${title}</h2><div style="display:flex;gap:8px;align-items:center">${extra}<button class="xbtn" data-a="close" type="button" aria-label="닫기">✕</button></div></div>`; }
function itemStat(it, s) { const up = s && lvOf(s) && upgOk(s.id) ? `<br>강화 +${s.lv} · ${upgText(s.id, s.lv)}` : ''; return itemStat1(it, s) + up + (s && it.kind === 'sword' && wtOf(it).ranged === 'arrow' ? arrowInfo() : ''); }
const arrowInfo = () => { const k = bestArrow(); return k >= 0 ? `<br>화살: ${ITEMS[G.inv[k].id].n} ${countItem(G.inv[k].id)}개 · 좋은 화살부터 써요` : '<br>화살: 나무 화살 · 광물 화살을 만들어 가방에 넣으면 더 세져요'; };
function itemStat1(it, s) { if (s && s.id === 'wcan') return `물 ${s.w || 0}/${WCAN_MAX}`; const du = s && DUR[s.id] ? ` · 내구도 ${durOf(s)}/${DUR[s.id][0]}${isBroken(s) ? ' (망가짐)' : ''}` : ''; return itemStat0(it) + (itemStat0(it) ? du : du.slice(3)); }
function itemStat0(it) { if (it.kind === 'wear') return EQ_N[it.slot] + ' 칸'; if (it.kind === 'arrow') { const a = it.arw; return `화살 · 활 공격력 ×${a.mul}${a.pierce ? ' · 적 하나를 꿰뚫어요' : ''}${a.fx ? `<br>✦ ${FXN[a.fx]}` : ''}`; } if (it.kind === 'food') return `포만감 +${it.food}${it.heal ? ` · 체력 +${it.heal}` : ''}${it.buff ? `<br>✦ ${buffText(it)}` : ''}`; if (it.kind === 'sword') { const W = wtOf(it); return `${W.n} · 공격력 ${it.dmg}${W.ranged ? ' · 원거리' : ''}${W.mp ? ` · 한 발에 기력 ${W.mp}` : ''}${W.chop ? ` · 나무 베기 ×${W.chop}` : ''}${it.fx ? `<br>✦ ${FXN[it.fx]}` : ''}`; } if (it.kind === 'pick') return `캐는 힘 ${it.power} · ${['흙벽', '돌벽', '화강암 벽·석영 광맥', '현무암·얼음벽'][it.tier]}까지`; return ''; }
// v62: the workbench window — 1st row 전체/재료/도구/제작대/가구/건축/편의 (icons), 2nd row per tab. Hand recipes can be made at the workbench too
const atHere = (r, st) => (r.at || null) === (st || null) || (st === 'bench' && !r.at);
const BT1 = [['all', '전체', 'hammer'], ['mat', '재료', 'rope'], ['tool', '도구', 'bagUp1'], ['stn', '제작대', 'bench'], ['furn', '가구', 'chair'], ['build', '건축', 'wallBrick'], ['conv', '편의', 'lever']];
const BT2 = { stn: [['all', '전체'], ['make', '제작'], ['smelt', '제련'], ['cook', '요리']],
  furn: [['all', '전체'], ['seat', '의자'], ['table', '탁자'], ['bed', '침대'], ['store', '수납'], ['light', '조명'], ['deco', '장식']],
  build: [['all', '전체'], ['wall', '벽'], ['floor', '바닥'], ['fence', '울타리'], ['pillar', '기둥'], ['door', '문'], ['win', '창문'], ['nature', '자연']],
  conv: [['all', '전체'], ['circuit', '회로'], ['farm', '농사'], ['mine', '채굴장']] };
const FURN2 = { seat: 'chair sofa2 logBench stoneBench cushion ironChair cryChair mossSofa stumpStool shroomStool', table: 'table longTable kitchenSet cryTable shroomTable', bed: 'bed bedDouble mossBed', store: 'chest shelf bookcase2 woodCrate strawBasket shroomWardrobe', light: 'torch lampShroom lampCrystal copperLamp stoneLantern sproutLamp sporeLamp' };
const FURN2_OF = {}; for (const k in FURN2) for (const id of FURN2[k].split(' ')) FURN2_OF[id] = k;
function bcat(r) { if (r._bc) return r._bc; const id = r.out, it = ITEMS[id] || {}, o = OBJ[it.obj] || {}, c = r.cat; let t;
  if (o.station) t = ['stn', o.station === 'furnace' ? 'smelt' : o.station === 'pot' ? 'cook' : 'make'];
  else if (c === 'mat') t = ['mat'];
  else if (c === 'tool') t = ['tool'];
  else if (id === 'treeFarm') t = ['conv', 'mine'];
  else if (c === 'circuit' || c === 'farm' || c === 'mine') t = ['conv', c];
  else if (c === 'nature') t = ['build', 'nature'];
  else if (it.kind === 'floor' || it.kind === 'ground') t = ['build', 'floor'];
  else if (c === 'build' && !FURN2_OF[id]) t = ['build', /Fence/.test(id) ? 'fence' : /Pillar/.test(id) ? 'pillar' : /Door/.test(id) ? 'door' : /Frame|Win/.test(id) ? 'win' : 'wall'];
  else t = ['furn', FURN2_OF[id] || 'deco'];
  return (r._bc = t); }
function renderPanel() {
  const sh = $('#sheet'); if (!panel) return; const k = panel.kind; let h = '';
  const key = k + '|' + (k === 'craft' ? UIS.tab + '|' + (UIS.tab2 || 'all') + '|' + (panel.st || '') : ''), same = sh.dataset.key === key, sameKind = (sh.dataset.key || '').split('|')[0] === k;
  const ob = sh.querySelector('.sh-body'), oTop = ob ? ob.scrollTop : 0, ot = sh.querySelector('.tabs'), oLeft = ot ? ot.scrollLeft : 0;
  if (k === 'inv') {
    h += head('가방', 'bag', `<button type="button" class="btn ghost" data-a="sortBag" style="min-height:46px;padding:0 14px;font-size:15px">정렬</button>`);
    h += `<div class="sh-body"><p class="hint">칸을 끌거나, 누른 뒤 다른 칸을 누르면 자리가 바뀌어요. 단축칸에서 고른 물건을 손에 들어요: 무기·도구·가구는 그 일만 하고, 빈손(또는 재료)이면 앞에 있는 것에 맞춰 열기·줍기·캐기를 해요.</p><div class="lbl">단축칸</div><div class="grid">`;
    const tab = UIS.bagTab || 'all', cls = i => { const s0 = G.inv[i]; let c = UIS.invSel === i ? 'pick' : ''; if (s0 && tab !== 'all' && bagCat(s0.id) !== tab) c += ' dim'; if (s0 && G.newIds && G.newIds[s0.id] && i >= HOT) c += ' new'; return c; };
    h = h.replace(`<div class="lbl">단축칸</div>`, eqRowHTML() + `<div class="invtools"><div class="tabs">${BAG_TABS.map(([id, n]) => `<button type="button" class="tab ${tab === id ? 'on' : ''}" data-a="bagTab" data-i="${id}">${n}</button>`).join('')}</div></div><div class="lbl">단축칸</div>`);
    for (let i = 0; i < G.inv.length; i++) { if (i === HOT) h += `</div><div class="lbl">가방 · ${G.inv.length - HOT}칸${(G.bagLv || 0) < BAG_MAX_LV ? ' <span style="color:var(--muted)">(작업대 → 도구에서 가방을 늘릴 수 있어요)</span>' : ''}</div><div class="grid">`; h += slotHTML(G.inv[i], 'inv', i, cls(i)); }
    h += `</div>`;
    const s = UIS.invSel != null ? G.inv[UIS.invSel] : null;
    if (s) { const it = ITEMS[s.id]; const st = itemStat(it, s);
      h += `<div class="detail"><img class="px" src="${iconURL(s.id)}" alt=""><div><h3>${rarName(s.id)}${s.lv ? ` +${s.lv}` : ''} <span style="color:var(--muted);font-size:15px">× ${s.c}</span></h3><p>${it.d || FURN_D}</p>${rarOf(s.id) >= 0 && (it.kind === 'sword' || it.kind === 'pick' || rarOf(s.id) >= 1) ? `<div class="st" style="color:${RARITY[Math.max(0, rarOf(s.id))][1]}">★ ${RARITY[Math.max(0, rarOf(s.id))][0]} 등급</div>` : ''}${st ? `<div class="st">${st}</div>` : ''}${it.set ? `<div class="st">${SETN[it.set]}</div>` : ''}</div><div class="btns">`;
      if (it.kind === 'food') h += `<button class="btn" data-a="eat" type="button">먹기</button>`;
      if (it.kind === 'wear') h += `<button class="btn" data-a="wearOn" type="button">${it.slot === 'body' ? '입기' : '달기'}</button>`;
      if (UIS.invSel >= HOT) h += `<button class="btn ghost" data-a="tohot" type="button">단축칸으로</button>`;
      h += `<button class="btn ${UIS.trash ? 'warn' : 'ghost'}" data-a="trash" type="button">${UIS.trash ? '정말 버릴까요?' : '버리기'}</button></div></div>`; }
    h += petHTML() + `</div>`;
  } else if (k === 'catch') { h += catchHTML();
  } else if (k === 'craft') {
    const near = nearStations(); const st = panel.st; POOL = null; POOL = linkedChests(); const nCh = POOL.length;
    const ctier = craftTier(), bo = TIERED[st] && panel.i != null ? G.objs.get(panel.i) : null, inTier = r => !TIERED[r.at] || (r.tier || 0) <= ctier;
    h += head(TIERED[st] ? TIERED[st][ctier] : st ? STN[st] : '제작', st ? null : 'hammer', st ? `<button class="btn ghost" data-a="retrieve" type="button" style="min-height:46px;padding:0 12px;font-size:15px">회수</button>` : '');
    if (bo) h += benchUpHTML(bo); // v60: upgrade the workbench at the top of its window
    const hereR = RECIPES.filter(r => atHere(r, st) && recipeOn(r) && inTier(r)), benchy = st === 'bench' || st === 'forge', smel = st === 'smelter';
    const tabs = [['all', '전체'], ['tool', '도구'], ['weapon', '무기'], ['furn', '기본 가구'], ['nature', '자연'], ['farm', '농사'], ['moss', '이끼 세트'], ['shroom', '버섯 세트'], ['crystal', '수정 세트'], ['build', '건축'], ['food', '음식'], ['mat', '재료'], ['circuit', '회로'], ['mine', '채굴장'], ['upg', '강화'], ['ring', '반지'], ['fix', '수리'], ['salv', '분해'], ['book', '요리 도감']].filter(([id]) => id === 'all' || (id === 'book' ? st === 'pot' : id === 'upg' ? smel : id === 'fix' ? smel : id === 'salv' ? smel : hereR.some(r => r.cat === id)));
    if (smel) { // v61: two rows of tabs
      const T1 = [['all', '제작'], ['fix', '수리'], ['salv', '분해'], ['upg', '강화']], T2 = [['all', '전체'], ['weapon', '무기'], ['armor', '방어구'], ['acc', '장신구'], ['tool', '도구']].filter(([id]) => id === 'all' || hereR.some(r => r.cat === id));
      if (![...T1, ...T2].some(([id]) => id === UIS.tab)) UIS.tab = 'all'; const make = !['fix', 'salv', 'upg'].includes(UIS.tab);
      h += `<div class="tabs">${T1.map(([id, n]) => `<button type="button" class="tab ${(id === 'all' ? make : UIS.tab === id) ? 'on' : ''}" data-a="tab" data-i="${id}">${n}</button>`).join('')}</div>`;
      if (make) h += `<div class="tabs t2">${T2.map(([id, n]) => `<button type="button" class="tab ${UIS.tab === id ? 'on' : ''}" data-a="tab" data-i="${id}">${n}</button>`).join('')}</div>`;
    } else if (st === 'bench') { // v62: icon tabs (the chosen one shows its name) and a second row
      const T1 = BT1.filter(([id]) => id === 'all' || hereR.some(r => bcat(r)[0] === id));
      if (!T1.some(([id]) => id === UIS.tab)) UIS.tab = 'all';
      const T2 = (BT2[UIS.tab] || []).filter(([id]) => id === 'all' || hereR.some(r => bcat(r)[0] === UIS.tab && bcat(r)[1] === id));
      if (!T2.some(([id]) => id === UIS.tab2)) UIS.tab2 = 'all';
      h += `<div class="tabs itabs">${T1.map(([id, n, ic]) => `<button type="button" class="tab ${UIS.tab === id ? 'on' : ''}" data-a="tab" data-i="${id}" aria-label="${n}" title="${n}"><img class="px" src="${iconURL(ic)}" alt="">${UIS.tab === id ? `<span>${n}</span>` : ''}</button>`).join('')}</div>`;
      if (T2.length > 2) h += `<div class="tabs t2">${T2.map(([id, n]) => `<button type="button" class="tab ${UIS.tab2 === id ? 'on' : ''}" data-a="tab2" data-i="${id}">${n}</button>`).join('')}</div>`;
    } else {
    if (!tabs.some(([id]) => id === UIS.tab)) UIS.tab = 'all';
    h += `<div class="tabs">${tabs.map(([id, n]) => `<button type="button" class="tab ${UIS.tab === id ? 'on' : ''}" data-a="tab" data-i="${id}">${n}</button>`).join('')}</div>`; }
    h += `<div class="stations"><span class="chip on">${TIERED[st] ? TIERED[st][ctier] + '에서 만들기' : st ? STN[st] + '에서 만들기' : '손 제작'}</span>${nCh ? `<span class="chip on">연결된 상자 ${nCh}개</span>` : ''}</div>${st ? '' : `<p class="hint">여기선 손으로 만들 수 있는 것만 보여요. 작업대·용광로·요리솥·장비제작대를 바라보고 [열기]를 누르면 그곳에서 만드는 것들이 나와요.</p>`}${nCh ? `<p class="hint">작업대·용광로 같은 제작 장소에 붙은 상자(이어 붙인 상자 포함) ${nCh}개의 재료도 함께 써요. 가방에 있는 것부터 써요.</p>` : ''}`;
    if (UIS.tab === 'upg') { h += upgListHTML(near.has('smelter')); } else
    if (UIS.tab === 'salv') {
      const nb = smel && canSalv(near), list = G.inv.map((s, i) => ({ s, i })).filter(({ s }) => s && (DUR[s.id] || (smel && upgOk(s.id))));
      h += `<div class="sh-body"><p class="hint">${nb ? '장비를 분해하면 만들 때 든 재료의 70%와 강화에 쓴 재료의 절반을 돌려받아요. 분해한 장비는 사라져요.' : '장비제작대 근처에서 분해할 수 있어요.'}</p><div class="list">`;
      if (!list.length) h += `<p class="prose" style="color:var(--muted);text-align:center;margin-top:18px">분해할 장비가 없어요</p>`;
      for (const { s, i } of list) { const got = salvGet2(s), ok = nb && !!got, mx = DUR[s.id] ? DUR[s.id][0] : 0, ask = UIS.salvAsk === i;
        h += `<div class="rc ${ok ? 'ok' : 'no'}"><div class="ri"><img class="px" src="${iconURL(s.id)}" alt=""></div><div class="rn">${rarName(s.id)}${lvOf(s) ? ` +${s.lv}` : ''}${isBroken(s) ? '<small style="color:#ff8a96">망가짐</small>' : ''}<div class="ings">${mx ? `<span class="ing">내구도 ${durOf(s)}/${mx}</span>` : ''}${got ? got.map(([id, c]) => `<span class="ing gain"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} +${c}</span>`).join('') : '<span class="ing">돌려받을 재료가 없어요</span>'}</div></div><button type="button" class="btn mk ${ask ? 'warn' : ''}" data-a="salv" data-i="${i}" ${ok ? '' : 'disabled'}>${ask ? '정말?' : '분해'}</button></div>`; }
      h += `</div></div>`;
    } else if (UIS.tab === 'book') { // recipe book: a stamp on every dish made at least once
      const all = ['pie', 'stew', 'fishStew', ...DISHES.map(d => d[0])], made = id => ((G.stats.made || {})[id] || 0) + ((G.stats.made || {})[id + 'S'] || 0), nMade = all.filter(id => made(id)).length, nKnown = all.filter(id => knows(id)).length;
      h += `<div class="sh-body"><p class="hint">만들어 본 요리에 도장이 찍혀요 · 만든 요리 ${nMade}/${all.length} · 아는 레시피 ${nKnown}/${all.length}</p><div class="dbook">${all.map(id => { const k = knows(id), m = made(id), it = ITEMS[id];
        return `<div class="dk ${m ? 'done' : ''} ${k ? '' : 'unk'}"><img class="px" src="${iconURL(k ? id : 'rn_' + (DISH[id] ? id : 'skewer'))}" alt=""><b>${k ? it.n : '???'}</b><small>${k ? (it.buff ? buffText(it) : '회복 요리') : escHTML(noteHint(DISH[id]))}</small>${m ? '<i>✓</i>' : ''}</div>`; }).join('')}</div></div>`;
    } else if (UIS.tab === 'fix') {
      const nb = smel && near.has('smelter'), list = G.inv.map((s, i) => ({ s, i })).filter(({ s }) => s && DUR[s.id] && durOf(s) < DUR[s.id][0]);
      h += `<div class="sh-body"><p class="hint">${nb ? '닳은 도구를 새것처럼 고쳐요. 많이 닳을수록 재료가 더 들어요.' : '장비제작대 근처에서 고칠 수 있어요.'}</p><div class="list">`;
      if (!list.length) h += `<p class="prose" style="color:var(--muted);text-align:center;margin-top:18px">고칠 도구가 없어요</p>`;
      for (const { s, i } of list) { const cost = repairCost(s), ok = nb && cost.every(([id, c]) => availCount(id) >= c), mx = DUR[s.id][0];
        h += `<div class="rc ${ok ? 'ok' : 'no'}"><div class="ri" style="position:relative"><img class="px" src="${iconURL(s.id)}" alt=""></div><div class="rn">${rarName(s.id)}${isBroken(s) ? '<small style="color:#ff8a96">망가짐</small>' : ''}<div class="fixbar"><i style="width:${Math.round(durOf(s) / mx * 100)}%"></i></div><div class="ings"><span class="ing">내구도 ${durOf(s)}/${mx}</span>${cost.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c}</span>`; }).join('')}</div></div><button type="button" class="btn mk" data-a="fix" data-i="${i}" ${ok ? '' : 'disabled'}>수리</button></div>`; }
      h += `</div></div>`;
    } else {
    // order is fixed while the panel stays on this tab, so the list does not jump after crafting
    const okey = UIS.tab + '|' + (UIS.tab2 || 'all') + '|' + (st || '') + '|' + ctier;
    if (!UIS.craftOrder || UIS.craftOrder.key !== okey) { const l = RECIPES.map((r, i) => ({ r, i })).filter(({ r }) => recipeOn(r) && atHere(r, st) && inTier(r) && (UIS.tab === 'all' || (st === 'bench' ? bcat(r)[0] === UIS.tab && (UIS.tab2 === 'all' || bcat(r)[1] === UIS.tab2) : r.cat === UIS.tab))); const tv = r => st === 'bench' && !r.at ? -1 : (r.tier || 0); l.sort((a, b) => (tv(b.r) - tv(a.r)) || (canCraft(b.r, near) - canCraft(a.r, near))); /* v60: this tier's things first */ UIS.craftOrder = { key: okey, ids: l.map(x => x.i) }; }
    const list = UIS.craftOrder.ids.map(i => ({ r: RECIPES[i], i }));
    const so = TIMED[st] && panel.i != null ? G.objs.get(panel.i) : null, busy = !!(so && so.job);
    h += `<div class="sh-body">${so ? `<p class="hint">재료를 넣어 두면 시간이 지나 완성돼요 (한 번에 한 가지, ${JOB_MAX}개까지). 창을 닫거나 게임을 꺼도 계속 만들어요. 다 되면 ${STN[st]} 앞에서 [꺼내기].</p>` : ''}${st === 'pot' ? '<p class="hint">버프 요리는 세 가지까지 함께 효과가 있어요. 모르는 요리는 레시피 쪽지를 찾으면 만들 수 있어요.</p>' : ''}${busy ? `<div class="list" style="margin-bottom:10px">${jobHTML(so)}</div>` : ''}<div class="list">`;
    for (const { r, i } of list) {
      if (r.dish && !knows(r.dish)) { h += `<div class="rc no lockd"><div class="ri"><img class="px" src="${iconURL('rn_' + r.dish)}" alt=""></div><div class="rn">???<div class="at">${escHTML(noteHint(DISH[r.dish]))}</div></div></div>`; continue; }
      const ok = canCraft(r, near) && !busy, it = ITEMS[r.out], stn = r.at && !near.has(r.at), multi = isMulti(r), mx = multi ? Math.min(so ? JOB_MAX : 99, maxCraft(r)) : 1, q = multi ? clamp(UIS.qty[i] || 1, 1, Math.max(1, mx)) : 1;
      const qty = multi && ok ? `<div class="qty"><button type="button" data-a="qty" data-i="${i}:-1" ${q <= 1 ? 'disabled' : ''} aria-label="하나 덜">−</button><b>${q * r.n}개</b><button type="button" data-a="qty" data-i="${i}:1" ${q >= mx ? 'disabled' : ''} aria-label="하나 더">+</button><button type="button" class="qmax" data-a="qty" data-i="${i}:max" ${q >= mx ? 'disabled' : ''}>최대</button></div>` : '';
      h += `<div class="rc ${ok ? 'ok' : 'no'}"><div class="ri"><img class="px" src="${iconURL(r.out)}" alt=""></div><div class="rn">${rarName(r.out)}${r.n > 1 ? `<small>× ${r.n}</small>` : ''}${it.buff ? `<small class="bfx">${buffText(it)}</small>` : ''}${it.set && UIS.tab !== it.set ? `<small class="stag ${it.set}">${SETN[it.set]}</small>` : ''}${TIERED[st] && ctier && r.at ? `<small style="color:${BENCH_COL[r.tier || 0] || 'var(--muted)'}">${TIERED[st][r.tier || 0]}</small>` : ''}<div class="ings">${r.req.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c * q}</span>`; }).join('')}</div>${so ? `<small>⏱ ${fmtT(jobTime(r))}</small>` : ''}${stn ? `<div class="at">${STN[r.at]} 근처에서 만들 수 있어요</div>` : ''}</div><button type="button" class="btn mk" data-a="craft" data-i="${i}" ${ok ? '' : 'disabled'}>${so ? '넣기' : '만들기'}</button>${qty}</div>`;
    }
    h += `</div></div>`;
    }
  } else if (k === 'chest') {
    const o = G.objs.get(panel.i); if (!o) { closePanel(); return; }
    const empty = o.items.every(x => !x);
    h += head('보관상자', 'chest', empty ? `<button class="btn ghost" data-a="retrieve" type="button" style="min-height:46px;padding:0 12px;font-size:15px">회수</button>` : '');
    h += `<div class="sh-body"><p class="hint">물건을 누르면 상자와 가방 사이로 옮겨져요. 끌어다 원하는 칸에 놓을 수도 있어요.</p><div class="menu-two stash"><button class="btn" data-a="stash" data-i="all" type="button">가방 → 모두 넣기</button><button class="btn ghost" data-a="stash" data-i="same" type="button">같은 것만 넣기</button></div><div class="lbl">상자</div><div class="grid">${o.items.map((s, i) => slotHTML(s, 'cout', i)).join('')}</div><div class="lbl">단축칸</div><div class="grid">${G.inv.slice(0, HOT).map((s, i) => slotHTML(s, 'cin', i)).join('')}</div><div class="lbl">가방</div><div class="grid">${G.inv.slice(HOT).map((s, i) => slotHTML(s, 'cin', i + HOT)).join('')}</div></div>`;
  } else if (k === 'map') {
    h += head('지도', 'map', `<button class="btn ghost" data-a="mapzoom" type="button" style="min-height:46px;padding:0 12px;font-size:15px">${UIS.mapAll ? '가까이 보기' : '전체 보기'}</button>`) + `<div class="sh-body"><canvas id="mapCv" width="600" height="600"></canvas><div class="legend"><span><i style="background:#7fe0b5"></i>나</span><span><i style="background:#ffc861"></i>등불나무</span><span><i style="background:#ff8fa3"></i>침대</span><span><i style="background:#86d96b"></i>보스</span><span><i style="background:#3f7fb5"></i>물</span><span><i style="background:#fff1b0"></i>빛씨앗 제단</span><span><i style="background:#ff6b81"></i>꽃망울 구역</span><label class="lgchk"><input type="checkbox" data-a="mapChest" ${mapChestOn() ? 'checked' : ''} aria-label="찾았지만 안 연 보물상자 표시"><i style="background:#ffd25c"></i>찾았지만 안 연 보물상자</label><span><i style="background:#ff9b4a"></i>잃어버린 꾸러미</span><span><i style="background:#b99bff"></i>귀환 표지</span></div>${regionMatHTML()}</div>`;
  } else if (k === 'tree') {
    h += head('등불나무', 'lightSeed') + `<div class="sh-body"><div class="seeds">${(G.won ? [0, 1, 2, 3, 4] : [0, 1, 2]).map(i => `<div class="${i < G.treeSeeds ? 'lit' : ''}"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div><p class="prose" style="text-align:center;color:var(--amber)">지금 모습 · ${TREE_STAGE[treeStage()]}</p>${TREE_BLESS(treeStage()) ? `<p class="prose">나무 둘레 <em>${TREE_BLESS(treeStage())}칸</em> 안의 작물이 20% 빨리 자라요. 빛가루가 떠다니는 곳까지예요.</p>` : ''}<p class="prose">오래된 등불나무가 잠들어 있어요. 땅속 어딘가에 흩어진 <em>빛씨앗 세 개</em>를 심으면 다시 환하게 빛날 거예요.</p><p class="prose" style="color:var(--muted)">하나는 동쪽 동굴의 말랑대왕이, 나머지는 서쪽 버섯숲과 북쪽 수정동굴의 제단이 품고 있대요. 씨앗을 심을 때마다 나무의 빛이 넓어지고 주변에 몬스터가 덜 나타나요.</p>${G.won ? '<p class="prose" style="color:var(--amber)">나무 꼭대기에 빈 등불이 두 개 더 있어요. 남쪽 용암 동굴의 용암 거북과 서쪽 얼음 동굴의 서리 정령이 마지막 빛씨앗을 지키고 있대요.</p>' : ''}</div>`;
  } else if (k === 'menu') {
    const imp = pendingImp && importFrom === 'menu' ? `<div class="impbox"><p>「${escHTML(pendingImp.name)}」 세이브로 바꿀까요?<br><span style="color:var(--muted);font-size:14px">지금 진행 중인 세계는 이 파일로 바뀌어요.</span></p><div class="menu-two"><button class="btn warn" data-a="impYes" type="button">바꾸기</button><button class="btn ghost" data-a="impNo" type="button">취소</button></div></div>` : '';
    const marks = G.marks || [];
    const dev = canDev() ? `<div class="devbox"><div class="lbl" style="color:#ff8fa3">개발자 도구 · 마을 표시</div><p class="hint">마을 영역의 두 모서리에 차례로 표시해요 (왼쪽 위 → 오른쪽 아래). 표시는 개발자 모드에서만 보여요.</p><div class="menu-list"><button class="btn ghost" data-a="markAdd" type="button">지금 서 있는 곳에 표시</button></div>${marks.map((m, k) => `<div class="markrow"><span>마을 ${Math.floor(k / 2) + 1} · ${k % 2 ? '끝' : '시작'} (${m.x}, ${m.y})</span><button class="btn ghost" data-a="markDel" data-i="${k}" type="button">지우기</button></div>`).join('')}${marks.length % 2 ? '<p class="hint" style="margin-top:8px">반대쪽 모서리에도 하나 더 표시해 주세요.</p>' : ''}</div>` : '';
    h += head('<span data-a="devtap">메뉴</span>', 'gear') + `<div class="sh-body">${imp}<div class="menu-list"><button class="btn" data-a="save" type="button">지금 저장하기</button><button class="btn ghost" data-a="sound" type="button">소리 ${soundOn ? '끄기' : '켜기'}</button></div>
      ${playRecordHTML()}
      <div class="lbl" style="margin-top:16px">캐릭터</div><div class="cp-grid">${cpCards(curChar())}</div><p class="hint" style="margin-top:8px">${CHARS[curChar()].n} · ${CHARS[curChar()].d}</p><div class="menu-list"><button class="btn ghost" data-a="openLook" type="button">머리·옷 직접 꾸미기</button></div>
      <div class="lbl" style="margin-top:16px">세이브 파일</div><div class="menu-two"><button class="btn ghost" data-a="export" type="button">파일로 내보내기</button><button class="btn ghost" data-a="import" type="button">파일 불러오기</button></div><p class="hint" style="margin-top:8px">다른 기기로 옮기거나 백업할 때 써요.</p>${cloudMenuHTML()}
      <div class="lbl" style="margin-top:16px">조작 방식 (터치 화면)</div><div class="tabs">${[['joy', '조이스틱'], ['pad', '방향키']].map(([k, n]) => `<button type="button" class="tab ${ctrlPref === k ? 'on' : ''}" data-a="ctrl" data-i="${k}">${n}</button>`).join('')}</div><div class="lbl" style="margin-top:16px">화면 크기</div><div class="tabs">${[['small', '작게 (넓게 보기)'], ['normal', '보통'], ['large', '크게']].map(([k, n]) => `<button type="button" class="tab ${zoomPref === k ? 'on' : ''}" data-a="zoom" data-i="${k}">${n}</button>`).join('')}</div>
      <div class="lbl" style="margin-top:16px">조작 방법</div><div class="keys"><b>이동</b><span>화면 왼쪽을 끌기 · WASD</span><b>행동</b><span>큰 버튼 · 스페이스 · 클릭. 손에 든 물건의 일을 해요(무기=공격, 삽=파기, 가구=놓기 …). 빈손이면 앞에 있는 것에 맞춰 캐기/열기/앉기 등으로 바뀌어요</span><b>가구</b><span>가구 앞에서 큰 버튼은 앉기·잠자기 같은 사용, 작은 [회수] 버튼(PC는 R)은 가방으로 회수</span><b>계속 누르기</b><span>꾹 누르고 있으면 계속 캐거나 공격해요</span><b>놓기</b><span>단축칸에서 물건을 고르고 빈 땅을 바라보며 눌러요</span><b>먹기</b><span>골라 둔 음식을 한 번 더 누르면 먹어요</span><b>삽</b><span>삽을 들고 바닥을 누르면 걷고, 땅을 누르면 배운 지형을 떠요</span><b>단축키</b><span>1–9 단축칸 · R 회수 · T 가구 방향 · I 가방 · C 제작 · M 지도</span></div>
      <div class="lbl" style="margin-top:16px">갇혔을 때</div><div class="menu-list"><button class="btn ${UIS.confirmEsc ? 'warn' : 'ghost'}" data-a="escape" type="button">${UIS.confirmEsc ? '한 번 더 누르면 트인 곳으로 옮겨요' : '긴급 탈출'}</button></div><p class="hint" style="margin-top:8px">벽·울타리에 갇혀 나갈 수 없을 때 써요. 막힌 곳 바깥의 가장 가까운 트인 곳으로 옮겨 줘요 (30초에 한 번).</p>
      <div class="menu-list" style="margin-top:16px"><button class="btn ${UIS.confirmNew ? 'warn' : 'ghost'}" data-a="newgame" type="button">${UIS.confirmNew ? '정말 처음부터 시작할까요? (지금 세이브는 백업돼요)' : '처음부터 다시 하기'}</button></div>${dev}</div>`;
  } else if (k === 'look') {
    const L = UIS.look; CHARS.__look = lookDef(L); const pv = d => `<img class="px" src="${charPreview('__look', 0, d)}" alt="">`;
    const tabs = [['hair', '머리 모양'], ['hc', '머리 색'], ['eye', '눈 색'], ['outfit', '옷'], ['oc', '옷 색'], ['hat', '모자·소품']];
    h += head('꾸미기', 'hand') + `<div class="look-prev">${pv('down')}${pv('side')}${pv('up')}</div><div class="tabs">${tabs.map(([id, n]) => `<button type="button" class="tab ${UIS.lookTab === id ? 'on' : ''}" data-a="lookTab" data-i="${id}">${n}</button>`).join('')}</div><div class="sh-body"><div class="look-grid">`;
    const t = UIS.lookTab, opt = (key, val, label, inner) => `<button type="button" class="look-opt ${String(L[key]) === String(val) ? 'on' : ''}" data-a="lookSet" data-i="${key}:${val}">${inner}<span>${label}</span></button>`;
    const mini = (key, val) => { const T = Object.assign({}, L, { [key]: val }); CHARS.__mini = lookDef(T); return `<img class="px" src="${charPreview('__mini', 0, 'down')}" alt="">`; };
    if (t === 'hair') for (const k in HAIRS) h += opt('hair', k, HAIRS[k].n, mini('hair', k));
    if (t === 'hat') for (const k in HATS) h += opt('hat', k, HATS[k].n, mini('hat', k));
    if (t === 'outfit') for (const k in OUTFITS2) h += opt('outfit', k, OUTFITS2[k].n, mini('outfit', k));
    if (t === 'hc') HAIRC.forEach(([n, c], k) => { h += opt('hc', k, n, `<i class="sw" style="background:${c[0]};box-shadow:inset -4px -4px 0 ${c[1]}"></i>`); });
    if (t === 'oc') OUTC.forEach(([n, c], k) => { h += opt('oc', k, n, `<i class="sw" style="background:${c[0]};box-shadow:inset -4px -4px 0 ${c[1]}"></i>`); });
    if (t === 'eye') EYEC.forEach(([n, c], k) => { h += opt('eye', k, n, `<i class="sw" style="background:${c}"></i>`); });
    h += `</div></div><div class="menu-two" style="margin-top:10px"><button class="btn ghost" data-a="close" type="button">취소</button><button class="btn" data-a="lookOk" type="button">이 모습으로 하기</button></div>`;
  } else if (k === 'quest') {
    const tab = UIS.qTab || 'main';
    const rwHTML = q => `<div class="qrw">${q.rw.map(([id, c]) => `<span><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${c}</span>`).join('')}${q.xp ? `<span>경험치 ${q.xp}</span>` : ''}</div>`;
    const row = (q, st, lockTxt) => { const lock = !st.done && !st.cur && lockTxt; const chip = st.done ? '<span class="st done">완료</span>' : st.cur ? '<span class="st cur">진행 중</span>' : `<span class="st lock">${lockTxt ? '잠김' : '진행 중'}</span>`;
      const act = !st.has ? '' : st.claimed ? '<span class="got">받음 ✓</span>' : st.done ? `<button type="button" class="btn" data-a="qClaim" data-i="${q.id}">보상 받기</button>` : '';
      return `<div class="qrow ${lock ? 'lock' : ''}">${chip}<div><h4>${lock ? '???' : escHTML(qText(q))}</h4>${!lock && (st.cur || (!st.done && !lockTxt)) ? `<p>${escHTML(q.h || '')}</p>` : ''}${!lock && st.has ? rwHTML(q) : ''}</div>${act}</div>`; };
    const n1 = GUIDE.filter((q, k) => { const st = questState(q, k); return st.done && !st.claimed && st.has; }).length, n2 = QSIDE.filter(q => { const st = questState(q); return st.done && !st.claimed && st.has; }).length;
    h += head('퀘스트', 'quest', (n1 + n2) ? `<button type="button" class="btn" data-a="qClaimAll" style="min-height:46px;padding:0 12px;font-size:15px">모두 받기 (${n1 + n2})</button>` : '');
    h += `<div class="tabs"><button type="button" class="tab ${tab === 'main' ? 'on' : ''}" data-a="qTab" data-i="main">이야기${n1 ? ` · ${n1}` : ''}</button><button type="button" class="tab ${tab === 'side' ? 'on' : ''}" data-a="qTab" data-i="side">도전${n2 ? ` · ${n2}` : ''}</button></div><div class="sh-body">`;
    if (tab === 'main') GUIDE.forEach((q, k) => { if (k > G.guide + 1) return; h += row(q, questState(q, k), true); });
    else { const L = QSIDE.map(q => [q, questState(q)]).sort((a, b) => (b[1].done && !b[1].claimed) - (a[1].done && !a[1].claimed) || a[1].claimed - b[1].claimed); for (const [q, st] of L) h += row(q, st, false); }
    h += `</div>`;
  } else if (k === 'stat') {
    const R = G.rpg, need = XP_NEED(R.lv), touch = document.body.classList.contains('touch');
    h += head('능력', 'star') + `<div class="sh-body"><div class="lvbox"><b>Lv.${R.lv}</b><div class="xpbar"><i style="width:${R.lv >= MAX_LV ? 100 : Math.round(R.xp / need * 100)}%"></i></div><span>${R.lv >= MAX_LV ? '최고 레벨' : `경험치 ${R.xp} / ${need}`}</span></div>
      <p class="hint">몬스터를 물리치고, 광석을 캐고, 물건을 만들고, 낚시하면 경험치가 쌓여요. 레벨이 오르면 능력치 포인트 2개와 스킬 포인트 1개를 받아요.</p>
      <div class="lbl">능력치<span class="pt">남은 포인트 ${R.pts}</span></div>`;
    for (const st in STATN) h += `<div class="strow"><b>${STATN[st][0]}</b><span class="v">${R[st]}</span><small>${STATN[st][1]}</small><button type="button" class="btn" data-a="statUp" data-i="${st}" ${R.pts > 0 ? '' : 'disabled'} aria-label="${STATN[st][0]} 올리기">+</button></div>`;
    h += `<div class="stsum">최대 체력 ${maxHp()} · 최대 기력 ${maxMp()} · 근접 피해 ×${meleeMul().toFixed(2)} · 활 ×${rangeMul().toFixed(2)} · 마법 ×${magicMul().toFixed(2)} · 공격 속도 +${Math.round((1 / atkSpd() - 1) * 100)}% · 이동 +${Math.round((moveMul() - 1) * 100)}%</div>`;
    if (R.str + R.dex + R.vit + R.int) h += `<div class="menu-list"><button type="button" class="btn ${UIS.statAsk ? 'warn' : 'ghost'}" data-a="statReset">${UIS.statAsk ? '정말 포인트를 모두 돌려받을까요?' : '능력치 다시 나누기 (무료)'}</button></div>`;
    h += `<div class="lbl" style="margin-top:16px">스킬<span class="pt">스킬 포인트 ${R.sp}</span></div><p class="hint">사용 스킬은 스킬 칸 두 곳에 넣어 ${touch ? '큰 버튼 옆 파란 버튼으로' : 'F · G 키(오른쪽 클릭은 첫째 칸)로'} 써요. 기력은 가만히 있어도 천천히 차요.</p>`;
    const skOrder = SK_CAT.flatMap(([c, cn, ids]) => ids.map((id, n) => [id, n ? null : cn])).concat(Object.keys(SKILLS).filter(id => !SK_CAT.some(c => c[2].includes(id))).map(id => [id, null]));
    for (const [id, catName] of skOrder) { const S = SKILLS[id], l = R.sk[id] || 0, lock = R.lv < S.lv, can = !lock && R.sp > 0 && l < S.max, L1 = Math.max(1, l); if (catName) h += `<div class="skcat">${catName} 스킬</div>`;
      const slots = S.act && l ? `<div class="skslots">${[0, 1].map(n => `<button type="button" class="btn ${R.slot[n] === id ? '' : 'ghost'}" data-a="skSlot" data-i="${id}:${n}">${n + 1}칸${R.slot[n] === id ? ' ✓' : ''}</button>`).join('')}</div>` : '';
      h += `<div class="skrow ${lock ? 'lock' : ''}"><img class="px" src="${iconURL('sk_' + id)}" alt=""><div><h4>${S.n}<small>${S.act ? '사용' : '항상 적용'} · ${l}/${S.max}</small></h4><p>${S.d(L1)}${S.act ? ` · 기력 ${S.mp(L1)} · ${S.cd(L1).toFixed(1)}초` : ''}</p>${l && l < S.max ? `<p class="nx">다음 단계: ${S.d(l + 1)}</p>` : ''}${lock ? `<p>Lv.${S.lv}부터 배울 수 있어요</p>` : ''}${slots}</div><button type="button" class="btn mk" data-a="skUp" data-i="${id}" ${can ? '' : 'disabled'}>${l ? (l >= S.max ? '최고' : '올리기') : '배우기'}</button></div>`; }
    if (Object.keys(R.sk).length) h += `<div class="menu-list"><button type="button" class="btn ${UIS.skAsk ? 'warn' : 'ghost'}" data-a="skReset">${UIS.skAsk ? '정말 스킬 포인트를 모두 돌려받을까요?' : '스킬 다시 배우기 (무료)'}</button></div>`;
    h += `</div>`;
  } else if (k === 'win2') {
    h += `<div class="sh-body" style="text-align:center;padding-top:8px"><div class="seeds">${[0, 1, 2, 3, 4].map(() => `<div class="lit"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div><h2 style="font-weight:400;font-size:28px;color:var(--amber);margin:4px 0 10px">다섯 등불이 모두 밝아졌어요!</h2><p class="prose">용암과 얼음 깊은 곳까지 빛이 닿았어요. 땅속 세상 전체가 등불나무의 품 안에서 반짝여요. 끝까지 함께해 줘서 고마워요!</p><p class="prose" style="color:var(--muted)">전설 장비를 모으고, 남은 도전 퀘스트를 깨고, 나만의 정원을 마음껏 꾸며 보세요.</p><p class="prose" style="color:var(--amber)">새 레시피: 등불 축제 케이크 (요리솥)</p><button class="btn" data-a="close" type="button" style="width:100%;min-height:56px">계속 모험하기</button></div>`;
  } else if (k === 'win') {
    h += `<div class="sh-body" style="text-align:center;padding-top:8px"><div class="seeds">${[0, 1, 2].map(() => `<div class="lit"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div><h2 style="font-weight:400;font-size:28px;color:var(--amber);margin:4px 0 10px">등불나무가 깨어났어요!</h2><p class="prose">따스한 빛이 동굴 깊은 곳까지 번져요. 이제 이곳은 당신의 아늑한 정원이에요.</p><p class="prose" style="color:var(--amber)">그런데… 나무 꼭대기에 아직 불 꺼진 등불이 두 개 남아 있어요. 수정 곡괭이를 만들어 남쪽 용암 동굴과 서쪽 얼음 동굴로 떠나 보세요!</p><button class="btn" data-a="close" type="button" style="width:100%;min-height:56px">계속 꾸미기</button></div>`;
  }
  POOL = null;
  if (LAY === 2 && (k === 'tree' || k === 'win' || k === 'win2')) h = dirText(h);
  sh.innerHTML = h; sh.dataset.key = key;
  if (same) { const nb = sh.querySelector('.sh-body'); if (nb) nb.scrollTop = oTop; }
  if (sameKind) { const nt = sh.querySelector('.tabs'); if (nt) nt.scrollLeft = oLeft; }
  if (k === 'map') drawMap();
}
// the map's unopened-treasure markers can be hidden; a per-viewer setting kept in this browser
let mapChestPref = null;
function mapChestOn() { if (mapChestPref == null) { try { mapChestPref = localStorage.getItem('lantern-tree-map-chest') !== '0'; } catch (_) { mapChestPref = true; } } return mapChestPref; }
function drawMap() {
  const c = $('#mapCv'); if (!c) return; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#0c0a12'; g.fillRect(0, 0, 600, 600);
  if (mapDirty) { mapCtx.putImageData(mapImg, 0, 0); mapDirty = false; }
  const span = UIS.mapAll ? W : 90, s = 600 / span; const ox = UIS.mapAll ? 0 : clamp(G.p.x - span / 2, 0, W - span), oy = UIS.mapAll ? 0 : clamp(G.p.y - span / 2, 0, H - span);
  g.drawImage(mapCv, ox, oy, span, span, 0, 0, 600, 600);
  const dot = (x, y, col, r) => { const X = (x - ox) * s, Y = (y - oy) * s; g.fillStyle = INK; g.beginPath(); g.arc(X, Y, r + 3, 0, 6.283); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(X, Y, r, 0, 6.283); g.fill(); };
  dot(CX + .5, CY, '#ffc861', 9);
  if (G.spawnPt) dot(G.spawnPt.x + .5, G.spawnPt.y + .5, '#ff8fa3', 5);
  for (const z of G.fzones || []) if (G.explored[idx(z.x, z.y)]) dot(z.x + .5, z.y + .5, FLOWERS[z.c][2], 4);
  for (const k of BKEYS) { const h = BOSSES[k].home(); if (!G.bossDead[k] && G.explored[idx(Math.floor(h.x), Math.floor(h.y))]) dot(h.x, h.y, BOSSES[k].col, 6); }
  for (const sp of [SA, SB]) if (G.explored[idx(sp.x, sp.y)] && G.objs.get(idx(sp.x, sp.y))?.has) dot(sp.x + .5, sp.y + .5, '#fff1b0', 5);
  if (mapChestOn()) for (const r of G.rooms || []) if (r.found && !r.open) dot(r.cx + .5, r.cy + .5, '#ffd25c', 5);
  for (const [i, o] of G.objs) if (o.t === 'lostBag') dot(i % W + .5, ((i / W) | 0) + .5, '#ff9b4a', 5);
  if (G.backPt) dot(G.backPt.x, G.backPt.y, '#b99bff', 5);
  dot(G.p.x, G.p.y, '#7fe0b5', 8);
}
function nearStations() { const p = G.p, set = new Set(); for (let y = Math.floor(p.y) - 4; y <= p.y + 4; y++) for (let x = Math.floor(p.x) - 4; x <= p.x + 4; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && OBJ[o.t].station) set.add(OBJ[o.t].station); } return set; }
let craftNoteT = 0;
function craftNote(id, n, msg) {
  let el = $('#craftNote'); if (!el) { el = document.createElement('div'); el.id = 'craftNote'; el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  const nm = ITEMS[id].n; el.innerHTML = `<img class="px" src="${iconURL(id)}" alt=""><span>${escHTML(msg || (n > 1 ? `${josa(nm, '을', '를')} ${n}개 제작했어요!` : `${josa(nm, '을', '를')} 제작했어요`))}</span>`;
  const sh = $('#sheet').getBoundingClientRect(), open = !$('#sheetWrap').hidden; el.style.top = (open ? Math.max(8, sh.top - 58) : 120) + 'px';
  if (open && sh.top < 70) el.style.top = (sh.top + 12) + 'px';
  el.classList.remove('out'); el.hidden = false; clearTimeout(craftNoteT); craftNoteT = setTimeout(() => { el.classList.add('out'); craftNoteT = setTimeout(() => { el.hidden = true; }, 400); }, 1800);
}
const craftCtx = () => panel && panel.kind === 'craft' ? (panel.st || null) : null;
function canCraft(r, near) { const c = craftCtx(); return (!r.dish || knows(r.dish)) && atHere(r, c) && (!c || near.has(c)) && (!TIERED[c] || (r.tier || 0) <= craftTier()) && r.req.every(([id, c2]) => availCount(id) >= c2); }
