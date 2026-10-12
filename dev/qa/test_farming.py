# 농사·자연·요리: 등불나무 성장, 농사 기초·심화, 요리, 자동화·거대 작물
# 실행: python3 dev/qa/run.py farming   (테스트 하나만: python3 dev/qa/run.py qa31)
from harness import *


def qa31():
    import asyncio, sys
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
    return main


def qa33():
    import asyncio, sys
    # 농사 기초 (v33): 작물·나무 4단계, 구리 낫, 물뿌리개, 비료, 농사 도전 퀘스트 1~3
    H2=HOOK.replace("computeLight}","computeLight,SPR,growTick,cropStage,treeStep,isYoung,harvest,waterCrop,fertCrop,fillCan,hitObj,RECIPES,recipeOn,QSIDE,questState,placeItem,renderPanel,YOUNG_T,WCAN_MAX,afterCut,moveInto,targetTile}")
    SETUP="""const T=__T;window.__clr=(x0,y0,w,h,f)=>{const G=T.G;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=f==null?2:f;G.objs.delete(i)}};
window.__crop=(x,y,t,age)=>{const G=T.G;const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;const o={t:t||'cropBerry',p:G.time-(age||0),p0:G.time-(age||0)};G.objs.set(i,o);return o};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+SETUP+"T.G.enemies.length=0}")
            # ---- crop pictures ----
            r=await ev(pg,"""()=>{const S=__T.SPR.crop,out={};for(const k of ['berry','shroom','moss']){const st=S[k].map(v=>v[0].toDataURL());out[k]=[S[k].length,S[k][0].length,new Set(st).size,S[k][2][0].toDataURL()!==S[k][2][1].toDataURL(),S[k][2][0].toDataURL()!==S[k][2][2].toDataURL()]}return out}""")
            rec('그림','작물 3종 × 4단계가 모두 다른 그림', all(v[0]==4 and v[1]==4 and v[2]==4 for v in r.values()), str(r))
            rec('그림','물 준 흙·비료 준 흙은 그림이 달라짐', all(v[3] and v[4] for v in r.values()), str(r))
            r=await ev(pg,"()=>{const Y=__T.SPR.young;return ['root','bigShroom','cherryTree','roundTree','bigTree'].map(k=>Y[k]?[Y[k].width<__T.SPR.obj[k].width,Y[k].height<__T.SPR.obj[k].height]:null)}")
            rec('그림','젊은 나무는 모든 나무 종류에 더 작은 그림이 있음', all(x==[True,True] for x in r), str(r))
            # ---- crop stage on look ----
            await ev(pg,"()=>{const T=__T,G=T.G;__clr(Math.floor(G.p.x)-3,Math.floor(G.p.y)-3,7,7);G.p.face={x:0,y:1};G.sel=0;G.inv[0]=null}")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const t=T.targetTile();const o=__crop(t.x,t.y,'cropBerry',40);const a1=T.decide();o.p=G.time-80;const a2=T.decide();o.p=G.time-111;const a3=T.decide();o.p=G.time;const a0=T.decide();return [a0.lbl,a1.lbl,a2.lbl,a3.k,a1.msg]}""")
            rec('단계 표시','작물을 바라보면 "자라는 중 n/4" (씨앗·새싹·꽃 → 다 자라면 수확)', r[0]=='자라는 중 1/4' and r[1]=='자라는 중 2/4' and r[2]=='자라는 중 3/4' and r[3]=='harvest', str(r))
            rec('단계 표시','누르면 단계 이름과 남은 시간 안내', '새싹 (2/4단계)' in r[4] and '남았어요' in r[4], r[4])
            # ---- sickle ----
            r=await ev(pg,"()=>{const T=__T;const rc=T.RECIPES.find(x=>x.out==='sickle'),wc=T.RECIPES.find(x=>x.out==='wcan');return [rc.at,JSON.stringify(rc.req),wc.at,JSON.stringify(wc.req),T.ITEMS.sickle.stack]}")
            rec('구리 낫','구리 장비제작대에서 구리괴 3 + 나무 2 + 이끼 끈 1', r[0]=='smelter' and r[1]=='[["copperBar",3],["wood",2],["rope",1]]', str(r))
            rec('물뿌리개','구리 장비제작대에서 구리괴 2 + 송진 1', r[2]=='smelter' and r[3]=='[["copperBar",2],["resin",1]]', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const cnt=()=>{let n=0;for(const d of G.drops)if(d.id==='berry')n+=d.c;return n};
          G.drops.length=0;let o=__crop(G.p.x+5|0,G.p.y|0,'cropBerry',200);T.harvest({x:G.p.x+5|0,y:G.p.y|0},o);const a=cnt();
          T.addItem('sickle',1);G.drops.length=0;o=__crop(G.p.x+5|0,G.p.y|0,'cropBerry',200);T.harvest({x:G.p.x+5|0,y:G.p.y|0},o);const b2=cnt();Math.random=mr;G.drops.length=0;return [a,b2]}""")
            rec('구리 낫','가방에 있으면 거둘 때 하나 더 (베리 2 → 3)', r==[2,3], str(r))
            r=await ev(pg,"()=>{const T=__T;const s=T.G.inv.find(x=>x&&x.id==='sickle');return [s.dur==null,!T.ITEMS.sickle.dur]}")
            rec('구리 낫','내구도 없음', r==[True,True], str(r))
            # hold to harvest 3x3
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.p.x=Math.floor(G.p.x)+.5;G.p.y=Math.floor(G.p.y)+.5;__clr(Math.floor(G.p.x)-4,Math.floor(G.p.y)-4,9,9);G.p.face={x:0,y:1};G.inv[0]=null;G.sel=0;
          const t=T.targetTile();window.__tt=t;for(let dy=0;dy<=2;dy++)for(let dx=-1;dx<=1;dx++)__crop(t.x+dx,t.y+dy,'cropBerry',200);G.drops.length=0;return [t.x,t.y,T.decide().k]}""")
            await pg.keyboard.down('Space'); await pg.wait_for_timeout(120)
            r1=await ev(pg,"()=>{const T=__T,G=T.G,t=__tt;let n=0;for(let dy=0;dy<=2;dy++)for(let dx=-1;dx<=1;dx++)if(G.objs.get(T.idx(t.x+dx,t.y+dy)))n++;return n}")
            await pg.wait_for_timeout(900); await pg.keyboard.up('Space')
            r2=await ev(pg,"()=>{const T=__T,G=T.G,t=__tt;let n=0;for(let dy=0;dy<=2;dy++)for(let dx=-1;dx<=1;dx++)if(G.objs.get(T.idx(t.x+dx,t.y+dy)))n++;return n}")
            rec('구리 낫','한 번 누르면 하나만 거둠', r[2]=='harvest' and r1==8, f'{r} {r1}')
            rec('구리 낫','꾹 누르고 있으면 주변 3×3을 한 번에 거둠', r2<=3, f'{r1}→{r2}')
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=G.inv.findIndex(x=>x&&x.id==='sickle');G.inv[i]=null;const t=__tt;__clr(t.x-1,t.y,3,3);for(let dx=-1;dx<=1;dx++)__crop(t.x+dx,t.y+1,'cropBerry',200);__crop(t.x,t.y,'cropBerry',200);return T.decide().k}""")
            await pg.keyboard.down('Space'); await pg.wait_for_timeout(1000); await pg.keyboard.up('Space')
            r2=await ev(pg,"()=>{const T=__T,G=T.G,t=__tt;let n=0;for(let dx=-1;dx<=1;dx++)if(G.objs.get(T.idx(t.x+dx,t.y+1)))n++;return n}")
            rec('구리 낫','낫이 없으면 꾹 눌러도 주변을 한꺼번에 거두지 않음', r2==3, f'{r} {r2}')
            # ---- watering can ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x0=Math.floor(G.p.x),y0=Math.floor(G.p.y);__clr(x0-4,y0-4,9,9);T.addItem('wcan',1);const k=G.inv.findIndex(x=>x&&x.id==='wcan');const s=G.inv[k];const w0=s.w||0;G.inv[k]=null;G.inv[0]=s;G.sel=0;G.p.face={x:0,y:1};
          const t=T.targetTile();const wi=T.idx(t.x,t.y);G.floor[wi]=T.WATER;const a1=T.decide();T.fillCan(t);const wf=G.inv[0].w;const a2=T.decide();G.floor[wi]=2;const o=__crop(t.x,t.y,'cropBerry',10);const a3=T.decide();T.waterCrop(t,o);const a4=T.decide();
          return [w0,a1.k,a1.lbl,wf,a2.lbl,a3.k,a3.lbl,o.w,G.inv[0].w,a4.k,a4.msg]}""")
            rec('물뿌리개','새로 만들면 비어 있고, 물가를 보면 "물 채우기"', r[0]==0 and r[1]=='fill' and r[2]=='물 채우기', str(r))
            rec('물뿌리개','한 번 채우면 10번', r[3]==10 and r[4]=='가득 참', str(r))
            rec('물뿌리개','자라는 작물에 "물 주기" → 한 번 쓰고 물 준 표시', r[5]=='water' and r[7]==1 and r[8]==9, str(r))
            rec('물뿌리개','이미 물 준 작물은 단계 안내에 "물 줌"', r[9]=='info' and '물 줌' in r[10], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+20,y=Math.floor(G.p.y)+20;const a=__crop(x,y,'cropBerry',0),b=__crop(x+1,y,'cropBerry',0);b.w=1;G.treeSeeds=0;T.growTick(3);return [+(G.time-a.p).toFixed(2),+(G.time-b.p).toFixed(2)]}""")
            rec('물뿌리개','물 준 작물은 25% 빨리 자람 (3초에 4초만큼)', r==[0,1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv[0].w=0;const t=T.targetTile();const o=__crop(t.x,t.y,'cropBerry',10);const a=T.decide();return [a.k,a.lbl,a.msg]}""")
            rec('물뿌리개','비었으면 물을 줄 수 없고 채우라는 안내', r[0]=='info' and r[1]=='물 없음' and '채워요' in r[2], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.inv[0].w=7;T.openPanel('inv');const h=document.querySelector('#sheet').innerHTML;T.closePanel();const arr=Array(4).fill(null);T.moveInto(arr,G.inv[0]);return [h.includes('#6fb8ff'),arr[0].w]}")
            rec('물뿌리개','남은 물이 칸에 파란 막대로 보이고, 상자로 옮겨도 그대로', r==[True,7], str(r))
            # ---- fertilizer ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.bossDead.queen=false;(G.stats.beaten||{}).queen=0;const f=T.RECIPES.find(x=>x.out==='fert'),fs=T.RECIPES.find(x=>x.out==='fertShroom');const before=[T.recipeOn(f),T.recipeOn(fs)];G.bossDead.queen=true;return [before,T.recipeOn(f),T.recipeOn(fs),f.n,JSON.stringify(f.req),f.at,JSON.stringify(fs.req)]}""")
            rec('비료','버섯 여왕을 물리치기 전엔 비료 레시피가 안 보임', r[0]==[False,False], str(r))
            rec('비료','처치 뒤 작업대에서 흙 3 + 말랑 젤 1 → 비료 2개, 버섯흙 한 삽 + 포자 1 → 버섯 비료 2개', r[1] and r[2] and r[3]==2 and r[4]=='[["dirt",6],["gel",1]]' and r[5]=='bench' and r[6]=='[["gShroom",1],["spore",1]]', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const t=T.targetTile();T.addItem('fert',3);const k=G.inv.findIndex((x,j)=>j>0&&x&&x.id==='fert');const s=G.inv[k];G.inv[k]=null;G.inv[0]=s;G.sel=0;
          const o=__crop(t.x,t.y,'cropBerry',10);const a=T.decide();const rem0=110-(G.time-o.p);T.fertCrop(t,o);const rem1=110-(G.time-o.p);const a2=T.decide();T.fertCrop(t,o);return [a.k,a.lbl,+rem0.toFixed(1),+rem1.toFixed(1),o.f,G.inv[0].c,a2.k,G.stats.fert]}""")
            rec('비료','"비료 주기" → 남은 시간이 바로 40% 줄어듦 (100초 → 60초)', r[0]=='fert' and r[2]==100 and r[3]==60, str(r))
            rec('비료','작물마다 한 번만 (두 번째는 안 됨)', r[4]==1 and r[5]==2 and r[6]=='info' and r[7]==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+22,y=Math.floor(G.p.y)+22;const o=__crop(x,y,'cropBerry',0);G.treeSeeds=5;G.p.x=__T.CX+.5;const ox=x;
          G.objs.delete(T.idx(x,y));const i=T.idx(__T.CX+3,__T.CY+4);G.objs.set(i,o);o.w=1;G.inv[0]={id:'fert',c:2};G.sel=0;T.fertCrop({x:__T.CX+3,y:__T.CY+4},o);for(let k=0;k<40;k++)T.growTick(2);const el=G.time-o.p;G.objs.delete(i);G.treeSeeds=0;return [+el.toFixed(1),T.cropStage(o)]}""")
            rec('비료','물·비료·축복이 다 겹쳐도 원래 시간의 50% 아래로는 안 줄어듦', r[0]<=110.01 and r[0]>=54.9, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0.5;const x=Math.floor(G.p.x)+24,y=Math.floor(G.p.y)+24;const g=()=>G.drops.filter(d=>d.id==='glowcap').length;
          G.drops.length=0;let o=__crop(x,y,'cropShroom',300);T.harvest({x,y},o);const a=g();G.drops.length=0;o=__crop(x,y,'cropShroom',300);o.f=2;T.harvest({x,y},o);const b2=g();Math.random=mr;G.drops.length=0;return [a,b2]}""")
            rec('비료','버섯 비료를 준 버섯은 빛버섯 확률 30% → 60%', r==[0,1], str(r))
            # ---- trees: 4 steps ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x),y=Math.floor(G.p.y);__clr(x-4,y-4,9,9);G.inv[0]=null;G.p.face={x:0,y:1};const t=T.targetTile();const i=T.idx(t.x,t.y);
          const o={t:'sapling',at:G.time+180};G.objs.set(i,o);const s0=[T.treeStep(o),T.decide().lbl,T.decide().k];o.at=G.time+100;const s1=[T.treeStep(o),T.decide().lbl,T.decide().msg];
          o.at=G.time+50;G.p.x=x+.5;G.p.y=y-1.5;T.growTick(2);G.p.y=y+.5;const n=G.objs.get(i);const s2=[n.t,T.isYoung(n),T.treeStep(n),T.decide().k,T.decide().lbl];return [s0,s1,s2]}""")
            rec('나무','묘목 1/4 → 어린나무 2/4 (둘 다 벨 수 없음)', r[0][0]==0 and r[0][1]=='자라는 중 1/4' and r[0][2]=='info' and r[1][0]==1 and r[1][1]=='자라는 중 2/4' and '어린나무' in r[1][2], str(r))
            rec('나무','다 자라기 1분 전부터 젊은 나무 3/4 (벨 수 있음)', r[2][0]=='root' and r[2][1] is True and r[2][2]==2 and r[2][3]=='chop' and r[2][4]=='베기 3/4', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const t=T.targetTile();const i=T.idx(t.x,t.y);const o=G.objs.get(i);G.drops.length=0;let hits=0;while(G.objs.get(i)===o&&hits<10){T.hitObj(t,o);hits++}
          const got={};for(const d of G.drops)got[d.id]=(got[d.id]||0)+d.c;Math.random=mr;const st=G.objs.get(i);G.drops.length=0;return [hits,got,st&&st.t]}""")
            rec('나무','젊은 나무는 금방 베이지만 나무만 조금 (묘목·송진 없음), 그루터기가 남음', r[1]=={'wood':1} and r[2]=='stump', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const t=T.targetTile();const i=T.idx(t.x,t.y);const o=G.objs.get(i);o.at=G.time+240;const a=[T.treeStep(o),T.decide().lbl,T.decide().msg];o.at=G.time+150;const b2=[T.treeStep(o),T.decide().lbl];
          o.at=G.time+59;G.p.y-=2;T.growTick(2);G.p.y+=2;const n=G.objs.get(i);n.yg=G.time-1;T.growTick(2);return [a,b2,n.t,'yg' in n,T.treeStep(n),T.decide().lbl]}""")
            rec('나무','그루터기는 기다렸다가 새순(1/4)부터 다시 자람', r[0][0]==-1 and '새순' in r[0][2] and r[1]==[0,'자라는 중 1/4'], str(r))
            rec('나무','시간이 지나면 다 자란 나무 (젊은 표시가 지워짐)', r[2]=='root' and r[3] is False and r[4]==3 and r[5]=='베기', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const t=T.targetTile();const i=T.idx(t.x,t.y);const o=G.objs.get(i);G.drops.length=0;let hits=0;while(G.objs.get(i)===o&&hits<20){T.hitObj(t,o);hits++}
          const got={};for(const d of G.drops)got[d.id]=(got[d.id]||0)+d.c;Math.random=mr;G.drops.length=0;return got}""")
            rec('나무','다 자란 나무는 지금처럼 묘목까지 나옴', r.get('wood',0)>=2 and r.get('sapling',0)==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+6,y=Math.floor(G.p.y);__clr(x,y-2,3,4);const i=T.idx(x,y);G.objs.set(i,{t:'capStump',g:'bigShroom',at:G.time+30});G.p.y-=3;T.growTick(2);G.p.y+=3;const n=G.objs.get(i);return [n.t,T.isYoung(n)]}""")
            rec('나무','큰버섯 밑동도 같은 흐름 (젊은 큰버섯)', r==['bigShroom',True], str(r))
            # ---- old save ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));const x=Math.floor(G.p.x)+8,y=Math.floor(G.p.y)+8;const i1=T.idx(x,y),i2=T.idx(x+1,y),i3=T.idx(x+2,y),i4=T.idx(x+3,y);
          s.objs=s.objs.filter(([k])=>![i1,i2,i3,i4].includes(k));s.objs.push([i1,{t:'sapling',at:s.time-30}],[i2,{t:'cropBerry',p:s.time-50}],[i3,{t:'stump',g:'root',at:s.time+200}],[i4,{t:'root'}]);for(const k of [i1,i2,i3,i4]){s.wall[0]}
          T.deserialize(s);const G2=T.G;for(const k of [i1,i2,i3,i4]){G2.wall[k]=0}G2.p.y-=30;T.growTick(2);G2.p.y+=30;const a=G2.objs.get(i1),c=G2.objs.get(i2),d=G2.objs.get(i3),e=G2.objs.get(i4);return [a.t,T.isYoung(a),T.cropStage(c),T.treeStep(d),T.isYoung(e),T.treeStep(e)]}""")
            rec('세이브','옛 세이브: 이미 다 자랄 시간이 지난 묘목은 바로 다 자란 나무, 작물·그루터기도 맞는 단계', r==['root',False,1,-1,False,3], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+8,y=Math.floor(G.p.y)+9;const o=__crop(x,y,'cropShroom',20);o.w=1;o.f=2;T.addItem('wcan',1);const s0=G.inv.find(z=>z&&z.id==='wcan');s0.w=4;
          const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const n=T.G.objs.get(T.idx(x,y));const s1=T.G.inv.find(z=>z&&z.id==='wcan'&&z.w===4);return [n.w,n.f,n.p0!=null,!!s1]}""")
            rec('세이브','물·비료 표시와 물뿌리개의 물이 저장·불러오기 뒤에도 그대로', r==[1,2,True,True], str(r))
            # ---- quests ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const q=id=>T.QSIDE.find(x=>x.id===id);G.stats.berryH=0;G.stats.wetH=0;G.stats.fert=0;const a=['s_crop1','s_crop2','s_crop3'].map(id=>T.questState(q(id)).done);
          G.stats.berryH=1;G.stats.wetH=5;G.stats.fert=10;const b2=['s_crop1','s_crop2','s_crop3'].map(id=>T.questState(q(id)).done);return [a,b2,['s_crop1','s_crop2','s_crop3'].map(id=>JSON.stringify(q(id).rw)+q(id).xp)]}""")
            rec('도전','농사 도전 퀘스트 1~3 (베리 거두기 · 물 준 작물 5개 · 비료 10번)', r[0]==[False,False,False] and r[1]==[True,True,True], str(r))
            rec('도전','보상: 베리 씨앗 3·포자 3·경험치 15 / 구리괴 3·25 (+v36 레시피 쪽지) / 젤 6·40', r[2]==['[["berrySeed",3],["spore",3]]15','[["copperBar",3],["rn_glowPancake",1]]25','[["gel",6]]40'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.berryH=0;const x=Math.floor(G.p.x)+8,y=Math.floor(G.p.y)+10;const o=__crop(x,y,'cropBerry',200);o.w=1;const w0=G.stats.wetH;T.harvest({x,y},o);G.drops.length=0;return [G.stats.berryH,G.stats.wetH-w0]}""")
            rec('도전','베리를 거두면 개수가 쌓이고, 물 준 작물도 따로 셈', r==[1,1], str(r))
            # craft panel tab
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x),y=Math.floor(G.p.y);const i=T.idx(x+1,y);G.wall[i]=0;G.objs.set(i,{t:'smelter',lv:1});T.openPanel('craft',{st:'smelter',i});document.querySelector('#sheet [data-a=tab][data-i=tool]').click();const h=document.querySelector('#sheet').innerText;T.closePanel();G.objs.delete(i);return [h.includes('도구'),h.includes('구리 낫'),h.includes('물뿌리개')]}""")
            rec('제작','구리 장비제작대 도구 탭에 구리 낫·물뿌리개 (v61)', r==[True,True,True], str(r))
            # screenshot: a little field
            await ev(pg,"""()=>{const T=__T,G=T.G;G.p.x=Math.floor(G.p.x)+.5;G.p.y=Math.floor(G.p.y)+.5;const x=Math.floor(G.p.x),y=Math.floor(G.p.y);__clr(x-6,y-6,13,13);
          [0,40,80,200].forEach((age,k)=>{__crop(x-4+k,y+2,'cropBerry',age);__crop(x-4+k,y+3,'cropShroom',age*1.2);__crop(x-4+k,y+4,'cropMoss',age*.8)});
          const a=__crop(x+1,y+2,'cropBerry',40);a.w=1;const b2=__crop(x+2,y+2,'cropBerry',40);b2.f=1;const c=__crop(x+3,y+2,'cropBerry',40);c.w=1;c.f=1;
          G.objs.set(T.idx(x-4,y-3),{t:'sapling',at:G.time+170});G.objs.set(T.idx(x-2,y-3),{t:'sapling',at:G.time+100});G.objs.set(T.idx(x,y-3),{t:'root',yg:G.time+50});G.objs.set(T.idx(x+2,y-3),{t:'root'});G.objs.set(T.idx(x+4,y-3),{t:'stump',g:'root',at:G.time+230});G.enemies.length=0}""")
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa33_field.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa34():
    import asyncio, sys
    # 농사 심화 (v34): 흙 맞춤, 별 작물, 빛버섯·수정 콩 재배, 수정 비료, 도전 퀘스트 4
    H2=HOOK.replace("computeLight}","computeLight,SPR,growTick,cropStage,harvest,fertCrop,RECIPES,recipeOn,QSIDE,questState,placeItem,targetTile,rollStar,CROP_SOIL,STAR_OF,availCount,takeAvail,canPlace,lightAt}")
    SETUP="""const T=__T;window.__crop=(x,y,t,age,fl)=>{const G=T.G;const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=fl==null?2:fl;const o={t:t||'cropBerry',p:G.time-(age||0),p0:G.time-(age||0)};G.objs.set(i,o);return o};
