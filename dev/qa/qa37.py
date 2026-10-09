import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 깊은 동굴 준비 (v37): 불꽃 열매·서리 무 재배, 장비 칸·옷·장신구, 대비 요리, 깊은 동굴 재료 요리, 더위·추위 게이지와 화면 가장자리
H2=HOOK.replace("computeLight}","computeLight,SPR,DISHES,DISH,RECIPES,knows,learnRecipe,eat,activeBuffs,moveMul,atkSpd,hungerMul,hurtPlayer,envTick,envLv,wearItem,unwear,grantAccs,syncNotes,roomNotes,bossNoteIds,GUIDE,ENEMY,CROP_SOIL,STAR_OF,cropStage,hitBoss,freshBoss,checkBiome0,get envFxV(){return envFxV},updateHazards,maxHp,SL,SI}")
SET="""window.__spot=k=>{const T=__T,G=T.G;const zs=[];for(let i=0;i<G.biome.length;i++)if(G.biome[i]===k&&!G.wall[i]&&G.floor[i]!==T.WATER&&G.floor[i]!==17){const x=i%200,y=(i/200)|0;let ok=true;for(let dy=-4;dy<=4&&ok;dy++)for(let dx=-4;dx<=4;dx++){const j=T.idx(x+dx,y+dy);if(G.floor[j]===T.WATER){ok=false;break}const o=G.objs.get(j);if(o&&T.OBJ[o.t].light&&!T.OBJ[o.t].nat){ok=false;break}}
  if(ok&&Math.hypot(x-T.SL.x,y-T.SL.y)>13&&Math.hypot(x-T.SI.x,y-T.SI.y)>13)zs.push([x,y])}return zs[(zs.length/2)|0]};
window.__eat=(id)=>{const T=__T,G=T.G;G.inv[0]={id,c:1};G.sel=0;G.p.hunger=10;T.eat(0)};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+SET+"__T.G.enemies.length=0}")
        # crops
        r=await ev(pg,"""()=>{const T=__T,S=T.SPR.crop;return [['fire','radish'].map(k=>[S[k].length,new Set(S[k].map(v=>v[0].toDataURL())).size]),T.OBJ.cropFire.grow,T.OBJ.cropRadish.grow,T.CROP_SOIL.cropFire,T.CROP_SOIL.cropRadish,T.STAR_OF.fireBerry,T.STAR_OF.radish,
          T.OBJ.fireBloom.drops.find(d=>d[0]==='fireSeed')[3],T.ENEMY.snowling.drops.find(d=>d[0]==='radishSeed')[3]]}""")
        rec('작물','불꽃 열매·서리 무 200초, 4단계 그림, 맞는 흙(흙·이끼), 별 작물', r[0]==[[4,4],[4,4]] and r[1:7]==[200,200,2,1,'fireBerryS','radishS'], str(r))
        rec('작물','불꽃풀에서 불꽃 열매 씨앗 25%, 눈뭉치에서 서리 무 씨앗 20%', r[7]==0.25 and r[8]==0.2, str(r))
        # wear
        r=await ev(pg,"""()=>{const T=__T;const c=T.RECIPES.find(r=>r.out==='obsCoat'),f=T.RECIPES.find(r=>r.out==='frostRobe');return [c.at,JSON.stringify(c.req),f.at,JSON.stringify(f.req)]}""")
        rec('옷','구리 제작대: 흑요석 외투(흑요석4·섬유10·금괴1), 서리 비단옷(서리 결정6·섬유10·금괴1)', r==['forge','[["obsidian",4],["fiber",10],["goldBar",1]]','forge','[["frostShard",6],["fiber",10],["goldBar",1]]'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;const before=T.SPR.player.down[0].toDataURL();G.inv[2]={id:'obsCoat',c:1};G.inv[3]={id:'frostRobe',c:1};G.sel=2;const a=T.decide();T.wearItem(2);const s1=[G.equip.body&&G.equip.body.id,G.inv[2]];const after=T.SPR.player.down[0].toDataURL();
          T.wearItem(3);const s2=[G.equip.body.id,G.inv[3]&&G.inv[3].id];T.unwear('body');const s3=[G.equip.body,G.inv.filter(Boolean).map(s=>s.id).sort().join(',')];return [a.k,a.lbl,s1,before!==after,s2,s3,T.SPR.player.down[0].toDataURL()===before]}""")
        rec('장비 칸','옷을 들고 누르면 입기 → 옷 칸으로, 캐릭터 겉모습이 바뀜', r[0]=='wear' and r[1]=='입기' and r[2]==['obsCoat',None] and r[3] is True, str(r))
        rec('장비 칸','다른 옷을 입으면 벗은 옷은 그 칸으로, 벗으면 가방으로 (겉모습도 원래대로)', r[4]==['frostRobe','obsCoat'] and r[5][0] is None and r[5][1]=='frostRobe,obsCoat' and r[6] is True, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;T.openPanel('inv');const h=document.querySelector('#sheet').innerText;const n=document.querySelectorAll('#sheet [data-a=eqSlot]').length;T.closePanel();return [h.includes('장비'),n]}""")
        rec('장비 칸','가방 창 위쪽에 옷 칸·장신구 칸', r==[True,2], str(r))
        # charms
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.beaten={};G.stats.accGot={};const k='turtle';const b=G.bosses[k];Object.assign(b,T.freshBoss(k));b.st='fight';G.drops.length=0;T.hitBoss(b,99999,false);const first=G.drops.some(d=>d.id==='turtleCharm');
          let again=0;const mr=Math.random;for(let n=0;n<20;n++){Object.assign(b,T.freshBoss(k));b.st='fight';G.bossDead[k]=false;G.drops.length=0;T.hitBoss(b,99999,false);if(G.drops.some(d=>d.id==='turtleCharm'))again++}G.drops.length=0;return [first,again]}""")
        rec('장신구','용암 거북 처치 → 거북 등껍질 부적 (재도전에서도 가끔)', r[0] is True and 1<=r[1]<=17, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.accGot={};G.stats.beaten={spirit:1};for(let k=0;k<G.inv.length;k++)G.inv[k]=null;T.grantAccs();return G.inv.some(s=>s&&s.id==='snowBrooch')}""")
        rec('장신구','이미 서리 정령을 물리친 세이브는 눈꽃 브로치를 받음', r is True, r)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip.acc=null;const p=G.p;const hit=k=>{p.hp=100;p.inv=0;p.dead=0;T.hurtPlayer(40,p.x+1,p.y,k);const d=100-p.hp;p.hp=100;p.inv=0;return d};const a=[hit('fire'),hit(null)];G.equip.acc={id:'turtleCharm',c:1};const b2=[hit('fire'),hit(null)];
          G.equip.acc={id:'snowBrooch',c:1};G.hz=[{k:'frost',x:p.x,y:p.y,r:3,t:1,warn:0,life:2,dmg:5,slow:2}];p.inv=0;T.updateHazards(0.01);const sl=p.slowT;G.equip.acc=null;G.hz=[{k:'frost',x:p.x,y:p.y,r:3,t:1,warn:0,life:2,dmg:5,slow:2}];p.inv=0;T.updateHazards(0.01);const sl2=p.slowT;p.slowT=0;p.hp=100;return [a,b2,sl,sl2]}""")
        rec('장신구','거북 등껍질 부적: 불덩이·용암 피해 30% 감소', r[0]==[40,40] and r[1]==[28,40], str(r))
        rec('장신구','눈꽃 브로치: 얼어서 느려지는 시간 절반', r[2]==1 and r[3]==2, str(r))
        # environment gauge
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];G.equip=G.equip||{};G.equip.body=null;const s=__spot(4);G.p.x=s[0]+.5;G.p.y=s[1]+.5;G.env={k:null,v:0,lv:0,t:0};for(let k=0;k<10;k++)T.envTick(1);const v10=G.env.v;const tx=document.body.innerText.includes('으슬으슬');
          G.env.v=50;const m=T.moveMul();G.env.v=0;const m0=T.moveMul();G.env.v=80;const a2=T.atkSpd(),m2=T.moveMul();G.env.v=0;const a0=T.atkSpd();return [G.env.k,v10,tx,+(m/m0).toFixed(2),+(m2/m0).toFixed(2),+(a2/a0).toFixed(2)]}""")
        rec('게이지','얼음 동굴 안: 1초에 +1, 들어가면 "으슬으슬해요"', r[0]=='cold' and r[1]==10 and r[2] is True, str(r))
        rec('게이지','추위 40↑ 이동 -10%, 70↑ 이동 -20%·공격 속도 -10%', r[3]==0.9 and r[4]==0.8 and r[5]==1.1, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const out={};const run=(n)=>{for(let k=0;k<n;k++)T.envTick(1)};
          G.env.v=0;G.equip.body={id:'obsCoat',c:1};run(10);out.coat=G.env.v;G.equip.body=null;
          G.env.v=0;G.buffs=[];__eat('hotTea');run(10);out.t1=G.env.v;G.buffs=[];G.env.v=0;__eat('hotSoup');run(10);out.t2=G.env.v;G.buffs=[];G.env.v=0;__eat('fireStew');run(10);out.t3=G.env.v;
          G.buffs=[];G.env.v=0;G.equip.body={id:'obsCoat',c:1};__eat('hotSoup');run(10);out.both=G.env.v;G.buffs=[];G.equip.body=null;
          G.env.v=50;const x=Math.floor(G.p.x),y=Math.floor(G.p.y);const i=T.idx(x+2,y);const had=G.objs.get(i);G.wall[i]=0;G.objs.set(i,{t:'torch'});run(2);out.torch=G.env.v;if(had)G.objs.set(i,had);else G.objs.delete(i);
          G.env.v=50;const px=G.p.x,py=G.p.y;G.p.x=__T.CX+.5;G.p.y=__T.CY+3;run(3);out.out=G.env.v;G.p.x=px;G.p.y=py;return out}""")
        rec('대비','옷 반 속도, 요리 1·2·3단계 75%·50%·안 오름, 옷+요리는 곱해짐', r['coat']==5 and r['t1']==7.5 and r['t2']==5 and r['t3']==0 and r['both']==2.5, str(r))
        rec('게이지','횃불 곁·동굴 밖에서는 1초에 -4', r['torch']==42 and r['out']==38, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];G.equip.body=null;G.p.x=__T.SI.x+.5+2;G.p.y=__T.SI.y+.5;G.env={k:'cold',v:0,lv:0,t:0};for(let k=0;k<10;k++)T.envTick(1);return G.env.v}""")
        rec('게이지','보스방 안에서는 오르는 속도 절반', r==5, r)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=__spot(3);G.p.x=s[0]+.5;G.p.y=s[1]+.5;G.env={k:null,v:0,lv:0,t:0};T.envTick(1);const k=G.env.k;const h0=(G.env.v=0,T.hungerMul());G.env.v=50;const h1=T.hungerMul();G.env.v=80;const h2=T.hungerMul();
          G.env.v=100;G.p.hp=80;G.p.dead=0;for(let n=0;n<10;n++)T.envTick(1);const hp=G.p.hp;const fx=T.envFxV;G.env.v=0;G.p.hp=100;return [k,+(h1/h0).toFixed(2),+(h2/h0).toFixed(2),hp,+fx.toFixed(2)]}""")
        rec('게이지','용암 동굴은 더위: 40↑ 배고픔 1.3배, 70↑ 1.6배', r[0]=='hot' and r[1]==1.3 and r[2]==1.6, str(r))
        rec('게이지','100이면 5초마다 체력 -2', r[3]<=78 and r[3]>=74, str(r))
        rec('화면','100에서는 가장자리가 30~45% 사이로 숨 쉬듯', 0.25<=r[4]<=0.46, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=__spot(4);G.p.x=s[0]+.5;G.p.y=s[1]+.5;G.env={k:'cold',v:0,lv:0,t:0};for(let n=0;n<300;n++){G.env.v=0;T.envTick(1/20)}const z=T.envFxV;G.env.v=55;for(let n=0;n<20;n++)T.envTick(1/20);const a=T.envFxV;for(let n=0;n<200;n++){G.env.v=55;T.envTick(1/20)}const b2=T.envFxV;return new Promise(res=>setTimeout(()=>res([+a.toFixed(3),+b2.toFixed(3),document.querySelector('#envFx').className,!document.querySelector('#envBar').hidden,document.querySelector('#envBar').className]),300))}""")
        rec('화면','가장자리가 서서히 차오름 (40↑ 옅게 15%), 추위는 파란 서리', 0.04<r[0]<0.12 and 0.13<=r[1]<=0.16 and r[2]=='cold', str(r))
        rec('게이지','배고픔 아래 게이지 막대 (추위는 파랑)', r[3] is True and 'cold' in r[4], str(r))
        await pg.wait_for_timeout(200); await ev(pg,"()=>{const G=__T.G;G.env.v=80}"); await pg.wait_for_timeout(2500); await pg.screenshot(path=SP+'qa37_cold.png')
        # entrance suggestion
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip.body=null;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;G.inv[12]={id:'obsCoat',c:1};G.biomeNow=0;const s=__spot(4);G.p.x=s[0]+.5;G.p.y=s[1]+.5;T.checkBiome0();const el=document.querySelector('#wearAsk');const t=[!el.hidden,el.textContent];el.click();return [t,G.equip.body&&G.equip.body.id]}""")
        rec('편의','동굴 입구에서 맞는 옷이 가방에 있으면 "○○로 갈아입을까요?" 버튼', r[0][0] is True and '흑요석 외투로 갈아입을까요' in r[0][1] and r[1]=='obsCoat', str(r))
        # dishes and notes
        r=await ev(pg,"""()=>{const T=__T;const ids=['hotTea','hotSoup','fireStew','coolTea','coolPunch','radishSoup','fireSkewer','radishSalad','fireBeans','fireJelly','frostTea','firePie'];const ok=ids.every(id=>T.DISH[id]&&T.RECIPES.some(r=>r.out===id&&r.at==='pot'));
          const g=T.GUIDE.find(q=>q.id==='cpick');return [ok,T.DISHES.length,g.rw.filter(([id])=>id.startsWith('rn_')).map(x=>x[0]).join(','),T.bossNoteIds('turtle').join(','),T.bossNoteIds('spirit').join(',')]}""")
        rec('요리','대비 요리 6가지 + 깊은 동굴 재료 3단계 요리 6가지', r[0] is True and r[1]==37, str(r))
        rec('쪽지','대비 요리 1·2단계는 「수정 곡괭이」 퀘스트 보상, 3단계는 깊은 동굴 보스', r[2]=='rn_hotTea,rn_hotSoup,rn_coolTea,rn_coolPunch' and r[3].startswith('fireStew') and r[4].startswith('radishSoup'), str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const out={};for(const rm of G.rooms.filter(q=>q.b>=3))out[rm.id]=T.roomNotes(rm).join(',');return [out,T.bossNoteIds('turtle').join(','),T.bossNoteIds('spirit').join(','),[3,4].map(b=>G.rooms.filter(q=>q.b===b).length)]}""")
        rec('쪽지','용암·얼음 숨은 방에 불꽃 열매 젤리·불꽃 꽃잎 파이 쪽지 (방이 없으면 그 지역 보스가 줌)', ('fireJelly' in (r[0].get('r30','') if r[3][0] else r[1])) and ('firePie' in (r[0].get('r40','') if r[3][1] else r[2])), str(r))
        r=await ev(pg,"""()=>{const T=__T;const sv=JSON.parse(JSON.stringify(T.serialize()));sv.recipes={skewer:1};sv.rooms.forEach(r=>{r.open=r.b===3?1:0});for(const k in sv.bossDead)sv.bossDead[k]=false;sv.stats.beaten={};sv.qclaim={cpick:1};delete sv.equip;delete sv.env;
          T.deserialize(sv);const G=T.G;return [T.knows('skewer'),T.knows('fireJelly')||!G.rooms.some(r=>r.b===3),T.knows('hotTea')&&T.knows('coolPunch'),JSON.stringify(G.equip),G.env.k]}""")
        rec('옛 세이브','v36 세이브: 이미 연 용암 방·받은 퀘스트의 새 쪽지를 바로 해금, 장비 칸은 비어서 시작', r==[True,True,True,'{"body":null,"acc":null}',None], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip.body={id:'frostRobe',c:1};G.equip.acc={id:'turtleCharm',c:1};G.env={k:'hot',v:63,lv:1,t:0};const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const G2=T.G;return [G2.equip.body.id,G2.equip.acc.id,G2.env.k,G2.env.v]}""")
        rec('세이브','장비와 게이지가 저장·불러오기 뒤에도 그대로', r==['frostRobe','turtleCharm','hot',63], str(r))
        # screenshots: hot at 100, and the bag with the equipment row
        await ev(pg,"""()=>{const T=__T,G=T.G;const s=__spot(3);G.p.x=s[0]+.5;G.p.y=s[1]+.5;G.env={k:'hot',v:100,lv:3,t:0};G.enemies.length=0;G.p.hp=100}""")
        await pg.wait_for_timeout(2600); await pg.screenshot(path=SP+'qa37_hot.png')
        await ev(pg,"()=>{const T=__T,G=T.G;G.env={k:null,v:0,lv:0,t:0};T.openPanel('inv')}"); await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa37_bag.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
