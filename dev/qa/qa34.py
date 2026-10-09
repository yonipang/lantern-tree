import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
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
        rec('수정 비료','수정골렘 처치 뒤 구리 제작대: 수정 모래 한 삽 + 수정 조각 1 → 2개', r[0] is False and r[1] is True and r[2]=='forge' and r[3]=='[["gCrystal",1],["crystal",1]]' and r[4]==2, str(r))
        rec('수정 비료','뿌리면 수정 비료 표시 (별 확률 35%)', r[5]==3, str(r))
        # ---- soil hint ----
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv[0]=null;G.p.face={x:0,y:1};const tt=T.targetTile();__crop(tt.x,tt.y,'cropBerry',10,2);const a=T.decide().msg;__crop(tt.x,tt.y,'cropBerry',10,1);const b2=T.decide().msg;G.bossDead.golem=false;(G.stats.beaten||{}).golem=0;const c=T.decide().msg;G.bossDead.golem=true;G.objs.delete(T.idx(tt.x,tt.y));return [a,b2,c]}""")
        rec('흙','바라보면 맞는 흙인지 안내 (수정골렘 뒤)', '이끼에 심으면 별 작물' in r[0] and '맞는 흙' in r[1] and '흙' not in r[2].split('·')[-1], str(r))
        # ---- quest ----
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const q=T.QSIDE.find(x=>x.id==='s_crop4');G.stats.starH=4;const a=T.questState(q).done;G.stats.starH=5;return [a,T.questState(q).done,JSON.stringify(q.rw),q.xp]}""")
        rec('도전','별 작물 5개 거두기 (수정 조각 8, 경험치 60)', r==[False,True,'[["crystal",8]]',60], str(r))
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
asyncio.run(main())
