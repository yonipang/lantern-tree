# 건축·지형·회로: 삽·지형, 문, 여러 칸 가구·회전, 가구 칸 크기, 건축 정리, 회로·채굴기
# 실행: python3 dev/qa/run.py building   (테스트 하나만: python3 dev/qa/run.py terrain_shovel)
from harness import *


def test_terrain_shovel():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,checkGuide,subAction:()=>subAction(),get act(){return G.act},canPlace,RECIPES}")
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
            # 4. locked terrain
            await setup("G.terrain={};__T.addItem('shovel',1);"+tool.format('shovel'))
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().msg]")
            rec('지형 해금','배우기 전: 이끼 파기 막힘 + 방법 안내', r[0]=='info' and '이끼는 아직' in r[1] and '구리 곡괭이' in r[1], str(r))
            r=await ev(pg,"()=>__T.ITEMS.shovel.d")
            rec('지형 해금','삽 설명에 배운/아직 지형 표시', '배운 지형: 흙' in r and '아직:' in r, r[-80:])
            # unlock moss via quest
            await ev(pg,"()=>{__T.addItem('pickCopper',1);__T.G.stats.wood=9;__T.G.stats.bench=1;__T.G.stats.torch=1;__T.G.stats.copperOre=9;__T.G.stats.copperBar=2;__T.checkGuide()}")
            await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.G.terrain[1], document.querySelector('#toasts').innerText.includes('새 지형을 배웠어요: 이끼')]")
            rec('지형 해금','퀘스트 「구리 곡괭이」 완료 → 이끼 해금 + 알림', r==[1,True], str(r))
            await ev(pg,"()=>{const G=__T.G;"+tool.format('shovel')+"}"); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('지형 해금','배운 뒤: 삽 들고 이끼 → 파기', r==['dig','파기'], str(r))
            await tap(pg,1)
            r=await ev(pg,f"()=>[{F(111,110)}, __T.countItem('gMoss')]")
            rec('삽','이끼를 파면 흙이 되고 이끼 한 삽 획득', r==[2,1], str(r))
            r=await ev(pg,"()=>__T.decide().lbl")
            rec('삽','흙은 더 못 팜', r=='흙 땅', r)
            # place moss elsewhere: make a dirt tile in front
            await ev(pg,"()=>{const G=__T.G;G.floor[__T.idx(111,110)]=2;G.p.x=112.5;G.p.face={x:-1,y:0};G.floor[__T.idx(111,110)]=2;"+sel.format('gMoss')+"}"); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('지형 배치','이끼 한 삽 들고 흙 → 덮기', r==['place','덮기'], str(r))
            await tap(pg,1); r=await ev(pg,f"()=>{F(111,110)}")
            rec('지형 배치','흙이 이끼로 바뀜', r==1, r)
            # dirt crafting recipe and fill water
            r=await ev(pg,"()=>!!__T.RECIPES.find(r=>r.out==='gDirt'&&r.req[0][0]==='dirt'&&r.at===null)")
            rec('지형 배치','흙 한 삽은 흙으로 어디서나 제작', r)
            await setup("__T.addItem('gDirt',2);G.floor[__T.idx(111,110)]=__T.WATER;"+sel.format('gDirt'))
            r=await ev(pg,"()=>__T.decide().lbl"); await tap(pg,1)
            r2=await ev(pg,f"()=>{F(111,110)}")
            rec('지형 배치','흙으로 물 메우기', r=='덮기' and r2==2, f'{r} {r2}')
            # water unlock by fishing
            await setup("G.terrain={1:1};G.stats.fishCaught=10;__T.addItem('shovel',1);G.floor[__T.idx(111,110)]=__T.WATER;")
            await ev(pg,"()=>{__T.checkGuide();const G=__T.G;"+sel.format('shovel')+"}"); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>[__T.G.terrain[10], __T.decide().lbl]")
            rec('지형 해금','물고기 10마리 → 물 해금, 물 뜨기', r==[1,'물 뜨기'], str(r))
            await tap(pg,1); r=await ev(pg,f"()=>[{F(111,110)}, __T.countItem('gWater')]")
            rec('삽','물을 뜨면 흙이 되고 물 한 동이 획득', r==[2,1], str(r))
            await ev(pg,"()=>{const G=__T.G;"+sel.format('gWater')+"}"); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>__T.decide().lbl"); await tap(pg,1); r2=await ev(pg,f"()=>{F(111,110)}")
            rec('지형 배치','물 한 동이 붓기 → 물웅덩이', r=='붓기' and r2==10, f'{r} {r2}')
            # bosses unlock
            await ev(pg,"()=>{__T.G.bossDead.queen=true;__T.G.bossDead.golem=true;__T.checkGuide()}")
            r=await ev(pg,"()=>[__T.G.terrain[3],__T.G.terrain[4]]")
            rec('지형 해금','버섯 여왕/수정골렘 → 버섯흙/수정바닥 해금', r==[1,1], str(r))
            # save roundtrip
            await setup("__T.addItem('floorStone',1);"+sel.format('floorStone'))
            await tap(pg,1)
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);return [__T.G.under.get(__T.idx(111,110)), __T.G.terrain[3], __T.G.floor[__T.idx(111,110)]]}")
            rec('저장','깔린 바닥 아래 땅·해금 정보가 저장됨', r==[1,1,6], str(r))
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
            r=await ev(pg,"()=>{const ids=['Thin','Half','Win','Frame','Fence','Door','Pillar'];return ['Wood','Stone'].every(m=>ids.every(t=>__T.RECIPES.some(r=>r.out==='b'+t+m&&r.at==='bench'&&r.cat==='build')))&&!__T.RECIPES.some(r=>/^roof/.test(r.out))}")
            rec('제작','나무·돌 각각 7종 제작법 (작업대·건축 탭), 지붕은 v41에서 삭제', r)
            r=await ev(pg,"()=>[__T.ITEMS.bThinWood.n,__T.ITEMS.bDoorStone.n]")
            rec('제작','이름', r==['나무 얇은 벽','돌 문'], str(r))
            # place thin walls by holding while walking
            await setup("__T.addItem('bThinWood',5);G.sel=G.inv.findIndex(s=>s&&s.id==='bThinWood');")
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('설치','얇은 벽 들고 → 놓기', r==['place','놓기'], str(r))
            await tap(pg,1); r=await ev(pg,"()=>__T.G.objs.get(__T.idx(111,110))?.t")
            rec('설치','얇은 벽 설치', r=='bThinWood', r)
            r=await ev(pg,"()=>[__T.decide().k, (__T.G.alts||[]).some(a=>a.k==='pickup')]")
            rec('설치','이미 있는 칸 앞: 회수 대신 안내 + 작은 [회수] 버튼', r==['info',True], str(r))
            # door
            await setup("G.objs.set(__T.idx(111,110),{t:'bDoorWood'});")
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('문','문 앞 → 열기', r==['use','열기'], str(r))
            await tap(pg,1); r=await ev(pg,"()=>[!!__T.G.objs.get(__T.idx(111,110)).open, __T.decide().lbl]")
            rec('문','열리고 버튼은 닫기로', r==[True,'닫기'], str(r))
            # walk through open door
            await ev(pg,"()=>{const G=__T.G;G.objs.set(__T.idx(111,109),{t:'bThinWood'});G.objs.set(__T.idx(111,111),{t:'bThinWood'})}")
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
            # big tree: chop -> stump -> regrow, dig stump -> item
            await ev(pg,ARENA)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;GIVE('bigTree');T.perform(T.decide());let ai=null;for(const[i,o]of G.objs)if(o.t==='bigTree')ai=i;const x=ai%200,y=(ai/200)|0;G.inv[0]={id:'pickIron',c:1};for(let k=0;k<20&&G.objs.get(ai)&&G.objs.get(ai).t==='bigTree';k++)T.hitObj({x,y},G.objs.get(ai));const o=G.objs.get(ai);const parts=[...G.objs.values()].filter(q=>q.t==='_part').length;
          o.at=G.time-1;G.p.x=100.5;T.growTick();const o2=G.objs.get(ai);const parts2=[...G.objs.values()].filter(q=>q.t==='_part').length;return [o.t,o.g,parts,o2.t,parts2]}""")
            rec('자연물','큰 고목: 베면 그루터기(부속 칸 정리) → 다시 2×2로 자람', r==['stump','bigTree',0,'bigTree',3], str(r))
            # tree workshop manual + automation
            await ev(pg,ARENA)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.p.x=104.5;G.p.y=108.5;G.p.face={x:1,y:0};GIVE('treeFarm');T.perform(T.decide());let ai=null;for(const[i,o]of G.objs)if(o.t==='treeFarm')ai=i;const o=G.objs.get(ai);G.inv[0]=null;const a=T.decide();const st0=T.farmStage(o);o.p=G.time-T.FARM_GROW-1;const b=T.decide();G.drops.length=0;T.perform(b);return [a.k,a.lbl,st0,b.lbl,G.drops.map(d=>d.id).join(','),T.farmStage(o)]}""")
            rec('나무 작업장','놓으면 자라기 시작 · 다 자라면 [베기] → 나무 · 다시 처음부터', r[0]=='use' and r[2]==0 and r[3]=='베기' and 'wood' in r[4] and r[5]==0, str(r))
            await pg.wait_for_timeout(300);
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let ai=null;for(const[i,o]of G.objs)if(o.t==='treeFarm')ai=i;const o=G.objs.get(ai);const x=ai%200,y=(ai/200)|0;
          G.objs.set(T.idx(x+2,y+1),{t:'chest',items:Array(18).fill(null)});
          G.objs.set(T.idx(x,y+3),{t:'battery',e:600});G.wire.set(T.idx(x,y+2),1);
          o.p=G.time-T.FARM_GROW-1;T.circuitTick(.2);const ch=G.objs.get(T.idx(x+2,y+1));const w1=ch.items.filter(Boolean).map(s=>s.id+':'+s.c).join(',');const st=T.farmStage(o);
          G.wire.clear();o.p=G.time-T.FARM_GROW-1;T.circuitTick(.2);const st2=T.farmStage(o);return [w1,st,st2]}""")
            rec('나무 작업장','전기 연결(부속 칸 아래 전선) → 다 자라면 저절로 베어 옆 상자에 담음', 'wood' in r[0] and r[1]==0, str(r))
            rec('나무 작업장','전기가 끊기면 자동으로 베지 않음', r[2]==3, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let ai=null;for(const[i,o]of G.objs)if(o.t==='treeFarm')ai=i;const o=G.objs.get(ai);const x=ai%200,y=(ai/200)|0;G.objs.delete(T.idx(x+2,y+1));G.wire.set(T.idx(x,y+2),1);for(let k=0;k<3;k++){o.p=G.time-T.FARM_GROW-1;T.circuitTick(.2)}const n=(o.store||[]).reduce((a,s)=>a+s.c,0);G.p.x=x-0.5;G.p.y=y+.5;G.p.face={x:1,y:0};G.inv[0]=null;const a=T.decide();T.perform(a);return [n>0,a.lbl,(o.store||[]).length,T.countItem('wood')>0]}""")
            rec('나무 작업장','상자가 없으면 안에 모아 두고 [꺼내기]', r[0] and r[1]=='꺼내기' and r[2]==0 and r[3], str(r))
            await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'farm.png')
            # save / load keeps parts; orphan cleanup
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));s.objs.push([T.idx(118,116),{t:'_part',a:T.idx(1,1)}]);T.deserialize(s);const G2=T.G;let farm=0,parts=0,orph=G2.objs.get(T.idx(118,116));for(const[i,o]of G2.objs){if(o.t==='treeFarm')farm++;if(o.t==='_part')parts++}return [farm,parts>=3,orph||null]}""")
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
    # 건축 정리 (v41): 지붕 삭제, 얇은 벽 높이·바닥선, 바닥 벽선 맞춤, 양문·긴 창, 자동 미닫이문 + 최고 레벨 스킬 포인트
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,twSprite,twMask,getChunk,hash2,SPR,circuitTick,gainXp,cleanRpg,MAX_LV,SKILLS,LIFT,cam}")
    ROOM="""window.__room=()=>{const T=__T,G=T.G,x0=T.CX+14,y0=T.CY+6;
  for(let y=y0-2;y<y0+12;y++)for(let x=x0-3;x<x0+12;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i)}
  for(let y=y0+1;y<y0+7;y++)for(let x=x0+1;x<x0+8;x++)G.floor[T.idx(x,y)]=5;
  for(let x=x0;x<=x0+8;x++){G.objs.set(T.idx(x,y0),{t:'bThinWood'});G.objs.set(T.idx(x,y0+7),{t:'bThinWood'})}
  for(let y=y0;y<=y0+7;y++){G.objs.set(T.idx(x0,y),{t:'bThinWood'});G.objs.set(T.idx(x0+8,y),{t:'bThinWood'})}
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
          const wall=[-T.LIFT,15];return [rows(T.twSprite('bThinWood',10,false)),rows(T.twSprite('bWinStone',10,false)),rows(T.twSprite('bDoorWood',10,false)),rows(T.twSprite('slideDoor',10,0)),rows(T.twSprite('bHalfWood',10,false)),wall]}""")
            rec('얇은 벽','얇은 벽 윗면·바닥선이 바위벽과 같음 (위 -5px, 바닥 칸 맨 아래)', r[0]==r[5], str(r))
            rec('얇은 벽','창문벽·문·자동 미닫이문도 같은 높이', r[1]==r[5] and r[2]==r[5] and r[3]==r[5], str(r))
            rec('얇은 벽','반벽도 바닥선은 칸 맨 아래', r[4][1]==15, str(r))
            # ---- floor stops at the wall line ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const px=(cv,x,y)=>Array.from(cv.getContext('2d').getImageData(x,y,1,1).data).join(',');
          const at=(x,y,qx,qy)=>{const cv=T.getChunk(Math.floor(x/16),Math.floor(y/16));return px(cv,(x%16)*16+qx,(y%16)*16+qy)};
          const ref=(f,x,y,qx,qy)=>px(T.SPR.floor[f][(T.hash2(x,y,5)*4)|0],qx,qy);
          const out=[];const y=y0+3;
          // left wall: outside grass on the left half, wood floor on the right half
          out.push(at(x0,y,3,5)===ref(1,x0,y,3,5), at(x0,y,12,5)===ref(5,x0,y,12,5));
          // put wood floor under the wall itself: still ends at the wall line
          G.floor[T.idx(x0,y)]=5; out.push(at(x0,y,3,5)===ref(1,x0,y,3,5), at(x0,y,12,5)===ref(5,x0,y,12,5));
          // right wall
          const xr=x0+8;out.push(at(xr,y,3,5)===ref(5,xr,y,3,5), at(xr,y,12,5)===ref(1,xr,y,12,5));
          return out}""")
            rec('바닥','얇은 벽 칸: 바깥쪽 절반은 바깥 땅, 안쪽 절반은 방 바닥', r[0] and r[1] and r[4] and r[5], str(r))
            rec('바닥','벽 칸에 바닥을 깔아도 벽선에서 딱 끝남', r[2] and r[3], str(r))
            # ---- double door & long window ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const yd=y0+7;G.objs.set(T.idx(x0+2,yd),{t:'bDoorWood'});G.objs.set(T.idx(x0+3,yd),{t:'bDoorWood'});
          for(let x=x0+5;x<=x0+7;x++)G.objs.set(T.idx(x,yd),{t:'bWinWood'});
          const m=[T.twMask(x0+2,yd,'door'),T.twMask(x0+3,yd,'door'),T.twMask(x0+5,yd,'win'),T.twMask(x0+6,yd,'win'),T.twMask(x0+7,yd,'win'),T.twMask(x0+1,yd,'thin')];
          const glass=(id,mk,x)=>Array.from(T.twSprite(id,mk,false).getContext('2d').getImageData(x,26+4,1,1).data).join(',');
          return [m.map(v=>v&48),glass('bWinWood',m[3],0),glass('bWinWood',m[3],15),glass('bWinWood',10,1)]}""")
            rec('양문·긴 창','같은 종류가 가로로 붙으면 이어짐 표시 (문 2칸, 창문벽 3칸)', r[0]==[32,16,32,48,16,0], str(r[0]))
            rec('양문·긴 창','가운데 창문벽은 양 끝까지 유리', r[1]=='168,220,245,255' and r[2]=='168,220,245,255' and r[3]!='168,220,245,255', str(r[1:]))
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
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const sx=x0+4;G.objs.set(T.idx(sx,y0),{t:'slideDoor'});G.p.x=sx+.5;G.p.y=y0+1.5;G.p.face={x:0,y:-1};return [T.decide().k,T.decide().lbl]}""")
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
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;G.objs.set(T.idx(sx+1,y0),{t:'slideDoor'});const m=[T.twMask(sx,y0,'slide')&48,T.twMask(sx+1,y0,'slide')&48];
          G.p.x=sx+1.5;G.p.y=y0+1.4;for(let k=0;k<2;k++)T.circuitTick(.2);return [m,!!G.objs.get(T.idx(sx,y0)).open,!!G.objs.get(T.idx(sx+1,y0)).open]}""")
            rec('자동 미닫이문','두 칸을 붙이면 함께 열림', r==[[32,16],True,True], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;G.p.x=T.CX+19;G.p.y=T.CY+7.4;G.p.face={x:0,y:-1};T.circuitTick(.2)}")
            await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'room.png',clip={'x':340,'y':120,'width':600,'height':560})
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;const o=G.objs.get(T.idx(sx,y0));const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o2=T.G.objs.get(T.idx(sx,y0));return [o2.t,Object.keys(o2).sort().join(',')]}""")
            rec('저장','자동 미닫이문 저장/불러오기 (움직임 상태는 저장 안 함)', r[0]=='slideDoor' and 'sl' not in r[1].split(','), str(r))
            # ---- skill points at the top level ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg=T.cleanRpg(null);let n=0;while(G.rpg.lv<T.MAX_LV&&n<500){T.gainXp(5000);n++}const tot=Object.values(T.SKILLS).reduce((a,s)=>a+s.max,0);return [G.rpg.lv,G.rpg.sp,tot]}""")
            rec('스킬 포인트','최고 레벨 30이면 스킬 포인트 30 (v44부터 스킬이 더 많아 다 올리진 못하고, 다시 배우기는 무료)', r[:2]==[30,30] and r[2]>30, str(r))
            r=await ev(pg,"""()=>{const T=__T;const sk={};let left=29;for(const k in T.SKILLS){const l=Math.min(T.SKILLS[k].max,left);if(l)sk[k]=l;left-=l}
          const a=T.cleanRpg({lv:30,xp:0,sp:0,sk});const b=T.cleanRpg({lv:30,xp:0,sp:1,sk});const c=T.cleanRpg({lv:12,xp:0,sp:2,sk:{tough:3,miner:3,dash:3}});const d=T.cleanRpg({lv:12,xp:0,sp:11,sk:{}});return [a.sp,b.sp,c.sp,d.sp]}""")
            rec('스킬 포인트','옛 세이브(최고 레벨, 하나 모자람) 불러오면 +1, 이미 받았으면 그대로', r==[1,1,2,11], str(r))
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
            rec('이끼','이끼 섬유 3개로 이끼 한 삽 (손 제작)', r==[None,'[["fiber",1]]'], str(r))
            await pg.tap('#goal'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[document.querySelector('.sh-head h2').textContent,[...document.querySelectorAll('.qrow .st')].map(e=>e.textContent).join(','),document.querySelectorAll('.qrow h4')[1]&&document.querySelectorAll('.qrow h4')[1].textContent]")
            rec('퀘스트','지금 할 일을 누르면 퀘스트 창 · 진행 중/잠김(???) 표시', '퀘스트' in r[0] and r[1].startswith('진행 중') and r[2]=='???', str(r))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"()=>{const G=__T.G;G.stats.wood=6;__T.checkGuide();return document.querySelector('#goal').classList.contains('dot')}")
            await pg.wait_for_timeout(700); r=await ev(pg,"()=>document.querySelector('#goal').classList.contains('dot')"); rec('퀘스트','받을 보상이 있으면 지금 할 일에 점', r, r)
            await pg.tap('#bQuest'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>{const row=document.querySelector('.qrow');return [row.querySelector('.st').textContent,!!row.querySelector('[data-a=qClaim]'),row.querySelector('.qrw').textContent]}")
            rec('퀘스트','완료 + 보상 표시 + 보상 받기 버튼', r[0]=='완료' and r[1] and '이끼 섬유 5' in r[2] and '경험치 10' in r[2], str(r))
            f0=await ev(pg,"()=>__T.countItem('fiber')")
            await pg.tap('.qrow [data-a=qClaim]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.countItem('fiber'),document.querySelector('.qrow .got')&&document.querySelector('.qrow .got').textContent,!!__T.G.qclaim.wood]")
            rec('퀘스트','보상 받으면 아이템 지급 + 받음 ✓', r[0]==f0+5 and r[1]=='받음 ✓' and r[2], str(r))
            await pg.screenshot(path=SP+'quest.png')
            await pg.tap('[data-a=qTab][data-i=side]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>document.querySelectorAll('.qrow').length"); rec('퀘스트','도전 탭에 부가 퀘스트 목록', r>=8, r)
            await ev(pg,"()=>{__T.G.stats.made={gMoss:1};__T.closePanel();__T.openPanel('quest');}"); await pg.wait_for_timeout(500); await pg.tap('[data-a=qTab][data-i=side]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const row=document.querySelector('.qrow');return [row.querySelector('h4').textContent,!!row.querySelector('[data-a=qClaim]')]}")
            rec('퀘스트','완료한 도전이 맨 위에 + 보상 받기', '이끼 한 삽' in r[0] and r[1], str(r))
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
            rec('전선','전선 깔기 / 같은 칸에서 전선 걷기', r==['전선 깔기',True,'전선 걷기',False,5], str(r))
            r=await ev(pg,"()=>{W([120,121],110);const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);return [__T.G.wire.size>=3,__T.G.objs.get(__T.idx(110,105)).dir.y]}")
            rec('저장','전선·기계 상태가 저장됨', r==[True,-1], str(r))
            r=await ev(pg,"()=>__T.RECIPES.filter(r=>r.cat==='circuit').map(r=>r.out+'@'+r.at).join(',')")
            rec('제작','회로 탭 레시피 (작업대 단계(v60), v46: 벽 앞 채굴기는 채굴장으로 바뀌어 빠짐)', all(x in r for x in ['wire@bench','battery@bench','generator@bench','crystalGen@bench']) and 'drillCu@bench' not in r, r)
            # visual
            await ev(pg,ARENA)
            await ev(pg,"()=>{const G=__T.G;G.treeSeeds=3;O('battery',103,113,{e:400});W([104,105],113);O('lever',106,113,{on:true});W([107,108,109],113);O('eLamp',110,113,{off:true});W([109],112);W([109],111);O('eDoor',109,110);W([104],114);W([104],115);O('plate',105,115);W([106,107],115);O('eLamp',108,115,{off:true});G.wall[__T.idx(113,111)]=5;O('drillCu',113,112,{dir:{x:0,y:-1}});W([111,112],113);W([113],113);O('chest',114,112,{items:Array(18).fill(null)});G.p.x=107.5;G.p.y=117.5;TK(3)}")
            await pg.wait_for_timeout(1200); await pg.screenshot(path=SP+'circuit.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3]); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
