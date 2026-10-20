# 저장: 세이브 파일·개발자 도구, 타이틀에서 불러오기, 백업, 클라우드, 플레이 시간·판 번호
# 실행: python3 dev/qa/run.py save   (테스트 하나만: python3 dev/qa/run.py save_file_dev_tools)
from harness import *


def test_save_file_dev_tools():
    import asyncio, sys, json
    async def main():
        mkpage(SRC,'qa.html')
        async with async_playwright() as p:
            b=await p.chromium.launch()
            ctx=await b.new_context(viewport={'width':1280,'height':800},accept_downloads=True)
            pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(400); await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(600)
            # build something recognizable
            await ev(pg,"()=>{const G=__T.G;G.p.x=105.5;G.p.y=110.5;__T.addItem('stone',77);G.objs.set(__T.idx(104,112),{t:'chair'})}")
            await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(500)
            html=await ev(pg,"()=>document.querySelector('#sheet').innerText")
            rec('세이브파일','v111: 기본 설정에는 내보내기/불러오기·클라우드 저장이 안 보임', '파일로 내보내기' not in html and '파일 불러오기' not in html and '클라우드 저장' not in html, html[-200:])
            rec('개발자','기본 상태에서는 개발자 도구가 안 보임', '마을 표시' not in html)
            # dev mode: tap title 7 times → 개발자 도구 + 세이브 파일·클라우드 (v111)
            for _ in range(7): await pg.click('#sheet [data-a=devtap]'); await pg.wait_for_timeout(60)
            html=await ev(pg,"()=>document.querySelector('#sheet').innerText")
            rec('개발자','메뉴 제목 7번 누르면 개발자 도구', '마을 표시' in html)
            rec('세이브파일','개발자 모드에서는 내보내기/불러오기 버튼', '파일로 내보내기' in html and '파일 불러오기' in html)
            async with pg.expect_download() as di:
                await pg.click('button[data-a=export]')
            d=await di.value; path=SP+'exported.json'; await d.save_as(path)
            j=json.load(open(path)); rec('세이브파일','내보낸 파일 형식', j.get('app')=='lantern-tree' and 'save' in j and d.suggested_filename.startswith('등불나무_세이브_') and d.suggested_filename.endswith('.json'), d.suggested_filename)
            # change the world, then import
            await ev(pg,"()=>{const G=__T.G;G.objs.delete(__T.idx(104,112));G.inv.fill(null);G.p.x=60.5;G.p.y=60.5}")
            await pg.set_input_files('#fileIn', path); await pg.wait_for_timeout(500)
            html=await ev(pg,"()=>document.querySelector('#sheet').innerText")
            rec('세이브파일','불러오기 전 확인 문구', '세이브로 바꿀까요' in html)
            await pg.click('button[data-a=impYes]'); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>{const G=__T.G;return [!!G.objs.get(__T.idx(104,112)), __T.countItem('stone'), Math.round(G.p.x*10)/10, !document.querySelector('#sheetWrap').hidden]}")
            rec('세이브파일','불러오면 세계·가방·위치 복원', r[0] and r[1]>=77 and r[2]==105.5 and not r[3], str(r))
            # bad file
            open(SP+'bad.json','w').write('{"hello":1}')
            await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(500)
            await pg.click('button[data-a=import]')
            await pg.set_input_files('#fileIn', SP+'bad.json'); await pg.wait_for_timeout(400)
            t=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('세이브파일','엉뚱한 파일은 거절', '세이브 파일이 아니에요' in t, t[-40:])
            html=await ev(pg,"()=>document.querySelector('#sheet').innerText")
            rec('개발자','개발자 모드는 다시 열어도 그대로', '마을 표시' in html)
            await pg.click('button[data-a=markAdd]'); await ev(pg,"()=>{__T.G.p.x=112.5;__T.G.p.y=116.5}"); await pg.wait_for_timeout(100); await pg.click('button[data-a=markAdd]'); await pg.wait_for_timeout(200)
            html=await ev(pg,"()=>document.querySelector('#sheet').innerText")
            rec('개발자','표시 2개 (시작/끝)', '마을 1 · 시작 (105, 110)' in html and '마을 1 · 끝 (112, 116)' in html, html[-120:])
            await pg.click('button[data-a=close]'); await ev(pg,"()=>{__T.G.p.x=108.5;__T.G.p.y=113.5}"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=SP+'marks.png')
            s=await ev(pg,"()=>__T.serialize().marks")
            rec('개발자','표시가 세이브에 포함', s==[{'x':105,'y':110},{'x':112,'y':116}], str(s))
            # toggle off
            await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(500)
            for _ in range(7): await pg.click('#sheet [data-a=devtap]'); await pg.wait_for_timeout(60)
            html=await ev(pg,"()=>document.querySelector('#sheet').innerText")
            rec('개발자','다시 7번 누르면 꺼짐', '마을 표시' not in html)
            await pg.click('button[data-a=close]'); await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'nomarks.png')
            await ctx.close()
            # title import on a fresh context with existing save
            ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
            pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(400); await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(500)
            await ev(pg,"()=>{localStorage.setItem('lantern-tree-save-v1',JSON.stringify(__T.serialize()))}")
            await pg.reload(); await pg.wait_for_timeout(600)
            await pg.screenshot(path=SP+'title.png')
            await pg.set_input_files('#fileIn', path)
            await ev(pg,"()=>{}")
            # simulate title origin
            await ev(pg,"()=>{}")
            await pg.click('#btnImport', no_wait_after=True) if False else None
            await pg.evaluate("()=>{}")
            await ctx.close()
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_title_import():
    # save_file_dev_tools가 만든 qa.html·exported.json을 이어서 써요 (run.py가 save_file_dev_tools 바로 다음에 같은 폴더에서 돌려요)
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
            await pg.screenshot(path=SP+'ask.png')
            vis=await ev(pg,"()=>!document.querySelector('#impAsk').hidden")
            rec('타이틀','기존 세이브가 있으면 확인창', vis)
            await pg.tap('#impAsk [data-imp=yes]'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[document.querySelector('#title').hidden, Math.round(__T.G.p.x*10)/10, JSON.parse(localStorage.getItem('lantern-tree-backups')||'[]').some(b=>b.reason==='세이브 파일 불러오기 전')]")
            rec('타이틀','불러오고 바로 시작 + 이전 세이브 백업', r[0] and r[1]==105.5 and r[2], str(r))
            await pg.screenshot(path=SP+'after.png')
            # fresh device with no save
            ctx2=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
            pg2=await ctx2.new_page(); pg2.on('pageerror',lambda e: errs.append(str(e)))
            await pg2.goto(URL+'qa.html'); await pg2.wait_for_timeout(500)
            async with pg2.expect_file_chooser() as fc: await pg2.tap('#btnImport')
            await (await fc.value).set_files(SP+'exported.json'); await pg2.wait_for_timeout(600)
            r=await ev(pg2,"()=>[document.querySelector('#title').hidden, Math.round(__T.G.p.x*10)/10]")
            rec('타이틀','새 기기: 확인 없이 바로 불러와 시작', r==[True,105.5], str(r))
            # mobile menu look
            await ev(pg2,"()=>__T.openPanel('menu')"); await pg2.wait_for_timeout(500); await pg2.screenshot(path=SP+'menu.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_backups():
    import asyncio, sys
    async def main():
        mkpage(SRC,'qa.html')
        async with async_playwright() as p:
            b=await p.chromium.launch(); errs=[]
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
            pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(400)
            await pg.tap('#btnNew'); await pg.wait_for_timeout(200)
            rec('보호','세이브가 없으면 확인 없이 바로 캐릭터 선택', await ev(pg,"()=>!document.querySelector('#charPick').hidden"))
            await pg.tap('#charGo'); await pg.wait_for_timeout(600)
            await ev(pg,"()=>{__T.addItem('crystal',42);__T.G.stats.wood=77}"); await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(400); await pg.click('#sheet [data-a=save]'); await pg.wait_for_timeout(200)
            await pg.reload(); await pg.wait_for_timeout(600)
            await pg.tap('#btnNew'); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[document.querySelector('#charPick').hidden, document.querySelector('#btnNew').textContent]")
            rec('보호','세이브가 있으면 새 모험 전에 한 번 더 확인', r[0] and '정말 새로 시작할까요' in r[1], str(r))
            await pg.tap('#btnNew'); await pg.wait_for_timeout(200); await pg.tap('#charGo'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>{const b=JSON.parse(localStorage.getItem('lantern-tree-backups')||'[]');return [b.length, b[0]&&b[0].reason, b[0]&&JSON.parse(b[0].data).stats.wood, __T.countItem('crystal')]}")
            rec('백업','새로 시작하면 이전 세이브가 백업됨', r[0]==1 and r[1]=='새 모험 시작 전' and r[2]==77 and r[3]==0, str(r))
            await pg.reload(); await pg.wait_for_timeout(600)
            rec('백업','첫 화면에 백업에서 되돌리기 버튼', await ev(pg,"()=>!document.querySelector('#btnBackups').hidden"))
            await pg.tap('#btnBackups'); await pg.wait_for_timeout(200); await pg.screenshot(path=SP+'backups.png')
            await pg.tap('#bkList [data-bk="0"]'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[document.querySelector('#title').hidden, __T.countItem('crystal'), __T.G.stats.wood, JSON.parse(localStorage.getItem('lantern-tree-backups')).length]")
            rec('백업','되돌리면 6시간짜리(?) 세이브 복구 + 지금 것도 백업', r[0] and r[1]==42 and r[2]==77 and r[3]==2, str(r))
            # menu restart backs up
            await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(700); await pg.click('#sheet [data-a=newgame]'); await pg.wait_for_timeout(100)
            t=await ev(pg,"()=>document.querySelector('#sheet [data-a=newgame]').textContent"); await pg.click('#sheet [data-a=newgame]'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const b=JSON.parse(localStorage.getItem('lantern-tree-backups'));return [b.length,b[0].reason]}")
            rec('백업','메뉴에서 처음부터 다시 하기도 백업 (최대 3개)', '백업돼요' in t and r==[3,'처음부터 다시 하기 전'], f'{t} {r}')
            await ctx.close()
            # storage blocked
            ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
            await ctx.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})")
            pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append('blocked-ctx: '+str(e)))
            await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[!document.querySelector('#saveWarn').hidden, document.querySelector('#saveWarn').textContent.slice(0,22)]")
            rec('경고','저장이 막힌 환경이면 첫 화면에 경고', r[0], str(r))
            await pg.screenshot(path=SP+'warn.png')
            await pg.tap('#btnNew'); await pg.wait_for_timeout(200); await pg.tap('#charGo'); await pg.wait_for_timeout(800)
            r=await ev(pg,"()=>document.querySelector('#toasts').innerText.includes('저장이 되지 않아요')")
            rec('경고','플레이 중 자동 저장이 실패하면 알림', r)
            await ctx.close()
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_cloud_sync():
    import asyncio, sys, json
    MOCK="""window.__cloudMock=(()=>{const ls=()=>JSON.parse(localStorage.getItem('mockcloud')||'{}'),sv=o=>localStorage.setItem('mockcloud',JSON.stringify(o));let cb=null;const user=()=>{const u=localStorage.getItem('mockauth');return u?JSON.parse(u):null};
return{onAuth(f){cb=f;setTimeout(()=>{f(user());setTimeout(()=>{window.__cloudReady=1},30)},10)},async google(){const u={uid:'g1',displayName:'구글유저'};localStorage.setItem('mockauth',JSON.stringify(u));cb(u)},
async emailIn(e,p){if(p!=='secret1'){const er=new Error('x');er.code='auth/invalid-credential';throw er}const u={uid:'u_'+e,email:e};localStorage.setItem('mockauth',JSON.stringify(u));cb(u)},async emailUp(e,p){return this.emailIn(e,p)},
async out(){localStorage.removeItem('mockauth');cb(null)},async get(uid){return ls()[uid]||null},async put(uid,d){const o=ls();o[uid]=d;sv(o)}}})();"""
    async def main():
        mkpage(SRC,'qa.html')
        async with async_playwright() as p:
            b=await p.chromium.launch(); errs=[]
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
            await ctx.add_init_script(MOCK)
            pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html?dev=1'); await pg.wait_for_timeout(500)
            await pg.tap('#btnNew'); await pg.wait_for_timeout(200); await pg.tap('#charGo'); await pg.wait_for_timeout(600)
            await ev(pg,"()=>{__T.addItem('crystal',33)}")
            await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(500)
            txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
            rec('클라우드','로그인 전: 구글/이메일 로그인 버튼', '구글로 로그인' in txt and '이메일로 로그인' in txt)
            await pg.tap('#sheet [data-a=clEmailT]'); await pg.wait_for_timeout(200)
            await pg.fill('#clEm','juyeon@test.kr'); await pg.fill('#clPw','i'); await pg.wait_for_timeout(100)
            rec('입력','입력칸에 i를 쳐도 가방이 열리지 않음', await ev(pg,"()=>document.querySelector('#sheet h2').textContent.includes('설정')"))
            await pg.tap('#sheet [data-a=clIn]'); await pg.wait_for_timeout(300)
            rec('클라우드','틀린 비밀번호 → 알아듣기 쉬운 안내', await ev(pg,"()=>document.querySelector('#toasts').innerText.includes('이메일이나 비밀번호가 맞지 않아요')"))
            await pg.fill('#clPw','secret1'); await pg.tap('#sheet [data-a=clIn]'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>{const c=JSON.parse(localStorage.getItem('mockcloud')||'{}')['u_juyeon@test.kr'];return [!!c, c&&JSON.parse(c.data).inv.some(s=>s&&s.id==='crystal'&&s.c===33), document.querySelector('#sheet .sh-body').innerText.includes('마지막 업로드')]}")
            rec('클라우드','로그인하면 바로 클라우드에 올라감', r==[True,True,True], str(r))
            await pg.screenshot(path=SP+'menu.png')
            # v111: 「지금 올리기」 대신 「지금 저장하기」가 클라우드에도 올려요
            await ev(pg,"()=>{__T.addItem('crystal',10)}"); await pg.tap('#sheet [data-a=save]'); await pg.wait_for_timeout(400)
            r=await ev(pg,"()=>JSON.parse(JSON.parse(localStorage.getItem('mockcloud'))['u_juyeon@test.kr'].data).inv.find(s=>s&&s.id==='crystal').c")
            rec('클라우드','지금 저장하기 → 클라우드에도 올라감 (「지금 올리기」 버튼 없음)', r==43 and not await ev(pg,"()=>!!document.querySelector('#sheet [data-a=clUpNow]')"), r)
            cloud=await ev(pg,"()=>localStorage.getItem('mockcloud')")
            await ctx.close()
            # second device: empty local save, logged in, cloud has data
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
            await ctx.add_init_script(MOCK); await ctx.add_init_script("if(!localStorage.getItem('mockcloud')){localStorage.setItem('mockcloud',"+json.dumps(cloud)+");localStorage.setItem('mockauth',JSON.stringify({uid:'u_juyeon@test.kr',email:'juyeon@test.kr'}))}")
            pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL+'qa.html?dev=1'); await cloud_ready(pg)
            r=await ev(pg,"()=>[!document.querySelector('#cloudAsk').hidden, document.querySelector('#cloudAsk').innerText.slice(0,30)]")
            rec('다른 기기','새 기기 첫 화면에 클라우드 세이브 불러오기 안내', r[0], str(r))
            await pg.screenshot(path=SP+'title.png')
            await pg.tap('#cloudAsk [data-cl=take]'); await pg.wait_for_timeout(600); await wait_until(pg,"()=>document.querySelector('#title').hidden",5000)
            r=await ev(pg,"()=>[document.querySelector('#title').hidden, __T.countItem('crystal')]")
            rec('다른 기기','불러오기 → 다른 기기 진행 그대로', r==[True,43], str(r))
            # same adventure (same run id), local newer than cloud → auto upload, no prompt (v32: different adventures always ask, see play_time_cloud)
            await ev(pg,"()=>{__T.addItem('crystal',7);__T.openPanel('menu');window.dispatchEvent(new Event('pagehide'))}"); await pg.wait_for_timeout(300)
            # 다시 연 뒤 클라우드 확인·업로드는 뒤에서 끝나요. 바쁘면 0.9초 안에 안 끝나서, 클라우드가 바뀔 때까지 (최대 5초) 기다려요
            await pg.reload(); await cloud_ready(pg)
            await wait_until(pg,"()=>{const c=JSON.parse(localStorage.getItem('mockcloud')||'{}')['u_juyeon@test.kr'];return !!c&&JSON.parse(c.data).inv.find(s=>s&&s.id==='crystal').c===50}",5000)
            r=await ev(pg,"()=>[document.querySelector('#cloudAsk').hidden, JSON.parse(JSON.parse(localStorage.getItem('mockcloud'))['u_juyeon@test.kr'].data).inv.find(s=>s&&s.id==='crystal').c]")
            rec('충돌','같은 모험이고 이 기기가 더 최근이면 묻지 않고 자동 업로드', r==[True,50], str(r))
            # cloud newer while playing → menu conflict box, keep local
            await pg.tap('#btnContinue'); await pg.wait_for_timeout(400)
            await ev(pg,"()=>{const o=JSON.parse(localStorage.getItem('mockcloud'));const d=o['u_juyeon@test.kr'];d.at=Date.now()+60000;localStorage.setItem('mockcloud',JSON.stringify(o))}")
            await ev(pg,"()=>{__T.openPanel('menu')}"); await pg.wait_for_timeout(700)
            await pg.tap('#sheet [data-a=clOut]'); await pg.wait_for_timeout(300)
            await pg.tap('#sheet [data-a=clEmailT]'); await pg.fill('#clEm','juyeon@test.kr'); await pg.fill('#clPw','secret1'); await pg.tap('#sheet [data-a=clIn]'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText.includes('클라우드에 더 최근 세이브가 있어요')")
            rec('충돌','클라우드가 더 최근이면 메뉴에서 고르게 함 (자동으로 덮어쓰지 않음)', r)
            await pg.screenshot(path=SP+'conflict.png')
            await pg.tap('#sheet [data-a=clKeep]'); await pg.wait_for_timeout(500)
            r=await ev(pg,"()=>!document.querySelector('#sheet .sh-body').innerText.includes('클라우드에 더 최근')")
            rec('충돌','이 기기 것 쓰기 → 클라우드에 덮어 올림', r)
            await ctx.close()
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_play_time_cloud():
    import asyncio, sys, json
    # v32: 플레이 시간·구간 기록, 판 번호(run), 다른 모험이면 항상 묻기, 클라우드 백업, 타이틀에서 클라우드 이어하기, 옛 세이브
    H2=HOOK.replace("computeLight}","computeLight,fmtPlay,checkGuide,GUIDE,get lastInputAt(){return lastInputAt},set lastInputAt(v){lastInputAt=v},get CLOUD(){return CLOUD}}")
    MOCK="""window.__cloudMock=(()=>{const ls=()=>JSON.parse(localStorage.getItem('mockcloud')||'{}'),sv=o=>localStorage.setItem('mockcloud',JSON.stringify(o));let cb=null;const user=()=>{const u=localStorage.getItem('mockauth');return u?JSON.parse(u):null};
return{onAuth(f){cb=f;setTimeout(()=>{f(user());setTimeout(()=>{window.__cloudReady=1},30)},10)},async google(){const u={uid:'g1',displayName:'구글유저'};localStorage.setItem('mockauth',JSON.stringify(u));cb(u)},
async emailIn(e,p){if(p!=='secret1'){const er=new Error('x');er.code='auth/invalid-credential';throw er}const u={uid:'u_'+e,email:e};localStorage.setItem('mockauth',JSON.stringify(u));cb(u)},async emailUp(e,p){return this.emailIn(e,p)},
async out(){localStorage.removeItem('mockauth');cb(null)},async get(uid){return ls()[uid]||null},async put(uid,d){const o=ls();o[uid]=d;sv(o)}}})();"""
    UID='u_juyeon@test.kr'
    CRY="(d)=>{const s=JSON.parse(d);const x=s.inv.find(q=>q&&q.id==='crystal');return x?x.c:0}"
    async def ctx_with(b, cloud=None, auth=False, local=None):
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
        await ctx.add_init_script(MOCK)
        # 예전 세이브는 이 브라우저 창(context)에서 처음 열 때 한 번만 깔아요. 표시는 localStorage에 둬요
        # (sessionStorage에 두면 바쁠 때 다시 열면서 표시가 사라져, 예전 세이브를 다시 깔아 버리는 일이 있었어요 — play_time_cloud가 가끔 실패하던 원인)
        init="if(!localStorage.getItem('qa_seeded')){localStorage.setItem('qa_seeded','1');"
        if cloud is not None: init+="localStorage.setItem('mockcloud',JSON.stringify("+json.dumps(cloud)+"));"
        if auth: init+="localStorage.setItem('mockauth',JSON.stringify({uid:'"+UID+"',email:'juyeon@test.kr'}));"
        if local is not None: init+="localStorage.setItem('lantern-tree-save-v1',"+json.dumps(local)+");"
        init+="}"
        await ctx.add_init_script(init)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto(URL+'qa.html?dev=1'); await cloud_ready(pg)
        return ctx,pg,errs
    async def start_new(pg):
        await pg.tap('#btnNew'); await pg.wait_for_timeout(200)
        if await pg.evaluate("()=>/정말/.test(document.querySelector('#btnNew').textContent)"): await pg.tap('#btnNew'); await pg.wait_for_timeout(200)
        await pg.tap('#charGo'); await pg.wait_for_timeout(600)
    async def menu_login(pg):
        await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(600)
        await pg.tap('#sheet [data-a=clEmailT]'); await pg.wait_for_timeout(150)
        await pg.fill('#clEm','juyeon@test.kr'); await pg.fill('#clPw','secret1'); await pg.tap('#sheet [data-a=clIn]'); await pg.wait_for_timeout(1100)
    cloud_of = "()=>JSON.parse(localStorage.getItem('mockcloud')||'{}')['"+UID+"']||null"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); allerr=[]
            # ---- play time & quest records ----
            ctx,pg,errs=await new_ctx(b,390,844,True); allerr+=errs
            r=await ev(pg,"()=>[__T.G.playT,typeof __T.G.run,__T.G.run.length>6,__T.G.playTEst]")
            rec('플레이 시간','새 게임: 0초에서 시작, 판 번호가 생김', r[0]<1 and r[1]=='string' and r[2] and r[3] is False, str(r))
            for _ in range(6):
                await pg.dispatch_event('#game','pointermove') if await pg.query_selector('#game') else await pg.mouse.move(100,300)
                await pg.wait_for_timeout(250)
            t1=await ev(pg,"()=>__T.G.playT")
            rec('플레이 시간','움직이는 동안 플레이 시간이 쌓임', 1.0<t1<3.0, t1)
            await ev(pg,"()=>{__T.lastInputAt=performance.now()-121000}"); a=await ev(pg,"()=>__T.G.playT"); await pg.wait_for_timeout(700); c=await ev(pg,"()=>__T.G.playT")
            rec('플레이 시간','2분 넘게 아무 입력이 없으면 세지 않음 (자리 비움)', abs(c-a)<0.01, [a,c])
            await ev(pg,"()=>{__T.lastInputAt=performance.now();__T.G.playT=1234}")
            await ev(pg,"()=>{__T.G.stats.naruMet=1;__T.G.stats.wood=6;__T.checkGuide()}"); await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[__T.G.qt.wood,__T.G.guide]")
            rec('구간 기록','목표를 이루면 그때 플레이 시간이 남음', r[0] is not None and 1234<=r[0]<=1240 and r[1]>=1, str(r))
            r=await ev(pg,"()=>[__T.fmtPlay(30),__T.fmtPlay(125),__T.fmtPlay(3*3600+12*60+5),__T.fmtPlay(7200,true)]")
            rec('표시','시간 표시 형식', r==['1분 미만','2분','3시간 12분','약 2시간 0분'], str(r))
            await ev(pg,"()=>__T.openPanel('profile')"); await pg.wait_for_timeout(600) # v111: 플레이 기록은 프로필로
            await pg.tap('#sheet [data-a=qtShow]'); await pg.wait_for_timeout(250)
            txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
            rec('프로필','프로필에 플레이 시간과 구간 기록', '플레이 시간' in txt and '20분' in txt and '뿌리기둥을 베어 나무 모으기' in txt, txt[:200])
            await pg.screenshot(path=SP+'menu.png')
            # save round trip
            r=await ev(pg,"()=>{const s=__T.serialize();const run=__T.G.run;__T.deserialize(JSON.parse(JSON.stringify(s)));return [s.run===run,__T.G.run===run,__T.G.playT===s.playT,__T.G.qt.wood===s.qt.wood,__T.G.playTEst]}")
            rec('세이브','판 번호·플레이 시간·구간 기록이 저장되고 그대로 불러와짐', r==[True,True,True,True,False], str(r))
            # old save (before v32)
            r=await ev(pg,"""()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));delete s.run;delete s.playT;delete s.qt;delete s.playTEst;s.time=3600;s.stats.wood=6;
           __T.deserialize(s);return [__T.G.playT,__T.G.playTEst,typeof __T.G.run==='string'&&__T.G.run.length>6,Object.keys(__T.G.qt).length]}""")
            rec('옛 세이브','옛 세이브: 플레이 시간은 어림값(게임 시간), 판 번호를 새로 붙임', r==[3600,True,True,0], str(r))
            r=await ev(pg,"()=>{__T.checkGuide();return __T.fmtPlay(__T.G.playT,__T.G.playTEst)}")
            rec('옛 세이브','어림값은 "약"으로 표시', r=='약 1시간 0분', r)
            await ctx.close()
            # old save loaded through the title: already-cleared quests are NOT stamped with today's time
            old=await (await b.new_context()).new_page()
            await old.goto(URL+'qa.html?dev=1'); await old.wait_for_timeout(500)
            olds=await old.evaluate("()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));delete s.run;delete s.playT;delete s.qt;delete s.playTEst;delete s.stats.naru110;s.time=5000;s.stats.wood=9;s.stats.bench=1;return JSON.stringify(s)}")
            await old.context.close()
            ctx,pg,errs=await ctx_with(b, local=olds); allerr+=errs
            await pg.tap('#btnContinue'); await pg.wait_for_timeout(600)
            r=await ev(pg,"()=>[__T.G.guide>=2,Object.keys(__T.G.qt).length,__T.G.playTEst,JSON.parse(localStorage.getItem('lantern-tree-save-v1')).run===__T.G.run]")
            rec('옛 세이브','이어하기: 이미 이룬 목표에 오늘 시간을 찍지 않음, 판 번호는 저장됨', r==[True,0,True,True], str(r))
            await ctx.close()

            # ---- cloud: device A makes an adventure and uploads it ----
            ctx,pg,errs=await ctx_with(b); allerr+=errs
            r=await ev(pg,"()=>[!document.querySelector('#btnCloud').hidden,document.querySelector('#btnCloud').textContent]")
            rec('타이틀','로그인 전에도 타이틀에 "클라우드에서 이어하기" 버튼', r[0] and '로그인' in r[1], str(r))
            await start_new(pg)
            rec('타이틀','게임을 시작하면 버튼이 사라짐', await ev(pg,"()=>document.querySelector('#btnCloud').hidden"))
            await ev(pg,"()=>{__T.addItem('crystal',33);__T.G.playT=5400}")
            await menu_login(pg)
            c=await ev(pg,cloud_of); runA=await ev(pg,"()=>__T.G.run")
            rec('클라우드','A 기기: 클라우드가 비어 있으면 바로 올림 (판 번호·플레이 시간 같이)', c and c['run']==runA and 5400<=c['playT']<=5405 and await ev(pg,CRY,c['data'])==33, str(c and {k:c[k] for k in ('run','playT','seeds')}))
            cloudA=await ev(pg,"()=>localStorage.getItem('mockcloud')")
            await ctx.close()

            # ---- device B: new game first, then log in → must ASK, not overwrite (the v31 bug) ----
            ctx,pg,errs=await ctx_with(b, cloud=json.loads(cloudA)); allerr+=errs
            await start_new(pg); await ev(pg,"()=>{__T.addItem('crystal',5)}")
            await menu_login(pg)
            c=await ev(pg,cloud_of)
            txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
            rec('새 기기','새 게임 후 로그인: 클라우드를 덮어쓰지 않음', await ev(pg,CRY,c['data'])==33 and c['run']==runA, await ev(pg,CRY,c['data']))
            rec('새 기기','다른 모험이라고 묻고 양쪽 정보(플레이 시간·빛씨앗)를 보여 줌', '클라우드에 다른 모험이 있어요' in txt and '1시간 30분' in txt and '이 기기' in txt and '빛씨앗' in txt, txt[txt.find('클라우드 저장'):][:220])
            await pg.screenshot(path=SP+'diffrun.png')
            await ev(pg,"()=>{__T.G.time+=999}"); await ev(pg,"()=>window.dispatchEvent(new Event('pagehide'))"); await pg.wait_for_timeout(200)
            c=await ev(pg,cloud_of)
            rec('새 기기','고르기 전에는 자동 업로드도 멈춤', await ev(pg,CRY,c['data'])==33)
            await pg.tap('#sheet [data-a=clKeep]'); await pg.wait_for_timeout(500)
            c=await ev(pg,cloud_of)
            rec('클라우드 백업','이 기기 것 쓰기 → 올리고, 원래 클라우드 모험은 백업으로 보관', await ev(pg,CRY,c['data'])==5 and c.get('prev') and await ev(pg,CRY,c['prev']['data'])==33 and c['prev']['run']==runA, str(c.get('prev') and {k:c['prev'][k] for k in ('run','playT','seeds','at')}))
            txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
            rec('클라우드 백업','메뉴에 클라우드 백업 정보와 되돌리기 버튼', '클라우드 백업' in txt and '1시간 30분' in txt, txt[txt.find('클라우드 백업'):][:120])
            await pg.screenshot(path=SP+'prev.png')
            # autosave of the same (new) adventure keeps the backup
            await ev(pg,"()=>{__T.addItem('crystal',1)}"); await pg.tap('#sheet [data-a=save]'); await pg.wait_for_timeout(400)
            c=await ev(pg,cloud_of)
            rec('클라우드 백업','같은 모험을 계속 올려도 백업은 그대로', await ev(pg,CRY,c['data'])==6 and c.get('prev') and await ev(pg,CRY,c['prev']['data'])==33)
            await pg.tap('#sheet [data-a=clPrev]'); await pg.wait_for_timeout(200)
            rec('클라우드 백업','되돌리기는 한 번 더 눌러 확인', await ev(pg,"()=>document.querySelector('#sheet [data-a=clPrev]').textContent.includes('정말')"))
            await pg.tap('#sheet [data-a=clPrev]'); await pg.wait_for_timeout(700)
            c=await ev(pg,cloud_of)
            r=[await ev(pg,"()=>__T.countItem('crystal')"), await ev(pg,"()=>__T.G.run"), await ev(pg,CRY,c['data']), c.get('prev') and await ev(pg,CRY,c['prev']['data'])]
            rec('클라우드 백업','되돌리면 백업 모험으로 바뀌고, 방금 것은 다시 백업으로 (서로 바꿈)', r[0]==33 and r[1]==runA and r[2]==33 and r[3]==6, str(r))
            await ctx.close()

            # ---- device C: title → 클라우드에서 이어하기 → log in → loads straight away ----
            ctx,pg,errs=await ctx_with(b, cloud=json.loads(cloudA)); allerr+=errs
            await pg.tap('#btnCloud'); await pg.wait_for_timeout(200)
            rec('타이틀','버튼을 누르면 로그인 방법이 나옴', await ev(pg,"()=>!document.querySelector('#cloudTitle').hidden&&document.querySelector('#cloudTitle').innerText.includes('구글로 로그인')"))
            await pg.tap('#cloudTitle [data-ct=emailT]'); await pg.wait_for_timeout(150)
            await pg.fill('#ctEm','juyeon@test.kr'); await pg.fill('#ctPw','secret1')
            await pg.screenshot(path=SP+'title.png')
            await pg.tap('#cloudTitle [data-ct=in]'); await pg.wait_for_timeout(900)
            r=await ev(pg,"()=>[document.querySelector('#title').hidden,__T.countItem('crystal'),__T.G.run]")
            rec('타이틀','로그인하면 바로 클라우드 모험을 불러와 시작', r==[True,33,runA], str(r))
            await ctx.close()
            # logged in already: one tap continues
            ctx,pg,errs=await ctx_with(b, cloud=json.loads(cloudA), auth=True); allerr+=errs
            r=await ev(pg,"()=>[!document.querySelector('#cloudAsk').hidden,document.querySelector('#cloudAsk').innerText.includes('저장된 모험'),document.querySelector('#btnCloud').hidden]")
            rec('타이틀','이미 로그인한 새 기기: 저장된 모험 안내가 뜸 (중복 버튼은 숨김)', r==[True,True,True], str(r))
            await pg.tap('#cloudAsk [data-cl=take]'); await pg.wait_for_timeout(600)
            rec('타이틀','불러오기 → 이어서 플레이', await ev(pg,"()=>[document.querySelector('#title').hidden,__T.countItem('crystal')]")==[True,33])
            await ctx.close()

            # ---- old cloud save and old local save (no run ids) → ask once, then never again ----
            oc=json.loads(cloudA); d=json.loads(oc[UID]['data']); d.pop('run',None); d.pop('playT',None); d.pop('qt',None)
            oc[UID]={'data':json.dumps(d),'at':oc[UID]['at'],'char':'sprout','v':1}
            ld=dict(d); ld['at']=oc[UID]['at']+4000
            ctx,pg,errs=await ctx_with(b, cloud=oc, auth=True, local=json.dumps(ld)); allerr+=errs
            r=await ev(pg,"()=>[!document.querySelector('#cloudAsk').hidden,document.querySelector('#cloudAsk').innerText.includes('다른 모험')]")
            rec('옛 세이브','판 번호 없는 옛 세이브끼리는 처음 한 번 물어봄', r==[True,True], str(r))
            await pg.tap('#cloudAsk [data-cl=keep]'); await pg.wait_for_timeout(500)
            c=await ev(pg,cloud_of); lr=await ev(pg,"()=>JSON.parse(localStorage.getItem('lantern-tree-save-v1')).run||''")
            rec('옛 세이브','이 기기 것 쓰기 → 양쪽에 같은 판 번호가 붙음', bool(c.get('run')) and (lr=='' or lr==c['run']), [c.get('run'),lr])
            await pg.tap('#btnContinue'); await pg.wait_for_timeout(500)
            # 게임이 실제로 시작돼야(타이틀이 닫혀야) 페이지를 닫을 때 저장해요. 바쁠 때는 0.5초 안에 안 열려서 기다려요 (최대 5초)
            await pg.wait_for_function("()=>document.querySelector('#title').hidden", timeout=5000)
            await ev(pg,"()=>{__T.addItem('crystal',2);window.dispatchEvent(new Event('pagehide'))}"); await pg.wait_for_timeout(200)
            await pg.reload(); await cloud_ready(pg)
            # 클라우드 저장은 뒤에서 비동기로 끝나요. 컴퓨터가 바쁘면 0.9초 안에 안 끝나서, 판 번호가 생길 때까지 (최대 5초) 기다려요
            for _ in range(25):
                c=await ev(pg,cloud_of)
                if c.get('run'): break
                await pg.wait_for_timeout(200)
            r=await ev(pg,"()=>[document.querySelector('#cloudAsk').hidden,JSON.parse(localStorage.getItem('lantern-tree-save-v1')).run]")
            rec('옛 세이브','다시 열면 같은 모험으로 알아보고 묻지 않음', r[0] is True and r[1]==c.get('run'), str([r,c.get('run')]))
            await ctx.close()

            rec('기능','콘솔 오류 없음', not allerr, allerr[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_tools_migration():
    import asyncio, sys
    # v65: 옛 세이브의 도구(곡괭이·도끼·삽·낚싯대 …)는 불러올 때 도구 주머니로. 손에 들고 있던 도구는 그대로 들고, 안내가 한 번 떠요
    H2=HOOK.replace("computeLight}","computeLight,heldTool,curWeapon,selItem}")
    OLD="""(sel)=>{const T=__T;const s=JSON.parse(JSON.stringify(T.serialize()));delete s.tools;delete s.tsel;delete s.tHand;delete s.lastW;delete s.stats.nm65;s.inv=s.inv.map(()=>null);
  s.inv[0]={id:'berry',c:3};s.inv[1]={id:'axeStone',c:1,dur:90};s.inv[2]={id:'pickCopper',c:1,dur:120};s.inv[3]={id:'swordCopper',c:1};s.inv[12]={id:'shovel',c:2};s.inv[13]={id:'rod',c:1,dur:5};s.inv[14]={id:'swordIron',c:1,lv:2};s.inv[15]={id:'pickWood',c:1,dur:200};s.sel=sel;return s}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True); await ev(pg,"()=>{__T.G.rpg.lv=40}")  # v99: 착용 레벨이 있는 무기를 쓰므로
            await ev(pg,"()=>{window.__old="+OLD+"}")
            r=await ev(pg,"()=>{const T=__T;T.deserialize(__old(2));const G=T.G;return [G.tools.map(x=>x.id+':'+(x.dur==null?'-':x.dur)).join(','),G.inv.filter(Boolean).map(x=>x.id).join(','),G.sel,T.heldTool()&&T.heldTool().id,G.tHand,G.stats.nm65]}")
            rec('옛 세이브','도구는 주머니로 (내구도 그대로, 겹친 삽 2개는 2개로), 다른 건 그대로', r[0]=='axeStone:90,pickCopper:120,shovel:-,shovel:-,rod:5,pickWood:200' and r[1]=='berry,swordCopper,swordIron' and r[5]==1, str(r))
            rec('옛 세이브','들고 있던 곡괭이는 도구 칸에 든 채로 (일부러 든 것으로)', r[2:5]==[-1,'pickCopper',True], str(r))
            await wait_until(pg,"()=>document.querySelector('#toasts').innerText.includes('조작이 바뀌었어요')",5000)
            r=await ev(pg,"()=>document.querySelector('#toasts').innerText"); rec('옛 세이브','조작이 바뀐 안내 + 옮긴 도구 개수', '조작이 바뀌었어요' in r and '도구 6개' in r, r[:120])
            r=await ev(pg,"()=>{const T=__T;T.deserialize(__old(3));const G=T.G;return [G.sel,T.selItem().id,G.lastW,T.curWeapon().id]}")
            rec('옛 세이브','무기를 들고 있었으면 그 무기를 마지막 무기로 기억', r==[3,'swordCopper','swordCopper','swordCopper'], str(r))
            r=await ev(pg,"()=>{const T=__T;T.deserialize(__old(0));const G=T.G;return [G.sel,G.lastW,T.curWeapon().id]}")
            rec('옛 세이브','무기를 안 들고 있었으면 가장 센 무기로 공격', r[0]==0 and r[1] is None and r[2]=='swordIron', str(r))
            r=await ev(pg,"()=>{const T=__T;const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const G=T.G;return [G.tools.length,G.inv.filter(x=>x&&__T.ITEMS[x.id]&&['pick','axe','shovel','rod'].includes(__T.ITEMS[x.id].kind)).length]}")
            rec('옛 세이브','한 번 옮긴 뒤 다시 불러와도 두 번 옮기지 않음', r==[6,0], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3]); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_save_split():
    import json, os
    # 구조 변경 4단계: 세이브를 「세계」(같이 씀)와 「캐릭터」(들고 다님)로 나누고 다시 합치기 — 멀티플레이 준비
    # 정한 것: 퀘스트 진행·기록은 세계 · 지도에서 밝힌 곳은 세계 안 플레이어마다 · 펫은 캐릭터
    FX=json.load(open(os.path.join(QA,'snapshot','fixtures.json'),encoding='utf-8'))
    H2=HOOK.replace("computeLight}","computeLight,splitSave,joinSave,serializeWorld,serializeChar,deserializeParts,CHAR_KEYS,PLAYER_KEYS}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            # 지금 게임 + 옛 세이브 11종: 나눴다 합치면 글자까지 같음, 나뉜 쪽이 맞는지
            for name in ['지금 게임']+sorted(FX):
                r=await ev(pg,"""(src)=>{const T=__T;if(src)T.deserialize(JSON.parse(src));const s=T.serialize(),{world,char}=T.splitSave(s),pl=world.players.me;
                  const same=JSON.stringify(T.joinSave(world,char))===JSON.stringify(s);
                  const charHasWorld=['wall','objs','stats','qclaim','guide','bossDead','time','explored'].filter(k=>k in char);
                  const worldHasChar=['inv','tools','equip','rpg','pets','recipes','look'].filter(k=>k in world);
                  return [same,charHasWorld,worldHasChar,'explored' in pl&&Number.isFinite(pl.x)&&Number.isFinite(pl.y),!!char.p&&!('x' in char.p)]}""",FX.get(name))
                rec('세이브 나누기',f'{name}: 나눴다 합치면 그대로 · 캐릭터/세계/플레이어별로 맞게 나뉨', r==[True,[],[],True,True], str(r))
            # 나눈 두 덩어리로 불러오기 → 다시 저장하면 같음 (시간 표시 at만 빼고)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv[3]={id:'wood',c:7};G.pets={dog:1};G.petOn='dog';G.qclaim.wood=1;
              const w=T.serializeWorld(),c=T.serializeChar(),before=T.serialize();delete w.at; // 저장 시각을 빼요: 컴퓨터가 바빠 1초 넘게 걸리면 「꺼 둔 동안 흐른 시간」만큼 게임 시간이 앞당겨져 가끔 달랐어요
              T.deserializeParts(w,c);const after=T.serialize();delete before.at;delete after.at;
              // 꽃망울 구역의 next(다음 꽃망울까지 1.5초 간격)는 저장하지 않는 잠깐 값이에요. 방금 꽃망울이 생긴 구역이 있으면 before에만 남아 가끔 달랐어요
              // guide(지금 이야기 번호)도 불러올 때 0으로 두고 다음 프레임에 다시 세요. 앞 단계의 옛 세이브로 이야기가 이미 넘어갔으면 before에만 1 이상이라 가끔 달랐어요
              for(const o of [before,after])delete o.guide;
              for(const o of [before,after])o.fzones=JSON.parse(JSON.stringify(o.fzones)).map(z=>{delete z.next;return z});
              const diff=Object.keys(before).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k])).map(k=>k+':'+JSON.stringify(before[k]).slice(0,80)+'→'+JSON.stringify(after[k]).slice(0,80));
              return [JSON.stringify(before)===JSON.stringify(after),T.G.inv[3]&&T.G.inv[3].c,T.G.petOn,!!T.G.qclaim.wood,'pets' in w,'qclaim' in c,diff]}""")
            rec('세이브 나누기','세계·캐릭터 두 덩어리로 불러와도 그대로 (가방·펫은 캐릭터, 퀘스트 보상은 세계)', r[:6]==[True,7,'dog',True,False,False], str(r))  # 마지막 칸: 달라진 칸 (가끔 실패하던 원인 찾기)
            # 모르는 새 칸도 잃지 않음 (나중에 생긴 칸)
            r=await ev(pg,"()=>{const T=__T;const s=T.serialize();s.zzNew=5;const {world,char}=T.splitSave(s);return [T.joinSave(world,char).zzNew,Object.keys(T.joinSave(world,char)).slice(-1)[0]]}")
            rec('세이브 나누기','표에 없는 새 칸도 합칠 때 그대로', r==[5,'zzNew'], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_build_piece_refund():
    import asyncio, sys
    # v69 (BF-05): 얇은 벽·반벽·기둥·창문벽·창문 틀은 없어지고, 옛 세이브의 것은 만들 때 든 재료로 돌려받아요.
    # 상자·꾸러미 속 것은 그 상자·꾸러미로, 세워 둔 것과 가방 속 것은 가방에 먼저, 넘치면 등불나무 옆 환급 상자(주인만 열고, 넣을 수 없음)
    H2=HOOK.replace("computeLight}","computeLight,runCmd,perform,W}")
    OLD="""()=>{const T=__T,G=T.G,X=T.CX+12,Y=T.CY+8;for(let y=Y-3;y<=Y+3;y++)for(let x=X-3;x<=X+8;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i)}
  for(const [i,o] of [...G.objs])if(o.t==='refundBox'||o.t==='lostBag')G.objs.delete(i);G.enemies.length=0;
  for(let k=0;k<G.inv.length;k++)G.inv[k]={id:'gel',c:999};G.inv[3]={id:'bHalfStone',c:5};
  // placed: 2 thin wood (2) · pillar wood (.5) · window frame stone (4) · window wall stone (3)
  [['bThinWood',0],['bThinWood',1],['bPillarWood',2],['bFrameStone',3],['bWinStone',4]].forEach(([t,dx])=>G.objs.set(T.idx(X+dx,Y),{t}));
  G.objs.set(T.idx(X,Y+2),{t:'chest',items:[{id:'bThinStone',c:3},{id:'bHalfWood',c:3},{id:'berry',c:2}].concat(Array(15).fill(null))});
  G.objs.set(T.idx(X+2,Y+2),{t:'lostBag',items:[{id:'bFrameWood',c:2},{id:'wood',c:4}],at:1,own:'me'});
  const s=JSON.stringify(T.serialize());T.deserialize(JSON.parse(s));return s}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            old=await ev(pg,OLD)
            r=await ev(pg,"""()=>{const T=__T,G=T.G,X=T.CX+12,Y=T.CY+8,ids=['bThinWood','bThinStone','bHalfWood','bHalfStone','bPillarWood','bPillarStone','bWinWood','bWinStone','bFrameWood','bFrameStone'];
          const left=[...G.objs.values()].some(o=>ids.includes(o.t)||(o.items||[]).some(s=>s&&ids.includes(s.id)))||G.inv.some(s=>s&&ids.includes(s.id));
          const ch=G.objs.get(T.idx(X,Y+2)).items.filter(Boolean).map(s=>s.id+':'+s.c).sort().join(','),bag=G.objs.get(T.idx(X+2,Y+2)).items.filter(Boolean).map(s=>s.id+':'+s.c).join(',');
          const boxes=[...G.objs.entries()].filter(([i,o])=>o.t==='refundBox').map(([i,o])=>[o.own,o.items.filter(Boolean).map(s=>s.id+':'+s.c).sort().join(','),Math.hypot(i%T.W-T.CX,((i/T.W)|0)-T.CY)<20]);
          return {left,ch,bag,boxes,st:G.stats.bf05,inv:[T.countItem('wood'),T.countItem('stone')]}}""")
            rec('환급','옛 조각이 세계·가방·상자·꾸러미 어디에도 남지 않음', r['left'] is False, str(r['left']))
            rec('환급','상자 속 조각은 그 상자로 (얇은 돌벽 3 → 돌 6, 나무 반벽 3 → 나무 2)', r['ch']=='berry:2,stone:6,wood:2', r['ch'])
            rec('환급','꾸러미 속 조각은 그 꾸러미로 (나무 창문 틀 2 → 나무 4, 있던 나무와 합침)', r['bag']=='wood:8', r['bag'])
            # placed: wood 2+.5 = 2.5→3, stone 4+3 = 7 · bag: half stone 5 → stone 5 → stone 12 fits in the freed bag slot, wood 3 does not (bag full of gel)
            rec('환급','세워 둔 것·가방 속 것은 재료별로 합쳐 올림, 가방에 먼저 (돌 12)', r['inv'][1]==12, str(r['inv']))
            rec('환급','가방이 차서 남은 것(나무 3)은 환급 상자로 (주인 나, 등불나무 근처)', r['boxes']==[['me','wood:3',True]], str(r['boxes']))
            rec('환급','기록: 조각 18개, 세워 둔 것 5개, 돌려준 재료 합계 (돌 18 · 나무 9)', r['st']['n']==18 and r['st']['placed']==5 and r['st']['back']=={'stone':18,'wood':9} and r['st']['boxes']==1, str(r['st']))
            await pg.wait_for_timeout(1800)
            t=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('환급','불러올 때 한 번 알림 (재료·환급 상자·벽 다시 쌓기)', '돌려받았어요' in t and '환급 상자' in t and '다시 쌓아' in t, t[:160])
            r=await ev(pg,"()=>{const T=__T,G=T.G;const n=G.stats.bf05.n,w=T.countItem('wood');const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const s2=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s2);return [T.G.stats.bf05.n===n,T.countItem('wood')===w,[...T.G.objs.values()].filter(o=>o.t==='refundBox').length]}")
            rec('환급','저장·불러오기를 여러 번 해도 두 번 돌려주지 않음', r==[True,True,1], str(r))
            # the refund box: only the owner, take-only, cleared when empty
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let bi=-1;for(const [i,o] of G.objs)if(o.t==='refundBox')bi=i;const bx=bi%T.W,by=(bi/T.W)|0;
          for(const [dx,dy] of [[-1,0]]){const i=T.idx(bx+dx,by+dy);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.p.x=bx-.5;G.p.y=by+.5;G.p.face={x:1,y:0};G.enemies.length=0;
          const d=T.decide();window.__bi=bi;return [d.k,d.lbl]}""")
            rec('환급 상자','앞에서 「열기」', r==['open','열기'], str(r))
            await ev(pg,"()=>{const d=__T.decide();__T.perform(d)}"); await pg.wait_for_timeout(500)
            r=await ev(pg,"""()=>{const T=__T,G=T.G,o=G.objs.get(window.__bi);const t=document.querySelector('#sheet').innerText;G.inv[20]={id:'torch',c:3};G.inv[21]=null;G.inv[22]=null;
          const put=T.runCmd({k:'chest',o:window.__bi,i:20,out:false}),drag=T.runCmd({k:'move',a:{o:null,i:20},b:{o:window.__bi,i:5}}),stash=T.runCmd({k:'stash',o:window.__bi,same:false});
          const take=T.runCmd({k:'chest',o:window.__bi,i:o.items.findIndex(Boolean),out:true});return [t.includes('환급 상자'),t.includes('넣기'),put,drag,stash,take!==false,o.items.some(s=>s&&s.id==='torch')]}""")
            rec('환급 상자','창 제목 「환급 상자」, 넣기 버튼 없음', r[0] is True and r[1] is False, str(r))
            rec('환급 상자','넣을 수 없음 (누르기·끌기·모두 넣기 모두 막힘), 꺼내기는 됨', r[2] is False and r[3] is False and r[4] is False and r[5] is True and r[6] is False, str(r))
            await ev(pg,"()=>__T.closePanel()")
            r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(window.__bi);o.own='p2';const d=T.decide();const t=T.runCmd({k:'chest',o:window.__bi,i:o.items.findIndex(Boolean),out:true});o.own='me';return [d.k,d.msg||'',t]}")
            rec('환급 상자','다른 사람 상자는 열 수도 꺼낼 수도 없음', r[0]=='info' and '다른 사람' in r[1] and r[2] is False, str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(window.__bi);o.items.fill(null);const d=T.decide();const c=[d.k].concat((G.alts||[]).map(a=>a.k));const a=(G.alts||[]).find(x=>x.k==='refundClear');if(a)T.perform(a);return [c,!!G.objs.get(window.__bi)]}")
            rec('환급 상자','다 꺼내면 「치우기」로 없앨 수 있음 (아무것도 안 생김)', 'refundClear' in r[0] and r[1] is False, str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_auto_refund_v113():
    import asyncio, sys
    # v113 (자동 생산 1): 채굴장·나무 작업장이 없어지고, 옛 세이브의 것은 만들 때 든 재료로 (v69 환급과 같은 방법).
    # 놓인 것(안에 모인 광석·나무도)·가방 것은 가방 먼저 → 넘치면 환급 상자, 상자·꾸러미 속 것은 그 안으로. 놓인 옛 채굴기는 그대로
    H2=HOOK.replace("computeLight}","computeLight,OLD_AUTO}")
    OLD="""()=>{const T=__T,G=T.G,X=T.CX+12,Y=T.CY+8;for(let y=Y-3;y<=Y+4;y++)for(let x=X-3;x<=X+8;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i)}
  for(const [i,o] of [...G.objs])if(o.t==='refundBox'||o.t==='lostBag')G.objs.delete(i);G.enemies.length=0;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;G.inv[2]={id:'pitGold',c:1};
  const two=(t,x,y,ex)=>{const i=T.idx(x,y);G.objs.set(i,Object.assign({t,p:G.time},ex||{}));for(const j of [i+1,i+T.W,i+T.W+1])G.objs.set(j,{t:'_part',a:i})};
  two('pitCu',X,Y);two('treeFarm',X+3,Y,{store:[{id:'wood',c:5}]});G.objs.set(T.idx(X+6,Y),{t:'drillCu',dir:{x:1,y:0}});
  G.objs.set(T.idx(X,Y+3),{t:'chest',items:[{id:'quarry',c:1},{id:'berry',c:2}].concat(Array(16).fill(null))});
  G.objs.set(T.idx(X+2,Y+3),{t:'lostBag',items:[{id:'treeFarm',c:1},null,null,null],at:1,own:'me'});
  const s=JSON.stringify(T.serialize());T.deserialize(JSON.parse(s));return s}"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,OLD)
            r=await ev(pg,"""()=>{const T=__T,G=T.G,X=T.CX+12,Y=T.CY+8,A=T.OLD_AUTO,ids=['pitCu','pitFe','pitGold','quarry','treeFarm'];
              const left=[...G.objs.values()].some(o=>ids.includes(o.t)||(o.items||[]).some(s=>s&&ids.includes(s.id)))||G.inv.some(s=>s&&ids.includes(s.id));
              const parts=[...G.objs.values()].filter(o=>o.t==='_part'&&ids.includes((G.objs.get(o.a)||{}).t)).length,orphan=[T.idx(X+1,Y),T.idx(X+4,Y+1)].some(i=>G.objs.get(i));
              const want={};const add=(m,c)=>{want[m]=(want[m]||0)+c};for(const id of ['pitCu','treeFarm','pitGold'])for(const [m,c] of A[id])add(m,c);add('wood',5);
              const have={};for(const s of G.inv)if(s)have[s.id]=(have[s.id]||0)+s.c;for(const o of G.objs.values())if(o.t==='refundBox')for(const s of o.items)if(s)have[s.id]=(have[s.id]||0)+s.c;
              const ok=Object.keys(want).every(m=>have[m]===want[m]);
              const ch=G.objs.get(T.idx(X,Y+3)).items.filter(Boolean).map(s=>s.id+':'+s.c).sort().join(','),chw=A.quarry.map(([m,c])=>m+':'+c).concat(['berry:2']).sort().join(',');
              const bag=G.objs.get(T.idx(X+2,Y+3)).items.filter(Boolean).map(s=>s.id+':'+s.c).sort().join(','),bagw=A.treeFarm.map(([m,c])=>m+':'+c).sort().join(',');
              return {left,parts,orphan,ok,want,have,ch:ch===chw,bag:bag===bagw,drill:(G.objs.get(T.idx(X+6,Y))||{}).t,st:G.stats.auto113}}""")
            rec('환급','옛 채굴장·나무 작업장이 세계·가방·상자·꾸러미 어디에도 남지 않음 (부속 칸도 정리)', r['left'] is False and r['parts']==0 and not r['orphan'], str([r['left'],r['parts'],r['orphan']]))
            rec('환급','놓인 것·가방 것은 만들 때 든 재료로 + 나무 작업장 안에 모인 나무 5', r['ok'], str(r['want'])+' / '+str(r['have']))
            rec('환급','상자·꾸러미 속 것은 그 상자·꾸러미로 재료', r['ch'] and r['bag'], str([r['ch'],r['bag']]))
            rec('환급','놓인 옛 구리 채굴기는 그대로 (채굴장으로 바꾸지 않음)', r['drill']=='drillCu', str(r['drill']))
            rec('환급','기록: 5개, 놓인 것 2개', r['st']['n']==5 and r['st']['placed']==2, str(r['st']))
            await pg.wait_for_timeout(2300)
            t=await ev(pg,"()=>document.querySelector('#toasts').innerText")
            rec('환급','불러올 때 한 번 알림', '채굴장·나무 작업장이 없어져서' in t, t[:160])
            r=await ev(pg,"()=>{const T=__T,G=T.G;const n=G.stats.auto113.n,c=T.countItem('copperBar');for(let k=0;k<2;k++)T.deserialize(JSON.parse(JSON.stringify(T.serialize())));return [T.G.stats.auto113.n===n,T.countItem('copperBar')===c]}")
            rec('환급','여러 번 불러와도 두 번 주지 않음', r==[True,True], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.inv[5]={id:'drillCu',c:2};T.deserialize(JSON.parse(JSON.stringify(T.serialize())));return T.countItem('drillCu')}")
            rec('옛 세이브','가방의 채굴기는 채굴기 그대로 (v46 채굴장 바꾸기 멈춤)', r==2, r)
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
