# 개발용 폴더

게임을 고치고 배포할 때 쓰는 원본과 도구예요. 저장소 맨 위의 `index.html`은 배포용으로 바꾼 결과물이니 직접 고치지 않아요.

게임 원본은 `dev/src/`의 여러 파일이에요(v62 다음 리팩터링부터). `python3 dev/build.py`가 이를 한 파일짜리 게임 `dev/index.html`로 묶어요. `dev/index.html`도 결과물이라 직접 고치지 않고 저장소에도 올리지 않아요. 파일 지도와 순서 규칙은 `dev/src/README.md`.

## 들어 있는 것

| 경로 | 내용 |
|---|---|
| `dev/src/` | **게임 원본** (HTML 뼈대 `shell.html` + `style.css` + `js/`). 모든 수정은 여기서 해요. 파일 지도: `dev/src/README.md` |
| `dev/PLAN.md` | 구조 변경 + 멀티플레이 계획 체크리스트 |
| `dev/build.py` | `dev/src/` → 한 파일짜리 게임 `dev/index.html` (테스트·위키·배포 도구가 시작할 때 자동으로 돌려요. 저장소에는 안 올라감) |
| `dev/build_web.py` | 원본(묶은 `dev/index.html`) → 배포용 `index.html`·`sw.js`·`manifest.webmanifest`(저장소 맨 위) |
| `dev/qa/` | 테스트 (Playwright). `python3 dev/qa/run.py`로 한 번에 실행. `harness.py`(공통 도구) · `test_*.py`(기능별 테스트 파일 8개, 안의 `def test_이름()` 63개) · `snapshot.py`(비교 테스트) |
| `dev/old/` | 옛 버전(v1~v3). 예전 세이브를 불러오는 테스트에 써요 |
| `dev/character-parts/` | 캐릭터 부위 그리기 템플릿 |
| `dev/art/` | 직접 그린 16px 그림 (아래 「16px 그림」) |
| `dev/art_pack.py` | `dev/art/`의 그림을 `dev/src/js/art/hand-art.js` 안에 넣는 도구 |
| `dev/wiki/` | 게임 위키 만들기. `python3 dev/wiki/build_wiki.py` → 저장소 맨 위 `wiki.html` (묶은 `dev/index.html`에서 게임 데이터·아이콘을 바로 뽑아요. 게임을 고친 뒤 다시 돌리면 위키도 맞춰져요) |

## 16px 그림 (v53부터 다시 16px)

- **한 칸 = 16×16px.** 세계를 1:1(게임 픽셀 = 그림 픽셀)로 그려요 (`HD = 1`). 앞으로 그림·타일셋은 모두 16px 기준으로 맞춰요
- 그린 PNG는 게임 안 경로 그대로 `dev/art/`에 넣어요. 예) `dev/art/obj/roundTree.png`, `dev/art/item/berry.png`, `dev/art/crop/berry/3.png`, `dev/art/mon/slimeG.png`, `dev/art/animal/dog.png`, `dev/art/etc/bush/1.png`
- 넣은 뒤 `python3 dev/art_pack.py` → `dev/src/js/art/hand-art.js`의 `/*@@ART*/ … /*@@ARTEND*/` 부분이 바뀌어요. 그다음 평소처럼 테스트·배포
- 외곽선은 게임이 옛 그림과 같은 방식으로 붙여요. 그린 그대로 쓰려면 파일 이름 끝을 `.raw.png`로
- 작물은 식물만 그려요 (흙은 게임이 깔아 줌). 하얀 번쩍임·꺼진 램프·세로 가구·어린 나무·거대 작물은 원본 그림에서 자동으로 만들어요
- 나무류는 v50부터 크게 그려요 (둥근 나무·뿌리기둥·큰버섯 1.75배, 벚꽃나무 1.4배, 큰 고목 1.5배, 부딪히는 칸은 그대로). 높이 34px 넘는 물체 뒤에 플레이어가 서면 반투명
- 바닥·벽 (v54부터): `floor/<바닥 번호>/<0,1,2…>.png` 바닥 무늬(몇 장이든 됨, 칸마다 골고루 섞여 나옴. 0·1·2번 중 1·2번은 바닥 가장자리 색을 뽑는 데 쓰니 무늬 없는 것으로), `wtop/<벽 번호>/<0~3>.png` 벽 윗면 4장, `wfront/<벽 번호>.png` 벽 앞면(16×5)
- 아직 손그림을 못 넣는 것: 캐릭터(부위별 템플릿 예정), 등불나무, 얇은 벽·문, 물
- v54: 구매한 Fantasyville 에셋(동굴·대장간·식료품점·마을·실내)에서 잘라 넣은 그림 목록은 `dev/art/FANTASYVILLE.md`
- 기록: v49(10-10)에 세계를 2배 해상도(한 칸 32px, `HD = 2`)로 바꾸고 v51에 32px 손그림 15장을 넣었다가, v53(10-11)에 16px 타일셋을 쓰기로 하면서 16px로 되돌렸어요. 32px 그림은 저장소에서 지웠고(git 기록 `1b662fd` 이전에 `dev/art_32px/obj/`로 남아 있어요), 2배 해상도 코드는 `HD` 값과 `outlineHD`로 남아 있어요 (`HD = 2`로 바꾸면 다시 32px)

