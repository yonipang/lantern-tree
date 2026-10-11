import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v50: 다른 게임처럼 칸 크기 — 제작대·화로 2×1, 침대 1×2, 벤치 2×1 / 옛 세이브는 그 자리에서 넓힘 / 나무 크게 / 뒤로 가면 반투명 / 32px 그림 부드러운 테두리
H2=HOOK.replace("computeLight}","computeLight,SPR,fpOf,homePt,effH,effW,iconURL,get W(){return W},get V(){return VIEW},get lowCv(){return lowCv},lc(){POOL=null;return linkedChests().length},newGame}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        r=await ev(pg,"()=>{const O=__T.OBJ;return ['bench','logBench','stoneBench'].map(k=>O[k].sz.join('x')+(O[k].rotV?'r':'')).concat([!!O.forge.sz,!!O.furnace.sz,!!O.smelter.sz,!!O.bed.sz,!!O.mossBed.sz])}")
        rec('칸 크기','작업대 2×1, 벤치 2×1(돌림), 구리 제작대·화로·용광로·침대는 1칸 (v55)', r==['2x1','2x1r','2x1r',False,False,False,False,False], str(r))
        r=await ev(pg,"""async()=>{const T=__T,f=T.SPR.fp,sz=u=>new Promise(res=>{const i=new Image();i.onload=()=>res(i.width+'x'+i.height);i.src=u});
          return [await sz(T.iconURL('logBench')),await sz(T.iconURL('smelter')),await sz(T.iconURL('plant')),await sz(T.iconURL('chair')),f.logBench.small.width,f.logBench.big.width]}""")
        rec('아이콘','가방·제작 화면 아이콘은 늘린 임시 그림이 아니라 원래 1칸 모양, 세로·가로로 긴 그림도 정사각형 칸 (v55)', r==['16x16','22x22','20x20','16x16',16,32], str(r))
        r=await ev(pg,"()=>{const T=__T,S=T.SPR.obj,z=c=>T.effW(c)+'x'+T.effH(c);return [z(S.bench),z(S.furnace),z(S.logBench),z(S.bed),!!S.bedV,z(S.roundTree),z(S.root),Math.round(T.effW(T.SPR.young.roundTree))]}")
        rec('그림','커진 가구·나무는 새 크기 (손그림이 없으면 옛 그림을 늘림, 어린 나무도 같이; v54부터 작업대·둥근 나무는 Fantasyville 그림, v55 작업대 2칸 너비로, 화로 1칸, 뿌리기둥은 캐릭터 키의 2배)', r==['32x27','16x20','32x16','16x24',False,'32x48','22x38',25], str(r))
        # v56: saves from before v50 get the 2×1 workbench too — it grows into the free tile next to it, or comes back to the bag
        r=await ev(pg,"""()=>{const T=__T;T.newGame(31);const G=T.G;const fpNew=JSON.parse(JSON.stringify(T.serialize())).fpV;
          const x=Math.floor(G.p.x)+2,y=Math.floor(G.p.y)+2;for(let yy=y;yy<=y+2;yy+=2)for(let xx=x-1;xx<=x+3;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'bench'});G.objs.set(T.idx(x+1,y),{t:'chest',items:Array(18).fill(null)});
          G.objs.set(T.idx(x-1,y+2),{t:'chest',items:Array(18).fill(null)});G.objs.set(T.idx(x,y+2),{t:'bench'});G.objs.set(T.idx(x+1,y+2),{t:'chest',items:Array(18).fill(null)});
          const before=T.countItem('bench');const old=JSON.parse(JSON.stringify(T.serialize()));delete old.fpV;T.deserialize(old);const G2=T.G,O=T.OBJ,S=T.SPR.obj,g=(dx,dy)=>{const o=G2.objs.get(T.idx(x+dx,y+dy));return o?o.t:'-'};
          return [fpNew,O.bench.sz.join('x'),S.bench===T.SPR.fp.bench.big,g(-1,0),g(0,0),g(1,0),g(0,2),T.countItem('bench')-before,JSON.parse(JSON.stringify(T.serialize())).fpV]}""")
        rec('옛 세이브','v50 전 세이브도 작업대 2×1: 오른쪽이 막히면 왼쪽으로 넓어지고(옆 상자 그대로), 양옆이 막히면 가방으로 (v56)', r==[2,'2x1',True,'bench','_part','chest','-',1,2], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+2,y=Math.floor(G.p.y)+2;for(let yy=y-1;yy<=y+3;yy++)for(let xx=x-1;xx<=x+1;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'bed'});G.objs.set(T.idx(x,y+1),{t:'_part',a:T.idx(x,y)});G.spawnPt={x,y};const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o=T.G.objs.get(T.idx(x,y+1));return [T.G.objs.get(T.idx(x,y)).t,o?o.t:'-']}""")
        rec('침대','v50 때 1×2로 놓은 침대는 불러오면 1칸으로 (아래 칸 비워짐)', r==['bed','-'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+3,y=Math.floor(G.p.y)-3;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+2;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'forge'});G.objs.set(T.idx(x+1,y),{t:'_part',a:T.idx(x,y)});G.objs.set(T.idx(x,y+1),{t:'furnace'});G.objs.set(T.idx(x+1,y+1),{t:'_part',a:T.idx(x,y+1)});
          const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o=T.G.objs.get(T.idx(x+1,y)),o2=T.G.objs.get(T.idx(x+1,y+1));return [T.G.objs.get(T.idx(x,y)).t,o?o.t:'-',T.G.objs.get(T.idx(x,y+1)).t,o2?o2.t:'-']}""")
        rec('구리 제작대','v50~v54 때 2칸으로 놓은 구리 제작대·화로는 불러오면 1칸으로 (옆 칸 비워짐, v55)', r==['forge','-','furnace','-'], str(r))
        r=await ev(pg,"""async()=>{const T=__T,bad=[];for(const id in T.ITEMS){const u=T.iconURL(id);const d=await new Promise(res=>{const i=new Image();i.onload=()=>res([i.width,i.height]);i.src=u});if(d[0]!==d[1])bad.push(id+' '+d.join('x'))}return bad}""")
        rec('아이콘','모든 아이템 아이콘이 정사각형 (가방에서 1칸, 횃불·화분 포함, v55)', r==[], str(r[:6]))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+3,y=Math.floor(G.p.y)-3;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+2;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}
          G.objs.set(T.idx(x,y),{t:'forge'});G.objs.set(T.idx(x+1,y),{t:'_part',a:T.idx(x,y)});G.objs.set(T.idx(x,y+1),{t:'furnace'});G.objs.set(T.idx(x+1,y+1),{t:'_part',a:T.idx(x,y+1)});
          const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o=T.G.objs.get(T.idx(x+1,y)),o2=T.G.objs.get(T.idx(x+1,y+1));return [T.G.objs.get(T.idx(x,y)).t,o?o.t:'-',T.G.objs.get(T.idx(x,y+1)).t,o2?o2.t:'-']}""")
        rec('구리 제작대','v50~v54 때 2칸으로 놓은 구리 제작대·화로는 불러오면 1칸으로 (옆 칸 비워짐, v55)', r==['forge','-','furnace','-'], str(r))
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.wall[T.idx(G.spawnPt.x,G.spawnPt.y+2)]=0;const h=T.homePt();return [h.x-G.spawnPt.x,Math.round((h.y-G.spawnPt.y)*10)/10]}")
        rec('침대','기절·잠에서 깨면 침대 바로 아래에 섬', r==[0.5,1.6], str(r))
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
        r=await ev(pg,"()=>{const T=__T;const s=JSON.parse(JSON.stringify(T.serialize()));const n=[...T.G.objs.values()].filter(o=>o.t==='_part').length;T.deserialize(s);return [s.fpV,n===[...T.G.objs.values()].filter(o=>o.t==='_part').length,T.OBJ.bench.sz.join('x')]}")
        rec('새 판','새 판 세이브를 다시 불러와도 커진 크기 그대로', r==[2,True,'2x1'], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
