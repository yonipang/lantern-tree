// ================= 사건 받아 보여 주기 (구조 변경 6단계) =================
// 규칙이 남긴 사건(emit, sim/events.js)을 받아 소리·알림·반짝임·화면 흔들림·창·HUD로 보여 줘요.
// 규칙 파일은 SFX·toast·puff·ftext를 바로 부르지 않아요 (build.py가 막아요) — 새 효과는 여기에 onEvent로 더하고 규칙에서는 emit.
// 멀티플레이에서 친구 화면은 방장이 보낸 같은 사건으로 여기를 거쳐 보여요.
import { $ } from '../engine/util.js';
import { fxRand } from '../engine/random.js';
import { SFX } from '../engine/audio.js';
import { ftext, puff, toast } from '../engine/effects.js';
import { G, ME, cam } from '../save/state.js';
import { BOSSES } from '../data/rpg-nature.js';
import { PHASE_BOSS } from '../data/deep-survival.js';
import { eventWho, onEvent } from '../sim/events.js';
import { onFrame } from '../sim/systems.js';
import { CHARS, buildPlayer, lookDef } from '../art/characters.js';
import { mapPixel, rebuildMap } from '../render/map.js';
import { BM } from './build.js';
import { closePanel, craftNote, openPanel, panel, renderPanel, UIS } from './panels.js';

// 개인 사건(소리·알림·흔들림·창·기절 화면·보스 막대 …)은 내 플레이어가 남긴 것만 보여요 — 반짝이·떠오르는 글자는 세계에 그려져서 누구 것이든 (8단계)
export const onlyMe = fn => (...a) => { if (eventWho == null || eventWho === ME) return fn(...a); };

// ---- 소리·알림·반짝임 ----
onEvent('sfx', onlyMe(k => SFX[k]()));
onEvent('toast', onlyMe(toast));
onEvent('puff', puff);
onEvent('ftext', ftext);
export function hearts(x, y, n, ch = '♥', col = '#ff8fa3') { for (let k = 0; k < n; k++) G.texts.push({ x: x + (fxRand() - .5) * .9, y: y - .2 - fxRand() * .5, txt: ch, col, life: .8 + fxRand() * .5, vy: -1.2 - fxRand() }); }
onEvent('hearts', hearts);
function splash(x, y, n) { for (let k = 0; k < n; k++) { const a = fxRand() * 6.283; G.parts.push({ x, y, z: .05, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * .6, vz: 2 + fxRand() * 1.5, life: .4, max: .4, col: '#bfe6ff', sz: 1 }); } }
onEvent('splash', splash);
// 물뿌리개 물방울 (x, 떨어지는 바닥 y)
onEvent('drips', (x, y) => { for (let k = 0; k < 8; k++) G.parts.push({ x: x + (fxRand() - .5) * .6, y, z: 1.2, vx: (fxRand() - .5), vy: 0, vz: -1, life: .5, max: .5, col: '#8fd0ff', sz: 1 }); });
// 스프링클러가 사방으로 뿌리는 물
onEvent('spray', (x, y) => { for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; G.parts.push({ x, y, z: 1, vx: Math.cos(a) * 3, vy: Math.sin(a) * 2, vz: 1.5, life: .6, max: .6, col: '#8fd0ff', sz: 1 }); } });
// 왕슬라임이 내려앉을 때 둥글게 튀는 조각
onEvent('slamRing', (x, y) => { for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; G.parts.push({ x: x + Math.cos(a) * 1.2, y: y + Math.sin(a) * .8, z: .1, vx: Math.cos(a) * 5, vy: Math.sin(a) * 3.5, vz: 1, life: .45, max: .45, col: '#c9f0b0', sz: 2 }); } });

// ---- 화면 흔들림: emit('shake', 세기) = 지금보다 세면 그만큼, emit('shake', 세기, true) = 그 세기로 ----
export let shake = 0;
onEvent('shake', onlyMe((v, set) => { shake = set ? v : Math.max(shake, v); }));
onFrame('shake', dt => { shake = Math.max(0, shake - dt); }); // 매 프레임 줄어요 (sim/systems.js)

