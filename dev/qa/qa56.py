import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v59: 용광로·요리솥은 넣어 두고 나중에 꺼내기 (한 번에 한 가지, 30개까지, 실제 시간으로 진행) / 게임을 꺼 둔 동안에도 작물 등이 자람
H2=HOOK.replace("computeLight}","computeLight,RECIPES,jobTime,jobDone,takeJob,cancelJob,returnObj,perform,get panel(){return panel},renderPanel,JOB_MAX,cropStage,advanceOffline}")
SET="""window.__set=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+14;y++)for(let x=T.CX+2;x<T.CX+14;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i)}
  G.enemies.length=0;G.inv.fill(null);G.sel=3;G.p.x=T.CX+5.5;G.p.y=T.CY+5.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;G.fish=null;
  const fi=T.idx(T.CX+6,T.CY+5),pi=T.idx(T.CX+6,T.CY+7);G.objs.set(fi,{t:'furnace'});G.objs.set(pi,{t:'pot'});return [fi,pi]};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+SET+"}")
        r=await ev(pg,"()=>{const T=__T,f=id=>T.jobTime(T.RECIPES.find(q=>q.out===id));return [['copperBar','ironBar','quartzR','goldBar'].map(f),['grilled','skewer','capSteak','beanHotpot'].map(f),T.JOB_MAX]}")
        rec('시간','제련 구리 5초·철 10초·석영 20초·금 20초 / 요리 기본 6~10초·특수 30초·전설 50초 / 최대 30개', r==[[5,10,20,20],[6,10,30,50],30], str(r))
        # put 5 copper bars in
        await ev(pg,"()=>{const T=__T,G=T.G,[fi]=__set();G.inv[12]={id:'copperOre',c:10};T.openPanel('craft',{st:'furnace',i:fi})}"); await pg.wait_for_timeout(500)
        i=await ev(pg,"()=>__T.RECIPES.findIndex(q=>q.out==='copperBar')")
        for _ in range(4): await ev(pg,f"()=>document.querySelector('#sheet [data-a=qty][data-i=\"{i}:1\"]').click()"); await pg.wait_for_timeout(80)
        await ev(pg,f"()=>document.querySelector('#sheet [data-a=craft][data-i=\"{i}\"]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.panel.i),t=document.querySelector('#sheet').innerText;return [T.countItem('copperOre'),T.countItem('copperBar'),o.job&&o.job.q,o.job&&o.job.per,!!document.querySelector('#sheet .jobcard'),t.includes('넣기'),[...document.querySelectorAll('#sheet [data-a=craft]')].every(b=>b.disabled)]}")
        rec('넣기','용광로에 구리광석 10개 → 구리괴 5개 넣기 (재료는 바로 빠지고, 완성품은 아직 없음, 다른 것은 못 넣음)', r==[0,0,5,5,True,True,True], str(r))
        await pg.screenshot(path=SP+'qa56_job.png')
        # 12 s later: two are ready
        await ev(pg,"()=>{const o=__T.G.objs.get(__T.panel.i);o.job.t0-=12}"); await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>{const b=document.querySelector('#sheet [data-a=jobTake]');return [b&&b.textContent.trim(),b&&b.disabled,document.querySelector('#jobTxt').textContent]}")
        rec('진행','창을 열어 둔 채로도 진행 (12초 → 2개 완료, 꺼내기 2)', r[0]=='꺼내기 2' and r[1] is False and r[2].startswith('2/5'), str(r))
        await ev(pg,"()=>document.querySelector('#sheet [data-a=jobTake]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const T=__T,o=T.G.objs.get(T.panel.i);return [T.countItem('copperBar'),o.job&&o.job.q,T.jobDone(o.job),(T.G.stats.made||{}).copperBar]}")
        rec('꺼내기','다 된 2개만 꺼내고 나머지 3개는 계속', r==[2,3,0,2], str(r))
        await ev(pg,"()=>document.querySelector('#sheet [data-a=jobCancel]').click()"); await pg.wait_for_timeout(150)
        await ev(pg,"()=>document.querySelector('#sheet [data-a=jobCancel]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const T=__T,o=T.G.objs.get(T.panel.i);return [T.countItem('copperOre'),T.countItem('copperBar'),!!o.job]}")
        rec('취소','취소(두 번 눌러 확인)하면 시작 안 한 3개의 재료(광석 6개)를 돌려받음', r==[6,2,False], str(r))
        # max 30
        await ev(pg,"()=>{const T=__T,G=T.G;G.inv[12]={id:'copperOre',c:100};T.renderPanel()}"); await pg.wait_for_timeout(200)
        await ev(pg,f"()=>document.querySelector('#sheet [data-a=qty][data-i=\"{i}:max\"]').click()"); await pg.wait_for_timeout(150)
        await ev(pg,f"()=>document.querySelector('#sheet [data-a=craft][data-i=\"{i}\"]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const T=__T,o=T.G.objs.get(T.panel.i);return [o.job.q,T.countItem('copperOre')]}")
        rec('최대','한 번에 30개까지 (광석 60개 사용)', r==[30,46], str(r))
        await ev(pg,"()=>__T.closePanel()")
        # in front of the furnace with finished bars: the button takes them out
        r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.idx(T.CX+6,T.CY+5));o.job.t0-=31;const a=T.decide();T.perform(a);return [a.k,a.lbl,T.countItem('copperBar'),o.job&&o.job.q]}")
        rec('세상','완성품이 있으면 용광로 앞에서 큰 버튼이 [꺼내기]', r==['jobTake','꺼내기',8,24], str(r))
        await pg.wait_for_timeout(400); await pg.screenshot(path=SP+'qa56_world.png')
        # save keeps the job; picking the furnace up gives everything back
        r=await ev(pg,"""()=>{const T=__T;T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const G=T.G,i=T.idx(T.CX+6,T.CY+5),o=G.objs.get(i);const a=[o.job&&o.job.q,o.job&&o.job.out];
          const ore0=T.countItem('copperOre');G.objs.delete(i);T.returnObj(o,G.p.x,G.p.y);return a.concat([T.countItem('copperOre')-ore0,T.countItem('furnace'),!!o.job])}""")
        rec('저장·회수','넣어 둔 것은 저장되고, 일하는 중에 용광로를 회수하면 남은 재료를 돌려받음', r==[24,'copperBar',48,1,False], str(r))
        # pot: wildcard fish comes back as the same fish
        await ev(pg,"()=>{const T=__T,G=T.G,[,pi]=__set();G.inv[12]={id:'crucian',c:2};T.openPanel('craft',{st:'pot',i:pi})}"); await pg.wait_for_timeout(500)
        j=await ev(pg,"()=>__T.RECIPES.findIndex(q=>q.out==='grilledFish')")
        await ev(pg,f"()=>document.querySelector('#sheet [data-a=qty][data-i=\"{j}:max\"]').click()"); await pg.wait_for_timeout(100)
        await ev(pg,f"()=>document.querySelector('#sheet [data-a=craft][data-i=\"{j}\"]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const T=__T,o=T.G.objs.get(T.panel.i);const a=[o.job.q,o.job.per,T.countItem('crucian')];T.cancelJob(o,T.G.p.x,T.G.p.y);return a.concat([T.countItem('crucian')])}")
        await ev(pg,"()=>__T.closePanel()")
        rec('요리솥','요리솥: 구운 생선 2개(6초씩), 취소하면 넣은 붕어 그대로 돌려받음', r==[2,6,0,2], str(r))
        # offline growth
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__set();const ci=T.idx(T.CX+8,T.CY+8);G.objs.set(ci,{t:'cropBerry',p:G.time});G.buffs=[{ef:'atk',tier:1,end:G.time+100,max:180,id:'skewer'}];
          const s=JSON.parse(JSON.stringify(T.serialize()));s.at=Date.now()-10*60*1000;const t0=G.time;T.deserialize(s);const G2=T.G;return [Math.round(G2.time-t0),T.cropStage(G2.objs.get(ci)),Math.round(G2.buffs[0].end-G2.time)]}""")
        rec('꺼 둔 동안','게임을 10분 꺼 두면 작물이 그만큼 자라 있음 (먹은 음식 효과는 그대로 남음)', 595<=r[0]<=605 and r[1]==3 and 98<=r[2]<=100, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));s.at=Date.now()+60000;const t0=G.time;T.deserialize(s);const a=Math.round(T.G.time-t0);const s2=JSON.parse(JSON.stringify(T.serialize()));s2.at=0;T.deserialize(s2);return [a,Math.round(T.G.time-t0)]}""")
        rec('꺼 둔 동안','시계가 앞서 있거나 시간이 없는 세이브는 그대로', r==[0,0], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
