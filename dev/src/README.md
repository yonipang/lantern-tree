# 게임 원본 (dev/src)

v62 다음 리팩터링(파일 나누기)부터 게임 원본은 한 파일(`dev/index.html`)이 아니라 이 폴더의 여러 파일이에요.
`python3 dev/build.py`가 `shell.html`을 뼈대로 모든 파일을 **적힌 순서대로** 이어 붙여 한 파일짜리 게임 `dev/index.html`을 만들어요.
(`dev/index.html`은 결과물이라 저장소에 올리지 않아요. 테스트·위키·배포 도구는 시작할 때 자동으로 다시 묶어요.)

## 꼭 알아 둘 규칙

- **구조 변경 중이에요** (`dev/PLAN.md`): 파일을 하나씩 **모듈**(`import { a } from './x.js'`, `export …`)로 옮기고 있어요. 모듈과 옛 파일이 섞여 있어도 `build.py`가 한 파일로 묶어요 (import 줄은 지우고 `export` 낱말만 떼어 내요 — 이름은 그대로).
  - 모듈은 다른 모듈의 이름을 반드시 import해요. 아직 옛 파일인 곳의 이름은 import 없이 그대로 써요 (그 파일을 옮길 때 import로 바꿈).
  - `build.py`가 확인해요: 가져오는 파일이 `shell.html`에 있는지, 그 이름을 내보내는지, 맨 위 이름이 겹치는지. 그리고 옛 전역 이름이 몇 개 남았는지 알려 줘요.

- **자바스크립트는 모두 하나의 `<script>`, 하나의 함수 `(() => { … })()` 안에 차례로 들어가요.** 파일끼리 `import` 없이 서로의 이름을 그대로 써요 (예전 한 파일과 똑같아요).
- **순서가 중요해요.** `function`은 어디서든 부를 수 있지만, 맨 위에서 바로 실행되는 줄(`const …`, `Object.assign(ITEMS, …)`, `RECIPES.push(…)`, `TIPS.push(…)` 등)은 `shell.html`에 적힌 순서대로 실행돼요.
  - 앞 파일에서 만든 `const`·`let`을 뒤 파일이 쓰는 건 괜찮고, 반대는 안 돼요 (불러오자마자 오류).
  - `RECIPES`·`QSIDE`·`TIPS`에 넣는 순서가 제작 창·퀘스트 목록의 순서예요. 파일 순서를 바꾸면 화면 순서도 바뀌어요.
- **새 기능**은 비슷한 `js/features/` 파일(데이터는 같은 이름의 `js/data/` 파일) 끝에 덧붙이거나, 크면 새 파일을 만들고 `shell.html`의 `js/features/automation-tiers.js` 다음(그림·데이터·게임 규칙이 다 만들어진 뒤, `js/render.js` 앞)에 `// @include …` 한 줄을 넣어요. `shell.html`에 안 적은 파일은 `build.py`가 ⚠로 알려 줘요.
- **데이터(밸런스)는 `js/data/`** (구조 변경 2단계): 아이템·물체·레시피·몬스터·퀘스트·요리 수치와 이름·설명은 `js/data/<이름>.js`에, 그 기능의 동작은 같은 이름의 규칙 파일(`content/`·`features/`·`game/`)에, **그림(아이콘 `ICON`·물체 그림 `OSPR`·몬스터 그림)은 `js/art/`**(기능별 아이콘은 `art/content.js`)에 있어요.
  - 데이터 파일은 `shell.html`에서 같은 이름의 규칙 파일 **바로 앞**에 와요 (예전과 같은 실행 순서). 새 아이템·레시피는 데이터 파일에, 아이콘·물체 그림은 `art/content.js`에 넣어요 (그림은 게임을 시작할 때 한꺼번에 만들어져서 어디에 두어도 순서 문제가 없어요).
  - 데이터 파일 안의 순서도 중요해요: `RECIPES`에 넣는 순서 = 제작 창 순서, 「지형 재료 2배」(`data/automation-tiers.js`) 같은 일괄 보정은 그 줄보다 앞에서 만든 레시피에만 적용돼요.
- CSS도 같은 규칙: 적힌 순서대로 하나의 `<style>`에 들어가요 (뒤에 있는 규칙이 이겨요).
- 옛 세이브를 고치는 코드는 `js/save/migrations.js`에만 둬요. 코드를 정리하거나 옮긴 뒤에는 `python3 dev/qa/snapshot.py`(비교 테스트)가 그대로 통과해야 해요.
- `js/art/hand-art.js`의 `/*@@ART*/ … /*@@ARTEND*/` 부분은 `dev/art_pack.py`가 자동으로 바꿔요. 손으로 고치지 않아요.

## 파일 지도 (적힌 순서 = 실행 순서)

