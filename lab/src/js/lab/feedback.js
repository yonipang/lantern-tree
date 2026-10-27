// ================= 실험판 사건 받기: 소리·알림·흔들림·조각·떠오르는 글자 (본 게임 ui/feedback.js처럼) =================
import { SFX } from '../engine/audio.js';
import { puff, toast } from '../engine/effects.js';
import { ITEMS } from '../data/items.js';
import { onEvent } from '../sim/events.js';
import { markLight } from '../sim/loop.js';
import { G } from '../save/state.js';
import { addFloat, addShake, chips, sparks, spores } from './fx.js';
onEvent('sfx', k => { if (SFX[k]) SFX[k](); });
onEvent('toast', (msg, cls, key) => toast(msg, cls, key));
onEvent('shake', v => addShake(v));
onEvent('chips', (x, y, c1, c2, n, big) => chips(x, y, c1, c2, n, big));
onEvent('lit', () => markLight());
// L2
onEvent('got', (id, n) => addFloat(G.p.x, G.p.y - 1.3, `+${(ITEMS[id] && ITEMS[id].n) || id} ${n}`, '#fff1d6'));
onEvent('coin', (x, y, n) => addFloat(x, y, `+${n}`, '#ffd25c'));
onEvent('spore', (x, y) => spores(x, y));
onEvent('sparks', (x, y) => sparks(x, y));
onEvent('mood', () => { });      // 손님 표정은 js/lab/draw.js가 손님 상태를 보고 그려요
onEvent('wallBroke', () => { }); // 테스트·기록용
onEvent('placed', () => { });
// 본 게임 공용 규칙 파일(world/tiles.js·sim/building.js)이 남기는 사건 — 실험판에선 아직 그 규칙을 안 써서 받기만 해요
onEvent('puff', (x, y, col, n, spd, z) => puff(x, y, col, n, spd, z));
onEvent('tile', () => markLight());
onEvent('inv', () => { });