// ---- 지도·창 ----
onEvent('craftNote', onlyMe((id, n, msg) => craftNote(id, n, msg))); // 제작 알림 (아이콘 + 글)
onEvent('look', onlyMe(() => { CHARS.custom = lookDef(G.look); buildPlayer(G.outfit || 0); })); // 옷·생김새가 바뀜 → 내 캐릭터 그림 다시 만들기
onEvent('reorder', onlyMe(() => { UIS.craftOrder = null; })); // 새 요리를 배움 → 제작 목록 순서를 새로
onEvent('loaded', () => { rebuildMap(); cam.x = G.p.x; cam.y = G.p.y; }); // 새 게임·불러오기 끝
onEvent('tile', (x, y) => mapPixel(x, y)); // 칸이 바뀜 → 지도 그림 한 점 다시
onEvent('open', onlyMe((kind, data) => openPanel(kind, data)));
onEvent('close', onlyMe(() => closePanel()));
onEvent('refresh', onlyMe(kind => { if (panel && panel.kind === kind) renderPanel(); })); // 그 창이 열려 있으면 다시 그리기
// v76: 창을 연 채 체력이 줄면 (맞음·배고픔·더위·추위) 창은 그대로 두고 화면 가장자리를 빨갛게 번쩍 + 창의 체력 막대·닫기 버튼 강조
let hitT = 0;
onEvent('hurt', onlyMe(() => { if (!panel && !BM.on) return; const e = $('#hurtEdge'), sh = $('#sheet'); e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); if (!panel) return; /* v91: 건축 중에도 빨간 번쩍 */ sh.classList.add('hit'); clearTimeout(hitT); hitT = setTimeout(() => sh.classList.remove('hit'), 1500); }));
onEvent('win', onlyMe(kind => setTimeout(() => { SFX.win(); openPanel(kind); }, 1700))); // 등불나무를 다 키움 → 조금 뒤 축하 창 (v103부터는 안 씀)
onEvent('remap', () => rebuildMap()); // v106 기록관을 깨면 지도 다시
onEvent('diary', onlyMe(id => openPanel('diary', { arch: id }))); // v106 일기 창
onEvent('talk', onlyMe((id, kind) => setTimeout(() => openPanel('talk', { npc: id, mode: kind }), kind === 'hello' ? 1200 : 0))); // v104 NPC 대화
onEvent('memory', onlyMe(st => setTimeout(() => { SFX.win(); openPanel('memory', { stage: st }); }, 1700))); // v103: 나무가 깨어나면 기억 장면

// ---- HUD: 기절·잠 화면, 보스 체력 막대, 목표 글 ----
onEvent('fade', onlyMe(mode => { // 'faint' 기절 · 'show' 보이기만 · 'hide' 숨기기 · 'sleep' 잠들기 · 'wake' 깨기
  const f = $('#fade');
  if ((mode === 'faint' || mode === 'show') && panel) closePanel(); // v76: 기절하면 열린 창을 닫아요 (맞을 때는 그대로)
  if (mode === 'faint') { f.textContent = '기절했어요…'; f.hidden = false; }
  else if (mode === 'show') f.hidden = false;
  else if (mode === 'hide') f.hidden = true;
  else if (mode === 'sleep') { f.textContent = '쿨쿨… 좋은 꿈 꾸는 중'; f.classList.add('sleep'); f.hidden = false; }
  else if (mode === 'wake') { f.hidden = true; f.classList.remove('sleep'); f.textContent = '기절했어요…'; }
}));
let bossName = '';
onEvent('bossbar', onlyMe(on => { $('#bossbar').hidden = !on; if (on) bossName = ''; }));
onEvent('bossHp', onlyMe((k, hp, max) => { $('#bossFill').style.width = Math.max(0, hp / max * 100) + '%'; $('#bossbar').classList.toggle('phased', !!PHASE_BOSS[k]); if (bossName !== k) { bossName = k; $('#bossbar .bn').textContent = BOSSES[k].n; } }));
let lastGoalTxt = '';
export function resetGoalText() { lastGoalTxt = ''; } // 새 게임: 목표 글을 다시 써요
onEvent('goal', (txt, tag) => { if (txt !== lastGoalTxt) { $('#goalTxt').textContent = txt; lastGoalTxt = txt; } const t = $('#goalTag'), tg = tag || '퀘스트'; if (t && t.textContent !== tg) t.textContent = tg; }); // v84: 활성 퀘스트 한 줄 + 앞의 작은 글자(이야기·도전)
