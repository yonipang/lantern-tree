import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 이동·패널티 (v38): 귀환석(집으로 → 표지로 돌아가기), 쓰러지면 재료 일부를 꾸러미로 떨어뜨림
H2=HOOK.replace("computeLight}","computeLight,RECIPES,GUIDE,startRecall,recallTick,homePt,respawn,pickLost,targetTile,cam}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{__T.G.enemies.length=0}")
        r=await ev(pg,"()=>{const T=__T;const rc=T.RECIPES.find(r=>r.out==='homeStone');const g=T.GUIDE.find(q=>q.id==='cpick');return [rc.at,JSON.stringify(rc.req),g.rw.some(([id])=>id==='homeStone'),T.ITEMS.homeStone.stack]}")
        rec('귀환석','구리 제작대에서 만들고, 「수정 곡괭이」 퀘스트 보상으로도 하나', r==['forge','[["crystal",6],["glowcap",3],["copperBar",2]]',True,1], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.spawnPt=null;G.backPt=null;G.recallCd=0;G.recall=null;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;G.inv[0]={id:'homeStone',c:1};G.sel=0;
          const far={x:__T.SB.x+.5,y:__T.SB.y+2.5};G.p.x=far.x;G.p.y=far.y;const a=T.decide();T.startRecall(a.mode);T.recallTick(.5);const mid=[!!G.recall,Math.round(G.p.x)];T.recallTick(.6);T.recallTick(.6);const h=T.homePt();
          return [a.k,a.lbl,mid,+(G.p.x-h.x).toFixed(2),+(G.p.y-h.y).toFixed(2),G.backPt&&Math.round(G.backPt.x)===Math.round(far.x),T.decide().k,T.decide().lbl]}""")
        rec('귀환석','멀리서 쓰면 "집으로" → 1.5초 가만히 있으면 등불나무 곁으로', r[0]=='recall' and r[1]=='집으로' and r[2][0] is True and r[3]==0 and r[4]==0, str(r))
        rec('귀환석','떠난 자리에 표지가 남고, 1분 동안 쉼', r[5] is True and r[6]=='info' and r[7].startswith('쉬는 중'), str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.time+=61;const a=T.decide();T.startRecall(a.mode);for(let k=0;k<4;k++)T.recallTick(.5);return [a.lbl,Math.floor(G.p.x)===__T.SB.x,Math.floor(G.p.y)===__T.SB.y+2,G.backPt]}""")
        rec('귀환석','집 근처에서 다시 쓰면 "표지로 돌아가기" → 떠난 자리로 (표지는 사라짐)', r[0]=='표지로 돌아가기' and r[1] is True and r[2] is True and r[3] is None, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.time+=61;const a=T.decide();T.startRecall(a.mode);T.recallTick(.3);G.p.x+=1;T.recallTick(.3);const c=[G.recall,document.body.innerText.includes('귀환을 멈췄어요')];G.p.x=__T.CX+.5;G.p.y=__T.CY+2;G.backPt=null;G.recallCd=0;const n=T.decide();return [c,n.k,n.lbl]}""")
        rec('귀환석','움직이면 멈춤', r[0][0] is None and r[0][1] is True, str(r))
        rec('귀환석','집 근처인데 표지가 없으면 안내만', r[1]=='info' and r[2]=='집 근처', str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+6,y=__T.CY+6;for(let yy=y-1;yy<=y+2;yy++)for(let xx=x-1;xx<=x+2;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}G.objs.set(T.idx(x,y),{t:'bed'});G.spawnPt={x,y};const h=T.homePt();G.spawnPt=null;G.objs.delete(T.idx(x,y));return [Math.floor(h.x)===x||Math.floor(h.x)===x+1,Math.abs(h.y-y)<3]}""")
        rec('귀환석','침대가 있으면 침대로', r==[True,True], str(r))
        # faint drop
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=6;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;G.inv[0]={id:'pickCopper',c:1};G.inv[1]={id:'berry',c:8};G.inv[12]={id:'wood',c:40};G.inv[13]={id:'stone',c:9};G.inv[14]={id:'gel',c:3};G.inv[15]={id:'lightSeed',c:1};
          const dx=__T.CX+10,dy=__T.CY;for(let yy=dy-2;yy<=dy+2;yy++)for(let xx=dx-2;xx<=dx+2;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i);G.floor[i]=2}G.p.x=dx+.5;G.p.y=dy+.5;G.p.dead=0.01;T.respawn();
          let bag=null,at=-1;for(const [i,o] of G.objs)if(o.t==='lostBag'){bag=o;at=i}const inv=G.inv.filter(Boolean).map(s=>s.id+':'+s.c).join(',');window.__bag=at;return [bag&&bag.items.map(s=>s.id+':'+s.c).join(','),at>=0&&Math.hypot(at%200-dx,((at/200)|0)-dy)<=2,inv]}""")
        rec('쓰러짐','재료는 4분의 1을 쓰러진 자리 꾸러미로 (도구·음식·빛씨앗은 그대로)', r[0]=='wood:10,stone:2' and r[1] is True and r[2]=='pickCopper:1,berry:8,wood:30,stone:7,gel:3,lightSeed:1', str(r))
        await pg.wait_for_timeout(1500)
        r=await ev(pg,"()=>document.body.innerText.includes('재료 12개를 떨어뜨렸어요')")
        rec('쓰러짐','깨어나면 떨어뜨린 개수와 지도 안내', r is True, r)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const at=window.__bag;const x=at%200,y=(at/200)|0;G.p.x=x+.5;G.p.y=y-0.5;G.p.face={x:0,y:1};const a=T.decide();T.pickLost({x,y},G.objs.get(at));return [a.k,a.lbl,!!G.objs.get(at),G.inv.filter(Boolean).find(s=>s.id==='wood').c]}""")
        rec('쓰러짐','꾸러미를 바라보고 누르면 모두 되찾음', r[0]=='lost' and r[1]=='되찾기' and r[2] is False and r[3]==40, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=3;G.inv[12]={id:'wood',c:40};const n0=[...G.objs.values()].filter(o=>o.t==='lostBag').length;G.p.x=__T.CX+10.5;G.p.y=__T.CY+.5;G.p.dead=.01;T.respawn();const n1=[...G.objs.values()].filter(o=>o.t==='lostBag').length;return [n0,n1,G.inv[12].c]}""")
        rec('쓰러짐','이야기 초반(구리 곡괭이 전)에는 잃지 않음', r==[0,0,40], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=6;for(let k=0;k<7;k++){for(let j=0;j<G.inv.length;j++)G.inv[j]=null;G.inv[12]={id:'wood',c:40};G.p.x=__T.CX+12.5+k*2;G.p.y=__T.CY+.5;const i=T.idx(Math.floor(G.p.x),Math.floor(G.p.y));G.wall[i]=0;G.objs.delete(i);G.floor[i]=2;G.p.dead=.01;T.respawn()}const bags=[...G.objs.values()].filter(o=>o.t==='lostBag');return [bags.length,bags.reduce((a,o)=>a+o.items.reduce((b,s)=>b+s.c,0),0)]}""")
        rec('쓰러짐','꾸러미는 최대 5개, 넘치면 가장 오래된 것을 새 꾸러미에 합침 (재료는 사라지지 않음)', r==[5,70], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.backPt={x:50.5,y:60.5};G.recallCd=G.time+30;const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const G2=T.G;return [[...G2.objs.values()].filter(o=>o.t==='lostBag').length,G2.backPt&&G2.backPt.x,Math.round(G2.recallCd-G2.time)]}""")
        rec('세이브','꾸러미·귀환 표지·귀환석 쉬는 시간이 저장·불러오기 뒤에도 그대로', r==[5,50.5,30], str(r))
        r=await ev(pg,"()=>{const T=__T;T.openPanel('map');const t=document.querySelector('#sheet').innerText;T.closePanel();return [t.includes('잃어버린 꾸러미'),t.includes('귀환 표지')]}")
        rec('지도','지도에 잃어버린 꾸러미와 귀환 표지 표시', r==[True,True], str(r))
        await ev(pg,"()=>{const T=__T,G=T.G;let at=-1;for(const [i,o] of G.objs)if(o.t==='lostBag'){at=i;break}G.p.x=at%200+.5;G.p.y=((at/200)|0)-0.6;G.enemies.length=0}")
        await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa38_bag.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
