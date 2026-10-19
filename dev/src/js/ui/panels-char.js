// ================= v83 가방 창 · 캐릭터 창 (UIUX-재설계.md 「가방 화면 안쪽」·「캐릭터 화면 안쪽」) =================
// 창 위 바깥 탭(가방 | 제작 · 장비 / 스킬 / 등불), 창 안 첫 줄(체력 막대 + 닫기), 장비 세트 I·II·III(창 왼쪽 바깥),
// 장비 탭(3×4 칸 + 가운데 캐릭터), 등불 탭, 가방 칸 위 말풍선과 창 맨 아래 버튼 줄.
import { charPreview, curChar } from '../art/characters.js';
import { TREE_BLESS, TREE_STAGE } from '../art/world.js';
import { ARCHIVES, MEMORY } from '../data/story.js';
import { archList } from '../sim/archive.js';
import { ANIMALS } from '../data/gear-animals.js';
import { FURN_D, HOT, ITEMS, RARITY, SETN } from '../data/items.js';
import { $ } from '../engine/util.js';
import { iconURL } from '../render/icons.js';
import { animalImg } from '../render/parts.js';
import { G } from '../save/state.js';
import { armorDef, armorMul, eqEffect, lvOf, rarOf, rlvOf, rlvOk, SET_N, setPet, upgText } from '../sim/gear.js';
import { BAG_TABS, bagCat, heldTool, isBroken } from '../sim/inventory.js';
import { treeStage } from '../sim/tree.js';
import { slotHTML } from './hud.js';
import { itemStat, panel, sheetHpHTML, UIS } from './panels.js';
import { rarName } from './panels-extra.js';
// ---- 창 위 바깥 탭 · 창 안 첫 줄 ----
export const otabsHTML = (list, on, act) => `<div class="otabs">${list.map(([k, n, ic]) => `<button type="button" class="otab ${on === k ? 'on' : ''}" data-a="${act}" data-i="${k}"><img class="px" src="${iconURL(ic)}" alt="">${n}</button>`).join('')}</div>`;
export const BAG_NAV = [['inv', '가방', 'bag'], ['craft', '제작', 'hammer']];
export const CH_TABS = [['eq', '장비', 'woolHat'], ['sk', '스킬', 'star'], ['lamp', '등불', 'lightSeed']];
// 창 이름은 탭 이름이 대신해서 보이지 않게만 둬요 (화면 읽기·창 구분용)
export const sheetTop = (extra = '', title = '') => `${title ? `<div class="sh-head vh"><h2>${title}</h2></div>` : ''}<div class="sh-top">${sheetHpHTML()}${extra}<button class="xbtn" data-a="close" type="button" aria-label="닫기">✕</button></div>`;
// ---- 장비 탭: 3열 × 4줄, 가운데 2·3줄은 캐릭터 (왼쪽 위부터 시계방향 머리 → 목걸이 → 반지 1 → 반지 2 → 가방 → 펫 → 버프 아이템 → 등불 → 하의 → 상의) ----
// eq: 지금 있는 장비 칸(G.equip), 'pet': 펫, 그 밖은 새 칸(아직 넣을 물건 없음)
export const EQ_CELLS = { head: ['머리', 'head'], neck: ['목걸이', 'neck'], ring: ['반지 1', 'ring'], ring2: ['반지 2'], bag: ['가방'], pet: ['펫', 'pet'], buff: ['버프 아이템'], lamp: ['등불'], legs: ['하의', 'legs'], body: ['상의', 'body'] };
const EQ_GRID = [['head', 'neck', 'ring'], ['body', null, 'ring2'], ['legs', null, 'bag'], ['lamp', 'buff', 'pet']];
export const isNewCell = c => !EQ_CELLS[c] || !EQ_CELLS[c][1];
function cellHTML(c) {
  const [n, sl] = EQ_CELLS[c], on = UIS.chSlot === c ? 'pick' : '';
  if (sl === 'pet') { const k = G.petOn; return `<button type="button" class="slot eqc ${on} ${k ? '' : 'empty'}" data-a="chSlot" data-i="pet" aria-label="펫">${k && animalImg(k) ? `<img class="px" src="${animalImg(k).toDataURL()}" alt="">` : ''}</button>`; }
  if (!sl) return `<button type="button" class="slot eqc empty new0 ${on}" data-a="chSlot" data-i="${c}" aria-label="${n} (아직 넣을 물건 없음)"></button>`;
  const s = G.equip[sl]; return slotHTML(s, 'chSlot', c, 'eqc ' + on + (s ? '' : ' empty'));
}
export function charEqHTML() {
  let h = `<div class="eqgrid">`;
  EQ_GRID.forEach((row, r) => row.forEach((c, k) => { if (c) h += `<div class="eqcell" style="grid-row:${r + 1};grid-column:${k + 1}">${cellHTML(c)}<small>${EQ_CELLS[c][0]}</small></div>`; }));
  h += `<div class="eqme" style="grid-row:2/4;grid-column:2"><img class="px" src="${charPreview(curChar(), 0, 'down')}" alt="내 캐릭터"><small>세트 ${SET_N[G.eqSet || 0]}</small></div></div><div class="eqdef">방어력 ${armorDef()} · 받는 피해 −${Math.round((1 - armorMul()) * 100)}%</div>`;
  const c = UIS.chSlot; if (!c) return h;
  const [n, sl] = EQ_CELLS[c];
  if (!sl) return h + `<div class="detail eqd noimg"><div><h3>${n}</h3><p>아직 넣을 수 있는 물건이 없어요.</p></div></div>`;
  if (sl === 'pet') { const own = Object.keys(ANIMALS).filter(k => ANIMALS[k].pet && (G.pets || {})[k]);
    if (!own.length) return h + `<div class="detail eqd noimg"><div><h3>펫</h3><p>아직 펫이 없어요</p></div></div>`;
    return h + `<div class="lbl">펫 <span style="color:var(--muted)">세트마다 한 마리 · 같은 펫을 여러 세트에 골라도 돼요</span></div><div class="eqlist">${own.map(k => `<div class="eqr"><button type="button" class="slot eq ${G.petOn === k ? 'pick' : ''}" data-a="petOn" data-i="${k}" aria-label="${ANIMALS[k].pn}"><img class="px" src="${animalImg(k).toDataURL()}" alt=""></button><div><b>${ANIMALS[k].n} ${ANIMALS[k].pn}${G.petOn === k ? ' · 함께 다니는 중' : ''}</b><small>${ANIMALS[k].fx}</small></div></div>`).join('')}</div>`; }
  const s = G.equip[sl], it = s && ITEMS[s.id];
  h += `<div class="detail eqd ${s ? '' : 'noimg'}">${s ? `<img class="px" src="${iconURL(s.id)}" alt="">` : ''}<div><h3>${n}${s ? ' · ' + rarName(s.id) + (s.lv ? ` +${s.lv}` : '') : ' · 비어 있어요'}</h3>${s ? `<p>${it.d || ''}</p>${rarOf(s.id) >= 1 ? `<div class="st" style="color:${RARITY[rarOf(s.id)][1]}">★ ${RARITY[rarOf(s.id)][0]} 등급</div>` : ''}<div class="st">${eqEffect(sl, s)}</div>` : ''}</div>${s ? `<div class="btns"><button class="btn ghost" data-a="eqSlot" data-i="${sl}" type="button">벗기</button></div>` : ''}</div>`;
  const cand = G.inv.map((x, i) => ({ x, i })).filter(({ x }) => x && ITEMS[x.id] && ITEMS[x.id].kind === 'wear' && ITEMS[x.id].slot === sl);
  h += `<div class="lbl">가방 속 ${n} 칸 물건</div>`;
  if (!cand.length) h += `<p class="prose" style="color:var(--muted)">가방에 ${n} 칸에 맞는 물건이 없어요</p>`;
  else h += `<div class="list">${cand.map(({ x, i }) => `<div class="rc ok"><div class="ri"><img class="px" src="${iconURL(x.id)}" alt=""></div><div class="rn">${rarName(x.id)}${x.lv ? ` +${x.lv}` : ''}<div class="ings"><span class="ing gain">${upgText(x.id, lvOf(x)) || ITEMS[x.id].d || ''}</span>${s ? `<span class="ing">지금: ${upgText(s.id, lvOf(s)) || ITEMS[s.id].n}</span>` : ''}</div></div><button type="button" class="btn mk" data-a="eqPick" data-i="${i}">${sl === 'body' ? '입기' : '달기'}</button></div>`).join('')}</div>`;
  return h;
}
export const setTabsHTML = () => `<div class="stabs">${SET_N.map((n, k) => `<button type="button" class="stab ${(G.eqSet || 0) === k ? 'on' : ''}" data-a="eqSet" data-i="${k}" aria-label="장비 세트 ${n}${setPet(k) ? ' · 펫 ' + ANIMALS[setPet(k)].pn : ''}">${n}</button>`).join('')}</div>`;
// ---- 등불 탭: 지금 있는 정보만 (등불나무 단계·빛씨앗·효과·다음 목표) ----
export function lampHTML() {
  const st = treeStage(), n = G.treeSeeds | 0, bl = TREE_BLESS(st), max = G.won ? 5 : 3;
  return `<div class="seeds">${[0, 1, 2, 3, 4].map(i => `<div class="${i < n ? 'lit' : ''}"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div>
    <p class="prose" style="text-align:center;color:var(--amber)">등불나무 · ${TREE_STAGE[st]} (${st + 1}/6단계) · 빛씨앗 ${n}/5</p>
    <div class="lbl">지금 받는 효과</div><div class="keys"><b>몬스터</b><span>나무 둘레 ${13 + n * 4}칸 안에는 몬스터가 생기지 않아요</span><b>나무 빛</b><span>반지름 ${7 + n * 3.5}칸</span><b>축복</b><span>${bl ? `나무 둘레 ${bl}칸 안의 작물이 20% 빨리 자라요` : '아직 없어요 (빛씨앗 3개부터)'}</span></div>
    <div class="lbl">다음 목표</div><p class="prose">${n >= 5 ? '다섯 등불이 모두 밝아졌어요. 나무 아래 가장 깊은 곳에서 무언가가 깨어나려 해요…' : `빛씨앗을 하나 더 심으면 ${TREE_STAGE[Math.min(5, st + 1)]} 단계가 되고, 나무가 옛 기억 한 장면을 보여 줘요 (${n}/5)`}</p>
    <div class="lbl">나무의 기억</div><div class="menu-list">${[1, 2, 3, 4, 5].map(k => (G.stats.mem || {})[k] ? `<button type="button" class="btn ghost" data-a="memory" data-i="${k}">${MEMORY[k].t}</button>` : `<button type="button" class="btn ghost" disabled>${k}번째 기억 · ???</button>`).join('')}</div>
    <div class="lbl">등불지기의 일기</div><div class="menu-list">${ARCHIVES.map(A => archList().some(a => a.id === A.id && a.done) ? `<button type="button" class="btn ghost" data-a="diary" data-i="${A.id}">${A.diary.t} · ${A.n}</button>` : `<button type="button" class="btn ghost" disabled>${A.n} · 아직 못 찾음</button>`).join('')}</div>`;
}
// ---- 가방 탭 ----
export const pouchOpen = () => { try { return localStorage.getItem('lantern-tree-pouch') === '1'; } catch (e) { return false; } };
export const setPouchOpen = v => { try { localStorage.setItem('lantern-tree-pouch', v ? '1' : '0'); } catch (e) { } };
export function bagHTML() {
  const tab = UIS.bagTab || 'all', cls = i => { const s0 = G.inv[i]; let c = UIS.invSel === i ? 'pick' : ''; if (s0 && tab !== 'all' && bagCat(s0.id) !== tab) c += ' dim'; if (s0 && (G.seen || {})[s0.id] > 1) c += ' new'; return c; };
  let h = sheetTop(`<button type="button" class="btn sm" data-a="buildMode">건축<i class="k"> &#90;</i></button><button type="button" class="btn ghost sm" data-a="sortBag">정렬</button>`, '가방');
  h += `<div class="invtools"><div class="tabs">${BAG_TABS.map(([id, n]) => `<button type="button" class="tab ${tab === id ? 'on' : ''}" data-a="bagTab" data-i="${id}">${n}</button>`).join('')}</div><button type="button" class="btn ghost sm" data-a="stashNear" title="내 둘레 16칸 안의 상자 중 같은 물건이 있는 상자에 넣어요">상자에 넣기</button></div>`;
  h += `<div class="sh-body"><div class="lbl">가방 · ${G.inv.length - HOT}칸</div><div class="grid">`;
  for (let i = HOT; i < G.inv.length; i++) h += slotHTML(G.inv[i], 'inv', i, cls(i));
  const T = G.tools || [], po = pouchOpen();
  h += `</div><button type="button" class="lbl fold" data-a="pouchFold" aria-expanded="${po}">${po ? '▾' : '▸'} 도구 주머니 · ${T.length}개</button>`;
  if (po) { h += `<div class="grid">`; T.forEach((s, k) => { h += slotHTML(s, 'pouch', k, (UIS.toolSel === k ? 'pick' : '') + (s === heldTool() ? ' sel' : '') + ((G.seen || {})[s.id] > 1 ? ' new' : '')); }); if (!T.length) h += `<p class="prose" style="grid-column:1/-1;color:var(--muted)">아직 도구가 없어요</p>`; h += `</div>`; }
  h += `</div><div class="lbl hotl">단축칸</div><div class="grid hot9">`;
  for (let i = 0; i < HOT; i++) h += slotHTML(G.inv[i], 'inv', i, cls(i));
  h += `</div>` + bagBarHTML();
  const tip = tipHTML(); if (tip) h += `<div id="bagTip" class="btip" role="tooltip">${tip}</div>`;
  return h;
}
// 창 맨 아래 버튼 줄 (고른 칸에 맞는 버튼)
function bagBarHTML() {
  const s = UIS.invSel != null ? G.inv[UIS.invSel] : null, t = UIS.toolSel != null ? (G.tools || [])[UIS.toolSel] : null;
  if (t) return `<div class="bagbar">${isBroken(t) ? '' : `<button class="btn" data-a="holdTool" type="button">${t === heldTool() ? '들고 있어요' : '들기'}</button>`}<button class="btn ${UIS.trash ? 'warn' : 'ghost'}" data-a="trashTool" type="button">${UIS.trash ? '정말 버릴까요?' : '버리기'}</button></div>`;
  if (!s) return `<div class="bagbar"></div>`;
  const it = ITEMS[s.id]; let h = `<div class="bagbar">`;
  if (it.kind === 'food') h += `<button class="btn" data-a="eat" type="button">먹기</button>`;
  if (it.kind === 'wear') h += `<button class="btn" data-a="wearOn" type="button">${it.slot === 'body' ? '입기' : '달기'}</button>`;
  if (UIS.invSel >= HOT) h += `<button class="btn ghost" data-a="tohot" type="button">단축칸으로</button>`;
  return h + `<button class="btn ${UIS.trash ? 'warn' : 'ghost'}" data-a="trash" type="button">${UIS.trash ? '정말 버릴까요?' : '버리기'}</button></div>`;
}
// 칸 위 말풍선 (고른 칸, PC는 마우스를 올린 칸)
export function tipFor(s) { if (!s) return ''; const it = ITEMS[s.id], st = itemStat(it, s), r = rarOf(s.id);
  return `<b>${rarName(s.id)}${s.lv ? ` +${s.lv}` : ''}${s.c > 1 ? ` <span style="color:var(--muted)">× ${s.c}</span>` : ''}</b><p>${it.d || FURN_D}</p>${r >= 0 && (it.kind === 'sword' || it.kind === 'pick' || r >= 1) ? `<div class="st" style="color:${RARITY[Math.max(0, r)][1]}">★ ${RARITY[Math.max(0, r)][0]} 등급</div>` : ''}${st ? `<div class="st">${st}</div>` : ''}${rlvOf(s.id) > 1 ? `<div class="st"${rlvOk(s.id) ? '' : ' style="color:#ff7a6b"'}>착용 레벨 ${rlvOf(s.id)}${rlvOk(s.id) ? '' : ' · 레벨이 모자라요'}</div>` : ''}${it.set ? `<div class="st">${SETN[it.set]}</div>` : ''}`; }