## 자동 반영·배포 (GitHub Actions)

- `main`에 그림(`dev/art`)이나 게임 원본(`dev/src`)이 바뀌어 올라오면 `.github/workflows/deploy.yml`이 돌아요:
  1. 비교 테스트로 코드가 기록(`dev/qa/snapshot`)과 맞는지 확인 → 2. `dev/art/`의 그림을 넣고(`art_pack.py`) 바뀐 그림 지문만 기록에 반영(이때 게임이 오류 없이 켜지고 옛 세이브가 그대로 불러와지는지도 확인) → 3. 테스트 → 4. **모두 통과하면** `build_web.py`로 배포 파일을 만들어 커밋 → GitHub Pages가 1~2분 뒤 바뀌어요.
  - **그림만 올렸을 때**(웹사이트 업로드 등, 약 3분): 3단계는 그림 관련 테스트 4개(손그림 `hand_drawn_art`·가구 칸 `furniture_size`·등불나무 `lantern_tree_growth`·꾸미기 `dress_up`)만
  - **코드도 바뀌었을 때**(Claude 세션이 올릴 때, 약 10분): 3단계는 전체 테스트
- 테스트가 실패하면 배포하지 않아요. Actions 탭에 빨간 X가 뜨고 GitHub이 메일로 알려 줘요. 실패 내용은 그 실행의 「qa-결과」 파일(요약·로그)로 볼 수 있어요.
- 가끔 실패하는 테스트는 혼자 한 번 더 돌려서 통과하면 통과로 봐요.
- 일부러 데이터(아이템·레시피·밸런스)를 바꿨다면, 올릴 때 `python3 dev/qa/snapshot.py --update`로 갱신한 기록도 같이 올려야 1단계를 통과해요. 그림만 바꾼 경우는 자동으로 반영돼요.
- 그림은 깃허브 웹사이트에서 「Add file → Upload files」로 `dev/art/`에 올려도 돼요.
- Claude 게임 페이지·위키 페이지(아티팩트)는 바뀌지 않아요. 다음에 Claude가 게시할 때 함께 반영돼요.
- 다른 세션이 배포하는 중에는 올리지 않기 (배포 파일이 겹칠 수 있어요). Claude 세션은 작업 전·커밋 전에 늘 `git pull`.
- 수동으로 다시 돌리려면 깃허브 Actions 탭 → 「자동 반영·배포」 → Run workflow.

## 작업 순서

