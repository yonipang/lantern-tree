// ================= v117 말하는 창: 타이핑 효과 · 빨리감기 · 길잡이 방울 대화창 (dev/design/세계관-NPC.md 「나루 퀘스트라인」·「이어지는 대화 · 길잡이 방울」) =================
// 타이핑: 창 안 [data-type] 글이 한 글자씩 나타나요. 아직 안 나온 글자는 투명하게 그 자리에 있어서 창 크기가 바뀌지 않아요.
//   빨리감기(▶▶)나 창 아무 데나 누르기 = 지금 줄을 바로 다 보이기, 한 번 더 = 다음 줄. PC는 스페이스·엔터도 같아요.
//   대화(나루·NPC)·첫 장면·기억 장면·일기·마지막 장·엔딩 창에 써요. 창이 다시 그려져도 어디까지 나왔는지(panel.ty) 이어 가요.
// 방울 대화창: 화면 아래쪽, 왼쪽에 얼굴, 방울 소리와 함께 타이핑. 창(가방·대화 …)이 열려 있는 동안은 숨었다가 닫으면 이어져요.
//   v121(2026-10-21 사용자 확정): 두 줄 이상 이어지는 대화는 직접 눌러야 다음 줄(타이핑 중 첫 누르기 = 줄 다 보이기, 다음 누르기 = 다음 줄, 마지막 줄 ✓에서 누르면 닫힘).
//   한 줄짜리(상황·하는 중 한마디, 「마을로 와 줄래요?」 같은 부르기)만 읽을 시간 뒤 저절로 사라져요. ✕ = 이 대화 닫기(남은 줄 건너뜀, 끝나면 할 일은 그대로).
import { $, clamp } from '../engine/util.js';
import { SFX } from '../engine/audio.js';
import { CHARS, curChar } from '../art/characters.js';
import { NPCS } from '../data/npc.js';
import { npcImg } from '../art/content.js';
import { G } from '../save/state.js';
import { panel, renderPanel } from './panels.js';
import { runCmd } from '../sim/commands.js';

const TY_MS = 30; // 한 글자에 0.03초
// ---- 주인공 이름 ({이름}) ----
export const pName = () => (G && G.pname) || CHARS[curChar()].n;
export const fillName = s => String(s).replace(/\{이름\}/g, pName());
// 대사 한 줄 → { who: 'npc'|'me', s: 글, ask: 이름 짓기 }
export const lineOf = l => l && typeof l === 'object' ? (l.ask ? { ask: 1, s: '' } : { who: l.me ? 'me' : 'npc', s: fillName(l.s), npc: l.by || null }) /* v119 by: 다른 사람(할머니) */ : { who: 'npc', s: fillName(l == null ? '' : l) };
// ---- 얼굴 그림 ----
const faceCache = {};
export function faceURL(who, npc) { if (who === 'me') { const f = $('#faceImg'); return f && f.src ? f.src : ''; }
  if (faceCache[npc]) return faceCache[npc]; const f = npcImg(npc); if (!f) return '';
  // 지금 NPC 그림의 윗부분(얼굴)을 잘라 임시로 써요 (손그림으로 바꿀 수 있음)
  const c = document.createElement('canvas'), w = f.width, h = Math.min(f.height, Math.round(w * 15 / 16)); c.width = w; c.height = h; c.getContext('2d').drawImage(f, 0, 0, w, h, 0, 0, w, h);
  return (faceCache[npc] = c.toDataURL()); }
// ---- 타이핑 (한 글자씩) ----
// S = { recs: [{ node, full, span }], total, n } — 글자 노드마다 보이는 부분 + 투명한 나머지(span.tyh)
function tyBind(S, el, n) { S.recs = []; S.total = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = []; let t; while ((t = w.nextNode())) nodes.push(t);
  for (const node of nodes) { if (node.parentNode && node.parentNode.classList && node.parentNode.classList.contains('tyh')) continue; const full = node.data; if (!full) continue;
    const span = document.createElement('span'); span.className = 'tyh'; span.setAttribute('aria-hidden', 'true'); node.parentNode.insertBefore(span, node.nextSibling); S.recs.push({ node, full, span }); S.total += full.length; }
  S.n = clamp(n, 0, S.total); tyApply(S); }
