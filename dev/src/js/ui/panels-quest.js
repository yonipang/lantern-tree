// ================= v84 퀘스트 창 (UIUX-재설계.md 「퀘스트 화면 안쪽」) =================
// 이야기 탭: 진행 중인 이야기 큰 카드(목표·힌트·진행 막대·보상·활성화·지도에서 보기) + 끝난 이야기는 접힌 목록
// 도전 탭: 받을 수 있는 것 → 진행 중 → 받은 것(접힘), 숫자가 있는 퀘스트는 진행 막대
import { ITEMS } from '../data/items.js';
import { GUIDE, QSIDE } from '../data/quests.js';
import { iconURL } from '../render/icons.js';
import { G } from '../save/state.js';
import { escHTML } from '../save/storage.js';
import { CALL_Q, mainQuest, qProg, qText, questGo, questGoMsg, questState, sideOpen } from '../sim/quests.js';
import { UIS } from './panels.js';
import { askList, isAsk } from '../sim/naru.js';
const rwHTML = q => `<div class="qrw">${q.rw.map(([id, c]) => `<span><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${c}</span>`).join('')}${q.xp ? `<span>경험치 ${q.xp}</span>` : ''}</div>`;
// 진행 막대 (숫자가 있는 퀘스트만)
export function qBarHTML(q) { const pr = qProg(q); if (!pr) return ''; const [a, b] = pr; return `<div class="qbar" role="progressbar" aria-valuenow="${a}" aria-valuemax="${b}"><i style="width:${Math.round(a / b * 100)}%"></i><span>${a} / ${b}</span></div>`; }
const isAct = (q, side) => side ? G.qAct === q.id : (G.qAct || 'main') === 'main';
// 퀘스트 한 장: big = 진행 중인 이야기 카드
function qCardHTML(q, st, side, big) {
  const lock = !side && !st.done && !st.cur, act = !lock && !st.claimed && isAct(q, side) && !(st.done && !side);
  const chip = st.claimed ? '<span class="st done">받음</span>' : st.done ? '<span class="st done">완료</span>' : lock ? '<span class="st lock">잠김</span>' : '<span class="st cur">진행 중</span>';
  if (lock) return `<div class="qrow lock"><span class="st lock">잠김</span><div><h4>???</h4><p>앞의 이야기를 끝내면 열려요</p></div></div>`;
  const live = !st.done || (side && !st.claimed), go = live ? questGo(q) : undefined;
  let btn = '';
  if (st.done && !st.claimed && st.has && !st.nh) btn += `<button type="button" class="btn" data-a="qClaim" data-i="${q.id}">보상 받기</button>`;
  if (live && !(st.done && !side)) btn += act ? `<button type="button" class="btn ghost" data-a="qAct" data-i="none">활성화 해제</button>` : `<button type="button" class="btn ghost" data-a="qAct" data-i="${q.id}">활성화</button>`;
  if (go) btn += `<button type="button" class="btn ghost" data-a="qMap" data-i="${q.id}">지도에서 보기</button>`;
  return `<div class="qcard ${big ? 'big' : ''} ${act ? 'act' : ''}"><div class="qc-top">${chip}${act ? '<span class="st act">활성</span>' : ''}<h4>${escHTML(qText(q))}</h4></div>${!st.done && q.h ? `<p>${GUIDE.includes(q) || isAsk(q) ? '<b style="color:var(--amber)">나루</b> 「' : ''}${escHTML(typeof q.h === 'function' ? q.h() : q.h)}${GUIDE.includes(q) || isAsk(q) ? '」' : ''}</p>` : ''}${!st.claimed ? qBarHTML(q) : ''}${st.has && !st.claimed ? rwHTML(q) : ''}${live && go === null ? `<p class="qmsg">화살표: ${questGoMsg(q)}</p>` : ''}${st.done && !st.claimed && st.nh && st.has ? '<p class="qmsg">보상은 마을의 나루에게 받아요 (머리 위 ?)</p>' : ''}${btn ? `<div class="qbtns">${btn}</div>` : ''}</div>`;
}
const qFold = (a, open, n, label) => `<button type="button" class="lbl fold" data-a="${a}" aria-expanded="${open}">${open ? '▾' : '▸'} ${label} · ${n}개</button>`;
export function questMainHTML() {
  let h = ''; const L = GUIDE.map((q, k) => ({ q, k, st: questState(q, k) }));
  const ready = L.filter(x => x.st.done && !x.st.claimed && x.st.has), cur = L.find(x => x.st.cur), next = L.find(x => x.k === G.guide + 1), done = L.filter(x => x.st.done && !(x.st.has && !x.st.claimed));
  if (ready.length) h += `<div class="lbl">받을 보상</div>` + ready.map(x => qCardHTML(x.q, x.st, false, false)).join('');
  if (mainQuest() === CALL_Q) { // v117 나루가 마을로 부름: 나루와 이야기한 뒤에 다음 이야기가 이어져요
    const go = questGo(CALL_Q), act = (G.qAct || 'main') === 'main';
    h += `<div class="lbl">진행 중인 이야기</div><div class="qcard big ${act ? 'act' : ''}"><div class="qc-top"><span class="st cur">진행 중</span>${act ? '<span class="st act">활성</span>' : ''}<h4>${escHTML(qText(CALL_Q))}</h4></div><p><b style="color:var(--amber)">나루</b> 「${escHTML(CALL_Q.h)}」</p><div class="qbtns">${act ? '<button type="button" class="btn ghost" data-a="qAct" data-i="none">활성화 해제</button>' : '<button type="button" class="btn ghost" data-a="qAct" data-i="main">활성화</button>'}${go ? '<button type="button" class="btn ghost" data-a="qMap" data-i="naruCall">지도에서 보기</button>' : ''}</div></div>`;
    if (cur) h += `<div class="qrow lock"><span class="st lock">다음</span><div><h4>${escHTML(qText(cur.q))}</h4><p>나루와 이야기하면 이어져요</p></div></div>`;
  } else if (cur) h += `<div class="lbl">진행 중인 이야기</div>` + qCardHTML(cur.q, cur.st, false, true);
  if (next && !next.st.done && mainQuest() !== CALL_Q) h += qCardHTML(next.q, next.st, false, false);
  if (done.length) { h += qFold('qDoneFold', !!UIS.qDoneOpen, done.length, '끝난 이야기'); if (UIS.qDoneOpen) h += done.map(x => qCardHTML(x.q, x.st, false, false)).join(''); }
  // v118 나루의 부탁: 방울로 받은 것만, 끝냈으면 마을의 나루에게 (받은 것은 접힘)
  const A = askList().filter(isAsk).map(q => ({ q, st: questState(q) })), aGo = A.filter(x => !x.st.claimed), aGot = A.filter(x => x.st.claimed);
  if (A.length) { h += `<div class="lbl">나루의 부탁</div>` + aGo.map(x => qCardHTML(x.q, x.st, true, false)).join('');
    if (aGot.length) { h += qFold('qAskFold', !!UIS.qAskOpen, aGot.length, '들어준 부탁'); if (UIS.qAskOpen) h += aGot.map(x => qCardHTML(x.q, x.st, true, false)).join(''); } }
  return h;
}
export function questSideHTML() {
  let h = ''; const L = QSIDE.filter(q => !isAsk(q) && sideOpen(q)).map(q => ({ q, st: questState(q) })); // v118: 나루의 부탁은 이야기 탭에 · v125: 열린 장의 도전만
  const ready = L.filter(x => x.st.done && !x.st.claimed && x.st.has), going = L.filter(x => !x.st.done), got = L.filter(x => x.st.done && !(x.st.has && !x.st.claimed));
  if (ready.length) h += `<div class="lbl">받을 수 있는 것</div>` + ready.map(x => qCardHTML(x.q, x.st, true, false)).join('');
  if (going.length) h += `<div class="lbl">진행 중</div>` + going.map(x => qCardHTML(x.q, x.st, true, false)).join('');
  if (got.length) { h += qFold('qGotFold', !!UIS.qGotOpen, got.length, '받은 것'); if (UIS.qGotOpen) h += got.map(x => qCardHTML(x.q, x.st, true, false)).join(''); }
  return h;
}