| 파일 | 맡은 일 |
|---|---|
| `shell.html` | 페이지 뼈대: `<head>`, HUD·버튼·타이틀 화면 HTML, CSS/JS를 넣는 순서 |
| `style.css` | 화면 모양 전부: 색·글꼴 → HUD(체력·목표·보스바·토스트) → 단축칸·터치 버튼·조이스틱 → 시트 창(제작·지도·메뉴) → 타이틀·캐릭터 고르기·능력 창, 작은 화면 규칙 |
| `js/engine/util.js` | (모듈) 공통 도구: `$`·`clamp`·`hexRgb`, 한국어 조사 `josa` |
| `js/engine/random.js` | (모듈) 난수·노이즈: **`rand()` 게임 결과용 · `fxRand()` 보이기용** (`Math.random`은 여기서만, `build.py`가 확인), `rint`, 시드 노이즈 `hash2`·`vn`·`fbm`·`rng` |
| `js/engine/canvas.js` | (모듈) 그림 붓: 색(`C`·`INK`), 캔버스 그림(`mk`)·외곽선, `whiten`, 화면 배율 `HD` |
| `js/engine/audio.js` | (모듈) 효과음 `SFX`·`ensureAudio` |
| `js/engine/effects.js` | (모듈) 반짝임(`puff`)·떠오르는 글자(`ftext`)·알림(`toast`) |
| `js/sim/events.js` | (모듈) **사건** `emit`·`onEvent`: 규칙이 소리·알림·반짝임 대신 남기는 것 (받는 곳은 `ui/feedback.js`) |
| `js/sim/commands.js` | (모듈) **명령** `runCmd`·`defineCmd`와 조작 의도 `ctlOf(p)`: 화면·입력이 규칙에 보내는 것 |
| `js/sim/systems.js` | (모듈) **매 프레임 순서표** `FRAME_ORDER`와 `onFrame`·`runFrame` — 기능마다 이름 한 칸, 자리 = 실행 순서 |
| `js/world/map.js` | (모듈) 지도 틀: 지도 모양(`setLayout`·`LAY`)·크기(`W`·`H`)·등불나무와 보스 자리(`CX`·`SA` …)·칸 번호(`idx`)·지도 안인지(`inB`)·방향 이름 |
| `js/sim/drops.js` | (모듈) 떨어진 아이템 `spawnDrop`·`rollDrops` |
| `js/art/hand-art.js` | (모듈) 손그림 데이터(`ART`, `dev/art_pack.py`가 자동으로 씀)와 불러오기 |
| `js/art/characters.js` | (모듈) 플레이어·캐릭터 꾸미기, 몬스터·보스 그림, 도구·아이템 아이콘(`ICON`) |
| `js/art/world.js` | (모듈) 물체·작물·나무, 등불나무 모습, 바닥·벽·가장자리 타일, `SPR` 조립(`buildSprites`)과 손그림 덮어쓰기 |
| `js/data/items.js` | (모듈) **기본 데이터**: 벽·아이템·물체·레시피(`Rc`)·장식·무기·고유 무기·희귀도·가방, 얇은 벽 조각 만들기, 레시피 일괄 보정(REQ_FIX·금속 → 구리 제작대) |
| `js/content/items.js` | 얇은 벽·문·울타리 그리기와 잇기, 희귀도 함수, 제작 수량 |
| `js/data/rpg-nature.js` | (모듈) 레벨·능력치 이름·스킬, 낚시 표, 몬스터(`ENEMY`)·**보스(`BOSSES`·재도전 보상 `REMATCH`)**, 꽃, 나무 자라는 시간, 자연 꾸미기 |
| `js/content/rpg-nature.js` | 능력치 계산·경험치, 꽃잎 구역·어린나무 자라기 |
| `js/data/circuits-regions.js` | (모듈) 전선·전지·발전기·채굴기, 깊은 동굴 재료·몬스터 수치·생성 수, 황금·전설 장비, 화살, 채굴장 산출, **모든 장비 내구도(`DUR`)·분해** |
| `js/content/circuits-regions.js` | 회로·전력 계산, 바닥 위험, 가구 회전·나무 작업장·채굴장 동작 |
| `js/world/gen.js` | (모듈) 지도 만들기(`genWorld`) — 지역·벽·물·연못·석영 광맥, 숨은 방 |
| `js/world/tiles.js` | (모듈) 막힌 칸·충돌·움직이기(`isSolid`·`boxHits`·`moveEnt`), 여러 칸 가구 발자리(`fpOf`·`delObj` …), 땅 파기·지형 배우기, 놓을 수 있는지(`canPlace`) |
| `js/save/state.js` | (모듈) `G`·새 게임·`serialize`/`deserialize`, **세이브 나누기 `splitSave`·`joinSave`** (세계·캐릭터·세계 안 플레이어별 — `SAVE_ORDER`·`CHAR_KEYS`·`PLAYER_KEYS`) |
| `js/save/migrations.js` | (모듈) **옛 세이브 보정 전부** — `deserialize()`가 정해진 순서로 불러요 |
| `js/save/storage.js` | (모듈) 브라우저 저장·백업·클라우드, 세이브 파일 내보내기/불러오기, 개발자 도구 |
| `js/game/actions.js` | 가방·내구도·분해, 버튼이 하는 일(`decide`·`perform`), 명령 `ctl`·`hot`·`sel` |
| `js/game/bag.js` | **창 버튼 명령**: 가방 옮기기·정렬·입기·먹기·버리기, 상자, 강화·분해·수리·작업대 올리기, 제작(`craft`, 제작 자리 `craftable`), 퀘스트 보상·능력치·스킬·꾸미기 · 제작대 옆 상자 재료 함께 쓰기(`availCount`·`takeAvail`), 가까운 제작대(`nearStations`) |
| `js/game/combat.js` | 스킬·피해·몬스터 처치, 보스 재도전, 물체 쓰기·잠·낚시·캐기·놓기·수확·먹기 |
| `js/game/update.js` | 등불나무 연출, 매 프레임 진행(`update` → 순서표), 움직이기·배고픔·몬스터·보스 AI·생성·빛 |
| `js/data/quests.js` | (모듈) 길잡이 퀘스트(`GUIDE`)·보상(`Q_META`)·곁가지 퀘스트(`QSIDE`), 여러 칸 가구(`MULTI`) |
| `js/game/quests.js` | 퀘스트 진행·보상 받기·지역 알림 |
| `js/data/farming-cooking.js` | (모듈) 낫·물뿌리개·비료, 맞는 흙·별 작물, **숨은 방**(개수·장식·보물), 버프·요리·레시피 쪽지, 용광로·요리솥 시간, 낚시 운 |
| `js/features/farming-cooking.js` | 농사, 숨은 방 보물상자, 요리, 용광로·요리솥 시간 작업(꺼 둔 동안 자라기), 레시피 쪽지·버프·낚시 운 |
| `js/data/gear-animals.js` | (모듈) 불꽃·서리 작물, 옷·장신구, 장비제작대, 반지, 강화 비용·효과, 동물·목장 |
| `js/features/gear-animals.js` | 불꽃 열매·서리 무·옷·장신구·장비 칸, 장비제작대 강화·반지·가구 칸 크기, 펫·올가미·목장 |
| `js/data/deep-survival.js` | (모듈) 더위·추위 대비 요리·문구, 지역 재료, 귀환석, 잃어버린 꾸러미, 깊은 보스 단계 문구 |
| `js/features/deep-survival.js` | 더위·추위 요리와 게이지·지역 재료, 귀환석·긴급 탈출·기절, 깊은 보스 3단계 |
| `js/data/automation-tiers.js` | (모듈) 스프링클러·자동 수확기, 거대 작물, 축제 케이크, **「지형 재료 2배」**, 작업대·장비제작대 단계와 레시피 단계 나누기 |
| `js/features/automation-tiers.js` | 농사 자동화·거대 작물 동작, 작업대·장비제작대 단계 올리기 |
| `js/data/controls.js` | (모듈) 도구 종류, 도끼 → 나무 베기 도구, 쳐서 회수(몇 번·몇 초) |
| `js/features/controls.js` | v65 조작: 공격 버튼(`doAttack`)·쳐서 회수, 도구 주머니·도구 칸·도구 줄, 작은 버튼(`curAlt`·`cycleAlt`), 버튼 표시(`updateCtrlHud`) |
| `js/art/content.js` | (모듈) **기능별 아이콘·물체 그림·몬스터 그림**: 예전 규칙 파일 순서대로 모음 (무기·장식·자연 꾸미기 표의 그림 `WEAPON_ICON`·`DECOR_SPR`·`NATURE_SPR` … 포함) |
| `js/render.js` | 빛·지도 픽셀, 카메라·바닥 조각·세계·캐릭터 그리기, 아이템 아이콘(`iconURL`) |
| `js/ui/feedback.js` | (모듈) **사건 받아 보여 주기**: 소리·알림·반짝임·하트·물방울, 화면 흔들림(`shake`), 지도 점·창 열기, 기절 화면·보스 체력 막대·목표 글 |
| `js/ui/panels.js` | HUD 갱신·`openPanel`·`renderPanel`·지도·제작 알림 |
| `js/ui/panel-actions.js` | 창 안 버튼(`onSheetClick`) → 명령 보내기, 창 안 고르기·확인 묻기(`UIS`), 칸 끌어 옮기기 |
| `js/ui/input.js` | 입력 상태(`keys`·`mouse`·`joy`·`dpad`)와 **조작 의도 만들기(`readCtl`)·명령 보내기(`command`)**, 키보드·터치·조이스틱 연결, 캐릭터 고르기 |
| `js/main.js` | 게임 루프와 시작(`start`) |

찾는 이름이 어느 파일에 있는지 모르면 `grep -rn "function 이름\|const 이름" dev/src/js`로 찾아요.
파일 이름에 버전이 붙은 기능(v59 시간 작업, v60 작업대 단계 …)의 자세한 설명은 각 파일 안 주석과 `dev/README.md`의 「세이브 호환 규칙」에 있어요.
