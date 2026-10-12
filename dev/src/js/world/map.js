// ================= 지도 틀 (구조 변경 5단계: content/items.js·world.js에서 옮김) =================
// 지도 모양(1 = 처음 200×200 지도, 2 = 600×600 고리 지도)과 크기·등불나무·보스 자리, 칸 번호(idx)·지도 안인지(inB), 방향 이름.
// v47부터 두 가지: 1은 v47 전 세이브가 그대로 쓰는 200×200, 2는 새 게임의 고리 지도
// (가운데 등불나무, 이끼 동굴(북)·버섯숲(남) 고리, 수정 동굴(북)·용암(남동)·얼음(남서) 큰 고리, 바다 고리, 가장자리 암반)

// ================= data =================
// v47: two map layouts. 1 = the original 200×200 map (every save made before v47 keeps it); 2 = the 600×600 ring map for new games:
// the lantern tree in the middle, a ring split into the moss cave (north) and mushroom forest (south), then a wide ring split into
// the crystal cave (north), lava cave (south-east) and ice cave (south-west), a sea ring, and hard rock at the edge
export let LAY = 1, W = 200, H = 200, CX = 100, CY = 100, BX = 144, BY = 102, SA = { x: 54, y: 118 }, SB = { x: 106, y: 24 }, SL = { x: 96, y: 184 }, SI = { x: 16, y: 104 };
export const L2 = { r1: 34, r2: 100, r3: 250, r4: 272 }; // ring radii of layout 2 (start · moss/mushroom · crystal/lava/ice · sea; rock beyond)
export function setLayout(v) { LAY = v === 2 ? 2 : 1;
  if (LAY === 2) { W = H = 600; CX = CY = 300; const at = (deg, r) => ({ x: Math.round(CX + Math.cos(deg * Math.PI / 180) * r), y: Math.round(CY + Math.sin(deg * Math.PI / 180) * r) });
    const b = at(-35, 64); BX = b.x; BY = b.y; SA = at(140, 66); SB = at(-90, 172); SL = at(30, 172); SI = at(150, 172); }
  else { W = H = 200; CX = CY = 100; BX = CX + 44; BY = CY + 2; SA = { x: CX - 46, y: CY + 18 }; SB = { x: CX + 6, y: CY - 76 }; SL = { x: CX - 4, y: CY + 84 }; SI = { x: CX - 84, y: CY + 4 }; }
  layoutTexts(); }
export const devLayout = () => { try { const v = +localStorage.getItem('lantern-tree-layout'); return v === 1 || v === 2 ? v : 0; } catch (_) { return 0; } }; // tests pin the old layout
export const DIR8 = ['동쪽', '남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽', '북쪽', '북동쪽'];
export const dirKo = (x, y) => DIR8[((Math.round(Math.atan2(y - CY, x - CX) / (Math.PI / 4)) % 8) + 8) % 8];
export const LAVA = 17;
export const idx = (x, y) => y * W + x;
// ================= world helpers =================
export const inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
