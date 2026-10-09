import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 숨은 방 (v35): 지역마다 1~2개, 금 간 벽, 보물상자, 옛 세이브에도 생성
H2=HOOK.replace("computeLight}","computeLight,placeRooms,genWorld,roomTick,openTreasure,ROOM_LOOT,ROOM_DECO,QSIDE,questState,targetTile,get DOORS(){return DOORS},drawMap,lightAt,cam}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{__T.G.enemies.length=0;window.__out=r=>r.dy===r.y+3?[0,1]:r.dy===r.y-1?[0,-1]:r.dx===r.x-1?[-1,0]:[1,0]}")
        r=await ev(pg,"""()=>{const T=__T,G=T.G,R=G.rooms;const per=[0,0,0,0,0];for(const r of R)per[r.b]++;
          const bad=[];for(const r of R){for(let y=r.y;y<=r.y+2;y++)for(let x=r.x;x<=r.x+3;x++){const i=T.idx(x,y);if(G.wall[i]||G.floor[i]!==6)bad.push('in'+r.id)}
            for(let y=r.y-1;y<=r.y+3;y++)for(let x=r.x-1;x<=r.x+4;x++){if(y>=r.y&&y<=r.y+2&&x>=r.x&&x<=r.x+3)continue;if(!G.wall[T.idx(x,y)])bad.push('ring'+r.id)}
            const c=G.objs.get(T.idx(r.cx,r.cy));if(!c||c.t!=='tchest')bad.push('chest'+r.id);const dIn=[[0,1],[0,-1],[1,0],[-1,0]].some(([ox,oy])=>{const x=r.dx+ox,y=r.dy+oy;return x>=r.x&&x<=r.x+3&&y>=r.y&&y<=r.y+2});if(!dIn||!G.wall[T.idx(r.dx,r.dy)])bad.push('door'+r.id);if(G.biome[T.idx(r.x+1,r.y+1)]!==r.b)bad.push('biome'+r.id)}
          return [R.length,per,bad]}""")
        rec('생성','새 게임: 지역마다 1~2개 숨은 방 (이끼·버섯숲·수정 2개, 용암·얼음 1개 목표)', r[0]>=6 and all(1<=n<=2 for n in r[1]), str(r[:2]))
        rec('생성','방 안은 빈 돌바닥, 둘레는 벽, 보물상자 있음, 금 간 벽은 방 둘레 한 칸', r[2]==[], str(r[2][:6]))
        r=await ev(pg,"()=>{const T=__T,G=T.G;const R=G.rooms;let far=true;for(const a of R)for(const b2 of R)if(a!==b2&&Math.hypot(a.x-b2.x,a.y-b2.y)<24)far=false;const safe=[[__T.CX,__T.CY],[__T.BX,__T.BY]];const nearSafe=R.some(r=>safe.some(([x,y])=>Math.hypot(r.x+2-x,r.y+1-y)<16));return [far,nearSafe]}")
        rec('생성','방끼리 떨어져 있고 시작 지점·보스방 근처엔 없음', r==[True,False], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const rm=G.rooms[2];G.treeSeeds=0;const od=__out(rm);G.p.x=rm.dx+.5+od[0]*3;G.p.y=rm.dy+.5+od[1]*3;T.cam.x=G.p.x;T.cam.y=G.p.y;T.computeLight();const a=T.lightAt(rm.cx,rm.cy);const tc=G.objs.get(T.idx(rm.cx,rm.cy));const h=!!tc.hid;delete tc.hid;T.computeLight();const b2=T.lightAt(rm.cx,rm.cy);tc.hid=1;return [h,+a.toFixed(3),+b2.toFixed(3)]}""")
        rec('발견','찾기 전엔 방 안이 어두움 (보물상자 빛은 찾은 뒤부터)', r[0] is True and r[2]>r[1]+0.05, str(r))
        # hint and discovery
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const rm=G.rooms[0];const di=T.idx(rm.dx,rm.dy);const had=T.DOORS.has(di);
          const od=__out(rm);G.p.x=rm.dx+.5+od[0]*2.1;G.p.y=rm.dy+.5+od[1]*2.1;T.roomTick();const h=rm.hint;const f0=rm.found;const toast1=document.body.innerText.includes('바람이 새어');
          G.p.x=rm.x+1.5;G.p.y=rm.y+1.5;T.roomTick();return [had,h,f0,toast1,rm.found,T.DOORS.has(di),G.stats.rooms]}""")
        rec('발견','금 간 벽 근처에 가면 "바람이 새어 나와요" 힌트', r[0] is True and r[1]==1 and r[2]==0 and r[3] is True, str(r))
        rec('발견','방 안에 들어가면 찾은 것으로 기록, 금 간 벽 표시가 사라짐', r[4]==1 and r[5] is False and r[6]==1, str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const rm=G.rooms[1];G.wall[T.idx(rm.dx,rm.dy)]=0;G.p.x=__T.CX+.5;G.p.y=__T.CY+2;T.roomTick();return rm.found}""")
        rec('발견','금 간 벽을 부숴도 찾은 것으로 기록', r==1, r)
        # treasure
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const rm=G.rooms.find(r=>r.k===0);G.p.x=rm.cx+.5;G.p.y=rm.cy+1.5;G.p.face={x:0,y:-1};const a=T.decide();
          T.computeLight();const l0=T.lightAt(rm.cx,rm.cy);G.drops.length=0;T.openTreasure({x:rm.cx,y:rm.cy},G.objs.get(T.idx(rm.cx,rm.cy)));const got={};for(const d of G.drops)got[d.id]=(got[d.id]||0)+d.c;const a2=T.decide();
          const exp=T.ROOM_LOOT[rm.b][0];return [a.k,a.lbl,got,exp,T.ROOM_DECO[rm.b],rm.open,G.objs.get(T.idx(rm.cx,rm.cy)).open,a2.k,a2.lbl,G.stats.chests]}""")
        rec('보물상자','바라보면 "보물상자 열기"', r[0]=='treasure', str(r[:2]))
        rec('보물상자','열면 지역별 보물과 그 지역 장식(첫 방)이 나옴', all(r[2].get(i,0)==c for i,c in r[3]) and r[2].get(r[4],0)==1, str(r[2:5]))
        rec('보물상자','한 번 열면 빈 상자 (다시 열 수 없음)', r[5]==1 and r[6]==1 and r[7]=='info' and r[8]=='빈 보물상자' and r[9]==1, str(r[5:]))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const rm=G.rooms.find(r=>r.k===1);if(!rm)return 'none';G.drops.length=0;T.openTreasure({x:rm.cx,y:rm.cy},G.objs.get(T.idx(rm.cx,rm.cy)));const ids=G.drops.map(d=>d.id);G.drops.length=0;return [ids.some(i=>T.ROOM_DECO.includes(i)),ids.length]}""")
        rec('보물상자','두 번째 방은 다른 보물 (장식 없음)', r=='none' or (r[0] is False and r[1]>=3), str(r))
        r=await ev(pg,"()=>{const T=__T,G=T.G;const ok=['mossLantern','sporeChime','cryVase','emberBowl','iceSwan'].every(id=>T.ITEMS[id]&&T.ITEMS[id].kind==='place'&&T.OBJ[id].light&&T.SPR?true:T.ITEMS[id]&&T.OBJ[id].light);return ok}")
        rec('장식','장식 5종 모두 놓을 수 있고 빛이 남', r is True, r)
        # quest
        r=await ev(pg,"()=>{const T=__T,G=T.G;const q=T.QSIDE.find(x=>x.id==='s_rooms');G.stats.chests=2;const a=T.questState(q).done;G.stats.chests=3;return [a,T.questState(q).done,JSON.stringify(q.rw),q.xp]}")
        rec('도전','숨은 방 보물상자 3개 열기', r[0] is False and r[1] is True, str(r))
        # map
        r=await ev(pg,"()=>{const T=__T,G=T.G;const rm=G.rooms[G.rooms.length-1];rm.found=1;rm.open=0;T.openPanel('map');const t=document.querySelector('#sheet').innerText;T.closePanel();return t.includes('찾은 보물상자')}")
        rec('지도','찾았지만 안 연 보물상자가 지도에 표시 (범례 포함)', r is True, r)
        # save round trip
        r=await ev(pg,"""()=>{const T=__T;const a=JSON.stringify(T.G.rooms);const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);return [JSON.stringify(T.G.rooms)===a,T.G.rooms.length]}""")
        rec('세이브','방 위치·찾음·열림이 저장·불러오기 뒤에도 그대로 (다시 파지 않음)', r[0] is True, str(r))
        # old save without rooms
        r=await ev(pg,"""()=>{const T=__T;const sv=JSON.parse(JSON.stringify(T.serialize()));const w0=T.genWorld(sv.seed);
          // an old save: the world before rooms, with a player wall block and a chest on rock
          T.deserialize(sv);const G0=T.G;for(const r of G0.rooms){for(let y=r.y-1;y<=r.y+3;y++)for(let x=r.x-1;x<=r.x+4;x++){const i=T.idx(x,y);G0.wall[i]=w0.wall[i];G0.floor[i]=w0.floor[i];const o=w0.objs.get(i);if(o)G0.objs.set(i,{...o});else G0.objs.delete(i)}}
          const old=JSON.parse(JSON.stringify(T.serialize()));delete old.rooms;const W0=Uint8Array.from(G0.wall);const objs0=new Map(G0.objs);
          T.deserialize(old);const G=T.G;let changed=0,bad=0;for(let i=0;i<G.wall.length;i++){if(G.wall[i]!==W0[i]){changed++;const inRoom=G.rooms.some(r=>{const x=i%200,y=(i/200)|0;return x>=r.x&&x<=r.x+3&&y>=r.y&&y<=r.y+2});if(!inRoom||W0[i]!==w0.wall[i]||objs0.get(i))bad++}}
          let lost=0;for(const [i,o] of objs0)if(!G.objs.get(i))lost++;
          return [G.rooms.length,changed,bad,lost,G.rooms.every(r=>!r.found&&!r.open)]}""")
        rec('옛 세이브','숨은 방이 없던 세이브도 불러오면 방이 생김', r[0]>=6 and r[4] is True, str(r))
        rec('옛 세이브','손대지 않은 암반만 파고, 플레이어 물건·다른 칸은 그대로', r[1]==r[0]*12 and r[2]==0 and r[3]==0, str(r))
        # screenshot: in front of a cracked wall
        await ev(pg,"""()=>{const T=__T,G=T.G;const rm=G.rooms[0];const od=__out(rm);G.p.x=rm.dx+.5+od[0]*1.8;G.p.y=rm.dy+.5+od[1]*1.8;G.enemies.length=0;G.treeSeeds=5}""")
        await pg.wait_for_timeout(800); await pg.screenshot(path=SP+'qa35_door.png')
        await ev(pg,"""()=>{const T=__T,G=T.G;const rm=G.rooms[0];G.wall[T.idx(rm.dx,rm.dy)]=0;G.p.x=rm.dx+.5;G.p.y=rm.y+2.4;G.enemies.length=0}""")
        await pg.wait_for_timeout(800); await pg.screenshot(path=SP+'qa35_room.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
