# 등불나무 아래 — Claude 작업 안내

아기자기한 픽셀 생존·건축·농사 웹게임 (HTML/Canvas, 프레임워크·외부 라이브러리 없음). GitHub Pages + 홈 화면 앱(PWA)으로 배포해요.
자세한 작업 순서·세이브 호환 규칙은 `dev/README.md`, 소스 파일 지도는 `dev/src/README.md`.

## 어디를 고치나

- **게임 원본은 `dev/src/`** (`shell.html` + `style.css` + `js/` 24개). 여기만 고쳐요.
- 저장소 맨 위 `index.html`·`sw.js`·`manifest.webmanifest`·`wiki.html`, 그리고 `dev/index.html`은 **모두 만들어지는 파일**이에요. 직접 고치지 않아요.
  - `dev/index.html`은 `python3 dev/build.py`가 `dev/src/`를 묶어 만들어요 (저장소에는 안 올라감).
- 그림은 `dev/art/`에 PNG로 넣고 `python3 dev/art_pack.py` (→ `dev/src/js/art/hand-art.js`의 `/*@@ART*/` 부분). 그 부분은 손으로 고치지 않아요.

## 꼭 지킬 규칙

- **JS는 `shell.html`의 `@include` 순서대로 하나의 `<script>` 안에 이어 붙여져요.** `import`/`export` 없이 전역 이름을 같이 써요.
  - 맨 위에서 바로 실행되는 줄(`const …`, `Object.assign(ITEMS, …)`, `RECIPES.push(…)`, `TIPS.push(…)`)은 파일 순서대로 실행돼요. 앞 파일의 값을 뒤에서 쓰는 건 되고, 반대는 안 돼요.
  - `RECIPES`·`QSIDE`·`TIPS`에 넣는 순서가 화면 순서예요. 일괄 보정(예: `features/automation-tiers.js` 중간의 「지형 재료 2배」)은 **그 줄보다 앞에서 추가된 레시피에만** 적용돼요. 파일·줄 순서를 바꾸면 밸런스가 바뀔 수 있어요.
  - 새 기능은 비슷한 `js/features/` 파일 끝에 덧붙이거나, 크면 새 파일 + `shell.html`에 `// @include` 한 줄 (`js/features/automation-tiers.js` 다음, `js/render.js` 앞). 파일 지도는 `dev/src/README.md`.
- **세이브 호환**: 저장 키 `lantern-tree-save-v1`, 세이브 버전 `v: 3`은 바꾸지 않아요. 새 필드는 기본값과 함께 추가만 해요.
  - 옛 세이브 보정은 모두 `js/save/migrations.js`에 두고 `save/state.js`의 `deserialize()`에서 불러요 (호출 순서가 중요).
  - 세이브 구조를 바꾸면 옛 세이브 사례를 `dev/qa/snapshot.py`의 `LEGACY`에 추가하고 `--fixtures`로 추가해요 (이미 있는 세이브는 안 바뀌어요).
- 기존 기능·밸런스·그래픽·조작감을 요청 없이 바꾸지 않아요. 코드 정리만 했다면 아래 비교 테스트가 그대로 통과해야 해요.

## 확인 순서

1. `python3 dev/build.py && node dev/qa/syn.js dev/index.html` → `ok`
2. **비교 테스트** `python3 dev/qa/snapshot.py` (약 20초, `run.py`도 맨 먼저 돌려요): 게임 데이터·그림 지문·옛 세이브 불러오기 결과를 `dev/qa/snapshot/`과 비교.
   일부러 바꾼 거라면 바뀐 곳이 의도와 맞는지 확인하고 `--update`로 갱신해 같이 커밋해요.
3. 전체 테스트 `python3 dev/qa/run.py` (비교 테스트 + qa2~qa59, 약 5분, 백그라운드로 돌리고 끝에 나오는 요약만 읽어요) 또는 `python3 dev/qa/run.py crafting` / `qa59`.
   새 기능에는 알맞은 `dev/qa/test_*.py`에 `def qaNN():`을 추가해요. 실패한 테스트는 자동으로 한 번 더 돌려 요약에 적어 줘요. 가끔 떨어지는 테스트 목록은 `dev/README.md`.
   - Playwright가 깔린 브라우저와 버전이 안 맞으면 그 브라우저에 맞는 버전으로 설치 (예: `/opt/pw-browsers/chromium-1194` → `pip install playwright==1.56.0 --break-system-packages`). `playwright install`은 하지 않아요.
4. 배포: `main`에 올리면 GitHub Actions(`.github/workflows/deploy.yml`)가 비교 테스트 → 그림 넣기 → 전체 테스트를 돌리고, **통과하면** 배포 파일(`index.html`·`sw.js`·`wiki.html`)을 만들어 커밋해요.
   데이터를 일부러 바꿨다면 `snapshot.py --update`로 갱신한 기록을 같이 올려야 통과해요. 직접 만들 때는 `python3 dev/build_web.py`.