window.__spot=(dx,dy)=>{const G=T.G;return [Math.floor(G.p.x)+dx,Math.floor(G.p.y)+dy]};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+SETUP+"T.G.enemies.length=0}")
            # ---- new crops ----
            r=await ev(pg,"""()=>{const T=__T,S=T.SPR.crop;const k=['glow','bean'].map(c=>[S[c].length,S[c][0].length,new Set(S[c].map(v=>v[0].toDataURL())).size]);return [k,T.OBJ.cropGlow.grow,T.OBJ.cropBean.grow,T.ITEMS.glowSpore.crop,T.ITEMS.cbeanSeed.crop]}""")
            rec('새 작물','빛버섯 150초 · 수정 콩 180초, 4단계 그림', r[0]==[[4,4,4],[4,4,4]] and r[1]==150 and r[2]==180 and r[3]=='cropGlow' and r[4]=='cropBean', str(r))
            r=await ev(pg,"()=>{const T=__T;const has=(o,id)=>T.OBJ[o].drops.find(d=>d[0]===id);return [has('cluster','cbeanSeed'),has('glow','glowSpore')]}")
            rec('새 작물','수정 결정에서 수정 콩 씨앗 10%, 들 빛버섯에서 빛버섯 포자', r[0] and r[0][3]==0.1 and r[1] and r[1][3]>0, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__spot(3,0);const i=T.idx(x,y);G.wall[i]=0;G.objs.delete(i);const ok=f=>{G.floor[i]=f;return T.canPlace(x,y,T.ITEMS.cbeanSeed)};return [ok(4),ok(3),ok(1),ok(2),ok(21),ok(5)]}""")
            rec('흙','수정 모래에도 씨앗을 심을 수 있음 (이끼·흙·버섯흙·풀밭도 그대로)', r==[True,True,True,True,True,False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__spot(0,6);const o=__crop(x,y,'cropGlow',0,3);const a=T.cropStage(o);o.p=G.time-110;const b2=T.cropStage(o);T.computeLight();const l2=T.lightAt(x+1,y);o.p=G.time-200;T.computeLight();const l3=T.lightAt(x+1,y);G.objs.delete(T.idx(x,y));T.computeLight();const l0=T.lightAt(x+1,y);return [a,b2,+l0.toFixed(3),+l2.toFixed(3),+l3.toFixed(3)]}""")
            rec('새 작물','빛버섯은 자라면서 은은하게 빛남 (꽃 단계 약하게, 다 자라면 더 밝게)', r[3]>r[2] and r[4]>r[3], str(r))
            # ---- star crops ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0.1;const [x,y]=__spot(4,4);G.bossDead.golem=false;(G.stats.beaten||{}).golem=0;
          const t=(c,fl,f)=>{const o=__crop(x,y,c,999,fl);if(f)o.f=f;T.rollStar(T.idx(x,y),o);return o.star};
          const before=t('cropBerry',1);G.bossDead.golem=true;const r=[before,t('cropBerry',1),t('cropBerry',2),t('cropShroom',3),t('cropGlow',3),t('cropBean',4),t('cropBean',1),t('cropMoss',21)];
          Math.random=()=>0.3;r.push(t('cropBerry',1),t('cropBerry',1,3));Math.random=mr;G.objs.delete(T.idx(x,y));return r}""")
            rec('별 작물','수정골렘을 물리치기 전엔 별 작물 없음', r[0]==0, str(r))
            rec('별 작물','맞는 흙에서만 별 작물 (베리=이끼, 버섯·빛버섯=버섯흙, 수정 콩=수정 모래)', r[1:8]==[1,0,1,1,1,0,0], str(r))
            rec('별 작물','확률 15%, 수정 비료면 35%', r[8:]==[0,1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const [x,y]=__spot(4,4);const o=__crop(x,y,'cropBerry',999,1);T.growTick(2);const st=o.star;
          G.p.face={x:0,y:1};const tt=T.targetTile();const o2=__crop(tt.x,tt.y,'cropBerry',999,1);o2.star=1;const a=T.decide();
          G.drops.length=0;const h0=G.stats.starH||0;T.harvest({x:tt.x,y:tt.y},o2);const got={};for(const d of G.drops)got[d.id]=(got[d.id]||0)+d.c;Math.random=mr;G.drops.length=0;G.objs.delete(T.idx(x,y));return [st,a.lbl,got,(G.stats.starH||0)-h0]}""")
            rec('별 작물','다 자라면 별 작물인지 정해지고 (바라보면 "별 수확!")', r[0]==1 and r[1]=='별 수확!', str(r))
            rec('별 작물','별 작물은 주 수확물이 별 아이템으로 나옴 (씨앗은 그대로)', r[2].get('berryS',0)>=2 and 'berry' not in r[2] and r[2].get('berrySeed',0)>=1 and r[3]==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__spot(5,5);const o=__crop(x,y,'cropShroom',999,3);o.star=0;const k=G.drops.length;T.harvest({x,y},o);const ids=G.drops.slice(k).map(d=>d.id);G.drops.length=0;return ids.includes('mushroomS')}""")
            rec('별 작물','별이 아닌 작물은 지금처럼', r is False, r)
            # ---- star items stand in for plain ones ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;T.addItem('berry',2);T.addItem('berryS',3);const a=T.availCount('berry');T.takeAvail('berry',4);
          const left=[T.countItem('berry'),T.countItem('berryS')];return [a,left,T.ITEMS.berryS.kind,T.ITEMS.berryS.food>T.ITEMS.berry.food]}""")
            rec('별 아이템','제작에서 별 베리가 통통베리 대신 쓰임 (보통 베리를 먼저 씀)', r[0]==5 and r[1]==[0,1], str(r))
            rec('별 아이템','별 베리는 그냥 먹어도 배가 더 참', r[2]=='food' and r[3] is True, str(r))
            # ---- crystal fertilizer ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const f=T.RECIPES.find(x=>x.out==='fertCry');G.bossDead.golem=false;(G.stats.beaten||{}).golem=0;const a=T.recipeOn(f);G.bossDead.golem=true;
          const [x,y]=__spot(6,6);const o=__crop(x,y,'cropBean',10,4);G.inv[0]={id:'fertCry',c:2};G.sel=0;T.fertCrop({x,y},o);G.objs.delete(T.idx(x,y));return [a,T.recipeOn(f),f.at,JSON.stringify(f.req),f.n,o.f]}""")
            rec('수정 비료','수정골렘 처치 뒤 석영 작업대: 수정 모래 한 삽 + 수정 조각 1 → 2개', r[0] is False and r[1] is True and r[2]=='bench' and r[3]=='[["gCrystal",1],["crystal",1]]' and r[4]==2, str(r))
            rec('수정 비료','뿌리면 수정 비료 표시 (별 확률 35%)', r[5]==3, str(r))
            # ---- soil hint ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv[0]=null;G.p.face={x:0,y:1};const tt=T.targetTile();__crop(tt.x,tt.y,'cropBerry',10,2);const a=T.decide().msg;__crop(tt.x,tt.y,'cropBerry',10,1);const b2=T.decide().msg;G.bossDead.golem=false;(G.stats.beaten||{}).golem=0;const c=T.decide().msg;G.bossDead.golem=true;G.objs.delete(T.idx(tt.x,tt.y));return [a,b2,c]}""")
            rec('흙','바라보면 맞는 흙인지 안내 (수정골렘 뒤)', '이끼에 심으면 별 작물' in r[0] and '맞는 흙' in r[1] and '흙' not in r[2].split('·')[-1], str(r))
            # ---- quest ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const q=T.QSIDE.find(x=>x.id==='s_crop4');G.stats.starH=4;const a=T.questState(q).done;G.stats.starH=5;return [a,T.questState(q).done,JSON.stringify(q.rw),q.xp]}""")
            rec('도전','별 작물 5개 거두기 (수정 조각 8, 경험치 60, +v36 레시피 쪽지)', r==[False,True,'[["crystal",8],["rn_beanSteam",1]]',60], str(r))
            # ---- save ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__spot(7,3);const o=__crop(x,y,'cropBean',999,4);o.star=1;T.addItem('cbeanS',2);const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const n=T.G.objs.get(T.idx(x,y));return [n.t,n.star,T.countItem('cbeanS')>=2]}""")
            rec('세이브','별 작물 표시와 별 아이템이 저장·불러오기 뒤에도 그대로', r==['cropBean',1,True], str(r))
            r=await ev(pg,"""()=>{const T=__T;const s=JSON.parse(JSON.stringify(T.serialize()));const [x,y]=__spot(8,3);const i=T.idx(x,y);s.objs=s.objs.filter(([k])=>k!==i);s.objs.push([i,{t:'cropBerry',p:s.time-500}]);T.deserialize(s);const G=T.G;G.floor[i]=1;G.wall[i]=0;G.bossDead.golem=true;const mr=Math.random;Math.random=()=>0.01;T.growTick(2);Math.random=mr;return G.objs.get(i).star}""")
            rec('세이브','옛 세이브의 다 자란 작물도 그대로 이어지고 별 여부가 정해짐', r==1, r)
            # screenshot
            await ev(pg,"""()=>{const T=__T,G=T.G;G.p.x=Math.floor(G.p.x)+.5;G.p.y=Math.floor(G.p.y)+.5;const [x,y]=__spot(0,0);for(let yy=y+1;yy<=y+4;yy++)for(let xx=x-4;xx<=x+4;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i);G.floor[i]=2}
          [0,40,100,999].forEach((age,k)=>{__crop(x-4+k,y+2,'cropGlow',age,3);__crop(x-4+k,y+3,'cropBean',age*1.2,4)});const s1=__crop(x+1,y+2,'cropBerry',999,1);s1.star=1;const s2=__crop(x+2,y+2,'cropGlow',999,3);s2.star=1;const s3=__crop(x+3,y+3,'cropBean',999,4);s3.star=1;G.enemies.length=0}""")
            await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'qa34_field.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa36():
    import asyncio, sys
    # 요리 (v36): 버프 3칸, 레시피 쪽지 해금·??? 카드·도감, 별 요리, 낚시 운·병 속 쪽지·분수
    H2=HOOK.replace("computeLight}","computeLight,DISHES,DISH,EFF,RECIPES,recipeOn,knows,learnRecipe,maybeNote,eat,bval,activeBuffs,meleeMul,moveMul,mineMul,maxHp,hungerMul,hurtPlayer,gainXp,catchTable,luckTier,fishBottle,openTreasure,roomNotes,bossNoteIds,QSIDE,claimQuest,BUFF_DUR,availCount,takeAvail,lightAt,cam,renderPanel,hitBoss,freshBoss}")
    EATS="window.__eat=(id,c)=>{const T=__T,G=T.G;G.inv[0]={id,c:c||1};G.sel=0;G.p.hunger=10;T.eat(0);return G.inv[0]?G.inv[0].c:0};"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+EATS+"__T.G.enemies.length=0}")
            r=await ev(pg,"""()=>{const T=__T;const D=T.DISHES.filter(d=>!d[6].some(([m])=>['fireBerry','radish'].includes(m))&&!['cold','heat'].includes(d[2])&&d[0]!=='festCake');const buff=D.filter(d=>d[3]>0).length;const per={};for(const d of D)if(d[2])per[d[2]]=(per[d[2]]||0)+1;const pot=T.RECIPES.filter(r=>r.at==='pot'&&r.dish&&!r.star&&D.some(d=>d[0]===r.dish)).length;const deep=D.some(d=>d[6].some(([m])=>['fireBerry'].includes(m)));return [D.length,buff,per,pot,deep]}""")
            rec('요리','깊은 동굴 재료 없는 요리 25가지 (버프 24 + 메기 매운탕), 모두 요리솥 레시피', r[0]==25 and r[1]==24 and r[3]==25 and r[4] is False, str(r))
            rec('요리','효과 10가지 (공격·피해·이동·채굴·빛·재생·최대체력·배고픔·낚시 운·경험치)', len(r[2])==10, str(r[2]))
            # unknown recipes
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x),y=Math.floor(G.p.y);const i=T.idx(x+1,y);G.wall[i]=0;G.objs.set(i,{t:'pot'});T.openPanel('craft',{st:'pot'});const h=document.querySelector('#sheet').innerText;const n=document.querySelectorAll('#sheet .rc.lockd').length;T.closePanel();return [Object.keys(G.recipes).length,h.includes('???'),n,h.includes('베리 파이'),h.includes('몬스터가 가끔'),h.includes('요리 도감')]}""")
            rec('해금','새 게임은 초기 3종만 알고 나머지는 ??? 카드와 위치 힌트 (v37부터 깊은 동굴 요리, v40 케이크 포함 38장)', r[0]==0 and r[1] is True and r[2]==38 and r[3] is True and r[4] is True, str(r))
            rec('도감','요리솥에 요리 도감 탭', r[5] is True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const before=T.knows('skewer');const left=T.addItem('rn_skewer',1);const inBag=G.inv.some(s=>s&&s.id==='rn_skewer');const t=document.body.innerText.includes('새 레시피');return [before,left,inBag,T.knows('skewer'),t]}""")
            rec('해금','레시피 쪽지를 주우면 바로 해금 (가방엔 안 들어감)', r==[False,0,False,True,True], str(r))
            # buffs
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];const m0=T.meleeMul();__eat('skewer');const b=T.activeBuffs();const m1=T.meleeMul();return [b.length,b[0]&&b[0].ef,b[0]&&b[0].tier,Math.round((b[0].end-G.time)),+(m1/m0).toFixed(3)]}""")
            rec('버프','버섯 꼬치: 공격력 +5% · 3분', r==[1,'atk',1,180,1.05], str(r))
            await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[document.querySelectorAll('#buffs .bf').length,!document.querySelector('#buffs').hidden]")
            rec('버프','화면 위에 효과 아이콘 칸 (남은 시간 테두리)', r==[1,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];__eat('capSteak');const a=T.activeBuffs().map(b=>b.tier);const left=__eat('skewer');const b2=T.activeBuffs().map(b=>b.tier+':'+b.id);const t=document.body.innerText.includes('더 좋은 효과');__eat('capSteak');return [a,left,b2,t,T.activeBuffs().length]}""")
            rec('버프','같은 효과는 높은 단계 하나만 (낮은 걸 먹으면 배만 참)', r[0]==[2] and r[1]==0 and r[2]==['2:capSteak'] and r[3] is True and r[4]==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];__eat('skewer');const e1=T.activeBuffs()[0].end;G.time+=10;__eat('capSteak');const b=T.activeBuffs();return [b.length,b[0].tier,Math.round(b[0].end-G.time)]}""")
            rec('버프','같거나 높은 단계는 교체하고 시간 새로 시작', r==[1,2,300], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];__eat('skewer');G.time+=50;__eat('gelSoup');__eat('bouncyJelly');const a=T.activeBuffs().map(b=>b.ef);const left=__eat('glowGrill');const asked=T.activeBuffs().length;const b2=__eat('glowGrill');return [a,left,asked,b2,T.activeBuffs().map(b=>b.ef)]}""")
            rec('버프','효과 3칸이 가득 차면 한 번 물어보고(먹지 않음), 다시 먹으면 남은 시간이 가장 짧은 효과와 바꿈', r[0]==['atk','def','move'] and r[1]==1 and r[2]==3 and r[3]==0 and r[4]==['def','move','light'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const out={};const t=(id,fn)=>{G.buffs=[];const a=fn();__eat(id);const b2=fn();G.buffs=[];return [a,b2]};
          out.move=t('bouncyJelly',()=>+T.moveMul().toFixed(3));out.mine=t('capStirfry',()=>+T.mineMul().toFixed(3));out.maxhp=t('capSoup',()=>T.maxHp());out.hunger=t('petalTea',()=>+T.hungerMul().toFixed(3));
          out.def=t('gelSoup',()=>{G.p.hp=100;G.p.inv=0;G.p.dead=0;G.p.sit=null;G.p.sleep=null;T.hurtPlayer(40,G.p.x+1,G.p.y);const d=100-G.p.hp;G.p.hp=100;G.p.inv=0;G.p.dead=0;return d});
          out.xp=t('petalPancake',()=>{const R=G.rpg;R.xp=0;const x0=R.xp,l0=R.lv;T.gainXp(10);const d=R.xp-x0+(R.lv-l0)*1000;return d});
          out.luck=t('baitDango',()=>{G.luck=0;const k=T.catchTable(0).find(x=>x[0]==='koi')[1];return k});
          out.light=t('glowGrill',()=>{T.cam.x=G.p.x;T.cam.y=G.p.y;T.computeLight();return +T.lightAt(Math.floor(G.p.x)+5,Math.floor(G.p.y)).toFixed(3)});
          return out}""")
            rec('효과','이동 +10% · 채굴 +10% · 최대 체력 +10 · 배고픔 75% 속도', abs(r['move'][1]/r['move'][0]-1.1)<.01 and abs(r['mine'][1]/r['mine'][0]-1.1)<.01 and r['maxhp'][1]-r['maxhp'][0]==10 and abs(r['hunger'][1]/r['hunger'][0]-.75)<.01, str(r))
            rec('효과','받는 피해 -5% · 경험치 +10% · 낚시 운(잉어 1.5배) · 빛 범위 넓어짐', r['def']==[40,38] and r['xp'][1]==11 and r['xp'][0]==10 and abs(r['luck'][1]/r['luck'][0]-1.5)<.01 and r['light'][1]>r['light'][0], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];G.p.hp=50;G.p.hunger=50;__eat('shroomPorridge');const h0=G.p.hp,t0=G.time;return new Promise(res=>{const w=()=>G.time-t0>=4.6?res([h0,G.p.hp]):setTimeout(w,50);w()})}""")  # 실제 시계가 아니라 게임 시간으로 4.6초
            rec('효과','체력 재생: 4초마다 +1', r[1]-r[0]>=1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];__eat('skewer');G.time+=181;return new Promise(res=>setTimeout(()=>res([T.activeBuffs().length,G.buffs.length,document.body.innerText.includes('효과가 끝났어요')]),400))}""")
            rec('버프','시간이 다 되면 효과가 사라지고 알림', r==[0,0,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];G.p.hp=40;G.p.hunger=10;const left=__eat('catfishSoup');return [T.activeBuffs().length,G.p.hp>=100,G.p.hunger>=70]}""")
            rec('버프','회복 요리(메기 매운탕)는 효과 칸을 쓰지 않음', r==[0,True,True], str(r))
            # star dishes
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.learnRecipe('glowGrill',true);for(let k=0;k<G.inv.length;k++)G.inv[k]=null;const sr=T.RECIPES.find(r=>r.out==='glowGrillS');const a=T.recipeOn(sr);T.addItem('glowcapS',1);T.addItem('glowcap',1);const b2=T.recipeOn(sr);
          G.buffs=[];__eat('glowGrillS');const bb=T.activeBuffs()[0];return [a,b2,JSON.stringify(sr.req),Math.round(bb.end-G.time),T.ITEMS.glowGrillS.food,T.ITEMS.glowGrill.food]}""")
            rec('별 요리','별 작물이 있을 때만 별 요리 레시피가 보임 (별 재료 하나 들어감)', r[0] is False and r[1] is True and r[2]=='[["glowcap",1],["glowcapS",1]]', str(r))
            rec('별 요리','별 요리는 효과 1.5배 오래 (3분 → 4분 30초), 배 1.2배', r[3]==270 and r[4]==round(r[5]*1.2), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;T.addItem('petalR',1);T.addItem('petalB',1);const a=T.availCount('anyPetal');T.takeAvail('anyPetal',2);return [a,G.inv.filter(Boolean).length]}""")
            rec('재료','"아무 꽃잎"은 어떤 색 꽃잎이든 쓰임', r==[2,0], str(r))
            # notes from sources
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0.001;G.drops.length=0;T.maybeNote('mon',G.p.x,G.p.y);T.maybeNote('gather',G.p.x,G.p.y);T.maybeNote('fish',G.p.x,G.p.y);Math.random=mr;const ids=G.drops.map(d=>d.id);
          G.drops.length=0;Math.random=()=>0.99;T.maybeNote('mon',1,1);Math.random=mr;return [ids.length,ids.map(id=>T.DISHES.find(d=>d[0]===id.slice(3))[7]),G.drops.length]}""")
            rec('쪽지','1단계 쪽지: 몬스터·채집·낚시에서 가끔 (모르는 것만)', r[0]==3 and r[1]==['mon','gather','fish'] and r[2]==0, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const out=G.rooms.map(rm=>rm.id+':'+T.roomNotes(rm).join('+'));const rm=G.rooms.find(q=>q.b===2&&q.k===0)||G.rooms[0];G.drops.length=0;const o=G.objs.get(T.idx(rm.cx,rm.cy));o.open=0;rm.open=0;T.openTreasure({x:rm.cx,y:rm.cy},o);const notes=G.drops.filter(d=>d.id.startsWith('rn_')).map(d=>d.id);G.drops.length=0;return [out,notes,T.roomNotes(rm)]}""")
            all_notes=[n for x in r[0] for n in x.split(':')[1].split('+') if n]
            rec('쪽지','2·3단계 쪽지: 숨은 방 보물상자에서 (용암·얼음 방은 3단계)', len(r[1])>=1 and r[1]==['rn_'+n for n in r[2]], str(r[1:]))
            rec('쪽지','방이 하나뿐인 지역은 그 방에서 두 장 다 나와서 빠지는 쪽지가 없음', len(set(all_notes))>=7 or len(r[0])<8, str(r[0]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const out={};for(const k of ['slime','golem','queen'])out[k]=T.bossNoteIds(k);const q=T.QSIDE.filter(q=>q.rw.some(([id])=>id.startsWith('rn_'))).map(q=>q.id+':'+q.rw.find(([id])=>id.startsWith('rn_'))[0]);return [out,q]}""")
            rec('쪽지','보스: 말랑대왕 → 메기 매운탕, 수정골렘 → 반짝 새우 경단', r[0]['slime'][0]=='catfishSoup' and r[0]['golem'][0]=='shrimpDango', str(r[0]))
            rec('쪽지','도전 퀘스트 보상에 쪽지 (물 준 작물·별 작물·보물상자·물고기)', sorted(r[1])==sorted(['s_crop2:rn_glowPancake','s_crop4:rn_beanSteam','s_rooms:rn_petalRiceCake','s_fish:rn_crucianBraise']), str(r[1]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.qclaim={};G.stats.fishCaught=10;const before=T.knows('crucianBraise');T.claimQuest('s_fish');return [before,T.knows('crucianBraise')]}""")
            rec('쪽지','퀘스트 보상을 받으면 바로 해금', r==[False,True], str(r))
            # fishing luck & bottle
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];G.luck=0;const t0=T.catchTable(0);const p0=t0.find(x=>x[0]==='bottle')[1]/t0.reduce((a,x)=>a+x[1],0);G.luck=G.time+120;const L=T.luckTier();const t2=T.catchTable(0);const k=t2.find(x=>x[0]==='koi')[1]/t0.find(x=>x[0]==='koi')[1],bo=t2.find(x=>x[0]==='boot')[1]/t0.find(x=>x[0]==='boot')[1],p2=t2.find(x=>x[0]==='bottle')[1]/t2.reduce((a,x)=>a+x[1],0);
          __eat('shrimpDango');const L3=T.luckTier();const t3=T.catchTable(0);const p3=t3.find(x=>x[0]==='bottle')[1]/t3.reduce((a,x)=>a+x[1],0);G.luck=0;G.buffs=[];return [+p0.toFixed(3),L,k,bo,+p2.toFixed(3),L3,+p3.toFixed(3)]}""")
            rec('낚시 운','기본 병 속 쪽지 1%, 분수 소원은 2단계 (잉어 2배·장화 절반·병 4%)', r[0]==0.01 and r[1]==2 and r[2]==2 and r[3]==0.5 and r[4]==0.04, str(r))
            rec('낚시 운','요리 3단계가 더 높으면 그쪽만 적용 (병 6%)', r[5]==3 and r[6]==0.06, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const a=T.knows('koiSteam');T.fishBottle();const b2=T.knows('koiSteam');const n0=G.inv.filter(Boolean).reduce((a,s)=>a+s.c,0)+G.drops.length;T.fishBottle();const n1=G.inv.filter(Boolean).reduce((a,s)=>a+s.c,0)+G.drops.length;return [a,b2,n1-n0>=3]}""")
            rec('낚시 운','병 속 쪽지: 처음엔 별빛 잉어찜 레시피, 그다음부터는 작은 보물상자', r==[False,True,True], str(r))
            # save
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];__eat('capSoup');const rc=Object.keys(G.recipes).sort().join(',');const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const G2=T.G;return [rc.split(',').every(k=>G2.recipes[k]),T.activeBuffs().map(b=>b.ef).join(','),T.maxHp()]}""")
            rec('세이브','아는 레시피와 지금 효과가 저장·불러오기 뒤에도 그대로', r[0] is True and r[1]=='maxhp' and r[2]>=110, str(r))
            r=await ev(pg,"""()=>{const T=__T;const sv=JSON.parse(JSON.stringify(T.serialize()));delete sv.recipes;delete sv.buffs;sv.bossDead.queen=true;sv.bossDead.slime=true;sv.qclaim={s_fish:1};sv.rooms=sv.rooms.map((r,k)=>Object.assign(r,{open:k===0?1:0}));
          T.deserialize(sv);const G=T.G;const r0=G.rooms[0];return [T.knows('skewer')&&T.knows('glowGrill')&&T.knows('baitDango'),T.knows('catfishSoup'),T.knows('crucianBraise'),T.roomNotes(r0).every(id=>T.knows(id)),T.knows('shrimpDango'),G.buffs.length]}""")
            rec('옛 세이브','이미 이룬 것의 쪽지는 바로 해금 (버섯 여왕 뒤 1단계 전부, 말랑대왕, 받은 퀘스트, 연 숨은 방)', r==[True,True,True,True,False,0], str(r))
            r=await ev(pg,"""()=>{const T=__T;const sv=JSON.parse(JSON.stringify(T.serialize()));delete sv.recipes;delete sv.buffs;for(const k in sv.bossDead)sv.bossDead[k]=false;sv.stats.beaten={};sv.qclaim={};sv.rooms.forEach(r=>r.open=0);T.deserialize(sv);return Object.keys(T.G.recipes).length}""")
            rec('옛 세이브','초반 세이브는 초기 3종만 알고 시작', r==0, r)
            # screenshot
            await ev(pg,"""()=>{const T=__T,G=T.G;for(const d of T.DISHES.slice(0,9))T.learnRecipe(d[0],true);G.buffs=[];__eat('skewer');__eat('capSoup');__eat('glowGrill');const x=Math.floor(G.p.x),y=Math.floor(G.p.y);const i=T.idx(x+1,y);G.wall[i]=0;G.objs.set(i,{t:'pot'});T.addItem('mushroom',8);T.addItem('berry',5);T.addItem('gel',4);T.addItem('gWater',3);G.enemies.length=0}""")
            await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa36_hud.png')
            await ev(pg,"()=>{const T=__T,G=T.G;T.openPanel('craft',{st:'pot'})}"); await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa36_pot.png')
            await ev(pg,"()=>{const b=document.querySelector('[data-a=tab][data-i=book]');if(b)b.click()}"); await pg.wait_for_timeout(700)
            await ev(pg,"()=>{const b=document.querySelector('[data-a=tab][data-i=book]');if(b)b.click()}"); await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa36_book.png')
            r=await ev(pg,"()=>document.querySelectorAll('.dbook .dk').length")
            rec('도감','도감에 요리 41가지 (초기 3 + v36 25 + v37 12 + v40 케이크), 만든 요리에 도장', r==41, r)
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa40():
    import asyncio, sys
    # 자동화·마무리 (v40): 스프링클러, 자동 수확기, 거대 작물, 등불 축제 케이크
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,recipeOn,circuitTick,growTick,cropStage,knows,learnRecipe,syncNotes,eat,QSIDE,questState,SPR,targetTile,cam}")
    SET="""window.__area=(x0,y0,w,h,f)=>{const T=__T,G=T.G;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=f==null?2:f;G.objs.delete(i);G.wire.delete(i)}};
