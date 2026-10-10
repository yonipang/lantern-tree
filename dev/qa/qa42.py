import asyncio, sys
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# 장비 메뉴·무기 (v42): 장비 칸, 주먹·도끼, 광물 화살 + 돌 채굴기 (v48: 무기 칸 없음 · 장비는 가방 안)
H2=HOOK.replace("computeLight}","computeLight,RECIPES,SPR,circuitTick,swingAttack,updatePShots,mkEnemy,curWeapon,wearItem,unwear,wearing,hitObj,hotClick,freshEquip,WTYPE,rarOf}")
CLEAR="""window.__clear=()=>{const T=__T,G=T.G;for(let y=T.CY+4;y<T.CY+16;y++)for(let x=T.CX+4;x<T.CX+16;x++){const i=T.idx(x,y);G.wall[i]=0;G.floor[i]=1;G.objs.delete(i);G.wire.delete(i)}
  G.enemies.length=0;G.pshots.length=0;G.p.x=T.CX+8.5;G.p.y=T.CY+8.5;G.p.face={x:1,y:0};G.p.dead=0;G.p.mp=999;G.fish=null;G.inv.fill(null);G.sel=0;return [T.CX+8,T.CY+8]};"""
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        await ev(pg,"()=>{"+CLEAR+"}")
        # ---- equipment slots (v48: no weapon slot, the equipment sits at the top of the bag) ----
        r=await ev(pg,"()=>{const G=__T.G;return [Object.keys(__T.freshEquip()).join(','),'weapon' in G.equip,G.inv.slice(0,9).some(s=>s&&s.id==='swordWood')]}")
        rec('장비 칸','4칸(옷·머리장식·목걸이·반지, v48: 무기 칸 없음), 새 게임의 나무 검은 단축칸', r==['body,head,neck,ring',False,True], str(r))
        await ev(pg,"()=>__T.openPanel('inv')"); await pg.wait_for_timeout(500)
        r=await ev(pg,"()=>{const s=document.querySelector('#sheet');return [s.querySelectorAll('[data-a=eqSlot]').length,['옷','머리장식','목걸이','반지'].every(t=>s.innerText.includes(t)),!!document.querySelector('#bEquip')]}")
        rec('장비 메뉴','v48: 장비는 가방 맨 위 (따로 있던 [장비] 버튼 없음)', r==[4,True,False], str(r))
        await pg.screenshot(path=SP+'qa42_equip.png')
        await ev(pg,"()=>__T.closePanel()")
        await pg.keyboard.press('KeyU'); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const k=document.querySelector('#sheet [data-a=eqSlot]')?1:0;__T.closePanel();return k}")
        rec('장비 메뉴','U 키로 가방(장비)', r==1, r)
        # wear from the bag, then take it off
        await ev(pg,"()=>{const G=__T.G;G.inv.fill(null);G.inv[12]={id:'obsCoat',c:1};__T.openPanel('inv')}"); await pg.wait_for_timeout(500)
        await ev(pg,"()=>document.querySelector('#sheet .slot[data-a=inv][data-i=\"12\"]').click()"); await pg.wait_for_timeout(300)
        await ev(pg,"()=>document.querySelector('#sheet [data-a=wearOn]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const G=__T.G;return [G.equip.body&&G.equip.body.id,G.inv.filter(Boolean).length]}")
        rec('장비 칸','가방에서 옷을 골라 [입기] → 옷 칸', r==['obsCoat',0], str(r))
        await ev(pg,"()=>document.querySelector('#sheet [data-a=eqSlot][data-i=body]').click()"); await pg.wait_for_timeout(300)
        r=await ev(pg,"()=>{const G=__T.G;return [G.equip.body,G.inv.filter(Boolean).map(s=>s.id).join(',')]}")
        rec('장비 칸','장비 칸을 누르면 벗어서 가방으로', r==[None,'obsCoat'], str(r))
        await ev(pg,"()=>__T.closePanel()")
        # charms move to their own slots
        r=await ev(pg,"()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[10]={id:'turtleCharm',c:1};G.inv[11]={id:'snowBrooch',c:1};T.wearItem(10);T.wearItem(11);return [G.equip.neck&&G.equip.neck.id,G.equip.head&&G.equip.head.id,T.wearing('turtleCharm'),T.wearing('snowBrooch'),'acc' in G.equip]}")
        rec('장신구','거북 등껍질 부적 → 목걸이, 눈꽃 브로치 → 머리장식', r==['turtleCharm','snowBrooch',True,True,False], str(r))
        # ---- which weapon is used ----
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.inv[12]={id:'swordIron',c:1};G.inv[0]={id:'berry',c:2};G.inv[1]={id:'spearWood',c:1};G.sel=0;const a=T.curWeapon().id;G.sel=1;const b2=T.curWeapon().id;
          G.inv[1].dur=0;const c=T.curWeapon().id;const d=T.curWeapon();return [a,b2,c,d.id,d.wt,d.dmg]}""")
        rec('무기','v48: 단축칸에서 든 무기만 씀, 안 들거나 망가지면 주먹 (가방 속 무기는 안 씀)', r==['hand','spearWood','hand','hand','fist',3], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.equip.weapon=null;const e=T.mkEnemy('slimeG',G.p.x+.9,G.p.y);e.hp=999;G.enemies.push(e);T.swingAttack();return [999-e.hp,G.swing&&G.swing.wt,!G.swing.icon]}""")
        rec('주먹','주먹 기본 공격 (공격력 3 안팎, 주먹 모션)', 2<=r[0]<=7 and r[1]=='fist' and r[2], str(r))
        await pg.wait_for_timeout(100); await pg.screenshot(path=SP+'qa42_fist.png')
        # ---- axes ----
        r=await ev(pg,"()=>{const T=__T;return ['axeStone','axeCopper','axeIron'].map(id=>{const it=T.ITEMS[id],rc=T.RECIPES.find(r=>r.out===id);return [it.kind,it.wt,rc&&rc.at,rc&&rc.cat]})}")
        rec('도끼','돌·구리·철 도끼 (무기 탭, 돌 도끼는 작업대, 금속은 구리 제작대)', r==[['sword','axe','bench','weapon'],['sword','axe','forge','weapon'],['sword','axe','forge','weapon']], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const [x,y]=__clear();const t={x:x+1,y};const chop=w=>{G.inv[0]=w?{id:w,c:1}:null;G.sel=0;const o={t:'root'};G.objs.set(T.idx(t.x,t.y),o);T.hitObj(t,o);const d=o.dmg;G.objs.delete(T.idx(t.x,t.y));return d};
          G.inv[9]={id:'pickWood',c:1};const a=chop('swordWood'),b2=chop('axeStone');G.inv[0]={id:'axeCopper',c:1};const e=T.mkEnemy('slimeG',G.p.x+1.1,G.p.y);e.hp=999;G.enemies.push(e);T.swingAttack();return [a,b2,999-e.hp,G.swing.icon]}""")
        rec('도끼','도끼를 들면 나무를 1.6배 빨리 베요', abs(r[1]-r[0]*1.6)<1e-6 and r[0]>0, str(r))
        rec('도끼','도끼로 공격 (구리 도끼 공격력 15 안팎)', 12<=r[2]<=30 and r[3]=='axeCopper', str(r))
        # ---- arrows ----
        r=await ev(pg,"()=>{const T=__T;return ['arrowStone','arrowCopper','arrowIron','arrowCrystal','arrowGold'].map(id=>{const rc=T.RECIPES.find(r=>r.out===id);return [T.ITEMS[id].kind,rc&&rc.n,rc&&rc.at]})}")
        rec('화살','광물 화살 5종 (한 번에 10개, 돌은 작업대)', r==[['arrow',10,'bench'],['arrow',10,'forge'],['arrow',10,'forge'],['arrow',10,'forge'],['arrow',10,'forge']], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowWood',c:1};G.sel=0;const shot=()=>{G.pshots.length=0;T.swingAttack();return G.pshots[0]};
          let plain=0;for(let k=0;k<40;k++)plain+=shot().dmg;const p0=shot();
          G.inv[12]={id:'arrowStone',c:5};G.inv[13]={id:'arrowIron',c:3};const s1=shot();const left=[T.countItem('arrowIron'),T.countItem('arrowStone')];
          G.inv[13]=null;G.inv[12]={id:'arrowIron',c:40};let iron=0;for(let k=0;k<40;k++)iron+=shot().dmg;
          G.inv[12]={id:'arrowCrystal',c:2};const cr=shot();G.inv[12]={id:'arrowGold',c:2};const gd=shot();G.inv[0]={id:'bowFrost',c:1};const gf=shot();
          return [p0.tip,s1.tip,left,iron/plain,cr.pierce,gd.fx,gf.fx,T.countItem('arrowGold')]}""")
        rec('화살','화살이 없으면 나무 화살(무한), 있으면 좋은 화살부터 한 발에 하나', r[0] is None and r[1]=='#d8e0ea' and r[2]==[2,5], str(r[:3]))
        rec('화살','철 화살은 피해 약 1.5배', 1.3<r[3]<1.7, str(r[3]))
        rec('화살','수정 화살은 적 하나를 꿰뚫고, 금 화살은 불꽃 (활 고유 효과가 먼저)', r[4]==1 and r[5]=='burn' and r[6]=='chill' and r[7]==0, str(r[4:]))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;__clear();G.inv[0]={id:'bowWood',c:1};G.sel=0;G.inv[12]={id:'arrowIron',c:3};const e=T.mkEnemy('slimeG',G.p.x+2.5,G.p.y);e.hp=999;G.enemies.push(e);T.swingAttack();for(let k=0;k<30;k++)T.updatePShots(1/60);return 999-e.hp}""")
        rec('화살','철 화살이 적에게 맞음', r>=4, r)
        await ev(pg,"()=>__T.openPanel('inv')"); await pg.wait_for_timeout(600)
        await ev(pg,"()=>document.querySelector('#sheet .slot[data-a=inv][data-i=\"0\"]').click()"); await pg.wait_for_timeout(500)
        r=await ev(pg,"()=>{const t=document.querySelector('#sheet').innerText;__T.closePanel();return t.includes('화살: 철 화살 2개')}")
        rec('화살','가방에서 활을 누르면 쓸 화살과 개수 표시 (v48)', r, r)
        # ---- save / old saves ----
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.equip=T.freshEquip();G.equip.neck={id:'turtleCharm',c:1};G.equip.head={id:'snowBrooch',c:1};G.equip.body={id:'obsCoat',c:1};
          T.deserialize(JSON.parse(JSON.stringify(T.serialize())));const E=T.G.equip;return [E.neck.id,E.head.id,E.body.id,E.ring,'weapon' in E]}""")
        rec('저장','장비 4칸 저장/불러오기', r==['turtleCharm','snowBrooch','obsCoat',None,False], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);G.equip=T.freshEquip();const s=JSON.parse(JSON.stringify(T.serialize()));s.equip={body:{id:'frostRobe',c:1},acc:{id:'turtleCharm',c:1}};
          s.inv[0]={id:'spearCopper',c:1};s.inv[12]={id:'swordIron',c:1,dur:300};s.inv[13]={id:'swordWood',c:1};T.deserialize(s);const G2=T.G,E=G2.equip;
          return [E.neck&&E.neck.id,E.body&&E.body.id,E.head,'acc' in E,'weapon' in E,G2.inv.filter(Boolean).map(x=>x.id).sort().join(',')]}""")
        rec('옛 세이브','v41 세이브: 장신구 칸 → 목걸이, 무기는 가방에 그대로', r==['turtleCharm','frostRobe',None,False,False,'spearCopper,swordIron,swordWood'], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(T.serialize()));s.equip={body:null,acc:{id:'snowBrooch',c:1}};T.deserialize(s);const E=T.G.equip;return [E.head&&E.head.id,E.neck]}""")
        rec('옛 세이브','눈꽃 브로치 → 머리장식', r==['snowBrooch',None], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(T.serialize()));delete s.equip;s.inv[3]={id:'swordCopper',c:1};T.deserialize(s);const E=T.G.equip;return [Object.keys(E).join(','),T.countItem('swordCopper')]}""")
        rec('옛 세이브','v36 이전(장비 칸 없음) 세이브도 정상', r==['body,head,neck,ring',1], str(r))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;G.inv.fill(null);const s=JSON.parse(JSON.stringify(T.serialize()));s.equip={weapon:{id:'bowIron',c:1,dur:77}};T.deserialize(s);const k=T.G.inv.findIndex(x=>x&&x.id==='bowIron');return [k,T.G.inv[k].dur]}""")
        rec('옛 세이브','v42~v47 세이브: 무기 칸의 무기는 단축칸으로 (내구도 유지)', r==[0,77], str(r))
        await pg.wait_for_timeout(1900)
        r=await ev(pg,"()=>document.querySelector('#toasts').innerText")
        rec('옛 세이브','불러올 때 안내 알림', '단축칸' in r and '사냥꾼의 활' in r, r[:90])
        # ---- stone drill ----
        r=await ev(pg,"()=>{const T=__T,rc=T.RECIPES.find(r=>r.out==='drillStone');return [rc&&rc.at,rc&&rc.cat,rc&&rc.req.map(x=>x[0]).join(','),!!T.SPR.obj.drillStoneU,!!T.SPR.obj.drillStoneR]}")
        rec('돌 채굴기','v46: 벽 앞 돌 채굴기는 제작법 없음 (돌 채굴장으로 바뀜), 이미 놓인 것은 그대로 동작·방향별 그림', r==[None,None,None,True,True], str(r))
        await ev(pg,"()=>{const T=__T,G=T.G;const [x,y]=__clear();G.objs.set(T.idx(x+2,y),{t:'drillStone',dir:{x:1,y:0}});G.wall[T.idx(x+3,y)]=2;G.p.x=x+.5}")
        r=await ev(pg,"()=>{const T=__T,G=T.G,x=T.CX+8,y=T.CY+8,o=G.objs.get(T.idx(x+2,y));T.circuitTick(9);return [o.work,o.why,(o.store||[]).length]}")
        rec('돌 채굴기','전기가 없으면 멈춤', r==[False,'power',0], str(r))
        await ev(pg,"()=>{const T=__T,G=T.G,x=T.CX+8,y=T.CY+8;G.wire.set(T.idx(x+2,y+1),1);G.objs.set(T.idx(x+2,y+2),{t:'battery',e:600})}")
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8,o=G.objs.get(T.idx(x+2,y));T.circuitTick(5);const a=[o.work,(o.store||[]).length];T.circuitTick(3.5);const b2=(o.store||[]).map(s=>s.id+':'+s.c).join(',');
          G.wall[T.idx(x+3,y)]=1;o.prog=0;T.circuitTick(9);const c=(o.store||[]).map(s=>s.id+':'+s.c).join(',');
          G.wall[T.idx(x+3,y)]=4;T.circuitTick(1);const d=[o.work,o.why];G.wall[T.idx(x+3,y)]=5;T.circuitTick(1);const e=[o.work,o.why];return [a,b2,c,d,e]}""")
        rec('돌 채굴기','전기가 들어오면 8초마다 돌벽에서 돌, 흙벽에서 흙', r[0]==[True,0] and r[1]=='stone:1' and r[2]=='stone:1,dirt:1', str(r[:3]))
        rec('돌 채굴기','구리·철 광맥은 못 캠 (지형만)', r[3]==[False,'tier'] and r[4]==[False,'tier'], str(r[3:]))
        r=await ev(pg,"""()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8;G.p.x=x+1.5;G.p.y=y+.5;G.p.face={x:1,y:0};G.sel=8;G.inv[8]=null;const d=T.decide();return [d.k,d.lbl]}""")
        await tap(pg,1); await pg.wait_for_timeout(200)
        r2=await ev(pg,"()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8,o=G.objs.get(T.idx(x+2,y));return [T.countItem('stone'),T.countItem('dirt'),(o.store||[]).length]}")
        rec('돌 채굴기','앞에서 누르면 캔 것을 꺼냄', r==['use','꺼내기'] and r2==[1,1,0], str([r,r2]))
        r=await ev(pg,"()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8,o=G.objs.get(T.idx(x+2,y));G.wall[T.idx(x+3,y)]=4;T.circuitTick(1);G.p.x=x+1.5;G.p.face={x:1,y:0};return 1}")
        await pg.wait_for_timeout(2300)  # same-key toasts are held back for 2.2s
        await tap(pg,1); await pg.wait_for_timeout(200)
        r=await ev(pg,"()=>document.querySelector('#toasts').innerText")
        rec('돌 채굴기','못 캐는 벽 안내', '(지형)만' in r, r[-60:])
        await ev(pg,"()=>{const T=__T,G=T.G;const x=T.CX+8,y=T.CY+8;G.wall[T.idx(x+3,y)]=2;G.objs.get(T.idx(x+2,y)).work=true;G.p.x=x+.5;G.p.y=y+1.5}"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SP+'qa42_drill.png')
        rec('기능','콘솔 오류 없음', not errs, errs[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
