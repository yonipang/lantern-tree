// ================= UI =================
import { GLST, lightPref } from '../render/glight.js';
import { CHARS, cleanLook, curChar, EYEC, HAIRC, HAIRS, HATS, lookDef, OUTC, OUTFITS2 } from '../art/characters.js';
import { TREE_BLESS, TREE_STAGE } from '../art/world.js';
import { ARCHIVES, DEEP_DIARY, ENDING, MEMORY } from '../data/story.js';
import { NPCS } from '../data/npc.js';
import { barterLeft, barterWhy, talkLines, villagers } from '../sim/npc.js';
import { BARTER, BARTER_PER } from '../data/npc.js';
import { countItem } from '../sim/inventory.js';
import { npcImg } from '../art/content.js';
import { TIERED } from '../data/automation-tiers.js';
import { DUR } from '../data/circuits-regions.js';
import { DISH, JOB_MAX, TIMED, WCAN_MAX } from '../data/farming-cooking.js';
import { EQ_N } from '../data/gear-animals.js';
import { BAG_MAX_LV, FURN_D, FXN, HOT, ITEMS, OBJ, RARITY, RECIPES, SETN, STN } from '../data/items.js';
import { GUIDE, QSIDE } from '../data/quests.js';
import { MAX_LV, SK_CAT, SKILLS, STATN, XP_NEED } from '../data/rpg-nature.js';
import { C } from '../engine/canvas.js';
import { $, clamp, josa } from '../engine/util.js';
import { G, setPaused, soundOn, started } from '../save/state.js';
import { canDev, clearImport, cloudMenuHTML, cloudPendingHTML, escHTML, importFrom, pendingImp, playRecordHTML } from '../save/storage.js';
import { bestArrow } from '../sim/combat.js';
import { runCmd } from '../sim/commands.js';
import { nextStory } from '../sim/naru.js';
import { buffText, knows, noteHint } from '../sim/cooking.js';
import { atHere, canSalv, craftable, fmtT, isMulti, jobTime, maxCraft, nearStations, repairCost, salvGet2, stationTier } from '../sim/crafting.js';
import { recipeOn } from '../sim/farming.js';
import { lvOf, rarOf, upgOk, upgText, wtOf } from '../sim/gear.js';
import { availCount, BAG_TABS, bagCat, countItem, durOf, isBroken, linkedChests, resetPool, slotList } from '../sim/inventory.js';
import { atkSpd, magicMul, maxHp, maxMp, meleeMul, moveMul, rangeMul } from '../sim/player.js';
import { dirText, qText, questState } from '../sim/quests.js';
import { treeStage } from '../sim/tree.js';
import { slotHTML } from './hud.js';
import { FEED, FEED_SLOTS } from '../data/beaver.js';
import { feedSec } from '../sim/beaver.js';
import { joyEnd, keys, mouse, releaseHeld } from './input.js';
import { drawMap, mapIsAll, mapLegendHTML, navBarHTML } from './map.js';
import { benchUpHTML, catchHTML, jobHTML, otherSetSlots, rarName, regionMatHTML, sieveHTML, upgListHTML } from './panels-extra.js';
import { cpCards } from './picker.js';
import { questMainHTML, questSideHTML } from './panels-quest.js';
import { BAG_NAV, bagHTML, CH_TABS, charEqHTML, lampHTML, otabsHTML, placeTip, setTabsHTML, setupBagHover, sheetTop } from './panels-char.js';
import { LAY, W } from '../world/map.js';
import { WARP_DELAY } from '../data/warp.js';
import { bmClose } from './build.js';
import { helpHTML } from './help.js';
import { faceURL, lineOf, pName, typeSetup } from './talk.js';
import { warpAt, warpDests, warpName } from '../sim/warp.js';
export const UIS = { invSel: null, tab: 'all', trash: false, confirmNew: false, qty: {}, craftOrder: null };
export let panel = null, panelAt = 0;
export function openPanel(kind, data = {}) { bmClose(); /* v91: 창을 열면 건축 끝 */ if (kind === 'equip') { kind = 'stat'; data = { ...data, tab: 'eq' }; } /* v83: 장비는 캐릭터 창 */ if (kind === 'craft' && data.st === 'forge') data = { ...data, st: 'bench', tier: 1 }; /* v60 */ /* v48: the equipment lives in the bag again */ if (kind === 'inv' && G) { runCmd({ k: 'seenBag' }); } if (kind === 'map') { UIS.mapFocus = data.focus || null; UIS.mapWarp = data.warp != null ? data.warp : null; UIS.warpSel = null; UIS.mapV = null; UIS.mapPin = null; } /* v89: 워프포인트·포탈에서 열면 목적지 고르기 */ /* v84: 퀘스트 「지도에서 보기」 */ if (kind === 'profile') UIS.nameEdit = false; /* v117 */ if (kind === 'stat') { UIS.chTab = data.sk ? 'sk' : data.tab || 'eq'; UIS.chSlot = null; } /* v83 */ /* v77: 가방을 열면 가방 버튼의 빨간 점이 꺼져요 */ if (importFrom === 'menu') clearImport(); $('#sheet').dataset.key = ''; UIS.craftOrder = null; UIS.qty = {}; UIS.salvAsk = null; UIS.statAsk = false; UIS.skAsk = false; if (kind === 'look') { UIS.look = cleanLook(G.look); UIS.lookTab = data.tab || UIS.lookTab || 'hair'; } panel = { kind, ...data }; if (!data.nav) panelAt = performance.now(); /* v77: 가방 ↔ 제작 탭은 바로 누를 수 있게 */ UIS.invSel = null; UIS.toolSel = null; UIS.trash = false; UIS.confirmNew = false; UIS.confirmEsc = false; if (kind === 'craft') { UIS.tab = 'all'; UIS.tab2 = 'all'; } /* 'here' was never a tab: the first re-render changed the panel key and jumped the list back to the top */ $('#sheetWrap').hidden = false; setPaused(!started); /* v76: the world keeps going while a window is open */ releaseHeld(); runCmd({ k: 'tap', b: 'act', t: 0 }); mouse.down = false; keys.clear(); joyEnd(); renderPanel(); }
// v76: 창을 열어도 세계가 계속 가니까, 창 맨 위에 체력 막대를 늘 보여요 (값은 ui/hud.js updateHud가 고쳐요)
export function sheetHpHTML() { if (!G || !started || !panel || panel.kind !== 'stat') return ''; /* v111: 창 맨 위 체력 막대는 캐릭터 창에만 */ const p = G.p, m = maxHp(); return `<div class="bar hp sh-hp" title="체력"><img class="px" src="${iconURL('heart')}" alt="체력"><div class="track"><div class="fill" id="shHpFill" style="width:${Math.max(0, p.hp / m * 100)}%"></div></div><span id="shHpTxt">${Math.round(p.hp)}</span></div>`; }
export function closePanel() { const was = panel; panel = null; $('#sheetWrap').hidden = true; $('#sheet').classList.remove('hit'); setPaused(!started); keys.clear(); releaseHeld(); mouse.down = false; runCmd({ k: 'tap', b: 'act', t: 0 }); refocusGame();
  if (was && G && started) { if (was.kind === 'talk' && was.npc === 'guide') runCmd({ k: 'talkEnd', m: was.mode, at: was.at || 0, n: was.lines ? was.lines.length : 0 }); /* v120 at·n: 첫 장면을 중간에 닫으면 다음에 거기서 이어서 */ else if (was.kind === 'memory') runCmd({ k: 'memEnd' }); } } // v119 나루 장면이 끝나면 먼저 걸어 나가기·엔딩 창, 기억 장면 뒤 쌓인 장면
