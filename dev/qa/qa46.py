import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 목장 (v46): 소·닭·양 포획, 내려놓으면 우유·달걀·양모, 새 요리·털모자·양털 러그
H2=HOOK.replace("computeLight}","computeLight,RECIPES,ANIMALS,wildTick,openCatch,catchAng,get panel(){return panel},perform,QSIDE,hatMul,upgText,SPR}")
CLEAR="""window.__clear=(b)=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+22;y++)for(let x=T.CX+2;x<T.CX+22;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.biome[i]=b||0}
  G.enemies.length=0;G.drops.length=0;G.wild=[];G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.fish=null;G.inv.fill(null);G.sel=0;return [T.CX+8,T.CY+8]};
  window.__wild=(k,dx,dy)=>{const G=__T.G,w={k,x:G.p.x+dx,y:G.p.y+dy,vx:0,vy:0,t:99,flip:false,anim:0};G.wild.push(w);return w};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+CLEAR+"}")
        r=await ev(pg,"""()=>{const T=__T,A=T.ANIMALS,I=T.ITEMS,f=id=>{const r=T.RECIPES.find(q=>q.out===id);return r&&r.at};return [['cow','chicken','sheep'].map(k=>k+':'+A[k].biome+':'+A[k].ranch+':'+I[k].kind).join(','),['friedEgg','pancake','woolHat','woolRug'].map(f).join(','),I.milk.kind,I.woolHat.slot,!!T.SPR.obj.cow&&!!T.SPR.obj.sheep&&!!T.SPR.obj.chicken]}""")
        rec('목장','소·닭(이끼 동굴)·양(버섯숲), 우유·달걀·양모, 달걀 프라이·팬케이크(화로)·털모자·양털 러그(작업대)', r==['cow:0:milk:place,chicken:0:egg:place,sheep:1:wool:place','furnace,furnace,bench,bench','food','head',True], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear(1);const seen=new Set();for(let k=0;k<300;k++){T.wildTick(6.1);for(const w of G.wild)seen.add(w.k);G.wild=[]}return [...seen].sort().join(',')}""")
        rec('야생','버섯숲에 양과 토끼가 나타남', r=='rabbit,sheep', r)
        # catch a cow
        await ev(pg,"()=>{const T=__T,G=T.G;__clear(0);const w=__wild('cow',2,0);T.openCatch(w)}"); await pg.wait_for_timeout(650)
        for k in range(3):
            await ev(pg,"()=>{const P=__T.panel;P.za=__T.catchAng(P);P.zw=1.2}")
            await pg.click('#sheet [data-a=catchThrow]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const G=__T.G;return [!!__T.panel,__T.countItem('cow'),JSON.stringify(G.pets||{}),G.petOn||null,JSON.stringify(G.stats.ranchK),document.querySelector('#toasts').innerText.includes('데려왔어요')]}")
        rec('포획','소를 포획하면 펫이 아니라 「소」 아이템으로', r==[False,1,'{}',None,'{"cow":1}',True], str(r))
        # place it
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.sel=G.inv.findIndex(s=>s&&s.id==='cow');if(G.sel>=9){G.inv[0]=G.inv[G.sel];G.inv[G.sel]=null;G.sel=0}const d=T.decide();return [d.k,d.lbl]}")
        await tap(pg,1); await pg.wait_for_timeout(200)
        r2=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.idx(T.CX+9,T.CY+8));return [o&&o.t,o&&Math.round(o.p-G.time),T.countItem('cow')]}")
        rec('목장','소를 내려놓으면 5분 뒤 우유', r==['place','놓기'] and r2[0]=='cow' and 297<=r2[1]<=300 and r2[2]==0, str([r,r2]))
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.sel=1;const d=T.decide();return [d.k,d.msg,d.sub]}")
        rec('목장','아직이면 남은 시간 안내 (+ 작은 [회수])', r[0]=='info' and '5분쯤 뒤에 우유를' in r[1] and r[2] is True, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G,o=G.objs.get(T.idx(T.CX+9,T.CY+8));o.p=G.time-1;const d=T.decide();T.perform(d);return [d.k,d.lbl,T.countItem('milk'),Math.round(o.p-G.time),T.decide().k]}""")
        rec('목장','다 되면 [우유 짜기] → 우유 1개, 다시 5분', r==['ranch','우유 짜기',1,300,'info'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const out=[];for(const k of ['chicken','sheep']){const i=T.idx(T.CX+9,T.CY+8);G.objs.set(i,{t:k,p:G.time-1});const d=T.decide();T.perform(d);out.push(d.lbl+':'+T.countItem(T.ANIMALS[k].ranch))}G.objs.set(T.idx(T.CX+9,T.CY+8),{t:'cow',p:G.time-1});return out}""")
        rec('목장','닭 [달걀 줍기] → 달걀, 양 [털 깎기] → 양모', r==['달걀 줍기:1','털 깎기:1'], str(r))
        await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'qa46_ranch.png')
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.ranchK={cow:1,chicken:1};const q=T.QSIDE.find(x=>x.id==='s_ranch');const a=q.done();G.stats.ranchK.sheep=1;return [a,q.done(),typeof q.t==='function'?q.t():q.t]}""")
        rec('도전','「목장 동물 세 종류 데려오기」', r[0] is False and r[1] is True and '3/3' in r[2], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const a=T.hatMul();G.equip.head={id:'woolHat',c:1};const b2=T.hatMul();G.equip.head.lv=2;const c=+T.hatMul().toFixed(2);G.equip.head=null;return [a,b2,c,T.upgText('woolHat',2)]}""")
        rec('털모자','털모자: 추위 게이지 85% 속도 (+2: 79%)', r==[1,0.85,0.79,'추위 게이지 79% 속도'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(T.CX+9,T.CY+8),o=G.objs.get(i);o.p=G.time+123;T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const o2=T.G.objs.get(i);return [o2.t,Math.round(o2.p-T.G.time)]}""")
        rec('저장','목장 동물과 남은 시간 저장/불러오기', r==['cow',123], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
