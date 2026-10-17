// ================= HUD: 시간 작업 칸, 버프·더위추위 막대, 옷 권하기, 도구 칸·도구 줄, 버튼 표시 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
// the job card updates itself while the panel is open
import { DUR } from '../data/circuits-regions.js';
import { TIMED } from '../data/farming-cooking.js';
import { HOT, ITEMS } from '../data/items.js';
import { MAX_LV, SKILLS, XP_NEED } from '../data/rpg-nature.js';
import { ensureAudio } from '../engine/audio.js';
import { $, clamp, roJosa } from '../engine/util.js';
import { iconURL } from '../render/icons.js';
import { G, started } from '../save/state.js';
import { curAlt } from '../sim/actions.js';
import { curWeapon } from '../sim/combat.js';
import { runCmd } from '../sim/commands.js';
import { activeBuffs } from '../sim/cooking.js';
import { fmtT, jobDone, jobLeft, nowS } from '../sim/crafting.js';
import { emit, onEvent } from '../sim/events.js';
import { rarOf } from '../sim/gear.js';
import { durOf, heldTool, isBroken, sweepTools, toolRowList } from '../sim/inventory.js';
import { maxHp, maxMp } from '../sim/player.js';
import { canClaim } from '../sim/quests.js';
import { envFxV } from '../sim/survival.js';
import { onlyMe } from './feedback.js';
import { panel, renderPanel } from './panels.js';
export let jobUiT = 0;
export function jobPanelTick(dt) { if (!panel || panel.kind !== 'craft' || !TIMED[panel.st]) return; jobUiT -= dt; if (jobUiT > 0) return; jobUiT = .25;
  const o = panel.i != null && G.objs.get(panel.i), j = o && o.job, card = document.querySelector('#sheet .jobcard');
  if (!j) { if (card) renderPanel(); return; } if (!card || +card.dataset.done !== jobDone(j)) { renderPanel(); return; }
  const bar = document.getElementById('jobBar'), tx = document.getElementById('jobTxt'), d = jobDone(j);
  if (bar) bar.style.width = Math.round(clamp((nowS() - j.t0) / (j.q * j.per), 0, 1) * 100) + '%'; if (tx) tx.textContent = `${d}/${j.q} 완료${d < j.q ? ` · 남은 시간 ${fmtT(jobLeft(j))}` : ''}`; }
export let buffDirty = true, lastBuffKey = ''; // 버프 막대를 다시 그릴 때 (규칙은 emit('buffs'))
onEvent('buffs', onlyMe(() => { buffDirty = true; }));
export function drawBuffs() { const el = $('#buffs'); if (!el) return; const act = activeBuffs(); const key = act.map(b => b.id + ':' + Math.ceil((b.end - G.time) / b.max * 24)).join('|');
  if (key === lastBuffKey && !buffDirty) return; lastBuffKey = key; buffDirty = false; el.hidden = !act.length;
  el.innerHTML = act.map(b => `<span class="bf" title="${EFF[b.ef].n} ${EFF[b.ef].t(EFF[b.ef].v[b.tier - 1])}" style="--f:${Math.max(0, (b.end - G.time) / b.max).toFixed(3)}"><img class="px" src="${iconURL(b.id)}" alt="${EFF[b.ef].n}"><i>${b.tier}</i></span>`).join(''); }
export let wearAskT = 0;
export function suggestWear(b) { const need = b === 3 ? 'hot' : b === 4 ? 'cold' : null, el = $('#wearAsk'); if (!need || !started) return; const cur = G.equip.body;
  if (cur && ITEMS[cur.id].guard === need) return; const k = G.inv.findIndex(x => x && ITEMS[x.id].kind === 'wear' && ITEMS[x.id].guard === need); if (k < 0) return;
  el.textContent = `${ITEMS[G.inv[k].id].n}${roJosa(ITEMS[G.inv[k].id].n).slice(ITEMS[G.inv[k].id].n.length)} 갈아입을까요?`; el.dataset.id = G.inv[k].id; el.hidden = false; clearTimeout(wearAskT); wearAskT = setTimeout(() => { el.hidden = true; }, 8000); }
let envFxShown = -1;
export function drawEnv() { const E = G.env || {}, bar = $('#envBar'), on = !!E.k; if (bar.hidden === on) bar.hidden = !on;
  if (on) { const k = E.k + '|' + Math.round(E.v); if (bar.dataset.k !== k) { bar.dataset.k = k; bar.className = 'bar env ' + E.k; $('#envFill').style.width = E.v + '%'; $('#envTxt').textContent = Math.round(E.v); const ic = E.k === 'hot' ? 'fireBerry' : 'frostShard'; if ($('#icEnv').dataset.ic !== ic) { $('#icEnv').dataset.ic = ic; $('#icEnv').src = iconURL(ic); } } }
  const fx = $('#envFx'), v = Math.round(envFxV * 200) / 200; if (v !== envFxShown) { envFxShown = v; fx.style.opacity = (v / .45).toFixed(3); } const cls = E.k || (envFxV > .005 ? fx.dataset.k : ''); if (fx.dataset.k !== cls) { fx.dataset.k = cls || ''; fx.className = cls || ''; } }
