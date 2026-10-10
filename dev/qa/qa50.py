import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v48: 손에 든 물건의 일만 함 (가구=놓기, 삽=파기, 무기=공격 …), 빈손이면 예전처럼 다 함 / 장비의 무기 칸 없앰 → 든 무기가 무기
H2=HOOK.replace("computeLight}","computeLight,curWeapon,holdMode,newGame,RECIPES,EQ_SLOTS,get panel(){return panel},renderPanel,HOT}")
CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+2;y<T.CY+22;y++)for(let x=T.CX+2;x<T.CX+22;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=2;G.objs.delete(i);G.biome[i]=0}
  G.enemies.length=0;G.drops.length=0;G.wild=[];G.petE=null;G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.sit=null;G.fish=null;G.inv.fill(null);G.sel=0;return [T.CX+9,T.CY+8]};
  window.__en=()=>{const G=__T.G;G.enemies.push({k:'slimeG',x:G.p.x-.9,y:G.p.y,hp:999,vx:0,vy:0,t:0,hurt:0,kx:0,ky:0,z:0,air:0,land:0,cd:99,anim:0})};
  window.__put=(t,o)=>{const T=__T;T.G.objs.set(T.idx(T.CX+9,T.CY+8),Object.assign({t},o||{}))};
  window.__d=()=>{const a=__T.decide();return a.k+':'+a.lbl};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+CLEAR+"}")
        # building first
        r=await ev(pg,"""()=>{const G=__T.G;__clear();G.inv[0]={id:'torch',c:5};const a=__d();__en();const b2=__d();__put('chest',{items:Array(16).fill(null)});const c=__T.decide();G.enemies.length=0;return [a,b2,c.k,c.lbl,!!c.sub]}""")
        rec('손에 든 것','가구를 들면 놓기가 먼저 (적이 붙어도), 상자 앞이면 열지 않고 [자리 있음] + 작은 [회수]', r==['place:놓기','place:놓기','info','자리 있음',True], str(r))
        r=await ev(pg,"""()=>{const G=__T.G;__clear();G.inv[0]={id:'berrySeed',c:5};const a=__d();__put('cropBerry',{p:G.time-99999});const b2=__d();__put('chest',{items:Array(16).fill(null)});const c=__d();return [a,b2,c]}""")
        rec('손에 든 것','씨앗: 심기, 다 자란 작물은 거두기(다시 심으려고), 상자는 안 열림', r[0]=='place:심기' and r[1]=='harvest:수확' and r[2].startswith('info:'), str(r))
        # shovel first
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'shovel',c:1,dur:250};G.floor[T.idx(T.CX+9,T.CY+8)]=6;const a=__d();__en();const b2=__d();G.enemies.length=0;
          __put('bush');const c=__d();__put('chest',{items:Array(16).fill(null)});const d=__d();__put('bench');const e=__d();G.objs.delete(T.idx(T.CX+9,T.CY+8));G.wall[T.idx(T.CX+9,T.CY+8)]=1;const f=__d();G.wall[T.idx(T.CX+9,T.CY+8)]=0;return [a,b2,c,d,e,f]}""")
        rec('손에 든 것','삽을 들면 파기가 먼저 (적이 붙어도), 덤불은 퍼내기, 상자·작업대·벽 앞에서는 열기·캐기 대신 안내', r[0]=='dig:걷기' and r[1]=='dig:걷기' and r[2]=='dig:퍼내기' and all(x.startswith('info:') for x in r[3:]), str(r))
        # food / wear / tools
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'berry',c:3};__put('chest',{items:Array(16).fill(null)});const a=__d();__en();const b2=__d();G.enemies.length=0;
          G.inv[0]={id:'wcan',c:1,w:0};const c=__d();G.inv[0]={id:'rod',c:1,dur:150};const d=__d();G.inv[0]={id:'lasso',c:1};const e=__d();return [a,b2,c,d,e]}""")
        rec('손에 든 것','음식은 먹기만, 물뿌리개·낚싯대·올가미는 상자 앞에서도 열지 않고 안내', r[0]=='eat:먹기' and r[1]=='eat:먹기' and all(x.startswith('info:') for x in r[2:]), str(r))
        # weapon held
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'swordCopper',c:1};G.inv[12]={id:'pickCopper',c:1};const t=T.idx(T.CX+9,T.CY+8);G.wall[t]=1;const a=__d();G.wall[t]=0;
          __put('chest',{items:Array(16).fill(null)});const b2=__d();__en();const c=__d();G.enemies.length=0;G.objs.delete(t);return [a,b2,c,T.curWeapon().id]}""")
        rec('손에 든 것','무기를 들면 싸우기만: 벽·상자 앞에서도 휘두르기, 적이 오면 공격 (그 무기로)', r==['swing:휘두르기','swing:휘두르기','attack:공격','swordCopper'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'axeStone',c:1};__put('root');const a=__T.decide();G.objs.delete(T.idx(T.CX+9,T.CY+8));return [a.k,a.lbl]}""")
        rec('손에 든 것','도끼를 들면 나무는 벨 수 있음', r==['chop','베기'], str(r))
        # pick held
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'pickWood',c:1};G.inv[12]={id:'pickCopper',c:1};const t=T.idx(T.CX+9,T.CY+8);G.wall[t]=1;const a=T.decide();__en();const b2=__d();G.wall[t]=0;const c=__d();G.enemies.length=0;
          __put('chest',{items:Array(16).fill(null)});const d=__d();G.objs.delete(t);const pk=T.bestPick().id;G.sel=1;const pk2=T.bestPick().id;return [a.k,a.icon,b2,c,d,pk,pk2]}""")
        rec('손에 든 것','곡괭이를 들면 그 곡괭이로 캐기 (앞에 벽이 있으면 적보다 먼저), 상자는 안 열림 / 빈손이면 가방 속 가장 좋은 곡괭이', r[0:3]==['mine','pickWood','mine:캐기'] and r[3]=='attack:공격' and r[4].startswith('swing') and r[5:]==['pickWood','pickCopper'], str(r))
        # empty hand / material
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[12]={id:'swordIron',c:1};G.inv[13]={id:'pickCopper',c:1};G.sel=0;__put('chest',{items:Array(16).fill(null)});const a=__d();G.inv[0]={id:'stone',c:9};const b2=__d();
          G.objs.delete(T.idx(T.CX+9,T.CY+8));G.wall[T.idx(T.CX+9,T.CY+8)]=1;const c=T.decide();G.wall[T.idx(T.CX+9,T.CY+8)]=0;__en();const d=__d();const w=T.curWeapon().id;G.enemies.length=0;return [a,b2,c.k+':'+c.icon,d,w,T.holdMode(T.ITEMS.stone)]}""")
        rec('빈손','빈손·재료를 들면 예전처럼: 상자 열기, 가방 속 좋은 곡괭이로 캐기, 적은 주먹으로 (가방 속 무기는 안 씀)', r==['open:열기','open:열기','mine:pickCopper','attack:공격','hand','hand'], str(r))
        # equipment without the weapon slot
        await ev(pg,"()=>{const G=__T.G;__clear();G.inv[0]={id:'swordCopper',c:1};G.inv[12]={id:'woolHat',c:1};G.sel=0;G.pets={dog:1};G.petOn='dog';__T.openPanel('equip')}"); await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;return [__T.panel.kind,__T.EQ_SLOTS.map(x=>x[0]).join(','),'weapon' in __T.G.equip,t.includes('무기 칸'),document.querySelectorAll('#sheet [data-a=eqSlot]').length,!!(document.querySelector('#sheet .eq2').compareDocumentPosition(document.querySelector('#sheet [data-a=inv]'))&4),t.includes('멍멍이 · 함께 다니는 중'),!!document.querySelector('#bEquip')]}")
        await pg.screenshot(path=SP+'qa50_bag.png')
        rec('가방','장비 메뉴가 가방 안으로: 맨 위에 장비 4칸(무기 칸 없음), 아래에 펫, 따로 있던 [장비] 버튼 없음', r==['inv','body,head,neck,ring',False,False,4,True,True,False], str(r))
        await ev(pg,"()=>document.querySelector('#sheet [data-a=eqSlot][data-i=body]').click()"); await pg.wait_for_timeout(300)
        await ev(pg,"()=>document.querySelector('#sheet .slot[data-a=inv][data-i=\"12\"]').click()"); await pg.wait_for_timeout(300)
        await ev(pg,"()=>document.querySelector('#sheet [data-a=wearOn]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>[__T.G.equip.head&&__T.G.equip.head.id,document.querySelector('#sheet').innerText.includes('털모자')]")
        await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(300)
        rec('가방','가방에서 장비를 골라 [달기] → 장비 칸에 바로 보임', r==['woolHat',True], str(r))
        await ev(pg,"()=>{const G=__T.G;G.sel=0;G.inv[0]={id:'swordCopper',c:1};__T.openPanel('inv')}"); await pg.wait_for_timeout(500)
        await ev(pg,"()=>document.querySelector('#sheet .slot[data-i=\"0\"]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>[!!document.querySelector('#sheet [data-a=wearOn]'),document.querySelector('#sheet').innerText.includes('무기 칸')]")
        await ev(pg,"()=>__T.closePanel()"); await pg.wait_for_timeout(300)
        rec('가방','무기 설명에 [무기 칸에 끼기] 버튼 없음', r==[False,False], str(r))
        # old save with a weapon slot
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'berry',c:2};G.inv[1]={id:'torch',c:3};const s=JSON.parse(JSON.stringify(T.serialize()));s.equip={weapon:{id:'swordIron',c:1,dur:100,lv:2},body:null,head:null,neck:null,ring:null};
          T.deserialize(s);const k=T.G.inv.findIndex(x=>x&&x.id==='swordIron');const w=T.G.inv[k];return [k,w.dur,w.lv,'weapon' in T.G.equip,JSON.stringify(T.serialize().equip)]}""")
        rec('옛 세이브','무기 칸에 있던 무기(내구도·강화 그대로)는 빈 단축칸으로 옮겨짐', r[0]==2 and r[1:4]==[100,2,False] and 'weapon' not in r[4], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const s=JSON.parse(JSON.stringify(T.serialize()));s.inv=s.inv.map((x,i)=>i<9?{id:'stone',c:5}:x);s.equip={weapon:{id:'swordCopper',c:1}};T.deserialize(s);const k=T.G.inv.findIndex(x=>x&&x.id==='swordCopper');return [k>=9]}""")
        rec('옛 세이브','단축칸이 가득하면 가방으로', r==[True], str(r))
        # new game & first weapon
        r=await ev(pg,"""()=>{const T=__T;T.newGame(321);const G=T.G;return [G.sel,G.inv.slice(0,4).map(x=>x?x.id:'-').join(','),G.inv.slice(T.HOT).filter(Boolean).map(x=>x.id).join(','),T.curWeapon().id,T.holdMode(G.inv[G.sel]&&T.ITEMS[G.inv[G.sel].id])]}""")
        rec('새 게임','빈손으로 시작, 나무 검은 단축칸 3번, 나무 곡괭이는 가방', r==[3,'berry,berrySeed,swordWood,-','pickWood','hand','hand'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[0]={id:'berry',c:1};T.addItem('swordCopper',1);const a=G.inv.findIndex(x=>x&&x.id==='swordCopper');T.addItem('swordIron',1);const b2=G.inv.findIndex(x=>x&&x.id==='swordIron');return [a,b2>=T.HOT]}""")
        rec('무기','단축칸에 무기가 없을 때 얻은 무기는 빈 단축칸으로 (이미 있으면 가방)', r==[1,True], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowWood',c:1};G.inv[12]={id:'swordIron',c:1};G.sel=0;const a=T.curWeapon().id;G.sel=1;return [a,T.curWeapon().id]}""")
        rec('무기','든 활이 무기, 다른 칸을 고르면 주먹', r==['bowWood','hand'], str(r))
        await ev(pg,"()=>{__clear();const G=__T.G;G.inv[0]={id:'swordCopper',c:1};G.inv[1]={id:'shovel',c:1};G.inv[2]={id:'torch',c:4};G.sel=2;__put('chest',{items:Array(16).fill(null)})}"); await pg.wait_for_timeout(500)
        await pg.screenshot(path=SP+'qa50_hold.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
