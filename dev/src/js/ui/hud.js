// ================= HUD: 시간 작업 칸, 버프·더위추위 막대, 옷 권하기, 도구 칸·도구 줄, 버튼 표시 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
// the job card updates itself while the panel is open
let jobUiT = 0;
function jobPanelTick(dt) { if (!panel || panel.kind !== 'craft' || !TIMED[panel.st]) return; jobUiT -= dt; if (jobUiT > 0) return; jobUiT = .25;
  const o = panel.i != null && G.objs.get(panel.i), j = o && o.job, card = document.querySelector('#sheet .jobcard');
  if (!j) { if (card) renderPanel(); return; } if (!card || +card.dataset.done !== jobDone(j)) { renderPanel(); return; }
  const bar = document.getElementById('jobBar'), tx = document.getElementById('jobTxt'), d = jobDone(j);
  if (bar) bar.style.width = Math.round(clamp((nowS() - j.t0) / (j.q * j.per), 0, 1) * 100) + '%'; if (tx) tx.textContent = `${d}/${j.q} 완료${d < j.q ? ` · 남은 시간 ${fmtT(jobLeft(j))}` : ''}`; }
function drawBuffs() { const el = $('#buffs'); if (!el) return; const act = activeBuffs(); const key = act.map(b => b.id + ':' + Math.ceil((b.end - G.time) / b.max * 24)).join('|');
  if (key === lastBuffKey && !buffDirty) return; lastBuffKey = key; buffDirty = false; el.hidden = !act.length;
  el.innerHTML = act.map(b => `<span class="bf" title="${EFF[b.ef].n} ${EFF[b.ef].t(EFF[b.ef].v[b.tier - 1])}" style="--f:${Math.max(0, (b.end - G.time) / b.max).toFixed(3)}"><img class="px" src="${iconURL(b.id)}" alt="${EFF[b.ef].n}"><i>${b.tier}</i></span>`).join(''); }
let wearAskT = 0;
function suggestWear(b) { const need = b === 3 ? 'hot' : b === 4 ? 'cold' : null, el = $('#wearAsk'); if (!need || !started) return; const cur = G.equip.body;
  if (cur && ITEMS[cur.id].guard === need) return; const k = G.inv.findIndex(x => x && ITEMS[x.id].kind === 'wear' && ITEMS[x.id].guard === need); if (k < 0) return;
  el.textContent = `${ITEMS[G.inv[k].id].n}${roJosa(ITEMS[G.inv[k].id].n).slice(ITEMS[G.inv[k].id].n.length)} 갈아입을까요?`; el.dataset.id = G.inv[k].id; el.hidden = false; clearTimeout(wearAskT); wearAskT = setTimeout(() => { el.hidden = true; }, 8000); }
function drawEnv() { const E = G.env || {}, bar = $('#envBar'), on = !!E.k; if (bar.hidden === on) bar.hidden = !on;
  if (on) { const k = E.k + '|' + Math.round(E.v); if (bar.dataset.k !== k) { bar.dataset.k = k; bar.className = 'bar env ' + E.k; $('#envFill').style.width = E.v + '%'; $('#envTxt').textContent = Math.round(E.v); const ic = E.k === 'hot' ? 'fireBerry' : 'frostShard'; if ($('#icEnv').dataset.ic !== ic) { $('#icEnv').dataset.ic = ic; $('#icEnv').src = iconURL(ic); } } }
  const fx = $('#envFx'), v = Math.round(envFxV * 200) / 200; if (v !== envFxShown) { envFxShown = v; fx.style.opacity = (v / .45).toFixed(3); } const cls = E.k || (envFxV > .005 ? fx.dataset.k : ''); if (fx.dataset.k !== cls) { fx.dataset.k = cls || ''; fx.className = cls || ''; } }
// ---- the tool slot (front of the hotbar) and its row ----
let toolRowOpen = false;
function toolSlotHTML() { const s = heldTool() || toolRowList()[0] || null, on = G.sel < 0;
  return `<button type="button" class="slot tslot ${on ? 'sel' : ''} ${s && isBroken(s) ? 'broken' : ''}" data-tool="1" aria-label="도구 칸${s ? ' · ' + ITEMS[s.id].n : ''}">${s ? `<img class="px" src="${iconURL(s.id)}" alt="">${s.lv ? `<span class="lvb">+${s.lv}</span>` : ''}${durBar(s)}` : '<span class="tnone">도구</span>'}<span class="tup">▲</span></button>`; }
function toggleToolRow(force) { toolRowOpen = force != null ? force : !toolRowOpen; renderToolRow(); }
function renderToolRow() { let el = $('#toolRow'); if (!el) { el = document.createElement('div'); el.id = 'toolRow'; $('#game').appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-tk]'); if (!b) return; ensureAudio(); const s = G.tools[+b.dataset.tk]; if (s) { runCmd({ k: 'hold', i: +b.dataset.tk }); emit('sfx', 'click'); } toggleToolRow(false); }); }
  const L = toolRowList(); el.hidden = !toolRowOpen || !G;
  if (!toolRowOpen || !G) return; if (!L.length) { el.innerHTML = '<span class="tnone">도구가 없어요 · 작업대·장비제작대에서 만들어요</span>'; return; }
  el.innerHTML = L.map(s => slotHTML(s, 'tk', G.tools.indexOf(s), s === heldTool() ? 'sel' : '').replace('data-a="tk" data-i=', 'data-tk=')).join(''); }
function toolSlotClick() { ensureAudio(); if (!G.tools.length) { emit('toast', '도구가 없어요 · 작업대·장비제작대에서 만들어요', null, 'notool'); return; }
  if (G.sel >= 0) { const s = heldTool() || G.tools[G.tsel] || toolRowList()[0]; if (s) runCmd({ k: 'hold', i: G.tools.indexOf(s) }); } toggleToolRow(); }
// ---- buttons on screen ----
function updateCtrlHud() { const a = G.act || {};
  const w = curWeapon(), ab = $('#atkBtn'); if (ab && ab.dataset.w !== w.id) { ab.dataset.w = w.id; $('#atkIcon').src = iconURL(w.id === 'hand' ? 'hand' : w.id); $('#atkLbl').textContent = w.id === 'hand' ? '주먹' : '공격'; }
  const ib = $('#actBtn'); if (ib) ib.classList.toggle('dim', a.k === 'info' || a.k === 'none');
  const alt = curAlt(), sb = $('#subBtn'); if (sb) { if (sb.hidden === !!alt) sb.hidden = !alt; const key = alt ? alt.lbl + '|' + alt.icon : ''; if (alt && sb.dataset.k !== key) { sb.dataset.k = key; $('#subIcon').src = iconURL(alt.k === 'rot' ? 'rotate' : alt.icon || 'hand'); $('#subLbl').textContent = alt.lbl; sb.setAttribute('aria-label', alt.lbl); } }
  const nx = $('#altNext'); if (nx) { const v = !!alt && G.alts.length > 1; if (nx.hidden === v) nx.hidden = !v; } }