// hand keyboard focus back to the game (a focused button/field inside a closed panel, or focus that slipped out of the page frame, would swallow WASD)
export function refocusGame() { const ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); try { window.focus(); } catch (_) { } }
// v77: 가방 창 위 탭 「가방 | 제작」 — 손제작은 가방 안에서 (제작대 창은 그대로)
export const bagNavHTML = on => `<div class="tabs bagnav">${[['inv', '가방', 'bag'], ['craft', '제작', 'hammer']].map(([k, n, ic]) => `<button type="button" class="tab ${on === k ? 'on' : ''}" data-a="bagNav" data-i="${k}"><img class="px" src="${iconURL(ic)}" alt="">${n}</button>`).join('')}</div>`;
export function head(title, icon, extra = '') { return `<div class="sh-head"><h2>${icon ? `<img class="px" src="${iconURL(icon)}" alt="">` : ''}${title}</h2><div style="display:flex;gap:6px;align-items:center">${extra}<button class="xbtn" data-a="close" type="button" aria-label="닫기">✕</button></div></div>`; }
export function itemStat(it, s) { const up = s && lvOf(s) && upgOk(s.id) ? `<br>강화 +${s.lv} · ${upgText(s.id, s.lv)}` : ''; return itemStat1(it, s) + up + (s && it.kind === 'sword' && wtOf(it).ranged === 'arrow' ? arrowInfo() : ''); }
export const arrowInfo = () => { const k = bestArrow(); return k >= 0 ? `<br>화살: ${ITEMS[G.inv[k].id].n} ${countItem(G.inv[k].id)}개 · 좋은 화살부터 써요` : '<br>화살: 나무 화살 · 광물 화살을 만들어 가방에 넣으면 더 세져요'; };
export function itemStat1(it, s) { if (s && s.id === 'wcan') return `물 ${s.w || 0}/${WCAN_MAX}`; const du = s && DUR[s.id] ? ` · 내구도 ${durOf(s)}/${DUR[s.id][0]}${isBroken(s) ? ' (망가짐)' : ''}` : ''; return itemStat0(it) + (itemStat0(it) ? du : du.slice(3)); }
export function itemStat0(it) { if (it.kind === 'wear') return EQ_N[it.slot] + ' 칸' + (it.def ? ` · 방어력 ${it.def}` : ''); if (it.kind === 'arrow') { const a = it.arw; return `화살 · 활 공격력 ×${a.mul}${a.pierce ? ' · 적 하나를 꿰뚫어요' : ''}${a.fx ? `<br>✦ ${FXN[a.fx]}` : ''}`; } if (it.kind === 'food') return `포만감 +${it.food}${it.heal ? ` · 체력 +${it.heal}` : ''}${it.buff ? `<br>✦ ${buffText(it)}` : ''}`; if (it.kind === 'sword') { const W = wtOf(it); return `${W.n} · 공격력 ${it.dmg}${W.ranged ? ' · 원거리' : ''}${W.mp ? ` · 한 발에 기력 ${W.mp}` : ''}${W.chop ? ` · 나무 베기 ×${W.chop}` : ''}${it.fx ? `<br>✦ ${FXN[it.fx]}` : ''}`; } if (it.kind === 'pick') return `캐는 힘 ${it.power} · ${['흙벽', '돌벽', '화강암 벽·석영 광맥', '현무암·얼음벽'][it.tier]}까지`; if (it.kind === 'axe') return `도구 · 나무 베는 힘 ${it.power}`; return ''; }
// v62: the workbench window — 1st row 전체/재료/도구/제작대/가구/건축/편의 (icons), 2nd row per tab. Hand recipes can be made at the workbench too
export const BT1 = [['all', '전체', 'hammer'], ['mat', '재료', 'rope'], ['tool', '도구', 'bagUp1'], ['stn', '제작대', 'bench'], ['furn', '가구', 'chair'], ['build', '건축', 'wallBrick'], ['conv', '편의', 'lever']];
export const BT2 = { stn: [['all', '전체'], ['make', '제작'], ['smelt', '제련'], ['cook', '요리']],
  furn: [['all', '전체'], ['seat', '의자'], ['table', '탁자'], ['bed', '침대'], ['store', '수납'], ['light', '조명'], ['deco', '장식']],
  build: [['all', '전체'], ['wall', '벽'], ['floor', '바닥'], ['fence', '울타리'], ['door', '문'], ['nature', '자연']], // v69: thin walls, pillars and windows were removed
  conv: [['all', '전체'], ['circuit', '회로'], ['farm', '농사'], ['mine', '채굴기']] };
export const FURN2 = { seat: 'chair sofa2 logBench stoneBench cushion ironChair cryChair mossSofa stumpStool shroomStool', table: 'table longTable kitchenSet cryTable shroomTable', bed: 'bed bedDouble mossBed', store: 'chest shelf bookcase2 woodCrate strawBasket shroomWardrobe woodWardrobe', light: 'torch lampShroom lampCrystal copperLamp stoneLantern sproutLamp sporeLamp' };
export const FURN2_OF = {}; for (const k in FURN2) for (const id of FURN2[k].split(' ')) FURN2_OF[id] = k;
export function bcat(r) { if (r._bc) return r._bc; const id = r.out, it = ITEMS[id] || {}, o = OBJ[it.obj] || {}, c = r.cat; let t;
  if (o.station) t = ['stn', o.station === 'furnace' ? 'smelt' : o.station === 'pot' ? 'cook' : 'make'];
  else if (c === 'mat') t = ['mat'];
  else if (c === 'tool') t = ['tool'];
  else if (c === 'circuit' || c === 'farm' || c === 'mine') t = ['conv', c];
  else if (c === 'nature') t = ['build', 'nature'];
  else if (it.kind === 'floor' || it.kind === 'ground') t = ['build', 'floor'];
  else if (c === 'build' && !FURN2_OF[id]) t = ['build', /Fence/.test(id) ? 'fence' : /Pillar/.test(id) ? 'pillar' : /Door/.test(id) ? 'door' : /Frame|Win/.test(id) ? 'win' : 'wall'];
  else t = ['furn', FURN2_OF[id] || 'deco'];
  return (r._bc = t); }
