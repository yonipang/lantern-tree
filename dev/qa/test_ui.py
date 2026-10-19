# 가방·창·메뉴: 캐릭터·메뉴, 꾸미기, 단축칸·가방, 상자, 제작 수량, 드래그·꽃 구역, 지도 표시
# 실행: python3 dev/qa/run.py ui   (테스트 하나만: python3 dev/qa/run.py character_menu)
from harness import *


def test_character_menu():
    import asyncio, sys
    async def main():
        mkpage(SRC,'qa.html')
        async with async_playwright() as p:
            b=await p.chromium.launch(); errs=[]
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
            pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(500)
            await pg.tap('#btnNew'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[!document.querySelector('#charPick').hidden, document.querySelectorAll('#cpGrid .cp-card').length, document.querySelector('#cpGrid .cp-card.on').dataset.c, document.querySelector('#btnNew').offsetParent===null]")
            rec('캐릭터 선택','새 모험 → 선택 화면 (8칸, 기본 새싹)', r==[True,8,'sprout',True], str(r))
            await pg.tap('#cpGrid [data-c=pori]'); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>[document.querySelector('#cpGrid .cp-card.on').dataset.c, document.querySelector('#cpDesc').textContent]")
            rec('캐릭터 선택','카드 누르면 선택 + 설명', r==['pori','버섯 모자를 쓴 탐험가'], str(r))
            await pg.screenshot(path=SP+'picker.png')
            await pg.tap('#charBack'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[document.querySelector('#charPick').hidden, document.querySelector('#btnNew').offsetParent!==null]")
            rec('캐릭터 선택','뒤로 → 첫 화면', r==[True,True], str(r))
            await pg.tap('#btnNew'); await pg.wait_for_timeout(200); await pg.tap('#cpGrid [data-c=rumi]'); await pg.wait_for_timeout(100); await pg.tap('#charGo'); await pg.wait_for_timeout(700)
            r=await ev(pg,"()=>[__T.G.char, document.querySelector('#title').hidden, __T.serialize().char]")
            rec('캐릭터 선택','루미로 시작 + 세이브에 저장', r==['rumi',True,'rumi'], str(r))
            await ev(pg,"()=>{document.getElementById('toasts').style.display='none'}")
            await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'game.png')
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);const a=__T.G.char;delete s.char;__T.deserialize(s);const b=__T.G.char;s.char='rumi';__T.deserialize(s);return [a,b]}")
            rec('저장','불러오면 캐릭터 유지 / 예전 세이브는 새싹', r==['rumi','sprout'], str(r))
            await ev(pg,"()=>{document.getElementById('toasts').style.display=''}")
            await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>[document.querySelectorAll('#sheet .cp-card').length,document.querySelector('#sheet').innerText.includes('옷장에서')]")
            rec('메뉴','v83: 메뉴에는 캐릭터 고르기·꾸미기가 없고 옷장 안내 한 줄', r==[0,True], str(r))
            await ev(pg,"()=>__T.openPanel('look',{tab:'char'})"); await pg.wait_for_timeout(500) # 옷장 [꾸미기]와 같은 창 — 첫 탭이 캐릭터
            n=await ev(pg,"()=>document.querySelectorAll('#sheet .cp-card').length")
            await pg.tap('#sheet .cp-card[data-c=momo]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[__T.G.char, __T.G.outfit, document.querySelector('#toasts').innerText.includes('모모로 바꿨어요'), document.querySelector('#sheet .cp-card.on').dataset.c]")
            rec('옷장','옷장 꾸미기 창의 캐릭터 탭에서 캐릭터 바꾸기', n==8 and r==['momo',0,True,'momo'], f'{n} {r}')
            await pg.screenshot(path=SP+'menu.png')
            await pg.tap('#sheet .cp-card[data-c=todak]'); await pg.wait_for_timeout(300)
            rec('옷장','받침 있는 이름: 토닥으로', await ev(pg,"()=>document.querySelector('#toasts').innerText.includes('토닥으로 바꿨어요')"))
            await pg.tap('#sheet .cp-card[data-c=ciel]'); await pg.wait_for_timeout(300)
            rec('옷장','ㄹ 받침 이름: 시엘로', await ev(pg,"()=>document.querySelector('#toasts').innerText.includes('시엘로 바꿨어요')"))
            # restart keeps char
            await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(500)
            await pg.tap('#sheet [data-a=newgame]'); await pg.wait_for_timeout(200); await pg.tap('#sheet [data-a=newgame]'); await pg.wait_for_timeout(500)
            rec('메뉴','처음부터 다시 해도 캐릭터 유지', await ev(pg,"()=>__T.G.char")=='ciel')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_dress_up():
    import asyncio, sys
    async def main():
        mkpage(SRC,'qa.html',HOOK.replace("computeLight}","computeLight,RECIPES}"))
        async with async_playwright() as p:
            b=await p.chromium.launch(); errs=[]
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
            pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(500)
            await pg.tap('#btnNew'); await pg.wait_for_timeout(300)
            rec('꾸미기','선택 화면에 직접 꾸미기 카드', await ev(pg,"()=>!!document.querySelector('#cpGrid [data-c=custom]') && document.querySelector('#cpGrid [data-c=custom] span').textContent==='직접 꾸미기'"))
            await pg.tap('#cpGrid [data-c=custom]'); await pg.tap('#charGo'); await pg.wait_for_timeout(900)
            r=await ev(pg,"()=>[__T.G.char, document.querySelector('#sheet h2')?.textContent]")
            rec('꾸미기','직접 꾸미기로 시작하면 꾸미기 창이 바로 열림', r==['custom','꾸미기'], str(r))
            n=await ev(pg,"()=>document.querySelectorAll('#sheet .look-opt').length")
            rec('꾸미기','머리 모양 8가지', n==8, n)
            await pg.screenshot(path=SP+'hair.png')
            await pg.tap('#sheet .look-opt[data-i="hair:buns"]'); await pg.wait_for_timeout(200)
            await pg.tap('#sheet [data-a=lookTab][data-i=hc]'); await pg.wait_for_timeout(200); await pg.tap('#sheet .look-opt[data-i="hc:5"]'); await pg.wait_for_timeout(200)
            await pg.tap('#sheet [data-a=lookTab][data-i=outfit]'); await pg.wait_for_timeout(200); await pg.tap('#sheet .look-opt[data-i="outfit:apron"]'); await pg.wait_for_timeout(200)
            await pg.tap('#sheet [data-a=lookTab][data-i=oc]'); await pg.wait_for_timeout(200); await pg.tap('#sheet .look-opt[data-i="oc:3"]'); await pg.wait_for_timeout(200)
            await pg.tap('#sheet [data-a=lookTab][data-i=hat]'); await pg.wait_for_timeout(200); await pg.tap('#sheet .look-opt[data-i="hat:flowers"]'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SP+'hat.png')
            r=await ev(pg,"()=>__T.G.look.hair")
            rec('꾸미기','적용 전에는 바뀌지 않음', r=='bob', r)
            await pg.tap('#sheet [data-a=lookOk]'); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>[__T.G.char, JSON.stringify(__T.serialize().look), document.querySelector('#sheetWrap').hidden]")
            rec('꾸미기','이 모습으로 하기 → 적용 + 저장', r[0]=='custom' and '"hair":"buns"' in r[1] and '"hat":"flowers"' in r[1] and '"oc":3' in r[1] and r[2], str(r))
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);const a=__T.G.look.hair;s.look={hair:'zzz',hc:99};__T.deserialize(s);const b=[__T.G.look.hair,__T.G.look.hc];delete s.look;s.char='momo';__T.deserialize(s);return [a,b,__T.G.char]}")
            rec('저장','꾸민 모습 저장 / 잘못된 값은 기본값 / 예전 세이브 정상', r==['buns',['bob',8],'momo'], str(r))
            # wardrobe furniture opens panel
            await ev(pg,"()=>{const G=__T.G;G.char='custom';G.objs.set(__T.idx(Math.floor(G.p.x)+1,Math.floor(G.p.y)),{t:'shroomWardrobe'});G.p.face={x:1,y:0}}"); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.decide().k,__T.decide().lbl]")
            rec('가구','옷장 → 꾸미기', r==['use','꾸미기'], str(r))
            await tap(pg,1); await pg.wait_for_timeout(500)
            rec('가구','옷장을 쓰면 꾸미기 창', await ev(pg,"()=>document.querySelector('#sheet h2')?.textContent")=='꾸미기')
            rec('가구','옷장 꾸미기 창은 캐릭터 고르기 탭부터 (v83)', await ev(pg,"()=>document.querySelectorAll('#sheet .cp-card').length")==8)
            await pg.tap('#sheet [data-a=close]'); await pg.wait_for_timeout(300)
            # v83 나무 옷장: 작업대 기본(나무 8 + 이끼 섬유 4), 같은 꾸미기
            r=await ev(pg,"()=>{const T=__T,G=T.G,r=T.RECIPES.find(q=>q.out==='woodWardrobe');G.objs.set(T.idx(Math.floor(G.p.x)+1,Math.floor(G.p.y)),{t:'woodWardrobe'});return [r&&r.at,r&&(r.tier||0),r&&JSON.stringify(r.req),T.decide().lbl]}")
            rec('가구','나무 옷장: 작업대 기본 단계, 나무 8 + 이끼 섬유 4, [꾸미기]', r==['bench',0,'[["wood",8],["fiber",4]]','꾸미기'], str(r))
            await ev(pg,"()=>{document.getElementById('toasts').style.display='none'}"); await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'game.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_hotbar_bag():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,refreshHotbar,perform,decide,HOT,invSize,stackMax:id=>(ITEMS[id].stack||((!ITEMS[id].kind||ITEMS[id].kind==='ground'||id==='dirt')?999:99)),sortBag,hotClick}")
    LAYOUT="""()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const cs=getComputedStyle(e);if(e.hidden||cs.display==='none')return null;const r=e.getBoundingClientRect();return r.width?{x:r.left,y:r.top,r:r.right,b:r.bottom}:null};
 const E={hot:q('#hotbar'),bag:q('#bInv'),act:q('#actBtn'),sub:q('#subBtn'),sk:q('#skBar'),flip:q('#hbFlip'),joy:q('#joy'),side:q('#hud .side'),bars:q('#hud .stat')};const ov=(a,b)=>a&&b&&a.x<b.r-1&&b.x<a.r-1&&a.y<b.b-1&&b.y<a.b-1;
 const bad=[];for(const [a,b] of [['hot','act'],['hot','sub'],['hot','sk'],['hot','joy'],['bag','act'],['bag','sk'],['side','bars']])if(ov(E[a],E[b]))bad.push(a+'/'+b);
 const out=Object.keys(E).filter(k=>E[k]&&k!=='joy'&&(E[k].x<-1||E[k].r>innerWidth+1||E[k].b>innerHeight+1));const hb=document.querySelector('#hbSlots');
 const vis=[...hb.querySelectorAll('.slot')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.dataset.tool?'t':e.dataset.i);
 return {bad,out,bagTop:!!(E.bag&&E.side&&E.bag.b<=E.side.b+1&&E.bag.y<innerHeight/2),flip:!!E.flip,scroll:hb.scrollWidth>hb.clientWidth+2,slots:hb.querySelectorAll('.slot').length,vis:vis.join(',')}}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>[__T.G.inv.length,__T.G.inv.slice(0,9).map(s=>s&&s.id).join(','),__T.G.inv.slice(9).filter(Boolean).map(s=>s.id).join(','),(__T.G.tools||[]).map(s=>s.id).join(','),__T.G.sel]")
            rec('시작','단축칸 9 + 가방 24, 음식·씨앗은 단축칸, 도구는 도구 주머니(나무 곡괭이를 든 채 시작, v65)', r[0]==33 and r[1].startswith('berry,berrySeed') and 'pickWood' not in r[2] and r[3]=='pickWood' and r[4]==-1, str(r))
            await ev(pg,"()=>document.body.classList.add('touch')"); await pg.wait_for_timeout(300)
            r=await ev(pg,LAYOUT); rec('단축칸','v77 폰: 도구 칸 + 일반 1–5칸 + 넘기기 버튼 (스크롤 없음) · 가방 버튼은 오른쪽 위', r['slots']==10 and r['vis']=='t,0,1,2,3,4' and r['flip'] and not r['scroll'] and r['bagTop'] and not r['bad'] and not r['out'], str(r))
            await pg.tap('#hbFlip'); await pg.wait_for_timeout(250)
            r=await ev(pg,LAYOUT); rec('단축칸','v77 넘기기 버튼 → 6–9칸이 보임 (도구 칸은 그대로)', r['vis']=='t,5,6,7,8' and not r['out'], str(r))
            await pg.tap('#hbFlip'); await pg.wait_for_timeout(250)
            await ev(pg,"()=>{__T.hotClick(8)}"); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>{const hb=document.querySelector('#hbSlots'),el=hb.querySelector('[data-i=\"8\"]');return [getComputedStyle(el).display!=='none',__T.G.sel]}")
            rec('단축칸','9번 칸을 고르면 6–9쪽으로 넘어가 보임', r==[True,8], str(r))
            await ev(pg,"()=>{__T.hotClick(0)}"); await pg.wait_for_timeout(300)
            bx=await pg.locator('#hotbar [data-i="2"]').bounding_box(); x0,y0=bx['x']+bx['width']/2,bx['y']+bx['height']/2
            await pg.dispatch_event('#hotbar [data-i="2"]','pointerdown',{'pointerId':7,'pointerType':'touch','isPrimary':True,'clientX':x0,'clientY':y0,'bubbles':True})
            for k in range(1,7): await pg.evaluate("([x,y])=>window.dispatchEvent(new PointerEvent('pointermove',{pointerId:7,pointerType:'touch',clientX:x,clientY:y,bubbles:true}))",[x0-25*k,y0]); await pg.wait_for_timeout(16)
            await pg.evaluate("([x,y])=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,pointerType:'touch',clientX:x,clientY:y,bubbles:true}))",[x0-150,y0]); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[document.querySelector('#hbSlots').scrollLeft>20,__T.G.inv[0]&&__T.G.inv[0].id,!document.querySelector('#dragGhost')]")
            rec('단축칸','모바일에서 빠르게 옆으로 밀어도 물건은 그대로 (v77: 스크롤 대신 넘기기 버튼)', r[1:]==['berry',True], str(r))
            r=await ev(pg,"()=>{const ev=new Event('dragstart',{cancelable:true,bubbles:true});document.querySelector('#hotbar .slot img').dispatchEvent(ev);const cs=getComputedStyle(document.querySelector('#hotbar .slot img'));return [ev.defaultPrevented,cs.pointerEvents,cs.webkitUserDrag||cs.getPropertyValue('-webkit-user-drag')]}")
            rec('드래그','브라우저 기본 이미지 끌기 차단 (원본 이미지가 따라오지 않음)', r[0] and r[1]=='none', str(r))
            # placing new items
            r=await ev(pg,"()=>{const G=__T.G;__T.addItem('torch',3);__T.addItem('berry',2);return [G.inv.slice(0,9).filter(Boolean).map(s=>s.id+':'+s.c).join(','),G.inv.findIndex(s=>s&&s.id==='torch')]}")
            rec('단축칸','새 아이템은 빈 단축칸으로, 이미 단축칸에 있는 건 거기에 합쳐짐 (v65)', r[0]=='berry:6,berrySeed:2,swordWood:1,torch:3' and r[1]==3, str(r))
            r=await ev(pg,"()=>[__T.stackMax('wood'),__T.stackMax('dirt'),__T.stackMax('berry'),__T.stackMax('torch')]")
            rec('겹치기','재료는 999개까지, 음식·가구는 99개', r==[999,999,99,99], str(r))
            r=await ev(pg,"()=>{__T.addItem('wood',1500);return __T.G.inv.filter(s=>s&&s.id==='wood').map(s=>s.c)}")
            rec('겹치기','나무 1500개 → 999 + 501', sorted(r)==[501,999], str(r))
            # sort
            r=await ev(pg,"()=>{const G=__T.G;for(let i=9;i<G.inv.length;i++)G.inv[i]=null;G.inv[2]={id:'gel',c:3};const L=[['stone',5],['grilled',2],['swordWood',1],['stone',7],['torch',2],['berrySeed',3],['pickWood',1],['wood',4]];L.forEach(([id,c],k)=>{G.inv[30-k]={id,c}});__T.sortBag();return [G.inv.slice(9).filter(Boolean).map(s=>s.id+':'+s.c).join(','),G.inv[2].id]}")
            rec('정렬','장비 → 음식 → 재료 → 씨앗 → 꾸미기 순, 같은 것 합침, 단축칸은 그대로', r[0].startswith('pickWood:1,swordWood:1,grilled:2') and 'stone:12' in r[0] and r[0].endswith('torch:2') and r[1]=='gel', str(r))
            # tabs
            await pg.tap('#bInv'); await pg.wait_for_timeout(600)
            await pg.tap('[data-a=bagTab][data-i=food]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const d=[...document.querySelectorAll('#sheet .slot[data-a=inv]')].filter(e=>e.querySelector('img'));return [d.filter(e=>!e.classList.contains('dim')).map(e=>e.getAttribute('aria-label').split(' ')[0]).join(','),d.filter(e=>e.classList.contains('dim')).length]}")
            rec('종류 탭','음식 탭: 음식만 밝게, 나머지는 흐리게', r[1]>3 and all(x in ['통통베리','구운'] for x in r[0].split(',')), str(r))
            await pg.screenshot(path=SP+'bag_food.png')
            await pg.tap('[data-a=bagTab][data-i=all]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>document.querySelectorAll('#sheet .slot.dim').length"); rec('종류 탭','전체 탭은 모두 밝게', r==0, r)
            await pg.tap('[data-a=sortBag]'); await pg.wait_for_timeout(200)
            await ev(pg,"()=>__T.closePanel()")
            # auto refill
            r=await ev(pg,"()=>{const G=__T.G;for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++){const i=__T.idx(Math.floor(G.p.x)+x,Math.floor(G.p.y)+y);G.objs.delete(i);G.wall[i]=0;G.floor[i]=1}G.inv[4]={id:'torch',c:1};G.sel=4;G.p.face={x:1,y:0};const n0=__T.countItem('torch');__T.perform(__T.decide());return [G.inv[4]&&G.inv[4].id,G.inv[4]&&G.inv[4].c,__T.countItem('torch'),n0]}")
            rec('자동 보충','단축칸 횃불을 다 쓰면 가방 횃불로 자동 보충', r[0]=='torch' and r[2]==r[3]-1, str(r))
            # craft: notice + no auto hotbar
            r=await ev(pg,"()=>{const G=__T.G;G.objs.set(__T.idx(Math.floor(G.p.x),Math.floor(G.p.y)-2),{t:'bench'});__T.addItem('wood',30);__T.openPanel('craft',{st:'bench'});return __T.RECIPES.findIndex(r=>r.out==='chair')}")
            await pg.wait_for_timeout(500)
            hot_before=await ev(pg,"()=>__T.G.inv.slice(0,9).map(s=>s&&s.id).join(',')")
            await ev(pg,f"()=>{{const b=document.querySelector('[data-a=craft][data-i=\"{r}\"]');b.scrollIntoView({{block:'center'}})}}"); await pg.wait_for_timeout(200)
            await pg.tap(f'[data-a=craft][data-i="{r}"]'); await pg.wait_for_timeout(250)
            n=await ev(pg,"()=>{const e=document.querySelector('#craftNote');return e&&!e.hidden?[e.textContent,e.getBoundingClientRect().top<document.querySelector('#sheet').getBoundingClientRect().top+60]:null}")
            rec('제작 알림','"나무 의자를 제작했어요" 알림이 창 위에 보임', n and n[0]=='나무 의자를 제작했어요' and n[1], str(n))
            await pg.screenshot(path=SP+'craftnote.png')
            r2=await ev(pg,"()=>__T.G.inv.slice(0,9).map(s=>s&&s.id).join(',')")
            hb0=hot_before.split(','); hb1=r2.split(','); k0=hb0.index('') if '' in hb0 else -1
            rec('단축칸','만든 물건은 빈 단축칸으로 (원래 있던 칸은 그대로, v65)', k0>=0 and hb1[k0]=='chair' and all(a==c for j,(a,c) in enumerate(zip(hb0,hb1)) if j!=k0), f'{hot_before} -> {r2}')
            ri=await ev(pg,"()=>__T.RECIPES.findIndex(r=>r.out==='floorWood')")
            await ev(pg,f"()=>{{__T.closePanel();__T.openPanel('craft',{{st:'bench'}})}}"); await pg.wait_for_timeout(500)
            await pg.tap('[data-a=tab][data-i=build]'); await pg.wait_for_timeout(200)
            await ev(pg,f"()=>{{document.querySelector('[data-a=craft][data-i=\"{ri}\"]').scrollIntoView({{block:'center'}})}}"); await pg.wait_for_timeout(150)
            await pg.tap(f'[data-a=qty][data-i="{ri}:1"]'); await pg.wait_for_timeout(100); await pg.tap(f'[data-a=craft][data-i="{ri}"]'); await pg.wait_for_timeout(250)
            n=await ev(pg,"()=>document.querySelector('#craftNote').textContent"); rec('제작 알림','여러 개면 "나무 바닥을 8개 제작했어요!"', n=='나무 바닥을 8개 제작했어요!', n)
            # bag upgrade
            r=await ev(pg,"()=>{const G=__T.G;G.bagLv=0;G.inv.length=33;['fiber','rope','resin'].forEach(i=>__T.addItem(i,30));__T.closePanel();__T.openPanel('craft',{st:'bench'});return [__T.RECIPES.findIndex(r=>r.out==='bagUp1'),!!document.querySelector('[data-a=craft][data-i=\"'+__T.RECIPES.findIndex(r=>r.out==='bagUp2')+'\"]')]}")
            await pg.wait_for_timeout(500); await pg.tap('[data-a=tab][data-i=tool]'); await pg.wait_for_timeout(200)
            vis=await ev(pg,f"()=>[!!document.querySelector('[data-a=craft][data-i=\"{r[0]}\"]'),!!document.querySelector('[data-a=craft][data-i=\"'+__T.RECIPES.findIndex(r=>r.out==='bagUp2')+'\"]')]")
            rec('가방 확장','처음엔 1단계 가방만 보임', vis==[True,False], str(vis))
            await ev(pg,f"()=>{{document.querySelector('[data-a=craft][data-i=\"{r[0]}\"]').scrollIntoView({{block:'center'}})}}"); await pg.wait_for_timeout(150)
            await pg.tap(f'[data-a=craft][data-i="{r[0]}"]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[__T.G.inv.length,__T.G.bagLv,document.querySelector('#craftNote').textContent,__T.countItem('bagUp1')]")
            rec('가방 확장','가방이 30칸으로 늘고 아이템은 생기지 않음', r[0]==39 and r[1]==1 and '30칸' in r[2] and r[3]==0, str(r))
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));__T.deserialize(s);return [__T.G.inv.length,__T.G.bagLv]}")
            rec('가방 확장','저장·불러오기 후에도 유지', r==[39,1], str(r))
            # old save migration
            r=await ev(pg,"()=>{const s=__T.serialize();s.invV=undefined;s.bagLv=undefined;s.inv=Array(30).fill(null);s.inv[0]={id:'berry',c:3};s.inv[5]={id:'torch',c:2};s.inv[6]={id:'wood',c:9};s.inv[29]={id:'stone',c:4};s.sel=5;__T.deserialize(s);const G=__T.G;return [G.inv.length,G.inv[0].id,G.inv[5].id,G.inv[6],G.inv[9].id,G.inv[32].id,G.sel]}")
            rec('예전 세이브','단축칸 6칸 그대로 + 빈 3칸 추가, 가방 아이템 보존', r==[33,'berry','torch',None,'wood','stone',5], str(r))
            rec('기능','콘솔 오류 없음 (모바일)', not errs, errs[:3]); await ctx.close()
            # PC
            ctx,pg,errs=await new_ctx(b,1280,800,False)
            r=await ev(pg,LAYOUT); rec('단축칸','PC 도구 칸 + 9칸 한 줄 (넘기기 없음) · 가방 버튼은 오른쪽 위', r['slots']==10 and r['vis']=='t,0,1,2,3,4,5,6,7,8' and not r['flip'] and not r['scroll'] and r['bagTop'] and not r['bad'], str(r))
            await pg.keyboard.press('Digit9'); r=await ev(pg,"()=>__T.G.sel"); rec('단축칸','PC 숫자 9로 9번 칸 선택', r==8, r)
            await pg.mouse.move(640,400); await pg.mouse.wheel(0,100); await pg.wait_for_timeout(100); r=await ev(pg,"()=>__T.G.sel"); rec('단축칸','휠로 순환 (9번 칸 다음은 도구 칸, v65)', r==-1, r)
            await pg.click('#bInv'); await pg.wait_for_timeout(500); r=await ev(pg,"()=>document.querySelector('.sh-head h2').textContent"); rec('가방','오른쪽 위 가방 버튼으로 가방 열기', '가방' in r, r)
            await pg.screenshot(path=SP+'pc_bag.png')
            rec('기능','콘솔 오류 없음 (PC)', not errs, errs[:3]); await ctx.close()
            for (w,h,name) in [(360,640,'small Android'),(375,667,'iPhone SE'),(430,932,'Pro Max'),(844,390,'landscape')]:
                ctx,pg,errs=await new_ctx(b,w,h,True)
                await ev(pg,"()=>{document.body.classList.add('touch');const G=__T.G;G.rpg.sk.dash=1;G.rpg.slot=['dash',null];G.objs.set(__T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1),{t:'chair'});G.p.face={x:0,y:1}}"); await pg.wait_for_timeout(500)
                r=await ev(pg,LAYOUT); rec('레이아웃',f'{name} 단축칸·가방 버튼 겹침 없음', not r['bad'] and not r['out'] and r['bagTop'], str(r))
                await pg.screenshot(path=SP+f'{w}x{h}.png'); await ctx.close()
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_hud_layout_v77():
    import asyncio, sys
    # v77 HUD 배치: 왼쪽 위(얼굴·배고픔·더위추위·버프·이야기 한 줄), 오른쪽 위 4버튼, 머리 위 체력·기력, 보스 막대, 알림 자리, 빨간 점, 단축칸 넘기기, C·L·K 키
    H2=HOOK.replace("computeLight}","computeLight,inFight,headBarsOn,headNoteY,mkEnemy,enemyStep,hotClick,refreshHotbar,bagNew,get panel(){return panel}}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>document.body.classList.add('touch')"); await pg.wait_for_timeout(300)
            q="(s=>{const e=document.querySelector(s);if(!e||e.hidden||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();return {x:r.left,y:r.top,r:r.right,b:r.bottom}})"
            # 왼쪽 위
            r=await ev(pg,"()=>{const f="+q+";return [!!f('#face'),!!f('#huRing'),!f('#envRing'),!!f('#goal'),document.querySelector('#goal b').textContent,document.querySelector('#goalTxt').textContent,!document.querySelector('#bCraft'),!document.querySelector('#bQuest')]}")
            rec('HUD','왼쪽 위: 얼굴·배고픔 동그라미·활성 퀘스트 한 줄(앞에 「이야기」) (더위·추위는 그 지역에서만, 제작·퀘스트 버튼은 없음)', r[0] and r[1] and r[2] and r[3] and '이야기' in r[4] and '뿌리기둥' in r[5] and r[6] and r[7], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.p.hunger=20;G.env={k:'cold',v:50,lv:1,t:0};return 0}")
            ok=await wait_until(pg,"()=>{const h=document.querySelector('#huRing'),e=document.querySelector('#envRing');return h.classList.contains('low')&&Math.abs(parseFloat(h.style.getPropertyValue('--f'))-.2)<.01&&!e.hidden&&e.classList.contains('cold')&&Math.abs(parseFloat(e.style.getPropertyValue('--f'))-.5)<.01}")
            rec('HUD','배고픔 20 → 동그라미 20%·경고 / 추운 곳 → 배고픔 옆에 추위 동그라미 50%', ok, '')
            await ev(pg,"()=>{const G=__T.G;G.p.hunger=100;G.env={k:null,v:0,lv:0,t:0};G.buffs=['atk','def','move'].map((ef,k)=>({ef,tier:1,end:G.time+100,max:100,id:'berry'}));__T.G.__qt=null}")
            ok=await wait_until(pg,"()=>{const b=document.querySelectorAll('#buffs .bf');return b.length===3&&b[2].classList.contains('more')&&b[2].textContent==='+1'&&document.querySelector('#envRing').hidden}")
            rec('HUD','버프 3개 → 2개 + 「+1」', ok, await ev(pg,"()=>document.querySelector('#buffs').innerText"))
            await ev(pg,"()=>{__T.G.buffs=[]}")
            # 오른쪽 위 4버튼, 보스 막대는 그 사이 맨 위 가운데
            await ev(pg,"()=>{document.querySelector('#bossbar').hidden=false}"); await pg.wait_for_timeout(100)
            r=await ev(pg,"()=>{const f="+q+",ov=(a,b)=>a&&b&&a.x<b.r-1&&b.x<a.r-1&&a.y<b.b-1&&b.y<a.b-1;const s=['#bStat','#bMap','#bInv','#bMenu'].map(f),bb=f('#bossbar'),top=f('#hud .stat .top'),side=f('#hud .side');return [s.map(e=>e&&Math.round(e.y)).join(','),[...document.querySelectorAll('#hud .side .sbtn span')].map(e=>e.textContent).join(','),!ov(bb,top)&&!ov(bb,side),bb.y<top.b,Math.round(bb.r-bb.x)]}")
            rec('HUD','오른쪽 위 세로로 캐릭터·지도·가방·설정', r[1]=='캐릭터,지도,가방,설정' and all(int(a)<int(b) for a,b in zip(r[0].split(',')[:-1],r[0].split(',')[1:])), str(r))
            rec('HUD','보스 체력 막대는 맨 위, 얼굴 쪽 정보와 오른쪽 버튼 사이 (겹치지 않음)', r[2] and r[3] and r[4]>120, str(r))
            await ev(pg,"()=>{document.querySelector('#bossbar').hidden=true}")
            # 머리 위 체력·기력: 가득 찬 채 안 싸우면 숨김, 맞거나 때리거나 쫓기면 보임, 3초 뒤 숨김, 덜 차면 늘 보임
            r=await ev(pg,"()=>{const T=__T,G=T.G,p=G.p;G.enemies.length=0;p.hp=T.maxHp?T.maxHp():p.hp;p.hitAt=p.fightAt=p.chasedAt=undefined;const a=T.headBarsOn();p.hitAt=G.time-1;const b=T.headBarsOn();p.hitAt=G.time-3.2;const c=T.headBarsOn();p.fightAt=G.time-.5;const d=T.headBarsOn();p.fightAt=undefined;p.hp-=10;const e=T.headBarsOn();p.hp+=10;return [a,b,c,d,e]}")
            rec('HUD','머리 위 막대: 평소 숨김 · 맞으면 보임 · 3초 뒤 숨김 · 내가 때리면 보임 · 체력이 덜 차면 보임', r==[False,True,False,True,True], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G,p=G.p;p.chasedAt=undefined;const e=T.mkEnemy('slimeG',p.x+3,p.y);G.enemies.push(e);T.enemyStep(e,.016);const a=T.inFight();G.enemies.length=0;p.chasedAt=undefined;p.fightAt=undefined;p.hitAt=undefined;return [a,T.inFight()]}")
            rec('HUD','몬스터가 나를 쫓으면 싸우는 중', r==[True,False], str(r))
            # 알림 자리: 캐릭터 머리 위, 가운데
            await ev(pg,"()=>{window.__toastT=1}"); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>{const t=document.querySelector('#toasts').getBoundingClientRect(),y=__T.headNoteY();return [Math.round(Math.abs((t.left+t.right)/2-innerWidth/2)),Math.round(t.bottom-y),Math.round(y),innerHeight]}")
            rec('HUD','알림은 머리 위 막대 살짝 위 가운데', r[0]<=2 and abs(r[1])<=2 and r[2]<r[3]*0.6 and r[2]>r[3]*0.2, str(r))
            # 캐릭터 빨간 점: 포인트가 새로 생기면 → 캐릭터 화면을 열면 꺼짐
            await ev(pg,"()=>{__T.G.rpg.pts=2}")
            ok=await wait_until(pg,"()=>document.querySelector('#bStat').classList.contains('dot')&&document.querySelector('#face').classList.contains('dot')")
            rec('빨간 점','올릴 포인트가 생기면 캐릭터 버튼·얼굴에 빨간 점', ok, '')
            await pg.tap('#face'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[__T.panel&&__T.panel.kind,document.querySelector('.sh-head h2').textContent]")
            rec('빨간 점','얼굴을 누르면 캐릭터 화면', r[0]=='stat' and '캐릭터' in r[1], str(r))
            await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[document.querySelector('#bStat').classList.contains('dot'),__T.G.rpg.pts]")
            rec('빨간 점','캐릭터 화면을 열었으면 (포인트가 남아도) 점이 꺼짐', r==[False,2], str(r))
            await ev(pg,"()=>{__T.G.rpg.pts=4}")
            ok=await wait_until(pg,"()=>document.querySelector('#bStat').classList.contains('dot')"); rec('빨간 점','포인트가 또 생기면 다시 점', ok, '')
            await ev(pg,"()=>{__T.G.rpg.pts=0}")
            # 가방 빨간 점: 처음 얻은 물건 → 가방을 열면 버튼 점이 꺼지고, 칸의 작은 점은 그 물건을 누르면 꺼짐
            r=await ev(pg,"()=>{const G=__T.G;return [__T.bagNew(),JSON.stringify(G.seen)]}")
            rec('빨간 점','새 게임: 처음 가진 물건은 모두 본 것 (점 없음)', r[0] is False and '\"berry\":1' in r[1] and '\"pickWood\":1' in r[1], str(r))
            await ev(pg,"()=>{__T.addItem('berry',2);__T.addItem('crystal',2);__T.G.inv[30]={id:'gel',c:1}}")
            ok=await wait_until(pg,"()=>document.querySelector('#bInv').classList.contains('dot')")
            r=await ev(pg,"()=>[__T.G.seen.berry,__T.G.seen.crystal,__T.G.seen.gel]")
            rec('빨간 점','처음 얻은 물건(줍기·가방에 바로 넣기 모두) → 가방 버튼에 빨간 점, 이미 본 것은 그대로', ok and r==[1,3,3], str(r))
            await pg.tap('#bInv'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[document.querySelector('#bInv').classList.contains('dot'),[...document.querySelectorAll('#sheet .slot.new')].map(e=>e.getAttribute('aria-label').split(' ')[0]).join(','),__T.G.seen.crystal]")
            rec('빨간 점','가방을 열면 버튼 점은 꺼지고, 새 물건 칸에 작은 점', r[0] is False and len(r[1].split(','))==2 and r[2]==2, str(r))
            i=await ev(pg,"()=>__T.G.inv.findIndex(s=>s&&s.id==='crystal')")
            await ev(pg,f"()=>document.querySelector('#sheet [data-a=inv][data-i=\"{i}\"]').scrollIntoView({{block:'center'}})"); await pg.wait_for_timeout(150)
            await pg.tap(f'#sheet [data-a=inv][data-i="{i}"]'); await pg.wait_for_timeout(250)
            r=await ev(pg,f"()=>[__T.G.seen.crystal,document.querySelector('#sheet [data-a=inv][data-i=\"{i}\"]').classList.contains('new'),__T.G.seen.gel]")
            rec('빨간 점','그 물건을 한 번 누르면 칸의 점이 꺼짐 (다른 새 물건은 그대로)', r==[1,False,2], str(r))
            await ev(pg,"()=>{__T.addItem('torch',1)}"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[__T.G.seen.torch,document.querySelector('#bInv').classList.contains('dot')]")
            rec('빨간 점','가방이 열려 있는 동안 들어온 새 물건은 버튼 점 없이 칸 점만', r==[2,False], str(r))
            await ev(pg,"()=>__T.closePanel()")
            # 저장·옛 세이브
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));const a=JSON.stringify(s.seen);__T.deserialize(s);return [a===JSON.stringify(__T.G.seen),__T.G.seen.gel]}")
            rec('저장','본 적 있는 물건이 저장·불러오기 됨', r==[True,2], str(r))
            r=await ev(pg,"()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));delete s.seen;s.inv[20]={id:'ironBar',c:1};const i=__T.idx(Math.floor(s.p.x)+2,Math.floor(s.p.y));s.objs.push([i,{t:'chest',items:[{id:'goldBar',c:1},...Array(17).fill(null)]}]);__T.deserialize(s);const S=__T.G.seen;return [S.ironBar,S.goldBar,S.gel,__T.bagNew()]}")
            rec('옛 세이브','v77 전 세이브: 가방·상자에 있던 물건은 모두 본 것 (점이 한꺼번에 뜨지 않음)', r==[1,1,1,False], str(r))
            # 단축칸 넘기기: 안 보이는 6–9칸에 새 물건이 들어오면 넘기기 버튼에 점, 넘기면 꺼짐
            await ev(pg,"()=>{const G=__T.G;for(let i=0;i<9;i++)G.inv[i]=null;G.inv[0]={id:'berry',c:1};G.sel=0;__T.refreshHotbar()}"); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>document.querySelector('#hbFlip').classList.contains('dot')")
            await ev(pg,"()=>{const G=__T.G;for(let i=1;i<5;i++)G.inv[i]={id:'stone',c:1};__T.addItem('wood',1);__T.refreshHotbar()}"); await pg.wait_for_timeout(200)
            r2=await ev(pg,"()=>[__T.G.inv[5]&&__T.G.inv[5].id,document.querySelector('#hbFlip').classList.contains('dot')]")
            await pg.tap('#hbFlip'); await pg.wait_for_timeout(200); await pg.tap('#hbFlip'); await pg.wait_for_timeout(200)
            r3=await ev(pg,"()=>document.querySelector('#hbFlip').classList.contains('dot')")
            rec('단축칸','안 보이는 6–9칸에 새 물건 → 넘기기 버튼에 점, 넘겨 보면 꺼짐', r is False and r2==['wood',True] and r3 is False, f'{r} {r2} {r3}')
            # 가방이 가득 차면 「가득」
            await ev(pg,"()=>{const G=__T.G;for(let i=9;i<G.inv.length;i++)G.inv[i]={id:'stone',c:1};__T.refreshHotbar()}"); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[document.querySelector('#bInv').classList.contains('isfull'),getComputedStyle(document.querySelector('#bInv .full')).display]")
            rec('가방','가방이 가득 차면 가방 버튼에 「가득」', r==[True,'block'], str(r))
            rec('기능','콘솔 오류 없음 (폰)', not errs, errs[:3]); await ctx.close()
            # PC: 키 C 캐릭터 · K 캐릭터 스킬 쪽 · L 퀘스트 · I 가방(제작 탭) · Esc 설정, 단축키 글자
            ctx,pg,errs=await new_ctx(b,1280,800,False)
            res=[]
            for key,want in [('KeyC','캐릭터'),('KeyL','퀘스트'),('KeyI','가방'),('Escape','설정')]:
                await pg.keyboard.press(key); await pg.wait_for_timeout(450)
                t=await ev(pg,"()=>{const h=document.querySelector('#sheetWrap:not([hidden]) .sh-head h2');return h?h.textContent:''}"); res.append(t)
                await pg.keyboard.press(key if key!='Escape' else 'Escape'); await pg.wait_for_timeout(300)
                if key!='Escape': res.append(await ev(pg,"()=>document.querySelector('#sheetWrap').hidden"))
                else: await ev(pg,"()=>__T.closePanel()")
            rec('PC','C 캐릭터 · L 퀘스트 · I 가방 · Esc 설정 (같은 키로 닫기)', '캐릭터' in res[0] and res[1] is True and '퀘스트' in res[2] and res[3] is True and '가방' in res[4] and res[5] is True and '설정' in res[6], str(res))
            await ev(pg,"()=>{__T.G.rpg.lv=12}"); await pg.keyboard.press('KeyK'); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const b=document.querySelector('.sh-body'),l=document.querySelector('#skLbl');return [b.scrollTop>50,Math.abs(l.getBoundingClientRect().top-b.getBoundingClientRect().top)<60]}")
            rec('PC','K → 캐릭터 화면의 스킬 쪽으로', r==[True,True], str(r)); await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"()=>[...document.querySelectorAll('#hud .side .sbtn .k')].map(e=>getComputedStyle(e).display==='block'?e.textContent:'').join(',')")
            rec('PC','오른쪽 위 버튼에 단축키 글자 (C·M·I·Esc)', r=='C,M,I,Esc', r)
            await pg.keyboard.press('KeyI'); await pg.wait_for_timeout(600); await pg.click('[data-a=bagNav][data-i=craft]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[__T.panel&&__T.panel.kind,__T.panel&&__T.panel.st||null]"); await pg.keyboard.press('KeyI'); await pg.wait_for_timeout(300)
            r2=await ev(pg,"()=>document.querySelector('#sheetWrap').hidden")
            rec('PC','가방 → 제작 탭(손제작), I로 닫힘', r==['craft',None] and r2, f'{r} {r2}')
            await ev(pg,"()=>{const G=__T.G;G.rpg.sk.dash=1;G.rpg.slot=['dash',null]}"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const h=document.querySelector('#hotbar').getBoundingClientRect(),s=document.querySelector('#skBar').getBoundingClientRect();return [s.left>=h.right,s.left-h.right<24,Math.abs((s.top+s.bottom)/2-(h.top+h.bottom)/2)<8]}")
            rec('PC','스킬 2칸은 단축칸 바로 오른쪽', r==[True,True,True], str(r))
            rec('기능','콘솔 오류 없음 (PC)', not errs, errs[:3]); await ctx.close()
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_view_tile_cap():
    # v90: PC 큰 창 밀림 고치기 — 한 화면 칸 수 상한(긴 쪽 24·짧은 쪽 14) + 큰 화면 내부 해상도 약 320만 픽셀, 폰은 그대로
    import asyncio
    async def main():
        mkpage(SRC,'qa.html',hook='window.__V={get Z(){return Z},get TP(){return TP},get DPR(){return DPR},cv};'+HOOK)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            for name,w,h,dpr,touch,exp in [('폰 세로',390,844,3,True,(1170,2532,7)),('폰 가로',844,390,3,True,(2532,1170,7)),
                                           ('PC 1920×1080',1920,1080,1,False,(1920,1080,5)),('레티나 1440×900',1440,900,2,False,None),('4K',3840,2160,1,False,None)]:
                ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,has_touch=touch,is_mobile=touch)
                pg=await ctx.new_page(); await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(300)
                r=await ev(pg,"()=>{const V=__V;return [V.cv.width,V.cv.height,V.Z,V.cv.width/V.TP,V.cv.height/V.TP]}")
                cw,ch,z,tx,ty=r; lng,sht=max(tx,ty),min(tx,ty)
                ok=lng<=24.01 and sht<=14.01 and (touch or cw*ch<=3.2e6*1.01)
                if exp: ok=ok and (cw,ch,z)==exp  # 폰은 예전(v89)과 같은 캔버스·배율, PC 1920×1080은 배율 3 → 5
                rec('화면 크기',f'v90 {name}: 보이는 칸 긴 쪽 24·짧은 쪽 14 이하'+(', 내부 해상도 320만 이하' if not touch else ''),ok,str([cw,ch,z,round(tx,1),round(ty,1)]))
                await ctx.close()
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_bag_keeps_hotbar_pick():
    import asyncio, sys
    # v66 (BF-06): 가방에서 누른 단축칸이 가방을 닫은 뒤에도 손에 든 칸으로 남아요 (고르기만 — 먹거나 입지 않아요)
    async def main():
        mkpage(SRC,'qa.html',HOOK)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            for touch in (True, False):
                name='모바일' if touch else 'PC'
                ctx,pg,errs=await new_ctx(b,390 if touch else 1280,844 if touch else 800,touch)
                await ev(pg,"()=>{const G=__T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'berry',c:4};G.inv[2]={id:'torch',c:3};G.inv[12]={id:'wood',c:5};G.sel=0;G.p.hunger=50}")
                async def press(i):
                    # the sheet slides in: wait until the slot stops moving, then press its middle (measured right before)
                    sel=f'#sheet [data-a=inv][data-i="{i}"]'; last=None
                    for _ in range(40):
                        bx=await pg.locator(sel).bounding_box()
                        if bx and last and abs(bx['x']-last['x'])<.5 and abs(bx['y']-last['y'])<.5: break
                        last=bx; await pg.wait_for_timeout(60)
                    if touch: await pg.tap(sel)
                    else: await pg.click(sel)
                    await pg.wait_for_timeout(150)
                async def bag(): await ev(pg,"()=>__T.openPanel('inv')"); await pg.wait_for_timeout(350)
                async def close(): await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(200)
                await bag(); await press(2); await close()
                r=await ev(pg,"()=>[__T.G.sel,__T.G.inv[2]&&__T.G.inv[2].c]")
                rec('단축칸',f'{name} 가방에서 누른 단축칸(3번)이 닫은 뒤에도 손에', r==[2,3], str(r))
                await bag(); await press(0); await press(0); await close()
                r=await ev(pg,"()=>[__T.G.sel,__T.G.inv[0]&&__T.G.inv[0].c,Math.round(__T.G.p.hunger)]")
                rec('단축칸',f'{name} 음식 칸을 두 번 눌러도 먹지 않고 고르기만', r[0]==0 and r[1]==4 and r[2]<=50, str(r))
                await bag(); await press(5); await close()
                r=await ev(pg,"()=>[__T.G.sel,__T.G.inv[5]]")
                rec('단축칸',f'{name} 빈 단축칸도 고를 수 있음', r==[5,None], str(r))
                await bag(); await press(12); await press(12); await close()
                r=await ev(pg,"()=>__T.G.sel")
                rec('단축칸',f'{name} 가방 아래 칸(단축칸 아님)을 눌러도 손에 든 칸은 그대로', r==5, str(r))
                await bag(); await press(2); await press(12); await close()
                r=await ev(pg,"()=>{const G=__T.G;return [G.sel,G.inv[2]&&G.inv[2].id,G.inv[12]&&G.inv[12].id]}")
                rec('단축칸',f'{name} 단축칸과 가방 칸 자리 바꾸기 뒤에도 그 단축칸', r==[2,'wood','torch'], str(r))
                rec('기능',f'{name} 콘솔 오류 없음', not errs, errs[:3]); await ctx.close()
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_world_runs_with_panel():
    # v76 (B안): 창을 열어도 세계는 계속 가요. 창은 맞아도 그대로 + 경고(가장자리 번쩍·창 위 체력·닫기 강조), 캐릭터는 제자리, 기절하면 창이 닫혀요
    async def main():
        mkpage(SRC,'qa.html',HOOK.replace("computeLight}","computeLight,hurtPlayer,get paused(){return paused}}"))
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            await stand(pg,0,0,0,1)
            await ev(pg,"()=>{const G=__T.G;G.p.x=__T.CX+.5;G.p.y=__T.CY+3.5;G.p.hp=100;G.p.inv=0;__T.openPanel('inv')}"); await pg.wait_for_timeout(300)
            t0=await ev(pg,"()=>[__T.paused,__T.G.time]")
            ok=True
            try: await wait_game(pg,1,timeout=15000)
            except Exception: ok=False
            r=await ev(pg,"()=>[__T.paused,!document.querySelector('#sheetWrap').hidden,!!document.querySelector('#sheet .sh-hp'),document.querySelector('#shHpTxt')?.textContent]")
            rec('창','창을 열어도 세계 시간이 흘러요', ok and t0[0] is False and r[:3]==[False,True,True] and r[3]=='100', f'{t0} {r}')
            # 창이 열린 동안 걷기 키를 눌러도 캐릭터는 제자리
            x0=await ev(pg,"()=>[__T.G.p.x,__T.G.p.y]")
            await pg.keyboard.down('KeyD'); await wait_game(pg,.6); await pg.keyboard.up('KeyD')
            x1=await ev(pg,"()=>[__T.G.p.x,__T.G.p.y]")
            rec('창','창이 열린 동안 캐릭터는 움직이지 않아요', abs(x1[0]-x0[0])<.01 and abs(x1[1]-x0[1])<.01, f'{x0} {x1}')
            # 맞아도 창은 그대로 + 경고, 창 위 체력이 따라 줄어요
            await ev(pg,"()=>{const G=__T.G;G.p.inv=0;__T.hurtPlayer(10,G.p.x+1,G.p.y)}")
            ok=await wait_until(pg,"()=>document.querySelector('#shHpTxt')?.textContent===String(Math.round(__T.G.p.hp))&&__T.G.p.hp<100")
            r=await ev(pg,"()=>[!document.querySelector('#sheetWrap').hidden,document.querySelector('#sheet').classList.contains('hit'),document.querySelector('#hurtEdge').classList.contains('on')]")
            await pg.screenshot(path=SP+'panel_hit.png')
            rec('창','맞아도 창은 그대로 + 빨간 경고 + 창 위 체력', ok and r==[True,True,True], f'{ok} {r}')
            # 창이 닫혀 있으면 경고 없음
            await ev(pg,"()=>{__T.closePanel();document.querySelector('#hurtEdge').classList.remove('on');const G=__T.G;G.p.inv=0;__T.hurtPlayer(5,G.p.x+1,G.p.y)}")
            r=await ev(pg,"()=>[document.querySelector('#hurtEdge').classList.contains('on'),document.querySelector('#sheet').classList.contains('hit')]")
            rec('창','창이 닫혀 있으면 가장자리 경고 없음', r==[False,False], str(r))
            # 창을 연 채 기절 → 창이 닫혀요
            await ev(pg,"()=>{__T.openPanel('inv')}"); await pg.wait_for_timeout(200)
            await ev(pg,"()=>{const G=__T.G;G.p.inv=0;__T.hurtPlayer(9999,G.p.x+1,G.p.y)}")
            r=await ev(pg,"()=>[__T.G.p.dead>0,document.querySelector('#sheetWrap').hidden]")
            rec('창','창을 연 채 기절하면 창이 닫혀요', r==[True,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_chests():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,canCraft,nearStations,maxCraft,linkedChests,availCount}")
    SETUP="""()=>{const G=__T.G;for(let y=104;y<118;y++)for(let x=104;x<122;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}for(let i=0;i<30;i++)G.inv[i]=null;G.enemies.length=0;G.p.x=110.5;G.p.y=112.5;
 const ch=(x,y,items)=>{const it=Array(18).fill(null);items.forEach((s,k)=>it[k]=s);G.objs.set(__T.idx(x,y),{t:'chest',items:it})};
 G.objs.set(__T.idx(110,110),{t:'bench'});ch(111,110,[{id:'wood',c:20}]);ch(112,110,[{id:'resin',c:2}]);ch(113,111,[{id:'fiber',c:9},{id:'minnow',c:1}]);ch(116,110,[{id:'stone',c:30}]);ch(104,104,[{id:'gel',c:9}])}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,SETUP)
            r=await ev(pg,"()=>__T.linkedChests().length"); rec('상자 연결','작업대에 붙은 상자 + 이어 붙은 상자(대각선 포함) 3개 연결', r==3, r)
            r=await ev(pg,"()=>[__T.availCount('wood'),__T.availCount('resin'),__T.availCount('fiber'),__T.availCount('stone'),__T.availCount('gel')]")
            rec('상자 연결','떨어진 상자·작업대와 안 붙은 상자는 제외', r==[20,2,9,0,0], str(r))
            r=await ev(pg,"()=>{const R=__T.RECIPES.find(r=>r.out==='chest');__T.openPanel('craft',{st:'bench'});const o=[__T.canCraft(R,__T.nearStations()),__T.maxCraft(R)];__T.closePanel();return o}")
            rec('상자 연결','가방이 비어도 상자 재료로 만들 수 있음', r==[True,2], str(r))
            await ev(pg,"()=>__T.openPanel('craft',{st:'bench'})"); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[[...document.querySelectorAll('.stations .chip')].map(e=>e.textContent).join('|'),!!document.querySelector('.sh-body .hint, .hint')]")
            rec('상자 연결','제작 창에 "연결된 상자 3개" 표시', '연결된 상자 3개' in r[0], r[0])
            idx=await ev(pg,"()=>__T.RECIPES.findIndex(r=>r.out==='chest')")
            await pg.tap('[data-a=tab][data-i=furn]'); await pg.wait_for_timeout(250)
            await ev(pg,f"()=>{{document.querySelector('[data-a=craft][data-i=\"{idx}\"]').scrollIntoView({{block:'center'}})}}"); await pg.wait_for_timeout(150)
            txt=await ev(pg,f"()=>document.querySelector('[data-a=craft][data-i=\"{idx}\"]').closest('.rc').querySelector('.ings').textContent")
            rec('상자 연결','재료 표시에 상자 개수 포함', '20/8' in txt and '2/1' in txt, txt)
            await pg.tap(f'[data-a=craft][data-i="{idx}"]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const G=__T.G,o=(x,y)=>G.objs.get(__T.idx(x,y)).items;return [o(111,110)[0]&&o(111,110)[0].c,o(112,110)[0]&&o(112,110)[0].c,__T.countItem('chest')]}")
            rec('상자 연결','만들면 상자에서 재료가 빠지고 결과는 가방으로', r==[12,1,1], str(r))
            r=await ev(pg,"()=>{const G=__T.G;__T.addItem('wood',5);__T.addItem('resin',1);const R=__T.RECIPES.find(r=>r.out==='chest');const ri=__T.RECIPES.indexOf(R);return ri}")
            await ev(pg,"()=>__T.closePanel()"); await ev(pg,"()=>__T.openPanel('craft',{st:'bench'})"); await pg.wait_for_timeout(600); await pg.tap('[data-a=tab][data-i=furn]'); await pg.wait_for_timeout(250)
            await ev(pg,f"()=>{{document.querySelector('[data-a=craft][data-i=\"{idx}\"]').scrollIntoView({{block:'center'}})}}"); await pg.wait_for_timeout(150)
            await pg.tap(f'[data-a=craft][data-i="{idx}"]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const G=__T.G,o=G.objs.get(__T.idx(111,110)).items;return [__T.countItem('wood'),o[0]&&o[0].c,__T.countItem('resin'),G.objs.get(__T.idx(112,110)).items[0]&&G.objs.get(__T.idx(112,110)).items[0].c]}")
            rec('상자 연결','가방 재료부터 쓰고 모자란 만큼 상자에서', r==[0,9,0,1], str(r))
            # anyFish from chest
            r=await ev(pg,"()=>{const G=__T.G;G.objs.get(__T.idx(116,110)).items[0]=null;G.objs.get(__T.idx(111,110)).items[1]={id:'stone',c:10};const R=__T.RECIPES.find(r=>r.out==='fishTank');return [R.at,__T.canCraft(R,__T.nearStations())]}")
            rec('상자 연결','물고기(아무 물고기) 재료도 상자에서 찾음', r[1]==True, str(r))
            # far away → nothing
            r=await ev(pg,"()=>{const G=__T.G;G.p.x=118.5;G.p.y=116.5;const n=__T.linkedChests().length;G.p.x=110.5;G.p.y=112.5;return n}")
            rec('상자 연결','작업대에서 멀어지면 연결 안 됨', r==0, r)
            # repair from chest
            r=await ev(pg,"()=>{const G=__T.G;for(let i=0;i<30;i++)G.inv[i]=null;G.tools=[{id:'pickWood',c:1,dur:10}];G.tsel=0;const bi=__T.idx(110,110);G.objs.set(bi,{t:'smelter'});__T.openPanel('craft',{st:'smelter',i:bi});return 1}  /* v61: repair at the 장비제작대 */")
            await pg.wait_for_timeout(500); await pg.tap('[data-a=tab][data-i=fix]'); await pg.wait_for_timeout(250)
            await pg.tap('[data-a=fix][data-i="t:0"]'); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>[__T.G.tools[0].dur,__T.G.objs.get(__T.idx(111,110)).items[0].c]")
            rec('상자 연결','수리 재료도 상자에서', r[0]==200 and r[1]<9, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3]); await pg.screenshot(path=SP+'chests.png'); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_craft_quantity():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{const G=__T.G;G.inv.fill(null);__T.addItem('wood',40);__T.addItem('stone',30);__T.addItem('mushroom',5);__T.addItem('berry',9);__T.addItem('copperBar',5);G.objs.set(__T.idx(Math.floor(G.p.x)+1,Math.floor(G.p.y)),{t:'bench'})}")
            await ev(pg,"()=>__T.openPanel('craft',{st:'bench'})"); await pg.wait_for_timeout(600)
            await ev(pg,"()=>{const b=document.querySelector('#sheet .sh-body');b.scrollTop=420}"); await pg.wait_for_timeout(100)
            top0=await ev(pg,"()=>document.querySelector('#sheet .sh-body').scrollTop")
            # click a visible enabled craft button
            idx=await ev(pg,"()=>{const b=document.querySelector('#sheet .sh-body'),r=b.getBoundingClientRect();const bt=[...b.querySelectorAll('button.mk:not([disabled])')].find(x=>{const q=x.getBoundingClientRect();return q.top>r.top&&q.bottom<r.bottom});return bt?bt.dataset.i:null}")
            await pg.wait_for_timeout(500)
            await pg.click(f'#sheet button.mk[data-i="{idx}"]'); await pg.wait_for_timeout(300)
            top1=await ev(pg,"()=>document.querySelector('#sheet .sh-body').scrollTop")
            rec('제작','만들기 눌러도 스크롤 위치 유지', top0>100 and abs(top0-top1)<2, f'{top0} → {top1} (recipe {idx})')
            # quantity: floorWood
            fi=await ev(pg,"()=>__T.RECIPES.findIndex(r=>r.out==='floorWood')")
            has=await ev(pg,f"()=>!!document.querySelector('#sheet [data-a=qty][data-i=\"{fi}:1\"]')")
            rec('수량','나무 바닥에 수량 선택', has)
            ci=await ev(pg,"()=>__T.RECIPES.findIndex(r=>r.out==='chair')")
            has2=await ev(pg,f"()=>!!document.querySelector('#sheet [data-a=qty][data-i^=\"{ci}:\"]')")
            rec('수량','의자(가구)는 수량 선택 없음', not has2)
            await pg.click(f'#sheet [data-a=qty][data-i="{fi}:1"]'); await pg.wait_for_timeout(100); await pg.click(f'#sheet [data-a=qty][data-i="{fi}:1"]'); await pg.wait_for_timeout(100)
            lbl=await ev(pg,f"()=>document.querySelector('#sheet [data-a=qty][data-i=\"{fi}:1\"]').parentElement.querySelector('b').textContent")
            w0=await ev(pg,"()=>__T.countItem('wood')"); f0=await ev(pg,"()=>__T.countItem('floorWood')")
            await pg.click(f'#sheet button.mk[data-i="{fi}"]'); await pg.wait_for_timeout(200)
            w1=await ev(pg,"()=>__T.countItem('wood')"); f1=await ev(pg,"()=>__T.countItem('floorWood')")
            rec('수량','+ 두 번 → 12개 표시, 나무 6개 써서 바닥 12개', lbl=='12개' and w0-w1==6 and f1-f0==12, f'{lbl} wood {w0}->{w1} floor {f0}->{f1}')
            await pg.click(f'#sheet [data-a=qty][data-i="{fi}:max"]'); await pg.wait_for_timeout(100)
            lbl=await ev(pg,f"()=>document.querySelector('#sheet [data-a=qty][data-i=\"{fi}:max\"]').parentElement.querySelector('b').textContent")
            rec('수량','최대 = 가진 재료만큼', lbl==f'{(w1//2)*4}개', f'{lbl} (wood {w1})')
            await pg.click(f'#sheet button.mk[data-i="{fi}"]'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.countItem('wood'), __T.G.inv.filter(Boolean).length]")
            rec('수량','최대로 만들면 나무가 1개 이하로 남음', r[0]<=1, str(r))
            await ev(pg,"()=>{document.querySelector('#sheet .sh-body').scrollTop=0}"); await pg.wait_for_timeout(100)
            await pg.screenshot(path=SP+'craft.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_drag_zones_layout():
    import asyncio, sys
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,ENEMY,FLOWERS,zoneTick,growTick,perform,canPlace,isSolid,mkEnemy,hitEnemy,genFlowerZones,maxHp,FLOOR_ITEM,refreshHotbar,renderPanel}")
    ARENA="()=>{const G=__T.G;for(let y=96;y<124;y++)for(let x=96;x<126;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.enemies.length=0;G.drops.length=0;G.p.x=105.5;G.p.y=110.5;G.p.face={x:1,y:0};G.p.dir='side';G.p.hp=__T.maxHp();for(let i=0;i<30;i++)G.inv[i]=null;G.sel=0;G.fzones=[{x:112,y:110,c:'R',dead:[]}]}"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx,pg,errs=await new_ctx(b,390,844,True)
            # ---------- petals & zones ----------
            r=await ev(pg,"()=>{const c=Object.keys(__T.FLOWERS);return [c.every(k=>__T.ITEMS['petal'+k]&&__T.ENEMY['bloom'+k]),c.map(k=>__T.ITEMS['petal'+k].n).join(',')]}")
            rec('꽃잎','꽃잎 5색 + 꽃망울 5종', r[0], r[1])
            r=await ev(pg,"()=>{const G=__T.G,z=G.fzones;return [z.length,z.every(q=>G.biome[__T.idx(q.x,q.y)]===0),[...new Set(z.map(q=>q.c))].sort().join('')]}")
            rec('구역','꽃망울 구역이 이끼 동굴에 색깔별로 생성', r[0]>=8 and r[1] and r[2]=='BKRWY', str(r))
            r=await ev(pg,"()=>{const G=__T.G,out=[];for(let k=0;k<25;k++){G.seed=1000+k*7919;const z=__T.genFlowerZones();out.push([z.length,new Set(z.map(q=>q.c)).size])}return out}")
            rec('구역','여러 세계에서도 5색 구역이 모두 생김', all(a>=8 and b2==5 for a,b2 in r), str(r))
            r=await ev(pg,"()=>{const G=__T.G,z=G.fzones;let ok=true;for(let a=0;a<z.length;a++)for(let b=a+1;b<z.length;b++)if(Math.hypot(z[a].x-z[b].x,z[a].y-z[b].y)<10)ok=false;return ok}")
            # 게임은 보통 13칸 넘게 띄우지만, 자리를 500번 넘게 못 찾으면 10칸까지 허용해요 (genFlowerZones). 지도에 따라 그런 경우가 있어서 10칸으로 봐요
            rec('구역','구역끼리 겹치지 않음', r, r)
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;for(let k=0;k<12;k++){G.time+=2;__T.zoneTick()}return G.enemies.filter(e=>e.zone===0).map(e=>e.k)}")
            rec('구역','구역에서 꽃망울이 최대 3마리까지 젠', len(r)==3 and all(k=='bloomR' for k in r), str(r))
            r=await ev(pg,"()=>{const G=__T.G;return G.enemies.every(e=>Math.hypot(e.x-112.5,e.y-110.5)<4.5)}")
            rec('구역','젠 위치가 구역 안', r, r)
            # calm behaviour
            r=await ev(pg,"()=>{const G=__T.G;const e=G.enemies[0];e.x=G.p.x+.3;e.y=G.p.y;G.p.inv=0;const h=G.p.hp;return h}")
            await pg.wait_for_timeout(1200)
            r2=await ev(pg,"()=>__T.G.p.hp")
            rec('꽃망울','먼저 때리지 않으면 공격하지 않음', r2==r, f'{r}->{r2}')
            r=await ev(pg,"()=>{const G=__T.G;const e=G.enemies[0];__T.hitEnemy(e,1,false);return e.angry>0}")
            rec('꽃망울','맞으면 화가 나서 반격', r, r)
            # kill → petal + respawn after a while
            r=await ev(pg,"()=>{const G=__T.G;G.drops.length=0;const e=G.enemies.find(e=>e.zone===0);__T.hitEnemy(e,999,false);return [G.drops.some(d=>d.id==='petalR'),G.fzones[0].dead.length]}")
            rec('꽃망울','쓰러뜨리면 빨간 꽃잎', r[0], str(r)); rec('구역','쓰러진 자리는 리젠 대기', r[1]==1, str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.time+=5;__T.zoneTick();__T.zoneTick();const a=G.enemies.filter(e=>e.zone===0).length;G.time+=45;__T.zoneTick();const b=G.enemies.filter(e=>e.zone===0).length;return [a,b]}")
            rec('구역','45초 뒤 다시 젠', r==[2,3], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.enemies.forEach(e=>{e.angry=0});const e=G.enemies.find(e=>e.zone===0);e.x=118.5;e.y=110.5;e.t=0;return 1}")
            await pg.wait_for_timeout(2500)
            r=await ev(pg,"()=>{const G=__T.G;return Math.max(...G.enemies.filter(e=>e.zone===0).map(e=>Math.hypot(e.x-112.5,e.y-110.5)))}")
            rec('꽃망울','구역 밖으로 나가면 돌아옴', r<5.5, f'{r:.2f}')
            # ---------- regrowth ----------
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;G.fzones=[];const i=__T.idx(107,110);G.objs.set(i,{t:'root'});__T.addItem('pickWood',1);for(let k=0;k<6&&G.objs.get(i);k++)__T.perform({k:'chop',t:{x:107,y:110},o:G.objs.get(i)});return G.objs.get(i)?G.objs.get(i).t:null}")
            rec('리젠','v87: 뿌리기둥을 베면 그루터기 없이 사라짐', r is None, str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.objs.set(__T.idx(107,110),{t:'stump',g:'root',at:G.time+200});G.p.x=106.5;G.p.face={x:1,y:0};const d=__T.decide();return [d.k,d.lbl]}")
            rec('리젠','옛 세이브 그루터기 앞 → 그루터기 안내 (새순이 돋기 전, v33)', r==['info','그루터기'], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.time+=241;__T.growTick();return G.objs.get(__T.idx(107,110)).t}")
            rec('리젠','옛 세이브 그루터기는 시간이 지나면 뿌리기둥으로 한 번 자람', r=='root', r)
            r=await ev(pg,"()=>{const G=__T.G;const i=__T.idx(105,110);G.p.x=105.5;G.objs.set(i,{t:'stump',g:'root',at:G.time-1});__T.growTick();return G.objs.get(i).t}")
            rec('리젠','플레이어가 서 있는 칸은 자라지 않음(갇힘 방지)', r=='stump', r)
            r=await ev(pg,"()=>{const G=__T.G;const i=__T.idx(108,112);G.objs.set(i,{t:'grass'});__T.perform({k:'chop',t:{x:108,y:112},o:G.objs.get(i)});const a=!!G.objs.get(i);G.time+=121;__T.growTick();return [a,G.objs.get(i)&&G.objs.get(i).t]}")
            rec('리젠','이끼풀도 2분 뒤 다시 자람', r==[False,'grass'], str(r))
            # ---------- saplings ----------
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;G.fzones=[];__T.addItem('sapling',2);G.sel=G.inv.findIndex(s=>s&&s.id==='sapling');const d=__T.decide();__T.perform(d);return [d.k,G.objs.get(__T.idx(106,110))&&G.objs.get(__T.idx(106,110)).t]}")
            rec('묘목','묘목을 이끼 바닥에 심기', r==['place','sapling'], str(r))
            r=await ev(pg,"()=>{const G=__T.G;G.floor[__T.idx(104,110)]=5;G.p.face={x:-1,y:0};return __T.decide().k}")
            rec('묘목','나무 바닥에는 못 심음', r!='place', r)
            r=await ev(pg,"()=>{const G=__T.G;G.time+=181;__T.growTick();return G.objs.get(__T.idx(106,110)).t}")
            rec('묘목','3분 뒤 뿌리기둥으로 자람', r=='root', r)
            r=await ev(pg,"()=>!!__T.RECIPES.find(r=>r.out==='sapling')&&__T.OBJ.root.drops.some(d=>d[0]==='sapling')")
            rec('묘목','묘목 얻는 법: 제작 + 뿌리기둥을 베면 (v87: 꼭 1개, 드롭 표가 아니라 afterCut)', r is False, r)
            # ---------- berry bush (v87: 삽으로 퍼내기 없음, 따면 사라지고 씨앗 1개) ----------
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;G.fzones=[];G.objs.set(__T.idx(106,110),{t:'bush'});__T.addItem('shovel',1);G.tsel=G.tools.findIndex(s=>s.id==='shovel');G.sel=-1;G.tHand=true;G.p.face={x:1,y:0};const d=__T.decide();return [d.k,!!G.objs.get(__T.idx(106,110))]}")
            rec('덤불','삽을 들고 덤불 앞 → 퍼내기 대신 따기', r==['harvest',True], str(r))
            r=await ev(pg,"()=>{const G=__T.G;__T.addItem('berryBush',1);G.sel=G.inv.findIndex(s=>s&&s.id==='berryBush');G.objs.delete(__T.idx(106,110));const d=__T.decide();__T.perform(d);const o=G.objs.get(__T.idx(106,110));return [d.k,o&&o.t,o&&o.r>G.time]}")
            rec('덤불','예전에 퍼 온 베리덤불은 놓을 수 있음 (바로 열매는 안 열림)', r==['place','bush',True], str(r))
            # ---------- nature decorations ----------
            r=await ev(pg,"()=>{const R=id=>__T.RECIPES.find(r=>r.out===id);const ids=r=>r.req.map(x=>x[0]).sort().join(',');const tot=r=>r.req.reduce((a,x)=>a+x[1],0);return {cherry:ids(R('cherryTree')),cherryN:tot(R('cherryTree')),tile:ids(R('floorCherry')),tileN:tot(R('floorCherry')),tree:ids(R('roundTree')),shrub:ids(R('shrub')),bed:ids(R('flowerBed')),water:__T.RECIPES.filter(r=>r.out.startsWith('water')).length}}")
            rec('꾸미기','벚꽃나무: 흙·이끼·나무·흰·빨간 꽃잎 (재료 많음)', r['cherry']=='dirt,gMoss,petalR,petalW,wood' and r['cherryN']>=30, str(r))
            rec('꾸미기','벚꽃 타일: 흙·이끼·흰·빨간 꽃잎 (재료 적음)', r['tile']=='dirt,gMoss,petalR,petalW' and r['tileN']<=5, str(r))  # v47: terrain materials x2
            rec('꾸미기','나무·덤불: 흙·이끼', r['tree']=='dirt,gMoss' and r['shrub']=='dirt,gMoss', str(r))
            rec('꾸미기','꽃밭: 흙·이끼·빨·파·노 꽃잎', r['bed']=='dirt,gMoss,petalB,petalR,petalY', str(r))
            rec('꾸미기','물 타일 여러 종류', r['water']>=5, str(r))
            await ev(pg,ARENA)
            r=await ev(pg,"()=>{const G=__T.G;G.fzones=[];['cherryTree','flowerBed','waterPond','floorCherry'].forEach(i=>__T.addItem(i,4));const put=(id,x,y)=>{G.sel=G.inv.findIndex(s=>s&&s.id===id);G.p.x=x-1+.5;G.p.y=y+.5;G.p.face={x:1,y:0};const d=__T.decide();__T.perform(d);return d.k};return [put('cherryTree',108,108),put('flowerBed',108,111),put('waterPond',108,114),put('floorCherry',108,116)]}")
            rec('꾸미기','벚꽃나무·꽃밭·물 타일·벚꽃 타일 설치', r==['place']*4, str(r))
            r=await ev(pg,"()=>[__T.isSolid(108,108),__T.isSolid(108,111),__T.isSolid(108,114),__T.G.floor[__T.idx(108,114)],__T.G.floor[__T.idx(108,116)]]")
            rec('꾸미기','벚꽃나무는 막히고 꽃밭·물 타일은 지나갈 수 있음', r[:3]==[True,False,False] and r[3]==12 and r[4]==16, str(r))
            r=await ev(pg,"()=>{const G=__T.G;__T.addItem('shovel',1);G.tsel=G.tools.findIndex(s=>s.id==='shovel');G.sel=-1;G.tHand=true;G.p.x=107.5;G.p.y=114.5;G.p.face={x:1,y:0};const d=__T.decide();__T.perform(d);return [d.lbl,G.floor[__T.idx(108,114)],__T.countItem('waterPond')]}")
            rec('꾸미기','물 타일도 삽으로 걷어 회수', r[0]=='걷기' and r[1]==1 and r[2]==4, str(r))
            await pg.wait_for_timeout(300); await ev(pg,"()=>{__T.G.p.x=105.5;__T.G.p.y=113.5}")
            await ev(pg,"""()=>{const G=__T.G;const put=(t,x,y)=>G.objs.set(__T.idx(x,y),{t});put('cherryTree',103,108);put('roundTree',100,110);put('shrub',101,112);put('hydrangea',102,112);put('roseBlack',103,112);put('sunflower',104,110);put('daisies',99,113);put('flowerBed',100,113);
          for(let y=114;y<=116;y++)for(let x=99;x<=103;x++)G.floor[__T.idx(x,y)]=[11,12,13,14,15][(x+y)%5];for(let x=104;x<=107;x++)G.floor[__T.idx(x,114)]=16;G.objs.set(__T.idx(106,108),{t:'sapling',at:G.time+170});G.objs.set(__T.idx(107,108),{t:'sapling',at:G.time+60});G.objs.set(__T.idx(108,108),{t:'stump',g:'root',at:G.time+99});
          for(const c of ['R','B','Y','W','K']){const e=__T.mkEnemy('bloom'+c,98+ 'RBYWK'.indexOf(c)*1.6,106.5);G.enemies.push(e)}}""")
            await ev(pg,"()=>{const G=__T.G;for(let x=99;x<=103;x++){G.floor[__T.idx(x,117)]=__T.WATER;G.floor[__T.idx(x,118)]=[11,16,5,12,15][x-99]}G.floor[__T.idx(104,116)]=__T.WATER}")
            await pg.wait_for_timeout(900); await pg.screenshot(path=SP+'garden.png')
            rec('꾸미기','물 타일·벚꽃 타일을 진짜 물 옆에 깔아도 화면 오류 없음', not errs, errs[:2])
            rec('기능','콘솔 오류 없음 (기능)', not errs, errs[:3]); await ctx.close()
            # ---------- drag & drop ----------
            for touch in [False, True]:
                ctx,pg,errs=await new_ctx(b,390 if touch else 1280,844 if touch else 800,touch)
                await ev(pg,"()=>{const G=__T.G;for(let i=0;i<30;i++)G.inv[i]=null;G.inv[0]={id:'wood',c:5};G.inv[1]={id:'stone',c:3};G.inv[8]={id:'wood',c:90};G.inv[12]={id:'gel',c:2};__T.refreshHotbar()}")
                await pg.wait_for_timeout(300)
                async def drag(a,b2,steps=8,hold=0):
                    await pg.evaluate("([a,b])=>{const B=document.querySelector(b);if(B&&B.closest('.sh-body'))B.scrollIntoView({block:'center'});}",[a,b2]); await pg.wait_for_timeout(100)
                    # 창 안의 그림이 늦게 그려지면 창이 커지면서 칸이 아래로 밀려요(컴퓨터가 바쁠수록). 칸이 멈춘 뒤 끌고, 놓기 직전에 목표 칸을 다시 재요
                    boxes=lambda: asyncio.gather(pg.locator(a).bounding_box(),pg.locator(b2).bounding_box())
                    ra,rb=await boxes()
                    for _ in range(40):
                        await pg.wait_for_timeout(50); ra2,rb2=await boxes()
                        if ra2==ra and rb2==rb: break
                        ra,rb=ra2,rb2
                    x0,y0=ra['x']+ra['width']/2,ra['y']+ra['height']/2; x1,y1=rb['x']+rb['width']/2,rb['y']+rb['height']/2
                    kind='touch' if touch else 'mouse'
                    await pg.dispatch_event(a,'pointerdown',{'pointerId':5,'pointerType':kind,'isPrimary':True,'clientX':x0,'clientY':y0,'button':0,'bubbles':True})
                    if hold: await pg.wait_for_timeout(hold)
                    for k in range(1,steps+1):
                        if k==steps: rb=await pg.locator(b2).bounding_box(); x1,y1=rb['x']+rb['width']/2,rb['y']+rb['height']/2
                        await pg.evaluate("([x,y,k])=>window.dispatchEvent(new PointerEvent('pointermove',{pointerId:5,pointerType:k,clientX:x,clientY:y,bubbles:true}))",[x0+(x1-x0)*k/steps,y0+(y1-y0)*k/steps,kind]); await pg.wait_for_timeout(16)
                    await pg.evaluate("([x,y,k])=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:5,pointerType:k,clientX:x,clientY:y,bubbles:true}))",[x1,y1,kind])
                    await pg.evaluate("([x,y])=>{const el=document.elementFromPoint(x,y);if(el)el.click()}",[x1,y1]); await pg.wait_for_timeout(250)
                nm='모바일' if touch else 'PC'
                await drag('#hotbar [data-i="0"]','#hotbar [data-i="3"]', hold=300 if touch else 0)
                r=await ev(pg,"()=>[__T.G.inv[0],__T.G.inv[3]&&__T.G.inv[3].id,__T.G.sel]")
                rec('드래그',f'{nm} 단축칸끼리 끌어서 옮기기', r[0] is None and r[1]=='wood', str(r))
                await pg.tap('#bInv') if touch else await pg.click('#bInv'); await pg.wait_for_timeout(600)
                await drag('#sheet [data-a=inv][data-i="12"]','#sheet [data-a=inv][data-i="2"]', hold=300 if touch else 0)
                r=await ev(pg,"()=>[__T.G.inv[12],__T.G.inv[2]&&__T.G.inv[2].id,document.querySelector('.detail')?1:0]")
                rec('드래그',f'{nm} 가방 → 단축칸 끌어 놓기', r[0] is None and r[1]=='gel', str(r))
                rec('드래그',f'{nm} 끌고 난 뒤 칸이 선택되지 않음', r[2]==0, str(r))
                await drag('#sheet [data-a=inv][data-i="3"]','#sheet [data-a=inv][data-i="8"]', hold=300 if touch else 0)
                r=await ev(pg,"()=>[__T.G.inv[3],__T.G.inv[8]&&__T.G.inv[8].c]")
                rec('드래그',f'{nm} 같은 물건 위에 놓으면 합쳐짐', r[0] is None and r[1]==95, str(r))
                await drag('#sheet [data-a=inv][data-i="1"]','#sheet [data-a=inv][data-i="1"]')
                r=await ev(pg,"()=>__T.G.inv[1]&&__T.G.inv[1].id"); rec('드래그',f'{nm} 제자리에 놓으면 그대로', r=='stone', r)
                if touch:
                    await ev(pg,"()=>{__T.closePanel();__T.openPanel('inv')}"); await pg.wait_for_timeout(500)
                    await drag('#sheet [data-a=inv][data-i="20"]','#sheet [data-a=inv][data-i="14"]',steps=6)
                    r=await ev(pg,"()=>[__T.G.inv[20],__T.G.inv[14],document.querySelector('.sh-body').scrollTop]")
                    rec('드래그','모바일 빈 칸에서 위아래로 밀어도 오류 없음', True, str(r))
                    await ev(pg,"()=>{__T.G.inv[26]={id:'dirt',c:4};__T.refreshHotbar()}"); await pg.wait_for_timeout(200)
                    await drag('#sheet [data-a=inv][data-i="26"]','#sheet [data-a=inv][data-i="14"]',steps=6)
                    r=await ev(pg,"()=>[__T.G.inv[26]&&__T.G.inv[26].id,__T.G.inv[14]]")
                    rec('드래그','모바일 빠르게 위로 밀면 옮기지 않고 스크롤', r[0]=='dirt' and r[1] is None, str(r))
                    # v86: 아이폰에서 「손 뗌」이 빠져 끌기 상태가 남아도, 다시 누르면 새 손가락으로 넘어가요 / 넘기는 중에 창이 다시 그려져도 계속 넘어가요
                    SW="""(o)=>{const b0=document.querySelector('#sheet .sh-body');b0.scrollTop=0;const top0=b0.scrollTop,room=b0.scrollHeight-b0.clientHeight; /* v91: 가방 설명 글을 빼서 넘길 거리가 줄었어요 — 맨 위에서 얼마나 넘어갔는지 봐요 */const el=()=>document.querySelector('#sheet [data-a=inv][data-i="20"]');
                      const r=el().getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,P=(t,id,yy,tg)=>(tg||window).dispatchEvent(new PointerEvent(t,{pointerId:id,pointerType:'touch',isPrimary:true,clientX:x,clientY:yy,button:0,bubbles:true}));
                      if(o.stuck)P('pointerdown',7,y,el()); /* 떼는 신호 없이 남은 손가락 */
                      P('pointerdown',8,y,el());P('pointermove',8,y-12);if(o.redraw)__T.renderPanel();P('pointermove',8,y-40);const b=document.querySelector('#sheet .sh-body'),top=b.scrollTop-top0;P('pointerup',8,y-40);return [top,b0.isConnected,room]}"""
                    r=await ev(pg,SW,{'stuck':True,'redraw':False})
                    rec('드래그','v86 모바일 끌기가 남은 채(손 뗌 놓침) 다시 밀어도 가방이 넘어감', r[2]>=40 and r[0]>=30, str(r))
                    r=await ev(pg,SW,{'stuck':False,'redraw':True})
                    rec('드래그','v86 모바일 넘기는 중에 창이 다시 그려져도 계속 넘어감', r[2]>=40 and r[0]>=30 and not r[1], str(r))
                await ev(pg,"()=>__T.closePanel()")
                # chest
                await ev(pg,"()=>{const G=__T.G;const i=__T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1);G.objs.set(i,{t:'chest',items:Array(18).fill(null)});G.objs.get(i).items[0]={id:'crystal',c:7};__T.openPanel('chest',{i})}")
                await pg.wait_for_timeout(600)
                await drag('#sheet [data-a=cout][data-i="0"]','#sheet [data-a=cin][data-i="15"]', hold=300 if touch else 0)
                r=await ev(pg,"()=>{const G=__T.G,o=G.objs.get(__T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1));return [o.items[0],G.inv[15]&&G.inv[15].id]}")
                rec('드래그',f'{nm} 상자 → 가방 원하는 칸', r[0] is None and r[1]=='crystal', str(r))
                await drag('#sheet [data-a=cin][data-i="2"]','#sheet [data-a=cout][data-i="5"]', hold=300 if touch else 0)
                r=await ev(pg,"()=>{const G=__T.G,o=G.objs.get(__T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1));return [o.items[5]&&o.items[5].id,G.inv[2]]}")
                rec('드래그',f'{nm} 가방 → 상자 원하는 칸', r[0]=='gel' and r[1] is None, str(r))
                r=await ev(pg,"()=>{let n=0;const seen=new Set();const G=__T.G,o=G.objs.get(__T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1));for(const s of [...G.inv,...o.items])if(s){n+=s.c}return n}")
                rec('드래그',f'{nm} 옮기는 동안 개수가 줄거나 늘지 않음', r==5+3+90+2+7+(4 if touch else 0), r)
                r=await ev(pg,"()=>!document.querySelector('#dragGhost')"); rec('드래그',f'{nm} 끌기 표시가 남지 않음', r, r)
                rec('기능',f'{nm} 드래그 콘솔 오류 없음', not errs, errs[:3]); await ctx.close()
            # ---------- mobile button layout ----------
            for (w,h,name) in [(390,844,'iPhone 14'),(360,640,'small Android'),(375,667,'iPhone SE'),(430,932,'Pro Max'),(844,390,'landscape')]:
                ctx,pg,errs=await new_ctx(b,w,h,True)
                await ev(pg,"()=>{document.body.classList.add('touch');const G=__T.G;G.rpg.sk.dash=1;G.rpg.slot=['dash',null];G.objs.set(__T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1),{t:'chair'});G.p.face={x:0,y:1};for(let k=0;k<3;k++)window.__toast&&0}")
                await pg.wait_for_timeout(500)
                r=await ev(pg,"""()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const cs=getComputedStyle(e);if(e.hidden||cs.display==='none')return null;const r=e.getBoundingClientRect();return r.width?{x:r.left,y:r.top,r:r.right,b:r.bottom}:null};
              const E={stat:q('#bStat'),map:q('#bMap'),bag:q('#bInv'),menu:q('#bMenu'),face:q('#face'),bars:q('#hud .stat'),act:q('#actBtn'),atk:q('#atkBtn'),sub:q('#subBtn'),sk:q('#skBar'),hot:q('#hotbar'),joy:q('#joy')};const ov=(a,b)=>a&&b&&a.x<b.r-1&&b.x<a.r-1&&a.y<b.b-1&&b.y<a.b-1;
              const bad=[];const ks=Object.keys(E).filter(k=>!(k==='face'));for(let a=0;a<ks.length;a++)for(let b=a+1;b<ks.length;b++)if(ov(E[ks[a]],E[ks[b]]))bad.push(ks[a]+'/'+ks[b]);
              const out=ks.filter(k=>E[k]&&k!=='joy'&&(E[k].x<0||E[k].y<0||E[k].r>innerWidth+1||E[k].b>innerHeight+1));
              const cx=e=>(e.x+e.r)/2,cy=e=>(e.y+e.b)/2;
              // v77: 오른쪽 위 세로(가로 화면은 가로) 캐릭터·지도·가방·설정 / 공격 위에 상호작용 / 스킬은 공격 왼쪽 / 작은 버튼은 상호작용 왼쪽
              const order=['stat','map','bag','menu'].map(k=>E[k]);const top=order.every(e=>e&&e.b<innerHeight*.6&&innerWidth-e.r<(innerWidth>innerHeight?innerWidth*.4:40));
              const seq=innerWidth>innerHeight?order.every((e,k)=>!k||e.x>order[k-1].x):order.every((e,k)=>!k||e.y>order[k-1].y);
              return {bad,out,top,seq,actAbove:E.act.b<=E.atk.y+1&&Math.abs(cx(E.act)-cx(E.atk))<16,skLeft:!E.sk||(E.sk.r<=E.atk.x+1&&E.sk.b>=E.atk.y),subLeft:!E.sub||(E.sub.r<=E.act.x+1&&cy(E.sub)>E.act.y&&cy(E.sub)<E.act.b)}}""")
                rec('레이아웃',f'{name} 버튼 겹침 없음', not r['bad'] and not r['out'], str(r))
                rec('레이아웃',f'{name} v77 오른쪽 위 캐릭터·지도·가방·설정 순서', r['top'] and r['seq'], str(r))
                rec('레이아웃',f'{name} v77 공격 위 상호작용 · 스킬은 공격 왼쪽 · 작은 버튼은 상호작용 옆', r['actAbove'] and r['skLeft'] and r['subLeft'], str(r))
                await pg.screenshot(path=SP+f'layout_{w}x{h}.png')
                await pg.tap('#bInv'); await pg.wait_for_timeout(600); await pg.tap('[data-a=bagNav][data-i=craft]'); await pg.wait_for_timeout(400)
                r=await ev(pg,"()=>[document.querySelector('.sh-head h2').textContent,!!document.querySelector('.otabs [data-i=craft].on')]"); rec('레이아웃',f'{name} 가방 → 제작 탭으로 손제작', '제작' in r[0] and r[1], str(r))
                if name=='iPhone 14':
                    await ev(pg,"()=>{__T.closePanel();__T.openPanel('craft',{st:'bench'})}"); await pg.wait_for_timeout(500); await pg.tap('[data-a=tab][data-i=build]'); await pg.wait_for_timeout(250); await pg.tap('[data-a=tab2][data-i=nature]'); await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'nature_tab.png')  # v62: 자연은 건축 탭의 2줄
                    r=await ev(pg,"()=>!document.querySelector('.otabs')"); rec('레이아웃','작업대 창에는 가방|제작 탭이 없음', r, r)
                await ev(pg,"()=>__T.closePanel()"); await pg.tap('#bInv'); await pg.wait_for_timeout(500)
                r=await ev(pg,"()=>document.querySelector('.sh-head h2').textContent"); rec('레이아웃',f'{name} 가방 버튼 동작', '가방' in r, r)
                rec('기능',f'{name} 콘솔 오류 없음', not errs, errs[:3]); await ctx.close()
            # ---------- save ----------
            ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const G=__T.G;G.regen=[[__T.idx(110,110),'grass',G.time+50,null]];G.fzones[0].dead=[G.time+30];const s=JSON.parse(JSON.stringify(__T.serialize()));const z=JSON.stringify(G.fzones.map(z=>[z.x,z.y,z.c]));__T.deserialize(s);return [JSON.stringify(G.fzones.map(z=>[z.x,z.y,z.c]))===z,__T.G.fzones[0].dead.length,__T.G.regen.length]}")
            rec('저장','꽃망울 구역·리젠 대기가 저장됨', r==[True,1,1], str(r))
            r=await ev(pg,"()=>{const s=__T.serialize();delete s.fzones;delete s.regen;__T.deserialize(s);return [__T.G.fzones.length,__T.G.regen.length]}")
            rec('저장','예전 세이브도 구역이 생김', r[0]>=8 and r[1]==0, str(r))
            rec('기능','콘솔 오류 없음 (저장)', not errs, errs[:3]); await ctx.close()
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_map_markers():
    import asyncio, sys
    # 지도: 찾았지만 안 연 보물상자 표시를 체크박스로 켜고 끄기
    H2=HOOK.replace("computeLight}","computeLight,mapChestOn}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            # a found-but-closed room in the middle of the explored map
            px="(()=>{const cv=document.querySelector('#mapCv');const g=cv.getContext('2d');let n=0;const d=g.getImageData(0,0,cv.width,cv.height).data;for(let i=0;i<d.length;i+=4)if(d[i]===255&&d[i+1]===210&&d[i+2]===92)n++;return n})()"
            await ev(pg,"()=>{const T=__T,G=T.G;for(let i=0;i<G.explored.length;i++)G.explored[i]=1;const rm=G.rooms[0];rm.found=1;rm.open=0;G.p.x=rm.cx+.5;G.p.y=rm.cy+3.5;T.openPanel('map')}"); await pg.wait_for_timeout(700)
            r=await ev(pg,"()=>{const c=document.querySelector('#sheet [data-a=mapChest]');return [!!c,c&&c.checked,"+px+"]}"); n_on=r[2]; r=r[:2]+[n_on>0]
            rec('지도','범례에 「찾았지만 안 연 보물상자」 체크박스 (처음엔 켜짐, 지도에 표시)', r==[True,True,True], str(r))
            await pg.screenshot(path=SP+'map.png')
            await pg.click('#sheet [data-a=mapChest]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const c=document.querySelector('#sheet [data-a=mapChest]');let ls=null;try{ls=localStorage.getItem('lantern-tree-map-chest')}catch(e){}return [c.checked,"+px+"<n_on,__T.mapChestOn(),ls]}".replace('n_on',str(n_on)))
            rec('지도','체크를 끄면 보물상자 표시가 사라지고 설정이 남음', r==[False,True,False,'0'], str(r))
            await ev(pg,"()=>{__T.closePanel();__T.openPanel('map')}"); await pg.wait_for_timeout(700)
            r=await ev(pg,"()=>[document.querySelector('#sheet [data-a=mapChest]').checked,"+px+"<"+str(n_on)+"]")
            rec('지도','지도를 다시 열어도 꺼진 채로', r==[False,True], str(r))
            await pg.click('#sheet [data-a=mapChest]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[document.querySelector('#sheet [data-a=mapChest]').checked,"+px+"==="+str(n_on)+"]")
            rec('지도','다시 켜면 다시 표시', r==[True,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_map_zoom_pan():
    import asyncio, sys
    # v94: 지도를 끌어서 옮기고, 휠·두 손가락·+−로 확대·축소, 「나」는 내 위치로, 끈 뒤 누르기는 워프 고르기가 아님
    H2=HOOK.replace("computeLight}","computeLight,mapView,UIS,W:L.W}") if 'L.W' in HOOK else HOOK.replace("computeLight}","computeLight,mapView,UIS}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{const T=__T,G=T.G;G.explored.fill(1);G.p.x=T.CX+.5;G.p.y=T.CY+20.5;T.openPanel('map')}"); await pg.wait_for_timeout(700)
            V="(()=>{const v=__T.mapView();return [Math.round(v.span),Math.round(v.ox+v.span/2),Math.round(v.oy+v.span/2)]})()"
            r0=await ev(pg,"()=>"+V)
            rec('지도','처음엔 나를 가운데로 90칸', r0[0]==90 and abs(r0[1]-int(await ev(pg,'()=>__T.G.p.x')))<=1, str(r0))
            bx=await (await pg.query_selector('#mapCv')).bounding_box(); cx=bx['x']+bx['width']/2; cy=bx['y']+bx['height']/2
            # 한 손가락(마우스) 끌기: 오른쪽으로 끌면 보이는 곳이 왼쪽으로
            await pg.mouse.move(cx,cy); await pg.mouse.down(); await pg.mouse.move(cx+60,cy+30,steps=6); await pg.mouse.up(); await pg.wait_for_timeout(100)
            r1=await ev(pg,"()=>"+V); k=90/bx['width']
            rec('지도','끌면 지도가 따라 움직임 (크기는 그대로)', r1[0]==90 and abs((r0[1]-r1[1])-60*k)<=2 and abs((r0[2]-r1[2])-30*k)<=2, str([r0,r1]))
            # 휠: 아래로 굴리면 축소, 위로 굴리면 확대, 커서 아래 칸은 그대로
            await pg.mouse.move(cx,cy); w0=await ev(pg,"()=>{const v=__T.mapView();return [v.ox+(300)/v.s,v.oy+300/v.s]}")
            await pg.mouse.wheel(0,-300); await pg.wait_for_timeout(100)
            r2=await ev(pg,"()=>{const v=__T.mapView();return [v.span,v.ox+300/v.s,v.oy+300/v.s]}")
            rec('지도','휠을 위로 굴리면 확대 (가운데 칸은 그대로)', r2[0]<90 and abs(r2[1]-w0[0])<.6 and abs(r2[2]-w0[1])<.6, str([w0,r2]))
            for _ in range(10): await pg.mouse.wheel(0,-300)
            await pg.wait_for_timeout(100)
            r3=await ev(pg,"()=>__T.mapView().span")
            rec('지도','가장 크게 확대해도 20칸까지', abs(r3-20)<.01, str(r3))
            for _ in range(20): await pg.mouse.wheel(0,300)
            await pg.wait_for_timeout(100)
            r4=await ev(pg,"()=>[__T.mapView().span===Math.max(__T.G.mapW||0,Math.sqrt(__T.G.wall.length)),__T.mapView().ox,__T.mapView().oy,document.querySelector('#sheet [data-a=mapzoom]').textContent,__T.mapView().span]")
            MX=r4[4]
            rec('지도','가장 작게 축소하면 지도 전체 (버튼은 「가까이 보기」)', r4[:4]==[True,0,0,'가까이 보기'], str(r4))
            # + − 버튼, 「나」 버튼
            await pg.click('#sheet [data-a=mapZ][data-i="1"]'); await pg.click('#sheet [data-a=mapZ][data-i="1"]'); await pg.wait_for_timeout(100)
            r5=await ev(pg,"()=>Math.round(__T.mapView().span)")
            await pg.click('#sheet [data-a=mapMe]'); await pg.wait_for_timeout(100)
            r6=await ev(pg,"()=>{const v=__T.mapView(),G=__T.G;return [Math.round(v.span),Math.abs(v.ox+v.span/2-G.p.x)<1,Math.abs(v.oy+v.span/2-G.p.y)<1]}")
            rec('지도','+ 두 번이면 전체의 1/2.25, 「나」는 크기 그대로 내 위치로', r5==round(MX/2.25) and r6==[r5,True,True], str([MX,r5,r6]))
            # 두 손가락 벌리기(가짜 포인터 두 개)
            r7=await ev(pg,"""()=>{const c=document.querySelector('#mapCv'),R=c.getBoundingClientRect(),X=R.left+R.width/2,Y=R.top+R.height/2,f=(t,id,x,y)=>c.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,bubbles:true,pointerType:'touch'}));
              const s0=__T.mapView().span;f('pointerdown',1,X-20,Y);f('pointerdown',2,X+20,Y);for(let k=1;k<=5;k++){f('pointermove',1,X-20-k*8,Y);f('pointermove',2,X+20+k*8,Y)}f('pointerup',1,X-60,Y);f('pointerup',2,X+60,Y);return [Math.round(s0),Math.round(__T.mapView().span)]}""")
            rec('지도','두 손가락을 벌리면 확대 (40px → 120px면 3배)', r7[1]<r7[0] and abs(r7[0]/r7[1]-3)<.2, str(r7))
            # 지도를 닫았다 열면 크기는 기억하고 나를 가운데로
            await ev(pg,"()=>{__T.closePanel();__T.openPanel('map')}"); await pg.wait_for_timeout(500)
            r8=await ev(pg,"()=>{const v=__T.mapView(),G=__T.G;return [Math.round(v.span),Math.abs(v.ox+v.span/2-G.p.x)<1]}")
            rec('지도','다시 열면 지난 크기 그대로, 나를 가운데로', r8==[r7[1],True], str(r8))
            await pg.click('#sheet [data-a=mapzoom]'); await pg.wait_for_timeout(100)
            await pg.click('#sheet [data-a=mapzoom]'); await pg.wait_for_timeout(100)
            r9=await ev(pg,"()=>Math.round(__T.mapView().span)")
            rec('지도','「전체 보기」 → 「가까이 보기」는 90칸', r9==90, str(r9))
            await pg.screenshot(path=SP+'map_zoom.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_map_nav():
    import asyncio, sys
    # v95: 범례 아이콘을 누르면 가장 가까운 그곳에 핀, 지도를 누르면 그 자리에 핀, 「위치 찾기」로 길 안내(화살표), 3칸 안에 오면 끝, 끄기
    H2=HOOK.replace("computeLight}","computeLight,mapView,UIS,navPt}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{const T=__T,G=T.G;G.explored.fill(1);G.backPt=null;G.p.x=T.CX+.5;G.p.y=T.CY+40.5;T.openPanel('map')}"); await pg.wait_for_timeout(700)
            r=await ev(pg,"()=>{const q=k=>document.querySelector('#sheet [data-a=mapFind][data-i='+k+']');return [!!q('tree'),(q('tree')?.querySelector('img')?.src||'').startsWith('data:image'),!!q('warp'),q('back')?.classList.contains('off'),!!document.querySelector('#sheet [data-a=mapChest]'),!!document.querySelector('#sheet [data-a=mapMe]')]}")
            rec('지도','범례가 아이콘 버튼 (등불나무·워프 …, 없는 것은 흐리게, 보물상자 표시 체크박스 그대로)', r==[True,True,True,True,True,True], str(r))
            await pg.click('#sheet [data-a=mapFind][data-i=back]'); await pg.wait_for_timeout(100)
            r=await ev(pg,"()=>[__T.UIS.mapPin,[...document.querySelectorAll('#toasts *,.toast')].map(x=>x.textContent).join('|')]")
            rec('지도','아직 없는 것을 누르면 핀 없이 「아직 찾지 못했어요」', r[0] is None and '아직 찾지 못했어요' in r[1], str(r))
            await pg.click('#sheet [data-a=mapFind][data-i=tree]'); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>{const T=__T,P=T.UIS.mapPin,v=T.mapView();return [P&&P.name,P&&P.x===T.CX+.5&&P.y===T.CY,Math.abs(v.ox+v.span/2-P.x)<1&&Math.abs(v.oy+v.span/2-P.y)<1,!!document.querySelector('#sheet [data-a=navGo]'),document.querySelector('#sheet .navgo span')?.textContent]}")
            rec('지도','등불나무 아이콘 → 핀을 꽂고 지도 가운데로, 「위치 찾기」 버튼', r[:4]==['등불나무',True,True,True] and '41칸' in (r[4] or ''), str(r))
            await pg.screenshot(path=SP+'map_nav_pin.png')
            await pg.click('#sheet [data-a=navGo]'); await pg.wait_for_timeout(100)
            r=await ev(pg,"()=>{const n=__T.navPt();return [document.querySelector('#sheetWrap').hidden,n&&n.name,__T.UIS.mapPin]}")
            rec('지도','「위치 찾기」 → 창이 닫히고 길 안내 시작', r==[True,'등불나무',None], str(r))
            await wait_game(pg,.3); await pg.screenshot(path=SP+'map_nav_arrow.png')
            await ev(pg,"()=>{const T=__T;T.G.p.x=T.CX+.5;T.G.p.y=T.CY+2.5}")
            await wait_until(pg,"()=>!__T.navPt()")
            r=await ev(pg,"()=>[__T.navPt(),[...document.querySelectorAll('#toasts *,.toast')].map(x=>x.textContent).join('|')]")
            rec('지도','3칸 안에 오면 길 안내가 끝나고 「도착했어요」', r[0] is None and '도착했어요' in r[1], str(r))
            # 지도를 누르면 그 자리에 핀 (장소 표시가 없는 곳)
            await ev(pg,"()=>{const T=__T;T.G.p.x=T.CX+.5;T.G.p.y=T.CY+40.5;T.openPanel('map')}"); await pg.wait_for_timeout(700)
            bx=await (await pg.query_selector('#mapCv')).bounding_box()
            tx,ty=bx['x']+bx['width']*.5,bx['y']+bx['height']*.85
            await pg.mouse.click(tx,ty); await pg.wait_for_timeout(150)
            r=await ev(pg,"()=>{const P=__T.UIS.mapPin,v=__T.mapView();return P&&[P.name,Math.abs(P.x-(v.ox+.5*v.span))<1.1,Math.abs(P.y-(v.oy+.85*v.span))<1.1,document.querySelector('#sheet .navgo span')?.textContent]}")
            rec('지도','지도를 누르면 그 칸에 핀 (「고른 곳」)', r is not None and r[:3]==['',True,True] and '고른 곳' in (r[3] or ''), str(r))
            await pg.click('#sheet [data-a=navGo]'); await pg.wait_for_timeout(100)
            await ev(pg,"()=>__T.openPanel('map')"); await pg.wait_for_timeout(700)
            r=await ev(pg,"()=>[!!__T.navPt(),document.querySelector('#sheet .navgo span')?.textContent||'',!!document.querySelector('#sheet [data-a=navOff]')]")
            rec('지도','지도를 다시 열면 「길 안내 중」 줄과 끄기 버튼', r[0] and '길 안내 중' in r[1] and r[2], str(r))
            await pg.click('#sheet [data-a=navOff]'); await pg.wait_for_timeout(100)
            r=await ev(pg,"()=>[__T.navPt(),!!document.querySelector('#sheet [data-a=navOff]')]")
            rec('지도','끄기 → 길 안내가 꺼짐', r==[None,False], str(r))
            # 끌어서 옮긴 뒤 손을 떼면 핀을 꽂지 않음
            cx,cy=bx['x']+bx['width']/2,bx['y']+bx['height']/2
            await pg.mouse.move(cx,cy); await pg.mouse.down(); await pg.mouse.move(cx+60,cy+40,steps=6); await pg.mouse.up(); await pg.wait_for_timeout(100)
            r=await ev(pg,"()=>__T.UIS.mapPin")
            rec('지도','끌어서 옮긴 뒤에는 핀이 안 꽂힘', r is None, str(r))
            # 다른 세계를 불러오면 길 안내가 없어짐
            await pg.click('#sheet [data-a=mapFind][data-i=tree]'); await pg.wait_for_timeout(100); await pg.click('#sheet [data-a=navGo]'); await pg.wait_for_timeout(100)
            r0=await ev(pg,"()=>!!__T.navPt()")
            await ev(pg,"()=>{const T=__T,s=T.serialize();T.deserialize(s)}")
            r=await ev(pg,"()=>__T.navPt()")
            rec('지도','불러오기를 하면 길 안내 없음', r0 and r is None, str([r0,r]))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_audio_resume():
    import asyncio, sys
    # v66 (BF-02): 화면 잠금·앱 전환 뒤 소리 장치가 「멈춤·끊김(아이폰)·닫힘」이면 다시 켜요. 브라우저가 막으면 다음 터치에서 다시. 소리 끔 설정은 그대로
    H2=HOOK.replace("computeLight}","computeLight,SFX,setSound,get soundOn(){return soundOn},audioState}")
    FAKE="""(()=>{window.__acs=[];window.__osc=0;window.__deny=false;const node=()=>({connect:x=>x||node(),start(){},stop(){},type:'',buffer:null,frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},Q:{value:0}});
 class FakeAC{constructor(){this.state='running';this.sampleRate=8000;this.currentTime=0;this.destination={};this.resumes=0;window.__acs.push(this)}
  resume(){this.resumes++;if(window.__deny)return Promise.reject(new Error('needs a tap'));this.state='running';return Promise.resolve()}
  createBuffer(c,n){return{getChannelData:()=>new Float32Array(n)}} createBufferSource(){return node()} createOscillator(){window.__osc++;return node()} createGain(){return node()} createBiquadFilter(){return node()}}
 window.AudioContext=FakeAC;window.webkitAudioContext=FakeAC;})()"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
            await ctx.add_init_script(FAKE)
            pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(400)
            await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>[window.__acs.length,__T.audioState()]")
            rec('소리','첫 터치에서 소리 장치를 만들고 켬', r==[1,'running'], str(r))
            r=await ev(pg,"async()=>{const a=window.__acs[0];a.state='interrupted';document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,50));return [a.state,a.resumes>0]}")
            rec('소리','화면으로 돌아오면 「끊김」(아이폰 잠금) 상태를 다시 켬', r==['running',True], str(r))
            r=await ev(pg,"async()=>{const a=window.__acs[0];a.state='suspended';a.resumes=0;window.__deny=true;window.dispatchEvent(new Event('pageshow'));await new Promise(r=>setTimeout(r,50));const s1=a.state,n1=a.resumes;window.__deny=false;document.dispatchEvent(new Event('pointerup'));await new Promise(r=>setTimeout(r,50));return [s1,n1,a.state,a.resumes]}")
            rec('소리','브라우저가 막으면 멈춘 채로 두고, 다음 터치에서 다시 켬', r[0]=='suspended' and r[1]>=1 and r[2]=='running' and r[3]>r[1], str(r))
            r=await ev(pg,"async()=>{window.__acs[0].state='closed';document.dispatchEvent(new Event('touchend'));await new Promise(r=>setTimeout(r,50));return [window.__acs.length,__T.audioState()]}")
            rec('소리','닫혀 버린 소리 장치는 새로 만듦', r==[2,'running'], str(r))
            r=await ev(pg,"async()=>{const T=__T;T.setSound(false);const a=window.__acs[window.__acs.length-1];a.state='interrupted';document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,50));const n=window.__osc;T.SFX.hit();const quiet=window.__osc===n;T.setSound(true);T.SFX.hit();return [a.state,T.soundOn,quiet,window.__osc>n]}")
            rec('소리','소리 끔 설정은 그대로 (끈 동안은 소리 안 남, 켜면 다시 남)', r==['running',True,True,True], str(r))
            r=await ev(pg,"async()=>{const n=window.__acs.length;document.dispatchEvent(new Event('visibilitychange'));document.dispatchEvent(new Event('pointerup'));await new Promise(r=>setTimeout(r,50));return window.__acs.length===n}")
            rec('소리','잘 켜져 있으면 아무것도 하지 않음 (장치를 겹쳐 만들지 않음)', r is True, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_bag_character_v83():
    import asyncio, sys
    # v83: 가방 창(바깥 탭·말풍선·버튼 줄·도구 주머니 접기·가까운 상자에 넣기) · 캐릭터 창(장비 10칸·장비 세트 I·II·III·세트별 펫·등불 탭) · 강화에 다른 세트 장비
    H2=HOOK.replace("computeLight}","computeLight,HOT,stashNear,switchSet,itemAt,get panel(){return panel}}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            # 가까운 상자에 넣기: 둘레 16칸 안, 같은 물건이 있는 상자만, 가까운 상자부터 (겹치기 → 빈칸), 단축칸은 그대로, 남으면 가방
            r=await ev(pg,"""()=>{const T=__T,G=T.G,px=Math.floor(G.p.x),py=Math.floor(G.p.y);for(let i=0;i<G.inv.length;i++)G.inv[i]=null;
              const put=(dx,dy,items)=>{const i=T.idx(px+dx,py+dy);G.objs.set(i,{t:'chest',items:items.concat(Array(16-items.length).fill(null))});return i};
              const near=put(2,0,[{id:'torch',c:98}]),far=put(6,0,[{id:'torch',c:1}]),out=put(20,0,[{id:'stone',c:1}]),other=put(-3,0,[{id:'berry',c:1}]);
              G.inv[0]={id:'torch',c:5};G.inv[T.HOT]={id:'torch',c:10};G.inv[T.HOT+1]={id:'stone',c:7};G.inv[T.HOT+2]={id:'gel',c:3};
              const r=T.stashNear(),c=i=>G.objs.get(i).items.filter(Boolean).map(s=>s.id+s.c).join(',');
              const res=[r.n,r.boxes,c(near),c(far),c(out),c(other),G.inv[0]&&G.inv[0].c,G.inv[T.HOT],G.inv[T.HOT+1]&&G.inv[T.HOT+1].c,G.inv[T.HOT+2]&&G.inv[T.HOT+2].c];
              for(const i of [near,far,out,other])G.objs.delete(i);return res}""")
            rec('가방','가까운 상자에 넣기: 16칸 안 같은 물건 있는 상자만, 가까운 상자부터(같은 물건 칸에 겹친 뒤 그 상자 빈칸), 단축칸·다른 물건은 그대로', r==[10,1,'torch99,torch9','torch1','stone1','berry1',5,None,7,3], str(r))
            # 가방 창: 바깥 탭, 제목 줄 없음, 장비·펫 없음, 버튼 줄과 말풍선
            await ev(pg,"()=>{const G=__T.G;G.inv[12]={id:'berry',c:4};__T.openPanel('inv')}"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const s=document.querySelector('#sheet');return [[...s.querySelectorAll('.otabs .otab')].map(e=>e.textContent.trim()).join('|'),!!s.querySelector('.otab.on[data-i=inv]'),!!s.querySelector('[data-a=eqSlot],[data-a=petOn]'),!!s.querySelector('[data-a=stashNear]'),!!s.querySelector('.bagbar'),s.querySelectorAll('.grid.hot9 .slot').length,Math.round(s.getBoundingClientRect().top),innerHeight]}")
            rec('가방','창 위 바깥 탭 가방|제작, 장비·펫 칸 없음, 상자에 넣기 버튼, 맨 아래 단축칸 9칸·버튼 줄, 폰은 아래 2/3', r[:6]==['가방|제작',True,False,True,True,9] and r[6]>r[7]*0.3, str(r))
            await ev(pg,"()=>document.querySelector('#sheet .slot[data-a=inv][data-i=\"12\"]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const s=document.querySelector('#sheet'),t=s.querySelector('#bagTip'),sl=s.querySelector('.slot[data-a=inv][data-i=\"12\"]');if(!t)return null;const a=t.getBoundingClientRect(),b=sl.getBoundingClientRect();return [t.innerText.includes('딸기')||t.innerText.length>0,a.bottom<=b.top+1||a.top>=b.bottom-1,!!s.querySelector('.bagbar [data-a=eat]'),!!s.querySelector('.bagbar [data-a=tohot]')]}")
            rec('가방','칸을 누르면 그 칸 위(또는 아래)에 말풍선, 버튼(먹기·단축칸으로)은 맨 아래 줄', r==[True,True,True,True], str(r))
            await pg.screenshot(path=SP+'bag_v83.png')
            r0=await ev(pg,"()=>!!document.querySelector('#sheet .slot[data-a=pouch]')")
            await ev(pg,"()=>document.querySelector('#sheet [data-a=pouchFold]').click()"); await pg.wait_for_timeout(200)
            r1=await ev(pg,"()=>!!document.querySelector('#sheet .slot[data-a=pouch]')")
            await ev(pg,"()=>{__T.closePanel();__T.openPanel('inv')}"); await pg.wait_for_timeout(400)
            r2=await ev(pg,"()=>!!document.querySelector('#sheet .slot[data-a=pouch]')")
            rec('가방','도구 주머니는 처음엔 접혀 있고, 펼친 상태를 기억', [r0,r1,r2]==[False,True,True], str([r0,r1,r2]))
            await ev(pg,"()=>__T.closePanel()")
            # 장비 세트: 세트마다 장비·펫을 따로, 가방 밖에 보관, 언제든 바꿈, 저장해도 그대로 (강화 단계도)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.pets={dog:1,cat:1};G.petOn='dog';G.equip.body={id:'frostRobe',c:1,lv:2};G.equip.head=null;
              const a=T.switchSet(1);const s2=[G.eqSet,G.equip.body,G.petOn];G.equip.head={id:'woolHat',c:1};G.petOn='cat';
              const up=T.itemAt('s:0:body');const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const L=[T.G.eqSet,T.G.equip.head&&T.G.equip.head.id,T.G.petOn,T.itemAt('s:0:body')&&T.itemAt('s:0:body').lv];
              T.switchSet(0);const back=[T.G.equip.body&&T.G.equip.body.id,T.G.equip.body&&T.G.equip.body.lv,T.G.equip.head,T.G.petOn,T.G.inv.filter(Boolean).length];T.switchSet(1);const b2=[T.G.equip.head&&T.G.equip.head.id,T.G.petOn];T.switchSet(0);
              return [a,s2,up&&up.id,L,back,b2]}""")
            rec('장비 세트','세트 II로 바꾸면 빈 장비·펫 없음, 세트마다 장비·펫 따로, 저장·불러오기 그대로(강화 +2 포함), 가방은 그대로', r==[True,[1,None,None],'frostRobe',[1,'woolHat','cat',2],['frostRobe',2,None,'dog',0],['woolHat','cat']], str(r))
            # 캐릭터 창: 바깥 탭 장비/스킬/등불, 세트 탭 왼쪽 바깥, 10칸, 새 칸은 안내, 강화에 다른 세트 장비
            await ev(pg,"()=>__T.openPanel('stat')"); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const s=document.querySelector('#sheet'),R=s.getBoundingClientRect(),st=s.querySelector('.stabs');return [[...s.querySelectorAll('.otab')].map(e=>e.textContent.trim()).join('|'),s.querySelectorAll('[data-a=chSlot]').length,st?Math.round(st.getBoundingClientRect().right-R.left):null,s.querySelectorAll('.stab').length,s.querySelectorAll('.eqme img').length]}")
            rec('캐릭터','바깥 탭 장비|스킬|등불, 세트 I·II·III는 창 왼쪽 바깥, 칸 10개 + 가운데 캐릭터', r[0]=='장비|스킬|등불' and r[1]==10 and r[2] is not None and r[2]<=2 and r[3]==3 and r[4]==1, str(r))
            await pg.screenshot(path=SP+'char_v83.png')
            await ev(pg,"()=>document.querySelector('#sheet [data-a=chSlot][data-i=legs]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>document.querySelector('#toasts').innerText.includes('아직 넣을 수 있는 물건이 없어요')")
            rec('캐릭터','새 칸(하의 등)은 「아직 넣을 수 있는 물건이 없어요」', r, r)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=eqSet][data-i=\"1\"]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[__T.G.eqSet,!!document.querySelector('#sheet .stab.on[data-i=\"1\"]')]")
            rec('캐릭터','세트 버튼을 누르면 그 세트로', r==[1,True], str(r))
            await ev(pg,"()=>document.querySelector('#sheet [data-a=chTab][data-i=lamp]').click()"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [t.includes('빛씨앗 0/5'),t.includes('13칸 안에는 몬스터'),!document.querySelector('#sheet .stabs')]}")
            rec('캐릭터','등불 탭: 단계·빛씨앗·몬스터 안 나오는 범위 (세트 탭은 장비 탭에만)', r==[True,True,True], str(r))
            await ev(pg,"()=>__T.closePanel()")
            await ev(pg,"()=>{const T=__T,G=T.G;G.objs.set(T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1),{t:'smelter'});T.openPanel('craft',{st:'smelter'})}"); await pg.wait_for_timeout(600)
            await ev(pg,"()=>document.querySelector('#sheet [data-a=tab][data-i=upg]').click()"); await pg.wait_for_timeout(200)
            r1=await ev(pg,"()=>[document.querySelector('#sheet').innerText.includes('세트 I · 상의'),!!document.querySelector('#sheet [data-a=upg][data-i=\"s:0:body\"]')]")
            await ev(pg,"()=>document.querySelector('#sheet [data-a=tab][data-i=salv]').click()"); await pg.wait_for_timeout(200)
            r2=await ev(pg,"()=>{const sv=!!document.querySelector('#sheet [data-a=salv][data-i^=\"s:\"]');const T=__T,G=T.G;T.closePanel();G.objs.delete(T.idx(Math.floor(G.p.x),Math.floor(G.p.y)+1));return sv}")
            r=r1+[r2]
            rec('장비 세트','강화 목록에 다른 세트 장비(세트 I 상의)가 보이고, 분해 목록에는 안 보임', r==[True,True,False], str(r))
            await ev(pg,"()=>__T.switchSet(0)")
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