// ---- the tool slot (front of the hotbar) and its row ----
export let toolRowOpen = false;
export function toolSlotHTML() { const s = heldTool() || toolRowList()[0] || null, on = G.sel < 0;
  return `<button type="button" class="slot tslot ${on ? 'sel' : ''} ${s && isBroken(s) ? 'broken' : ''}" data-tool="1" aria-label="도구 칸${s ? ' · ' + ITEMS[s.id].n : ''}">${s ? `<img class="px" src="${iconURL(s.id)}" alt="">${s.lv ? `<span class="lvb">+${s.lv}</span>` : ''}${durBar(s)}` : '<span class="tnone">도구</span>'}<span class="tup">▲</span></button>`; }
export function toggleToolRow(force) { toolRowOpen = force != null ? force : !toolRowOpen; renderToolRow(); }
export function renderToolRow() { let el = $('#toolRow'); if (!el) { el = document.createElement('div'); el.id = 'toolRow'; $('#game').appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-tk]'); if (!b) return; ensureAudio(); const s = G.tools[+b.dataset.tk]; if (s) { runCmd({ k: 'hold', i: +b.dataset.tk }); emit('sfx', 'click'); } toggleToolRow(false); }); }
  const L = toolRowList(); el.hidden = !toolRowOpen || !G;
  if (!toolRowOpen || !G) return; if (!L.length) { el.innerHTML = '<span class="tnone">도구가 없어요 · 작업대·장비제작대에서 만들어요</span>'; return; }
  el.innerHTML = L.map(s => slotHTML(s, 'tk', G.tools.indexOf(s), s === heldTool() ? 'sel' : '').replace('data-a="tk" data-i=', 'data-tk=')).join(''); }
export function toolSlotClick() { ensureAudio(); if (!G.tools.length) { emit('toast', '도구가 없어요 · 작업대·장비제작대에서 만들어요', null, 'notool'); return; }
  if (G.sel >= 0) { const s = heldTool() || G.tools[G.tsel] || toolRowList()[0]; if (s) runCmd({ k: 'hold', i: G.tools.indexOf(s) }); } toggleToolRow(); }
// ---- buttons on screen ----
export function updateCtrlHud() { const a = G.act || {};
  const w = curWeapon(), ab = $('#atkBtn'); if (ab && ab.dataset.w !== w.id) { ab.dataset.w = w.id; $('#atkIcon').src = iconURL(w.id === 'hand' ? 'hand' : w.id); $('#atkLbl').textContent = w.id === 'hand' ? '주먹' : '공격'; }
  const ib = $('#actBtn'); if (ib) ib.classList.toggle('dim', a.k === 'info' || a.k === 'none');
  const alt = curAlt(), sb = $('#subBtn'); if (sb) { if (sb.hidden === !!alt) sb.hidden = !alt; const key = alt ? alt.lbl + '|' + alt.icon : ''; if (alt && sb.dataset.k !== key) { sb.dataset.k = key; $('#subIcon').src = iconURL(alt.k === 'rot' ? 'rotate' : alt.icon || 'hand'); $('#subLbl').textContent = alt.lbl; sb.setAttribute('aria-label', alt.lbl); } }
  const nx = $('#altNext'); if (nx) { const v = !!alt && G.alts.length > 1; if (nx.hidden === v) nx.hidden = !v; } }
