import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 스킬 (v44): 일반·마법·활 스킬 2개씩 + 분류 표시 + 스킬 다시 배우기
H2=HOOK.replace("computeLight}","computeLight,SKILLS,SK_CAT,useSkill,wRange,atkCd,meleeMul,rangeMul,magicMul,maxMp,mkEnemy,WTYPE,curWeapon}")
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
        await ev(pg,"()=>{__T.G.rpg.sp=5;__T.openPanel('stat')}"); await pg.wait_for_timeout(500)
        r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return ['일반 스킬','마법 스킬','활 스킬','생활 스킬','땅울림','화살비','서리 고리','마력 순환','매의 눈','전사의 기술'].map(x=>t.includes(x))}")
        rec('표시','능력 창에 스킬이 일반·마법·활·생활로 나뉘어 보임', all(r), str(r))
        await pg.screenshot(path=SP+'qa44_stat.png')
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
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowWood',c:1};G.sel=0;const W=T.WTYPE.bow;const r0=T.wRange(W),m0=T.rangeMul();__en(7.6,0);const d0=T.decide().k;G.rpg.sk.hawk=2;const r2=T.wRange(W),m2=T.rangeMul();const d2=T.decide().k;
          G.pshots.length=0;T.swingAttack&&0;return [r0,+r2.toFixed(2),+(m2/m0).toFixed(2),d0,d2,+T.wRange(T.WTYPE.staff).toFixed(2)]}""")
        rec('매의 눈','2단계: 활 사거리 +30%·활 피해 +16% (지팡이 사거리는 그대로) → 7.6칸 적도 자동 조준', r==[6.5,8.45,1.16,'swing','attack',6.5], str(r))
        # frost ring
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.rpg.sk.frostRing=1;G.rpg.slot=[null,'frostRing'];const a=__en(2.5,0),b2=__en(0,2),c=__en(5,0);const mm=T.magicMul();const m0=G.p.mp;T.useSkill(1);return [999-a.hp,Math.round(20*mm),!!a.chill,999-b2.hp,999-c.hp,m0-G.p.mp]}""")
        rec('서리 고리','둘레 3칸 적에게 피해 20(1단계)·얼림, 5칸 밖은 안 맞음, 기력 24', r[0]==r[1] and r[2] and r[3]==r[1] and r[4]==0 and r[5]==24, str(r))
        # passives
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'swordIron',c:1};G.sel=0;const mm=T.maxMp(),mg=T.magicMul(),ml=T.meleeMul(),cd=T.atkCd();G.rpg.sk.arcane=3;G.rpg.sk.warrior=2;
          const r1=[T.maxMp()-mm,+(T.magicMul()/mg).toFixed(2),+(T.meleeMul()/ml).toFixed(2),+(T.atkCd()/cd).toFixed(2)];G.inv[0]={id:'bowWood',c:1};G.sel=0;const cb=T.atkCd();G.rpg.sk.warrior=0;return r1.concat([+(cb/T.atkCd()).toFixed(2)])}""")
        rec('패시브','마력 순환 3: 기력 +24·마법 +18% / 전사의 기술 2: 근접 피해 +12%·근접 공격 속도 +6% (활은 그대로)', r==[24,1.18,1.12,0.94,1.0], str(r))
        # reset
        await ev(pg,"()=>{const G=__T.G;__clear();G.rpg.sk={stomp:2,dash:1,hawk:3};G.rpg.slot=['stomp','dash'];G.rpg.sp=1;__T.openPanel('stat')}"); await pg.wait_for_timeout(600)
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
        await pg.wait_for_timeout(120); await pg.screenshot(path=SP+'qa44_volley.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
