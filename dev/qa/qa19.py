import asyncio, sys, random, json
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
H2=HOOK.replace("computeLight}","computeLight,RECIPES,ENEMY,growTick,zoneTick,isSolid,maxHp,maxMp,stackMax,useSkill,refreshHotbar}")
GIVE="""()=>{const G=__T.G;for(let i=0;i<30;i++)G.inv[i]=null;const L=[['swordCopper',1],['spearCopper',1],['bowWood',1],['staffGlow',1],['shovel',1],['pickIron',1],['sapling',9],['berryBush',3],['cherryTree',2],['flowerBed',5],['waterPond',12],['floorCherry',12],['petalR',30],['petalB',30],['petalY',30],['petalW',30],['petalK',10],['dirt',60],['gMoss',40],['wood',99],['stone',60],['fiber',60],['copperBar',30],['ironBar',20],['crystal',20],['gWater',10],['berry',20],['rope',20],['resin',20],['gel',20]];for(const[id,c]of L)__T.addItem(id,c,false);
  const R=G.rpg;R.lv=8;R.sk={dash:2,spin:1,bolt:1,quake:1,heal:1,tough:1,lucky:2};R.slot=['spin','bolt'];G.p.mp=__T.maxMp();__T.refreshHotbar()}"""
CHECK="""()=>{const G=__T.G,p=G.p,bad=[];const fin=v=>Number.isFinite(v);
  if(!fin(p.x)||!fin(p.y)||p.x<0||p.y<0||p.x>200||p.y>200)bad.push('player pos '+p.x+','+p.y);
  if(!(p.hp>=0&&p.hp<=__T.maxHp()+0.001))bad.push('hp '+p.hp);if(!(p.mp>=0&&p.mp<=__T.maxMp()+0.001))bad.push('mp '+p.mp);if(!(p.hunger>=0&&p.hunger<=100))bad.push('hunger '+p.hunger);
  G.inv.forEach((s,i)=>{if(!s)return;if(!__T.ITEMS[s.id])bad.push('unknown item '+s.id);else if(!(Number.isInteger(s.c)&&s.c>0&&s.c<=__T.stackMax(s.id)))bad.push('bad count '+s.id+' '+s.c)});
  let unk=0,sample='';for(const [i,o] of G.objs){if(!o||!__T.OBJ[o.t]){unk++;sample=JSON.stringify(o)}}if(unk)bad.push('unknown objs '+unk+' '+sample);
  for(const e of G.enemies)if(!fin(e.x)||!fin(e.y)||!fin(e.hp)||!__T.ENEMY[e.k])bad.push('enemy '+e.k+' '+e.x+','+e.y);
  if(G.pshots.length>60)bad.push('pshots '+G.pshots.length);if((G.regen||[]).length>600)bad.push('regen '+G.regen.length);if(G.enemies.length>40)bad.push('enemies '+G.enemies.length);
  if(G.drops.length>400)bad.push('drops '+G.drops.length);
  return {bad,stuck:p.dead<=0&&__T.isSolid(Math.floor(p.x),Math.floor(p.y))&&!p.sit,pos:[+p.x.toFixed(1),+p.y.toFixed(1)]}}"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for touch,(w,h) in [(True,(390,844)),(False,(1280,800))]:
            nm='모바일' if touch else 'PC'
            ctx,pg,errs=await new_ctx(b,w,h,touch)
            await ev(pg,GIVE); bads=[]; stuckN=0; maxstuck=0
            spots=await ev(pg,"()=>{const G=__T.G;return [[G.p.x,G.p.y],...G.fzones.slice(0,6).map(z=>[z.x+.5,z.y+3.5]),[__T.BX-6,__T.BY],[__T.SA.x+6,__T.SA.y],[__T.CX+20,__T.CY+20]]}")
            random.seed(7 if touch else 11)
            for step in range(150):
                r=random.random()
                if step%15==0:
                    sx,sy=spots[(step//15)%len(spots)]
                    await ev(pg,f"()=>{{const G=__T.G;const tx={sx},ty={sy};for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){{const i=__T.idx(Math.floor(tx)+dx,Math.floor(ty)+dy);G.wall[i]=0;if(G.objs.get(i)&&__T.OBJ[G.objs.get(i).t].solid)G.objs.delete(i);if(G.floor[i]===__T.WATER)G.floor[i]=2}}G.p.x=Math.floor(tx)+.5;G.p.y=Math.floor(ty)+.5;G.p.hp=__T.maxHp();G.p.hunger=100}}")
                if r<0.30:
                    # move
                    if touch:
                        x0,y0=110,h-260; ang=random.random()*6.28; import math
                        await pg.dispatch_event('#cv','pointerdown',{'pointerId':9,'pointerType':'touch','isPrimary':True,'clientX':x0,'clientY':y0})
                        await pg.dispatch_event('#cv','pointermove',{'pointerId':9,'pointerType':'touch','isPrimary':True,'clientX':x0+math.cos(ang)*45,'clientY':y0+math.sin(ang)*45})
                        await pg.wait_for_timeout(random.randint(150,500))
                        await pg.dispatch_event('#cv','pointerup',{'pointerId':9,'pointerType':'touch','isPrimary':True,'clientX':x0,'clientY':y0})
                    else:
                        k=random.choice(['KeyW','KeyA','KeyS','KeyD']); await pg.keyboard.down(k); await pg.wait_for_timeout(random.randint(150,500)); await pg.keyboard.up(k)
                elif r<0.55:
                    if touch: await hold(pg, random.randint(80,900))
                    else:
                        await pg.mouse.move(random.randint(200,w-200),random.randint(200,h-200)); await pg.mouse.down(); await pg.wait_for_timeout(random.randint(80,700)); await pg.mouse.up()
                elif r<0.63:
                    i=random.randint(0,5); await ev(pg,f"()=>{{__T.G.sel={i};__T.refreshHotbar()}}")
                elif r<0.68:
                    await ev(pg,f"()=>__T.useSkill({random.randint(0,1)})")
                elif r<0.80:
                    kind=random.choice(['inv','craft','stat','map','menu'])
                    await ev(pg,f"()=>__T.openPanel('{kind}')"); await pg.wait_for_timeout(500)
                    if kind=='craft':
                        tab=random.choice(['nature','weapon','tool','build','furn','mat'])
                        try:
                            await pg.click(f'[data-a=tab][data-i={tab}]',timeout=1500); await pg.wait_for_timeout(150)
                            btn=pg.locator('.rc .btn.mk:not([disabled])')
                            if await btn.count(): await btn.first.click(timeout=1500)
                        except Exception as ex: pass
                    if kind=='inv':
                        await ev(pg,"()=>{const s=[...document.querySelectorAll('#sheet .slot[data-a=inv]')];const a=s[Math.floor(Math.random()*s.length)],bb=s[Math.floor(Math.random()*s.length)];const ra=a.getBoundingClientRect(),rb=bb.getBoundingClientRect();const o={pointerId:3,pointerType:'mouse',bubbles:true,button:0};a.dispatchEvent(new PointerEvent('pointerdown',{...o,clientX:ra.x+5,clientY:ra.y+5}));for(let k=1;k<=6;k++)window.dispatchEvent(new PointerEvent('pointermove',{...o,clientX:ra.x+5+(rb.x-ra.x)*k/6,clientY:ra.y+5+(rb.y-ra.y)*k/6}));window.dispatchEvent(new PointerEvent('pointerup',{...o,clientX:rb.x+5,clientY:rb.y+5}))}")
                    await ev(pg,"()=>__T.closePanel()")
                elif r<0.86:
                    await ev(pg,"()=>{const G=__T.G;G.time+=90}")  # fast-forward: regrowth, respawn, crops
                else:
                    await pg.wait_for_timeout(400)
                c=await ev(pg,CHECK)
                if c['bad']: bads.append((step,c['bad']))
                if c['stuck']: stuckN+=1; maxstuck=max(maxstuck,stuckN)
                else: stuckN=0
            rec('스트레스',f'{nm} 150단계 무작위 플레이 상태 이상 없음', not bads, str(bads[:4]))
            rec('스트레스',f'{nm} 벽·물체 속에 갇히지 않음', maxstuck<3, f'최대 연속 {maxstuck}')
            r=await ev(pg,"()=>{try{const s=JSON.stringify(__T.serialize());__T.deserialize(JSON.parse(s));return [s.length,true]}catch(e){return [0,String(e)]}}")
            rec('스트레스',f'{nm} 플레이 뒤 저장→불러오기', r[1] is True, str(r))
            # fps
            fps=await pg.evaluate("()=>new Promise(res=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else res(n/3)};requestAnimationFrame(f)})")
            rec('성능',f'{nm} 프레임 (헤드리스)', fps>30, f'{fps:.0f} fps')
            r=await ev(pg,"()=>{const t0=performance.now();for(let k=0;k<20;k++)__T.growTick();return [(performance.now()-t0)/20,__T.G.objs.size]}")
            rec('성능',f'{nm} 자라기 검사 시간', r[0]<4, f'{r[0]:.2f}ms / 물체 {r[1]}개')
            rec('기능',f'{nm} 스트레스 중 콘솔 오류 없음', not errs, errs[:4])
            await pg.screenshot(path=SP+f'qa19_{nm}.png'); await ctx.close()
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
