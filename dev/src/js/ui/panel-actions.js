function onSheetClick(e) {
  if (performance.now() - DRAG.block < 400) return;
  if (performance.now() - panelAt < 450) return;
  const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, i = b.dataset.i != null ? (isNaN(+b.dataset.i) ? b.dataset.i : +b.dataset.i) : null;
  ensureAudio();
  if (a === 'close') { closePanel(); return; }
  if (a === 'inv') {
    UIS.trash = false;
    if (UIS.invSel === null) { if (G.inv[i]) UIS.invSel = i; }
    else if (UIS.invSel === i) UIS.invSel = null;
    else { const A = G.inv[UIS.invSel], B = G.inv[i]; if (A && B && A.id === B.id && B.c < stackMax(B.id)) { const k = Math.min(stackMax(B.id) - B.c, A.c); B.c += k; A.c -= k; if (!A.c) G.inv[UIS.invSel] = null; } else { G.inv[UIS.invSel] = B; G.inv[i] = A; } UIS.invSel = null; SFX.place(); }
    invDirty = true; renderPanel(); return;
  }
  if (a === 'bagTab') { UIS.bagTab = i; UIS.invSel = null; renderPanel(); return; }
  if (a === 'stash') { const o = panel && panel.kind === 'chest' ? G.objs.get(panel.i) : null; if (!o || !o.items) return; const r = stashBag(o, i === 'same');
    toast(r.n ? `${r.n}개를 상자에 넣었어요${r.left ? ' · 상자가 가득 차서 일부는 남았어요' : ''}` : i === 'same' ? '상자에 있는 것과 같은 물건이 가방에 없어요' : r.left ? '상자가 가득 찼어요' : '가방에 넣을 물건이 없어요', r.n ? 'good' : null, 'stash'); if (r.n) SFX.place(); invDirty = true; renderPanel(); return; }
  if (a === 'sortBag') { sortBag(); SFX.place(); toast('가방을 정리했어요', null, 'sortbag'); renderPanel(); return; }
  if (a === 'wearOn') { const k = UIS.invSel; if (k != null && G.inv[k]) wearItem(k); UIS.invSel = null; renderPanel(); return; }
  if (a === 'eqSlot') { const sl = i; if (G.equip[sl]) unwear(sl); else toast(`${EQ_N[sl]} 칸에 낄 장비는 가방에서 고르고 [입기]·[달기]를 눌러요`, null, 'eq'); renderPanel(); return; }
  if (a === 'catchThrow') { catchThrow(); return; }
  if (a === 'petOn') { if (!(G.pets || {})[i]) return; if (G.petOn === i) { G.petOn = null; G.petE = null; toast(`${ANIMALS[i].pn}${josa(ANIMALS[i].pn, '은', '는').slice(ANIMALS[i].pn.length)} 집에서 쉬어요`, null, 'peton'); } else { G.petOn = i; G.petE = { x: G.p.x - .6, y: G.p.y + .2, flip: false, anim: 0, moving: false }; hearts(G.p.x, G.p.y - .5, 4); toast(`${ANIMALS[i].pn}${josa(ANIMALS[i].pn, '과', '와').slice(ANIMALS[i].pn.length)} 함께 다녀요 · ${ANIMALS[i].fx}`, 'good', 'peton'); } SFX.pick(); renderPanel(); return; }
  if (a === 'eqPick') { if (G.inv[i]) wearItem(i); renderPanel(); return; }
  if (a === 'eat') { eat(UIS.invSel); if (!G.inv[UIS.invSel]) UIS.invSel = null; renderPanel(); return; }
  if (a === 'tohot') { const from = UIS.invSel; let to = G.inv.slice(0, HOT).findIndex(x => !x); if (to < 0) to = G.sel < HOT ? G.sel : 0; const tmp = G.inv[to]; G.inv[to] = G.inv[from]; G.inv[from] = tmp; G.sel = to; UIS.invSel = null; invDirty = true; SFX.place(); renderPanel(); return; }
  if (a === 'trash') { if (!UIS.trash) { UIS.trash = true; renderPanel(); return; } G.inv[UIS.invSel] = null; UIS.invSel = null; UIS.trash = false; invDirty = true; renderPanel(); return; }
  if (a === 'tab') { if (UIS.tab !== i) UIS.tab2 = 'all'; UIS.tab = i; UIS.salvAsk = null; renderPanel(); return; }
  if (a === 'tab2') { UIS.tab2 = i; renderPanel(); return; }
  if (a === 'upg') { const s = upgSlot(i); if (!s || !upgOk(s.id) || lvOf(s) >= UPG_MAX || !nearStations().has('smelter')) return; const cost = upgCost(s.id, lvOf(s)); POOL = null; if (!cost.every(([id, c]) => availCount(id) >= c)) return;
    for (const [id, c] of cost) takeAvail(id, c); s.lv = lvOf(s) + 1; G.stats.upg = (G.stats.upg || 0) + 1; SFX.craft(); puff(G.p.x, G.p.y - .5, '#ffd25c', 14, 2.4, .5); toast(`강화 성공! ${ITEMS[s.id].n} +${s.lv} · ${upgText(s.id, s.lv)}`, 'good'); invDirty = true; renderPanel(); return; }
  if (a === 'salv') { const s = G.inv[i], got = s && (DUR[s.id] || upgOk(s.id)) && salvGet2(s); if (!got || !canSalv(nearStations())) return;
    if (UIS.salvAsk !== i) { UIS.salvAsk = i; renderPanel(); return; }
    UIS.salvAsk = null; G.inv[i] = null; for (const [id, c] of got) { const l = addItem(id, c, false); if (l) spawnDrop(id, l, G.p.x, G.p.y); }
    SFX.brk(); toast(`${josa(ITEMS[s.id].n, '을', '를')} 분해했어요: ${got.map(([id, c]) => ITEMS[id].n + ' ' + c + '개').join(', ')}`, 'good'); invDirty = true; renderPanel(); return; }
  if (a === 'fix') { const s = G.inv[i]; if (!s || !DUR[s.id] || !nearStations().has('smelter')) return; const cost = repairCost(s); POOL = null; if (!cost.every(([id, c]) => availCount(id) >= c)) return;
    for (const [id, c] of cost) takeAvail(id, c); s.dur = DUR[s.id][0]; SFX.craft(); toast(`${josa(ITEMS[s.id].n, '을', '를')} 새것처럼 고쳤어요`, 'good'); invDirty = true; renderPanel(); return; }
  if (a === 'benchUp') { const o = panel && panel.i != null ? G.objs.get(panel.i) : null, lv = benchLv(o); if (lv < 0 || lv >= BENCH_MAX) return; POOL = null; const cost = BENCH_UP[lv + 1]; if (!cost.every(([id, c]) => availCount(id) >= c)) return;
    for (const [id, c] of cost) takeAvail(id, c); if (o.t === 'forge') o.t = 'bench'; o.lv = lv + 1;
    if (o.t === 'smelter') G.stats.gearLv = Math.max(G.stats.gearLv || 0, o.lv); else { G.stats.forge = 1; G.stats.benchLv = Math.max(G.stats.benchLv || 0, o.lv); }
    const x = panel.i % W, y = (panel.i / W) | 0; SFX.win(); puff(x + 1, y + .3, BENCH_COL[o.lv], 22, 3, .6); toast(`${tierNames(o.t)[o.lv]}로 올렸어요! 새로 만들 수 있는 것이 맨 위에 나와요`, 'good', 'benchup'); UIS.craftOrder = null; invDirty = true; checkGuide(); renderPanel(); return; }
  if (a === 'jobTake') { const o = panel && G.objs.get(panel.i); if (o) takeJob(o, G.p.x, G.p.y); renderPanel(); return; }
  if (a === 'jobCancel') { if (!UIS.jobAsk) { UIS.jobAsk = true; renderPanel(); return; } UIS.jobAsk = false; const o = panel && G.objs.get(panel.i); if (o) { cancelJob(o, G.p.x, G.p.y); SFX.click(); toast('취소하고 재료를 돌려받았어요', null, 'jobcancel'); } renderPanel(); return; }
  if (a === 'qty') { const [ri, d] = String(i).split(':'), r = RECIPES[+ri], mx = Math.max(1, Math.min(TIMED[r.at] ? JOB_MAX : 99, maxCraft(r))), cur = clamp(UIS.qty[ri] || 1, 1, mx); UIS.qty[ri] = d === 'max' ? mx : clamp(cur + (+d), 1, mx); renderPanel(); return; }
  if (a === 'mapChest') { mapChestPref = !mapChestOn(); try { localStorage.setItem('lantern-tree-map-chest', mapChestPref ? '1' : '0'); } catch (_) { } renderPanel(); return; }
  if (a === 'mapzoom') { UIS.mapAll = !UIS.mapAll; renderPanel(); return; }
  if (a === 'craft') {
    const r = RECIPES[i], near = nearStations(); POOL = null; if (!canCraft(r, near)) return;
    const so = TIMED[r.at] && panel.i != null ? G.objs.get(panel.i) : null; // v59: the furnace / pot being used
    if (so && so.job) { toast(`${STN[r.at]}에서 만드는 게 끝나면 넣을 수 있어요`, null, 'jobbusy'); return; }
    const q = isMulti(r) ? clamp(UIS.qty[i] || 1, 1, Math.max(1, Math.min(so ? JOB_MAX : 99, maxCraft(r)))) : 1, total = r.n * q;
    const before = so ? stockMap() : null;
    for (const [id, c] of r.req) takeAvail(id, c * q);
    if (so) { const after = stockMap(), used = Object.keys(before).map(id => [id, before[id] - (after[id] || 0)]).filter(([, c]) => c > 0), per = jobTime(r);
      so.job = { out: r.out, n: r.n, q, per, t0: nowS(), used }; SFX.place(); toast(`${STN[r.at]}에 넣었어요 · ${fmtT(q * per)} 뒤에 다 돼요`, 'good', 'jobput'); UIS.craftOrder = null; invDirty = true; renderPanel(); return; }
    G.stats.made = G.stats.made || {}; G.stats.made[r.out] = (G.stats.made[r.out] || 0) + q;
    if (ITEMS[r.out].bagUp) { G.bagLv = (G.bagLv || 0) + 1; while (G.inv.length < invSize()) G.inv.push(null); SFX.craft(); craftNote(r.out, 1, `가방이 ${G.inv.length - HOT}칸으로 늘었어요!`); UIS.craftOrder = null; invDirty = true; renderPanel(); return; }
    const left = addItem(r.out, total); if (left) spawnDrop(r.out, left, G.p.x, G.p.y);
    SFX.craft(); craftNote(r.out, total); gainXp(Math.min(8, q * (r.tier ? 3 : r.at ? 1 : 0)));
    invDirty = true; checkGuide(); renderPanel(); return;
  }
  if (a === 'retrieve') { const o = G.objs.get(panel.i); if (o) { const d = OBJ[o.t]; delObj(panel.i); returnObj(o, G.p.x, G.p.y); SFX.pick(); lightDirty = true; } closePanel(); return; }
  if (a === 'cout' || a === 'cin') { const o = G.objs.get(panel.i); if (!o) return; const src = a === 'cout' ? o.items : G.inv, dst = a === 'cout' ? G.inv : o.items; const s = src[i]; if (!s) return; const left = moveInto(dst, s); if (left === s.c) { toast(a === 'cout' ? '가방이 가득 찼어요' : '상자가 가득 찼어요', null, 'full'); return; } if (left) s.c = left; else src[i] = null; SFX.pick(); invDirty = true; renderPanel(); return; }
  if (a === 'qTab') { UIS.qTab = i; renderPanel(); return; }
  if (a === 'qClaim') { claimQuest(i); renderPanel(); return; }
  if (a === 'qClaimAll') { for (const q of [...GUIDE, ...QSIDE]) claimQuest(q.id); toast('보상을 모두 받았어요', 'good'); renderPanel(); return; }
  if (a === 'statUp') { const R = G.rpg; if (R.pts > 0 && STATN[i]) { R[i]++; R.pts--; if (i === 'vit') G.p.hp = Math.min(maxHp(), G.p.hp + 8); SFX.click(); } UIS.statAsk = false; renderPanel(); return; }
  if (a === 'statReset') { if (!UIS.statAsk) { UIS.statAsk = true; renderPanel(); return; } const R = G.rpg; R.pts += R.str + R.dex + R.vit + R.int; R.str = R.dex = R.vit = R.int = 0; G.p.hp = Math.min(G.p.hp, maxHp()); G.p.mp = Math.min(G.p.mp, maxMp()); UIS.statAsk = false; SFX.craft(); toast('능력치 포인트를 모두 돌려받았어요'); renderPanel(); return; }
  if (a === 'skUp') { const R = G.rpg, S = SKILLS[i]; if (!S) return; const l = R.sk[i] || 0; if (R.sp <= 0 || R.lv < S.lv || l >= S.max) return; R.sk[i] = l + 1; R.sp--; if (S.act && !l && !R.slot.includes(i)) { const e = R.slot.indexOf(null); if (e >= 0) R.slot[e] = i; } SFX.craft(); toast(l ? `${S.n} ${l + 1}단계로 올렸어요` : `${S.n}을(를) 배웠어요!`, 'good'); renderPanel(); return; }
  if (a === 'skReset') { if (!UIS.skAsk) { UIS.skAsk = true; renderPanel(); return; } const R = G.rpg; R.sp += Object.values(R.sk).reduce((a2, l) => a2 + l, 0); R.sk = {}; R.slot = [null, null]; G.p.mp = Math.min(G.p.mp, maxMp()); UIS.skAsk = false; SFX.click(); toast('스킬 포인트를 모두 돌려받았어요', 'good', 'skreset'); renderPanel(); return; }
  if (a === 'skSlot') { const [id, n] = String(i).split(':'), R = G.rpg, m = +n; if (!R.sk[id]) return; if (R.slot[m] === id) R.slot[m] = null; else { const o = R.slot.indexOf(id); if (o >= 0) R.slot[o] = R.slot[m]; R.slot[m] = id; } SFX.click(); renderPanel(); return; }
  if (a === 'save') { saveLocal(); return; }
  if (a === 'escape') { if (!UIS.confirmEsc) { UIS.confirmEsc = true; renderPanel(); return; } UIS.confirmEsc = false; closePanel(); if (emergencyEscape()) saveLocal(true); return; }
  if (a === 'qtShow') { UIS.qtShow = !UIS.qtShow; renderPanel(); return; }
  if (a === 'export') { exportSave(); return; }
  if (a === 'clGoogle') { cloudAuth('google'); return; }
  if (a === 'clEmailT') { UIS.clEmail = !UIS.clEmail; renderPanel(); return; }
  if (a === 'clIn') { cloudAuth('in'); return; }
  if (a === 'clUp') { cloudAuth('up'); return; }
  if (a === 'clOut') { CLOUD.api.out().then(() => toast('로그아웃했어요')).catch(e => toast(fbErr(e), 'warn')); return; }
  if (a === 'clUpNow') { cloudUpload(true, false); return; }
  if (a === 'clTake') { cloudTakePending(); return; }
  if (a === 'clKeep') { cloudKeepLocal(); return; }
  if (a === 'clPrev') { if (!UIS.prevAsk) { UIS.prevAsk = true; renderPanel(); return; } cloudTakePending(true); return; }
  if (a === 'openLook') { openPanel('look'); return; }
  if (a === 'lookTab') { UIS.lookTab = i; renderPanel(); return; }
  if (a === 'lookSet') { const [k, v] = String(i).split(':'); UIS.look[k] = ['hc', 'eye', 'oc'].includes(k) ? +v : v; SFX.click(); renderPanel(); return; }
  if (a === 'lookOk') { G.look = cleanLook(UIS.look); CHARS.custom = lookDef(G.look); G.char = 'custom'; G.outfit = 0; buildPlayer(0); puff(G.p.x, G.p.y - .5, CHARS.custom.pal[0], 16, 2.6, .6); SFX.craft(); toast('새 모습으로 꾸몄어요', 'good'); saveLocal(true); closePanel(); return; }
  if (a === 'charSet' && i === 'custom') { openPanel('look'); return; }
  if (a === 'charSet') { if (CHARS[i] && G.char !== i) { G.char = i; G.outfit = 0; buildPlayer(0); puff(G.p.x, G.p.y - .5, CHARS[i].pal[0], 14, 2.5, .6); SFX.craft(); toast(`${roJosa(CHARS[i].n)} 바꿨어요`, 'good'); saveLocal(true); } renderPanel(); return; }
  if (a === 'import') { pickSaveFile('menu'); return; }
  if (a === 'impYes') { applyImport(); return; }
  if (a === 'impNo') { pendingImp = null; renderPanel(); return; }
  if (a === 'devtap') { const now = performance.now(); devTaps = now - devTapT < 1500 ? devTaps + 1 : 1; devTapT = now; if (devTaps >= 7) { devTaps = 0; DEV = !DEV; try { localStorage.setItem('lantern-tree-dev', DEV ? '1' : '0'); } catch (e) { } toast(DEV ? '개발자 모드를 켰어요' : '개발자 모드를 껐어요'); renderPanel(); } return; }
  if (a === 'markAdd' && canDev()) { G.marks = G.marks || []; G.marks.push({ x: Math.floor(G.p.x), y: Math.floor(G.p.y) }); saveLocal(true); renderPanel(); return; }
  if (a === 'markDel' && canDev()) { G.marks.splice(i, 1); saveLocal(true); renderPanel(); return; }
  if (a === 'ctrl') { ctrlPref = i === 'pad' ? 'pad' : 'joy'; try { localStorage.setItem('lantern-tree-ctrl', ctrlPref); } catch (e) { } applyCtrl(); renderPanel(); return; }
  if (a === 'zoom') { zoomPref = i; try { localStorage.setItem('lantern-tree-zoom', i); } catch (e) { } resize(); renderPanel(); return; }
  if (a === 'sound') { soundOn = !soundOn; try { localStorage.setItem('lantern-tree-sound', soundOn ? '1' : '0'); } catch (e) { } renderPanel(); return; }
  if (a === 'newgame') { if (!UIS.confirmNew) { UIS.confirmNew = true; renderPanel(); return; } saveLocal(true); pushBackup('처음부터 다시 하기 전'); { const keepC = G.char; newGame((Math.random() * 1e9) | 0); G.char = keepC; buildPlayer(0); } started = true; closePanel(); invDirty = true; lastGoalTxt = ''; checkGuide(); saveLocal(true); toast('새로운 모험을 시작해요'); return; }
}
