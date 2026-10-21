// ================= v127 연출 장면(레터박스) 대본 (dev/design/연출장면.md, 2026-10-21 사용자 확정) =================
// 장면마다 코드를 새로 짜지 않고 「대본」처럼 순서만 적어요. 한 줄(칸)에 한 가지 일, 위에서부터 차례로 해요 (진행은 sim/cutscene.js).
//   { cam: 곳, t: 초 }        카메라를 그곳으로 t초 동안 옮겨요 (다 옮길 때까지 기다림). 곳: 'me' 주인공 · 'naru' 나루 · 'tree' 등불나무 · 'boss' 그 장면의 보스 · 'hold' 지금 자리 그대로
//   { gest: 몸짓, who }       몸짓 (기다리지 않음). 몸짓: 'wave' 손 흔들기 · 'nod' 고개 끄덕이기 · 'surprise' 놀라기(머리 위 !) · 'tilt' 갸웃(머리 위 ?) · who: 'naru' | 'me'
//   { say: 1, who }           대사 한 줄 (아래 띠 안에 얼굴 + 자막). 글은 장면을 시작할 때 정해요(arg.line). 읽을 시간이 지나거나 누르면 다음 칸
//   { walk: 1 }               걷기 — 장면을 시작한 곳이 정한 걷기(나루 먼저 걷기)가 끝날 때까지 기다림, 카메라는 걷는 사람을 따라가요
//   { fx: 이름 }              효과 (기다리지 않음): 'tree' 나무에서 빛이 퍼짐·소리·살짝 흔들림 · 'boss' 화면 흔들림·소리·보스가 나타남
//   { band: 1 }               이름 띠 (화면 가운데, 장면이 끝날 때까지) — 글은 arg.band
//   { wait: 초 }              기다리기
//   if: '이름'                이 칸은 그 조건일 때만 (예: 'naruNear' 나루가 CINE_NEAR칸 안에 있으면)
// 위아래 검은 띠·HUD 숨김은 장면이 시작하고 끝날 때 저절로 (띠 두께 화면 높이의 10% — style.css #cineTop·#cineBot).
// 건너뛰기: 장면 끝 상태로 바로 + 아직 안 나온 대사 한 줄은 방울 대화창으로.
export const CINE_NEAR = 12; // 「근처」 = 12칸 (나루 먼저 걷기를 보는 거리 LEAD_SEE와 같음)
export const CINE_GEST_T = 1.4; // 몸짓 하나가 보이는 시간
// 대사가 보이는 시간: 한 글자 0.03초씩 나온 뒤 읽을 시간 (1.2초 + 한 글자 0.05초, 적어도 1.8초)
export const cineSayT = s => String(s).length * .03 + Math.max(1.8, 1.2 + String(s).length * .05);
// ① 나루 먼저 걷기 — 먼저 걷는 3곳(구리 광맥 · 가장 깊은 곳 입구 두 번) 모두 같은 연출, 대사만 달라요 (입구 두 곳 대사는 Claude 임시)
export const CINE_LEAD_LINE = { ore: '따라와요, 구리는 이쪽이에요!', deep: '입구는 이쪽이에요. 같이 가요!', dark: '한 번 더, 입구까지요!' };
// ② 빛씨앗 심기
export const CINE_SEED_LINE = '봐요, 나무가 깨어나요!';
export const CINE_SCRIPTS = {
  lead: [
    { cam: 'naru', t: .8 },
    { gest: 'wave', who: 'naru' },
    { say: 1, who: 'naru' },
    { walk: 1 },
    { cam: 'hold', t: .5 },
    { cam: 'me', t: .7 },
  ],
  seed: [
    { cam: 'tree', t: 1.5 },
    { fx: 'tree' },
    { wait: 1.6 },
    { gest: 'surprise', who: 'naru', if: 'naruNear' },
    { say: 1, who: 'naru', if: 'naruNear' },
    { cam: 'me', t: .8 },
  ],
  // ③ 보스 등장 — 보스마다 처음 한 번만, 대사 없음
  boss: [
    { cam: 'boss', t: 1 },
    { fx: 'boss' },
    { band: 1 },
    { wait: 1.2 },
    { cam: 'me', t: .7 },
  ],
};
