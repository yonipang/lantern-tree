// ================= 캐릭터 고르기·시작하기(beginPlay) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// ---- character picker (title + menu) ----
import { CHAR_IDS, charPreview, CHARS } from '../art/characters.js';
import { GUIDE } from '../data/quests.js';
import { $ } from '../engine/util.js';
import { G, noteInput, setPaused, setStarted } from '../save/state.js';
import { saveLocal } from '../save/storage.js';
import { checkGuide } from '../sim/quests.js';
import { resetGoalText } from './feedback.js';
import { idx } from '../world/map.js';
import { markLight } from '../sim/loop.js';
import { markInv } from './hud.js';
export let pickSel = 'sprout', pickAnim = 0;
export const setPickSel = v => { pickSel = v; };
export function cpCards(sel) { return CHAR_IDS.map(id => `<button type="button" class="cp-card ${id === sel ? 'on' : ''}" data-c="${id}" data-a="charSet" data-i="${id}"><img class="px" src="${charPreview(id)}" alt=""><span>${id === 'custom' ? '직접 꾸미기' : CHARS[id].n}</span></button>`).join(''); }
export function animPick(root) { clearInterval(pickAnim); let f = 0; pickAnim = setInterval(() => { const im = root && root.querySelector('.cp-card.on img'); if (!im || !im.isConnected) { clearInterval(pickAnim); return; } f ^= 1; im.src = charPreview(im.parentElement.dataset.c, f); }, 320); }
export function showPicker() { pickSel = 'sprout'; $('#title').classList.add('picking'); $('#charPick').hidden = false; renderPicker(); }
export function renderPicker() { $('#cpGrid').innerHTML = cpCards(pickSel); $('#cpDesc').textContent = CHARS[pickSel].d; animPick($('#cpGrid')); }
export function hidePicker() { $('#title').classList.remove('picking'); $('#charPick').hidden = true; clearInterval(pickAnim); }
export function beginPlay() { const ca = $('#cloudAsk'); if (ca) ca.hidden = true; { const bc = $('#btnCloud'), ct = $('#cloudTitle'); if (bc) bc.hidden = true; if (ct) ct.hidden = true; } $('#title').hidden = true; document.body.classList.remove('intro'); setStarted(true); setPaused(false); markInv(); resetGoalText(); noteInput(); G.qt = G.qt || {}; { let n = 0; while (G.guide < GUIDE.length - 1 && GUIDE[G.guide].done() && n < 40) { G.guide++; n++; } } checkGuide(); G.biomeNow = G.biome[idx(Math.floor(G.p.x), Math.floor(G.p.y))]; markLight(); saveLocal(true); }
