# 테스트 실행: 비교 테스트(snapshot.py) + 회귀 테스트(test_*.py 안의 qa2~qa59)를 한 번에 돌리고 요약만 보여 줘요.
# 사용법: python3 dev/qa/run.py               → 전부 (동시에 4개씩, 약 10분)
#         python3 dev/qa/run.py crafting      → test_crafting.py만      python3 dev/qa/run.py qa59 qa33 → 테스트 몇 개만
#         -j 2  동시에 돌릴 개수 · -v  테스트마다 결과 한 줄씩 · --no-retry  실패한 테스트를 다시 돌리지 않기 · --list  목록
# 자세한 로그·스크린샷: dev/qa/out/<테스트>/ (log.txt), 전체 요약: dev/qa/out/summary.txt
import asyncio, importlib, json, os, re, sys, time, traceback

QA = os.path.dirname(os.path.abspath(__file__))
DEV = os.path.dirname(QA)
OUT = os.path.join(QA, 'out')
TIMEOUT = 900  # 테스트 하나당 최대 시간(초)


def tests():
    """{'qa2': 'test_basics', …} — test_*.py 안의 def qaNN() 순서대로"""
    found = {}
    for f in sorted(os.listdir(QA)):
        if f.startswith('test_') and f.endswith('.py'):
            for m in re.finditer(r'^def (qa\d+)\(\):', open(os.path.join(QA, f), encoding='utf-8').read(), re.M):
                found[m.group(1)] = f[:-3]
    return found


def one(name):
    """자식 프로세스: 테스트 하나를 실행 (run.py가 부름)"""
    sys.path.insert(0, QA)
    mod = importlib.import_module(tests()[name])
    import harness
    harness.RES.clear()
    try:
        asyncio.run(asyncio.wait_for(getattr(mod, name)()(), TIMEOUT))
    except BaseException:
        traceback.print_exc(); print('ERROR 테스트가 끝까지 돌지 못했어요'); sys.exit(2)


async def job(name, src, sem, verbose):
    async with sem:
        d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
        env = dict(os.environ, QA_OUT=d + '/', QA_SRC=src, PYTHONDONTWRITEBYTECODE='1')
        cmd = [sys.executable, os.path.join(QA, 'snapshot.py')] if name == 'snapshot' else [sys.executable, __file__, '--one', name]
        t0 = time.time()
        p = await asyncio.create_subprocess_exec(*cmd, env=env, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT, cwd=QA)
        try: out = (await asyncio.wait_for(p.communicate(), TIMEOUT + 60))[0].decode('utf-8', 'replace')
        except asyncio.TimeoutError: p.kill(); out = 'ERROR 시간 초과'
        sec = time.time() - t0
        open(os.path.join(d, 'log.txt'), 'w', encoding='utf-8').write(out)
        ok = len(re.findall(r'^PASS', out, re.M)); fails = re.findall(r'^FAIL.*', out, re.M)
        err = 'ERROR' in out or not re.search(r'^TOTAL', out, re.M)
        r = {'name': name, 'pass': ok, 'fail': fails, 'more': re.findall(r'^  \S.*', out, re.M)[:10] if name == 'snapshot' else [], 'error': (out.strip().splitlines() or ['?'])[-3:] if err else None, 'sec': round(sec, 1)}
        if verbose: print(f"{name:9s} {ok}개 통과" + (f", 실패 {len(fails)}" if fails else '') + (' · 오류' if err else '') + f" · {sec:.0f}초", flush=True)
        return r


async def main(argv):
    jobs = 4; verbose = '-v' in argv; retry = '--no-retry' not in argv; src = None; picks = []
    it = iter(argv)
    for a in it:
        if a == '-j': jobs = int(next(it))
        elif a == '--src': src = os.path.abspath(next(it))
        elif not a.startswith('-'): picks.append(a)
    T = tests()
    if '--list' in argv:
        for n, f in T.items(): print(n, f)
        return 0
    names = [n for n, f in T.items() if not picks or n in picks or f in picks or f[5:] in picks]
    if picks and not names: print('그런 테스트가 없어요:', ' '.join(picks)); return 1
    if not src:
        sys.path.insert(0, DEV); import build
        src = build.main()
    if not picks: names = ['snapshot'] + names
    times_f = os.path.join(OUT, 'times.json')
    try: times = json.load(open(times_f))
    except Exception: times = {}
    names.sort(key=lambda n: -times.get(n, 60))  # 오래 걸리는 것부터 시작해야 전체가 빨리 끝나요
    os.makedirs(OUT, exist_ok=True); t0 = time.time(); sem = asyncio.Semaphore(jobs)
    res = await asyncio.gather(*(job(n, src, sem, verbose) for n in names))
    # 실패한 테스트는 한 번만 혼자 다시 돌려요 (동시에 돌리면 타이밍 테스트가 가끔 흔들려요). 결과에는 둘 다 적어요
    again = {}
    if retry:
        for r in res:
            if r['fail'] or r['error']:
                again[r['name']] = await job(r['name'], src, asyncio.Semaphore(1), verbose)
    total = time.time() - t0
    for r in res: times[r['name']] = r['sec']
    json.dump(times, open(times_f, 'w'), indent=0)
    n_ok = sum(r['pass'] for r in res); n_fail = sum(len(r['fail']) for r in res)
    bad = [r for r in res if r['fail'] or r['error']]
    still = [r for r in bad if r['name'] not in again or again[r['name']]['fail'] or again[r['name']]['error']]
    lines = [f"QA {'통과' if not still else '실패 있음'}: 테스트 {len(res)}개 · 점검 {n_ok + n_fail}개 중 {n_ok}개 통과 · {total // 60:.0f}분 {total % 60:.0f}초 (동시 {jobs}개)"]
    for r in bad:
        a = again.get(r['name']); tag = '' if not a else (' → 다시 돌려 통과 (가끔 실패하는 테스트)' if not a['fail'] and not a['error'] else ' → 다시 돌려도 실패')
        for f in r['fail'][:5]: lines.append(f"  {r['name']} {f[:160]}{tag}")
        for f in r['more']: lines.append(f'    {f.strip()[:160]}')
        if r['error']: lines.append(f"  {r['name']} 오류{tag}: " + ' / '.join(x[:120] for x in r['error']))
    lines.append('로그: dev/qa/out/<테스트>/log.txt · 요약: dev/qa/out/summary.txt')
    detail = [f"{r['name']:9s} 통과 {r['pass']:3d} 실패 {len(r['fail'])} {'오류 ' if r['error'] else ''}{r['sec']:6.0f}초" for r in sorted(res, key=lambda r: (len(r['name']), r['name']))]
    open(os.path.join(OUT, 'summary.txt'), 'w', encoding='utf-8').write('\n'.join(lines + [''] + detail) + '\n')
    print('\n'.join(lines))
    return 1 if still else 0


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--one': one(sys.argv[2])
    else: sys.exit(asyncio.run(main(sys.argv[1:])))
