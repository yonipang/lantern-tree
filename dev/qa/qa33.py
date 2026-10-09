import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
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
        rec('구리 낫','구리 제작대에서 구리괴 3 + 나무 2 + 이끼 끈 1', r[0]=='forge' and r[1]=='[["copperBar",3],["wood",2],["rope",1]]', str(r))
        rec('물뿌리개','구리 제작대에서 구리괴 2 + 송진 1', r[2]=='forge' and r[3]=='[["copperBar",2],["resin",1]]', str(r))
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
        rec('비료','처치 뒤 작업대에서 흙 3 + 말랑 젤 1 → 비료 2개, 버섯흙 한 삽 + 포자 1 → 버섯 비료 2개', r[1] and r[2] and r[3]==2 and r[4]=='[["dirt",3],["gel",1]]' and r[5]=='bench' and r[6]=='[["gShroom",1],["spore",1]]', str(r))
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
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x),y=Math.floor(G.p.y);const i=T.idx(x+1,y);G.wall[i]=0;G.objs.set(i,{t:'forge'});T.openPanel('craft',{st:'forge'});const h=document.querySelector('#sheet').innerText;T.closePanel();G.objs.delete(i);return [h.includes('농사'),h.includes('구리 낫'),h.includes('물뿌리개')]}""")
        rec('제작','구리 제작대에 농사 탭 (구리 낫·물뿌리개)', r==[True,True,True], str(r))
        # screenshot: a little field
        await ev(pg,"""()=>{const T=__T,G=T.G;G.p.x=Math.floor(G.p.x)+.5;G.p.y=Math.floor(G.p.y)+.5;const x=Math.floor(G.p.x),y=Math.floor(G.p.y);__clr(x-6,y-6,13,13);
          [0,40,80,200].forEach((age,k)=>{__crop(x-4+k,y+2,'cropBerry',age);__crop(x-4+k,y+3,'cropShroom',age*1.2);__crop(x-4+k,y+4,'cropMoss',age*.8)});
          const a=__crop(x+1,y+2,'cropBerry',40);a.w=1;const b2=__crop(x+2,y+2,'cropBerry',40);b2.f=1;const c=__crop(x+3,y+2,'cropBerry',40);c.w=1;c.f=1;
          G.objs.set(T.idx(x-4,y-3),{t:'sapling',at:G.time+170});G.objs.set(T.idx(x-2,y-3),{t:'sapling',at:G.time+100});G.objs.set(T.idx(x,y-3),{t:'root',yg:G.time+50});G.objs.set(T.idx(x+2,y-3),{t:'root'});G.objs.set(T.idx(x+4,y-3),{t:'stump',g:'root',at:G.time+230});G.enemies.length=0}""")
        await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa33_field.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
