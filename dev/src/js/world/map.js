// ================= 지도 틀 (구조 변경 5단계: content/items.js·world.js에서 옮김) =================
// 지도 모양(1 = 처음 200×200 지도, 2 = 600×600 고리 지도)과 크기·등불나무·보스 자리, 칸 번호(idx)·지도 안인지(inB), 방향 이름.
// v47부터 두 가지: 1은 v47 전 세이브가 그대로 쓰는 200×200, 2는 새 게임의 고리 지도
// (가운데 등불나무, 이끼 동굴(북)·버섯숲(남) 고리, 수정 동굴(북)·용암(남동)·얼음(남서) 큰 고리, 바다 고리, 가장자리 암반)
import { layoutTexts } from '../sim/quests.js';

// ================= data =================
// v47: two map layouts. 1 = the original 200×200 map (every save made before v47 keeps it); 2 = the 600×600 ring map for new games:
// the lantern tree in the middle, a ring split into the moss cave (north) and mushroom forest (south), then a wide ring split into
// the crystal cave (north), lava cave (south-east) and ice cave (south-west), a sea ring, and hard rock at the edge
export let LAY = 1, W = 200, H = 200, CX = 100, CY = 100, BX = 144, BY = 102, SA = { x: 54, y: 118 }, SB = { x: 106, y: 24 }, SL = { x: 96, y: 184 }, SI = { x: 16, y: 104 };
export const L2 = { r1: 34, r2: 100, r3: 250, r4: 272 }; // ring radii of layout 2 (start · moss/mushroom · crystal/lava/ice · sea; rock beyond)
// v70 (BF-04): map version 3 = the ring map of layout 2 whose five boss rooms (and their altars) sit at places picked per seed inside
// their own region (world/anchors.js), saved with the world as mapA. Versions 1 and 2 keep their fixed places forever.
export let MAPV = 1, ANCH = null;
export const angAt = deg => ({ x: Math.round(CX + Math.cos(deg[0] * Math.PI / 180) * deg[1]), y: Math.round(CY + Math.sin(deg[0] * Math.PI / 180) * deg[1]) });
export const ANCH2 = { B: [-35, 64], A: [140, 66], SB: [-90, 172], SL: [30, 172], SI: [150, 172] }; // layout 2's fixed places (angle°, distance)
export const goodAnch = a => !!a && ['B', 'A', 'SB', 'SL', 'SI'].every(k => Array.isArray(a[k]) && a[k].length === 2 && a[k].every(Number.isFinite));
export function setLayout(v, a) { MAPV = v === 3 ? 3 : v === 2 ? 2 : 1; LAY = MAPV >= 2 ? 2 : 1; ANCH = null;
  if (LAY === 2) { W = H = 600; CX = CY = 300; const an = MAPV === 3 && goodAnch(a) ? a : ANCH2; if (MAPV === 3) ANCH = { B: an.B.slice(), A: an.A.slice(), SB: an.SB.slice(), SL: an.SL.slice(), SI: an.SI.slice(), t: Number.isInteger(an.t) ? an.t : -1 }; // t: which try made the caves (-1 = layout 2's cave shape)
    const b = angAt(an.B); BX = b.x; BY = b.y; SA = angAt(an.A); SB = angAt(an.SB); SL = angAt(an.SL); SI = angAt(an.SI); }
  else { W = H = 200; CX = CY = 100; BX = CX + 44; BY = CY + 2; SA = { x: CX - 46, y: CY + 18 }; SB = { x: CX + 6, y: CY - 76 }; SL = { x: CX - 4, y: CY + 84 }; SI = { x: CX - 84, y: CY + 4 }; }
  layoutTexts(); }
export const devLayout = () => { try { const v = +localStorage.getItem('lantern-tree-layout'); return v === 1 || v === 2 || v === 3 ? v : 0; } catch (_) { return 0; } }; // tests pin the old layout
export const DIR8 = ['동쪽', '남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽', '북쪽', '북동쪽'];
export const dirKo = (x, y) => DIR8[((Math.round(Math.atan2(y - CY, x - CX) / (Math.PI / 4)) % 8) + 8) % 8];
export const LAVA = 17;
export const PIT = 22; // v87: 삽으로 판 구덩이 (사람·몬스터는 못 지나가고 발사체는 지나가요)
export const idx = (x, y) => y * W + x;
// ================= world helpers =================
export const inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
