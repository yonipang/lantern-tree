// ================= deep caves: fire berry and frost radish crops, clothes and charms, cold/heat gauge =================
Object.assign(OBJ, {
  cropFire: { n: '불꽃 열매', crop: 'fire', grow: 200, yield: [['fireBerry', 2, 3, 1], ['fireSeed', 1, 2, 1]] },
  cropRadish: { n: '서리 무', crop: 'radish', grow: 200, yield: [['radish', 2, 3, 1], ['radishSeed', 1, 2, 1]] },
});
Object.assign(CROP_SOIL, { cropFire: 2, cropRadish: 1 }); Object.assign(STAR_OF, { fireBerry: 'fireBerryS', radish: 'radishS' });
Object.assign(ITEMS, {
  fireSeed: { n: '불꽃 열매 씨앗', kind: 'seed', crop: 'cropFire', d: '흙·이끼·버섯흙·수정 모래·풀밭에 심으면 3분 20초쯤 뒤 불꽃 열매가 열려요. 흙이 잘 맞아요.' },
  radishSeed: { n: '서리 무 씨앗', kind: 'seed', crop: 'cropRadish', d: '흙·이끼·버섯흙·수정 모래·풀밭에 심으면 3분 20초쯤 뒤 서리 무가 자라요. 이끼가 잘 맞아요.' },
  radish: { n: '서리 무', kind: 'food', food: 10, heal: 6, d: '얼음 동굴에서 온 시원한 무. 더위를 식히는 요리에 들어가요.' },
  fireBerryS: { n: '별 불꽃 열매', kind: 'food', food: 26, heal: 20, d: '별 작물에서 딴 특별한 불꽃 열매. 제작에서는 불꽃 열매 대신 쓸 수 있어요.' },
  radishS: { n: '별 서리 무', kind: 'food', food: 12, heal: 6, d: '별 작물에서 딴 특별한 서리 무. 제작에서는 서리 무 대신 쓸 수 있어요.' },
});
Object.assign(ICON, {
  fireSeed: packet('#ecd6a8', A => { A.e(8, 9, 2.2, 2.2, '#ff8a3d'); A.p(7, 8, '#ffd25c'); A.p(9, 6, C.leaf); }),
  radishSeed: packet('#ecd6a8', A => { A.e(8, 9, 2.2, 2.2, '#e8f8ff'); A.p(7, 8, '#ffffff'); A.p(9, 6, '#9fd8f0'); }),
  radish: A => { A.e(8, 10, 3.6, 4.4, '#e8f8ff'); A.e(7, 9, 2, 2.6, '#ffffff'); A.line(8, 14, 9, 15, '#c8e6f5'); A.p(10, 11, '#bfe6ff'); A.e(6, 4, 1.6, 2.6, '#7fc0e0'); A.e(10, 4, 1.6, 2.6, '#9fd8f0'); A.e(8, 3, 1.4, 2.4, '#bfe6ff'); },
  fireBerryS: A => { ICON.fireBerry(A); starMark(A); }, radishS: A => { ICON.radish(A); starMark(A); },
});
OBJ.fireBloom.drops.push(['fireSeed', 1, 1, 0.25]); ENEMY.snowling.drops.push(['radishSeed', 1, 1, 0.2]);
// ---- clothes (body) and charms (accessory): two slots; clothes halve the cold or heat gauge, charms come from the deep bosses ----
const WEAR_PAL = { obsCoat: ['#5a4a78', '#3a2f52', '#8a7ab0'], frostRobe: ['#8fd0f0', '#5a9ac8', '#d8f2ff'] };
const ACC_OF = { turtle: 'turtleCharm', spirit: 'snowBrooch' };
Object.assign(ITEMS, {
  obsCoat: { n: '흑요석 외투', kind: 'wear', slot: 'body', guard: 'cold', stack: 1, d: '얼음 동굴의 추위 게이지가 반 속도로 올라요. 입으면 어두운 보랏빛 외투가 보여요.' },
  frostRobe: { n: '서리 비단옷', kind: 'wear', slot: 'body', guard: 'hot', stack: 1, d: '용암 동굴의 더위 게이지가 반 속도로 올라요. 입으면 하늘빛 비단옷이 보여요.' },
  turtleCharm: { n: '거북 등껍질 부적', kind: 'wear', slot: 'neck', stack: 1, d: '용암 거북의 등껍질 조각. 목에 걸면 불덩이와 용암 웅덩이 피해가 30% 줄어요.' },
  snowBrooch: { n: '눈꽃 브로치', kind: 'wear', slot: 'head', stack: 1, d: '서리 정령의 눈꽃. 머리에 꽂으면 얼어서 느려지는 시간이 절반이 돼요.' },
});
Object.assign(ICON, {
  obsCoat: A => { A.poly([[4, 3], [12, 3], [14, 14], [2, 14]], '#3a2f52'); A.poly([[5, 3], [11, 3], [12.5, 13], [3.5, 13]], '#5a4a78'); A.r(7, 3, 2, 11, '#2a2238'); A.p(6, 6, '#8a7ab0'); A.p(6, 9, '#8a7ab0'); A.r(4, 2, 8, 2, '#8a7ab0'); A.p(10, 5, '#b99bff'); },
  frostRobe: A => { A.poly([[5, 2], [11, 2], [14, 14], [2, 14]], '#5a9ac8'); A.poly([[6, 2], [10, 2], [12.5, 13], [3.5, 13]], '#8fd0f0'); A.r(7, 2, 2, 12, '#d8f2ff'); A.p(5, 8, '#ffffff'); A.p(11, 10, '#ffffff'); A.r(3, 12, 10, 1, '#d8f2ff'); },
  turtleCharm: A => { A.line(8, 1, 8, 4, '#c9a46b'); A.e(8, 9, 5, 4.6, '#2f6e33'); A.e(8, 8.6, 4, 3.6, '#ff8a3d'); for (const [x, y] of [[6, 7], [10, 7], [8, 10]]) A.e(x, y, 1.3, 1.1, '#c4441a'); A.p(7, 6, '#ffd25c'); },
  snowBrooch: A => { for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; A.line(8, 8, 8 + Math.cos(a) * 5.4, 8 + Math.sin(a) * 5.4, '#9fd8f0'); } A.e(8, 8, 2.2, 2.2, '#ffffff'); A.p(8, 8, '#7fc0e0'); },
});
RECIPES.push(Rc('obsCoat', 1, [['obsidian', 4], ['fiber', 10], ['goldBar', 1]], 'forge', 'tool'), Rc('frostRobe', 1, [['frostShard', 6], ['fiber', 10], ['goldBar', 1]], 'forge', 'tool'));
// v42: slots in their own 「장비」 menu — clothes · head · neck · ring (rings arrive with the smelter in v43); v48: the weapon slot is gone (the held weapon is used)
const EQ_SLOTS = [['body', '옷'], ['head', '머리장식'], ['neck', '목걸이'], ['ring', '반지']], EQ_N = Object.fromEntries(EQ_SLOTS);
const freshEquip = () => ({ body: null, head: null, neck: null, ring: null });
const eqSlotOf = id => { const it = ITEMS[id]; return !it ? null : it.kind === 'wear' ? it.slot : null; };
const wearing = id => !!(G && G.equip && EQ_SLOTS.some(([sl]) => G.equip[sl] && G.equip[sl].id === id));
const eqCopy = s => { const c = { id: s.id, c: 1 }; if (s.dur != null) c.dur = s.dur; if (s.lv) c.lv = s.lv; return c; };
function wearItem(i) { const s = G.inv[i], it = s && ITEMS[s.id], sl = s && eqSlotOf(s.id); if (!sl) return; const old = G.equip[sl];
  G.equip[sl] = eqCopy(s);
  G.inv[i] = old ? eqCopy(old) : null; // the clothes taken off go where the new ones were
  if (sl === 'body') buildPlayer(G.outfit || 0); SFX.craft(); puff(G.p.x, G.p.y - .5, sl === 'body' ? (WEAR_PAL[s.id] || ['#fff'])[0] : '#ffe9a8', 12, 2.2, .5);
  toast(`${josa(it.n, '을', '를')} ${sl === 'body' ? '입었어요' : '달았어요'}`, 'good', 'wear'); invDirty = true; }
function unwear(slot) { const s = G.equip[slot]; if (!s) return; const left = moveInto(G.inv, eqCopy(s)); if (left) { toast('가방이 가득 찼어요', null, 'full'); return; } G.equip[slot] = null; if (slot === 'body') buildPlayer(G.outfit || 0); SFX.place(); invDirty = true; }
// v48: a weapon picked up or made while no weapon sits in the hotbar goes into an empty hotbar slot, ready to hold
function autoHotWeapon(id) { if (!G || ITEMS[id].kind !== 'sword') return; for (let k = 0; k < HOT; k++) { const x = G.inv[k]; if (x && ITEMS[x.id] && ITEMS[x.id].kind === 'sword') return; }
  const to = G.inv.slice(0, HOT).findIndex(x => !x), k = G.inv.findIndex((x, j) => j >= HOT && x && x.id === id); if (to < 0 || k < 0) return;
  G.inv[to] = G.inv[k]; G.inv[k] = null; invDirty = true; if (started) toast(`${josa(ITEMS[id].n, '을', '를')} 단축칸에 넣었어요 · 골라 들면 그 무기로 싸워요`, 'good', 'wphot'); }
