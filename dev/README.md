# 개발용 폴더

게임을 고치고 배포할 때 쓰는 원본과 도구예요. 저장소 맨 위의 `index.html`은 배포용으로 바꾼 결과물이니 직접 고치지 않아요.

## 들어 있는 것

| 경로 | 내용 |
|---|---|
| `dev/index.html` | **게임 원본** (한 파일짜리 HTML/Canvas). 모든 수정은 여기서 해요 |
| `dev/build_web.py` | 원본 → 배포용 `index.html`·`sw.js`·`manifest.webmanifest`(저장소 맨 위) |
| `dev/qa/` | 회귀 테스트 (Playwright). `run_all.sh`로 한 번에 실행 |
| `dev/old/` | 옛 버전(v1~v3). 예전 세이브를 불러오는 테스트에 써요 |
| `dev/character-parts/` | 캐릭터 부위 그리기 템플릿 |
| `dev/art/` | 직접 그린 16px 그림 (아래 「16px 그림」) |
| `dev/art_32px/` | v49~v52에 쓰던 32px 손그림 보관 (게임에는 안 들어감) |
| `dev/art_pack.py` | `dev/art/`의 그림을 `dev/index.html` 안에 넣는 도구 |
| `dev/wiki/` | 게임 위키 만들기. `python3 dev/wiki/build_wiki.py` → 저장소 맨 위 `wiki.html` (게임 데이터·아이콘을 코드에서 바로 뽑아요. 게임을 고친 뒤 다시 돌리면 위키도 맞춰져요) |

## 16px 그림 (v53부터 다시 16px)

- **한 칸 = 16×16px.** 세계를 1:1(게임 픽셀 = 그림 픽셀)로 그려요 (`HD = 1`). 앞으로 그림·타일셋은 모두 16px 기준으로 맞춰요
- 그린 PNG는 게임 안 경로 그대로 `dev/art/`에 넣어요. 예) `dev/art/obj/roundTree.png`, `dev/art/item/berry.png`, `dev/art/crop/berry/3.png`, `dev/art/mon/slimeG.png`, `dev/art/animal/dog.png`, `dev/art/etc/bush/1.png`
- 넣은 뒤 `python3 dev/art_pack.py` → `dev/index.html`의 `/*@@ART*/ … /*@@ARTEND*/` 부분이 바뀌어요. 그다음 평소처럼 테스트·배포
- 외곽선은 게임이 옛 그림과 같은 방식으로 붙여요. 그린 그대로 쓰려면 파일 이름 끝을 `.raw.png`로
- 작물은 식물만 그려요 (흙은 게임이 깔아 줌). 하얀 번쩍임·꺼진 램프·세로 가구·어린 나무·거대 작물은 원본 그림에서 자동으로 만들어요
- 나무류는 v50부터 크게 그려요 (둥근 나무·뿌리기둥·큰버섯 1.75배, 벚꽃나무 1.4배, 큰 고목 1.5배, 부딪히는 칸은 그대로). 높이 34px 넘는 물체 뒤에 플레이어가 서면 반투명
- 바닥·벽 (v54부터): `floor/<바닥 번호>/<0,1,2…>.png` 바닥 무늬(몇 장이든 됨, 칸마다 골고루 섞여 나옴. 0·1·2번 중 1·2번은 바닥 가장자리 색을 뽑는 데 쓰니 무늬 없는 것으로), `wtop/<벽 번호>/<0~3>.png` 벽 윗면 4장, `wfront/<벽 번호>.png` 벽 앞면(16×5)
- 아직 손그림을 못 넣는 것: 캐릭터(부위별 템플릿 예정), 등불나무, 얇은 벽·문, 물
- v54: 구매한 Fantasyville 에셋(동굴·대장간·식료품점·마을·실내)에서 잘라 넣은 그림 목록은 `dev/art/FANTASYVILLE.md`
- 기록: v49(10-10)에 세계를 2배 해상도(한 칸 32px, `HD = 2`)로 바꾸고 v51에 32px 손그림 15장을 넣었다가, v53(10-11)에 16px 타일셋을 쓰기로 하면서 16px로 되돌렸어요. 32px 그림은 `dev/art_32px/obj/`, 2배 해상도 코드는 `HD` 값과 `outlineHD`로 남아 있어요 (`HD = 2`로 바꾸면 다시 32px)

## 그림 자동 반영 (GitHub Actions)

- `dev/art/`에 PNG를 올리면(깃허브 웹사이트에서 「Add file → Upload files」도 됨) `.github/workflows/art.yml`이 `art_pack.py` → `build_web.py`를 돌리고 `dev/index.html`·`index.html`·`sw.js`를 커밋해요. GitHub Pages 게임이 1~2분 뒤 바뀌어요.
- 그림만 넣는 작업이라 회귀 테스트는 돌리지 않아요. Claude 게임 페이지(아티팩트)는 다음에 Claude가 배포할 때 함께 반영돼요.
- 다른 세션이 배포하는 중에는 올리지 않기 (배포 파일이 겹칠 수 있어요). Claude 세션은 작업 전·커밋 전에 늘 `git pull`.
- 수동으로 다시 돌리려면 깃허브 Actions 탭 → 「그림 자동 반영」 → Run workflow.

## 작업 순서

