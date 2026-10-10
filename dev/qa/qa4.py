import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
HOOK2=HOOK.replace("computeLight}","computeLight,mouseTile,targetTile,get VIEW(){return VIEW},get TP(){return TP},get DPR(){return DPR}}")
async def main():
    mkpage(SRC,'qa4.html',HOOK2)
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for (W,H) in [(1280,800),(1920,1080),(1024,768)]:
            ctx=await b.new_context(viewport={'width':W,'height':H}); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto('file://'+SP+'qa4.html'); await pg.wait_for_timeout(300); await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(1500)
            # clear an area around the player so every tile is targetable
            await pg.evaluate("()=>{const G=__T.G;for(let y=90;y<112;y++)for(let x=88;x<114;x++){const i=__T.idx(x,y);if(G.wall[i]!==8)G.wall[i]=0;if(!['treeP'].includes(G.objs.get(i)?.t))G.objs.delete(i);G.floor[i]=1}G.p.x=96.5;G.p.y=104.5;G.enemies.length=0}")
            await pg.wait_for_timeout(1200)
            # 1) every in-reach tile: put the mouse on the screen pixel where that tile is drawn
            ok=0; tot=0; bad=[]
            for dy in range(-3,4):
                for dx in range(-3,4):
                    if dx==0 and dy==0: continue
                    info=await pg.evaluate(f"()=>{{const G=__T.G,T=__T.TP,V=__T.VIEW,D=__T.DPR;const tx=Math.floor(G.p.x)+{dx},ty=Math.floor(G.p.y)+{dy};return [tx,ty,((tx+.5)*T-V.camX)/D,((ty+.5)*T-V.camY)/D, Math.hypot(tx+.5-G.p.x,ty+.5-G.p.y)<=2.4]}}")
                    if not info[4]: continue
                    await pg.mouse.move(info[2],info[3]); await pg.wait_for_timeout(60)
                    t=await pg.evaluate("()=>__T.targetTile()")
                    tot+=1
                    if t and t['x']==info[0] and t['y']==info[1] and 'far' not in t: ok+=1
                    else: bad.append((dx,dy,t))
            rec('마우스',f'{W}x{H} 닿는 칸 전부 커서 위치와 일치', ok==tot, f'{ok}/{tot} {bad[:2]}')
            # 2) screen edges & corners: target must be the reachable tile closest to the cursor, and marked far
            edge_ok=True; det=[]
            for (mx,my) in [(2,H/2),(W-2,H/2),(W/2,2),(W/2,H-2),(2,2),(W-2,H-2),(W*0.9,H*0.15)]:
                await pg.mouse.move(mx,my); await pg.wait_for_timeout(80)
                r=await pg.evaluate("()=>{const G=__T.G,t=__T.targetTile();const m=__T.mouseTile();let best=null,bd=1e9;const px=Math.floor(G.p.x),py=Math.floor(G.p.y);for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=px+dx,y=py+dy;if(!dx&&!dy)continue;if(Math.hypot(x+.5-G.p.x,y+.5-G.p.y)>2.4)continue;const d=Math.hypot(x+.5-m.mx,y+.5-m.my);if(d<bd){bd=d;best=[x,y]}}return [t.x,t.y,!!t.far,best, document.elementFromPoint(%f,%f)===document.querySelector('#cv')]}"%(mx,my))
                if r is None: continue
                if r[4]:
                    good = r[2] and [r[0],r[1]]==r[3]
                else:
                    good = not r[2]  # over UI: mouse aim off
                if not good: edge_ok=False; det.append(((mx,my),r))
            rec('마우스',f'{W}x{H} 화면 가장자리: 커서 방향의 가장 가까운 닿는 칸 선택', edge_ok, str(det[:2]) if det else '-')
            # 3) mouse over hotbar -> no stale aim
            hb=await pg.evaluate("()=>{const r=document.querySelector('#hotbar').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}")
            await pg.mouse.move(hb[0],hb[1]); await pg.wait_for_timeout(80)
            r=await pg.evaluate("()=>{const t=__T.targetTile();return !!t.far}")
            rec('마우스',f'{W}x{H} 단축칸 위에 커서 → 화면 조준 해제', r==False, str(r))
            # 4) placement far away goes to the highlighted tile
            await pg.evaluate("()=>{__T.addItem('torch',3);const G=__T.G;G.sel=G.inv.findIndex(s=>s&&s.id==='torch');}")
            await pg.mouse.move(W-30,H*0.62); await pg.wait_for_timeout(100)  # v42: the side column has one more button (장비)
            t=await pg.evaluate("()=>__T.decide().t")
            await pg.screenshot(path=SP+f'qa4_far_{W}.png')
            await pg.mouse.down(); await pg.wait_for_timeout(80); await pg.mouse.up(); await pg.wait_for_timeout(250)
            placed=await pg.evaluate(f"()=>__T.G.objs.get(__T.idx({t['x']},{t['y']}))?.t")
            rec('마우스',f'{W}x{H} 멀리 클릭 → 표시된 칸에 정확히 설치', placed=='torch', f"{t} → {placed}")
            # 5) lifted wall top picks the wall
            await pg.evaluate("()=>{const G=__T.G;G.wall[__T.idx(97,106)]=1;G.sel=G.inv.slice(0,9).findIndex(x=>!x)}")
            info=await pg.evaluate("()=>{const T=__T.TP,V=__T.VIEW,D=__T.DPR;return [((97+.5)*T-V.camX)/D,((106-0.12)*T-V.camY)/D]}")
            await pg.mouse.move(info[0],info[1]); await pg.wait_for_timeout(80)
            t=await pg.evaluate("()=>({t:__T.targetTile(),k:__T.decide().k})")
            rec('마우스',f'{W}x{H} 솟아 보이는 벽 윗면을 가리키면 그 벽 선택', t['t']['x']==97 and t['t']['y']==106 and t['k']=='mine', f"{t['k']} {t['t']}")
            rec('마우스',f'{W}x{H} 콘솔 오류 없음', not errs, errs[:1])
            await ctx.close()
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
