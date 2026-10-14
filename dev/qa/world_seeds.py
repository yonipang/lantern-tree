# v70 (BF-04) 새 세계(지도 버전 3)를 시드 여러 개로 한꺼번에 점검해요. 전체 테스트(run.py)에는 들어 있지 않고 따로 돌려요.
# 실행: python3 dev/qa/world_seeds.py [시드 개수, 기본 300]   (먼저 python3 dev/build.py)
# 시드마다: 점검(길·지역·자원) 통과까지 몇 번 만에 됐는지(0 = 고정 자리로 돌아감), 숨은 방 8곳, 저장·불러오기 뒤 같은 자리·지형, 만드는 시간
import asyncio, collections, sys
from harness import *

HK=HOOK.replace("computeLight}","computeLight,newGame,makeWorld3,checkWorld,get L(){return {MAPV,ANCH}}}")
JS="""(seed)=>{const T=__T;const t0=performance.now();T.newGame(seed);const ms=performance.now()-t0;const a=JSON.stringify(T.L.ANCH),wall=T.G.wall.slice(0,5000).join();
  const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G=T.G;
  return {ms:Math.round(ms),t:T.L.ANCH.t,same:JSON.stringify(T.L.ANCH)===a&&G.wall.slice(0,5000).join()===wall,rooms:(G.rooms||[]).length,mapV:s.mapV}}"""
async def main(n):
    mkpage(SRC,'qa.html',HK,layout=3)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        out=[]
        for k in range(n): out.append(await ev(pg,JS,1000003*k+17))
        await b.close()
    fb=[k for k,r in enumerate(out) if r['t']<0]; bad=[k for k,r in enumerate(out) if r['rooms']!=8 or not r['same'] or r['mapV']!=3]
    ms=sorted(r['ms'] for r in out); tries=collections.Counter(r['t']+1 for r in out)
    print(f'세계 {n}개 · 몇 번 만에 통과 {sorted(tries.items())} (0 = 고정 자리) · 고정 자리 {len(fb)}개 · 숨은 방·저장 문제 {len(bad)}개 · 새 게임 시간 중간 {ms[n//2]}ms, 가장 김 {ms[-1]}ms · 콘솔 오류 {len(errs)}')
    if bad: print('문제 시드:', [(1000003*k+17, out[k]) for k in bad[:10]])
    sys.exit(1 if bad or errs else 0)
asyncio.run(main(int(sys.argv[1]) if len(sys.argv)>1 else 300))
