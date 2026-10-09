import asyncio, json, random, sys
from playwright.async_api import async_playwright
SP=__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'out')+'/'; __import__('os').makedirs(SP, exist_ok=True)
SRC=sys.argv[1] if len(sys.argv)>1 else __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','index.html')
HOOK="window.__T={get G(){return G},CX,CY,BX,BY,SA,SB,idx,addItem,openPanel,closePanel,decide,serialize,deserialize,WATER,BOSSES,bestPick,lightAt,countItem,OBJ,ITEMS,computeLight};window.claude?.hot?.snapshot"
def mkpage(src,out,hook=None):
    html=open(src).read().replace("window.claude?.hot?.snapshot",hook or HOOK,1)
    open(SP+out,'w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>')
RES=[]
def rec(area,name,ok,detail=''):
    RES.append((area,name,bool(ok),detail)); print(('PASS' if ok else 'FAIL'),area,'|',name,'|',detail)

LAYOUT_JS="""()=>{
 const q=s=>{const e=document.querySelector(s); if(!e) return null; const cs=getComputedStyle(e); if(e.hidden||cs.display==='none'||cs.visibility==='hidden') return null; const r=e.getBoundingClientRect(); return r.width?{x:r.left,y:r.top,w:r.width,h:r.height,r:r.right,b:r.bottom}:null};
 const els={bars:q('#hud .bars'),side:q('#hud .side'),hotbar:q('#hotbar'),belt:q('#subBtn'),act:q('#actBtn'),joy:q('#joy'),hint:q('#pcHint'),toast:q('#toasts')};
 const ov=(a,b)=>a&&b&&a.x<b.r-1&&b.x<a.r-1&&a.y<b.b-1&&b.y<a.b-1;
 const pairs=[['bars','side'],['hotbar','belt'],['hotbar','act'],['belt','act'],['side','belt'],['side','act'],['bars','belt'],['joy','belt'],['joy','bars'],['joy','act'],['joy','hotbar'],['hint','hotbar'],['hint','belt'],['toast','belt'],['toast','act']];
 const over=pairs.filter(([a,b])=>ov(els[a],els[b])).map(p=>p.join('/'));
 const out=Object.entries(els).filter(([k,v])=>v&&(v.x<-1||v.y<-1||v.r>innerWidth+1||v.b>innerHeight+1)&&k!=='joy').map(([k])=>k);
 const slots=[...document.querySelectorAll('#hotbar .slot')].map(e=>Math.round(e.getBoundingClientRect().width));
 const actW=els.act?els.act.w:0;
 return {over,out,minSlot:Math.min(...slots),actW,hscroll:document.documentElement.scrollWidth>innerWidth}
}"""

async def new_ctx(b, w, h, touch):
    ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=2 if touch else 1,has_touch=touch,is_mobile=touch)
    pg=await ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text and 'fonts' not in m.text else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto('file://'+SP+'qa.html'); await pg.wait_for_timeout(400)
    await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(500)
    return ctx,pg,errs

