// ================= 공통 도구 (v65 다음 구조 변경 1단계: core.js에서 나눔) =================
export const $ = s => document.querySelector(s);
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export function hexRgb(h) { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

// 한국어 조사 고르기: josa('나무', '을', '를') → '나무를' (구조 변경 5단계: world.js에서 옮김)
export const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 ? a : b); };
export const roJosa = w => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 && c % 28 !== 8 ? '으로' : '로'); }; // 「으로/로」
