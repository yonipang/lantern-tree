import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
H2=HOOK.replace("computeLight}","computeLight,refreshHotbar}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,1280,800,False)
        await ev(pg,"()=>{const G=__T.G;for(let y=100;y<114;y++)for(let x=100;x<116;x++){const i=__T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.objs.set(__T.idx(106,106),{t:'bench'});G.p.x=105.5;G.p.y=106.5;__T.addItem('wood',50);__T.addItem('resin',10)}")
        async def walk():
            x0=await ev(pg,"()=>__T.G.p.x"); await pg.keyboard.down('KeyA'); await pg.wait_for_timeout(400); await pg.keyboard.up('KeyA'); x1=await ev(pg,"()=>__T.G.p.x"); await ev(pg,"()=>{__T.G.p.x=105.5}"); return round(x0-x1,2)
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
asyncio.run(main())
