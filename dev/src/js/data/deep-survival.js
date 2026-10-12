// ================= 깊은 동굴 생존 데이터 (구조 변경 2단계: features/deep-survival.js에서 데이터만 옮김) =================
// 더위·추위 대비 요리, 게이지 문구, 지역 재료, 귀환석, 잃어버린 꾸러미, 깊은 보스 단계 문구 — 밸런스 숫자와 이름·설명은 여기서 고쳐요.
// 이 파일은 shell.html에서 features/deep-survival.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { BOSS_NOTES, DISH, DISHES, DISH_FOOD, EFF, ROOM_NOTES, STAR_OF } from './farming-cooking.js';
import { ENEMY } from './rpg-nature.js';
import { ITEMS, OBJ, RECIPES, Rc, TIPS } from './items.js';
import { GUIDE } from './quests.js';

// ---- dishes for the deep caves: cold / heat protection and the tier-3 dishes made with fire berries and frost radishes ----
Object.assign(EFF, { cold: { n: '추위 대비', v: [.75, .5, 0], t: v => v ? `추위 게이지 ${pct(v)} 속도` : '추위 게이지 안 오름' }, heat: { n: '더위 대비', v: [.75, .5, 0], t: v => v ? `더위 게이지 ${pct(v)} 속도` : '더위 게이지 안 오름' } });
export const DEEP_DISHES = [
  ['hotTea', '따끈 버섯차', 'cold', 1, 'cup', ['#c98a5a', '#e36b6b'], [['mushroom', 1], ['gWater', 1]], 'guide:cpick'],
  ['hotSoup', '따끈 버섯 수프', 'cold', 2, 'bowl', ['#d9774a', '#6ff2e6'], [['mushroom', 2], ['glowcap', 1], ['gWater', 1]], 'guide:cpick'],
  ['fireStew', '불꽃 열매 스튜', 'cold', 3, 'bowl', ['#ff6a3d', '#ffd25c'], [['fireBerry', 2], ['mushroom', 1]], 'boss:turtle'],
  ['coolTea', '시원 베리차', 'heat', 1, 'cup', ['#ff9ab0', '#bfe6ff'], [['berry', 1], ['gWater', 1]], 'guide:cpick'],
  ['coolPunch', '시원 베리 화채', 'heat', 2, 'bowl', ['#ffb3c6', '#ff7aa2'], [['berry', 3], ['gWater', 1]], 'guide:cpick'],
  ['radishSoup', '서리 무 냉국', 'heat', 3, 'bowl', ['#d8f2ff', '#9fd8f0'], [['radish', 2], ['gWater', 1]], 'boss:spirit'],
  ['fireSkewer', '불꽃 버섯 꼬치', 'atk', 3, 'skewer', ['#ff6a3d', '#b9573f'], [['fireBerry', 1], ['shroomCap', 2]], 'boss:turtle'],
  ['radishSalad', '서리 무 베리 냉채', 'move', 3, 'plate', ['#e8f8ff', '#ff7aa2'], [['radish', 1], ['berry', 2]], 'boss:spirit'],
  ['fireBeans', '불꽃 콩 볶음', 'mine', 3, 'plate', ['#b99bff', '#ff8a3d'], [['cbean', 2], ['fireBerry', 1]], 'boss:turtle'],
  ['fireJelly', '불꽃 열매 젤리', 'regen', 3, 'jelly', ['#ff8a3d', '#ffd25c'], [['fireBerry', 1], ['gel', 3]], 'room:r30'],
  ['frostTea', '서리 꽃잎 냉차', 'hunger', 3, 'cup', ['#bfe6ff', '#f7b8cf'], [['radish', 1], ['anyPetal', 2], ['gWater', 1]], 'boss:spirit'],
  ['firePie', '불꽃 꽃잎 파이', 'xp', 3, 'cake', ['#ff8a3d', '#f7b8cf'], [['fireBerry', 1], ['anyPetal', 2], ['berry', 2]], 'room:r40'],
];
for (const d of DEEP_DISHES) { DISHES.push(d); DISH[d[0]] = { id: d[0], n: d[1], ef: d[2], tier: d[3], shape: d[4], col: d[5], req: d[6], src: d[7] }; const [fd, hl] = DISH_FOOD[d[3]];
  ITEMS[d[0]] = { n: d[1], kind: 'food', food: fd, heal: hl, buff: [d[2], d[3]], d: d[2] === 'cold' || d[2] === 'heat' ? '깊은 동굴에 가기 전에 먹어 두면 든든해요.' : '버프 요리예요. 먹으면 효과가 생겨요.' };
  const r = Rc(d[0], 1, d[6], 'pot', 'food'); r.dish = d[0]; RECIPES.push(r);
  ITEMS['rn_' + d[0]] = { n: `레시피 쪽지 · ${d[1]}`, note: d[0], d: '주우면 바로 요리솥 레시피를 알게 돼요.' };
  const k = d[6].findIndex(([m]) => STAR_OF[m]); if (k >= 0) { const [m, c] = d[6][k], sm = STAR_OF[m], base = ITEMS[d[0]], id = d[0];
    ITEMS[id + 'S'] = { ...base, n: '별 ' + base.n, food: Math.round(base.food * 1.2), star: 1, base: id, d: '별 작물로 만든 특별한 요리. 효과가 1.5배 오래가고 배가 더 불러요.' };
    const req = d[6].map(x => x.slice()); if (c > 1) { req[k][1] = c - 1; req.push([sm, 1]); } else req[k] = [sm, 1]; const sr = Rc(id + 'S', 1, req, 'pot', 'food'); sr.dish = id; sr.star = 1; sr.need = () => knows(id) && availCount0(sm) > 0; RECIPES.push(sr); } }
