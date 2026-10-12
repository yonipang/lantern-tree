# 기본 조작·화면: 시작 아이템·레이아웃·맨손·도구·낚시(qa2), 밟기, 마우스·클릭 방향·키보드·방향키, 타이틀, 성능, 손에 든 물건, 손그림
# 실행: python3 dev/qa/run.py basics   (테스트 하나만: python3 dev/qa/run.py qa2)
from harness import *


def qa2():
    async def main():
        mkpage(SRC,'qa.html')
        async with async_playwright() as p:
            b=await p.chromium.launch()
            # ---------- A. layout ----------
            for (w,h,touch,name) in [(390,844,True,'iPhone 14'),(360,640,True,'small Android'),(430,932,True,'iPhone Pro Max'),(375,667,True,'iPhone SE'),(844,390,True,'phone landscape'),(1280,800,False,'laptop'),(1024,768,False,'small desktop'),(1920,1080,False,'FHD')]:
                ctx,pg,errs=await new_ctx(b,w,h,touch)
                r=await ev(pg,LAYOUT_JS)
                await pg.screenshot(path=SP+f'qa_layout_{w}x{h}.png')
                rec('레이아웃',f'{name} {w}x{h} 겹침 없음', not r['over'], ','.join(r['over']) or '-')
                rec('레이아웃',f'{name} 화면 밖 요소 없음', not r['out'] and not r['hscroll'], ','.join(r['out']) or '-')
                rec('레이아웃',f'{name} 버튼 크기 ≥44px', r['minSlot']>=44 and (not touch or r['actW']>=88), f"slot {r['minSlot']}px, action {round(r['actW'])}px")
                if errs: rec('레이아웃',f'{name} 콘솔 오류', False, errs[0])
                await ctx.close()
            # ---------- A2. layout with the pickup button visible ----------
            for (w,h,name) in [(390,844,'iPhone 14'),(360,640,'small Android'),(375,667,'iPhone SE'),(844,390,'phone landscape')]:
                ctx,pg,errs=await new_ctx(b,w,h,True)
                await ev(pg,"()=>{const G=__T.G;G.p.x=__T.CX-2.5;G.p.y=__T.CY+2.5;G.p.face={x:0,y:1}}"); await pg.wait_for_timeout(300)
                r=await ev(pg,LAYOUT_JS)
                vis=await ev(pg,"()=>!document.querySelector('#subBtn').hidden")
                await pg.screenshot(path=SP+f'qa2_sub_{w}x{h}.png')
                rec('레이아웃',f'{name} 회수 버튼 표시 시 겹침 없음', vis and not r['over'] and not r['out'], (','.join(r['over']+r['out']) or '-')+f' visible={vis}')
                await ctx.close()
            # ---------- B. functional (mobile) ----------
            ctx,pg,errs=await new_ctx(b,390,844,True)
            CX,CY=100,100
            r=await ev(pg,"()=>[__T.G.sel, __T.G.inv.filter(x=>x).map(s=>s.id).join(','), !!document.querySelector('#toolbelt'), __T.G.equip.weapon&&__T.G.equip.weapon.id]")
            rec('되돌림','시작 아이템: 베리·씨앗·나무 검(단축칸 3번, v48) + 가방에 나무 곡괭이, 빈손(4번 칸)으로 시작, 도구 칸 없음', r[0]==3 and r[1]=='berry,berrySeed,swordWood,pickWood' and r[3] is None and not r[2], str(r))
            recipes=await ev(pg,"()=>Object.keys(__T.ITEMS).filter(k=>/^axeWood$|rodCrystal/.test(k)||__T.ITEMS[k].kind==='axe').join(',')")
            rec('되돌림','도구 도끼·수정 낚싯대 항목 제거됨 (도끼는 v42에서 무기로 다시 생김, 구리 낫은 v33)', recipes=='', recipes or '-')
            # bare hand chop
            await ev(pg,"()=>{const G=__T.G;G.inv=G.inv.map(s=>s&&s.id==='pickWood'?null:s)}")
            await stand(pg,CX+6.5,CY-0.4,1,0)
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().icon]")
            rec('맨손 채집','곡괭이 없이 뿌리기둥 → 베기 가능', r==['chop','hand'], str(r))
            await hold(pg,2600)
            rec('맨손 채집','맨손으로 뿌리기둥이 베어짐(느림)', await ev(pg,"()=>{const o=__T.G.objs.get(__T.idx(107,99));return !o||o.t==='stump'}"), '')
            # bare hand vs pick damage on dirt wall
            wall=await ev(pg,"""()=>{const T=__T,G=T.G;for(let r=9;r<30;r++)for(let dy=-8;dy<9;dy++){const x=T.CX+r,y=T.CY+dy;if(G.wall[T.idx(x,y)]===1&&!G.wall[T.idx(x-1,y)]&&G.floor[T.idx(x-1,y)]!==T.WATER&&!G.objs.get(T.idx(x-1,y)))return [x,y]}return null}""")
            await stand(pg,wall[0]-0.5,wall[1]+0.5,1,0)
            await tap(pg,1)
            dh=await ev(pg,f"()=>__T.G.wdmg.get(__T.idx({wall[0]},{wall[1]}))||0")
            rec('맨손 채집','곡괭이 없이 흙벽 캐기 가능 (한 번에 0.5)', dh==0.5, str(dh))
            await ev(pg,f"()=>{{__T.G.wdmg.delete(__T.idx({wall[0]},{wall[1]}));__T.addItem('pickWood',1)}}")
            await tap(pg,1)
            d1=await ev(pg,f"()=>__T.G.wdmg.get(__T.idx({wall[0]},{wall[1]}))||0")
            await ev(pg,f"()=>{{__T.G.wdmg.delete(__T.idx({wall[0]},{wall[1]}));__T.addItem('pickCopper',1)}}")
            await tap(pg,1)
            d2=await ev(pg,f"()=>__T.G.wdmg.get(__T.idx({wall[0]},{wall[1]}))||0")
            rec('도구 강화','나무 곡괭이는 맨손의 2배, 구리 곡괭이는 4배 피해 (자동 적용)', d1==1 and d2==2, f'맨손 0.5 / 나무 {d1} / 구리 {d2}')
            rec('도구 강화','단축칸에서 고르지 않아도 가방의 가장 좋은 곡괭이 사용', await ev(pg,"()=>__T.bestPick().id")=='pickCopper' and await ev(pg,"()=>{const s=__T.G.inv[__T.G.sel];return !s||!/^pick/.test(s.id)}"), '')
            await ev(pg,"()=>{const G=__T.G;G.inv=G.inv.map(s=>s&&/^pick/.test(s.id)?null:s)}")
            await ev(pg,f"()=>{{__T.G.wall[__T.idx({wall[0]},{wall[1]})]=2;__T.G.wdmg.clear()}}"); await tap(pg,1)
            rec('도구 강화','돌벽은 맨손으로 안 캐짐(구리 곡괭이 필요 안내)', not await ev(pg,f"()=>__T.G.wdmg.get(__T.idx({wall[0]},{wall[1]}))"), '')
            await ev(pg,"()=>{__T.addItem('pickWood',1)}")
            # grass / crop by hand
            await ev(pg,f"()=>{{const G=__T.G;G.objs.set(__T.idx({CX+3},{CY-7}),{{t:'grass'}});}}")
            await stand(pg,CX+3.5,CY-5.6,0,-1)
            await tap(pg,1)
            rec('맨손 채집','이끼풀 베기', not await ev(pg,f"()=>!!__T.G.objs.get(__T.idx({CX+3},{CY-7}))"), '')
            await ev(pg,f"()=>{{const G=__T.G;G.objs.set(__T.idx({CX-6},{CY-3}),{{t:'cropBerry',p:-999}});}}")
            await stand(pg,CX-5.5,CY-1.6,0,-1)
            await tap(pg,1)
            rec('맨손 채집','다 자란 작물 수확', not await ev(pg,f"()=>!!__T.G.objs.get(__T.idx({CX-6},{CY-3}))"), '')
            # fishing
            await stand(pg,CX+2.5,CY-3.6,1,0)
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('낚시','낚싯대 없이 물 → 안내', r==['info','낚싯대 필요'], str(r))
            await ev(pg,"()=>{__T.addItem('rod',1)}"); await stand(pg,CX+2.5,CY-3.6,1,0)
            rec('낚시','낚싯대가 가방에 있으면 바로 낚시(고를 필요 없음)', await ev(pg,"()=>__T.decide().k")=='fish', '')
            await tap(pg,1)
            caught=False
            for _ in range(80):
                if await ev(pg,"()=>__T.G.fish&&__T.G.fish.st==='bite'"):
                    await tap(pg,1,100); caught=True; break
                await pg.wait_for_timeout(100)
            rec('낚시','입질 때 당기면 물고기 획득', caught and await ev(pg,"()=>__T.G.stats.fishCaught>=1"), '')
            # interactions + sub pickup
            await stand(pg,CX-0.5,CY+3.6,-1,0)
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl,!!__T.decide().sub]")
            await pg.wait_for_timeout(100)
            rec('상호작용','탁자 → 큰 버튼 [차 마시기], 회수 버튼 표시', r==['use','차 마시기',True] and await ev(pg,"()=>!document.querySelector('#subBtn').hidden"), str(r))
            await pg.tap('#subBtn'); await pg.wait_for_timeout(250)
            rec('상호작용','회수 버튼으로 탁자가 가방에', await ev(pg,"()=>!__T.G.objs.get(__T.idx(98,103))&&__T.countItem('table')===1"), '')
            await ev(pg,f"()=>{{const G=__T.G;G.p.x={CX-3+.5};G.p.y={CY+4.5};G.p.face={{x:0,y:-1}};G.p.hp=50}}"); await pg.wait_for_timeout(120)
            rec('상호작용','의자 앞 → 앉기', await ev(pg,"()=>__T.decide().lbl")=='앉기', '')
            await tap(pg,1); await pg.wait_for_timeout(1800)
            r=await ev(pg,"()=>[!!__T.G.p.sit, __T.G.p.hp, __T.decide().lbl]")
            await pg.screenshot(path=SP+'qa2_sit.png')
            rec('상호작용','앉으면 체력 회복, 버튼 [일어나기]', r[0] and r[1]>50 and r[2]=='일어나기', str(r))
            await pg.keyboard.down('KeyS'); await pg.wait_for_timeout(300); await pg.keyboard.up('KeyS')
            rec('상호작용','이동하면 일어남', not await ev(pg,"()=>!!__T.G.p.sit"), '')
            await ev(pg,f"()=>{{const G=__T.G;G.objs.set(__T.idx({CX-6},{CY+6}),{{t:'bed'}});G.wall[__T.idx({CX-6},{CY+7})]=0;G.objs.delete(__T.idx({CX-6},{CY+7}));G.p.x={CX-5.5};G.p.y={CY+7.5};G.p.face={{x:0,y:-1}};G.p.hp=40}}"); await pg.wait_for_timeout(150)
            rec('상호작용','침대 앞 → 잠자기', await ev(pg,"()=>__T.decide().lbl")=='잠자기', '')
            await tap(pg,1); await pg.wait_for_timeout(3300)
            r=await ev(pg,"()=>[__T.G.p.hp, JSON.stringify(__T.G.spawnPt), document.querySelector('#fade').hidden]")
            rec('상호작용','잠자고 나면 체력 가득·부활 지점 저장', r[0]==100 and r[1]==f'{{"x":{CX-6},"y":{CY+6}}}' and r[2], str(r))
            await stand(pg,CX+3.5,CY+2.5,1,0)
            l0=await ev(pg,"()=>{__T.computeLight();return __T.lightAt(104,102)}")
            r=await ev(pg,"()=>__T.decide().lbl"); await tap(pg,1); await pg.wait_for_timeout(200)
            l1=await ev(pg,"()=>{__T.computeLight();return __T.lightAt(104,102)}")
            rec('상호작용','램프 끄기 → 어두워짐', r=='끄기' and l1<l0-0.1, f'{l0:.2f}→{l1:.2f}')
            await tap(pg,1)
            for (obj,lbl,check) in [('cushion','쓰다듬기',None),('shroomWardrobe','꾸미기',"(()=>{const ok=document.querySelector('#sheet h2')?.textContent==='꾸미기';__T.closePanel();return ok})()"),('cryFountain','소원 빌기',"__T.G.luck>__T.G.time"),('shelf','책 읽기',None),('cryMirror','거울 보기',None),('fishTank','밥 주기',None),('plant','물 주기',None),('sporeLamp','끄기',"__T.G.objs.get(__T.idx(110,110)).off===true"),('rug','회수',"__T.countItem('rug')>=1")]:
                await ev(pg,f"()=>{{const G=__T.G;for(let y=108;y<113;y++)for(let x=108;x<113;x++){{G.wall[__T.idx(x,y)]=0;G.objs.delete(__T.idx(x,y));if(G.floor[__T.idx(x,y)]===__T.WATER)G.floor[__T.idx(x,y)]=1}}G.objs.set(__T.idx(110,110),{{t:'{obj}'}})}}")
                await stand(pg,109.5,110.5,1,0)
                got=await ev(pg,"()=>__T.decide().lbl"); await tap(pg,1); await pg.wait_for_timeout(500 if obj=='shroomWardrobe' else 0)
                rec('상호작용',f'{obj} → {lbl}', got==lbl and (check is None or await ev(pg,"()=>"+check)), got)
            s1=await ev(pg,"()=>{__T.G.look={hair:'curly',hc:3,eye:1,outfit:'robe',oc:2,hat:'ribbon'};__T.G.char='custom';const s=JSON.stringify(__T.serialize());__T.deserialize(JSON.parse(s));return __T.G.look.hair+__T.G.char}")
            rec('저장','꾸민 모습 저장/불러오기 유지', s1=='curlycustom', str(s1))
            await ev(pg,"()=>{__T.G.objs.set(__T.idx(110,110),{t:'chest',items:[{id:'wood',c:1}].concat(Array(17).fill(null))})}"); await stand(pg,109.5,110.5,1,0)
            r=await ev(pg,"()=>[__T.decide().k,!!__T.decide().sub]")
            rec('상호작용','물건 든 상자 → 열기만, 회수 버튼 없음', r==['open',False], str(r))
            await ev(pg,"()=>{__T.G.objs.set(__T.idx(110,110),{t:'bench'})}")
            r=await ev(pg,"()=>[__T.decide().k,!!__T.decide().sub]")
            rec('상호작용','작업대 → 열기 + 회수 버튼', r==['open',True], str(r))
            # crafting list order and format
            await ev(pg,"()=>{__T.addItem('wood',14);__T.addItem('fiber',6);__T.addItem('rope',2);__T.addItem('gel',2)}")
            await pg.tap('#bCraft'); await pg.wait_for_timeout(600); await pg.tap('[data-a=tab][data-i=all]'); await pg.wait_for_timeout(200)  # v61: tools moved to the 장비제작대
            await pg.screenshot(path=SP+'qa2_craft.png')
            r=await ev(pg,"()=>[[...document.querySelectorAll('.rc .rn')].map(e=>e.childNodes[0].textContent).slice(0,3).join(','), document.querySelector('.ing').textContent]")
            import re
            rec('제작','재료 표기 "나무 14/4" 형식', re.search(r'\d+/\d+$', r[1]) is not None, r[1])
            rec('제작','만들 수 있는 항목이 위로 (이전 정렬, v61: 낚싯대는 장비제작대로 가서 작업대가 맨 위)', r[0].startswith('작업대'), r[0])
            await ev(pg,"()=>__T.closePanel()")
            # PC R key pickup
            p3=await (await b.new_context(viewport={'width':1280,'height':800})).new_page()
            p3.on('pageerror',lambda e: errs.append(str(e)))
            await p3.goto(URL+'qa.html'); await p3.wait_for_timeout(300); await p3.click("#btnNew"); await p3.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await p3.wait_for_timeout(300)
            await p3.evaluate("()=>{const G=__T.G;G.p.x=__T.CX-0.5;G.p.y=__T.CY+3.6;G.p.face={x:-1,y:0}}"); await p3.wait_for_timeout(300)
            await p3.keyboard.press('KeyR'); await p3.wait_for_timeout(200)
            rec('PC','R 키로 가구 회수', await p3.evaluate("()=>__T.countItem('table')===1"), '')
            await p3.close()
            # saves from every earlier version
            for (src,name,hook) in [(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','old','index.v1.html'),'v1',"window.__T={get G(){return G},serialize};window.claude?.hot?.snapshot"),(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','old','index.v2.html'),'v2',"window.__T={get G(){return G},serialize};window.claude?.hot?.snapshot"),(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','old','index.v3.html'),'v3(전용 도구)',"window.__T={get G(){return G},serialize};window.claude?.hot?.snapshot")]:
                mkpage(src,'old_'+name[:2]+'.html',hook)
                p2=await ctx.new_page(); await p2.goto(URL+'old_'+name[:2]+'.html'); await p2.wait_for_timeout(300); await p2.click("#btnNew"); await p2.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await p2.wait_for_timeout(300)
                old=await p2.evaluate("()=>{const G=__T.G;try{G.sel=G.sel}catch(e){};return JSON.stringify(__T.serialize())}"); await p2.close()
                r=await ev(pg,"(s)=>{__T.deserialize(JSON.parse(s));const G=__T.G;return [G.sel, G.inv.filter(x=>x).map(x=>x.id).concat(G.equip.weapon?[G.equip.weapon.id]:[]).join(','), [...G.objs.values()].every(o=>__T.OBJ[o.t])]}", old)
                await pg.wait_for_timeout(600)
                rec('저장',f'{name} 세이브 불러오기 정상', r[0]<9 and all(i in r[1] for i in ['pickWood','swordWood']) and 'axe' not in r[1] and 'sickle' not in r[1] and r[2] and not errs, str(r[:2]))
            await ev(pg,"()=>{const T=__T;T.deserialize(JSON.parse(JSON.stringify(T.serialize())))}")
            for bk in ['slime','queen','golem']:
                await ev(pg,f"()=>{{const T=__T,G=T.G;T.addItem('swordIron',1);const k=G.inv.findIndex(s=>s&&s.id==='swordIron'),t0=G.inv[0];G.inv[0]=G.inv[k];G.inv[k]=t0;G.sel=0;/* v48: hold the weapon */const h=T.BOSSES.{bk}.home();G.p.x=h.x;G.p.y=h.y+5;G.p.hp=100;G.p.sit=null}}")
                await pg.wait_for_timeout(1800)
                st=await ev(pg,f"()=>__T.G.bosses.{bk}.st")
                for _ in range(8):
                    await ev(pg,f"()=>{{const G=__T.G,b=G.bosses.{bk};b.hp=Math.min(b.hp,3);b.z=0;b.air=0;G.p.hp=100;G.p.x=b.x;G.p.y=b.y+1.3;G.p.face={{x:0,y:-1}}}}")
                    await tap(pg,1,250)
                    if await ev(pg,f"()=>__T.G.bossDead.{bk}"): break
                rec('회귀',f'보스 {bk} 깨어남·처치', st=='fight' and await ev(pg,f"()=>__T.G.bossDead.{bk}"), st)
            await ev(pg,f"()=>{{const G=__T.G;G.objs.set(__T.idx({CX-6},{CY+6}),{{t:'bed'}});G.spawnPt={{x:{CX-6},y:{CY+6}}};G.wall[__T.idx({CX-6},{CY+7})]=0;G.objs.delete(__T.idx({CX-6},{CY+7}));G.p.hp=1;G.p.inv=0;G.p.hunger=0}}")
            await pg.wait_for_timeout(5200)
            r=await ev(pg,"()=>[__T.G.p.hp>0, __T.G.p.x.toFixed(1)]")
            rec('회귀','기절 후 침대에서 부활', r[0] and abs(float(r[1])-(CX-5.5))<1.6, str(r))
            # grass draw order (screenshot for review)
            await ev(pg,f"()=>{{const G=__T.G;G.objs.set(__T.idx({CX+2},{CY+6}),{{t:'grass'}});G.wall[__T.idx({CX+2},{CY+6})]=0;G.p.x={CX+2.5};G.p.y={CY+6.6};G.p.face={{x:0,y:1}};G.enemies.length=0}}")
            await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'qa2_grass.png')
            rec('기능','기능 테스트 중 콘솔 오류 없음', not errs, (errs[:2] if errs else ''))
            await ctx.close()
            # ---------- C. soak ----------
            for (w,h,touch,label,secs) in [(390,844,True,'모바일',60),(1280,800,False,'PC',40)]:
                ctx,pg,errs=await new_ctx(b,w,h,touch)
                await ev(pg,"()=>{window.__ft=[];let l=performance.now();const f=t=>{window.__ft.push(t-l);l=t;requestAnimationFrame(f)};requestAnimationFrame(f)}")
                await ev(pg,"()=>{['rod','swordCopper','dirt','torch','chair','berry','bed','lampShroom'].forEach(i=>__T.addItem(i,5))}")
                end=secs*1000; t=0; rnd=random.Random(7)
                keysd=['KeyW','KeyA','KeyS','KeyD']
                while t<end:
                    kk=rnd.choice(keysd); await pg.keyboard.down(kk)
                    if rnd.random()<0.6:
                        if touch: await pg.dispatch_event('#actBtn','pointerdown',{'pointerId':1,'pointerType':'touch','isPrimary':True})
                        else: await pg.keyboard.down('Space')
                    d=rnd.randint(150,500); await pg.wait_for_timeout(d); t+=d
                    await pg.keyboard.up(kk)
                    if touch: await pg.dispatch_event('#actBtn','pointerup',{'pointerId':1,'pointerType':'touch','isPrimary':True})
                    else: await pg.keyboard.up('Space')
                    r=rnd.random()
                    if r<0.12: await pg.keyboard.press(rnd.choice(['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','KeyR']))
                    elif r<0.15:
                        await ev(pg,"()=>{const p=document.querySelector('#sheetWrap');if(!p.hidden)__T.closePanel()}")
                    elif r<0.17:
                        await ev(pg,"()=>{const G=__T.G;G.p.x=40+Math.random()*120;G.p.y=40+Math.random()*120;let n=0;while(n++<200){const x=Math.floor(G.p.x),y=Math.floor(G.p.y);if(!G.wall[__T.idx(x,y)]&&G.floor[__T.idx(x,y)]!==__T.WATER&&!G.objs.get(__T.idx(x,y)))break;G.p.x=40+Math.random()*120;G.p.y=40+Math.random()*120}}")
                    await ev(pg,"()=>{const G=__T.G;if(G.p.hp<30)G.p.hp=100;G.p.hunger=100}")
                st=await ev(pg,"()=>{const a=window.__ft.slice(30).sort((x,y)=>x-y);return [a.length,a[Math.floor(a.length/2)],a[Math.floor(a.length*0.95)]]}")
                save=await ev(pg,"()=>JSON.stringify(__T.serialize()).length")
                rec('장시간',f'{label} {secs}초 랜덤 플레이 오류 없음', not errs, (errs[:2] if errs else f'프레임 {st[0]}개, 중앙값 {st[1]:.1f}ms, 95% {st[2]:.1f}ms, 세이브 {save//1024}KB'))
                await pg.screenshot(path=SP+f'qa_soak_{label}.png')
                await ctx.close()
            await b.close()
        json.dump(RES,open(SP+'qa_results.json','w'),ensure_ascii=False)
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa3():
    import asyncio, sys
    async def main():
        mkpage(SRC,'qa.html')
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            CX,CY=100,100
            async def setup(obj, extra=''):
                await ev(pg,f"()=>{{const G=__T.G;for(let y=108;y<114;y++)for(let x=106;x<114;x++){{const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}}G.objs.set(__T.idx(110,110),{obj});G.enemies.length=0;G.fish=null;{extra}}}")
            for (name,obj,lbl,gone) in [('이끼풀',"{t:'grass'}",'베기',True),('빛버섯',"{t:'glow'}",'줍기',True),('다 자란 작물',"{t:'cropBerry',p:-999}",'수확',True)]:
                for (px,py,fx,fy,desc) in [(110.5,110.5,0,1,'가운데'),(110.2,110.85,1,0,'아래쪽 가장자리'),(110.8,110.15,0,-1,'위쪽 가장자리')]:
                    await setup(obj, f"G.p.x={px};G.p.y={py};G.p.face={{x:{fx},y:{fy}}};G.sel=5")
                    await pg.wait_for_timeout(120)
                    r=await ev(pg,"()=>[__T.decide().lbl, JSON.stringify(__T.decide().t)]")
                    await tap(pg,1); await pg.wait_for_timeout(150)
                    g=await ev(pg,"()=>!__T.G.objs.get(__T.idx(110,110))")
                    rec('밟고 선 채 채집',f'{name} 위({desc})에 서서 {lbl}', r[0]==lbl and r[1]=='{"x":110,"y":110}' and g==gone, f'{r[0]} {r[1]} 사라짐={g}')
            # facing something takes priority over the tile underfoot
            await setup("{t:'grass'}","G.objs.set(__T.idx(111,110),{t:'root'});G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0};G.sel=5")
            await pg.wait_for_timeout(120)
            r=await ev(pg,"()=>JSON.stringify(__T.decide().t)")
            rec('밟고 선 채 채집','앞에 뿌리기둥이 있으면 앞쪽이 우선', r=='{"x":111,"y":110}', r)
            await setup("{t:'grass'}","__T.addItem('berrySeed',3);G.sel=G.inv.findIndex(s=>s&&s.id==='berrySeed');G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0}")
            await pg.wait_for_timeout(120)
            r=await ev(pg,"()=>[__T.decide().k, JSON.stringify(__T.decide().t)]")
            rec('밟고 선 채 채집','씨앗을 들고 앞이 빈 흙이면 심기가 우선', r==['place','{"x":111,"y":110}'], str(r))
            # standing on a rug / torch must NOT trigger pickup of the thing underfoot
            await setup("{t:'rug'}","G.p.x=110.5;G.p.y=110.5;G.p.face={x:1,y:0};G.sel=5")
            await pg.wait_for_timeout(120)
            rec('밟고 선 채 채집','러그 위에 서 있어도 러그를 회수하지 않음', await ev(pg,"()=>__T.decide().k")=='swing', await ev(pg,"()=>__T.decide().k"))
            # visual: player on grass at several sub-positions
            shots=[]
            for k,(px,py) in enumerate([(110.5,110.3),(110.5,110.6),(110.5,110.95),(110.5,111.1)]):
                await setup("{t:'grass'}", f"G.objs.set(__T.idx(110,111),{{t:'grass'}});G.p.x={px};G.p.y={py};G.p.face={{x:0,y:1}}")
                await pg.wait_for_timeout(500); await pg.screenshot(path=SP+f'qa3_g{k}.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:2] if errs else '')
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa4():
    import asyncio, sys
    HOOK2=HOOK.replace("computeLight}","computeLight,mouseTile,targetTile,get VIEW(){return VIEW},get TP(){return TP},get DPR(){return DPR}}")
    async def main():
        mkpage(SRC,'qa4.html',HOOK2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            for (W,H) in [(1280,800),(1920,1080),(1024,768)]:
                ctx=await b.new_context(viewport={'width':W,'height':H}); pg=await ctx.new_page(); errs=[]
                pg.on('pageerror',lambda e: errs.append(str(e)))
                await pg.goto(URL+'qa4.html'); await pg.wait_for_timeout(300); await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(1500)
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
    return main


def qa6():
    # qa5가 만든 qa.html·exported.json을 이어서 써요 (run.py가 qa5 바로 다음에 같은 폴더에서 돌려요)
    import asyncio, sys
    async def main():
        async with async_playwright() as p:
            b=await p.chromium.launch(); errs=[]
            ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
            pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(400); await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(500)
            await ev(pg,"()=>{__T.G.p.x=60.5;localStorage.setItem('lantern-tree-save-v1',JSON.stringify(__T.serialize()))}")
            await pg.reload(); await pg.wait_for_timeout(600)
            async with pg.expect_file_chooser() as fc: await pg.tap('#btnImport')
            await (await fc.value).set_files(SP+'exported.json'); await pg.wait_for_timeout(500)
            await pg.screenshot(path=SP+'qa6_ask.png')
            vis=await ev(pg,"()=>!document.querySelector('#impAsk').hidden")
            rec('타이틀','기존 세이브가 있으면 확인창', vis)
            await pg.tap('#impAsk [data-imp=yes]'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[document.querySelector('#title').hidden, Math.round(__T.G.p.x*10)/10, JSON.parse(localStorage.getItem('lantern-tree-backups')||'[]').some(b=>b.reason==='세이브 파일 불러오기 전')]")
            rec('타이틀','불러오고 바로 시작 + 이전 세이브 백업', r[0] and r[1]==105.5 and r[2], str(r))
            await pg.screenshot(path=SP+'qa6_after.png')
            # fresh device with no save
            ctx2=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
            pg2=await ctx2.new_page(); pg2.on('pageerror',lambda e: errs.append(str(e)))
            await pg2.goto(URL+'qa.html'); await pg2.wait_for_timeout(500)
            async with pg2.expect_file_chooser() as fc: await pg2.tap('#btnImport')
            await (await fc.value).set_files(SP+'exported.json'); await pg2.wait_for_timeout(600)
            r=await ev(pg2,"()=>[document.querySelector('#title').hidden, Math.round(__T.G.p.x*10)/10]")
            rec('타이틀','새 기기: 확인 없이 바로 불러와 시작', r==[True,105.5], str(r))
            # mobile menu look
            await ev(pg2,"()=>__T.openPanel('menu')"); await pg2.wait_for_timeout(500); await pg2.screenshot(path=SP+'qa6_menu.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa16():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,TPv:()=>TP,VIEW:()=>VIEW,DPR:()=>DPR,mouse:()=>mouse,aim:()=>aimMouse(),cam:()=>cam,mw:()=>mouseWorld()}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,1280,800,False)
            await ev(pg,"()=>{const G=__T.G;for(let y=104;y<116;y++)for(let x=104;x<118;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.wall[__T.idx(109,110)]=1;G.enemies.length=0;G.enemies.push({k:'slimeG',x:111.3,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});G.p.x=110.5;G.p.y=110.5;__T.cam().x=110.5;__T.cam().y=110.5}")
            await pg.wait_for_timeout(1500)
            async def screen(wx,wy): return await ev(pg,f"()=>{{const V=__T.VIEW(),T=__T.TPv(),D=__T.DPR();return [({wx}*T-V.camX)/D,({wy}*T-V.camY)/D]}}")
            # 화면(카메라)은 마우스 쪽으로 천천히 따라 움직여요. 마우스를 옮긴 뒤 카메라가 멈춰 마우스가 목표 칸을 정확히 가리킬 때 클릭해야
            # 결과가 흔들리지 않아요 (안 기다리면 클릭하는 동안 가리키는 곳이 캐릭터 쪽으로 밀려 들어와 방향이 「아래」가 되기도 했어요)
            async def aim_at(wx,wy):
                for _ in range(40):
                    x,y=await screen(wx,wy); await pg.mouse.move(x,y); await pg.wait_for_timeout(80)
                    m=await ev(pg,"()=>__T.mw()")
                    if abs(m['x']-wx)<0.03 and abs(m['y']-wy)<0.03:
                        await pg.wait_for_timeout(80); m=await ev(pg,"()=>__T.mw()")
                        if abs(m['x']-wx)<0.03 and abs(m['y']-wy)<0.03: return
            await aim_at(109.5,110.5)
            await ev(pg,"()=>{__T.G.enemies.length=0;__T.G.enemies.push({k:'slimeG',x:111.3,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});__T.G.p.x=110.5;__T.G.p.y=110.5}")
            print('dbg', await ev(pg,"()=>[__T.aim(), JSON.stringify(__T.mw()),JSON.stringify(__T.cam()), __T.G.enemies.length]"))
            # 적을 다시 놓고 바로 판단해요 (사이에 프레임이 돌면 슬라임이 움직이거나 다른 몬스터가 생길 수 있어요)
            r=await ev(pg,"()=>{__T.G.enemies.length=0;__T.G.enemies.push({k:'slimeG',x:111.3,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});__T.G.p.x=110.5;__T.G.p.y=110.5;return __T.decide().k}")
            rec('클릭 방향','적이 오른쪽에 있어도 왼쪽 벽을 클릭하면 캐기', r=='mine', r)
            async def point(wx,wy): return await ev(pg,f"()=>{{const V=__T.VIEW(),T=__T.TPv(),D=__T.DPR(),M=__T.mouse();M.x=({wx}*T-V.camX)/D;M.y=({wy}*T-V.camY)/D;M.last=performance.now();return __T.decide().k}}")
            en="()=>{__T.G.enemies.length=0;__T.G.enemies.push({k:'slimeG',x:111.3,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});__T.G.p.x=110.5;__T.G.p.y=110.5}"
            await ev(pg,en); r=await point(111.3,110.5)
            rec('클릭 방향','적 쪽을 가리키면 공격', r=='attack', r)
            await ev(pg,en); r=await point(109.5,110.5)
            rec('클릭 방향','적이 오른쪽에 있어도 벽 쪽(왼쪽)을 가리키면 캐기 (재확인)', r=='mine', r)
            # swing with nothing nearby: face follows the click
            await ev(pg,"()=>{__T.G.inv[__T.G.sel]=null;__T.G.enemies.length=0}")
            await aim_at(112.5,110.5); await ev(pg,"()=>{__T.G.p.face={x:-1,y:0};__T.G.p.dir='side'}"); await pg.mouse.down(); await pg.wait_for_timeout(120); await pg.mouse.up(); await pg.wait_for_timeout(100)
            r=await ev(pg,"()=>[__T.G.p.face.x>0.8, __T.G.p.dir]")
            rec('클릭 방향','휘두르기가 클릭한 쪽(오른쪽)을 향함', r==[True,'side'], str(r))
            # 공격하는 순간의 방향을 봐요 (공격이 끝난 뒤에는 화면이 다시 움직이고 캐릭터가 마우스를 따라 돌아서 결과가 흔들렸어요)
            await aim_at(111.3,110.3); await ev(pg,en); await ev(pg,"()=>{__T.G.p.face={x:0,y:1};__T.G.p.dir='down'}"); await pg.mouse.down()
            await ev(pg,"()=>new Promise(r=>{const t0=performance.now();(function w(){if(__T.G.swing||performance.now()-t0>1000)r();else requestAnimationFrame(w)})()})")
            r=await ev(pg,"()=>[__T.G.p.face.x>0.5, __T.G.p.dir]"); await pg.wait_for_timeout(120); await pg.mouse.up(); await pg.wait_for_timeout(100)
            rec('클릭 방향','공격 동작이 클릭한 쪽(오른쪽)을 향함', r==[True,'side'], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3]); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa19():
    import asyncio, sys, random, json
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
    return main


def qa25():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,decide,perform,growTick,refreshHotbar,canCraft:typeof canCraft!=='undefined'?canCraft:null,nearStations,stashBag,placeItem,hitObj}")
    ARENA="()=>{const G=__T.G;for(let y=100;y<114;y++)for(let x=100;x<116;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.enemies.length=0;G.p.x=104.5;G.p.y=106.5;G.p.face={x:1,y:0};for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.sel=0}"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,ARENA)
            # trees
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(105,106);G.objs.set(i,{t:'cherryTree'});G.inv[0]={id:'shovel',c:1};G.sel=0;const a=T.decide();
          G.inv[0]={id:'pickIron',c:1};for(let k=0;k<12&&G.objs.get(i)&&G.objs.get(i).t==='cherryTree';k++)T.hitObj({x:105,y:106},G.objs.get(i));const o=G.objs.get(i);return [a.k,o&&o.t,o&&o.g,G.drops.some(d=>d.id==='wood')]}""")
            rec('나무','다 자란 벚꽃나무는 삽으로 못 퍼고(안내) 베어야 함 → 그루터기', r[0]=='info' and r[1]=='stump' and r[2]=='cherryTree' and r[3], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(105,106);G.inv[0]={id:'shovel',c:1};G.sel=0;const a=T.decide();T.perform(a);return [a.k,G.objs.get(i)||null,T.countItem('cherryTree')]}""")
            rec('나무','그루터기는 삽으로 뽑히고 나무 아이템으로 돌아옴', r[0]=='dig' and r[1] is None and r[2]==1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(105,106);G.objs.set(i,{t:'stump',g:'roundTree',at:G.time-1});G.p.x=102.5;T.growTick();const t=G.objs.get(i).t;G.p.x=104.5;return t}""")
            rec('나무','그루터기는 시간이 지나면 원래 나무로 다시 자람', r=='roundTree', r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(105,106);G.objs.set(i,{t:'sapling',at:G.time-1});G.p.x=102.5;T.growTick();const o=G.objs.get(i);G.inv[0]={id:'pickIron',c:1};for(let k=0;k<12&&G.objs.get(i)&&G.objs.get(i).t==='root';k++)T.hitObj({x:105,y:106},G.objs.get(i));G.p.x=104.5;return [o.t,G.objs.get(i)&&G.objs.get(i).t]}""")
            rec('나무','직접 심은 묘목이 자란 뿌리기둥도 베면 그루터기', r==['root','stump'], str(r))
            # chest stash
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'torch',c:5};G.inv[9]={id:'stone',c:30};G.inv[10]={id:'wood',c:20};G.inv[11]={id:'swordWood',c:1};const ci=T.idx(106,106);const o={t:'chest',items:Array(18).fill(null)};o.items[0]={id:'stone',c:10};G.objs.set(ci,o);G.p.x=104.5;G.p.y=106.5;T.openPanel('chest',{i:ci});return true}""")
            await pg.wait_for_timeout(600)
            await pg.tap('[data-a=stash][data-i=same]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.idx(106,106));return [o.items[0].c,T.countItem('wood'),T.countItem('torch')]}")
            rec('상자','같은 것만 넣기: 상자에 있는 돌만 들어감', r==[40,20,5], str(r))
            await pg.screenshot(path=SP+'qa25_chest.png')
            await pg.tap('[data-a=stash][data-i=all]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.idx(106,106));return [T.countItem('wood'),T.countItem('swordWood'),T.countItem('torch'),o.items.filter(Boolean).length]}")
            rec('상자','모두 넣기: 가방 물건은 다 들어가고 단축칸은 그대로', r==[0,0,5,3], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.idx(106,106));for(let k=0;k<18;k++)o.items[k]={id:'dirt',c:999};G.inv[12]={id:'wood',c:7};return T.stashBag(o,false)}")
            rec('상자','상자가 가득 차면 남은 건 가방에', r['n']==0 and r['left']==1, str(r))
            await ev(pg,"()=>__T.closePanel()")
            # crafting per station
            await ev(pg,ARENA)
            await ev(pg,"()=>{const T=__T,G=T.G;G.objs.set(T.idx(106,105),{t:'bench'});G.objs.set(T.idx(106,107),{t:'pot'});G.objs.set(T.idx(103,105),{t:'forge'});for(const[id,c]of[['wood',99],['fiber',99],['copperBar',40],['resin',20],['dirt',40],['stone',40],['rope',20],['gel',20],['mushroom',20],['berry',20]])T.addItem(id,c,false)}")
            await ev(pg,"()=>__T.openPanel('craft')"); await pg.wait_for_timeout(500)
            r=await ev(pg,"""()=>{const T=__T;const ats=new Set();document.querySelectorAll('#sheet .rc [data-a=craft]').forEach(b=>ats.add(T.RECIPES[+b.dataset.i].at||'hand'));const ok=[...document.querySelectorAll('#sheet .rc [data-a=craft]:not([disabled])')].map(b=>T.RECIPES[+b.dataset.i].at||'hand');return [[...ats].join(','),[...new Set(ok)].join(','),[...document.querySelectorAll('#sheet .tab')].map(t=>t.textContent).join(',')]}""")
            rec('제작','손 제작 창에는 손 제작만 (작업대·솥·구리 제작대가 근처여도)', r[0]=='hand' and r[1]=='hand' and '수리' not in r[2], str(r))
            await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(300)
            for st in ['bench','pot']:
                await ev(pg,f"()=>__T.openPanel('craft',{{st:'{st}'}})"); await pg.wait_for_timeout(450)
                r=await ev(pg,"""()=>{const T=__T;const ats=new Set();document.querySelectorAll('#sheet .rc [data-a=craft]').forEach(b=>ats.add(T.RECIPES[+b.dataset.i].at||'hand'));return [[...ats].join(','),document.querySelectorAll('#sheet .rc [data-a=craft]:not([disabled])').length,[...document.querySelectorAll('#sheet .tab')].map(t=>t.textContent).join(',')]}""")
                rec('제작',f'{st} 창에는 {st} 제작품만 (v62: 작업대는 손 제작도)', (r[0] in ('bench,hand','hand,bench') if st=='bench' else r[0]==st) and r[1]>0, str(r))
                if st=='bench': await pg.screenshot(path=SP+'qa25_bench.png')
                await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const R=__T.RECIPES.find(r=>r.out==='gMoss');return JSON.stringify(R.req)+R.at}")
            rec('제작','이끼 한 삽 = 이끼 섬유 1개 (손 제작)', r=='[["fiber",1]]null', r)
            # moss meadow
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'meadow',c:4};G.sel=0;G.p.x=104.5;G.p.y=106.5;G.p.face={x:1,y:0};const i=T.idx(105,106);G.objs.delete(i);let a=T.decide();T.perform(a);const f=G.floor[i];
          G.inv[1]={id:'mossSpore',c:3};G.sel=1;a=T.decide();T.perform(a);const o=G.objs.get(i);
          G.sel=1;G.floor[T.idx(105,107)]=1;return [f,o&&o.t,a.k]}""")
            rec('이끼밭','풀밭 깔고 이끼 포자 심기', r[0]==21 and r[1]=='cropMoss', str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(105,106);G.objs.get(i).p=G.time-200;const a=T.decide();G.drops.length=0;T.perform(a);return [a.k,G.drops.map(d=>d.id).sort().join(','),G.floor[i]]}""")
            rec('이끼밭','다 자라면 수확: 이끼 한 삽 + 포자, 풀밭은 그대로', r[0]=='harvest' and 'gMoss' in r[1] and 'mossSpore' in r[1] and r[2]==21, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.p.y=107.5;G.p.face={x:1,y:0};const i=T.idx(105,107);G.objs.delete(i);G.floor[i]=1;G.sel=1;return T.decide().k}""")
            rec('이끼밭','이끼 포자는 풀밭이 아닌 곳엔 못 심음', r!='place', r)
            # d-pad
            await ev(pg,"()=>{__T.openPanel('menu')}"); await pg.wait_for_timeout(500)
            await pg.tap('[data-a=ctrl][data-i=pad]'); await pg.wait_for_timeout(200)
            await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>[document.body.classList.contains('padmode'),getComputedStyle(document.querySelector('#dpad')).display,localStorage.getItem('lantern-tree-ctrl')]")
            rec('방향키','설정에서 방향키로 바꾸면 십자 패드 표시 + 저장', r[0] and r[1]=='block' and r[2]=='pad', str(r))
            await ev(pg,ARENA)
            box=await pg.locator('#dpad').bounding_box()
            x0=await ev(pg,"()=>__T.G.p.x")
            cx,cy=box['x']+box['width']-20, box['y']+box['height']/2
            await pg.dispatch_event('#dpad','pointerdown',{'pointerId':21,'pointerType':'touch','isPrimary':True,'clientX':cx,'clientY':cy,'bubbles':True})
            await pg.wait_for_timeout(500)
            r1=await ev(pg,"()=>[document.querySelector('#dpad .r').classList.contains('on'),__T.G.p.x]")
            await pg.dispatch_event('#dpad','pointerup',{'pointerId':21,'pointerType':'touch','isPrimary':True,'clientX':cx,'clientY':cy,'bubbles':True})
            await pg.wait_for_timeout(300)
            r2=await ev(pg,"()=>__T.G.p.x")
            await pg.wait_for_timeout(300)
            r3=await ev(pg,"()=>__T.G.p.x")
            rec('방향키','오른쪽 누르면 오른쪽으로 걷고, 떼면 멈춤', r1[0] and r1[1]>x0+1 and abs(r3-r2)<0.05, f'{x0}->{r1} {r2} {r3}')
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.p.x=104.5;return 1}")
            await pg.dispatch_event('#cv','pointerdown',{'pointerId':22,'pointerType':'touch','isPrimary':True,'clientX':100,'clientY':500})
            await pg.dispatch_event('#cv','pointermove',{'pointerId':22,'pointerType':'touch','isPrimary':True,'clientX':150,'clientY':500})
            await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>[__T.G.p.x,document.querySelector('#joy').classList.contains('on')]")
            await pg.dispatch_event('#cv','pointerup',{'pointerId':22,'pointerType':'touch','isPrimary':True,'clientX':150,'clientY':500})
            rec('방향키','방향키 모드에선 화면 끌기 조이스틱이 안 생김', r[0] < 104.6 and not r[1], str(r))
            await pg.screenshot(path=SP+'qa25_dpad.png')
            await ev(pg,"()=>{__T.openPanel('menu')}"); await pg.wait_for_timeout(500); await pg.tap('[data-a=ctrl][data-i=joy]'); await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[document.body.classList.contains('padmode'),getComputedStyle(document.querySelector('#dpad')).display]")
            rec('방향키','조이스틱으로 되돌리기', r==[False,'none'], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa27():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,refreshHotbar}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,1280,800,False)
            await ev(pg,"()=>{const G=__T.G;for(let y=100;y<114;y++)for(let x=100;x<116;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.objs.set(__T.idx(106,106),{t:'bench'});G.p.x=105.5;G.p.y=106.5;__T.addItem('wood',50);__T.addItem('resin',10)}")
            async def walk():
                x0=await ev(pg,"()=>__T.G.p.x"); await pg.keyboard.down('KeyA'); await wait_game(pg,0.4); await pg.keyboard.up('KeyA'); x1=await ev(pg,"()=>__T.G.p.x"); await ev(pg,"()=>{__T.G.p.x=105.5}"); return round(x0-x1,2)  # 키는 게임 시간으로 0.4초 누름
            mk="()=>{__T.openPanel('menu');const i=document.createElement('input');i.id='tst';document.querySelector('#sheetWrap').appendChild(i);i.focus()}"
            await ev(pg,mk); await pg.wait_for_timeout(300); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            r=await walk(); pnl=await ev(pg,"()=>document.querySelector('#sheetWrap').hidden")
            rec('키보드','입력칸에서 Esc로 닫아도 WASD 동작', r>1 and pnl, f'{r} {pnl}')
            await ev(pg,"()=>__T.openPanel('craft',{st:'bench'})"); await pg.wait_for_timeout(500)
            await pg.click('#sheet .rc [data-a=craft]:not([disabled])'); await pg.wait_for_timeout(200)
            fo=await ev(pg,"()=>document.activeElement.tagName")
            await pg.click('#sheet [data-a=close]'); await pg.wait_for_timeout(200); r=await walk()
            rec('키보드','제작 버튼을 눌러도 버튼이 초점을 가져가지 않음 + 닫은 뒤 WASD', fo=='BODY' and r>1, f'{fo} {r}')
            await pg.click('#hbSlots .slot >> nth=3'); await pg.wait_for_timeout(200); fo=await ev(pg,"()=>document.activeElement.tagName"); r=await walk()
            rec('키보드','단축칸 클릭 뒤에도 WASD', fo=='BODY' and r>1, f'{fo} {r}')
            await ev(pg,"()=>{const t=document.querySelector('#tst');if(t)t.remove()}")
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa50():
    import asyncio, sys
    # v48: 손에 든 물건의 일만 함 (가구=놓기, 삽=파기, 무기=공격 …), 빈손이면 예전처럼 다 함 / 장비의 무기 칸 없앰 → 든 무기가 무기
    H2=HOOK.replace("computeLight}","computeLight,curWeapon,holdMode,newGame,RECIPES,EQ_SLOTS,get panel(){return panel},renderPanel,HOT}")
    CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+22;y++)for(let x=T.CX+2;x<T.CX+22;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i);G.biome[i]=0}
  G.enemies.length=0;G.drops.length=0;G.wild=[];G.petE=null;G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;G.fish=null;G.inv.fill(null);G.sel=0;return [T.CX+9,T.CY+8]};
  window.__en=()=>{const G=__T.G;G.enemies.push({k:'slimeG',x:G.p.x-.9,y:G.p.y,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0})};
  window.__put=(t,o)=>{const T=__T;T.G.objs.set(T.idx(T.CX+9,T.CY+8),Object.assign({t},o||{}))};
  window.__d=()=>{const a=__T.decide();return a.k+':'+a.lbl};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+CLEAR+"}")
            # building first
            r=await ev(pg,"""()=>{const G=__T.G;__clear();G.inv[0]={id:'torch',c:5};const a=__d();__en();const b2=__d();__put('chest',{items:Array(16).fill(null)});const c=__T.decide();G.enemies.length=0;return [a,b2,c.k,c.lbl,!!c.sub]}""")
            rec('손에 든 것','가구를 들면 놓기가 먼저 (적이 붙어도), 상자 앞이면 열지 않고 [자리 있음] + 작은 [회수]', r==['place:놓기','place:놓기','info','자리 있음',True], str(r))
            r=await ev(pg,"""()=>{const G=__T.G;__clear();G.inv[0]={id:'berrySeed',c:5};const a=__d();__put('cropBerry',{p:G.time-99999});const b2=__d();__put('chest',{items:Array(16).fill(null)});const c=__d();return [a,b2,c]}""")
            rec('손에 든 것','씨앗: 심기, 다 자란 작물은 거두기(다시 심으려고), 상자는 안 열림', r[0]=='place:심기' and r[1]=='harvest:수확' and r[2].startswith('info:'), str(r))
            # shovel first
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'shovel',c:1,dur:250};G.floor[T.idx(T.CX+9,T.CY+8)]=6;const a=__d();__en();const b2=__d();G.enemies.length=0;
          __put('bush');const c=__d();__put('chest',{items:Array(16).fill(null)});const d=__d();__put('bench');const e=__d();G.objs.delete(T.idx(T.CX+9,T.CY+8));G.wall[T.idx(T.CX+9,T.CY+8)]=1;const f=__d();G.wall[T.idx(T.CX+9,T.CY+8)]=0;return [a,b2,c,d,e,f]}""")
            rec('손에 든 것','삽을 들면 파기가 먼저 (적이 붙어도), 덤불은 퍼내기, 상자·작업대·벽 앞에서는 열기·캐기 대신 안내', r[0]=='dig:걷기' and r[1]=='dig:걷기' and r[2]=='dig:퍼내기' and all(x.startswith('info:') for x in r[3:]), str(r))
            # food / wear / tools
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'berry',c:3};__put('chest',{items:Array(16).fill(null)});const a=__d();__en();const b2=__d();G.enemies.length=0;
          G.inv[0]={id:'wcan',c:1,w:0};const c=__d();G.inv[0]={id:'rod',c:1,dur:150};const d=__d();G.inv[0]={id:'lasso',c:1};const e=__d();return [a,b2,c,d,e]}""")
            rec('손에 든 것','음식은 먹기만, 물뿌리개·낚싯대·올가미는 상자 앞에서도 열지 않고 안내', r[0]=='eat:먹기' and r[1]=='eat:먹기' and all(x.startswith('info:') for x in r[2:]), str(r))
            # weapon held
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'swordCopper',c:1};G.inv[12]={id:'pickCopper',c:1};const t=T.idx(T.CX+9,T.CY+8);G.wall[t]=1;const a=__d();G.wall[t]=0;
          __put('chest',{items:Array(16).fill(null)});const b2=__d();__en();const c=__d();G.enemies.length=0;G.objs.delete(t);return [a,b2,c,T.curWeapon().id]}""")
            rec('손에 든 것','무기를 들면 싸우기만: 벽·상자 앞에서도 휘두르기, 적이 오면 공격 (그 무기로)', r==['swing:휘두르기','swing:휘두르기','attack:공격','swordCopper'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'axeStone',c:1};__put('root');const a=__T.decide();G.objs.delete(T.idx(T.CX+9,T.CY+8));return [a.k,a.lbl]}""")
            rec('손에 든 것','도끼를 들면 나무는 벨 수 있음', r==['chop','베기'], str(r))
            # pick held
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'pickWood',c:1};G.inv[12]={id:'pickCopper',c:1};const t=T.idx(T.CX+9,T.CY+8);G.wall[t]=1;const a=T.decide();__en();const b2=__d();G.wall[t]=0;const c=__d();G.enemies.length=0;
          __put('chest',{items:Array(16).fill(null)});const d=__d();G.objs.delete(t);const pk=T.bestPick().id;G.sel=1;const pk2=T.bestPick().id;return [a.k,a.icon,b2,c,d,pk,pk2]}""")
            rec('손에 든 것','곡괭이를 들면 그 곡괭이로 캐기 (앞에 벽이 있으면 적보다 먼저), 상자는 안 열림 / 빈손이면 가방 속 가장 좋은 곡괭이', r[0:3]==['mine','pickWood','mine:캐기'] and r[3]=='attack:공격' and r[4].startswith('swing') and r[5:]==['pickWood','pickCopper'], str(r))
            # empty hand / material
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[12]={id:'swordIron',c:1};G.inv[13]={id:'pickCopper',c:1};G.sel=0;__put('chest',{items:Array(16).fill(null)});const a=__d();G.inv[0]={id:'stone',c:9};const b2=__d();
          G.objs.delete(T.idx(T.CX+9,T.CY+8));G.wall[T.idx(T.CX+9,T.CY+8)]=1;const c=T.decide();G.wall[T.idx(T.CX+9,T.CY+8)]=0;__en();const d=__d();const w=T.curWeapon().id;G.enemies.length=0;return [a,b2,c.k+':'+c.icon,d,w,T.holdMode(T.ITEMS.stone)]}""")
            rec('빈손','빈손·재료를 들면 예전처럼: 상자 열기, 가방 속 좋은 곡괭이로 캐기, 적은 주먹으로 (가방 속 무기는 안 씀)', r==['open:열기','open:열기','mine:pickCopper','attack:공격','hand','hand'], str(r))
            # equipment without the weapon slot
            await ev(pg,"()=>{const G=__T.G;__clear();G.inv[0]={id:'swordCopper',c:1};G.inv[12]={id:'woolHat',c:1};G.sel=0;G.pets={dog:1};G.petOn='dog';__T.openPanel('equip')}"); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [__T.panel.kind,__T.EQ_SLOTS.map(x=>x[0]).join(','),'weapon' in __T.G.equip,t.includes('무기 칸'),document.querySelectorAll('#sheet [data-a=eqSlot]').length,!!(document.querySelector('#sheet .eq2').compareDocumentPosition(document.querySelector('#sheet [data-a=inv]'))&4),t.includes('멍멍이 · 함께 다니는 중'),!!document.querySelector('#bEquip')]}")
            await pg.screenshot(path=SP+'qa50_bag.png')
            rec('가방','장비 메뉴가 가방 안으로: 맨 위에 장비 4칸(무기 칸 없음), 아래에 펫, 따로 있던 [장비] 버튼 없음', r==['inv','body,head,neck,ring',False,False,4,True,True,False], str(r))
            await ev(pg,"()=>document.querySelector('#sheet [data-a=eqSlot][data-i=body]').click()"); await pg.wait_for_timeout(300)
            await ev(pg,"()=>document.querySelector('#sheet .slot[data-a=inv][data-i=\"12\"]').click()"); await pg.wait_for_timeout(300)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=wearOn]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[__T.G.equip.head&&__T.G.equip.head.id,document.querySelector('#sheet').innerText.includes('털모자')]")
            await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(300)
            rec('가방','가방에서 장비를 골라 [달기] → 장비 칸에 바로 보임', r==['woolHat',True], str(r))
            await ev(pg,"()=>{const G=__T.G;G.sel=0;G.inv[0]={id:'swordCopper',c:1};__T.openPanel('inv')}"); await pg.wait_for_timeout(500)
            await ev(pg,"()=>document.querySelector('#sheet .slot[data-i=\"0\"]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[!!document.querySelector('#sheet [data-a=wearOn]'),document.querySelector('#sheet').innerText.includes('무기 칸')]")
            await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(300)
            rec('가방','무기 설명에 [무기 칸에 끼기] 버튼 없음', r==[False,False], str(r))
            # old save with a weapon slot
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'berry',c:2};G.inv[1]={id:'torch',c:3};const s=JSON.parse(JSON.stringify(T.serialize()));s.equip={weapon:{id:'swordIron',c:1,dur:100,lv:2},body:null,head:null,neck:null,ring:null};
          T.deserialize(s);const k=T.G.inv.findIndex(x=>x&&x.id==='swordIron');const w=T.G.inv[k];return [k,w.dur,w.lv,'weapon' in T.G.equip,JSON.stringify(T.serialize().equip)]}""")
            rec('옛 세이브','무기 칸에 있던 무기(내구도·강화 그대로)는 빈 단축칸으로 옮겨짐', r[0]==2 and r[1:4]==[100,2,False] and 'weapon' not in r[4], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));s.inv=s.inv.map((x,i)=>i<9?{id:'stone',c:5}:x);s.equip={weapon:{id:'swordCopper',c:1}};T.deserialize(s);const k=T.G.inv.findIndex(x=>x&&x.id==='swordCopper');return [k>=9]}""")
            rec('옛 세이브','단축칸이 가득하면 가방으로', r==[True], str(r))
            # new game & first weapon
            r=await ev(pg,"""()=>{const T=__T;T.newGame(321);const G=T.G;return [G.sel,G.inv.slice(0,4).map(x=>x?x.id:'-').join(','),G.inv.slice(T.HOT).filter(Boolean).map(x=>x.id).join(','),T.curWeapon().id,T.holdMode(G.inv[G.sel]&&T.ITEMS[G.inv[G.sel].id])]}""")
            rec('새 게임','빈손으로 시작, 나무 검은 단축칸 3번, 나무 곡괭이는 가방', r==[3,'berry,berrySeed,swordWood,-','pickWood','hand','hand'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[0]={id:'berry',c:1};T.addItem('swordCopper',1);const a=G.inv.findIndex(x=>x&&x.id==='swordCopper');T.addItem('swordIron',1);const b2=G.inv.findIndex(x=>x&&x.id==='swordIron');return [a,b2>=T.HOT]}""")
            rec('무기','단축칸에 무기가 없을 때 얻은 무기는 빈 단축칸으로 (이미 있으면 가방)', r==[1,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowWood',c:1};G.inv[12]={id:'swordIron',c:1};G.sel=0;const a=T.curWeapon().id;G.sel=1;return [a,T.curWeapon().id]}""")
            rec('무기','든 활이 무기, 다른 칸을 고르면 주먹', r==['bowWood','hand'], str(r))
            await ev(pg,"()=>{__clear();const G=__T.G;G.inv[0]={id:'swordCopper',c:1};G.inv[1]={id:'shovel',c:1};G.inv[2]={id:'torch',c:4};G.sel=2;__put('chest',{items:Array(16).fill(null)})}"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=SP+'qa50_hold.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def qa51():
    import asyncio, sys, os, io, json, base64, shutil, subprocess
    # v49 손그림 불러오기 / v53부터 한 칸 16px(HD=1): 세계를 1:1로 그리고, dev/art의 16px 손그림을 지금 그림 대신 씀
    from PIL import Image, ImageDraw
    QA=os.path.dirname(os.path.abspath(__file__)); DEV=os.path.join(QA,'..')
    H2=HOOK.replace("computeLight}","computeLight,SPR,HD,effW,effH,ARTC,iconURL,animalImg,get lowCv(){return lowCv},newGame}")

    def png(w,h,col,detail=True):
        im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
        d.rectangle([2,2,w-3,h-3],fill=col)
        if detail:  # 1-art-pixel checker stripe: only visible if the art is drawn 1:1
            for x in range(2,w-2,2): d.point((x,h//2),fill=(255,255,255,255))
        b=io.BytesIO(); im.save(b,'PNG'); return b.getvalue()

    ART={'obj/roundTree':(24,32,(40,120,70,255)),'item/berry':(16,16,(220,60,90,255)),'mon/slimeG':(16,14,(120,210,110,255)),
         'crop/berry/3':(16,16,(200,80,120,255)),'animal/dog':(16,16,(200,140,90,255)),'obj/torch.raw':(16,16,(250,200,90,255))}

    def art_page(out):
        tmp=SP+'art_tmp'; shutil.rmtree(tmp,ignore_errors=True)
        for k,(w,h,c) in ART.items():
            fp=os.path.join(tmp,k+'.png'); os.makedirs(os.path.dirname(fp),exist_ok=True); open(fp,'wb').write(png(w,h,c))
        html=SP+'art_src.html'; shutil.copy(SRC,html)
        r=subprocess.run([sys.executable,os.path.join(DEV,'art_pack.py'),tmp,html],capture_output=True,text=True)
        mkpage(html,out,H2); return r.stdout+r.stderr, open(html,encoding='utf-8').read()

    async def main():
        before=open(SRC,'rb').read()
        log,packed=art_page('qa.html')
        blk=packed[packed.index('/*@@ART*/'):packed.index('/*@@ARTEND*/')]
        art=json.loads(blk[len('/*@@ART*/const ART = '):-1])
        rec('그림 넣기','art_pack.py가 dev/art 그림을 원본 안에 넣음 (.raw는 테두리 없음 표시)', sorted(art)==sorted(['obj/roundTree','item/berry','mon/slimeG','crop/berry/3','animal/dog','obj/torch']) and art['obj/torch'][1]==0 and art['obj/roundTree'][1]==1, log.strip())
        rec('그림 넣기','원본 dev/index.html은 그대로 (테스트는 복사본으로)', open(SRC,'rb').read()==before, '')
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const T=__T,S=T.SPR,o=S.obj.roundTree;return [o.hd,o.width,o.height,T.effW(o),T.effH(o),S.item.berry.hd,S.slimeG.hd,S.slimeGW.hd,S.slimeGW.width,S.crop.berry[3].every(c=>c.hd&&c.width===16),S.giant.berry.hd,S.giant.berry.width,S.young.roundTree.hd,!!S.obj.root.hd]}")
            rec('그림 바꾸기','16px 손그림이 원래 그림 자리에 들어가고 그린 크기 그대로 표시됨 (HD=1)', r==[True,24,32,24,32,True,True,True,16,True,True,32,True,False], str(r))
            r=await ev(pg,"()=>{const S=__T.SPR;const a=S.obj.roundTree.getContext('2d').getImageData(0,0,24,32).data,t=S.obj.torch.getContext('2d').getImageData(0,0,16,16).data;let ol=0;for(let i=0;i<a.length;i+=4){const x=(i/4)%24,y=(i/4/24)|0;if(x===1&&y===10&&a[i+3])ol=1}return [ol,t[(1*16+1)*4+3],t[(2*16+2)*4+3]]}")
            rec('테두리','보통 그림은 자동 테두리, .raw 그림은 그린 그대로', r==[1,0,255], str(r))
            r=await ev(pg,"()=>{const S=__T.SPR,c=S.crop.berry[3],px=(k,x,y)=>Array.from(c[k].getContext('2d').getImageData(x,y,1,1).data).join();let diff=0;for(let y=12;y<16;y++)for(let x=0;x<16;x++)if(px(0,x,y)!==px(1,x,y))diff++;return [c.length,diff>0,px(0,8,8)===px(1,8,8),S.crop.berry[2].every(k=>!k.hd)]}")
            rec('작물','작물 그림 밑에 흙(마름·물 줌·비료)을 게임이 그대로 깔아 줌', r==[4,True,True,True], str(r))
            r=await ev(pg,"()=>{const T=__T,S=T.SPR;const d=T.animalImg('dog');return [d.hd,d.width,S.objOff.torch.hd,T.iconURL('berry').startsWith('data:image/png'),T.ARTC['obj/roundTree'].width]}")
            rec('그림 바꾸기','동물·꺼진 램프·아이콘도 손그림을 씀', r==[True,16,True,True,24], str(r))
            # world canvas is 1 art pixel per game pixel
            await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+2,y=Math.floor(G.p.y);for(const [dx,dy] of [[0,0],[1,0],[0,-1],[1,-1]])G.wall[T.idx(x+dx,y+dy)]=0;G.objs.set(T.idx(x,y),{t:'roundTree',hp:3});G.objs.set(T.idx(x+1,y-1),{t:'torch'});G.enemies.length=0}""")
            await pg.wait_for_timeout(400)
            await pg.screenshot(path=SP+'qa51_art.png')
            # the 1-pixel stripe of the drawn tree must reach the screen: count alternating pixels on the stripe row
            r=await ev(pg,"""()=>{const T=__T,c=T.lowCv,g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data;let best=0;
          for(let y=0;y<c.height;y++){let alt=0;for(let x=1;x<c.width;x++){const i=(y*c.width+x)*4,j=i-4;const w1=d[i]>200&&d[i+1]>200&&d[i+2]>200,w0=d[j]>200&&d[j+1]>200&&d[j+2]>200;if(w1!==w0)alt++}best=Math.max(best,alt)}return best}""")
            rec('화면','세계 캔버스가 1:1이라 그림의 1px 무늬가 그대로 보임', r>=12, r)
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close()
            # without art the game looks exactly as before: 16px sprites, no hd flags, same world size
            empty=SP+'art_empty'; shutil.rmtree(empty,ignore_errors=True); os.makedirs(empty); plain=SP+'art_none.html'; shutil.copy(SRC,plain)
            subprocess.run([sys.executable,os.path.join(DEV,'art_pack.py'),empty,plain],capture_output=True)  # the game with no drawn art at all
            mkpage(plain,'qa.html',H2)
            ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const T=__T,S=T.SPR;return [Object.keys(T.ARTC).length,!!S.obj.roundTree.hd,S.obj.roundTree.width,T.effW(S.obj.roundTree),!!S.slimeGW.hd,T.lowCv.width%T.HD]}")
            rec('기본','손그림이 없으면 지금 그림 그대로 (HD=1, v50부터 나무는 1.75배)', r==[0,False,42,42,False,0], str(r))
            rec('기능','콘솔 오류 없음 (그림 없음)', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