function tyApply(S) { let off = 0; for (const r of S.recs) { const k = clamp(S.n - off, 0, r.full.length); r.node.data = r.full.slice(0, k); r.span.textContent = r.full.slice(k); off += r.full.length; } }
// ---- 창(panel) 안 타이핑 ----
const PT = { recs: [], total: 0, n: 0, timer: 0, el: null };
export const typing = () => !!PT.timer;
function ptStop() { if (PT.timer) { clearInterval(PT.timer); PT.timer = 0; } }
function ptDoneUI() { const sh = $('#sheet'); if (!sh) return; for (const b of sh.querySelectorAll('.skipty')) b.hidden = true; }
// renderPanel 끝에서 불러요: 새 줄이면 처음부터, 같은 줄이면 이어서
export function typeSetup(sh) { ptStop(); const el = sh.querySelector('[data-type]'); if (!el || !panel) { PT.el = null; return; }
  const key = panel.kind + '|' + el.dataset.type; if (!panel.ty || panel.ty.key !== key) panel.ty = { key, n: 0 };
  PT.el = el; tyBind(PT, el, panel.ty.n); if (PT.n >= PT.total) { ptDoneUI(); return; }
  let k = 0; PT.timer = setInterval(() => { if (!panel || !panel.ty || PT.el !== el || !el.isConnected) { ptStop(); return; }
    PT.n = Math.min(PT.total, PT.n + 1); panel.ty.n = PT.n; tyApply(PT); if (++k % 3 === 0 && panel.kind === 'talk') SFX.blip();
    if (PT.n >= PT.total) { ptStop(); ptDoneUI(); } }, TY_MS); }
export function typeFinish() { if (!PT.el) return; ptStop(); PT.n = PT.total; if (panel && panel.ty) panel.ty.n = PT.total; tyApply(PT); ptDoneUI(); }
// 대화 창 다음 줄로 (이름 짓기 줄·마지막 줄에서는 안 넘어가요)
export function talkNext() { if (!panel || panel.kind !== 'talk' || panel.mode === 'shop' || !panel.lines) return false; const L = panel.lines, at = panel.at || 0;
  if (at >= L.length - 1 || lineOf(L[at]).ask) return false; panel.at = at + 1; renderPanel(); return true; }
// 창 안을 눌렀을 때 (ui/panel-actions.js onSheetClick 맨 앞): 쓰면 true
export function typeTap(e, b) { if (!panel) return false; const a = b ? b.dataset.a : null;
  if (typing() && (!b || a === 'talkNext' || a === 'skipType')) { typeFinish(); return true; }
  if (a === 'skipType') { talkNext(); return true; }
  if (!b && panel.kind === 'talk' && e.target.closest && e.target.closest('.talk') && !e.target.closest('input')) return talkNext();
  return false; }
// PC: 스페이스·엔터·E = 빨리감기·다음 (ui/input.js, 창이 열려 있을 때)
export function talkKey(e) { if (!panel || !['talk', 'memory', 'diary', 'diaryLast', 'ending'].includes(panel.kind)) return false; if (e.code !== 'Space' && e.code !== 'Enter' && e.code !== 'KeyE') return false;
  e.preventDefault(); if (typing()) { typeFinish(); return true; } talkNext(); return true; }
// 이름 칸: 고친 글을 기억 (창이 다시 그려져도 그대로) · 엔터 = 정했어요
document.addEventListener('input', e => { if (e.target && e.target.id === 'nameIn' && panel) panel.nameDraft = e.target.value; });
document.addEventListener('keydown', e => { const t = e.target; if (!t || (t.id !== 'nameIn' && t.id !== 'profName') || e.key !== 'Enter') return; e.preventDefault(); const b = $(t.id === 'nameIn' ? '#sheet [data-a=nameOk]' : '#sheet [data-a=profName]'); if (b) b.click(); });

// ---- 길잡이 방울 대화창 ----
const BQ = []; // 기다리는 묶음 [{ lines, short }]
let BC = null; // 지금 묶음 { lines, short, at, wait }
const BT = { recs: [], total: 0, n: 0 };
let bellTimer = 0;
function bellEl() { let el = $('#bell'); if (el) return el;
  el = document.createElement('div'); el.id = 'bell'; el.hidden = true; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<img class="px bellface" alt=""><div class="bellt"><b class="bellname"></b><p class="belltx"></p></div><span class="bellnx" aria-hidden="true">▶</span><button type="button" class="bellx" aria-label="대화 닫기">✕</button>';
  el.addEventListener('pointerdown', e => { e.stopPropagation(); }); el.addEventListener('click', e => { e.stopPropagation(); if (e.target.closest && e.target.closest('.bellx')) bellClose(); else bellTap(); });
  document.body.appendChild(el); return el; }
