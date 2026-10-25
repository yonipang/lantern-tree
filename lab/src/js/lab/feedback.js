// ================= 실험판 사건 받기: 소리·알림·흔들림·조각 (본 게임 ui/feedback.js처럼) =================
import { SFX } from '../engine/audio.js';
import { puff, toast } from '../engine/effects.js';
import { $ } from '../engine/util.js';
import { onEvent } from '../sim/events.js';
import { markLight } from '../sim/loop.js';
import { addShake, chips } from './fx.js';
onEvent('sfx', k => { if (SFX[k]) SFX[k](); });
onEvent('toast', (msg, cls, key) => toast(msg, cls, key));
onEvent('shake', v => addShake(v));
onEvent('chips', (x, y, c1, c2, n, big) => chips(x, y, c1, c2, n, big));
onEvent('lit', () => markLight());
export const showTorches = n => { $('#torchN').textContent = n; $('#torchBtn').classList.toggle('dim', n <= 0); };
onEvent('torches', n => showTorches(n));
// 본 게임 공용 규칙 파일(world/tiles.js·sim/building.js)이 남기는 사건 — 실험판에선 아직 그 규칙을 안 써서 받기만 해요
onEvent('puff', (x, y, col, n, spd, z) => puff(x, y, col, n, spd, z));
onEvent('tile', () => markLight());
onEvent('inv', () => { });
