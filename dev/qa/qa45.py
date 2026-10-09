import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 펫 (v45): 야생 동물, 올가미 밧줄 포획 미니게임, 강아지·고양이·토끼, 펫 버프
H2=HOOK.replace("computeLight}","computeLight,RECIPES,ANIMALS,wildTick,wildNear,openCatch,catchAng,get panel(){return panel},updateDrops,rollDrops,luckTier,spawnDrop,perform,QSIDE,animalImg,rarOf}")
CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+22;y++)for(let x=T.CX+2;x<T.CX+22;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.biome[i]=0}
  G.enemies.length=0;G.drops.length=0;G.wild=[];G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.fish=null;G.inv.fill(null);G.sel=0;return [T.CX+8,T.CY+8]};
  window.__wild=(k,dx,dy)=>{const G=__T.G,w={k,x:G.p.x+dx,y:G.p.y+dy,vx:0,vy:0,t:99,flip:false,anim:0};G.wild.push(w);return w};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+CLEAR+"}")
        r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(r=>r.out==='lasso'),A=T.ANIMALS;return [rc&&rc.at,rc&&rc.cat,Object.keys(A).filter(k=>A[k].pet).map(k=>k+':'+A[k].biome).join(','),!!T.animalImg('dog'),!!T.animalImg('cat'),!!T.animalImg('rabbit'),T.QSIDE.some(q=>q.id==='s_pet')]}")
        rec('펫','올가미 밧줄(작업대·도구), 강아지(이끼)·토끼(버섯숲)·고양이(수정 동굴), 도전 퀘스트', r==['bench','tool','dog:0,rabbit:1,cat:2',True,True,True,True], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.pets={};let n=0;for(let k=0;k<300&&!G.wild.length;k++){T.wildTick(6.1);n++}const w=G.wild[0];return [w&&w.k,G.wild.length,w?Math.round(Math.hypot(w.x-G.p.x,w.y-G.p.y)):0]}""")
        rec('야생','이끼 동굴에서 강아지가 7~13칸 떨어진 곳에 나타남', r[0]=='dog' and r[1]==1 and 5<=r[2]<=14, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.pets={dog:1};for(let k=0;k<200;k++)T.wildTick(6.1);return G.wild.length}""")
        rec('야생','이미 데려온 종류는 다시 나타나지 않음', r==0, r)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.pets={};const w=__wild('dog',1.5,0);const a=T.decide();G.inv[0]={id:'lasso',c:1};G.sel=0;w.x=G.p.x+2.4;const b2=T.decide();return [a.k,a.msg&&a.msg.includes('올가미'),b2.k,b2.lbl]}""")
        rec('포획','올가미 없이 다가가면 안내, 올가미를 들면 [포획]', r==['info',True,'lasso','포획'], str(r))
        await ev(pg,"()=>{const T=__T;T.perform(T.decide())}"); await pg.wait_for_timeout(650)
        r=await ev(pg,"()=>{const P=__T.panel;return [P&&P.kind,!!document.querySelector('#catchCv'),document.querySelector('#sheet').innerText.includes('던지기')]}")
        rec('포획','포획 미니게임 창 (돌아가는 밧줄·던지기 버튼)', r==['catch',True,True], str(r))
        await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'qa45_catch.png')
        for k in range(3):
            await ev(pg,"()=>{const P=__T.panel;P.za=__T.catchAng(P);P.zw=1.2}")
            await pg.click('#sheet [data-a=catchThrow]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const G=__T.G;return [!!__T.panel,JSON.stringify(G.pets),G.petOn,G.wild.length,document.querySelector('#toasts').innerText.includes('친구가 됐어요'),!!G.petE]}")
        rec('포획','초록 구간에서 세 번 던지면 친구가 되고 바로 따라다님', r==[False,'{"dog":1}','dog',0,True,True], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const w=__wild('rabbit',2,0);T.openCatch(w);return 1}"""); await pg.wait_for_timeout(650)
        for k in range(2):
            await ev(pg,"()=>{const P=__T.panel;P.za=__T.catchAng(P)+3.1;P.zw=.4}")
            await pg.click('#sheet [data-a=catchThrow]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const G=__T.G;return [!!__T.panel,!!G.pets.rabbit,G.wild.length,document.querySelector('#toasts').innerText.includes('도망')]}")
        rec('포획','두 번 놓치면 도망감', r==[False,False,0,True], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const w=__wild('cat',2,0);T.openCatch(w);return 1}"""); await pg.wait_for_timeout(650)
        await ev(pg,"()=>{const P=__T.panel;P.za=__T.catchAng(P)+3.1;P.zw=.4}"); await pg.keyboard.press('Space'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>[__T.panel&&__T.panel.miss]")
        await ev(pg,"()=>{__T.closePanel();__T.G.wild=[]}")
        rec('포획','스페이스로도 던짐 (PC)', r==[1], str(r))
        # follow
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.petE.x=G.p.x;G.petE.y=G.p.y;G.p.x+=5;for(let k=0;k<120;k++)T.wildTick(1/60);const d=Math.hypot(G.petE.x-G.p.x,G.petE.y-G.p.y);G.p.x+=30;T.wildTick(1/60);const d2=Math.hypot(G.petE.x-G.p.x,G.petE.y-G.p.y);G.p.x-=30;G.petE.x=G.p.x-.6;G.petE.y=G.p.y+.2;return [+d.toFixed(1),d2<1.5]}""")
        rec('펫','펫이 뒤를 따라오고, 너무 멀어지면 곁으로 옴', r[0]<1.6 and r[1], str(r))
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.inv.fill(null);G.petE.x=G.p.x+.8;G.petE.y=G.p.y;const d=T.decide();T.perform(d);return [d.k,d.lbl,document.querySelector('#toasts').innerText.includes('좋아해요')]}")
        rec('펫','펫 앞에서 [쓰다듬기]', r==['petpet','쓰다듬기',True], str(r))
        # buffs
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const run=()=>{G.drops.length=0;T.spawnDrop('stone',1,G.p.x+3,G.p.y);const d=G.drops[0];d.t=1;d.vx=d.vy=0;d.vz=0;d.z=0;const x0=d.x;for(let k=0;k<6;k++)T.updateDrops(1/60);return Math.abs(d.x-x0)>.01};
          G.petOn='dog';const a=run();G.petOn=null;const b2=run();G.drops.length=0;G.petOn='dog';return [a,b2]}""")
        rec('버프','강아지: 3칸 떨어진 물건도 끌어옴 (없으면 2.2칸까지)', r==[True,False], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.pets.cat=1;G.pets.rabbit=1;G.petOn='cat';const l1=T.luckTier();G.petOn='dog';const l0=T.luckTier();
          const mr=Math.random;Math.random=()=>.45;G.drops.length=0;G.petOn='rabbit';T.rollDrops([['cryGem',1,1,.4],['stone',1,1,.4]],G.p.x,G.p.y);const rb=G.drops.map(d=>d.id).join(',');G.drops.length=0;G.petOn='dog';T.rollDrops([['cryGem',1,1,.4]],G.p.x,G.p.y);const nb=G.drops.length;Math.random=mr;G.drops.length=0;return [l1,l0,rb,nb]}""")
        rec('버프','고양이: 낚시 운 1단계 / 토끼: 희귀 이상 재료 확률 1.25배 (흔한 재료는 그대로)', r==[1,0,'cryGem',0], str(r))
        # equipment menu pet section
        await ev(pg,"()=>{__T.G.petOn='dog';__T.openPanel('equip')}"); await pg.wait_for_timeout(650)
        r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [t.includes('멍멍이 · 함께 다니는 중'),t.includes('야옹이'),t.includes('깡총이'),document.querySelectorAll('#sheet [data-a=petOn]').length]}")
        rec('장비 메뉴','펫 칸: 데려온 펫과 버프, 함께 다니는 펫 표시', r==[True,True,True,3], str(r))
        await pg.click('#sheet [data-a=petOn][data-i=cat]'); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>[__T.G.petOn,document.querySelector('#sheet').innerText.includes('야옹이 · 함께 다니는 중')]")
        await pg.click('#sheet [data-a=petOn][data-i=cat]'); await pg.wait_for_timeout(250)
        r2=await ev(pg,"()=>[__T.G.petOn,__T.G.petE]")
        rec('장비 메뉴','펫을 눌러 바꾸고, 한 번 더 누르면 쉬게 함', r==['cat',True] and r2==[None,None], str([r,r2]))
        await pg.screenshot(path=SP+'qa45_equip.png')
        await ev(pg,"()=>__T.closePanel()")
        # save
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.petOn='rabbit';T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const a=[JSON.stringify(T.G.pets),T.G.petOn];const s=JSON.parse(JSON.stringify(T.serialize()));delete s.pets;delete s.petOn;T.deserialize(s);return a.concat([JSON.stringify(T.G.pets),T.G.petOn])}""")
        rec('저장','펫 저장/불러오기, 옛 세이브는 펫 없이 시작', r==['{"dog":1,"cat":1,"rabbit":1}','rabbit','{}',None], str(r))
        await ev(pg,"()=>{const T=__T,G=T.G;__clear();G.pets={dog:1};G.petOn='dog';G.petE={x:G.p.x-.8,y:G.p.y+.2,flip:false,anim:0,moving:false};__wild('rabbit',2,0.5);__wild('cat',-2.5,-1)}")
        await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa45_world.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
