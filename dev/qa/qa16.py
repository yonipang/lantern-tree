import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa4.py')).read().split('async def main():')[0]) if False else None
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
H2=HOOK.replace("computeLight}","computeLight,TPv:()=>TP,VIEW:()=>VIEW,DPR:()=>DPR,mouse:()=>mouse,aim:()=>aimMouse(),cam:()=>cam,mw:()=>mouseWorld()}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,1280,800,False)
        await ev(pg,"()=>{const G=__T.G;for(let y=104;y<116;y++)for(let x=104;x<118;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.wall[__T.idx(109,110)]=1;G.enemies.length=0;G.enemies.push({k:'slimeG',x:111.3,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});G.p.x=110.5;G.p.y=110.5;__T.cam().x=110.5;__T.cam().y=110.5}")
        await pg.wait_for_timeout(1500)
        async def screen(wx,wy): return await ev(pg,f"()=>{{const V=__T.VIEW(),T=__T.TPv(),D=__T.DPR();return [({wx}*T-V.camX)/D,({wy}*T-V.camY)/D]}}")
        x,y=await screen(109.5,110.5); await pg.mouse.move(x,y); await pg.wait_for_timeout(200)
        await ev(pg,"()=>{__T.G.enemies.length=0;__T.G.enemies.push({k:'slimeG',x:111.3,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});__T.G.p.x=110.5;__T.G.p.y=110.5}")
        print('dbg', await ev(pg,"()=>[__T.aim(), JSON.stringify(__T.mw()),JSON.stringify(__T.cam()), __T.G.enemies.length]"))
        r=await ev(pg,"()=>__T.decide().k")
        rec('클릭 방향','적이 오른쪽에 있어도 왼쪽 벽을 클릭하면 캐기', r=='mine', r)
        async def point(wx,wy): return await ev(pg,f"()=>{{const V=__T.VIEW(),T=__T.TPv(),D=__T.DPR(),M=__T.mouse();M.x=({wx}*T-V.camX)/D;M.y=({wy}*T-V.camY)/D;M.last=performance.now();return __T.decide().k}}")
        en="()=>{__T.G.enemies.length=0;__T.G.enemies.push({k:'slimeG',x:111.3,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});__T.G.p.x=110.5;__T.G.p.y=110.5}"
        await ev(pg,en); r=await point(111.3,110.5)
        rec('클릭 방향','적 쪽을 가리키면 공격', r=='attack', r)
        await ev(pg,en); r=await point(109.5,110.5)
        rec('클릭 방향','적이 오른쪽에 있어도 벽 쪽(왼쪽)을 가리키면 캐기 (재확인)', r=='mine', r)
        # swing with nothing nearby: face follows the click
        await ev(pg,"()=>{__T.G.inv[__T.G.sel]=null;__T.G.enemies.length=0;__T.G.p.face={x:-1,y:0};__T.G.p.dir='side'}")
        x,y=await screen(112.5,110.5); await pg.mouse.move(x,y); await pg.mouse.down(); await pg.wait_for_timeout(120); await pg.mouse.up(); await pg.wait_for_timeout(100)
        r=await ev(pg,"()=>[__T.G.p.face.x>0.8, __T.G.p.dir]")
        rec('클릭 방향','휘두르기가 클릭한 쪽(오른쪽)을 향함', r==[True,'side'], str(r))
        await ev(pg,en); await ev(pg,"()=>{__T.G.p.face={x:0,y:1};__T.G.p.dir='down'}")
        x,y=await screen(111.3,110.3); await pg.mouse.move(x,y); await pg.mouse.down(); await pg.wait_for_timeout(120); await pg.mouse.up(); await pg.wait_for_timeout(100)
        r=await ev(pg,"()=>[__T.G.p.face.x>0.5, __T.G.p.dir]")
        rec('클릭 방향','공격 동작이 클릭한 쪽(오른쪽)을 향함', r==[True,'side'], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3]); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