window.__crop=(x,y,t,age,fl)=>{const T=__T,G=T.G;const i=T.idx(x,y);G.wall[i]=0;if(fl!=null)G.floor[i]=fl;const o={t:t||'cropBerry',p:G.time-(age||0),p0:G.time-(age||0)};G.objs.set(i,o);return o};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+SET+"__T.G.enemies.length=0}")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=T.RECIPES.find(r=>r.out==='sprinkler'),h=T.RECIPES.find(r=>r.out==='harvester');const a=[T.recipeOn(s),T.recipeOn(h)];G.stats.made=G.stats.made||{};G.stats.made.crystalGen=1;return [a,T.recipeOn(s),T.recipeOn(h),s.at,JSON.stringify(s.req),JSON.stringify(h.req)]}""")
            rec('자동화','수정 발전기를 만든 뒤 작업대에 스프링클러·자동 수확기', r[0]==[False,False] and r[1] and r[2] and r[3]=='bench', str(r))
            rec('자동화','재료: 스프링클러 철괴4·구리괴2·물 한 동이2 / 수확기 철괴6·수정 조각4·전선4', r[4]=='[["ironBar",4],["copperBar",2],["gWater",2]]' and r[5]=='[["ironBar",6],["crystal",4],["wire",4]]', str(r))
            # sprinkler
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+20,y=__T.CY+20;__area(x-4,y-4,12,10);G.objs.set(T.idx(x,y),{t:'crystalGen'});G.wire.set(T.idx(x+1,y),1);G.objs.set(T.idx(x+2,y),{t:'sprinkler'});
          const a=__crop(x+2,y+2,'cropBerry',10),b2=__crop(x+4,y-2,'cropBerry',10),far=__crop(x+5,y+3,'cropBerry',10),ripe=__crop(x+1,y+1,'cropBerry',500);for(let k=0;k<15;k++)T.circuitTick(.2);return [!!G.objs.get(T.idx(x+2,y)).work,a.w,b2.w,far.w,ripe.w]}""")
            rec('스프링클러','전기가 들어오면 둘레 5×5의 자라는 작물에 물 (밖이나 다 자란 작물은 그대로)', r==[True,1,1,None,None], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+20,y=__T.CY+20;G.wire.delete(T.idx(x+1,y));const c=__crop(x+3,y+1,'cropBerry',10);for(let k=0;k<15;k++)T.circuitTick(.2);return [!!G.objs.get(T.idx(x+2,y)).work,c.w]}""")
            rec('스프링클러','전기가 끊기면 멈춤', r==[False,None], str(r))
            # harvester
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const x=__T.CX+20,y=__T.CY+32;__area(x-3,y-3,10,8);G.objs.set(T.idx(x,y),{t:'crystalGen'});G.wire.set(T.idx(x+1,y),1);const hi=T.idx(x+2,y);G.objs.set(hi,{t:'harvester'});G.objs.set(T.idx(x+3,y),{t:'chest',items:Array(18).fill(null)});
          for(const [dx,dy] of [[-1,-1],[0,-1],[1,1]])__crop(x+2+dx,y+dy,'cropBerry',500);const young=__crop(x+1,y+1,'cropBerry',10);const far=__crop(x+5,y+2,'cropBerry',500);T.addItem('sickle',1);
          for(let k=0;k<20;k++)T.circuitTick(.2);Math.random=mr;const ch=G.objs.get(T.idx(x+3,y)).items.filter(Boolean).map(s=>s.id+':'+s.c).join(',');return [ch,!!G.objs.get(T.idx(x+1,y-1)),!!G.objs.get(T.idx(x+1,y+1)),!!G.objs.get(T.idx(x+5,y+2)),G.stats.autoH]}""")
            rec('자동 수확기','둘레 3×3의 다 자란 작물만 거둬서 옆 상자로 (구리 낫 보너스 없음)', r[0]=='berry:6,berrySeed:3' and r[1] is False and r[2] is True and r[3] is True and r[4]==3, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const x=__T.CX+20,y=__T.CY+32;G.objs.delete(T.idx(x+3,y));__crop(x+2,y+1,'cropBerry',500);for(let k=0;k<20;k++)T.circuitTick(.2);Math.random=mr;const h=G.objs.get(T.idx(x+2,y));const st=(h.store||[]).map(s=>s.id+':'+s.c).join(',');
          G.p.x=x+2.5;G.p.y=y+1.5;G.p.face={x:0,y:-1};const a=T.decide();T.perform?0:0;return [st,a.k,a.lbl]}""")
            rec('자동 수확기','상자가 없으면 안에 모아 두고, 바라보면 "꺼내기"', r[0]=='berry:2,berrySeed:1' and r[2]=='꺼내기', str(r))
            # giant crops
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;let n=0;Math.random=()=>(n++===1?0:.5);G.bossDead.golem=true;const x=__T.CX+30,y=__T.CY+20;__area(x-2,y-2,8,8,1);for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])__crop(x+dx,y+dy,'cropBerry',500,1);
          T.growTick(2);Math.random=mr;const g=G.objs.get(T.idx(x,y));const parts=[[1,0],[0,1],[1,1]].map(([dx,dy])=>G.objs.get(T.idx(x+dx,y+dy))).map(o=>o&&o.t);G.p.x=x+1;G.p.y=y+2.6;G.p.face={x:0,y:-1};const tt=T.targetTile();const a=T.decide();return [g&&g.t,g&&g.c,parts,a.k,a.lbl,G.stats.giants]}""")
            rec('거대 작물','같은 작물 2×2가 맞는 흙에서 다 자라면 (3%) 하나로 합쳐짐', r[0]=='giantCrop' and r[1]=='cropBerry' and r[2]==['_part','_part','_part'], str(r))
            rec('거대 작물','바라보면 "거대 수확!"', r[3]=='giant' and r[4]=='거대 수확!', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+30,y=__T.CY+20;G.p.x=x+1;G.p.y=y+2.6;G.p.face={x:0,y:-1};const a=T.decide();return [a.t.x===x&&a.t.y===y]}""")
            rec('거대 작물','앞에 있는 거대 작물은 본체(왼쪽 위 칸)로 다룸', r==[True], str(r))
            await ev(pg,"""()=>{const T=__T,G=T.G;T.cam.x=__T.CX+31;T.cam.y=__T.CY+21;G.p.x=__T.CX+31;G.p.y=__T.CY+22.6;G.enemies.length=0}""")
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa40_giant.png')
            # 떨어진 아이템은 금방 가방으로 들어가요. 땅에 남은 것 + 가방에 늘어난 것을 합쳐 세고, 수확이 끝날 때까지(최대 5초) 기다려요
            await ev(pg,"""()=>{const G=__T.G;G.drops.length=0;window.__inv0={berry:__T.countItem('berry'),berrySeed:__T.countItem('berrySeed')};window.__mr=Math.random;Math.random=()=>0;G.p.face={x:0,y:-1}}""")
            await pg.keyboard.press('Space'); await wait_until(pg,"()=>__T.G.stats.giantH>=1",5000); await pg.wait_for_timeout(100)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;Math.random=window.__mr;const x=__T.CX+30,y=__T.CY+20;const got={};for(const d of G.drops)got[d.id]=(got[d.id]||0)+d.c;for(const id in window.__inv0)got[id]=(got[id]||0)+T.countItem(id)-window.__inv0[id];for(const id in got)if(!got[id])delete got[id];return [!!G.objs.get(T.idx(x,y)),!!G.objs.get(T.idx(x+1,y+1)),got,G.stats.giantH]}""")
            rec('거대 작물','거두면 수확량 6배 (베리 12~18)·씨앗 3개, 네 칸 모두 비워짐', r[0] is False and r[1] is False and 12<=r[2].get('berry',0)<=18 and r[2].get('berrySeed',0)==3 and r[3]==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const mr=Math.random;Math.random=()=>0;const x=__T.CX+36,y=__T.CY+20;__area(x-1,y-1,5,5,2);for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])__crop(x+dx,y+dy,'cropBerry',500,2);T.growTick(2);Math.random=mr;return G.objs.get(T.idx(x,y)).t}""")
            rec('거대 작물','맞지 않는 흙에서는 생기지 않음', r=='cropBerry', r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+40,y=__T.CY+20;__area(x-1,y-1,5,5,1);for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])__crop(x+dx,y+dy,'cropBerry',500,1);const mr=Math.random;Math.random=()=>0.5;T.growTick(2);Math.random=()=>0;T.growTick(2);Math.random=mr;return G.objs.get(T.idx(x,y)).t}""")
            rec('거대 작물','한 번 실패한 2×2는 다시 굴리지 않음', r=='cropBerry', r)
            # cake
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const a=T.knows('festCake');G.won2=true;T.syncNotes();const b2=T.knows('festCake');const rc=T.RECIPES.find(r=>r.out==='festCake');G.inv[0]={id:'festCake',c:2};G.sel=0;G.p.hunger=0;T.eat(0);return [a,b2,rc.at,JSON.stringify(rc.req),Math.round(G.p.hunger),G.inv[0].c]}""")
            rec('케이크','진 엔딩(다섯 등불)에 레시피 해금, 베리5·꽃잎 다섯 색·빛버섯2', r[0] is False and r[1] is True and r[2]=='pot' and r[3]=='[["berry",5],["petalR",1],["petalB",1],["petalY",1],["petalW",1],["petalK",1],["glowcap",2]]', str(r))
            rec('케이크','먹으면 배 100', r[4]==100 and r[5]==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;__area(x-2,y-2,6,6);G.objs.set(T.idx(x,y),{t:'table'});G.p.x=x+.5;G.p.y=y+1.6;G.p.face={x:0,y:-1};G.sel=0;G.enemies.length=0;const a=T.decide();return [a.k,a.lbl]}""")
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(300)
            r2=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;const o=G.objs.get(T.idx(x,y));G.enemies.length=0;return [o.cake,G.inv[0],T.decide().lbl]}""")  # 근처에 몬스터가 생기면 「공격」이 먼저라 비우고 봐요
            rec('케이크','탁자 앞에서 들고 누르면 탁자 위에 올려 장식', r==['cakeOn','올리기'] and r2[0]==1 and r2[1] is None and r2[2]=='가져오기', f'{r} {r2}')
            await ev(pg,"""()=>{const T=__T,G=T.G;T.cam.x=G.p.x;T.cam.y=G.p.y;G.enemies.length=0}"""); await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa40_cake.png')
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const G2=T.G;const x=__T.CX+44,y=__T.CY+20;return [G2.objs.get(T.idx(x,y)).cake,T.knows('festCake')]}""")
            rec('세이브','탁자 위 케이크와 케이크 레시피가 그대로', r==[1,True], str(r))
            await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;G.p.x=x+.5;G.p.y=y+1.6;G.p.face={x:0,y:-1};G.inv[0]=null}"""); await pg.wait_for_timeout(100)
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(300)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;G.p.x=x+.5;G.p.y=y+1.6;G.p.face={x:0,y:-1};const a=T.decide();return a}""")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+44,y=__T.CY+20;return [G.objs.get(T.idx(x,y)).cake,G.inv.some(s=>s&&s.id==='festCake')]}""")
            rec('케이크','"가져오기"로 다시 가방에', r[0] is None and r[1] is True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const q=id=>T.QSIDE.find(x=>x.id===id);G.stats.autoH=20;G.stats.giantH=1;return [T.questState(q('s_auto')).done,T.questState(q('s_giant')).done]}""")
            rec('도전','자동 수확기로 20개 · 거대 작물 거두기 퀘스트', r==[True,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
