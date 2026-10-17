// ================= 창 HTML 조각: 희귀도 이름, 강화 목록, 시간 작업 카드, 포획·펫·장비·지역 재료·작업대 올리기·도구 주머니 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { BENCH_MAX, BENCH_UP, TIER_IT } from '../data/automation-tiers.js';
import { REGION_MAT } from '../data/deep-survival.js';
import { TIMED } from '../data/farming-cooking.js';
import { ANIMALS, EQ_SLOTS, UPG_MAX } from '../data/gear-animals.js';
import { BIOME, ITEMS } from '../data/items.js';
import { $, clamp } from '../engine/util.js';
import { animalImg } from '../render/parts.js';
import { G } from '../save/state.js';
import { catchAng, inZone } from '../sim/animals.js';
import { benchLv, fmtT, jobDone, jobLeft, nowS, tierNames } from '../sim/crafting.js';
import { eqEffect, lvOf, rarCol, SET_N, upgCost, upgOk, upgText } from '../sim/gear.js';
import { availCount, heldTool, isBroken, slotList } from '../sim/inventory.js';
import { slotHTML } from './hud.js';
import { head, itemStat, panel, UIS } from './panels.js';
export const rarName = id => { const c = rarCol(id), n = ITEMS[id].n; return c ? `<span style="color:${c}">${n}</span>` : n; };
// v83: 다른 장비 세트에 넣어 둔 장비 (강화·수리에서 보여요, 분해에서는 안 보여요)
export const otherSetSlots = () => (G.eqSets || []).flatMap((x, k) => k === (G.eqSet || 0) || !x || !x.e ? [] : EQ_SLOTS.map(([sl, n]) => ({ s: x.e[sl], i: `s:${k}:${sl}`, tag: `세트 ${SET_N[k]} · ${n}` })).filter(o => o.s));
export function upgListHTML(ok) {
  const list = [...EQ_SLOTS.map(([sl, n]) => ({ s: G.equip[sl], i: 'e:' + sl, tag: n + ' 칸' })), ...otherSetSlots(), ...slotList().map(x => ({ ...x, tag: typeof x.i === 'string' ? '도구' : '' }))].filter(({ s }) => s && upgOk(s.id));
  let h = `<div class="sh-body"><p class="hint">${ok ? `재료를 넣어 장비를 강화해요 (최대 +${UPG_MAX}). 무기는 공격력, 곡괭이는 캐는 힘, 옷·장신구·반지는 효과가 좋아져요.` : '장비제작대 근처에서 강화할 수 있어요.'}</p><div class="list">`;
  if (!list.length) h += `<p class="prose" style="color:var(--muted);text-align:center;margin-top:14px">강화할 장비가 없어요</p>`;
  for (const { s, i, tag } of list) { const lv = lvOf(s), max = lv >= UPG_MAX, cost = max ? [] : upgCost(s.id, lv), can = ok && !max && cost.every(([id, c]) => availCount(id) >= c);
    h += `<div class="rc ${can ? 'ok' : 'no'}"><div class="ri"><img class="px" src="${iconURL(s.id)}" alt=""></div><div class="rn">${rarName(s.id)}${lv ? ` +${lv}` : ''}${tag ? `<small>${tag}</small>` : ''}<div class="ings"><span class="ing">${upgText(s.id, lv)}${max ? ' · 최고 단계' : ` → ${upgText(s.id, lv + 1)}`}</span>${cost.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c}</span>`; }).join('')}</div></div><button type="button" class="btn mk" data-a="upg" data-i="${i}" ${can ? '' : 'disabled'}>${max ? '최고' : `+${lv + 1}`}</button></div>`; }
  return h + `</div></div>`; }
export function jobHTML(o) { const j = o.job; if (!j) return ''; const d = jobDone(j), it = ITEMS[j.out], prog = clamp((nowS() - j.t0) / (j.q * j.per), 0, 1);
  return `<div class="rc ok jobcard" data-done="${d}"><div class="ri"><img class="px" src="${iconURL(j.out)}" alt=""></div><div class="rn">${it.n} ${j.q * j.n}개 ${d >= j.q ? '· 다 됐어요!' : TIMED && o.t === 'furnace' ? '녹이는 중' : '만드는 중'}<div class="fixbar" style="max-width:none"><i id="jobBar" style="width:${Math.round(prog * 100)}%"></i></div><div class="ings"><span class="ing" id="jobTxt">${d}/${j.q} 완료${d < j.q ? ` · 남은 시간 ${fmtT(jobLeft(j))}` : ''}</span></div></div>
    <div class="btns" style="grid-column:auto;flex-direction:column"><button type="button" class="btn mk" data-a="jobTake" ${d ? '' : 'disabled'}>꺼내기${d ? ` ${d * j.n}` : ''}</button><button type="button" class="btn ghost mk ${UIS.jobAsk ? 'warn' : ''}" data-a="jobCancel">${UIS.jobAsk ? '정말?' : '취소'}</button></div></div>`; }
export function catchLoop() { if (!panel || panel.kind !== 'catch') return; const cv2 = $('#catchCv'); if (cv2) { const g = cv2.getContext('2d'), c = panel, R = 86, cx = 110, cy = 110, a = catchAng(c);
    g.clearRect(0, 0, 220, 220); g.lineWidth = 14; g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.stroke();
    g.strokeStyle = '#7fe0b5'; g.beginPath(); g.arc(cx, cy, R, c.za - c.zw / 2, c.za + c.zw / 2); g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#d9b66a'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)); g.stroke();
    g.fillStyle = inZone(a, c) ? '#7fe0b5' : '#ffd25c'; g.beginPath(); g.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 11, 0, 6.283); g.fill();
    const im = animalImg(c.w.k); if (im) { g.imageSmoothingEnabled = false; g.drawImage(im, cx - 32, cy - 32, 64, 64); } }
  requestAnimationFrame(catchLoop); }
export function catchHTML() { const c = panel, W2 = ANIMALS[c.w.k]; return head(`${W2.n} 포획`, 'lasso') + `<div class="sh-body" style="text-align:center"><p class="hint">빙글빙글 도는 밧줄이 <b style="color:#7fe0b5">초록 구간</b>에 왔을 때 던져요. 세 번 성공하면 친구가 되고, 두 번 놓치면 도망가요.</p>
  <canvas id="catchCv" width="220" height="220" style="width:176px;height:176px;margin:4px auto;display:block"></canvas><p class="prose">성공 ${'●'.repeat(c.hits)}${'○'.repeat(3 - c.hits)} · 실패 ${'✕'.repeat(c.miss)}${'·'.repeat(2 - c.miss)}</p>
  <button type="button" class="btn" data-a="catchThrow" style="min-height:52px;font-size:16px;width:100%">던지기!</button></div>`; }
export function petHTML() { const own = Object.keys(ANIMALS).filter(k => ANIMALS[k].pet && (G.pets || {})[k]);
  if (!own.length) return `<div class="lbl">펫</div><p class="prose" style="color:var(--muted)">아직 펫이 없어요 · 올가미 밧줄(작업대)을 들고 강아지(이끼 동굴)·토끼(버섯숲)·고양이(수정 동굴)에게 다가가 포획해요</p>`;
  return `<div class="lbl">펫 <span style="color:var(--muted);font-size:16px">한 마리만 함께 다녀요</span></div><div class="eqlist">${own.map(k => `<div class="eqr"><button type="button" class="slot eq ${G.petOn === k ? 'pick' : ''}" data-a="petOn" data-i="${k}" aria-label="${ANIMALS[k].pn}"><img class="px" src="${animalImg(k).toDataURL()}" alt=""></button><div><b>${ANIMALS[k].n} ${ANIMALS[k].pn}${G.petOn === k ? ' · 함께 다니는 중' : ''}</b><small>${ANIMALS[k].fx}</small></div></div>`).join('')}</div>`; }
export function regionMatHTML() { const seen = new Set(); for (let i = 0; i < G.explored.length; i++) if (G.explored[i]) seen.add(G.biome[i]);
  return `<div class="lbl">지역 재료</div><div class="rmat">${REGION_MAT.map((m, b) => `<div><b>${seen.has(b) ? BIOME[b] : '???'}</b>${seen.has(b) ? ['지형', '광물', '고유'].map((t, k) => `<span><img class="px" src="${iconURL(m[k])}" alt="">${t} · ${ITEMS[m[k]].n}</span>`).join('') : '<span>아직 가 보지 않은 곳</span>'}</div>`).join('')}</div>`; }
// v48: the equipment rows sit at the top of the bag (no separate menu); pets at the bottom
export function eqRowHTML() {
  let h = `<div class="lbl">장비 <span style="color:var(--muted);font-size:16px">칸을 누르면 벗어요 · 가방에서 옷·장신구를 고르고 [입기]·[달기]</span></div><div class="eqlist eq2">`;
  for (const [sl, n] of EQ_SLOTS) { const s = G.equip[sl];
    h += `<div class="eqr">${slotHTML(s, 'eqSlot', sl, 'eq' + (s ? '' : ' empty')).replace(/<\/button>$/, s ? '</button>' : `<span>${{ head: '머리', neck: '목' }[sl] || n}</span></button>`)}<div><b>${n}${s ? ' · ' + rarName(s.id) + (s.lv ? ` +${s.lv}` : '') : ''}</b><small>${eqEffect(sl, s)}</small></div></div>`; }
  return h + `</div>`; }
export function benchUpHTML(o) { const lv = benchLv(o); if (lv < 0) return ''; const st = o.t === 'smelter' ? 'smelter' : 'bench', NM = tierNames(st), IT = TIER_IT[st];
  if (lv >= BENCH_MAX) return `<p class="hint">가장 높은 단계 ${st === 'smelter' ? '장비제작대' : '작업대'}예요 · 모든 ${st === 'smelter' ? '장비' : '작업대 물건'}를 만들 수 있어요</p>`;
  const cost = BENCH_UP[lv + 1], ok = cost.every(([id, c]) => availCount(id) >= c);
  return `<div class="rc ${ok ? 'ok' : 'no'} benchup" style="margin-bottom:8px"><div class="ri"><img class="px" src="${iconURL(IT[lv + 1])}" alt=""></div><div class="rn">${NM[lv + 1]}로 올리기<small>새 ${st === 'smelter' ? '장비가' : '물건이'} 더 생겨요</small><div class="ings">${cost.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c}</span>`; }).join('')}</div></div><button type="button" class="btn mk" data-a="benchUp" ${ok ? '' : 'disabled'}>올리기</button></div>`; }
