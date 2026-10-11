import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v57: 메뉴 「긴급 탈출」 — 울타리·벽에 갇혔을 때 막힌 곳 바깥의 가장 가까운 트인 곳으로 (등불나무 둘레 큰 마당도)
H2=HOOK.replace("computeLight}","computeLight,regionOf,escapeSpot,emergencyEscape,homePt,boxHits,isSolid}")
FENCE="""window.__fence=(R)=>{const T=__T,G=T.G;const x0=T.CX-R,x1=T.CX+R,y0=T.CY-R,y1=T.CY+R;for(let y=y0-6;y<=y1+6;y++)for(let x=x0-6;x<=x1+6;x++){const i=T.idx(x,y);if(G.objs.get(i)&&G.objs.get(i).t!=='treeP')G.objs.delete(i);G.wall[i]=0;if(G.floor[i]===T.WATER||G.floor[i]===5)G.floor[i]=1}
  for(let x=x0;x<=x1;x++){G.objs.set(T.idx(x,y0),{t:'bFenceWood'});G.objs.set(T.idx(x,y1),{t:'bFenceWood'})}for(let y=y0;y<=y1;y++){G.objs.set(T.idx(x0,y),{t:'bFenceWood'});G.objs.set(T.idx(x1,y),{t:'bFenceWood'})}G.enemies.length=0;return [x0,x1,y0,y1]};"""
async def main():
    for lay in (1,2):
        mkpage(SRC,'qa.html',H2,layout=lay)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const T=__T,G=T.G,h=T.homePt();return [!!T.regionOf(G.p.x,G.p.y),!!T.regionOf(h.x,h.y)]}")
            rec(f'시작 지점 (지도 {lay})','새 게임 시작 자리와 집은 막힌 곳으로 보지 않음', r==[False,False], str(r))
            if lay==2: await ctx.close(); await b.close(); continue
            # not stuck: goes home
            r=await ev(pg,"()=>{const T=__T,G=T.G,h=T.homePt();G.p.x+=6;const ok=T.emergencyEscape();return [ok,Math.round((G.p.x-h.x)*10)/10,Math.round((G.p.y-h.y)*10)/10]}")
            rec('긴급 탈출','갇히지 않았으면 집(등불나무 앞)으로', r==[True,0,0], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;const x=G.p.x;const ok=T.emergencyEscape();return [ok,G.p.x===x]}")
            rec('긴급 탈출','30초에 한 번만', r==[False,True], str(r))
            # a fenced yard bigger than 16 tiles around the lantern tree (the friend's case): home is the trap
            r=await ev(pg,"()=>{"+FENCE+"""const T=__T,G=T.G;G.escCd=0;const [x0,x1,y0,y1]=__fence(22);G.p.x=T.CX+3.5;G.p.y=T.CY+5.6;
              const inside=!!T.regionOf(G.p.x,G.p.y);const ok=T.emergencyEscape();const out=G.p.x<x0||G.p.x>x1+1||G.p.y<y0||G.p.y>y1+1;
              return [inside,ok,out,!T.regionOf(G.p.x,G.p.y),!T.boxHits(G.p.x,G.p.y,.28)]}""")
            rec('긴급 탈출','등불나무 둘레 큰 울타리(반경 22칸) 안에 갇히면 울타리 바깥 트인 곳으로', r==[True,True,True,True,True], str(r))
            # standing outside the fence but home is fenced: escape doesn't send you back in
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.escCd=0;G.p.x=T.CX+40.5;G.p.y=T.CY+.6;for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){const i=T.idx(T.CX+40+x,T.CY+y);G.wall[i]=0;G.objs.delete(i)}
              const ok=T.emergencyEscape();return [ok,!T.regionOf(G.p.x,G.p.y),Math.abs(G.p.x-T.CX)>21||Math.abs(G.p.y-T.CY)>21]}""")
            rec('긴급 탈출','집이 막혀 있으면 집 안이 아니라 그 바깥으로', r==[True,True,True], str(r))
            # a small walled pocket far from home: the nearest open spot, close by
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.escCd=0;const cx=T.CX+30,cy=T.CY-30;for(let y=cy-8;y<=cy+8;y++)for(let x=cx-8;x<=cx+8;x++){const i=T.idx(x,y);G.objs.delete(i);G.wall[i]=(Math.abs(x-cx)<=2&&Math.abs(y-cy)<=2)?0:(Math.abs(x-cx)<=3&&Math.abs(y-cy)<=3?1:0);if(G.floor[i]===T.WATER)G.floor[i]=1}
              G.p.x=cx+.5;G.p.y=cy+.6;const inside=!!T.regionOf(G.p.x,G.p.y);const ok=T.emergencyEscape();return [inside,ok,Math.hypot(G.p.x-cx,G.p.y-cy)<9,!T.regionOf(G.p.x,G.p.y)]}""")
            rec('긴급 탈출','벽으로 막힌 작은 공간에서는 바로 옆 트인 곳으로', r==[True,True,True,True], str(r))
            # the menu button asks once more before moving
            await ev(pg,"()=>{const T=__T,G=T.G;G.escCd=0;G.p.x=T.CX+3.5;G.p.y=T.CY+5.6;T.openPanel('menu')}"); await pg.wait_for_timeout(700)
            b1=await pg.locator("[data-a=escape]").inner_text(); await pg.click('#sheet [data-a=escape]'); await pg.wait_for_timeout(300)
            b2=await pg.locator("[data-a=escape]").inner_text(); await pg.click('#sheet [data-a=escape]'); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const T=__T,G=T.G;return [document.getElementById('sheetWrap').hidden,G.p.x<T.CX-22||G.p.x>T.CX+23||G.p.y<T.CY-22||G.p.y>T.CY+23]}")
            rec('메뉴','메뉴 「긴급 탈출」은 한 번 더 눌러야 옮겨짐', b1=='긴급 탈출' and '한 번 더' in b2 and r==[True,True], f'{b1}|{b2}|{r}')
            await pg.screenshot(path=SP+'qa54.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
