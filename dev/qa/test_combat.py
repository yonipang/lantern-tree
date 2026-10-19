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
            rec('스킬','새 스킬 6개 (일반·마법·활 2개씩), 모두 16개, Lv.7~12에 열림', r==[16,16,True,'일반:2,마법:2,활:2,생활:0','7,8,9,10,11,12','stomp,volley,frostRing'], str(r))
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
            rec('적','용암 동굴에는 용암 말랑이·불씨 도깨비', len(r)>0 and any(k.endswith('@3') for k in r) and all(k.split('@')[0] in ('magmaSlime','cinder') for k in r if k.endswith('@3')), str(r))
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
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.bossDead.queen=G.bossDead.slime=G.bossDead.golem=true;G.stats.seedsFound=3;G.treeSeeds=3;G.won=true;G.stats.wood=9;G.stats.bench=1;G.stats.torch=1;G.stats.copperOre=9;G.stats.copperBar=9;G.stats.forge=1;
          for(let i=0;i<G.inv.length;i++)G.inv[i]=null;T.addItem('pickCopper',1,false);G.guide=0;T.checkGuide();const a=T.GUIDE[G.guide].id;T.addItem('pickCrystal',1,false);T.checkGuide();const b2=T.GUIDE[G.guide].id;return [a,b2,G.bossDead.turtle,G.bossDead.spirit]}""")
            rec('이야기','3개 심은 뒤 2막 (두 보스를 이미 잡았으면 씨앗 모으기로 건너뜀)', r[0]=='seeds2' and r[1]=='seeds2', str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;T.addItem('lightSeed',2);T.checkGuide();const g=T.GUIDE[G.guide].id;T.insertSeeds();return [g,G.treeSeeds,G.won2]}")
            await pg.wait_for_timeout(2000)
            r2=await ev(pg,"()=>document.querySelector('#sheet h2,#sheet .sh-body h2')?.textContent||''")
            rec('이야기','다섯 번째 씨앗 → 진 엔딩 창', r[1]==5 and r[2] is True and '다섯 등불' in r2, str(r)+r2)
            await pg.screenshot(path=SP+'win2.png'); await ev(pg,"()=>__T.closePanel()")
            # save migration from an old (v2) save
            r=await ev(pg,"""()=>{const T=__T;T.newGame(999);const G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));
          const N=40000,wall=new Uint8Array(N),floor=new Uint8Array(N),biome=new Uint8Array(N);const un=(r,a)=>{let k=0;for(let i=0;i<r.length;i+=2){a.fill(r[i],k,k+r[i+1]);k+=r[i+1]}};un(s.wall,wall);un(s.floor,floor);un(s.biome,biome);
          const ex=new Uint8Array(N);let exN=0;for(let i=0;i<N;i++){if(biome[i]>=3){biome[i]=2;floor[i]=4;wall[i]=wall[i]?3:0;if(i%97===0){ex[i]=1;exN++}}}
          const rle=a=>{const o=[];let p=a[0],n=1;for(let i=1;i<a.length;i++){if(a[i]===p&&n<65535)n++;else{o.push(p,n);p=a[i];n=1}}o.push(p,n);return o};
          s.v=2;s.wall=rle(wall);s.floor=rle(floor);s.biome=rle(biome);s.explored=rle(ex);s.objs=s.objs.filter(([i,o])=>!['shrine','fireBloom','iceCluster'].includes(o.t)||(i!==T.idx(T.SL.x,T.SL.y)&&i!==T.idx(T.SI.x,T.SI.y)));s.objs=s.objs.filter(([i,o])=>o.t!=='fireBloom'&&o.t!=='iceCluster');delete s.bossDead.turtle;delete s.bossDead.spirit;
          T.deserialize(s);const G2=T.G;let n3=0,keep=0;for(let i=0;i<N;i++){if(G2.biome[i]===3)n3++;if(ex[i]&&G2.floor[i]===4)keep++}
          return [n3>800,G2.objs.get(T.idx(T.SL.x,T.SL.y))?.t,G2.bossDead.turtle,keep===exN,Object.keys(G2.bosses).length]}""")
            rec('저장','옛 저장(v2) 불러오면 안 가 본 곳에 새 지역 생성 · 가 본 곳은 그대로', r[0] and r[1]=='shrine' and r[2] is False and r[3] and r[4]==5, str(r))
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
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=0;G.stats.wood=9;G.stats.bench=1;G.stats.torch=1;G.stats.copperOre=9;G.stats.copperBar=9;G.stats.forge=1;T.addItem('pickCopper',1,false);T.checkGuide();return T.GUIDE[G.guide].id}""")
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
            rec('채굴기','황금 채굴기: 이미 놓인 것은 금 광맥에서 금광석을 캠 (v46부터 새로 만드는 건 황금 채굴장)', 'goldOre' in r[1] and not r[2], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const o={t:'drillFe',dir:{x:1,y:0}};const ai=T.idx(110,108);G.objs.set(ai,o);G.wall[T.idx(111,108)]=10;G.objs.set(T.idx(110,110),{t:'battery',e:600});G.wire.set(T.idx(110,109),1);for(let k=0;k<5;k++)T.circuitTick(.2);return o.why}""")
            rec('채굴기','철 채굴기로는 금 광맥 불가 (tier)', r=='tier', r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const o={t:'drillGold',dir:{x:1,y:0}};const ai=T.idx(110,112);G.objs.set(ai,o);G.wall[T.idx(111,112)]=11;G.objs.set(T.idx(110,114),{t:'battery',e:6000});G.wire.set(T.idx(110,113),1);for(let k=0;k<25*40;k++)T.circuitTick(.2);return (o.store||[]).reduce((a,s)=>a+s.c,0)}""")
            rec('채굴기','얼음벽에서는 얼음 덩이 (v43: 지역 지형 재료, 40번 중 40개)', r==40, r)
            await ev(pg,ARENA)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.objs.set(T.idx(105,108),{t:'chair',dir:2});G.p.x=105.5;G.p.y=109.6;G.p.face={x:0,y:-1};const a=T.decide();T.perform(a);return [a.u,G.p.sit&&G.p.sit.dir]}""")
            rec('의자','위를 보는 의자에 앉기', r==['sit',2], str(r))
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'chair.png')
            await ev(pg,"()=>{const G=__T.G;G.p.sit=null;G.p.x=104.5;G.p.y=108.5}")
            await ev(pg,"()=>{const T=__T,G=T.G;const i=T.idx(106,104);const o={t:'treeFarm',p:G.time};G.objs.set(i,o);for(const j of [i+1,i+200,i+201])G.objs.set(j,{t:'_part',a:i});G.p.x=105.5;G.p.y=107.5}")
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'farm.png')
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