1. **원본 수정**: `dev/src/` (어느 파일인지는 `dev/src/README.md`의 파일 지도)
2. **묶기·문법 확인**: `python3 dev/build.py && node dev/qa/syn.js dev/index.html` → `ok`가 나와야 해요 (테스트·배포 도구도 시작할 때 알아서 묶어요)
3. **비교 테스트 (먼저, 약 20초)**: `python3 dev/qa/snapshot.py`
   - 게임 데이터(아이템·레시피 순서와 재료·몬스터·퀘스트·그림 지문)와 옛 세이브 불러오기 결과가 `dev/qa/snapshot/`의 기록과 같은지 봐요. 다르면 바뀐 곳(예: `data.RECIPES[0].req[0][1]: 6 → 7`)을 보여 줘요
   - 코드 정리·옮기기만 했다면 반드시 통과해야 해요. 일부러 바꾼 거라면(밸런스 조정, 새 아이템 …) 바뀐 곳이 의도와 맞는지 확인한 뒤 `python3 dev/qa/snapshot.py --update`로 기록을 갱신하고 함께 커밋해요
   - 세이브 입력(`dev/qa/snapshot/fixtures.json`: v1~v3, v62, 옛 기능이 남은 세이브)은 고정이에요. 세이브 구조를 바꾸면 옛 세이브 사례를 `snapshot.py`의 `LEGACY`에 넣고 `--fixtures`로 추가해요 (이미 있는 세이브는 안 바뀌어요)
4. **테스트**: `python3 dev/qa/run.py` — 비교 테스트 + 기능 테스트 65개 전체를 동시에 4개씩 돌리고 끝에 요약만 보여 줘요 (약 5분, 백그라운드로 돌리고 결과 확인)
   - 일부만: `python3 dev/qa/run.py crafting`(파일 이름) 또는 `python3 dev/qa/run.py emergency_escape cooking`(테스트 이름). 목록(이름·파일)은 `--list`, 테스트마다 한 줄씩 보려면 `-v`, 동시 개수는 `-j 2`
   - 실패한 테스트는 혼자 한 번 더 돌려요. **두 번 모두 실패한 점검만 진짜 실패**로 보고, 한 번만 실패한 건 「가끔 실패하는 테스트」로 요약에 적어요 (`--no-retry`로 끄기)
   - 새 기능을 넣으면 알맞은 `dev/qa/test_*.py`에 `def test_영어이름():` 함수를 하나 추가해요 (예: `def test_fishing_contest():` — 번호 없이 무엇을 확인하는지 짧게, 같은 기능 테스트 옆에. 함수 안에서 `async def main()`을 만들고 `return main`. 같은 파일의 다른 함수를 본보기로)
   - 테스트는 서로 기대지 않아 순서와 상관없이 동시에 돌아요 (예외: `title_import`는 `save_file_dev_tools`가 내보낸 파일을 써서 늘 그 바로 다음에 — `run.py`의 `AFTER`)
   - 옛 번호(v63까지 커밋·설명에 나오는 `qa2`~`qa59`) → 지금 이름: qa2 `core_play` · qa3 `walk_over` · qa4 `mouse_aim` · qa5 `save_file_dev_tools` · qa6 `title_import` · qa7 `terrain_shovel` · qa8 `craft_quantity` · qa9 `character_menu` · qa10 `durability_repair` · qa11 `salvage` · qa12 `doors` · qa13 `dress_up` · qa14 `backups` · qa15 `cloud_sync` · qa16 `click_direction` · qa17 `weapons_skills` · qa18 `drag_zones_layout` · qa19 `stress_performance` · qa20 `chests` · qa21 `hotbar_bag` · qa22 `circuits` · qa23 `boss_effects_rarity` · qa24 `bosses_regions` · qa25 `arrow_keys_trees` · qa26 `multi_tile_rotation` · qa27 `keyboard_focus` · qa28 `light_seeds` · qa29 `balance` · qa30 `boss_rematch` · qa31 `lantern_tree_growth` · qa32 `play_time_cloud` · qa33 `farming_basics` · qa34 `farming_advanced` · qa35 `hidden_rooms` · qa36 `cooking` · qa37 `deep_caves` · qa38 `recall_faint` · qa39 `boss_phases` · qa40 `automation_giant_crops` · qa41 `building_cleanup` · qa42 `equipment_weapons` · qa43 `materials_upgrades` · qa44 `skills` · qa45 `pets` · qa46 `ranch` · qa47 `map_markers` · qa48 `fenced_home` · qa49 `ring_map` · qa50 `held_item_actions` · qa51 `hand_drawn_art` · qa52 `ring_map_boss_room` · qa53 `furniture_size` · qa54 `emergency_escape` · qa55 `renames` · qa56 `timed_jobs` · qa57 `workbench_tiers` · qa58 `gear_bench_tiers` · qa59 `workbench_tabs`
   - 스크린샷과 로그는 `dev/qa/out/<테스트>/`, 전체 요약은 `dev/qa/out/summary.txt`에 생겨요 (저장소에는 안 올라가요)
   - **흔들리지 않는 테스트 쓰는 법** (v62 이후 흔들리던 테스트를 고치며 찾은 원인들):
     - 게임 안의 일을 기다릴 땐 실제 시계(`wait_for_timeout`) 대신 `wait_game(pg, 초)`(게임 시간 기준) 또는 `wait_until(pg, "()=>조건")`. 게임은 한 프레임에 최대 0.05초만 진행해서, 바쁘면 실제 1초에 게임은 1초가 안 지나요
     - 상태를 맞추는 것과 확인·행동은 한 번의 `ev(...)` 안에서. 사이에 프레임이 돌면 적이 움직이거나, 몬스터가 새로 생기거나, 화면(카메라)이 움직여요
     - 확률(치명타 등)에 기대는 점검은 계산하는 동안만 `Math.random`을 고정하고 끝나면 되돌려요. 지도 모양에 기대는 점검은 필요한 지형을 테스트가 직접 깔아요
     - 마우스로 세계의 한 칸을 가리킬 땐 화면이 마우스를 따라 움직인다는 걸 기억해요 (`click_direction`의 `aim_at`, 판단 순간 다시 조준)
     - 칸·버튼 위치는 그림이 늦게 그려지면 바뀌어요. 위치가 멈춘 뒤 재고, 놓기 직전에 다시 재요 (`drag_zones_layout`의 `drag`)
     - 페이지는 `URL+'qa.html'`로 열어요 (작은 웹 서버). `file://`로 열면 바쁠 때 다시 열면서 localStorage가 사라지는 일이 있었어요
   - 지금 상태: 다시 돌리기 없이 전체를 5번 돌려 모두 매번 통과해요 (마지막까지 남았던 긴급 탈출 테스트는 테스트가 아니라 게임 현상이라 v63에서 게임 쪽을 고쳤어요 — 아래 「긴급 탈출」)
   - 테스트마다 자기 폴더(`dev/qa/out/<테스트>/`)를 써서 동시에 돌려도 서로 덮어쓰지 않아요. 단, `run.py`를 두 개 동시에 돌리지는 않아요