// ---- the tool pouch in the bag window ----
export function pouchHTML() { const T = G.tools || []; let h = `<div class="lbl">도구 주머니 · ${T.length}개 <span style="color:var(--muted)">(가방 칸을 차지하지 않아요 · 단축칸 맨 앞 도구 칸에서 골라 들어요)</span></div><div class="grid">`;
  T.forEach((s, k) => { h += slotHTML(s, 'pouch', k, (UIS.toolSel === k ? 'pick' : '') + (s === heldTool() ? ' sel' : '') + ((G.seen || {})[s.id] > 1 ? ' new' : '')); }); // v77: 처음 얻은 도구
  if (!T.length) h += `<p class="prose" style="grid-column:1/-1;color:var(--muted);font-size:16px">아직 도구가 없어요</p>`;
  h += `</div>`; const s = UIS.toolSel != null ? T[UIS.toolSel] : null;
  if (s) { const it = ITEMS[s.id], st = itemStat(it, s); h += `<div class="detail"><img class="px" src="${iconURL(s.id)}" alt=""><div><h3>${rarName(s.id)}${s.lv ? ` +${s.lv}` : ''}</h3><p>${it.d || ''}</p>${st ? `<div class="st">${st}</div>` : ''}</div><div class="btns">${isBroken(s) ? '' : `<button class="btn" data-a="holdTool" type="button">${s === heldTool() ? '들고 있어요' : '들기'}</button>`}<button class="btn ${UIS.trash ? 'warn' : 'ghost'}" data-a="trashTool" type="button">${UIS.trash ? '정말 버릴까요?' : '버리기'}</button></div></div>`; }
  return h; }
