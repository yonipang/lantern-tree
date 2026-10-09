import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
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
        await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'qa39_turtle.png')
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
        await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa39_spirit.png')
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
asyncio.run(main())
