import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 건축 정리 (v41): 지붕 삭제, 얇은 벽 높이·바닥선, 바닥 벽선 맞춤, 양문·긴 창, 자동 미닫이문 + 최고 레벨 스킬 포인트
H2=HOOK.replace("computeLight}","computeLight,RECIPES,twSprite,twMask,getChunk,hash2,SPR,circuitTick,gainXp,cleanRpg,MAX_LV,SKILLS,LIFT,cam}")
ROOM="""window.__room=()=>{const T=__T,G=T.G,x0=T.CX+14,y0=T.CY+6;
  for(let y=y0-2;y<y0+12;y++)for(let x=x0-3;x<x0+12;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i)}
  for(let y=y0+1;y<y0+7;y++)for(let x=x0+1;x<x0+8;x++)G.floor[T.idx(x,y)]=5;
  for(let x=x0;x<=x0+8;x++){G.objs.set(T.idx(x,y0),{t:'bThinWood'});G.objs.set(T.idx(x,y0+7),{t:'bThinWood'})}
  for(let y=y0;y<=y0+7;y++){G.objs.set(T.idx(x0,y),{t:'bThinWood'});G.objs.set(T.idx(x0+8,y),{t:'bThinWood'})}
  G.enemies.length=0;return [x0,y0]};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,1280,800,False)
        await ev(pg,"()=>{"+ROOM+"__T.G.enemies.length=0}")
        # ---- roofs removed ----
        r=await ev(pg,"()=>[!!__T.ITEMS.roofWood,!!__T.ITEMS.roofStone,__T.RECIPES.some(r=>/^roof/.test(r.out)),'roof' in __T.serialize()]")
        rec('지붕 삭제','지붕 아이템·제작법·저장 항목 없음', r==[False,False,False,False], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[0]={id:'wood',c:5};const ci=T.idx(T.CX+3,T.CY+3);G.objs.set(ci,{t:'chest',items:Array(18).fill(null)});
          const s=JSON.parse(JSON.stringify(T.serialize()));s.inv[3]={id:'roofWood',c:4};s.inv[4]={id:'roofStone',c:3};const ch=s.objs.find(e=>e[0]===ci);ch[1].items[0]={id:'roofWood',c:1};
          s.roof=[];for(let k=0;k<5;k++)s.roof.push([T.idx(T.CX+20+k,T.CY+20),'wood']);s.roof.push([T.idx(T.CX+20,T.CY+21),'stone']);
          T.deserialize(s);const G2=T.G;const items=G2.inv.filter(Boolean).map(x=>x.id+':'+x.c).join(',');const chest=G2.objs.get(ci).items.filter(Boolean).map(x=>x.id+':'+x.c).join(',');
          return [items,chest,T.countItem('wood'),T.countItem('stone'),'roof' in T.serialize(),G2.stats.roofBack]}""")
        rec('지붕 삭제','옛 세이브: 가방·상자 속 지붕은 재료로 (지붕 2개 = 재료 1개, 올림)', 'roofWood' not in r[0]+r[1] and 'roofStone' not in r[0] and r[1]=='wood:1', str(r))
        rec('지붕 삭제','옛 세이브: 놓인 지붕도 재료로 (나무 5칸 → 3, 돌 1칸 → 1)', r[2]==5+2+3 and r[3]==2+1 and r[4] is False and r[5]==4+3+1+5+1, str(r))
        await pg.wait_for_timeout(1500)
        r=await ev(pg,"()=>document.querySelector('#toasts').innerText")
        rec('지붕 삭제','불러올 때 돌려받았다는 알림', '지붕' in r, r[:80])
        # ---- thin wall height & bottom line ----
        r=await ev(pg,"""()=>{const T=__T;const rows=(img)=>{const g=img.getContext('2d').getImageData(0,0,img.width,img.height).data;let top=-1,bot=-1;for(let y=0;y<img.height;y++){let any=false;for(let x=0;x<img.width;x++)if(g[(y*img.width+x)*4+3]>0)any=true;if(any){if(top<0)top=y;bot=y}}return [top-26,bot-26]};
          const wall=[-T.LIFT,15];return [rows(T.twSprite('bThinWood',10,false)),rows(T.twSprite('bWinStone',10,false)),rows(T.twSprite('bDoorWood',10,false)),rows(T.twSprite('slideDoor',10,0)),rows(T.twSprite('bHalfWood',10,false)),wall]}""")
        rec('얇은 벽','얇은 벽 윗면·바닥선이 바위벽과 같음 (위 -5px, 바닥 칸 맨 아래)', r[0]==r[5], str(r))
        rec('얇은 벽','창문벽·문·자동 미닫이문도 같은 높이', r[1]==r[5] and r[2]==r[5] and r[3]==r[5], str(r))
        rec('얇은 벽','반벽도 바닥선은 칸 맨 아래', r[4][1]==15, str(r))
        # ---- floor stops at the wall line ----
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const px=(cv,x,y)=>Array.from(cv.getContext('2d').getImageData(x,y,1,1).data).join(',');
          const at=(x,y,qx,qy)=>{const cv=T.getChunk(Math.floor(x/16),Math.floor(y/16));return px(cv,(x%16)*16+qx,(y%16)*16+qy)};
          const ref=(f,x,y,qx,qy)=>px(T.SPR.floor[f][(T.hash2(x,y,5)*4)|0],qx,qy);
          const out=[];const y=y0+3;
          // left wall: outside grass on the left half, wood floor on the right half
          out.push(at(x0,y,3,5)===ref(1,x0,y,3,5), at(x0,y,12,5)===ref(5,x0,y,12,5));
          // put wood floor under the wall itself: still ends at the wall line
          G.floor[T.idx(x0,y)]=5; out.push(at(x0,y,3,5)===ref(1,x0,y,3,5), at(x0,y,12,5)===ref(5,x0,y,12,5));
          // right wall
          const xr=x0+8;out.push(at(xr,y,3,5)===ref(5,xr,y,3,5), at(xr,y,12,5)===ref(1,xr,y,12,5));
          return out}""")
        rec('바닥','얇은 벽 칸: 바깥쪽 절반은 바깥 땅, 안쪽 절반은 방 바닥', r[0] and r[1] and r[4] and r[5], str(r))
        rec('바닥','벽 칸에 바닥을 깔아도 벽선에서 딱 끝남', r[2] and r[3], str(r))
        # ---- double door & long window ----
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const yd=y0+7;G.objs.set(T.idx(x0+2,yd),{t:'bDoorWood'});G.objs.set(T.idx(x0+3,yd),{t:'bDoorWood'});
          for(let x=x0+5;x<=x0+7;x++)G.objs.set(T.idx(x,yd),{t:'bWinWood'});
          const m=[T.twMask(x0+2,yd,'door'),T.twMask(x0+3,yd,'door'),T.twMask(x0+5,yd,'win'),T.twMask(x0+6,yd,'win'),T.twMask(x0+7,yd,'win'),T.twMask(x0+1,yd,'thin')];
          const glass=(id,mk,x)=>Array.from(T.twSprite(id,mk,false).getContext('2d').getImageData(x,26+4,1,1).data).join(',');
          return [m.map(v=>v&48),glass('bWinWood',m[3],0),glass('bWinWood',m[3],15),glass('bWinWood',10,1)]}""")
        rec('양문·긴 창','같은 종류가 가로로 붙으면 이어짐 표시 (문 2칸, 창문벽 3칸)', r[0]==[32,16,32,48,16,0], str(r[0]))
        rec('양문·긴 창','가운데 창문벽은 양 끝까지 유리', r[1]=='168,220,245,255' and r[2]=='168,220,245,255' and r[3]!='168,220,245,255', str(r[1:]))
        await stand(pg,0,0,0,-1)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x0=T.CX+14,y0=T.CY+6,yd=y0+7;G.p.x=x0+2.5;G.p.y=yd+1.5;G.p.face={x:0,y:-1};return [T.decide().k,T.decide().lbl]}""")
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
        r2=await ev(pg,"()=>{const T=__T,G=T.G;const x0=T.CX+14,yd=T.CY+13;return [!!G.objs.get(T.idx(x0+2,yd)).open,!!G.objs.get(T.idx(x0+3,yd)).open]}")
        rec('양문','한쪽을 열면 양문이 함께 열림', r==['use','열기'] and r2==[True,True], str(r)+str(r2))
        # the player standing in the right leaf (facing the left one) blocks closing both
        await ev(pg,"()=>{const T=__T,G=T.G;G.p.x=T.CX+14+3.5;G.p.y=T.CY+13.5;G.p.face={x:-1,y:0}}"); await pg.wait_for_timeout(100)
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
        r=await ev(pg,"()=>{const T=__T,G=T.G;const x0=T.CX+14,yd=T.CY+13;return [!!G.objs.get(T.idx(x0+2,yd)).open,!!G.objs.get(T.idx(x0+3,yd)).open]}")
        await ev(pg,"()=>{const T=__T,G=T.G;G.p.x=T.CX+14+2.5;G.p.y=T.CY+14.5;G.p.face={x:0,y:-1}}"); await pg.wait_for_timeout(100)
        rec('양문','한쪽 문턱에 누가 있으면 둘 다 안 닫힘', r==[True,True], str(r))
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
        r=await ev(pg,"()=>{const T=__T,G=T.G;const x0=T.CX+14,yd=T.CY+13;return [!!G.objs.get(T.idx(x0+2,yd)).open,!!G.objs.get(T.idx(x0+3,yd)).open]}")
        rec('양문','다시 누르면 함께 닫힘', r==[False,False], str(r))
        # ---- auto sliding door ----
        r=await ev(pg,"()=>{const r=__T.RECIPES.find(r=>r.out==='slideDoor');return r&&[r.at,r.cat,JSON.stringify(r.req),__T.ITEMS.slideDoor.n]}")
        rec('자동 미닫이문','구리 제작대·건축 탭 (구리괴 3·철괴 2·수정 조각 1)', r==['forge','build','[["copperBar",3],["ironBar",2],["crystal",1]]','자동 미닫이문'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,y0]=__room();const sx=x0+4;G.objs.set(T.idx(sx,y0),{t:'slideDoor'});G.p.x=sx+.5;G.p.y=y0+1.5;G.p.face={x:0,y:-1};return [T.decide().k,T.decide().lbl]}""")
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
        r2=await ev(pg,"()=>{const T=__T,G=T.G;return !!G.objs.get(T.idx(T.CX+18,T.CY+6)).open}")
        rec('자동 미닫이문','전기가 없으면 손으로 여닫음', r==['use','열기'] and r2 is True, str(r)+str(r2))
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(450)
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;const o=G.objs.get(T.idx(sx,y0));const shut=!o.open;
          G.objs.set(T.idx(sx,y0-2),{t:'crystalGen'});G.wire.set(T.idx(sx,y0-1),1);G.p.x=sx+.5;G.p.y=y0+5.5;for(let k=0;k<3;k++)T.circuitTick(.2);const far=!!o.open;
          G.p.y=y0+1.5;for(let k=0;k<2;k++)T.circuitTick(.2);const near=!!o.open,lbl=T.decide().lbl;G.p.y=y0+5.5;for(let k=0;k<2;k++)T.circuitTick(.2);const away=!!o.open;
          return [shut,far,near,lbl,away]}""")
        rec('자동 미닫이문','전기가 들어오면: 멀면 닫힘, 다가가면 열림, 멀어지면 닫힘', r[0] and r[1]==False and r[2]==True and r[4]==False, str(r))
        rec('자동 미닫이문','전기가 있을 때 버튼은 "자동문"', r[3]=='자동문', str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;const o=G.objs.get(T.idx(sx,y0));G.p.x=sx+.5;G.p.y=y0+6;T.circuitTick(.2);
          G.enemies.length=0;G.enemies.push({k:'slimeG',x:sx+.5,y:y0+1.3,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0});for(let k=0;k<3;k++)T.circuitTick(.2);const a=!!o.open;G.enemies.length=0;return [a]}""")
        rec('자동 미닫이문','몬스터가 다가와도 안 열림', r[0] is False, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;G.objs.set(T.idx(sx+1,y0),{t:'slideDoor'});const m=[T.twMask(sx,y0,'slide')&48,T.twMask(sx+1,y0,'slide')&48];
          G.p.x=sx+1.5;G.p.y=y0+1.4;for(let k=0;k<2;k++)T.circuitTick(.2);return [m,!!G.objs.get(T.idx(sx,y0)).open,!!G.objs.get(T.idx(sx+1,y0)).open]}""")
        rec('자동 미닫이문','두 칸을 붙이면 함께 열림', r==[[32,16],True,True], str(r))
        await ev(pg,"()=>{const T=__T,G=T.G;G.p.x=T.CX+19;G.p.y=T.CY+7.4;G.p.face={x:0,y:-1};T.circuitTick(.2)}")
        await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'qa41_room.png',clip={'x':340,'y':120,'width':600,'height':560})
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const sx=T.CX+18,y0=T.CY+6;const o=G.objs.get(T.idx(sx,y0));const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const o2=T.G.objs.get(T.idx(sx,y0));return [o2.t,Object.keys(o2).sort().join(',')]}""")
        rec('저장','자동 미닫이문 저장/불러오기 (움직임 상태는 저장 안 함)', r[0]=='slideDoor' and 'sl' not in r[1].split(','), str(r))
        # ---- skill points at the top level ----
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.rpg=T.cleanRpg(null);let n=0;while(G.rpg.lv<T.MAX_LV&&n<500){T.gainXp(5000);n++}const tot=Object.values(T.SKILLS).reduce((a,s)=>a+s.max,0);return [G.rpg.lv,G.rpg.sp,tot]}""")
        rec('스킬 포인트','최고 레벨이 되면 모든 스킬을 다 올릴 만큼 (30)', r==[30,30,30], str(r))
        r=await ev(pg,"""()=>{const T=__T;const sk={};let left=29;for(const k in T.SKILLS){const l=Math.min(T.SKILLS[k].max,left);if(l)sk[k]=l;left-=l}
          const a=T.cleanRpg({lv:30,xp:0,sp:0,sk});const b=T.cleanRpg({lv:30,xp:0,sp:1,sk});const c=T.cleanRpg({lv:12,xp:0,sp:2,sk:{tough:3,miner:3,dash:3}});const d=T.cleanRpg({lv:12,xp:0,sp:11,sk:{}});return [a.sp,b.sp,c.sp,d.sp]}""")
        rec('스킬 포인트','옛 세이브(최고 레벨, 하나 모자람) 불러오면 +1, 이미 받았으면 그대로', r==[1,1,2,11], str(r))
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
