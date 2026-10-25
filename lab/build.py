# 실험판(lab)을 한 파일짜리 게임(lab/index.html)으로 묶어요.
# 사용법: python3 lab/build.py [출력 파일]   (안 주면 lab/index.html)
#
# 본 게임(dev/src)은 한 줄도 고치지 않고 공용으로 써요:
#   lab/src/shell.html의 「// @include js/…」 줄마다 lab/src에 같은 경로의 파일이 있으면 그 파일(실험판 것),
#   없으면 dev/src의 파일(본 게임 것 — 그림·지형 그리기·새 빛·글꼴 …)을 넣어요.
#   그래서 본 게임 파일이 가져다 쓰는 이름(예: render/terrain.js가 가져오는 G·WATER)은
#   실험판의 같은 경로 파일(lab/src/js/save/state.js·lab/src/js/sim/nature.js …)이 갖춰 주면 돼요.
# 묶는 방법·모듈 규칙 확인은 본 게임 dev/build.py의 것을 그대로 써요 (import/export 떼기, 이름 겹침, rand()/fxRand(), emit·onFrame 짝 …).
import os, re, sys

LAB = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(LAB)
LSRC = os.path.join(LAB, 'src')
DSRC = os.path.join(ROOT, 'dev', 'src')
import importlib.util  # noqa: E402
_spec = importlib.util.spec_from_file_location('main_build', os.path.join(ROOT, 'dev', 'build.py'))  # 본 게임 묶기 도구 (이 파일과 이름이 같아서 따로 불러요)
B = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(B)


def source_of(rel):
    """실험판에 같은 경로 파일이 있으면 그것, 없으면 본 게임 파일 → (경로, 'lab'|'main')"""
    lp = os.path.join(LSRC, rel)
    if os.path.isfile(lp): return lp, 'lab'
    dp = os.path.join(DSRC, rel)
    if os.path.isfile(dp): return dp, 'main'
    return None, None


def bundle(report=True):
    out, used, js, origin = [], set(), [], {}
    for line in open(os.path.join(LSRC, 'shell.html'), encoding='utf-8').read().splitlines(keepends=True):
        m = B.INC.match(line)
        if not m:
            out.append(line); continue
        rel = m.group(1)
        fp, who = source_of(rel)
        if not fp: raise B.BuildError(f'lab/src/shell.html: {rel} 파일이 실험판에도 본 게임에도 없어요')
        if rel in used: raise B.BuildError(f'lab/src/shell.html: {rel}을(를) 두 번 넣었어요')
        used.add(rel); origin[rel] = who
        s = open(fp, encoding='utf-8').read()
        if rel.endswith('.js') and B.IS_MOD.search(s):
            s, imports, exports = B.module_parts(rel, s)
            js.append((rel, s, (imports, exports)))
        elif rel.endswith('.js'):
            js.append((rel, s, None))
        out.append(s if s.endswith('\n') else s + '\n')
    missing(js)
    B.check(js, False)
    if report:
        n_main = sum(1 for r in origin.values() if r == 'main')
        print(f'실험판: 실험판 파일 {len(origin) - n_main}개 · 본 게임 공용 파일 {n_main}개')
    for root, _, files in os.walk(LSRC):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), LSRC).replace(os.sep, '/')
            if f.endswith(('.js', '.css')) and rel not in used:
                print(f'⚠ lab/src/{rel}: shell.html에 @include가 없어서 실험판에 들어가지 않아요')
    return ''.join(out)


def missing(js):
    """빠진 파일·이름을 한꺼번에 알려 줘요 (본 게임 dev/build.py는 첫 하나에서 멈춰요) — 실험판 파일을 갖출 때 보기 좋게"""
    have = {rel: (mod[1] if mod else []) for rel, _, mod in js}
    lack = {}
    for rel, s, mod in js:
        if not mod: continue
        for n, target in mod[0]:
            if target not in have or n not in have[target]:
                lack.setdefault(target, {}).setdefault(n, []).append(rel)
    if lack:
        lines = []
        for t in sorted(lack):
            lines.append(f'  {t}{" (파일 없음)" if t not in have else ""}: ' + ', '.join(f'{n}←{"/".join(sorted(set(os.path.basename(r) for r in rs)))}' for n, rs in sorted(lack[t].items())))
        raise B.BuildError('가져오는 이름이 없어요 (실험판의 같은 경로 파일에 만들어요)\n' + '\n'.join(lines))


HEAD = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">'
        '<meta name="theme-color" content="#120f1c"><meta name="robots" content="noindex">\n')


def main(out=None):
    out = out or os.path.join(LAB, 'index.html')
    try:
        html = bundle()
    except B.BuildError as e:
        sys.exit('실험판 묶기 실패: ' + str(e))
    html = HEAD + html
    old = open(out, encoding='utf-8').read() if os.path.isfile(out) else None
    if html != old:
        open(out, 'w', encoding='utf-8').write(html)
    print('build', out, f'({len(html.encode()) // 1024} KB)')
    return out


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
