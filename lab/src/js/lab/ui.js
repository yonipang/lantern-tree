// ================= 실험판 L2 화면: 돈·가방 버튼·창(가방·만들기·진열대·장부·대장장이·대화) =================
// 규칙에 바로 손대지 않고 명령을 보내요(runCmd). 규칙이 남긴 사건(open·bag·gold·shelf)을 받아 창을 그려요.
// 창이 열린 동안에도 세계는 계속 움직여요(손님이 오가요) — 내 캐릭터만 제자리(본 게임 v76과 같음).
import { ITEMS } from '../data/items.js';
import { $ } from '../engine/util.js';
import { iconURL } from '../render/icons.js';
import { runCmd } from '../sim/commands.js';
import { onEvent } from '../sim/events.js';
import { G } from '../save/state.js';
import { bagList, countBag, hasAll } from './bag.js';
import { catName, custGap, decorCount, isPlaceable, ledgerPrice, present, sellable, wantedNow } from './shop.js';
import { CUSTOMERS, GOODS, RECIPES_L, SHOP, SMITH_SHOP } from './shopdata.js';
import { actLabel } from './dig.js';
const uiNm = id => (ITEMS[id] && ITEMS[id].n) || id;
const iconTag = id => `<img src="${iconURL(id)}" alt="">`;
let cur = null; // 지금 열린 창 [이름, 값]
export const sheetOpen = () => !!cur;
export function closeSheet() { cur = null; $('#sheetWrap').hidden = true; }
function showSheet(title, body) { $('#sheet').innerHTML = `<div class="sh-head"><h2>${title}</h2><button class="xbtn" type="button" data-x="1" aria-label="닫기">✕</button></div><div class="lab-body">${body}</div>`; $('#sheetWrap').hidden = false; }
export function openSheet(kind, arg) { cur = [kind, arg]; drawSheet(); }
function drawSheet() { if (!cur || !G) return; const [k, a] = cur;
  if (k === 'bag') return showSheet('가방', bagBody());
  if (k === 'craft') return showSheet(`${iconTag('bench')} 작업대`, craftBody());
  if (k === 'shelf') return showSheet(`${iconTag('crateF')} 진열대 ${a + 1}`, shelfBody(a));
  if (k === 'ledger') return showSheet(`${iconTag('desk')} 계산대 · 장부`, ledgerBody());
  if (k === 'smith') return showSheet('대장장이 하람', smithBody());
  if (k === 'talk') return showSheet('대장장이 하람', `<div class="talk">${a.map(l => `<p>${l}</p>`).join('')}</div><div class="row end"><button class="btn" data-x="1" type="button">같이 가요</button></div>`);
}
function bagBody() { const ids = bagList(); if (!ids.length) return '<p class="mut">아직 아무것도 없어요. 벽을 캐거나 뿌리기둥을 베어 봐요.</p>';
  return `<div class="lab-list">${ids.map(id => `<div class="li">${iconTag(id)}<div><b>${uiNm(id)} × ${countBag(id)}</b><small>${sellable(id) ? catName(id) : ''}</small></div>${isPlaceable(id) ? `<button class="btn ghost sm" data-place="${id}" type="button">놓기</button>` : ''}</div>`).join('')}</div>
  <p class="mut">곡괭이: ${uiNm(G.pick)}</p>`; }
function reqHtml(req) { return req.map(([id, n]) => `<span class="${countBag(id) >= n ? '' : 'lack'}">${iconTag(id)}${uiNm(id)} ${countBag(id)}/${n}</span>`).join(''); }
function craftBody() { return `<div class="lab-list">${G.recipes.map(id => { const r = RECIPES_L[id], ok = hasAll(r.req), have = r.tool && G.pick === r.out[0];
  return `<div class="li">${iconTag(r.out[0])}<div><b>${uiNm(r.out[0])}${r.out[1] > 1 ? ' × ' + r.out[1] : ''}</b><small class="req">${reqHtml(r.req)}</small></div><button class="btn sm" data-craft="${id}" type="button" ${ok && !have ? '' : 'disabled'}>${have ? '있음' : '만들기'}</button></div>`; }).join('')}</div>
  ${G.smith.at === 'village' ? '' : '<p class="mut">더 좋은 물건의 레시피는 어딘가의 대장장이가 알고 있을지도…</p>'}`; }
