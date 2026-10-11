import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
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
        rec('단계','작업대 6단계, 레시피는 재료로 단계가 정해짐 (구리 작업대 레시피는 없어짐)', r==['작업대,구리 작업대,철 작업대,석영 작업대,금 작업대,서리 작업대','bench0,bench1,bench1,bench2,bench3,bench3,bench5,bench5,-',False], str(r))
        await ev(pg,"()=>{const T=__T,bi=__set();T.openPanel('craft',{st:'bench',i:bi})}"); await pg.wait_for_timeout(500)
        r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;const T=__T;return [document.querySelector('#sheet h2').innerText.trim(),!!document.querySelector('#sheet .benchup'),t.includes('구리 작업대로 올리기'),t.includes('구리괴 0/8'),t.includes('돌 0/20'),document.querySelector('#sheet [data-a=benchUp]').disabled,__rows().every(t=>t===0)]}")
        rec('창','작업대 창 맨 위에 「구리 작업대로 올리기」(구리괴 8·돌 20), 재료 없으면 못 누름, 목록은 작업대 물건만', r==['작업대',True,True,True,True,True,True], str(r))
        await pg.screenshot(path=SP+'qa57_bench0.png')
        await ev(pg,"()=>{const T=__T,G=T.G;G.inv[12]={id:'copperBar',c:8};G.inv[13]={id:'stone',c:25};T.renderPanel()}"); await pg.wait_for_timeout(200)
        await ev(pg,"()=>document.querySelector('#sheet [data-a=benchUp]').click()"); await pg.wait_for_timeout(400)
        r=await ev(pg,"""()=>{const T=__T,G=T.G,o=G.objs.get(T.panel.i);const ts=__rows();
          return [o.lv,T.countItem('copperBar'),T.countItem('stone'),G.stats.forge,document.querySelector('#sheet h2').innerText.trim(),document.querySelector('#sheet').innerText.includes('철 작업대로 올리기'),ts[0],ts.includes(0),ts.every((t,k)=>k===0||t<=ts[k-1]),!ts.includes(2)]}""")
        rec('올리기','올리면 「구리 작업대」: 재료가 빠지고, 구리 물건이 맨 위·작업대 물건도 아래에 나옴, 다음은 철 작업대', r==[1,0,5,1,'구리 작업대',True,1,True,True,True], str(r))
        await pg.screenshot(path=SP+'qa57_bench1.png')
        r=await ev(pg,"()=>{const T=__T,G=T.G;const give=[['ironBar',8],['stone',30],['quartzR',6],['granite',20],['goldBar',6],['basalt',20],['frostShard',10],['iceBlock',20]];give.forEach(([id,c],k)=>G.inv[12+k]={id,c});T.renderPanel();return 1}")
        for _ in range(4):
            await ev(pg,"()=>document.querySelector('#sheet [data-a=benchUp]').click()"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.panel.i);return [o.lv,G.stats.benchLv,document.querySelector('#sheet h2').innerText.trim(),!document.querySelector('#sheet [data-a=benchUp]'),document.querySelector('#sheet').innerText.includes('가장 높은 단계')]}")
        rec('올리기','철 → 석영 → 금 → 서리 작업대까지 (서리가 끝)', r==[5,5,'서리 작업대',True,True], str(r))
        await ev(pg,"()=>__T.closePanel()")
        # pick up and place again keeps the tier
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const bi=T.idx(T.CX+6,T.CY+5),o=G.objs.get(bi);o.lv=3;G.objs.delete(bi);G.objs.delete(bi+1);G.inv.fill(null);T.returnObj(o,G.p.x,G.p.y);const k=G.inv.findIndex(x=>x&&x.id==='benchQ');
          G.inv[0]=G.inv[k];if(k)G.inv[k]=null;G.sel=0;G.p.face={x:1,y:0};const a=T.decide();T.perform(a);const n=[...G.objs.values()].find(q=>q.t==='bench');return [k>=0,T.ITEMS.benchQ.n,a.k,n&&n.lv]}""")
        rec('회수','올린 작업대를 회수하면 「석영 작업대」 아이템, 다시 놓아도 석영 단계', r==[True,'석영 작업대','place',3], str(r))
        # old saves: the copper workbench becomes a tier-1 workbench (2 tiles)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__set();const fi=T.idx(T.CX+9,T.CY+9);G.objs.set(fi,{t:'forge'});G.inv[12]={id:'forge',c:1};const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G,o=G2.objs.get(fi);
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
asyncio.run(main())
