# 게임 원본 (dev/src)

v62 다음 리팩터링(파일 나누기)부터 게임 원본은 한 파일(`dev/index.html`)이 아니라 이 폴더의 여러 파일이에요.
`python3 dev/build.py`가 `shell.html`을 뼈대로 모든 파일을 **적힌 순서대로** 이어 붙여 한 파일짜리 게임 `dev/index.html`을 만들어요.
(`dev/index.html`은 결과물이라 저장소에 올리지 않아요. 테스트·위키·배포 도구는 시작할 때 자동으로 다시 묶어요.)

## 꼭 알아 둘 규칙

- **모든 파일이 모듈이에요** (구조 변경 11단계 끝, `dev/PLAN.md`): 다른 파일의 이름은 `import { a } from './x.js'`, 밖에서 쓰는 이름은 `export`. `build.py`가 `import` 줄은 지우고 `export` 낱말만 떼어 내 한 파일로 묶어요 (이름은 그대로 — 테스트 통로 `window.__T`도 그대로).
  - `build.py`가 확인해요: 가져오는 파일이 `shell.html`에 있는지, 그 이름을 내보내는지, 맨 위 이름이 겹치는지, 다른 모듈 이름을 import 없이 쓰는지, 가져온 값을 바꾸는지(바꿀 일은 그 모듈의 함수로 — `setPaused`·`markLight`·`resetPool` …).

- **자바스크립트는 모두 하나의 `<script>`, 하나의 함수 `(() => { … })()` 안에 차례로 들어가요.** 묶인 뒤에는 이름이 한곳에 모여서, 맨 위 이름은 파일끼리 겹치면 안 돼요.
- **순서가 중요해요.** `function`은 어디서든 부를 수 있지만, 맨 위에서 바로 실행되는 줄(`const …`, `Object.assign(ITEMS, …)`, `RECIPES.push(…)`, `TIPS.push(…)` 등)은 `shell.html`에 적힌 순서대로 실행돼요.
  - 앞 파일에서 만든 `const`·`let`을 뒤 파일이 쓰는 건 괜찮고, 반대는 안 돼요 (불러오자마자 오류).
  - `RECIPES`·`QSIDE`·`TIPS`에 넣는 순서가 제작 창·퀘스트 목록의 순서예요. 파일 순서를 바꾸면 화면 순서도 바뀌어요.
- **새 기능**은 그 기능의 `js/sim/` 파일(농사 → `sim/farming.js`, 전투 → `sim/combat.js` …, 데이터는 `js/data/`)에 덧붙이거나, 크면 새 `js/sim/` 파일을 만들고 `shell.html`의 `js/sim/loop.js` 다음(데이터·규칙이 다 만들어진 뒤, `js/art/content.js` 앞)에 `// @include …` 한 줄을 넣어요. 창 HTML·HUD는 `js/ui/`에. `shell.html`에 안 적은 파일은 `build.py`가 ⚠로 알려 줘요.
- **데이터(밸런스)는 `js/data/`** (구조 변경 2단계): 아이템·물체·레시피·몬스터·퀘스트·요리 수치와 이름·설명은 `js/data/<이름>.js`에, 그 기능의 동작은 `js/sim/`의 기능별 파일에 (9단계에서 버전별 `content/`·`game/`·`features/` → 기능별로), **그림(아이콘 `ICON`·물체 그림 `OSPR`·몬스터 그림)은 `js/art/`**(기능별 아이콘은 `art/content.js`)에 있어요.
  - 데이터 파일은 예전 버전 묶음 이름 그대로예요(`data/farming-cooking.js` …). 모두 규칙 파일(`js/sim/`)보다 앞에 와요. 새 아이템·레시피는 데이터 파일에, 아이콘·물체 그림은 `art/content.js`에 넣어요 (그림은 게임을 시작할 때 한꺼번에 만들어져서 어디에 두어도 순서 문제가 없어요).
  - 데이터 파일 안의 순서도 중요해요: `RECIPES`에 넣는 순서 = 제작 창 순서, 「지형 재료 2배」(`data/automation-tiers.js`) 같은 일괄 보정은 그 줄보다 앞에서 만든 레시피에만 적용돼요.
