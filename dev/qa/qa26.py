import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
H2=HOOK.replace("computeLight}","computeLight,RECIPES,decide,perform,growTick,refreshHotbar,isSolid,placeItem,hitObj,circuitTick,rotateAction,rotateObjAt,fixParts,fpOf,farmStage,FARM_GROW,useObj:typeof useObj!=='undefined'?useObj:null}")
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
        await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa26_rug.png')
        # rotation of a 2x1 table
        await ev(pg,ARENA)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;GIVE('longTable');G.p.face={x:1,y:0};T.rotateAction();const a=T.decide();T.perform(a);let ai=null;for(const[i,o]of G.objs)if(o.t==='longTable')ai=i;const o=G.objs.get(ai);return [o.rot,T.fpOf(o).join('x'),[...G.objs.values()].filter(q=>q.t==='_part').length]}""")
        rec('회전','들고 있을 때 돌리면 세로(1×2)로 놓임', r==[1,'1x2',1], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;let ai=null;for(const[i,o]of G.objs)if(o.t==='longTable')ai=i;const ok=T.rotateObjAt(ai);const o=G.objs.get(ai);const parts=[...G.objs].filter(([i,q])=>q.t==='_part').map(([i])=>i-ai);return [ok,o.rot,parts.join(',')]}""")
        rec('회전','놓인 가구도 돌리기 → 가로(2×1)', r[0] is True and r[1]==0 and r[2]=='1', str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;let ai=null;for(const[i,o]of G.objs)if(o.t==='longTable')ai=i;G.wall[ai+200]=1;const ok=T.rotateObjAt(ai);G.wall[ai+200]=0;return [ok,G.objs.get(ai).rot]}""")
        rec('회전','막혀 있으면 안 돌아감', r==[False,0], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.objs.clear;for(const[i,o]of [...G.objs])if(o.t==='longTable'||o.t==='_part')G.objs.delete(i);GIVE('chair');G.p.x=104.5;G.p.y=108.5;G.p.face={x:1,y:0};T.rotateAction();T.rotateAction();T.perform(T.decide());const ch=G.objs.get(T.idx(105,108));T.rotateObjAt(T.idx(105,108));const d2=ch.dir;G.inv[0]=null;const a=T.decide();T.perform(a);return [d2,a.u,G.p.dir,G.p.sit&&G.p.sit.dir]}""")
        rec('회전','의자: 4방향 (위를 보게 놓고 한 번 더 → 왼쪽, 앉으면 그쪽을 봄)', r[0]==3 and r[1]=='sit' and r[2]=='side' and r[3]==3, str(r))
        await pg.wait_for_timeout(400); await pg.screenshot(path=SP+'qa26_chair.png')
        r=await ev(pg,"()=>{const G=__T.G;G.p.sit=null;return document.querySelector('#rotBtn').hidden}")
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
        await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa26_farm.png')
        # save / load keeps parts; orphan cleanup
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));s.objs.push([T.idx(118,116),{t:'_part',a:T.idx(1,1)}]);T.deserialize(s);const G2=T.G;let farm=0,parts=0,orph=G2.objs.get(T.idx(118,116));for(const[i,o]of G2.objs){if(o.t==='treeFarm')farm++;if(o.t==='_part')parts++}return [farm,parts>=3,orph||null]}""")
        rec('저장','저장 → 불러오기 후에도 여러 칸 가구 유지 · 떨어진 부속 칸 정리', r[0]==1 and r[1] and r[2] is None, str(r))
        # recipes
        r=await ev(pg,"()=>['bedDouble','longTable','sofa2','bookcase2','kitchenSet','fountainBig','rugBig','rugLong','rugRound','bigTree','bigRock','flowerField','pondBig','treeFarm'].map(id=>{const R=__T.RECIPES.find(r=>r.out===id);return R?R.at:'none'}).join(',')")
        rec('레시피','새 가구·러그·자연물 14종 레시피', 'none' not in r, r)
        # touch rotate button visibility
        await ev(pg,ARENA)
        await ev(pg,"()=>{GIVE('sofa2')}"); await pg.wait_for_timeout(400)
        r=await ev(pg,"()=>!document.querySelector('#rotBtn').hidden")
        await pg.tap('#rotBtn'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SP+'qa26_rotbtn.png')
        r2=await ev(pg,"()=>{const T=__T,G=T.G;T.perform(T.decide());let ai=null;for(const[i,o]of G.objs)if(o.t==='sofa2')ai=i;return G.objs.get(ai).rot}")
        rec('회전','터치: 가구를 들면 ↻ 방향 버튼 → 누르면 세로 소파', r and r2==1, f'{r} {r2}')
        # visual gallery
        await ev(pg,ARENA)
        await ev(pg,"""()=>{const T=__T,G=T.G;const put=(t,x,y,ex)=>{const o=Object.assign({t},ex||{});const i=T.idx(x,y);G.objs.set(i,o);if(T.OBJ[t].sz){for(let dy=0;dy<T.fpOf(o)[1];dy++)for(let dx=0;dx<T.fpOf(o)[0];dx++)if(dx||dy)G.objs.set(T.idx(x+dx,y+dy),{t:'_part',a:i})}};
          put('bedDouble',101,101);put('longTable',104,102);put('sofa2',107,102);put('sofa2',110,101,{rot:1});put('bookcase2',112,101);put('kitchenSet',101,104);put('fountainBig',105,104);put('rugLong',108,104);put('rugRound',101,109);put('bigTree',105,108);put('bigRock',108,108);put('flowerField',110,107,{rot:1});put('pondBig',113,108);put('treeFarm',101,113,{p:G.time-200});put('rugBig',105,112);put('longTable',109,112,{rot:1});put('chair',111,112,{dir:1});put('chair',112,112,{dir:2});put('chair',113,112,{dir:3});put('chair',114,112);
          G.p.x=108.5;G.p.y=111.6;}""")
        await pg.wait_for_timeout(900); await pg.screenshot(path=SP+'qa26_gallery.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