async def tap(pg, n=1, gap=330):
    for _ in range(n):
        await pg.dispatch_event('#actBtn','pointerdown',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(60)
        await pg.dispatch_event('#actBtn','pointerup',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(gap)
async def hold(pg, ms):
    await pg.dispatch_event('#actBtn','pointerdown',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(ms)
    await pg.dispatch_event('#actBtn','pointerup',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(150)
async def ev(pg, js, arg=None): return await pg.evaluate(js, arg) if arg is not None else await pg.evaluate(js)
async def stand(pg, x, y, fx, fy, sel=None):
    await ev(pg, f"()=>{{const G=__T.G;G.p.sit=null;G.fish=null;G.enemies.length=0;G.p.x={x};G.p.y={y};G.p.face={{x:{fx},y:{fy}}};G.p.hp=100;G.p.hunger=100;{'G.sel='+str(sel)+';' if sel is not None else ''}}}")
    await pg.wait_for_timeout(120)

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
        rec('되돌림','시작 아이템: 베리·씨앗·나무 곡괭이 + 무기 칸에 나무 검(v42), 도구 칸 없음', r[0]==0 and r[1]=='berry,berrySeed,pickWood' and r[3]=='swordWood' and not r[2], str(r))
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
        rec('도구 강화','단축칸에서 고르지 않아도 가방의 가장 좋은 곡괭이 사용', await ev(pg,"()=>__T.bestPick().id")=='pickCopper' and await ev(pg,"()=>__T.G.sel")==0, '')
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
        await pg.tap('#bCraft'); await pg.wait_for_timeout(600); await pg.tap('[data-a=tab][data-i=tool]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SP+'qa2_craft.png')
        r=await ev(pg,"()=>[[...document.querySelectorAll('.rc .rn')].map(e=>e.childNodes[0].textContent).slice(0,3).join(','), document.querySelector('.ing').textContent]")
        import re
        rec('제작','재료 표기 "나무 14/4" 형식', re.search(r'\d+/\d+$', r[1]) is not None, r[1])
        rec('제작','만들 수 있는 항목이 위로 (이전 정렬)', r[0].startswith('낚싯대'), r[0])
        await ev(pg,"()=>__T.closePanel()")
        # PC R key pickup
        p3=await (await b.new_context(viewport={'width':1280,'height':800})).new_page()
        p3.on('pageerror',lambda e: errs.append(str(e)))
        await p3.goto('file://'+SP+'qa.html'); await p3.wait_for_timeout(300); await p3.click("#btnNew"); await p3.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await p3.wait_for_timeout(300)
        await p3.evaluate("()=>{const G=__T.G;G.p.x=__T.CX-0.5;G.p.y=__T.CY+3.6;G.p.face={x:-1,y:0}}"); await p3.wait_for_timeout(300)
        await p3.keyboard.press('KeyR'); await p3.wait_for_timeout(200)
        rec('PC','R 키로 가구 회수', await p3.evaluate("()=>__T.countItem('table')===1"), '')
        await p3.close()
        # saves from every earlier version
        for (src,name,hook) in [(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','old','index.v1.html'),'v1',"window.__T={get G(){return G},serialize};window.claude?.hot?.snapshot"),(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','old','index.v2.html'),'v2',"window.__T={get G(){return G},serialize};window.claude?.hot?.snapshot"),(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','old','index.v3.html'),'v3(전용 도구)',"window.__T={get G(){return G},serialize};window.claude?.hot?.snapshot")]:
            mkpage(src,'old_'+name[:2]+'.html',hook)
            p2=await ctx.new_page(); await p2.goto('file://'+SP+'old_'+name[:2]+'.html'); await p2.wait_for_timeout(300); await p2.click("#btnNew"); await p2.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await p2.wait_for_timeout(300)
            old=await p2.evaluate("()=>{const G=__T.G;try{G.sel=G.sel}catch(e){};return JSON.stringify(__T.serialize())}"); await p2.close()
            r=await ev(pg,"(s)=>{__T.deserialize(JSON.parse(s));const G=__T.G;return [G.sel, G.inv.filter(x=>x).map(x=>x.id).concat(G.equip.weapon?[G.equip.weapon.id]:[]).join(','), [...G.objs.values()].every(o=>__T.OBJ[o.t])]}", old)
            await pg.wait_for_timeout(600)
            rec('저장',f'{name} 세이브 불러오기 정상', r[0]<9 and all(i in r[1] for i in ['pickWood','swordWood']) and 'axe' not in r[1] and 'sickle' not in r[1] and r[2] and not errs, str(r[:2]))
        await ev(pg,"()=>{const T=__T;T.deserialize(JSON.parse(JSON.stringify(T.serialize())))}")
        for bk in ['slime','queen','golem']:
            await ev(pg,f"()=>{{const T=__T,G=T.G;T.addItem('swordIron',1);const h=T.BOSSES.{bk}.home();G.p.x=h.x;G.p.y=h.y+5;G.p.hp=100;G.p.sit=null}}")
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
asyncio.run(main())
