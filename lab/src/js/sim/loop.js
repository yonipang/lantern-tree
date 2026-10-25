// ================= 실험판: 본 게임 sim/loop.js 자리 — 실험판에는 아직 없는 규칙 =================
// 본 게임 공용 파일(그림·데이터·그리기)이 이름만 가져가요. 실험판에서 이 규칙을 쓰게 되면 그때 진짜로 만들어요.
// 빛을 다시 계산하라는 표시 (본 게임 sim/loop.js의 markLight와 같은 이름 — 공용 파일도 부르고, render/light.js가 봐요)
export let lightDirty = true;
export const markLight = () => { lightDirty = true; };
export const takeLightDirty = () => { const d = lightDirty; lightDirty = false; return d; };
