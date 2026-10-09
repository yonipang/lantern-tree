import asyncio, sys, json
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v32: 플레이 시간·구간 기록, 판 번호(run), 다른 모험이면 항상 묻기, 클라우드 백업, 타이틀에서 클라우드 이어하기, 옛 세이브
H2=HOOK.replace("computeLight}","computeLight,fmtPlay,checkGuide,GUIDE,get lastInputAt(){return lastInputAt},set lastInputAt(v){lastInputAt=v},get CLOUD(){return CLOUD}}")
MOCK="""window.__cloudMock=(()=>{const ls=()=>JSON.parse(localStorage.getItem('mockcloud')||'{}'),sv=o=>localStorage.setItem('mockcloud',JSON.stringify(o));let cb=null;const user=()=>{const u=localStorage.getItem('mockauth');return u?JSON.parse(u):null};
return{onAuth(f){cb=f;setTimeout(()=>f(user()),10)},async google(){const u={uid:'g1',displayName:'구글유저'};localStorage.setItem('mockauth',JSON.stringify(u));cb(u)},
async emailIn(e,p){if(p!=='secret1'){const er=new Error('x');er.code='auth/invalid-credential';throw er}const u={uid:'u_'+e,email:e};localStorage.setItem('mockauth',JSON.stringify(u));cb(u)},async emailUp(e,p){return this.emailIn(e,p)},
async out(){localStorage.removeItem('mockauth');cb(null)},async get(uid){return ls()[uid]||null},async put(uid,d){const o=ls();o[uid]=d;sv(o)}}})();"""
UID='u_juyeon@test.kr'
CRY="(d)=>{const s=JSON.parse(d);const x=s.inv.find(q=>q&&q.id==='crystal');return x?x.c:0}"
async def ctx_with(b, cloud=None, auth=False, local=None):
    ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
    await ctx.add_init_script(MOCK)
    init="if(!sessionStorage.getItem('qa_init')){sessionStorage.setItem('qa_init','1');"
    if cloud is not None: init+="localStorage.setItem('mockcloud',JSON.stringify("+json.dumps(cloud)+"));"
    if auth: init+="localStorage.setItem('mockauth',JSON.stringify({uid:'"+UID+"',email:'juyeon@test.kr'}));"
    if local is not None: init+="localStorage.setItem('lantern-tree-save-v1',"+json.dumps(local)+");"
    init+="}"
    await ctx.add_init_script(init)
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto('file://'+SP+'qa.html'); await pg.wait_for_timeout(900)
    return ctx,pg,errs
async def start_new(pg):
    await pg.tap('#btnNew'); await pg.wait_for_timeout(200)
    if await pg.evaluate("()=>/정말/.test(document.querySelector('#btnNew').textContent)"): await pg.tap('#btnNew'); await pg.wait_for_timeout(200)
    await pg.tap('#charGo'); await pg.wait_for_timeout(600)
async def menu_login(pg):
    await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(600)
    await pg.tap('#sheet [data-a=clEmailT]'); await pg.wait_for_timeout(150)
    await pg.fill('#clEm','juyeon@test.kr'); await pg.fill('#clPw','secret1'); await pg.tap('#sheet [data-a=clIn]'); await pg.wait_for_timeout(1100)
