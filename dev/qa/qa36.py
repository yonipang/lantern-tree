import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
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
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];G.p.hp=50;G.p.hunger=50;__eat('shroomPorridge');const h0=G.p.hp;return new Promise(res=>setTimeout(()=>res([h0,G.p.hp]),4600))}""")
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
asyncio.run(main())
