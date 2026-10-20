# 건축·지형·회로: 삽·지형, 문, 여러 칸 가구·회전, 가구 칸 크기, 건축 정리, 회로·채굴기
# 실행: python3 dev/qa/run.py building   (테스트 하나만: python3 dev/qa/run.py terrain_shovel)
from harness import *


def test_terrain_shovel():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,checkGuide,subAction:()=>subAction(),get act(){return G.act},canPlace,RECIPES,isSolid,digWhy,perform}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            F=lambda x,y: f"__T.G.floor[__T.idx({x},{y})]"
            async def setup(extra):
                await ev(pg,"()=>{const G=__T.G;for(let y=106;y<116;y++)for(let x=104;x<118;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.enemies.length=0;G.fish=null;G.inv.fill(null);G.under.clear();G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0};"+extra+"}")
                await pg.wait_for_timeout(150)
            sel="G.sel=G.inv.findIndex(s=>s&&s.id==='{}');"
            tool="G.tsel=G.tools.findIndex(s=>s&&s.id==='{}');G.sel=-1;G.tHand=true;"  # v65: tools are held from the tool pouch
            # 1. build priority
            await setup("G.objs.set(__T.idx(111,110),{t:'bench'});__T.addItem('floorWood',5);"+sel.format('floorWood'))
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('건축 우선','바닥 들고 작업대 앞 → 깔기', r==['place','깔기'], str(r))
            await tap(pg,1); r=await ev(pg,f"()=>[{F(111,110)}, !!__T.G.objs.get(__T.idx(111,110)), document.querySelector('#sheetWrap').hidden]")
            rec('건축 우선','작업대는 그대로, 아래에 바닥이 깔리고 창은 안 열림', r==[5,True,True], str(r))
            await setup("G.objs.set(__T.idx(111,110),{t:'bench'});__T.addItem('chair',1);"+sel.format('chair'))
            r=await ev(pg,"()=>__T.decide().k")
            rec('건축 우선','가구 들고 작업대 앞(놓을 수 없음) → 작업대 열기 (v65: 든 물건을 못 쓰면 자동 추천)', r=='open', r)
            # 2. bug fix: set floors return
            await setup("__T.addItem('floorMoss',1);__T.addItem('floorWood',1);"+sel.format('floorMoss'))
            await tap(pg,1); await ev(pg,"()=>{const G=__T.G;"+sel.format('floorWood')+"}"); await pg.wait_for_timeout(150); await tap(pg,1); await pg.wait_for_timeout(900)
            r=await ev(pg,f"()=>[{F(111,110)}, __T.countItem('floorMoss')]")
            rec('버그 수정','이끼 타일 위에 나무 바닥 → 이끼 타일 돌려받음', r==[5,1], str(r))
            # 3. shovel: only in hand
            await setup("__T.addItem('floorWood',1);__T.addItem('shovel',1);"+sel.format('floorWood'))
            await tap(pg,1); await ev(pg,"()=>{__T.G.sel=5}"); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.decide().k,(__T.G.alts||[]).map(a=>a.lbl).join(','), document.querySelector('#subBtn').hidden]")
            rec('삽','v65: 삽이 도구 주머니에 있으면 깔린 바닥 앞 작은 버튼이 [걷기] (큰 버튼은 아님)', r==['none','걷기',False], str(r))
            await ev(pg,"()=>{const G=__T.G;"+tool.format('shovel')+"}"); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('삽','삽을 들면 바닥 앞 큰 버튼이 걷기', r==['dig','걷기'], str(r))
            await tap(pg,1)
            r=await ev(pg,f"()=>[{F(111,110)}, __T.countItem('floorWood')]")
            rec('삽','걷으면 원래 이끼 땅으로 + 바닥 돌려받음', r==[1,1], str(r))
            # 4. v87: 배우기 없이 모든 자연 바닥을 파서 구덩이 + 그 바닥 한 삽 (예전 지형 배우기는 없어짐)
            await setup("G.terrain={};__T.addItem('shovel',1);"+tool.format('shovel'))
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('바닥 파기','v87: 배우기 없이 삽 들고 이끼 → 파기', r==['dig','파기'], str(r))
            r=await ev(pg,"()=>__T.ITEMS.shovel.d")
            rec('바닥 파기','삽 설명이 구덩이를 안내', '구덩이' in r and '배운 지형' not in r, r[:60])
            await tap(pg,1)
            r=await ev(pg,f"()=>[{F(111,110)}, __T.countItem('gMoss'), __T.isSolid(111,110)]")
            rec('바닥 파기','이끼를 파면 구덩이(22)·막힌 칸 + 이끼 흙', r==[22,1,True], str(r))
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('바닥 파기','구덩이는 더 못 팜', r==['info','구덩이'], str(r))
            await ev(pg,"()=>{const G=__T.G;"+sel.format('gMoss')+"}"); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('메우기','이끼 흙 들고 구덩이 → 덮기', r==['place','덮기'], str(r))
            await tap(pg,1); r=await ev(pg,f"()=>[{F(111,110)}, __T.countItem('gMoss'), __T.isSolid(111,110)]")
            rec('메우기','구덩이가 이끼로 메워져 다시 걸을 수 있음', r==[1,0,False], str(r))
            # v93: 흙은 벽 재료이자 바닥 재료 — 큰 버튼은 벽 쌓기, 작은 버튼은 바닥 바꾸기
            await setup("__T.addItem('dirt',2);"+sel.format('dirt'))
            r=await ev(pg,"()=>{const d=__T.decide();return [d.k,d.lbl,!!d.gr,(__T.G.alts||[]).map(a=>a.lbl).join(',')]}")
            rec('흙','v93: 흙 들고 이끼 바닥 → 큰 버튼 쌓기, 작은 버튼 바닥 바꾸기', r==['place','쌓기',False,'바닥 바꾸기'], str(r))
            r=await ev(pg,f"()=>{{const G=__T.G;__T.decide();__T.perform(G.alts.find(a=>a.lbl==='바닥 바꾸기'));return [{F(111,110)}, G.wall[__T.idx(111,110)], __T.countItem('gMoss'), __T.countItem('dirt')]}}")
            rec('바꾸기','작은 버튼: 이끼 위에 흙 → 흙 바닥이 되고 이끼 흙 돌려받음', r==[2,0,1,1], str(r))
            r=await ev(pg,f"()=>{{const G=__T.G;__T.perform(__T.decide());return [{F(111,110)}, G.wall[__T.idx(111,110)], __T.countItem('dirt')]}}")
            rec('흙','큰 버튼: 흙벽을 쌓음', r==[2,1,0], str(r))
            await setup("__T.addItem('dirt',1);G.floor[__T.idx(111,110)]=22;"+sel.format('dirt'))
            r=await ev(pg,"()=>{const d=__T.decide();return [d.k,d.lbl,!!d.gr]}")
            rec('메우기','v93: 흙 들고 구덩이 → 큰 버튼이 메우기', r==['place','메우기',True], str(r))
            await tap(pg,1); r=await ev(pg,f"()=>[{F(111,110)}, __T.G.wall[__T.idx(111,110)], __T.countItem('dirt')]")
            rec('메우기','흙으로 구덩이가 흙 바닥이 됨 (벽은 안 생김)', r==[2,0,0], str(r))
            await setup("__T.addItem('iceBlock',1);G.floor[__T.idx(111,110)]=22;"+sel.format('iceBlock'))
            await tap(pg,1); r=await ev(pg,f"()=>[{F(111,110)}, __T.G.wall[__T.idx(111,110)]]")
            rec('메우기','얼음 덩이로 구덩이 → 얼음판(20)', r==[20,0], str(r))
            r=await ev(pg,"()=>[!__T.ITEMS.gDirt,!__T.ITEMS.gIce,!__T.RECIPES.some(r=>r.out==='gDirt'),__T.ITEMS.gMoss.n,__T.ITEMS.gAsh.n]")
            rec('한 삽 없애기','흙 한 삽·얼음 한 삽과 그 손 제작이 없고, 이끼 흙·재로 이름이 바뀜', r==[True,True,True,'이끼 흙','재'], str(r))
            for f,it in [(2,'dirt'),(18,'gAsh'),(19,'gSnow'),(20,'iceBlock')]:
                await setup(f"G.floor[__T.idx(111,110)]={f};__T.addItem('shovel',1);"+tool.format('shovel'))
                await tap(pg,1); r=await ev(pg,f"()=>[{F(111,110)}, __T.countItem('{it}')]")
                rec('바닥 파기',f'바닥 {f}을 파면 구덩이 + {it}', r==[22,1], str(r))
            await setup("__T.addItem('floorWood',1);G.floor[__T.idx(111,110)]=22;"+sel.format('floorWood'))
            await tap(pg,1); await ev(pg,"()=>{const G=__T.G;__T.addItem('shovel',1);"+tool.format('shovel')+"}"); await pg.wait_for_timeout(150); await tap(pg,1)
            r=await ev(pg,f"()=>[{F(111,110)}, __T.countItem('floorWood')]")
            rec('바닥 파기','구덩이 위에 깐 나무 바닥을 걷으면 구덩이가 다시 드러남', r==[22,1], str(r))
            await setup("__T.addItem('dirt',2);G.floor[__T.idx(111,110)]=__T.WATER;"+sel.format('dirt'))
            r=await ev(pg,"()=>{const d=__T.decide();return [d.lbl,(__T.G.alts||[]).map(a=>a.lbl).join(',')]}")
            r2=await ev(pg,f"()=>{{const G=__T.G;__T.perform(G.alts.find(a=>a.lbl==='바닥 쌓기'));return [{F(111,110)}, G.wall[__T.idx(111,110)], __T.countItem('gWater')]}}")
            rec('지형 배치','흙 들고 물 → 큰 버튼 쌓기, 작은 버튼 바닥 쌓기로 물 메우기 (물은 돌려받지 않음)', r==['쌓기','바닥 쌓기'] and r2==[2,0,0], f'{r} {r2}')
            # v87: 물 한 동이는 구덩이에만, 삽으로는 물을 못 떠요
            await setup("__T.addItem('gWater',2);"+sel.format('gWater'))
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().msg||'']")
            rec('물 붓기','물 한 동이는 빈 땅에 못 부음 (구덩이 안내)', r[0]=='info' and '구덩이' in r[1], str(r))
            await ev(pg,"()=>{__T.G.floor[__T.idx(111,110)]=22}"); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>__T.decide().lbl"); await tap(pg,1); r2=await ev(pg,f"()=>{F(111,110)}")
            rec('물 붓기','구덩이에 붓기 → 물', r=='붓기' and r2==10, f'{r} {r2}')
            await setup("G.floor[__T.idx(111,110)]=__T.WATER;__T.addItem('shovel',1);"+tool.format('shovel'))
            r=await ev(pg,"()=>[__T.decide().k,__T.digWhy(111,110)]")
            rec('양동이','삽으로는 물을 못 뜨고(파기 없음) 양동이 안내', r[0]!='dig' and '양동이' in r[1], str(r))
            # save roundtrip
            await setup("__T.addItem('floorStone',1);"+sel.format('floorStone'))
            await tap(pg,1)
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);return [__T.G.under.get(__T.idx(111,110)), __T.G.floor[__T.idx(111,110)]]}")
            rec('저장','깔린 바닥 아래 땅 정보가 저장됨', r==[1,6], str(r))
            # old save without new fields
            r=await ev(pg,"()=>{const s=__T.serialize();delete s.under;delete s.terrain;__T.deserialize(s);return [__T.G.under.size, typeof __T.G.terrain]}")
            rec('저장','예전 세이브(새 항목 없음)도 정상 로드', r==[0,'object'], str(r))
            await pg.screenshot(path=SP+'terrain_shovel.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_doors():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            async def setup(extra=''):
                await ev(pg,"()=>{const G=__T.G;for(let y=104;y<118;y++)for(let x=104;x<118;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.enemies.length=0;G.fish=null;G.inv.fill(null);G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0};G.sel=5;"+extra+"}")
                await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>{const ids=['Fence','Door'],gone=['Thin','Half','Win','Frame','Pillar'];return ['Wood','Stone'].every(m=>ids.every(t=>__T.RECIPES.some(r=>r.out==='b'+t+m&&r.at==='bench'&&r.cat==='build'))&&gone.every(t=>!__T.ITEMS['b'+t+m]&&!__T.RECIPES.some(r=>r.out==='b'+t+m)))&&!__T.RECIPES.some(r=>/^roof/.test(r.out))}")
            rec('제작','나무·돌 울타리·문 제작법 (작업대·건축 탭). 지붕은 v41, 얇은 벽·반벽·창문벽·창문 틀·기둥은 v69에서 삭제', r)
            r=await ev(pg,"()=>[__T.ITEMS.bFenceWood.n,__T.ITEMS.bDoorStone.n]")
            rec('제작','이름', r==['나무 울타리','돌 문'], str(r))
            # place fences by holding while walking
            await setup("__T.addItem('bFenceWood',5);G.sel=G.inv.findIndex(s=>s&&s.id==='bFenceWood');")
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('설치','울타리 들고 → 놓기', r==['place','놓기'], str(r))
            await tap(pg,1); r=await ev(pg,"()=>__T.G.objs.get(__T.idx(111,110))?.t")
            rec('설치','울타리 설치', r=='bFenceWood', r)
            r=await ev(pg,"()=>[__T.decide().k, (__T.G.alts||[]).some(a=>a.k==='pickup')]")
            rec('설치','이미 있는 칸 앞: 회수 대신 안내 + 작은 [회수] 버튼', r==['info',True], str(r))
            # door
            await setup("G.objs.set(__T.idx(111,110),{t:'bDoorWood'});")
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('문','문 앞 → 열기', r==['use','열기'], str(r))
            await tap(pg,1); r=await ev(pg,"()=>[!!__T.G.objs.get(__T.idx(111,110)).open, __T.decide().lbl]")
            rec('문','열리고 버튼은 닫기로', r==[True,'닫기'], str(r))
            # walk through open door
            await ev(pg,"()=>{const G=__T.G;G.wall[__T.idx(111,109)]=6;G.wall[__T.idx(111,111)]=6}")
            await pg.keyboard.down('d'); await pg.wait_for_timeout(700); await pg.keyboard.up('d')
            x1=await ev(pg,"()=>__T.G.p.x")
            rec('문','열린 문은 지나갈 수 있음', x1>111.6, x1)
            await setup("G.objs.set(__T.idx(111,110),{t:'bDoorWood'});")
            await pg.keyboard.down('d'); await pg.wait_for_timeout(700); await pg.keyboard.up('d')
            x2=await ev(pg,"()=>__T.G.p.x")
            rec('문','닫힌 문은 막힘', x2<111, x2)
            await ev(pg,"()=>{const G=__T.G;G.objs.get(__T.idx(111,110)).open=1;G.p.x=111.5;G.p.y=110.5;G.p.face={x:1,y:0}}")
            r=await ev(pg,"()=>{const G=__T.G,o=G.objs.get(__T.idx(111,110));G.p.face={x:0,y:0};return 0}")
            await ev(pg,"()=>{const G=__T.G;G.p.x=110.5;G.p.face={x:1,y:0};G.p.x=111.2}")  # standing inside doorway
            await ev(pg,"()=>{}")
            await setup("G.objs.set(__T.idx(111,110),{t:'bDoorWood',open:1});G.p.x=110.85;")
            await tap(pg,1); r=await ev(pg,"()=>[!!__T.G.objs.get(__T.idx(111,110)).open, document.querySelector('#toasts').innerText.includes('문 사이에')]")
            rec('문','문턱에 걸쳐 서 있으면 닫히지 않음', r==[True,True], str(r))
            # save (roofs were removed in v41 — see building_cleanup)
            r=await ev(pg,"()=>{const G=__T.G;G.objs.set(__T.idx(111,110),{t:'bDoorStone',open:1});const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);const o=__T.G.objs.get(__T.idx(111,110));return [o.t,!!o.open,'roof' in s]}")
            rec('저장','문 저장/불러오기 (지붕 항목 없음)', r==['bDoorStone',True,False], str(r))
            # icons are 16x16
            r=await ev(pg,"()=>{__T.openPanel('craft');return 1}"); await pg.wait_for_timeout(400)
            await pg.click('#sheet [data-a=tab][data-i=build]'); await pg.wait_for_timeout(300)
            await pg.evaluate("()=>{document.querySelector('#sheet .sh-body').scrollTop=500}"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SP+'craft.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_multi_tile_rotation():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,decide,perform,growTick,refreshHotbar,isSolid,placeItem,hitObj,circuitTick,rotateAction,rotN,rotOf,fixParts,fpOf,farmStage,FARM_GROW,useObj:typeof useObj!=='undefined'?useObj:null}")
    ARENA="()=>{const G=__T.G;for(let y=100;y<118;y++)for(let x=100;x<120;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.wire=new Map();G.enemies.length=0;G.p.x=104.5;G.p.y=108.5;G.p.face={x:1,y:0};for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.sel=0}"
    GIVE="(id,c)=>{const G=__T.G;G.inv[0]={id,c:c||1};G.sel=0;__T.refreshHotbar()}"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,f"()=>{{window.GIVE={GIVE}}}")
            await ev(pg,ARENA)
            # place a 2x2 bed facing right
            r=await ev(pg,"""()=>{const T=__T,G=T.G;GIVE('bedDouble');G.p.face={x:1,y:0};const a=T.decide();T.perform(a);const cells=[];for(let y=106;y<111;y++)for(let x=104;x<109;x++){const o=G.objs.get(T.idx(x,y));if(o)cells.push(x+','+y+':'+o.t)}return [a.k,cells.join(' ')]}""")
            rec('여러 칸','2×2 침대: 바라보는 쪽으로 2×2 차지', r[0]=='place' and r[1].count('_part')==3 and 'bedDouble' in r[1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let a=null;for(const[i,o]of G.objs)if(o.t==='bedDouble')a=i;const x=a%200,y=(a/200)|0;return [T.isSolid(x,y),T.isSolid(x+1,y+1),T.isSolid(x+2,y)]}""")
            rec('여러 칸','모든 칸이 막힘 (바깥 칸은 열림)', r==[True,True,False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let a=null;for(const[i,o]of G.objs)if(o.t==='bedDouble')a=i;const x=a%200,y=(a/200)|0;G.p.x=x+2.5;G.p.y=y+1.5;G.p.face={x:-1,y:0};G.inv[0]=null;const d=T.decide();return [d.k,d.t.x===x&&d.t.y===y,d.u]}""")
            rec('여러 칸','다른 칸을 바라봐도 같은 가구로 인식 (잠자기)', r[0]=='use' and r[1] and r[2]=='sleep', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let a=null;for(const[i,o]of G.objs)if(o.t==='bedDouble')a=i;const x=a%200,y=(a/200)|0;const d=T.decide();d.k='pickup';T.perform(d);let left=0;for(const[i,o]of G.objs)if(o.t==='_part'||o.t==='bedDouble')left++;return [left,T.countItem('bedDouble')]}""")
            rec('여러 칸','회수하면 모든 칸이 비고 아이템으로 돌아옴', r==[0,1], str(r))
            # blocked placement
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.p.x=104.5;G.p.y=108.5;G.p.face={x:1,y:0};GIVE('rugRound');G.wall[T.idx(106,108)]=1;const a=T.decide().k;G.wall[T.idx(106,108)]=0;const b=T.decide().k;return [a,b]}""")
            rec('여러 칸','자리가 모자라면 못 놓음 (3×3 러그 옆 벽)', r[0]!='place' and r[1]=='place', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.perform(T.decide());let a=null;for(const[i,o]of G.objs)if(o.t==='rugRound')a=i;const x=a%200,y=(a/200)|0;return [T.isSolid(x+1,y+1),a!=null]}""")
            rec('여러 칸','러그는 위로 걸어 다닐 수 있음', r==[False,True], str(r))
            await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'rug.png')
            # rotation of a 2x1 table
            await ev(pg,ARENA)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;GIVE('longTable');G.p.face={x:1,y:0};T.rotateAction();const a=T.decide();T.perform(a);let ai=null;for(const[i,o]of G.objs)if(o.t==='longTable')ai=i;const o=G.objs.get(ai);return [o.rot,T.fpOf(o).join('x'),[...G.objs.values()].filter(q=>q.t==='_part').length]}""")
            rec('회전','들고 있을 때 돌리면 세로(1×2)로 놓임', r==[1,'1x2',1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let ai=null;for(const[i,o]of G.objs)if(o.t==='longTable')ai=i;G.inv[0]=null;T.rotateAction();const o=G.objs.get(ai);return [o.rot,T.rotOf(o),T.fpOf(o).join('x')]}""")
            rec('회전','v65: 놓인 가구는 돌리지 않음 (회수해서 다시 놓기)', r==[1,1,'1x2'], str(r))
            r=await ev(pg,"()=>['longTable','bed','bench','sofa2','chair','logBench','cushion','vase','table','pictureFrame','chest','torch'].map(t=>__T.rotN(t)).join(',')")
            rec('회전','v65 방향 수: 앉는 가구 4 · 다른 가구 2 · 꽃병·둥근 탁자·액자·상자·횃불 1', r=='2,2,2,4,4,4,4,1,1,1,1,1', r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(const[i,o]of [...G.objs])if(o.t==='longTable'||o.t==='_part')G.objs.delete(i);GIVE('chair');G.p.x=104.5;G.p.y=108.5;G.p.face={x:1,y:0};T.rotateAction();T.rotateAction();T.rotateAction();T.perform(T.decide());const ch=G.objs.get(T.idx(105,108));const d2=ch.dir;G.inv[0]=null;const a=T.decide();T.perform(a);return [d2,a.u,G.p.dir,G.p.sit&&G.p.sit.dir]}""")
            rec('회전','의자: 4방향 (놓기 전에 세 번 돌리면 왼쪽, 앉으면 그쪽을 봄)', r[0]==3 and r[1]=='sit' and r[2]=='side' and r[3]==3, str(r))
            await pg.wait_for_timeout(400); await pg.screenshot(path=SP+'chair.png')
            await ev(pg,"()=>{const G=__T.G;G.p.sit=null}")
            # big tree (v87): 베면 부속 칸까지 사라지고 묘목 1개, 옛 세이브 그루터기는 2×2로 다시 자람
            await ev(pg,ARENA)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;GIVE('bigTree');T.perform(T.decide());let ai=null;for(const[i,o]of G.objs)if(o.t==='bigTree')ai=i;const x=ai%200,y=(ai/200)|0;G.drops.length=0;G.inv[0]={id:'pickIron',c:1};for(let k=0;k<20&&G.objs.get(ai)&&G.objs.get(ai).t==='bigTree';k++)T.hitObj({x,y},G.objs.get(ai));const o=G.objs.get(ai);const parts=[...G.objs.values()].filter(q=>q.t==='_part').length;
          const sap=G.drops.filter(d=>d.id==='sapling').reduce((n,d)=>n+d.c,0);G.objs.set(ai,{t:'stump',g:'bigTree',at:G.time-1});G.p.x=100.5;T.growTick();const o2=G.objs.get(ai);const parts2=[...G.objs.values()].filter(q=>q.t==='_part').length;return [o?o.t:null,parts,sap,o2.t,parts2]}""")
            rec('자연물','큰 고목: 베면 사라짐(부속 칸 정리)·묘목 1개 / 옛 그루터기 → 다시 2×2로 자람', r==[None,0,1,'bigTree',3], str(r))
            # v113: 나무 작업장은 없어졌어요 (옛 세이브의 것은 재료로 — test_save.py test_auto_refund_v113). 여러 칸 저장은 2인 침대로 확인
            await ev(pg,ARENA)
            await ev(pg,"""()=>{const T=__T,G=T.G;G.p.x=104.5;G.p.y=108.5;G.p.face={x:1,y:0};GIVE('bedDouble');T.perform(T.decide())}""")
            # save / load keeps parts; orphan cleanup
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));s.objs.push([T.idx(118,116),{t:'_part',a:T.idx(1,1)}]);T.deserialize(s);const G2=T.G;let farm=0,parts=0,orph=G2.objs.get(T.idx(118,116));for(const[i,o]of G2.objs){if(o.t==='bedDouble')farm++;if(o.t==='_part')parts++}return [farm,parts>=3,orph||null]}""")
            rec('저장','저장 → 불러오기 후에도 여러 칸 가구 유지 · 떨어진 부속 칸 정리', r[0]==1 and r[1] and r[2] is None, str(r))
            # recipes
            r=await ev(pg,"()=>['bedDouble','longTable','sofa2','bookcase2','kitchenSet','fountainBig','rugBig','rugLong','rugRound','bigTree','bigRock','flowerField','pondBig','treeFarm'].map(id=>{const R=__T.RECIPES.find(r=>r.out===id);return R?R.at:'none'}).join(',')")
            rec('레시피','새 가구·러그·자연물 14종 레시피', 'none' not in r, r)
            # touch rotate button visibility
            await ev(pg,ARENA)
            await ev(pg,"()=>{GIVE('sofa2')}"); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>!document.querySelector('#subBtn').hidden&&document.querySelector('#subLbl').textContent==='방향'")
            await pg.tap('#subBtn'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SP+'rotbtn.png')
            r2=await ev(pg,"()=>{const T=__T,G=T.G;T.perform(T.decide());let ai=null;for(const[i,o]of G.objs)if(o.t==='sofa2')ai=i;const o=G.objs.get(ai);return [o.rot,o.dir]}")
            rec('회전','터치: 가구를 들면 작은 버튼 [방향] → 누르면 옆을 보는 세로 소파 (v65)', r and r2==[1,1], f'{r} {r2}')
            # visual gallery
            await ev(pg,ARENA)
            await ev(pg,"""()=>{const T=__T,G=T.G;const put=(t,x,y,ex)=>{const o=Object.assign({t},ex||{});const i=T.idx(x,y);G.objs.set(i,o);if(T.OBJ[t].sz){for(let dy=0;dy<T.fpOf(o)[1];dy++)for(let dx=0;dx<T.fpOf(o)[0];dx++)if(dx||dy)G.objs.set(T.idx(x+dx,y+dy),{t:'_part',a:i})}};
          put('bedDouble',101,101);put('longTable',104,102);put('sofa2',107,102);put('sofa2',110,101,{rot:1});put('bookcase2',112,101);put('kitchenSet',101,104);put('fountainBig',105,104);put('rugLong',108,104);put('rugRound',101,109);put('bigTree',105,108);put('bigRock',108,108);put('flowerField',110,107,{rot:1});put('pondBig',113,108);put('treeFarm',101,113,{p:G.time-200});put('rugBig',105,112);put('longTable',109,112,{rot:1});put('chair',111,112,{dir:1});put('chair',112,112,{dir:2});put('chair',113,112,{dir:3});put('chair',114,112);
          G.p.x=108.5;G.p.y=111.6;}""")
            await pg.wait_for_timeout(900); await pg.screenshot(path=SP+'gallery.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_furniture_size():
    import asyncio, sys
    # v50: 다른 게임처럼 칸 크기 — 제작대·화로 2×1, 침대 1×2, 벤치 2×1 / 옛 세이브는 그 자리에서 넓힘 / 나무 크게 / 뒤로 가면 반투명 / 32px 그림 부드러운 테두리
    H2=HOOK.replace("computeLight}","computeLight,SPR,fpOf,homePt,effH,effW,iconURL,get W(){return W},get V(){return VIEW},get lowCv(){return lowCv},lc(){POOL=null;return linkedChests().length},newGame}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const O=__T.OBJ;return ['bench','logBench','stoneBench'].map(k=>O[k].sz.join('x')+(O[k].rotV?'r':'')).concat([!!O.forge.sz,!!O.furnace.sz,!!O.smelter.sz,!!O.bed.sz,!!O.mossBed.sz])}")
            rec('칸 크기','작업대 2×1, 벤치 2×1(돌림), 구리 제작대·화로·용광로·침대는 1칸 (v55)', r==['2x1','2x1r','2x1r',False,False,False,False,False], str(r))
            r=await ev(pg,"""async()=>{const T=__T,f=T.SPR.fp,sz=u=>new Promise(res=>{const i=new Image();i.onload=()=>res(i.width+'x'+i.height);i.src=u});
          return [await sz(T.iconURL('logBench')),await sz(T.iconURL('smelter')),await sz(T.iconURL('plant')),await sz(T.iconURL('chair')),f.logBench.small.width,f.logBench.big.width]}""")
            rec('아이콘','가방·제작 화면 아이콘은 늘린 임시 그림이 아니라 원래 1칸 모양, 세로·가로로 긴 그림도 정사각형 칸 (v55)', r==['16x16','22x22','20x20','16x16',16,32], str(r))
            r=await ev(pg,"()=>{const T=__T,S=T.SPR.obj,z=c=>T.effW(c)+'x'+T.effH(c);return [z(S.bench),z(S.furnace),z(S.logBench),z(S.bed),!!S.bedV,z(S.roundTree),z(S.root),Math.round(T.effW(T.SPR.young.roundTree))]}")
            rec('그림','커진 가구·나무는 새 크기 (손그림이 없으면 옛 그림을 늘림, 어린 나무도 같이; v54부터 작업대·둥근 나무는 Fantasyville 그림, v55 작업대 2칸 너비로, 화로 1칸, 뿌리기둥은 캐릭터 키의 2배)', r==['32x27','16x20','32x16','16x24',False,'32x48','22x38',25], str(r))
            # v56: saves from before v50 get the 2×1 workbench too — it grows into the free tile next to it, or comes back to the bag
            r=await ev(pg,"""()=>{const T=__T;T.newGame(31);const G=T.G;const fpNew=JSON.parse(JSON.stringify(T.serialize())).fpV;
          const x=Math.floor(G.p.x)+2,y=Math.floor(G.p.y)+2;for(let yy=y;yy<=y+2;yy+=2)for(let xx=x-1;xx<=x+3;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'bench'});G.objs.set(T.idx(x+1,y),{t:'chest',items:Array(18).fill(null)});
          G.objs.set(T.idx(x-1,y+2),{t:'chest',items:Array(18).fill(null)});G.objs.set(T.idx(x,y+2),{t:'bench'});G.objs.set(T.idx(x+1,y+2),{t:'chest',items:Array(18).fill(null)});
          const before=T.countItem('bench');const old=JSON.parse(JSON.stringify(T.serialize()));delete old.fpV;T.deserialize(old);const G2=T.G,O=T.OBJ,S=T.SPR.obj,g=(dx,dy)=>{const o=G2.objs.get(T.idx(x+dx,y+dy));return o?o.t:'-'};
          return [fpNew,O.bench.sz.join('x'),S.bench===T.SPR.fp.bench.big,g(-1,0),g(0,0),g(1,0),g(0,2),T.countItem('bench')-before,JSON.parse(JSON.stringify(T.serialize())).fpV]}""")
            rec('옛 세이브','v50 전 세이브도 작업대 2×1: 오른쪽이 막히면 왼쪽으로 넓어지고(옆 상자 그대로), 양옆이 막히면 가방으로 (v56)', r==[2,'2x1',True,'bench','_part','chest','-',1,2], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+2,y=Math.floor(G.p.y)+2;for(let yy=y-1;yy<=y+3;yy++)for(let xx=x-1;xx<=x+1;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'bed'});G.objs.set(T.idx(x,y+1),{t:'_part',a:T.idx(x,y)});G.spawnPt={x,y};const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o=T.G.objs.get(T.idx(x,y+1));return [T.G.objs.get(T.idx(x,y)).t,o?o.t:'-']}""")
            rec('침대','v50 때 1×2로 놓은 침대는 불러오면 1칸으로 (아래 칸 비워짐)', r==['bed','-'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+3,y=Math.floor(G.p.y)-3;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+2;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'forge'});G.objs.set(T.idx(x+1,y),{t:'_part',a:T.idx(x,y)});G.objs.set(T.idx(x,y+1),{t:'furnace'});G.objs.set(T.idx(x+1,y+1),{t:'_part',a:T.idx(x,y+1)});
          const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o=T.G.objs.get(T.idx(x+1,y)),o2=T.G.objs.get(T.idx(x+1,y+1));return [T.G.objs.get(T.idx(x,y)).t,o?o.t:'-',T.G.objs.get(T.idx(x,y+1)).t,o2?o2.t:'-']}""")
            rec('구리 제작대','v50~v54 때 2칸으로 놓은 화로는 1칸으로(v55), 구리 제작대는 v60부터 2칸 「구리 작업대」로', r==['bench','_part','furnace','-'], str(r))
            r=await ev(pg,"""async()=>{const T=__T,bad=[];for(const id in T.ITEMS){const u=T.iconURL(id);const d=await new Promise(res=>{const i=new Image();i.onload=()=>res([i.width,i.height]);i.src=u});if(d[0]!==d[1])bad.push(id+' '+d.join('x'))}return bad}""")
            rec('아이콘','모든 아이템 아이콘이 정사각형 (가방에서 1칸, 횃불·화분 포함, v55)', r==[], str(r[:6]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+3,y=Math.floor(G.p.y)-3;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+2;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'forge'});G.objs.set(T.idx(x+1,y),{t:'_part',a:T.idx(x,y)});G.objs.set(T.idx(x,y+1),{t:'furnace'});G.objs.set(T.idx(x+1,y+1),{t:'_part',a:T.idx(x,y+1)});
          const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o=T.G.objs.get(T.idx(x+1,y)),o2=T.G.objs.get(T.idx(x+1,y+1));return [T.G.objs.get(T.idx(x,y)).t,o?o.t:'-',T.G.objs.get(T.idx(x,y+1)).t,o2?o2.t:'-']}""")
            rec('구리 제작대','v50~v54 때 2칸으로 놓은 화로는 1칸으로(v55), 구리 제작대는 v60부터 2칸 「구리 작업대」로', r==['bench','_part','furnace','-'], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.wall[T.idx(G.spawnPt.x,G.spawnPt.y+2)]=0;const h=T.homePt();return [h.x-G.spawnPt.x,Math.round((h.y-G.spawnPt.y)*10)/10]}")
            rec('침대','기절·잠에서 깨면 침대 바로 아래에 섬', r==[0.5,1.6], str(r))
            # a chest touching only the right tile of a 2×1 workbench is still linked
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x),y=Math.floor(G.p.y)+2;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+4;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'bench'});G.objs.set(T.idx(x+1,y),{t:'_part',a:T.idx(x,y)});G.objs.set(T.idx(x+2,y),{t:'chest',items:Array(18).fill(null)});return T.lc()}""")
            rec('상자 연결','2칸 작업대의 오른쪽 칸에 붙은 상자도 재료로 씀', r==1, r)
            # see-through: the canopy of a big tree fades while the player stands behind it
            r=await ev(pg,"""async()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+3,y=Math.floor(G.p.y)+4;for(let yy=y-5;yy<=y+1;yy++)for(let xx=x-3;xx<=x+3;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}
          G.objs.set(T.idx(x,y),{t:'roundTree',hp:3});G.enemies.length=0;const wait=()=>new Promise(r=>setTimeout(r,250));
          const g=T.lowCv.getContext('2d'),orig=g.drawImage,seen=[];g.drawImage=function(img,...a){if(img===T.SPR.obj.roundTree)seen.push(Math.round(g.globalAlpha*100)/100);return orig.call(this,img,...a)};
          const look=async(px,py)=>{G.p.x=px;G.p.y=py;await wait();seen.length=0;await wait();return seen.length?Math.min(...seen):-1};
          const a=await look(x+3.5,y-1.5),b2=await look(x+.5,y-.6),c=await look(x+.5,y+1.6);g.drawImage=orig;return [a,b2,c]}""")
            rec('반투명','큰 나무 뒤로 들어가면 반투명, 옆이나 앞에 있으면 그대로', r==[1,0.45,1], str(r))
            r=await ev(pg,"()=>{const T=__T;const s=JSON.parse(JSON.stringify(T.serialize()));const n=[...T.G.objs.values()].filter(o=>o.t==='_part').length;T.deserialize(s);return [s.fpV,n===[...T.G.objs.values()].filter(o=>o.t==='_part').length,T.OBJ.bench.sz.join('x')]}")
            rec('새 판','새 판 세이브를 다시 불러와도 커진 크기 그대로', r==[2,True,'2x1'], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_building_cleanup():
    import asyncio, sys
    # 건축 정리 (v41): 지붕 삭제, 문 높이·바닥선, 바닥 벽선 맞춤, 양문, 자동 미닫이문 + 최고 레벨 스킬 포인트 (v69: 얇은 벽·창문은 삭제되어 집 벽은 나무 벽)
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,twSprite,twMask,getChunk,hash2,SPR,circuitTick,gainXp,cleanRpg,MAX_LV,XP_NEED,SKILLS,LIFT,cam,TR,floorPx}")
    ROOM="""window.__room=()=>{const T=__T,G=T.G,x0=T.CX+14,y0=T.CY+6;
  for(let y=y0-2;y<y0+12;y++)for(let x=x0-3;x<x0+12;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i)}
  for(let y=y0+1;y<y0+7;y++)for(let x=x0+1;x<x0+8;x++)G.floor[T.idx(x,y)]=5;
  for(let x=x0;x<=x0+8;x++){G.wall[T.idx(x,y0)]=6;G.wall[T.idx(x,y0+7)]=6}
  for(let y=y0;y<=y0+7;y++){G.wall[T.idx(x0,y)]=6;G.wall[T.idx(x0+8,y)]=6}
  G.enemies.length=0;return [x0,y0]};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,1280,800,False)
            await ev(pg,"()=>{"+ROOM+"__T.G.enemies.length=0}")
            # ---- roofs removed ----
            r=await ev(pg,"()=>[!!__T.ITEMS.roofWood,!!__T.ITEMS.roofStone,__T.RECIPES.some(r=>/^roof/.test(r.out)),'roof' in __T.serialize()]")
            rec('지붕 삭제','지붕 아이템·제작법·저장 항목 없음', r==[False,False,False,False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[0]={id:'wood',c:5};const ci=T.idx(T.CX+3,T.CY+3);G.objs.set(ci,{t:'chest',items:Array(18).fill(null)});
          const s=JSON.parse(JSON.stringify(T.serialize()));s.inv[3]={id:'roofWood',c:4};s.inv[4]={id:'roofStone',c:3};const ch=s.objs.find(e=>e[0]===ci);ch[1].items[0]={id:'roofWood',c:1};
          s.roof=[];for(let k=0;k<5;k++)s.roof.push([T.idx(T.CX+20+k,T.CY+20),'wood']);s.roof.push([T.idx(T.CX+20,T.CY+21),'stone']);
          T.deserialize(s);const G2=T.G;const items=G2.inv.filter(Boolean).map(x=>x.id+':'+x.c).join(',');const chest=G2.objs.get(ci).items.filter(Boolean).map(x=>x.id+':'+x.c).join(',');
          return [items,chest,T.countItem('wood'),T.countItem('stone'),'roof' in T.serialize(),G2.stats.roofBack]}""")
            rec('지붕 삭제','옛 세이브: 가방·상자 속 지붕은 재료로 (지붕 2개 = 재료 1개, 올림)', 'roofWood' not in r[0]+r[1] and 'roofStone' not in r[0] and r[1]=='wood:1', str(r))
            rec('지붕 삭제','옛 세이브: 놓인 지붕도 재료로 (나무 5칸 → 3, 돌 1칸 → 1)', r[2]==5+2+3 and r[3]==2+1 and r[4] is False and r[5]==4+3+1+5+1, str(r))
            await pg.wait_for_timeout(1500)
            r=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('지붕 삭제','불러올 때 돌려받았다는 알림', '지붕' in r, r[:80])
            # ---- thin wall height & bottom line ----
            r=await ev(pg,"""()=>{const T=__T;const rows=(img)=>{const g=img.getContext('2d').getImageData(0,0,img.width,img.height).data;let top=-1,bot=-1;for(let y=0;y<img.height;y++){let any=false;for(let x=0;x<img.width;x++)if(g[(y*img.width+x)*4+3]>0)any=true;if(any){if(top<0)top=y;bot=y}}return [top-26,bot-26]};
          const wall=[-T.LIFT,15];return [rows(T.twSprite('bDoorWood',10,false)),rows(T.twSprite('slideDoor',10,0)),wall]}""")
            rec('문 높이','문·자동 미닫이문 윗면·바닥선이 바위벽과 같음 (위 = 벽 높이, 바닥 칸 맨 아래)', r[0]==r[2] and r[1]==r[2], str(r))
            # ---- floor stops at the wall line ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const px=(cv,x,y)=>Array.from(cv.getContext('2d').getImageData(x,y,1,1).data).join(',');
          const at=(x,y,qx,qy)=>{const cv=T.getChunk(Math.floor(x/16),Math.floor(y/16));return px(cv,(x%16)*16+qx,(y%16)*16+qy)};
          const ref=(f,x,y,qx,qy)=>T.TR.ready&&[1,2,5,6].includes(f)?T.floorPx(f,x*16+qx,y*16+qy):px(T.SPR.floor[f][(T.hash2(x,y,5)*4)|0],qx,qy); // v73: grass·dirt·wood·stone are the new floor textures
          const out=[];const y=y0+3;G.wall[T.idx(x0,y)]=0;G.wall[T.idx(x0+8,y)]=0;G.objs.set(T.idx(x0,y),{t:'bDoorWood'});G.objs.set(T.idx(x0+8,y),{t:'bDoorWood'});
          // a door in the left wall: outside grass on the left half, wood floor on the right half
          out.push(at(x0,y,3,5)===ref(1,x0,y,3,5), at(x0,y,12,5)===ref(5,x0,y,12,5));
          // put wood floor under the wall itself: still ends at the wall line
          G.floor[T.idx(x0,y)]=5; out.push(at(x0,y,3,5)===ref(1,x0,y,3,5), at(x0,y,12,5)===ref(5,x0,y,12,5));
          // right wall
          const xr=x0+8;out.push(at(xr,y,3,5)===ref(5,xr,y,3,5), at(xr,y,12,5)===ref(1,xr,y,12,5));
          return out}""")
            rec('바닥','벽에 낸 문 칸: 바깥쪽 절반은 바깥 땅, 안쪽 절반은 방 바닥', r[0] and r[1] and r[4] and r[5], str(r))
            rec('바닥','문 칸에 바닥을 깔아도 벽선에서 딱 끝남', r[2] and r[3], str(r))
            # ---- double door & long window ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const yd=y0+7;G.wall[T.idx(x0+2,yd)]=0;G.wall[T.idx(x0+3,yd)]=0;G.objs.set(T.idx(x0+2,yd),{t:'bDoorWood'});G.objs.set(T.idx(x0+3,yd),{t:'bDoorWood'});
          const m=[T.twMask(x0+2,yd,'door'),T.twMask(x0+3,yd,'door')];
          return [m.map(v=>v&48)]}""")
            rec('양문','같은 종류가 가로로 붙으면 이어짐 표시 (문 2칸)', r[0]==[32,16], str(r[0]))
            await stand(pg,0,0,0,-1)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x0=T.CX+14,y0=T.CY+6,yd=y0+7;G.p.x=x0+2.5;G.p.y=yd+1.5;G.p.face={x:0,y:-1};return [T.decide().k,T.decide().lbl]}""")
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
            r2=await ev(pg,"()=>{const T=__T,G=T.G;const x0=T.CX+14,yd=T.CY+13;return [!!G.objs.get(T.idx(x0+2,yd)).open,!!G.objs.get(T.idx(x0+3,yd)).open]}")
            rec('양문','한쪽을 열면 양문이 함께 열림', r==['use','열기'] and r2==[True,True], str(r)+str(r2))
            # the player standing in the right leaf (facing the left one) blocks closing both
            await ev(pg,"()=>{const T=__T,G=T.G;G.p.x=T.CX+14+3.5;G.p.y=T.CY+13.5;G.p.face={x:-1,y:0}}"); await pg.wait_for_timeout(100)
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
            r=await ev(pg,"()=>{const T=__T,G=T.G;const x0=T.CX+14,yd=T.CY+13;return [!!G.objs.get(T.idx(x0+2,yd)).open,!!G.objs.get(T.idx(x0+3,yd)).open]}")
            await ev(pg,"()=>{const T=__T,G=T.G;G.p.x=T.CX+14+2.5;G.p.y=T.CY+14.5;G.p.face={x:0,y:-1}}"); await pg.wait_for_timeout(100)
            rec('양문','한쪽 문턱에 누가 있으면 둘 다 안 닫힘', r==[True,True], str(r))
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
            r=await ev(pg,"()=>{const T=__T,G=T.G;const x0=T.CX+14,yd=T.CY+13;return [!!G.objs.get(T.idx(x0+2,yd)).open,!!G.objs.get(T.idx(x0+3,yd)).open]}")
            rec('양문','다시 누르면 함께 닫힘', r==[False,False], str(r))
            # ---- auto sliding door ----
            r=await ev(pg,"()=>{const r=__T.RECIPES.find(r=>r.out==='slideDoor');return r&&[r.at,r.cat,JSON.stringify(r.req),__T.ITEMS.slideDoor.n]}")
            rec('자동 미닫이문','석영 작업대·건축 탭 (구리괴 3·철괴 2·수정 조각 1)', r==['bench','build','[["copperBar",3],["ironBar",2],["crystal",1]]','자동 미닫이문'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const sx=x0+4;G.wall[T.idx(sx,y0)]=0;G.objs.set(T.idx(sx,y0),{t:'slideDoor'});G.p.x=sx+.5;G.p.y=y0+1.5;G.p.face={x:0,y:-1};return [T.decide().k,T.decide().lbl]}""")
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
            r2=await ev(pg,"()=>{const T=__T,G=T.G;return !!G.objs.get(T.idx(T.CX+18,T.CY+6)).open}")
            rec('자동 미닫이문','전기가 없으면 손으로 여닫음', r==['use','열기'] and r2 is True, str(r)+str(r2))
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;const o=G.objs.get(T.idx(sx,y0));const shut=!o.open;
          G.objs.set(T.idx(sx,y0-2),{t:'crystalGen'});G.wire.set(T.idx(sx,y0-1),1);G.p.x=sx+.5;G.p.y=y0+5.5;for(let k=0;k<3;k++)T.circuitTick(.2);const far=!!o.open;
          G.p.y=y0+1.5;for(let k=0;k<2;k++)T.circuitTick(.2);const near=!!o.open,lbl=T.decide().lbl;G.p.y=y0+5.5;for(let k=0;k<2;k++)T.circuitTick(.2);const away=!!o.open;
          return [shut,far,near,lbl,away]}""")
            rec('자동 미닫이문','전기가 들어오면: 멀면 닫힘, 다가가면 열림, 멀어지면 닫힘', r[0] and r[1]==False and r[2]==True and r[4]==False, str(r))
            rec('자동 미닫이문','전기가 있을 때 버튼은 "자동문"', r[3]=='자동문', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;const o=G.objs.get(T.idx(sx,y0));G.p.x=sx+.5;G.p.y=y0+6;T.circuitTick(.2);
          G.enemies.length=0;G.enemies.push({k:'slimeG',x:sx+.5,y:y0+1.3,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});for(let k=0;k<3;k++)T.circuitTick(.2);const a=!!o.open;G.enemies.length=0;return [a]}""")
            rec('자동 미닫이문','몬스터가 다가와도 안 열림', r[0] is False, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;G.wall[T.idx(sx+1,y0)]=0;G.objs.set(T.idx(sx+1,y0),{t:'slideDoor'});const m=[T.twMask(sx,y0,'slide')&48,T.twMask(sx+1,y0,'slide')&48];
          G.p.x=sx+1.5;G.p.y=y0+1.4;for(let k=0;k<2;k++)T.circuitTick(.2);return [m,!!G.objs.get(T.idx(sx,y0)).open,!!G.objs.get(T.idx(sx+1,y0)).open]}""")
            rec('자동 미닫이문','두 칸을 붙이면 함께 열림', r==[[32,16],True,True], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;G.p.x=T.CX+19;G.p.y=T.CY+7.4;G.p.face={x:0,y:-1};T.circuitTick(.2)}")
            await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'room.png',clip={'x':340,'y':120,'width':600,'height':560})
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;const o=G.objs.get(T.idx(sx,y0));const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o2=T.G.objs.get(T.idx(sx,y0));return [o2.t,Object.keys(o2).sort().join(',')]}""")
            rec('저장','자동 미닫이문 저장/불러오기 (움직임 상태는 저장 안 함)', r[0]=='slideDoor' and 'sl' not in r[1].split(','), str(r))
            # ---- skill points at the top level ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg=T.cleanRpg(null);let n=0;while(G.rpg.lv<T.MAX_LV&&n<500){T.gainXp(5000);n++}const tot=Object.values(T.SKILLS).reduce((a,s)=>a+s.max,0);return [G.rpg.lv,G.rpg.sp,tot]}""")
            rec('스킬 포인트','최고 레벨 80이면 스킬 포인트 80 (v98: 보너스 1점은 Lv.80에서)', r[:2]==[80,80], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg=T.cleanRpg(null);let n=0;while(G.rpg.lv<T.MAX_LV&&n<9999){T.gainXp(37);n++}return [G.rpg.lv,G.rpg.pts,T.XP_NEED(29),T.XP_NEED(39),T.XP_NEED(79)]}""")
            rec('레벨','v98 레벨 80: 능력치 포인트 Lv.30까지 2점·그 뒤 1점(합계 108), 다음까지 경험치 Lv.29→30 524 · 39→40 1,274 · 79→80 10,274', r==[80,108,524,1274,10274], str(r))
            r=await ev(pg,"""()=>{const T=__T;const sk={};let left=29;for(const k in T.SKILLS){const l=Math.min(T.SKILLS[k].max,left);if(l)sk[k]=l;left-=l}
          const a=T.cleanRpg({lv:80,xp:0,sp:0,sk});const b=T.cleanRpg({lv:80,xp:0,sp:51,sk});const e=T.cleanRpg({lv:30,xp:0,sp:1,sk}).sp;const c=T.cleanRpg({lv:12,xp:0,sp:2,sk:{tough:3,miner:3,dash:3}});const d=T.cleanRpg({lv:12,xp:0,sp:11,sk:{}});return [a.sp,b.sp,c.sp,d.sp,e]}""")
            rec('스킬 포인트','최고 레벨(80)에서 모자라면 채움, 이미 받았으면 그대로, 옛 Lv.30 보너스 1점은 그대로 둠', r==[51,51,2,11,1], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_circuits():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,checkGuide,circuitTick,isSolid,perform,decide,GUIDE,QSIDE,wirePowered,refreshHotbar}")
    ARENA="()=>{const G=__T.G;for(let y=100;y<120;y++)for(let x=100;x<124;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.wire=new Map();G.enemies.length=0;G.p.x=101.5;G.p.y=118.5;G.p.face={x:1,y:0}}"
    W="(xs,y)=>xs.forEach(x=>__T.G.wire.set(__T.idx(x,y),1))"
    O="(t,x,y,ex)=>{const o=Object.assign({t},ex||{});__T.G.objs.set(__T.idx(x,y),o);return o}"
    TICK="(n,dt)=>{for(let k=0;k<n;k++)__T.circuitTick(dt||.2)}"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,f"()=>{{window.W={W};window.O={O};window.TK={TICK}}}")
            # ---------- quests ----------
            r=await ev(pg,"()=>{const R=__T.RECIPES.find(r=>r.out==='gMoss');return [R.at,JSON.stringify(R.req)]}")
            rec('이끼','이끼 섬유로 이끼 흙 (손 제작)', r==[None,'[["fiber",1]]'], str(r))
            await pg.tap('#goal'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[document.querySelector('.sh-head h2').textContent,[...document.querySelectorAll('.qcard.big .st')].map(e=>e.textContent).join(','),document.querySelector('.qrow.lock h4')&&document.querySelector('.qrow.lock h4').textContent]")
            rec('퀘스트','퀘스트 한 줄을 누르면 퀘스트 창 · 진행 중인 이야기 큰 카드 / 다음은 잠김(???) (v84)', '퀘스트' in r[0] and r[1].startswith('진행 중') and r[2]=='???', str(r))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"()=>{const G=__T.G;G.stats.naruMet=1;G.qclaim.naru=1;G.stats.wood=6;__T.checkGuide();return document.querySelector('#goal').classList.contains('dot')}")
            await pg.wait_for_timeout(700); r=await ev(pg,"()=>document.querySelector('#goal').classList.contains('dot')"); rec('퀘스트','받을 보상이 있으면 이야기 한 줄에 점', r, r)
            await pg.keyboard.press('KeyL'); await pg.wait_for_timeout(600)  # v77: L = 퀘스트 (퀘스트 버튼은 없어짐)
            r=await ev(pg,"()=>{const row=document.querySelector('.qcard');return [row.querySelector('.st').textContent,!!row.querySelector('[data-a=qClaim]'),row.querySelector('.qrw').textContent]}")
            rec('퀘스트','완료 + 보상 표시 + 보상 받기 버튼', r[0]=='완료' and r[1] and '이끼 섬유 5' in r[2] and '경험치 10' in r[2], str(r))
            f0=await ev(pg,"()=>__T.countItem('fiber')")
            await pg.tap('.qcard [data-a=qClaim]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.countItem('fiber'),!!document.querySelector('[data-a=qDoneFold]'),!!__T.G.qclaim.wood]")
            rec('퀘스트','보상 받으면 아이템 지급 + 끝난 이야기(접힌 목록)로', r[0]==f0+5 and r[1] and r[2], str(r))
            await pg.screenshot(path=SP+'quest.png')
            await pg.tap('[data-a=qTab][data-i=side]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>document.querySelectorAll('.qcard').length"); rec('퀘스트','도전 탭에 부가 퀘스트 목록', r>=8, r)
            await ev(pg,"()=>{__T.G.stats.made={gMoss:1};__T.closePanel();__T.openPanel('quest');}"); await pg.wait_for_timeout(500); await pg.tap('[data-a=qTab][data-i=side]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const row=document.querySelector('.qcard');return [row.querySelector('h4').textContent,!!row.querySelector('[data-a=qClaim]')]}")
            rec('퀘스트','완료한 도전이 맨 위에 + 보상 받기', '이끼 흙' in r[0] and r[1], str(r))
            await pg.tap('[data-a=qClaimAll]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);return [!!__T.G.qclaim.s_moss,!!__T.G.qclaim.wood]}")
            rec('퀘스트','받은 기록이 저장됨', r==[True,True], str(r)); await ev(pg,"()=>__T.closePanel()")
            # ---------- circuits ----------
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{O('battery',102,105,{e:600});W([103,104,105,106],105);const L=O('eLamp',107,105,{off:true});TK(2);return [L.off,__T.wirePowered(__T.idx(104,105)),!!__T.G.stats.litLamp]}")
            rec('회로','건전지 → 전선 → 전기 램프가 켜짐', r==[False,True,True], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.wire.delete(__T.idx(105,105));const L=G.objs.get(__T.idx(107,105));TK(2);return [L.off,__T.wirePowered(__T.idx(106,105))]}")
            rec('회로','전선이 끊기면 꺼짐', r==[True,False], str(r))
            r=await ev(pg,"()=>{const lv=O('lever',105,105);const L=__T.G.objs.get(__T.idx(107,105));TK(2);const a=L.off;lv.on=true;TK(2);const b=L.off;return [a,b]}")
            rec('회로','레버: 꺼져 있으면 끊고 켜면 이어 줌', r==[True,False], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.objs.delete(__T.idx(105,105));O('plate',105,105);const L=G.objs.get(__T.idx(107,105));G.p.x=101.5;G.p.y=118.5;TK(2);const a=L.off;G.p.x=105.5;G.p.y=105.5;TK(2);const b=L.off;G.p.x=101.5;G.p.y=118.5;return [a,b]}")
            rec('회로','압력판: 올라서 있는 동안만 켜짐', r==[True,False], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.objs.delete(__T.idx(105,105));O('timer',105,105,{per:1});const L=G.objs.get(__T.idx(107,105));const seen=new Set();for(let k=0;k<20;k++){TK(1,.2);seen.add(L.off)}return seen.size}")
            rec('회로','타이머: 켜졌다 꺼졌다 반복', r==2, r)
            # door
            r=await ev(pg,"()=>{const G=__T.G;G.objs.delete(__T.idx(105,105));G.wire.set(__T.idx(105,105),1);G.objs.delete(__T.idx(107,105));const D=O('eDoor',107,105);TK(2);const a=[D.open,__T.isSolid(107,105)];G.wire.delete(__T.idx(105,105));TK(2);return [a,[!!D.open,__T.isSolid(107,105)]]}")
            rec('회로','전기 문: 전기 들어오면 열리고 끊기면 닫힘', r==[[True,False],[False,True]], str(r))
            # drill + chest + battery drain
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;G.wall[__T.idx(110,104)]=4;O('battery',108,108,{e:600});W([109],108);W([110],108);const Dr=O('drillCu',110,105,{dir:{x:0,y:-1}});W([110,111],106);W([110],107);const C=O('chest',111,105,{items:Array(18).fill(null)});TK(65,.2);return [C.items.filter(Boolean).map(s=>s.id+':'+s.c).join(','),G.wall[__T.idx(110,104)],Math.round(G.objs.get(__T.idx(108,108)).e)]}")
            rec('채굴기','구리 광맥 앞 채굴기가 12초마다 광석을 옆 상자에 담음', r[0]=='copperOre:1' and r[1]==4 and r[2]<600, str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.objs.delete(__T.idx(111,105));TK(130,.2);const Dr=G.objs.get(__T.idx(110,105));return [(Dr.store||[]).map(s=>s.id+':'+s.c).join(','),__T.G.stats.drilled]}")
            rec('채굴기','상자가 없으면 채굴기 안에 모아 둠', r[0].startswith('copperOre:') and r[1]>=2, str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.p.x=110.5;G.p.y=106.5;G.p.face={x:0,y:-1};const d=__T.decide();const before=__T.countItem('copperOre');__T.perform(d);return [d.k,d.lbl,__T.countItem('copperOre')-before]}")
            rec('채굴기','채굴기를 누르면 꺼내기', r[0]=='use' and r[1]=='꺼내기' and r[2]>=2, str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.wall[__T.idx(110,104)]=3;TK(3);const Dr=G.objs.get(__T.idx(110,105));return [Dr.work,Dr.why]}")
            rec('채굴기','구리 채굴기는 수정벽을 못 캠', r==[False,'tier'], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.wall[__T.idx(110,104)]=4;const B=G.objs.get(__T.idx(108,108));B.e=1;TK(20,.2);const Dr=G.objs.get(__T.idx(110,105));return [Math.round(B.e),Dr.work,Dr.why]}")
            rec('건전지','건전지가 다 닳으면 멈춤', r==[0,False,'power'], str(r))
            # generator
            r=await ev(pg,"()=>{const G=__T.G;G.objs.delete(__T.idx(108,108));const g=O('generator',108,108);__T.addItem('wood',5);G.p.x=108.5;G.p.y=109.5;G.p.face={x:0,y:-1};const d=__T.decide();__T.perform(d);const f0=g.fuel;TK(10,.2);const Dr=G.objs.get(__T.idx(110,105));return [d.lbl,f0,Math.round(g.fuel),Dr.work,!!G.stats.genRun,__T.countItem('wood')]}")
            rec('발전기','연료 넣기 → 전기 공급, 일할 때만 연료 사용', r[0]=='연료 넣기' and r[1]==150 and r[2]==148 and r[3] and r[4] and r[5]==0, str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.objs.delete(__T.idx(108,108));O('crystalGen',108,108);TK(5);return G.objs.get(__T.idx(110,105)).work}")
            rec('발전기','수정 발전기는 연료 없이 작동', r, r)
            # battery pickup keeps charge, recharge with repair
            r=await ev(pg,"()=>{const G=__T.G;G.objs.delete(__T.idx(108,108));O('battery',108,108,{e:123});G.p.x=108.5;G.p.y=109.5;G.p.face={x:0,y:-1};__T.perform({k:'pickup',t:{x:108,y:108},o:G.objs.get(__T.idx(108,108))});const s=G.inv.find(s=>s&&s.id==='battery');return [s&&s.dur,!!G.objs.get(__T.idx(108,108))]}")
            rec('건전지','회수해도 남은 전기가 유지됨', r==[123,False], str(r))
            r=await ev(pg,"()=>{const G=__T.G;const k=G.inv.findIndex(s=>s&&s.id==='battery');const tmp=G.inv[0];G.inv[0]=G.inv[k];G.inv[k]=tmp;G.sel=0;const d=__T.decide();__T.perform(d);const o=G.objs.get(__T.idx(108,108));return [d.k,o&&o.t,o&&o.e]}")
            rec('건전지','다시 놓으면 그 전기 그대로', r==['place','battery',123], str(r))
            # wires: place & pick up with the wire item
            r=await ev(pg,"()=>{const G=__T.G;for(let i=0;i<9;i++)G.inv[i]=null;G.inv[0]={id:'wire',c:5};G.sel=0;G.p.x=114.5;G.p.y=112.5;G.p.face={x:1,y:0};const d1=__T.decide();__T.perform(d1);const a=G.wire.has(__T.idx(115,112));const d2=__T.decide();__T.perform(d2);return [d1.lbl,a,d2.lbl,G.wire.has(__T.idx(115,112)),__T.countItem('wire')]}")
            rec('빛뿌리','빛뿌리 깔기 / 같은 칸에서 빛뿌리 걷기 (v113: 전선 → 빛뿌리)', r==['빛뿌리 깔기',True,'빛뿌리 걷기',False,5], str(r))
            r=await ev(pg,"()=>{W([120,121],110);const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);return [__T.G.wire.size>=3,__T.G.objs.get(__T.idx(110,105)).dir.y]}")
            rec('저장','전선·기계 상태가 저장됨', r==[True,-1], str(r))
            r=await ev(pg,"()=>__T.RECIPES.filter(r=>r.cat==='circuit').map(r=>r.out+'@'+r.at).join(',')")
            rec('제작','회로 탭 레시피 (작업대 단계(v60), 채굴기는 채굴기 탭)', all(x in r for x in ['wire@bench','battery@bench','generator@bench','crystalGen@bench']) and 'drillCu@bench' not in r, r)
            # visual
            await ev(pg,ARENA)
            await ev(pg,"()=>{const G=__T.G;G.treeSeeds=3;O('battery',103,113,{e:400});W([104,105],113);O('lever',106,113,{on:true});W([107,108,109],113);O('eLamp',110,113,{off:true});W([109],112);W([109],111);O('eDoor',109,110);W([104],114);W([104],115);O('plate',105,115);W([106,107],115);O('eLamp',108,115,{off:true});G.wall[__T.idx(113,111)]=5;O('drillCu',113,112,{dir:{x:0,y:-1}});W([111,112],113);W([113],113);O('chest',114,112,{items:Array(18).fill(null)});G.p.x=107.5;G.p.y=117.5;TK(3)}")
            await pg.wait_for_timeout(1200); await pg.screenshot(path=SP+'circuit.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3]); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main



def test_light_miner_v113():
    import asyncio, sys
    # v113 자동 생산 1 (dev/design/자동생산.md): 보이는 이름은 빛, 등불나무에 빛뿌리를 이으면 끝없는 빛, 빛뿌리는 몬스터가 피하는 밝기에 안 들어감,
    # 채굴기 3단계 레시피(구리·철·금 작업대), 캔 광석이 상자로 날아가는 효과, 옛 돌 채굴기는 그대로 일하고 회수하면 재료
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,circuitTick,wirePowered,perform,decide,QSIDE,ruleLight,markRuleLit}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const I=__T.ITEMS;return ['wire','battery','generator','crystalGen','eLamp','eDoor'].map(k=>I[k].n).join(',')}")
            rec('빛','보이는 이름: 빛뿌리·빛 항아리·불씨 등잔·수정 빛샘·빛뿌리 램프·빛 문', r=='빛뿌리,빛 항아리,불씨 등잔,수정 빛샘,빛뿌리 램프,빛 문', r)
            r=await ev(pg,"()=>{const T=__T;return JSON.stringify(Object.values(T.ITEMS).filter(it=>it&&!it.virtual).map(it=>it.n+' '+(it.d||'')).filter(t=>/전기|전선|건전지|발전기/.test(t)))}")
            rec('빛','아이템 이름·설명에 전기·전선·건전지·발전기가 남지 않음', r=='[]', r[:200])
            # 등불나무(가운데 3×2칸)에 빛뿌리를 이으면 램프가 켜지고, 아무리 오래 켜도 줄지 않음
            r=await ev(pg,"""()=>{const T=__T,G=T.G,X=T.CX+2,Y=T.CY;G.wire=new Map();for(let x=X;x<X+4;x++){const i=T.idx(x,Y);G.wall[i]=0;G.objs.delete(i);G.wire.set(i,1)}const L={t:'eLamp',off:true};G.objs.set(T.idx(X+4,Y),L);
              for(let k=0;k<50;k++)T.circuitTick(.2);const a=[L.off,T.wirePowered(T.idx(X,Y))];G.wire.delete(T.idx(X,Y));T.circuitTick(.2);return [a,L.off]}""")
            rec('빛','등불나무에 빛뿌리를 이으면 빛뿌리 램프가 켜짐 (끝없는 빛), 끊으면 꺼짐', r==[[False,True],True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,x=T.CX+30,y=T.CY+40;for(let dy=-4;dy<=4;dy++)for(let dx=-9;dx<=9;dx++){const i=T.idx(x+dx,y+dy);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}
              G.wire=new Map();T.markRuleLit();const b0=T.ruleLight(x,y);for(let k=-4;k<=4;k++)G.wire.set(T.idx(x+k,y),1);G.objs.set(T.idx(x-8,y),{t:'crystalGen'});for(let k=-7;k<=-5;k++)G.wire.set(T.idx(x+k,y),1);T.circuitTick(.2);const pw=T.wirePowered(T.idx(x,y));T.markRuleLit();const b1=T.ruleLight(x,y);G.objs.delete(T.idx(x-8,y));G.wire=new Map();return [true,pw,b0,b1]}""")
            rec('빛','빛이 흐르는 빛뿌리는 몬스터가 피하는 밝은 곳이 아님 (밝기 그대로)', r[1] and r[2]==r[3], str(r))
            # 채굴기 레시피
            r=await ev(pg,"()=>{const R=__T.RECIPES,f=id=>{const q=R.find(r=>r.out===id);return q?[q.at,q.tier,q.cat,JSON.stringify(q.req)]:null};return [f('drillCu'),f('drillFe'),f('drillGold'),['pitCu','pitFe','pitGold','quarry','treeFarm','drillStone'].some(id=>R.some(r=>r.out===id))]}")
            rec('채굴기','구리 채굴기: 구리 작업대 · 구리괴 6·돌 12·이끼 끈 2', r[0]==['bench',1,'mine','[["copperBar",6],["stone",12],["rope",2]]'], str(r[0]))
            rec('채굴기','철 채굴기: 철 작업대 · 철괴 6·구리괴 4·석영 2 / 황금 채굴기: 금 작업대 · 금괴 4·흑요석 4·철괴 4', r[1]==['bench',2,'mine','[["ironBar",6],["copperBar",4],["crystal",2]]'] and r[2]==['bench',4,'mine','[["goldBar",4],["obsidian",4],["ironBar",4]]'], str(r[1:3]))
            rec('채굴기','채굴장·나무 작업장·돌 채굴기는 레시피 없음', r[3] is False, str(r[3]))
            # 채굴기가 캐면 광석 조각이 상자로 날아감 (보이기만) · 퀘스트 집계
            r=await ev(pg,"""()=>{const T=__T,G=T.G,X=T.CX+3,Y=T.CY+12;for(let y=Y-2;y<=Y+3;y++)for(let x=X-2;x<=X+4;x++){const i=T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.wire=new Map();
              G.wall[T.idx(X,Y-1)]=4;const D={t:'drillCu',dir:{x:0,y:-1}};G.objs.set(T.idx(X,Y),D);const C={t:'chest',items:Array(18).fill(null)};G.objs.set(T.idx(X+1,Y),C);G.objs.set(T.idx(X,Y+2),{t:'crystalGen'});G.wire.set(T.idx(X,Y+1),1);
              G.p.x=X+.5;G.p.y=Y+2.5;G.parts.length=0;const d0=G.stats.drilled||0;let fly=0;for(let k=0;k<64;k++){T.circuitTick(.2);fly=Math.max(fly,G.parts.filter(q=>q.fly).length)}
              return [C.items.filter(Boolean).map(s=>s.id+':'+s.c).join(','),(G.stats.drilled||0)-d0,fly>0,T.QSIDE.find(q=>q.id==='s_drill').t()]}""")
            rec('채굴기','구리 광맥 앞 채굴기가 12초마다 옆 상자에 광석 · 광석 조각이 날아가는 효과', r[0]=='copperOre:1' and r[1]==1 and r[2], str(r))
            rec('퀘스트','「채굴기로 광물 20개 얻기」(조건·보상 그대로)', r[3].startswith('채굴기로 광물 20개 얻기'), r[3])
            r=await ev(pg,"()=>{const q=__T.QSIDE.find(q=>q.id==='s_farm');return [q.t(),JSON.stringify(q.rw),q.xp]}")
            rec('퀘스트','「비버 둥지로 나무 30개 얻기」(조건·보상 그대로)', r[0].startswith('비버 둥지로 나무 30개') and r[1]=='[["rope",4],["battery",1]]' and r[2]==50, str(r))
            # 옛 돌 채굴기: 그대로 일하고, 회수하면 돌 채굴장 재료
            r=await ev(pg,"""()=>{const T=__T,G=T.G,X=T.CX-6,Y=T.CY+12;for(let y=Y-2;y<=Y+3;y++)for(let x=X-2;x<=X+3;x++){const i=T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}
              G.objs.set(T.idx(X,Y),{t:'drillStone',dir:{x:0,y:-1}});G.drops.length=0;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;G.p.x=X+.5;G.p.y=Y+1.5;G.p.face={x:0,y:-1};
              T.perform({k:'pickup',t:{x:X,y:Y},o:G.objs.get(T.idx(X,Y))});return [!!G.objs.get(T.idx(X,Y)),['stone','wood','rope','quarry','drillStone'].map(id=>T.countItem(id)+G.drops.filter(d=>d.id===id).reduce((a,d)=>a+d.c,0)).join(',')]}""")
            rec('채굴기','놓인 옛 돌 채굴기를 회수하면 돌 채굴장 재료로 (돌 40·나무 8·이끼 끈 2)', r==[False,'40,8,2,0,0'], str(r))
            await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'light_miner.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3]); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main

