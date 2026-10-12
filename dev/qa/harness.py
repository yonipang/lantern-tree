# 테스트 공통 도구: 게임 페이지 만들기(mkpage), 새 게임 시작(new_ctx), 누르기(tap·hold), 실행(ev), 자리 잡기(stand), 결과 기록(rec)
# 테스트 파일(test_*.py)은 맨 위에서 `from harness import *`로 가져다 써요. 실행은 run.py
import asyncio, json, os, random, sys
from playwright.async_api import async_playwright
QA=os.path.dirname(os.path.abspath(__file__))
# 테스트마다 따로 쓰는 폴더 (run.py가 QA_OUT으로 정해 줘요). 동시에 여러 테스트를 돌려도 서로 덮어쓰지 않아요
SP=os.environ.get('QA_OUT') or os.path.join(QA,'out')+'/'; os.makedirs(SP, exist_ok=True)
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
 const els={bars:q('#hud .bars'),side:q('#hud .side'),hotbar:q('#hotbar'),belt:q('#subBtn'),act:q('#actBtn'),joy:q('#joy'),hint:q('#pcHint'),toast:q('#toasts')};
 const ov=(a,b)=>a&&b&&a.x<b.r-1&&b.x<a.r-1&&a.y<b.b-1&&b.y<a.b-1;
 const pairs=[['bars','side'],['hotbar','belt'],['hotbar','act'],['belt','act'],['side','belt'],['side','act'],['bars','belt'],['joy','belt'],['joy','bars'],['joy','act'],['joy','hotbar'],['hint','hotbar'],['hint','belt'],['toast','belt'],['toast','act']];
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
    await pg.goto('file://'+SP+'qa.html'); await pg.wait_for_timeout(400)
    await pg.click("#btnNew"); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(500)
    return ctx,pg,errs

async def tap(pg, n=1, gap=330):
    for _ in range(n):
        await pg.dispatch_event('#actBtn','pointerdown',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(60)
        await pg.dispatch_event('#actBtn','pointerup',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(gap)
async def hold(pg, ms):
    await pg.dispatch_event('#actBtn','pointerdown',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(ms)
    await pg.dispatch_event('#actBtn','pointerup',{'pointerId':1,'pointerType':'touch','isPrimary':True}); await pg.wait_for_timeout(150)
async def ev(pg, js, arg=None): return await pg.evaluate(js, arg) if arg is not None else await pg.evaluate(js)
async def stand(pg, x, y, fx, fy, sel=None):
    await ev(pg, f"()=>{{const G=__T.G;G.p.sit=null;G.fish=null;G.enemies.length=0;G.p.x={x};G.p.y={y};G.p.face={{x:{fx},y:{fy}}};G.p.hp=100;G.p.hunger=100;{'G.sel='+str(sel)+';' if sel is not None else ''}}}")
    await pg.wait_for_timeout(120)
