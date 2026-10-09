import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
H2=HOOK.replace("computeLight}","computeLight,RECIPES,canCraft,nearStations,maxCraft,linkedChests,availCount}")
SETUP="""()=>{const G=__T.G;for(let y=104;y<118;y++)for(let x=104;x<122;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}for(let i=0;i<30;i++)G.inv[i]=null;G.enemies.length=0;G.p.x=110.5;G.p.y=112.5;
 const ch=(x,y,items)=>{const it=Array(18).fill(null);items.forEach((s,k)=>it[k]=s);G.objs.set(__T.idx(x,y),{t:'chest',items:it})};
 G.objs.set(__T.idx(110,110),{t:'bench'});ch(111,110,[{id:'wood',c:20}]);ch(112,110,[{id:'resin',c:2}]);ch(113,111,[{id:'fiber',c:9},{id:'minnow',c:1}]);ch(116,110,[{id:'stone',c:30}]);ch(104,104,[{id:'gel',c:9}])}"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,SETUP)
        r=await ev(pg,"()=>__T.linkedChests().length"); rec('상자 연결','작업대에 붙은 상자 + 이어 붙은 상자(대각선 포함) 3개 연결', r==3, r)
        r=await ev(pg,"()=>[__T.availCount('wood'),__T.availCount('resin'),__T.availCount('fiber'),__T.availCount('stone'),__T.availCount('gel')]")
        rec('상자 연결','떨어진 상자·작업대와 안 붙은 상자는 제외', r==[20,2,9,0,0], str(r))
        r=await ev(pg,"()=>{const R=__T.RECIPES.find(r=>r.out==='chest');__T.openPanel('craft',{st:'bench'});const o=[__T.canCraft(R,__T.nearStations()),__T.maxCraft(R)];__T.closePanel();return o}")
        rec('상자 연결','가방이 비어도 상자 재료로 만들 수 있음', r==[True,2], str(r))
        await ev(pg,"()=>__T.openPanel('craft',{st:'bench'})"); await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>[[...document.querySelectorAll('.stations .chip')].map(e=>e.textContent).join('|'),!!document.querySelector('.sh-body .hint, .hint')]")
        rec('상자 연결','제작 창에 "연결된 상자 3개" 표시', '연결된 상자 3개' in r[0], r[0])
        idx=await ev(pg,"()=>__T.RECIPES.findIndex(r=>r.out==='chest')")
        await pg.tap('[data-a=tab][data-i=furn]'); await pg.wait_for_timeout(250)
        await ev(pg,f"()=>{{document.querySelector('[data-a=craft][data-i=\"{idx}\"]').scrollIntoView({{block:'center'}})}}"); await pg.wait_for_timeout(150)
        txt=await ev(pg,f"()=>document.querySelector('[data-a=craft][data-i=\"{idx}\"]').closest('.rc').querySelector('.ings').textContent")
        rec('상자 연결','재료 표시에 상자 개수 포함', '20/8' in txt and '2/1' in txt, txt)
        await pg.tap(f'[data-a=craft][data-i="{idx}"]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const G=__T.G,o=(x,y)=>G.objs.get(__T.idx(x,y)).items;return [o(111,110)[0]&&o(111,110)[0].c,o(112,110)[0]&&o(112,110)[0].c,__T.countItem('chest')]}")
        rec('상자 연결','만들면 상자에서 재료가 빠지고 결과는 가방으로', r==[12,1,1], str(r))
        r=await ev(pg,"()=>{const G=__T.G;__T.addItem('wood',5);__T.addItem('resin',1);const R=__T.RECIPES.find(r=>r.out==='chest');const ri=__T.RECIPES.indexOf(R);return ri}")
        await ev(pg,"()=>__T.closePanel()"); await ev(pg,"()=>__T.openPanel('craft',{st:'bench'})"); await pg.wait_for_timeout(600); await pg.tap('[data-a=tab][data-i=furn]'); await pg.wait_for_timeout(250)
        await ev(pg,f"()=>{{document.querySelector('[data-a=craft][data-i=\"{idx}\"]').scrollIntoView({{block:'center'}})}}"); await pg.wait_for_timeout(150)
        await pg.tap(f'[data-a=craft][data-i="{idx}"]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const G=__T.G,o=G.objs.get(__T.idx(111,110)).items;return [__T.countItem('wood'),o[0]&&o[0].c,__T.countItem('resin'),G.objs.get(__T.idx(112,110)).items[0]&&G.objs.get(__T.idx(112,110)).items[0].c]}")
        rec('상자 연결','가방 재료부터 쓰고 모자란 만큼 상자에서', r==[0,9,0,1], str(r))
        # anyFish from chest
        r=await ev(pg,"()=>{const G=__T.G;G.objs.get(__T.idx(116,110)).items[0]=null;G.objs.get(__T.idx(111,110)).items[1]={id:'stone',c:3};const R=__T.RECIPES.find(r=>r.out==='fishTank');return [R.at,__T.canCraft(R,__T.nearStations())]}")
        rec('상자 연결','물고기(아무 물고기) 재료도 상자에서 찾음', r[1]==True, str(r))
        # far away → nothing
        r=await ev(pg,"()=>{const G=__T.G;G.p.x=118.5;G.p.y=116.5;const n=__T.linkedChests().length;G.p.x=110.5;G.p.y=112.5;return n}")
        rec('상자 연결','작업대에서 멀어지면 연결 안 됨', r==0, r)
        # repair from chest
        r=await ev(pg,"()=>{const G=__T.G;for(let i=0;i<30;i++)G.inv[i]=null;G.inv[0]={id:'pickWood',c:1,dur:10};__T.openPanel('craft',{st:'bench'});return 1}")
        await pg.wait_for_timeout(500); await pg.tap('[data-a=tab][data-i=fix]'); await pg.wait_for_timeout(250)
        await pg.tap('[data-a=fix][data-i="0"]'); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>[__T.G.inv[0].dur,__T.G.objs.get(__T.idx(111,110)).items[0].c]")
        rec('상자 연결','수리 재료도 상자에서', r[0]==200 and r[1]<9, str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3]); await pg.screenshot(path=SP+'qa20.png'); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
