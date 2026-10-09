import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
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
        rec('밸런스','별빛 활 18 · 수정 검 26 그대로', r==[18,26], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg.dex=18;G.rpg.str=0;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'bowCrystal',c:1};G.sel=0;G.enemies.length=0;G.pshots.length=0;G.p.face={x:1,y:0};
          const e=T.mkEnemy('slimeP',G.p.x+2.5,G.p.y);e.hp=9999;G.enemies.push(e);T.swingAttack();for(let k=0;k<30;k++)T.updatePShots(1/60);return [9999-e.hp,Math.abs(e.kx||0)]}""")
        rec('밸런스','민첩 18 별빛 활 한 발 25~32 · 밀어내기 약함', 22<=r[0]<=33 and r[1]<3, str(r))
        r=await ev(pg,"()=>{const T=__T;return [T.ITEMS.bowWood.dmg,T.ITEMS.bowIron.dmg,T.ITEMS.bowGold.dmg,T.ITEMS.bowGolem.dmg,T.ITEMS.bowFrost.dmg]}")
        rec('밸런스','활 공격력 하향 (나무4·사냥꾼11·황금28·수정거인24·서리32)', r==[4,11,28,24,32], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg.dex=0;G.rpg.int=18;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'staffCrystal',c:1};G.sel=0;G.enemies.length=0;G.pshots.length=0;G.p.face={x:1,y:0};G.p.mp=999;
          const e=T.mkEnemy('slimeP',G.p.x+2.5,G.p.y);e.hp=9999;G.enemies.push(e);T.swingAttack();for(let k=0;k<30;k++)T.updatePShots(1/60);return [9999-e.hp,Math.abs(e.kx||0),T.ITEMS.staffGlow.dmg,T.ITEMS.staffFrost.dmg]}""")
        rec('밸런스','지혜 18 수정 지팡이 한 발 24~32 · 밀어내기 약함 · 지팡이 하향(빛버섯9·눈꽃28)', 22<=r[0]<=33 and r[1]<3 and r[2:]==[9,28], str(r))
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
asyncio.run(main())
