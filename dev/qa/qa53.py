import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v50: 다른 게임처럼 칸 크기 — 제작대·화로 2×1, 침대 1×2, 벤치 2×1 / 옛 세이브는 그 자리에서 넓힘 / 나무 크게 / 뒤로 가면 반투명 / 32px 그림 부드러운 테두리
H2=HOOK.replace("computeLight}","computeLight,SPR,fpOf,homePt,effH,get W(){return W},get V(){return VIEW},get lowCv(){return lowCv},lc(){POOL=null;return linkedChests().length},newGame}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        r=await ev(pg,"()=>{const O=__T.OBJ;return ['bench','forge','smelter','furnace','logBench','stoneBench','bed','mossBed'].map(k=>O[k].sz.join('x')+(O[k].rotV?'r':''))}")
        rec('칸 크기','작업대·구리 제작대·용광로·화로 2×1, 벤치 2×1(돌림), 침대 1×2(돌림)', r==['2x1','2x1','2x1','2x1','2x1r','2x1r','1x2r','1x2r'], str(r))
        r=await ev(pg,"()=>{const S=__T.SPR.obj;return [S.bench.width+'x'+S.bench.height,S.furnace.width+'x'+S.furnace.height,S.logBench.width+'x'+S.logBench.height,S.bed.width+'x'+S.bed.height,!!S.bedV,S.roundTree.width+'x'+S.roundTree.height,S.root.width+'x'+S.root.height,__T.SPR.young.roundTree.width]}")
        rec('그림','커진 가구는 임시로 옛 그림을 늘림, 나무는 1.75배 (어린 나무도 같이)', r==['32x32','32x40','32x16','16x40',True,'42x56','28x49',33], str(r))
        # saves from before v50 keep one-tile furniture; games started from v50 use the new sizes
        r=await ev(pg,"""()=>{const T=__T;T.newGame(31);const G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));const fpNew=s.fpV;
          const x=Math.floor(G.p.x)+2,y=Math.floor(G.p.y)+2;for(let xx=x-1;xx<=x+3;xx++){const i=T.idx(xx,y);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'bench'});G.objs.set(T.idx(x+1,y),{t:'chest',items:Array(18).fill(null)});
          const old=JSON.parse(JSON.stringify(T.serialize()));delete old.fpV;T.deserialize(old);const G2=T.G,O=T.OBJ,S=T.SPR.obj;
          const r1=[fpNew,!!O.bench.sz,S.bench.width,G2.objs.get(T.idx(x+1,y)).t,JSON.parse(JSON.stringify(T.serialize())).fpV];
          T.newGame(32);return r1.concat([O.bench.sz.join('x'),S.bench.width,!!S.bedV])}""")
        rec('옛 세이브','v50 전 세이브는 가구가 1칸 그대로(옆 상자도 그대로), 새 판부터 커진 크기', r==[2,False,16,'chest',1,'2x1',32,True], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+2,y=Math.floor(G.p.y)+2;for(let yy=y-1;yy<=y+3;yy++)for(let xx=x-1;xx<=x+1;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'bed'});G.objs.set(T.idx(x,y+1),{t:'_part',a:T.idx(x,y)});G.spawnPt={x,y};return 1}""")
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.wall[T.idx(G.spawnPt.x,G.spawnPt.y+2)]=0;const h=T.homePt();return [h.x-G.spawnPt.x,Math.round((h.y-G.spawnPt.y)*10)/10]}")
        rec('침대','기절·잠에서 깨면 1×2 침대 바로 아래에 섬', r==[0.5,2.6], str(r))
        # a chest touching only the right tile of a 2×1 workbench is still linked
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x),y=Math.floor(G.p.y)+2;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+4;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'bench'});G.objs.set(T.idx(x+1,y),{t:'_part',a:T.idx(x,y)});G.objs.set(T.idx(x+2,y),{t:'chest',items:Array(18).fill(null)});return T.lc()}""")
        rec('상자 연결','2칸 작업대의 오른쪽 칸에 붙은 상자도 재료로 씀', r==1, r)
        # see-through: the canopy of a big tree fades while the player stands behind it
        r=await ev(pg,"""async()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+3,y=Math.floor(G.p.y)+4;for(let yy=y-5;yy<=y+1;yy++)for(let xx=x-3;xx<=x+3;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}
          G.objs.set(T.idx(x,y),{t:'roundTree',hp:3});G.enemies.length=0;const wait=()=>new Promise(r=>setTimeout(r,250));
          const g=T.lowCv.getContext('2d'),orig=g.drawImage,seen=[];g.drawImage=function(img,...a){if(img===T.SPR.obj.roundTree)seen.push(Math.round(g.globalAlpha*100)/100);return orig.call(this,img,...a)};
          const look=async(px,py)=>{G.p.x=px;G.p.y=py;await wait();seen.length=0;await wait();return seen.length?Math.min(...seen):-1};
          const a=await look(x+3.5,y-1.5),b2=await look(x+.5,y-.6),c=await look(x+.5,y+1.6);g.drawImage=orig;return [a,b2,c]}""")
        rec('반투명','큰 나무 뒤로 들어가면 반투명, 옆이나 앞에 있으면 그대로', r==[1,0.45,1], str(r))
        r=await ev(pg,"()=>{const T=__T;const s=JSON.parse(JSON.stringify(T.serialize()));const n=[...T.G.objs.values()].filter(o=>o.t==='_part').length;T.deserialize(s);return [s.fpV,n===[...T.G.objs.values()].filter(o=>o.t==='_part').length,T.OBJ.bed.sz.join('x')]}")
        rec('새 판','새 판 세이브를 다시 불러와도 커진 크기 그대로', r==[2,True,'1x2'], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