5. **배포**: `main`에 올리면 GitHub Actions가 테스트 후 배포 파일을 만들어 줘요 (위 「자동 반영·배포」). 직접 만들 때는 `python3 dev/build_web.py` — 위키(`wiki.html`)도 함께 다시 만들어져요
6. **올리기**
   - 깃허브: `git add -A && git commit && git push origin main` (작성자 Juyeon / yon2pang@gmail.com)
   - Claude 게임 페이지(아티팩트): `python3 dev/build.py`로 묶은 `dev/index.html`을 기존 주소 `https://claude.ai/artifact/RBFeEeaCo7T5a6LgZCb9ga`에 다시 게시 (다운로드 기능 유지)
   - 위키 페이지(아티팩트): 저장소 맨 위 `wiki.html`을 기존 주소 `https://claude.ai/artifact/6uDujDPR1jG1DLBBg4Nn6g`에 다시 게시

## 테스트 환경 준비 (새 작업 공간일 때)

```
pip install playwright --break-system-packages   # 이미 있으면 생략
# 브라우저가 미리 깔린 환경이면 playwright install은 하지 않아요
# (깔린 브라우저와 버전이 안 맞는다는 오류가 나면 그 브라우저에 맞는 버전으로: 예) chromium-1194 → pip install playwright==1.56.0)
```

## 세이브 호환 규칙

