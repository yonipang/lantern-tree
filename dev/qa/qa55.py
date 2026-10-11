import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v58: 이름 변경 — 화로 → 용광로, 용광로 → 장비제작대 / 구이 4개는 요리솥으로 / 장비제작대는 작업대에서 나무·돌로
H2=HOOK.replace("computeLight}","computeLight,RECIPES,STN,GUIDE,newGame}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        r=await ev(pg,"()=>{const T=__T;return [T.ITEMS.furnace.n,T.OBJ.furnace.n,T.STN.furnace,T.ITEMS.smelter.n,T.OBJ.smelter.n,T.STN.smelter,T.STN.pot]}")
        rec('이름','화로 → 용광로, 용광로 → 장비제작대, 요리솥 그대로', r==['용광로','용광로','용광로','장비제작대','장비제작대','장비제작대','요리솥'], str(r))
        r=await ev(pg,"()=>{const T=__T,at=id=>T.RECIPES.find(q=>q.out===id).at;return [['grilled','grilledFish','friedEgg','pancake'].map(at).join(','),['copperBar','ironBar','goldBar','quartzR'].map(at).join(','),T.RECIPES.filter(q=>q.at==='furnace').length]}")
        rec('레시피','구운 버섯·구운 생선·달걀 프라이·팬케이크는 요리솥, 용광로는 괴 4종만', r==['pot,pot,pot,pot','furnace,furnace,furnace,furnace',4], str(r))
        r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(q=>q.out==='smelter');return [rc.at,rc.req.map(([id])=>id).join(',')]}")
        rec('장비제작대','작업대에서 나무·돌·송진으로 (철괴 없이)', r==['bench','wood,stone,resin'], str(r))
        r=await ev(pg,"()=>{const g=__T.GUIDE.map(q=>typeof q.t==='function'?q.t():q.t).join('|');return [g.includes('용광로를 놓고 구리괴'),g.includes('화로')]}")
        rec('퀘스트','메인 퀘스트 문구도 「용광로」로', r==[True,False], str(r))
        # open the furnace: only bars
        await ev(pg,"()=>{const T=__T,G=T.G;const i=T.idx(T.CX+6,T.CY+6);G.objs.set(i,{t:'furnace'});T.openPanel('craft',{st:'furnace',i})}"); await pg.wait_for_timeout(500)
        r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [t.includes('용광로에서 만들기'),t.includes('구리괴'),t.includes('구운 버섯'),t.includes('화로')]}")
        await pg.screenshot(path=SP+'qa55_furnace.png'); await ev(pg,"()=>__T.closePanel()")
        rec('제작 창','용광로를 열면 「용광로에서 만들기」, 괴만 보임', r==[True,True,False,False], str(r))
        # old save notice
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));delete s.stats.nm58;T.deserialize(s);return T.G.stats.nm58}""")
        await pg.wait_for_timeout(2900)
        t=await ev(pg,"()=>document.querySelector('#toasts').innerText")
        rec('옛 세이브','화로·용광로가 있던 옛 세이브는 불러올 때 이름이 바뀌었다는 알림 한 번', r==1 and '화로 → 용광로' in t and '장비제작대' in t, t[-80:])
        r=await ev(pg,"""()=>{const T=__T;T.newGame(9);const s=JSON.parse(JSON.stringify(T.serialize()));const a=s.stats.nm58;T.deserialize(s);return a}""")
        await pg.wait_for_timeout(2900)
        t=await ev(pg,"()=>document.querySelector('#toasts').innerText")
        rec('새 게임','새 게임은 알림 없음', r==1 and t.count('화로 → 용광로')<=1, str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
