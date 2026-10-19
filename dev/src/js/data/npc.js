// ================= v104 이야기 2: 그림자 고치 · NPC 6명 · 등불나무 곁 마을 · 대화 (dev/design/세계관-NPC.md) =================
// NPC는 그림자 고치(cocoon)에 갇혀 있어요. 고치를 공격 버튼으로 3번 치면(쳐서 회수처럼) 풀려나 등불나무 곁 마을 자리로 가요. 고치 둘레에는 그림자 조각이 지켜요.
// 이름·대사는 Claude가 임시로 지음(사용자가 바꿀 수 있음, 【검토 중】). 호감도 없음. 기록관 학자(scholar)는 v106 기록관에서 구해요.
import { ITEMS, OBJ, USE, USE_LBL } from './items.js';
import { ENEMY } from './rpg-nature.js';
// id → 이름 · 직책 · 어디서 구하는지(지역 번호, 등불나무에서 최소 거리) · 마을 자리(나무 기준 각도) · 생김새(lookDef 값) · 대사
export const NPCS = {
  farmer: { n: '도라 할머니', job: '농부', b: 0, minD: 22, maxD: 60, ang: 200, look: { hair: 'buns', hc: 2, eye: 0, outfit: 'apron', oc: 7, hat: 'none' }, grey: true,
    hello: '아이고, 고마워라. 그림자 속에서 몇 밤을 보냈는지 몰라.', talk: ['밭은 흙이 반이야. 작물마다 좋아하는 흙이 달라. 씨앗 설명을 잘 읽어 봐.', '물뿌리개로 물을 주고 비료를 주면 더 빨리 자라. 등불나무 가까이면 더 좋고.', '별이 든 작물은 아주 가끔 나와. 2×2로 심으면 거대 작물이 되기도 하지.'] },
  cook: { n: '솔', job: '요리사', b: 1, minD: 30, maxD: 90, ang: 140, look: { hair: 'short', hc: 4, eye: 4, outfit: 'apron', oc: 1, hat: 'mushroom' },
    hello: '휴… 버섯숲 냄새가 이렇게 반가울 줄이야. 고마워요!', talk: ['요리솥에서 재료를 넣어 두면 나중에 꺼낼 수 있어요. 꺼 둬도 익어요.', '레시피 쪽지는 몬스터·채집·숨은 방에서 나와요. 모르는 요리는 쪽지부터!', '버프 요리는 세 개까지 겹쳐요. 깊은 동굴엔 더위·추위 요리를 꼭 챙겨요.'] },
  shepherd: { n: '토리', job: '목동', b: 0, minD: 45, maxD: 95, ang: 260, look: { hair: 'spiky', hc: 3, eye: 1, outfit: 'vest', oc: 4, hat: 'sprout' },
    hello: '으앙, 무서웠어! 우리 동물들은… 아직 어둠 속에 있어.', talk: ['올가미를 들고 동물에게 다가가서 밧줄을 돌려 봐. 초록 칸에서 던지면 잡혀!', '목장을 만들면 소·닭·양이 우유·알·양모를 줘. 울타리로 가둬 두면 돼.', '펫은 캐릭터 창에서 골라. 강아지는 물건을 끌어오고, 고양이는 운이 좋아져.'] },
  smith: { n: '하람', job: '대장장이', b: 3, minD: 60, maxD: 200, ang: 320, look: { hair: 'braid', hc: 1, eye: 3, outfit: 'vest', oc: 5, hat: 'none' },
    hello: '불 곁에서 그림자에 잡히다니, 대장장이 체면이 말이 아니군. 고맙네.', talk: ['장비제작대 곁에서 강화·수리·분해를 해. 강화는 +5까지, 단계마다 공격력 8%.', '착용 레벨이 모자라면 좋은 무기도 못 들어. 레벨을 올리고 와.', '보스는 종류마다 특별 무기 여섯 가지를 남겨. 안 받은 것부터 나오지.'] },
  guide: { n: '나루', job: '길잡이', b: 2, minD: 50, maxD: 180, ang: 20, look: { hair: 'pony', hc: 6, eye: 2, outfit: 'cloak', oc: 3, hat: 'lanternpin' }, start: 1, // v110: 처음부터 마을에 (고치 없음)
    hello: '불빛을 따라 여기까지 왔어요. 길잡이는 길을 잃으면 안 되는데… 헤헤.', talk: ['할머니가 그랬어요. 길잡이 집안은 옛날에 사람들을 등불지기 마을까지 데려다줬대요. 저는 등불지기를 본 적은 없지만요.', '워프포인트는 등불지기들이 쓰던 길목 돌이에요. 만지면 다시 켜지고, 켜진 곳끼리 지도에서 옮겨 다녀요.', '포탈은 석영 작업대에서 만들어 어디든 세울 수 있어요. 한 사람당 다섯 개까지.', '지도에서 아이콘을 누르면 길 안내 화살표가 떠요. 보물상자 표시도 켜 두세요.'] },
  scholar: { n: '문', job: '기록관 학자', b: 0, minD: 0, maxD: 0, ang: 80, look: { hair: 'long', hc: 2, eye: 3, outfit: 'robe', oc: 2, hat: 'crystalpin' }, archive: true,
    hello: '…여기가 기록관이군요. 일기의 글씨가 보여요. 읽어 드릴게요.', talk: ['등불지기들의 일기는 기록관마다 한 장씩 남아 있어요. 모두 모으면 마지막 장이 보일 거예요.', '일기 속 그림의 등불이… 당신 것과 닮았어요. 기분 탓이겠죠.'] },
};
export const NPC_IDS = Object.keys(NPCS);
OBJ.cocoon = { n: '그림자 고치', solid: 1, cocoon: 1, light: [1.5, '#8a6ad0'] };
OBJ.npc = { n: '사람', solid: 1, npc: 1 };
ITEMS.cocoonBit = { n: '그림자 실', d: '그림자 고치를 부수면 나오는 검은 실. 어둠을 담아 둔 것처럼 차가워요.' };
USE.npc = 'talk'; USE_LBL.talk = '말 걸기';
// 고치를 지키는 그림자 조각: 빛 안에서 받는 피해 2배 (sim/combat.js), 고치 둘레 5칸을 떠나지 않음 (sim/npc.js)
Object.assign(ENEMY, { shadowBit: { n: '그림자 조각', hp: 40, dmg: 9, spd: 2.6, r: 0.3, hop: 0, aggro: 6, shadow: 1, drops: [['cocoonBit', 1, 1, 0.5]], col: '#3a2a5a' } });
// v110 나루의 첫 장면 (첫 이야기 퀘스트 「나루에게 말 걸기」, 새 게임에서만). 나루는 주인공이 누구인지 몰라요. 글은 Claude 임시(【검토 중】).
export const NARU_INTRO = ['아, 깼어요? 나무 밑에 쓰러져 있어서 깜짝 놀랐어요.', '저는 나루예요, 길잡이요. 불빛을 따라왔는데… 마을 불이 다 꺼져 있네요.',
  '할머니가 그랬어요. 이 등불나무엔 원래 등불이 다섯 개 걸려 있었대요. 빛씨앗 다섯 개를 다 심으면 나무가 다시 깨어난다고요.',
  '이름도 기억 안 나요? 그럼 일단 불부터 피워요. 어두워지면 그림자가 나오거든요. 저기 뿌리기둥에서 나무부터 모아 와요!'];