function tipHTML() { const t = UIS.toolSel != null ? (G.tools || [])[UIS.toolSel] : null; return tipFor(t || (UIS.invSel != null ? G.inv[UIS.invSel] : null)); }
// 말풍선을 칸 바로 위에 (자리가 없으면 아래에)
export function placeTip(sh, el) {
  const tip = sh.querySelector('#bagTip'); if (!tip) return;
  el = el || sh.querySelector(UIS.toolSel != null ? `.slot[data-a="pouch"][data-i="${UIS.toolSel}"]` : `.slot[data-a="inv"][data-i="${UIS.invSel}"]`);
  if (!el) { tip.hidden = true; return; } const r = el.getBoundingClientRect(), R = sh.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = r.left + r.width / 2 - tw / 2 - R.left; x = Math.max(4, Math.min(R.width - tw - 4, x));
  let y = r.top - R.top - th - 6; tip.classList.toggle('below', y < 4); if (y < 4) y = r.bottom - R.top + 6;
  tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.hidden = false;
}
// PC: 칸에 마우스를 올리면 말풍선
let hoverOn = false;
export function setupBagHover() { if (hoverOn) return; hoverOn = true; const sh = $('#sheet');
  sh.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse' || !panel || panel.kind !== 'inv') return; const el = e.target.closest && e.target.closest('.slot[data-a="inv"],.slot[data-a="pouch"]'); if (!el) return;
    const i = +el.dataset.i, s = el.dataset.a === 'pouch' ? (G.tools || [])[i] : G.inv[i]; if (!s) return; let tip = sh.querySelector('#bagTip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'bagTip'; tip.className = 'btip'; tip.setAttribute('role', 'tooltip'); sh.appendChild(tip); }
    tip.innerHTML = tipFor(s); tip.dataset.hover = '1'; placeTip(sh, el); });
  sh.addEventListener('pointerout', e => { if (e.pointerType !== 'mouse') return; const tip = sh.querySelector('#bagTip'); if (!tip || !tip.dataset.hover) return; const to = e.relatedTarget; if (to && to.closest && to.closest('.slot[data-a="inv"],.slot[data-a="pouch"]')) return;
    if (UIS.invSel == null && UIS.toolSel == null) tip.remove(); else { tip.innerHTML = tipHTML(); delete tip.dataset.hover; placeTip(sh); } });
}