export function durBar(s) { if (s && s.id === 'wcan') return `<span class="dur"><i style="width:${Math.max(4, Math.round((s.w || 0) / WCAN_MAX * 100))}%;background:${s.w ? '#6fb8ff' : '#ff6b7a'}"></i></span>`; if (!s || !DUR[s.id]) return ''; const mx = DUR[s.id][0], d = durOf(s); if (d >= mx) return ''; const f = d / mx, col = f > .5 ? '#7fe0b5' : f > .2 ? '#ffc861' : '#ff6b7a'; return `<span class="dur"><i style="width:${Math.max(4, Math.round(f * 100))}%;background:${col}"></i></span>`; }
export function slotHTML(s, a, i, cls = '') { const br = isBroken(s), rr = s ? rarOf(s.id) : -1; return `<button type="button" class="slot ${cls} ${br ? 'broken' : ''} ${rr >= 1 ? 'r' + rr : ''}" data-a="${a}" data-i="${i}" aria-label="${s ? ITEMS[s.id].n + (br ? ' (망가짐)' : '') + ' ' + s.c + '개' : '빈 칸'}">${s ? `<img class="px" src="${iconURL(s.id)}" alt=""><span class="cnt">${s.c > 1 ? s.c : ''}</span>${s.lv ? `<span class="lvb">+${s.lv}</span>` : ''}${durBar(s)}${br ? '<span class="brk">!</span>' : ''}` : ''}</button>`; }
export let invDirty = true; // 단축칸을 다시 그릴 때 (규칙은 emit('inv'), 8단계부터 내 플레이어 것만)
export const markInv = () => { invDirty = true; };
onEvent('inv', onlyMe(() => { invDirty = true; }));
export function refreshHotbar() {
  sweepTools(); // v65: a tool that landed in the bag goes to the pouch
  const hb = $('#hbSlots'); let h = '';
  h += toolSlotHTML(); // v65: the tool slot
  for (let i = 0; i < HOT; i++) { const s = G.inv[i]; h += slotHTML(s, 'hot', i, i === G.sel ? 'sel' : '').replace('</button>', `<span class="key">${document.body.classList.contains('touch') ? '' : i + 1}</span></button>`); }
  hb.innerHTML = h; invDirty = false; if (panel) renderPanel(); if (toolRowOpen) renderToolRow();
  if (hbSel !== G.sel) { hbSel = G.sel; const el = G.sel < 0 ? hb.querySelector('[data-tool]') : hb.querySelector(`[data-i="${G.sel}"]`); if (el && hb.scrollWidth > hb.clientWidth) { const l = el.offsetLeft - hb.offsetLeft, r = l + el.offsetWidth; if (l < hb.scrollLeft) hb.scrollLeft = l - 4; else if (r > hb.scrollLeft + hb.clientWidth) hb.scrollLeft = r - hb.clientWidth + 4; } }
  const full = G.inv.slice(HOT).every(Boolean); $('#bInv').classList.toggle('dot', full);
}
export let lastHud = '', lastAct = '', hbSel = -1;
export function updateHud() {
  const p = G.p; const k = Math.round(p.hp) + '|' + Math.round(p.hunger) + '|' + maxHp();
  drawBuffs(); drawEnv();
  if (k !== lastHud) { lastHud = k; $('#hpFill').style.width = (p.hp / maxHp() * 100) + '%'; $('#hpTxt').textContent = Math.round(p.hp); $('#huFill').style.width = p.hunger + '%'; $('#huTxt').textContent = Math.round(p.hunger); const sf = document.getElementById('shHpFill'); if (sf) { sf.style.width = Math.max(0, p.hp / maxHp() * 100) + '%'; $('#shHpTxt').textContent = Math.round(p.hp); } }
  const a = G.act || { lbl: '', icon: 'dots' }; const ak = a.lbl + a.icon;
  updateCtrlHud(); // v65: attack button · small button
  if (ak !== lastAct) { lastAct = ak; $('#actLbl').textContent = a.lbl; $('#actIcon').src = iconURL(a.icon); }
  const R = G.rpg, mk2 = Math.round(p.mp) + '|' + maxMp() + '|' + R.lv + '|' + R.xp + '|' + (R.pts > 0 || R.sp > 0);
  if (mk2 !== lastMp) { lastMp = mk2; $('#mpFill').style.width = (p.mp / maxMp() * 100) + '%'; $('#mpTxt').textContent = Math.round(p.mp); $('#lvTxt').textContent = 'Lv.' + R.lv; $('#xpFill').style.width = (R.lv >= MAX_LV ? 100 : R.xp / XP_NEED(R.lv) * 100) + '%'; $('#bStat').classList.toggle('dot', R.pts > 0 || R.sp > 0); }
  updateSkBar();
  if (G.time - (G.__qt || 0) > .5 || G.__qt == null) { G.__qt = G.time; $('#goal').classList.toggle('dot', canClaim()); }
  if (invDirty) refreshHotbar();
}
export let lastMp = '';
export function updateSkBar() {
  const R = G.rpg, bar = $('#skBar'), any = Object.keys(R.sk).some(k => SKILLS[k].act && R.sk[k]);
  if (bar.hidden === any) bar.hidden = !any; if (!any) return;
  const st = R.slot.map(k => { if (!k) return null; const S = SKILLS[k], l = R.sk[k], cd = Math.max(0, G.skcd[k] || 0); return { k, f: cd > 0 ? Math.ceil(cd / S.cd(l) * 24) / 24 : 0, nomp: (G.p.mp || 0) < S.mp(l) }; });
  const key = JSON.stringify(st); if (key === bar.dataset.k) return; bar.dataset.k = key;
  bar.querySelectorAll('.skb').forEach((b, n) => { const x = st[n]; b.classList.toggle('empty', !x); b.classList.toggle('nomp', !!(x && x.nomp)); const img = b.querySelector('img'), src = iconURL(x ? 'sk_' + x.k : 'star'); if (img.dataset.src !== src) { img.src = src; img.dataset.src = src; }
    b.querySelector('.cd').style.background = x && x.f > 0 ? `conic-gradient(rgba(14,10,22,.72) ${Math.round(x.f * 360)}deg, transparent 0)` : ''; b.setAttribute('aria-label', x ? SKILLS[x.k].n : '빈 스킬 칸'); });
}
