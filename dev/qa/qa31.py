import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 등불나무 성장 6단계 (v31): 모습·성장 연출·축복 범위·이끼와 꽃 번짐·캐노피 반투명
H2=HOOK.replace("computeLight}","computeLight,SPR,TREEFX,treeStage,insertSeeds,updateTree,growTick,TREE_BLESS,TREE_SPREAD,TREE_STAGE,spreadKind,behindCanopy,treeBox,cropStage,renderPanel}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        r=await ev(pg,"()=>{const S=__T.SPR.treeSt;return S.map(L=>[L.s,L.w,L.h,L.lan.length,L.small.length,L.fruit.length,L.box.y1>L.box.y0])}")
        sizes=[x[1]*x[2] for x in r]
        rec('모습','빛씨앗 0~5개에 맞는 6가지 모습', len(r)==6 and all(x[6] for x in r[2:]), str(r))
        rec('모습','3개부터 크게 자라고 4·5개에서 더 커짐', sizes[3]>sizes[2] and sizes[4]>sizes[3] and sizes[5]>sizes[4], str(sizes))
        rec('모습','등불 자리 3개 → 첫 꽃부터 5개, 완성엔 작은 등불이 더 달림', [x[3] for x in r]==[3,3,3,5,5,5] and r[5][4]>=5 and r[0][4]==0, str(r))
        rec('모습','빛 열매는 4개째부터', r[3][5]==0 and r[4][5]>0 and r[5][5]>0, str(r))
        r=await ev(pg,"()=>{const T=__T,G=T.G;const out=[];for(let s=0;s<=5;s++){G.treeSeeds=s;out.push(T.treeStage())}G.treeSeeds=9;out.push(T.treeStage());G.treeSeeds=0;return out}")
        rec('모습','모습은 심은 빛씨앗 개수로만 정해짐', r==[0,1,2,3,4,5,5], str(r))
        r=await ev(pg,"()=>{const T=__T,G=T.G;let n=0;for(let y=__T.CY-1;y<=__T.CY;y++)for(let x=__T.CX-1;x<=__T.CX+1;x++){const o=G.objs.get(T.idx(x,y));if(o&&o.t==='treeP')n++}return n}")
        rec('충돌','나무 충돌 칸은 그대로', r==6, r)
        # old save: the look follows treeSeeds with no new field
        r=await ev(pg,"()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));s.treeSeeds=4;T.deserialize(s);return [T.treeStage(),Object.keys(s).filter(k=>/tree/i.test(k)).join(',')]}")
        rec('세이브','옛 세이브도 불러오면 바로 맞는 모습 (저장 구조 변화 없음)', r==[4,'treeSeeds'], str(r))
        # growth show
        await ev(pg,"()=>{const G=__T.G;G.treeSeeds=2;G.won=false;G.won2=false;G.p.x=__T.CX+.5;G.p.y=__T.CY+3.2;G.enemies.length=0;__T.TREEFX.leaves.length=0}")
        r=await ev(pg,"()=>{const T=__T,G=T.G;T.addItem('lightSeed',1);T.insertSeeds();const g=T.TREEFX.grow;return [g&&g.from,g&&g.to,G.treeSeeds]}")
        rec('연출','심으면 성장 연출 시작 (이전 모습 → 새 모습)', r==[2,3,3], str(r))
        await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'qa31_grow.png')
        r=await ev(pg,"()=>{const T=__T;for(let k=0;k<60;k++)T.updateTree(1/30);return [!!T.TREEFX.grow,T.TREEFX.leaves.length]}")
        rec('연출','약 1.5초 뒤 연출이 끝나고 잎·꽃잎이 흩날림', (r[0] is False) and r[1]>=10, str(r))
        await pg.wait_for_timeout(1300); r=await ev(pg,"()=>!!document.querySelector('[data-a=close]')")
        rec('연출','첫 엔딩 창은 성장 연출이 끝난 뒤에 열림', r is True, r)
        await ev(pg,"()=>{document.querySelectorAll('[data-a=close]').forEach(b=>b.click())}")
        # blessing
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const plant=(x,y)=>{const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;const o={t:'cropBerry',p:G.time};G.objs.set(i,o);return o};
          G.treeSeeds=2;const a0=plant(__T.CX+6,__T.CY+6);T.growTick(2);const none=G.time-a0.p;
          G.treeSeeds=3;const a=plant(__T.CX+8,__T.CY),far=plant(__T.CX+15,__T.CY);T.growTick(2);const r3=[+(G.time-a.p).toFixed(2),+(G.time-far.p).toFixed(2)];
          G.treeSeeds=5;const f2=plant(__T.CX+15,__T.CY+2);T.growTick(2);return [none,r3,+(G.time-f2.p).toFixed(2),T.TREE_BLESS(2),T.TREE_BLESS(3),T.TREE_BLESS(5)]}""")
        rec('축복','빛씨앗 3개부터 12칸 안 작물이 20% 빨리 (2초마다 0.5초 더 자람)', r[0]==0 and r[1]==[0.5,0] and r[3:]==[0,12,18], str(r))
        rec('축복','빛씨앗 5개면 18칸까지', r[2]==0.5, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(__T.CX+4,__T.CY+7);G.wall[i]=0;G.floor[i]=2;const o={t:'cropBerry',p:G.time-500};G.objs.set(i,o);const p0=o.p;T.growTick(2);return o.p===p0}""")
        rec('축복','다 자란 작물은 건드리지 않음', r is True, r)
        # spread over bare ground only
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.treeSeeds=5;const R=T.TREE_SPREAD[5];let bare=0,hit=0,deck=0,obj=0;
          for(let y=__T.CY-9;y<=__T.CY+9;y++)for(let x=__T.CX-9;x<=__T.CX+9;x++){const i=T.idx(x,y);const k=T.spreadKind(x,y,R);
            if(G.floor[i]===5&&k)deck++; if(G.objs.get(i)&&k)obj++; if(!G.wall[i]&&(G.floor[i]===1||G.floor[i]===2)&&!G.objs.get(i)){bare++;if(k)hit++}}
          const far=T.spreadKind(__T.CX+12,__T.CY,R);G.treeSeeds=1;const s1=T.TREE_SPREAD[1];return [bare,hit,deck,obj,far,s1,T.TREE_SPREAD.join(',')]}""")
        rec('번짐','나무 주변 맨땅에만 이끼·꽃이 번짐 (나무 바닥·물건 위엔 없음)', r[1]>5 and r[1]<r[0] and r[2]==0 and r[3]==0 and r[4] is None, str(r))
        rec('번짐','단계마다 범위가 넓어짐 (새순까지는 없음)', r[5]==0 and r[6]=='0,0,3.5,5.5,7.5,9.5', str(r))
        # see-through canopy
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.treeSeeds=5;G.p.x=__T.CX+.5;G.p.y=__T.CY-2.2;const b=T.behindCanopy();for(let k=0;k<30;k++)T.updateTree(1/30);const a=T.TREEFX.alpha;G.p.y=__T.CY+3;const f=T.behindCanopy();for(let k=0;k<30;k++)T.updateTree(1/30);return [b,+a.toFixed(2),f,+T.TREEFX.alpha.toFixed(2)]}""")
        rec('반투명','캐노피 뒤로 들어가면 잎이 반투명, 나오면 원래대로', r[0] is True and r[1]<.5 and r[2] is False and r[3]>.95, str(r))
        await ev(pg,"()=>{const G=__T.G;G.p.x=__T.CX+.5;G.p.y=__T.CY-2.2;G.enemies.length=0}")
        await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'qa31_behind.png')
        # falling leaves on the finished tree
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.treeSeeds=5;G.p.y=__T.CY+3;T.TREEFX.leaves.length=0;for(let k=0;k<30*30;k++)T.updateTree(1/30);return T.TREEFX.leaves.length}")
        rec('완성','완성된 나무에선 잎이 가끔 떨어짐 (최대 14장)', 1<=r<=14, r)
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.treeSeeds=4;T.TREEFX.leaves.length=0;for(let k=0;k<30*10;k++)T.updateTree(1/30);return T.TREEFX.leaves.length}")
        rec('완성','완성 전에는 저절로 떨어지지 않음', r==0, r)
        # panel
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.treeSeeds=3;G.won=true;T.openPanel('tree');const t=document.body.innerText;T.closePanel();return [t.includes('첫 꽃'),t.includes('12칸')]}")
        rec('패널','등불나무 창에 지금 모습과 축복 범위 표시', r==[True,True], str(r))
        for st in range(6):
            await ev(pg,f"()=>{{const G=__T.G;G.treeSeeds={st};G.p.x=__T.CX+.5;G.p.y=__T.CY+3.2;G.enemies.length=0}}")
            await pg.wait_for_timeout(350); await pg.screenshot(path=SP+f'qa31_stage{st}.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
