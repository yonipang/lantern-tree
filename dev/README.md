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
| `dev/art/` | 직접 그린 32px 그림 (아래 「32px 그림」) |
| `dev/art_pack.py` | `dev/art/`의 그림을 `dev/index.html` 안에 넣는 도구 |

## 32px 그림 (v49부터)

- 한 칸 = 32px. 세계를 2배 해상도로 그려서, 옛 16px 그림은 지금 모습 그대로(2×2) 나오고 손그림은 1px까지 보여요
- 그린 PNG는 게임 안 경로 그대로 `dev/art/`에 넣어요. 예) `dev/art/obj/roundTree.png`, `dev/art/item/berry.png`, `dev/art/crop/berry/3.png`, `dev/art/mon/slimeG.png`, `dev/art/animal/dog.png`, `dev/art/etc/bush/1.png`
- 넣은 뒤 `python3 dev/art_pack.py` → `dev/index.html`의 `/*@@ART*/ … /*@@ARTEND*/` 부분이 바뀌어요. 그다음 평소처럼 테스트·배포
- 외곽선은 원래 그림과 같은 방식으로 게임이 자동으로 붙여요. 그린 그대로 쓰려면 파일 이름 끝을 `.raw.png`로
- 작물은 식물만 그려요 (흙은 게임이 깔아 줌). 하얀 번쩍임·꺼진 램프·세로 가구·어린 나무·거대 작물은 원본 그림에서 자동으로 만들어요
- 아직 손그림을 못 넣는 것: 바닥·벽(다음 업데이트, 32px 바닥 템플릿), 캐릭터(부위별 템플릿 예정), 등불나무, 얇은 벽·문
- 일부 모니터(배율 1, 화면 크기에 따라 칸이 48px인 경우)에서는 32px 그림의 픽셀 폭이 1~2px로 살짝 고르지 않을 수 있어요 (옛 그림은 영향 없음)
- 2026-10-09에 한 번 폐기했다가 10-10에 다시 시작했어요. 예전 작업본(v29 기준 `dev/index.hdwip.html`)은 깃 기록 `c41c68b`에 있어요

## 작업 순서

1. **원본 수정**: `dev/index.html`
2. **문법 확인**: `node dev/qa/syn.js dev/index.html` → `ok`가 나와야 해요
3. **테스트**: `bash dev/qa/run_all.sh` (qa2~qa51 전체, 약 25분 — 백그라운드로 돌리고 결과 확인) 또는 `bash dev/qa/run_all.sh 23 24`처럼 일부만
   - 새 기능을 넣으면 `dev/qa/qa29.py`처럼 테스트를 새로 추가해요 (`qa28.py`를 본보기로)
   - 스크린샷과 로그는 `dev/qa/out/`에 생겨요 (저장소에는 안 올라가요)
   - `qa15`(클라우드 충돌), `qa16`(클릭 방향)은 타이밍 때문에, `qa29`(지팡이·활 한 발 피해)는 치명타(10%)가 터지면, `qa18`의 꽃망울 구역·`qa24`의 용암 웅덩이·`qa45`의 쓰다듬기는 세계 모양·몬스터 등장에 따라, `qa47`은 가끔 한 번 떨어져요. 다시 돌려서 통과하면 정상이에요
   - `qa18`의 「PC 상자 → 가방 원하는 칸」 끌기는 v40부터 계속 실패하는 알려진 문제예요
   - 테스트는 한 번에 하나씩만 돌려요 (같은 테스트 페이지를 써서 동시에 돌리면 서로 덮어써요)
4. **배포용 만들기**: `python3 dev/build_web.py`
5. **올리기**
   - 깃허브: `git add -A && git commit && git push origin main` (작성자 Juyeon / yon2pang@gmail.com)
   - Claude 게임 페이지(아티팩트): `dev/index.html`을 기존 주소 `https://claude.ai/artifact/RBFeEeaCo7T5a6LgZCb9ga`에 다시 게시 (다운로드 기능 유지)

## 테스트 환경 준비 (새 작업 공간일 때)

```
pip install playwright --break-system-packages   # 이미 있으면 생략
# 브라우저가 미리 깔린 환경이면 playwright install은 하지 않아요
```

## 세이브 호환 규칙

- 저장 키: `lantern-tree-save-v1`, 현재 세이브 버전 `v: 3`
- 예전 세이브는 불러올 때 고쳐서 이어지게 해요 (`migrateV2`, `migrateV3`, `fixParts`, `grantUniques`, `ensureDeepAltars`)
- 저장 구조를 바꾸면 반드시 옛 세이브 불러오기 테스트를 추가해요
- 지도 모양 두 가지 (v47부터): 새 게임은 600×600 고리 지도(`mapV: 2`, `LAY 2`), v47 전 세이브는 200×200 원래 지도(`mapV` 없음 → `LAY 1`) 그대로. `setLayout()`이 W·H·CX·CY·보스 위치를 바꿔요
- 테스트의 `mkpage()`는 새 게임을 원래 지도(layout 1)로 고정해요 (`localStorage 'lantern-tree-layout'`). 고리 지도는 `mkpage(..., layout=2)`로 따로 테스트해요 (qa49)
- 손에 든 물건 (v48부터): `decide()`는 `holdMode()`로 든 물건의 일만 해요(`heldDecide`: 가구·씨앗=놓기, 삽=파기, 무기=공격, 곡괭이=캐기 …). 빈손·재료는 `handDecide`(예전처럼 다 함). 장비에 무기 칸 없음 — `curWeapon()`은 든 무기, 없으면 주먹. 옛 세이브의 `equip.weapon`은 빈 단축칸으로(`unslotWeapon`). 장비 칸·펫은 가방 패널 안(`openPanel('equip')`은 가방을 열어요)
