# 세계·이동·동물: 고리 지도, 고리 지도 보스방, 깊은 동굴, 숨은 방, 귀환·기절, 긴급 탈출, 울타리 친 집(갇힘 버그), 펫, 목장
# 실행: python3 dev/qa/run.py world   (테스트 하나만: python3 dev/qa/run.py ring_map)
from harness import *


def test_ring_map():
    import asyncio, sys
    # v47: 600x600 고리 지도 (새 게임), 옛 세이브는 200x200 그대로, 지형 재료 2배
    H2=HOOK.replace("computeLight}","computeLight,LAVA,newGame,GUIDE,QSIDE,RECIPES,rebuildMap,genFlowerZones,get L(){return {LAY,W,H,CX,CY,BX,BY,SA,SB,SL,SI}}}")
    async def main():
        mkpage(SRC,'qa.html',H2,layout=2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            r=await ev(pg,"()=>{const L=__T.L;return [L.LAY,L.W,L.H,L.CX,L.CY,__T.G.wall.length]}")
            rec('지도','새 게임은 가로세로 3배 (600×600)', r==[2,600,600,300,300,360000], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,L=T.L;const at=(deg,rr)=>{const x=Math.round(L.CX+Math.cos(deg*Math.PI/180)*rr),y=Math.round(L.CY+Math.sin(deg*Math.PI/180)*rr);return T.idx(x,y)};
          const bAt=(deg,rr)=>{const c={};for(let k=-6;k<=6;k++){const b=G.biome[at(deg+k*2,rr)];c[b]=(c[b]||0)+1}return +Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0]};
          return [G.biome[T.idx(L.CX,L.CY)],bAt(-90,70),bAt(90,70),bAt(-90,175),bAt(30,175),bAt(150,175),[0,60,120,200,300].map(d=>G.floor[at(d,262)]===T.WATER||G.wall[at(d,262)]===2).filter(Boolean).length,[0,90,180,270].every(d=>G.wall[at(d,285)]===8)]}""")
            rec('배치','가운데 시작 · 북쪽 이끼 동굴 / 남쪽 버섯숲 · 북쪽 수정 / 남동 용암 / 남서 얼음 · 바다 고리 · 끝은 암반', r==[0,0,1,2,3,4,5,True], str(r))
            r=await ev(pg,"""()=>{const G=__T.G,c={};let n=0;for(let i=0;i<G.wall.length;i++){const w=G.wall[i];if(!w||w===8)continue;n++;c[w]=(c[w]||0)+1}const ds=((c[1]||0)+(c[2]||0))/n;const open=(()=>{let o=0,t=0;for(let i=0;i<G.wall.length;i++){if(G.wall[i]===8)continue;t++;if(!G.wall[i])o++}return o/t})();return [+ds.toFixed(2),+open.toFixed(2),c[3]>0&&c[9]>0&&c[11]>0&&c[4]>0&&c[5]>0&&c[10]>0&&c[12]>0&&c[13]>0]}""")
            rec('지형','흙벽·돌벽이 벽의 절반 넘게, 지역마다 고유 벽과 광맥도 있음', r[0]>=0.5 and r[2], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,L=T.L;const out={};for(const [k,s] of [['slime',{x:L.BX,y:L.BY}],['queen',L.SA],['golem',L.SB],['turtle',L.SL],['spirit',L.SI]]){let w=0;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++)if(Math.hypot(dx,dy)<5&&G.wall[T.idx(s.x+dx,s.y+dy)])w++;out[k]=[w,G.biome[T.idx(s.x,s.y)]]}
          return [out,['queen','golem','turtle','spirit'].map(k=>{const h=T.BOSSES[k].home();return Math.round(Math.hypot(h.x-L.CX,h.y-L.CY))}),G.rooms.length]}""")
            rec('보스','보스방 5곳이 맞는 지역에 열려 있고 거리가 알맞음, 숨은 방 8개', all(v[0]==0 for v in r[0].values()) and [r[0][k][1] for k in ['slime','queen','golem','turtle','spirit']]==[0,1,2,3,4] and all(60<=d<=180 for d in r[1]) and r[2]==8, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,L=T.L;const bad={};for(let y=L.CY-100;y<=L.CY+100;y++)for(let x=L.CX-100;x<=L.CX+100;x++){if(Math.hypot(x-L.CX,y-L.CY)>=100)continue;const i=T.idx(x,y);const b=G.biome[i],w=G.wall[i],f=G.floor[i];if(b>1)bad.b=(bad.b||0)+1;if([3,9,10,11,12,13].includes(w))bad.w=(bad.w||0)+1;if([18,19,20,4].includes(f)||f===T.LAVA)bad.f=(bad.f||0)+1}return JSON.stringify(bad)}""")
            rec('배치','가운데 1·2 지역(반지름 100칸 안)에는 수정·용암·얼음 지형(땅·벽·광맥)이 없음', r=='{}', r)
            r=await ev(pg,"()=>{const z=__T.G.fzones;return [z.length,new Set(z.map(q=>q.c)).size]}")
            rec('지도','꽃망울 구역도 생김', r[0]>=8 and r[1]==5, str(r))
            r=await ev(pg,"()=>{const T=__T;const g=T.GUIDE.map(q=>typeof q.t==='function'?q.t():q.t).join('|')+T.GUIDE.map(q=>typeof q.h==='function'?q.h():q.h).join('|');return [g.includes('남서쪽 버섯숲'),g.includes('북동쪽 이끼 동굴의 말랑대왕'),g.includes('북쪽 수정동굴'),g.includes('남동쪽 용암 동굴'),g.includes('남서쪽 얼음 동굴'),g.includes('서쪽 버섯숲의')&&!g.includes('남서쪽 버섯숲의')]}")
            rec('퀘스트','퀘스트 방향이 새 지도에 맞게 (남서쪽 버섯숲, 북동쪽 말랑대왕 …)', r==[True,True,True,True,True,False], str(r))
            r=await ev(pg,"""()=>{const T=__T;const t0=performance.now();T.newGame(4242);const t1=performance.now();const s=JSON.stringify(T.serialize());const sv=JSON.parse(s);T.deserialize(sv);const t2=performance.now();return [Math.round(t1-t0),Math.round(t2-t1),s.length,sv.mapV,T.L.W,T.G.wall.length]}""")
            rec('성능','새 세계 만들기 2초 안, 불러오기 2초 안, 세이브 900KB 아래', r[0]<2000 and r[1]<2000 and r[2]<900000 and r[3:]==[2,600,360000], str(r))
            # old saves keep their 200x200 map
            r=await ev(pg,"""()=>{const T=__T;localStorage.setItem('lantern-tree-layout','1');T.newGame(77);const old=JSON.parse(JSON.stringify(T.serialize()));delete old.mapV;localStorage.setItem('lantern-tree-layout','2');T.deserialize(old);const a=[T.L.LAY,T.L.W,T.G.wall.length,T.L.CX];
          const g=T.GUIDE.map(q=>typeof q.t==='function'?q.t():q.t).join('|');const b2=JSON.parse(JSON.stringify(T.serialize())).mapV;T.newGame(5);return a.concat([g.includes('서쪽 버섯숲'),!g.includes('남서쪽'),b2,T.L.W])}""")
            rec('옛 세이브','v47 전 세이브는 200×200 지도 그대로 (퀘스트 방향도 예전대로), 새 게임은 다시 600×600', r==[1,200,40000,100,True,True,1,600], str(r))
            r=await ev(pg,"()=>{const T=__T,f=id=>{const r=T.RECIPES.find(q=>q.out===id);return JSON.stringify(r.req)};return [f('furnace'),f('quarry'),f('generator'),f('pot')]}")
            rec('재료','지형 재료(흙·돌·화강암·현무암·얼음) 필요 개수 2배', r==['[["dirt",20],["wood",4],["resin",1]]','[["stone",40],["wood",8],["rope",2]]','[["ironBar",6],["stone",32],["copperBar",4]]','[["copperBar",3],["stone",8],["wood",2]]'], str(r))
            # the whole map, all explored
            await ev(pg,"()=>{const T=__T,G=T.G;G.explored.fill(1);T.rebuildMap();T.openPanel('map')}"); await pg.wait_for_timeout(600)
            await pg.click('#sheet [data-a=mapzoom]'); await pg.wait_for_timeout(600)
            await pg.screenshot(path=SP+'map.png')
            await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'home.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_ring_map_boss_room():
    import asyncio, sys
    # v49.1 버그 수정: 고리 지도에서 말랑대왕 방(과 그 방에서 시작하는 수정골렘 길)이 바위 고리에 막히던 문제 / 귀환석으로 표지에 돌아갈 때 막힌 굴이면 엉뚱한 곳으로 옮겨지던 문제
    H2=HOOK.replace("computeLight}","computeLight,newGame,get L(){return {LAY,W,H,CX,CY}},BKEYS,LAVA,WALLS,startRecall,recallTick,homePt}")
    async def main():
        mkpage(SRC,'qa.html',H2,layout=2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            res=[]
            for seed in [11,222,3333,44444,555555,7,1234]:
                r=await ev(pg,"""(seed)=>{const T=__T;T.newGame(seed);const G=T.G,L=T.L,W=L.W;
              const flood=block=>{const seen=new Uint8Array(W*L.H);const st=[[L.CX,L.CY+1]];seen[T.idx(L.CX,L.CY+1)]=1;
                while(st.length){const [x,y]=st.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=L.H)continue;const j=T.idx(nx,ny);if(seen[j]||block(j))continue;seen[j]=1;st.push([nx,ny])}}return seen};
              const wet=j=>G.floor[j]===T.WATER||G.floor[j]===T.LAVA;
              const open=flood(j=>G.wall[j]||wet(j)), dig=flood(j=>(G.wall[j]&&T.WALLS[G.wall[j]].tier>=3)||wet(j)), deep=flood(j=>G.wall[j]===8||wet(j));
              const near=(s,x,y)=>{for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(s[T.idx(Math.round(x)+dx,Math.round(y)+dy)])return 1;return 0};
              const o={};for(const k of T.BKEYS){const h=T.BOSSES[k].home();o[k]=''+near(open,h.x,h.y)+near(dig,h.x,h.y)+near(deep,h.x,h.y)}return o}""",seed)
                res.append(r)
            ok1=all(r['slime']=='111' and r['queen']=='111' and r['golem']=='111' for r in res)
            rec('고리 지도','말랑대왕·버섯 여왕·수정골렘 방까지 걸어서 열린 길이 있음 (여러 세계)', ok1, str(res))
            ok2=all(r['turtle']=='001' and r['spirit']=='001' for r in res)
            rec('고리 지도','용암·얼음 보스방은 수정 곡괭이로 깨는 바위 고리 너머 (암반·물·용암에 막히지는 않음)', ok2, str([(r['turtle'],r['spirit']) for r in res]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,L=T.L;const ox=L.CX+40,oy=L.CY+40;for(let y=oy-8;y<=oy+8;y++)for(let x=ox-8;x<=ox+8;x++){const i=T.idx(x,y);G.wall[i]=1;G.objs.delete(i)}
          for(let y=oy-1;y<=oy+1;y++)for(let x=ox-1;x<=ox+1;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2}
          G.enemies.length=0;G.recall=null;G.recallCd=0;G.spawnPt=null;const h=T.homePt();G.p.x=h.x;G.p.y=h.y;G.p.dead=0;G.p.hurt=0;G.backPt={x:ox+.5,y:oy+.5};T.startRecall('back');for(let k=0;k<4;k++)T.recallTick(.5);
          return [+(G.p.x-ox-.5).toFixed(2),+(G.p.y-oy-.5).toFixed(2),G.backPt]}""")
            rec('귀환석','표지가 막힌 굴(파서 들어간 곳) 안이어도 표지 자리로 정확히 돌아감', r==[0,0,None], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_deep_caves():
    import asyncio, sys
    # 깊은 동굴 준비 (v37): 불꽃 열매·서리 무 재배, 장비 칸·옷·장신구, 대비 요리, 깊은 동굴 재료 요리, 더위·추위 게이지와 화면 가장자리
    H2=HOOK.replace("computeLight}","computeLight,SPR,DISHES,DISH,RECIPES,knows,learnRecipe,eat,activeBuffs,moveMul,atkSpd,hungerMul,hurtPlayer,envTick,envLv,wearItem,unwear,grantAccs,syncNotes,roomNotes,bossNoteIds,GUIDE,ENEMY,CROP_SOIL,STAR_OF,cropStage,hitBoss,freshBoss,checkBiome0,get envFxV(){return envFxV},updateHazards,maxHp,SL,SI}")
    SET="""window.__spot=k=>{const T=__T,G=T.G;const zs=[];for(let i=0;i<G.biome.length;i++)if(G.biome[i]===k&&!G.wall[i]&&G.floor[i]!==T.WATER&&G.floor[i]!==17){const x=i%200,y=(i/200)|0;let ok=true;for(let dy=-4;dy<=4&&ok;dy++)for(let dx=-4;dx<=4;dx++){const j=T.idx(x+dx,y+dy);if(G.floor[j]===T.WATER){ok=false;break}const o=G.objs.get(j);if(o&&T.OBJ[o.t].light&&!T.OBJ[o.t].nat){ok=false;break}}
  if(ok&&Math.hypot(x-T.SL.x,y-T.SL.y)>13&&Math.hypot(x-T.SI.x,y-T.SI.y)>13)zs.push([x,y])}return zs[(zs.length/2)|0]};
window.__eat=(id)=>{const T=__T,G=T.G;G.inv[0]={id,c:1};G.sel=0;G.p.hunger=10;T.eat(0)};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+SET+"__T.G.enemies.length=0}")
            # crops
            r=await ev(pg,"""()=>{const T=__T,S=T.SPR.crop;return [['fire','radish'].map(k=>[S[k].length,new Set(S[k].map(v=>v[0].toDataURL())).size]),T.OBJ.cropFire.grow,T.OBJ.cropRadish.grow,T.CROP_SOIL.cropFire,T.CROP_SOIL.cropRadish,T.STAR_OF.fireBerry,T.STAR_OF.radish,
          T.OBJ.fireBloom.drops.find(d=>d[0]==='fireSeed')[3],T.ENEMY.snowling.drops.find(d=>d[0]==='radishSeed')[3]]}""")
            rec('작물','불꽃 열매·서리 무 200초, 4단계 그림, 맞는 흙(흙·이끼), 별 작물', r[0]==[[4,4],[4,4]] and r[1:7]==[200,200,2,1,'fireBerryS','radishS'], str(r))
            rec('작물','불꽃풀에서 불꽃 열매 씨앗 25%, 눈뭉치에서 서리 무 씨앗 20%', r[7]==0.25 and r[8]==0.2, str(r))
            # wear
            r=await ev(pg,"""()=>{const T=__T;const c=T.RECIPES.find(r=>r.out==='obsCoat'),f=T.RECIPES.find(r=>r.out==='frostRobe');return [c.at,JSON.stringify(c.req),f.at,JSON.stringify(f.req)]}""")
            rec('옷','금 장비제작대: 흑요석 외투(흑요석4·섬유10·금괴1), 서리 비단옷(서리 결정6·섬유10·금괴1)', r==['smelter','[["obsidian",4],["fiber",10],["goldBar",1]]','smelter','[["frostShard",6],["fiber",10],["goldBar",1]]'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;const before=T.SPR.player.down[0].toDataURL();G.inv[2]={id:'obsCoat',c:1};G.inv[3]={id:'frostRobe',c:1};G.sel=2;const a=T.decide();T.wearItem(2);const s1=[G.equip.body&&G.equip.body.id,G.inv[2]];const after=T.SPR.player.down[0].toDataURL();
          T.wearItem(3);const s2=[G.equip.body.id,G.inv[3]&&G.inv[3].id];T.unwear('body');const s3=[G.equip.body,G.inv.filter(Boolean).map(s=>s.id).sort().join(',')];return [a.k,a.lbl,s1,before!==after,s2,s3,T.SPR.player.down[0].toDataURL()===before]}""")
            rec('장비 칸','옷을 들고 누르면 입기 → 옷 칸으로, 캐릭터 겉모습이 바뀜', r[0]=='wear' and r[1]=='입기' and r[2]==['obsCoat',None] and r[3] is True, str(r))
            rec('장비 칸','다른 옷을 입으면 벗은 옷은 그 칸으로, 벗으면 가방으로 (겉모습도 원래대로)', r[4]==['frostRobe','obsCoat'] and r[5][0] is None and r[5][1]=='frostRobe,obsCoat' and r[6] is True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;T.openPanel('equip');const h=document.querySelector('#sheet').innerText;const n=document.querySelectorAll('#sheet [data-a=eqSlot]').length;T.closePanel();return [h.includes('장비'),n]}""")
            rec('장비 칸','가방 맨 위 장비에 옷 칸 (v48: 무기 칸 없이 4칸, 가방 안으로)', r==[True,4], str(r))
            # charms
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.beaten={};G.stats.accGot={};const k='turtle';const b=G.bosses[k];Object.assign(b,T.freshBoss(k));b.st='fight';G.drops.length=0;T.hitBoss(b,99999,false);const first=G.drops.some(d=>d.id==='turtleCharm');
          let again=0;const mr=Math.random;for(let n=0;n<20;n++){Object.assign(b,T.freshBoss(k));b.st='fight';G.bossDead[k]=false;G.drops.length=0;T.hitBoss(b,99999,false);if(G.drops.some(d=>d.id==='turtleCharm'))again++}G.drops.length=0;return [first,again]}""")
            rec('장신구','용암 거북 처치 → 거북 등껍질 부적 (재도전에서도 가끔)', r[0] is True and 1<=r[1]<=17, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.accGot={};G.stats.beaten={spirit:1};for(let k=0;k<G.inv.length;k++)G.inv[k]=null;T.grantAccs();return G.inv.some(s=>s&&s.id==='snowBrooch')}""")
            rec('장신구','이미 서리 정령을 물리친 세이브는 눈꽃 브로치를 받음', r is True, r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip.neck=null;G.equip.head=null;const p=G.p;const hit=k=>{p.hp=100;p.inv=0;p.dead=0;T.hurtPlayer(40,p.x+1,p.y,k);const d=100-p.hp;p.hp=100;p.inv=0;return d};const a=[hit('fire'),hit(null)];G.equip.neck={id:'turtleCharm',c:1};const b2=[hit('fire'),hit(null)];
          G.equip.neck=null;G.equip.head={id:'snowBrooch',c:1};G.hz=[{k:'frost',x:p.x,y:p.y,r:3,t:1,warn:0,life:2,dmg:5,slow:2}];p.inv=0;T.updateHazards(0.01);const sl=p.slowT;G.equip.head=null;G.hz=[{k:'frost',x:p.x,y:p.y,r:3,t:1,warn:0,life:2,dmg:5,slow:2}];p.inv=0;T.updateHazards(0.01);const sl2=p.slowT;p.slowT=0;p.hp=100;return [a,b2,sl,sl2]}""")
            rec('장신구','거북 등껍질 부적: 불덩이·용암 피해 30% 감소', r[0]==[40,40] and r[1]==[28,40], str(r))
            rec('장신구','눈꽃 브로치: 얼어서 느려지는 시간 절반', r[2]==1 and r[3]==2, str(r))
            # environment gauge
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];G.equip=G.equip||{};G.equip.body=null;const s=__spot(4);G.p.x=s[0]+.5;G.p.y=s[1]+.5;G.env={k:null,v:0,lv:0,t:0};for(let k=0;k<10;k++)T.envTick(1);const v10=G.env.v;const tx=document.body.innerText.includes('으슬으슬');
          G.env.v=50;const m=T.moveMul();G.env.v=0;const m0=T.moveMul();G.env.v=80;const a2=T.atkSpd(),m2=T.moveMul();G.env.v=0;const a0=T.atkSpd();return [G.env.k,v10,tx,+(m/m0).toFixed(2),+(m2/m0).toFixed(2),+(a2/a0).toFixed(2)]}""")
            rec('게이지','얼음 동굴 안: 1초에 +1, 들어가면 "으슬으슬해요"', r[0]=='cold' and r[1]==10 and r[2] is True, str(r))
            rec('게이지','추위 40↑ 이동 -10%, 70↑ 이동 -20%·공격 속도 -10%', r[3]==0.9 and r[4]==0.8 and r[5]==1.1, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const out={};const run=(n)=>{for(let k=0;k<n;k++)T.envTick(1)};
          G.env.v=0;G.equip.body={id:'obsCoat',c:1};run(10);out.coat=G.env.v;G.equip.body=null;
          G.env.v=0;G.buffs=[];__eat('hotTea');run(10);out.t1=G.env.v;G.buffs=[];G.env.v=0;__eat('hotSoup');run(10);out.t2=G.env.v;G.buffs=[];G.env.v=0;__eat('fireStew');run(10);out.t3=G.env.v;
          G.buffs=[];G.env.v=0;G.equip.body={id:'obsCoat',c:1};__eat('hotSoup');run(10);out.both=G.env.v;G.buffs=[];G.equip.body=null;
          G.env.v=50;const x=Math.floor(G.p.x),y=Math.floor(G.p.y);const i=T.idx(x+2,y);const had=G.objs.get(i);G.wall[i]=0;G.objs.set(i,{t:'torch'});run(2);out.torch=G.env.v;if(had)G.objs.set(i,had);else G.objs.delete(i);
          G.env.v=50;const px=G.p.x,py=G.p.y;G.p.x=__T.CX+.5;G.p.y=__T.CY+3;run(3);out.out=G.env.v;G.p.x=px;G.p.y=py;return out}""")
            rec('대비','옷 반 속도, 요리 1·2·3단계 75%·50%·안 오름, 옷+요리는 곱해짐', r['coat']==5 and r['t1']==7.5 and r['t2']==5 and r['t3']==0 and r['both']==2.5, str(r))
            rec('게이지','횃불 곁·동굴 밖에서는 1초에 -4', r['torch']==42 and r['out']==38, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.buffs=[];G.equip.body=null;G.p.x=__T.SI.x+.5+2;G.p.y=__T.SI.y+.5;G.env={k:'cold',v:0,lv:0,t:0};for(let k=0;k<10;k++)T.envTick(1);return G.env.v}""")
            rec('게이지','보스방 안에서는 오르는 속도 절반', r==5, r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=__spot(3);G.p.x=s[0]+.5;G.p.y=s[1]+.5;G.env={k:null,v:0,lv:0,t:0};T.envTick(1);const k=G.env.k;const h0=(G.env.v=0,T.hungerMul());G.env.v=50;const h1=T.hungerMul();G.env.v=80;const h2=T.hungerMul();
          G.env.v=100;G.p.hp=80;G.p.dead=0;for(let n=0;n<10;n++)T.envTick(1);const hp=G.p.hp;const fx=T.envFxV;G.env.v=0;G.p.hp=100;return [k,+(h1/h0).toFixed(2),+(h2/h0).toFixed(2),hp,+fx.toFixed(2)]}""")
            rec('게이지','용암 동굴은 더위: 40↑ 배고픔 1.3배, 70↑ 1.6배', r[0]=='hot' and r[1]==1.3 and r[2]==1.6, str(r))
            rec('게이지','100이면 5초마다 체력 -2', r[3]<=78 and r[3]>=74, str(r))
            rec('화면','100에서는 가장자리가 30~45% 사이로 숨 쉬듯', 0.25<=r[4]<=0.46, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=__spot(4);G.p.x=s[0]+.5;G.p.y=s[1]+.5;G.env={k:'cold',v:0,lv:0,t:0};for(let n=0;n<300;n++){G.env.v=0;T.envTick(1/20)}const z=T.envFxV;G.env.v=55;for(let n=0;n<20;n++)T.envTick(1/20);const a=T.envFxV;for(let n=0;n<200;n++){G.env.v=55;T.envTick(1/20)}const b2=T.envFxV;return new Promise(res=>setTimeout(()=>res([+a.toFixed(3),+b2.toFixed(3),document.querySelector('#envFx').className,!document.querySelector('#envBar').hidden,document.querySelector('#envBar').className]),300))}""")
            rec('화면','가장자리가 서서히 차오름 (40↑ 옅게 15%), 추위는 파란 서리', 0.04<r[0]<0.12 and 0.13<=r[1]<=0.16 and r[2]=='cold', str(r))
            rec('게이지','배고픔 아래 게이지 막대 (추위는 파랑)', r[3] is True and 'cold' in r[4], str(r))
            await pg.wait_for_timeout(200); await ev(pg,"()=>{const G=__T.G;G.env.v=80}"); await pg.wait_for_timeout(2500); await pg.screenshot(path=SP+'cold.png')
            # entrance suggestion
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip.body=null;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;G.inv[12]={id:'obsCoat',c:1};G.biomeNow=0;const s=__spot(4);G.p.x=s[0]+.5;G.p.y=s[1]+.5;T.checkBiome0();const el=document.querySelector('#wearAsk');const t=[!el.hidden,el.textContent];el.click();return [t,G.equip.body&&G.equip.body.id]}""")
            rec('편의','동굴 입구에서 맞는 옷이 가방에 있으면 "○○로 갈아입을까요?" 버튼', r[0][0] is True and '흑요석 외투로 갈아입을까요' in r[0][1] and r[1]=='obsCoat', str(r))
            # dishes and notes
            r=await ev(pg,"""()=>{const T=__T;const ids=['hotTea','hotSoup','fireStew','coolTea','coolPunch','radishSoup','fireSkewer','radishSalad','fireBeans','fireJelly','frostTea','firePie'];const ok=ids.every(id=>T.DISH[id]&&T.RECIPES.some(r=>r.out===id&&r.at==='pot'));
          const g=T.GUIDE.find(q=>q.id==='cpick');return [ok,T.DISHES.length,g.rw.filter(([id])=>id.startsWith('rn_')).map(x=>x[0]).join(','),T.bossNoteIds('turtle').join(','),T.bossNoteIds('spirit').join(',')]}""")
            rec('요리','대비 요리 6가지 + 깊은 동굴 재료 3단계 요리 6가지 (전체 38, v40 케이크 포함)', r[0] is True and r[1]==38, str(r))
            rec('쪽지','대비 요리 1·2단계는 「수정 곡괭이」 퀘스트 보상, 3단계는 깊은 동굴 보스', r[2]=='rn_hotTea,rn_hotSoup,rn_coolTea,rn_coolPunch' and r[3].startswith('fireStew') and r[4].startswith('radishSoup'), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const out={};for(const rm of G.rooms.filter(q=>q.b>=3))out[rm.id]=T.roomNotes(rm).join(',');return [out,T.bossNoteIds('turtle').join(','),T.bossNoteIds('spirit').join(','),[3,4].map(b=>G.rooms.filter(q=>q.b===b).length)]}""")
            rec('쪽지','용암·얼음 숨은 방에 불꽃 열매 젤리·불꽃 꽃잎 파이 쪽지 (방이 없으면 그 지역 보스가 줌)', ('fireJelly' in (r[0].get('r30','') if r[3][0] else r[1])) and ('firePie' in (r[0].get('r40','') if r[3][1] else r[2])), str(r))
            r=await ev(pg,"""()=>{const T=__T;const sv=JSON.parse(JSON.stringify(T.serialize()));sv.recipes={skewer:1};sv.rooms.forEach(r=>{r.open=r.b===3?1:0});for(const k in sv.bossDead)sv.bossDead[k]=false;sv.stats.beaten={};sv.qclaim={cpick:1};delete sv.equip;delete sv.env;
          T.deserialize(sv);const G=T.G;return [T.knows('skewer'),T.knows('fireJelly')||!G.rooms.some(r=>r.b===3),T.knows('hotTea')&&T.knows('coolPunch'),JSON.stringify(G.equip),G.env.k]}""")
            rec('옛 세이브','v36 세이브: 이미 연 용암 방·받은 퀘스트의 새 쪽지를 바로 해금, 장비 칸은 비어서 시작 (v48: 4칸)', r==[True,True,True,'{"body":null,"head":null,"neck":null,"ring":null}',None], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip.body={id:'frostRobe',c:1};G.equip.neck={id:'turtleCharm',c:1};G.env={k:'hot',v:63,lv:1,t:0};const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const G2=T.G;return [G2.equip.body.id,G2.equip.neck.id,G2.env.k,G2.env.v]}""")
            rec('세이브','장비와 게이지가 저장·불러오기 뒤에도 그대로', r==['frostRobe','turtleCharm','hot',63], str(r))
            # screenshots: hot at 100, and the bag with the equipment row
            await ev(pg,"""()=>{const T=__T,G=T.G;const s=__spot(3);G.p.x=s[0]+.5;G.p.y=s[1]+.5;G.env={k:'hot',v:100,lv:3,t:0};G.enemies.length=0;G.p.hp=100}""")
            await pg.wait_for_timeout(2600); await pg.screenshot(path=SP+'hot.png')
            await ev(pg,"()=>{const T=__T,G=T.G;G.env={k:null,v:0,lv:0,t:0};T.openPanel('inv')}"); await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'bag.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_hidden_rooms():
    import asyncio, sys
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
            rec('보물상자','바라보면 "상자 열기"', r[0]=='treasure', str(r[:2]))
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
            r=await ev(pg,"()=>{const T=__T,G=T.G;const rm=G.rooms[G.rooms.length-1];rm.found=1;rm.open=0;T.openPanel('map');const t=document.querySelector('#sheet').innerText;T.closePanel();return t.includes('찾았지만 안 연 보물상자')}")
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
            await pg.wait_for_timeout(800); await pg.screenshot(path=SP+'door.png')
            await ev(pg,"""()=>{const T=__T,G=T.G;const rm=G.rooms[0];G.wall[T.idx(rm.dx,rm.dy)]=0;G.p.x=rm.dx+.5;G.p.y=rm.y+2.4;G.enemies.length=0}""")
            await pg.wait_for_timeout(800); await pg.screenshot(path=SP+'room.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_recall_faint():
    import asyncio, sys
    # 이동·패널티 (v38): 귀환석(집으로 → 표지로 돌아가기), 쓰러지면 재료 일부를 꾸러미로 떨어뜨림
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,GUIDE,startRecall,recallTick,homePt,respawn,pickLost,targetTile,cam,closedIn}")
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{__T.G.enemies.length=0}")
            r=await ev(pg,"()=>{const T=__T;const rc=T.RECIPES.find(r=>r.out==='homeStone');const g=T.GUIDE.find(q=>q.id==='cpick');return [rc.at,JSON.stringify(rc.req),g.rw.some(([id])=>id==='homeStone'),T.ITEMS.homeStone.stack]}")
            rec('귀환석','석영 장비제작대에서 만들고, 「수정 곡괭이」 퀘스트 보상으로도 하나', r==['smelter','[["crystal",6],["glowcap",3],["copperBar",2]]',True,1], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.spawnPt=null;G.backPt=null;G.recallCd=0;G.recall=null;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;G.inv[0]={id:'homeStone',c:1};G.sel=0;
          const far={x:__T.SB.x+.5,y:__T.SB.y+2.5};G.p.x=far.x;G.p.y=far.y;const a=T.decide();T.startRecall(a.mode);T.recallTick(.5);const mid=[!!G.recall,Math.round(G.p.x)];T.recallTick(.6);T.recallTick(.6);const h=T.homePt();
          const shut=T.closedIn(h.x,h.y),home=shut?(!shut.has(T.idx(Math.floor(G.p.x),Math.floor(G.p.y)))&&Math.hypot(G.p.x-h.x,G.p.y-h.y)<40?'바깥':'?'):+(G.p.x-h.x).toFixed(2)+','+(+(G.p.y-h.y).toFixed(2));
          return [a.k,a.lbl,mid,home,G.backPt&&Math.round(G.backPt.x)===Math.round(far.x),T.decide().k,T.decide().lbl]}""")
            # 새 세계는 테스트마다 무작위라, 혹시 집이 정말 막힌 세계(물 등)라면 바로 바깥으로 오는 게 맞아요 (자연 바위는 v64부터 막힘이 아님 — emergency_escape)
            rec('귀환석','멀리서 쓰면 "집으로" → 1.5초 가만히 있으면 등불나무 곁으로', r[0]=='recall' and r[1]=='집으로' and r[2][0] is True and r[3] in ('0,0','바깥'), str(r))
            rec('귀환석','떠난 자리에 표지가 남고, 1분 동안 쉼', r[4] is True and r[5]=='info' and r[6].startswith('쉬는 중'), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.time+=61;const a=T.decide();T.startRecall(a.mode);for(let k=0;k<4;k++)T.recallTick(.5);return [a.lbl,Math.floor(G.p.x)===__T.SB.x,Math.floor(G.p.y)===__T.SB.y+2,G.backPt]}""")
            rec('귀환석','집 근처에서 다시 쓰면 "표지로 돌아가기" → 떠난 자리로 (표지는 사라짐)', r[0]=='표지로 돌아가기' and r[1] is True and r[2] is True and r[3] is None, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.time+=61;const a=T.decide();T.startRecall(a.mode);T.recallTick(.3);G.p.x+=1;T.recallTick(.3);const c=[G.recall,document.body.innerText.includes('귀환을 멈췄어요')];G.p.x=__T.CX+.5;G.p.y=__T.CY+2;G.backPt=null;G.recallCd=0;const n=T.decide();return [c,n.k,n.lbl]}""")
            rec('귀환석','움직이면 멈춤', r[0][0] is None and r[0][1] is True, str(r))
            rec('귀환석','집 근처인데 표지가 없으면 귀환하지 않음 (할 일이 없으면 안내, v65: 앞에 다른 할 일이 있으면 그걸 추천)', r[1]!='recall' and (r[1]!='info' or r[2]=='집 근처'), str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=__T.CX+6,y=__T.CY+6;for(let yy=y-1;yy<=y+2;yy++)for(let xx=x-1;xx<=x+2;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i)}G.objs.set(T.idx(x,y),{t:'bed'});G.spawnPt={x,y};const h=T.homePt();G.spawnPt=null;G.objs.delete(T.idx(x,y));return [Math.floor(h.x)===x||Math.floor(h.x)===x+1,Math.abs(h.y-y)<3]}""")
            rec('귀환석','침대가 있으면 침대로', r==[True,True], str(r))
            # faint drop
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=6;for(let k=0;k<G.inv.length;k++)G.inv[k]=null;G.inv[0]={id:'pickCopper',c:1};G.inv[1]={id:'berry',c:8};G.inv[12]={id:'wood',c:40};G.inv[13]={id:'stone',c:9};G.inv[14]={id:'gel',c:3};G.inv[15]={id:'lightSeed',c:1};
          const dx=__T.CX+10,dy=__T.CY;for(let yy=dy-2;yy<=dy+2;yy++)for(let xx=dx-2;xx<=dx+2;xx++){const i=T.idx(xx,yy);G.wall[i]=0;G.objs.delete(i);G.floor[i]=2}G.p.x=dx+.5;G.p.y=dy+.5;G.p.dead=0.01;T.respawn();
          let bag=null,at=-1;for(const [i,o] of G.objs)if(o.t==='lostBag'){bag=o;at=i}const inv=G.inv.filter(Boolean).map(s=>s.id+':'+s.c).join(',');window.__bag=at;return [bag&&bag.items.map(s=>s.id+':'+s.c).join(','),at>=0&&Math.hypot(at%200-dx,((at/200)|0)-dy)<=2,inv]}""")
            rec('쓰러짐','재료는 4분의 1을 쓰러진 자리 꾸러미로 (도구·음식·빛씨앗은 그대로)', r[0]=='wood:10,stone:2' and r[1] is True and r[2]=='pickCopper:1,berry:8,wood:30,stone:7,gel:3,lightSeed:1', str(r))
            await pg.wait_for_timeout(1500)
            r=await ev(pg,"()=>document.body.innerText.includes('재료 12개를 떨어뜨렸어요')")
            rec('쓰러짐','깨어나면 떨어뜨린 개수와 지도 안내', r is True, r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const at=window.__bag;const x=at%200,y=(at/200)|0;G.p.x=x+.5;G.p.y=y-0.5;G.p.face={x:0,y:1};const a=T.decide();T.pickLost({x,y},G.objs.get(at));return [a.k,a.lbl,!!G.objs.get(at),G.inv.filter(Boolean).find(s=>s.id==='wood').c]}""")
            rec('쓰러짐','꾸러미를 바라보고 누르면 모두 되찾음', r[0]=='lost' and r[1]=='되찾기' and r[2] is False and r[3]==40, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=3;G.inv[12]={id:'wood',c:40};const n0=[...G.objs.values()].filter(o=>o.t==='lostBag').length;G.p.x=__T.CX+10.5;G.p.y=__T.CY+.5;G.p.dead=.01;T.respawn();const n1=[...G.objs.values()].filter(o=>o.t==='lostBag').length;return [n0,n1,G.inv[12].c]}""")
            rec('쓰러짐','이야기 초반(구리 곡괭이 전)에는 잃지 않음', r==[0,0,40], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.guide=6;for(let k=0;k<7;k++){for(let j=0;j<G.inv.length;j++)G.inv[j]=null;G.inv[12]={id:'wood',c:40};G.p.x=__T.CX+12.5+k*2;G.p.y=__T.CY+.5;const i=T.idx(Math.floor(G.p.x),Math.floor(G.p.y));G.wall[i]=0;G.objs.delete(i);G.floor[i]=2;G.p.dead=.01;T.respawn()}const bags=[...G.objs.values()].filter(o=>o.t==='lostBag');return [bags.length,bags.reduce((a,o)=>a+o.items.reduce((b,s)=>b+s.c,0),0)]}""")
            rec('쓰러짐','꾸러미는 최대 5개, 넘치면 가장 오래된 것을 새 꾸러미에 합침 (재료는 사라지지 않음)', r==[5,70], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.backPt={x:50.5,y:60.5};G.recallCd=G.time+30;const sv=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(sv);const G2=T.G;return [[...G2.objs.values()].filter(o=>o.t==='lostBag').length,G2.backPt&&G2.backPt.x,Math.round(G2.recallCd-G2.time)]}""")
            rec('세이브','꾸러미·귀환 표지·귀환석 쉬는 시간이 저장·불러오기 뒤에도 그대로', r==[5,50.5,30], str(r))
            r=await ev(pg,"()=>{const T=__T;T.openPanel('map');const t=document.querySelector('#sheet').innerText;T.closePanel();return [t.includes('잃어버린 꾸러미'),t.includes('귀환 표지')]}")
            rec('지도','지도에 잃어버린 꾸러미와 귀환 표지 표시', r==[True,True], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;let at=-1;for(const [i,o] of G.objs)if(o.t==='lostBag'){at=i;break}G.p.x=at%200+.5;G.p.y=((at/200)|0)-0.6;G.enemies.length=0}")
            await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'bag.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_two_players():
    import asyncio, sys
    # 구조 변경 8단계: 한 세계에 플레이어 여럿 (멀티플레이 준비) — 둘째 플레이어를 넣어 각자 따로인지, 세계가 가까운 플레이어를 보는지
    H2=HOOK.replace("computeLight}","computeLight,addPlayer,withPlayer,playerList,runCmd,updateEnemies,updateDrops,spawnDrop,hurtPlayer}")
    CLEAR="()=>{const T=__T,G=T.G;for(let y=95;y<125;y++)for(let x=92;x<125;x++){const i=T.idx(x,y);G.wall[i]=0;G.objs.delete(i);G.floor[i]=1}G.enemies.length=0;G.drops.length=0;G.p.x=100.5;G.p.y=110.5;G.p.hp=100;G.p.dead=0;G.p.inv=0}"
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,CLEAR)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const q=T.addPlayer('p2',115.5,110.5);q.inv[0]={id:'wood',c:5};
              return [T.playerList().length,G.inv.some(s=>s&&s.id==='wood'&&s.c===5),T.withPlayer(q,()=>G.inv[0]&&G.inv[0].id),G.p===G.players.me.p]}""")
            rec('플레이어 여럿','둘째 플레이어를 넣으면 가방이 따로 (G.inv는 지금 플레이어 것)', r==[2,False,'wood',True], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G,q=G.players.p2,s0=G.sel;T.runCmd({k:'hot',i:2,who:'p2'});return [q.sel,G.sel===s0,G.p===G.players.me.p]}")
            rec('플레이어 여럿','명령은 보낸 플레이어에게 (단축칸 고르기), 끝나면 다시 내 플레이어', r==[2,True,True], str(r))
            x0=await ev(pg,"()=>{const G=__T.G,q=G.players.p2;q.p.ctl={mx:1,my:0,stick:null,act:false,atk:false,aim:null};return [G.p.x,q.p.x]}")
            await wait_game(pg,.5)
            r=await ev(pg,"()=>{const G=__T.G,q=G.players.p2;q.p.ctl=null;return [G.p.x,q.p.x]}")
            rec('플레이어 여럿','각자 움직임 (둘째의 조작 의도로 둘째만 걸어감)', abs(r[0]-x0[0])<0.05 and r[1]-x0[1]>1, str([x0,r]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,q=G.players.p2;q.p.x=115.5;q.p.y=110.5;G.p.x=100.5;G.p.y=110.5;G.enemies.length=0;
              const mk=x=>({k:'slimeG',x,y:110.5,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,airMax:.42,land:0,cd:99,anim:0});const a=mk(112.5),b=mk(103.5);G.enemies.push(a,b);T.updateEnemies(.01);
              const out=[a.vx>0,b.vx<0];G.enemies.length=0;return out}""")
            rec('플레이어 여럿','몬스터는 가장 가까운 플레이어를 쫓아요', r==[True,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,q=G.players.p2,n=()=>G.inv.reduce((a,s)=>a+(s&&s.id==='copperOre'?s.c:0),0);for(let k=0;k<G.inv.length;k++)if(G.inv[k]&&G.inv[k].id==='copperOre')G.inv[k]=null;
              G.drops.length=0;T.spawnDrop('copperOre',3,q.p.x,q.p.y-.3);for(const d of G.drops){d.t=1;d.z=0;d.vz=0;d.vx=d.vy=0;d.hold=0}for(let k=0;k<6;k++)T.updateDrops(.02);
              return [n(),T.withPlayer(q,n),G.drops.length]}""")
            rec('플레이어 여럿','떨어진 물건은 가까운 플레이어 가방으로', r==[0,3,0], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,q=G.players.p2;G.enemies.length=0;G.enemies.push({k:'slimeG',x:108.5,y:98.5,hp:999,vx:0,vy:0,t:99,hurt:0,kx:0,ky:0,z:0,air:0,airMax:.42,land:0,cd:99,anim:0});
              q.p.hp=1;q.p.inv=0;T.withPlayer(q,()=>T.hurtPlayer(50,q.p.x+1,q.p.y));return [q.p.dead>0,G.p.dead<=0,document.querySelector('#fade').hidden]}""")
            rec('플레이어 여럿','둘째가 쓰러져도 내 화면에는 기절 화면이 안 떠요', r==[True,True,True], str(r))
            ok=await wait_until(pg,"()=>__T.G.players.p2.p.dead<=0")
            r=await ev(pg,"()=>{const G=__T.G,q=G.players.p2;return [q.p.hp>0,G.enemies.length>0,Math.round(G.p.x*10)/10]}")
            rec('플레이어 여럿','둘째가 깨어나도 다른 플레이어가 있으면 세계(몬스터)는 그대로', ok and r[:2]==[True,True], str([ok,r]))
            r=await ev(pg,"()=>{const T=__T,G=T.G;const s=T.serialize();return [Math.abs(s.p.x-G.players.me.p.x)<1e-9,'players' in s,s.inv.some(x=>x&&x.id==='wood'&&x.c===5)]}")
            rec('플레이어 여럿','저장은 내 플레이어 기준 (둘째의 가방·위치는 안 섞임)', r==[True,False,False], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:4])
            await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_emergency_escape():
    import asyncio, sys
    # v57: 메뉴 「긴급 탈출」 — 울타리·벽에 갇혔을 때 막힌 곳 바깥의 가장 가까운 트인 곳으로 (등불나무 둘레 큰 마당도)
    H2=HOOK.replace("computeLight}","computeLight,regionOf,escapeSpot,emergencyEscape,homePt,boxHits,isSolid,newGame,genWorld,closedIn}")
    FENCE="""window.__fence=(R)=>{const T=__T,G=T.G;const x0=T.CX-R,x1=T.CX+R,y0=T.CY-R,y1=T.CY+R;for(let y=y0-6;y<=y1+6;y++)for(let x=x0-6;x<=x1+6;x++){const i=T.idx(x,y);if(G.objs.get(i)&&G.objs.get(i).t!=='treeP')G.objs.delete(i);G.wall[i]=0;if(G.floor[i]===T.WATER||G.floor[i]===5)G.floor[i]=1}
  for(let x=x0;x<=x1;x++){G.objs.set(T.idx(x,y0),{t:'bFenceWood'});G.objs.set(T.idx(x,y1),{t:'bFenceWood'})}for(let y=y0;y<=y1;y++){G.objs.set(T.idx(x0,y),{t:'bFenceWood'});G.objs.set(T.idx(x1,y),{t:'bFenceWood'})}G.enemies.length=0;return [x0,x1,y0,y1]};"""
    async def main():
        for lay in (1,2):
            mkpage(SRC,'qa.html',H2,layout=lay)
            async with async_playwright() as p:
                b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
                r=await ev(pg,"()=>{const T=__T,G=T.G,h=T.homePt();return [!!T.regionOf(G.p.x,G.p.y),!!T.regionOf(h.x,h.y)]}")
                rec(f'시작 지점 (지도 {lay})','새 게임 시작 자리와 집은 막힌 곳으로 보지 않음', r==[False,False], str(r))
                # v63: some worlds start in a clearing ringed by natural rock — a pickaxe digs out, so that is not "stuck"
                seeds=[150461,158380,261327,523057148,426376833] if lay==1 else [63352,134623,115292]
                r=await ev(pg,"(S)=>{const T=__T,keep=T.G.seed;const out=S.map(s=>{T.newGame(s);const G=T.G,h=T.homePt();return [!!T.regionOf(G.p.x,G.p.y),!!T.regionOf(h.x,h.y),!!T.closedIn(h.x,h.y)]});T.newGame(keep);return out}",seeds)
                rec(f'긴급 탈출 (지도 {lay})','바위로 둘러싸인 곳에서 시작하는 세계도 갇힌 곳으로 보지 않음 (긴급 탈출·기절·귀환 모두)', all(x==[False,False,False] for x in r), str(r))
                if lay==2: await ctx.close(); await b.close(); continue
                # not stuck: goes home
                r=await ev(pg,"()=>{const T=__T,G=T.G,h=T.homePt();G.p.x+=6;const ok=T.emergencyEscape();return [ok,Math.round((G.p.x-h.x)*10)/10,Math.round((G.p.y-h.y)*10)/10]}")
                rec('긴급 탈출','갇히지 않았으면 집(등불나무 앞)으로', r==[True,0,0], str(r))
                r=await ev(pg,"()=>{const T=__T,G=T.G;const x=G.p.x;const ok=T.emergencyEscape();return [ok,G.p.x===x]}")
                rec('긴급 탈출','30초에 한 번만', r==[False,True], str(r))
                # a fenced yard bigger than 16 tiles around the lantern tree (the friend's case): home is the trap
                r=await ev(pg,"()=>{"+FENCE+"""const T=__T,G=T.G;G.escCd=0;const [x0,x1,y0,y1]=__fence(22);G.p.x=T.CX+3.5;G.p.y=T.CY+5.6;
              const inside=!!T.regionOf(G.p.x,G.p.y);const ok=T.emergencyEscape();const out=G.p.x<x0||G.p.x>x1+1||G.p.y<y0||G.p.y>y1+1;
              return [inside,ok,out,!T.regionOf(G.p.x,G.p.y),!T.boxHits(G.p.x,G.p.y,.28)]}""")
                rec('긴급 탈출','등불나무 둘레 큰 울타리(반경 22칸) 안에 갇히면 울타리 바깥 트인 곳으로', r==[True,True,True,True,True], str(r))
                # standing outside the fence but home is fenced: escape doesn't send you back in
                r=await ev(pg,"""()=>{const T=__T,G=T.G;G.escCd=0;G.p.x=T.CX+40.5;G.p.y=T.CY+.6;for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){const i=T.idx(T.CX+40+x,T.CY+y);G.wall[i]=0;G.objs.delete(i)}
              const ok=T.emergencyEscape();return [ok,!T.regionOf(G.p.x,G.p.y),Math.abs(G.p.x-T.CX)>21||Math.abs(G.p.y-T.CY)>21]}""")
                rec('긴급 탈출','집이 막혀 있으면 집 안이 아니라 그 바깥으로', r==[True,True,True], str(r))
                # a small walled pocket far from home: the nearest open spot, close by
                r=await ev(pg,"""()=>{const T=__T,G=T.G;G.escCd=0;const cx=T.CX+30,cy=T.CY-30;for(let y=cy-8;y<=cy+8;y++)for(let x=cx-8;x<=cx+8;x++){const i=T.idx(x,y);G.objs.delete(i);G.wall[i]=(Math.abs(x-cx)<=2&&Math.abs(y-cy)<=2)?0:(Math.abs(x-cx)<=3&&Math.abs(y-cy)<=3?7:0);if(G.floor[i]===T.WATER)G.floor[i]=1}
              G.p.x=cx+.5;G.p.y=cy+.6;const inside=!!T.regionOf(G.p.x,G.p.y);const ok=T.emergencyEscape();return [inside,ok,Math.hypot(G.p.x-cx,G.p.y-cy)<9,!T.regionOf(G.p.x,G.p.y)]}""")
                rec('긴급 탈출','벽으로 막힌 작은 공간에서는 바로 옆 트인 곳으로', r==[True,True,True,True], str(r))
                # v63: what closes you in — walls built on open ground (even dirt) yes; a pocket dug into natural rock no
                r=await ev(pg,"""()=>{const T=__T,G=T.G,nat=T.genWorld(G.seed).wall;G.escCd=0;
              const cx=T.CX-4,cy=T.CY-4;for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){const i=T.idx(x,y);G.objs.delete(i);G.wall[i]=(x===cx&&y===cy)?0:1;if(G.floor[i]===T.WATER)G.floor[i]=1}
              const built=[nat[T.idx(cx-1,cy)],!!T.regionOf(cx+.5,cy+.6),!!T.closedIn(cx+.5,cy+.6)];
              for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)G.wall[T.idx(x,y)]=0;
              let dug=null;for(let y=T.CY+12;y<T.CY+80&&!dug;y++)for(let x=T.CX-80;x<T.CX+80&&!dug;x++){let ok=true;for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-2;dx<=2;dx++){const i=T.idx(x+dx,y+dy),w=nat[i];if(!w||w===8||G.wall[i]!==w||G.objs.get(i)){ok=false;break}}if(ok)dug=[x,y]}
              if(!dug)return [built,'no rock'];const [x,y]=dug;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)G.wall[T.idx(x+dx,y+dy)]=0;
              const r=[built,!!T.regionOf(x+.5,y+.6),!!T.closedIn(x+.5,y+.6)];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const i=T.idx(x+dx,y+dy);G.wall[i]=nat[i]}return r}""")
                rec('긴급 탈출','빈 땅에 쌓은 흙벽은 갇힘 · 자연 바위를 파 들어간 곳은 갇힘 아님', r==[[0,True,True],False,False], str(r))
                # the menu button asks once more before moving
                await ev(pg,"()=>{const T=__T,G=T.G;G.escCd=0;G.p.x=T.CX+3.5;G.p.y=T.CY+5.6;T.openPanel('menu')}"); await pg.wait_for_timeout(700)
                b1=await pg.locator("[data-a=escape]").inner_text(); await pg.click('#sheet [data-a=escape]'); await pg.wait_for_timeout(300)
                b2=await pg.locator("[data-a=escape]").inner_text(); await pg.click('#sheet [data-a=escape]'); await pg.wait_for_timeout(500)
                r=await ev(pg,"()=>{const T=__T,G=T.G;return [document.getElementById('sheetWrap').hidden,G.p.x<T.CX-22||G.p.x>T.CX+23||G.p.y<T.CY-22||G.p.y>T.CY+23]}")
                rec('메뉴','메뉴 「긴급 탈출」은 한 번 더 눌러야 옮겨짐', b1=='긴급 탈출' and '한 번 더' in b2 and r==[True,True], f'{b1}|{b2}|{r}')
                await pg.screenshot(path=SP+'emergency_escape.png')
                rec('기능','콘솔 오류 없음', not errs, errs[:4])
                await ctx.close(); await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_fenced_home():
    import asyncio, sys
    # 버그 수정: 등불나무·침대 둘레를 울타리로 막아 두면 기절·귀환 뒤 갇히던 문제
    H2=HOOK.replace("computeLight}","computeLight,respawn,closedIn,boxHits}")
    FENCE="""window.__fence=(door)=>{const T=__T,G=T.G;const x0=T.CX-5,x1=T.CX+5,y0=T.CY-3,y1=T.CY+6;for(let y=T.CY-10;y<=T.CY+24;y++)for(let x=T.CX-24;x<=T.CX+24;x++){const i=T.idx(x,y);if(G.objs.get(i)&&G.objs.get(i).t!=='treeP')G.objs.delete(i);G.wall[i]=0;if(G.floor[i]===T.WATER)G.floor[i]=1}
  for(let x=x0;x<=x1;x++){G.objs.set(T.idx(x,y0),{t:'bFenceWood'});G.objs.set(T.idx(x,y1),{t:'bFenceWood'})}for(let y=y0;y<=y1;y++){G.objs.set(T.idx(x0,y),{t:'bFenceWood'});G.objs.set(T.idx(x1,y),{t:'bFenceWood'})}
  for(let y=T.CY+2;y<=T.CY+5;y++)for(let x=x0+1;x<x1;x++)G.objs.set(T.idx(x,y),{t:'cushion'});if(door)G.objs.set(T.idx(T.CX,y1),{t:'bDoorWood'});return [x0,x1,y0,y1]};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+FENCE+"}")
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,x1,y0,y1]=__fence(false);G.spawnPt=null;G.p.dead=1;T.respawn();const p=G.p;const out=p.x<x0||p.x>x1+1||p.y<y0||p.y>y1+1;return [out,T.boxHits(p.x,p.y,.28),!T.closedIn(p.x,p.y),Math.round(Math.hypot(p.x-T.CX,p.y-T.CY))]}""")
            rec('갇힘','울타리로 막힌 등불나무 앞에서 깨어나면 바로 바깥 빈 곳으로', r[0] and r[1] is False and r[2] and r[3]<=12, str(r))
            await pg.wait_for_timeout(1100)
            r=await ev(pg,"()=>document.querySelector('#toasts').innerText.includes('바로 바깥에서 깨어났어요')")
            rec('갇힘','바깥에서 깨어났다는 알림', r, r)
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__fence(true);G.p.dead=1;T.respawn();return [Math.abs(G.p.x-(T.CX+.5))<.01,Math.abs(G.p.y-(T.CY+1.7))<.01]}""")
            rec('갇힘','문이 달린 울타리 안은 그대로 등불나무 앞에서 깨어남', r==[True,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x0,x1,y0,y1]=__fence(false);G.p.x=T.CX+.5;G.p.y=T.CY+1.7;const c0=T.closedIn(G.p.x,G.p.y);const s=JSON.parse(JSON.stringify(T.serialize()));T.deserialize(s);const p=T.G.p;return [p.x<x0||p.x>x1+1||p.y<y0||p.y>y1+1,c0&&c0.size,p.x,p.y,s.p.x,s.p.y]}""")
            rec('갇힘','이미 갇힌 채 저장된 세이브도 불러오면 바깥으로', r[0]==True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let y=T.CY-8;y<=T.CY+8;y++)for(let x=T.CX-8;x<=T.CX+8;x++){const o=G.objs.get(T.idx(x,y));if(o&&/^bFence|^bDoor|^cushion/.test(o.t))G.objs.delete(T.idx(x,y))}G.p.x=T.CX+.5;G.p.y=T.CY+1.7;G.p.dead=1;T.respawn();return [Math.abs(G.p.x-(T.CX+.5))<.01,Math.abs(G.p.y-(T.CY+1.7))<.01]}""")
            rec('갇힘','막혀 있지 않으면 원래대로 등불나무 앞', r==[True,True], str(r))
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_pets():
    import asyncio, sys
    # 펫 (v45): 야생 동물, 올가미 밧줄 포획 미니게임, 강아지·고양이·토끼, 펫 버프
    H2=HOOK.replace("computeLight}","computeLight,RECIPES,ANIMALS,wildTick,wildNear,openCatch,catchAng,get panel(){return panel},updateDrops,rollDrops,luckTier,spawnDrop,perform,QSIDE,animalImg,rarOf}")
    CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+22;y++)for(let x=T.CX+2;x<T.CX+22;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.biome[i]=0}
  G.enemies.length=0;G.drops.length=0;G.wild=[];G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.fish=null;G.inv.fill(null);G.sel=0;return [T.CX+8,T.CY+8]};
  window.__wild=(k,dx,dy)=>{const G=__T.G,w={k,x:G.p.x+dx,y:G.p.y+dy,vx:0,vy:0,t:99,flip:false,anim:0};G.wild.push(w);return w};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+CLEAR+"}")
            r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(r=>r.out==='lasso'),A=T.ANIMALS;return [rc&&rc.at,rc&&rc.cat,Object.keys(A).filter(k=>A[k].pet).map(k=>k+':'+A[k].biome).join(','),!!T.animalImg('dog'),!!T.animalImg('cat'),!!T.animalImg('rabbit'),T.QSIDE.some(q=>q.id==='s_pet')]}")
            rec('펫','올가미 밧줄(작업대·도구), 강아지(이끼)·토끼(버섯숲)·고양이(수정 동굴), 도전 퀘스트', r==['smelter','tool','dog:0,rabbit:1,cat:2',True,True,True,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.pets={};let n=0;for(let k=0;k<300&&!G.wild.length;k++){T.wildTick(6.1);n++}const w=G.wild[0];return [w&&w.k,G.wild.length,w?Math.round(Math.hypot(w.x-G.p.x,w.y-G.p.y)):0]}""")
            rec('야생','이끼 동굴에서 강아지(v46부터 소·닭도)가 7~13칸 떨어진 곳에 나타남', r[0] in ('dog','cow','chicken') and r[1]==1 and 5<=r[2]<=14, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.pets={dog:1};let dog=0,n=0;for(let k=0;k<200;k++){T.wildTick(6.1);if(G.wild.some(w=>w.k==='dog'))dog++;n+=G.wild.length;G.wild=[]}return [dog,n>0]}""")
            rec('야생','이미 데려온 펫 종류는 다시 나타나지 않음 (목장 동물은 계속)', r==[0,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.pets={};const w=__wild('dog',1.5,0);const a=T.decide();G.inv[0]={id:'lasso',c:1};G.sel=0;w.x=G.p.x+2.4;const b2=T.decide();return [a.k,a.msg&&a.msg.includes('올가미'),b2.k,b2.lbl]}""")
            rec('포획','올가미 없이 다가가면 안내, 올가미를 들면 [포획]', r==['info',True,'lasso','포획'], str(r))
            await ev(pg,"()=>{const T=__T;T.perform(T.decide())}"); await pg.wait_for_timeout(650)
            r=await ev(pg,"()=>{const P=__T.panel;return [P&&P.kind,!!document.querySelector('#catchCv'),document.querySelector('#sheet').innerText.includes('던지기')]}")
            rec('포획','포획 미니게임 창 (돌아가는 밧줄·던지기 버튼)', r==['catch',True,True], str(r))
            await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'catch.png')
            # 밧줄 각도는 실제 시간을 따라 돌아요. 구간 맞추기와 던지기 버튼 누르기를 한 번에 해야 바쁠 때도 구간 안에서 던져요
            for k in range(3):
                await ev(pg,"()=>{const P=__T.panel;P.za=__T.catchAng(P);P.zw=1.2;document.querySelector('#sheet [data-a=catchThrow]').click()}"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const G=__T.G;return [!!__T.panel,JSON.stringify(G.pets),G.petOn,G.wild.length,document.querySelector('#toasts').innerText.includes('친구가 됐어요'),!!G.petE]}")
            rec('포획','초록 구간에서 세 번 던지면 친구가 되고 바로 따라다님', r==[False,'{"dog":1}','dog',0,True,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const w=__wild('rabbit',2,0);T.openCatch(w);return 1}"""); await pg.wait_for_timeout(650)
            for k in range(2):
                await ev(pg,"()=>{const P=__T.panel;P.za=__T.catchAng(P)+3.1;P.zw=.4;document.querySelector('#sheet [data-a=catchThrow]').click()}"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const G=__T.G;return [!!__T.panel,!!G.pets.rabbit,G.wild.length,document.querySelector('#toasts').innerText.includes('도망')]}")
            rec('포획','두 번 놓치면 도망감', r==[False,False,0,True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const w=__wild('cat',2,0);T.openCatch(w);return 1}"""); await pg.wait_for_timeout(650)
            await ev(pg,"()=>{const P=__T.panel;P.za=__T.catchAng(P)+3.1;P.zw=.4}"); await pg.keyboard.press('Space'); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>[__T.panel&&__T.panel.miss]")
            await ev(pg,"()=>{__T.closePanel();__T.G.wild=[]}")
            rec('포획','스페이스로도 던짐 (PC)', r==[1], str(r))
            # follow
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.petE.x=G.p.x;G.petE.y=G.p.y;G.p.x+=5;for(let k=0;k<120;k++)T.wildTick(1/60);const d=Math.hypot(G.petE.x-G.p.x,G.petE.y-G.p.y);G.p.x+=30;T.wildTick(1/60);const d2=Math.hypot(G.petE.x-G.p.x,G.petE.y-G.p.y);G.p.x-=30;G.petE.x=G.p.x-.6;G.petE.y=G.p.y+.2;return [+d.toFixed(1),d2<1.5]}""")
            rec('펫','펫이 뒤를 따라오고, 너무 멀어지면 곁으로 옴', r[0]<1.6 and r[1], str(r))
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.inv.fill(null);G.petE.x=G.p.x+.8;G.petE.y=G.p.y;const d=T.decide();T.perform(d);return [d.k,d.lbl,document.querySelector('#toasts').innerText.includes('좋아해요')]}")
            rec('펫','펫 앞에서 [쓰다듬기]', r==['petpet','쓰다듬기',True], str(r))
            # buffs
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const run=()=>{G.drops.length=0;T.spawnDrop('stone',1,G.p.x+3,G.p.y);const d=G.drops[0];d.t=1;d.vx=d.vy=0;d.vz=0;d.z=0;const x0=d.x;for(let k=0;k<6;k++)T.updateDrops(1/60);return Math.abs(d.x-x0)>.01};
          G.petOn='dog';const a=run();G.petOn=null;const b2=run();G.drops.length=0;G.petOn='dog';return [a,b2]}""")
            rec('버프','강아지: 3칸 떨어진 물건도 끌어옴 (없으면 2.2칸까지)', r==[True,False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.pets.cat=1;G.pets.rabbit=1;G.petOn='cat';const l1=T.luckTier();G.petOn='dog';const l0=T.luckTier();
          const mr=Math.random;Math.random=()=>.45;G.drops.length=0;G.petOn='rabbit';T.rollDrops([['cryGem',1,1,.4],['stone',1,1,.4]],G.p.x,G.p.y);const rb=G.drops.map(d=>d.id).join(',');G.drops.length=0;G.petOn='dog';T.rollDrops([['cryGem',1,1,.4]],G.p.x,G.p.y);const nb=G.drops.length;Math.random=mr;G.drops.length=0;return [l1,l0,rb,nb]}""")
            rec('버프','고양이: 낚시 운 1단계 / 토끼: 희귀 이상 재료 확률 1.25배 (흔한 재료는 그대로)', r==[1,0,'cryGem',0], str(r))
            # equipment menu pet section
            await ev(pg,"()=>{__T.G.petOn='dog';__T.openPanel('equip')}"); await pg.wait_for_timeout(650)
            r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [t.includes('멍멍이 · 함께 다니는 중'),t.includes('야옹이'),t.includes('깡총이'),document.querySelectorAll('#sheet [data-a=petOn]').length]}")
            rec('장비 메뉴','펫 칸: 데려온 펫과 버프, 함께 다니는 펫 표시', r==[True,True,True,3], str(r))
            await pg.click('#sheet [data-a=petOn][data-i=cat]'); await pg.wait_for_timeout(250)
            r=await ev(pg,"()=>[__T.G.petOn,document.querySelector('#sheet').innerText.includes('야옹이 · 함께 다니는 중')]")
            await pg.click('#sheet [data-a=petOn][data-i=cat]'); await pg.wait_for_timeout(250)
            r2=await ev(pg,"()=>[__T.G.petOn,__T.G.petE]")
            rec('장비 메뉴','펫을 눌러 바꾸고, 한 번 더 누르면 쉬게 함', r==['cat',True] and r2==[None,None], str([r,r2]))
            await pg.screenshot(path=SP+'equip.png')
            await ev(pg,"()=>__T.closePanel()")
            # save
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.petOn='rabbit';T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const a=[JSON.stringify(T.G.pets),T.G.petOn];const s=JSON.parse(JSON.stringify(T.serialize()));delete s.pets;delete s.petOn;T.deserialize(s);return a.concat([JSON.stringify(T.G.pets),T.G.petOn])}""")
            rec('저장','펫 저장/불러오기, 옛 세이브는 펫 없이 시작', r==['{"dog":1,"cat":1,"rabbit":1}','rabbit','{}',None], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;__clear();G.pets={dog:1};G.petOn='dog';G.petE={x:G.p.x-.8,y:G.p.y+.2,flip:false,anim:0,moving:false};__wild('rabbit',2,0.5);__wild('cat',-2.5,-1)}")
            await pg.wait_for_timeout(500); await pg.screenshot(path=SP+'world.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main


def test_ranch():
    import asyncio, sys
    # 목장 (v46): 소·닭·양 포획, 내려놓으면 우유·달걀·양모, 새 요리·털모자·양털 러그
    H2=HOOK.replace("computeLight}","computeLight,circuitTick,W,RECIPES,ANIMALS,wildTick,openCatch,catchAng,get panel(){return panel},perform,QSIDE,hatMul,upgText,SPR}")
    CLEAR="""window.__clear=(b)=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+22;y++)for(let x=T.CX+2;x<T.CX+22;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.biome[i]=b||0}
  G.enemies.length=0;G.drops.length=0;G.wild=[];G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.fish=null;G.inv.fill(null);G.sel=0;return [T.CX+8,T.CY+8]};
  window.__wild=(k,dx,dy)=>{const G=__T.G,w={k,x:G.p.x+dx,y:G.p.y+dy,vx:0,vy:0,t:99,flip:false,anim:0};G.wild.push(w);return w};"""
    async def main():
        mkpage(SRC,'qa.html',H2)
        async with async_playwright() as p:
            b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
            await ev(pg,"()=>{"+CLEAR+"}")
            r=await ev(pg,"""()=>{const T=__T,A=T.ANIMALS,I=T.ITEMS,f=id=>{const r=T.RECIPES.find(q=>q.out===id);return r&&r.at};return [['cow','chicken','sheep'].map(k=>k+':'+A[k].biome+':'+A[k].ranch+':'+I[k].kind).join(','),['friedEgg','pancake','woolHat','woolRug'].map(f).join(','),I.milk.kind,I.woolHat.slot,!!T.SPR.obj.cow&&!!T.SPR.obj.sheep&&!!T.SPR.obj.chicken]}""")
            rec('목장','소·닭(이끼 동굴)·양(버섯숲), 우유·달걀·양모, 달걀 프라이·팬케이크(요리솥, v58)·털모자·양털 러그(작업대)', r==['cow:0:milk:place,chicken:0:egg:place,sheep:1:wool:place','pot,pot,smelter,bench','food','head',True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear(1);const seen=new Set();for(let k=0;k<300;k++){T.wildTick(6.1);for(const w of G.wild)seen.add(w.k);G.wild=[]}return [...seen].sort().join(',')}""")
            rec('야생','버섯숲에 양과 토끼가 나타남', r=='rabbit,sheep', r)
            # catch a cow
            await ev(pg,"()=>{const T=__T,G=T.G;__clear(0);const w=__wild('cow',2,0);T.openCatch(w)}"); await pg.wait_for_timeout(650)
            # 밧줄 각도는 실제 시간을 따라 돌아요. 구간 맞추기와 던지기 버튼 누르기를 한 번에 해야 바쁠 때도 구간 안에서 던져요
            for k in range(3):
                await ev(pg,"()=>{const P=__T.panel;P.za=__T.catchAng(P);P.zw=1.2;document.querySelector('#sheet [data-a=catchThrow]').click()}"); await pg.wait_for_timeout(300)
            r=await ev(pg,"()=>{const G=__T.G;return [!!__T.panel,__T.countItem('cow'),JSON.stringify(G.pets||{}),G.petOn||null,JSON.stringify(G.stats.ranchK),document.querySelector('#toasts').innerText.includes('데려왔어요')]}")
            rec('포획','소를 포획하면 펫이 아니라 「소」 아이템으로', r==[False,1,'{}',None,'{"cow":1}',True], str(r))
            # place it
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.sel=G.inv.findIndex(s=>s&&s.id==='cow');if(G.sel>=9){G.inv[0]=G.inv[G.sel];G.inv[G.sel]=null;G.sel=0}const d=T.decide();return [d.k,d.lbl]}")
            await tap(pg,1); await pg.wait_for_timeout(200)
            r2=await ev(pg,"()=>{const T=__T,G=T.G,o=G.objs.get(T.idx(T.CX+9,T.CY+8));return [o&&o.t,o&&Math.round(o.p-G.time),T.countItem('cow')]}")
            rec('목장','소를 내려놓으면 5분 뒤 우유', r==['place','놓기'] and r2[0]=='cow' and 297<=r2[1]<=300 and r2[2]==0, str([r,r2]))
            r=await ev(pg,"()=>{const T=__T,G=T.G;G.sel=1;const d=T.decide();return [d.k,d.msg,(G.alts||[]).some(a=>a.k==='pickup')]}")
            rec('목장','아직이면 남은 시간 안내 (+ 작은 버튼 [회수], v65)', r[0]=='info' and '5분쯤 뒤에 우유를' in r[1] and r[2] is True, str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G,o=G.objs.get(T.idx(T.CX+9,T.CY+8));o.p=G.time-1;const d=T.decide();T.perform(d);return [d.k,d.lbl,T.countItem('milk'),Math.round(o.p-G.time),T.decide().k]}""")
            rec('목장','다 되면 [우유 짜기] → 우유 1개, 다시 5분', r==['ranch','우유 짜기',1,300,'info'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const out=[];for(const k of ['chicken','sheep']){const i=T.idx(T.CX+9,T.CY+8);G.objs.set(i,{t:k,p:G.time-1});const d=T.decide();T.perform(d);out.push(d.lbl+':'+T.countItem(T.ANIMALS[k].ranch))}G.objs.set(T.idx(T.CX+9,T.CY+8),{t:'cow',p:G.time-1});return out}""")
            rec('목장','닭 [달걀 줍기] → 달걀, 양 [털 깎기] → 양모', r==['달걀 줍기:1','털 깎기:1'], str(r))
            await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'ranch.png')
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.stats.ranchK={cow:1,chicken:1};const q=T.QSIDE.find(x=>x.id==='s_ranch');const a=q.done();G.stats.ranchK.sheep=1;return [a,q.done(),typeof q.t==='function'?q.t():q.t]}""")
            rec('도전','「목장 동물 세 종류 데려오기」', r[0] is False and r[1] is True and '3/3' in r[2], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const a=T.hatMul();G.equip.head={id:'woolHat',c:1};const b2=T.hatMul();G.equip.head.lv=2;const c=+T.hatMul().toFixed(2);G.equip.head=null;return [a,b2,c,T.upgText('woolHat',2)]}""")
            rec('털모자','털모자: 추위 게이지 85% 속도 (+2: 79%)', r==[1,0.85,0.79,'추위 게이지 79% 속도'], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;const i=T.idx(T.CX+9,T.CY+8),o=G.objs.get(i);o.p=G.time+123;T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const o2=T.G.objs.get(i);return [o2.t,Math.round(o2.p-T.G.time)]}""")
            rec('저장','목장 동물과 남은 시간 저장/불러오기', r==['cow',123], str(r))
            # ---- stone pit (돌 채굴장) ----
            r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(r=>r.out==='quarry');return [rc&&rc.at,rc&&rc.cat,rc&&rc.req.map(x=>x[0]).join(','),T.ITEMS.quarry.n,JSON.stringify(T.OBJ.quarry.sz),!!T.SPR.obj.quarry3,T.RECIPES.some(r=>r.out==='drillStone')]}")
            rec('돌 채굴장','작업대·채굴장 탭에서 돌·나무·끈으로 만드는 2×2 돌 채굴장 (벽 앞 돌 채굴기는 제작법 없음)', r==['bench','mine','stone,wood,rope','돌 채굴장','[2,2]',True,False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear(0);G.inv[0]={id:'quarry',c:1};G.sel=0;G.p.face={x:1,y:0};const d=T.decide();return [d.k,d.lbl]}""")
            await tap(pg,1); await pg.wait_for_timeout(200)
            r2=await ev(pg,"""()=>{const T=__T,G=T.G;let ai=-1;for(const [i,o] of G.objs)if(o.t==='quarry')ai=i;const o=G.objs.get(ai);G.inv.fill(null);G.sel=1;const t={x:ai%T.W,y:Math.floor(ai/T.W)};
          const a=T.decide();o.p=G.time-999;const b2=T.decide();T.perform(b2);const got=G.drops.filter(d=>d.id).map(d=>d.id);const n=G.drops.reduce((s,d)=>s+d.c,0);G.drops.length=0;return [!!o,a.lbl,b2.lbl,[...new Set(got)].join(','),n>=5&&n<=7,Math.round(G.time-o.p)]}""")
            rec('돌 채굴장','내려놓고, 바위가 차오르면 [캐기] → 돌만 5~7개, 다시 차오름', r[0]=='place' and r2[0] and r2[1]=='살펴보기' and r2[2]=='캐기' and r2[3]=='stone' and r2[4] and r2[5]<=1, str([r,r2]))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;let ai=-1;for(const [i,o] of G.objs)if(o.t==='quarry')ai=i;const o=G.objs.get(ai),x=ai%T.W,y=Math.floor(ai/T.W);const ch={t:'chest',items:Array(18).fill(null)};G.objs.set(T.idx(x+2,y),ch);
          G.wire.set(T.idx(x-1,y),1);G.objs.set(T.idx(x-1,y+1),{t:'battery',e:6000});o.p=G.time-999;T.circuitTick(.2);return [ch.items.filter(Boolean).map(s=>s.id+':'+(s.c>=5)).join(','),G.stats.quarried>0]}""")
            rec('돌 채굴장','전기를 이으면 저절로 캐서 옆 상자에 돌을 담음', r==['stone:true',True], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(T.serialize()));s.inv[3]={id:'drillStone',c:2};T.deserialize(s);return [T.countItem('quarry'),T.countItem('drillStone'),T.OBJ.drillStone.item]}""")
            rec('옛 세이브','가방의 돌 채굴기는 돌 채굴장으로, 놓인 돌 채굴기를 회수해도 돌 채굴장', r==[2,0,'quarry'], str(r))
            # ---- ore pits replace the ore drills ----
            r=await ev(pg,"()=>{const T=__T;return ['pitCu','pitFe','pitGold'].map(id=>{const rc=T.RECIPES.find(r=>r.out===id);return [T.ITEMS[id].n,rc&&rc.at,rc&&rc.cat,T.OBJ[id].grow,!!T.SPR.obj[id+'3']]}).concat([['drillCu','drillFe','drillGold'].some(id=>T.RECIPES.some(r=>r.out===id))])}")
            rec('채굴장','구리·철·황금 채굴장 (작업대·채굴장 탭), 벽 앞 채굴기는 제작법 없음', r==[['구리 채굴장','bench','mine',120,True],['철 채굴장','bench','mine',150,True],['황금 채굴장','bench','mine',180,True],False], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.enemies.length=0;const out=[];const d0=G.stats.drilled||0;for(const [k,ore] of [['pitCu','copperOre'],['pitFe','ironOre'],['pitGold','goldOre']]){const x=T.CX+12,y=T.CY+8;G.objs.set(T.idx(x,y),{t:k,p:G.time-999});G.objs.set(T.idx(x+1,y),{t:'_part',a:T.idx(x,y)});G.objs.set(T.idx(x,y+1),{t:'_part',a:T.idx(x,y)});G.objs.set(T.idx(x+1,y+1),{t:'_part',a:T.idx(x,y)});
          G.p.x=x-.5;G.p.y=y+.5;G.p.face={x:1,y:0};G.sel=1;G.drops.length=0;const d=T.decide();T.perform(d);const ids=[...new Set(G.drops.map(q=>q.id))].join(',');const n=G.drops.reduce((a,q)=>a+q.c,0);G.drops.length=0;out.push([d.lbl,ids===ore,n]);for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)G.objs.delete(T.idx(x+dx,y+dy))}return out.concat([(G.stats.drilled||0)-d0>0])}""")
            rec('채굴장','다 차오르면 [캐기] → 그 광석 한 가지만 (구리·철 3~4, 금 2~3), 도전 퀘스트 집계', [x[:2] for x in r[:3]]==[['캐기',True]]*3 and 3<=r[0][2]<=4 and 3<=r[1][2]<=4 and 2<=r[2][2]<=3 and r[3], str(r))
            r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(T.serialize()));s.inv[3]={id:'drillCu',c:1};s.inv[4]={id:'drillFe',c:1};s.inv[5]={id:'drillGold',c:1};T.deserialize(s);return [T.countItem('pitCu'),T.countItem('pitFe'),T.countItem('pitGold'),T.OBJ.drillCu.item,T.OBJ.drillGold.item]}""")
            rec('옛 세이브','가방의 구리·철·황금 채굴기는 채굴장으로, 놓인 채굴기는 그대로 돌고 회수하면 채굴장', r==[1,1,1,'pitCu','pitGold'], str(r))
            await ev(pg,"()=>{const T=__T,G=T.G;let ai=-1;for(const [i,o] of G.objs)if(o.t==='quarry')ai=i;const o=G.objs.get(ai);o.p=G.time-40;G.p.x=ai%T.W+1;G.p.y=Math.floor(ai/T.W)+3.2}")
            await pg.wait_for_timeout(300); await pg.screenshot(path=SP+'quarry.png')
            rec('기능','콘솔 오류 없음', not errs, errs[:3])
            await b.close()
        print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
    return main