ROOM_NOTES[3].push('fireJelly'); ROOM_NOTES[4].push('firePie');
Object.assign(BOSS_NOTES, { turtle: ['fireStew', 'fireSkewer', 'fireBeans'], spirit: ['radishSoup', 'radishSalad', 'frostTea'] });
{ const g = GUIDE.find(q => q.id === 'cpick'); if (g) g.rw = g.rw.concat(['hotTea', 'hotSoup', 'coolTea', 'coolPunch'].map(id => ['rn_' + id, 1])); }
// ---- cold / heat gauge: only in the lava and ice caves ----
export const ENV_TXT = { hot: ['후끈해요', '더워요', '너무 더워요!', '타 버릴 것 같아요!'], cold: ['으슬으슬해요', '추워요', '너무 추워요!', '얼어붙을 것 같아요!'] };
// v43: every region has its own terrain, mineral and special material (shown on the map once visited)
export const REGION_MAT = [['dirt', 'copperOre', 'fiber'], ['stone', 'ironOre', 'shroomCap'], ['granite', 'crystal', 'cryGem'], ['basalt', 'goldOre', 'obsidian'], ['iceBlock', 'frostShard', 'radish']];
TIPS.push('용암 동굴과 얼음 동굴에서는 더위·추위 게이지가 올라요. 대비 요리와 옷으로 늦출 수 있어요.', '얼음 동굴에서는 횃불이나 램프 곁, 용암 동굴에서는 물웅덩이 곁에서 게이지가 내려가요.');
// ================= getting around and the cost of fainting =================
// homestone: hold still for 1.5 s to go home (bed, or the lantern tree); it leaves a marker so you can come straight back once
export const RECALL_T = 1.5, RECALL_CD = 60;
ITEMS.homeStone = { n: '귀환석', kind: 'recall', stack: 1, d: `들고 누른 뒤 ${RECALL_T}초 동안 가만히 있으면 침대(없으면 등불나무)로 돌아가요. 떠난 자리에 표지가 남아서, 집 근처에서 다시 쓰면 그곳으로 한 번 돌아갈 수 있어요. 한 번 쓰면 1분 쉬어요.` };
RECIPES.push(Rc('homeStone', 1, [['crystal', 6], ['glowcap', 3], ['copperBar', 2]], 'forge', 'tool'));
{ const g = GUIDE.find(q => q.id === 'cpick'); if (g) g.rw = g.rw.concat([['homeStone', 1]]); }
// fainting drops a quarter of each material stack in a bundle where you fell; walk back to pick it up (not during the first steps of the story)
export const LOST_SHARE = .25, LOST_MAX = 5;
OBJ.lostBag = { n: '잃어버린 꾸러미', lost: 1, light: [2, '#ffe9a8'] };
TIPS.push('귀환석을 쓰면 집으로 돌아오고, 집 근처에서 다시 쓰면 떠난 자리로 돌아가요.', '쓰러지면 재료 일부를 그 자리에 떨어뜨려요. 지도에 꾸러미가 표시돼요.');
// ================= the deep bosses fight in three stages (66% / 33%): a short roar with no damage taken, then one new thing per stage =================
export const PHASE_BOSS = { turtle: 1, spirit: 1 };
export const PHASE_TIP = { turtle: ['등껍질에 금이 갔어요! 굴러오다 벽에 부딪힐 때마다 불씨가 튀어요', '화산 등껍질! 바닥이 빨갛게 빛나는 곳을 피하고, 분화가 끝나면 등껍질이 열려요 (피해 1.5배)'],
  spirit: ['얼음 기둥이 솟았어요! 기둥 뒤에 숨으면 얼음 고리를 막아 줘요 (몇 번 맞으면 부서져요)', '눈보라 분신! 반투명한 분신은 한 대면 사라지고, 진짜만 얼음 고리를 쏴요'] };
// frost spirit: stage 2 raises four ice pillars to hide behind, stage 3 adds two see-through decoys and turns the gap in its rings
OBJ.icePillar = { n: '얼음 기둥', solid: 1, light: [2.2, '#9fd8f0'] };
ENEMY.spiritClone = { n: '눈보라 분신', hp: 1, dmg: 0, spd: 0, r: .5, hop: 0, calm: 1, drops: [], col: '#d4f6ff' };
TIPS.push('용암 거북과 서리 정령은 체력이 3분의 2, 3분의 1로 줄 때마다 새 기술을 꺼내요. 체력 막대의 눈금을 봐요.');