const EQ_SLOTS_FIX = () => Object.keys(G.equip || {}).map(sl => ({ s: G.equip[sl], i: 'e:' + sl }));
export function renderPanel() {
  const sh = $('#sheet'); if (!panel) return; const k = panel.kind; let h = '';
  const key = k + '|' + (k === 'craft' ? UIS.tab + '|' + (UIS.tab2 || 'all') + '|' + (panel.st || '') : ''), same = sh.dataset.key === key, sameKind = (sh.dataset.key || '').split('|')[0] === k;
  const ob = sh.querySelector('.sh-body'), oTop = ob ? ob.scrollTop : 0, ot = sh.querySelector('.tabs'), oLeft = ot ? ot.scrollLeft : 0;
  if (k === 'inv') { h += otabsHTML(BAG_NAV, 'inv', 'bagNav') + bagHTML(); // v83: 창 위 바깥 탭 · 장비와 펫은 캐릭터 창으로 (ui/panels-char.js)
  } else if (k === 'catch') { h += catchHTML();
  } else if (k === 'craft') {
    const near = nearStations(); const st = panel.st; resetPool(); const nCh = linkedChests().length;
    const ctier = craftTier(), bo = TIERED[st] && panel.i != null ? G.objs.get(panel.i) : null, inTier = r => !TIERED[r.at] || (r.tier || 0) <= ctier;
    h += st ? head(TIERED[st] ? TIERED[st][ctier] : STN[st], null, `<button class="btn ghost" data-a="retrieve" type="button" style="min-height:36px;padding:0 10px;font-size:16px">회수</button>`) : otabsHTML(BAG_NAV, 'craft', 'bagNav') + sheetTop('', '제작'); // v77: 손제작은 가방 안 제작 탭 · v83: 탭은 창 위 바깥
    if (bo) h += benchUpHTML(bo); // v60: upgrade the workbench at the top of its window
    const hereR = RECIPES.filter(r => atHere(r, st) && recipeOn(r) && inTier(r)), benchy = st === 'bench' || st === 'forge', smel = st === 'smelter';
    const tabs = [['all', '전체'], ['tool', '도구'], ['weapon', '무기'], ['furn', '기본 가구'], ['nature', '자연'], ['farm', '농사'], ['moss', '이끼 세트'], ['shroom', '버섯 세트'], ['crystal', '수정 세트'], ['build', '건축'], ['food', '음식'], ['mat', '재료'], ['circuit', '회로'], ['mine', '채굴장'], ['upg', '강화'], ['ring', '반지'], ['fix', '수리'], ['salv', '분해'], ['book', '요리 도감']].filter(([id]) => id === 'all' || (id === 'book' ? st === 'pot' : id === 'upg' ? smel : id === 'fix' ? smel : id === 'salv' ? smel : hereR.some(r => r.cat === id)));
    if (smel) { // v61: two rows of tabs
      const T1 = [['all', '제작'], ['fix', '수리'], ['salv', '분해'], ['upg', '강화']], T2 = [['all', '전체'], ['weapon', '무기'], ['armor', '방어구'], ['acc', '장신구'], ['tool', '도구']].filter(([id]) => id === 'all' || hereR.some(r => r.cat === id));
      if (![...T1, ...T2].some(([id]) => id === UIS.tab)) UIS.tab = 'all'; const make = !['fix', 'salv', 'upg'].includes(UIS.tab);
      h += `<div class="tabs">${T1.map(([id, n]) => `<button type="button" class="tab ${(id === 'all' ? make : UIS.tab === id) ? 'on' : ''}" data-a="tab" data-i="${id}">${n}</button>`).join('')}</div>`;
      if (make) h += `<div class="tabs t2">${T2.map(([id, n]) => `<button type="button" class="tab ${UIS.tab === id ? 'on' : ''}" data-a="tab" data-i="${id}">${n}</button>`).join('')}</div>`;
    } else if (st === 'bench') { // v62: icon tabs (the chosen one shows its name) and a second row
      const T1 = BT1.filter(([id]) => id === 'all' || hereR.some(r => bcat(r)[0] === id));
      if (!T1.some(([id]) => id === UIS.tab)) UIS.tab = 'all';
      const T2 = (BT2[UIS.tab] || []).filter(([id]) => id === 'all' || hereR.some(r => bcat(r)[0] === UIS.tab && bcat(r)[1] === id));
      if (!T2.some(([id]) => id === UIS.tab2)) UIS.tab2 = 'all';
      h += `<div class="tabs itabs">${T1.map(([id, n, ic]) => `<button type="button" class="tab ${UIS.tab === id ? 'on' : ''}" data-a="tab" data-i="${id}" aria-label="${n}" title="${n}"><img class="px" src="${iconURL(ic)}" alt="">${UIS.tab === id ? `<span>${n}</span>` : ''}</button>`).join('')}</div>`;
      if (T2.length > 2) h += `<div class="tabs t2">${T2.map(([id, n]) => `<button type="button" class="tab ${UIS.tab2 === id ? 'on' : ''}" data-a="tab2" data-i="${id}">${n}</button>`).join('')}</div>`;
    } else {
    if (!tabs.some(([id]) => id === UIS.tab)) UIS.tab = 'all';
    h += `<div class="tabs">${tabs.map(([id, n]) => `<button type="button" class="tab ${UIS.tab === id ? 'on' : ''}" data-a="tab" data-i="${id}">${n}</button>`).join('')}</div>`; }
    h += `<div class="stations"><span class="chip on">${TIERED[st] ? TIERED[st][ctier] + '에서 만들기' : st ? STN[st] + '에서 만들기' : '손 제작'}</span>${nCh ? `<span class="chip on">연결된 상자 ${nCh}개</span>` : ''}</div>`;
    if (UIS.tab === 'upg') { h += upgListHTML(near.has('smelter')); } else
    if (UIS.tab === 'salv') {
      const nb = smel && canSalv(near), list = slotList().filter(({ s }) => s && (DUR[s.id] || (smel && upgOk(s.id))));
      h += `<div class="sh-body">${nb ? '' : '<p class="hint">장비제작대 근처에서 분해할 수 있어요.</p>'}<div class="list">`;
      if (!list.length) h += `<p class="prose" style="color:var(--muted);text-align:center;margin-top:14px">분해할 장비가 없어요</p>`;
      for (const { s, i } of list) { const got = salvGet2(s), ok = nb && !!got, mx = DUR[s.id] ? DUR[s.id][0] : 0, ask = UIS.salvAsk === i;
        h += `<div class="rc ${ok ? 'ok' : 'no'}"><div class="ri"><img class="px" src="${iconURL(s.id)}" alt=""></div><div class="rn">${rarName(s.id)}${lvOf(s) ? ` +${s.lv}` : ''}${isBroken(s) ? '<small style="color:#ff8a96">망가짐</small>' : ''}<div class="ings">${mx ? `<span class="ing">내구도 ${durOf(s)}/${mx}</span>` : ''}${got ? got.map(([id, c]) => `<span class="ing gain"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} +${c}</span>`).join('') : '<span class="ing">돌려받을 재료가 없어요</span>'}</div></div><button type="button" class="btn mk ${ask ? 'warn' : ''}" data-a="salv" data-i="${i}" ${ok ? '' : 'disabled'}>${ask ? '정말?' : '분해'}</button></div>`; }
      h += `</div></div>`;
    } else if (UIS.tab === 'book') { // recipe book: a stamp on every dish made at least once
      const all = ['pie', 'stew', 'fishStew', ...DISHES.map(d => d[0])], made = id => ((G.stats.made || {})[id] || 0) + ((G.stats.made || {})[id + 'S'] || 0), nMade = all.filter(id => made(id)).length, nKnown = all.filter(id => knows(id)).length;
      h += `<div class="sh-body"><p class="hint">만든 요리 ${nMade}/${all.length} · 아는 레시피 ${nKnown}/${all.length}</p><div class="dbook">${all.map(id => { const k = knows(id), m = made(id), it = ITEMS[id];
        return `<div class="dk ${m ? 'done' : ''} ${k ? '' : 'unk'}"><img class="px" src="${iconURL(k ? id : 'rn_' + (DISH[id] ? id : 'skewer'))}" alt=""><b>${k ? it.n : '???'}</b><small>${k ? (it.buff ? buffText(it) : '회복 요리') : escHTML(noteHint(DISH[id]))}</small>${m ? '<i>✓</i>' : ''}</div>`; }).join('')}</div></div>`;
    } else if (UIS.tab === 'fix') {
      const nb = smel && near.has('smelter'), list = [...EQ_SLOTS_FIX(), ...otherSetSlots(), ...slotList()].filter(({ s }) => s && DUR[s.id] && durOf(s) < DUR[s.id][0]); // v83: 입은 장비·다른 세트 장비도
      h += `<div class="sh-body">${nb ? '' : '<p class="hint">장비제작대 근처에서 고칠 수 있어요.</p>'}<div class="list">`;
      if (!list.length) h += `<p class="prose" style="color:var(--muted);text-align:center;margin-top:14px">고칠 도구가 없어요</p>`;
      for (const { s, i } of list) { const cost = repairCost(s), ok = nb && cost.every(([id, c]) => availCount(id) >= c), mx = DUR[s.id][0];
        h += `<div class="rc ${ok ? 'ok' : 'no'}"><div class="ri" style="position:relative"><img class="px" src="${iconURL(s.id)}" alt=""></div><div class="rn">${rarName(s.id)}${isBroken(s) ? '<small style="color:#ff8a96">망가짐</small>' : ''}<div class="fixbar"><i style="width:${Math.round(durOf(s) / mx * 100)}%"></i></div><div class="ings"><span class="ing">내구도 ${durOf(s)}/${mx}</span>${cost.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c}</span>`; }).join('')}</div></div><button type="button" class="btn mk" data-a="fix" data-i="${i}" ${ok ? '' : 'disabled'}>수리</button></div>`; }
      h += `</div></div>`;
    } else {
    // order is fixed while the panel stays on this tab, so the list does not jump after crafting
    const okey = UIS.tab + '|' + (UIS.tab2 || 'all') + '|' + (st || '') + '|' + ctier;
    if (!UIS.craftOrder || UIS.craftOrder.key !== okey) { const l = RECIPES.map((r, i) => ({ r, i })).filter(({ r }) => recipeOn(r) && atHere(r, st) && inTier(r) && (UIS.tab === 'all' || (st === 'bench' ? bcat(r)[0] === UIS.tab && (UIS.tab2 === 'all' || bcat(r)[1] === UIS.tab2) : r.cat === UIS.tab))); const tv = r => st === 'bench' && !r.at ? -1 : (r.tier || 0); l.sort((a, b) => (tv(b.r) - tv(a.r)) || (canCraft(b.r, near) - canCraft(a.r, near))); /* v60: this tier's things first */ UIS.craftOrder = { key: okey, ids: l.map(x => x.i) }; }
    const list = UIS.craftOrder.ids.map(i => ({ r: RECIPES[i], i }));
    const so = TIMED[st] && panel.i != null ? G.objs.get(panel.i) : null, busy = !!(so && so.job);
    h += `<div class="sh-body">${busy ? `<div class="list" style="margin-bottom:8px">${jobHTML(so)}</div>` : ''}<div class="list">`;
    for (const { r, i } of list) {
      if (r.dish && !knows(r.dish)) { h += `<div class="rc no lockd"><div class="ri"><img class="px" src="${iconURL('rn_' + r.dish)}" alt=""></div><div class="rn">???<div class="at">${escHTML(noteHint(DISH[r.dish]))}</div></div></div>`; continue; }
      const ok = canCraft(r, near) && !busy, it = ITEMS[r.out], stn = r.at && !near.has(r.at), multi = isMulti(r), mx = multi ? Math.min(so ? JOB_MAX : 99, maxCraft(r)) : 1, q = multi ? clamp(UIS.qty[i] || 1, 1, Math.max(1, mx)) : 1;
      const qty = multi && ok ? `<div class="qty"><button type="button" data-a="qty" data-i="${i}:-1" ${q <= 1 ? 'disabled' : ''} aria-label="하나 덜">−</button><b>${q * r.n}개</b><button type="button" data-a="qty" data-i="${i}:1" ${q >= mx ? 'disabled' : ''} aria-label="하나 더">+</button><button type="button" class="qmax" data-a="qty" data-i="${i}:max" ${q >= mx ? 'disabled' : ''}>최대</button></div>` : '';
      h += `<div class="rc ${ok ? 'ok' : 'no'}"><div class="ri"><img class="px" src="${iconURL(r.out)}" alt=""></div><div class="rn">${rarName(r.out)}${r.n > 1 ? `<small>× ${r.n}</small>` : ''}${it.buff ? `<small class="bfx">${buffText(it)}</small>` : ''}${it.set && UIS.tab !== it.set ? `<small class="stag ${it.set}">${SETN[it.set]}</small>` : ''}${TIERED[st] && ctier && r.at ? `<small style="color:${BENCH_COL[r.tier || 0] || 'var(--muted)'}">${TIERED[st][r.tier || 0]}</small>` : ''}<div class="ings">${r.req.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c * q}</span>`; }).join('')}</div>${so ? `<small>⏱ ${fmtT(jobTime(r))}</small>` : ''}${stn ? `<div class="at">${STN[r.at]} 근처에서 만들 수 있어요</div>` : ''}</div><button type="button" class="btn mk" data-a="craft" data-i="${i}" ${ok ? '' : 'disabled'}>${so ? '넣기' : '만들기'}</button>${qty}</div>`;
    }
    h += `</div></div>`;
    }
  } else if (k === 'feeder') { // v114 먹이통: 위 4칸은 눌러서 꺼내기, 아래는 가방의 먹이만 (눌러서 넣기)
    const o = G.objs.get(panel.i); if (!o || o.t !== 'feeder') { closePanel(); return; } const feed = o.feed || Array(FEED_SLOTS).fill(null), mine = G.inv.map((s, i) => [s, i]).filter(([s]) => s && FEED[s.id]), min = Math.floor(feedSec(o) / 60);
    h += head('먹이통', 'feeder') + `<div class="sh-body"><button class="btn" data-a="fdAll" type="button" style="width:100%">가방의 먹이 모두 넣기</button><div class="lbl">먹이통 <span style="color:var(--muted);font-size:16px">약 ${min}분</span></div><div class="grid">${feed.map((s, i) => slotHTML(s, 'fdOut', i)).join('')}</div>`
      + `<div class="lbl">가방의 먹이</div>${mine.length ? `<div class="grid">${mine.map(([s, i]) => slotHTML(s, 'fdIn', i)).join('')}</div>` : `<p class="prose" style="color:var(--muted)">통통베리·버섯 1분 · 수정 콩·불꽃 열매·서리 무 2분</p>`}</div>`;
  } else if (k === 'sieve') { // v115 광석 그물: 거르는 중이면 진행 카드, 아니면 넣을 재료 목록
    const o = G.objs.get(panel.i); if (!o || o.t !== 'oreNet') { closePanel(); return; }
    h += head('광석 그물', 'oreNet', `<button class="btn ghost" data-a="retrieve" type="button" style="min-height:36px;padding:0 10px;font-size:16px">회수</button>`) + `<div class="sh-body">${sieveHTML(o)}</div>`;
  } else if (k === 'chest') {
    const o = G.objs.get(panel.i); if (!o) { closePanel(); return; }
    const empty = o.items.every(x => !x), rf = o.t === 'refundBox'; // v69 (BF-05): the refund box — take-only
    h += head(rf ? '환급 상자' : '보관상자', 'chest', empty ? `<button class="btn ghost" data-a="retrieve" type="button" style="min-height:36px;padding:0 10px;font-size:16px">${rf ? '치우기' : '회수'}</button>` : '');
    if (rf) h += `<div class="sh-body"><div class="lbl">환급 상자</div><div class="grid">${o.items.map((s, i) => slotHTML(s, 'cout', i)).join('')}</div><div class="lbl">단축칸</div><div class="grid">${G.inv.slice(0, HOT).map((s, i) => slotHTML(s, 'inv', i)).join('')}</div><div class="lbl">가방</div><div class="grid">${G.inv.slice(HOT).map((s, i) => slotHTML(s, 'inv', i + HOT)).join('')}</div></div>`;
    else
    h += `<div class="sh-body"><div class="menu-two stash"><button class="btn" data-a="stash" data-i="all" type="button">가방 → 모두 넣기</button><button class="btn ghost" data-a="stash" data-i="same" type="button">같은 것만 넣기</button></div><div class="lbl">상자</div><div class="grid">${o.items.map((s, i) => slotHTML(s, 'cout', i)).join('')}</div><div class="lbl">단축칸</div><div class="grid">${G.inv.slice(0, HOT).map((s, i) => slotHTML(s, 'cin', i)).join('')}</div><div class="lbl">가방</div><div class="grid">${G.inv.slice(HOT).map((s, i) => slotHTML(s, 'cin', i + HOT)).join('')}</div></div>`;
  } else if (k === 'map' && UIS.mapWarp != null) { // v89: 워프 — 켜진 곳을 지도에서 누르거나 아래 목록에서 골라요
    const L = warpDests(UIS.mapWarp), sel = L.find(e => e.i === UIS.warpSel), from = warpAt(UIS.mapWarp);
    h += head('워프', 'map', `<button class="btn ghost" data-a="mapzoom" type="button" style="min-height:36px;padding:0 10px;font-size:16px">${mapIsAll() ? '가까이 보기' : '전체 보기'}</button>`) + `<div class="sh-body">${from ? `<p class="hint">지금 여기: ${escHTML(warpName(from))}</p>` : ''}<div class="mapwrap"><canvas id="mapCv" data-a="mapTap" width="600" height="600"></canvas><div class="mapctl"><button class="btn ghost" data-a="mapZ" data-i="1" type="button" style="font-size:32px" aria-label="확대">+</button><button class="btn ghost" data-a="mapZ" data-i="-1" type="button" style="font-size:32px" aria-label="축소">−</button><button class="btn ghost" data-a="mapMe" type="button" aria-label="내 위치로">나</button></div></div>`
      + (sel ? `<div class="warpgo"><span>${escHTML(sel.name)} · ${Math.round(sel.d)}칸</span><button class="btn" data-a="warpGo" data-i="${sel.i}" type="button">여기로 이동</button></div>` : '')
      + `<div class="legend"><span><i style="background:#7fe0b5"></i>나</span><span><i style="background:#c9a6ff"></i>켜진 워프포인트</span><span><i style="background:#6a5a80"></i>안 켜진 워프포인트</span><span><i style="background:#7fe8f0"></i>포탈</span></div>`
      + `<div class="lbl">갈 수 있는 곳</div>${L.length ? `<div class="menu-list">${L.map(e => `<button class="btn ghost" data-a="warpGo" data-i="${e.i}" type="button">${escHTML(e.name)} · ${Math.round(e.d)}칸</button>`).join('')}</div>` : '<p class="hint">아직 켜진 곳이 없어요.</p>'}</div>`;
  } else if (k === 'map') {
    h += head('지도', 'map', `<button class="btn ghost" data-a="mapzoom" type="button" style="min-height:36px;padding:0 10px;font-size:16px">${mapIsAll() ? '가까이 보기' : '전체 보기'}</button>`) + `<div class="sh-body"><div class="mapwrap"><canvas id="mapCv" data-a="mapPin" width="600" height="600"></canvas><div class="mapctl"><button class="btn ghost" data-a="mapZ" data-i="1" type="button" style="font-size:32px" aria-label="확대">+</button><button class="btn ghost" data-a="mapZ" data-i="-1" type="button" style="font-size:32px" aria-label="축소">−</button><button class="btn ghost" data-a="mapMe" type="button" aria-label="내 위치로">나</button></div></div>${navBarHTML()}${mapLegendHTML()}</div>`;
  } else if (k === 'tree') {
    h += head('등불나무', 'lightSeed') + `<div class="sh-body"><div class="seeds">${[0, 1, 2, 3, 4].map(i => `<div class="${i < G.treeSeeds ? 'lit' : ''}"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div><p class="prose" style="text-align:center;color:var(--amber)">지금 모습 · ${TREE_STAGE[treeStage()]}</p>${TREE_BLESS(treeStage()) ? `<p class="prose">나무 둘레 <em>${TREE_BLESS(treeStage())}칸</em> 안의 작물이 20% 빨리 자라요. 빛가루가 떠다니는 곳까지예요.</p>` : ''}<p class="prose">옛날 <em>등불지기</em>들이 돌보던 등불나무가 잠들어 있어요. 등불지기들이 맡겨 둔 나무의 빛, <em>빛씨앗</em>을 심을 때마다 나무가 한 단계 깨어나고 빛이 넓어져요. 깨어날 때마다 옛 기억 한 장면을 보여 줘요.</p><p class="prose" style="color:var(--muted)">빛씨앗은 동쪽 동굴의 말랑대왕, 서쪽 버섯숲과 북쪽 수정동굴의 제단, 그리고 남쪽 용암·서쪽 얼음 동굴 깊은 곳의 수호자들이 품고 있어요.</p></div>`;
  } else if (k === 'menu') {
    const imp = pendingImp && importFrom === 'menu' ? `<div class="impbox"><p>「${escHTML(pendingImp.name)}」 세이브로 바꿀까요?<br><span style="color:var(--muted);font-size:16px">지금 진행 중인 세계는 이 파일로 바뀌어요.</span></p><div class="menu-two"><button class="btn warn" data-a="impYes" type="button">바꾸기</button><button class="btn ghost" data-a="impNo" type="button">취소</button></div></div>` : '';
    const marks = G.marks || [];
    const dev = canDev() ? `<div class="devbox"><div class="lbl" style="color:#ff8fa3">개발자 도구 · 마을 표시</div><p class="hint">마을 영역의 두 모서리에 차례로 표시해요 (왼쪽 위 → 오른쪽 아래). 표시는 개발자 모드에서만 보여요.</p><div class="menu-list"><button class="btn ghost" data-a="markAdd" type="button">지금 서 있는 곳에 표시</button></div>${marks.map((m, k) => `<div class="markrow"><span>마을 ${Math.floor(k / 2) + 1} · ${k % 2 ? '끝' : '시작'} (${m.x}, ${m.y})</span><button class="btn ghost" data-a="markDel" data-i="${k}" type="button">지우기</button></div>`).join('')}${marks.length % 2 ? '<p class="hint" style="margin-top:6px">반대쪽 모서리에도 하나 더 표시해 주세요.</p>' : ''}</div>` : '';
    h += head('<span data-a="devtap">설정</span>', 'gear') + `<div class="sh-body">${imp}<div class="menu-list"><button class="btn" data-a="save" type="button">지금 저장하기</button><button class="btn ghost" data-a="sound" type="button">소리 ${soundOn ? '끄기' : '켜기'}</button><button class="btn ghost" data-a="help" type="button">가이드</button></div>
      ${canDev() ? `<div class="lbl" style="margin-top:12px">세이브 파일 (개발자 모드)</div><div class="menu-two"><button class="btn ghost" data-a="export" type="button">파일로 내보내기</button><button class="btn ghost" data-a="import" type="button">파일 불러오기</button></div>${cloudMenuHTML()}` : cloudPendingHTML()}
      <div class="lbl" style="margin-top:12px">조작 방식 (터치 화면)</div><div class="tabs">${[['joy', '조이스틱'], ['pad', '방향키']].map(([k, n]) => `<button type="button" class="tab ${ctrlPref === k ? 'on' : ''}" data-a="ctrl" data-i="${k}">${n}</button>`).join('')}</div>
      <div class="menu-list" style="margin-top:12px"><button class="btn ${UIS.confirmEsc ? 'warn' : 'ghost'}" data-a="escape" type="button">${UIS.confirmEsc ? '한 번 더 누르면 트인 곳으로 옮겨요' : '긴급 탈출'}</button></div>
      <div class="menu-list" style="margin-top:12px"><button class="btn ${UIS.confirmNew ? 'warn' : 'ghost'}" data-a="newgame" type="button">${UIS.confirmNew ? '정말 처음부터 시작할까요? (지금 세이브는 백업돼요)' : '처음부터 다시 하기'}</button></div>${dev}</div>`;
  } else if (k === 'profile') { // v111: 왼쪽 위 얼굴 → 프로필 (캐릭터 이름·레벨·플레이 기록, 플레이 기록은 설정에서 옮김)
    const R = G.rpg, need = XP_NEED(R.lv), mx = R.lv >= MAX_LV, fi = document.getElementById('faceImg');
    const nmRow = UIS.nameEdit ? `<div class="namerow"><input id="profName" class="namein" type="text" maxlength="8" autocomplete="off" enterkeyhint="done" value="${escHTML(pName())}" aria-label="이름"><button class="btn" data-a="profName" type="button">바꾸기</button></div><small class="hint" style="margin:0">1~8자 · 비워 두면 「${escHTML(CHARS[curChar()].n)}」</small>` : `<b>${escHTML(pName())}</b><button class="btn ghost" data-a="profEdit" type="button" style="min-height:32px;padding:0 8px;font-size:16px">이름 바꾸기</button>`; // v117: 첫 장면에서 지은 이름 (프로필에서 언제든 바꿈)
    h += head('프로필', 'star') + `<div class="sh-body"><div class="prof"><img class="px prof-face" src="${fi && fi.src ? fi.src : ''}" alt=""><div class="prof-t">${nmRow}<span>Lv.${R.lv}${mx ? ' · 최고 레벨' : ''}</span><div class="bar xp"><div class="track"><div class="fill" style="width:${mx ? 100 : clamp(R.xp / need * 100, 0, 100)}%"></div></div></div><span class="hint" style="margin:0">경험치 ${mx ? '최고' : R.xp + ' / ' + need}</span></div></div>${playRecordHTML()}</div>`;
  } else if (k === 'help') { h += helpHTML(); // v96: 설정 → 가이드
  } else if (k === 'look') {
    const L = UIS.look; CHARS.__look = lookDef(L); const pv = d => `<img class="px" src="${charPreview('__look', 0, d)}" alt="">`;
    const tabs = [['char', '캐릭터'], ['hair', '머리 모양'], ['hc', '머리 색'], ['eye', '눈 색'], ['outfit', '옷'], ['oc', '옷 색'], ['hat', '모자·소품']];
    h += head('꾸미기', 'hand') + `<div class="look-prev">${pv('down')}${pv('side')}${pv('up')}</div><div class="tabs">${tabs.map(([id, n]) => `<button type="button" class="tab ${UIS.lookTab === id ? 'on' : ''}" data-a="lookTab" data-i="${id}">${n}</button>`).join('')}</div><div class="sh-body"><div class="look-grid">`;
    const t = UIS.lookTab, opt = (key, val, label, inner) => `<button type="button" class="look-opt ${String(L[key]) === String(val) ? 'on' : ''}" data-a="lookSet" data-i="${key}:${val}">${inner}<span>${label}</span></button>`;
    const mini = (key, val) => { const T = Object.assign({}, L, { [key]: val }); CHARS.__mini = lookDef(T); return `<img class="px" src="${charPreview('__mini', 0, 'down')}" alt="">`; };
    if (t === 'char') h += `</div><div class="cp-grid">${cpCards(curChar())}</div><p class="hint" style="margin-top:6px">${CHARS[curChar()].n} · ${CHARS[curChar()].d}</p><div>`; // v83: 캐릭터 고르기도 옷장에서
    if (t === 'hair') for (const k in HAIRS) h += opt('hair', k, HAIRS[k].n, mini('hair', k));
    if (t === 'hat') for (const k in HATS) h += opt('hat', k, HATS[k].n, mini('hat', k));
    if (t === 'outfit') for (const k in OUTFITS2) h += opt('outfit', k, OUTFITS2[k].n, mini('outfit', k));
    if (t === 'hc') HAIRC.forEach(([n, c], k) => { h += opt('hc', k, n, `<i class="sw" style="background:${c[0]};box-shadow:inset -4px -4px 0 ${c[1]}"></i>`); });
    if (t === 'oc') OUTC.forEach(([n, c], k) => { h += opt('oc', k, n, `<i class="sw" style="background:${c[0]};box-shadow:inset -4px -4px 0 ${c[1]}"></i>`); });
    if (t === 'eye') EYEC.forEach(([n, c], k) => { h += opt('eye', k, n, `<i class="sw" style="background:${c}"></i>`); });
    h += `</div></div><div class="menu-two" style="margin-top:8px"><button class="btn ghost" data-a="close" type="button">취소</button><button class="btn" data-a="lookOk" type="button">이 모습으로 하기</button></div>`;
  } else if (k === 'quest') { // v84: 이야기 큰 카드 · 도전 세 묶음 · 활성화 · 지도에서 보기 (ui/panels-quest.js)
    const tab = UIS.qTab || 'main';
    const n1 = GUIDE.filter((q, k) => { const st = questState(q, k); return st.done && !st.claimed && st.has && !st.nh; }).length, n2 = QSIDE.filter(q => { const st = questState(q); return st.done && !st.claimed && st.has && !st.nh; }).length;
    h += head('퀘스트', 'quest', (n1 + n2) ? `<button type="button" class="btn" data-a="qClaimAll" style="min-height:36px;padding:0 10px;font-size:16px">모두 받기 (${n1 + n2})</button>` : '');
    h += `<div class="tabs"><button type="button" class="tab ${tab === 'main' ? 'on' : ''}" data-a="qTab" data-i="main">이야기${n1 ? ` · ${n1}` : ''}</button><button type="button" class="tab ${tab === 'side' ? 'on' : ''}" data-a="qTab" data-i="side">도전${n2 ? ` · ${n2}` : ''}</button></div><div class="sh-body">`;
    h += (tab === 'main' ? questMainHTML() : questSideHTML()) + `</div>`;
  } else if (k === 'stat') { // v83: 캐릭터 창 — 바깥 탭 장비 / 스킬 / 등불 (ui/panels-char.js)
    const ct = UIS.chTab || 'eq'; h += otabsHTML(CH_TABS, ct, 'chTab') + (ct === 'eq' ? setTabsHTML() : '') + sheetTop('', '캐릭터');
    if (ct === 'eq') h += `<div class="sh-body">${charEqHTML()}</div>`;
    else if (ct === 'lamp') h += `<div class="sh-body">${lampHTML()}</div>`;
    else {
    const R = G.rpg, need = XP_NEED(R.lv), touch = document.body.classList.contains('touch');
    h += `<div class="sh-body"><div class="lvbox"><b>Lv.${R.lv}</b><div class="xpbar"><i style="width:${R.lv >= MAX_LV ? 100 : Math.round(R.xp / need * 100)}%"></i></div><span>${R.lv >= MAX_LV ? '최고 레벨' : `경험치 ${R.xp} / ${need}`}</span></div>
      <div class="lbl">능력치<span class="pt">남은 포인트 ${R.pts}</span></div>`;
    for (const st in STATN) h += `<div class="strow"><b>${STATN[st][0]}</b><span class="v">${R[st]}</span><small>${STATN[st][1]}</small><button type="button" class="btn" data-a="statUp" data-i="${st}" ${R.pts > 0 ? '' : 'disabled'} aria-label="${STATN[st][0]} 올리기">+</button></div>`;
    h += `<div class="stsum">최대 체력 ${maxHp()} · 최대 기력 ${maxMp()} · 근접 피해 ×${meleeMul().toFixed(2)} · 활 ×${rangeMul().toFixed(2)} · 마법 ×${magicMul().toFixed(2)} · 공격 속도 +${Math.round((1 / atkSpd() - 1) * 100)}% · 이동 +${Math.round((moveMul() - 1) * 100)}%</div>`;
    if (R.str + R.dex + R.vit + R.int) h += `<div class="menu-list"><button type="button" class="btn ${UIS.statAsk ? 'warn' : 'ghost'}" data-a="statReset">${UIS.statAsk ? '정말 포인트를 모두 돌려받을까요?' : '능력치 다시 나누기 (무료)'}</button></div>`;
    h += `<div class="lbl" id="skLbl" style="margin-top:12px">스킬<span class="pt">스킬 포인트 ${R.sp}</span></div>`;
    const skOrder = SK_CAT.flatMap(([c, cn, ids]) => ids.map((id, n) => [id, n ? null : cn])).concat(Object.keys(SKILLS).filter(id => !SK_CAT.some(c => c[2].includes(id))).map(id => [id, null]));
    for (const [id, catName] of skOrder) { const S = SKILLS[id], l = R.sk[id] || 0, lock = R.lv < S.lv, can = !lock && R.sp > 0 && l < S.max, L1 = Math.max(1, l); if (catName) h += `<div class="skcat">${catName} 스킬</div>`;
      const slots = S.act && l ? `<div class="skslots">${[0, 1].map(n => `<button type="button" class="btn ${R.slot[n] === id ? '' : 'ghost'}" data-a="skSlot" data-i="${id}:${n}">${n + 1}칸${R.slot[n] === id ? ' ✓' : ''}</button>`).join('')}</div>` : '';
      h += `<div class="skrow ${lock ? 'lock' : ''}"><img class="px" src="${iconURL('sk_' + id)}" alt=""><div><h4>${S.n}<small>${S.act ? '사용' : '항상 적용'} · ${l}/${S.max}</small></h4><p>${S.d(L1)}${S.act ? ` · 기력 ${S.mp(L1)} · ${S.cd(L1).toFixed(1)}초` : ''}</p>${l && l < S.max ? `<p class="nx">다음 단계: ${S.d(l + 1)}</p>` : ''}${lock ? `<p>Lv.${S.lv}부터 배울 수 있어요</p>` : ''}${slots}</div><button type="button" class="btn mk" data-a="skUp" data-i="${id}" ${can ? '' : 'disabled'}>${l ? (l >= S.max ? '최고' : '올리기') : '배우기'}</button></div>`; }
    if (Object.keys(R.sk).length) h += `<div class="menu-list"><button type="button" class="btn ${UIS.skAsk ? 'warn' : 'ghost'}" data-a="skReset">${UIS.skAsk ? '정말 스킬 포인트를 모두 돌려받을까요?' : '스킬 다시 배우기 (무료)'}</button></div>`;
    h += `</div>`;
    }
  } else if (k === 'talk') {
    if (!panel.lines) { panel.lines = talkLines(panel.npc, panel.mode); panel.at = 0; } const line = panel.lines[panel.at] || '', last = panel.at >= panel.lines.length - 1, sp = lineOf(line).npc || panel.npc, N = NPCS[sp], img = npcImg(sp); /* v119: 줄마다 말하는 사람(할머니) */
    const shop = BARTER[panel.npc] || [];
    if (panel.mode === 'shop') { // v105 물물교환
      h += `<div class="sh-body talk"><div class="talkbox"><img class="px talkface" src="${img ? img.toDataURL() : ''}" alt=""><div><b style="color:var(--amber)">${N ? N.n : '?'}</b> <small style="color:var(--muted)">물물교환 · 한 줄에 하루 ${BARTER_PER}번</small><p class="prose" style="margin:6px 0 0">가방에 있는 것으로 바꿔요.</p></div></div><div class="menu-list">${shop.map(([give, get, d], k) => { const why = barterWhy(panel.npc, k), left = barterLeft(panel.npc, k);
        const row = L => L.map(([id, n]) => `<img class="px" src="${iconURL(id)}" alt="" style="width:16px;height:16px;vertical-align:middle"> ${ITEMS[id].n} ${n}`).join(' + ');
        return `<button type="button" class="btn ghost barter ${why ? 'off' : ''}" data-a="barter" data-i="${k}" title="${why || d}"><span class="bgive">${row(give)}</span><span class="barrow">→</span><span class="bget">${row(get)}</span><small>${why ? why : `${left}번 남음`}</small></button>`; }).join('')}</div><div class="menu-list"><button class="btn ghost" data-a="talkBack" type="button">이야기로</button><button class="btn" data-a="close" type="button">잘 가요</button></div></div>`;
    } else { // v117: 줄마다 말하는 사람(나루·주인공), 타이핑 + 빨리감기, 첫 장면 이름 짓기
      const L = lineOf(line), me = L.who === 'me', story = panel.mode !== 'talk' && panel.mode !== 'hello';
      const face = me ? faceURL('me') : (img ? img.toDataURL() : ''), who = me ? `<b style="color:var(--mint,#7fe0b5)">${escHTML(pName())}</b>` : `<b style="color:var(--amber)">${N ? N.n : '?'}</b> <small style="color:var(--muted)">${N ? N.job : ''}</small>`;
      const body = L.ask ? `<p class="prose" style="margin:6px 0 0">뭐라고 불러 달라고 할까요?</p><div class="namerow"><input id="nameIn" class="namein" type="text" maxlength="8" autocomplete="off" enterkeyhint="done" value="${escHTML(panel.nameDraft != null ? panel.nameDraft : pName())}" aria-label="이름"><button class="btn" data-a="nameOk" type="button">정했어요</button></div><small class="hint" style="margin:4px 0 0">1~8자 · 비워 두면 「${escHTML(CHARS[curChar()].n)}」 · 프로필에서 언제든 바꿀 수 있어요</small>`
        : `<p class="prose" style="margin:6px 0 0" data-type="${panel.mode}:${panel.at}">${escHTML(L.s)}</p>`;
      const hear = last && !L.ask && panel.npc === 'guide' ? nextStory(panel.mode) : null; /* v121 중요한 전환점: [다음 이야기 듣기] / [대화 마치기] */
      const btns = L.ask ? '' : hear ? `<button class="btn" data-a="talkHear" data-i="${hear}" type="button">다음 이야기 듣기</button><button class="btn ghost" data-a="close" type="button">대화 마치기</button>` : `${last ? `<button class="btn" data-a="close" type="button">${story ? '알았어요' : '잘 가요'}</button>` : `<button class="btn" data-a="talkNext" type="button">다음</button>`}${last && shop.length && panel.mode !== 'hello' && !story ? `<button class="btn ghost" data-a="talkShop" type="button">물물교환</button>` : ''}`;
      h += `<div class="sh-body talk"><div class="talkbox ${me ? 'me' : ''}"><img class="px talkface" src="${face}" alt=""><div style="flex:1;min-width:0">${who}${body}</div>${L.ask ? '' : '<button class="skipty" data-a="skipType" type="button" aria-label="빨리감기">▶▶</button>'}</div><div class="menu-list">${btns}</div>${villagers().length ? `<p class="prose" style="color:var(--muted);text-align:center">마을 사람 ${villagers().length}/6</p>` : ''}</div>`; }
  } else if (k === 'diaryLast' || k === 'ending') { // v108 찢긴 마지막 장 · 엔딩
    const d = k === 'ending' ? ENDING : DEEP_DIARY;
    h += `<div class="sh-body memory" style="text-align:center;padding-top:6px"><button class="skipty" data-a="skipType" type="button" aria-label="빨리감기">▶▶</button>${k === 'ending' ? `<div class="seeds">${[0, 1, 2, 3, 4].map(() => `<div class="lit"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div>` : ''}<h2 style="font-weight:400;font-size:16px;color:var(--amber);margin:4px 0 8px">${d.t}</h2><p class="prose ${k === 'ending' ? '' : 'diary'}" style="text-align:left" data-type="0">${d.s}</p>${k === 'ending' ? `<p class="prose" style="color:var(--muted)">끝까지 함께해 줘서 고마워요. 엔딩 뒤에도 계속 살 수 있어요.</p>` : ''}<button class="btn" data-a="close" type="button" style="width:100%;min-height:44px">${k === 'ending' ? '계속 살아가기' : '덮기'}</button></div>`;
  } else if (k === 'diary') { // v106 등불지기의 일기
    const A = ARCHIVES.find(q => q.id === panel.arch) || ARCHIVES[0], d = A.diary;
    h += `<div class="sh-body memory" style="text-align:center;padding-top:6px"><button class="skipty" data-a="skipType" type="button" aria-label="빨리감기">▶▶</button><h2 style="font-weight:400;font-size:16px;color:var(--amber);margin:4px 0 8px">${d.t}</h2><p class="prose diary" style="text-align:left" data-type="${A.id}">${d.s}</p><p class="prose" style="color:var(--muted)">${A.n}</p><button class="btn" data-a="close" type="button" style="width:100%;min-height:44px">덮기</button></div>`;
  } else if (k === 'memory') {
    const m = MEMORY[panel.stage] || MEMORY[1];
    h += `<div class="sh-body memory" style="text-align:center;padding-top:6px"><button class="skipty" data-a="skipType" type="button" aria-label="빨리감기">▶▶</button><div class="seeds">${[0, 1, 2, 3, 4].map(i => `<div class="${i < (G.treeSeeds | 0) ? 'lit' : ''}"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div><h2 style="font-weight:400;font-size:16px;color:var(--amber);margin:4px 0 8px">${m.t}</h2><p class="prose" style="text-align:left" data-type="${panel.stage}">${m.s}</p>${panel.stage === 5 ? `<p class="prose" style="color:var(--amber)">새 레시피: 등불 축제 케이크 (요리솥)</p>` : ''}<button class="btn" data-a="close" type="button" style="width:100%;min-height:44px">${panel.stage === 5 ? '계속 모험하기' : '돌아가기'}</button></div>`;
  } else if (k === 'win2') {
    h += `<div class="sh-body" style="text-align:center;padding-top:6px"><div class="seeds">${[0, 1, 2, 3, 4].map(() => `<div class="lit"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div><h2 style="font-weight:400;font-size:16px;color:var(--amber);margin:4px 0 8px">다섯 등불이 모두 밝아졌어요!</h2><p class="prose">용암과 얼음 깊은 곳까지 빛이 닿았어요. 땅속 세상 전체가 등불나무의 품 안에서 반짝여요. 끝까지 함께해 줘서 고마워요!</p><p class="prose" style="color:var(--muted)">전설 장비를 모으고, 남은 도전 퀘스트를 깨고, 나만의 정원을 마음껏 꾸며 보세요.</p><p class="prose" style="color:var(--amber)">새 레시피: 등불 축제 케이크 (요리솥)</p><button class="btn" data-a="close" type="button" style="width:100%;min-height:44px">계속 모험하기</button></div>`;
  } else if (k === 'win') {
    h += `<div class="sh-body" style="text-align:center;padding-top:6px"><div class="seeds">${[0, 1, 2].map(() => `<div class="lit"><img class="px" src="${iconURL('lightSeed')}" alt=""></div>`).join('')}</div><h2 style="font-weight:400;font-size:16px;color:var(--amber);margin:4px 0 8px">등불나무가 깨어났어요!</h2><p class="prose">따스한 빛이 동굴 깊은 곳까지 번져요. 이제 이곳은 당신의 아늑한 정원이에요.</p><p class="prose" style="color:var(--amber)">그런데… 나무 꼭대기에 아직 불 꺼진 등불이 두 개 남아 있어요. 수정 곡괭이를 만들어 남쪽 용암 동굴과 서쪽 얼음 동굴로 떠나 보세요!</p><button class="btn" data-a="close" type="button" style="width:100%;min-height:44px">계속 꾸미기</button></div>`;
  }
  resetPool();
  if (LAY === 2 && (k === 'tree' || k === 'win' || k === 'win2')) h = dirText(h);
  sh.innerHTML = (h.includes('class="sh-top"') ? '' : sheetHpHTML()) + h; sh.dataset.key = key; sh.classList.toggle('side', !!sh.querySelector('.stabs')); sh.classList.toggle('hasotab', !!sh.querySelector('.otabs'));
  if (k === 'inv') { setupBagHover(); placeTip(sh); }
  if (same) { const nb = sh.querySelector('.sh-body'); if (nb) nb.scrollTop = oTop; }
  if (sameKind) { const nt = sh.querySelector('.tabs'); if (nt) nt.scrollLeft = oLeft; }
  if (k === 'map') drawMap();
  typeSetup(sh); // v117 말하는 창 타이핑 (ui/talk.js) — 같은 줄이면 이어서
  if (k === 'stat' && panel.sk) { panel.sk = 0; const el = sh.querySelector('#skLbl'), b = sh.querySelector('.sh-body'); if (el && b) b.scrollTop = el.offsetTop - b.offsetTop - 8; } // v77: K = 캐릭터의 스킬 쪽
}
export let craftNoteT = 0;
export function craftNote(id, n, msg) {
  let el = $('#craftNote'); if (!el) { el = document.createElement('div'); el.id = 'craftNote'; el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  const nm = ITEMS[id].n; el.innerHTML = `<img class="px" src="${iconURL(id)}" alt=""><span>${escHTML(msg || (n > 1 ? `${josa(nm, '을', '를')} ${n}개 제작했어요!` : `${josa(nm, '을', '를')} 제작했어요`))}</span>`;
  const sh = $('#sheet').getBoundingClientRect(), open = !$('#sheetWrap').hidden; el.style.top = (open ? Math.max(8, sh.top - 46) : 96) + 'px';
  if (open && sh.top < 56) el.style.top = (sh.top + 10) + 'px';
  el.classList.remove('out'); el.hidden = false; clearTimeout(craftNoteT); craftNoteT = setTimeout(() => { el.classList.add('out'); craftNoteT = setTimeout(() => { el.hidden = true; }, 400); }, 1800);
}
export const craftCtx = () => panel && panel.kind === 'craft' ? (panel.st || null) : null;
export const craftPanel = () => panel && panel.kind === 'craft' ? panel : null;
export const craftTier = () => stationTier(craftPanel());
export function canCraft(r, near) { return craftable(r, near, craftPanel()); } // 규칙: game/bag.js
