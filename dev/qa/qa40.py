import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 자동화·마무리 (v40): 스프링클러, 자동 수확기, 거대 작물, 등불 축제 케이크
H2=HOOK.replace("computeLight}","computeLight,RECIPES,recipeOn,circuitTick,growTick,cropStage,knows,learnRecipe,syncNotes,eat,QSIDE,questState,SPR,targetTile,cam}")
SET="""window.__area=(x0,y0,w,h,f)=>{const T=__T,G=T.G;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=f==null?2:f;G.objs.delete(i);G.wire.delete(i)}};
window.__crop=(x,y,t,age,fl)=>{const T=__T,G=T.G;const i=T.idx(x,y);G.wall[i]=0;if(fl!=null)G.floor[i]=fl;const o={t:t||'cropBerry',p:G.time-(age||0),p0:G.time-(age||0)};G.objs.set(i,o);return o};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+SET+"__T.G.enemies.length=0}")
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=T.RECIPES.find(r=>r.out==='sprinkler'),h=T.RECIPES.find(r=>r.out==='harvester');const a=[T.recipeOn(s),T.recipeOn(h)];G.stats.made=G.stats.made||{};G.stats.made.crystalGen=1;return [a,T.recipeOn(s),T.recipeOn(h),s.at,JSON.stringify(s.req),JSON.stringify(h.req)]}""")
        rec('자동화','수정 발전기를 만든 뒤 구리 제작대에 스프링클러·자동 수확기', r[0]==[False,False] and r[1] and r[2] and r[3]=='forge', str(r))
        rec('자동화','재료: 스프링클러 철괴4·구리괴2·물 한 동이2 / 수확기 철괴6·수정 조각4·전선4', r[4]=='[["ironBar",4],["copperBar",2],["gWater",2]]' and r[5]=='[["ironBar",6],["crystal",4],["wire",4]]', str(r))
        # sprinkler
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+20,y=__T.CY+20;__area(x-4,y-4,12,10);G.objs.set(T.idx(x,y),{t:'crystalGen'});G.wire.set(T.idx(x+1,y),1);G.objs.set(T.idx(x+2,y),{t:'sprinkler'});
          const a=__crop(x+2,y+2,'cropBerry',10),b2=__crop(x+4,y-2,'cropBerry',10),far=__crop(x+5,y+3,'cropBerry',10),ripe=__crop(x+1,y+1,'cropBerry',500);for(let k=0;k<15;k++)T.circuitTick(.2);return [!!G.objs.get(T.idx(x+2,y)).work,a.w,b2.w,far.w,ripe.w]}""")
        rec('스프링클러','전기가 들어오면 둘레 5×5의 자라는 작물에 물 (밖이나 다 자란 작물은 그대로)', r==[True,1,1,None,None], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+20,y=__T.CY+20;G.wire.delete(T.idx(x+1,y));const c=__crop(x+3,y+1,'cropBerry',10);for(let k=0;k<15;k++)T.circuitTick(.2);return [!!G.objs.get(T.idx(x+2,y)).work,c.w]}""")
        rec('스프링클러','전기가 끊기면 멈춤', r==[False,None], str(r))
        # harvester
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const x=__T.CX+20,y=__T.CY+32;__area(x-3,y-3,10,8);G.objs.set(T.idx(x,y),{t:'crystalGen'});G.wire.set(T.idx(x+1,y),1);const hi=T.idx(x+2,y);G.objs.set(hi,{t:'harvester'});G.objs.set(T.idx(x+3,y),{t:'chest',items:Array(18).fill(null)});
          for(const [dx,dy] of [[-1,-1],[0,-1],[1,1]])__crop(x+2+dx,y+dy,'cropBerry',500);const young=__crop(x+1,y+1,'cropBerry',10);const far=__crop(x+5,y+2,'cropBerry',500);T.addItem('sickle',1);
          for(let k=0;k<20;k++)T.circuitTick(.2);Math.random=mr;const ch=G.objs.get(T.idx(x+3,y)).items.filter(Boolean).map(s=>s.id+':'+s.c).join(',');return [ch,!!G.objs.get(T.idx(x+1,y-1)),!!G.objs.get(T.idx(x+1,y+1)),!!G.objs.get(T.idx(x+5,y+2)),G.stats.autoH]}""")
        rec('자동 수확기','둘레 3×3의 다 자란 작물만 거둬서 옆 상자로 (구리 낫 보너스 없음)', r[0]=='berry:6,berrySeed:3' and r[1] is False and r[2] is True and r[3] is True and r[4]==3, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const x=__T.CX+20,y=__T.CY+32;G.objs.delete(T.idx(x+3,y));__crop(x+2,y+1,'cropBerry',500);for(let k=0;k<20;k++)T.circuitTick(.2);Math.random=mr;const h=G.objs.get(T.idx(x+2,y));const st=(h.store||[]).map(s=>s.id+':'+s.c).join(',');
          G.p.x=x+2.5;G.p.y=y+1.5;G.p.face={x:0,y:-1};const a=T.decide();T.perform?0:0;return [st,a.k,a.lbl]}""")
        rec('자동 수확기','상자가 없으면 안에 모아 두고, 바라보면 "꺼내기"', r[0]=='berry:2,berrySeed:1' and r[2]=='꺼내기', str(r))
        # giant crops
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;let n=0;Math.random=()=>(n++===1?0:.5);G.bossDead.golem=true;const x=__T.CX+30,y=__T.CY+20;__area(x-2,y-2,8,8,1);for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])__crop(x+dx,y+dy,'cropBerry',500,1);
          T.growTick(2);Math.random=mr;const g=G.objs.get(T.idx(x,y));const parts=[[1,0],[0,1],[1,1]].map(([dx,dy])=>G.objs.get(T.idx(x+dx,y+dy))).map(o=>o&&o.t);G.p.x=x+1;G.p.y=y+2.6;G.p.face={x:0,y:-1};const tt=T.targetTile();const a=T.decide();return [g&&g.t,g&&g.c,parts,a.k,a.lbl,G.stats.giants]}""")
        rec('거대 작물','같은 작물 2×2가 맞는 흙에서 다 자라면 (3%) 하나로 합쳐짐', r[0]=='giantCrop' and r[1]=='cropBerry' and r[2]==['_part','_part','_part'], str(r))
        rec('거대 작물','바라보면 "거대 수확!"', r[3]=='giant' and r[4]=='거대 수확!', str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+30,y=__T.CY+20;G.p.x=x+1;G.p.y=y+2.6;G.p.face={x:0,y:-1};const a=T.decide();return [a.t.x===x&&a.t.y===y]}""")
        rec('거대 작물','앞에 있는 거대 작물은 본체(왼쪽 위 칸)로 다룸', r==[True], str(r))
        await ev(pg,"""()=>{const T=__T,G=T.G;T.cam.x=__T.CX+31;T.cam.y=__T.CY+21;G.p.x=__T.CX+31;G.p.y=__T.CY+22.6;G.enemies.length=0}""")
        await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa40_giant.png')
        await ev(pg,"""()=>{const G=__T.G;G.drops.length=0;window.__mr=Math.random;Math.random=()=>0;G.p.face={x:0,y:-1}}""")
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(400)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;Math.random=window.__mr;const x=__T.CX+30,y=__T.CY+20;const got={};for(const d of G.drops)got[d.id]=(got[d.id]||0)+d.c;return [!!G.objs.get(T.idx(x,y)),!!G.objs.get(T.idx(x+1,y+1)),got,G.stats.giantH]}""")
        rec('거대 작물','거두면 수확량 6배 (베리 12~18)·씨앗 3개, 네 칸 모두 비워짐', r[0] is False and r[1] is False and 12<=r[2].get('berry',0)<=18 and r[2].get('berrySeed',0)==3 and r[3]==1, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const x=__T.CX+36,y=__T.CY+20;__area(x-1,y-1,5,5,2);for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])__crop(x+dx,y+dy,'cropBerry',500,2);T.growTick(2);Math.random=mr;return G.objs.get(T.idx(x,y)).t}""")
        rec('거대 작물','맞지 않는 흙에서는 생기지 않음', r=='cropBerry', r)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+40,y=__T.CY+20;__area(x-1,y-1,5,5,1);for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])__crop(x+dx,y+dy,'cropBerry',500,1);const mr=Math.random;Math.random=()=>0.5;T.growTick(2);Math.random=()=>0;T.growTick(2);Math.random=mr;return G.objs.get(T.idx(x,y)).t}""")
        rec('거대 작물','한 번 실패한 2×2는 다시 굴리지 않음', r=='cropBerry', r)
        # cake
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const a=T.knows('festCake');G.won2=true;T.syncNotes();const b2=T.knows('festCake');const rc=T.RECIPES.find(r=>r.out==='festCake');G.inv[0]={id:'festCake',c:2};G.sel=0;G.p.hunger=0;T.eat(0);return [a,b2,rc.at,JSON.stringify(rc.req),Math.round(G.p.hunger),G.inv[0].c]}""")
        rec('케이크','진 엔딩(다섯 등불)에 레시피 해금, 베리5·꽃잎 다섯 색·빛버섯2', r[0] is False and r[1] is True and r[2]=='pot' and r[3]=='[["berry",5],["petalR",1],["petalB",1],["petalY",1],["petalW",1],["petalK",1],["glowcap",2]]', str(r))
        rec('케이크','먹으면 배 100', r[4]==100 and r[5]==1, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;__area(x-2,y-2,6,6);G.objs.set(T.idx(x,y),{t:'table'});G.p.x=x+.5;G.p.y=y+1.6;G.p.face={x:0,y:-1};G.sel=0;const a=T.decide();return [a.k,a.lbl]}""")
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(300)
        r2=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;const o=G.objs.get(T.idx(x,y));return [o.cake,G.inv[0],T.decide().lbl]}""")
        rec('케이크','탁자 앞에서 들고 누르면 탁자 위에 올려 장식', r==['cakeOn','올리기'] and r2[0]==1 and r2[1] is None and r2[2]=='가져오기', f'{r} {r2}')
        await ev(pg,"""()=>{const T=__T,G=T.G;T.cam.x=G.p.x;T.cam.y=G.p.y;G.enemies.length=0}"""); await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa40_cake.png')
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const G2=T.G;const x=__T.CX+44,y=__T.CY+20;return [G2.objs.get(T.idx(x,y)).cake,T.knows('festCake')]}""")
        rec('세이브','탁자 위 케이크와 케이크 레시피가 그대로', r==[1,True], str(r))
        await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;G.p.x=x+.5;G.p.y=y+1.6;G.p.face={x:0,y:-1};G.inv[0]=null}"""); await pg.wait_for_timeout(100)
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(300)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;G.p.x=x+.5;G.p.y=y+1.6;G.p.face={x:0,y:-1};const a=T.decide();return a}""")
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;return [G.objs.get(T.idx(x,y)).cake,G.inv.some(s=>s&&s.id==='festCake')]}""")
        rec('케이크','"가져오기"로 다시 가방에', r[0] is None and r[1] is True, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const q=id=>T.QSIDE.find(x=>x.id===id);G.stats.autoH=20;G.stats.giantH=1;return [T.questState(q('s_auto')).done,T.questState(q('s_giant')).done]}""")
        rec('도전','자동 수확기로 20개 · 거대 작물 거두기 퀘스트', r==[True,True], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
