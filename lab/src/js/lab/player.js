// ================= 실험판 플레이어: 걷기·바라보기 (L1) =================
// 조작은 본 게임처럼 명령으로 받아요: 화면 쪽이 매 프레임 runCmd({ k: 'ctl', … }) → 여기서 G.p.ctl에 담고 ctlOf(G.p)로 읽어요.
// 걷는 빠르기·몸 크기·벽에 미끄러지기는 본 게임과 같아요 (4.4칸/초, 반지름 0.28칸, world/tiles.js moveSlide를 그대로 씀).
import { ctlOf, defineCmd } from '../sim/commands.js';
import { onFrame } from '../sim/systems.js';
import { G } from '../save/state.js';
import { moveSlide } from '../world/tiles.js';
export const SPEED = 4.4, BODY = .28;
defineCmd('ctl', c => { G.p.ctl = { mx: +c.mx || 0, my: +c.my || 0, stick: c.stick || null, act: !!c.act, atk: false, aim: null }; });
onFrame('player', dt => {
  const p = G.p, ctl = ctlOf(p); let mx = ctl.mx, my = ctl.my, mag = Math.hypot(mx, my); if (mag > 1) { mx /= mag; my /= mag; mag = 1; }
  p.moving = mag > .12;
  if (p.moving) { const sp = SPEED * Math.max(.5, mag); moveSlide(p, mx * sp * dt, my * sp * dt, BODY); p.anim += dt; p.face = { x: mx / mag, y: my / mag }; }
  const f = p.face; if (Math.abs(f.x) > Math.abs(f.y) * 1.05) { p.dir = 'side'; p.flip = f.x < 0; } else p.dir = f.y < 0 ? 'up' : 'down';
  p.hurt = Math.max(0, p.hurt - dt);
});
