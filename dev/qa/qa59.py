import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v62: 작업대 창 — 1줄 아이콘 탭(전체·재료·도구·제작대·가구·건축·편의, 고른 탭만 이름), 2줄 탭(가구: 의자·탁자·침대·수납·조명·장식 / 건축: 벽·바닥·울타리·기둥·문·창문·자연 / 편의: 회로·농사·채굴장 / 제작대), 세트는 태그, 손 제작도 작업대에서
H2=HOOK.replace("computeLight}","computeLight,RECIPES,bcat,get panel(){return panel},renderPanel}")
SET="""window.__set=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+14;y++)for(let x=T.CX+2;x<T.CX+14;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i)}
  G.enemies.length=0;G.inv.fill(null);G.sel=3;G.p.x=T.CX+5.5;G.p.y=T.CY+5.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;
  const bi=T.idx(T.CX+6,T.CY+5);G.objs.set(bi,{t:'bench',lv:5});G.objs.set(bi+1,{t:'_part',a:bi});return bi};
  window.__row=k=>{const r=document.querySelectorAll('#sheet .tabs')[k];return r?[...r.querySelectorAll('.tab')].map(b=>(b.dataset.i)+(b.classList.contains('on')?'*':'')).join(','):''};
  window.__lbl=()=>[...document.querySelectorAll('#sheet .itabs .tab')].map(b=>b.textContent.trim()).filter(Boolean).join(',');
  window.__ids=()=>[...document.querySelectorAll('#sheet [data-a=craft]')].map(b=>__T.RECIPES[+b.dataset.i].out);
  window.__clk=(a,i)=>document.querySelector(`#sheet [data-a=${a}][data-i=${i}]`).click();"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+SET+"}")
        r=await ev(pg,"()=>{const T=__T,f=id=>T.bcat(T.RECIPES.find(r=>r.out===id)).join('/');return ['chair','table','bed','chest','torch','plant','mossBed','cryTable','wallBrick','floorMoss','bFenceWood','bPillarStone','bDoorWood','slideDoor','bWinWood','bFrameStone','bThinWood','roundTree','waterPond','gDirt','wire','sprinkler','quarry','treeFarm','pot','furnace','smelter','bench','rope','bagUp1'].map(f).join(' ')}")
        rec('분류','가구·건축(자연 포함)·편의·제작대·재료·도구 2단 분류',
            r=='furn/seat furn/table furn/bed furn/store furn/light furn/deco furn/bed furn/table build/wall build/floor build/fence build/pillar build/door build/door build/win build/win build/wall build/nature build/nature build/floor conv/circuit conv/farm conv/mine conv/mine stn/cook stn/smelt stn/make stn/make mat tool', r)
        await ev(pg,"()=>{const T=__T,bi=__set();T.openPanel('craft',{st:'bench',i:bi})}"); await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>[__row(0),__lbl(),document.querySelectorAll('#sheet .itabs .tab img').length,document.querySelectorAll('#sheet .tabs').length,__ids().includes('rope'),__ids().includes('chair')]")
        rec('1줄 탭','작업대: 아이콘 탭 7개, 고른 탭(전체)만 이름, 2줄 탭은 없음, 손 제작(이끼 끈)도 보임',
            r==['all*,mat,tool,stn,furn,build,conv','전체',7,1,True,True], str(r))
        w=await ev(pg,"()=>{const r=document.querySelector('#sheet .itabs');return [r.scrollWidth,r.clientWidth]}")
        rec('1줄 탭','390px 화면에 1줄 탭이 다 보임', w[0]<=w[1]+2, str(w))
        await pg.screenshot(path=SP+'qa59_all.png')
        await ev(pg,"()=>__clk('tab','furn')"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>[__lbl(),__row(1),__ids().every(id=>__T.bcat(__T.RECIPES.find(r=>r.out===id))[0]==='furn'),[...document.querySelectorAll('#sheet .stag')].map(e=>e.textContent).filter((v,i,a)=>a.indexOf(v)===i).sort().join(',')]")
        rec('가구','가구: 이름 「가구」, 2줄 전체·의자·탁자·침대·수납·조명·장식, 세트는 태그로',
            r[0]=='가구' and r[1]=='all*,seat,table,bed,store,light,deco' and r[2] and r[3]=='버섯 세트,수정 세트,이끼 세트', str(r))
        await ev(pg,"()=>__clk('tab2','seat')"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>[__row(1),__ids().sort().join(',')]")
        rec('가구','의자 탭은 의자만 (나무·이끼·버섯·수정·철제 의자, 벤치, 소파, 쿠션)', r[0].startswith('all,seat*') and 'chair' in r[1] and 'mossSofa' in r[1] and 'cryChair' in r[1] and 'bed' not in r[1] and 'table' not in r[1].split(','), str(r))
        await pg.screenshot(path=SP+'qa59_seat.png')
        await ev(pg,"()=>__clk('tab','build')"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>[__lbl(),__row(1)]")
        rec('건축','건축: 2줄 탭이 전체로 돌아가고 전체·벽·바닥·울타리·기둥·문·창문·자연', r==['건축','all*,wall,floor,fence,pillar,door,win,nature'], str(r))
        await ev(pg,"()=>__clk('tab2','nature')"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>__ids()")
        rec('건축','자연 탭: 나무·꽃·물 타일 (가구 아님)', 'roundTree' in r and 'waterPond' in r and 'chair' not in r and 'treeFarm' not in r, str(r))
        await ev(pg,"()=>__clk('tab2','floor')"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>__ids()")
        rec('건축','바닥 탭: 나무·돌·세트 바닥', all(x in r for x in ['floorWood','floorStone','floorMoss','floorCrystal']) and 'wallWood' not in r, str(r))
        await ev(pg,"()=>__clk('tab','conv')"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>[__lbl(),__row(1)]")
        rec('편의','편의: 회로·(농사: 여왕을 쓰러뜨리면)·채굴장', r[0]=='편의' and r[1] in ('all*,circuit,mine','all*,circuit,farm,mine'), str(r))
        await ev(pg,"()=>__clk('tab2','mine')"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>__ids().sort().join(',')")
        rec('편의','채굴장 탭: 채굴장들과 나무 작업장', 'quarry' in r and 'treeFarm' in r and 'wire' not in r, r)
        await ev(pg,"()=>__clk('tab','stn')"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>[__lbl(),__row(1),__ids().sort().join(',')]")
        rec('제작대','제작대: 작업대·장비제작대·용광로·요리솥', r[0]=='제작대' and r[1]=='all*,make,smelt,cook' and r[2]=='bench,furnace,pot,smelter', str(r))
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
asyncio.run(main())
