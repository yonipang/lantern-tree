import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
H2=HOOK.replace("computeLight}","computeLight,RECIPES,updateBosses,hitBoss,freshBoss,isSolid,WALLS,SL,SI,LAVA,trySpawn,ENEMY,checkGuide,GUIDE,QSIDE,insertSeeds,migrateV3,genWorld,BKEYS,mineWall:typeof mineWall!=='undefined'?mineWall:null,newGame,refreshHotbar,rarOf,decide}")
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        for seed in [12345, 777, 4242]:
            r=await ev(pg,f"""()=>{{const T=__T;const w=T.genWorld({seed});const W=200,H=200;let n3=0,n4=0,lava=0,ice=0;for(let i=0;i<W*H;i++){{if(w.biome[i]===3)n3++;if(w.biome[i]===4)n4++;if(w.floor[i]===T.LAVA&&!w.wall[i])lava++;if(w.floor[i]===20)ice++;}}
              const seen=new Uint8Array(W*H),q=[T.idx(T.CX,T.CY+2)];seen[q[0]]=1;let leak=0,reach=0;
              while(q.length){{const i=q.pop();reach++;if(w.biome[i]>=3)leak++;const x=i%W,y=(i/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){{const j=T.idx(x+dx,y+dy);if(x+dx<0||y+dy<0||x+dx>=W||y+dy>=H||seen[j]||w.wall[j])continue;seen[j]=1;q.push(j)}}}}
              const inner=(S)=>{{const s2=new Uint8Array(W*H),q2=[T.idx(S.x,S.y+2)];s2[q2[0]]=1;let n=0,out=0;while(q2.length){{const i=q2.pop();n++;if(w.biome[i]<3)out++;const x=i%W,y=(i/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){{const j=T.idx(x+dx,y+dy);if(s2[j]||w.wall[j])continue;s2[j]=1;q2.push(j)}}}}return [n,out]}};
              return [n3,n4,lava,ice,leak,reach,w.objs.get(T.idx(T.SL.x,T.SL.y))?.t,w.objs.get(T.idx(T.SI.x,T.SI.y))?.t,inner(T.SL),inner(T.SI)]}}""")
            rec('지역',f'시드 {seed}: 용암·얼음 지역 생성 (타일 수/용암/얼음 바닥)', r[0]>800 and r[1]>800 and r[2]>0, str(r[:4]))
            rec('지역',f'시드 {seed}: 시작 지점에서 벽을 안 뚫고는 깊은 지역에 못 감', r[4]==0 and r[5]>2000, f'leak={r[4]} reach={r[5]}')
            rec('지역',f'시드 {seed}: 두 제단 + 보스방 안쪽은 막혀 있지만 넓음', r[6]=='shrine' and r[7]=='shrine' and r[8][0]>80 and r[8][1]==0 and r[9][0]>80 and r[9][1]==0, str(r[8:]))
        r=await ev(pg,"()=>{const T=__T;return [9,10,11,12].map(w=>T.WALLS[w].tier)}")
        rec('지역','새 벽은 모두 3단계(수정 곡괭이)', r==[3,3,3,3], str(r))
        r=await ev(pg,"()=>{const T=__T,G=T.G;let n3=0;for(let i=0;i<40000;i++)if(G.biome[i]===3)n3++;const i=G.floor.indexOf(T.LAVA);return [n3>800,i>=0?T.isSolid(i%200,(i/200)|0):'none']}")
        rec('지역','현재 세계에도 지역 존재 · 용암은 못 지나감', r[0] and r[1] is True, str(r))
        # mining tier
        r=await ev(pg,"""()=>{const T=__T,G=T.G;for(let i=0;i<G.inv.length;i++)G.inv[i]=null;G.inv[0]={id:'pickIron',c:1};const x=T.CX+3,y=T.CY+6;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){G.objs.delete(T.idx(x+dx,y+dy));G.wall[T.idx(x+dx,y+dy)]=0}G.wall[T.idx(x,y)]=10;G.p.x=x+.5;G.p.y=y-.5;G.p.face={x:0,y:1};T.mineWall({x,y});const a=G.wdmg.get(T.idx(x,y))||0;G.inv[1]={id:'pickCrystal',c:1};T.mineWall({x,y});const b=G.wdmg.get(T.idx(x,y))||0;G.wall[T.idx(x,y)]=0;G.wdmg.clear();return [a,b]}""")
        rec('채굴','철 곡괭이로는 금 광맥 못 캠 · 수정 곡괭이로 캠', r[0]==0 and r[1]>0, str(r))
        # spawns
        r=await ev(pg,"""()=>{const T=__T,G=T.G;let i=-1;for(let k=0;k<40000;k++){if(G.biome[k]===3&&!G.wall[k]&&G.floor[k]===18&&Math.hypot(k%200-T.SL.x,((k/200)|0)-T.SL.y)>14){i=k;break}}const x=i%200,y=(i/200)|0;for(let dy=-14;dy<=14;dy++)for(let dx=-14;dx<=14;dx++){const j=T.idx(x+dx,y+dy);if(x+dx>2&&y+dy>2&&x+dx<197&&y+dy<197&&G.biome[j]===3&&G.wall[j]!==8){G.wall[j]=0;G.floor[j]=18;G.objs.delete(j)}}G.p.x=x+.5;G.p.y=y+.5;G.enemies.length=0;for(let k=0;k<40;k++)T.trySpawn();return [...new Set(G.enemies.map(e=>e.k+'@'+G.biome[T.idx(Math.floor(e.x),Math.floor(e.y))]))]}""")
        rec('적','용암 동굴에는 용암 말랑이·불씨 도깨비', len(r)>0 and any(k.endswith('@3') for k in r) and all(k.split('@')[0] in ('magmaSlime','cinder') for k in r if k.endswith('@3')), str(r))
        await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'qa24_lava.png')
        # turtle fight
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.enemies.length=0;const b=G.bosses.turtle;const h=T.BOSSES.turtle.home();G.p.x=h.x;G.p.y=h.y+4;const ph=new Set();let hz=0,shots=0,shellHit=null;
          for(let k=0;k<1800;k++){G.p.hp=999;G.p.inv=.5;T.updateBosses(1/60);ph.add(b.ph);hz=Math.max(hz,(G.hz||[]).length);shots=Math.max(shots,G.shots.length);if(b.ph==='shell'&&shellHit===null){const h0=b.hp;T.hitBoss(b,100,false);shellHit=h0-b.hp}}
          return [b.st,[...ph].sort().join(','),hz,shots,shellHit,Number.isFinite(b.x)&&Number.isFinite(b.y)]}""")
        rec('보스','용암 거북: 깨어나서 걷기·불덩이·숨기·껍질 굴리기 모두 사용', r[0]=='fight' and all(x in r[1] for x in ['walk','spit','hide','shell']), str(r))
        rec('보스','용암 거북: 껍질 굴리기 뒤 용암 웅덩이 · 불덩이 발사', r[2]>0 and r[3]>0, str(r))
        rec('보스','용암 거북: 껍질 속에서는 40%만 다침', r[4]==40, str(r))
        await pg.wait_for_timeout(300)
        await ev(pg,"()=>{const G=__T.G;const b=G.bosses.turtle;G.p.x=b.x;G.p.y=b.y+3.5}")
        await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa24_turtle.png')
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.drops.length=0;const b=G.bosses.turtle;b.hp=1;b.ph='walk';T.hitBoss(b,50,false);return [G.bossDead.turtle,G.drops.map(d=>d.id+':'+d.c).sort().join(','),(G.hz||[]).length]}")
        rec('보스','용암 거북 처치: 전용 대검 + 용암 핵 2 + 금괴', r[0] is True and 'swordLava' in r[1] and 'lavaCore:2' in r[1] and r[2]==0, str(r))
        # spirit fight
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.drops.length=0;G.enemies.length=0;const b=G.bosses.spirit;const h=T.BOSSES.spirit.home();G.p.x=h.x-3;G.p.y=h.y;const ph=new Set();let nova=0,slowed=0,gapOk=null;
          for(let k=0;k<1800;k++){G.p.hp=999;if(G.p.inv>0)G.p.inv=0;T.updateBosses(1/60);ph.add(b.ph);if((G.hz||[]).some(x=>x.k==='frost'))nova++;if(G.p.slowT>0)slowed++;
            if(gapOk===null&&G.shots.filter(s=>s.k==='ice').length>=15)gapOk=G.shots.filter(s=>s.k==='ice').length}
          return [[...ph].sort().join(','),nova>0,slowed>0,gapOk,Math.hypot(b.x-h.x,b.y-h.y)<13]}""")
        rec('보스','서리 정령: 고리·사라짐·얼음 폭발 패턴', all(x in r[0] for x in ['walk','ring','fade','nova']) and r[1], str(r))
        rec('보스','서리 정령: 얼음 고리에 빈틈(15발) · 폭발에 맞으면 느려짐 · 방 밖으로 안 나감', r[3]==15 and r[2] and r[4], str(r))
        await ev(pg,"()=>{const G=__T.G;const b=G.bosses.spirit;G.p.x=b.x+3;G.p.y=b.y}")
        await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'qa24_spirit.png')
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.drops.length=0;const b=G.bosses.spirit;b.hp=1;b.ph='walk';T.hitBoss(b,50,false);return [G.bossDead.spirit,G.drops.map(d=>d.id+':'+d.c).sort().join(',')]}")
        rec('보스','서리 정령 처치: 전용 활 + 서리 핵 2', r[0] is True and 'bowFrost' in r[1] and 'frostCore:2' in r[1], str(r))
        # legendary recipes
        r=await ev(pg,"()=>{const T=__T;return ['swordDawn','pickStar','swordGold','pickGold','staffFrost','goldBar'].map(id=>{const R=T.RECIPES.find(r=>r.out===id);return R?R.at+':'+T.rarOf(id):'none'})}")
        rec('장비','전설·영웅 장비와 금괴 레시피', r==['forge:4','forge:4','forge:3','forge:3','forge:3','furnace:2'], str(r))
        # story act 2
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.bossDead.queen=G.bossDead.slime=G.bossDead.golem=true;G.stats.seedsFound=3;G.treeSeeds=3;G.won=true;G.stats.wood=9;G.stats.bench=1;G.stats.torch=1;G.stats.copperOre=9;G.stats.copperBar=9;G.stats.forge=1;
          for(let i=0;i<G.inv.length;i++)G.inv[i]=null;T.addItem('pickCopper',1,false);G.guide=0;T.checkGuide();const a=T.GUIDE[G.guide].id;T.addItem('pickCrystal',1,false);T.checkGuide();const b2=T.GUIDE[G.guide].id;return [a,b2,G.bossDead.turtle,G.bossDead.spirit]}""")
        rec('이야기','3개 심은 뒤 2막 (두 보스를 이미 잡았으면 씨앗 모으기로 건너뜀)', r[0]=='seeds2' and r[1]=='seeds2', str(r))
        r=await ev(pg,"()=>{const T=__T,G=T.G;T.addItem('lightSeed',2);T.checkGuide();const g=T.GUIDE[G.guide].id;T.insertSeeds();return [g,G.treeSeeds,G.won2]}")
        await pg.wait_for_timeout(900)
        r2=await ev(pg,"()=>document.querySelector('#sheet h2,#sheet .sh-body h2')?.textContent||''")
        rec('이야기','다섯 번째 씨앗 → 진 엔딩 창', r[1]==5 and r[2] is True and '다섯 등불' in r2, str(r)+r2)
        await pg.screenshot(path=SP+'qa24_win2.png'); await ev(pg,"()=>__T.closePanel()")
        # save migration from an old (v2) save
        r=await ev(pg,"""()=>{const T=__T;T.newGame(999);const G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));
          const N=40000,wall=new Uint8Array(N),floor=new Uint8Array(N),biome=new Uint8Array(N);const un=(r,a)=>{let k=0;for(let i=0;i<r.length;i+=2){a.fill(r[i],k,k+r[i+1]);k+=r[i+1]}};un(s.wall,wall);un(s.floor,floor);un(s.biome,biome);
          const ex=new Uint8Array(N);let exN=0;for(let i=0;i<N;i++){if(biome[i]>=3){biome[i]=2;floor[i]=4;wall[i]=wall[i]?3:0;if(i%97===0){ex[i]=1;exN++}}}
          const rle=a=>{const o=[];let p=a[0],n=1;for(let i=1;i<a.length;i++){if(a[i]===p&&n<65535)n++;else{o.push(p,n);p=a[i];n=1}}o.push(p,n);return o};
          s.v=2;s.wall=rle(wall);s.floor=rle(floor);s.biome=rle(biome);s.explored=rle(ex);s.objs=s.objs.filter(([i,o])=>!['shrine','fireBloom','iceCluster'].includes(o.t)||(i!==T.idx(T.SL.x,T.SL.y)&&i!==T.idx(T.SI.x,T.SI.y)));s.objs=s.objs.filter(([i,o])=>o.t!=='fireBloom'&&o.t!=='iceCluster');delete s.bossDead.turtle;delete s.bossDead.spirit;
          T.deserialize(s);const G2=T.G;let n3=0,keep=0;for(let i=0;i<N;i++){if(G2.biome[i]===3)n3++;if(ex[i]&&G2.floor[i]===4)keep++}
          return [n3>800,G2.objs.get(T.idx(T.SL.x,T.SL.y))?.t,G2.bossDead.turtle,keep===exN,Object.keys(G2.bosses).length]}""")
        rec('저장','옛 저장(v2) 불러오면 안 가 본 곳에 새 지역 생성 · 가 본 곳은 그대로', r[0] and r[1]=='shrine' and r[2] is False and r[3] and r[4]==5, str(r))
        r=await ev(pg,"()=>{try{const s=JSON.stringify(__T.serialize());__T.deserialize(JSON.parse(s));return JSON.parse(s).v}catch(e){return String(e)}}")
        rec('저장','새 저장 버전 3 왕복', r==3, str(r))
        # look at the ice cave
        await ev(pg,"""()=>{const T=__T,G=T.G;const S=T.SI;G.p.x=S.x+.5;G.p.y=S.y+2.5;G.bosses.spirit.st='sleep';}""")
        await pg.wait_for_timeout(800); await pg.screenshot(path=SP+'qa24_ice.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