1. **원본 수정**: `dev/index.html`
2. **문법 확인**: `node dev/qa/syn.js dev/index.html` → `ok`가 나와야 해요
3. **테스트**: `bash dev/qa/run_all.sh` (qa2~qa56 전체, 약 25분 — 백그라운드로 돌리고 결과 확인) 또는 `bash dev/qa/run_all.sh 23 24`처럼 일부만
   - 새 기능을 넣으면 `dev/qa/qa29.py`처럼 테스트를 새로 추가해요 (`qa28.py`를 본보기로)
   - 스크린샷과 로그는 `dev/qa/out/`에 생겨요 (저장소에는 안 올라가요)
   - `qa15`(클라우드 충돌), `qa16`(클릭 방향)은 타이밍 때문에, `qa29`(지팡이·활 한 발 피해)는 치명타(10%)가 터지면, `qa18`의 꽃망울 구역·`qa24`의 용암 웅덩이·`qa45`의 쓰다듬기는 세계 모양·몬스터 등장에 따라, `qa47`은 가끔 한 번 떨어져요. 다시 돌려서 통과하면 정상이에요
   - `qa18`의 「PC 상자 → 가방 원하는 칸」 끌기는 v40부터 계속 실패하는 알려진 문제예요
   - 테스트는 한 번에 하나씩만 돌려요 (같은 테스트 페이지를 써서 동시에 돌리면 서로 덮어써요)
4. **배포용 만들기**: `python3 dev/build_web.py` — 위키(`wiki.html`)도 함께 다시 만들어져요
5. **올리기**
   - 깃허브: `git add -A && git commit && git push origin main` (작성자 Juyeon / yon2pang@gmail.com)
   - Claude 게임 페이지(아티팩트): `dev/index.html`을 기존 주소 `https://claude.ai/artifact/RBFeEeaCo7T5a6LgZCb9ga`에 다시 게시 (다운로드 기능 유지)
   - 위키 페이지(아티팩트): 저장소 맨 위 `wiki.html`을 기존 주소 `https://claude.ai/artifact/6uDujDPR1jG1DLBBg4Nn6g`에 다시 게시

## 테스트 환경 준비 (새 작업 공간일 때)

```
pip install playwright --break-system-packages   # 이미 있으면 생략
# 브라우저가 미리 깔린 환경이면 playwright install은 하지 않아요
```

## 세이브 호환 규칙

- 저장 키: `lantern-tree-save-v1`, 현재 세이브 버전 `v: 3`
- 예전 세이브는 불러올 때 고쳐서 이어지게 해요 (`migrateV2`, `migrateV3`, `fixParts`, `grantUniques`, `ensureDeepAltars`)
- 저장 구조를 바꾸면 반드시 옛 세이브 불러오기 테스트를 추가해요
- 가구 칸 크기 (v50부터): 작업대 2×1, 통나무·돌 벤치 2×1. 침대는 v51부터, 구리 제작대·화로·용광로는 v55부터 다시 1칸 (전에 놓은 남는 칸은 `fixParts`가 지움). v56부터 v50 전 세이브(`fpV` 없음)도 같은 크기 — 불러올 때 `growFootprints()`가 작업대·벤치를 오른쪽(막히면 왼쪽) 칸으로 넓히고, 양옆이 막히면 아이템으로 돌려줘요. 커진 가구는 손그림이 들어오기 전까지 옛 그림을 늘린 임시 그림. 가방·단축칸 아이콘은 길쭉한 그림도 정사각형 칸에 넣어 1칸으로 보여요(`squareIcon`, v55)
- 지도 모양 두 가지 (v47부터): 새 게임은 600×600 고리 지도(`mapV: 2`, `LAY 2`), v47 전 세이브는 200×200 원래 지도(`mapV` 없음 → `LAY 1`) 그대로. `setLayout()`이 W·H·CX·CY·보스 위치를 바꿔요
- 테스트의 `mkpage()`는 새 게임을 원래 지도(layout 1)로 고정해요 (`localStorage 'lantern-tree-layout'`). 고리 지도는 `mkpage(..., layout=2)`로 따로 테스트해요 (qa49)
- 손에 든 물건 (v48부터): `decide()`는 `holdMode()`로 든 물건의 일만 해요(`heldDecide`: 가구·씨앗=놓기, 삽=파기, 무기=공격, 곡괭이=캐기 …). 빈손·재료는 `handDecide`(예전처럼 다 함). 장비에 무기 칸 없음 — `curWeapon()`은 든 무기, 없으면 주먹. 옛 세이브의 `equip.weapon`은 빈 단축칸으로(`unslotWeapon`). 장비 칸·펫은 가방 패널 안(`openPanel('equip')`은 가방을 열어요)
- 긴급 탈출 (v57): 메뉴 「갇혔을 때 → 긴급 탈출」(두 번 눌러 확인, 30초에 한 번). `regionOf()`로 지금 자리가 막혔는지(3000칸·60칸 안에서 끝나면 막힘, 문은 통로) 보고, 막혔으면 바깥의 가장 가까운 트인 곳(`openSpotNear`), 아니면 집으로 — 집이 막혀 있으면 집 바깥으로. 기절·귀환·불러오기의 `closedIn`(16칸)은 그대로 (qa54)
