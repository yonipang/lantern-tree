import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
        pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('file://'+SP+'qa.html'); await pg.wait_for_timeout(400); await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(500)
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
        await pg2.goto('file://'+SP+'qa.html'); await pg2.wait_for_timeout(500)
        async with pg2.expect_file_chooser() as fc: await pg2.tap('#btnImport')
        await (await fc.value).set_files(SP+'exported.json'); await pg2.wait_for_timeout(600)
        r=await ev(pg2,"()=>[document.querySelector('#title').hidden, Math.round(__T.G.p.x*10)/10]")
        rec('타이틀','새 기기: 확인 없이 바로 불러와 시작', r==[True,105.5], str(r))
        # mobile menu look
        await ev(pg2,"()=>__T.openPanel('menu')"); await pg2.wait_for_timeout(500); await pg2.screenshot(path=SP+'qa6_menu.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
