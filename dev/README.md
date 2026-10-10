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

> 픽셀 밀도(HD) 작업은 2026-10-09에 폐기했어요. 16px 칸 밀도를 유지해요. 작업본 `dev/index.hdwip.html`은 지웠고, 필요하면 깃 기록에서 꺼낼 수 있어요.

## 작업 순서

1. **원본 수정**: `dev/index.html`
2. **문법 확인**: `node dev/qa/syn.js dev/index.html` → `ok`가 나와야 해요
3. **테스트**: `bash dev/qa/run_all.sh` (전체, 약 12분) 또는 `bash dev/qa/run_all.sh 23 24`처럼 일부만
   - 새 기능을 넣으면 `dev/qa/qa29.py`처럼 테스트를 새로 추가해요 (`qa28.py`를 본보기로)
   - 스크린샷과 로그는 `dev/qa/out/`에 생겨요 (저장소에는 안 올라가요)
   - `qa15`(클라우드 충돌), `qa16`(클릭 방향), `qa18`(PC 상자 → 가방 끌기)은 타이밍 때문에, `qa29`(지팡이·활 한 발 피해)는 치명타(10%)가 터지면, `qa18`의 꽃망울 구역·`qa24`의 용암 웅덩이·`qa45`의 쓰다듬기는 세계 모양·몬스터 등장에 따라 가끔 한 번 떨어져요. 다시 돌려서 통과하면 정상이에요
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