- CSS도 같은 규칙: 적힌 순서대로 하나의 `<style>`에 들어가요 (뒤에 있는 규칙이 이겨요).
- 옛 세이브를 고치는 코드는 `js/save/migrations.js`에만 둬요. 코드를 정리하거나 옮긴 뒤에는 `python3 dev/qa/snapshot.py`(비교 테스트)가 그대로 통과해야 해요.
- `js/art/hand-art.js`의 `/*@@ART*/ … /*@@ARTEND*/` 부분은 `dev/art_pack.py`가 자동으로 바꿔요. 손으로 고치지 않아요.

## 파일 지도 (적힌 순서 = 실행 순서)

| 파일 | 맡은 일 |
|---|---|
| `shell.html` | 페이지 뼈대: `<head>`, HUD·버튼·타이틀 화면 HTML, CSS/JS를 넣는 순서 |
| `font.css` | v78 도트 글꼴 Neo둥근모 Pro(woff2를 글자로 넣은 `@font-face` 한 줄, 라이선스 `dev/art_src/fonts/`). 손으로 고치지 않아요 |
| `style.css` | 화면 모양 전부: 색·글꼴 → HUD(체력·목표·보스바·토스트) → 단축칸·터치 버튼·조이스틱 → 시트 창(제작·지도·메뉴) → 타이틀·캐릭터 고르기·능력 창, 작은 화면 규칙, 맨 끝에 v78 도트 GUI 영역별 크기(와이어프레임 v2)·계단 모서리 |
| `js/engine/util.js` | 공통 도구: `$`·`clamp`·`hexRgb`, 한국어 조사 `josa`·`roJosa`(으로/로) |
| `js/engine/random.js` | 난수·노이즈: **`rand()` 게임 결과용 · `fxRand()` 보이기용** (`Math.random`은 여기서만, `build.py`가 확인), `rint`, 시드 노이즈 `hash2`·`vn`·`fbm`·`rng` |
| `js/engine/canvas.js` | 그림 붓: 색(`C`·`INK`), 캔버스 그림(`mk`)·외곽선, `whiten`, 화면 배율 `HD` |
| `js/engine/audio.js` | 효과음 `SFX`·`ensureAudio` |
| `js/engine/effects.js` | 반짝임(`puff`)·떠오르는 글자(`ftext`)·알림(`toast`) |
| `js/sim/events.js` | **사건** `emit`·`onEvent`: 규칙이 소리·알림·반짝임 대신 남기는 것 (받는 곳은 `ui/feedback.js`) |
| `js/sim/commands.js` | **명령** `runCmd`·`defineCmd`와 조작 의도 `ctlOf(p)`: 화면·입력이 규칙에 보내는 것 |
| `js/sim/systems.js` | **매 프레임 순서표** `FRAME_ORDER`와 `onFrame`·`runFrame` — 기능마다 이름 한 칸, 자리 = 실행 순서 |
| `js/world/map.js` | 지도 틀: 지도 모양(`setLayout`·`LAY`)·크기(`W`·`H`)·등불나무와 보스 자리(`CX`·`SA` …)·칸 번호(`idx`)·지도 안인지(`inB`)·방향 이름 |
| `js/sim/drops.js` | 떨어진 아이템 `spawnDrop`·`rollDrops` |
| `js/art/hand-art.js` | 손그림 데이터(`ART`, `dev/art_pack.py`가 자동으로 씀)와 불러오기 |
| `js/art/characters.js` | 플레이어·캐릭터 꾸미기, 몬스터·보스 그림, 도구·아이템 아이콘(`ICON`) |
| `js/art/world.js` | 물체·작물·나무, 등불나무 모습, 바닥·벽·가장자리 타일, `SPR` 조립(`buildSprites`)과 손그림 덮어쓰기 |
| `js/data/items.js` | **기본 데이터**: 벽·아이템·물체·레시피(`Rc`)·장식·무기·고유 무기·희귀도·가방, 얇은 벽 조각 만들기, 레시피 일괄 보정(REQ_FIX·금속 → 구리 제작대) |
| `js/data/rpg-nature.js` | 레벨·능력치 이름·스킬, 낚시 표, 몬스터(`ENEMY`)·**보스(`BOSSES`·재도전 보상 `REMATCH`)**, 꽃, 나무 자라는 시간, 자연 꾸미기 |
| `js/data/circuits-regions.js` | 전선·전지·발전기·채굴기, 깊은 동굴 재료·몬스터 수치·생성 수, 황금·전설 장비, 화살, 채굴장 산출, **모든 장비 내구도(`DUR`)·분해** |
| `js/world/gen.js` | 지도 만들기(`genWorld`) — 지역·벽·물·연못·석영 광맥, 숨은 방 |
| `js/world/tiles.js` | 막힌 칸·충돌·움직이기(`isSolid`·`boxHits`·`moveEnt`), 여러 칸 가구 발자리(`fpOf`·`delObj` …), 땅 파기·지형 배우기, 놓을 수 있는지(`canPlace`) |
| `js/save/state.js` | `G`·새 게임·`serialize`/`deserialize`, **세이브 나누기 `splitSave`·`joinSave`** (세계·캐릭터·세계 안 플레이어별 — `SAVE_ORDER`·`CHAR_KEYS`·`PLAYER_KEYS`) |
| `js/save/migrations.js` | **옛 세이브 보정 전부** — `deserialize()`가 정해진 순서로 불러요 |
| `js/save/storage.js` | 브라우저 저장·백업·클라우드, 세이브 파일 내보내기/불러오기, 개발자 도구 |
| `js/data/quests.js` | 길잡이 퀘스트(`GUIDE`)·보상(`Q_META`)·곁가지 퀘스트(`QSIDE`), 여러 칸 가구(`MULTI`) |
| `js/data/farming-cooking.js` | 낫·물뿌리개·비료, 맞는 흙·별 작물, **숨은 방**(개수·장식·보물), 버프·요리·레시피 쪽지, 용광로·요리솥 시간, 낚시 운 |
| `js/data/gear-animals.js` | 불꽃·서리 작물, 옷·장신구, 장비제작대, 반지, 강화 비용·효과, 동물·목장 |
| `js/data/deep-survival.js` | 더위·추위 대비 요리·문구, 지역 재료, 귀환석, 잃어버린 꾸러미, 깊은 보스 단계 문구 |
| `js/data/automation-tiers.js` | 스프링클러·자동 수확기, 거대 작물, 축제 케이크, **「지형 재료 2배」**, 작업대·장비제작대 단계와 레시피 단계 나누기 |
| `js/data/controls.js` | 도구 종류, 도끼 → 나무 베기 도구, 쳐서 회수(몇 번·몇 초) |
| `js/sim/inventory.js` | 가방·상자·도구 주머니: 넣기·빼기·세기·쌓기·내구도(`addItem`·`removeItem`·`countItem`·`moveInto`), 상자 재료 함께 쓰기(`availCount`·`takeAvail`), 가방·상자·도구 명령 |
| `js/sim/gear.js` | 장비·옷·장신구·반지(`wearItem`·`wearing`·`ringV`), 강화 단계와 효과(`upgCost`·`upgText`), 무기 종류·희귀도(`wtOf`·`rarOf`) |
| `js/sim/crafting.js` | 제작: 가까운 제작대(`nearStations`)·제작 자리(`craftable`·`stationTier`), 강화·분해·수리·작업대 올리기·제작 명령, 용광로·요리솥 시간 작업(`takeJob`) |
| `js/sim/building.js` | 건축: 얇은 벽·문·자동문 잇기(`twMask`·`doorGroup`), 가구 돌리기(`rotatePlace`)·발자리 크기(`setFootprints`), 놓기(`placeItem`)·줍기 |
| `js/sim/gathering.js` | 모으기: 벽 캐기(`mineWall`)·나무 베기(`hitObj`)·수확(`harvest`), 쳐서 회수(공격 버튼으로 가구 떼기) |
| `js/sim/player.js` | 플레이어: 능력치·스킬·경험치(`gainXp`·`maxHp`), 매 프레임 움직이기·배고픔, 다치기·기절·깨어나기(`hurtPlayer`·`respawn`), 앉기·자기·먹기, 능력치·스킬·꾸미기 명령 |
| `js/sim/survival.js` | 생존: 더위·추위(`envTick`), 귀환석(`startRecall`), 긴급 탈출·갇힘 풀기(`emergencyEscape`·`unstick`), 잃어버린 꾸러미 |
| `js/sim/actions.js` | 상호작용 버튼: 목표 칸(`targetTile`), 무엇을 할지 고르기(`decide`)·하기(`perform`), 물체 쓰기(`useObj`), 작은 버튼(`curAlt`·`doAlt`), 명령 `ctl`·`tap`·`alt` |
| `js/sim/combat.js` | 전투: 무기(`curWeapon`)·휘두르기·쏘기, 스킬(`useSkill`), 피해·상태 이상·몬스터 처치(`hitEnemy`), 화살, 공격 버튼(`doAttack`) |
| `js/sim/enemies.js` | 몬스터: 움직이기·쫓기(가장 가까운 플레이어, `enemyStep`), 만들기·생기기(`mkEnemy`·`trySpawn`) |
| `js/sim/bosses.js` | 보스: 깨우기·패턴(`BOSS_AI`)·단계·탄환·위험 지대, 맞기(`hitBoss`), 재도전 보상·소환 |
| `js/sim/nature.js` | 자연: 꽃잎 구역(`zoneTick`), 작물·어린나무 자라기(`growTick`), 베고 남기기·파내기, 풀·뿌리 다시 자라기(`regrow`) |
| `js/sim/farming.js` | 농사: 물·비료·별 작물·주변 수확, 자동화(스프링클러·자동 수확기)·거대 작물, 나무 작업장·채굴장 |
| `js/sim/cooking.js` | 요리: 배운 요리·레시피 쪽지(`learnRecipe`·`maybeNote`), 음식 버프·행운(`applyBuff`·`bval`·`luckTier`) |
| `js/sim/fishing.js` | 낚시: 던지기·입질·거두기(`startFish`·`updateFish`·`reel`), 낚시 표·병 편지 |
| `js/sim/animals.js` | 동물: 펫(함께 다니기·따라오기), 들짐승(`wildTick`), 올가미 포획(`catchThrow`), 목장 |
| `js/sim/circuits.js` | 회로: 전선·전력 계산(`circuitTick`), 기계 작동(`deviceStep`) |
| `js/sim/quests.js` | 퀘스트: 길잡이·곁가지 진행과 보상(`checkGuide`·`claimQuest`), 목표 글·화살표, 지역 알림 |
| `js/sim/tree.js` | 등불나무: 자라는 단계(`treeStage`), 빛씨앗 넣기(`insertSeeds`) |
| `js/sim/loop.js` | 매 프레임 진행 `update()` → 순서표(`sim/systems.js`), 빛 계산·퀘스트 확인, 떨어진 물건 줍기 |
| `js/art/content.js` | **기능별 아이콘·물체 그림·몬스터 그림**: 예전 규칙 파일 순서대로 모음 (무기·장식·자연 꾸미기 표의 그림 `WEAPON_ICON`·`DECOR_SPR`·`NATURE_SPR` … 포함) |
| `js/render/light.js` | 빛: 등불·횃불 빛 계산(`computeLight`)과 밝기(`lightAt`), 빛이 닿은 곳 지도에 밝히기 — 몬스터 생기기(밝은 곳엔 안 생김)도 이 값을 봐요 |
| `js/render/icecave.js` | v79 얼음 동굴 새 방식 시험: 얼음벽 가장자리 기울기·윗면/앞면 그림(`iceWallArt`), 얼음 조각 바닥(`drawIceShard`), 벽 옆 청록빛(`iceGlowChunk`) — 그림은 코드로 만들어 칸마다 기억 |
| `js/render/terrain.js` | v73 바닥·벽·광석 새 그림(`dev/art/terrain/`): 바닥을 픽셀 단위로 굽기(`bakeFloor`), 벽 그림 고르기(`wallArt`), 광석이 박힐 바위(`oreHost`) |
| `js/render/glight.js` | v73 새 빛 효과(WebGL2): 면 정보·발광 캔버스(`beginGB`·`drawKind`), 픽셀마다 빛·벽 그림자·번짐(`shadeGL`), 메뉴 「빛 효과」(`lightPref`) — 못 쓰면 예전 빛 |
| `js/render/map.js` | 지도 그림: 칸 색(`MAPF`·`MAPW`), 지도 다시 만들기(`rebuildMap`)·한 점 고치기(`mapPixel`) |
| `js/render/view.js` | 화면: 캔버스·배율(`resize`·`VIEW`)·카메라 따라가기, 한 장 그리기(`render`) |
| `js/render/chunks.js` | 바닥 조각: 바닥·벽 타일을 큰 조각으로 미리 그려 두기(`drawChunk`·`getChunk`) |
| `js/render/world.js` | 세계 그리기: 반딧불이 같은 주변 효과, 물체·몬스터·플레이어·보스 그리기(`renderWorld`·`drawEntity`), 겹쳐 그리기 |
| `js/render/icons.js` | 아이콘: 아이템 아이콘 그림·주소(`iconURL`) |
| `js/render/parts.js` | 그리기 조각: 얇은 벽·문 그림, 회전 그림, 위험 지대, 등불나무 그리기·잎·빛, 반짝이 진행(`updateFx`), 동물 그림, 회수 막대 |
| `js/ui/feedback.js` | **사건 받아 보여 주기**: 소리·알림·반짝임·하트·물방울, 화면 흔들림(`shake`), 지도 점·창 열기, 기절 화면·보스 체력 막대·목표 글 |
| `js/ui/panels.js` | 창: `UIS`(창 안 고르기 상태)·`openPanel`·`closePanel`·`renderPanel`(가방·제작·퀘스트·능력·메뉴 …), 제작 알림, 아이템 설명 |
| `js/ui/hud.js` | HUD: 단축칸(`refreshHotbar`, 규칙은 `emit('inv')`)·체력·배고픔·스킬 막대(`updateHud`), 시간 작업 칸, 버프·더위추위 막대, 옷 권하기, 도구 칸·도구 줄, 버튼 표시 |
| `js/ui/panels-extra.js` | 창 HTML 조각: 희귀도 이름, 강화 목록, 시간 작업 카드, 포획·펫·장비·지역 재료·작업대 올리기·도구 주머니 |
| `js/ui/map.js` | 지도 창: 상자 표시 설정, 지도 그리기(`drawMap`) |
| `js/ui/panel-actions.js` | 창 안 버튼(`onSheetClick`) → 명령 보내기, 창 안 고르기·확인 묻기(`UIS`), 칸 끌어 옮기기 |
| `js/ui/input.js` | 입력 상태(`keys`·`mouse`·`joy`·`dpad`)와 **조작 의도 만들기(`readCtl`)·명령 보내기(`command`)**, 키보드·터치·조이스틱 연결(`setupInput`) |
| `js/ui/picker.js` | 캐릭터 고르기, 시작하기(`beginPlay`) |
| `js/main.js` | 게임 루프와 시작(`start`) |

찾는 이름이 어느 파일에 있는지 모르면 `grep -rn "function 이름\|const 이름" dev/src/js`로 찾아요.
파일 이름에 버전이 붙은 기능(v59 시간 작업, v60 작업대 단계 …)의 자세한 설명은 각 파일 안 주석과 `dev/README.md`의 「세이브 호환 규칙」에 있어요.
