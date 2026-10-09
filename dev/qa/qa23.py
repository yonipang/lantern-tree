import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
H2=HOOK.replace("computeLight}","computeLight,RECIPES,hitEnemy,hitBoss,mkEnemy,updateEnemies,updateBosses,updatePShots,RAR,rarOf,UNIQ_OF,refreshHotbar,swingAttack,freshBoss,grantUniques,ENEMY,bestPick,checkGuide}")
ARENA="()=>{const G=__T.G;for(let y=100;y<120;y++)for(let x=100;x<124;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.enemies.length=0;G.pshots.length=0;G.p.x=101.5;G.p.y=110.5;G.p.face={x:1,y:0}}"
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        # rarity data
        r=await ev(pg,"()=>{const T=__T;const bad=[];for(const id in T.ITEMS){const it=T.ITEMS[id];if((it.kind==='sword'||it.kind==='pick')&&T.rarOf(id)<0)bad.push(id)}return [bad,T.rarOf('swordWood'),T.rarOf('pickIron'),T.rarOf('bowCrystal'),T.rarOf('daggerQueen'),T.rarOf('wood')]}")
        rec('레어도','모든 무기·곡괭이에 등급이 있음', r[0]==[] and r[1:]==[0,1,2,3,-1], str(r))
        await ev(pg,"()=>{const G=__T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'daggerQueen',c:1};G.inv[1]={id:'pickIron',c:1};G.inv[2]={id:'swordWood',c:1};G.inv[9]={id:'bowCrystal',c:1};__T.refreshHotbar()}")
        await pg.wait_for_timeout(200)
        r=await ev(pg,"()=>{const s=[...document.querySelectorAll('#hbSlots .slot')];return [s[0].className,s[1].className,s[2].className,getComputedStyle(s[0]).borderTopColor]}")
        rec('레어도','단축칸 테두리 색 (영웅/고급/일반)', 'r3' in r[0] and 'r1' in r[1] and 'r' not in r[2].replace('slot','').replace('sel','').replace('broken','').strip(), str(r))
        await ev(pg,"()=>__T.openPanel('inv')"); await pg.wait_for_timeout(500)
        await pg.tap('#sheet .slot[data-a=inv][data-i="0"]'); await pg.wait_for_timeout(200)
        r=await ev(pg,"()=>{const d=document.querySelector('.detail');return [d.querySelector('h3 span').style.color,d.textContent]}")
        rec('레어도','가방 상세에 등급 이름 색 + ★영웅 등급 + 효과 설명', r[0]!='' and '영웅 등급' in r[1] and '독' in r[1], str(r))
        await pg.screenshot(path=SP+'qa23_detail.png'); await ev(pg,"()=>__T.closePanel()")
        r=await ev(pg,"()=>{const R=__T.RECIPES.find(r=>r.out==='pickCrystal');return [R.at,R.req.map(x=>x[0]).join(','),__T.ITEMS.pickCrystal.tier]}")
        rec('장비','수정 곡괭이: 구리 제작대 + 수정 핵 필요, 3단계', r[0]=='forge' and 'golemCore' in r[1] and r[2]==3, str(r))
        # poison
        await ev(pg,ARENA)
        r=await ev(pg,"()=>{const G=__T.G,e=__T.mkEnemy('slimeP',104.5,110.5);e.hp=500;G.enemies.push(e);__T.hitEnemy(e,20,false,0,'poison');const h0=e.hp;for(let k=0;k<60;k++)__T.updateEnemies(1/30);return [h0,e.hp,!!e.poison]}")
        rec('효과','독: 2초 동안 계속 피해', r[1] < r[0]-3 and r[2], str(r))
        r=await ev(pg,"()=>{const G=__T.G,e=G.enemies[0];for(let k=0;k<120;k++)__T.updateEnemies(1/30);return [e.poison]}")
        rec('효과','독은 4초 뒤 사라짐', r[0] is None, str(r))
        r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;const e=__T.mkEnemy('slimeG',104.5,110.5);e.hp=3;G.enemies.push(e);__T.hitEnemy(e,1,false,0,'poison');const k0=G.stats.kills||0;for(let k=0;k<200;k++)__T.updateEnemies(1/30);return [G.enemies.includes(e),(G.stats.kills||0)-k0]}")
        rec('효과','독으로 쓰러지면 처치 수·드롭 처리', r==[False,1], str(r))
        # slow
        r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;const a=__T.mkEnemy('shroomy',110.5,110.5),b2=__T.mkEnemy('shroomy',110.5,114.5);a.hp=b2.hp=999;G.enemies.push(a,b2);G.p.x=104.5;G.p.y=112.5;__T.hitEnemy(a,1,false,0,'slow');a.kx=a.ky=0;const ax=a.x,bx=b2.x;for(let k=0;k<30;k++)__T.updateEnemies(1/30);return [+(ax-a.x).toFixed(2),+(bx-b2.x).toFixed(2)]}")
        rec('효과','끈적: 맞은 적이 절반 이하 속도', r[0] < r[1]*0.6 and r[1] > 0.5, str(r))
        # split
        r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;G.pshots.length=0;const a=__T.mkEnemy('slimeP',110.5,110.5),b2=__T.mkEnemy('slimeP',111.6,110.5);a.hp=b2.hp=999;G.enemies.push(a,b2);__T.hitEnemy(a,30,false,0,'split');const n=G.pshots.length;for(let k=0;k<20;k++)__T.updatePShots(1/60);return [n,999-b2.hp>=0,G.pshots.length]}")
        rec('효과','수정 파편: 3개가 튀고 금방 사라짐', r[0]==3 and r[2]==0, str(r))
        # bosses: poison works, slow does not change patterns, death by dot
        r=await ev(pg,"()=>{const G=__T.G;G.enemies.length=0;const b=G.bosses.queen;b.st='fight';b.hp=8;G.p.x=b.x+3;G.p.y=b.y;__T.hitBoss(b,5,false,'poison');__T.hitBoss(b,1,false,'slow');const s=b.slow;for(let k=0;k<400&&!G.bossDead.queen;k++){G.p.hp=999;G.p.inv=1;__T.updateBosses(1/30)}return [G.bossDead.queen,s,G.stats.uniq&&G.stats.uniq.queen,G.drops.some(d=>d.id==='daggerQueen')]}")
        rec('보스','독은 보스에게도 · 끈적은 보스에게 안 걸림 · 독으로 처치', r[0] is True and r[1] is None, str(r))
        rec('보스','버섯 여왕 전용 무기(영웅) 드롭', r[2]==1 and r[3], str(r))
        r=await ev(pg,"()=>{const G=__T.G;G.drops.length=0;const b=G.bosses.golem;b.st='fight';b.hp=1;__T.hitBoss(b,5,false);return [G.drops.map(d=>d.id).sort().join(',')]}")
        rec('보스','수정골렘: 전용 활 + 수정 핵', 'bowGolem' in r[0] and 'golemCore' in r[0], str(r))
        # old saves get the weapon once
        r=await ev(pg,"()=>{const G=__T.G;G.drops.length=0;const s=JSON.parse(JSON.stringify(__T.serialize()));s.bossDead={slime:true,queen:true,golem:false};delete s.stats.uniq;for(let i=0;i<s.inv.length;i++)s.inv[i]=null;__T.deserialize(s);const a=[__T.countItem('hammerSlime'),__T.countItem('daggerQueen'),__T.countItem('bowGolem')];const s2=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s2);return a.concat([__T.countItem('hammerSlime')])}")
        rec('저장','이미 잡은 보스의 무기는 불러올 때 한 번만 받음', r==[1,1,0,1], str(r))
        # real melee swing with a unique weapon applies effect
        await ev(pg,ARENA)
        r=await ev(pg,"()=>{const G=__T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'hammerSlime',c:1};G.sel=0;const e=__T.mkEnemy('shroomy',102.6,110.5);e.hp=999;G.enemies.push(e);G.p.face={x:1,y:0};__T.swingAttack();return [e.hp<999,e.slow>0]}")
        rec('효과','실제 휘두르기로 효과가 걸림', r==[True,True], str(r))
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=SP+'qa23_play.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
