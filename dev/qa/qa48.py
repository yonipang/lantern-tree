import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 버그 수정: 등불나무·침대 둘레를 울타리로 막아 두면 기절·귀환 뒤 갇히던 문제
H2=HOOK.replace("computeLight}","computeLight,respawn,closedIn,boxHits}")
FENCE="""window.__fence=(door)=>{const T=__T,G=T.G;const x0=T.CX-5,x1=T.CX+5,y0=T.CY-3,y1=T.CY+6;for(let y=T.CY-10;y<=T.CY+24;y++)for(let x=T.CX-24;x<=T.CX+24;x++){const i=T.idx(x,y);if(G.objs.get(i)&&G.objs.get(i).t!=='treeP')G.objs.delete(i);G.wall[i]=0;if(G.floor[i]===T.WATER)G.floor[i]=1}
  for(let x=x0;x<=x1;x++){G.objs.set(T.idx(x,y0),{t:'bFenceWood'});G.objs.set(T.idx(x,y1),{t:'bFenceWood'})}for(let y=y0;y<=y1;y++){G.objs.set(T.idx(x0,y),{t:'bFenceWood'});G.objs.set(T.idx(x1,y),{t:'bFenceWood'})}
  for(let y=T.CY+2;y<=T.CY+5;y++)for(let x=x0+1;x<x1;x++)G.objs.set(T.idx(x,y),{t:'cushion'});if(door)G.objs.set(T.idx(T.CX,y1),{t:'bDoorWood'});return [x0,x1,y0,y1]};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+FENCE+"}")
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,x1,y0,y1]=__fence(false);G.spawnPt=null;G.p.dead=1;T.respawn();const p=G.p;const out=p.x<x0||p.x>x1+1||p.y<y0||p.y>y1+1;return [out,T.boxHits(p.x,p.y,.28),!T.closedIn(p.x,p.y),Math.round(Math.hypot(p.x-T.CX,p.y-T.CY))]}""")
        rec('갇힘','울타리로 막힌 등불나무 앞에서 깨어나면 바로 바깥 빈 곳으로', r[0] and r[1] is False and r[2] and r[3]<=12, str(r))
        await pg.wait_for_timeout(1100)
        r=await ev(pg,"()=>document.querySelector('#toasts').innerText.includes('바로 바깥에서 깨어났어요')")
        rec('갇힘','바깥에서 깨어났다는 알림', r, r)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__fence(true);G.p.dead=1;T.respawn();return [Math.abs(G.p.x-(T.CX+.5))<.01,Math.abs(G.p.y-(T.CY+1.7))<.01]}""")
        rec('갇힘','문이 달린 울타리 안은 그대로 등불나무 앞에서 깨어남', r==[True,True], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,x1,y0,y1]=__fence(false);G.p.x=T.CX+.5;G.p.y=T.CY+1.7;const c0=T.closedIn(G.p.x,G.p.y);const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const p=T.G.p;return [p.x<x0||p.x>x1+1||p.y<y0||p.y>y1+1,c0&&c0.size,p.x,p.y,s.p.x,s.p.y]}""")
        rec('갇힘','이미 갇힌 채 저장된 세이브도 불러오면 바깥으로', r[0]==True, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let y=T.CY-8;y<=T.CY+8;y++)for(let x=T.CX-8;x<=T.CX+8;x++){const o=G.objs.get(T.idx(x,y));if(o&&/^bFence|^bDoor|^cushion/.test(o.t))G.objs.delete(T.idx(x,y))}G.p.x=T.CX+.5;G.p.y=T.CY+1.7;G.p.dead=1;T.respawn();return [Math.abs(G.p.x-(T.CX+.5))<.01,Math.abs(G.p.y-(T.CY+1.7))<.01]}""")
        rec('갇힘','막혀 있지 않으면 원래대로 등불나무 앞', r==[True,True], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
