import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 재료·강화 (v43): 화강암·석영·수정결정, 정제 석영, 지역 재료, 용광로(강화·분해), 장비 강화, 반지, 지역 난이도
H2=HOOK.replace("computeLight}","computeLight,RECIPES,SPR,WALLS,STN,breakWall,hitObj,freshBoss,hitBoss,upgCost,upgText,ringV,meleeMul,mineMul,hurtPlayer,gainXp,regionEnemy,mkEnemy,curWeapon,bestPick,salvGet2,envTick,circuitTick,quartzAt,maxMp,rarOf}")
CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+4;y<T.CY+16;y++)for(let x=T.CX+4;x<T.CX+16;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i)}
  G.enemies.length=0;G.drops.length=0;G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.hp=100;G.p.inv=0;G.fish=null;G.inv.fill(null);G.sel=0;G.buffs=[];return [T.CX+8,T.CY+8]};
  window.__drops=()=>{const m={};for(const d of __T.G.drops)m[d.id]=(m[d.id]||0)+d.c;__T.G.drops.length=0;return m};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+CLEAR+"}")
        # ---- crystal cave materials ----
        r=await ev(pg,"""()=>{const T=__T,I=T.ITEMS,W=T.WALLS,q=T.RECIPES.find(r=>r.out==='quartzR');return [I.crystal.n,W[3].n,W[3].drop[0][0],W[13].n,W[13].drop.map(d=>d[0]).join(','),I.granite.kind,I.granite.wall,q&&q.at,q&&JSON.stringify(q.req),I.cryGem.n,I.quartzR.n]}""")
        rec('재료','수정 조각 → 석영, 수정벽 → 화강암 벽, 새 석영 광맥, 정제 석영(화로: 석영 2), 수정결정', r==['석영','화강암 벽','granite','석영 광맥','crystal,granite','wall',3,'furnace','[["crystal",2]]','수정결정','정제 석영'], str(r))
        r=await ev(pg,"()=>{const G=__T.G;let g=0,q=0,qOut=0;for(let i=0;i<G.wall.length;i++){if(G.wall[i]===3)g++;if(G.wall[i]===13){q++;if(G.biome[i]!==2)qOut++}}return [g,q,qOut,G.stats.qv]}")
        rec('재료','새 세계: 수정 동굴 화강암 사이에 석영 광맥', r[0]>200 and r[1]>20 and r[2]==0 and r[3]==1, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();const out=[];for(const w of [3,13,9,11]){G.wall[T.idx(x+2,y)]=w;T.breakWall(x+2,y);out.push(Object.keys(__drops()).sort().join('+'))}return out}""")
        rec('재료','화강암 벽 → 화강암, 석영 광맥 → 석영(+화강암 가끔), 현무암벽 → 현무암, 얼음벽 → 얼음 덩이', r[0]=='granite' and 'crystal' in r[1] and r[2].startswith('basalt') and 'iceBlock' in r[3], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;for(let k=0;k<400;k++)T.OBJ.cluster.dropFn(0,0);const m=__drops();return [m.cryGem||0,m.crystal||0]}""")
        rec('재료','수정 결정 → 수정결정 1개(약 35%) 아니면 석영 1개', r[0]+r[1]==400 and 100<r[0]<180, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.inv[9]={id:'pickIron',c:1};G.objs.set(T.idx(x+1,y),{t:'cluster'});const o=G.objs.get(T.idx(x+1,y));for(let k=0;k<6&&G.objs.get(T.idx(x+1,y));k++)T.hitObj({x:x+1,y},o);const m=__drops();return [(m.cryGem||0)+(m.crystal||0),!G.objs.get(T.idx(x+1,y))]}""")
        rec('재료','수정 결정을 캐면 결정/석영 딱 1개', r==[1,True], str(r))
        r=await ev(pg,"""()=>{const T=__T,f=id=>{const r=T.RECIPES.find(q=>q.out===id);return r.at+':'+r.req.map(x=>x[0]).join(',')};return ['swordCrystal','staffCrystal','bowCrystal','pickCrystal','swordDawn','arrowCrystal','lampCrystal'].map(f)}""")
        rec('재료','수정 무기·상위 도구는 정제 석영+수정결정 (석영만으로는 못 만듦)', r[0]=='forge:quartzR,cryGem,ironBar' and all('quartzR' in x for x in r[:6]) and 'cryGem' in r[6] and not any(',crystal' in x or ':crystal' in x for x in r[:6]), str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=G.bosses.golem;Object.assign(b,T.freshBoss('golem'));b.st='fight';G.bossDead.golem=false;G.drops.length=0;T.hitBoss(b,999999,false);const m=__drops();return [m.crystal||0,m.cryGem||0]}""")
        rec('재료','수정골렘 보상: 석영 8 + 수정결정 3', r==[8,3], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.inv[0]={id:'granite',c:5};G.sel=0;G.p.face={x:1,y:0};const d=T.decide();return [d.k,d.lbl,T.ITEMS.granite.n]}""")
        await tap(pg,1); await pg.wait_for_timeout(200)
        r2=await ev(pg,"()=>{const T=__T,G=T.G;return [G.wall[T.idx(T.CX+9,T.CY+8)],T.countItem('granite')]}")
        rec('재료','화강암을 들고 쌓으면 화강암 벽', r[:2]==['place','쌓기'] and r2==[3,4], str([r,r2]))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.wire.set(T.idx(x+2,y+1),1);G.objs.set(T.idx(x+2,y+2),{t:'battery',e:600});const o={t:'drillStone',dir:{x:1,y:0}};G.objs.set(T.idx(x+2,y),o);G.wall[T.idx(x+3,y)]=3;T.circuitTick(8.5);const a=(o.store||[]).map(s=>s.id).join(',');
          G.wall[T.idx(x+3,y)]=13;T.circuitTick(.2);const why=o.why;G.objs.delete(T.idx(x+2,y));const o2={t:'drillFe',dir:{x:1,y:0}};G.objs.set(T.idx(x+2,y),o2);T.circuitTick(7.2);return [a,why,(o2.store||[]).map(s=>s.id).join(',')]}""")
        rec('재료','돌 채굴기는 화강암 벽(지형)도, 석영 광맥은 철 채굴기로', r==['granite','tier','crystal'], str(r))
        # old save: crystal cave gets quartz veins once
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();let n0=0;for(let i=0;i<G.wall.length;i++)if(G.wall[i]===13){G.wall[i]=3;n0++}delete G.stats.qv;const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G;let n1=0;for(let i=0;i<G2.wall.length;i++)if(G2.wall[i]===13)n1++;
          const s2=JSON.parse(JSON.stringify(T.serialize()));let built=0;const k=G2.wall.indexOf(13);G2.wall[k]=3;const s3=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s3);return [n0,n1,T.G.stats.qv,T.G.wall[k]]}""")
        rec('옛 세이브','v42 세이브: 수정 동굴 화강암 일부가 석영 광맥으로 (한 번만)', r[0]>20 and r[1]==r[0] and r[2]==1 and r[3]==3, str(r))
        r=await ev(pg,"()=>{const G=__T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(__T.serialize()));s.inv[3]={id:'crystal',c:42};__T.deserialize(s);return [__T.countItem('crystal'),__T.ITEMS.crystal.n]}")
        rec('옛 세이브','가방의 수정 조각은 그대로 석영이 됨', r==[42,'석영'], str(r))
        # ---- smelter: upgrades ----
        r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(r=>r.out==='smelter');return [rc.at,rc.cat,T.STN.smelter,!!T.SPR.obj.smelter]}")
        rec('용광로','구리 제작대에서 만드는 「용광로」', r==['forge','furn','용광로',True], str(r))
        await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.objs.set(T.idx(x,y+1),{t:'smelter'});G.equip.weapon={id:'swordCopper',c:1,dur:200};G.inv[9]={id:'copperBar',c:20};G.inv[10]={id:'glowcap',c:6};T.openPanel('craft',{st:'smelter'})}"""); await pg.wait_for_timeout(500)
        r=await ev(pg,"()=>[...document.querySelectorAll('#sheet [data-a=tab]')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(',')")
        rec('용광로','용광로 탭: 전체·반지·강화(기본)·분해 (수리 없음)', '강화*' in r and '반지' in r and '분해' in r and '수리' not in r, r)
        d0=await ev(pg,"()=>__T.curWeapon().dmg")
        await pg.click('#sheet [data-a=upg][data-i="e:weapon"]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const T=__T,G=T.G;return [G.equip.weapon.lv,T.countItem('copperBar'),+(T.curWeapon().dmg).toFixed(2),G.equip.weapon.dur,document.querySelector('#toasts').innerText.includes('+1')]}")
        rec('강화','무기 칸의 구리 검 +1: 구리괴 2개, 공격력 +8%, 내구도 그대로', r[0]==1 and r[1]==18 and abs(r[2]-11*1.08)<1e-6 and r[3]==200 and r[4] and d0==11, str([d0]+r))
        for _ in range(4):
            await ev(pg,"()=>{document.querySelector('#sheet [data-a=upg][data-i=\"e:weapon\"]').click()}"); await pg.wait_for_timeout(250)
        r=await ev(pg,"()=>{const T=__T,G=T.G;const b=document.querySelector('#sheet [data-a=upg][data-i=\"e:weapon\"]');return [G.equip.weapon.lv,T.countItem('copperBar'),T.countItem('glowcap'),b.disabled,b.textContent,Math.round(T.curWeapon().dmg*100)/100]}")
        rec('강화','+5가 최고 (구리괴 2·4·6·8·10, 빛버섯 2·4·6 → 재료가 모자라면 멈춤)', r[0]==4 and r[1]==0 and r[2]==0 and r[3], str(r))
        r=await ev(pg,"()=>{const T=__T;return [JSON.stringify(T.upgCost('swordCopper',2)),JSON.stringify(T.upgCost('swordCrystal',3)),JSON.stringify(T.upgCost('obsCoat',0)),JSON.stringify(T.upgCost('ringFe',4))]}")
        rec('강화','재료는 장비 등급별 (일반 구리괴 · 고급 철괴 · 희귀 정제 석영 · 영웅 이상 금괴), +3부터 빛버섯/수정결정', r==['[["copperBar",6],["glowcap",2]]','[["quartzR",8],["cryGem",2]]','[["goldBar",2]]','[["ironBar",10],["glowcap",6]]'], str(r))
        await ev(pg,"()=>{const G=__T.G;G.equip.weapon.lv=5;G.inv[9]={id:'copperBar',c:50};__T.renderPanel&&0}")
        await pg.click('#sheet [data-a=tab][data-i=salv]'); await pg.wait_for_timeout(200); await pg.click('#sheet [data-a=tab][data-i=upg]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const b=document.querySelector('#sheet [data-a=upg][data-i=\"e:weapon\"]');return [b.disabled,b.textContent,document.querySelector('#sheet .sh-body').innerText.includes('최고 단계')]}")
        rec('강화','+5에서는 최고 단계 표시', r==[True,'최고',True], str(r))
        await pg.screenshot(path=SP+'qa43_upg.png')
        await ev(pg,"()=>__T.closePanel()")
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[9]={id:'pickIron',c:1,lv:2};const a=T.bestPick().power;G.inv[10]={id:'pickCrystal',c:1};return [+a.toFixed(2),T.bestPick().id]}""")
        rec('강화','곡괭이 +2는 캐는 힘 +20% (더 좋은 곡괭이가 있으면 그걸 씀)', r==[3.6,'pickCrystal'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G,p=G.p;const hit=k=>{p.hp=100;p.inv=0;p.dead=0;T.hurtPlayer(40,p.x+1,p.y,k);const d=100-p.hp;p.hp=100;p.inv=0;return d};G.equip.neck={id:'turtleCharm',c:1};const a=hit('fire');G.equip.neck.lv=5;const b2=hit('fire');G.equip.neck=null;return [a,b2,T.upgText('turtleCharm',5),T.upgText('obsCoat',2)]}""")
        rec('강화','장신구·옷도 강화 (부적 +5: 불 피해 -50%, 외투 +2: 추위 게이지 40% 속도)', r==[28,20,'불·용암 피해 -50%','추위 게이지 40% 속도'], str(r))
        # ---- rings ----
        r=await ev(pg,"()=>{const T=__T;return ['ringCu','ringFe','ringQ','ringGem','ringGold'].map(id=>{const r=T.RECIPES.find(q=>q.out===id);return [T.ITEMS[id].slot,r&&r.at,r&&r.cat]})}")
        rec('반지','반지 5종 (용광로 · 반지 탭)', all(x==['ring','smelter','ring'] for x in r), str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G,p=G.p;const base=T.meleeMul(),mb=T.mineMul();G.equip.ring={id:'ringCu',c:1};const a=T.meleeMul()/base;G.equip.ring.lv=3;const a3=T.meleeMul()/base;
          G.equip.ring={id:'ringFe',c:1};p.hp=100;p.inv=0;T.hurtPlayer(100,p.x+1,p.y);const def=100-p.hp;p.hp=100;p.inv=0;
          G.equip.ring={id:'ringGold',c:1};const mi=T.mineMul()/mb;G.equip.ring={id:'ringGem',c:1};const R=G.rpg,lv=R.lv,xp=R.xp;R.lv=1;R.xp=0;T.gainXp(10);const gx=R.xp+(R.lv-1)*1000;R.lv=lv;R.xp=xp;
          G.equip.ring={id:'ringQ',c:1,lv:2};const q=T.ringV('mp');G.equip.ring=null;return [+a.toFixed(3),+a3.toFixed(3),def,+mi.toFixed(2),gx,+q.toFixed(2)]}""")
        rec('반지','구리 반지 공격력 +4%(+3: +7%), 철 반지 받는 피해 -4%, 금 반지 채굴 +10%, 수정결정 반지 경험치 +8%, 석영 반지 +2 기력 회복 +30%', r==[1.04,1.07,96,1.1,11,0.3], str(r))
        await ev(pg,"()=>{const G=__T.G;G.inv.fill(null);G.inv[9]={id:'ringQ',c:1,lv:2};G.equip.ring=null;__T.openPanel('equip')}"); await pg.wait_for_timeout(650)
        await pg.click('#sheet [data-a=eqPick][data-i="9"]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText,G=__T.G;return [G.equip.ring&&G.equip.ring.lv,t.includes('석영 반지 +2'),t.includes('기력 회복 +30%'),!!document.querySelector('#sheet [data-a=eqSlot][data-i=ring] .lvb')]}")
        rec('반지','반지를 반지 칸에 끼면 장비 메뉴에 강화 단계와 효과 (+2 표시)', r==[2,True,True,True], str(r))
        await pg.screenshot(path=SP+'qa43_equip.png')
        await ev(pg,"()=>__T.closePanel()")
        # ---- salvage at the smelter ----
        await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();G.objs.set(T.idx(x,y+1),{t:'smelter'});G.inv[12]={id:'swordCopper',c:1,dur:250,lv:2};T.openPanel('craft',{st:'smelter'})}"""); await pg.wait_for_timeout(650)
        await pg.click('#sheet [data-a=tab][data-i=salv]'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>JSON.stringify(__T.salvGet2(__T.G.inv[12]))")
        await pg.click('#sheet [data-a=salv][data-i="12"]'); await pg.wait_for_timeout(200); await pg.click('#sheet [data-a=salv][data-i="12"]'); await pg.wait_for_timeout(300)
        r2=await ev(pg,"()=>{const T=__T;return [T.G.inv[12],T.countItem('copperBar'),T.countItem('gel')]}")
        rec('분해','용광로 분해: 제작 재료 70% + 강화 재료 절반 (구리 검 +2 → 구리괴 4+3)', r=='[["copperBar",7],["wood",1],["gel",1]]' and r2==[None,7,1], str([r,r2]))
        await ev(pg,"()=>__T.closePanel()")
        # ---- save keeps levels ----
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip.weapon={id:'swordIron',c:1,dur:300,lv:3};G.inv[5]={id:'pickIron',c:1,lv:1};const ci=T.idx(T.CX+10,T.CY+10);G.objs.set(ci,{t:'chest',items:Array(18).fill(null)});G.objs.get(ci).items[0]={id:'ringFe',c:1,lv:4};
          T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const G2=T.G;return [G2.equip.weapon.lv,G2.equip.weapon.dur,G2.inv[5].lv,G2.objs.get(ci).items[0].lv]}""")
        rec('저장','강화 단계 저장/불러오기 (무기 칸·가방·상자)', r==[3,300,1,4], str(r))
        r=await ev(pg,"()=>{__T.openPanel('inv');const el=document.querySelector('#sheet .slot[data-i=\"5\"] .lvb');const t=el&&el.textContent;__T.closePanel();return t}")
        rec('표시','강화한 장비 칸에 +단계 표시', r=='+1', r)
        # ---- region difficulty ----
        r=await ev(pg,"""()=>{const T=__T;const h=k=>T.mkEnemy(k,0,0).hp;const a=T.regionEnemy(T.mkEnemy('slimeP',0,0),2),b2=T.regionEnemy(T.mkEnemy('slimeG',0,0),0),c=T.regionEnemy(T.mkEnemy('magmaSlime',0,0),3);return [a.hp===Math.round(h('slimeP')*1.2),a.mh===a.hp,a.dm,b2.hp===h('slimeG'),b2.mh||0,b2.dm||1,c.hp===Math.round(h('magmaSlime')*1.15)]}""")
        rec('난이도','수정 동굴 몬스터 체력 ×1.2·피해 ×1.1, 깊은 동굴 체력 ×1.15·피해 ×1.1, 이끼·버섯숲은 그대로', r==[True,True,1.1,True,0,1,True], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();const e=T.regionEnemy(T.mkEnemy('slimeP',G.p.x+.2,G.p.y),2);e.t=0;e.cd=0;G.enemies.push(e);return 1}""")
        await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>{const G=__T.G;const d=100-G.p.hp;G.enemies.length=0;G.p.hp=100;return d}")
        rec('난이도','수정 동굴 보라 말랑이 피해 ×1.1 (18 → 20)', r in (20,40), r)
        # ---- map legend ----
        r=await ev(pg,"()=>{__T.openPanel('map');const t=document.querySelector('#sheet').innerText;__T.closePanel();return [t.includes('지역 재료'),t.includes('이끼 동굴'),t.includes('지형 · 흙'),t.includes('???')]}")
        rec('지도','지도에 지역별 지형·광물·고유 재료 (안 가 본 곳은 ???)', r==[True,True,True,True], str(r))
        await ev(pg,"()=>{const T=__T,G=T.G;let best=-1;for(let i=0;i<G.wall.length;i++){if(G.wall[i]!==13||G.biome[i]!==2)continue;const x=i%640||0;best=i;break}const W=Math.round(Math.sqrt(G.wall.length));const x=best%W,y=Math.floor(best/W);for(let dy=-1;dy<=1;dy++)for(let dx=-3;dx<=-1;dx++){const j=T.idx(x+dx,y+dy+2);G.wall[j]=0;G.objs.delete(j)}G.p.x=x-1.5;G.p.y=y+2.5;G.enemies.length=0;for(let i=0;i<G.explored.length;i++)G.explored[i]=1}")
        await pg.wait_for_timeout(800); await pg.screenshot(path=SP+'qa43_cave.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