- 저장 키: `lantern-tree-save-v1`, 현재 세이브 버전 `v: 3`
- 예전 세이브는 불러올 때 고쳐서 이어지게 해요. 고치는 코드는 모두 `dev/src/js/save/migrations.js`에 있고, `deserialize()`가 정해진 순서로 불러요 (`migrateV2`, `migrateV3`, `fixParts`, `grantUniques`, `ensureDeepAltars` …)
- 저장 구조를 바꾸면 반드시 옛 세이브 불러오기 테스트를 추가해요
- 가구 칸 크기 (v50부터): 작업대 2×1, 통나무·돌 벤치 2×1. 침대는 v51부터, 구리 제작대·화로·용광로는 v55부터 다시 1칸 (전에 놓은 남는 칸은 `fixParts`가 지움). v56부터 v50 전 세이브(`fpV` 없음)도 같은 크기 — 불러올 때 `growFootprints()`가 작업대·벤치를 오른쪽(막히면 왼쪽) 칸으로 넓히고, 양옆이 막히면 아이템으로 돌려줘요. 커진 가구는 손그림이 들어오기 전까지 옛 그림을 늘린 임시 그림. 가방·단축칸 아이콘은 길쭉한 그림도 정사각형 칸에 넣어 1칸으로 보여요(`squareIcon`, v55)
- 지도 모양 두 가지 (v47부터): 새 게임은 600×600 고리 지도(`mapV: 2`, `LAY 2`), v47 전 세이브는 200×200 원래 지도(`mapV` 없음 → `LAY 1`) 그대로. `setLayout()`이 W·H·CX·CY·보스 위치를 바꿔요
- 테스트의 `mkpage()`는 새 게임을 원래 지도(layout 1)로 고정해요 (`localStorage 'lantern-tree-layout'`). 고리 지도는 `mkpage(..., layout=2)`로 따로 테스트해요 (`ring_map`)
- 손에 든 물건 (v48~v64 — v65에서 아래 「조작」으로 바뀜): `decide()`는 `holdMode()`로 든 물건의 일만 해요(`heldDecide`: 가구·씨앗=놓기, 삽=파기, 무기=공격, 곡괭이=캐기 …). 빈손·재료는 `handDecide`(예전처럼 다 함). 장비에 무기 칸 없음 — `curWeapon()`은 든 무기, 없으면 주먹. 옛 세이브의 `equip.weapon`은 빈 단축칸으로(`unslotWeapon`). 장비 칸·펫은 가방 패널 안(`openPanel('equip')`은 가방을 열어요)
- 조작 (v65~): 버튼 둘 — **공격**(칼, PC 왼쪽 클릭·J)은 `controls.js`의 `doAttack()`: 든 무기 → 마지막에 쓴 무기(`G.lastW`) → 가방 속 가장 센 무기 → 주먹, 가까운 몬스터를 스스로 조준(PC는 마우스). 몬스터가 없으면 앞에 놓은 가구·직접 쌓은 벽(6·7번)을 쳐서 3번이면 아이템으로 떨어뜨려요(`hitRecover`, 2초 안에, 물건 든 상자는 안 됨). **상호작용**(손, PC E·스페이스)은 `decide()`: 예외(꾸러미·일어나기·낚시) → 일부러 든 물건이 쓸 곳이 있으면 그것 → 앞에 있는 것에 맞춘 추천(`autoOptions`). 다른 선택지는 `G.alts`(작은 버튼 하나 + 화살표, PC R 실행·Q 넘김, `onlyAlt`는 큰 버튼이 되지 않음). 도구는 **도구 주머니** `G.tools`(가방 칸을 쓰지 않음, `isTool`: 곡괭이·도끼·낫·삽·물뿌리개·낚싯대·올가미; 도끼는 무기가 아니라 도구). `G.sel = -1`이면 단축칸 맨 앞 도구 칸(`G.tools[G.tsel]`), `G.tHand`는 일부러 든 것(자동으로 꺼낸 곡괭이·도끼·낫·삽은 더 좋은 것으로 바뀜). 수리·분해·강화 목록의 주머니 칸 번호는 `'t:3'`(`slotList`·`itemAt`·`clearSlot`). 새로 얻은 물건: 같은 칸에 합치기 → 빈 단축칸 → 가방. 가구 방향은 놓기 전에만(작은 버튼 [방향]·PC R): 의자류 `ROT4` 4방향, 나머지 2방향, `NOROT`·장치·상자·자연물은 그대로 — 놓은 방향은 `o.dir`(가로세로가 바뀌면 `o.rot`), 그림은 `rotImg`(옆모습 `obj/<id>S.png`·뒷모습 `obj/<id>U.png`이 없으면 90° 돌린 그림). v65 전 세이브는 가방·단축칸의 도구를 주머니로 옮기고 들고 있던 도구는 그대로 들어요(`migrateTools65`, `nm65`)
- 긴급 탈출 (v57): 메뉴 「갇혔을 때 → 긴급 탈출」(두 번 눌러 확인, 30초에 한 번). `regionOf()`로 지금 자리가 막혔는지(3000칸·60칸 안에서 끝나면 막힘, 문은 통로) 보고, 막혔으면 바깥의 가장 가까운 트인 곳(`openSpotNear`), 아니면 집으로 — 집이 막혀 있으면 집 바깥으로. 기절·귀환·불러오기의 `closedIn`(16칸)은 그대로 (`emergency_escape`)
  - v63: 곡괭이로 팔 수 있는 **자연 바위는 막힌 것으로 보지 않아요** — 처음 만들어진 세계에서도 바위였던 칸의 바위벽은 통로처럼 봐요(석영 광맥 포함). 나무·돌벽돌 벽, 빈 땅에 쌓은 벽(흙벽도), 울타리·가구, 단단한 암반, 물·용암은 그대로 막힘. 전에는 원래 지도 약 11%, 고리 지도 약 5%의 새 세계가 「바위로 둘러싸인 빈터」에서 시작해 갇힌 것으로 판정됐어요 (지금 190개 세계 중 0개)
  - v64: 같은 규칙을 기절·귀환석·불러오기의 `closedIn`(16칸)에도 적용 — 등불나무 빈터가 자연 바위로 작게 둘러싸인 드문 세계(원래 지도 약 0.3%, 고리 지도 약 1%)에서도 빈터 바깥이 아니라 집으로. 두 판정이 같은 `shutsIn()`을 써요. `closedIn`은 바위를 빼고 봐서 막혔을 때만 처음 세계를 다시 만들어 봐요(고리 지도 약 0.15초, 한 번만)
