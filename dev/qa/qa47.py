import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 지도: 찾았지만 안 연 보물상자 표시를 체크박스로 켜고 끄기
H2=HOOK.replace("computeLight}","computeLight,mapChestOn}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        # a found-but-closed room in the middle of the explored map
        px="(()=>{const cv=document.querySelector('#mapCv');const g=cv.getContext('2d');let n=0;const d=g.getImageData(0,0,cv.width,cv.height).data;for(let i=0;i<d.length;i+=4)if(d[i]===255&&d[i+1]===210&&d[i+2]===92)n++;return n})()"
        await ev(pg,"()=>{const T=__T,G=T.G;for(let i=0;i<G.explored.length;i++)G.explored[i]=1;const rm=G.rooms[0];rm.found=1;rm.open=0;T.openPanel('map')}"); await pg.wait_for_timeout(700)
        r=await ev(pg,"()=>{const c=document.querySelector('#sheet [data-a=mapChest]');return [!!c,c&&c.checked,"+px+"]}"); n_on=r[2]; r=r[:2]+[n_on>0]
        rec('지도','범례에 「찾았지만 안 연 보물상자」 체크박스 (처음엔 켜짐, 지도에 표시)', r==[True,True,True], str(r))
        await pg.screenshot(path=SP+'qa47_map.png')
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
asyncio.run(main())
