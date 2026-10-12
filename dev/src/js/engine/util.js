// ================= 공통 도구 (v65 다음 구조 변경 1단계: core.js에서 나눔) =================
export const $ = s => document.querySelector(s);
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export function hexRgb(h) { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
