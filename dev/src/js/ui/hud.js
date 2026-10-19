// ================= HUD: 시간 작업 칸, 버프·더위추위 동그라미, 옷 권하기, 도구 칸·도구 줄, 버튼 표시, v77 얼굴·빨간 점·단축칸 넘기기·알림 자리 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
// the job card updates itself while the panel is open
import { DUR } from '../data/circuits-regions.js';
import { TIMED } from '../data/farming-cooking.js';
import { HOT, ITEMS } from '../data/items.js';
import { MAX_LV, SKILLS, XP_NEED } from '../data/rpg-nature.js';
import { ensureAudio } from '../engine/audio.js';
import { $, clamp, roJosa } from '../engine/util.js';
import { SPR } from '../art/world.js';
import { iconURL } from '../render/icons.js';
import { headNoteY } from '../render/world.js';
import { G, started } from '../save/state.js';
import { curAlt } from '../sim/actions.js';
import { curWeapon } from '../sim/combat.js';
import { runCmd } from '../sim/commands.js';
import { activeBuffs } from '../sim/cooking.js';
import { fmtT, jobDone, jobLeft, nowS } from '../sim/crafting.js';
import { emit, onEvent } from '../sim/events.js';
import { rarOf } from '../sim/gear.js';
import { bagNew, durOf, heldTool, isBroken, sweepTools, toolRowList } from '../sim/inventory.js';
import { maxHp } from '../sim/player.js';
import { canClaim } from '../sim/quests.js';
import { envFxV } from '../sim/survival.js';
import { onlyMe } from './feedback.js';
import { navTick } from './map.js';
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
  const more = act.length > 2 ? act.length - 2 : 0; // v77: 버프는 2개까지 보이고 나머지는 「+N」
  el.innerHTML = act.slice(0, 2).map(b => `<span class="bf" title="${EFF[b.ef].n} ${EFF[b.ef].t(EFF[b.ef].v[b.tier - 1])}" style="--f:${Math.max(0, (b.end - G.time) / b.max).toFixed(3)}"><img class="px" src="${iconURL(b.id)}" alt="${EFF[b.ef].n}"><i>${b.tier}</i></span>`).join('') + (more ? `<span class="bf more" title="${act.slice(2).map(b => EFF[b.ef].n).join(' · ')}">+${more}</span>` : ''); }
export let wearAskT = 0;
export function suggestWear(b) { const need = b === 3 ? 'hot' : b === 4 ? 'cold' : null, el = $('#wearAsk'); if (!need || !started) return; const cur = G.equip.body;
  if (cur && ITEMS[cur.id].guard === need) return; const k = G.inv.findIndex(x => x && ITEMS[x.id].kind === 'wear' && ITEMS[x.id].guard === need); if (k < 0) return;
  el.textContent = `${ITEMS[G.inv[k].id].n}${roJosa(ITEMS[G.inv[k].id].n).slice(ITEMS[G.inv[k].id].n.length)} 갈아입을까요?`; el.dataset.id = G.inv[k].id; el.hidden = false; clearTimeout(wearAskT); wearAskT = setTimeout(() => { el.hidden = true; }, 8000); }
