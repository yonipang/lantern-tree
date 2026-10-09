import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
async def main():
    mkpage(SRC,'qa.html')
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx,pg,errs=await new_ctx(b,390,844,True)
        CX,CY=100,100
        async def setup(obj, extra=''):
            await ev(pg,f"()=>{{const G=__T.G;for(let y=108;y<114;y++)for(let x=106;x<114;x++){{const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}}G.objs.set(__T.idx(110,110),{obj});G.enemies.length=0;G.fish=null;{extra}}}")
        for (name,obj,lbl,gone) in [('이끼풀',"{t:'grass'}",'베기',True),('빛버섯',"{t:'glow'}",'줍기',True),('다 자란 작물',"{t:'cropBerry',p:-999}",'수확',True)]:
            for (px,py,fx,fy,desc) in [(110.5,110.5,0,1,'가운데'),(110.2,110.85,1,0,'아래쪽 가장자리'),(110.8,110.15,0,-1,'위쪽 가장자리')]:
                await setup(obj, f"G.p.x={px};G.p.y={py};G.p.face={{x:{fx},y:{fy}}};G.sel=5")
                await pg.wait_for_timeout(120)
                r=await ev(pg,"()=>[__T.decide().lbl, JSON.stringify(__T.decide().t)]")
                await tap(pg,1); await pg.wait_for_timeout(150)
                g=await ev(pg,"()=>!__T.G.objs.get(__T.idx(110,110))")
                rec('밟고 선 채 채집',f'{name} 위({desc})에 서서 {lbl}', r[0]==lbl and r[1]=='{"x":110,"y":110}' and g==gone, f'{r[0]} {r[1]} 사라짐={g}')
        # facing something takes priority over the tile underfoot
        await setup("{t:'grass'}","G.objs.set(__T.idx(111,110),{t:'root'});G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0};G.sel=5")
        await pg.wait_for_timeout(120)
        r=await ev(pg,"()=>JSON.stringify(__T.decide().t)")
        rec('밟고 선 채 채집','앞에 뿌리기둥이 있으면 앞쪽이 우선', r=='{"x":111,"y":110}', r)
        await setup("{t:'grass'}","__T.addItem('berrySeed',3);G.sel=G.inv.findIndex(s=>s&&s.id==='berrySeed');G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0}")
        await pg.wait_for_timeout(120)
        r=await ev(pg,"()=>[__T.decide().k, JSON.stringify(__T.decide().t)]")
        rec('밟고 선 채 채집','씨앗을 들고 앞이 빈 흙이면 심기가 우선', r==['place','{"x":111,"y":110}'], str(r))
        # standing on a rug / torch must NOT trigger pickup of the thing underfoot
        await setup("{t:'rug'}","G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0};G.sel=5")
        await pg.wait_for_timeout(120)
        rec('밟고 선 채 채집','러그 위에 서 있어도 러그를 회수하지 않음', await ev(pg,"()=>__T.decide().k")=='swing', await ev(pg,"()=>__T.decide().k"))
        # visual: player on grass at several sub-positions
        shots=[]
        for k,(px,py) in enumerate([(110.5,110.3),(110.5,110.6),(110.5,110.95),(110.5,111.1)]):
            await setup("{t:'grass'}", f"G.objs.set(__T.idx(110,111),{{t:'grass'}});G.p.x={px};G.p.y={py};G.p.face={{x:0,y:1}}")
            await pg.wait_for_timeout(500); await pg.screenshot(path=SP+f'qa3_g{k}.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:2] if errs else '')
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