function ledLine(id) { const L = G.ledger[id]; if (!L) return '아직 판 적 없어요'; return [L.ok ? `${L.ok}에 팔림` : '', L.no ? `${L.no}은 비싸대요` : ''].filter(Boolean).join(' · ') || '아직 판 적 없어요'; }
function shelfBody(k) { const s = G.shelves[k];
  if (s.id) { const want = wantedNow(GOODS[s.id].cat);
    return `<div class="li big">${iconTag(s.id)}<div><b>${uiNm(s.id)} × ${s.n}</b><small>${catName(s.id)} · 장부: ${ledLine(s.id)}</small>${want ? '' : '<small class="lack">사 갈 손님이 아직 없어요</small>'}</div></div>
    <div class="price"><button class="btn ghost" data-pd="-1" type="button">−</button><b>${s.price}</b><span class="coin"></span><button class="btn ghost" data-pd="1" type="button">+</button></div>
    <div class="row"><button class="btn ghost" data-take="1" type="button">내리기</button>${countBag(s.id) && s.n < SHOP.shelfMax ? `<button class="btn" data-put="${s.id}" type="button">더 올리기 (+${Math.min(countBag(s.id), SHOP.shelfMax - s.n)})</button>` : ''}</div>`; }
  const ids = bagList().filter(sellable);
  if (!ids.length) return '<p class="mut">팔 물건이 없어요. 캐거나 만든 것을 올려요.</p>';
  return `<p class="mut">올릴 물건을 골라요 (한 칸에 ${SHOP.shelfMax}개까지)</p><div class="lab-list">${ids.map(id => `<div class="li">${iconTag(id)}<div><b>${uiNm(id)} × ${countBag(id)}</b><small>${catName(id)}${wantedNow(GOODS[id].cat) ? '' : ' · <span class="lack">사 갈 손님이 아직 없어요</span>'}${ledgerPrice(id) ? ` · 장부 ${ledgerPrice(id)}` : ''}</small></div><button class="btn sm" data-put="${id}" type="button">올리기</button></div>`).join('')}</div>`; }
function ledgerBody() { const ids = Object.keys(G.ledger);
  const custs = Object.values(CUSTOMERS).filter(t => !t.need || G.cats.includes(t.need)).map(t => t.n).join(' · ');
  return `<div class="stat"><span>번 돈 <b>${G.gold}</b></span><span>판 개수 <b>${G.sold}</b></span><span>꾸미기 <b>${decorCount()}</b></span></div>
  <p class="mut">${present() ? '가게에 있어서 손님이 자주 와요' : '가게를 비워서 손님이 드물게 와요'} (약 ${Math.round(custGap())}초에 한 명) · 오는 손님: ${custs}</p>
  ${ids.length ? `<div class="lab-list">${ids.map(id => `<div class="li">${iconTag(id)}<div><b>${uiNm(id)}</b><small>${ledLine(id)}</small></div></div>`).join('')}</div>` : '<p class="mut">아직 장부가 비어 있어요. 진열대에 물건과 값을 올려 봐요.</p>'}`; }
function smithBody() { return `<p class="mut">「돈만 있으면 내 레시피를 나눠 주지. 만드는 건 작업대에서 해.」</p><div class="lab-list">${SMITH_SHOP.map(([id, price, d]) => { const own = G.recipes.includes(id);
  return `<div class="li">${iconTag(id)}<div><b>${uiNm(id)} 레시피</b><small>${d}</small><small class="req">${reqHtml(RECIPES_L[id].req)}</small></div><button class="btn sm" data-buy="${id}" type="button" ${own || G.gold < price ? 'disabled' : ''}>${own ? '있음' : `${price}<span class="coin"></span>`}</button></div>`; }).join('')}</div>`; }
// ---------- 사건 받기 ----------
onEvent('open', (k, a) => openSheet(k, a));
const refresh = () => { if (cur) drawSheet(); showHud(); };
onEvent('bag', refresh);
onEvent('gold', refresh);
onEvent('shelf', refresh);
export function showHud() { if (!G) return; $('#goldN').textContent = G.gold; $('#torchN').textContent = countBag('torch'); $('#torchBtn').classList.toggle('dim', countBag('torch') <= 0); }
export function setupUi() {
  $('#sheetWrap').addEventListener('click', e => { const b = e.target.closest('[data-x],[data-craft],[data-buy],[data-put],[data-take],[data-pd],[data-place]'); if (!b && e.target.classList.contains('backdrop')) return; if (!b) return; const d = b.dataset;
    if (d.x) return closeSheet();
    if (d.craft) runCmd({ k: 'craft', id: d.craft });
    if (d.buy) runCmd({ k: 'buyRecipe', id: d.buy });
    if (d.put) runCmd({ k: 'shelfPut', s: cur[1], id: d.put, n: SHOP.shelfMax });
    if (d.take) runCmd({ k: 'shelfTake', s: cur[1] });
    if (d.pd) runCmd({ k: 'shelfPrice', s: cur[1], d: +d.pd });
    if (d.place) { runCmd({ k: 'place', id: d.place }); closeSheet(); }
    drawSheet(); });
  $('#bagBtn').addEventListener('pointerdown', e => { e.preventDefault(); if (cur && cur[0] === 'bag') closeSheet(); else openSheet('bag'); });
  window.addEventListener('keydown', e => { if (e.code === 'Escape' && cur) closeSheet(); else if ((e.code === 'KeyB' || e.code === 'KeyI') && !e.repeat && G) { if (cur && cur[0] === 'bag') closeSheet(); else openSheet('bag'); } });
  setInterval(() => { if (!G) return; const l = actLabel(); if ($('#actLbl').textContent !== l) $('#actLbl').textContent = l; }, 150);
}
