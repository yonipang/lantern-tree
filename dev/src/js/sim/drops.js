// ================= 떨어진 아이템 (게임 규칙: 세계에 남는 물건이라 결과용 난수 rand) =================
import { rand, rint } from '../engine/random.js';
import { G } from '../save/state.js';
import { petIs } from './animals.js';
import { rarOf } from './gear.js';
import { skl } from './player.js';

export function spawnDrop(id, c, x, y) { const a = rand() * 6.283; G.drops.push({ id, c, x, y, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.4, z: 0.3, vz: 3.4, t: 0, hold: 0 }); /* v138 손맛: 조금 더 높이·멀리 톡 (예전 1.4·1.1·2.6) */ }
export function rollDrops(list, x, y) { for (const [id, a, b, ch] of list) if (rand() < (ch < 1 && petIs('rabbit') && rarOf(id) >= 2 ? Math.min(1, ch * (1.25 + .1 * ((G && G.rpg && G.rpg.sk && G.rpg.sk.animalFriend) || 0))) : ch)) { const c = rint(a, b); if (c > 0) spawnDrop(id, c + (rand() < skl('lucky') * 0.12 ? 1 : 0), x, y); } }
