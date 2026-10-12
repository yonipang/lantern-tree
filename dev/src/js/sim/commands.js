// ================= 명령 (구조 변경 7단계): 화면·입력 → 규칙 =================
// 화면 쪽(ui/)은 규칙을 바로 바꾸지 않고 명령을 보내요:  runCmd({ k: 'tap', b: 'act' })   runCmd({ k: 'skill', n: 0 })
// 규칙 쪽은 defineCmd('이름', c => …)로 받는 곳을 만들어요. 지금은 보내는 순간 바로 처리돼서 예전과 똑같이 동작해요.
// 멀티플레이(12단계~)에서는 친구가 보낸 명령을 방장이 같은 처리기로 돌려요 — 그래서 명령에는 숫자·글자 같은 단순한 값을 담아요.
// actor: 지금 처리 중인 명령을 보낸 플레이어 — 처리하는 동안 G.inv·G.p … 가 그 플레이어 것이 돼요 (8단계).
//
// 조작 의도(ctl): 매 프레임 화면 쪽이 runCmd({ k: 'ctl', … })로 보내요 — 규칙은 키보드·마우스·조이스틱을 직접 읽지 않아요 (build.py가 확인).
//   mx·my 움직임(키·조이스틱·방향 패드를 더한 값) · stick 조이스틱 방향(쓰는 중일 때만) · act 상호작용 누르는 중 · atk 공격 누르는 중
//   aim 마우스로 겨누는 중이면 { x, y 세계 좌표, tx, ty 가리키는 칸 } 아니면 null
import { G, ME, withPlayer } from '../save/state.js';

const CMDS = new Map();
export let actor = null;
export function defineCmd(k, fn) { if (CMDS.has(k)) throw new Error('명령 이름이 겹쳐요: ' + k); CMDS.set(k, fn); }
export function runCmd(c) {
  const fn = CMDS.get(c.k);
  if (!fn) { console.error('명령을 처리하는 곳이 없어요: ' + c.k); return; }
  actor = c.who || ME; const pl = G && G.players && G.players[actor];
  return pl ? withPlayer(pl, () => fn(c)) : fn(c); // 보낸 플레이어가 「지금 플레이어」 (save/state.js)
}
export const IDLE = Object.freeze({ mx: 0, my: 0, stick: null, act: false, atk: false, aim: null });
export const ctlOf = p => p.ctl || IDLE;
