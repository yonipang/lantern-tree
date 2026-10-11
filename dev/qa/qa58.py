import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
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
        await pg.screenshot(path=SP+'qa58_gear0.png')
        await ev(pg,"()=>document.querySelector('#sheet [data-a=tab][data-i=tool]').click()"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>[__tabs(),__ids().map(r=>r.cat).every(c=>c==='tool')]")
        rec('창','도구 탭은 도구만', '도구*' in r[0][1] and r[1], str(r))
        await ev(pg,"()=>{const T=__T,G=T.G;G.inv[12]={id:'copperBar',c:8};G.inv[13]={id:'stone',c:20};T.renderPanel()}"); await pg.wait_for_timeout(200)
        await ev(pg,"()=>document.querySelector('#sheet [data-a=benchUp]').click()"); await pg.wait_for_timeout(400)
        await ev(pg,"()=>document.querySelector('#sheet [data-a=tab][data-i=all]').click()"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>{const T=__T,o=T.G.objs.get(T.panel.i),ts=__ids().map(r=>r.tier||0);return [o.lv,T.G.stats.gearLv,document.querySelector('#sheet h2').innerText.trim(),ts[0],ts.includes(0),ts.every((t,k)=>!k||t<=ts[k-1])]}")
        rec('올리기','구리 장비제작대로 올리면 구리 장비가 맨 위, 0단계 장비도 아래', r==[1,1,'구리 장비제작대',1,True,True], str(r))
        await pg.screenshot(path=SP+'qa58_gear1.png')
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
        r=await ev(pg,"()=>{const g=__T.GUIDE.map(q=>(typeof q.h==='function'?q.h():q.h)||'').join('|');return g.includes('장비제작대(작업대에서 나무·돌로')}")
        rec('퀘스트','구리 곡괭이 안내: 장비제작대를 놓고 구리 단계로', r is True, str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