let envFxShown = -1;
export function drawEnv() { const E = G.env || {}, bar = $('#envRing'), on = !!E.k; if (bar.hidden === on) bar.hidden = !on; // v77: 배고픔 옆 동그라미 (그 지역에 있을 때만)
  if (on) { const k = E.k + '|' + Math.round(E.v); if (bar.dataset.k !== k) { bar.dataset.k = k; bar.className = 'ring env ' + E.k; bar.style.setProperty('--f', (clamp(E.v, 0, 100) / 100).toFixed(3)); bar.title = (E.k === 'hot' ? '더위 ' : '추위 ') + Math.round(E.v); const ic = E.k === 'hot' ? 'fireBerry' : 'frostShard'; if ($('#icEnv').dataset.ic !== ic) { $('#icEnv').dataset.ic = ic; $('#icEnv').src = iconURL(ic); } } }
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
// v77: 폰은 단축칸을 다섯 칸씩 넘겨 봐요 (0: 1–5칸 · 1: 6–9칸, PC는 9칸 다). 안 보이는 쪽에 물건이 새로 들어오면 넘기기 버튼에 빨간 점
export let hbPage = 0; let hbSig = ['', ''];
const PAGE = [[0, 1, 2, 3, 4], [5, 6, 7, 8]], pageOf = i => i >= 5 ? 1 : 0;
const pageIds = pg => PAGE[pg].map(i => G.inv[i] ? G.inv[i].id : '');
export function flipHotbar(pg) { hbPage = pg != null ? pg : 1 - hbPage; hbSig[hbPage] = pageIds(hbPage).join(','); drawFlip(); }
function drawFlip() { const hb = $('#hbSlots'), fb = $('#hbFlip'); if (!hb || !fb || !G) return; hb.classList.toggle('p2', hbPage === 1);
  const other = 1 - hbPage, seen = hbSig[other].split(','), now = pageIds(other), fresh = now.some((id, k) => id && id !== seen[k]);
  fb.classList.toggle('dot', fresh); const t = hbPage ? '1–5' : '6–9'; if (fb.dataset.t !== t) { fb.dataset.t = t; fb.querySelector('span').innerHTML = (hbPage ? '‹<br>' : '›<br>') + t; fb.setAttribute('aria-label', `단축칸 ${t} 보기`); } }
export function resetHotbarPage() { hbPage = 0; hbSig = [pageIds(0).join(','), pageIds(1).join(',')]; hbSel = -1; }
export function refreshHotbar() {
  sweepTools(); // v65: a tool that landed in the bag goes to the pouch
  const hb = $('#hbSlots'); let h = '';
  h += toolSlotHTML(); // v65: the tool slot
  for (let i = 0; i < HOT; i++) { const s = G.inv[i]; h += slotHTML(s, 'hot', i, i === G.sel ? 'sel' : '').replace('</button>', `<span class="key">${document.body.classList.contains('touch') ? '' : i + 1}</span></button>`); }
  h += '<i class="spacer"></i>'; // v77: 6–9칸 쪽은 네 칸이라 한 칸 자리를 비워 둬요 (단축칸 폭이 그대로)
  hb.innerHTML = h; invDirty = false; if (panel) renderPanel(); if (toolRowOpen) renderToolRow();
  if (hbSel !== G.sel) { hbSel = G.sel; if (G.sel >= 0 && pageOf(G.sel) !== hbPage) flipHotbar(pageOf(G.sel)); } // 고른 칸이 안 보이는 쪽이면 그쪽으로 넘겨요
  hbSig[hbPage] = pageIds(hbPage).join(','); drawFlip();
  $('#bInv').classList.toggle('isfull', G.inv.slice(HOT).every(Boolean)); // v77: 가방이 가득 차면 「가득」 (빨간 점은 새 물건)
}
export let lastHud = '', lastAct = '', hbSel = -1;
// ---- v77: 왼쪽 위 얼굴 (내 캐릭터 그림의 윗부분) ----
let faceOf = null;
function drawFace() { const f = SPR.player && SPR.player.down && SPR.player.down[0]; if (!f || f === faceOf) return; faceOf = f;
  const c = document.createElement('canvas'), w = f.width, h = Math.min(f.height, Math.round(f.width * 15 / 16)); c.width = w; c.height = h; c.getContext('2d').drawImage(f, 0, 0, w, h, 0, 0, w, h); $('#faceImg').src = c.toDataURL(); }
// ---- v77: 캐릭터 빨간 점 = 올릴 수 있는 능력치·스킬 포인트가 새로 생김 (캐릭터 화면을 열면 꺼져요) ----
let ptsSeen = 0;
onEvent('loaded', () => { ptsSeen = 0; faceOf = null; lastHud = lastMp = ''; if (G) resetHotbarPage(); });
let toastY = null;
export function updateHud() { navTick(); // v95: 길 안내 도착

  const p = G.p; const k = Math.round(p.hp) + '|' + Math.round(p.hunger) + '|' + maxHp();
  drawBuffs(); drawEnv(); drawFace();
  if (k !== lastHud) { lastHud = k; const hu = $('#huRing'); hu.style.setProperty('--f', (clamp(p.hunger, 0, 100) / 100).toFixed(3)); hu.classList.toggle('low', p.hunger < 25); hu.title = '배고픔 ' + Math.round(p.hunger); const sf = document.getElementById('shHpFill'); if (sf) { sf.style.width = Math.max(0, p.hp / maxHp() * 100) + '%'; $('#shHpTxt').textContent = Math.round(p.hp); } }
  const a = G.act || { lbl: '', icon: 'dots' }; const ak = a.lbl + a.icon;
  updateCtrlHud(); // v65: attack button · small button
  if (ak !== lastAct) { lastAct = ak; $('#actLbl').textContent = a.lbl; $('#actIcon').src = iconURL(a.icon); }
  const R = G.rpg, pts = (R.pts || 0) + (R.sp || 0);
  if (panel && panel.kind === 'stat') ptsSeen = pts; else if (pts < ptsSeen) ptsSeen = pts;
  const mk2 = R.lv + '|' + R.xp + '|' + (pts > ptsSeen);
  if (mk2 !== lastMp) { lastMp = mk2; $('#lvTxt').textContent = R.lv; $('#xpFill').style.width = (R.lv >= MAX_LV ? 100 : R.xp / XP_NEED(R.lv) * 100) + '%'; $('#face').title = `Lv.${R.lv} · 경험치 ${R.lv >= MAX_LV ? '최고' : R.xp + '/' + XP_NEED(R.lv)}`; for (const id of ['#bStat', '#face']) $(id).classList.toggle('dot', pts > ptsSeen); }
  // 가방 빨간 점 = 처음 얻은 물건 (가방을 열면 꺼져요, 열려 있는 동안 들어온 것도)
  const bn = bagNew(); if (bn && panel && panel.kind === 'inv') runCmd({ k: 'seenBag' }); const bd = bn && !(panel && panel.kind === 'inv'); if ($('#bInv').classList.contains('dot') !== bd) $('#bInv').classList.toggle('dot', bd);
  updateSkBar();
  if (G.time - (G.__qt || 0) > .5 || G.__qt == null) { G.__qt = G.time; $('#goal').classList.toggle('dot', canClaim()); }
  if (invDirty) refreshHotbar();
  const ty = headNoteY(); if (ty != null) { const v = Math.round(clamp(innerHeight - ty, 80, innerHeight - 60)); if (v !== toastY) { toastY = v; $('#toasts').style.setProperty('--toastB', v + 'px'); } } // 알림: 머리 위 막대 살짝 위
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
