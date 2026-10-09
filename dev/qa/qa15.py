import asyncio, sys, json
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
MOCK="""window.__cloudMock=(()=>{const ls=()=>JSON.parse(localStorage.getItem('mockcloud')||'{}'),sv=o=>localStorage.setItem('mockcloud',JSON.stringify(o));let cb=null;const user=()=>{const u=localStorage.getItem('mockauth');return u?JSON.parse(u):null};
return{onAuth(f){cb=f;setTimeout(()=>f(user()),10)},async google(){const u={uid:'g1',displayName:'구글유저'};localStorage.setItem('mockauth',JSON.stringify(u));cb(u)},
async emailIn(e,p){if(p!=='secret1'){const er=new Error('x');er.code='auth/invalid-credential';throw er}const u={uid:'u_'+e,email:e};localStorage.setItem('mockauth',JSON.stringify(u));cb(u)},async emailUp(e,p){return this.emailIn(e,p)},
async out(){localStorage.removeItem('mockauth');cb(null)},async get(uid){return ls()[uid]||null},async put(uid,d){const o=ls();o[uid]=d;sv(o)}}})();"""
async def main():
    mkpage(SRC,'qa.html')
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
        await ctx.add_init_script(MOCK)
        pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('file://'+SP+'qa.html'); await pg.wait_for_timeout(500)
        await pg.tap('#btnNew'); await pg.wait_for_timeout(200); await pg.tap('#charGo'); await pg.wait_for_timeout(600)
        await ev(pg,"()=>{__T.addItem('crystal',33)}")
        await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(500)
        txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
        rec('클라우드','로그인 전: 구글/이메일 로그인 버튼', '구글로 로그인' in txt and '이메일로 로그인' in txt)
        await pg.tap('#sheet [data-a=clEmailT]'); await pg.wait_for_timeout(200)
        await pg.fill('#clEm','juyeon@test.kr'); await pg.fill('#clPw','i'); await pg.wait_for_timeout(100)
        rec('입력','입력칸에 i를 쳐도 가방이 열리지 않음', await ev(pg,"()=>document.querySelector('#sheet h2').textContent.includes('메뉴')"))
        await pg.tap('#sheet [data-a=clIn]'); await pg.wait_for_timeout(300)
        rec('클라우드','틀린 비밀번호 → 알아듣기 쉬운 안내', await ev(pg,"()=>document.querySelector('#toasts').innerText.includes('이메일이나 비밀번호가 맞지 않아요')"))
        await pg.fill('#clPw','secret1'); await pg.tap('#sheet [data-a=clIn]'); await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>{const c=JSON.parse(localStorage.getItem('mockcloud')||'{}')['u_juyeon@test.kr'];return [!!c, c&&JSON.parse(c.data).inv.some(s=>s&&s.id==='crystal'&&s.c===33), document.querySelector('#sheet .sh-body').innerText.includes('마지막 업로드')]}")
        rec('클라우드','로그인하면 바로 클라우드에 올라감', r==[True,True,True], str(r))
        await pg.screenshot(path=SP+'qa15_menu.png')
        # play more, auto upload via 지금 올리기
        await ev(pg,"()=>{__T.addItem('crystal',10)}"); await pg.tap('#sheet [data-a=clUpNow]'); await pg.wait_for_timeout(400)
        r=await ev(pg,"()=>JSON.parse(JSON.parse(localStorage.getItem('mockcloud'))['u_juyeon@test.kr'].data).inv.find(s=>s&&s.id==='crystal').c")
        rec('클라우드','지금 올리기', r==43, r)
        cloud=await ev(pg,"()=>localStorage.getItem('mockcloud')")
        await ctx.close()
        # second device: empty local save, logged in, cloud has data
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
        await ctx.add_init_script(MOCK); await ctx.add_init_script("if(!localStorage.getItem('mockcloud')){localStorage.setItem('mockcloud',"+json.dumps(cloud)+");localStorage.setItem('mockauth',JSON.stringify({uid:'u_juyeon@test.kr',email:'juyeon@test.kr'}))}")
        pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('file://'+SP+'qa.html'); await pg.wait_for_timeout(900)
        r=await ev(pg,"()=>[!document.querySelector('#cloudAsk').hidden, document.querySelector('#cloudAsk').innerText.slice(0,30)]")
        rec('다른 기기','새 기기 첫 화면에 클라우드 세이브 불러오기 안내', r[0], str(r))
        await pg.screenshot(path=SP+'qa15_title.png')
        await pg.tap('#cloudAsk [data-cl=take]'); await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>[document.querySelector('#title').hidden, __T.countItem('crystal')]")
        rec('다른 기기','불러오기 → 다른 기기 진행 그대로', r==[True,43], str(r))
        # local newer than cloud → auto upload, no prompt
        await ev(pg,"()=>{__T.addItem('crystal',7);__T.openPanel('menu');window.dispatchEvent(new Event('pagehide'))}"); await pg.wait_for_timeout(300)
        await pg.reload(); await pg.wait_for_timeout(900)
        r=await ev(pg,"()=>[document.querySelector('#cloudAsk').hidden, JSON.parse(JSON.parse(localStorage.getItem('mockcloud'))['u_juyeon@test.kr'].data).inv.find(s=>s&&s.id==='crystal').c]")
        rec('충돌','이 기기가 더 최근이면 묻지 않고 자동 업로드', r==[True,50], str(r))
        # cloud newer while playing → menu conflict box, keep local
        await pg.tap('#btnContinue'); await pg.wait_for_timeout(400)
        await ev(pg,"()=>{const o=JSON.parse(localStorage.getItem('mockcloud'));const d=o['u_juyeon@test.kr'];d.at=Date.now()+60000;localStorage.setItem('mockcloud',JSON.stringify(o))}")
        await ev(pg,"()=>{__T.openPanel('menu')}"); await pg.wait_for_timeout(700)
        await pg.tap('#sheet [data-a=clOut]'); await pg.wait_for_timeout(300)
        await pg.tap('#sheet [data-a=clEmailT]'); await pg.fill('#clEm','juyeon@test.kr'); await pg.fill('#clPw','secret1'); await pg.tap('#sheet [data-a=clIn]'); await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText.includes('클라우드에 더 최근 세이브가 있어요')")
        rec('충돌','클라우드가 더 최근이면 메뉴에서 고르게 함 (자동으로 덮어쓰지 않음)', r)
        await pg.screenshot(path=SP+'qa15_conflict.png')
        await pg.tap('#sheet [data-a=clKeep]'); await pg.wait_for_timeout(500)
        r=await ev(pg,"()=>!document.querySelector('#sheet .sh-body').innerText.includes('클라우드에 더 최근')")
        rec('충돌','이 기기 것 쓰기 → 클라우드에 덮어 올림', r)
        await ctx.close()
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
