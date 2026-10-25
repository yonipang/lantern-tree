# 등불나무 실험판 (lab)

재미를 처음부터 다시 찾기 위한 **따로 된 작은 게임**이에요 (2026-10-25 사용자 결정, `dev/design/재미중심.md` 9장).
본 게임(`dev/`)과 세이브·번호·테스트·배포가 모두 따로이고, **그림·지형 그리기·새 빛·글꼴·걷기 같은 바탕은 본 게임 파일을 그대로 같이 써요.**

- 주소: https://yonipang.github.io/lantern-tree/lab/ (본 게임 주소 뒤에 `lab/`)
- 번호: **L1, L2 …** (본 게임 v140 …과 섞지 않아요)
- 지금: **L1.1 — 빈 이끼 동굴** (걷기·벽 캐기·횃불·빛 · L1.1: 폰에서 횃불 버튼이 안 눌리던 것 고침). 다음 L2는 이끼 동굴 실험(단서·둥지·작은 유적, `재미중심.md` 9장 — 8장 C안과 맞춰서)

## 어떻게 만들어지나 (공용 파일)

`python3 lab/build.py` → `lab/index.html` 한 파일.
`lab/src/shell.html`의 `// @include js/…` 줄마다 **`lab/src`에 같은 경로의 파일이 있으면 그것(실험판 것), 없으면 `dev/src`의 파일(본 게임 것)**을 넣어요.
그래서 본 게임 파일은 한 줄도 고치지 않아요. 묶는 방법·모듈 규칙 확인(이름 겹침, `rand()`/`fxRand()`, `emit`↔`onEvent`, `onFrame` 순서표 …)은 본 게임 `dev/build.py`의 것을 그대로 써요.
묶을 때 「가져오는 이름이 없어요」가 나오면 빠진 이름을 **한꺼번에** 보여 줘요 — 그 경로의 실험판 파일에 만들면 돼요.

| 실험판 파일 (`lab/src/js/…`) | 하는 일 |
|---|---|
| `lab/world.js` | 작은 이끼 동굴 만들기 (200×200 지도 가운데 반지름 약 44칸, 구불구불한 굴 + 작은 방 10개, 흙벽·돌벽·구리 광맥, 바깥은 암반) |
| `lab/player.js` | 걷기 (본 게임 `world/tiles.js` `moveSlide` 그대로 — 빠르기 4.4칸/초) |
| `lab/dig.js` | 캐기 (0.28초마다 한 번, 벽 체력은 본 게임 `WALLS`: 흙 3·구리 4·돌 5번, 암반은 못 캠) · 횃불 놓기 (6개) |
| `lab/fx.js` · `lab/feedback.js` | 조각·흔들림·소리·알림 (사건 `emit` → 받기 `onEvent`, 본 게임과 같은 방식) |
| `lab/draw.js` | 세계 그리기 (본 게임 `render/world.js`에서 바닥 덩어리·벽·서 있는 것·조각만) |
| `lab/input.js` · `lab/main.js` | 조작(폰 조이스틱·캐기·횃불 버튼 / PC WASD·E·T)·시작·매 프레임 |
| `save/state.js` · `sim/systems.js` · `render/light.js` · `render/view.js` | 본 게임 같은 경로 파일을 **대신**하는 실험판 것 (상태 G·매 프레임 순서표·빛·화면) |
| `sim/nature.js` | 본 게임 파일이 가져가는 바닥 번호(`WATER`·`WFLOOR`)만 — **본 게임 값과 같아야 해요** |
| `sim/cooking.js` · `sim/inventory.js` · … · `ui/panels.js` | **실험판에 아직 없는 규칙** — 본 게임 그림·데이터 파일이 이름만 가져가요 (빈 함수). 실험판에서 그 규칙을 쓰게 되면 그때 진짜로 만들어요 |

본 게임에서 같이 쓰는 것(`shell.html` 참고): `engine/*`, `sim/events.js`·`sim/commands.js`, `world/map.js`·`world/tiles.js`, `art/*`, `data/*`, `sim/building.js`, `render/icecave.js`·`terrain.js`·`glight.js`·`chunks.js`·`parts.js`·`icons.js`, `font.css`·`style.css`.
→ 본 게임에서 이 파일들을 고치면 실험판에도 들어가요 (그래서 `lab.yml`이 본 게임 파일이 바뀔 때도 실험판 테스트를 돌려요).

### 바탕 밝기 B
2026-10-25 사용자 선택 **B**(본 게임보다 약 2.3배). 새 빛(`render/glight.js`)은 `G.treeSeeds`로 바탕 밝기를 정해서, 실험판은 `G.treeSeeds`를 그 밝기가 되는 값(약 3.21)으로 둬요 (`render/light.js` `AMB_B`·`AMB_SEEDS`, 실험판엔 등불나무가 없어요).

## 테스트·배포

- 테스트: `python3 lab/qa/run.py` (약 30초~1분) — 묶기 → 브라우저로 열기 → 시작 방·걷기·벽에 막힘·흙/돌/구리 캐기 횟수·암반·횃불·새 빛/예전 빛 화면·오류 없음. 결과 `lab/qa/out/summary.txt`·화면 사진
  - 흔들리지 않게: 게임 안의 일은 실제 시계 대신 `__lab.step(초, 조작)`으로 진행해요 (`js/lab/main.js`)
- 배포: main에 합치면 `.github/workflows/lab.yml`이 실험판 테스트 → `lab/index.html` 커밋 → GitHub Pages. 실험판만 바뀌면 본 게임 전체 테스트(`deploy.yml`)는 안 돌아요
- `lab/index.html`은 만들어지는 파일이에요 — 직접 고치지 않아요 (배포가 커밋해요)
