import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v47: 600x600 고리 지도 (새 게임), 옛 세이브는 200x200 그대로, 지형 재료 2배
H2=HOOK.replace("computeLight}","computeLight,newGame,GUIDE,QSIDE,RECIPES,rebuildMap,genFlowerZones,get L(){return {LAY,W,H,CX,CY,BX,BY,SA,SB,SL,SI}}}")
async def main():
    mkpage(SRC,'qa.html',H2,layout=2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        r=await ev(pg,"()=>{const L=__T.L;return [L.LAY,L.W,L.H,L.CX,L.CY,__T.G.wall.length]}")
        rec('지도','새 게임은 가로세로 3배 (600×600)', r==[2,600,600,300,300,360000], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G,L=T.L;const at=(deg,rr)=>{const x=Math.round(L.CX+Math.cos(deg*Math.PI/180)*rr),y=Math.round(L.CY+Math.sin(deg*Math.PI/180)*rr);return T.idx(x,y)};
          const bAt=(deg,rr)=>{const c={};for(let k=-6;k<=6;k++){const b=G.biome[at(deg+k*2,rr)];c[b]=(c[b]||0)+1}return +Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0]};
          return [G.biome[T.idx(L.CX,L.CY)],bAt(-90,70),bAt(90,70),bAt(-90,175),bAt(30,175),bAt(150,175),[0,60,120,200,300].map(d=>G.floor[at(d,262)]===T.WATER||G.wall[at(d,262)]===2).filter(Boolean).length,[0,90,180,270].every(d=>G.wall[at(d,285)]===8)]}""")
        rec('배치','가운데 시작 · 북쪽 이끼 동굴 / 남쪽 버섯숲 · 북쪽 수정 / 남동 용암 / 남서 얼음 · 바다 고리 · 끝은 암반', r==[0,0,1,2,3,4,5,True], str(r))
        r=await ev(pg,"""()=>{const G=__T.G,c={};let n=0;for(let i=0;i<G.wall.length;i++){const w=G.wall[i];if(!w||w===8)continue;n++;c[w]=(c[w]||0)+1}const ds=((c[1]||0)+(c[2]||0))/n;const open=(()=>{let o=0,t=0;for(let i=0;i<G.wall.length;i++){if(G.wall[i]===8)continue;t++;if(!G.wall[i])o++}return o/t})();return [+ds.toFixed(2),+open.toFixed(2),c[3]>0&&c[9]>0&&c[11]>0&&c[4]>0&&c[5]>0&&c[10]>0&&c[12]>0&&c[13]>0]}""")
        rec('지형','흙벽·돌벽이 벽의 절반 넘게, 지역마다 고유 벽과 광맥도 있음', r[0]>=0.5 and r[2], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G,L=T.L;const out={};for(const [k,s] of [['slime',{x:L.BX,y:L.BY}],['queen',L.SA],['golem',L.SB],['turtle',L.SL],['spirit',L.SI]]){let w=0;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++)if(Math.hypot(dx,dy)<5&&G.wall[T.idx(s.x+dx,s.y+dy)])w++;out[k]=[w,G.biome[T.idx(s.x,s.y)]]}
          return [out,['queen','golem','turtle','spirit'].map(k=>{const h=T.BOSSES[k].home();return Math.round(Math.hypot(h.x-L.CX,h.y-L.CY))}),G.rooms.length]}""")
        rec('보스','보스방 5곳이 맞는 지역에 열려 있고 거리가 알맞음, 숨은 방 8개', all(v[0]==0 for v in r[0].values()) and [r[0][k][1] for k in ['slime','queen','golem','turtle','spirit']]==[0,1,2,3,4] and all(60<=d<=180 for d in r[1]) and r[2]==8, str(r))
        r=await ev(pg,"()=>{const z=__T.G.fzones;return [z.length,new Set(z.map(q=>q.c)).size]}")
        rec('지도','꽃망울 구역도 생김', r[0]>=8 and r[1]==5, str(r))
        r=await ev(pg,"()=>{const T=__T;const g=T.GUIDE.map(q=>typeof q.t==='function'?q.t():q.t).join('|')+T.GUIDE.map(q=>typeof q.h==='function'?q.h():q.h).join('|');return [g.includes('남서쪽 버섯숲'),g.includes('북동쪽 이끼 동굴의 말랑대왕'),g.includes('북쪽 수정동굴'),g.includes('남동쪽 용암 동굴'),g.includes('남서쪽 얼음 동굴'),g.includes('서쪽 버섯숲의')&&!g.includes('남서쪽 버섯숲의')]}")
        rec('퀘스트','퀘스트 방향이 새 지도에 맞게 (남서쪽 버섯숲, 북동쪽 말랑대왕 …)', r==[True,True,True,True,True,False], str(r))
        r=await ev(pg,"""()=>{const T=__T;const t0=performance.now();T.newGame(4242);const t1=performance.now();const s=JSON.stringify(T.serialize());const sv=JSON.parse(s);T.deserialize(sv);const t2=performance.now();return [Math.round(t1-t0),Math.round(t2-t1),s.length,sv.mapV,T.L.W,T.G.wall.length]}""")
        rec('성능','새 세계 만들기 2초 안, 불러오기 2초 안, 세이브 900KB 아래', r[0]<2000 and r[1]<2000 and r[2]<900000 and r[3:]==[2,600,360000], str(r))
        # old saves keep their 200x200 map
        r=await ev(pg,"""()=>{const T=__T;localStorage.setItem('lantern-tree-layout','1');T.newGame(77);const old=JSON.parse(JSON.stringify(T.serialize()));delete old.mapV;localStorage.setItem('lantern-tree-layout','2');T.deserialize(old);const a=[T.L.LAY,T.L.W,T.G.wall.length,T.L.CX];
          const g=T.GUIDE.map(q=>typeof q.t==='function'?q.t():q.t).join('|');const b2=JSON.parse(JSON.stringify(T.serialize())).mapV;T.newGame(5);return a.concat([g.includes('서쪽 버섯숲'),!g.includes('남서쪽'),b2,T.L.W])}""")
        rec('옛 세이브','v47 전 세이브는 200×200 지도 그대로 (퀘스트 방향도 예전대로), 새 게임은 다시 600×600', r==[1,200,40000,100,True,True,1,600], str(r))
        r=await ev(pg,"()=>{const T=__T,f=id=>{const r=T.RECIPES.find(q=>q.out===id);return JSON.stringify(r.req)};return [f('furnace'),f('quarry'),f('generator'),f('pot')]}")
        rec('재료','지형 재료(흙·돌·화강암·현무암·얼음) 필요 개수 2배', r==['[["dirt",20],["wood",4],["resin",1]]','[["stone",40],["wood",8],["rope",2]]','[["ironBar",6],["stone",32],["copperBar",4]]','[["copperBar",3],["stone",8],["wood",2]]'], str(r))
        # the whole map, all explored
        await ev(pg,"()=>{const T=__T,G=T.G;G.explored.fill(1);T.rebuildMap();T.openPanel('map')}"); await pg.wait_for_timeout(600)
        await pg.click('#sheet [data-a=mapzoom]'); await pg.wait_for_timeout(600)
        await pg.screenshot(path=SP+'qa49_map.png')
        await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa49_home.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