cloud_of = "()=>JSON.parse(localStorage.getItem('mockcloud')||'{}')['"+UID+"']||null"
async def main():
    mkpage(SRC,'qa.html',H2)
    async with async_playwright() as p:
        b=await p.chromium.launch(); allerr=[]
        # ---- play time & quest records ----
        ctx,pg,errs=await new_ctx(b,390,844,True); allerr+=errs
        r=await ev(pg,"()=>[__T.G.playT,typeof __T.G.run,__T.G.run.length>6,__T.G.playTEst]")
        rec('플레이 시간','새 게임: 0초에서 시작, 판 번호가 생김', r[0]<1 and r[1]=='string' and r[2] and r[3] is False, str(r))
        for _ in range(6):
            await pg.dispatch_event('#game','pointermove') if await pg.query_selector('#game') else await pg.mouse.move(100,300)
            await pg.wait_for_timeout(250)
        t1=await ev(pg,"()=>__T.G.playT")
        rec('플레이 시간','움직이는 동안 플레이 시간이 쌓임', 1.0<t1<3.0, t1)
        await ev(pg,"()=>{__T.lastInputAt=performance.now()-121000}"); a=await ev(pg,"()=>__T.G.playT"); await pg.wait_for_timeout(700); c=await ev(pg,"()=>__T.G.playT")
        rec('플레이 시간','2분 넘게 아무 입력이 없으면 세지 않음 (자리 비움)', abs(c-a)<0.01, [a,c])
        await ev(pg,"()=>{__T.lastInputAt=performance.now();__T.G.playT=1234}")
        await ev(pg,"()=>{__T.G.stats.wood=6;__T.checkGuide()}"); await pg.wait_for_timeout(200)
        r=await ev(pg,"()=>[__T.G.qt.wood,__T.G.guide]")
        rec('구간 기록','목표를 이루면 그때 플레이 시간이 남음', r[0] is not None and 1234<=r[0]<=1240 and r[1]>=1, str(r))
        r=await ev(pg,"()=>[__T.fmtPlay(30),__T.fmtPlay(125),__T.fmtPlay(3*3600+12*60+5),__T.fmtPlay(7200,true)]")
        rec('표시','시간 표시 형식', r==['1분 미만','2분','3시간 12분','약 2시간 0분'], str(r))
        await ev(pg,"()=>__T.openPanel('menu')"); await pg.wait_for_timeout(600)
        await pg.tap('#sheet [data-a=qtShow]'); await pg.wait_for_timeout(250)
        txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
        rec('메뉴','메뉴에 플레이 시간과 구간 기록', '플레이 시간' in txt and '20분' in txt and '뿌리기둥을 베어 나무 모으기' in txt, txt[:200])
        await pg.screenshot(path=SP+'qa32_menu.png')
        # save round trip
        r=await ev(pg,"()=>{const s=__T.serialize();const run=__T.G.run;__T.deserialize(JSON.parse(JSON.stringify(s)));return [s.run===run,__T.G.run===run,__T.G.playT===s.playT,__T.G.qt.wood===s.qt.wood,__T.G.playTEst]}")
        rec('세이브','판 번호·플레이 시간·구간 기록이 저장되고 그대로 불러와짐', r==[True,True,True,True,False], str(r))
        # old save (before v32)
        r=await ev(pg,"""()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));delete s.run;delete s.playT;delete s.qt;delete s.playTEst;s.time=3600;s.stats.wood=6;
           __T.deserialize(s);return [__T.G.playT,__T.G.playTEst,typeof __T.G.run==='string'&&__T.G.run.length>6,Object.keys(__T.G.qt).length]}""")
        rec('옛 세이브','옛 세이브: 플레이 시간은 어림값(게임 시간), 판 번호를 새로 붙임', r==[3600,True,True,0], str(r))
        r=await ev(pg,"()=>{__T.checkGuide();return __T.fmtPlay(__T.G.playT,__T.G.playTEst)}")
        rec('옛 세이브','어림값은 "약"으로 표시', r=='약 1시간 0분', r)
        await ctx.close()
        # old save loaded through the title: already-cleared quests are NOT stamped with today's time
        old=await (await b.new_context()).new_page()
        await old.goto('file://'+SP+'qa.html'); await old.wait_for_timeout(500)
        olds=await old.evaluate("()=>{const s=JSON.parse(JSON.stringify(__T.serialize()));delete s.run;delete s.playT;delete s.qt;delete s.playTEst;s.time=5000;s.stats.wood=9;s.stats.bench=1;return JSON.stringify(s)}")
        await old.context.close()
        ctx,pg,errs=await ctx_with(b, local=olds); allerr+=errs
        await pg.tap('#btnContinue'); await pg.wait_for_timeout(600)
        r=await ev(pg,"()=>[__T.G.guide>=2,Object.keys(__T.G.qt).length,__T.G.playTEst,JSON.parse(localStorage.getItem('lantern-tree-save-v1')).run===__T.G.run]")
        rec('옛 세이브','이어하기: 이미 이룬 목표에 오늘 시간을 찍지 않음, 판 번호는 저장됨', r==[True,0,True,True], str(r))
        await ctx.close()

        # ---- cloud: device A makes an adventure and uploads it ----
        ctx,pg,errs=await ctx_with(b); allerr+=errs
        r=await ev(pg,"()=>[!document.querySelector('#btnCloud').hidden,document.querySelector('#btnCloud').textContent]")
        rec('타이틀','로그인 전에도 타이틀에 "클라우드에서 이어하기" 버튼', r[0] and '로그인' in r[1], str(r))
        await start_new(pg)
        rec('타이틀','게임을 시작하면 버튼이 사라짐', await ev(pg,"()=>document.querySelector('#btnCloud').hidden"))
        await ev(pg,"()=>{__T.addItem('crystal',33);__T.G.playT=5400}")
        await menu_login(pg)
        c=await ev(pg,cloud_of); runA=await ev(pg,"()=>__T.G.run")
        rec('클라우드','A 기기: 클라우드가 비어 있으면 바로 올림 (판 번호·플레이 시간 같이)', c and c['run']==runA and 5400<=c['playT']<=5405 and await ev(pg,CRY,c['data'])==33, str(c and {k:c[k] for k in ('run','playT','seeds')}))
        cloudA=await ev(pg,"()=>localStorage.getItem('mockcloud')")
        await ctx.close()

        # ---- device B: new game first, then log in → must ASK, not overwrite (the v31 bug) ----
        ctx,pg,errs=await ctx_with(b, cloud=json.loads(cloudA)); allerr+=errs
        await start_new(pg); await ev(pg,"()=>{__T.addItem('crystal',5)}")
        await menu_login(pg)
        c=await ev(pg,cloud_of)
        txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
        rec('새 기기','새 게임 후 로그인: 클라우드를 덮어쓰지 않음', await ev(pg,CRY,c['data'])==33 and c['run']==runA, await ev(pg,CRY,c['data']))
        rec('새 기기','다른 모험이라고 묻고 양쪽 정보(플레이 시간·빛씨앗)를 보여 줌', '클라우드에 다른 모험이 있어요' in txt and '1시간 30분' in txt and '이 기기' in txt and '빛씨앗' in txt, txt[txt.find('클라우드 저장'):][:220])
        await pg.screenshot(path=SP+'qa32_diffrun.png')
        await ev(pg,"()=>{__T.G.time+=999}"); await ev(pg,"()=>window.dispatchEvent(new Event('pagehide'))"); await pg.wait_for_timeout(200)
        c=await ev(pg,cloud_of)
        rec('새 기기','고르기 전에는 자동 업로드도 멈춤', await ev(pg,CRY,c['data'])==33)
        await pg.tap('#sheet [data-a=clKeep]'); await pg.wait_for_timeout(500)
        c=await ev(pg,cloud_of)
        rec('클라우드 백업','이 기기 것 쓰기 → 올리고, 원래 클라우드 모험은 백업으로 보관', await ev(pg,CRY,c['data'])==5 and c.get('prev') and await ev(pg,CRY,c['prev']['data'])==33 and c['prev']['run']==runA, str(c.get('prev') and {k:c['prev'][k] for k in ('run','playT','seeds','at')}))
        txt=await ev(pg,"()=>document.querySelector('#sheet .sh-body').innerText")
        rec('클라우드 백업','메뉴에 클라우드 백업 정보와 되돌리기 버튼', '클라우드 백업' in txt and '1시간 30분' in txt, txt[txt.find('클라우드 백업'):][:120])
        await pg.screenshot(path=SP+'qa32_prev.png')
        # autosave of the same (new) adventure keeps the backup
        await ev(pg,"()=>{__T.addItem('crystal',1)}"); await pg.tap('#sheet [data-a=clUpNow]'); await pg.wait_for_timeout(400)
        c=await ev(pg,cloud_of)
        rec('클라우드 백업','같은 모험을 계속 올려도 백업은 그대로', await ev(pg,CRY,c['data'])==6 and c.get('prev') and await ev(pg,CRY,c['prev']['data'])==33)
        await pg.tap('#sheet [data-a=clPrev]'); await pg.wait_for_timeout(200)
        rec('클라우드 백업','되돌리기는 한 번 더 눌러 확인', await ev(pg,"()=>document.querySelector('#sheet [data-a=clPrev]').textContent.includes('정말')"))
        await pg.tap('#sheet [data-a=clPrev]'); await pg.wait_for_timeout(700)
        c=await ev(pg,cloud_of)
        r=[await ev(pg,"()=>__T.countItem('crystal')"), await ev(pg,"()=>__T.G.run"), await ev(pg,CRY,c['data']), c.get('prev') and await ev(pg,CRY,c['prev']['data'])]
        rec('클라우드 백업','되돌리면 백업 모험으로 바뀌고, 방금 것은 다시 백업으로 (서로 바꿈)', r[0]==33 and r[1]==runA and r[2]==33 and r[3]==6, str(r))
        await ctx.close()

        # ---- device C: title → 클라우드에서 이어하기 → log in → loads straight away ----
        ctx,pg,errs=await ctx_with(b, cloud=json.loads(cloudA)); allerr+=errs
        await pg.tap('#btnCloud'); await pg.wait_for_timeout(200)
        rec('타이틀','버튼을 누르면 로그인 방법이 나옴', await ev(pg,"()=>!document.querySelector('#cloudTitle').hidden&&document.querySelector('#cloudTitle').innerText.includes('구글로 로그인')"))
        await pg.tap('#cloudTitle [data-ct=emailT]'); await pg.wait_for_timeout(150)
        await pg.fill('#ctEm','juyeon@test.kr'); await pg.fill('#ctPw','secret1')
        await pg.screenshot(path=SP+'qa32_title.png')
        await pg.tap('#cloudTitle [data-ct=in]'); await pg.wait_for_timeout(900)
        r=await ev(pg,"()=>[document.querySelector('#title').hidden,__T.countItem('crystal'),__T.G.run]")
        rec('타이틀','로그인하면 바로 클라우드 모험을 불러와 시작', r==[True,33,runA], str(r))
        await ctx.close()
        # logged in already: one tap continues
        ctx,pg,errs=await ctx_with(b, cloud=json.loads(cloudA), auth=True); allerr+=errs
        r=await ev(pg,"()=>[!document.querySelector('#cloudAsk').hidden,document.querySelector('#cloudAsk').innerText.includes('저장된 모험'),document.querySelector('#btnCloud').hidden]")
        rec('타이틀','이미 로그인한 새 기기: 저장된 모험 안내가 뜸 (중복 버튼은 숨김)', r==[True,True,True], str(r))
        await pg.tap('#cloudAsk [data-cl=take]'); await pg.wait_for_timeout(600)
        rec('타이틀','불러오기 → 이어서 플레이', await ev(pg,"()=>[document.querySelector('#title').hidden,__T.countItem('crystal')]")==[True,33])
        await ctx.close()

        # ---- old cloud save and old local save (no run ids) → ask once, then never again ----
        oc=json.loads(cloudA); d=json.loads(oc[UID]['data']); d.pop('run',None); d.pop('playT',None); d.pop('qt',None)
        oc[UID]={'data':json.dumps(d),'at':oc[UID]['at'],'char':'sprout','v':1}
        ld=dict(d); ld['at']=oc[UID]['at']+4000
        ctx,pg,errs=await ctx_with(b, cloud=oc, auth=True, local=json.dumps(ld)); allerr+=errs
        r=await ev(pg,"()=>[!document.querySelector('#cloudAsk').hidden,document.querySelector('#cloudAsk').innerText.includes('다른 모험')]")
        rec('옛 세이브','판 번호 없는 옛 세이브끼리는 처음 한 번 물어봄', r==[True,True], str(r))
        await pg.tap('#cloudAsk [data-cl=keep]'); await pg.wait_for_timeout(500)
        c=await ev(pg,cloud_of); lr=await ev(pg,"()=>JSON.parse(localStorage.getItem('lantern-tree-save-v1')).run||''")
        rec('옛 세이브','이 기기 것 쓰기 → 양쪽에 같은 판 번호가 붙음', bool(c.get('run')) and (lr=='' or lr==c['run']), [c.get('run'),lr])
        await pg.tap('#btnContinue'); await pg.wait_for_timeout(500)
        await ev(pg,"()=>{__T.addItem('crystal',2);window.dispatchEvent(new Event('pagehide'))}"); await pg.wait_for_timeout(200)
        await pg.reload(); await pg.wait_for_timeout(900)
        r=await ev(pg,"()=>[document.querySelector('#cloudAsk').hidden,JSON.parse(localStorage.getItem('lantern-tree-save-v1')).run]")
        c=await ev(pg,cloud_of)
        rec('옛 세이브','다시 열면 같은 모험으로 알아보고 묻지 않음', r[0] is True and r[1]==c['run'], str([r,c['run']]))
        await ctx.close()

        rec('기능','콘솔 오류 없음', not allerr, allerr[:3])
        await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
