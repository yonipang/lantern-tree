# 전투·보스: 밸런스, 스킬, 효과·레어도, 보스·지역, 보스 3단계, 재도전·난이도, 빛씨앗
# 실행: python3 dev/qa/run.py combat   (테스트 하나만: python3 dev/qa/run.py balance)
from harness import *


def test_balance():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,updateBosses,hitBoss,freshBoss,swingAttack,updatePShots,mkEnemy,refreshHotbar}")
    FIGHT="""(k,secs)=>{const T=__T,G=T.G;G.enemies.length=0;G.shots.length=0;G.hz=[];const b=G.bosses[k];Object.assign(b,T.freshBoss(k));const h=T.BOSSES[k].home();if(k==='golem'){for(let y=Math.floor(h.y)-14;y<=h.y+14;y++)for(let x=Math.floor(h.x)-14;x<=h.x+14;x++){const j=T.idx(x,y);G.wall[j]=0;G.objs.delete(j);G.floor[j]=4}}G.p.x=h.x;G.p.y=h.y+4;b.st='sleep';
  const seen=new Set();let dmg=0,maxShots=0,adds=0,chain=0,dbl=0;const hp0=999;
  for(let i=0;i<secs*60;i++){G.p.hp=hp0;G.p.dead=0;const before=G.p.hp;T.updateBosses(1/60);if(G.p.hp<before)dmg+=before-G.p.hp;G.p.inv=0;seen.add(b.ph);maxShots=Math.max(maxShots,G.shots.length);adds=Math.max(adds,G.enemies.length);if(b.chain)chain++;if(b.dbl)dbl++;if(i===secs*30)b.hp=Math.floor(b.max*.4)}
  return {ph:[...seen].sort().join(','),dmg,maxShots,adds,chain,dbl,fin:Number.isFinite(b.x)&&Number.isFinite(b.y),st:b.st}}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,f"()=>{{window.FIGHT={FIGHT}}}")
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.rpg.dex=18;const a=[T.ITEMS.bowCrystal.dmg,T.ITEMS.swordCrystal.dmg];return a}")
            rec('밸런스','v99 표대로: 별빛 활 22 · 수정 검 26', r==[22,26], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg.lv=40;G.rpg.dex=18;G.rpg.str=0;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'bowCrystal',c:1};G.sel=0;G.enemies.length=0;G.pshots.length=0;G.p.face={x:1,y:0};
          const e=T.mkEnemy('slimeP',G.p.x+2.5,G.p.y);e.hp=9999;G.enemies.push(e);const mr=Math.random;Math.random=()=>.5;try{T.swingAttack();for(let k=0;k<30;k++)T.updatePShots(1/60)}finally{Math.random=mr}return [9999-e.hp,Math.abs(e.kx||0)]}""")
            # 한 발 피해는 치명타(10%, 1.6배)가 아닐 때의 값을 봐요 — 계산하는 동안만 무작위 값을 고정해 치명타가 안 나오게 (예전에는 10번에 1번꼴로 실패)
            rec('밸런스','민첩 18 별빛 활(22) 한 발 28~40 · 밀어내기 약함', 28<=r[0]<=40 and r[1]<3, str(r))
            r=await ev(pg,"()=>{const T=__T;return [T.ITEMS.bowWood.dmg,T.ITEMS.bowIron.dmg,T.ITEMS.bowGold.dmg,T.ITEMS.bowGolem.dmg,T.ITEMS.bowFrost.dmg]}")
            rec('밸런스','v99 활 공격력 표대로 (나무5·사냥꾼14·황금31·수정거인28·서리정령51)', r==[5,14,31,28,51], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg.lv=40;G.rpg.dex=0;G.rpg.int=18;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'staffCrystal',c:1};G.sel=0;G.enemies.length=0;G.pshots.length=0;G.p.face={x:1,y:0};G.p.mp=999;
          const e=T.mkEnemy('slimeP',G.p.x+2.5,G.p.y);e.hp=9999;G.enemies.push(e);const mr=Math.random;Math.random=()=>.5;try{T.swingAttack();for(let k=0;k<30;k++)T.updatePShots(1/60)}finally{Math.random=mr}return [9999-e.hp,Math.abs(e.kx||0),T.ITEMS.staffGlow.dmg,T.ITEMS.staffFrost.dmg]}""")
            rec('밸런스','지혜 18 수정 지팡이(21) 한 발 27~41 · 밀어내기 약함 · v99 표대로(빛버섯9·눈꽃38)', 27<=r[0]<=41 and r[1]<3 and r[2:]==[9,38], str(r))
            r=await ev(pg,"()=>{const B=__T.BOSSES;return ['slime','queen','golem','turtle','spirit'].map(k=>B[k].hp)}")
            rec('보스','체력: 말랑대왕 그대로 720 · 여왕 700 · 골렘 1500 · 거북 2300 · 정령 2000', r==[720,700,1500,2300,2000], str(r))
            for k,need in [('queen',['cast','walk']),('golem',['aim','dash','walk']),('turtle',['hide','shell','spit','walk']),('spirit',['fade','nova','ring','walk'])]:
                r=await ev(pg,f"()=>FIGHT('{k}',40)")
                ok=all(x in r['ph'] for x in need) and r['fin'] and r['dmg']>0
                extra={'queen':r['dbl']>0 and r['adds']>=3,'golem':r['chain']>0,'turtle':True,'spirit':r['adds']>=2}[k]
                rec('보스',f'{k}: 패턴 정상 + 체력 반 이하 새 패턴(이중 고리/연속 돌진/졸개)', ok and extra, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_skills():
    import asyncio, sys
    # 스킬 (v44): 일반·마법·활 스킬 2개씩 + 분류 표시 + 스킬 다시 배우기
    H2=HOOK.replace("computeLight}","computeLight,SKILLS,SK_CAT,useSkill,wRange,atkCd,meleeMul,rangeMul,magicMul,maxMp,mkEnemy,WTYPE,curWeapon,doAttack}")
    CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+22;y++)for(let x=T.CX+2;x<T.CX+22;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i)}
  G.enemies.length=0;G.pshots.length=0;G.drops.length=0;G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.hp=100;G.p.mp=999;G.fish=null;G.inv.fill(null);G.sel=0;G.buffs=[];G.skcd={};
  const R=G.rpg;R.lv=30;R.sk={};R.slot=[null,null];R.str=R.dex=R.vit=R.int=0;return [T.CX+8,T.CY+8]};
  window.__en=(dx,dy)=>{const T=__T,G=T.G,e=T.mkEnemy('slimeO',G.p.x+dx,G.p.y+dy);e.hp=999;e.cd=99;e.t=99;G.enemies.push(e);return e};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+CLEAR+"}")
            r=await ev(pg,"""()=>{const T=__T;const all=Object.keys(T.SKILLS),cat=T.SK_CAT.flatMap(c=>c[2]);const nw=['stomp','warrior','volley','hawk','frostRing','arcane'];
          return [all.length,cat.length,all.every(k=>cat.includes(k)),T.SK_CAT.map(c=>c[1]+':'+c[2].filter(k=>nw.includes(k)).length).join(','),nw.map(k=>T.SKILLS[k].lv).join(','),nw.filter(k=>T.SKILLS[k].act).join(',')]}""")
            rec('스킬','v44 스킬 6개 (일반·마법·활 2개씩), v102부터 모두 42개·분류 9개, Lv.7~12에 열림', r==[42,42,True,'일반:2,검:0,단검:0,창:0,망치:0,활:2,마법:2,생활:0,큰 스킬:0','7,8,9,10,11,12','stomp,volley,frostRing'], str(r))
            await ev(pg,"()=>{__T.G.rpg.sp=5;__T.openPanel('stat',{tab:'sk'})}"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return ['일반 스킬','마법 스킬','활 스킬','생활 스킬','땅울림','화살비','서리 고리','마력 순환','매의 눈','전사의 기술'].map(x=>t.includes(x))}")
            rec('표시','능력 창에 스킬이 일반·마법·활·생활로 나뉘어 보임', all(r), str(r))
            await pg.screenshot(path=SP+'stat.png')
            await ev(pg,"()=>__T.closePanel()")
            # stomp
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.rpg.sk.stomp=1;G.rpg.slot=['stomp',null];const a=__en(2,0),b2=__en(0,-1.5),c=__en(4,0);G.inv[0]={id:'swordIron',c:1};G.sel=0;const m0=G.p.mp;T.useSkill(0);
          return [999-a.hp,999-b2.hp,999-c.hp,!!a.slow,Math.abs(a.kx)>10,m0-G.p.mp,G.skcd.stomp]}""")
            rec('땅울림','둘레 2.5칸 적 모두 피해(철 검 90%) + 느려짐 + 멀리 밀림, 4칸 밖은 안 맞음', 12<=r[0]<=26 and r[1]>0 and r[2]==0 and r[3] and r[4] and r[5]==16 and r[6]==7, str(r))
            # volley
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.rpg.sk.volley=1;G.rpg.slot=['volley',null];G.inv[0]={id:'swordWood',c:1};G.sel=0;const m0=G.p.mp;T.useSkill(0);const a=[G.pshots.length,m0-G.p.mp,!!G.skcd.volley];
          G.inv[0]={id:'bowIron',c:1};G.sel=0;G.inv[12]={id:'arrowIron',c:5};T.useSkill(0);const s=G.pshots.slice();const b2=[s.length,s.every(q=>q.k==='arrow'),Math.min(...s.map(q=>q.dmg)),m0-G.p.mp,T.countItem('arrowIron')];
          G.skcd={};G.pshots.length=0;G.rpg.sk.volley=3;T.useSkill(0);return [a,b2,G.pshots.length,document.querySelector('#toasts').innerText.includes('활을 들고 있어야')]}""")
            rec('화살비','활이 없으면 안 나가고 기력도 그대로', r[0]==[0,0,False] and r[3], str(r))
            rec('화살비','활: 화살 5발(3단계 9발), 한 발에 활 피해 60%, 기력 20, 화살은 안 씀', r[1][0]==5 and r[1][1] and 5<=r[1][2]<=8 and r[1][3]==20 and r[1][4]==5 and r[2]==9, str(r))
            # hawk
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowWood',c:1};G.sel=0;const W=T.WTYPE.bow;const r0=T.wRange(W),m0=T.rangeMul();__en(7.6,0);G.p.face={x:0,y:-1};T.doAttack();const d0=G.p.face.x;G.rpg.sk.hawk=2;const r2=T.wRange(W),m2=T.rangeMul();G.p.face={x:0,y:-1};T.doAttack();const d2=G.p.face.x;
          G.pshots.length=0;T.swingAttack&&0;return [r0,+r2.toFixed(2),+(m2/m0).toFixed(2),d0,d2,+T.wRange(T.WTYPE.staff).toFixed(2)]}""")
            rec('매의 눈','2단계: 활 사거리 +30%·활 피해 +16% (지팡이 사거리는 그대로) → 7.6칸 적도 자동 조준', r==[6.5,8.45,1.16,0,1,6.5], str(r))
            # frost ring
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.rpg.sk.frostRing=1;G.rpg.slot=[null,'frostRing'];const a=__en(2.5,0),b2=__en(0,2),c=__en(5,0);const mm=T.magicMul();const m0=G.p.mp;T.useSkill(1);return [999-a.hp,Math.round(20*mm),!!a.chill,999-b2.hp,999-c.hp,m0-G.p.mp]}""")
            rec('서리 고리','둘레 3칸 적에게 피해 20(1단계)·얼림, 5칸 밖은 안 맞음, 기력 24', r[0]==r[1] and r[2] and r[3]==r[1] and r[4]==0 and r[5]==24, str(r))
            # passives
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'swordIron',c:1};G.sel=0;const mm=T.maxMp(),mg=T.magicMul(),ml=T.meleeMul(),cd=T.atkCd();G.rpg.sk.arcane=3;G.rpg.sk.warrior=2;
          const r1=[T.maxMp()-mm,+(T.magicMul()/mg).toFixed(2),+(T.meleeMul()/ml).toFixed(2),+(T.atkCd()/cd).toFixed(2)];G.inv[0]={id:'bowWood',c:1};G.sel=0;const cb=T.atkCd();G.rpg.sk.warrior=0;return r1.concat([+(cb/T.atkCd()).toFixed(2)])}""")
            rec('패시브','마력 순환 3: 기력 +24·마법 +18% / 전사의 기술 2: 근접 피해 +12%·근접 공격 속도 +6% (활은 그대로)', r==[24,1.18,1.12,0.94,1.0], str(r))
            # reset
            await ev(pg,"()=>{const G=__T.G;__clear();G.rpg.sk={stomp:2,dash:1,hawk:3};G.rpg.slot=['stomp','dash'];G.rpg.sp=1;__T.openPanel('stat',{tab:'sk'})}"); await pg.wait_for_timeout(600)
            await pg.click('#sheet [data-a=skReset]'); await pg.wait_for_timeout(200)
            r0=await ev(pg,"()=>[__T.G.rpg.sp,document.querySelector('#sheet [data-a=skReset]').textContent]")
            await pg.click('#sheet [data-a=skReset]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const R=__T.G.rpg;return [R.sp,JSON.stringify(R.sk),R.slot.join(','),!!document.querySelector('#sheet [data-a=skReset]')]}")
            rec('다시 배우기','스킬 다시 배우기(무료): 한 번 더 눌러 확인 → 쓴 포인트 모두 돌려받음', r0[0]==1 and '정말' in r0[1] and r==[7,'{}',',',False], str([r0,r]))
            await ev(pg,"()=>__T.closePanel()")
            # save
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg.sk={volley:2,frostRing:1,arcane:3};G.rpg.slot=['volley','frostRing'];G.rpg.sp=0;T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const R=T.G.rpg;return [JSON.stringify(R.sk),R.slot.join(',')]}""")
            rec('저장','새 스킬·스킬 칸 저장/불러오기', r==['{"volley":2,"frostRing":1,"arcane":3}','volley,frostRing'], str(r))
            await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowIron',c:1};G.sel=0;G.rpg.sk.volley=3;G.rpg.slot=['volley','frostRing'];G.rpg.sk.frostRing=1;for(let k=0;k<4;k++)__en(3+k*.5,(k-1.5)*.8);T.useSkill(0)}""")
            await pg.wait_for_timeout(120); await pg.screenshot(path=SP+'volley.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_boss_effects_rarity():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,hitEnemy,hitBoss,mkEnemy,updateEnemies,updateBosses,updatePShots,RAR,rarOf,UNIQ_OF,refreshHotbar,swingAttack,freshBoss,grantUniques,ENEMY,bestPick,checkGuide}")
    ARENA="()=>{const G=__T.G;for(let y=100;y<120;y++)for(let x=100;x<124;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.enemies.length=0;G.pshots.length=0;G.p.x=101.5;G.p.y=110.5;G.p.face={x:1,y:0}}"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            # rarity data
            r=await ev(pg,"()=>{const T=__T;const bad=[];for(const id in T.ITEMS){const it=T.ITEMS[id];if((it.kind==='sword'||it.kind==='pick')&&T.rarOf(id)<0)bad.push(id)}return [bad,T.rarOf('swordWood'),T.rarOf('pickIron'),T.rarOf('bowCrystal'),T.rarOf('daggerQueen'),T.rarOf('wood')]}")
            rec('레어도','모든 무기·곡괭이에 등급이 있음', r[0]==[] and r[1:]==[0,1,2,3,-1], str(r))
            await ev(pg,"()=>{const G=__T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'daggerQueen',c:1};G.inv[1]={id:Object.keys(__T.ITEMS).find(k=>__T.ITEMS[k].kind==='sword'&&__T.rarOf(k)===1),c:1};G.inv[2]={id:'swordWood',c:1};G.inv[9]={id:'bowCrystal',c:1};__T.refreshHotbar()}")  # v65: pickaxes live in the pouch, so a 고급 weapon here
            await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const s=[...document.querySelectorAll('#hbSlots .slot:not(.tslot)')];return [s[0].className,s[1].className,s[2].className,getComputedStyle(s[0]).borderTopColor]}")
            rec('레어도','단축칸 테두리 색 (영웅/고급/일반)', 'r3' in r[0] and 'r1' in r[1] and 'r' not in r[2].replace('slot','').replace('sel','').replace('broken','').strip(), str(r))
            await ev(pg,"()=>__T.openPanel('inv')"); await pg.wait_for_timeout(500)
            await pg.tap('#sheet .slot[data-a=inv][data-i="0"]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const d=document.querySelector('#bagTip');return [d.querySelector('b span').style.color,d.textContent]}")
            rec('레어도','가방 상세에 등급 이름 색 + ★영웅 등급 + 효과 설명', r[0]!='' and '영웅 등급' in r[1] and '독' in r[1], str(r))
            await pg.screenshot(path=SP+'detail.png'); await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"()=>{const R=__T.RECIPES.find(r=>r.out==='pickCrystal');return [R.at,R.req.map(x=>x[0]).join(','),__T.ITEMS.pickCrystal.tier]}")
            rec('장비','수정 곡괭이: 석영 장비제작대(v61) + 수정 핵 필요, 3단계', r[0]=='smelter' and 'golemCore' in r[1] and r[2]==3, str(r))
            # poison
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G,e=__T.mkEnemy('slimeP',104.5,110.5);e.hp=500;G.enemies.push(e);__T.hitEnemy(e,20,false,0,'poison');const h0=e.hp;for(let k=0;k<60;k++)__T.updateEnemies(1/30);return [h0,e.hp,!!e.poison]}")
            rec('효과','독: 2초 동안 계속 피해', r[1] < r[0]-3 and r[2], str(r))
            r=await ev(pg,"()=>{const G=__T.G,e=G.enemies[0];for(let k=0;k<120;k++)__T.updateEnemies(1/30);return [e.poison]}")
            rec('효과','독은 4초 뒤 사라짐', r[0] is None, str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;const e=__T.mkEnemy('slimeG',104.5,110.5);e.hp=3;G.enemies.push(e);__T.hitEnemy(e,1,false,0,'poison');const k0=G.stats.kills||0;for(let k=0;k<200;k++)__T.updateEnemies(1/30);return [G.enemies.includes(e),(G.stats.kills||0)-k0]}")
            rec('효과','독으로 쓰러지면 처치 수·드롭 처리', r==[False,1], str(r))
            # slow
            r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;const a=__T.mkEnemy('shroomy',110.5,110.5),b2=__T.mkEnemy('shroomy',110.5,114.5);a.hp=b2.hp=999;G.enemies.push(a,b2);G.p.x=106.5;G.p.y=112.5;__T.hitEnemy(a,1,false,0,'slow');a.kx=a.ky=0;const ax=a.x,bx=b2.x;for(let k=0;k<30;k++)__T.updateEnemies(1/30);return [+(ax-a.x).toFixed(2),+(bx-b2.x).toFixed(2)]}")
            rec('효과','끈적: 맞은 적이 절반 이하 속도', r[0] < r[1]*0.6 and r[1] > 0.5, str(r))
            # split
            r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;G.pshots.length=0;const a=__T.mkEnemy('slimeP',110.5,110.5),b2=__T.mkEnemy('slimeP',111.6,110.5);a.hp=b2.hp=999;G.enemies.push(a,b2);__T.hitEnemy(a,30,false,0,'split');const n=G.pshots.length;for(let k=0;k<20;k++)__T.updatePShots(1/60);return [n,999-b2.hp>=0,G.pshots.length]}")
            rec('효과','수정 파편: 3개가 튀고 금방 사라짐', r[0]==3 and r[2]==0, str(r))
            # bosses: poison works, slow does not change patterns, death by dot
            r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;const b=G.bosses.queen;b.st='fight';b.hp=8;G.p.x=b.x+3;G.p.y=b.y;__T.hitBoss(b,5,false,'poison');__T.hitBoss(b,1,false,'slow');const s=b.slow;for(let k=0;k<400&&!G.bossDead.queen;k++){G.p.hp=999;G.p.inv=1;__T.updateBosses(1/30)}return [G.bossDead.queen,s,G.stats.uniq&&G.stats.uniq.queen,G.drops.some(d=>['swordQueen','daggerQueen','spearQueen','hammerQueen','bowQueen','staffQueen'].includes(d.id))]}")
            rec('보스','독은 보스에게도 · 끈적은 보스에게 안 걸림 · 독으로 처치', r[0] is True and r[1] is None, str(r))
            rec('보스','버섯 여왕 특별 무기 6종 가운데 하나(영웅) 드롭 (v99)', r[2]==1 and r[3], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.drops.length=0;const b=G.bosses.golem;b.st='fight';b.hp=1;__T.hitBoss(b,5,false);return [G.drops.map(d=>d.id).sort().join(',')]}")
            rec('보스','수정골렘: 전용 활 + 수정 핵', any(x in r[0] for x in ['swordGolem','daggerGolem','spearGolem','hammerGolem','bowGolem','staffGolem']) and 'golemCore' in r[0], str(r))
            # old saves get the weapon once
            r=await ev(pg,"()=>{const G=__T.G;G.drops.length=0;const s=JSON.parse(JSON.stringify(__T.serialize()));s.bossDead={slime:true,queen:true,golem:false};delete s.stats.uniq;for(let i=0;i<s.inv.length;i++)s.inv[i]=null;__T.deserialize(s);const a=[__T.countItem('hammerSlime'),__T.countItem('daggerQueen'),__T.countItem('bowGolem')];const s2=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s2);return a.concat([__T.countItem('hammerSlime')])}")
            rec('저장','이미 잡은 보스의 무기는 불러올 때 한 번만 받음', r==[1,1,0,1], str(r))
            # real melee swing with a unique weapon applies effect
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'hammerSlime',c:1};G.sel=0;const e=__T.mkEnemy('shroomy',102.6,110.5);e.hp=999;G.enemies.push(e);G.p.face={x:1,y:0};__T.swingAttack();return [e.hp<999,e.slow>0]}")
            rec('효과','실제 휘두르기로 효과가 걸림', r==[True,True], str(r))
            await pg.wait_for_timeout(500)
            await pg.screenshot(path=SP+'play.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_bosses_regions():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,updateBosses,hitBoss,freshBoss,isSolid,WALLS,SL,SI,LAVA,trySpawn,ENEMY,checkGuide,GUIDE,QSIDE,insertSeeds,migrateV3,genWorld,BKEYS,mineWall:typeof mineWall!=='undefined'?mineWall:null,newGame,refreshHotbar,rarOf,decide}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            for seed in [12345, 777, 4242]:
                r=await ev(pg,f"""()=>{{const T=__T;const w=T.genWorld({seed});const W=200,H=200;let n3=0,n4=0,lava=0,ice=0;for(let i=0;i<W*H;i++){{if(w.biome[i]===3)n3++;if(w.biome[i]===4)n4++;if(w.floor[i]===T.LAVA&&!w.wall[i])lava++;if(w.floor[i]===20)ice++;}}
              const seen=new Uint8Array(W*H),q=[T.idx(T.CX,T.CY+2)];seen[q[0]]=1;let leak=0,reach=0;
              while(q.length){{const i=q.pop();reach++;if(w.biome[i]>=3)leak++;const x=i%W,y=(i/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){{const j=T.idx(x+dx,y+dy);if(x+dx<0||y+dy<0||x+dx>=W||y+dy>=H||seen[j]||w.wall[j])continue;seen[j]=1;q.push(j)}}}}
              const inner=(S)=>{{const s2=new Uint8Array(W*H),q2=[T.idx(S.x,S.y+2)];s2[q2[0]]=1;let n=0,out=0;while(q2.length){{const i=q2.pop();n++;if(w.biome[i]<3)out++;const x=i%W,y=(i/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){{const j=T.idx(x+dx,y+dy);if(s2[j]||w.wall[j])continue;s2[j]=1;q2.push(j)}}}}return [n,out]}};
              return [n3,n4,lava,ice,leak,reach,w.objs.get(T.idx(T.SL.x,T.SL.y))?.t,w.objs.get(T.idx(T.SI.x,T.SI.y))?.t,inner(T.SL),inner(T.SI)]}}""")
                rec('지역',f'시드 {seed}: 용암·얼음 지역 생성 (타일 수/용암/얼음 바닥)', r[0]>800 and r[1]>800 and r[2]>0, str(r[:4]))
                rec('지역',f'시드 {seed}: 시작 지점에서 벽을 안 뚫고는 깊은 지역에 못 감', r[4]==0 and r[5]>2000, f'leak={r[4]} reach={r[5]}')
                rec('지역',f'시드 {seed}: 두 제단 + 보스방 안쪽은 막혀 있지만 넓음', r[6]=='shrine' and r[7]=='shrine' and r[8][0]>80 and r[8][1]==0 and r[9][0]>80 and r[9][1]==0, str(r[8:]))
            r=await ev(pg,"()=>{const T=__T;return [9,10,11,12].map(w=>T.WALLS[w].tier)}")
            rec('지역','새 벽은 모두 3단계(수정 곡괭이)', r==[3,3,3,3], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;let n3=0;for(let i=0;i<40000;i++)if(G.biome[i]===3)n3++;let i=G.floor.indexOf(T.LAVA);if(i<0){i=G.biome.indexOf(3);G.wall[i]=0;G.objs.delete(i);G.floor[i]=T.LAVA}return [n3>800,T.isSolid(i%200,(i/200)|0)]}")
            # 지도에 따라 용암 웅덩이가 하나도 안 생기기도 해서, 없으면 용암 동굴에 용암 칸을 하나 깔고 확인해요
            rec('지역','현재 세계에도 지역 존재 · 용암은 못 지나감', r[0] and r[1] is True, str(r))
            # mining tier
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'pickIron',c:1};const x=T.CX+3,y=T.CY+6;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){G.objs.delete(T.idx(x+dx,y+dy));G.wall[T.idx(x+dx,y+dy)]=0}G.wall[T.idx(x,y)]=10;G.p.x=x+.5;G.p.y=y-.5;G.p.face={x:0,y:1};T.mineWall({x,y});const a=G.wdmg.get(T.idx(x,y))||0;G.inv[1]={id:'pickCrystal',c:1};T.mineWall({x,y});const b=G.wdmg.get(T.idx(x,y))||0;G.wall[T.idx(x,y)]=0;G.wdmg.clear();return [a,b]}""")
            rec('채굴','철 곡괭이로는 금 광맥 못 캠 · 수정 곡괭이로 캠', r[0]==0 and r[1]>0, str(r))
            # spawns
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let i=-1;for(let k=0;k<40000;k++){if(G.biome[k]===3&&!G.wall[k]&&G.floor[k]===18&&Math.hypot(k%200-T.SL.x,((k/200)|0)-T.SL.y)>14){i=k;break}}const x=i%200,y=(i/200)|0;for(let dy=-18;dy<=18;dy++)for(let dx=-18;dx<=18;dx++){const j=T.idx(x+dx,y+dy);if(x+dx>2&&y+dy>2&&x+dx<197&&y+dy<197&&G.wall[j]!==8&&Math.hypot(x+dx-T.SL.x,y+dy-T.SL.y)>12){G.biome[j]=3;G.wall[j]=0;G.floor[j]=18;G.objs.delete(j)}}G.p.x=x+.5;G.p.y=y+.5;G.enemies.length=0;for(let k=0;k<40;k++)T.trySpawn();return [...new Set(G.enemies.map(e=>e.k+'@'+G.biome[T.idx(Math.floor(e.x),Math.floor(e.y))]))]}""")
            # 몬스터는 10~16칸 떨어진 곳에 무리로 생겨요 → 그 범위(18칸)를 모두 용암 동굴로 만들어 둬요 (지역 경계에서 옆 지역 몬스터 무리가 넘어오는 지도 모양에 기대지 않게)
            rec('적','용암 동굴에는 용암 말랑이·불씨 도깨비 + v101 용암 도롱뇽·화산탄 말랑이·작은 흑요석 골렘', len(r)>0 and any(k.endswith('@3') for k in r) and all(k.split('@')[0] in ('magmaSlime','cinder','lavaSala','bombSlime','obsGolem') for k in r if k.endswith('@3')), str(r))
            await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'lava.png')
            # turtle fight
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.enemies.length=0;const b=G.bosses.turtle;const h=T.BOSSES.turtle.home();G.p.x=h.x;G.p.y=h.y+4;const ph=new Set();let hz=0,shots=0,shellHit=null;
          for(let k=0;k<1800;k++){G.p.hp=999;G.p.inv=.5;T.updateBosses(1/60);ph.add(b.ph);hz=Math.max(hz,(G.hz||[]).length);shots=Math.max(shots,G.shots.length);if(b.ph==='shell'&&shellHit===null){const h0=b.hp;T.hitBoss(b,100,false);shellHit=h0-b.hp}}
          return [b.st,[...ph].sort().join(','),hz,shots,shellHit,Number.isFinite(b.x)&&Number.isFinite(b.y)]}""")
            rec('보스','용암 거북: 깨어나서 걷기·불덩이·숨기·껍질 굴리기 모두 사용', r[0]=='fight' and all(x in r[1] for x in ['walk','spit','hide','shell']), str(r))
            rec('보스','용암 거북: 껍질 굴리기 뒤 용암 웅덩이 · 불덩이 발사', r[2]>0 and r[3]>0, str(r))
            rec('보스','용암 거북: 껍질 속에서는 40%만 다침', r[4]==40, str(r))
            await pg.wait_for_timeout(300)
            await ev(pg,"()=>{const G=__T.G;const b=G.bosses.turtle;G.p.x=b.x;G.p.y=b.y+3.5}")
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'turtle.png')
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.drops.length=0;const b=G.bosses.turtle;b.hp=1;b.ph='walk';T.hitBoss(b,50,false);return [G.bossDead.turtle,G.drops.map(d=>d.id+':'+d.c).sort().join(','),(G.hz||[]).length]}")
            rec('보스','용암 거북 처치: 전용 대검 + 용암 핵 2 + 금괴', r[0] is True and any(x in r[1] for x in ['swordLava','daggerLava','spearLava','hammerLava','bowLava','staffLava']) and 'lavaCore:2' in r[1] and r[2]==0, str(r))
            # spirit fight
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;G.enemies.length=0;const b=G.bosses.spirit;const h=T.BOSSES.spirit.home();G.p.x=h.x-3;G.p.y=h.y;const ph=new Set();let nova=0,slowed=0,gapOk=null;
          for(let k=0;k<1800;k++){G.p.hp=999;if(G.p.inv>0)G.p.inv=0;T.updateBosses(1/60);ph.add(b.ph);if((G.hz||[]).some(x=>x.k==='frost'))nova++;if(G.p.slowT>0)slowed++;
            if(gapOk===null&&G.shots.filter(s=>s.k==='ice').length>=15)gapOk=G.shots.filter(s=>s.k==='ice').length}
          return [[...ph].sort().join(','),nova>0,slowed>0,gapOk,Math.hypot(b.x-h.x,b.y-h.y)<13]}""")
            rec('보스','서리 정령: 고리·사라짐·얼음 폭발 패턴', all(x in r[0] for x in ['walk','ring','fade','nova']) and r[1], str(r))
            rec('보스','서리 정령: 얼음 고리에 빈틈(15발) · 폭발에 맞으면 느려짐 · 방 밖으로 안 나감', r[3]==15 and r[2] and r[4], str(r))
            await ev(pg,"()=>{const G=__T.G;const b=G.bosses.spirit;G.p.x=b.x+3;G.p.y=b.y}")
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'spirit.png')
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.drops.length=0;const b=G.bosses.spirit;b.hp=1;b.ph='walk';T.hitBoss(b,50,false);return [G.bossDead.spirit,G.drops.map(d=>d.id+':'+d.c).sort().join(',')]}")
            rec('보스','서리 정령 처치: 전용 활 + 서리 핵 2', r[0] is True and any(x in r[1] for x in ['swordSpirit','daggerSpirit','spearSpirit','hammerSpirit','bowFrost','staffSpirit']) and 'frostCore:2' in r[1], str(r))
            # legendary recipes
            r=await ev(pg,"()=>{const T=__T;return ['swordDawn','pickStar','swordGold','pickGold','staffFrost','goldBar'].map(id=>{const R=T.RECIPES.find(r=>r.out===id);return R?R.at+':'+T.rarOf(id):'none'})}")
            rec('장비','전설·영웅 장비와 금괴 레시피', r==['smelter:4','smelter:4','smelter:3','smelter:3','smelter:3','furnace:2'], str(r))
            # story act 2
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.bossDead.queen=G.bossDead.slime=G.bossDead.golem=true;G.stats.seedsFound=3;G.treeSeeds=3;G.won=true;G.stats.naruMet=1;G.stats.wood=9;G.stats.bench=1;G.stats.torch=1;G.stats.copperOre=9;G.stats.copperBar=9;G.stats.forge=1;
          G.stats.callSeen={bar:1,pick:1};for(let i=0;i<G.inv.length;i++)G.inv[i]=null;T.addItem('pickCopper',1,false);G.guide=0;T.checkGuide();const a=T.GUIDE[G.guide].id;T.addItem('pickCrystal',1,false);T.checkGuide();const b2=T.GUIDE[G.guide].id;return [a,b2,G.bossDead.turtle,G.bossDead.spirit]}""")
            rec('이야기','3개 심은 뒤 2막 (두 보스를 이미 잡았으면 씨앗 모으기로 건너뜀)', r[0]=='seeds2' and r[1]=='seeds2', str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;T.addItem('lightSeed',2);T.checkGuide();const g=T.GUIDE[G.guide].id;T.insertSeeds();return [g,G.treeSeeds,G.won2]}")
            await pg.wait_for_timeout(2000)
            r2=await ev(pg,"()=>document.querySelector('#sheet h2,#sheet .sh-body h2')?.textContent||''")
            rec('이야기','v103: 다섯 번째 씨앗 → 나무의 다섯 번째 기억 장면(엔딩 창 대신), 축제 케이크 해금 표시는 그대로(won2)', r[1]==5 and r[2] is True and '다섯 번째 기억' in r2, str(r)+r2)
            await pg.screenshot(path=SP+'win2.png'); await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"()=>{const T=__T,G=T.G;const seen=Object.keys(G.stats.mem||{}).map(Number).sort().join(',');T.openPanel('stat',{tab:'lamp'});const t=document.querySelector('#sheet').innerText;T.closePanel();return [seen,t.includes('다섯 번째 기억'),t.includes('나무의 기억')]}")
            rec('이야기','v103: 본 기억은 저장(stats.mem)되고 캐릭터 창 등불 탭에서 다시 볼 수 있음', r[0]=='5' and r[1] and r[2], str(r))
            # save migration from an old (v2) save
            r=await ev(pg,"""()=>{const T=__T;T.newGame(999);const G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));
          const N=40000,wall=new Uint8Array(N),floor=new Uint8Array(N),biome=new Uint8Array(N);const un=(r,a)=>{let k=0;for(let i=0;i<r.length;i+=2){a.fill(r[i],k,k+r[i+1]);k+=r[i+1]}};un(s.wall,wall);un(s.floor,floor);un(s.biome,biome);
          const ex=new Uint8Array(N);let exN=0;for(let i=0;i<N;i++){if(biome[i]>=3){biome[i]=2;floor[i]=4;wall[i]=wall[i]?3:0;if(i%97===0){ex[i]=1;exN++}}}
          const rle=a=>{const o=[];let p=a[0],n=1;for(let i=1;i<a.length;i++){if(a[i]===p&&n<65535)n++;else{o.push(p,n);p=a[i];n=1}}o.push(p,n);return o};
          s.v=2;s.wall=rle(wall);s.floor=rle(floor);s.biome=rle(biome);s.explored=rle(ex);s.objs=s.objs.filter(([i,o])=>!['shrine','fireBloom','iceCluster'].includes(o.t)||(i!==T.idx(T.SL.x,T.SL.y)&&i!==T.idx(T.SI.x,T.SI.y)));s.objs=s.objs.filter(([i,o])=>o.t!=='fireBloom'&&o.t!=='iceCluster');delete s.bossDead.turtle;delete s.bossDead.spirit;
          T.deserialize(s);const G2=T.G;let n3=0,keep=0;for(let i=0;i<N;i++){if(G2.biome[i]===3)n3++;if(ex[i]&&G2.floor[i]===4)keep++}
          return [n3>800,G2.objs.get(T.idx(T.SL.x,T.SL.y))?.t,G2.bossDead.turtle,keep===exN,Object.keys(G2.bosses).length]}""")
            rec('저장','옛 저장(v2) 불러오면 안 가 본 곳에 새 지역 생성 · 가 본 곳은 그대로 (보스 6: v108 큰 어둠)', r[0] and r[1]=='shrine' and r[2] is False and r[3] and r[4]==6, str(r))
            r=await ev(pg,"()=>{try{const s=JSON.stringify(__T.serialize());__T.deserialize(JSON.parse(s));return JSON.parse(s).v}catch(e){return String(e)}}")
            rec('저장','새 저장 버전 3 왕복', r==3, str(r))
            # look at the ice cave
            await ev(pg,"""()=>{const T=__T,G=T.G;const S=T.SI;G.p.x=S.x+.5;G.p.y=S.y+2.5;G.bosses.spirit.st='sleep';}""")
            await pg.wait_for_timeout(800); await pg.screenshot(path=SP+'ice.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_boss_phases():
    import asyncio, sys
    # 보스 3단계 (v39): 용암 거북·서리 정령, 66%·33% 눈금, 단계 전환 무적·연출, 단계별 새 패턴
    H2=HOOK.replace("computeLight}","computeLight,SPR,updateBosses,hitBoss,freshBoss,SL,SI,bossStage,cam,ENEMY,renderPanel}")
    PREP="""window.__fight=(k)=>{const T=__T,G=T.G;G.enemies.length=0;G.shots.length=0;G.hz=[];G.bossDead[k]=false;const b=G.bosses[k];Object.assign(b,T.freshBoss(k));const h=T.BOSSES[k].home();G.p.x=h.x;G.p.y=h.y+3;G.p.hp=9999;G.p.dead=0;b.st='fight';b.t=5;return b};
