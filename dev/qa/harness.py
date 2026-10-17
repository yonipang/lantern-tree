# 테스트 공통 도구: 게임 페이지 만들기(mkpage), 새 게임 시작(new_ctx), 누르기(tap·hold), 실행(ev), 자리 잡기(stand), 결과 기록(rec)
# 테스트 파일(test_*.py)은 맨 위에서 `from harness import *`로 가져다 써요. 실행은 run.py
import asyncio, json, os, random, sys
from playwright.async_api import async_playwright
QA=os.path.dirname(os.path.abspath(__file__))
# 테스트마다 따로 쓰는 폴더 (run.py가 QA_OUT으로 정해 줘요). 동시에 여러 테스트를 돌려도 서로 덮어쓰지 않아요
SP=os.environ.get('QA_OUT') or os.path.join(QA,'out')+'/'; os.makedirs(SP, exist_ok=True)
# 테스트 페이지는 이 컴퓨터 안의 작은 웹 서버(http://127.0.0.1)로 열어요. file://로 열면 바쁠 때 다시 열거나 새 페이지를 열면서
# 앞 페이지가 쓴 localStorage가 사라지는 일이 있었어요(저장·클라우드 테스트 cloud_sync·play_time_cloud가 가끔 실패하던 원인). 실제 게임도 https로 돌아요
import functools, http.server, threading
class _NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self): self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def send_head(self):
        if 'If-Modified-Since' in self.headers: del self.headers['If-Modified-Since']  # 테스트 중에 페이지 파일을 다시 쓰기도 해서 늘 새로 읽어요
        return super().send_head()
    def log_message(self, *a): pass
_srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(_NoCache,directory=SP))
threading.Thread(target=_srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{_srv.server_address[1]}/'  # SP 폴더의 파일 주소: URL+'qa.html'
# 테스트할 게임 파일: run.py가 dev/src를 묶은 dev/index.html (QA_SRC로 다른 파일을 줄 수도 있어요, 예: 옛 버전과 비교)
SRC=os.environ.get('QA_SRC') or os.path.join(QA,'..','index.html')
HOOK="window.__T={get G(){return G},CX,CY,BX,BY,SA,SB,idx,addItem,openPanel,closePanel,decide,serialize,deserialize,WATER,BOSSES,bestPick,lightAt,countItem,OBJ,ITEMS,computeLight};window.claude?.hot?.snapshot"
def mkpage(src,out,hook=None,layout=1):
    html=open(src).read().replace("window.claude?.hot?.snapshot",hook or HOOK,1)
    # v47: new games get the 600x600 ring map; the older tests pin the original 200x200 map (layout 1) unless they ask for 2
    pin='<script>try{localStorage.setItem("lantern-tree-layout","%d")}catch(e){}</script>' % layout
    open(SP+out,'w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+pin+'</head><body>'+html+'</body></html>')
RES=[]
def rec(area,name,ok,detail=''):
    RES.append((area,name,bool(ok),detail)); print(('PASS' if ok else 'FAIL'),area,'|',name,'|',detail)

LAYOUT_JS="""()=>{
 const q=s=>{const e=document.querySelector(s); if(!e) return null; const cs=getComputedStyle(e); if(e.hidden||cs.display==='none'||cs.visibility==='hidden') return null; const r=e.getBoundingClientRect(); return r.width?{x:r.left,y:r.top,w:r.width,h:r.height,r:r.right,b:r.bottom}:null};
 const els={bars:q('#hud .stat'),boss:q('#bossbar'),side:q('#hud .side'),hotbar:q('#hotbar'),belt:q('#subBtn'),act:q('#actBtn'),atk:q('#atkBtn'),sk:q('#skBar'),joy:q('#joy'),hint:q('#pcHint'),toast:q('#toasts')};
 const ov=(a,b)=>a&&b&&a.x<b.r-1&&b.x<a.r-1&&a.y<b.b-1&&b.y<a.b-1;
 const pairs=[['bars','side'],['hotbar','belt'],['hotbar','act'],['belt','act'],['side','belt'],['side','act'],['bars','belt'],['joy','belt'],['joy','bars'],['joy','act'],['joy','hotbar'],['hint','hotbar'],['hint','belt'],['toast','belt'],['toast','act'],['atk','act'],['atk','hotbar'],['atk','belt'],['atk','sk'],['sk','act'],['sk','hotbar'],['joy','atk'],['joy','sk'],['side','atk'],['bars','boss'],['boss','side'],['hotbar','sk'],['joy','sk']];
 const over=pairs.filter(([a,b])=>ov(els[a],els[b])).map(p=>p.join('/'));
 const out=Object.entries(els).filter(([k,v])=>v&&(v.x<-1||v.y<-1||v.r>innerWidth+1||v.b>innerHeight+1)&&k!=='joy').map(([k])=>k);
 const slots=[...document.querySelectorAll('#hotbar .slot')].map(e=>Math.round(e.getBoundingClientRect().width));
 const actW=els.act?els.act.w:0;
 return {over,out,minSlot:Math.min(...slots),actW,hscroll:document.documentElement.scrollWidth>innerWidth}
}"""

async def new_ctx(b, w, h, touch):
    ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=2 if touch else 1,has_touch=touch,is_mobile=touch)
    pg=await ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text and 'fonts' not in m.text else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto(URL+'qa.html'); await pg.wait_for_timeout(400)
    await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(500)
    return ctx,pg,errs

async def tap(pg, n=1, gap=330):
    for _ in range(n):
        await pg.dispatch_event('#actBtn','pointerdown',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(60)
        await pg.dispatch_event('#actBtn','pointerup',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(gap)
async def atk(pg, n=1, gap=330):  # v65: the attack button
    for _ in range(n):
        await pg.dispatch_event('#atkBtn','pointerdown',{'pointerId':2,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(60)
        await pg.dispatch_event('#atkBtn','pointerup',{'pointerId':2,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(gap)
async def hold(pg, ms):
    await pg.dispatch_event('#actBtn','pointerdown',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(ms)
    await pg.dispatch_event('#actBtn','pointerup',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(150)
async def ev(pg, js, arg=None): return await pg.evaluate(js, arg) if arg is not None else await pg.evaluate(js)
async def stand(pg, x, y, fx, fy, sel=None):
    await ev(pg, f"()=>{{const G=__T.G;G.p.sit=null;G.fish=null;G.enemies.length=0;G.p.x={x};G.p.y={y};G.p.face={{x:{fx},y:{fy}}};G.p.hp=100;G.p.hunger=100;{'G.sel='+str(sel)+';' if sel is not None else ''}}}")
    await pg.wait_for_timeout(120)

# ---- 흔들리지 않게 기다리는 도구 ----
# 게임은 한 프레임에 최대 0.05초씩만 진행해요. 컴퓨터가 바쁘면 실제로 4초를 기다려도 게임 안에서는 4초가 안 지나요.
# 게임 안의 일(재생·성장·이동 …)을 기다릴 때는 wait_for_timeout 대신 wait_game을 써요.
async def wait_game(pg, sec, timeout=30000):
    """게임 안 시간(G.time)이 sec초 지날 때까지 기다려요 (창이 열려 게임이 멈춰 있으면 timeout까지 기다리다 오류)"""
    t0 = await pg.evaluate("()=>__T.G.time")
    await pg.wait_for_function("([t0,s])=>__T.G.time-t0>=s", arg=[t0, sec], timeout=timeout, polling=50)

async def wait_until(pg, js, timeout=10000):
    """브라우저 안의 조건(js: '()=>…')이 참이 될 때까지 기다려요. 시간 안에 안 되면 False (오류로 멈추지 않고, 뒤의 rec가 실패로 기록해요)"""
    try: await pg.wait_for_function(js, timeout=timeout, polling=50); return True
    except Exception: return False
