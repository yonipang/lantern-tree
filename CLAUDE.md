# 등불나무 아래 — Claude 작업 안내

아기자기한 픽셀 생존·건축·농사 웹게임 (HTML/Canvas, 프레임워크·외부 라이브러리 없음). GitHub Pages + 홈 화면 앱(PWA)으로 배포해요.
자세한 작업 순서·세이브 호환 규칙은 `dev/README.md`, 소스 파일 지도는 `dev/src/README.md`.

**진행 중: 구조 변경 + 멀티플레이 계획 `dev/PLAN.md`** (구조 변경 0~11단계 끝 → 코어키퍼 방식 멀티플레이 12~15단계 → 배포). 「다음 단계」를 하라고 하면 거기서 체크 안 된 첫 단계를 진행하고, 끝나면 체크 표시·진행 상황을 갱신해요. 새 게임 시스템(새 규칙·동작)도 추가할 수 있어요 — 아래 규칙(모듈·사건·명령·매 프레임 순서표·플레이어 여럿)대로 만들어요.

## 어디를 고치나

- **게임 원본은 `dev/src/`** (`shell.html` + `style.css` + `js/` 64개). 여기만 고쳐요.
- 저장소 맨 위 `index.html`·`sw.js`·`manifest.webmanifest`·`wiki.html`, 그리고 `dev/index.html`은 **모두 만들어지는 파일**이에요. 직접 고치지 않아요.
  - `dev/index.html`은 `python3 dev/build.py`가 `dev/src/`를 묶어 만들어요 (저장소에는 안 올라감).
- 그림은 `dev/art/`에 PNG로 넣고 `python3 dev/art_pack.py` (→ `dev/src/js/art/hand-art.js`의 `/*@@ART*/` 부분). 그 부분은 손으로 고치지 않아요.

## 꼭 지킬 규칙

- **모든 JS 파일은 모듈이에요** (11단계): 다른 파일의 이름은 `import { a } from './x.js'`(같은 이름 그대로, `as`·`default` 없음), 밖에서 쓰는 이름은 `export`. `build.py`가 묶을 때 `import`/`export`를 떼어 내고 `shell.html`의 `@include` 순서대로 하나의 `<script>`에 이어 붙여요.
  - `build.py`가 확인해요: 가져오는 이름을 그 파일이 내보내는지, 다른 모듈 이름을 import 없이 쓰는지, 맨 위 이름이 겹치는지, **가져온 값을 바꾸는지**(다른 모듈의 값은 그 모듈의 함수로 바꿔요 — 예: `setPaused(true)`·`markLight()`). 지역 변수가 다른 모듈의 이름과 같으면 이름을 바꿔요.
  - **무작위는 `rand()`(게임 결과에 영향: 피해·드롭·생성·몬스터 움직임 …) 또는 `fxRand()`(반짝이·소리 등 보이기만)** — `Math.random`을 직접 쓰면 `build.py`가 멈춰요. 헷갈리면 `rand()`.
  - **규칙 코드(`sim/`·`world/`·`data/`·`save/state`·`save/migrations`)는 소리·알림·반짝임을 바로 부르지 않고 사건을 남겨요**: `emit('sfx', 'hit')`·`emit('toast', 글, 'good')`·`emit('puff', x, y, 색, 개수)`·`emit('shake', .3)` … 받는 곳은 `ui/feedback.js`(새 효과는 거기에 `onEvent`). `SFX.x()`·`toast()`·`puff()`를 규칙 파일에 쓰거나 받는 곳 없는 사건을 쓰면 `build.py`가 멈춰요 (멀티플레이에서 친구 화면에도 같은 사건을 보내기 위해서).
  - **규칙 코드는 키보드·마우스·조이스틱(`keys`·`mouse`·`joy`·`aimMouse` …)을 직접 읽지 않아요**: 매 프레임 받는 조작 의도 `ctlOf(G.p)`(`mx`·`my`·`act`·`atk`·`aim`·`stick`)와 명령을 써요. 화면·입력 쪽은 `command({ k: 'skill', n: 0 })`(ui/input.js)·`runCmd(…)`로 보내고, 규칙 쪽은 `defineCmd('skill', c => …)`로 받아요 (`sim/commands.js`, `build.py`가 확인). 창 안 버튼(`ui/panel-actions.js`)도 규칙을 바로 바꾸지 않고 명령을 보내요 — 받는 곳은 `sim/inventory.js`·`sim/crafting.js` 같은 규칙 파일.
  - **규칙 코드는 화면 상태도 바로 바꾸지 않아요**: 단축칸 다시 그리기는 `emit('inv')`, 옷·생김새가 바뀌면 `emit('look')`(그림 다시 만들기는 화면 쪽), 창 안 고르기 상태 `UIS`·`buildPlayer`·`CHARS.custom`은 화면·그림 쪽만 (`build.py`가 확인).
  - **매 프레임 하는 일은 `sim/systems.js`의 순서표 `FRAME_ORDER`에 이름 한 칸을 넣고(자리 = 실행 순서) 기능 파일에서 `onFrame('이름', dt => …)`로 등록**해요. `update()`에 직접 부르는 줄을 더하지 않아요 (`build.py`가 확인).
  - **플레이어는 여럿일 수 있어요** (`G.players`, 8단계): `G.p`·`G.inv`·`G.equip` … (`save/state.js`의 `PER_PLAYER`)는 「지금 플레이어」 것이에요 — 명령은 보낸 플레이어, 플레이어별 매 프레임 일(`sim/systems.js`의 `PER_PLAYER_FRAMES`)은 한 명씩, 그 밖은 내 플레이어. 세계 일(몬스터·보스·떨어진 물건 …)에서 플레이어를 볼 때는 `G.p` 대신 `nearestPlayer(x, y)`·`alivePlayers()`·`playerList()`로 고르고 `withPlayer(pl, () => …)`. 플레이어마다 따로인 새 값은 `PER_PLAYER`에 넣어요.
  - 맨 위에서 바로 실행되는 줄(`const …`, `Object.assign(ITEMS, …)`, `RECIPES.push(…)`, `TIPS.push(…)`)은 파일 순서대로 실행돼요. 앞 파일의 값을 뒤에서 쓰는 건 되고, 반대는 안 돼요.
  - `RECIPES`·`QSIDE`·`TIPS`에 넣는 순서가 화면 순서예요. 일괄 보정(예: `data/automation-tiers.js` 중간의 「지형 재료 2배」)은 **그 줄보다 앞에서 추가된 레시피에만** 적용돼요. 파일·줄 순서를 바꾸면 밸런스가 바뀔 수 있어요.
  - **밸런스 데이터(아이템·레시피·몬스터·퀘스트·요리 수치와 이름·설명)는 `js/data/`**, 동작은 **기능별 `js/sim/` 파일**(가방 `inventory`·장비 `gear`·제작 `crafting`·건축 `building`·전투 `combat`·몬스터 `enemies`·보스 `bosses`·농사 `farming`·요리 `cooking`·동물 `animals`·생존 `survival` … 9단계), **그림(아이콘 `ICON`·물체 그림 `OSPR`)은 `js/art/`** (기능별 아이콘은 `art/content.js`). 데이터 파일은 모두 `sim/` 파일보다 앞에 와요.
  - 새 기능은 그 기능의 `js/sim/` 파일(데이터는 `js/data/`) 끝에 덧붙이거나, 크면 새 `js/sim/` 파일 + `shell.html`에 `// @include` 한 줄 (`js/sim/loop.js` 다음, `js/art/content.js` 앞). 창 HTML·HUD는 `js/ui/`. 파일 지도는 `dev/src/README.md`.
