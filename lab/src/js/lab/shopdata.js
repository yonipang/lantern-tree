// ================= 실험판 L2 상점 수치 (재미중심.md 13장 — Claude가 정한 첫 값, 플레이해 보고 고쳐요) =================
// 이름·아이콘은 본 게임 ITEMS를 그대로 써요. 값(v)은 손님이 마음속으로 생각하는 「알맞은 값」 — 화면엔 안 보이고 손님 표정으로 알아내요.
// 종류(cat): raw 원재료 · basic 기본 아이템 → 처음부터 팔림(마을 손님) / metal 금속 물건 → 대장장이가 마을에 와야 손님이 생김.
export const GOODS = {
  dirt: { v: 2, cat: 'raw' }, stone: { v: 3, cat: 'raw' }, wood: { v: 4, cat: 'raw' }, fiber: { v: 2, cat: 'raw' }, mushroom: { v: 5, cat: 'raw' }, glowcap: { v: 6, cat: 'raw' }, spore: { v: 3, cat: 'raw' }, copperOre: { v: 8, cat: 'raw' },
  torch: { v: 5, cat: 'basic' }, stew: { v: 24, cat: 'basic' }, chair: { v: 20, cat: 'basic' }, lampShroom: { v: 36, cat: 'basic' },
  swordCopper: { v: 70, cat: 'metal' }, copperLamp: { v: 45, cat: 'metal' },
};
export const CAT_NAME = { raw: '원재료', basic: '기본 아이템', metal: '금속 물건' };
// 손님 종류: 바라는 물건 종류 · 생김새 (본 게임 캐릭터 조립 — art/characters.js lookDef)
export const CUSTOMERS = {
  village: { n: '마을 손님', wants: ['raw', 'basic'], looks: [{ hair: 'short', hc: 2, eye: 1, outfit: 'apron', oc: 2, hat: 'none' }, { hair: 'buns', hc: 4, eye: 0, outfit: 'vest', oc: 6, hat: 'none' }, { hair: 'spiky', hc: 0, eye: 2, outfit: 'apron', oc: 3, hat: 'none' }] },
  metal: { n: '연장 찾는 손님', wants: ['metal'], need: 'metal', looks: [{ hair: 'short', hc: 1, eye: 3, outfit: 'vest', oc: 5, hat: 'none' }, { hair: 'braid', hc: 3, eye: 2, outfit: 'vest', oc: 1, hat: 'none' }] },
};
// 작업대 레시피 (처음 3개는 처음부터 앎, 나머지는 대장장이에게 삼). out: [물건, 개수]
export const RECIPES_L = {
  torch: { out: ['torch', 2], req: [['wood', 1]] },
  stew: { out: ['stew', 1], req: [['mushroom', 3]] },
  chair: { out: ['chair', 1], req: [['wood', 4]] },
  pickCopper: { out: ['pickCopper', 1], req: [['copperOre', 6], ['wood', 2]], tool: 1 },
  swordCopper: { out: ['swordCopper', 1], req: [['copperOre', 5], ['wood', 1]] },
  copperLamp: { out: ['copperLamp', 1], req: [['copperOre', 3], ['wood', 1]] },
};
// 대장장이가 파는 레시피 (돈으로 삼 — 실험판은 살 때만 돈, 만들 때는 재료만: 13장)
export const SMITH_SHOP = [['pickCopper', 100, '돌벽을 캘 수 있는 곡괭이'], ['copperLamp', 50, '금속 손님이 좋아하는 조명 (놓으면 가게 꾸미기도 돼요)'], ['swordCopper', 80, '금속 손님에게 비싸게 팔리는 검']];
// 손님 규칙
export const SHOP = {
  gapHere: 12, gapAway: 36,   // 손님이 오는 간격(초): 내가 거점 안에 있을 때 · 비웠을 때 (4번 「비워도 천천히 팔림」)
  maxCust: 2,                 // 한 번에 가게 안 손님 수
  decorStep: .06, decorMax: .3, // 꾸미기 하나마다 손님 간격 6% 줄임, 최대 30% (5번 「꾸민 만큼 손님 조금」)
  goodBase: .05, goodStep: .02, goodMax: .15, goodTol: 1.25, // 좋은 손님 확률·후하게 쳐 주는 정도
  love: 1.0, ok: 1.3,         // 값 ÷ 알맞은 값: 이하면 좋아함 · 이하면 괜찮음(삼) · 넘으면 비싸다(안 삼)
  shelfMax: 10,               // 진열대 한 칸에 올리는 개수
  speed: 2.4,                 // 손님 걷는 빠르기(칸/초)
  think: 1.4,                 // 진열대 앞에서 생각하는 시간(초)
};
// 꾸미기로 치는 물건 (거점 안에 놓인 것)
export const SHOP_DECOR = new Set(['chair', 'lampShroom', 'copperLamp']);
// 값 올리고 내리는 한 번의 폭
export const priceStep = p => p < 20 ? 1 : p < 100 ? 5 : 10;
