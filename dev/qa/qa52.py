import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v49.1 버그 수정: 고리 지도에서 말랑대왕 방(과 그 방에서 시작하는 수정골렘 길)이 바위 고리에 막히던 문제 / 귀환석으로 표지에 돌아갈 때 막힌 굴이면 엉뚱한 곳으로 옮겨지던 문제
H2=HOOK.replace("computeLight}","computeLight,newGame,get L(){return {LAY,W,H,CX,CY}},BKEYS,LAVA,WALLS,startRecall,recallTick,homePt}")
async def main():
    mkpage(SRC,'qa.html',H2,layout=2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        res=[]
        for seed in [11,222,3333,44444,555555,7,1234]:
            r=await ev(pg,"""(seed)=>{const T=__T;T.newGame(seed);const G=T.G,L=T.L,W=L.W;
              const flood=block=>{const seen=new Uint8Array(W*L.H);const st=[[L.CX,L.CY+1]];seen[T.idx(L.CX,L.CY+1)]=1;
                while(st.length){const [x,y]=st.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=L.H)continue;const j=T.idx(nx,ny);if(seen[j]||block(j))continue;seen[j]=1;st.push([nx,ny])}}return seen};
              const wet=j=>G.floor[j]===T.WATER||G.floor[j]===T.LAVA;
              const open=flood(j=>G.wall[j]||wet(j)), dig=flood(j=>(G.wall[j]&&T.WALLS[G.wall[j]].tier>=3)||wet(j)), deep=flood(j=>G.wall[j]===8||wet(j));
              const near=(s,x,y)=>{for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(s[T.idx(Math.round(x)+dx,Math.round(y)+dy)])return 1;return 0};
              const o={};for(const k of T.BKEYS){const h=T.BOSSES[k].home();o[k]=''+near(open,h.x,h.y)+near(dig,h.x,h.y)+near(deep,h.x,h.y)}return o}""",seed)
            res.append(r)
        ok1=all(r['slime']=='111' and r['queen']=='111' and r['golem']=='111' for r in res)
        rec('고리 지도','말랑대왕·버섯 여왕·수정골렘 방까지 걸어서 열린 길이 있음 (여러 세계)', ok1, str(res))
        ok2=all(r['turtle']=='001' and r['spirit']=='001' for r in res)
        rec('고리 지도','용암·얼음 보스방은 수정 곡괭이로 깨는 바위 고리 너머 (암반·물·용암에 막히지는 않음)', ok2, str([(r['turtle'],r['spirit']) for r in res]))
        r=await ev(pg,"""()=>{const T=__T,G=T.G,L=T.L;const ox=L.CX+40,oy=L.CY+40;for(let y=oy-8;y<=oy+8;y++)for(let x=ox-8;x<=ox+8;x++){const i=T.idx(x,y);G.wall[i]=1;G.objs.delete(i)}
          for(let y=oy-1;y<=oy+1;y++)for(let x=ox-1;x<=ox+1;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2}
          G.enemies.length=0;G.recall=null;G.recallCd=0;G.spawnPt=null;const h=T.homePt();G.p.x=h.x;G.p.y=h.y;G.p.dead=0;G.p.hurt=0;G.backPt={x:ox+.5,y:oy+.5};T.startRecall('back');for(let k=0;k<4;k++)T.recallTick(.5);
          return [+(G.p.x-ox-.5).toFixed(2),+(G.p.y-oy-.5).toFixed(2),G.backPt]}""")
        rec('귀환석','표지가 막힌 굴(파서 들어간 곳) 안이어도 표지 자리로 정확히 돌아감', r==[0,0,None], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
