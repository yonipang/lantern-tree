// ================= 떨어진 아이템 (게임 규칙: 세계에 남는 물건이라 결과용 난수 rand) =================
import { rand, rint } from '../engine/random.js';
import { G } from '../save/state.js';
import { petIs } from './animals.js';
import { rarOf } from './gear.js';
import { skl } from './player.js';

export function spawnDrop(id, c, x, y) { const a = rand() * 6.283; G.drops.push({ id, c, x, y, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.1, z: 0.3, vz: 2.6, t: 0, hold: 0 }); }
export function rollDrops(list, x, y) { for (const [id, a, b, ch] of list) if (rand() < (ch < 1 && petIs('rabbit') && rarOf(id) >= 2 ? Math.min(1, ch * 1.25) : ch)) { const c = rint(a, b); if (c > 0) spawnDrop(id, c + (rand() < skl('lucky') * 0.12 ? 1 : 0), x, y); } }
