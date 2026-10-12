// ================= cooking: buff dishes, recipe notes, recipe book =================
// a dish gives one effect in one of three tiers; up to 3 different effects at once, the same effect keeps only its best tier
const BUFF_DUR = [180, 300, 480], BUFF_MAX = 3;
const pct = v => Math.round(v * 100) + '%';
const EFF = {
  atk: { n: '공격력', v: [.05, .10, .15], t: v => '+' + pct(v) }, def: { n: '받는 피해', v: [.05, .10, .15], t: v => '-' + pct(v) },
  move: { n: '이동 속도', v: [.10, .15, .20], t: v => '+' + pct(v) }, mine: { n: '채굴 속도', v: [.10, .20, .30], t: v => '+' + pct(v) },
  light: { n: '빛 범위', v: [.25, .50, .75], t: v => '+' + pct(v) }, regen: { n: '체력 재생', v: [4, 2, 1], t: v => `${v}초마다 +1` },
  maxhp: { n: '최대 체력', v: [10, 20, 30], t: v => '+' + v }, hunger: { n: '배고픔 절약', v: [.75, .5, .35], t: v => `${pct(v)} 속도로 줄어듦` },
  luck: { n: '낚시 운', v: [1, 2, 3], t: v => `${v}단계` }, xp: { n: '경험치', v: [.10, .20, .30], t: v => '+' + pct(v) },
};
// [id, name, effect, tier (0: recovery only, no effect slot), icon shape, colors, ingredients, where its recipe note is found]
const DISHES = [
  ['skewer', '버섯 꼬치', 'atk', 1, 'skewer', ['#e36b6b', '#ff7aa2'], [['mushroom', 3], ['berry', 1]], 'mon'],
  ['capSteak', '버섯 갓 스테이크', 'atk', 2, 'plate', ['#b9573f', '#6ff2e6'], [['shroomCap', 2], ['glowcap', 1]], 'room:r10'],
  ['gelSoup', '말랑 젤 수프', 'def', 1, 'bowl', ['#9be37a', '#e36b6b'], [['gel', 2], ['mushroom', 1], ['gWater', 1]], 'mon'],
  ['beanPorridge', '수정 콩 죽', 'def', 2, 'bowl', ['#e8e0f0', '#b99bff'], [['cbean', 2], ['gel', 1], ['gWater', 1]], 'room:r20'],
  ['beanHotpot', '수정 콩 전골', 'def', 3, 'bowl', ['#d9774a', '#b99bff'], [['cbean', 3], ['shroomCap', 1], ['gWater', 1]], 'room:r30'],
  ['bouncyJelly', '통통 튀는 젤리', 'move', 1, 'jelly', ['#86d96b', '#ff7aa2'], [['gel', 2], ['berry', 1]], 'mon'],
  ['eelGrill', '장어 구이', 'move', 2, 'plate', ['#b673de', '#6ff2e6'], [['sporeEel', 1], ['glowcap', 1]], 'room:r01'],
  ['capStirfry', '버섯 갓 볶음', 'mine', 1, 'plate', ['#e07b5f', '#e8d2b0'], [['mushroom', 2], ['shroomCap', 1]], 'gather'],
  ['beanStirfry', '수정 콩 볶음', 'mine', 2, 'plate', ['#b99bff', '#e8d2b0'], [['cbean', 2], ['mushroom', 1]], 'room:r21'],
  ['glowGrill', '빛버섯 구이', 'light', 1, 'skewer', ['#6ff2e6', '#c8fff6'], [['glowcap', 2]], 'gather'],
  ['glowPancake', '반짝 빛버섯전', 'light', 2, 'cake', ['#f2d38a', '#6ff2e6'], [['glowcap', 2], ['berry', 1]], 'quest:s_crop2'],
  ['glowSoup', '빛버섯 수정 수프', 'light', 3, 'bowl', ['#6ff2e6', '#b99bff'], [['glowcap', 2], ['cbean', 1], ['gWater', 1]], 'room:r40'],
  ['shroomPorridge', '버섯 죽', 'regen', 1, 'bowl', ['#f3e2c4', '#e36b6b'], [['mushroom', 2], ['gWater', 1]], 'mon'],
  ['jellyStew', '젤리 버섯찜', 'regen', 2, 'bowl', ['#86d96b', '#e07b5f'], [['shroomCap', 1], ['gel', 2]], 'room:r11'],
  ['capSoup', '버섯 갓 수프', 'maxhp', 1, 'bowl', ['#e8a37a', '#e07b5f'], [['shroomCap', 1], ['mushroom', 2], ['gWater', 1]], 'gather'],
  ['beanSteam', '수정 콩 버섯찜', 'maxhp', 2, 'bowl', ['#e8e0f0', '#e36b6b'], [['cbean', 1], ['mushroom', 2], ['glowcap', 1]], 'quest:s_crop4'],
  ['koiSteam', '별빛 잉어찜', 'maxhp', 3, 'plate', ['#ffd25c', '#ffb3c6'], [['koi', 1], ['cbean', 1]], 'bottle'],
  ['petalTea', '꽃잎 차', 'hunger', 1, 'cup', ['#f7b8cf', '#ffffff'], [['anyPetal', 2], ['gWater', 1]], 'gather'],
  ['petalDango', '꽃잎 베리 경단', 'hunger', 2, 'dango', ['#f7b8cf', '#ff7aa2', '#b99bff'], [['anyPetal', 2], ['berry', 2], ['cbean', 1]], 'room:r00'],
  ['baitDango', '베리 미끼 경단', 'luck', 1, 'dango', ['#ff7aa2', '#86d96b', '#ff7aa2'], [['berry', 2], ['gel', 1]], 'fish'],
  ['crucianBraise', '붕어 조림', 'luck', 2, 'plate', ['#c9a46b', '#ff7aa2'], [['crucian', 1], ['berry', 2]], 'quest:s_fish'],
  ['shrimpDango', '반짝 새우 경단', 'luck', 3, 'dango', ['#ff9ab0', '#6ff2e6', '#b99bff'], [['shrimp', 2], ['glowcap', 2], ['cbean', 1]], 'boss:golem'],
  ['petalPancake', '꽃잎 버섯 부침', 'xp', 1, 'cake', ['#f2d38a', '#ff7aa2'], [['anyPetal', 1], ['mushroom', 2]], 'gather'],
  ['petalRiceCake', '꽃잎 콩떡', 'xp', 2, 'cake', ['#f4f0f8', '#f7b8cf'], [['cbean', 2], ['anyPetal', 1]], 'quest:s_rooms'],
  ['catfishSoup', '메기 매운탕', null, 0, 'bowl', ['#e84a3a', '#ffd25c'], [['catfish', 1], ['mushroom', 2], ['gWater', 1]], 'boss:slime'],
];
const DISH = {}; for (const d of DISHES) DISH[d[0]] = { id: d[0], n: d[1], ef: d[2], tier: d[3], shape: d[4], col: d[5], req: d[6], src: d[7] };
const KNOWN0 = ['pie', 'stew', 'fishStew'];
const ROOM_NOTES = [['petalDango', 'eelGrill'], ['capSteak', 'jellyStew'], ['beanPorridge', 'beanStirfry'], ['beanHotpot'], ['glowSoup']];
const BOSS_NOTES = { slime: ['catfishSoup'], golem: ['shrimpDango'] }, BOSS_REGION = { slime: 0, queen: 1, golem: 2, turtle: 3, spirit: 4 };
const REGION_N = ['이끼 동굴', '버섯숲', '수정 동굴', '용암 동굴', '얼음 동굴'];
function noteHint(d) { const s = d.src; if (s === 'mon') return '이끼 동굴·버섯숲 몬스터가 가끔 떨어뜨려요'; if (s === 'gather') return '풀·작물·빛버섯을 거둘 때 가끔 나와요'; if (s === 'fish') return '낚시하다 보면 가끔 걸려요'; if (s === 'bottle') return '낚시하다 병 속 쪽지로 걸려요'; if (s === 'ending') return '다섯 등불을 모두 밝히면';
  if (s.startsWith('room:')) return `${REGION_N[+s[6]]} 숨은 방 어딘가`; if (s.startsWith('boss:')) return `${BOSSES[s.slice(5)].n}을(를) 물리치면`; if (s.startsWith('guide:')) { const q = GUIDE.find(x => x.id === s.slice(6)); return q ? `이야기 퀘스트 「${escHTML(qText(q).replace(/ \(.*\)$/, ''))}」 보상` : '이야기 퀘스트 보상'; } if (s.startsWith('quest:')) { const q = QSIDE.find(x => x.id === s.slice(6)); return q ? `도전 퀘스트 「${escHTML(qText(q).replace(/ \(.*\)$/, ''))}」 보상` : '도전 퀘스트 보상'; } return ''; }
const knows = id => !DISH[id] || !!(G && G.recipes && G.recipes[id]);
const DISH_FOOD = [[60, 60], [20, 6], [28, 10], [36, 14]];