export const COCOON_HITS = 3, COCOON_GUARDS = 3, COCOON_GUARD_R = 5, COCOON_WAKE = 9;
// ================= v105 물물교환 가게 (data/npc.js에 덧붙임) =================
// NPC마다 자기 기능에 맞는 물건을 바꿔 줘요. 돈 없음. 교환은 [주는 것 ×n] → [받는 것 ×m]. 가방 + 16칸 안 상자 재료를 함께 써요(제작과 같음).
// 하루(게임 시간 20분 = 1200초) 제한: NPC마다 한 줄에 3번까지, 지나면 다시 채워져요(stats.barter[npc][k] = [횟수, 채워지는 시각]). 수치는 Claude 임시(【검토 중】).
export const BARTER_DAY = 1200, BARTER_PER = 3;
// npc → [[주는 [id, n]…], [받는 [id, n]…], 설명]
export const BARTER = {
  farmer: [
    [[['berry', 6]], [['berrySeed', 3]], '통통베리를 씨앗으로'],
    [[['mushroom', 6]], [['spore', 3]], '버섯을 포자로'],
    [[['fiber', 10], ['gel', 2]], [['fert', 2]], '이끼 섬유와 젤로 비료'],
    [[['wood', 12]], [['glowSpore', 2]], '나무를 빛버섯 포자로'],
    [[['cocoonBit', 3]], [['cbeanSeed', 2]], '그림자 실을 수정 콩 씨앗으로'],
  ],
  cook: [
    [[['mushroom', 3], ['berry', 2]], [['stew', 1]], '버섯 스튜 한 그릇'],
    [[['minnow', 2]], [['grilledFish', 2]], '피라미를 구운 생선으로'],
    [[['fireBerry', 2]], [['rn_fireSkewer', 1]], '불꽃 열매를 요리 쪽지로 (한 번만)'],
    [[['shroomCap', 4]], [['rn_capSteak', 1]], '버섯 갓을 요리 쪽지로 (한 번만)'],
    [[['cocoonBit', 2]], [['pie', 2]], '그림자 실을 베리 파이로'],
  ],
  shepherd: [
    [[['fiber', 8], ['rope', 2]], [['lasso', 1]], '올가미 밧줄'],
    [[['wool', 3]], [['rope', 6]], '양모를 이끼 끈으로'],
    [[['egg', 2]], [['berry', 6]], '달걀을 통통베리로'],
    [[['milk', 2]], [['stew', 1]], '우유를 스튜로'],
    [[['cocoonBit', 3]], [['wool', 4]], '그림자 실을 양모로'],
  ],
  smith: [
    [[['copperOre', 6]], [['copperBar', 2]], '구리광석을 구리괴로 (용광로 없이)'],
    [[['ironOre', 6]], [['ironBar', 2]], '철광석을 철괴로'],
    [[['goldOre', 6]], [['goldBar', 2]], '금광석을 금괴로'],
    [[['obsidian', 4], ['frostShard', 4]], [['cryGem', 1]], '흑요석·서리 결정을 수정결정으로'],
    [[['cocoonBit', 4]], [['obsidian', 3]], '그림자 실을 흑요석으로'],
  ],
  guide: [
    [[['crystal', 8], ['ironBar', 2]], [['quartzR', 2]], '석영을 정제 석영으로'],
    [[['glowcap', 6]], [['torch', 10]], '빛버섯을 횃불로'],
    [[['cryGem', 2]], [['homeStone', 1]], '수정결정을 귀환석으로'],
    [[['cocoonBit', 5]], [['crystal', 10]], '그림자 실을 석영으로'],
  ],
  scholar: [
    [[['cocoonBit', 2]], [['rn_gelSoup', 1]], '그림자 실을 옛 요리 쪽지로 (한 번만)'],
  ],
};
// 쪽지(rn_…)는 받은 적이 있으면 다시 안 줘요 (sim/npc.js barterCan)
