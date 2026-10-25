// ================= 실험판 매 프레임 순서표 — 본 게임 sim/systems.js와 같은 방식 =================
// 기능 파일은 onFrame('이름', dt => …)으로 등록해요. 표에 없는 이름·표에 있는데 등록 없는 이름은 묶을 때 멈춰요 (lab/build.py → dev/build.py 확인).
import { playerList, withPlayer } from '../save/state.js';
export const FRAME_ORDER = [
  'player',   // 걷기·바라보기 (js/lab/player.js)
  'act',      // 캐기 버튼: 바라보는 벽 캐기 (js/lab/dig.js)
  'fx',       // 조각 움직이기 (본 게임 render/parts.js updateFx)
  'tree',     // 본 게임 render/parts.js가 등록 (등불나무 잎 — 실험판엔 나무가 없어 하는 일 없음)
  'light',    // 빛 계산 (render/light.js)
  'camera',   // 카메라 따라가기 (render/view.js)
  'shake',    // 화면 흔들림 줄이기 (js/lab/fx.js)
];
export const PER_PLAYER_FRAMES = new Set(['player', 'act']);
const SYS = new Map();
export function onFrame(name, fn) {
  if (!FRAME_ORDER.includes(name)) throw new Error('매 프레임 순서표(sim/systems.js)에 없는 이름이에요: ' + name);
  if (SYS.has(name)) throw new Error('매 프레임 이름이 겹쳐요: ' + name);
  SYS.set(name, fn);
}
export function runFrame(dt) {
  for (const name of FRAME_ORDER) { const fn = SYS.get(name); if (!fn) continue;
    if (PER_PLAYER_FRAMES.has(name)) { for (const pl of playerList()) withPlayer(pl, () => fn(dt)); } else fn(dt); }
}
