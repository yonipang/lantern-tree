// ================= 난수·노이즈 =================
// · rand(): 게임 결과에 영향을 주는 무작위 (피해·치명타·드롭·몬스터 움직임·생성 …) — 멀티플레이에서는 방장만 굴려요
// · fxRand(): 보이기·소리에만 쓰는 무작위 (반짝이·나뭇잎·화면 흔들림 …) — 사람마다 달라도 괜찮아요
// 둘 다 지금은 Math.random을 그대로 불러요 (테스트가 Math.random을 바꿔 끼워도 그대로 통해요).
// hash2·vn·fbm·rng는 시드로 정해지는 값이라 누가 계산해도 같아요 (지도 만들기 등).
export function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
export function vn(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, y, s) { return vn(x, y, s) * 0.55 + vn(x * 2.1, y * 2.1, s + 1) * 0.3 + vn(x * 4.3, y * 4.3, s + 2) * 0.15; }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const rand = () => Math.random();
export const fxRand = () => Math.random();
export const rint = (a, b) => a + Math.floor(rand() * (b - a + 1));
