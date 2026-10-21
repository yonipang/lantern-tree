// ================= v127 연출 장면(레터박스) — 화면 쪽 (dev/design/연출장면.md, 2026-10-21 사용자 확정) =================
// 장면 진행·맞지 않음·멈춤은 규칙 쪽(sim/cutscene.js). 여기서는 내가 보는 장면을 읽어 보여 줘요:
//   위아래 검은 띠(화면 높이의 약 10%)가 스르륵 들어오고 HUD(조이스틱·버튼·단축칸·오른쪽 위 버튼 …)가 사라져요 — body.cine (style.css)
//   아래 띠 안에 말하는 사람 얼굴 + 자막(한 글자씩), 화면 가운데 이름 띠(보스), 오른쪽 위 [건너뛰기 ▶▶]
// 장면이 시작되면 열린 창은 닫고 건축 모드는 꺼요. 장면 동안 열려던 창(기억 장면 등)은 끝난 뒤에 열어요.
// 누르기·스페이스·엔터·E = 자막 다 보이기 → 다음 · Esc 또는 [건너뛰기] = 건너뛰기 (끝 상태로 + 아직 안 나온 대사 한 줄은 방울로)
import { $ } from '../engine/util.js';
import { NPCS } from '../data/npc.js';
import { onEvent } from '../sim/events.js';
import { runCmd } from '../sim/commands.js';
import { cineMine } from '../sim/cutscene.js';
import { onlyMe } from './feedback.js';
import { closePanel, openPanel, panel } from './panels.js';
import { bmClose } from './build.js';
import { faceURL, pName } from './talk.js';

const CTY_MS = 30; // 자막 한 글자 0.03초
const CUI = { el: null, line: null, start: 0, band: null, raf: 0, defer: [] };
function cineEls() { if (CUI.el) return CUI.el;
  const top = document.createElement('div'); top.id = 'cineTop'; top.setAttribute('aria-hidden', 'true');
  top.innerHTML = '<button type="button" id="cineSkip" aria-label="건너뛰기">건너뛰기 ▶▶</button>';
  const bot = document.createElement('div'); bot.id = 'cineBot'; bot.setAttribute('role', 'status'); bot.setAttribute('aria-live', 'polite');
  bot.innerHTML = '<div class="cl" hidden><img class="px cface" alt=""><div class="ct"><b class="cname"></b><p class="ctx"></p></div></div>';
  const nm = document.createElement('div'); nm.id = 'cineName'; nm.hidden = true; nm.innerHTML = '<span></span>';
  const g = $('#game') || document.body; g.appendChild(top); g.appendChild(bot); g.appendChild(nm);
  return (CUI.el = { top, bot, nm, line: bot.querySelector('.cl'), face: bot.querySelector('.cface'), name: bot.querySelector('.cname'), tx: bot.querySelector('.ctx') }); }
const cineOnUI = () => document.body.classList.contains('cine');
// 장면 시작·끝 (sim/cutscene.js가 보는 사람에게 보내요)
onEvent('cine', onlyMe(isOn => { const E = cineEls();
  if (isOn) { if (panel) closePanel(); bmClose(); document.body.classList.add('cine'); E.top.setAttribute('aria-hidden', 'false'); CUI.line = null; CUI.band = null; E.line.hidden = true; E.nm.hidden = true; if (!CUI.raf) CUI.raf = requestAnimationFrame(cineTick); return; }
  document.body.classList.remove('cine'); E.top.setAttribute('aria-hidden', 'true'); CUI.line = null; CUI.band = null; E.line.hidden = true; E.nm.hidden = true;
  const d = CUI.defer.splice(0); setTimeout(() => { for (const [k, data] of d) if (!panel) openPanel(k, data); }, 50); }));
// 장면 동안 열려던 창은 끝난 뒤에 (ui/panels.js openPanel)
export function cineDefer(kind, data) { if (!cineOnUI() || !cineMine()) return false; CUI.defer.push([kind, data]); return true; }
const cineShown = () => CUI.line ? Math.min(CUI.line.s.length, Math.floor((performance.now() - CUI.start) / CTY_MS)) : 0;
function cineTick() { CUI.raf = 0; if (!cineOnUI()) return; const E = cineEls(), S = cineMine();
  const L = S && S.line; if (L !== CUI.line) { CUI.line = L; CUI.start = performance.now(); if (L) { const me = L.who === 'me';
      E.face.src = faceURL(me ? 'me' : 'npc', 'guide'); E.name.textContent = me ? pName() : NPCS.guide.n; E.line.classList.toggle('me', me); E.line.hidden = false; } else E.line.hidden = true; }
  if (L) { const n = cineShown(); if (E.tx.dataset.n !== String(n) || E.tx.dataset.s !== L.s) { E.tx.dataset.n = n; E.tx.dataset.s = L.s; E.tx.innerHTML = ''; E.tx.append(L.s.slice(0, n)); const h = document.createElement('span'); h.className = 'tyh'; h.textContent = L.s.slice(n); E.tx.append(h); } }
  const B = S && S.band; if (B !== CUI.band) { CUI.band = B; E.nm.hidden = !B; if (B) { E.nm.firstChild.textContent = B.s; E.nm.classList.remove('in'); void E.nm.offsetWidth; E.nm.classList.add('in'); } }
  CUI.raf = requestAnimationFrame(cineTick); }
// 누르기: 자막이 아직 나오는 중이면 다 보이기, 다 나왔으면 다음 칸
export function cineTap() { if (!cineMine()) return; if (CUI.line && cineShown() < CUI.line.s.length) { CUI.start = -1e9; return; } runCmd({ k: 'cineNext' }); }
export function cineSkip() { if (cineMine()) runCmd({ k: 'cineSkip' }); }
// 장면 동안은 게임 조작을 받지 않아요 (조이스틱·버튼이 생기지 않게 먼저 받아요)
window.addEventListener('pointerdown', e => { if (!cineOnUI()) return; e.preventDefault(); e.stopImmediatePropagation(); if (e.target.closest && e.target.closest('#cineSkip')) cineSkip(); else cineTap(); }, true);
for (const k of ['pointerup', 'pointermove', 'touchstart', 'click', 'contextmenu', 'wheel']) window.addEventListener(k, e => { if (cineOnUI() && !(k === 'pointerup')) { e.stopImmediatePropagation(); if (k !== 'wheel' && k !== 'touchstart') e.preventDefault(); } }, { capture: true, passive: false });
window.addEventListener('keydown', e => { if (!cineOnUI()) return; e.preventDefault(); e.stopImmediatePropagation(); if (e.repeat) return;
  if (e.code === 'Escape') cineSkip(); else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') cineTap(); }, true);
export const cineUI = () => ({ on: cineOnUI(), line: CUI.line ? CUI.line.s : null, typed: cineShown(), band: CUI.band ? CUI.band.s : null }); // 테스트용