window.__run=(n,dt)=>{const T=__T,G=T.G;for(let i=0;i<n;i++){G.p.hp=9999;G.p.inv=0;T.updateBosses(dt||1/60)}};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+PREP+"__T.G.enemies.length=0}")
            # turtle
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=__fight('turtle');__run(2);const s1=[b.stage||1,b.ph];b.hp=Math.floor(b.max*.6);__run(1);const s2=[b.stage,b.ph,+b.inv.toFixed(1)];const hp0=b.hp;T.hitBoss(b,100,false);const blocked=b.hp===hp0;
          const tip=document.body.innerText.includes('등껍질에 금이 갔어요');__run(100);return [s1,s2,blocked,tip,b.ph!=='roar',b.hp===hp0]}""")
            rec('전환','체력 66% 아래로 → 2단계, 1.5초 울부짖기 (그동안 피해 안 받음)', r[0][0]==1 and r[1][0]==2 and r[1][1]=='roar' and r[1][2]==1.5 and r[2] is True, str(r))
            rec('전환','처음 볼 때 팁 한 줄, 1.5초 뒤 다시 싸움', r[3] is True and r[4] is True, str(r))
            await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const bb=document.querySelector('#bossbar');return [bb.classList.contains('phased'),document.querySelectorAll('#bossbar .tk').length,getComputedStyle(document.querySelector('#bossbar .tk')).display]}")
            rec('체력 막대','용암 거북·서리 정령은 체력 막대에 66%·33% 눈금', r==[True,2,'block'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=G.bosses.turtle;b.ph='shell';b.t=3;b.bounce=0;const a=Math.atan2(0,1);b.dx=1;b.dy=0;G.shots.length=0;let fire=0;for(let i=0;i<240&&b.ph==='shell';i++){G.p.hp=9999;G.p.inv=0;const n=G.shots.length;T.updateBosses(1/60);fire=Math.max(fire,G.shots.filter(s=>s.k==='fire').length)}return [b.bounce,fire]}""")
            rec('용암 거북','2단계: 벽에 튕길 때마다 불씨 2개', r[0]>=1 and r[1]>=2, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=G.bosses.turtle;b.ph='walk';b.t=.6;b.hp=Math.floor(b.max*.3);__run(1);const s3=[b.stage,b.ph];__run(100);b.ph='walk';b.t=0;b.casts=3;G.hz=[];__run(1);const e1=b.ph;__run(60);const hz=G.hz.filter(h=>h.k==='lava'&&h.warn>=.9).length;const e2=b.ph;
          const hp0=b.hp;T.hitBoss(b,100,false);const d1=hp0-b.hp;__run(200);const e3=b.ph;const hp1=b.hp;T.hitBoss(b,100,false);const d2=hp1-b.hp;return [s3,e1,hz,e2,d1,e3,d2]}""")
            rec('용암 거북','33% 아래 → 3단계 "화산 등껍질": 멈춰서 분화 → 플레이어 주변 용암 덩이 6개 (0.9초 전 경고)', r[0]==[3,'roar'] and r[1]=='erupt' and 4<=r[2]<=6 and r[3]=='open', str(r))
            rec('용암 거북','분화 뒤 3초간 등껍질이 열려 피해 1.5배', r[4]==150 and r[5]!='open' and r[6] in (100,), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=G.bosses.turtle;b.ph='shell';b.t=30;b.bounce=0;b.dx=1;b.dy=.3;let n=0;for(let i=0;i<60*30&&b.ph==='shell';i++){G.p.hp=9999;G.p.inv=0;T.updateBosses(1/60)}return b.bounce}""")
            rec('용암 거북','3단계: 굴러오기 튕김이 2번 늘어남 (5 → 7)', r==7, r)
            r=await ev(pg,"()=>{const S=__T.SPR;return [S.turtleC.toDataURL()!==S.turtle.toDataURL(),!!S.turtleSC,!!S.turtleCW]}")
            rec('용암 거북','2단계부터 등껍질에 금이 가고 용암빛', r==[True,True,True], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;const b=G.bosses.turtle;b.ph='open';b.t=3;T.cam.x=b.x;T.cam.y=b.y;G.p.x=b.x+.5;G.p.y=b.y+3}")
            await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'turtle.png')
            # spirit
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.bossDead.turtle=false;Object.assign(G.bosses.turtle,T.freshBoss('turtle'));const b=__fight('spirit');__run(2);b.hp=Math.floor(b.max*.6);__run(1);const pil=[...G.objs.values()].filter(o=>o.t==='icePillar').length;const tip=!!(G.stats.phaseTip||{}).spirit2;
          const pi=b.pillars[0];const px=pi%200+.5,py=((pi/200)|0)+.5;G.shots.length=0;for(let k=0;k<4;k++)G.shots.push({x:px-.6,y:py,vx:4,vy:0,life:2,dmg:17,k:'ice'});__run(30);const left=G.objs.get(pi);return [b.stage,pil,tip,G.shots.length,!left]}""")
            rec('서리 정령','2단계 전환: 방 네 구석에 얼음 기둥 (팁 한 줄)', r[0]==2 and 3<=r[1]<=4 and r[2] is True, str(r))
            rec('서리 정령','기둥은 얼음 고리를 막고, 4번 맞으면 부서짐', r[3]==0 and r[4] is True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=G.bosses.spirit;__run(100);b.hp=Math.floor(b.max*.3);__run(1);__run(100);const cl=G.enemies.filter(e=>e.k==='spiritClone');const n=cl.length;
          b.ph='ring';b.t=0;b.rings=0;G.shots.length=0;__run(1);const spin=G.shots.filter(s=>s.k==='ice').every(s=>s.spin&&Math.abs(s.spin)>.3);const fromClone=G.shots.filter(s=>cl.some(e=>Math.hypot(s.x-e.x,s.y-e.y+.3)<.2)).length;
          const e=cl[0];const h0=G.enemies.length;T.hitEnemy?0:0;e.hp=0;return [b.stage,n,spin,fromClone,cl.every(e=>__T.ENEMY[e.k].hp===1)]}""")
            rec('서리 정령','3단계 "눈보라 분신": 반투명 분신 2개 (한 대면 사라짐), 진짜만 고리를 쏨', r[0]==3 and r[1]==2 and r[3]==0 and r[4] is True, str(r))
            rec('서리 정령','3단계: 고리의 틈이 천천히 회전', r[2] is True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=G.bosses.spirit;G.enemies=G.enemies.filter(e=>e.k!=='frostSlime');b.ph='nova';b.t=0;__run(1);b.ph='nova';b.t=0;__run(1);b.ph='nova';b.t=0;__run(1);return G.enemies.filter(e=>e.k==='frostSlime').length}""")
            rec('서리 정령','3단계: 얼음 말랑이는 최대 2마리', r==2, r)
            await ev(pg,"()=>{const T=__T,G=T.G;const b=G.bosses.spirit;b.ph='walk';T.cam.x=b.x;T.cam.y=b.y;G.p.x=b.x;G.p.y=b.y+3.5}")
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'spirit.png')
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=G.bosses.spirit;G.p.dead=1;T.updateBosses(1/60);G.p.dead=0;return [[...G.objs.values()].filter(o=>o.t==='icePillar').length,G.enemies.filter(e=>e.k==='spiritClone').length,b.stage||1,b.st]}""")
            rec('정리','쓰러지거나 떠나면 기둥·분신이 사라지고 보스는 처음부터', r==[0,0,1,'sleep'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const b=__fight('spirit');b.hp=Math.floor(b.max*.3);__run(2);const a=[[...G.objs.values()].filter(o=>o.t==='icePillar').length>0,G.enemies.filter(e=>e.k==='spiritClone').length];b.hp=1;b.inv=0;T.hitBoss(b,50,false);return [a,[...G.objs.values()].filter(o=>o.t==='icePillar').length,G.enemies.filter(e=>e.k==='spiritClone').length,G.bossDead.spirit]}""")
            rec('정리','한 번에 3단계로 가도 기둥·분신이 모두 나오고, 물리치면 사라짐', r[0]==[True,2] and r[1]==0 and r[2]==0 and r[3] is True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(__T.SI.x+4,__T.SI.y+4);G.objs.set(i,{t:'icePillar',hp:4});const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);return !!T.G.objs.get(i)}""")
            rec('세이브','싸움 중에 저장해도 얼음 기둥은 남지 않음', r is False, r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.bossDead.golem=false;const b=__fight('golem');__run(5);return [document.querySelector('#bossbar').classList.contains('phased'),b.stage]}""")
            rec('체력 막대','다른 보스는 눈금 없음', r[0] is False, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(Math.floor(G.p.x)+1,Math.floor(G.p.y));G.wall[i]=0;G.objs.set(i,{t:'bench'});T.openPanel('craft',{st:'bench'});const k1=document.querySelector('#sheet').dataset.key;T.renderPanel();const k2=document.querySelector('#sheet').dataset.key;T.closePanel();G.objs.delete(i);return [k1,k2]}""")
            rec('버그 수정','작업대 창을 연 뒤 다시 그려도 목록 위치가 맨 위로 튀지 않음 (창 이름표가 바뀌지 않음)', r[0]==r[1], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_boss_rematch():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,decide,perform,hitBoss,freshBoss,updateBosses,circuitTick,trySpawn,mkEnemy,updateEnemies,GUIDE,checkGuide,refreshHotbar,ENEMY,SL}")
    ARENA="()=>{const G=__T.G;for(let y=100;y<118;y++)for(let x=100;x<120;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.wire=new Map();G.enemies.length=0;G.p.x=104.5;G.p.y=108.5;G.p.face={x:1,y:0};for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.sel=0}"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            # ---- boss rematch ----
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;const b=G.bosses.queen;b.st='fight';b.hp=1;T.hitBoss(b,5,false);const first=G.drops.map(d=>d.id);G.drops.length=0;
          for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'queenIdol',c:1};G.sel=0;const h=T.BOSSES.queen.home();G.p.x=h.x+20;G.p.y=h.y;const far=T.decide();G.p.x=h.x;G.p.y=h.y+5;const a=T.decide();T.perform(a);return [first.some(id=>['swordQueen','daggerQueen','spearQueen','hammerQueen','bowQueen','staffQueen'].includes(id)),far.k,a.k,G.bossDead.queen,T.countItem('queenIdol')]}""")
            rec('재도전','보스를 잡은 뒤 보스방에서 소환 조각상 사용 → 다시 나타남 (멀면 소환 안 함, v65: 앞에 다른 할 일이 있으면 그걸 추천)', r[0] is True and r[1]!='summon' and r[2:]==['summon',False,0], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.callSeen={bar:1,pick:1};G.guide=0;G.stats.wood=9;G.stats.bench=1;G.stats.torch=1;G.stats.copperOre=9;G.stats.copperBar=9;G.stats.forge=1;T.addItem('pickCopper',1,false);T.checkGuide();return T.GUIDE[G.guide].id}""")
            rec('재도전','보스가 다시 살아나도 이야기 진행이 되돌아가지 않음', r!='queen', r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G;return [G2.bossDead.queen,G2.stats.beaten.queen]}""")
            rec('재도전','다시 불러낸 상태로 저장·불러오기 유지', r==[False,1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;const k0=T.countItem('lightSeed');let got=0;for(let n=0;n<40;n++){G.bossDead.queen=false;G.bosses.queen=T.freshBoss('queen');const b=G.bosses.queen;b.st='fight';b.hp=1;T.hitBoss(b,5,false);}const ids=G.drops.map(d=>d.id);return [ids.filter(i=>['swordQueen','daggerQueen','spearQueen','hammerQueen','bowQueen','staffQueen'].includes(i)).length,ids.includes('shroomCap'),ids.includes('lightSeed'),G.stats.rematch]}""")
            rec('재도전','다시 잡으면 재료 + 가끔(약 35%) 특별 무기(6종 가운데), 빛씨앗은 안 나옴', 4<=r[0]<=26 and r[1] and not r[2] and r[3]>=40, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;G.stats.beaten.slime=1;G.bossDead.slime=false;G.bosses.slime=T.freshBoss('slime');const b=G.bosses.slime;b.st='fight';b.hp=1;T.hitBoss(b,5,false);return G.drops.map(d=>d.id).includes('lightSeed')}""")
            rec('재도전','말랑대왕 재도전에서도 빛씨앗이 또 나오지 않음', r is False, str(r))
            r=await ev(pg,"()=>['queenIdol','slimeIdol','golemIdol','turtleIdol','spiritIdol'].map(id=>{const R=__T.RECIPES.find(r=>r.out===id);return R?R.at:'none'}).join(',')")
            rec('재도전','보스 5종 소환 조각상 레시피 (작업대, v60)', r=='bench,bench,bench,bench,bench', r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'spiritIdol',c:1};G.sel=0;G.bossDead.spirit=false;G.stats.beaten.spirit=0;const h=T.BOSSES.spirit.home();G.p.x=h.x;G.p.y=h.y;return T.decide().msg}""")
            rec('재도전','아직 안 잡은 보스는 소환 불가 안내', '물리친 뒤' in (r or ''), r)
            # ---- usability fixes ----
            await ev(pg,ARENA)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const ai=T.idx(110,104);const o={t:'drillGold',dir:{x:1,y:0}};G.objs.set(ai,o);G.wall[T.idx(111,104)]=10;G.objs.set(T.idx(110,106),{t:'battery',e:600});G.wire.set(T.idx(110,105),1);for(let k=0;k<30;k++)T.circuitTick(.2);return [o.why,(o.store||[]).map(s=>s.id+':'+s.c).join(','),T.RECIPES.some(r=>r.out==='drillGold')]}""")
            rec('채굴기','황금 채굴기: 금 광맥에서 금광석을 캠, 금 작업대 레시피 (v113부터 다시 만듦)', 'goldOre' in r[1] and r[2], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const o={t:'drillFe',dir:{x:1,y:0}};const ai=T.idx(110,108);G.objs.set(ai,o);G.wall[T.idx(111,108)]=10;G.objs.set(T.idx(110,110),{t:'battery',e:600});G.wire.set(T.idx(110,109),1);for(let k=0;k<5;k++)T.circuitTick(.2);return o.why}""")
            rec('채굴기','철 채굴기로는 금 광맥 불가 (tier)', r=='tier', r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const o={t:'drillGold',dir:{x:1,y:0}};const ai=T.idx(110,112);G.objs.set(ai,o);G.wall[T.idx(111,112)]=11;G.objs.set(T.idx(110,114),{t:'battery',e:6000});G.wire.set(T.idx(110,113),1);for(let k=0;k<25*40;k++)T.circuitTick(.2);return (o.store||[]).reduce((a,s)=>a+s.c,0)}""")
            rec('채굴기','얼음벽에서는 얼음 덩이 (v43: 지역 지형 재료, 40번 중 40개)', r==40, r)
            await ev(pg,ARENA)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.objs.set(T.idx(105,108),{t:'chair',dir:2});G.p.x=105.5;G.p.y=109.6;G.p.face={x:0,y:-1};const a=T.decide();T.perform(a);return [a.u,G.p.sit&&G.p.sit.dir]}""")
            rec('의자','위를 보는 의자에 앉기', r==['sit',2], str(r))
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'chair.png')
            await ev(pg,"()=>{const G=__T.G;G.p.sit=null;G.p.x=104.5;G.p.y=108.5}")
            # ---- region difficulty ----
            r=await ev(pg,"()=>{const E=__T.ENEMY;return [E.slimeG.hp,E.slimeP.hp,E.magmaSlime.hp,E.snowling.dmg,E.magmaSlime.aggro,E.bloomR.hp]}")
            rec('난이도','몬스터 체력·공격력 상향 (꽃망울은 그대로), 깊은 동굴 알아채는 거리 6.5칸(v85)', r==[18,75,120,22,6.5,18], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let i=-1;for(let k=0;k<40000;k++){if(G.biome[k]===3&&!G.wall[k]&&G.floor[k]===18&&Math.hypot(k%200-T.SL.x,((k/200)|0)-T.SL.y)>14){i=k;break}}const x=i%200,y=(i/200)|0;for(let dy=-16;dy<=16;dy++)for(let dx=-16;dx<=16;dx++){const j=T.idx(x+dx,y+dy);if(x+dx>2&&y+dy>2&&x+dx<197&&y+dy<197&&G.wall[j]!==8){G.wall[j]=0;G.floor[j]=18;G.objs.delete(j);G.biome[j]=3}}G.p.x=x+.5;G.p.y=y+.5;G.enemies.length=0;for(let k=0;k<60;k++)T.trySpawn();return G.enemies.length}""")
            rec('난이도','용암 동굴은 한 번에 더 많이 몰려옴 (최대 10, 무리 지어 등장)', 9<=r<=11, r)
            # 앞 단계에서 생긴 몬스터들이 잠깐 사이에 플레이어를 때리거나 쓰러뜨릴 수 있어요(쓰러지면 집으로) → 여기서 상태와 길을 직접 맞춰요
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.enemies.length=0;G.p.dead=0;G.p.hp=999;G.p.hurt=0;G.p.inv=0;const px=Math.floor(G.p.x),py=Math.floor(G.p.y);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=12;dx++){const j=T.idx(px+dx,py+dy);if(G.wall[j]!==8){G.wall[j]=0;G.objs.delete(j);if(G.floor[j]===T.WATER||G.floor[j]===17)G.floor[j]=18}}const e=T.mkEnemy('magmaSlime',G.p.x+6.2,G.p.y);G.enemies.push(e);const x0=e.x;for(let k=0;k<60;k++)T.updateEnemies(1/30);return +(x0-e.x).toFixed(2)}""")
            rec('난이도','깊은 동굴 몬스터는 더 멀리서(6.5칸, 기본 5칸) 알아채고 쫓아옴', r>0.5, r)
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_light_seeds():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,hitBoss,decide,perform,SL,SI,newGame}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T;T.newGame(11);const G=T.G;G.drops.length=0;const b=G.bosses.turtle;b.st='fight';b.hp=1;T.hitBoss(b,5,false);const sh=G.objs.get(T.idx(T.SL.x,T.SL.y));return [G.drops.filter(d=>d.id==='lightSeed').length,sh.has]}""")
            rec('빛씨앗','용암 거북을 잡으면 빛씨앗이 바로 떨어짐 (제단은 비워짐)', r==[1,0], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;const b=G.bosses.spirit;b.st='fight';b.hp=1;T.hitBoss(b,5,false);return G.drops.filter(d=>d.id==='lightSeed').length}""")
            rec('빛씨앗','서리 정령도 빛씨앗을 떨어뜨림', r==1, r)
            # an old save whose altar room was never built (area explored before the update), turtle alive
            r=await ev(pg,"""()=>{const T=__T;T.newGame(12);const G=T.G;const S=T.SL;for(let y=S.y-10;y<=S.y+10;y++)for(let x=S.x-10;x<=S.x+10;x++){const j=T.idx(x,y);G.objs.delete(j);G.wall[j]=3;G.biome[j]=2}
          const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G;const sh=G2.objs.get(T.idx(S.x,S.y));return [sh&&sh.t,sh&&sh.has,G2.wall[T.idx(S.x,S.y+2)]]}""")
            rec('빛씨앗','예전 세이브에 보스방·제단이 없으면 불러올 때 만들어 줌', r==['shrine',1,0], str(r))
            # turtle already beaten in an old save without an altar: seed handed over once
            r=await ev(pg,"""()=>{const T=__T;T.newGame(13);const G=T.G;const S=T.SL;G.objs.delete(T.idx(S.x,S.y));G.bossDead.turtle=true;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;
          let s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const a=T.countItem('lightSeed');s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);return [a,T.countItem('lightSeed')]}""")
            rec('빛씨앗','이미 잡았는데 제단이 없던 세이브는 빛씨앗을 한 번만 받음', r==[1,1], str(r))
            # beaten turtle, altar still holding the seed (v26 behaviour) stays takeable
            r=await ev(pg,"""()=>{const T=__T;T.newGame(14);const G=T.G;const S=T.SL;G.bossDead.turtle=true;let s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G2=T.G;G2.p.x=S.x+.5;G2.p.y=S.y+1.6;G2.p.face={x:0,y:-1};return [T.decide().k,T.countItem('lightSeed')]}""")
            rec('빛씨앗','v26에서 잡고 제단에 씨앗이 남아 있으면 그대로 꺼낼 수 있음', r==['take',0], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_natural_regen():
    import asyncio, sys
    # v66 (BF-03): 자연 회복(2.5초마다 +1, 배고픔 55 이상, 강한 더위 아님)은 마지막으로 맞은 뒤 5초 동안 멈춰요
    H2=HOOK.replace("computeLight}","computeLight,hurtPlayer,maxHp,REGEN_WAIT}")
    SAFE="G.enemies.length=0;G.shots.length=0;G.hz=[];G.p.inv=0;G.p.dead=0;G.p.sit=null;G.fish=null;G.p.hunger=100;G.env={k:null,v:0,lv:0,t:0};G.buffs=[];G.p.x=T.CX+.5;G.p.y=T.CY+3.2;"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>[__T.REGEN_WAIT]")
            rec('자연 회복','기다리는 시간 5초', r==[5], str(r))
            # healing goes on as before when nothing has hit you
            await ev(pg,"()=>{const T=__T,G=T.G;"+SAFE+"G.p.hp=50;G.p.hitAt=null}")
            await wait_game(pg,5.2)
            r=await ev(pg,"()=>__T.G.p.hp")
            rec('자연 회복','맞지 않았으면 예전처럼 회복 (5초에 +2 안팎)', 51<=r<=53, str(r))
            # hit: nothing for 5 s, then it starts again
            r=await ev(pg,"()=>{const T=__T,G=T.G;"+SAFE+"G.p.hp=60;T.hurtPlayer(10,G.p.x+1,G.p.y);G.p.kx=G.p.ky=0;window.__h0=G.p.hp;window.__t0=G.time;return [G.p.hp<60,G.p.hitAt===G.time]}")
            rec('자연 회복','맞으면 그 시각을 기억', r==[True,True], str(r))
            await wait_game(pg,4.6)
            r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;return [G.p.hp,window.__h0]}")
            rec('자연 회복','맞은 뒤 5초 안에는 회복 안 함', r[0]==r[1], str(r))
            ok=await wait_until(pg,"()=>{__T.G.enemies.length=0;return __T.G.p.hp>window.__h0}",timeout=15000)
            r=await ev(pg,"()=>Math.round((__T.G.time-window.__t0)*10)/10")
            rec('자연 회복','5초가 지나면 다시 회복 (다음 2.5초 박자에, 5~7.5초 사이)', ok and 5<=r<=7.6, str(r))
            # a second hit starts the wait again
            r=await ev(pg,"()=>{const T=__T,G=T.G;"+SAFE+"T.hurtPlayer(10,G.p.x+1,G.p.y);G.p.kx=G.p.ky=0;window.__h1=G.p.hp;return G.p.hp}")
            await wait_game(pg,4.6)
            r=await ev(pg,"()=>[__T.G.p.hp,window.__h1]")
            rec('자연 회복','다시 맞으면 5초를 처음부터', r[0]==r[1], str(r))
            # the old conditions still apply
            await ev(pg,"()=>{const T=__T,G=T.G;"+SAFE+"G.p.hitAt=null;G.p.hp=50;G.p.hunger=40}")
            await wait_game(pg,5.2)
            r=await ev(pg,"()=>{__T.G.p.hunger=100;return __T.G.p.hp}")
            rec('자연 회복','배고픔 55 아래면 예전처럼 회복 안 함', r==50, str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;"+SAFE+"G.p.hitAt=null;G.p.hp=T.maxHp()}")
            await wait_game(pg,5.2)
            r=await ev(pg,"()=>[__T.G.p.hp,__T.maxHp()]")
            rec('자연 회복','최대 체력을 넘지 않음', r[0]==r[1], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;T.hurtPlayer(5,G.p.x+1,G.p.y);const s=JSON.stringify(T.serialize());return s.includes('hitAt')}")
            rec('저장','맞은 시각은 저장하지 않음 (불러오면 바로 회복)', r is False, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_enemy_sight():
    # v85: 알아채는 거리(기본 5칸·버섯도깨비 5.5칸) + 벽 너머는 못 봄 + 쫓기 시작하면 3칸 더 + 맞으면 쫓음
    H2=HOOK.replace("computeLight}","computeLight,mkEnemy,enemyStep,hitEnemy,ENEMY}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,G=T.G,P=G.p;G.enemies.length=0;P.dead=0;P.hp=999;P.inv=99;const px=Math.floor(P.x),py=Math.floor(P.y),fl=G.floor[T.idx(px,py)];
              for(let dy=-4;dy<=4;dy++)for(let dx=-12;dx<=12;dx++){const j=T.idx(px+dx,py+dy);if(G.wall[j]!==8){G.wall[j]=0;G.objs.delete(j);G.floor[j]=fl}}
              const look=(dx,setup)=>{G.enemies.length=0;const e=T.mkEnemy('shroomy',P.x+dx,P.y);e.hp=999;G.enemies.push(e);if(setup)setup(e);e.x=P.x+dx;e.y=P.y;T.enemyStep(e,1/60);const c=!!e.chasing;G.enemies.length=0;return c};
              const near=look(4.5),far=look(7),dflt=T.ENEMY.slimeG.aggro||5;
              for(let dy=-4;dy<=4;dy++)G.wall[T.idx(px+2,py+dy)]=1;
              const wall=look(4.5);for(let dy=-4;dy<=4;dy++)G.wall[T.idx(px+2,py+dy)]=0;
              const keep=look(7.5,e=>{e.x=P.x+4.5;T.enemyStep(e,1/60)}),lose=look(9,e=>{e.x=P.x+4.5;T.enemyStep(e,1/60)}),hit=look(7.5,e=>T.hitEnemy(e,1,false,0));
              return {near,far,wall,keep,lose,hit,dflt,aggro:T.ENEMY.shroomy.aggro}}""")
            rec('알아채기','버섯도깨비 5.5칸: 4.5칸은 쫓고 7칸은 못 알아챔 · 기본 5칸', r['near'] and not r['far'] and r['aggro']==5.5 and r['dflt']==5, str(r))
            rec('알아채기','벽이 가리면 4.5칸이어도 못 알아챔', not r['wall'], str(r))
            rec('알아채기','쫓기 시작하면 7.5칸까지 계속 쫓고 9칸이면 놓침', r['keep'] and not r['lose'], str(r))
            rec('알아채기','7.5칸에서 맞으면 쫓아옴', r['hit'], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_monsters_avoid_light():
    # v88: 쫓지 않는 몬스터는 놓은 빛(횃불·램프 …)·등불나무 빛 안(밝기 0.3 넘는 칸)으로 들어가지 않고, 밝은 곳에 있으면 나가요. 쫓을 때는 들어가요
    H2=HOOK.replace("computeLight}","computeLight,mkEnemy,enemyStep,ruleLight,markRuleLit,isLit,LIT_MIN}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,G=T.G,P=G.p,R=Math.random;Math.random=()=>0.5; /* 0.5 → 늘 서쪽(횃불 쪽)으로 걸어요 */
              try{G.enemies.length=0;G.treeSeeds=0;P.dead=0;P.hp=999;P.inv=99;const tx=T.CX+40,ty=T.CY;
              for(let y=ty-6;y<=ty+6;y++)for(let x=tx-12;x<=tx+26;x++){const j=T.idx(x,y);G.wall[j]=0;G.objs.delete(j);G.floor[j]=2}
              G.objs.set(T.idx(tx,ty),{t:'torch'});T.markRuleLit();
              const run=(e,sec,f)=>{let maxL=0;for(let k=0;k<sec*30;k++){if(f)f(k);T.enemyStep(e,1/30);if(!G.enemies.includes(e))return -1;maxL=Math.max(maxL,T.ruleLight(Math.floor(e.x),Math.floor(e.y)))}return maxL};
              const lit=[T.isLit(tx+.5,ty+.5),T.isLit(tx+3.5,ty+.5),T.isLit(tx+5.5,ty+.5)];
              P.x=tx+18.5;P.y=ty+.5; /* 멀리 — 알아채지 못해요 */
              const out={lit,LIT:T.LIT_MIN};
              for(const k of ['shroomy','slimeG']){
                let e=T.mkEnemy(k,tx+6.5,ty+.5);e.hp=999;G.enemies.push(e);const x0=e.x;out[k+'_wander']=[run(e,8),+(x0-e.x).toFixed(2),!!e.chasing];G.enemies.length=0;
                e=T.mkEnemy(k,tx+1.5,ty+.5);e.hp=999;G.enemies.push(e);const st=T.isLit(e.x,e.y);run(e,10);out[k+'_leave']=[st,T.isLit(e.x,e.y),+Math.hypot(e.x-tx-.5,e.y-ty-.5).toFixed(2)];G.enemies.length=0;}
              /* 꺼진 횃불은 빛이 아니에요 · 내가 든 빛도 아니에요 */
              G.objs.get(T.idx(tx,ty)).off=true;T.markRuleLit();out.snuffed=T.isLit(tx+.5,ty+.5);G.objs.get(T.idx(tx,ty)).off=false;T.markRuleLit();out.player=T.isLit(P.x,P.y);
              /* 쫓을 때는 밝은 곳에 들어가요, 쫓기가 끝나면 나가요 */
              P.x=tx+.5;P.y=ty+1.5;let e=T.mkEnemy('shroomy',tx+5.5,ty+1.5);e.hp=999;G.enemies.push(e);let minD=99;
              run(e,3,()=>{P.x=tx+.5;P.y=ty+1.5;P.hp=999;P.inv=99;minD=Math.min(minD,Math.hypot(e.x-P.x,e.y-P.y))});out.chase=[T.isLit(e.x,e.y),+minD.toFixed(2),!!e.chasing];
              P.x=tx+22.5;P.y=ty+.5;run(e,8);out.after=[!!e.chasing,T.isLit(e.x,e.y)];G.enemies.length=0;
              /* 꽃 구역 가운데가 밝으면 끌려가지 않아요 */
              const zs=G.fzones;G.fzones=[{x:tx,y:ty,c:'R',dead:[]}];e=T.mkEnemy('bloomR',tx+7.5,ty+.5);e.zone=0;e.t=5;G.enemies.push(e);T.enemyStep(e,1/30);out.zoneLit=[e.vx,e.vy];G.objs.delete(T.idx(tx,ty));T.markRuleLit();e.t=5;T.enemyStep(e,1/30);out.zoneDark=e.vx<0;G.fzones=zs;G.enemies.length=0;
              return out}finally{Math.random=R}}""")
            rec('빛','횃불 칸·3칸 옆은 밝고 5칸 옆은 어두움 (기준 0.3)', r['lit']==[True,True,False] and r['LIT']==0.3, str(r))
            for k in ['shroomy','slimeG']:
                w=r[k+'_wander']; l=r[k+'_leave']
                rec('빛',k+': 쫓지 않을 때 횃불 쪽으로 걸어도 밝은 칸에 안 들어감', w[0]!=-1 and w[0]<=0.3 and w[1]>0.3 and not w[2], str(w))
                rec('빛',k+': 밝은 곳에 놓으면 어두운 곳으로 나감', l[0] and not l[1], str(l))
            rec('빛','꺼진 횃불·내가 든 빛은 밝은 곳으로 안 셈', not r['snuffed'] and not r['player'], str(r))
            rec('빛','쫓을 때는 밝은 곳에 들어와 붙음', r['chase'][0] and r['chase'][1]<1 and r['chase'][2], str(r['chase']))
            rec('빛','쫓기가 끝나면 밝은 곳에서 나감', r['after']==[False,False], str(r['after']))
            rec('빛','꽃 구역 가운데가 밝으면 끌려가지 않고, 어두우면 돌아감', r['zoneLit']==[0,0] and r['zoneDark'], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_weapon_tiers_v99():
    # v99 성장 확장 2: 무기 6종 × 6단계(공격력 = 단계 검 × 종류 배율), 착용 레벨, 보스 특별 무기 6종씩
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,WT_TABLE,WT_ORDER,WT_SW,WT_MUL,WT_RLV,BOSS_W,pickSp,curWeapon,slotHTML,ICON}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,bad=[];T.WT_TABLE.forEach((row,t)=>row.forEach((id,k)=>{const it=T.ITEMS[id],wt=T.WT_ORDER[k];
              if(!it||it.wt!==wt||it.dmg!==Math.round(T.WT_SW[t]*T.WT_MUL[wt])||it.rlv!==T.WT_RLV[t]||!T.ICON[id])bad.push(id)}));
              return [T.WT_TABLE.flat().length,new Set(T.WT_TABLE.flat()).size,bad.join(','),T.ITEMS.hammerCopper.dmg,T.ITEMS.spearFrost.dmg]}""")
            rec('무기','6종 × 6단계 36개, 공격력·착용 레벨이 표대로, 아이콘 있음 (구리 망치 17·서리 창 50)', r==[36,36,'',17,50], str(r))
            r=await ev(pg,"""()=>{const T=__T,out=[];T.WT_TABLE.forEach((row,t)=>row.forEach(id=>{if(id==='swordWood')return;const rc=T.RECIPES.find(x=>x.out===id);if(!rc||rc.at!=='smelter'||rc.tier!==t)out.push(id+':'+(rc?rc.at+rc.tier:'없음'))}));return out.join(',')}""")
            rec('무기','나무 검 말고 모두 장비제작대 그 단계에서 만듦 (황금 활은 금 단계로)', r=='', r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[0]={id:'swordIron',c:1};G.inv[1]={id:'swordCopper',c:1};G.sel=0;G.lastW=null;
              const a=[];for(const lv of [1,5,12]){G.rpg.lv=lv;a.push(T.curWeapon().id)}const h=T.slotHTML(G.inv[0],'inv',0);G.rpg.lv=1;const h1=T.slotHTML(G.inv[0],'inv',0);return [a.join(','),h.includes('rlvb'),h1.includes('rlvb')&&h1.includes('Lv.12')]}""")
            rec('착용 레벨','레벨이 모자란 무기는 못 들고 다른 무기로(Lv.1 주먹 · Lv.5 구리 검 · Lv.12 철 검), 칸에 빨간 Lv.12', r==['hand,swordCopper,swordIron',False,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.spGot={};G.stats.uniq={};const ids=T.BOSS_W.queen.ids,got=[];for(let i=0;i<6;i++)got.push(T.pickSp('queen'));
              const seven=T.pickSp('queen');G.stats.spGot={};G.stats.uniq={queen:1};const old=[];for(let i=0;i<5;i++)old.push(T.pickSp('queen'));
              const bad=Object.entries(T.BOSS_W).flatMap(([k,B])=>B.ids.filter(id=>!T.ITEMS[id]||!T.ICON[id]||T.ITEMS[id].fx!==B.fx));
              return [new Set(got).size,got.every(id=>ids.includes(id)),ids.includes(seven),old.includes('daggerQueen'),new Set(old).size,bad.join(','),T.ITEMS.daggerQueen.dmg,T.ITEMS.hammerSlime.dmg]}""")
            rec('특별 무기','보스마다 6종, 안 받은 것부터 하나씩(6번에 6종), 옛 세이브에서 받은 예전 무기는 받은 것으로 침, 효과는 보스 것 (여왕 단검 14·말랑대왕 망치 21)', r==[6,True,True,False,5,'',14,21], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_armor_v100():
    # v100 성장 확장 3: 방어구 머리·상의·하의 × 6단계, 방어력(받는 피해 × 50/(50+방어력)), 착용 레벨, 특수 옷도 방어력
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,AR_TABLE,AR_DEF,WT_RLV,wearItem,hurtPlayer,armorDef,ICON}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,bad=[],sl=['head','body','legs'];T.AR_TABLE.forEach((row,t)=>row.forEach(([id],k)=>{const it=T.ITEMS[id],rc=T.RECIPES.find(x=>x.out===id);
              if(!it||it.slot!==sl[k]||it.def!==T.AR_DEF[sl[k]][t]||it.rlv!==T.WT_RLV[t]||!rc||rc.at!=='smelter'||rc.tier!==t||!T.ICON[id])bad.push(id)}));
              return [T.AR_TABLE.flat().length,bad.join(','),['obsCoat','frostRobe','woolHat','snowBrooch'].map(id=>T.ITEMS[id].def+'/'+(T.ITEMS[id].rlv||1)).join(',')]}""")
            rec('방어구','머리·상의·하의 × 6단계 18개, 방어력·착용 레벨·장비제작대 단계·아이콘 / 특수 옷 방어력 70%·착용 레벨 없음', r==[18,'','11/1,15/1,1/1,9/1'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.equip={body:null,head:null,neck:null,ring:null,legs:null};G.rpg.lv=1;G.inv[0]={id:'armorIron',c:1};T.wearItem(0);const a=[G.equip.body,G.inv[0]&&G.inv[0].id];
              G.rpg.lv=12;T.wearItem(0);G.inv[1]={id:'helmIron',c:1};G.inv[2]={id:'legsIron',c:1};T.wearItem(1);T.wearItem(2);
              const d=T.armorDef();G.p.inv=0;G.p.dead=0;G.p.sleep=null;G.p.sit=null;G.p.hp=500;G.buffs=[];G.rpg.sk={};T.hurtPlayer(100,G.p.x+1,G.p.y);const lost=500-G.p.hp;
              const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);return [a[0],a[1],T.G.equip.body&&T.G.equip.body.id,T.G.equip.legs&&T.G.equip.legs.id,d,lost]}""")
            rec('방어구','Lv.1은 철 갑옷 못 입음 → Lv.12면 입음, 하의 칸, 철 한 벌 방어력 15 → 피해 100이 77, 저장·불러오기 그대로', r==[None,'armorIron','armorIron','legsIron',15,77], str(r))
            await ev(pg,"()=>{__T.openPanel('stat',{tab:'eq'})}"); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [t.includes('방어력 15'),t.includes('받는 피해 −23%')]}")
            rec('방어구','캐릭터 창 장비 탭에 「방어력 15 · 받는 피해 −23%」', r==[True,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_monsters_v101():
    # v101 성장 확장 4: 새 몬스터 15종(지역별 3종), 움직임(땅속·휘두르기·독 구름·등딱지·탄·위험 지대·돌진·터지기), 지역별 출현 표
    H2=HOOK.replace("computeLight}","computeLight,ENEMY,MON_TABLE,MON_AI,mkEnemy,enemyStep,hitEnemy,pickMon,updateHazards,updateShots,get SPR(){return SPR}}")
    ARENA="const T=__T,G=T.G;for(let y=100;y<120;y++)for(let x=100;x<120;x++){const i=T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.wire=new Map();G.enemies.length=0;G.shots.length=0;G.hz=[];G.p.x=110.5;G.p.y=110.5;G.p.dead=0;G.p.hp=500;G.p.inv=0;G.p.sleep=null;G.p.sit=null;G.rpg.lv=40;G.buffs=[];G.equip={body:null,head:null,neck:null,ring:null,legs:null};"
    NEW=['moleMoss','fireflyMoss','vineRoot','sporeShroom','shroomTurtle','toadPoison','crySpider','mirrorCry','crySnail','lavaSala','bombSlime','obsGolem','frostWolf','icicleSprite','yetiBaby']
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""(NEW)=>{const T=__T;const bad=NEW.filter(k=>!T.ENEMY[k]||!T.SPR[k]||!T.SPR[k+'W']||(T.ENEMY[k].ai&&!T.MON_AI[T.ENEMY[k].ai]));
              const sums=T.MON_TABLE.map(row=>Math.round(row.reduce((a,[,w])=>a+w,0)*100)/100),cnt=T.MON_TABLE.map(row=>row.filter(([k])=>NEW.includes(k)).length);
              const picks=new Set();for(let i=0;i<400;i++)picks.add(T.pickMon(2));return [bad.join(','),sums.join(','),cnt.join(','),[...picks].sort().join(',')]}""",NEW)
            rec('몬스터','새 몬스터 15종 모두 데이터·그림·움직임 있음, 지역별 표 합계 1, 지역마다 새 몬스터 3종, 수정 동굴에서 5종 다 나옴', r==['','1,1,1,1,1','3,3,3,3,3','crySnail,crySpider,mirrorCry,shroomy,slimeP'], str(r))
            # 두더지: 쫓으면 땅속(안 맞음) → 가까이 오면 튀어나옴
            r=await ev(pg,"""()=>{"""+ARENA+"""const e=T.mkEnemy('moleMoss',114.5,110.5);e.sees=true;e.chasing=true;e.alertAt=G.time;G.enemies.push(e);
              let under=false,blocked=0;for(let i=0;i<40;i++){T.enemyStep(e,1/30);if(e.under){under=true;const h=e.hp;T.hitEnemy(e,10,false,0);if(e.hp===h)blocked++;}}
              let out=false;for(let i=0;i<120&&!out;i++){T.enemyStep(e,1/30);if(!e.under)out=true}return [under,blocked>0,out,Math.hypot(e.x-G.p.x,e.y-G.p.y)<2.5]}""")
            rec('두더지','쫓을 때 땅속으로 숨어(안 맞음) 다가왔다가 가까이서 튀어나옴', r==[True,True,True,True], str(r))
            # 뿌리 덩굴: 안 움직이고, 가까이 오면 휘둘러 피해
            r=await ev(pg,"()=>{"+ARENA+"const e=T.mkEnemy('vineRoot',111.8,110.5);e.sees=true;G.enemies.push(e);const x0=e.x;for(let i=0;i<60;i++)T.enemyStep(e,1/30);return [e.x===x0,500-G.p.hp>0]}")
            rec('뿌리 덩굴','제자리에서 가까운 적을 휘둘러 때림', r==[True,True], str(r))
            # 포자 버섯: 쓰러지면 독 구름(위험 지대 poison)
            r=await ev(pg,"()=>{"+ARENA+"const e=T.mkEnemy('sporeShroom',112.5,110.5);G.enemies.push(e);T.hitEnemy(e,999,false,0);const h=G.hz.find(x=>x.k==='poison');G.p.x=112.5;for(let i=0;i<40;i++)T.updateHazards(1/30);return [!!h,500-G.p.hp>0]}")
            rec('포자 버섯','쓰러지면 독 구름이 남아 닿으면 아픔', r==[True,True], str(r))
            # 버섯 거북: 앞에서 때리면 30%
            r=await ev(pg,"()=>{"+ARENA+"const e=T.mkEnemy('shroomTurtle',113.5,110.5);e.fa=Math.PI;G.enemies.push(e);T.hitEnemy(e,20,false,0);const a=60-e.hp;e.hp=60;e.fa=0;T.hitEnemy(e,20,false,0);return [a,60-e.hp]}")
            rec('버섯 거북','앞(나를 향한 쪽)에서 맞으면 피해 30%, 뒤에서는 그대로', r==[6,20], str(r))
            # 수정 거미 거미줄 → 느려짐 / 아기 설인 눈덩이 / 거울 수정 빛줄기
            r=await ev(pg,"""()=>{"""+ARENA+"""const out=[];for(const [k,kind] of [['crySpider','web'],['yetiBaby','snow'],['mirrorCry','shard']]){G.shots.length=0;G.p.slowT=0;const e=T.mkEnemy(k,114.5,110.5);e.sees=true;e.chasing=true;e.alertAt=G.time;G.enemies.push(e);
              let n=0;for(let i=0;i<90&&!n;i++){T.enemyStep(e,1/30);n=G.shots.filter(s=>s.k===kind).length}out.push(n>0);G.enemies.length=0}
              G.shots.length=0;G.shots.push({x:G.p.x+.6,y:G.p.y-.3,vx:-3,vy:0,life:2,dmg:5,k:'web',slow:2});for(let i=0;i<20;i++)T.updateShots(1/30);out.push(G.p.slowT>0);return out}""")
            rec('탄','수정 거미 거미줄·아기 설인 눈덩이·거울 수정 빛줄기(파편)를 쏘고, 거미줄에 맞으면 느려짐', r==[True,True,True,True], str(r))
            # 화산탄 말랑이: 가까이 오면 터져 사라짐(드롭 없음) · 흑요석 골렘 돌진 · 고드름 정령 경고 원 · 도롱뇽 불 웅덩이
            r=await ev(pg,"""()=>{"""+ARENA+"""G.drops.length=0;let e=T.mkEnemy('bombSlime',111.6,110.5);e.sees=true;e.chasing=true;e.alertAt=G.time;G.enemies.push(e);for(let i=0;i<60;i++)if(G.enemies.includes(e))T.enemyStep(e,1/30);const bomb=[!G.enemies.includes(e),G.drops.length===0,500-G.p.hp>0];
              G.p.hp=500;G.enemies.length=0;e=T.mkEnemy('obsGolem',114.5,110.5);e.sees=true;e.chasing=true;e.alertAt=G.time;G.enemies.push(e);let dashed=false;for(let i=0;i<60;i++){T.enemyStep(e,1/30);if(e.dash>0)dashed=true}
              G.enemies.length=0;G.hz=[];e=T.mkEnemy('icicleSprite',114.5,110.5);e.sees=true;e.chasing=true;e.alertAt=G.time;G.enemies.push(e);for(let i=0;i<10;i++)T.enemyStep(e,1/30);const ic=G.hz.some(h=>h.k==='frost');
              G.enemies.length=0;G.hz=[];e=T.mkEnemy('lavaSala',114.5,110.5);e.sees=true;e.chasing=true;e.alertAt=G.time;G.enemies.push(e);for(let i=0;i<30;i++)T.enemyStep(e,1/30);const lv=G.hz.some(h=>h.k==='lava');return [bomb,dashed,ic,lv]}""")
            rec('움직임','화산탄 말랑이는 가까이서 터져 사라짐(드롭 없음·피해), 흑요석 골렘 돌진, 고드름 정령 경고 원, 용암 도롱뇽 불 웅덩이', r==[[True,True,True],True,True,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_skills_v102():
    # v102 성장 확장 5: 새 스킬 26개 — 무기 전용(그 무기를 들어야)·마법·일반·생활·큰 스킬, 항상 효과
    H2=HOOK.replace("computeLight}","computeLight,SKILLS,SK_CAT,useSkill,SK_FN,mkEnemy,hurtPlayer,hitEnemy,invSize,runCmd,swingAttack,enemyStep,curWeapon,get SPR(){return SPR}}")
    ARENA="const T=__T,G=T.G;for(let y=100;y<120;y++)for(let x=100;x<120;x++){const i=T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.wire=new Map();G.enemies.length=0;G.pshots.length=0;G.shots.length=0;G.hz=[];G.drops.length=0;G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.hp=500;G.p.mp=999;G.p.inv=0;G.p.sleep=null;G.p.sit=null;G.p.shield=0;G.p.orb=null;G.rpg.lv=80;G.rpg.sk={};G.rpg.slot=[null,null];G.skcd={};G.buffs=[];G.equip={body:null,head:null,neck:null,ring:null,legs:null};G.inv.fill(null);G.sel=0;G.lastW=null;const en=(k,dx,dy)=>{const e=T.mkEnemy(k||'slimeO',G.p.x+dx,G.p.y+dy);e.hp=e.mh=9999;e.cd=99;e.t=99;G.enemies.push(e);return e};const use=(k,l)=>{G.rpg.sk[k]=l||1;G.rpg.slot[0]=k;G.skcd={};G.p.mp=999;T.useSkill(0)};"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            NEW=['lunge','parry','shadowStep','vital','pierceDash','longArm','heavyHand','earthquake','pierceArrow','trapArrow','fireball','chain','lightShield','orbFriend','sprint','leech','secondWind','farmer','fisher','chef','porter','animalFriend','dawnLight','starRain','awaken','earthSplit']
            r=await ev(pg,"""(NEW)=>{const T=__T;const all=Object.keys(T.SKILLS),cat=T.SK_CAT.flatMap(c=>c[2]);const bad=NEW.filter(k=>!T.SKILLS[k]||!T.SPR.ui['sk_'+k]||(T.SKILLS[k].act&&!T.SK_FN[k]));
              return [all.length,bad.join(','),all.every(k=>cat.includes(k)),cat.length===new Set(cat).size,T.SK_CAT.map(c=>c[1]).join(','),Object.values(T.SKILLS).reduce((a,s)=>a+s.max,0)]}""",NEW)
            rec('스킬','새 스킬 26개(모두 42개), 아이콘·동작 있음, 분류 9개에 빠짐·겹침 없음, 단계 합계 126 > 스킬 포인트 80', r==[42,'',True,True,'일반,검,단검,창,망치,활,마법,생활,큰 스킬',126], str(r))
            # 무기 전용: 안 맞는 무기면 안 써짐(기력 안 줄고 쿨다운 없음), 맞는 무기면 적을 때림
            r=await ev(pg,"()=>{"+ARENA+"""G.inv[0]={id:'bowWood',c:1};const e=en('slimeO',1.5,0);use('lunge');const a=[G.skcd.lunge>0,e.hp];G.inv[0]={id:'swordIron',c:1};G.p.x=110.5;use('lunge');return a.concat([G.skcd.lunge>0,e.hp<9999,G.p.x>110.5])}""")
            rec('무기 전용','돌진 베기: 활을 들면 안 써지고, 검을 들면 앞으로 돌진하며 적을 벰', r==[False,9999,True,True,True], str(r))
            r=await ev(pg,"()=>{"+ARENA+"""G.inv[0]={id:'daggerIron',c:1};const e=en('slimeO',3,0);use('shadowStep');const a=[G.p.x>e.x,e.hp<9999];G.enemies.length=0;G.inv[0]={id:'hammerIron',c:1};G.p.x=110.5;const e2=en('slimeO',2,1);use('earthquake');a.push(e2.hp<9999,e2.stun>0);G.enemies.length=0;G.inv[0]={id:'spearIron',c:1};G.p.x=110.5;const e3=en('slimeO',3,0);use('pierceDash');a.push(e3.hp<9999);return a}""")
            rec('무기 전용','그림자 걸음은 적 뒤로 이동해 때림 · 지진은 둘레 적을 때리고 기절 · 꿰뚫기 돌진', r==[True,True,True,True,True], str(r))
            r=await ev(pg,"()=>{"+ARENA+"""G.inv[0]={id:'bowIron',c:1};const e=en('slimeO',2,0),e2=en('slimeO',3,0),e3=en('slimeO',4,0);use('pierceArrow');for(let i=0;i<40;i++)T.updatePShots&&0;return [G.pshots.length,G.pshots[0]&&G.pshots[0].pierce]}""")
            rec('활','꿰뚫는 화살: 관통 3 화살 한 발', r==[1,3], str(r))
            r=await ev(pg,"()=>{"+ARENA+"""G.inv[0]={id:'bowIron',c:1};const e=en('slimeO',3,0),e2=en('slimeO',4,1),far=en('slimeO',8,0);use('trapArrow',2);return [e.slow,e2.slow,far.slow||0]}""")
            rec('활','덫 화살: 가장 가까운 적 둘레 2칸이 (3+단계)초 느려짐', r==[5,5,0], str(r))
            # 마법
            r=await ev(pg,"()=>{"+ARENA+"""use('fireball');const a=[G.pshots.length===1&&G.pshots[0].fx==='burn'];G.pshots.length=0;const e=en('slimeO',2,0),e2=en('slimeO',3.5,0),e3=en('slimeO',5,0),e4=en('slimeO',9,0);use('chain',1);a.push(e.hp<9999,e2.hp<9999,e3.hp<9999,e4.hp===9999);
              use('lightShield',1);a.push(G.p.shield===45);T.hurtPlayer(20,G.p.x+1,G.p.y);a.push(G.p.hp===500&&G.p.shield===25);G.p.inv=0;T.hurtPlayer(60,G.p.x+1,G.p.y);a.push(G.p.shield===0&&G.p.hp<500);return a}""")
            rec('마법','불꽃 구슬(불꽃) · 번개 사슬이 3칸씩 이어 3마리(멀리 있는 건 안 맞음) · 빛 방패 45가 피해를 대신 받음', r==[True,True,True,True,True,True,True,True], str(r))
            # 일반·항상: 질주, 생명 흡수, 두 번째 숨, 받아치기, 급소, 긴 팔, 무거운 손
            r=await ev(pg,"()=>{"+ARENA+"""use('sprint',1);const a=[G.p.sprintT>4];G.rpg.sk={leech:2};G.p.hp=50;const e=en('slimeO',1,0);e.hp=1;T.hitEnemy(e,5,false,0);a.push(G.p.hp===55);
              G.rpg.sk={secondWind:1};G.p.hp=10;G.p.inv=0;G.p.secondAt=-9999;T.hurtPlayer(100,G.p.x+1,G.p.y);a.push(G.p.hp===1&&G.p.dead<=0);G.p.inv=0;T.hurtPlayer(100,G.p.x+1,G.p.y);a.push(G.p.hp===0||G.p.dead>0);
              G.p.dead=0;G.p.hp=500;G.p.inv=0;G.rpg.sk={parry:2};G.inv[0]={id:'swordIron',c:1};G.p.inv=0;G.p.hp=500;T.hurtPlayer(100,G.p.x+1,G.p.y);a.push(500-G.p.hp,G.p.parryT>0);return a}""")
            rec('일반·항상','질주 시간 · 생명 흡수로 처치 때 회복 · 두 번째 숨은 한 번만 · 받아치기 자세(검, 2단계)는 받는 피해 −8%(100 → 92)', r==[True,True,True,True,92,True], str(r))
            r=await ev(pg,"()=>{"+ARENA+"""G.rpg.sk={porter:2};T.runCmd({k:'skUp',s:'porter'});const n0=G.inv.length;G.rpg.sk={porter:3};G.rpg.sp=0;const a=[T.invSize()-(9+24),n0];G.inv[G.inv.length-1]={id:'wood',c:5};G.inv.length=T.invSize();T.runCmd({k:'skReset'});return a.concat([G.inv.length,T.invSize(),G.drops.length+G.inv.filter(x=>x&&x.id==='wood').length])}""")
            rec('짐꾼','가방 칸 +3/단계, 스킬을 되돌리면 칸이 줄고 넘친 물건은 가방 빈칸이나 발밑으로', r[0]==9 and r[2]==33 and r[3]==33 and r[4]>=1, str(r))
            # 큰 스킬
            r=await ev(pg,"()=>{"+ARENA+"""const e=en('slimeO',2,0),f=en('slimeO',7,0);use('dawnLight',1);const a=[e.hp<9999,f.hp===9999];e.hp=9999;use('starRain',1);a.push(e.hp<9999);use('awaken',1);G.skcd.heal=10;a.push(G.p.awakeT>8);G.inv[0]={id:'hammerIron',c:1};const g=en('slimeO',4,0);use('earthSplit',1);a.push(g.hp<9999,g.stun>0);return a}""")
            rec('큰 스킬','새벽빛 둘레 4칸 · 별빛 화살비 · 각성 · 대지 가르기(앞 6칸 한 줄, 기절)', r==[True,True,True,True,True,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_npc_v104():
    # v104 이야기 2: 그림자 고치(지역별 자리·옛 세계에도), 그림자 조각(빛 안 2배, 고치 둘레), 3번 치면 구출 → 마을 자리, 말 걸기 대화
    H2=HOOK.replace("computeLight}","computeLight,typeFinish,npcObjs,villageSpot,NPC_IDS,NPCS,cocoonTarget,hitCocoon,curWeapon,mkEnemy,hitEnemy,placeCocoons,decide,perform,runFrame,newGame,get SPR(){return SPR}}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            # 정해진 세계로 해요: 「새 모험」은 세계를 무작위로 만들어서, 옛 작은 지도(테스트 지도)에서는 약 1%의 세계에 고치 하나(학자·대장장이)를 놓을 자리가 없어 가끔 실패했어요 (자리가 없으면 안 생기는 건 정한 규칙)
            await ev(pg,"()=>{__T.newGame(20261008);__T.newGame(20261008);/* 두 번: 첫 세계는 바로 앞 세계 상태에 따라 조금 달라져요 */__T.G.enemies.length=0}")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const L=T.npcObjs();const bad=L.filter(e=>{const N=T.NPCS[e.o.npc],d=Math.hypot(e.x-T.CX,e.y-T.CY);return !N.archive&&!N.start&&(G.biome[e.i]!==N.b||d<N.minD||d>N.maxD||T.G.wall[e.i])});
              const nr=L.find(e=>e.o.npc==='guide');return [L.length,L.map(e=>e.o.npc).sort().join(','),bad.length,!!T.SPR.obj.cocoon,T.NPC_IDS.every(id=>T.SPR['npc_'+id]),G.stats.npcV,nr&&nr.o.t,nr&&Math.round(Math.hypot(nr.x-T.CX,nr.y-T.CY))]}""")
            rec('고치','새 세계에 고치 5개(학자는 v106 기록관 안)가 각자 지역·거리 안에 + 나루는 처음부터 마을(v110), 그림 있음, 놓았다는 표시(npcV)', r[0]==6 and r[1]=='cook,farmer,guide,scholar,shepherd,smith' and r[2]==0 and r[3] and r[4] and r[5]==1 and r[6]=='npc' and 9<=r[7]<=17, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));delete s.stats.npcV;s.objs=s.objs.filter(([i,o])=>o.t!=='cocoon');
              T.deserialize(s);const n1=T.npcObjs().length;const s2=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s2);return [n1,T.npcObjs().length,T.G.stats.npcV]}""")
            rec('옛 세계','고치가 없는 옛 세이브도 불러올 때 한 번 놓고(npcV), 다시 불러와도 더 안 놓음', r[0]==5 and r[1]==5 and r[2]==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const c=T.npcObjs().find(e=>e.o.npc==='farmer');G.enemies.length=0;G.p.x=c.x+.5;G.p.y=c.y+1.6;G.p.face={x:0,y:-1};G.p.dead=0;G.rpg.lv=40;
              for(let k=0;k<30;k++)T.runFrame(1/30);const guards=G.enemies.filter(e=>e.k==='shadowBit');const far=guards.every(e=>Math.hypot(e.x-c.x-.5,e.y-c.y-.5)<8);
              const e=guards[0];let a=null;if(e){for(let y=c.y-2;y<=c.y+2;y++)for(let x=c.x-2;x<=c.x+2;x++){const i=T.idx(x,y);G.objs.delete(i)}G.objs.set(c.i,c.o);G.stats.npcV=1;
                const h0=e.hp;T.hitEnemy(e,10,false,0);a=h0-e.hp}
              return [guards.length>=2,far,a]}""")
            rec('그림자 조각','고치 가까이 가면 그림자 조각이 2~3마리 생기고 고치 둘레에 머묾 (어두운 곳에선 피해 그대로 10)', r[0] and r[1] and r[2]==10, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const c=T.npcObjs().find(e=>e.o.npc==='farmer');G.enemies.length=0;G.drops.length=0;G.p.x=c.x+.5;G.p.y=c.y+1.6;G.p.face={x:0,y:-1};G.inv.fill(null);G.inv[0]={id:'swordWood',c:1};G.sel=0;
              const w=T.curWeapon();const out=[];for(let k=0;k<3;k++){const tg=T.cocoonTarget({x:c.x,y:c.y});out.push(!!tg);if(tg)T.hitCocoon(tg,w)}
              const gone=!G.objs.get(c.i);const v=T.npcObjs().find(e=>e.o.npc==='farmer');return [out.join(','),gone,v&&v.o.t,v&&Math.round(Math.hypot(v.x-T.CX,v.y-T.CY)),G.drops.some(d=>d.id==='cocoonBit'),G.stats.rescued&&G.stats.rescued.farmer]}""")
            rec('구출','고치를 3번 치면 부서지고 도라 할머니가 등불나무 곁(10~16칸) 마을 자리에 서요, 그림자 실 드롭, 구출 기록', r[0]=='true,true,true' and r[1] and r[2]=='npc' and 9<=r[3]<=17 and r[4] and r[5]==1, str(r))
            await pg.wait_for_timeout(1500)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet');return [!!t&&t.innerText.includes('도라 할머니'),!!document.querySelector('#sheet [data-a=talkNext]')]}")
            rec('대화','구하면 잠시 뒤 인사 대화 창(다음 버튼)', r==[True,True], str(r))
            await pg.wait_for_timeout(600); await ev(pg,"()=>{__T.typeFinish();document.querySelector('#sheet [data-a=talkNext]').click()}"); await pg.wait_for_timeout(200)  # v117: 타이핑 중 [다음]은 줄을 다 보이기만 해요
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [t.includes('등불나무 곁에서 지낼게'),!!document.querySelector('#sheet [data-a=close]')]}")
            rec('대화','다음 → 두 번째 줄, 마지막엔 잘 가요', r==[True,True], str(r))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const v=T.npcObjs().find(e=>e.o.npc==='farmer');G.p.x=v.x+.5;G.p.y=v.y+1.6;G.p.face={x:0,y:-1};G.sel=-1;const a=T.decide();if(a.k==='use')T.perform(a);return [a.k,a.u,a.lbl]}""")
            await pg.wait_for_timeout(300)
            r2=await ev(pg,"()=>{const t=document.querySelector('#sheet');return t?t.innerText.includes('밭은 흙이 반이야'):false}")
            rec('대화','마을 사람 앞에서 상호작용 = 말 걸기 → 직책 이야기', r[:2]==['use','talk'] and r[2]=='말 걸기' and r2, str(r)+str(r2))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_naru_start_v110():
    # v110 시작 길잡이 나루: 새 세계는 나루가 처음부터 마을에, 첫 이야기 「나루에게 말 걸기」(느낌표) → 첫 장면, 끝날 때 한마디, 빛씨앗 /5, 옛 세이브는 고치 → 마을
    H2=HOOK.replace("computeLight}","computeLight,npcObjs,naruSpot,naruWaits,npcState,GUIDE,checkGuide,questGo,perform,runFrame,closePanel,bellState}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=0;T.checkGuide();const n=T.naruSpot();const q=T.GUIDE[G.guide];const go=T.questGo(q);
              return [q.id,T.npcState('guide'),n&&Math.round(Math.hypot(n.x-T.CX,n.y-T.CY)),T.naruWaits(),!!go&&go.x===n.x&&go.y===n.y,G.stats.naru110,T.npcObjs().filter(e=>e.o.t==='cocoon').length]}""")
            rec('나루','새 세계: 첫 이야기는 나루에게 말 걸기, 나루는 처음부터 마을(나무에서 10~16칸), 느낌표, 화살표가 나루를 가리킴, 고치는 5개(학자 포함)', r[0]=='naru' and r[1]=='npc' and 9<=r[2]<=17 and r[3] and r[4] and r[5]==1 and r[6]==5, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const n=T.naruSpot();G.enemies.length=0;G.p.x=n.x;G.p.y=n.y+1.1;G.p.face={x:0,y:-1};G.p.dead=0;G.sel=-1;const a=T.decide();if(a.k==='use')T.perform(a);return [a.k,a.u,G.stats.naruMet]}""")
            await pg.wait_for_timeout(300)
            r2=await ev(pg,"()=>{const T=__T,G=T.G;const t=document.querySelector('#sheet');const tx=t?t.innerText:'';T.checkGuide();return [tx.includes('아, 깼어요?'),T.GUIDE[G.guide].id,T.naruWaits()]}")
            rec('첫 장면','나루 앞에서 상호작용 = 말 걸기 → 첫 장면 대화, 퀘스트가 뿌리기둥으로 넘어가고 느낌표 사라짐', r[:2]==['use','talk'] and r[2]==1 and r2==[True,'wood',False], str(r)+str(r2))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const n=T.naruSpot();G.p.x=n.x;G.p.y=n.y+1.1;G.p.face={x:0,y:-1};const a=T.decide();if(a.k==='use')T.perform(a);return a.u}""")
            await pg.wait_for_timeout(300)
            r2=await ev(pg,"()=>{const t=document.querySelector('#sheet');return t?[t.innerText.includes('아, 깼어요?'),!!document.querySelector('#sheet [data-a=talkShop]')]:null}")
            rec('두 번째','다시 말 걸면 첫 장면이 아니라 보통 이야기, 물물교환 버튼', r=='talk' and r2==[False,True], str(r)+str(r2))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.wood=6;T.checkGuide();return [T.GUIDE[G.guide].id]}""")
            await pg.wait_for_timeout(200)
            r2=await ev(pg,"()=>{const b=__T.bellState();return !!b&&b.lines[0].includes('나무 냄새 좋다')}")
            rec('한마디','뿌리기둥 퀘스트가 끝나면 나루의 한마디 (v117부터 방울 대화창)', r==['bench'] and r2, str(r)+str(r2))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.seedsFound=2;G.treeSeeds=1;const t=id=>T.GUIDE.find(q=>q.id===id).t();return [t('seeds'),t('tree'),t('seeds2'),t('tree2')]}""")
            rec('빛씨앗 /5','빛씨앗 퀘스트 숫자는 모두 /5', all('/5)' in x for x in r) and '(2/5)' in r[0], str(r))
            r=await ev(pg,"""()=>{const T=__T;let s=JSON.parse(JSON.stringify(T.serialize()));delete s.stats.naru110;delete s.stats.naruMet;delete s.qclaim.naru;
              s.objs=s.objs.map(([i,o])=>o.t==='npc'&&o.npc==='guide'?[i,{t:'cocoon',npc:'guide',hits:0}]:[i,o]);T.deserialize(s);let G=T.G;T.checkGuide();
              const coc=T.npcObjs().filter(e=>e.o.t==='cocoon'&&e.o.npc==='guide').length;const a=[T.npcState('guide'),coc,G.stats.naruMet,G.qclaim.naru,T.GUIDE[G.guide].id!=='naru'];
              const s2=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s2);G=T.G;a.push(T.npcObjs().filter(e=>e.o.npc==='guide').length,G.qclaim.naru);return a}""")
            rec('옛 세이브','고치 속 나루는 마을로, 첫 장면은 건너뜀(끝냄·보상 받은 것으로), 다시 불러와도 나루 한 명', r==['npc',0,1,1,True,1,1], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main

def test_naru_part1_v117():
    # v117 나루 퀘스트라인 1부: 첫 장면(주인공 대답·이름 짓기·방울·횃불), 타이핑·빨리감기, 1부 경험치는 바로·물건은 나루에게(?), 방울 대화, 하는 중 한마디, 6번 마을로 부름, 이름 저장
    H2=HOOK.replace("computeLight}","computeLight,naruSpot,naruAsk,naruOwed,GUIDE,checkGuide,questGo,activeQuest,perform,closePanel,bellState,bellClear,get panel(){return panel},renderPanel,runCmd,canClaim,questState,typing,typeFinish,pName,CHARS,curChar}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            TALK="""()=>{const T=__T,G=T.G;T.closePanel();const n=T.naruSpot();G.enemies.length=0;G.p.x=n.x;G.p.y=n.y+1.1;G.p.face={x:0,y:-1};G.p.dead=0;G.sel=-1;const a=T.decide();if(a.k==='use')T.perform(a);return a.u}"""
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=0;T.checkGuide();window.__t0=T.countItem('torch');window.__b0=T.countItem('berry');return [T.GUIDE[G.guide].id,!!G.stats.bell]}""")
            u=await ev(pg,TALK); await wait_until(pg,"()=>__T.panel&&__T.panel.kind==='talk'")
            r=await ev(pg,"""()=>{const T=__T,G=T.G,P=T.panel;return [P.mode,P.lines.some(l=>l&&l.ask),P.lines.some(l=>l&&l.me),!!G.stats.bell,T.countItem('torch')-window.__t0,T.countItem('berry')-window.__b0,!!G.qclaim.naru,T.typing(),!!document.querySelector('#sheet .skipty')]}""")
            rec('첫 장면','말 걸기 → 첫 장면(주인공 대답·이름 짓기 줄), 방울·횃불 1개·첫 퀘스트 보상(통통베리 3)을 그 자리에서, 타이핑 중·빨리감기 버튼', u=='talk' and r[:7]==['intro',True,True,True,1,3,True] and r[7] and r[8], str(u)+str(r))
            r=await ev(pg,"()=>{const T=__T;T.typeFinish();const t=document.querySelector('#sheet [data-type]');return [T.typing(),t.innerText.includes('아, 깼어요?'),!document.querySelector('#sheet .tyh')||[...document.querySelectorAll('#sheet .tyh')].every(e=>!e.textContent)]}")
            rec('빨리감기','빨리감기 = 지금 줄이 바로 다 보임 (투명한 남은 글자 없음)', r==[False,True,True], str(r))
            r=await ev(pg,"()=>{const T=__T,P=T.panel;P.at=P.lines.findIndex(l=>l&&l.ask);T.renderPanel();const i=document.querySelector('#nameIn');return [!!i,i&&i.value,!document.querySelector('#sheet [data-a=talkNext]')]}")
            rec('이름 짓기','이름 짓기 창: 처음 칸에 고른 캐릭터 이름, 다음 버튼 대신 「정했어요」', r[0] and r[1]==await ev(pg,"()=>__T.CHARS[__T.curChar()].n") and r[2], str(r))
            await pg.wait_for_timeout(500)
            await ev(pg,"()=>{const i=document.querySelector('#nameIn');i.value='  별빛<b>루나루나루나 ';i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#sheet [data-a=nameOk]').click()}")
            r=await ev(pg,"()=>{const T=__T,G=T.G;T.typeFinish();return [G.pname,T.pName(),document.querySelector('#sheet [data-type]').innerText]}")
            rec('이름 짓기','정했어요 → 이름 저장(꺾쇠 빼고 8자까지), 다음 줄에 「{이름}님」', r[0]=='별빛b루나루나루' and r[1]==r[0] and ('별빛b루나루나루님' in r[2]), str(r))
            r=await ev(pg,"()=>{const T=__T,P=T.panel;P.at=P.lines.findIndex(l=>l&&l.me&&l.s.includes('좋아요'));T.renderPanel();T.typeFinish();const box=document.querySelector('#sheet .talkbox');return [box.classList.contains('me'),box.innerText.includes(T.G.pname)]}")
            rec('주인공 줄','주인공이 말하는 줄은 주인공 이름·얼굴', r==[True,True], str(r))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();T.checkGuide();const q=T.GUIDE[G.guide].id;G.stats.wood=6;const lv=G.rpg.lv,xp=G.rpg.xp;T.checkGuide();const b=T.bellState();
              const st=T.questState(T.GUIDE[1],1);T.runCmd({k:'claim',id:'wood'});return [q,T.GUIDE[G.guide].id,G.rpg.lv>lv||G.rpg.xp-xp===10,!!G.qclaim.wood,T.naruAsk(),T.naruOwed().join(),!!b&&b.lines.length===3&&b.lines[0].includes('나무 냄새'),st.nh,T.canClaim()]}""")
            rec('보상','뿌리기둥 끝: 경험치 10은 바로, 물건은 안 받음(퀘스트 창에서도 못 받음), 나루 머리 위 ?, 방울 대화 3줄', r==['wood','bench',True,False,True,'wood',True,True,False], str(r))
            await ev(pg,TALK); await wait_until(pg,"()=>__T.panel&&__T.panel.kind==='talk'")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;return [T.panel.mode,!!G.qclaim.wood,T.naruAsk(),T.countItem('fiber')>=5]}""")
            rec('보상','마을의 나루에게 말 걸면 쌓인 보상(이끼 섬유 5·통통베리 3)과 한마디, ? 사라짐', r==['reward',True,False,True], str(r))
            await ev(pg,"()=>__T.closePanel()")
            await ev(pg,"()=>{const T=__T,G=T.G;T.bellClear();G.stats.nSaid={};G.stats.wood=0;G.guide=T.GUIDE.findIndex(q=>q.id==='wood')}")
            await ev(pg,"()=>{__T.G.stats.wood=1}")
            ok=await wait_until(pg,"()=>{const b=__T.bellState();return !!b&&b.short&&b.lines[0].includes('다섯 개 더')}",5000)
            r=await ev(pg,"()=>{const e=document.querySelector('#bell');return [!!e&&!e.hidden,e&&e.querySelector('.bellname').textContent]}")
            rec('하는 중','뿌리기둥 퀘스트에서 처음 베면 방울로 한 줄(나루 이름·얼굴), 한 번만', ok and r==[True,'나루'], str(ok)+str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();G.stats.wood=6;G.stats.bench=1;G.stats.torch=1;G.stats.copperOre=6;G.stats.copperBar=0;G.guide=T.GUIDE.findIndex(q=>q.id==='bar');T.checkGuide();
              G.stats.copperBar=1;T.checkGuide();const a=[G.stats.naruCall,T.GUIDE[G.guide].id,T.activeQuest().id];G.stats.forge=1;T.checkGuide();const g=T.questGo(T.activeQuest()),n=T.naruSpot();
              a.push(T.GUIDE[G.guide].id,!!g&&g.x===n.x&&g.y===n.y,T.naruAsk(),(T.bellState()||{lines:['']}).lines[0]);return a}""")
            rec('마을로 부름','첫 구리괴 → 방울 「마을로 와 줄래요?」, 다음 이야기는 나루와 이야기할 때까지 기다림(화살표 = 나루, ?)', r[:6]==['bar','forge','naruCall','forge',True,True] and '마을로 와 줄래요' in r[6], str(r))
            await ev(pg,"()=>__T.bellClear()"); await ev(pg,TALK); await wait_until(pg,"()=>__T.panel&&__T.panel.kind==='talk'")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const m=T.panel.mode;T.closePanel();T.checkGuide();return [m,G.stats.naruCall,!!G.qclaim.bar,T.GUIDE[G.guide].id,(T.bellState()||{lines:['']}).lines.join(' ')]}""")
            rec('마을로 부름','마을 장면(구리괴 이야기) → 보상, 이어서 다음 이야기(구리 작업대 끝 → 곡괭이 방울)', r[0]=='call:bar' and r[1] is None and r[2] and r[3]=='pick' and '구리 작업대다' in r[4], str(r))
            r=await ev(pg,"""()=>{const T=__T;const s=JSON.parse(JSON.stringify(T.serialize()));const a=[s.pname];T.deserialize(s);a.push(T.G.pname);delete s.pname;T.deserialize(s);a.push(T.G.pname,T.pName()===T.CHARS[T.curChar()].n);return a}""")
            rec('이름 저장','지은 이름은 세이브에(캐릭터 칸), 옛 세이브는 이름 없음 = 고른 캐릭터 이름', r[0]=='별빛b루나루나루' and r[1]==r[0] and r[2] is None and r[3], str(r))
            await ev(pg,"()=>__T.openPanel('profile')")
            await pg.wait_for_timeout(500)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=profEdit]').click()")
            await ev(pg,"()=>{const i=document.querySelector('#profName');i.value='토토';document.querySelector('#sheet [data-a=profName]').click()}")
            r=await ev(pg,"()=>[__T.G.pname,document.querySelector('#sheet').innerText.includes('토토')]")
            rec('프로필','프로필에서 이름 바꾸기', r==['토토',True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main

def test_naru_part1b_v118():
    # v118 나루 1부 ②: 먼저 걸어 나가기(광맥까지, 보는 사람은 서 있음·건너뛰기·멀면 바로), 나루의 부탁(이야기 탭·방울로 부탁·끝 장면·보상은 나루에게), 걸어 다니기, 상황 한마디
    H2=HOOK.replace("computeLight}","computeLight,naruSpot,naruAsk,naruPos,GUIDE,QSIDE,checkGuide,questGo,activeQuest,activeLine,perform,closePanel,bellState,bellClear,get panel(){return panel},runCmd,canClaim,questState,update,leadWalking,askList,askOwed,lifeLine,questMainHTML,questSideHTML,maxHp,IDLE}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            # 나루를 만난 세계, 4번(횃불)까지 — 나루 곁에 서서 4번을 끝냄
            SET="""(near)=>{const T=__T,G=T.G;T.closePanel();T.bellClear();G.enemies.length=0;G.stats.naruMet=1;G.stats.bell=1;G.stats.nLead=null;G.stats.nSaid={wood1:1,bench1:1,ore1:1,dirt1:1,furn1:1};G.stats.askV=1;G.stats.askOpen={};G.stats.askEnd={};
              G.stats.wood=6;G.stats.bench=1;G.stats.torch=0;G.stats.copperOre=0;G.guide=T.GUIDE.findIndex(q=>q.id==='torch');G.qAct='main';G.p.ctl=null;G.p.still=0;const hh=[...G.objs].find(([i,o])=>o.t==='npc'&&o.npc==='guide');if(hh[1].home!=null&&hh[0]!==hh[1].home&&!G.objs.get(hh[1].home)){G.objs.delete(hh[0]);G.objs.set(hh[1].home,hh[1]);}
              const n=T.naruSpot();G.p.dead=0;G.p.x=near?n.x+1.6:T.CX+.5+120;G.p.y=near?n.y+.6:T.CY+1.7;G.stats.torch=1;T.checkGuide();const L=G.stats.nLead;const b=T.bellState();
              const WW=Math.round(Math.sqrt(G.wall.length));const cu=L?[[0,1],[1,0],[-1,0],[0,-1]].some(([dx,dy])=>G.wall[L.i+dx+dy*WW]===4):false;
              return [T.GUIDE[G.guide].id,L&&L.s,cu,!!b&&b.lines[b.lines.length-1].includes('먼저 가 있을게요')]}"""
            r=await ev(pg,SET,True)
            rec('먼저 가기','4번(횃불)이 끝나면 첫 구리 광맥 옆 빈 칸을 찾아 둠(기다림), 방울 끝 줄 「제가 먼저 가 있을게요」', r==['ore','wait',True,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const n0=T.naruPos(),x0=G.p.x;T.runCmd({k:'naruLead'});const a=[G.stats.nLead.s,T.leadWalking(),G.p.still>G.time];
              G.p.ctl={mx:1,my:0,stick:null,act:false,atk:false,aim:null};for(let k=0;k<15;k++)T.update(1/30);const n1=T.naruPos();a.push(Math.abs(G.p.x-x0)<.3||G.p.x-x0,Math.hypot(n1.x-n0.x,n1.y-n0.y)>.4);
              for(let k=0;k<150&&G.stats.nLead.s==='walk';k++)T.update(1/30);G.p.ctl=null;const L=G.stats.nLead,WW=Math.round(Math.sqrt(G.wall.length)),n2=T.naruPos();
              a.push(L.s,Math.hypot(n2.x-(L.i%WW+.5),n2.y-(((L.i/WW)|0)+.5))<.01,!G.p.still||G.p.still-G.time<.7);const g=T.questGo(T.activeQuest());a.push(!!g&&Math.hypot(g.x-n2.x,g.y-n2.y)<.01);G.p.x+=40;return a}""")
            rec('먼저 가기','방울이 끝나면(naruLead) 곁에 선 사람 앞에서 걸어 나감 — 그동안 주인공은 서 있음, 나루는 움직임 → 다 걸으면 광맥 옆에, 화살표 = 나루 (나루 둘레가 막혀 걸을 곳이 없는 세계는 바로 광맥 옆)', (r[:5]==['walk',True,True,True,True] or r[0]=='there') and (r[5:]==['there',True,True,True] or r[5:8]==['back',True,True]), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();G.stats.nLead.s='there';const n=T.naruPos();G.p.x=n.x+1.2;G.p.y=n.y+.4;for(let k=0;k<20;k++)T.update(1/30);const a=[G.stats.nLead.s,(T.bellState()||{lines:['']}).lines.join('|')];
              G.stats.nLead.t=G.time-.1;G.p.x+=30;for(let k=0;k<20;k++)T.update(1/30);const m=T.naruPos(),h=[...G.objs].find(([i,o])=>o.t==='npc'&&o.npc==='guide');a.push(G.stats.nLead.s,h[0]===h[1].home);return a}""")
            rec('먼저 가기','광맥 옆 나루에게 오면 「여기예요!」 한마디 → 조금 뒤 마을(집 자리)로 돌아감', r[0]=='back' and '여기예요' in r[1] and r[2:]==['done',True], str(r))
            r=await ev(pg,SET,False)
            r2=await ev(pg,"()=>{const T=__T,G=T.G;T.runCmd({k:'naruLead'});return [G.stats.nLead.s,G.p.still|0]}")
            rec('멀리','멀리 있으면 걷는 모습 없이 바로 광맥 옆에', r[1]=='wait' and r2==['there',0], str(r)+str(r2))
            r=await ev(pg,SET,True)
            r2=await ev(pg,"()=>{const T=__T,G=T.G;T.runCmd({k:'naruLead'});const a=[G.stats.nLead.s];document.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));a.push(G.stats.nLead.s,G.p.still);return a}")
            rec('건너뛰기','걷는 동안 화면을 누르면 바로 광맥 옆에 (서 있기도 풀림)', r2==['walk','there',0] or r2==['there','there',0], str(r2))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.copperOre=6;T.checkGuide();for(let k=0;k<5;k++)T.update(1/30);const h=[...G.objs].find(([i,o])=>o.t==='npc'&&o.npc==='guide');return [T.GUIDE[G.guide].id,G.stats.nLead.s,h[0]===h[1].home]}""")
            rec('먼저 가기','광맥에 오지 않고 구리광석을 다 모아도 나루는 마을로 돌아감', r==['bar','done',True], str(r))
            # 나루의 부탁
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();G.stats.naruCall=null;G.stats.farmed=0;G.stats.litLamp=0;G.stats.drilled=0;G.qclaim=G.qclaim||{};delete G.qclaim.s_farm;delete G.qclaim.s_lamp;delete G.qclaim.s_drill;
              G.stats.askOpen={};G.stats.askEnd={};G.stats.askV=1;const side0=T.questSideHTML().includes('비버 둥지');for(let k=0;k<20;k++)T.update(1/30);const b=T.bellState();
              return [side0,Object.keys(G.stats.askOpen).join(),!!b&&b.lines.join(' ').includes('비버'),T.questMainHTML().includes('나루의 부탁'),T.questMainHTML().includes('비버 둥지로'),T.questSideHTML().includes('비버 둥지'),T.questSideHTML().includes('빛뿌리 램프')]}""")
            rec('부탁','작업대를 놓은 뒤 방울로 첫 부탁(비버 둥지) — 도전 탭에서 빠지고 이야기 탭 아래 「나루의 부탁」, 아직 안 받은 부탁은 안 보임', r==[False,'s_farm',True,True,True,False,False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();T.runCmd({k:'qAct',id:'s_lamp'});const a=[G.qAct];T.runCmd({k:'qAct',id:'s_farm'});a.push(G.qAct,T.activeLine()[0]);const xp=G.rpg.xp,lv=G.rpg.lv,r0=T.countItem('rope');
              G.stats.farmed=30;for(let k=0;k<20;k++)T.update(1/30);const b=T.bellState();T.runCmd({k:'claim',id:'s_farm'});T.checkGuide();const g=T.questGo(T.activeQuest()),n=T.naruSpot();
              a.push(!!G.stats.askEnd.s_farm,G.rpg.xp>xp||G.rpg.lv>lv,!!b&&b.lines[0].includes('마을로 와 줄래요'),!!G.qclaim.s_farm,T.countItem('rope')-r0,T.naruAsk(),T.canClaim(),!!g&&g.x===n.x&&g.y===n.y,T.activeLine().join(' '));return a}""")
            rec('부탁','안 받은 부탁은 못 고름, 받은 부탁은 활성(「부탁」), 끝내면 경험치는 바로·방울 「마을로 와 줄래요?」, 퀘스트 창에선 못 받고 나루 머리 위 ?, 화살표 = 나루', r[:3]==['main','s_farm','부탁'] and r[3:11]==[True,True,True,False,0,True,False,True] and '나루에게 가기' in r[11], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.closePanel();const n=T.naruSpot();G.p.x=n.x;G.p.y=n.y+1.1;G.p.face={x:0,y:-1};G.sel=-1;window.__r0=T.countItem('rope');const a=T.decide();if(a.k==='use')T.perform(a);return a.u}""")
            await wait_until(pg,"()=>__T.panel&&__T.panel.kind==='talk'")
            r2=await ev(pg,"""()=>{const T=__T,G=T.G;const P=T.panel;return [P.mode,P.lines.map(l=>typeof l==='string'?l:l.s).join(' ').includes('볼이 볼록'),!!G.qclaim.s_farm,T.countItem('rope')-window.__r0,T.naruAsk(),G.qAct]}""")
            rec('부탁','마을의 나루에게 말 걸면 부탁 끝 장면(비버 이야기) + 물건 보상(이끼 끈 4·건전지 1), ? 사라짐', r=='talk' and r2[:3]==['ask:s_farm',True,True] and r2[3]>=4 and r2[4:]==[False,'main'], str(r)+str(r2))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();delete G.stats.askV;G.stats.askOpen={};G.stats.askEnd={};delete G.qclaim.s_lamp;G.stats.litLamp=1;G.stats.nTip={hunger:1,hurt:1,faint:1,full:1,cocoon:1,region:1,warp:1,level:1,seed:1};G.guide=T.GUIDE.findIndex(q=>q.id==='queen');G.stats.naruCall=null;
              for(let k=0;k<20;k++)T.update(1/30);return [Object.keys(G.stats.askOpen).sort().join(),T.bellState(),T.askOwed().join(),T.naruAsk()]}""")
            rec('옛 세이브','이미 지난 부탁은 조용히 받은 것으로(방울 없음), 끝낸 부탁은 나루에게 보상', r==['s_drill,s_farm,s_lamp',None,'s_lamp',True], str(r))
            # 걸어 다니기 · 곁 한마디
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();G.qclaim.s_lamp=1;G.stats.nLead={s:'done'};G.p.x=T.CX+.5+100;G.p.y=T.CY+1.7;const h=[...G.objs].find(([i,o])=>o.t==='npc'&&o.npc==='guide');const home=h[1].home;
              const WW=Math.round(Math.sqrt(G.wall.length));let moved=0,far=0,walked=0;for(let k=0;k<30*40;k++){T.update(1/30);const p=T.naruPos();const d=Math.hypot(p.x-(home%WW+.5),p.y-(((home/WW)|0)+.5));if(d>.5)moved=1;
                const dt=Math.hypot(p.x-(T.CX+.5),p.y-T.CY);if(dt>Math.max(10,Math.hypot(home%WW-T.CX,((home/WW)|0)-T.CY)+4.5))far=1;}
              return [moved,far,!!T.lifeLine()]}""")
            rec('사는 모습','나루가 등불나무 둘레·집 자리 사이를 걸어 다님(40초 동안 움직이고, 멀리 가지 않음)', r[:3]==[1,0,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const n=T.naruPos();G.p.x=n.x+.2;G.p.y=n.y+1.3;const a=[];for(let k=0;k<30*8;k++)T.update(1/30);const m=T.naruPos();a.push(Math.hypot(m.x-n.x,m.y-n.y)<1.05);return a}""")
            rec('사는 모습','곁에 서 있으면 멈추고 바라봄(걷던 한 칸만 마저)', r==[True], str(r))
            # 1부 뒤 상황 한마디
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();G.guide=T.GUIDE.findIndex(q=>q.id==='queen');G.stats.naruCall=null;G.stats.callSeen={bar:1,pick:1};G.stats.nTip={faint:1,full:1,cocoon:1,region:1,warp:1,level:1,seed:1};G.p.x=T.CX+.5;G.p.y=T.CY+1.7;G.p.hunger=30;G.p.hp=T.maxHp();
              for(let k=0;k<20;k++)T.update(1/30);const b1=T.bellState();T.bellClear();G.p.hp=1;for(let k=0;k<30*3;k++)T.update(1/30);const b2=T.bellState();for(let k=0;k<30*7;k++)T.update(1/30);const b3=T.bellState();
              const a=[!!b1&&b1.short&&b1.lines[0].includes('꼬르륵'),b2,!!b3&&b3.lines[0].includes('다쳤어요'),!!G.stats.nTip.hunger];T.bellClear();G.p.hunger=20;G.p.hp=T.maxHp();for(let k=0;k<30*10;k++)T.update(1/30);a.push(T.bellState());return a}""")
            rec('상황 한마디','1부 뒤 배고픔 절반 → 방울 한 줄, 다음 한마디는 8초 뒤(다침), 한 번 한 말은 다시 안 함', r==[True,None,True,True,None], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.bellClear();G.stats.nTip={hunger:1,hurt:1,full:1,region:1,cocoon:1,warp:1,faint:1,level:1};G.p.hp=T.maxHp();G.p.hunger=90;for(let k=0;k<30*9;k++)T.update(1/30);
              G.inv[20]={id:'berrySeed',c:1};for(let k=0;k<30;k++)T.update(1/30);const b=T.bellState();return !!b&&b.lines[0].includes('씨앗이에요')}""")
            rec('상황 한마디','처음 씨앗을 얻으면 「씨앗이에요!」', r, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main

def test_barter_v105():
    # v105 물물교환: NPC 대화 창 「물물교환」 → 줄마다 주는 것 → 받는 것, 가방 재료만, 하루 3번, 쪽지는 한 번만
    H2=HOOK.replace("computeLight}","computeLight,npcObjs,rescue,runCmd,barterLeft,barterWhy,BARTER,countItem,knows}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const c=T.npcObjs().find(e=>e.o.npc==='farmer');T.rescue(c.i,c.o);G.inv.fill(null);G.inv[0]={id:'berry',c:20};G.sel=-1;
              const bad=[];for(const npc in T.BARTER)for(const [give,get] of T.BARTER[npc])for(const [id] of give.concat(get))if(!T.ITEMS[id])bad.push(id);
              const a=[T.barterWhy('farmer',0),T.barterLeft('farmer',0)];const ok1=T.runCmd({k:'barter',npc:'farmer',n:0});a.push(ok1,T.countItem('berry'),T.countItem('berrySeed'),T.barterLeft('farmer',0));
              T.runCmd({k:'barter',npc:'farmer',n:0});T.runCmd({k:'barter',npc:'farmer',n:0});const ok4=T.runCmd({k:'barter',npc:'farmer',n:0});a.push(T.barterLeft('farmer',0),ok4,T.barterWhy('farmer',0));
              G.time+=1300;a.push(T.barterLeft('farmer',0));a.push(T.barterWhy('farmer',1));a.push(bad.join(','));return a}""")
            rec('교환','베리 6 → 씨앗 3, 하루 3번(네 번째는 안 됨), 1200초 뒤 다시 3번, 모자라면 이유, 거래표의 물건 id 모두 있음', r==[None,3,True,14,3,2,0,False,'오늘은 더 바꿀 수 없어요 (잠시 뒤에 다시)',3,'버섯이(가) 6개 모자라요',''], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const c=T.npcObjs().find(e=>e.o.npc==='cook');T.rescue(c.i,c.o);G.inv.fill(null);G.inv[0]={id:'fireBerry',c:10};const w0=T.barterWhy('cook',2);const ok=T.runCmd({k:'barter',npc:'cook',n:2});return [w0,ok,T.knows('fireSkewer'),T.barterWhy('cook',2)]}""")
            rec('쪽지','불꽃 열매 2 → 요리 쪽지는 바로 배우고, 한 번 배우면 「이미 가진 쪽지」', r==[None,True,True,'이미 가진 쪽지예요'], str(r))
            await ev(pg,"()=>{__T.closePanel();}"); await pg.wait_for_timeout(1400); await ev(pg,"()=>{__T.closePanel();}")
            await ev(pg,"()=>__T.openPanel('talk',{npc:'farmer',mode:'talk'})"); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>{const s=document.querySelector('#sheet');const b=s.querySelector('[data-a=talkShop]');if(b)b.click();return !!b}")
            await pg.wait_for_timeout(300)
            r2=await ev(pg,"()=>{const s=document.querySelector('#sheet');return [s.querySelectorAll('[data-a=barter]').length,s.innerText.includes('물물교환'),s.innerText.includes('번 남음')||s.innerText.includes('모자라요')]}")
            rec('창','대화 창에서 「물물교환」 → 농부 거래 5줄', r and r2[0]==5 and r2[1] and r2[2], str(r)+str(r2))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_archive_v106():
    # v106 이끼 굴 기록관: 자리(지역·거리·거의 벽인 곳), 안은 지도에 안 남음, 레버 → 전기 문, 그림자 조각, 일기 읽기 → 깨짐(지도·레시피·학자 고치)
    H2=HOOK.replace("computeLight}","computeLight,archList,ARCH_W,ARCH_H,ARCH_PLAN,archHidden,circuitTick,decide,perform,readDiary,runFrame,knows,QSIDE,npcObjs,placeArchives,get SPR(){return SPR}}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const L=T.archList();if(!L.length)return ['none'];const a=L[0];const cx=a.x+6,cy=a.y+T.ARCH_H,d=Math.hypot(cx-T.CX,cy-T.CY);
              let rock=0,objs={};for(let r=0;r<T.ARCH_H;r++)for(let c=0;c<T.ARCH_W;c++){const i=T.idx(a.x+c,a.y+r);if(T.ARCH_PLAN[r][c]==='#'&&G.wall[i]===8)rock++;const o=G.objs.get(i);if(o)objs[o.t]=(objs[o.t]||0)+1}
              const ex=a.x+T.ARCH_PLAN[T.ARCH_H-1].indexOf('E');let path=0;for(let k=0;k<3;k++)if(!G.wall[T.idx(ex,a.y+T.ARCH_H+k)])path++;
              return [a.id,G.biome[T.idx(cx,cy)],Math.round(d),rock,objs,path,!!T.SPR.obj.diary,G.stats.archV,T.QSIDE.some(q=>q.id==='s_arch0')]}""")
            rec('기록관','새 세계 이끼 굴 30~75칸에 기록관 1개: 암반 벽, 레버·건전지·전기 문·일기·학자 고치·보물상자, 입구 아래 길 3칸, 도전 퀘스트', r[0]=='arch0' and r[1]==0 and 30<=r[2]<=75 and r[3]==sum(row.count('#') for row in ['#############','#.....#.....#','#.....#..J..#','#..L--D..S..#','#.....#.....#','#..B..#..C..#','#.....#.....#','###E#########']) and r[4]=={'lever':1,'battery':1,'eDoor':1,'diary':1,'cocoon':1,'tchest':1} and r[5]==3 and r[6] and r[7]==1 and r[8], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const a=T.archList()[0];G.p.x=a.x+3.5;G.p.y=a.y+5.5;G.enemies.length=0;for(let k=0;k<20;k++)T.runFrame(1/30);T.computeLight();
              const inside=[];for(let r=1;r<T.ARCH_H-1;r++)for(let c=1;c<T.ARCH_W-1;c++)inside.push(G.explored[T.idx(a.x+c,a.y+r)]?1:0);const guards=G.enemies.filter(e=>e.k==='shadowBit').length;
              return [inside.some(v=>v),T.archHidden(a.x+2,a.y+2),guards>=2]}""")
            rec('기록관','깨기 전엔 안에 서서 빛을 비춰도 지도에 안 남고(까맣게), 그림자 조각이 안에서 생김', r==[False,True,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const a=T.archList()[0];const door=[...G.objs].find(([i,o])=>o.t==='eDoor'&&o.arch);const lev=[...G.objs].find(([i,o])=>o.t==='lever'&&o.arch);
              T.circuitTick(1/30);const closed=!door[1].open;lev[1].on=1;T.circuitTick(1/30);T.circuitTick(1/30);return [closed,!!door[1].open]}""")
            rec('회로','레버를 켜면 건전지 전기가 전선으로 흘러 전기 문이 열림', r==[True,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const a=T.archList()[0];const di=[...G.objs].find(([i,o])=>o.t==='diary');const i=di[0],WW=Math.round(Math.sqrt(G.wall.length)),dx=i%WW,dy=(i/WW)|0;G.p.x=dx+.5;G.p.y=dy+1.6;G.p.face={x:0,y:-1};G.sel=-1;G.enemies.length=0;
              const act=T.decide();if(act.k==='use')T.perform(act);const A=T.archList()[0];let seen=0,all=0;for(let r=0;r<T.ARCH_H;r++)for(let c=0;c<T.ARCH_W;c++){all++;if(G.explored[T.idx(A.x+c,A.y+r)])seen++}
              return [act.k,act.u,A.done,seen===all,T.knows('petalPancake'),G.stats.archDone,T.npcObjs().some(e=>e.o.npc==='scholar'&&e.o.t==='cocoon')]}""")
            rec('일기','일기 앞에서 「일기 읽기」 → 기록관을 깼어요: 안이 지도에 모두 보이고 꽃잎 버섯 부침 레시피, 학자 고치는 그대로(쳐서 구함)', r==['use','read2',1,True,True,1,True], str(r))
            await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>{const s=document.querySelector('#sheet');return s&&s.innerText.includes('등불지기의 일기')&&s.innerText.includes('둥근 등불')}")
            rec('일기','일기 창에 첫 장 글(복선: 둥근 등불)', r is True, r)
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const q=T.QSIDE.find(q=>q.id==='s_arch0');const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const A=T.archList()[0];return [q.done(),A&&A.done,T.archList().length]}""")
            rec('저장','도전 퀘스트 완료, 저장·불러오기 뒤에도 기록관(v107부터 4개)·깬 상태 그대로', r[:2]==[True,1] and r[2]>=1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));delete s.stats.archV;s.stats.arch=[];T.deserialize(s);return [T.archList().length,T.G.stats.archV]}""")
            rec('옛 세계','기록 없는 옛 세이브도 불러올 때 한 번 놓음 (자리가 있으면)', r[1]==1 and r[0]>=0, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_archives_v107():
    # v107 수정·용암·얼음 기록관: 600×600 새 세계에 4개 모두, 지역·거리, 얼음엔 잠든 등불지기 5 + 빈자리, 일기 2~4장과 레시피, 도전 퀘스트 3개
    H2=HOOK.replace("computeLight}","computeLight,archList,ARCH_W,ARCH_H,planOf,readDiary,knows,QSIDE,ARCHIVES,get SPR(){return SPR}}")
    async def main():
        mkpage(SRC,'qa.html',H2,layout=2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const C=Math.round(Math.sqrt(G.wall.length))/2;const L=T.archList();const info=L.map(a=>{const A=T.ARCHIVES.find(q=>q.id===a.id);const d=Math.hypot(a.x+6-C,a.y+8-C);let sl=0,coc=0;for(let r=0;r<T.ARCH_H;r++)for(let c=0;c<T.ARCH_W;c++){const o=G.objs.get(T.idx(a.x+c,a.y+r));if(o&&o.t==='sleeper')sl++;if(o&&o.t==='cocoon')coc++}
              return [a.id,G.biome[T.idx(a.x+6,a.y+8)]===A.b,d>=A.minD&&d<=A.maxD,sl,coc]});return [info,!!T.SPR.obj.sleeper,['s_arch2','s_arch3','s_arch4'].every(id=>T.QSIDE.some(q=>q.id===id))]}""")
            rec('기록관 4개','600×600 새 세계에 네 지역 기록관이 각자 지역·거리에, 얼음 기록관엔 얼음 속 등불지기 5(빈자리 복선), 학자 고치는 이끼 굴만, 도전 퀘스트 3개', r[0]==[['arch0',True,True,0,1],['arch2',True,True,0,0],['arch3',True,True,0,0],['arch4',True,True,5,0]] and r[1] and r[2], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const out=[];for(const a of T.archList()){const di=[...G.objs].find(([i,o])=>o.t==='diary'&&o.a===a.id);const i=di[0],WW=600;T.readDiary({...di[1],x:i%WW+.5,y:((i/WW)|0)+.5});T.closePanel();out.push([a.done,T.knows(T.ARCHIVES.find(q=>q.id===a.id).recipe)])}return [out,G.stats.archDone,T.QSIDE.filter(q=>q.id.startsWith('s_arch')).every(q=>q.done())]}""")
            rec('일기','네 일기를 읽으면 각 지역 레시피(꽃잎 버섯 부침·빛버섯 수정 수프·불꽃 스튜·서리 차)를 배우고 네 기록관 모두 깬 것으로', r[0]==[[1,True],[1,True],[1,True],[1,True]] and r[1]==4 and r[2], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_deep_ending_v108():
    # v108 가장 깊은 곳: 자리, 빛씨앗 5개 전엔 막힘, 마지막 장 → 문 열림, 큰 어둠은 횃대 빛 안에서만 맞음·횃대 끄기, 쓰러지면 엔딩
    H2=HOOK.replace("computeLight}","computeLight,DEEP_W,DEEP_H,DEEP_PLAN,hitBoss,updateBosses,freshBoss,readLast,lightBrazier,GUIDE,deepGateTick,isLit,runFrame,darkHome,get SPR(){return SPR}}")
    async def main():
        mkpage(SRC,'qa.html',H2,layout=2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const d=G.stats.deep;if(!d)return ['none'];const C=300;let objs={};for(let r=0;r<T.DEEP_H;r++)for(let c=0;c<T.DEEP_W;c++){const o=G.objs.get(T.idx(d.x+c,d.y+r));if(o)objs[o.t]=(objs[o.t]||0)+1}
              const ex=d.x+T.DEEP_PLAN[T.DEEP_H-1].indexOf('E');let path=0;for(let k=0;k<3;k++)if(!G.wall[T.idx(ex,d.y+T.DEEP_H+k)])path++;const bo=G.bosses.dark;
              return [[3,4].includes(G.biome[T.idx(d.x+10,d.y+15)]),Math.hypot(d.x+10-C,d.y+15-C)>=110,objs,path,G.wall[d.gate],bo.st,Math.floor(bo.x)===d.bx,!!T.SPR.dark&&!!T.SPR.obj.brazier&&!!T.SPR.objOff.brazier,T.GUIDE.map(g=>g.id).slice(-3).join(',')]}""")
            rec('가장 깊은 곳','용암·얼음 깊은 곳(110칸 밖)에 21×15 유적: 횃대 6·마지막 장, 입구 길, 보스 문은 암반, 큰 어둠은 보스 자리에서 잠듦, 이야기 퀘스트 deep·dark', r==[True,True,{'brazier':6,'diaryLast':1},3,8,'sleep',True,True,'deep,dark,free'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const d=G.stats.deep;G.treeSeeds=4;G.p.x=d.x+10.5;G.p.y=d.y+13.5;T.deepGateTick();const out=[G.p.y>d.y+T.DEEP_H];G.treeSeeds=5;G.p.x=d.x+10.5;G.p.y=d.y+13.5;T.deepGateTick();out.push(Math.abs(G.p.y-(d.y+13.5))<.01);
              T.readLast();out.push(G.wall[d.gate],d.read);return out}""")
            rec('문','빛씨앗 4개면 어둠이 밀어내고, 5개면 들어감 · 마지막 장을 읽으면 보스 문(암반)이 열림', r==[True,True,0,1], str(r))
            await pg.wait_for_timeout(300); r=await ev(pg,"()=>{const s=document.querySelector('#sheet');return s&&s.innerText.includes('마지막 등불지기는')}"); rec('반전','찢긴 마지막 장 창: 「마지막 등불지기는 — 당신」', r is True, r)
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const d=G.stats.deep,b=G.bosses.dark;G.enemies.length=0;G.p.x=d.bx+.5;G.p.y=d.by+3.5;G.p.hp=500;G.rpg.lv=80;b.st='fight';b.t=1;b.ph='walk';
              const hp0=b.hp;T.hitBoss(b,100,false);const dark=b.hp===hp0;const brz=[...G.objs].filter(([i,o])=>o.t==='brazier');for(const [i,o] of brz)T.lightBrazier(o,i%600+.5,((i/600)|0)+.5);T.computeLight();
              const lit=T.isLit(b.x,b.y);T.hitBoss(b,100,false);const hit=hp0-b.hp;let blown=false;for(let k=0;k<60*20&&!blown;k++){G.p.hp=500;G.p.dead=0;T.updateBosses(1/60);blown=brz.some(([i,o])=>o.off)}return [dark,lit,hit,blown,b.ph]}""")
            rec('큰 어둠','어둠 속(횃대 꺼짐)에선 안 맞고, 횃대를 켜 밝힌 곳에선 맞음, 보스는 20초 안에 횃대를 꺼뜨림', r[0] is True and r[1] is True and r[2]==100 and r[3] is True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const d=G.stats.deep,b=G.bosses.dark;const brz=[...G.objs].filter(([i,o])=>o.t==='brazier');for(const [i,o] of brz)o.off=0;T.markLight&&0;T.computeLight();b.hp=1;T.hitBoss(b,5,false);return [G.bossDead.dark,d.done,G.stats.ending,G.explored[T.idx(d.x+3,d.y+3)]]}""")
            rec('엔딩','큰 어둠이 쓰러지면 가장 깊은 곳 지도가 보이고 엔딩 기록', r==[True,1,1,1], str(r))
            await pg.wait_for_timeout(2600); r=await ev(pg,"()=>{const s=document.querySelector('#sheet');return s&&s.innerText.includes('등불나무 아래')&&s.innerText.includes('계속 살아가기')}")
            rec('엔딩','2초 뒤 엔딩 창(등불나무 아래 · 계속 살아가기)', r is True, r)
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