- 제작 장소 (v58~v60): 화로 → 용광로(`furnace`, 제련), 옛 용광로 → 장비제작대(`smelter`). 용광로·요리솥은 넣어 두고 꺼내기(`o.job`, 실제 시간, v59). 세이브의 `at`으로 꺼 둔 시간만큼 `G.time`을 넘겨 작물 등이 자람(`advanceOffline`). 작업대는 `o.lv` 0~5 단계(`BENCH_N`), 레시피는 재료로 `r.tier`가 정해지고 모두 `at: 'bench'`. 옛 구리 제작대(`forge`)는 불러올 때 2칸 작업대 1단계로(`convertForges`)
- 장비제작대 (v61~): 무기·방어구·장신구·도구 레시피는 모두 `at: 'smelter'`(`gearCatOf`: weapon/armor/acc/tool), 장비제작대도 `o.lv` 0~5 단계(`GEAR_N`, `TIERED`). 수리·분해·강화도 장비제작대에서만. v61 전 세이브는 장비제작대를 가진 작업대 단계까지 올려 주고, 없으면 그 단계 장비제작대를 줘요(`nm61`)
- 작업대 창 탭 (v62~): 1줄 아이콘 탭 `BT1`(전체·재료·도구·제작대·가구·건축·편의, 고른 탭만 이름이 보임), 2줄 탭 `BT2`. 레시피의 탭은 `bcat(r)`가 정해요(가구 2단은 `FURN2` 목록, 건축은 id 이름, 자연은 건축 아래, 나무 작업장은 편의→채굴장). 이끼·버섯·수정 세트는 태그(`.stag`). 손 제작 레시피도 작업대에서 만들 수 있어요(`atHere`)
