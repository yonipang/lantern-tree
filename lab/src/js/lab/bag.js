// ================= 실험판 가방 (L2) — 물건 id → 개수. 칸 수 제한 없음 (실험판은 단순하게) =================
// 바뀌면 emit('bag') — 화면(단축 표시·열린 창)이 다시 그려요.
import { emit } from '../sim/events.js';
import { G } from '../save/state.js';
export const countBag = id => (G && G.bag[id]) || 0;
export function addBag(id, n = 1) { if (n <= 0) return; G.bag[id] = countBag(id) + n; emit('bag'); }
export function takeBag(id, n = 1) { const c = countBag(id); if (c < n) return false; if (c === n) delete G.bag[id]; else G.bag[id] = c - n; emit('bag'); return true; }
export const hasAll = req => req.every(([id, n]) => countBag(id) >= n);
export const bagList = () => Object.keys(G.bag).filter(id => G.bag[id] > 0);