export function bellPush(lines, short, done) { if (!lines || !lines.length) return; BQ.push({ lines: lines.slice(), short: !!short, done: done || null }); if (!BC) bellNext(); } // v118 done: 이 묶음을 다 말하면 보낼 명령 (예: 나루가 먼저 걸어 나가기)
const sheetOpen = () => { const w = $('#sheetWrap'); return !!w && !w.hidden; };
const bellHidden = () => sheetOpen() || document.body.classList.contains('intro') || document.body.classList.contains('cine'); // v127: 연출 장면 동안도 기다려요
function bellNext() { const prev = BC; BC = BQ.shift() || null; if (prev && prev.done) runCmd(prev.done); if (!BC) { bellHide(); return; } BC.at = 0; SFX.bell(); bellShow(); }
function bellShow() { const el = bellEl(), L = lineOf(BC.lines[BC.at]); const who = L.who === 'me' ? 'me' : 'npc';
  el.querySelector('.bellface').src = faceURL(who, 'guide'); el.querySelector('.bellname').textContent = who === 'me' ? pName() : NPCS.guide.n;
  el.classList.toggle('me', who === 'me'); el.classList.toggle('short', BC.short); el.classList.toggle('auto', bellAuto()); const p = el.querySelector('.belltx'); p.textContent = L.s; tyBind(BT, p, 0); BC.wait = 0;
  el.querySelector('.bellnx').hidden = true; el.hidden = bellHidden();
  if (!bellTimer) { let k = 0; bellTimer = setInterval(() => bellTick(++k), TY_MS); } }
function bellHide() { const el = $('#bell'); if (el) el.hidden = true; if (bellTimer) { clearInterval(bellTimer); bellTimer = 0; } }
// v121: 저절로 넘어가는 건 한 줄짜리만 — 상황·하는 중 한마디(short)는 약 3초, 그 밖의 한 줄(부르기 등)은 글 길이만큼(2.2초 + 한 글자 0.06초, 적어도 3초)
const bellAuto = () => !!BC && (BC.short || BC.lines.length === 1);
const holdMs = s => BC.short ? 3000 : Math.max(3000, 2200 + s.length * 60);
// 다 나온 뒤 표시: 이어지는 대화는 ▶(다음 줄)·✓(마지막 줄 — 누르면 닫힘), 저절로 사라지는 한 줄은 표시 없이 읽을 시간 재기
function bellReady(el) { const auto = bellAuto(); BC.wait = auto ? performance.now() + holdMs(BT.recs.map(r => r.full).join('')) : 0; const nx = el.querySelector('.bellnx'); nx.hidden = auto; nx.textContent = BC.at >= BC.lines.length - 1 ? '✓' : '▶'; }
function bellTick(k) { if (!BC) { bellHide(); return; } const el = bellEl(), hide = bellHidden(); if (el.hidden !== hide) el.hidden = hide; if (hide) return; // 창이 열려 있으면 기다려요
  if (BT.n < BT.total) { BT.n++; tyApply(BT); if (k % 3 === 0) SFX.blip(); if (BT.n >= BT.total) bellReady(el); return; }
  if (BC.wait && performance.now() >= BC.wait) bellAdvance(); }
function bellAdvance() { if (!BC) return; if (BC.at < BC.lines.length - 1) { BC.at++; bellShow(); } else bellNext(); }
// 누르기: 타이핑 중이면 바로 다 보이기, 다 나왔으면 다음 줄
export function bellTap() { if (!BC) return; if (BT.n < BT.total) { BT.n = BT.total; tyApply(BT); bellReady(bellEl()); return; } bellAdvance(); }
// ✕: 이 대화를 닫아요 (남은 줄은 건너뛰고, 다 말하면 보낼 명령은 그대로 보내요 — 예: 나루가 먼저 걸어 나가기)
export function bellClose() { if (!BC) return; BC.at = BC.lines.length - 1; bellNext(); }
export const bellState = () => BC ? { lines: BC.lines.map(l => lineOf(l).s), at: BC.at, short: BC.short, queued: BQ.length, auto: bellAuto(), typed: BT.n >= BT.total } : null; // 테스트용
export function bellClear() { BQ.length = 0; BC = null; bellHide(); } // 새 게임·불러오기

// (v118 나루가 먼저 걸어 나가는 모습의 누르기 건너뛰기는 v127부터 연출 장면의 [건너뛰기] — ui/cutscene.js)
