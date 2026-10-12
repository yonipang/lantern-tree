# 게임 원본 (dev/src)

v62 다음 리팩터링(파일 나누기)부터 게임 원본은 한 파일(`dev/index.html`)이 아니라 이 폴더의 여러 파일이에요.
`python3 dev/build.py`가 `shell.html`을 뼈대로 모든 파일을 **적힌 순서대로** 이어 붙여 한 파일짜리 게임 `dev/index.html`을 만들어요.
(`dev/index.html`은 결과물이라 저장소에 올리지 않아요. 테스트·위키·배포 도구는 시작할 때 자동으로 다시 묶어요.)

## 꼭 알아 둘 규칙

- **자바스크립트는 모두 하나의 `<script>`, 하나의 함수 `(() => { … })()` 안에 차례로 들어가요.** 파일끼리 `import` 없이 서로의 이름을 그대로 써요 (예전 한 파일과 똑같아요).
- **순서가 중요해요.** `function`은 어디서든 부를 수 있지만, 맨 위에서 바로 실행되는 줄(`const …`, `Object.assign(ITEMS, …)`, `RECIPES.push(…)`, `TIPS.push(…)` 등)은 `shell.html`에 적힌 순서대로 실행돼요.
  - 앞 파일에서 만든 `const`·`let`을 뒤 파일이 쓰는 건 괜찮고, 반대는 안 돼요 (불러오자마자 오류).
  - `RECIPES`·`QSIDE`·`TIPS`에 넣는 순서가 제작 창·퀘스트 목록의 순서예요. 파일 순서를 바꾸면 화면 순서도 바뀌어요.
- **새 기능**은 보통 `js/features/`에 새 파일을 만들고 `shell.html`의 `js/features/stations.js` 다음쯤(그림·데이터·게임 규칙이 다 만들어진 뒤, `js/render/` 앞)에 `// @include …` 한 줄을 넣어요. `shell.html`에 안 적은 파일은 `build.py`가 ⚠로 알려 줘요.
- CSS도 같은 규칙: 적힌 순서대로 하나의 `<style>`에 들어가요 (뒤에 있는 규칙이 이겨요).
- 옛 세이브를 고치는 코드는 `js/save/migrations.js`에만 둬요. 코드를 정리하거나 옮긴 뒤에는 `python3 dev/qa/snapshot.py`(비교 테스트)가 그대로 통과해야 해요.
- `js/art/hand-art.js`의 `/*@@ART*/ … /*@@ARTEND*/` 부분은 `dev/art_pack.py`가 자동으로 바꿔요. 손으로 고치지 않아요.

## 파일 지도

| 폴더 | 맡은 일 |
|---|---|
| `shell.html` | 페이지 뼈대: `<head>`, HUD·버튼·타이틀 화면 HTML, CSS/JS를 넣는 순서 |
| `css/` | `base`(색·글꼴·화면) · `hud`(체력·목표·보스바·토스트) · `controls`(단축칸·칸·터치 버튼·조이스틱) · `panels`(시트 창·제작·지도·메뉴) · `title`(타이틀·캐릭터 고르기·능력 창, 작은 화면 규칙) |
| `js/core/` | 어디서나 쓰는 도구: `utils`(`$`, 노이즈, 난수) · `audio-fx`(효과음, 반짝임, 떠오르는 글자, 토스트, 떨어진 아이템) |
| `js/art/` | 그림 만들기 (게임 규칙 없음): `sprite-kit`(캔버스 붓·외곽선·`mk`) · `hand-art`(손그림 데이터·불러오기) · `characters`(플레이어·꾸미기) · `monsters-icons`(몬스터·보스·아이템 아이콘) · `objects`(물체·작물·나무) · `lantern-tree`(등불나무 모습) · `tiles`(바닥·벽·가장자리) · `build-sprites`(`SPR` 조립, 손그림 덮어쓰기) |
| `js/content/` | 게임 내용 정의와 그 내용에 딸린 규칙: `registry`(지도 모양, `WALLS`·`ITEMS`·`OBJ`·`RECIPES`) · `building`(얇은 벽·문·울타리) · `decorations` · `weapons`(재료·무기·희귀도·가방) · `rpg`(레벨·능력치·스킬·몬스터) · `nature`(꽃잎 구역·어린나무·자연 장식) · `circuits`(전선·전력·기계) · `deep-regions`(용암·얼음·수정 동굴, 화살, 바닥 위험) · `multitile`(여러 칸 가구, 회전, 나무 작업장·채굴장) |
| `js/world/` | 세계: `worldgen`(지도 만들기) · `hidden-rooms`(숨은 방) · `helpers`(충돌·이동·땅 파기·놓을 수 있는지) |
| `js/save/` | 저장: `state`(`G`·새 게임·`serialize`/`deserialize`) · `migrations`(**옛 세이브 보정 전부** — `deserialize()`가 정해진 순서로 불러요) · `storage`(브라우저 저장·백업·클라우드) · `save-file`(세이브 파일 내보내기/불러오기, 개발자 도구) |
| `js/game/` | 게임 진행의 중심: `inventory`(가방·내구도·분해) · `actions`(입력 상태, 버튼이 하는 일 `decide`) · `combat`(스킬·피해·몬스터 처치) · `interact`(보스 재도전, 물체 쓰기·잠·낚시·캐기·놓기·수확·먹기) · `lantern-tree`(등불나무 연출) · `update`(매 프레임 세계·몬스터·보스 AI·생성) · `quests`(퀘스트 목록) · `quest-progress`(퀘스트 진행·보상·지역 알림) |
| `js/features/` | 버전마다 붙은 기능 묶음: `farming` · `treasure` · `cooking` · `jobs`(용광로·요리솥 시간 작업, 꺼 둔 동안 자라기) · `buffs`(요리 아이콘·레시피 쪽지·버프·낚시 운) · `deep-caves`(불꽃 열매·서리 무·옷·장신구·장비 칸) · `gear-upgrade`(장비제작대 강화·반지, 가구 칸 크기) · `animals`(펫·올가미·목장) · `climate`(더위·추위 요리와 게이지, 지역 재료) · `recall`(귀환석·긴급 탈출·기절) · `boss-phases`(깊은 보스 3단계) · `farm-auto`(농사 자동화·거대 작물·축제 케이크) · `stations`(지형 재료 2배, 작업대·장비제작대 단계) |
| `js/render/` | 그리기: `lighting`(빛·지도 픽셀) · `render`(카메라·바닥 조각·세계·캐릭터 그리기) · `icons`(아이템 아이콘·`iconURL`) |
| `js/ui/` | 화면: `panels`(HUD 갱신·`openPanel`·`renderPanel`·지도·제작 알림) · `chests`(제작대 옆 상자 재료 함께 쓰기) · `panel-actions`(창 안 버튼 처리 `onSheetClick`) · `drag`(칸 끌어 옮기기·정렬) · `input`(키보드·터치·조이스틱 연결, 캐릭터 고르기) |
| `js/main.js` | 게임 루프와 시작(`start`) |

파일 이름에 버전이 붙은 기능(v59 시간 작업, v60 작업대 단계 …)의 자세한 설명은 각 파일 안 주석과 `dev/README.md`의 「세이브 호환 규칙」에 있어요.
