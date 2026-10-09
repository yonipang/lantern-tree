import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
H2=HOOK.replace("computeLight}","computeLight,hitBoss,decide,perform,SL,SI,newGame}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        r=await ev(pg,"""()=>{const T=__T;T.newGame(11);const G=T.G;G.drops.length=0;const b=G.bosses.turtle;b.st='fight';b.hp=1;T.hitBoss(b,5,false);const sh=G.objs.get(T.idx(T.SL.x,T.SL.y));return [G.drops.filter(d=>d.id==='lightSeed').length,sh.has]}""")
        rec('빛씨앗','용암 거북을 잡으면 빛씨앗이 바로 떨어짐 (제단은 비워짐)', r==[1,0], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;const b=G.bosses.spirit;b.st='fight';b.hp=1;T.hitBoss(b,5,false);return G.drops.filter(d=>d.id==='lightSeed').length}""")
        rec('빛씨앗','서리 정령도 빛씨앗을 떨어뜨림', r==1, r)
        # an old save whose altar room was never built (area explored before the update), turtle alive
        r=await ev(pg,"""()=>{const T=__T;T.newGame(12);const G=T.G;const S=T.SL;for(let y=S.y-10;y<=S.y+10;y++)for(let x=S.x-10;x<=S.x+10;x++){const j=T.idx(x,y);G.objs.delete(j);G.wall[j]=3;G.biome[j]=2}
          const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G;const sh=G2.objs.get(T.idx(S.x,S.y));return [sh&&sh.t,sh&&sh.has,G2.wall[T.idx(S.x,S.y+2)]]}""")
        rec('빛씨앗','예전 세이브에 보스방·제단이 없으면 불러올 때 만들어 줌', r==['shrine',1,0], str(r))
        # turtle already beaten in an old save without an altar: seed handed over once
        r=await ev(pg,"""()=>{const T=__T;T.newGame(13);const G=T.G;const S=T.SL;G.objs.delete(T.idx(S.x,S.y));G.bossDead.turtle=true;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;
          let s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const a=T.countItem('lightSeed');s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);return [a,T.countItem('lightSeed')]}""")
        rec('빛씨앗','이미 잡았는데 제단이 없던 세이브는 빛씨앗을 한 번만 받음', r==[1,1], str(r))
        # beaten turtle, altar still holding the seed (v26 behaviour) stays takeable
        r=await ev(pg,"""()=>{const T=__T;T.newGame(14);const G=T.G;const S=T.SL;G.bossDead.turtle=true;let s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G;G2.p.x=S.x+.5;G2.p.y=S.y+1.6;G2.p.face={x:0,y:-1};return [T.decide().k,T.countItem('lightSeed')]}""")
        rec('빛씨앗','v26에서 잡고 제단에 씨앗이 남아 있으면 그대로 꺼낼 수 있음', r==['take',0], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
