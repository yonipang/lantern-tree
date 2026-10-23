# 제작·장비: 작업대 단계·탭, 장비제작대 단계, 시간 작업, 장비 칸, 무기·스킬·제작대, 재료·강화, 내구도·수리, 분해, 이름 변경
# 실행: python3 dev/qa/run.py crafting   (테스트 하나만: python3 dev/qa/run.py workbench_tiers)
from harness import *


def test_workbench_tiers():
    import asyncio, sys
    # v60: 작업대 단계 — 작업대 → 구리 → 철 → 석영 → 금 → 서리, 제작 창 맨 위에서 재료를 넣어 올리기, 높은 단계는 아래 단계 물건도 (자기 단계가 맨 위)
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,BENCH_N,BENCH_IT,returnObj,perform,get panel(){return panel},renderPanel,GUIDE,STN,fpTiles}")
    SET="""window.__set=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+14;y++)for(let x=T.CX+2;x<T.CX+14;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i)}
  G.enemies.length=0;G.inv.fill(null);G.sel=3;G.p.x=T.CX+5.5;G.p.y=T.CY+5.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;
  const bi=T.idx(T.CX+6,T.CY+5);G.objs.set(bi,{t:'bench'});G.objs.set(bi+1,{t:'_part',a:bi});return bi};
  window.__rows=()=>[...document.querySelectorAll('#sheet [data-a=craft]')].map(b=>__T.RECIPES[+b.dataset.i].tier||0);"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+SET+"}")
            r=await ev(pg,"()=>{const T=__T,t=id=>{const r=T.RECIPES.find(q=>q.out===id);return r?r.at+r.tier:'-'};return [T.BENCH_N.join(','),['chest','pot','pickCopper','pickIron','lampCrystal','swordCrystal','pickGold','swordDawn','forge'].map(t).join(','),T.RECIPES.some(r=>r.at==='forge')]}")
            rec('단계','작업대 7단계(v130 그림자), 레시피는 재료로 단계가 정해짐 (구리 작업대 레시피는 없어짐)', r==['작업대,구리 작업대,철 작업대,석영 작업대,금 작업대,서리 작업대,그림자 작업대','bench0,bench1,smelter1,smelter2,bench3,smelter3,smelter5,smelter5,-',False], str(r))
            await ev(pg,"()=>{const T=__T,bi=__set();T.openPanel('craft',{st:'bench',i:bi})}"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;const T=__T;return [document.querySelector('#sheet h2').innerText.trim(),!!document.querySelector('#sheet .benchup'),t.includes('구리 작업대로 올리기'),t.includes('구리괴 0/8'),t.includes('흙 0/20'),document.querySelector('#sheet [data-a=benchUp]').disabled,__rows().every(t=>t===0)]}")
            rec('창','작업대 창 맨 위에 「구리 작업대로 올리기」(구리괴 8·흙 20 — v88: 돌→흙), 재료 없으면 못 누름, 목록은 작업대 물건만', r==['작업대',True,True,True,True,True,True], str(r))
            await pg.screenshot(path=SP+'bench0.png')
            await ev(pg,"()=>{const T=__T,G=T.G;G.inv[12]={id:'copperBar',c:8};G.inv[13]={id:'dirt',c:25};G.inv[14]={id:'stone',c:7};T.renderPanel()}"); await pg.wait_for_timeout(200)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=benchUp]').click()"); await pg.wait_for_timeout(400)
            r=await ev(pg,"""()=>{const T=__T,G=T.G,o=G.objs.get(T.panel.i);const ts=__rows();
          return [o.lv,T.countItem('copperBar'),T.countItem('dirt'),T.countItem('stone'),G.stats.forge,document.querySelector('#sheet h2').innerText.trim(),document.querySelector('#sheet').innerText.includes('철 작업대로 올리기'),ts[0],ts.includes(0),ts.every((t,k)=>k===0||t<=ts[k-1]),!ts.includes(2)]}""")
            rec('올리기','올리면 「구리 작업대」: 구리괴 8·흙 20이 빠지고 돌은 그대로(v88), 구리 물건이 맨 위·작업대 물건도 아래에 나옴, 다음은 철 작업대', r==[1,0,5,7,1,'구리 작업대',True,1,True,True,True], str(r))
            await pg.screenshot(path=SP+'bench1.png')
            r=await ev(pg,"()=>{const T=__T,G=T.G;const give=[['ironBar',8],['stone',30],['quartzR',6],['granite',20],['goldBar',6],['basalt',20],['frostShard',10],['iceBlock',20],['shadowCry',10],['shadowRock',20]];give.forEach(([id,c],k)=>G.inv[12+k]={id,c});T.renderPanel();return 1}")
            for _ in range(5):
                await ev(pg,"()=>document.querySelector('#sheet [data-a=benchUp]').click()"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.panel.i);return [o.lv,G.stats.benchLv,document.querySelector('#sheet h2').innerText.trim(),!document.querySelector('#sheet [data-a=benchUp]'),document.querySelector('#sheet').innerText.includes('가장 높은 단계')]}")
            rec('올리기','철 → 석영 → 금 → 서리 → 그림자 작업대까지 (v130 그림자가 끝)', r==[6,6,'그림자 작업대',True,True], str(r))
            await ev(pg,"()=>__T.closePanel()")
            # pick up and place again keeps the tier
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const bi=T.idx(T.CX+6,T.CY+5),o=G.objs.get(bi);o.lv=3;G.objs.delete(bi);G.objs.delete(bi+1);G.inv.fill(null);T.returnObj(o,G.p.x,G.p.y);const k=G.inv.findIndex(x=>x&&x.id==='benchQ');
          G.inv[0]=G.inv[k];if(k)G.inv[k]=null;G.sel=0;G.p.face={x:1,y:0};const a=T.decide();T.perform(a);const n=[...G.objs.values()].find(q=>q.t==='bench');return [k>=0,T.ITEMS.benchQ.n,a.k,n&&n.lv]}""")
            rec('회수','올린 작업대를 회수하면 「석영 작업대」 아이템, 다시 놓으면 세계의 제작대 등급(여기선 그림자 6단계 — v130)으로 놓임 (v128)', r==[True,'석영 작업대','place',6], str(r))
            # old saves: the copper workbench becomes a tier-1 workbench (2 tiles)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__set();G.stats.benchLv=0;G.stats.gearLv=0;/* v128: 앞에서 올린 세계 등급을 비우고 옛 세이브만 봄 */const fi=T.idx(T.CX+9,T.CY+9);G.objs.set(fi,{t:'forge'});G.inv[12]={id:'forge',c:1};const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G,o=G2.objs.get(fi);
          return [o&&o.t,o&&o.lv,T.fpTiles(fi,o).length,G2.objs.get(fi+1)&&G2.objs.get(fi+1).t,G2.inv[12]&&G2.inv[12].id,T.ITEMS.forge.n,T.STN.forge]}""")
            await pg.wait_for_timeout(3400)
            t=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('옛 세이브','놓여 있던 구리 제작대는 2칸 「구리 작업대」(1단계)로, 가방의 것은 이름만 바뀜, 알림 한 번', r==['bench',1,2,'_part','forge','구리 작업대','구리 작업대'] and '구리 작업대' in t, str(r)+' '+t[-60:])
            r=await ev(pg,"()=>{const T=__T;const g=T.GUIDE.map(q=>typeof q.t==='function'?q.t():q.t).join('|');return [g.includes('작업대를 구리 작업대로 올리기'),g.includes('구리 제작대')]}")
            rec('퀘스트','메인 퀘스트: 「작업대를 구리 작업대로 올리기」', r==[True,False], str(r))
            # a placed legacy forge object still works as a tier-1 bench (opened as 'forge')
            r=await ev(pg,"()=>{const T=__T,G=T.G;__set();const fi=T.idx(T.CX+7,T.CY+6);G.objs.set(fi,{t:'forge'});T.openPanel('craft',{st:'forge',i:fi});const a=[T.panel.st,document.querySelector('#sheet h2').innerText.trim()];T.closePanel();return a}")
            rec('옛 세이브','불러오기 전의 구리 제작대 칸도 1단계 작업대로 열림', r==['bench','구리 작업대'], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main



def test_bench_gear_linked_tiers():
    import asyncio, sys
    # v128: 작업대와 장비제작대는 등급 하나 — 어느 쪽을 올려도 둘 다(재료는 한 번), 새로 놓으면 지금 등급, 옛 세이브는 불러올 때 높은 쪽으로
    H2=HOOK.replace("computeLight}","computeLight,runCmd,GUIDE,perform}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"""()=>{const T=__T,G=T.G;window.__L={};for(let y=T.CY+2;y<T.CY+14;y++)for(let x=T.CX+2;x<T.CX+14;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i)}
              G.enemies.length=0;G.inv.fill(null);G.p.x=T.CX+5.5;G.p.y=T.CY+5.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;
              Object.assign(G.stats,{benchLv:0,gearLv:0,forge:0,gbench:0});const bi=T.idx(T.CX+3,T.CY+3),si=T.idx(T.CX+3,T.CY+8),s2=T.idx(T.CX+10,T.CY+8);
              G.objs.set(bi,{t:'bench'});G.objs.set(bi+1,{t:'_part',a:bi});G.objs.set(si,{t:'smelter'});G.objs.set(s2,{t:'smelter'});__L={bi,si,s2};return 1}""")
            r=await ev(pg,"""()=>{const T=__T,G=T.G,L=__L;G.inv[12]={id:'copperBar',c:8};G.inv[13]={id:'dirt',c:25};T.runCmd({k:'benchUp',o:L.bi});
              const g=T.GUIDE.find(q=>q.id==='gbench');return [G.objs.get(L.bi).lv,G.objs.get(L.si).lv,G.objs.get(L.s2).lv,T.countItem('copperBar'),T.countItem('dirt'),G.stats.benchLv,G.stats.gearLv,G.stats.forge,!!g.done()]}""")
            rec('같이 올리기','작업대를 구리로 올리면 놓인 장비제작대 2개도 구리, 재료는 한 번(구리괴 8·흙 20), 등급만으로는 「장비제작대 놓기」가 안 끝남', r==[1,1,1,0,5,1,1,1,False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,L=__L;G.inv[12]={id:'ironBar',c:8};G.inv[13]={id:'stone',c:30};T.runCmd({k:'benchUp',o:L.si});
              return [G.objs.get(L.bi).lv,G.objs.get(L.si).lv,G.objs.get(L.s2).lv,T.countItem('ironBar'),T.countItem('stone'),G.stats.benchLv,G.stats.gearLv]}""")
            rec('같이 올리기','장비제작대를 철로 올려도 작업대·다른 장비제작대가 같이 철, 재료는 한 번(철괴 8·돌 30)', r==[2,2,2,0,0,2,2], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[0]={id:'smelter',c:1};G.sel=0;G.p.face={x:1,y:0};const a=T.decide();T.perform(a);
              const t=T.idx(Math.floor(G.p.x)+1,Math.floor(G.p.y)),o=G.objs.get(t),g=T.GUIDE.find(q=>q.id==='gbench');return [a.k,o&&o.t,o&&o.lv,!!G.stats.gbench,!!g.done()]}""")
            rec('새로 놓기','기본 장비제작대를 새로 놓으면 지금 등급(철)으로 놓이고, 「장비제작대 놓기」가 끝남', r==['place','smelter',2,True,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,L=__L;for(const o of G.objs.values())if(o.t==='smelter'||o.t==='bench')o.lv=0;G.objs.get(L.bi).lv=3;Object.assign(G.stats,{benchLv:3,gearLv:1,gbench:0});delete G.stats.tier128;
              const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G,lv=[...G2.objs.values()].filter(o=>o.t==='smelter'||o.t==='bench').map(o=>o.lv);
              return [lv.length,lv.every(v=>v===3),G2.stats.benchLv,G2.stats.gearLv,!!G2.stats.gbench,G2.stats.tier128]}""")
            rec('옛 세이브','불러오면 놓인 작업대·장비제작대가 모두 높은 쪽(석영)으로 맞춰지고, 예전에 장비제작대를 올린 적이 있으면 「놓기」를 한 것으로', r==[4,True,3,3,True,1], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_bench_up_dirt():
    # v88: 작업대·장비제작대를 구리 단계로 올리는 재료가 구리괴 8 · 흙 20 (예전 돌 20), 다른 단계는 그대로
    H2=HOOK.replace("computeLight}","computeLight,BENCH_UP}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const T=__T;return [JSON.stringify(T.BENCH_UP),T.ITEMS.dirt.n]}")
            rec('올리기','1단계 재료 구리괴 8·흙 20, 2~5단계는 그대로 (v130 6단계 그림자 결정 10·그림자 바위 20)', r[0]=='[null,[["copperBar",8],["dirt",20]],[["ironBar",8],["stone",30]],[["quartzR",6],["granite",20]],[["goldBar",6],["basalt",20]],[["frostShard",10],["iceBlock",20]],[["shadowCry",10],["shadowRock",20]]]' and r[1]=='흙', str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main

def test_workbench_tabs():
    import asyncio, sys
    # v62: 작업대 창 — 1줄 아이콘 탭(전체·재료·도구·제작대·가구·건축·편의, 고른 탭만 이름), 2줄 탭(가구: 의자·탁자·침대·수납·조명·장식 / 건축: 벽·바닥·울타리·기둥·문·창문·자연 / 편의: 회로·농사·채굴장 / 제작대), 세트는 태그, 손 제작도 작업대에서
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,bcat,get panel(){return panel},renderPanel}")
    SET="""window.__set=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+14;y++)for(let x=T.CX+2;x<T.CX+14;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i)}
  G.enemies.length=0;G.inv.fill(null);G.sel=3;G.p.x=T.CX+5.5;G.p.y=T.CY+5.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;
  const bi=T.idx(T.CX+6,T.CY+5);G.objs.set(bi,{t:'bench',lv:5});G.objs.set(bi+1,{t:'_part',a:bi});const fi=T.idx(T.CX+6,T.CY+7);G.objs.set(fi,{t:'fdesk'});G.objs.set(fi+1,{t:'_part',a:fi});window.__fi=fi;G.stats.benchLv=5;return bi};
  window.__row=k=>{const r=document.querySelectorAll('#sheet .tabs')[k];return r?[...r.querySelectorAll('.tab')].map(b=>(b.dataset.i)+(b.classList.contains('on')?'*':'')).join(','):''};
  window.__lbl=()=>[...document.querySelectorAll('#sheet .itabs .tab')].map(b=>b.textContent.trim()).filter(Boolean).join(',');
  window.__ids=()=>[...document.querySelectorAll('#sheet [data-a=craft]')].map(b=>__T.RECIPES[+b.dataset.i].out);
  window.__clk=(a,i)=>document.querySelector(`#sheet [data-a=${a}][data-i=${i}]`).click();"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+SET+"}")
            r=await ev(pg,"()=>{const T=__T,f=id=>T.bcat(T.RECIPES.find(r=>r.out===id)).join('/');return ['chair','table','bed','chest','torch','plant','mossBed','cryTable','wallBrick','floorMoss','bFenceWood','bDoorWood','slideDoor','roundTree','waterPond','floorWood','wire','sprinkler','drillCu','drillFe','pot','furnace','smelter','bench','rope','bagUp1'].map(f).join(' ')}")
            rec('분류','가구·건축(자연 포함)·편의·제작대·재료·도구 2단 분류',
                r=='furn/seat furn/table furn/bed furn/store furn/light furn/deco furn/bed furn/table build/wall build/floor build/fence build/door build/door build/nature build/nature build/floor conv/circuit conv/farm conv/mine conv/mine stn/cook stn/smelt stn/make stn/make mat tool', r)
            await ev(pg,"()=>{const T=__T,bi=__set();T.openPanel('craft',{st:'bench',i:bi})}"); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[__row(0),__lbl(),document.querySelectorAll('#sheet .itabs .tab img').length,document.querySelectorAll('#sheet .tabs').length,__ids().includes('rope'),__ids().includes('chair')]")
            rec('1줄 탭','작업대: 아이콘 탭 7개, 고른 탭(전체)만 이름, 2줄 탭은 없음, 손 제작(이끼 끈)도 보임, 의자는 가구 제작대로(v136)',
                r==['all*,mat,tool,stn,furn,build,conv','전체',7,1,True,False], str(r))
            w=await ev(pg,"()=>{const r=document.querySelector('#sheet .itabs');return [r.scrollWidth,r.clientWidth]}")
            rec('1줄 탭','390px 화면에 1줄 탭이 다 보임', w[0]<=w[1]+2, str(w))
            await pg.screenshot(path=SP+'all.png')
            await ev(pg,"()=>{__T.closePanel();__T.openPanel('craft',{st:'fdesk',i:__fi})}"); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>[document.querySelector('#sheet .sh-head, #sheet h2, #sheet .head')?.textContent.includes('가구 제작대')?'가구':'',__row(0),__ids().every(id=>__T.bcat(__T.RECIPES.find(r=>r.out===id))[0]==='furn'),[...document.querySelectorAll('#sheet .stag')].map(e=>e.textContent).filter((v,i,a)=>a.indexOf(v)===i).sort().join(',')]")
            rec('가구','가구 제작대: 창 이름 「가구 제작대」, 탭 한 줄 전체·의자·탁자·침대·수납·장식(조명은 작업대), 세트는 태그로',
                r[0]=='가구' and r[1]=='all*,seat,table,bed,store,deco' and r[2] and r[3]=='버섯 세트,수정 세트,이끼 세트', str(r))
            for _ in range(6): # v136: 창을 바꿔 연 뒤라 누르기가 늦게 먹을 때가 있어요 — 고른 탭이 될 때까지
                await ev(pg,"()=>__clk('tab2','seat')"); await pg.wait_for_timeout(250)
                if (await ev(pg,"()=>__row(0)")).startswith('all,seat*'): break
            r=await ev(pg,"()=>[__row(0),__ids().sort().join(',')]")
            rec('가구','의자 탭은 의자만 (나무·이끼·버섯·수정·철제 의자, 벤치, 소파, 쿠션)', r[0].startswith('all,seat*') and 'chair' in r[1] and 'mossSofa' in r[1] and 'cryChair' in r[1] and 'bed' not in r[1] and 'table' not in r[1].split(','), str(r))
            await pg.screenshot(path=SP+'seat.png')
            await ev(pg,"()=>{__T.closePanel();__T.openPanel('craft',{st:'bench',i:__T.idx(__T.CX+6,__T.CY+5)})}"); await pg.wait_for_timeout(400)
            for _ in range(6):
                await ev(pg,"()=>{const b=document.querySelector('#sheet [data-a=tab][data-i=build]');if(b)b.click()}"); await pg.wait_for_timeout(250)
                if await ev(pg,"()=>__lbl()==='건축'"): break
            r=await ev(pg,"()=>[__lbl(),__row(1)]")
            rec('건축','건축: 2줄 탭이 전체로 돌아가고 전체·벽·바닥·울타리·문·자연 (v69: 기둥·창문 삭제)', r==['건축','all*,wall,floor,fence,door,nature'], str(r))
            await ev(pg,"()=>__clk('tab2','nature')"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>__ids()")
            rec('건축','자연 탭: 나무·꽃·물 타일 (가구 아님)', 'roundTree' in r and 'waterPond' in r and 'chair' not in r and 'treeFarm' not in r, str(r))
            await ev(pg,"()=>__clk('tab2','floor')"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>__ids()")
            rec('건축','바닥 탭: 나무·돌·세트 바닥', all(x in r for x in ['floorWood','floorStone','floorMoss','floorCrystal']) and 'wallWood' not in r, str(r))
            await ev(pg,"()=>__clk('tab','conv')"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>[__lbl(),__row(1)]")
            rec('편의','편의: 회로·(농사: 여왕을 쓰러뜨리면)·채굴기 (v113)', r[0]=='편의' and r[1] in ('all*,circuit,mine','all*,circuit,farm,mine'), str(r))
            await ev(pg,"()=>__clk('tab2','mine')"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>__ids().sort().join(',')")
            rec('편의','채굴기 탭: 구리·철·황금 채굴기·광석 그물 (v113: 채굴장·나무 작업장 없어짐 · v115 광석 그물)', r=='drillCu,drillFe,drillGold,oreNet', r)
            await ev(pg,"()=>__clk('tab','stn')"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>[__lbl(),__row(1),__ids().sort().join(',')]")
            rec('제작대','제작대: 작업대·가구 제작대(v136)·장비제작대·용광로·요리솥', r[0]=='제작대' and r[1]=='all*,make,smelt,cook' and r[2]=='bench,fdesk,furnace,pot,smelter', str(r))
            # crafting a hand recipe at the bench works
            await ev(pg,"()=>{const T=__T,G=T.G;G.inv[12]={id:'fiber',c:9};T.renderPanel()}")
            await ev(pg,"()=>__clk('tab','mat')"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>{const T=__T,i=T.RECIPES.findIndex(r=>r.out==='rope');const b=document.querySelector(`#sheet [data-a=craft][data-i=\"${i}\"]`);const d=b.disabled;b.click();return [__lbl(),d,T.countItem('rope')]}")
            rec('재료','작업대 재료 탭에서 이끼 끈(손 제작)도 만들 수 있음', r==['재료',False,1], str(r))
            # hand crafting window unchanged
            await ev(pg,"()=>{__T.closePanel();__T.openPanel('craft',{})}"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[document.querySelectorAll('#sheet .itabs').length,__ids().every(id=>!__T.RECIPES.find(r=>r.out===id).at)]")
            rec('손 제작','손 제작 창은 그대로 (손 제작만)', r==[0,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_gear_bench_tiers():
    import asyncio, sys
    # v61: 장비제작대도 6단계로 올리기 — 무기·방어구·장신구·도구는 장비제작대에서 (제작·수리·분해·강화 / 전체·무기·방어구·장신구·도구)
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,GEAR_N,GEAR_IT,returnObj,get panel(){return panel},renderPanel,GUIDE}")
    SET="""window.__set=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+14;y++)for(let x=T.CX+2;x<T.CX+14;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i)}
  G.enemies.length=0;G.inv.fill(null);G.sel=3;G.p.x=T.CX+5.5;G.p.y=T.CY+5.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;
  const si=T.idx(T.CX+6,T.CY+5);G.objs.set(si,{t:'smelter'});return si};
  window.__tabs=()=>[...document.querySelectorAll('#sheet .tabs')].map(r=>[...r.querySelectorAll('.tab')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(','));
  window.__ids=()=>[...document.querySelectorAll('#sheet [data-a=craft]')].map(b=>__T.RECIPES[+b.dataset.i]);"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+SET+"}")
            r=await ev(pg,"""()=>{const T=__T,f=id=>{const r=T.RECIPES.find(q=>q.out===id);return r?r.at+':'+r.tier+':'+r.cat:'-'};
          return [['swordCopper','pickIron','bowWood','obsCoat','woolHat','ringCu','shovel','rod','lasso','homeStone','arrowStone','swordCrystal','swordDawn'].map(f).join(' '),T.RECIPES.some(r=>r.at==='bench'&&['sword','pick','wear','shovel','rod'].includes(T.ITEMS[r.out].kind)),f('chest'),f('torch')]}""")
            rec('장비','무기·방어구·장신구·도구는 모두 장비제작대 (재료로 단계), 작업대에는 안 남음',
                r[0]=='smelter:1:weapon smelter:2:tool smelter:0:weapon smelter:4:armor smelter:0:armor smelter:1:acc smelter:1:tool smelter:0:tool smelter:0:tool smelter:3:tool smelter:0:weapon smelter:3:weapon smelter:5:weapon' and r[1] is False and r[2]=='bench:0:furn', str(r))
            await ev(pg,"()=>{const T=__T,si=__set();T.openPanel('craft',{st:'smelter',i:si})}"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const ids=__ids();return [document.querySelector('#sheet h2').innerText.trim(),__tabs(),document.querySelector('#sheet').innerText.includes('구리 장비제작대로 올리기'),ids.length>0&&ids.every(r=>!r.tier)]}")
            rec('창','장비제작대: 맨 위 올리기, 탭 1줄 제작·수리·분해·강화 / 2줄 전체·무기·방어구·장신구·도구, 처음엔 0단계 장비만', r[0]=='장비제작대' and r[1][0]=='제작*,수리,분해,강화' and r[1][1].startswith('전체*,무기,방어구') and '도구' in r[1][1] and r[2] and r[3], str(r))
            await pg.screenshot(path=SP+'gear0.png')
            await ev(pg,"()=>document.querySelector('#sheet [data-a=tab][data-i=tool]').click()"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>[__tabs(),__ids().map(r=>r.cat).every(c=>c==='tool')]")
            rec('창','도구 탭은 도구만', '도구*' in r[0][1] and r[1], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;G.inv[12]={id:'copperBar',c:8};G.inv[13]={id:'dirt',c:20};T.renderPanel()}"); await pg.wait_for_timeout(200)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=benchUp]').click()"); await pg.wait_for_timeout(400)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=tab][data-i=all]').click()"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>{const T=__T,o=T.G.objs.get(T.panel.i),ts=__ids().map(r=>r.tier||0);return [o.lv,T.G.stats.gearLv,document.querySelector('#sheet h2').innerText.trim(),ts[0],ts.includes(0),ts.every((t,k)=>!k||t<=ts[k-1])]}")
            rec('올리기','구리 장비제작대로 올리면 구리 장비가 맨 위, 0단계 장비도 아래', r==[1,1,'구리 장비제작대',1,True,True], str(r))
            await pg.screenshot(path=SP+'gear1.png')
            # repair and salvage only here
            await ev(pg,"()=>{const T=__T,G=T.G;G.inv[14]={id:'pickWood',c:1,dur:10};T.renderPanel()}")
            await ev(pg,"()=>document.querySelector('#sheet [data-a=tab][data-i=fix]').click()"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>[__tabs().length,!!document.querySelector('#sheet [data-a=fix][data-i=\"14\"]')]")
            await ev(pg,"()=>__T.closePanel()")
            r2=await ev(pg,"()=>{const T=__T,G=T.G,bi=T.idx(T.CX+3,T.CY+9);G.objs.set(bi,{t:'bench'});T.openPanel('craft',{st:'bench',i:bi});const t=__tabs()[0];T.closePanel();return [t.includes('수리'),t.includes('분해'),t.includes('무기')]}")
            rec('수리·분해','수리·분해는 장비제작대에서만 (작업대 탭에는 없음)', r==[1,True] and r2==[False,False,False], str([r,r2]))
            # pick up keeps the tier
            r=await ev(pg,"()=>{const T=__T,G=T.G,si=T.idx(T.CX+6,T.CY+5),o=G.objs.get(si);G.objs.delete(si);G.inv.fill(null);T.returnObj(o,G.p.x,G.p.y);return [G.inv.filter(Boolean).map(x=>x.id).join(','),T.ITEMS.smelterCu.n]}")
            rec('회수','올린 장비제작대는 단계 아이템으로 (구리 장비제작대)', r==['smelterCu','구리 장비제작대'], str(r))
            # old saves
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const si=__set();G.objs.get(si).lv=0;const bi=T.idx(T.CX+3,T.CY+9);G.objs.set(bi,{t:'bench',lv:2});const s=JSON.parse(JSON.stringify(T.serialize()));delete s.stats.nm61;T.deserialize(s);const a=T.G.objs.get(si).lv;
          G.objs.delete(si);const s2=JSON.parse(JSON.stringify(T.serialize()));delete s2.stats.nm61;s2.objs=s2.objs.filter(([i,o])=>o.t!=='smelter');s2.objs.push([T.idx(T.CX+11,T.CY+11),{t:'forge'}]);s2.objs=s2.objs.filter(([i,o])=>!(o.t==='bench'));T.deserialize(s2);
          return [a,T.countItem('smelterCu')]}""")
            rec('옛 세이브','v61 전 세이브: 장비제작대는 가진 작업대 단계까지 올라가 있고, 장비제작대가 없으면 그 단계 장비제작대를 받음', r==[2,1], str(r))
            r=await ev(pg,"()=>{const g=__T.GUIDE.map(q=>(typeof q.h==='function'?q.h():q.h)||'').join('|');return g.includes('장비제작대를 만들고(나무·흙·송진)')&&g.includes('작업대를 올리면 장비제작대도 같이 올라가요')}")  # v124: 장비제작대 놓기는 따로 퀘스트 · v128: 등급은 작업대와 같이
            rec('퀘스트','안내: 장비제작대 만들고 놓기(나무·흙·송진) → 구리 곡괭이는 「작업대를 올리면 장비제작대도 같이 올라가요」(v128)', r is True, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_timed_jobs():
    import asyncio, sys
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
            await pg.screenshot(path=SP+'job.png')
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
            await pg.wait_for_timeout(400); await pg.screenshot(path=SP+'world.png')
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
    return main


def test_ore_net_v115():
    import asyncio, sys
    # v115 자동 생산 3 (dev/design/자동생산.md 4장): 광석 그물 레시피(구리 작업대), 넣는 재료 10가지와 나오는 것·확률, 재료 하나에 8초 · 30개까지,
    # 넣어 두고 꺼내기(용광로 방식) · 꺼낼 때 하나마다 굴림, 취소·회수하면 시작 안 한 재료를 돌려받음, 앞에서 [열기]·[꺼내기], 창, 저장
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,jobDone,takeJob,cancelJob,returnObj,perform,get panel(){return panel},renderPanel,runCmd,sieveRoll,SIEVE,sieveOre,SIEVE_T,SIEVE_MAX}")
    SET="""window.__net=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+14;y++)for(let x=T.CX+2;x<T.CX+14;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i)}
  G.enemies.length=0;G.drops.length=0;G.inv.fill(null);G.sel=3;G.p.x=T.CX+5.5;G.p.y=T.CY+5.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;G.fish=null;
  const i=T.idx(T.CX+6,T.CY+5);G.objs.set(i,{t:'oreNet'});G.actCd=0;return i};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+SET+"}")
            r=await ev(pg,"()=>{const T=__T,q=T.RECIPES.find(r=>r.out==='oreNet');return [q.at,q.tier,q.cat,JSON.stringify(q.req),T.SIEVE_T,T.SIEVE_MAX,Object.keys(T.SIEVE).sort().join(','),!!T.OBJ.oreNet.sieve,T.OBJ.oreNet.dev||null]}")
            rec('레시피','광석 그물: 구리 작업대 · 나무 8·이끼 끈 4·구리괴 2 (편의 → 채굴기), 빛 없이 일함 · 8초 · 30개', r[:6]==['bench',1,'mine','[["wood",8],["rope",4],["copperBar",2]]',8,30] and r[6]=='basalt,dirt,gAsh,gCrystal,gMoss,gShroom,gSnow,granite,iceBlock,stone' and r[7] is True and r[8] is None, str(r))
            r=await ev(pg,"()=>{const S=__T.SIEVE,f=id=>S[id].map(([o,p])=>(o||'-')+p).join(' ');return [f('dirt'),f('gMoss'),f('stone'),f('gShroom'),f('granite'),f('gCrystal'),f('basalt'),f('gAsh'),f('iceBlock'),f('gSnow'),Object.values(S).every(t=>t.reduce((a,[,p])=>a+p,0)===100),['dirt','stone','gShroom','granite','basalt','gSnow'].map(__T.sieveOre).join(',')]}")
            rec('표','이끼(흙·이끼 흙): 꽝 55·돌 25·구리 18·철 2 / 돌: 꽝 55·구리 22·철 20·석영 3 / 버섯흙: 꽝 50·흙 20·철 25·빛버섯 5', r[0]==r[1]=='-55 stone25 copperOre18 ironOre2' and r[2]=='-55 copperOre22 ironOre20 crystal3' and r[3]=='-50 dirt20 ironOre25 glowcap5', str(r))
            rec('표','수정: 꽝 55·돌 15·석영 25·수정결정 5 / 용암: 꽝 55·돌 15·금광석 25·흑요석 5 / 얼음: 꽝 70·서리 결정 25·금광석 5 (합 100)', r[4]==r[5]=='-55 stone15 crystal25 cryGem5' and r[6]==r[7]=='-55 stone15 goldOre25 obsidian5' and r[8]==r[9]=='-70 frostShard25 goldOre5' and r[10], str(r))
            rec('표','지역 광석 아이콘: 구리·구리·철·석영·금·서리', r[11]=='copperOre,copperOre,ironOre,crystal,goldOre,frostShard', r[11])
            # 굴림: 표에 있는 것만, 확률은 표와 비슷 (4만 번, ±2%p — 6시그마 넘게 여유)
            r=await ev(pg,"()=>{const T=__T,N=40000,out={};for(const id of ['dirt','iceBlock']){const c={};for(let k=0;k<N;k++){const x=T.sieveRoll(id)||'-';c[x]=(c[x]||0)+1}out[id]=c}return out}")
            ok=set(r['dirt'])<= {'-','stone','copperOre','ironOre'} and set(r['iceBlock'])<={'-','frostShard','goldOre'}
            exp={'dirt':{'-':55,'stone':25,'copperOre':18,'ironOre':2},'iceBlock':{'-':70,'frostShard':25,'goldOre':5}}
            ok=ok and all(abs(r[m].get(k,0)/400-v)<2 for m in exp for k,v in exp[m].items())
            rec('굴림','하나마다 표대로 하나 (흙·얼음 덩이 4만 번이 표와 2%p 안)', ok, str(r))
            # 넣기: 30개까지, 가방 재료가 빠지고, 거르는 동안 다른 것은 못 넣음
            r=await ev(pg,"""()=>{const T=__T,G=T.G,i=__net();G.inv[12]={id:'dirt',c:40};G.inv[13]={id:'stone',c:5};const a=T.runCmd({k:'sievePut',o:i,id:'dirt',q:99});const o=G.objs.get(i),j=o.job;
              const b2=T.runCmd({k:'sievePut',o:i,id:'stone',q:5}),c=T.runCmd({k:'sievePut',o:i,id:'wood',q:1});return [a,j&&j.q,j&&j.per,j&&j.out,!!(j&&j.sv),T.countItem('dirt'),b2,c,T.countItem('stone'),T.jobDone(j)]}""")
            rec('넣기','흙 40개 중 30개를 넣음 (8초씩), 거르는 동안 돌은 못 넣음', r[1:6]==[30,8,'dirt',True,10] and r[6] is False and r[8]==5 and r[9]==0, str(r))
            # 10개 끝난 뒤 꺼내기: 표에 있는 것만 나오고 나머지 20개는 계속
            r=await ev(pg,"""()=>{const T=__T,G=T.G,i=T.idx(T.CX+6,T.CY+5),o=G.objs.get(i);o.job.t0-=8*10+.5;const s0=G.stats.sieved||0;const n=T.takeJob(o,G.p.x,G.p.y);
              const got=['stone','copperOre','ironOre'].reduce((a,id)=>a+T.countItem(id),0)-5;return [n,got,o.job&&o.job.q,T.jobDone(o.job),(G.stats.sieved||0)-s0,T.countItem('dirt'),(G.stats.made||{}).dirt||0]}""")
            rec('꺼내기','10개 다 된 뒤 꺼내면 10번 굴려 나온 것만 가방에, 남은 20개는 계속 (흙은 「만든 것」으로 안 셈)', r[0]==r[1] and 0<=r[0]<=10 and r[2:5]==[20,0,10] and r[5]==10 and r[6]==0, str(r))
            # 앞에서: 다 된 게 있으면 [꺼내기], 늘 [열기]
            r=await ev(pg,"""()=>{const T=__T,G=T.G,i=T.idx(T.CX+6,T.CY+5),o=G.objs.get(i);const a=T.decide().lbl;o.job.t0-=8*3;G.actCd=0;const d=T.decide();const s0=G.stats.sieved||0;T.perform(d);return [a,d.lbl,(G.stats.sieved||0)-s0,o.job&&o.job.q]}""")
            rec('세상','그물 앞: 거르는 중이면 [열기], 다 된 게 있으면 큰 버튼이 [꺼내기]', r==['열기','꺼내기',3,17], str(r))
            # 저장되고, 취소하면 다 된 것은 꺼내고 시작 안 한 재료는 돌려받음
            r=await ev(pg,"""()=>{const T=__T;T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const G=T.G,i=T.idx(T.CX+6,T.CY+5),o=G.objs.get(i);const a=[o.job&&o.job.q,o.job&&o.job.out,!!(o.job&&o.job.sv)];
              o.job.t0-=8*2;const d0=T.countItem('dirt'),s0=G.stats.sieved||0;T.cancelJob(o,G.p.x,G.p.y);return a.concat([T.countItem('dirt')-d0,(G.stats.sieved||0)-s0,!!o.job])}""")
            rec('저장·취소','넣어 둔 것은 저장되고, 취소하면 다 된 2개는 꺼내고 15개는 흙으로 돌려받음', r==[17,'dirt',True,15,2,False], str(r))
            # 거르는 중에 회수하면 그물과 남은 재료가 가방으로
            r=await ev(pg,"""()=>{const T=__T,G=T.G,i=T.idx(T.CX+6,T.CY+5),o=G.objs.get(i);G.inv[14]={id:'granite',c:12};T.runCmd({k:'sievePut',o:i,id:'granite',q:30});const q=o.job.q;G.objs.delete(i);T.returnObj(o,G.p.x,G.p.y);return [q,T.countItem('granite'),T.countItem('oreNet'),!!o.job]}""")
            rec('회수','화강암 12개(있는 만큼)를 넣고 바로 회수하면 그물·화강암 12개가 돌아옴', r==[12,12,1,False], str(r))
            # 창: 넣을 재료 목록(가방·가까운 상자) → 10개 넣기 → 거르는 중 카드 → 꺼내기
            await ev(pg,"()=>{const T=__T,G=T.G,i=__net();G.inv[12]={id:'gAsh',c:25};G.inv[13]={id:'iceBlock',c:4};G.inv[14]={id:'wood',c:9};G.actCd=0;T.perform(T.decide())}"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const P=__T.panel,t=document.querySelector('#sheet').innerText,bs=[...document.querySelectorAll('#sheet [data-a=svPut]')].map(b=>b.dataset.i+':'+b.dataset.q);return [P&&P.kind,t.includes('광석 그물'),t.includes('금광석 25%'),t.includes('흑요석 5%'),bs.join(',')]}")
            rec('창','앞에서 [열기] → 광석 그물 창: 가진 재료만, 나오는 것·확률, 10개·최대 버튼 (나무는 안 나옴)', r==['sieve',True,True,True,'gAsh:10,gAsh:25,iceBlock:4'], str(r))
            await pg.screenshot(path=SP+'ore_net.png')
            await ev(pg,"()=>document.querySelector('#sheet [data-a=svPut][data-i=gAsh][data-q=\"10\"]').click()"); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>{const T=__T,o=T.G.objs.get(T.panel.i),t=document.querySelector('#sheet').innerText;return [o.job&&o.job.q,T.countItem('gAsh'),!!document.querySelector('#sheet .jobcard'),t.includes('거르는 중')]}")
            rec('창','「10개 넣기」 → 재 10개가 들어가고 거르는 중 카드', r==[10,15,True,True], str(r))
            await ev(pg,"()=>{const o=__T.G.objs.get(__T.panel.i);o.job.t0-=8*4+.5}"); await pg.wait_for_timeout(700)
            r=await ev(pg,"()=>{const b=document.querySelector('#sheet [data-a=jobTake]');return [b&&b.textContent.trim(),b&&b.disabled,document.querySelector('#jobTxt').textContent]}")
            rec('창','창을 열어 둔 채로 진행 (4개 다 됨 → 꺼내기)', r[0]=='꺼내기' and r[1] is False and r[2].startswith('4/10'), str(r))
            await pg.screenshot(path=SP+'ore_net_job.png')
            await ev(pg,"()=>document.querySelector('#sheet [data-a=jobTake]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const T=__T,o=T.G.objs.get(T.panel.i);return [o.job&&o.job.q,T.jobDone(o.job)]}")
            rec('창','꺼내기 → 남은 6개 계속', r==[6,0], str(r))
            await ev(pg,"()=>{__T.closePanel();const T=__T,G=T.G;G.p.x=T.CX+6.5;G.p.y=T.CY+7}"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=SP+'ore_net_world.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_equipment_weapons():
    import asyncio, sys
    # 장비 메뉴·무기 (v42): 장비 칸, 주먹·도끼, 광물 화살 + 돌 채굴기 (v48: 무기 칸 없음 · 장비는 가방 안)
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,SPR,circuitTick,swingAttack,updatePShots,mkEnemy,curWeapon,wearItem,unwear,wearing,hitObj,hotClick,freshEquip,WTYPE,rarOf}")
    CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+4;y<T.CY+16;y++)for(let x=T.CX+4;x<T.CX+16;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i)}
  G.enemies.length=0;G.pshots.length=0;G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.mp=999;G.fish=null;G.inv.fill(null);G.sel=0;return [T.CX+8,T.CY+8]};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True); await ev(pg,"()=>{__T.G.rpg.lv=40}")  # v99: 착용 레벨이 있는 무기를 쓰므로
            await ev(pg,"()=>{"+CLEAR+"}")
            # ---- equipment slots (v48: no weapon slot, the equipment sits at the top of the bag) ----
            r=await ev(pg,"()=>{const G=__T.G;return [Object.keys(__T.freshEquip()).join(','),'weapon' in G.equip,G.inv.slice(0,9).some(s=>s&&s.id==='swordWood')]}")
            rec('장비 칸','5칸(상의·머리장식·목걸이·반지·하의 v100, v48: 무기 칸 없음), 새 게임의 나무 검은 단축칸', r==['body,head,neck,ring,legs',False,True], str(r))
            await ev(pg,"()=>__T.openPanel('stat')"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const s=document.querySelector('#sheet');return [s.querySelectorAll('[data-a=chSlot]').length,['상의','머리','목걸이','반지 1'].every(t=>s.innerText.includes(t)),!!document.querySelector('#bEquip')]}")
            rec('장비 메뉴','v83: 장비는 캐릭터 창 장비 탭 (칸 10개, 따로 있던 [장비] 버튼 없음)', r==[10,True,False], str(r))
            await pg.screenshot(path=SP+'equip.png')
            await ev(pg,"()=>__T.closePanel()")
            await pg.keyboard.press('KeyU'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const k=document.querySelector('#sheet [data-a=chSlot]')?1:0;__T.closePanel();return k}")
            rec('장비 메뉴','U 키로 캐릭터 창 장비 탭', r==1, r)
            # wear from the bag (bag button row), then take it off in the character window
            await ev(pg,"()=>{const G=__T.G;G.inv.fill(null);G.inv[12]={id:'obsCoat',c:1};__T.openPanel('inv')}"); await pg.wait_for_timeout(500)
            await ev(pg,"()=>document.querySelector('#sheet .slot[data-a=inv][data-i=\"12\"]').click()"); await pg.wait_for_timeout(300)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=wearOn]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const G=__T.G;return [G.equip.body&&G.equip.body.id,G.inv.filter(Boolean).length]}")
            rec('장비 칸','가방에서 옷을 골라 [입기] → 상의 칸', r==['obsCoat',0], str(r))
            await ev(pg,"()=>{__T.closePanel();__T.openPanel('stat')}"); await pg.wait_for_timeout(500)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=chSlot][data-i=body]').click()"); await pg.wait_for_timeout(300)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=eqSlot][data-i=body]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const G=__T.G;return [G.equip.body,G.inv.filter(Boolean).map(s=>s.id).join(',')]}")
            rec('장비 칸','캐릭터 창에서 상의 칸 → [벗기]면 가방으로', r==[None,'obsCoat'], str(r))
            await ev(pg,"()=>__T.closePanel()")
            # charms move to their own slots
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[10]={id:'turtleCharm',c:1};G.inv[11]={id:'snowBrooch',c:1};T.wearItem(10);T.wearItem(11);return [G.equip.neck&&G.equip.neck.id,G.equip.head&&G.equip.head.id,T.wearing('turtleCharm'),T.wearing('snowBrooch'),'acc' in G.equip]}")
            rec('장신구','거북 등껍질 부적 → 목걸이, 눈꽃 브로치 → 머리장식', r==['turtleCharm','snowBrooch',True,True,False], str(r))
            # ---- which weapon is used ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[12]={id:'swordIron',c:1};G.inv[0]={id:'berry',c:2};G.inv[1]={id:'spearWood',c:1};G.sel=0;const a=T.curWeapon().id;G.sel=1;const b2=T.curWeapon().id;
          G.inv[1].dur=0;const c=T.curWeapon().id;const d=T.curWeapon();return [a,b2,c,d.id,d.wt,d.dmg]}""")
            rec('무기','v65: 든 무기를 씀, 안 들거나 망가지면 마지막에 쓴 무기 → 가방 속 가장 센 무기', r==['swordIron','spearWood','swordIron','swordIron','sword',17], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.equip.weapon=null;const e=T.mkEnemy('slimeG',G.p.x+.9,G.p.y);e.hp=999;G.enemies.push(e);T.swingAttack();return [999-e.hp,G.swing&&G.swing.wt,!G.swing.icon]}""")
            rec('주먹','주먹 기본 공격 (공격력 3 안팎, 주먹 모션)', 2<=r[0]<=7 and r[1]=='fist' and r[2], str(r))
            await pg.wait_for_timeout(100); await pg.screenshot(path=SP+'fist.png')
            # ---- axes ----
            r=await ev(pg,"()=>{const T=__T;return ['axeStone','axeCopper','axeIron'].map(id=>{const it=T.ITEMS[id],rc=T.RECIPES.find(r=>r.out===id);return [it.kind,it.wt,rc&&rc.at,rc&&rc.cat]})}")
            rec('도끼','돌·구리·철 도끼 (v65: 도구 탭, 장비제작대)', r==[['axe',None,'smelter','tool']]*3, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();const t={x:x+1,y};const chop=w=>{G.inv[0]=w?{id:w,c:1}:null;G.sel=0;const o={t:'root'};G.objs.set(T.idx(t.x,t.y),o);T.hitObj(t,o);const d=o.dmg;G.objs.delete(T.idx(t.x,t.y));return d};
          G.inv[9]={id:'pickWood',c:1};const a=chop('swordWood'),b2=chop('axeStone');G.inv[0]={id:'axeCopper',c:1};const e=T.mkEnemy('slimeG',G.p.x+1.1,G.p.y);e.hp=999;G.enemies.push(e);T.swingAttack();return [a,b2,999-e.hp,G.swing.icon]}""")
            rec('도끼','도끼를 들면 나무를 1.6배 빨리 베요', abs(r[1]-r[0]*1.6)<1e-6 and r[0]>0, str(r))
            rec('도끼','도끼는 도구라 공격에 쓰지 않음 (v65, 주먹으로 침)', r[2]<=7 and r[3]!='axeCopper', str(r))
            # ---- arrows ----
            r=await ev(pg,"()=>{const T=__T;return ['arrowStone','arrowCopper','arrowIron','arrowCrystal','arrowGold'].map(id=>{const rc=T.RECIPES.find(r=>r.out===id);return [T.ITEMS[id].kind,rc&&rc.n,rc&&rc.at]})}")
            rec('화살','광물 화살 5종 (한 번에 10개, v61: 장비제작대)', r==[['arrow',10,'smelter']]*5, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowWood',c:1};G.sel=0;const shot=()=>{G.pshots.length=0;T.swingAttack();return G.pshots[0]};
          let plain=0;for(let k=0;k<40;k++)plain+=shot().dmg;const p0=shot();
          G.inv[12]={id:'arrowStone',c:5};G.inv[13]={id:'arrowIron',c:3};const s1=shot();const left=[T.countItem('arrowIron'),T.countItem('arrowStone')];
          G.inv[13]=null;G.inv[12]={id:'arrowIron',c:40};let iron=0;for(let k=0;k<40;k++)iron+=shot().dmg;
          G.inv[12]={id:'arrowCrystal',c:2};const cr=shot();G.inv[12]={id:'arrowGold',c:2};const gd=shot();G.inv[0]={id:'bowFrost',c:1};const gf=shot();
          return [p0.tip,s1.tip,left,iron/plain,cr.pierce,gd.fx,gf.fx,T.countItem('arrowGold')]}""")
            rec('화살','화살이 없으면 나무 화살(무한), 있으면 좋은 화살부터 한 발에 하나', r[0] is None and r[1]=='#d8e0ea' and r[2]==[2,5], str(r[:3]))
            rec('화살','철 화살은 피해 약 1.5배', 1.3<r[3]<1.7, str(r[3]))
            rec('화살','수정 화살은 적 하나를 꿰뚫고, 금 화살은 불꽃 (활 고유 효과가 먼저)', r[4]==1 and r[5]=='burn' and r[6]=='chill' and r[7]==0, str(r[4:]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowWood',c:1};G.sel=0;G.inv[12]={id:'arrowIron',c:3};const e=T.mkEnemy('slimeG',G.p.x+2.5,G.p.y);e.hp=999;G.enemies.push(e);T.swingAttack();for(let k=0;k<30;k++)T.updatePShots(1/60);return 999-e.hp}""")
            rec('화살','철 화살이 적에게 맞음', r>=4, r)
            await ev(pg,"()=>__T.openPanel('inv')"); await pg.wait_for_timeout(600)
            await ev(pg,"()=>document.querySelector('#sheet .slot[data-a=inv][data-i=\"0\"]').click()"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;__T.closePanel();return t.includes('화살: 철 화살 2개')}")
            rec('화살','가방에서 활을 누르면 쓸 화살과 개수 표시 (v48)', r, r)
            # ---- save / old saves ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip=T.freshEquip();G.equip.neck={id:'turtleCharm',c:1};G.equip.head={id:'snowBrooch',c:1};G.equip.body={id:'obsCoat',c:1};
          T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const E=T.G.equip;return [E.neck.id,E.head.id,E.body.id,E.ring,'weapon' in E]}""")
            rec('저장','장비 4칸 저장/불러오기', r==['turtleCharm','snowBrooch','obsCoat',None,False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.equip=T.freshEquip();const s=JSON.parse(JSON.stringify(T.serialize()));s.equip={body:{id:'frostRobe',c:1},acc:{id:'turtleCharm',c:1}};
          s.inv[0]={id:'spearCopper',c:1};s.inv[12]={id:'swordIron',c:1,dur:300};s.inv[13]={id:'swordWood',c:1};T.deserialize(s);const G2=T.G,E=G2.equip;
          return [E.neck&&E.neck.id,E.body&&E.body.id,E.head,'acc' in E,'weapon' in E,G2.inv.filter(Boolean).map(x=>x.id).sort().join(',')]}""")
            rec('옛 세이브','v41 세이브: 장신구 칸 → 목걸이, 무기는 가방에 그대로', r==['turtleCharm','frostRobe',None,False,False,'spearCopper,swordIron,swordWood'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(T.serialize()));s.equip={body:null,acc:{id:'snowBrooch',c:1}};T.deserialize(s);const E=T.G.equip;return [E.head&&E.head.id,E.neck]}""")
            rec('옛 세이브','눈꽃 브로치 → 머리장식', r==['snowBrooch',None], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(T.serialize()));delete s.equip;s.inv[3]={id:'swordCopper',c:1};T.deserialize(s);const E=T.G.equip;return [Object.keys(E).join(','),T.countItem('swordCopper')]}""")
            rec('옛 세이브','v36 이전(장비 칸 없음) 세이브도 정상', r==['body,head,neck,ring,legs',1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(T.serialize()));s.equip={weapon:{id:'bowIron',c:1,dur:77}};T.deserialize(s);const k=T.G.inv.findIndex(x=>x&&x.id==='bowIron');return [k,T.G.inv[k].dur]}""")
            rec('옛 세이브','v42~v47 세이브: 무기 칸의 무기는 단축칸으로 (내구도 유지)', r==[0,77], str(r))
            await pg.wait_for_timeout(1900)
            r=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('옛 세이브','불러올 때 안내 알림', '단축칸' in r and '사냥꾼의 활' in r, r[:90])
            # ---- stone drill ----
            r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(r=>r.out==='drillStone');return [rc&&rc.at,rc&&rc.cat,rc&&rc.req.map(x=>x[0]).join(','),!!T.SPR.obj.drillStoneU,!!T.SPR.obj.drillStoneR]}")
            rec('돌 채굴기','돌 채굴기는 제작법 없음 (v113: 놓인 것은 그대로 동작), 방향별 그림', r==[None,None,None,True,True], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;const [x,y]=__clear();G.objs.set(T.idx(x+2,y),{t:'drillStone',dir:{x:1,y:0}});G.wall[T.idx(x+3,y)]=2;G.p.x=x+.5}")
            r=await ev(pg,"()=>{const T=__T,G=T.G,x=T.CX+8,y=T.CY+8,o=G.objs.get(T.idx(x+2,y));T.circuitTick(9);return [o.work,o.why,(o.store||[]).length]}")
            rec('돌 채굴기','빛이 없으면 멈춤', r==[False,'power',0], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G,x=T.CX+8,y=T.CY+8;G.wire.set(T.idx(x+2,y+1),1);G.objs.set(T.idx(x+2,y+2),{t:'battery',e:600})}")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8,o=G.objs.get(T.idx(x+2,y));T.circuitTick(5);const a=[o.work,(o.store||[]).length];T.circuitTick(3.5);const b2=(o.store||[]).map(s=>s.id+':'+s.c).join(',');
          G.wall[T.idx(x+3,y)]=1;o.prog=0;T.circuitTick(9);const c=(o.store||[]).map(s=>s.id+':'+s.c).join(',');
          G.wall[T.idx(x+3,y)]=4;T.circuitTick(1);const d=[o.work,o.why];G.wall[T.idx(x+3,y)]=5;T.circuitTick(1);const e=[o.work,o.why];return [a,b2,c,d,e]}""")
            rec('돌 채굴기','빛이 들어오면 8초마다 돌벽에서 돌, 흙벽에서 흙', r[0]==[True,0] and r[1]=='stone:1' and r[2]=='stone:1,dirt:1', str(r[:3]))
            rec('돌 채굴기','구리·철 광맥은 못 캠 (지형만)', r[3]==[False,'tier'] and r[4]==[False,'tier'], str(r[3:]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8;G.p.x=x+1.5;G.p.y=y+.5;G.p.face={x:1,y:0};G.sel=8;G.inv[8]=null;const d=T.decide();return [d.k,d.lbl]}""")
            await tap(pg,1); await pg.wait_for_timeout(200)
            r2=await ev(pg,"()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8,o=G.objs.get(T.idx(x+2,y));return [T.countItem('stone'),T.countItem('dirt'),(o.store||[]).length]}")
            rec('돌 채굴기','앞에서 누르면 캔 것을 꺼냄', r==['use','꺼내기'] and r2==[1,1,0], str([r,r2]))
            r=await ev(pg,"()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8,o=G.objs.get(T.idx(x+2,y));G.wall[T.idx(x+3,y)]=4;T.circuitTick(1);G.p.x=x+1.5;G.p.face={x:1,y:0};return 1}")
            await pg.wait_for_timeout(2300)  # same-key toasts are held back for 2.2s
            await tap(pg,1); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('돌 채굴기','못 캐는 벽 안내', '(지형)만' in r, r[-60:])
            await ev(pg,"()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8;G.wall[T.idx(x+3,y)]=2;G.objs.get(T.idx(x+2,y)).work=true;G.p.x=x+.5;G.p.y=y+1.5}"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SP+'drill.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_weapons_skills():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,give:(id)=>{const i=G.inv.findIndex((s,k)=>k<9&&!s);G.inv[i]={id,c:1};if(DUR[id])G.inv[i].dur=DUR[id][0];invDirty=true},GUIDE,RECIPES,nearStations,canCraft,checkGuide,gainXp,maxHp,maxMp,useSkill,SKILLS,XP_NEED,WTYPE,curWeapon,perform,swingAttack,doAttack,targetTile,canPlace:typeof canPlace!=='undefined'?canPlace:null}")
    ARENA="()=>{const G=__T.G;for(let y=100;y<120;y++)for(let x=100;x<122;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.enemies.length=0;G.p.x=105.5;G.p.y=110.5;G.p.face={x:1,y:0};G.p.dir='side';G.p.hp=__T.maxHp();G.p.mp=__T.maxMp();for(let i=0;i<30;i++)G.inv[i]=null;G.sel=0}"
    EN="(x,y,hp)=>{__T.G.enemies.push({k:'slimeG',x,y,hp:hp||999,vx:0,vy:0,t:99,hurt:0,kx:0,ky:0,z:0,air:0,airMax:.42,land:0,cd:99,anim:0})}"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True); await ev(pg,"()=>{__T.G.rpg.lv=40}")  # v99: 착용 레벨이 있는 무기를 쓰므로
            # ---- quest order ----
            r=await ev(pg,"()=>{const G=__T.G;Object.assign(G.stats,{naruMet:1,wood:6,bench:1,torch:1,copperOre:6,copperBar:1,forge:1,callSeen:{bar:1,pick:1}});__T.addItem('pickCopper',1);G.guide=0;__T.checkGuide();const a=document.querySelector('#goalTxt').textContent;G.bossDead.queen=true;__T.checkGuide();const b=document.querySelector('#goalTxt').textContent;return [a,b]}")
            rec('퀘스트','버섯 여왕이 먼저', '버섯 여왕' in r[0], r[0]); rec('퀘스트','여왕 다음 말랑대왕', '말랑대왕' in r[1], r[1])
            r=await ev(pg,"()=>{const G=__T.G;G.bossDead.queen=false;G.bossDead.slime=true;const s=__T.serialize();s.guide=8;__T.deserialize(s);__T.checkGuide();return document.querySelector('#goalTxt').textContent}")
            rec('퀘스트','예전 세이브(말랑대왕만 잡음)도 여왕부터 안내', '버섯 여왕' in r, r)
            r=await ev(pg,"()=>{const G=__T.G;Object.assign(G.stats,{forge:0});for(let i=0;i<30;i++)G.inv[i]=null;G.tools=[];G.bossDead.slime=false;G.guide=0;__T.checkGuide();return document.querySelector('#goalTxt').textContent}")
            rec('퀘스트','구리 작업대 단계 (v60: 작업대 올리기)', '구리 작업대' in r, r)
            r=await ev(pg,"()=>[__T.BOSSES.queen.hp,__T.BOSSES.slime.hp]")
            rec('퀘스트','난이도: 여왕 < 대왕', r[0]<r[1], str(r))
            # ---- workbench tier & recipes ----
            r=await ev(pg,"()=>{const at=id=>{const r=__T.RECIPES.find(q=>q.out===id);return !r?'-':(r.at||null)+(r.at==='bench'||r.at==='smelter'?':'+r.tier:'')};return [at('pickCopper'),at('swordIron'),at('pot'),at('shovel'),at('chest'),at('furnace'),at('forge'),at('torch'),at('rope'),at('spearWood'),at('copperLamp')]}")
            rec('제작대','구리 이상은 구리·철 단계 (v60 작업대, v61 장비는 장비제작대)', r[:4]==['smelter:1','smelter:2','bench:1','smelter:1'] and r[10]=='bench:1', str(r))
            rec('제작대','초기 제작은 그대로 (작업대/손)', r[4:10]==['bench:0','bench:0','-','null','null','smelter:0'], str(r))
            r=await ev(pg,"()=>{const metal=['copperBar','ironBar','crystal'];return __T.RECIPES.filter(r=>r.at==='bench'&&!r.tier&&r.req.some(([i])=>metal.includes(i))).map(r=>r.out)}")
            rec('제작대','작업대에 구리·철·수정 레시피가 남지 않음', r==[], str(r))
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;['copperBar','wood','rope'].forEach(i=>__T.addItem(i,20));G.objs.set(__T.idx(107,110),{t:'bench'});const R=__T.RECIPES.find(r=>r.out==='pickCopper');__T.openPanel('craft',{st:'bench'});const a=__T.canCraft(R,__T.nearStations());G.objs.set(__T.idx(107,112),{t:'smelter',lv:1});__T.closePanel();__T.openPanel('craft',{st:'smelter',i:__T.idx(107,112)});const b=__T.canCraft(R,__T.nearStations());__T.closePanel();return [a,b]}")
            rec('제작대','작업대에서는 구리 곡괭이 불가, 구리 장비제작대에서 가능 (v61)', r==[False,True], str(r))
            r=await ev(pg,"()=>{const n=r=>r.req.length;const f=id=>n(__T.RECIPES.find(r=>r.out===id));return [f('pickCopper'),f('swordCopper'),f('chest'),f('bed'),f('rod')]}")
            rec('재료','레시피 재료 종류가 늘어남', all(x>=2 for x in r) and r[0]>=3 and r[2]>=2, str(r))
            r=await ev(pg,"()=>[__T.OBJ.root.drops.some(d=>d[0]==='resin'),!!__T.ITEMS.rope,!!__T.ITEMS.resin]")
            rec('재료','송진(뿌리기둥) · 이끼 끈 추가', r==[True,True,True], str(r))
            # open the forge and look at the weapon tab
            await ev(pg,"()=>{__T.G.p.face={x:0,y:1};__T.G.p.x=107.5;__T.G.p.y=111.5}"); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>__T.decide().k"); rec('제작대','구리 장비제작대 앞에서 열기', r=='open', r)
            await tap(pg,1); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>document.querySelector('.sh-head h2').textContent"); rec('제작대','구리 장비제작대 창이 열림', '구리 장비제작대' in r, r)
            await pg.screenshot(path=SP+'forge.png')
            await pg.tap('[data-a=tab][data-i=weapon]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[...document.querySelectorAll('.rc .rn')].map(e=>e.childNodes[0].textContent)")
            rec('무기','무기 탭에 여러 종류', all(any(k in x for x in r) for k in ['창','망치','활','지팡이','단검','검']), ','.join(r))
            await pg.screenshot(path=SP+'weapons.png')
            await ev(pg,"()=>__T.closePanel()")
            # ---- weapons ----
            await ev(pg,ARENA); await ev(pg,"()=>{__T.give('spearWood');__T.give('swordWood');__T.G.sel=0}")
            await ev(pg,"()=>{const f="+EN+";f(107.5,110.5)}")
            # 점검하는 순간 다른 몬스터를 비워요 (사이에 프레임이 돌며 새로 생긴 몬스터가 더 가까우면 그쪽을 쳐서 가끔 실패했어요)
            r=await ev(pg,"()=>{const f="+EN+";const G=__T.G;G.enemies.length=0;f(107.5,110.5);const e=G.enemies[0];const h0=e.hp;G.sel=0;__T.doAttack();const a=h0-e.hp;G.enemies.length=0;f(107.5,110.5);const e2=G.enemies[0];G.sel=1;__T.doAttack();return [a>0,999-e2.hp]}")
            rec('무기','창은 2칸 떨어진 적도 공격, 검은 닿지 않음 (공격 버튼, v65)', r==[True,0], str(r))
            # 적을 놓은 뒤 몇 프레임 사이에 적이 움직여 창 끝에서 벗어나는 일이 있어서, 같은 자리에 다시 놓고 바로 찔러요
            r=await ev(pg,"()=>{const f="+EN+";__T.G.enemies.length=0;f(107.5,110.5);__T.G.sel=0;const e=__T.G.enemies[0];const h=e.hp;__T.doAttack();return [h-e.hp>0, __T.G.swing&&__T.G.swing.wt]}")
            rec('무기','창 찌르기 명중', r[0] and r[1]=='spear', str(r))
            await ev(pg,ARENA); await ev(pg,"()=>{__T.give('bowWood');__T.G.sel=0;const f="+EN+";f(110.5,110.5)}")
            r=await ev(pg,"()=>{const G=__T.G;G.p.face={x:0,y:1};__T.doAttack();return [G.pshots.length,G.p.face.x,G.p.face.y]}")
            rec('무기','활: 5칸 떨어진 적을 자동 조준해 쏘기 (화살이 날아감)', r==[1,1,0], str(r))
            await wait_until(pg,"()=>__T.G.pshots.length===0",5000)  # 화살이 날아가 사라질 때까지 (실제 0.7초로 기다리면 바쁠 때 아직 날아가는 중이었어요)
            r=await ev(pg,"()=>[__T.G.enemies[0].hp<999, __T.G.pshots.length]")
            rec('무기','화살이 적에게 맞음', r[0] and r[1]==0, str(r))
            await ev(pg,ARENA); await ev(pg,"()=>{__T.G.wall[__T.idx(108,110)]=2;__T.give('bowWood');__T.G.sel=0;const f="+EN+";f(111.5,110.5)}")
            r=await ev(pg,"()=>{const G=__T.G;G.p.face={x:0,y:-1};__T.doAttack();return [G.p.face.x,G.p.face.y]}"); rec('무기','벽 너머 적은 자동 조준 안 함 (보던 방향 그대로)', r==[0,-1], str(r))
            await ev(pg,ARENA); await ev(pg,"()=>{__T.give('staffGlow');__T.G.sel=0;const f="+EN+";f(109.5,110.5);f(111,110.5)}")
            r=await ev(pg,"()=>{__T.G.pshots.length=0;const m=__T.G.p.mp;__T.doAttack();return [m-__T.G.p.mp,__T.G.pshots[0]&&__T.G.pshots[0].pierce]}")
            rec('무기','지팡이: 기력 4 소모, 관통 구슬', r[0]>3.9 and r[1]==1, str(r))
            await wait_until(pg,"()=>__T.G.pshots.length===0",5000)  # 구슬이 다 날아갈 때까지 (실제 0.9초로 기다리면 바쁠 때 둘째 적에 아직 안 닿았어요)
            r=await ev(pg,"()=>__T.G.enemies.map(e=>e.hp<999)"); rec('무기','구슬이 두 적을 꿰뚫음', len(r)>=2 and all(r), str(r))
            await ev(pg,ARENA); await ev(pg,"()=>{__T.give('hammerCopper');__T.G.sel=0}")
            # 적 놓기와 휘두르기를 한 번에 (사이에 프레임이 돌면 적이 움직이거나 새 몬스터가 생겨 가끔 실패했어요)
            r=await ev(pg,"()=>{const f="+EN+";const G=__T.G;G.enemies.length=0;f(106.3,110.5);f(105.5,111.4);const es=G.enemies.slice();__T.doAttack();return es.map(e=>e.hp<999)}")
            rec('무기','망치: 넓게 휘둘러 두 적 모두 맞힘', r==[True,True], str(r))
            r=await ev(pg,"()=>{__T.G.inv[0]=null;__T.give('spearIron');for(let i=0;i<6;i++)if(!__T.G.inv[i]){__T.G.sel=i;break}const a=__T.curWeapon().id;const G=__T.G;for(let i=0;i<G.inv.length;i++)if(G.inv[i]&&__T.ITEMS[G.inv[i].id].kind==='sword')G.inv[i]=null;return [a,__T.curWeapon().id]}")
            rec('무기','아무것도 안 들면 마지막에 쓴 무기 → 없으면 가방 속 가장 센 무기 → 없으면 주먹 (v65)', r==['spearIron','hand'], str(r))
            # ---- level & stats ----
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;G.rpg.lv=1;G.rpg.xp=0;G.rpg.pts=0;G.rpg.sp=0;G.p.hp=40;__T.gainXp(25);return [G.rpg.lv,G.rpg.pts,G.rpg.sp,G.p.hp===__T.maxHp(),G.rpg.xp]}")
            rec('레벨','경험치 25 → Lv.2, 포인트 2·스킬 1, 체력 회복', r==[2,2,1,True,5], str(r))
            r=await ev(pg,"()=>{const G=__T.G,x=G.rpg.xp;const f="+EN+";f(106.3,110.5,1);__T.give('swordWood');__T.perform({k:'swing'});return [G.enemies.length,G.rpg.xp-x]}")
            rec('레벨','몬스터를 물리치면 경험치', r[1]>0, str(r))
            await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>document.querySelector('#bStat').classList.contains('dot')"); rec('능력','포인트가 있으면 능력 버튼에 점', r, r)
            await pg.tap('#bStat'); await pg.wait_for_timeout(600)
            await pg.tap('#sheet [data-a=chTab][data-i=sk]'); await pg.wait_for_timeout(200) # v83: 스킬 탭
            await pg.tap('[data-a=statUp][data-i=vit]'); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>[__T.G.rpg.vit,__T.maxHp(),__T.G.rpg.pts]"); rec('능력','체력 +1 → 최대 체력 108', r==[1,108,1], str(r))
            r=await ev(pg,"()=>document.querySelector('[data-a=skUp][data-i=spin]').disabled"); rec('능력','레벨이 모자란 스킬은 못 배움', r, r)
            await pg.tap('[data-a=skUp][data-i=dash]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.G.rpg.sk.dash,__T.G.rpg.slot[0],__T.G.rpg.sp]"); rec('스킬','구르기 배우면 첫 칸에 자동으로', r==[1,'dash',0], str(r))
            await pg.screenshot(path=SP+'stat.png')
            await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>!document.querySelector('#skBar').hidden"); rec('스킬','스킬 버튼이 나타남', r, r)
            r=await ev(pg,"()=>{const G=__T.G,x=G.p.x,m=G.p.mp;G.p.face={x:1,y:0};__T.useSkill(0);return [!!G.p.dash,m-G.p.mp,G.p.inv>0.3]}")
            rec('스킬','구르기: 이동·기력 소모·무적', r==[True,10,True], str(r))
            await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>[__T.G.p.x>107,__T.G.skcd.dash>0]"); rec('스킬','구르기로 앞으로 이동, 재사용 대기', r==[True,True], str(r))
            await pg.screenshot(path=SP+'skbar.png')
            r=await ev(pg,"()=>{const m=__T.G.p.mp;__T.useSkill(0);return __T.G.p.mp===m}"); rec('스킬','대기 중엔 다시 안 써짐', r, r)
            # quake & heal
            r=await ev(pg,"()=>{const G=__T.G;G.rpg.lv=6;G.rpg.sk.quake=1;G.rpg.sk.heal=1;G.rpg.slot=['quake','heal'];G.skcd={};G.p.x=105.5;G.p.y=110.5;G.p.face={x:1,y:0};for(let y=109;y<=111;y++)for(let x=107;x<=109;x++)G.wall[__T.idx(x,y)]=1;__T.addItem('pickWood',1);G.p.mp=__T.maxMp();__T.useSkill(0);let n=0;for(let y=109;y<=111;y++)for(let x=107;x<=109;x++)n+=G.wall[__T.idx(x,y)]?1:0;return n}")
            rec('스킬','광맥 부수기: 앞쪽 벽 여러 칸이 한 번에', r<=3, f'남은 벽 {r}/9')
            r=await ev(pg,"()=>{const G=__T.G;G.p.hp=30;G.p.mp=__T.maxMp();__T.useSkill(1);return G.p.hp>30}"); rec('스킬','등불 치유로 체력 회복', r, r)
            # passives
            r=await ev(pg,"()=>{const G=__T.G;G.rpg.sk.tough=3;G.p.hp=100;G.p.inv=0;G.p.dead=0;const e={x:G.p.x+.2,y:G.p.y};const h=G.p.hp;__T.G.enemies.length=0;return h}")
            # save round trip
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);const R=__T.G.rpg;return [R.lv,R.vit,R.sk.dash,R.slot[0]]}")
            rec('저장','레벨·능력치·스킬이 저장됨', r==[6,1,1,'quake'], str(r))
            r=await ev(pg,"()=>{const s=__T.serialize();delete s.rpg;__T.deserialize(s);return [__T.G.rpg.lv,__T.maxHp()]}")
            rec('저장','예전 세이브는 Lv.1로 시작', r==[1,100], str(r))
            # layout with skill buttons on several screens
            await ev(pg,"()=>{const G=__T.G;G.rpg.sk.dash=1;G.rpg.sk.spin=1;G.rpg.slot=['dash','spin']}")
            rec('기능','콘솔 오류 없음 (모바일)', not errs, errs[:3]); await ctx.close()
            for (w,h,touch,name) in [(390,844,True,'iPhone 14'),(360,640,True,'small Android'),(375,667,True,'iPhone SE'),(844,390,True,'phone landscape'),(1280,800,False,'laptop'),(1024,768,False,'small desktop')]:
                ctx,pg,errs=await new_ctx(b,w,h,touch)
                await ev(pg,"()=>{const G=__T.G;G.rpg.sk.dash=1;G.rpg.sk.spin=1;G.rpg.slot=['dash','spin'];G.rpg.pts=2}")
                if touch: await ev(pg,"()=>document.body.classList.add('touch')")
                await ev(pg,"()=>{const G=__T.G;G.objs.set(__T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1),{t:'chair'});G.p.face={x:0,y:1}}")
                await pg.wait_for_timeout(500)
                r=await ev(pg,"""()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const cs=getComputedStyle(e);if(e.hidden||cs.display==='none')return null;const r=e.getBoundingClientRect();return r.width?{x:r.left,y:r.top,r:r.right,b:r.bottom}:null};
              const E={sk:q('#skBar'),act:q('#actBtn'),sub:q('#subBtn'),hot:q('#hotbar'),bars:q('#hud .stat'),side:q('#hud .side'),joy:q('#joy'),hint:q('#pcHint')};const ov=(a,b)=>a&&b&&a.x<b.r-1&&b.x<a.r-1&&a.y<b.b-1&&b.y<a.b-1;
              const bad=Object.keys(E).filter(k=>k!=='sk'&&ov(E.sk,E[k]));const out=E.sk&&(E.sk.x<0||E.sk.y<0||E.sk.r>innerWidth||E.sk.b>innerHeight);const sideOut=E.side&&(E.side.b>innerHeight||E.side.r>innerWidth);return [!!E.sk,bad,!!out,!!sideOut,!!(E.bars&&E.side&&ov(E.bars,E.side))]}""")
                rec('레이아웃',f'{name} 스킬 버튼 겹침 없음', r[0] and not r[1] and not r[2], str(r))
                rec('레이아웃',f'{name} 능력 버튼 포함 사이드 메뉴가 화면 안', not r[3] and not r[4], str(r))
                await pg.screenshot(path=SP+f'layout_{w}x{h}.png')
                rec('기능',f'{name} 콘솔 오류 없음', not errs, errs[:3]); await ctx.close()
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_materials_upgrades():
    import asyncio, sys
    # 재료·강화 (v43): 화강암·석영·수정결정, 정제 석영, 지역 재료, 용광로(강화·분해), 장비 강화, 반지, 지역 난이도
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,SPR,WALLS,STN,breakWall,hitObj,freshBoss,hitBoss,upgCost,upgText,ringV,meleeMul,mineMul,hurtPlayer,gainXp,regionEnemy,mkEnemy,curWeapon,bestPick,salvGet2,envTick,circuitTick,quartzAt,maxMp,rarOf}")
    CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+4;y<T.CY+16;y++)for(let x=T.CX+4;x<T.CX+16;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i)}
  G.enemies.length=0;G.drops.length=0;G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.hp=100;G.p.inv=0;G.fish=null;G.inv.fill(null);G.sel=0;G.buffs=[];return [T.CX+8,T.CY+8]};
  window.__drops=()=>{const m={};for(const d of __T.G.drops)m[d.id]=(m[d.id]||0)+d.c;__T.G.drops.length=0;return m};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+CLEAR+"}")
            # ---- crystal cave materials ----
            r=await ev(pg,"""()=>{const T=__T,I=T.ITEMS,W=T.WALLS,q=T.RECIPES.find(r=>r.out==='quartzR');return [I.crystal.n,W[3].n,W[3].drop[0][0],W[13].n,W[13].drop.map(d=>d[0]).join(','),I.granite.kind,I.granite.wall,q&&q.at,q&&JSON.stringify(q.req),I.cryGem.n,I.quartzR.n]}""")
            rec('재료','수정 조각 → 석영, 수정벽 → 화강암 벽, 새 석영 광맥, 정제 석영(용광로(v58 전 화로): 석영 2), 수정결정', r==['석영','화강암 벽','granite','석영 광맥','crystal,granite','wall',3,'furnace','[["crystal",2]]','수정결정','정제 석영'], str(r))
            r=await ev(pg,"()=>{const G=__T.G;let g=0,q=0,qOut=0;for(let i=0;i<G.wall.length;i++){if(G.wall[i]===3)g++;if(G.wall[i]===13){q++;if(G.biome[i]!==2)qOut++}}return [g,q,qOut,G.stats.qv]}")
            rec('재료','새 세계: 수정 동굴 화강암 사이에 석영 광맥', r[0]>200 and r[1]>20 and r[2]==0 and r[3]==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();const out=[];for(const w of [3,13,9,11]){G.wall[T.idx(x+2,y)]=w;T.breakWall(x+2,y);out.push(Object.keys(__drops()).sort().join('+'))}return out}""")
            rec('재료','화강암 벽 → 화강암, 석영 광맥 → 석영(+화강암 가끔), 현무암벽 → 현무암, 얼음벽 → 얼음 덩이', r[0]=='granite' and 'crystal' in r[1] and r[2].startswith('basalt') and 'iceBlock' in r[3], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;for(let k=0;k<400;k++)T.OBJ.cluster.dropFn(0,0);const m=__drops();return [m.cryGem||0,m.crystal||0]}""")
            rec('재료','수정 결정 → 수정결정 1개(약 35%) 아니면 석영 1개', r[0]+r[1]==400 and 100<r[0]<180, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.inv[9]={id:'pickIron',c:1};G.objs.set(T.idx(x+1,y),{t:'cluster'});const o=G.objs.get(T.idx(x+1,y));for(let k=0;k<6&&G.objs.get(T.idx(x+1,y));k++)T.hitObj({x:x+1,y},o);const m=__drops();return [(m.cryGem||0)+(m.crystal||0),!G.objs.get(T.idx(x+1,y))]}""")
            rec('재료','수정 결정을 캐면 결정/석영 딱 1개', r==[1,True], str(r))
            # v66 (BF-07): the crystal cluster needs an iron pickaxe or better
            r=await ev(pg,"""()=>{const T=__T,G=T.G,keep=G.tools,out=[];for(const id of ['pickWood','pickCopper','pickIron','pickCrystal']){const [x,y]=__clear();G.tools=[];G.inv[9]={id,c:1};const i=T.idx(x+1,y);G.objs.set(i,{t:'cluster'});const o=G.objs.get(i);for(let k=0;k<8&&G.objs.get(i);k++)T.hitObj({x:x+1,y},o);out.push(!G.objs.get(i))}G.tools=keep;G.inv[9]=null;__drops();return [out,T.OBJ.cluster.tier]}""")
            rec('재료','수정 결정은 철 곡괭이 이상만 캐짐 (나무·구리 ✗, 철·수정 ✓)', r==[[False,False,True,True],2], str(r))
            r=await ev(pg,"""()=>{const T=__T,f=id=>{const r=T.RECIPES.find(q=>q.out===id);return r.at+':'+r.req.map(x=>x[0]).join(',')};return ['swordCrystal','staffCrystal','bowCrystal','pickCrystal','swordDawn','arrowCrystal','lampCrystal'].map(f)}""")
            rec('재료','수정 무기·상위 도구는 정제 석영+수정결정 (석영만으로는 못 만듦)', r[0]=='smelter:quartzR,cryGem,ironBar' and all('quartzR' in x for x in r[:6]) and 'cryGem' in r[6] and not any(',crystal' in x or ':crystal' in x for x in r[:6]), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=G.bosses.golem;Object.assign(b,T.freshBoss('golem'));b.st='fight';G.bossDead.golem=false;G.drops.length=0;T.hitBoss(b,999999,false);const m=__drops();return [m.crystal||0,m.cryGem||0]}""")
            rec('재료','수정골렘 보상: 석영 8 + 수정결정 3', r==[8,3], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.inv[0]={id:'granite',c:5};G.sel=0;G.p.face={x:1,y:0};const d=T.decide();return [d.k,d.lbl,T.ITEMS.granite.n]}""")
            await tap(pg,1); await pg.wait_for_timeout(200)
            r2=await ev(pg,"()=>{const T=__T,G=T.G;return [G.wall[T.idx(T.CX+9,T.CY+8)],T.countItem('granite')]}")
            rec('재료','화강암을 들고 쌓으면 화강암 벽', r[:2]==['place','쌓기'] and r2==[3,4], str([r,r2]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.wire.set(T.idx(x+2,y+1),1);G.objs.set(T.idx(x+2,y+2),{t:'battery',e:600});const o={t:'drillStone',dir:{x:1,y:0}};G.objs.set(T.idx(x+2,y),o);G.wall[T.idx(x+3,y)]=3;T.circuitTick(8.5);const a=(o.store||[]).map(s=>s.id).join(',');
          G.wall[T.idx(x+3,y)]=13;T.circuitTick(.2);const why=o.why;G.objs.delete(T.idx(x+2,y));const o2={t:'drillFe',dir:{x:1,y:0}};G.objs.set(T.idx(x+2,y),o2);T.circuitTick(7.2);return [a,why,(o2.store||[]).map(s=>s.id).join(',')]}""")
            rec('재료','돌 채굴기는 화강암 벽(지형)도, 석영 광맥은 철 채굴기로', r==['granite','tier','crystal'], str(r))
            # old save: crystal cave gets quartz veins once
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();let n0=0;for(let i=0;i<G.wall.length;i++)if(G.wall[i]===13){G.wall[i]=3;n0++}delete G.stats.qv;const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G;let n1=0;for(let i=0;i<G2.wall.length;i++)if(G2.wall[i]===13)n1++;
          const s2=JSON.parse(JSON.stringify(T.serialize()));let built=0;const k=G2.wall.indexOf(13);G2.wall[k]=3;const s3=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s3);return [n0,n1,T.G.stats.qv,T.G.wall[k]]}""")
            rec('옛 세이브','v42 세이브: 수정 동굴 화강암 일부가 석영 광맥으로 (한 번만)', r[0]>20 and r[1]==r[0] and r[2]==1 and r[3]==3, str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(__T.serialize()));s.inv[3]={id:'crystal',c:42};__T.deserialize(s);return [__T.countItem('crystal'),__T.ITEMS.crystal.n]}")
            rec('옛 세이브','가방의 수정 조각은 그대로 석영이 됨', r==[42,'석영'], str(r))
            # ---- smelter: upgrades ----
            r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(r=>r.out==='smelter');return [rc.at,rc.cat,T.STN.smelter,!!T.SPR.obj.smelter]}")
            rec('용광로','작업대에서 나무·돌로 만드는 「장비제작대」 (v58: 옛 용광로)', r==['bench','furn','장비제작대',True], str(r))
            await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.objs.set(T.idx(x,y+1),{t:'smelter'});G.inv[0]={id:'swordCopper',c:1,dur:200};G.sel=0;G.inv[9]={id:'copperBar',c:20};G.inv[10]={id:'glowcap',c:6};T.openPanel('craft',{st:'smelter'})}"""); await pg.wait_for_timeout(500)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=tab][data-i=upg]').click()"); await pg.wait_for_timeout(300)  # v61: 제작 is the first tab
            r=await ev(pg,"()=>[...document.querySelectorAll('#sheet [data-a=tab]')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(',')")
            rec('용광로','장비제작대 탭: 제작·수리·분해·강화 (v61)', r.startswith('제작,수리,분해,강화*'), r)
            d0=await ev(pg,"()=>__T.curWeapon().dmg")
            await pg.click('#sheet [data-a=upg][data-i="0"]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const T=__T,G=T.G;return [G.inv[0].lv,T.countItem('copperBar'),+(T.curWeapon().dmg).toFixed(2),G.inv[0].dur,document.querySelector('#toasts').innerText.includes('+1')]}")
            rec('강화','든 구리 검 +1: 구리괴 2개, 공격력 +8%, 내구도 그대로', r[0]==1 and r[1]==18 and abs(r[2]-11*1.08)<1e-6 and r[3]==200 and r[4] and d0==11, str([d0]+r))
            for _ in range(4):
                await ev(pg,"()=>{document.querySelector('#sheet [data-a=upg][data-i=\"0\"]').click()}"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>{const T=__T,G=T.G;const b=document.querySelector('#sheet [data-a=upg][data-i=\"0\"]');return [G.inv[0].lv,T.countItem('copperBar'),T.countItem('glowcap'),b.disabled,b.textContent,Math.round(T.curWeapon().dmg*100)/100]}")
            rec('강화','+5가 최고 (구리괴 2·4·6·8·10, 빛버섯 2·4·6 → 재료가 모자라면 멈춤)', r[0]==4 and r[1]==0 and r[2]==0 and r[3], str(r))
            r=await ev(pg,"()=>{const T=__T;return [JSON.stringify(T.upgCost('swordCopper',2)),JSON.stringify(T.upgCost('swordCrystal',3)),JSON.stringify(T.upgCost('obsCoat',0)),JSON.stringify(T.upgCost('ringFe',4))]}")
            rec('강화','재료는 장비 등급별 (일반 구리괴 · 고급 철괴 · 희귀 정제 석영 · 영웅 이상 금괴), +3부터 빛버섯/수정결정', r==['[["copperBar",6],["glowcap",2]]','[["quartzR",8],["cryGem",2]]','[["goldBar",2]]','[["ironBar",10],["glowcap",6]]'], str(r))
            await ev(pg,"()=>{const G=__T.G;G.inv[0].lv=5;G.inv[9]={id:'copperBar',c:50};__T.renderPanel&&0}")
            await pg.click('#sheet [data-a=tab][data-i=salv]'); await pg.wait_for_timeout(200); await pg.click('#sheet [data-a=tab][data-i=upg]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const b=document.querySelector('#sheet [data-a=upg][data-i=\"0\"]');return [b.disabled,b.textContent,document.querySelector('#sheet .sh-body').innerText.includes('최고 단계')]}")
            rec('강화','+5에서는 최고 단계 표시', r==[True,'최고',True], str(r))
            await pg.screenshot(path=SP+'upg.png')
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[9]={id:'pickIron',c:1,lv:2};const a=T.bestPick().power;G.inv[10]={id:'pickCrystal',c:1};return [+a.toFixed(2),T.bestPick().id]}""")
            rec('강화','곡괭이 +2는 캐는 힘 +20% (더 좋은 곡괭이가 있으면 그걸 씀)', r==[3.6,'pickCrystal'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,p=G.p;const hit=k=>{p.hp=100;p.inv=0;p.dead=0;T.hurtPlayer(40,p.x+1,p.y,k);const d=100-p.hp;p.hp=100;p.inv=0;return d};G.equip.neck={id:'turtleCharm',c:1};const a=hit('fire');G.equip.neck.lv=5;const b2=hit('fire');G.equip.neck=null;return [a,b2,T.upgText('turtleCharm',5),T.upgText('obsCoat',2)]}""")
            rec('강화','장신구·옷도 강화 (부적 +5: 불 피해 -50%, 외투 +2: 추위 게이지 40% 속도)', r==[28,20,'불·용암 피해 -50%','방어력 13 · 추위 게이지 40% 속도'], str(r))
            # ---- rings ----
            r=await ev(pg,"()=>{const T=__T;return ['ringCu','ringFe','ringQ','ringGem','ringGold'].map(id=>{const r=T.RECIPES.find(q=>q.out===id);return [T.ITEMS[id].slot,r&&r.at,r&&r.cat]})}")
            rec('반지','반지 5종 (장비제작대 · 장신구 탭, v61)', all(x==['ring','smelter','acc'] for x in r), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,p=G.p;const base=T.meleeMul(),mb=T.mineMul();G.equip.ring={id:'ringCu',c:1};const a=T.meleeMul()/base;G.equip.ring.lv=3;const a3=T.meleeMul()/base;
          G.equip.ring={id:'ringFe',c:1};p.hp=100;p.inv=0;T.hurtPlayer(100,p.x+1,p.y);const def=100-p.hp;p.hp=100;p.inv=0;
          G.equip.ring={id:'ringGold',c:1};const mi=T.mineMul()/mb;G.equip.ring={id:'ringGem',c:1};const R=G.rpg,lv=R.lv,xp=R.xp;R.lv=1;R.xp=0;T.gainXp(10);const gx=R.xp+(R.lv-1)*1000;R.lv=lv;R.xp=xp;
          G.equip.ring={id:'ringQ',c:1,lv:2};const q=T.ringV('mp');G.equip.ring=null;return [+a.toFixed(3),+a3.toFixed(3),def,+mi.toFixed(2),gx,+q.toFixed(2)]}""")
            rec('반지','구리 반지 공격력 +4%(+3: +7%), 철 반지 받는 피해 -4%, 금 반지 채굴 +10%, 수정결정 반지 경험치 +8%, 석영 반지 +2 기력 회복 +30%', r==[1.04,1.07,96,1.1,11,0.3], str(r))
            await ev(pg,"()=>{const G=__T.G;G.inv.fill(null);G.inv[9]={id:'ringQ',c:1,lv:2};G.equip.ring=null;__T.G.equip.ring=__T.G.inv[9];__T.G.inv[9]=null;__T.openPanel('stat')}"); await pg.wait_for_timeout(650)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=chSlot][data-i=ring]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText,G=__T.G;return [G.equip.ring&&G.equip.ring.lv,t.includes('석영 반지 +2'),t.includes('기력 회복 +30%'),!!document.querySelector('#sheet [data-a=chSlot][data-i=ring] .lvb')]}")
            rec('반지','반지를 반지 칸에 끼면 캐릭터 창 장비 칸에 강화 단계와 효과 (+2 표시)', r==[2,True,True,True], str(r))
            await pg.screenshot(path=SP+'equip.png')
            await ev(pg,"()=>__T.closePanel()")
            # ---- salvage at the smelter ----
            await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.objs.set(T.idx(x,y+1),{t:'smelter'});G.inv[12]={id:'swordCopper',c:1,dur:250,lv:2};T.openPanel('craft',{st:'smelter'})}"""); await pg.wait_for_timeout(650)
            await pg.click('#sheet [data-a=tab][data-i=salv]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>JSON.stringify(__T.salvGet2(__T.G.inv[12]))")
            await pg.click('#sheet [data-a=salv][data-i="12"]'); await pg.wait_for_timeout(200); await pg.click('#sheet [data-a=salv][data-i="12"]'); await pg.wait_for_timeout(300)
            r2=await ev(pg,"()=>{const T=__T;return [T.G.inv[12],T.countItem('copperBar'),T.countItem('gel')]}")
            rec('분해','용광로 분해: 제작 재료 70% + 강화 재료 절반 (구리 검 +2 → 구리괴 4+3)', r=='[["copperBar",7],["wood",1],["gel",1]]' and r2==[None,7,1], str([r,r2]))
            await ev(pg,"()=>__T.closePanel()")
            # ---- save keeps levels ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv[0]={id:'swordIron',c:1,dur:300,lv:3};G.inv[5]={id:'swordCopper',c:1,lv:1};/* v77: 도구는 다음 단축칸 갱신 때 도구 주머니로 가서, 가방에 남는 무기로 */const ci=T.idx(T.CX+10,T.CY+10);G.objs.set(ci,{t:'chest',items:Array(18).fill(null)});G.objs.get(ci).items[0]={id:'ringFe',c:1,lv:4};
          T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const G2=T.G;return [G2.inv[0].lv,G2.inv[0].dur,G2.inv[5].lv,G2.objs.get(ci).items[0].lv]}""")
            rec('저장','강화 단계 저장/불러오기 (무기 칸·가방·상자)', r==[3,300,1,4], str(r))
            r=await ev(pg,"()=>{__T.openPanel('inv');const el=document.querySelector('#sheet .slot[data-i=\"5\"] .lvb');const t=el&&el.textContent;__T.closePanel();return t}")
            rec('표시','강화한 장비 칸에 +단계 표시', r=='+1', r)
            # ---- region difficulty ----
            r=await ev(pg,"""()=>{const T=__T;const h=k=>T.mkEnemy(k,0,0).hp;const a=T.regionEnemy(T.mkEnemy('slimeP',0,0),2),b2=T.regionEnemy(T.mkEnemy('slimeG',0,0),0),c=T.regionEnemy(T.mkEnemy('magmaSlime',0,0),3);return [a.hp===Math.round(h('slimeP')*1.2),a.mh===a.hp,a.dm,b2.hp===h('slimeG'),b2.mh||0,b2.dm||1,c.hp===Math.round(h('magmaSlime')*1.15)]}""")
            rec('난이도','수정 동굴 몬스터 체력 ×1.2·피해 ×1.1, 깊은 동굴 체력 ×1.15·피해 ×1.1, 이끼·버섯숲은 그대로', r==[True,True,1.1,True,0,1,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();const e=T.regionEnemy(T.mkEnemy('slimeP',G.p.x+.2,G.p.y),2);e.t=0;e.cd=0;G.enemies.push(e);return 1}""")
            await pg.wait_for_timeout(600)
            # 체력 회복이 같은 순간에 끼면 줄어든 체력이 1 적게 보여요. 머리 위에 뜬 피해 숫자로 봐요
            r=await ev(pg,"()=>{const G=__T.G;const t=G.texts.filter(t=>/^-\\d+$/.test(t.txt)).map(t=>-(+t.txt));const d=t.length?Math.max(...t):100-G.p.hp;G.enemies.length=0;G.p.hp=100;return d}")
            rec('난이도','수정 동굴 보라 말랑이 피해 ×1.1 (18 → 20)', r in (20,40), r)
            # ---- map legend ----
            r=await ev(pg,"()=>{__T.openPanel('map');const t=document.querySelector('#sheet').innerText;__T.closePanel();return [t.includes('지역 재료'),t.includes('지형 · 흙')]}")
            rec('지도','v111: 지도 창에 「지역 재료」 목록이 없음', r==[False,False], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;let best=-1;for(let i=0;i<G.wall.length;i++){if(G.wall[i]!==13||G.biome[i]!==2)continue;const x=i%640||0;best=i;break}const W=Math.round(Math.sqrt(G.wall.length));const x=best%W,y=Math.floor(best/W);for(let dy=-1;dy<=1;dy++)for(let dx=-3;dx<=-1;dx++){const j=T.idx(x+dx,y+dy+2);G.wall[j]=0;G.objs.delete(j)}G.p.x=x-1.5;G.p.y=y+2.5;G.enemies.length=0;for(let i=0;i<G.explored.length;i++)G.explored[i]=1}")
            await pg.wait_for_timeout(800); await pg.screenshot(path=SP+'cave.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_durability_repair():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,checkGuide,bestPick,curWeapon,get panelKind(){return panel&&panel.kind}}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            pick="__T.G.tools.find(s=>s.id==='pickWood')"  # v65: tools live in the pouch
            r=await ev(pg,f"()=>{pick}.dur")
            rec('내구도','시작 나무 곡괭이 내구도 200', r==200, r)
            async def setup(extra=''):
                await ev(pg,"()=>{const G=__T.G;for(let y=106;y<116;y++)for(let x=104;x<118;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=2}G.enemies.length=0;G.fish=null;G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0};G.sel=5;"+extra+"}")
                await pg.wait_for_timeout(150)
            await setup("G.wall[__T.idx(111,110)]=1;")
            await hold_until(pg,"()=>!__T.G.wall[__T.idx(111,110)]")  # 다 캘 때까지 (실제 1.5초로 누르면 바쁠 때 덜 캤어요)
            r=await ev(pg,f"()=>[__T.G.wall[__T.idx(111,110)], {pick}.dur]")
            rec('내구도','흙벽 캐면 캔 횟수만큼 닳음 (흙벽 3번)', r==[0,197], str(r))
            await setup(f"{pick}.dur=1;G.wall[__T.idx(111,110)]=1;")
            await tap(pg,1)
            r=await ev(pg,f"()=>[{pick}.dur, __T.bestPick().id, document.querySelector('#toasts').innerText.includes('나무 곡괭이가 망가졌어요')]")
            rec('내구도','0이 되면 망가짐 + 알림, 맨손으로 전환', r==[0,'hand',True], str(r))
            await tap(pg,1); r=await ev(pg,f"()=>[{pick}.dur, !!{pick}]")
            rec('내구도','망가져도 사라지지 않고 맨손으로 계속 캐짐', r==[0,True], str(r))
            r=await ev(pg,"()=>{const i=__T.G.tools.findIndex(s=>s.id==='pickWood');try{localStorage.setItem('lantern-tree-pouch','1')}catch(e){};__T.openPanel('inv');const el=document.querySelector(`#sheet .slot[data-a=pouch][data-i=\"${i}\"]`);const c=el.className;__T.closePanel();return c}")
            rec('표시','망가진 도구 칸 표시', 'broken' in r, r)
            # sword wears only on hit
            sw="(__T.G.equip.weapon||__T.G.inv.find(s=>s&&s.id==='swordWood'))"  # v42: the starting sword sits in the weapon slot
            await setup()
            await ev(pg,"()=>{const G=__T.G;G.sel=G.inv.findIndex(s=>s&&s.id==='swordWood')}")  # v48: the weapon is used while held
            d0=await ev(pg,f"()=>{sw}.dur"); await atk(pg,2,400); d1=await ev(pg,f"()=>{sw}.dur")
            rec('내구도','허공에 휘두르면 안 닳음', d0==d1, f'{d0} {d1}')
            await ev(pg,"()=>{const G=__T.G;G.enemies.push({k:'slimeG',x:111.2,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:9,anim:0})}")
            await pg.wait_for_timeout(100); await atk(pg,1); d2=await ev(pg,f"()=>{sw}.dur")
            rec('내구도','적을 맞히면 1 닳음', d2==d1-1, f'{d1} {d2}')
            # rod broken
            await setup(f"__T.addItem('rod',1);G.tools.find(s=>s.id==='rod').dur=0;G.tsel=G.tools.findIndex(s=>s.id==='rod');G.sel=-1;G.tHand=true;G.floor[__T.idx(111,110)]=__T.WATER;")
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('내구도','망가진 낚싯대 → 낚시 불가 안내', r==['info','낚싯대 고장'], str(r))
            # chest keeps durability
            await setup("const o={t:'chest',items:Array(18).fill(null)};G.objs.set(__T.idx(111,110),o);")
            r=await ev(pg,"""()=>{const G=__T.G;if(G.equip.weapon){G.inv[20]=G.equip.weapon;G.equip.weapon=null}const i=G.inv.findIndex(s=>s&&s.id==='swordWood');G.inv[i].dur=37;__T.openPanel('chest',{i:__T.idx(111,110)});return i}""")
            await pg.wait_for_timeout(500)
            await pg.click(f'#sheet [data-a=cin][data-i="{r}"]'); await pg.wait_for_timeout(200)
            await pg.click('#sheet [data-a=cout][data-i="0"]'); await pg.wait_for_timeout(200)
            r=await ev(pg,f"()=>{sw}.dur"); await ev(pg,"()=>__T.closePanel()")
            rec('내구도','상자에 넣었다 빼도 내구도 유지', r==37, r)
            # repair
            await setup("G.objs.set(__T.idx(111,111),{t:'smelter'});__T.addItem('wood',10);")  # v61: repair at the 장비제작대
            await ev(pg,"()=>{__T.openPanel('craft',{st:'smelter'})}"); await pg.wait_for_timeout(500)
            await pg.click('#sheet [data-a=tab][data-i=fix]'); await pg.wait_for_timeout(300)
            txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
            rec('수리','수리 탭에 닳은 도구 목록', '나무 곡괭이' in txt and '망가짐' in txt and '나무 검' in txt, txt[:120].replace('\n',' / '))
            w0=await ev(pg,"()=>__T.countItem('wood')")
            pi=await ev(pg,"()=>'t:'+__T.G.tools.findIndex(s=>s.id==='pickWood')")
            await pg.click(f'#sheet [data-a=fix][data-i="{pi}"]'); await pg.wait_for_timeout(300)
            r=await ev(pg,f"()=>[{pick}.dur, __T.countItem('wood')]")
            rec('수리','망가진 곡괭이 수리: 나무 3개 → 내구도 200', r==[200,w0-3], f'{r} (wood before {w0})')
            r=await ev(pg,"()=>{const s=__T.G.equip.weapon||__T.G.inv.find(s=>s&&s.id==='swordWood');return [s.dur, document.querySelector('#sheet .sh-body').innerText.includes('나무 1/1')||document.querySelector('#sheet .sh-body').innerText.includes('/2')]}")
            rec('수리','덜 닳은 도구는 재료가 적게 듦', r[1], str(r))
            await pg.screenshot(path=SP+'fix.png')
            await ev(pg,"()=>__T.closePanel()")
            # away from bench
            await setup(f"{pick}.dur=5;")
            await ev(pg,"()=>{__T.openPanel('craft',{st:'smelter'})}"); await pg.wait_for_timeout(500); await pg.click('#sheet [data-a=tab][data-i=fix]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[document.querySelector('#sheet .sh-body').innerText.includes('장비제작대 근처에서'), [...document.querySelectorAll('#sheet [data-a=fix]')].every(b=>b.disabled)]")
            rec('수리','장비제작대 없으면 수리 불가 안내 (v61)', r==[True,True], str(r)); await ev(pg,"()=>__T.closePanel()")
            # save
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);const a=__T.G.tools.find(x=>x.id==='pickWood').dur;s.tools.forEach(x=>{if(x)delete x.dur});__T.deserialize(s);const b=__T.G.tools.find(x=>x.id==='pickWood');return [a,b.dur==null, __T.bestPick().id]}")
            rec('저장','내구도 저장 / 예전 세이브는 새것 취급', r==[5,True,'pickWood'], str(r))
            # shovel broken
            await setup("__T.addItem('shovel',1);G.tools.find(s=>s.id==='shovel').dur=0;G.tsel=G.tools.findIndex(s=>s.id==='shovel');G.sel=-1;G.tHand=true;G.floor[__T.idx(111,110)]=5;")
            r=await ev(pg,"()=>__T.decide().lbl")
            rec('내구도','망가진 삽 → 안내', r=='삽 고장', r)
            await ev(pg,"()=>{const G=__T.G;G.tools.find(s=>s.id==='shovel').dur=250}"); await tap(pg,1)
            r=await ev(pg,"()=>__T.G.tools.find(s=>s.id==='shovel').dur")
            rec('내구도','삽으로 걷으면 1 닳음', r==249, r)
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_salvage():
    import asyncio, sys
    async def main():
        mkpage(SRC,'qa.html')
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{const G=__T.G;G.inv.fill(null);G.tools=[];['pickCopper','swordCopper','shovel','rod','pickWood','swordCrystal'].forEach(k=>__T.addItem(k,1));G.inv.find(s=>s&&s.id==='swordCopper').dur=0;G.objs.set(__T.idx(Math.floor(G.p.x)+1,Math.floor(G.p.y)),{t:'smelter'})}")
            await ev(pg,"()=>__T.openPanel('craft',{st:'smelter'})"); await pg.wait_for_timeout(500)
            await pg.click('#sheet [data-a=tab][data-i=salv]'); await pg.wait_for_timeout(300)
            txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText.replace(/\\n/g,' / ')")
            rec('분해','분해 탭에 장비 6개 + 돌려받을 재료 표시', await ev(pg,"()=>document.querySelectorAll('#sheet [data-a=salv]').length")==6 and '구리괴 +3' in txt and '나무 +1' in txt, txt[:160])
            await pg.screenshot(path=SP+'salv.png')
            ci=await ev(pg,"()=>'t:'+__T.G.tools.findIndex(s=>s.id==='pickCopper')")
            await pg.click(f'#sheet [data-a=salv][data-i="{ci}"]'); await pg.wait_for_timeout(200)
            r=await ev(pg,f"()=>[document.querySelector('#sheet [data-a=salv][data-i=\"{ci}\"]').textContent, __T.countItem('pickCopper')>0]")
            rec('분해','한 번 누르면 확인(정말?), 아직 안 사라짐', r==['정말?',True], str(r))
            await pg.click(f'#sheet [data-a=salv][data-i="{ci}"]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.countItem('pickCopper')>0, __T.countItem('copperBar'), __T.countItem('wood')]")
            rec('분해','구리 곡괭이(구리괴 4·나무 2) → 구리괴 3·나무 1', r==[False,3,1], str(r))
            si=await ev(pg,"()=>__T.G.inv.findIndex(s=>s&&s.id==='swordCopper')")
            await pg.click(f'#sheet [data-a=salv][data-i="{si}"]'); await pg.click(f'#sheet [data-a=salv][data-i="{si}"]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.countItem('copperBar'), __T.countItem('wood'), document.querySelector('#toasts').innerText.includes('구리 검을 분해했어요')]")
            rec('분해','망가진 구리 검(구리괴 5·나무 1)도 분해 → 구리괴 +4·나무 +1', r==[7,2,True], str(r))
            ri=await ev(pg,"()=>__T.G.inv.findIndex(s=>s&&s.id==='swordCrystal')")
            await pg.click(f'#sheet [data-a=salv][data-i="{ri}"]'); await pg.click(f'#sheet [data-a=salv][data-i="{ri}"]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.countItem('quartzR'), __T.countItem('cryGem'), __T.countItem('ironBar')]")
            rec('분해','수정 검(v43: 정제 석영 4·수정결정 2·철괴 3) → 정제 석영 3·수정결정 1·철괴 2', r==[3,1,2], str(r))
            wi=await ev(pg,"()=>'t:'+__T.G.tools.findIndex(s=>s.id==='pickWood')")
            await pg.click(f'#sheet [data-a=salv][data-i="{wi}"]'); await pg.click(f'#sheet [data-a=salv][data-i="{wi}"]'); await pg.wait_for_timeout(200)
            rec('분해','시작 나무 곡괭이 → 나무 2', await ev(pg,"()=>__T.countItem('wood')")==4)
            # tab change cancels confirm
            oi=await ev(pg,"()=>'t:'+__T.G.tools.findIndex(s=>s.id==='rod')")
            await pg.click(f'#sheet [data-a=salv][data-i="{oi}"]'); await pg.click('#sheet [data-a=tab][data-i=fix]'); await pg.click('#sheet [data-a=tab][data-i=salv]'); await pg.wait_for_timeout(200)
            r=await ev(pg,f"()=>document.querySelector('#sheet [data-a=salv][data-i=\"{oi}\"]').textContent")
            rec('분해','탭을 바꾸면 확인 취소', r=='분해', r)
            await ev(pg,"()=>__T.closePanel()")
            # away from bench
            await ev(pg,"()=>{const G=__T.G;G.p.x=60.5;G.p.y=60.5}"); await pg.wait_for_timeout(100)
            await ev(pg,"()=>__T.openPanel('craft',{st:'smelter'})"); await pg.wait_for_timeout(500); await pg.click('#sheet [data-a=tab][data-i=salv]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[document.querySelector('#sheet .sh-body').innerText.includes('근처에서 분해할 수 있어요'), [...document.querySelectorAll('#sheet [data-a=salv]')].every(b=>b.disabled)]")
            rec('분해','작업대 없으면 분해 불가', r==[True,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_renames():
    import asyncio, sys
    # v58: 이름 변경 — 화로 → 용광로, 용광로 → 장비제작대 / 구이 4개는 요리솥으로 / 장비제작대는 작업대에서 나무·돌로
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,STN,GUIDE,newGame}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const T=__T;return [T.ITEMS.furnace.n,T.OBJ.furnace.n,T.STN.furnace,T.ITEMS.smelter.n,T.OBJ.smelter.n,T.STN.smelter,T.STN.pot]}")
            rec('이름','화로 → 용광로, 용광로 → 장비제작대, 요리솥 그대로', r==['용광로','용광로','용광로','장비제작대','장비제작대','장비제작대','요리솥'], str(r))
            r=await ev(pg,"()=>{const T=__T,at=id=>T.RECIPES.find(q=>q.out===id).at;return [['grilled','grilledFish','friedEgg','pancake'].map(at).join(','),['copperBar','ironBar','goldBar','quartzR'].map(at).join(','),T.RECIPES.filter(q=>q.at==='furnace').length]}")
            rec('레시피','구운 버섯·구운 생선·달걀 프라이·팬케이크는 요리솥, 용광로는 괴 4종만', r==['pot,pot,pot,pot','furnace,furnace,furnace,furnace',4], str(r))
            r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(q=>q.out==='smelter');return [rc.at,rc.req.map(([id])=>id).join(',')]}")
            rec('장비제작대','작업대에서 나무·흙·송진으로 (철괴 없이)', r==['bench','wood,dirt,resin'], str(r))
            r=await ev(pg,"()=>{const g=__T.GUIDE.map(q=>typeof q.t==='function'?q.t():q.t).join('|');return [g.includes('용광로를 놓고 구리괴'),g.includes('화로')]}")
            rec('퀘스트','메인 퀘스트 문구도 「용광로」로', r==[True,False], str(r))
            # open the furnace: only bars
            await ev(pg,"()=>{const T=__T,G=T.G;const i=T.idx(T.CX+6,T.CY+6);G.objs.set(i,{t:'furnace'});T.openPanel('craft',{st:'furnace',i})}"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [t.includes('용광로에서 만들기'),t.includes('구리괴'),t.includes('구운 버섯'),t.includes('화로')]}")
            await pg.screenshot(path=SP+'furnace.png'); await ev(pg,"()=>__T.closePanel()")
            rec('제작 창','용광로를 열면 「용광로에서 만들기」, 괴만 보임', r==[True,True,False,False], str(r))
            # old save notice
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));delete s.stats.nm58;T.deserialize(s);return T.G.stats.nm58}""")
            await pg.wait_for_timeout(2900)
            t=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('옛 세이브','화로·용광로가 있던 옛 세이브는 불러올 때 이름이 바뀌었다는 알림 한 번', r==1 and '화로 → 용광로' in t and '장비제작대' in t, t[-80:])
            r=await ev(pg,"""()=>{const T=__T;T.newGame(9);const s=JSON.parse(JSON.stringify(T.serialize()));const a=s.stats.nm58;T.deserialize(s);return a}""")
            await pg.wait_for_timeout(2900)
            t=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('새 게임','새 게임은 알림 없음', r==1 and t.count('화로 → 용광로')<=1, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