def test_place_pushes_player():
    import asyncio, sys
    # v67 (BF-09): 벽·문·가구를 놓을 칸에 내 몸이 걸치면, 선 칸 옆 4칸(뒤 → 좌우 → 앞) 중 빈 곳으로 비켜서고 놓아요. 빈 곳이 없으면 안 놓고 재료도 그대로.
    # 다른 플레이어·몬스터는 밀지 않아요 (걸리면 놓지 않음)
    H2=HOOK.replace("computeLight}","computeLight,perform,addPlayer,pushSpot,canPlace,placeTiles,boxHits}")
    SET="""(o)=>{const T=__T,G=T.G,X=T.CX+8,Y=T.CY+8;for(let y=Y-4;y<=Y+4;y++)for(let x=X-4;x<=X+4;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i)}
  for(const k of Object.keys(G.players))if(k!=='me')delete G.players[k];G.enemies.length=0;G.drops.length=0;G.p.dead=0;G.p.sit=null;G.fish=null;G.p.kx=G.p.ky=0;G.p.dash=null;G.actCd=0;
  for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:o.id,c:5};G.sel=0;G.tHand=false;G.p.x=X+.9;G.p.y=Y+.5;G.p.face={x:1,y:0};G.pRot=0;
  for(const [dx,dy] of o.walls||[])G.wall[T.idx(X+dx,Y+dy)]=1;
  if(o.mob){const e={k:'slimeG',x:X+o.mob[0]+.5,y:Y+o.mob[1]+.5,hp:999,vx:0,vy:0};G.enemies.push(e)}
  if(o.p2)T.addPlayer('p2',X+o.p2[0],Y+o.p2[1]);
  const d=T.decide();const before=G.inv[0]&&G.inv[0].c;if(d.k==='place')T.perform(d);
  const t=G.objs.get(T.idx(X+1,Y)),w=G.wall[T.idx(X+1,Y)];const at=[+(G.p.x-X).toFixed(2),+(G.p.y-Y).toFixed(2)];
  const res={k:d.k,placed:!!(t||w),left:G.inv[0]?G.inv[0].c:0,before,at,inside:T.boxHits(G.p.x,G.p.y,.28)};G.enemies.length=0;for(const k of Object.keys(G.players))if(k!=='me')delete G.players[k];return res}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,f"()=>{{window.SET={SET}}}")
            r=await ev(pg,"()=>SET({id:'wallWood'})")
            rec('밀어내기','몸이 걸친 칸에 벽: 뒤 칸으로 비켜서고 놓음 (재료 1개 씀)', r['k']=='place' and r['placed'] and r['left']==4 and r['at']==[-0.5,0.5] and not r['inside'], str(r))
            r=await ev(pg,"()=>SET({id:'wallWood',walls:[[-1,0]]})")
            rec('밀어내기','뒤가 막히면 옆 칸으로', r['placed'] and r['at'][0]==0.5 and abs(r['at'][1]-0.5)==1 and not r['inside'], str(r))
            r=await ev(pg,"()=>SET({id:'wallWood',walls:[[-1,0],[0,1],[0,-1]]})")
            rec('밀어내기','네 방향 모두 막히면 안 놓고 재료·자리 그대로', not r['placed'] and r['left']==5 and r['at']==[0.9,0.5], str(r))
            r=await ev(pg,"()=>SET({id:'wallWood',mob:[-1,0]})")
            rec('밀어내기','몬스터가 있는 칸으로는 안 감 (다음 후보로)', r['placed'] and r['at'][0]==0.5 and not r['inside'], str(r))
            r=await ev(pg,"()=>SET({id:'wallWood',p2:[1.5,.5]})")
            rec('밀어내기','다른 플레이어가 놓을 칸에 있으면 밀지 않고 안 놓음', not r['placed'] and r['left']==5 and r['at']==[0.9,0.5], str(r))
            r=await ev(pg,"()=>SET({id:'wallWood',p2:[-.5,.5]})")
            rec('밀어내기','다른 플레이어가 서 있는 칸으로는 안 감 (다음 후보로)', r['placed'] and r['at'][0]==0.5 and not r['inside'], str(r))
            r=await ev(pg,"()=>SET({id:'bDoorWood'})")
            rec('밀어내기','문도 같은 규칙', r['placed'] and r['at']==[-0.5,0.5], str(r))
            r=await ev(pg,"()=>SET({id:'rug'})")
            rec('밀어내기','지나갈 수 있는 것(러그)은 겹쳐도 그대로 놓고 안 움직임', r['placed'] and r['at']==[0.9,0.5], str(r))
            # a piece of furniture that takes several tiles
            r=await ev(pg,"""()=>{const T=__T;const id=Object.keys(T.ITEMS).find(k=>{const it=T.ITEMS[k];const d=it.kind==='place'&&T.OBJ[it.obj];return d&&d.sz&&d.solid&&!d.station&&(d.sz[0]*d.sz[1])>=2});const r=SET({id});const G=T.G;
              const X=T.CX+8,Y=T.CY+8,tiles=T.placeTiles(X+1,Y,T.ITEMS[id]);const ptx=Math.floor(G.p.x),pty=Math.floor(G.p.y);return [id,r.k,r.left,tiles.some(([a,b])=>a===ptx&&b===pty),r.inside]}""")
            rec('밀어내기','여러 칸 가구: 차지하는 칸 밖으로 비켜서고 놓음', r[1]=='place' and r[2]==4 and r[3] is False and r[4] is False, str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;const s=JSON.stringify(T.serialize());T.deserialize(JSON.parse(s));return [+(G.p.x).toFixed(2)===+(T.G.p.x).toFixed(2)]}")
            rec('저장','비켜선 자리는 저장·불러오기 뒤에도 그대로', r==[True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_quest_active_v84():
    import asyncio, sys
    # v84: 퀘스트 활성화(이야기·도전 통틀어 하나, 해제, 도전은 보상을 받으면 빔), 화살표는 활성 퀘스트의 가장 가까운 할 곳(밝힌 곳만), HUD 한 줄 앞 글자, 진행 막대, 지도에서 보기, 저장
    H2=HOOK.replace("computeLight}","computeLight,checkGuide,activeQuest,questGo,claimQuest,splitSave,get goalTarget(){return goalTarget},get panel(){return panel},get UIS(){return UIS}}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const T=__T,G=T.G;T.checkGuide();return [G.qAct,T.activeQuest().id,document.querySelector('#goalTag').textContent,document.querySelector('#goalTxt').textContent.includes('나루')]}")
            rec('활성','새 게임은 첫 이야기(v110 나루에게 말 걸기)가 활성, HUD 한 줄 앞에 「이야기」', r==['main','naru','이야기',True], str(r))
            # 화살표: 밝힌 곳만 — 물가를 가리키는 도전 (낚시)
            r=await ev(pg,"""()=>{const T=__T,G=T.G,px=Math.floor(G.p.x),py=Math.floor(G.p.y);G.explored.fill(0);for(let y=py-30;y<=py+30;y++)for(let x=px-30;x<=px+30;x++){const j=T.idx(x,y);if(G.floor[j]===T.WATER)G.floor[j]=1}
              const wi=T.idx(px+12,py);G.floor[wi]=T.WATER;G.wall[wi]=0;return 0}""")
            await ev(pg,"()=>document.querySelector('#goal').click()"); await pg.wait_for_timeout(600)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=qTab][data-i=side]').click()"); await pg.wait_for_timeout(250)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=qAct][data-i=s_fish]').click()"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>{const T=__T,G=T.G;T.checkGuide();const c=[...document.querySelectorAll('#sheet .qcard')].find(e=>e.querySelector('[data-a=qAct][data-i=none]'));return [G.qAct,!!T.goalTarget,c&&c.innerText.includes('아직 찾지 못했어요'),c&&!c.querySelector('[data-a=qMap]'),document.querySelector('#goalTag').textContent]}")
            rec('활성','도전 활성화 → HUD 「도전」, 밝히지 않은 물가는 화살표 없이 「아직 찾지 못했어요」·지도 버튼 없음', r==['s_fish',False,True,True,'도전'], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G,px=Math.floor(G.p.x),py=Math.floor(G.p.y);G.explored[T.idx(px+12,py)]=1;G.time+=2;T.checkGuide();const t=T.goalTarget;return t?[Math.floor(t.x)-px,Math.floor(t.y)-py]:null}")
            rec('활성','물가를 밝히면 화살표가 그 물가를 가리킴 (1초에 한 번 다시 찾음)', r==[12,0], str(r))
            await ev(pg,"()=>{__T.closePanel();__T.openPanel('quest')}"); await pg.wait_for_timeout(600)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=qTab][data-i=side]').click()"); await pg.wait_for_timeout(250)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=qMap][data-i=s_fish]').click()"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>[__T.panel&&__T.panel.kind,!!__T.UIS.mapFocus]")
            rec('활성','「지도에서 보기」 → 지도가 그 목표에', r==['map',True], str(r))
            await ev(pg,"()=>__T.closePanel()")
            # 진행 막대 · 도전을 끝내고 보상을 받으면 활성이 빔 → 「퀘스트 고르기」
            await ev(pg,"()=>{const T=__T,G=T.G;G.stats.fishCaught=4;T.openPanel('quest')}")
            await pg.wait_for_timeout(500); await ev(pg,"()=>document.querySelector('#sheet [data-a=qTab][data-i=side]').click()"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>{const c=[...document.querySelectorAll('#sheet .qcard')].find(e=>e.querySelector('[data-a=qAct][data-i=none]'));const b=c&&c.querySelector('.qbar');return b?[b.getAttribute('aria-valuenow'),b.getAttribute('aria-valuemax'),b.querySelector('i').style.width]:null}")
            rec('활성','숫자가 있는 도전은 진행 막대 (4/10)', r==['4','10','40%'], str(r))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.stats.fishCaught=10;T.checkGuide();const a=document.querySelector('#goalTxt').textContent;T.claimQuest('s_fish');T.checkGuide();return [a.startsWith('보상 받기'),G.qAct,T.goalTarget,document.querySelector('#goalTxt').textContent,document.querySelector('#goalTag').textContent]}")
            rec('활성','다 하면 HUD에 「보상 받기」, 받으면 활성이 비고 화살표 없음 · 「퀘스트 고르기」', r==[True,'none',None,'퀘스트 고르기','퀘스트'], str(r))
            # 이야기 활성화 → 다음 이야기로 이어짐 · 잠긴 이야기는 활성화 못 함 · 해제
            await ev(pg,"()=>{__T.G.qAct='none';__T.G.stats.naruMet=1;__T.checkGuide()}")  # v110: 첫 이야기(나루에게 말 걸기)를 끝내 두고 뿌리기둥부터
            await ev(pg,"()=>{__T.UIS.qTab='main';__T.openPanel('quest')}"); await pg.wait_for_timeout(600)
            r1=await ev(pg,"()=>[!!document.querySelector('#sheet .qcard.big [data-a=qAct][data-i=wood]'),!!document.querySelector('#sheet .qrow.lock [data-a=qAct]')]")
            await ev(pg,"()=>document.querySelector('#sheet .qcard.big [data-a=qAct][data-i=wood]').click()"); await pg.wait_for_timeout(250)
            r2=await ev(pg,"()=>{const T=__T,G=T.G;const a=G.qAct;G.stats.wood=6;T.checkGuide();return [a,T.activeQuest().id]}")
            rec('활성','진행 중인 이야기만 활성화 버튼(잠긴 이야기는 없음), 이야기 활성은 다음 이야기로 이어짐', r1==[True,False] and r2==['main','bench'], str([r1,r2]))
            await ev(pg,"()=>{__T.closePanel();__T.UIS.qTab='main';__T.openPanel('quest')}"); await pg.wait_for_timeout(600)
            await ev(pg,"()=>document.querySelector('#sheet .qcard.big [data-a=qAct][data-i=none]').click()"); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>{const T=__T,G=T.G;T.checkGuide();return [G.qAct,T.goalTarget,document.querySelector('#goalTxt').textContent]}")
            rec('활성','활성화 해제 → 안내 없이 (화살표 없음)', r==['none',None,'퀘스트 고르기'], str(r))
            await ev(pg,"()=>__T.closePanel()")
            # 저장: 사람마다(플레이어별), 옛 세이브는 진행 중인 이야기
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.qAct='s_kill';const s=JSON.parse(JSON.stringify(T.serialize())),sp=T.splitSave(s);T.deserialize(s);const a=T.G.qAct;delete s.qAct;T.deserialize(s);const pl=Object.values(sp.world.players)[0];return [a,T.G.qAct,'qAct' in pl,'qAct' in sp.world]}")
            rec('활성','저장·불러오기 그대로, 플레이어별 저장 칸, 옛 세이브는 진행 중인 이야기(main)', r==['s_kill','main',True,False], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main



def test_dig_flow_v87():
    import asyncio, sys
    # v87 바닥 파기 (dev/design/바닥파기.md): 물·용암 흐름(물 0.5초·용암 2초, 만나면 돌 바닥, 용암은 떨어진 물건을 태움·물은 밀어냄, 불러온 뒤에도 이어짐),
    # 빈 양동이(물고기 10마리로 열림, 물은 줄지 않음, 용암 못 뜸), 못 파는 곳(등불나무 둘레·보스방), 구덩이에 둘러싸이면 갇힘,
    # 벤 나무·딴 덤불은 사라지고 묘목·씨앗 1개, 옛 그루터기는 한 번 자람, 하루 하나 새 자연물(최대 7개 쌓임)
    H2=HOOK.replace("computeLight}","computeLight,flowNear,flowTick,scoopWater,digWhy,regionOf,hitObj,harvest,growTick,regrow,dayNo,recipeOn,RECIPES,canPlace,PIT,LAVA}")
    CLR="""window.CLR=()=>{const T=__T,G=T.G,X=T.CX+20,Y=T.CY+20;for(let y=Y-6;y<=Y+6;y++)for(let x=X-6;x<=X+8;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i);G.biome[i]=0}
  G.enemies.length=0;G.drops.length=0;G.p.x=X+.5;G.p.y=Y-4.4;return [X,Y]}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,f"()=>{{{CLR}}}")
            # 1. 물이 이어진 구덩이로 한 칸씩 (0.5초)
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();G.floor[T.idx(X-1,Y)]=T.WATER;for(let k=0;k<4;k++)G.floor[T.idx(X+k,Y)]=T.PIT;T.flowNear(X,Y);
              const f=()=>[0,1,2,3].map(k=>G.floor[T.idx(X+k,Y)]),out=[];G.time+=.3;T.flowTick();out.push(f());G.time+=.3;T.flowTick();out.push(f());for(let k=0;k<3;k++){G.time+=.55;T.flowTick()}out.push(f());out.push(G.floor[T.idx(X-1,Y)]);return out}""")
            rec('흐름','물: 0.3초엔 그대로, 0.6초에 첫 칸, 이어서 끝까지 / 원래 물은 그대로', r==[[22,22,22,22],[10,22,22,22],[10,10,10,10],10], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();G.floor[T.idx(X-1,Y)]=T.LAVA;G.floor[T.idx(X,Y)]=T.PIT;T.flowNear(X,Y);const a=[];G.time+=1;T.flowTick();a.push(G.floor[T.idx(X,Y)]);G.time+=1.1;T.flowTick();a.push(G.floor[T.idx(X,Y)]);return a}""")
            rec('흐름','용암은 2초에 한 칸', r==[22,17], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();G.floor[T.idx(X-1,Y)]=T.WATER;G.floor[T.idx(X+1,Y)]=T.LAVA;G.floor[T.idx(X,Y)]=T.PIT;T.flowNear(X,Y);G.time+=.6;T.flowTick();return [G.floor[T.idx(X,Y)]]}""")
            rec('흐름','물과 용암이 만나는 구덩이는 돌 바닥(6)', r[0]==6, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();const d=(x,y)=>({id:'wood',c:1,x,y,vx:0,vy:0,z:0,vz:0,t:0,hold:0});
              G.floor[T.idx(X-1,Y)]=T.LAVA;G.floor[T.idx(X,Y)]=T.PIT;G.drops.push(d(X+.5,Y+.5));G.floor[T.idx(X-1,Y+3)]=T.WATER;G.floor[T.idx(X,Y+3)]=T.PIT;G.drops.push(d(X+.5,Y+3.5));
              T.flowNear(X,Y);T.flowNear(X,Y+3);G.time+=2.2;T.flowTick();const w=G.drops.find(q=>Math.abs(q.y-(Y+3.5))<1.6);
              return [G.floor[T.idx(X,Y)],G.drops.filter(q=>Math.floor(q.x)===X&&Math.floor(q.y)===Y).length,G.floor[T.idx(X,Y+3)],!!w&&!(Math.floor(w.x)===X&&Math.floor(w.y)===Y+3),G.drops.length]}""")
            rec('흐름','용암은 떨어진 물건을 태우고, 물은 옆 칸으로 밀어냄', r==[17,0,10,True,1], str(r))
            r=await ev(pg,"""()=>{const T=__T,[X,Y]=CLR();let G=T.G;G.floor[T.idx(X-1,Y)]=T.WATER;G.floor[T.idx(X,Y)]=T.PIT;const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);G=T.G;T.flowTick();G.time+=1;T.flowTick();return G.floor[T.idx(X,Y)]}""")
            rec('흐름','불러온 뒤에도 구덩이 옆 물이 흘러 들어옴', r==10, str(r))
            # 2. 빈 양동이
            r=await ev(pg,"""()=>{const T=__T,G=T.G,rc=T.RECIPES.find(r=>r.out==='bucket');G.stats.fishCaught=3;const a=T.recipeOn(rc);G.stats.fishCaught=10;const c=T.recipeOn(rc);
              return [a,c,rc.at,rc.tier,JSON.stringify(rc.req),T.ITEMS.bucket.kind]}""")
            rec('양동이','레시피: 물고기 10마리부터, 구리 작업대, 나무 4 + 구리괴 1', r==[False,True,'bench',1,'[["wood",4],["copperBar",1]]','bucket'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();G.floor[T.idx(X,Y)]=T.WATER;G.floor[T.idx(X+1,Y)]=T.LAVA;const n0=T.countItem('gWater');
              const a=T.scoopWater({x:X,y:Y}),b=T.scoopWater({x:X,y:Y}),c=T.scoopWater({x:X+1,y:Y});return [a,b,c,T.countItem('gWater')-n0,G.floor[T.idx(X,Y)]]}""")
            rec('양동이','물 칸에서 물 한 동이 (물은 그대로), 용암은 못 뜸', r==[True,True,False,2,10], str(r))
            # 3. 못 파는 곳, 구덩이에 둘러싸이면 갇힘, 구덩이엔 벽·가구 못 놓음
            r=await ev(pg,"""()=>{const T=__T,G=T.G,a=[T.CX+3,T.CY+4],b=[T.BX+3,T.BY];for(const [x,y] of [a,b]){const i=T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=2}
              return [T.digWhy(...a),T.digWhy(...b)]}""")
            rec('못 파는 곳','등불나무 둘레·보스방은 못 팜', '등불나무' in r[0] and '보스방' in r[1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])G.floor[T.idx(X+dx,Y+dy)]=T.PIT;const reg=T.regionOf(X+.5,Y+.6);
              return [!!reg&&reg.size,T.canPlace(X+1,Y,T.ITEMS.wallWood),T.canPlace(X+1,Y,T.ITEMS.chair),T.canPlace(X+1,Y,T.ITEMS.gMoss)]}""")
            rec('구덩이','구덩이에 둘러싸이면 갇힘(긴급 탈출 대상), 벽·가구는 못 놓고 바닥 재료는 됨', r==[1,False,False,True], str(r))
            # 4. 나무·덤불
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();const out=[];for(const [k,seed] of [['root','sapling'],['bigShroom','capSapling'],['roundTree','sapling']]){G.drops.length=0;const i=T.idx(X,Y),o={t:k,dmg:99};G.objs.set(i,o);T.hitObj({x:X,y:Y},o);
              out.push([k,G.objs.get(i)?G.objs.get(i).t:null,G.drops.filter(d=>d.id===seed).reduce((n,d)=>n+d.c,0)])}return out}""")
            rec('나무','벤 나무는 그루터기 없이 사라지고 묘목 꼭 1개', all(x[1] is None and x[2]==1 for x in r), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();G.drops.length=0;const i=T.idx(X,Y),o={t:'bush',r:0};G.objs.set(i,o);T.harvest({x:X,y:Y},o);
              return [!!G.objs.get(i),G.drops.filter(d=>d.id==='berrySeed').reduce((n,d)=>n+d.c,0),G.drops.some(d=>d.id==='berry')]}""")
            rec('덤불','딴 베리덤불은 사라지고 베리 씨앗 1개 + 베리', r==[False,1,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,[X,Y]=CLR();const i=T.idx(X,Y);G.objs.set(i,{t:'stump',g:'root',at:G.time-1});G.p.x=X+5.5;T.growTick(2);const a=G.objs.get(i)&&G.objs.get(i).t;
              const o=G.objs.get(i);if(o){delete o.yg;o.dmg=99;T.hitObj({x:X,y:Y},o)}return [a,G.objs.get(i)?G.objs.get(i).t:null]}""")
            rec('나무','옛 세이브 그루터기는 한 번 다 자라고, 그다음 베면 사라짐', r==['root',None], str(r))
            # 5. 하루 하나 새 자연물
            r=await ev(pg,"""()=>{const T=__T,G=T.G,today=T.dayNo();G.natDay=null;let n0=G.objs.size;T.regrow();const a=[G.natDay===today,G.objs.size-n0];
              G.natDay=today-10;n0=G.objs.size;T.regrow();a.push(G.objs.size-n0,G.natDay===today);n0=G.objs.size;T.regrow();a.push(G.objs.size-n0);
              G.natDay=today-2;n0=G.objs.size;T.regrow();a.push(G.objs.size-n0);return a}""")
            rec('자연 재생','처음엔 오늘부터 셈(0개), 10일 밀리면 7개까지, 같은 날 다시는 0개, 2일이면 2개', r==[True,0,7,True,0,2], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.natDay=T.dayNo()-1;const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);return T.G.natDay===T.dayNo()-1}")
            rec('저장','마지막으로 센 날이 저장됨', r is True, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_build_mode_v91():
    import asyncio, sys
    # v91 건축 모드: 가방 창 「건축」·Z로 켬, 목록(가방 + 16칸 안 상자), 끌어서 벽 한 줄·바닥 네모(최대 64칸, 8칸 안), 「놓기」 버튼(앞 칸),
    # 만들어서 놓기(그 제작대 단계까지 올렸어야), 벽·바닥 바꾸기(원래 것은 가방으로, 캘 수 없는 벽은 안 됨), 건축 중에는 공격·상호작용 없음
    H2=HOOK.replace("computeLight}","computeLight,runCmd,BM,bmOpen,bmClose,bmList,readCtl,emit,frontTile,get VIEW(){return VIEW},get TP(){return TP}}")
    # 플레이어 둘레 11×11을 빈 이끼 바닥으로, 가방 비우기, 상자·몬스터 치우기 (한 번의 ev 안에서)
    SET="""()=>{const T=__T,G=T.G,X=T.CX+20,Y=T.CY+20;for(let y=Y-12;y<=Y+12;y++)for(let x=X-12;x<=X+12;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i);G.under.delete(i)}
  for(const [j,o] of [...G.objs])if(o&&o.t==='chest'){const x=j%600,y=(j/600)|0;}G.enemies.length=0;G.drops.length=0;G.p.dead=0;G.p.sit=null;G.p.x=X+.5;G.p.y=Y+.5;G.p.face={x:1,y:0};G.p.kx=G.p.ky=0;G.p.dash=null;
  for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.tools=[];G.stats.bench=0;G.stats.benchLv=0;return [X,Y]}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await pg.evaluate("()=>document.body.classList.add('touch')")
            X,Y=await ev(pg,SET)
            await ev(pg,"()=>{const G=__T.G;G.inv[12]={id:'wallWood',c:20};G.inv[13]={id:'floorWood',c:80}}")
            # 켜기: 가방 창의 「건축」 버튼
            await ev(pg,"()=>__T.openPanel('inv')"); await pg.wait_for_timeout(600)  # 창이 막 열린 뒤 0.45초 동안은 창 안 누르기를 무시해요
            hint=await ev(pg,"()=>{const s=document.getElementById('sheet');return [!!s.querySelector('.hint'),!!s.querySelector('.bb-hint'),/늘려요|차지하지 않아요|버튼이 나와요/.test(s.textContent)]}")
            rec('가방 창','설명 글이 모두 빠짐', hint==[False,False,False], str(hint))
            await pg.click('[data-a=buildMode]'); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>{const v=s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none'&&!e.hidden};return [__T.BM.on,document.getElementById('sheetWrap').hidden,v('#bmBar'),v('#bmPut'),v('#bmTop'),v('#hotbar'),v('#atkBtn'),v('#actBtn'),v('#goal'),v('#hud .side')]}")
            rec('켜기','가방 창 「건축」 → 창 닫히고 목록·놓기·완료만, 단축칸·공격·상호작용·이야기·오른쪽 위 버튼 숨김', r==[True,True,True,True,True,False,False,False,False,False], str(r))
            r=await ev(pg,"()=>{const l=__T.bmList();const w=l.find(e=>e.id==='wallWood'),f=l.find(e=>e.id==='floorWood');return [w&&w.cat,w&&w.have,f&&f.cat]}")
            rec('목록','가방 것을 분류해 보여 줌 (나무 벽 → 벽, 나무 바닥 → 바닥)', r==['wall',20,'floor'], str(r))
            # 화면을 끌어서 벽 한 줄 (UI 그대로: 손가락 누르기 → 움직이기 → 떼기)
            pos=await ev(pg,"""([X,Y])=>{const T=__T,V=T.VIEW,d=devicePixelRatio,f=(x,y)=>[((x+.5)*T.TP-V.baseX)/d,((y+.5)*T.TP-V.baseY)/d];return [f(X-3,Y-2),f(X-3,Y-1),f(X,Y-1),f(X+2,Y-1)]}""",[X,Y])
            async def drag(pts,pid):
                await pg.dispatch_event('#cv','pointerdown',{'pointerId':pid,'pointerType':'touch','isPrimary':True,'clientX':pts[0][0],'clientY':pts[0][1]})
                for x,y in pts[1:]: await pg.dispatch_event('#cv','pointermove',{'pointerId':pid,'pointerType':'touch','clientX':x,'clientY':y})
                await pg.dispatch_event('#cv','pointerup',{'pointerId':pid,'pointerType':'touch','clientX':pts[-1][0],'clientY':pts[-1][1]})
            await drag(pos[:3],11); await pg.wait_for_timeout(100)
            r=await ev(pg,"([X,Y])=>{const T=__T,G=T.G,w=(dx,dy)=>G.wall[T.idx(X+dx,Y+dy)];return [w(-3,-2),w(-3,-1),w(-2,-1),w(-1,-1),w(0,-1),w(1,-1),G.inv[12].c]}",[X,Y])
            rec('연속 놓기','벽은 끈 길을 따라 한 줄 (5칸, 재료 5개)', r==[6,6,6,6,6,0,15], str(r))
            # 목록·조이스틱 위에서 떼면 취소
            bar=await ev(pg,"()=>{const r=document.getElementById('bmBar').getBoundingClientRect();return [r.left+40,r.top+60]}")
            await drag([pos[3],bar],12); await pg.wait_for_timeout(80)
            r=await ev(pg,"([X,Y])=>[__T.G.wall[__T.idx(X+2,Y-1)],__T.G.inv[12].c]",[X,Y])
            rec('연속 놓기','손가락을 목록 위로 가져가 떼면 안 놓음', r==[0,15], str(r))
            # 바닥 네모 (명령으로)
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G,c=[];for(let y=Y+2;y<=Y+4;y++)for(let x=X-2;x<=X+1;x++)c.push([x,y]);T.runCmd({k:'bplace',id:'floorWood',cells:c,rot:0});let n=0;for(const [x,y] of c)if(G.floor[T.idx(x,y)]===5)n++;return [n,G.inv[13].c]}""",[X,Y])
            rec('연속 놓기','바닥 여러 칸 한 번에 (4×3 = 12칸)', r==[12,68], str(r))
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G,c=[];for(let y=Y-8;y<=Y+8;y++)for(let x=X-8;x<=X+8;x++)if(G.floor[T.idx(x,y)]!==5)c.push([x,y]);const before=G.inv[13].c;T.runCmd({k:'bplace',id:'floorWood',cells:c,rot:0});return [c.length>64,before-G.inv[13].c]}""",[X,Y])
            rec('연속 놓기','한 번에 최대 64칸', r==[True,64], str(r))
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[12]={id:'wallWood',c:5};const ok=T.runCmd({k:'bplace',id:'wallWood',cells:[[X+9,Y],[X,Y+9]],rot:0});return [ok,G.wall[T.idx(X+9,Y)],G.wall[T.idx(X,Y+9)],G.inv[12].c]}""",[X,Y])
            rec('거리','8칸 밖에는 안 놓음', r==[False,0,0,5], str(r))
            # 바꾸기: 바닥 위 다른 바닥 → 원래 바닥은 가방으로 / 벽 위 다른 벽
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[14]={id:'floorStone',c:3};const n0=T.countItem('floorWood');T.runCmd({k:'bplace',id:'floorStone',cells:[[X-2,Y+2]],rot:0});return [G.floor[T.idx(X-2,Y+2)],T.countItem('floorWood')-n0,G.inv[14].c]}""",[X,Y])
            rec('바꾸기','나무 바닥 위에 돌 바닥 → 바뀌고 나무 바닥 1개 돌려받음', r==[6,1,2], str(r))
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[14]={id:'wallBrick',c:3};const i=T.idx(X-3,Y-2),j=T.idx(X+3,Y+5),k=T.idx(X+4,Y+5);G.wall[j]=1;G.wall[k]=10;const w0=T.countItem('wallWood'),d0=T.countItem('dirt');
              T.runCmd({k:'bplace',id:'wallBrick',cells:[[X-3,Y-2]],rot:0});const a=[G.wall[i],T.countItem('wallWood')-w0];
              T.runCmd({k:'bplace',id:'wallBrick',cells:[[X+3,Y+5]],rot:0});a.push(G.wall[j],T.countItem('dirt')-d0);
              T.runCmd({k:'bplace',id:'wallBrick',cells:[[X+4,Y+5]],rot:0});a.push(G.wall[k],G.inv[14].c);return a}""",[X,Y])
            rec('바꾸기','쌓은 나무 벽 → 돌벽돌 벽(나무 벽 돌려받음), 흙벽도 바뀜(흙 받음), 곡괭이 없이 금 광맥은 안 바뀜', r==[7,1,7,1,10,1], str(r))
            # 가까운 상자에서 꺼내 쓰기 (가방에 없을 때)
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;for(let i=0;i<G.inv.length;i++)if(G.inv[i]&&G.inv[i].id==='wallWood')G.inv[i]=null;const ch={t:'chest',items:Array(18).fill(null)};ch.items[0]={id:'wallWood',c:4};G.objs.set(T.idx(X+6,Y+6),ch);
              const far={t:'chest',items:Array(18).fill(null)};far.items[0]={id:'wallWood',c:9};G.objs.set(T.idx(X+18,Y),far);
              const e=T.bmList().find(e=>e.id==='wallWood');T.runCmd({k:'bplace',id:'wallWood',cells:[[X+5,Y-4],[X+5,Y-3]],rot:0});return [e&&e.bag,e&&e.box,G.wall[T.idx(X+5,Y-4)],ch.items[0]&&ch.items[0].c,far.items[0].c]}""",[X,Y])
            rec('상자','가방에 없으면 16칸 안 상자에서 꺼내 씀 (16칸 밖 상자는 안 셈)', r==[0,4,6,2,9], str(r))
            # 만들어서 놓기: 작업대를 놓은 적이 없으면 안 되고, 있으면 재료로 바로
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;for(const [j,o] of [...G.objs])if(o&&o.t==='chest'&&Math.abs(j%600-X)<30)G.objs.delete(j);for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[20]={id:'wood',c:10};G.stats.bench=0;
              const e0=T.bmList().find(e=>e.id==='wallWood');const ok0=T.runCmd({k:'bplace',id:'wallWood',cells:[[X+6,Y-4]],rot:0});
              G.stats.bench=1;const e1=T.bmList().find(e=>e.id==='wallWood');T.runCmd({k:'bplace',id:'wallWood',cells:[[X+6,Y-4],[X+6,Y-3],[X+6,Y-2]],rot:0});
              return [!!e0,ok0,!!(e1&&e1.r&&e1.can),G.wall[T.idx(X+6,Y-4)],G.wall[T.idx(X+6,Y-2)],T.countItem('wood'),T.countItem('wallWood')]}""",[X,Y])
            rec('만들어서 놓기','작업대 전엔 안 됨 → 작업대를 놓은 뒤엔 나무로 바로 (2개씩 만들어 3칸 놓고 1개 남음)', r==[False,False,True,6,6,6,1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.bench=1;G.stats.benchLv=0;const l=T.bmList();const lc=l.find(e=>e.id==='lampCrystal');G.stats.benchLv=3;const l2=T.bmList().find(e=>e.id==='lampCrystal');return [!!lc,!!l2]}""")
            rec('만들어서 놓기','석영 작업대 레시피는 그 단계까지 올렸어야 목록에 나옴', r==[False,True], str(r))
            # 「놓기」 버튼: 보는 쪽 앞 칸에 한 칸
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.p.x=X+.5;G.p.y=Y+.5;G.p.face={x:0,y:1};G.inv[21]={id:'chair',c:2};T.BM.cat='furn';T.BM.id='chair';const t=T.frontTile();return [t.x-X,t.y-Y]}""",[X,Y])
            await pg.dispatch_event('#bmPut','pointerdown',{'pointerId':13,'pointerType':'touch'}); await pg.wait_for_timeout(80)
            r2=await ev(pg,"([X,Y])=>{const o=__T.G.objs.get(__T.idx(X,Y+1));return [o&&o.t,__T.G.inv[21].c]}",[X,Y])
            rec('놓기 버튼','앞 칸(보는 쪽)에 한 칸 놓음', r==[0,1] and r2==['chair',1], str(r)+str(r2))
            # 건축 중에는 공격·상호작용 없음, 맞으면 빨간 번쩍
            await pg.keyboard.down('KeyJ'); r=await ev(pg,"()=>{const c=__T.readCtl();return [c.atk,c.act,c.aim]}"); await pg.keyboard.up('KeyJ')
            rec('조작','건축 중에는 공격·상호작용·조준을 보내지 않음', r==[False,False,None], str(r))
            r=await ev(pg,"()=>{__T.emit('hurt');return document.getElementById('hurtEdge').classList.contains('on')}")
            rec('조작','건축 중에 맞으면 화면 가장자리 빨간 번쩍', r is True, str(r))
            # 화면 배치: 목록·놓기·조이스틱 자리가 겹치지 않고 화면 안
            r=await ev(pg,"""()=>{const R=s=>document.querySelector(s).getBoundingClientRect(),bar=R('#bmBar'),put=R('#bmPut'),top=R('#bmTop'),j=R('#joy');const ov=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
              return [ov(bar,put),ov(bar,j),ov(put,j),bar.bottom<=innerHeight+1&&bar.left>=-1&&bar.right<=innerWidth+1,top.right<=innerWidth+1&&top.top>=0,document.documentElement.scrollWidth>innerWidth]}""")
            rec('화면','폰: 목록·놓기·조이스틱이 겹치지 않고 화면 안', r==[False,False,False,True,True,False], str(r))
            # 끄기: 완료 / 창을 열면 / Z
            await pg.click('#bmDone'); r=await ev(pg,"()=>[__T.BM.on,document.body.classList.contains('building'),document.getElementById('bmBar').hidden]")
            rec('끄기','「완료」로 끔', r==[False,False,True], str(r))
            await pg.keyboard.press('KeyZ'); r1=await ev(pg,"()=>__T.BM.on"); await ev(pg,"()=>__T.openPanel('map')"); r2=await ev(pg,"()=>__T.BM.on"); await ev(pg,"()=>__T.closePanel()")
            await pg.keyboard.press('KeyZ'); await pg.keyboard.press('Escape'); r3=await ev(pg,"()=>[__T.BM.on,!!document.getElementById('sheetWrap').hidden]")
            rec('끄기','Z로 켜고, 창을 열면 꺼지고, Esc는 건축만 끔(설정 창 안 열림)', r1 is True and r2 is False and r3==[False,True], str([r1,r2,r3]))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main

def test_build_mode_v92():
    import asyncio, sys
    # v92 건축 모드 2: 옮기기(든 상자·굽는 중인 것도 그대로, 여러 칸은 새 자리 모두 비어야), 뜯기(누르기·끌기, 직접 놓은 것만, 든 상자는 안 됨),
    # 되돌리기(마지막 한 번: 뜯기·옮기기·놓기), 직접 쌓은 자연 재료 벽 기록(G.bwall, 세이브에 남음)
    H2=HOOK.replace("computeLight}","computeLight,runCmd,BM,bmOpen,bmClose,bmTool,myWall,bmList,get VIEW(){return VIEW},get TP(){return TP}}")
    SET="""()=>{const T=__T,G=T.G,X=T.CX+20,Y=T.CY+20;for(let y=Y-12;y<=Y+12;y++)for(let x=X-12;x<=X+12;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i);G.under.delete(i)}
  G.enemies.length=0;G.drops.length=0;G.p.dead=0;G.p.sit=null;G.p.x=X+.5;G.p.y=Y+.5;G.p.face={x:1,y:0};G.p.kx=G.p.ky=0;G.p.dash=null;G.p.bmUndo=null;
  for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.tools=[];return [X,Y]}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await pg.evaluate("()=>document.body.classList.add('touch')")
            X,Y=await ev(pg,SET)
            await ev(pg,"()=>__T.bmOpen()")
            # 뜯기: 직접 쌓은 흙벽은 뜯고(흙 돌려받음), 자연 흙벽은 안 뜯음(곡괭이로)
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[12]={id:'dirt',c:3};T.runCmd({k:'bplace',id:'dirt',cells:[[X+2,Y-2]],rot:0});G.wall[T.idx(X+3,Y-2)]=1;
              const a=[G.wall[T.idx(X+2,Y-2)],T.myWall(T.idx(X+2,Y-2)),T.myWall(T.idx(X+3,Y-2))];T.runCmd({k:'btake',cells:[[X+2,Y-2],[X+3,Y-2]]});
              a.push(G.wall[T.idx(X+2,Y-2)],G.wall[T.idx(X+3,Y-2)],T.countItem('dirt'));return a}""",[X,Y])
            rec('뜯기','쌓은 흙벽은 뜯어 흙을 돌려받고, 자연 흙벽은 그대로', r==[1,True,False,0,1,3], str(r))
            # 뜯기: 가구는 가방으로, 든 상자는 안 됨, 빈 상자는 됨
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.objs.set(T.idx(X+2,Y),{t:'chair'});const full={t:'chest',items:Array(18).fill(null)};full.items[0]={id:'wood',c:3};G.objs.set(T.idx(X+2,Y+1),full);G.objs.set(T.idx(X+2,Y+2),{t:'chest',items:Array(18).fill(null)});
              T.runCmd({k:'btake',cells:[[X+2,Y],[X+2,Y+1],[X+2,Y+2]]});return [!!G.objs.get(T.idx(X+2,Y)),T.countItem('chair'),!!G.objs.get(T.idx(X+2,Y+1)),!!G.objs.get(T.idx(X+2,Y+2)),T.countItem('chest')]}""",[X,Y])
            rec('뜯기','의자·빈 상자는 가방으로, 물건이 든 상자는 남음', r==[False,1,True,False,1], str(r))
            # 끌어서 여러 칸: 깐 바닥 3×2 → 바닥 6개 돌려받고 원래 이끼 바닥이 드러남, 그다음 되돌리기
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[13]={id:'floorWood',c:6};const c=[];for(let y=Y+3;y<=Y+4;y++)for(let x=X-3;x<=X-1;x++)c.push([x,y]);T.runCmd({k:'bplace',id:'floorWood',cells:c,rot:0});
              const n0=T.countItem('floorWood');T.runCmd({k:'btake',cells:c});const a=[n0,T.countItem('floorWood'),c.filter(([x,y])=>G.floor[T.idx(x,y)]===1).length];
              T.runCmd({k:'bundo'});a.push(T.countItem('floorWood'),c.filter(([x,y])=>G.floor[T.idx(x,y)]===5).length,!!G.p.bmUndo);
              T.runCmd({k:'btake',cells:c});G.p.x=X+.5;return a}""",[X,Y])
            rec('뜯기·되돌리기','바닥 6칸을 한 번에 뜯고, 되돌리기로 다시 깔림(가방에서 6개), 되돌리기는 한 번만', r==[0,6,6,0,6,False], str(r))
            # 옮기기: 든 상자는 물건 그대로, 굽는 중인 용광로는 진행 그대로
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;const ch={t:'chest',items:Array(18).fill(null)};ch.items[3]={id:'wood',c:7};G.objs.set(T.idx(X+1,Y-3),ch);
              const fu={t:'furnace',job:{q:3,t0:G.time,out:'copperBar'}};G.objs.set(T.idx(X-2,Y-3),fu);
              const a=[T.runCmd({k:'bmove',from:[X+1,Y-3],to:[X+4,Y-3]})!==false,T.runCmd({k:'bmove',from:[X-2,Y-3],to:[X-4,Y-1]})!==false];
              const c2=G.objs.get(T.idx(X+4,Y-3)),f2=G.objs.get(T.idx(X-4,Y-1));a.push(!!G.objs.get(T.idx(X+1,Y-3)),c2===ch&&c2.items[3].c,f2===fu&&!!f2.job);return a}""",[X,Y])
            rec('옮기기','물건이 든 상자·굽는 중인 용광로도 내용·진행 그대로 옮김', r==[True,True,False,7,True], str(r))
            # 되돌리기(옮기기) → 원래 자리
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;T.runCmd({k:'bundo'});return [!!G.objs.get(T.idx(X-2,Y-3)),!!G.objs.get(T.idx(X-4,Y-1))]}""",[X,Y])
            rec('되돌리기','옮기기를 되돌리면 원래 자리로', r==[True,False], str(r))
            # 여러 칸 가구: 새 자리 모든 칸이 비어야 / 벽 위로는 안 됨 / 8칸 밖도 안 됨
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[14]={id:'bench',c:1};T.runCmd({k:'bplace',id:'bench',cells:[[X+1,Y+6]],rot:0});const a0=T.G.objs.get(T.idx(X+1,Y+6))||T.G.objs.get(T.idx(X,Y+6));
              let ax=-1;for(let x=X-1;x<=X+2;x++){const o=G.objs.get(T.idx(x,Y+6));if(o&&o.t==='bench')ax=x}G.wall[T.idx(X+6,Y+6)]=6;
              const bad=T.runCmd({k:'bmove',from:[ax,Y+6],to:[X+6,Y+6]}),far=T.runCmd({k:'bmove',from:[ax,Y+6],to:[X+10,Y+6]}),ok=T.runCmd({k:'bmove',from:[ax,Y+6],to:[X+3,Y+8]});
              const n=[...G.objs.values()].filter(o=>o.t==='_part'&&G.objs.get(o.a)&&G.objs.get(o.a).t==='bench').length;return [ax>=0,bad,far,!!ok,n,G.objs.get(T.idx(ax,Y+6))?G.objs.get(T.idx(ax,Y+6)).t:null]}""",[X,Y])
            rec('옮기기','여러 칸 가구: 벽이 걸리거나 8칸 밖이면 안 되고, 빈 자리로는 옮겨지고 옛 칸은 비음', r[:3]==[True,False,False] and r[3] is True and r[4]==1 and r[5] is None, str(r))
            # 되돌리기(놓기): 마지막에 놓은 것을 걷어 가방으로
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[15]={id:'wallWood',c:4};T.runCmd({k:'bplace',id:'wallWood',cells:[[X-5,Y-5],[X-5,Y-4],[X-5,Y-3]],rot:0});const a=[G.wall[T.idx(X-5,Y-4)],T.countItem('wallWood')];
              T.runCmd({k:'bundo'});a.push(G.wall[T.idx(X-5,Y-4)],T.countItem('wallWood'));return a}""",[X,Y])
            rec('되돌리기','놓기를 되돌리면 놓은 벽 3칸을 걷어 가방으로', r==[6,1,0,4], str(r))
            # 세이브: 쌓은 자연 재료 벽 기록이 남음
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[12]={id:'granite',c:2};T.runCmd({k:'bplace',id:'granite',cells:[[X-6,Y]],rot:0});const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);return [Array.isArray(s.bwall),T.myWall(T.idx(X-6,Y))]}""",[X,Y])
            rec('세이브','쌓은 화강암 벽 기록이 저장·불러오기 뒤에도 남음', r==[True,True], str(r))
            X,Y=await ev(pg,SET)
            # v93: 흙·얼음 덩이는 벽 탭과 바닥 탭에 둘 다 — 바닥 탭(#g)으로 네모를 끌면 구덩이 메우기·자연 바닥 바꾸기 (벽은 안 생김)
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;G.inv[16]={id:'dirt',c:4};const l=T.bmList().filter(e=>e.base==='dirt').map(e=>e.cat+':'+e.id).sort().join(',');
              G.floor[T.idx(X+6,Y+6)]=22;T.runCmd({k:'bplace',id:'dirt#g',cells:[[X+6,Y+6],[X+7,Y+6]],rot:0});
              return [l,G.floor[T.idx(X+6,Y+6)],G.floor[T.idx(X+7,Y+6)],G.wall[T.idx(X+6,Y+6)],G.wall[T.idx(X+7,Y+6)],T.countItem('dirt'),T.countItem('gMoss')]}""",[X,Y])
            rec('건축 모드','v93: 흙이 벽 탭·바닥 탭에 둘 다, 바닥 탭으로 구덩이 메우기·이끼 바닥 바꾸기(이끼 흙 돌려받음)', r==['floor:dirt#g,wall:dirt',2,2,0,0,2,1], str(r))
            # v93: 옛 세이브의 흙 한 삽·얼음 한 삽은 같은 개수의 흙·얼음 덩이로
            r=await ev(pg,"""([X,Y])=>{const T=__T,G=T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;const ci=T.idx(X-8,Y-8);G.objs.set(ci,{t:'chest',items:Array(18).fill(null)});
              const s=JSON.parse(JSON.stringify(T.serialize()));s.inv[20]={id:'gDirt',c:7};s.inv[21]={id:'gIce',c:3};const ch=s.objs.find(([i])=>i===ci);ch[1].items[0]={id:'gDirt',c:5};
              T.deserialize(s);const o=T.G.objs.get(ci);return [T.countItem('dirt'),T.countItem('iceBlock'),o.items[0]&&o.items[0].id,o.items[0]&&o.items[0].c,T.G.inv.some(x=>x&&/^g(Dirt|Ice)$/.test(x.id))]}""",[X,Y])
            rec('세이브','v93: 옛 세이브의 흙 한 삽 7·얼음 한 삽 3·상자 속 흙 한 삽 5 → 흙 7·얼음 덩이 3·상자 흙 5', r==[7,3,'dirt',5,False], str(r))
            # 화면: 뜯기 버튼 → 손가락으로 벽 끌기 / 옮기기 버튼 → 누르고 다른 칸 누르기
            X,Y=await ev(pg,SET); await ev(pg,"()=>{__T.bmClose();__T.bmOpen()}")
            await ev(pg,"([X,Y])=>{const T=__T,G=T.G;for(let x=X-3;x<=X-1;x++){G.wall[T.idx(x,Y-2)]=6}G.objs.set(T.idx(X+2,Y+2),{t:'chair'})}",[X,Y])
            pos=await ev(pg,"""([X,Y])=>{const T=__T,V=T.VIEW,d=devicePixelRatio,f=(x,y)=>[((x+.5)*T.TP-V.baseX)/d,((y+.5)*T.TP-V.baseY)/d];return [f(X-3,Y-2),f(X-1,Y-2),f(X+2,Y+2),f(X+4,Y+3)]}""",[X,Y])
            async def drag(pts,pid):
                await pg.dispatch_event('#cv','pointerdown',{'pointerId':pid,'pointerType':'touch','isPrimary':True,'clientX':pts[0][0],'clientY':pts[0][1]})
                for x,y in pts[1:]: await pg.dispatch_event('#cv','pointermove',{'pointerId':pid,'pointerType':'touch','clientX':x,'clientY':y})
                await pg.dispatch_event('#cv','pointerup',{'pointerId':pid,'pointerType':'touch','clientX':pts[-1][0],'clientY':pts[-1][1]})
            await pg.click('[data-bt=take]'); await pg.wait_for_timeout(80)
            r0=await ev(pg,"()=>[__T.BM.tool,document.getElementById('bmPut').textContent,!!document.querySelector('#bmBar .bm-slots')]")
            await drag(pos[:2],21); await pg.wait_for_timeout(80)
            r=await ev(pg,"([X,Y])=>{const T=__T;return [0,1,2].map(k=>T.G.wall[T.idx(X-3+k,Y-2)]).concat([T.countItem('wallWood'),!document.querySelector('[data-bu]').disabled])}",[X,Y])
            rec('화면','「뜯기」를 고르면 목록 칸이 숨고 버튼이 「뜯기」, 벽 한 줄을 끌어 3칸 뜯음, 되돌리기 버튼 켜짐', r0==['take','뜯기',False] and r==[0,0,0,3,True], str(r0)+str(r))
            await pg.click('[data-bt=move]'); await pg.wait_for_timeout(60)
            await drag([pos[2]],22); await pg.wait_for_timeout(60)
            g=await ev(pg,"()=>[!!__T.BM.grab,document.getElementById('bmPut').textContent]")
            await drag([pos[3]],23); await pg.wait_for_timeout(60)
            r=await ev(pg,"([X,Y])=>{const T=__T;const o=T.G.objs.get(T.idx(X+4,Y+3));return [!!T.G.objs.get(T.idx(X+2,Y+2)),o&&o.t,!!T.BM.grab]}",[X,Y])
            rec('화면','「옮기기」: 의자를 누르면 잡히고(버튼 「내려놓기」), 다른 칸을 누르면 옮겨짐', g==[True,'내려놓기'] and r==[False,'chair',False], str(g)+str(r))
            await pg.click('[data-bu]'); await pg.wait_for_timeout(60)
            r=await ev(pg,"([X,Y])=>{const T=__T;return [!!T.G.objs.get(T.idx(X+2,Y+2)),!!T.G.objs.get(T.idx(X+4,Y+3))]}",[X,Y])
            rec('화면','되돌리기 버튼 → 의자가 원래 자리로', r==[True,False], str(r))
            await pg.keyboard.press('Digit3'); r1=await ev(pg,"()=>__T.BM.tool"); await pg.keyboard.press('Digit1'); r2=await ev(pg,"()=>__T.BM.tool")
            rec('화면','PC 키 3 = 뜯기, 1 = 놓기', [r1,r2]==['take','place'], str([r1,r2]))
            r=await ev(pg,"""()=>{const R=s=>document.querySelector(s).getBoundingClientRect(),bar=R('#bmBar');return [bar.bottom<=innerHeight+1&&bar.left>=-1&&bar.right<=innerWidth+1,document.documentElement.scrollWidth>innerWidth,[...document.querySelectorAll('.bm-tools button')].every(b=>b.scrollWidth<=b.clientWidth+1)]}""")
            rec('화면','폰: 놓기·옮기기·뜯기·되돌리기 줄이 화면 안에 들어가고 글자가 넘치지 않음', r==[True,False,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