- **세이브 호환**: 저장 키 `lantern-tree-save-v1`, 세이브 버전 `v: 3`은 바꾸지 않아요. 새 필드는 기본값과 함께 추가만 해요.
  - **세이브는 「세계」·「캐릭터」·「세계 안 플레이어별」로 나뉘어요** (멀티플레이 준비, `save/state.js`의 `splitSave`·`joinSave`). 새 칸을 저장하면 `SAVE_ORDER`에 넣고, 캐릭터 것이면 `CHAR_KEYS`, 플레이어별이면 `PLAYER_KEYS`에 (안 넣으면 세계). 정한 것: 퀘스트 진행·기록은 세계, 지도에서 밝힌 곳은 플레이어별, 펫은 캐릭터.
  - 옛 세이브 보정은 모두 `js/save/migrations.js`에 두고 `save/state.js`의 `deserialize()`에서 불러요 (호출 순서가 중요).
  - 세이브 구조를 바꾸면 옛 세이브 사례를 `dev/qa/snapshot.py`의 `LEGACY`에 추가하고 `--fixtures`로 추가해요 (이미 있는 세이브는 안 바뀌어요).
- 기존 기능·밸런스·그래픽·조작감을 요청 없이 바꾸지 않아요. 코드 정리만 했다면 아래 비교 테스트가 그대로 통과해야 해요.

## 확인 순서

1. `python3 dev/build.py && node dev/qa/syn.js dev/index.html` → `ok`
2. **비교 테스트** `python3 dev/qa/snapshot.py` (약 20초, `run.py`도 맨 먼저 돌려요): 게임 데이터·그림 지문·옛 세이브 불러오기 결과를 `dev/qa/snapshot/`과 비교.
   일부러 바꾼 거라면 바뀐 곳이 의도와 맞는지 확인하고 `--update`로 갱신해 같이 커밋해요.
3. 전체 테스트 `python3 dev/qa/run.py` (비교 테스트 + 기능 테스트 65개, 약 5분, 백그라운드로 돌리고 끝에 나오는 요약만 읽어요) 또는 `python3 dev/qa/run.py crafting`(파일) / `emergency_escape`(테스트 이름).
   새 기능에는 알맞은 `dev/qa/test_*.py`에 `def test_영어이름():`(예: `test_fishing_contest`, 번호 없이 무엇을 확인하는지)을 비슷한 테스트 옆에 추가해요. 실패한 테스트는 자동으로 한 번 더 돌려 요약에 적어 줘요.
   - 테스트는 흔들리지 않게: 게임 안의 일은 `wait_game`/`wait_until`로 기다리고(실제 시계 대신), 상태 맞추기와 확인은 한 번의 `ev` 안에서, 확률·지도 모양에 기대지 않기. 자세히는 `dev/README.md`의 「흔들리지 않는 테스트 쓰는 법」
   - Playwright가 깔린 브라우저와 버전이 안 맞으면 그 브라우저에 맞는 버전으로 설치 (예: `/opt/pw-browsers/chromium-1194` → `pip install playwright==1.56.0 --break-system-packages`). `playwright install`은 하지 않아요.
4. 배포: `main`에 올리면 GitHub Actions(`.github/workflows/deploy.yml`)가 비교 테스트 → 그림 넣기 → 전체 테스트를 돌리고, **통과하면** 배포 파일(`index.html`·`sw.js`·`wiki.html`)을 만들어 커밋해요.
   데이터를 일부러 바꿨다면 `snapshot.py --update`로 갱신한 기록을 같이 올려야 통과해요. 직접 만들 때는 `python3 dev/build_web.py`.
