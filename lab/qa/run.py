# 실험판 테스트 (짧게 — 1~2분): python3 lab/qa/run.py
# 먼저 실험판을 묶고(lab/build.py) 브라우저로 열어 확인해요. 본 게임 테스트(dev/qa)와 따로예요.
# 흔들리지 않게: 게임 안의 일은 실제 시계 대신 __lab.step(초, 조작)으로 게임 시간을 정해진 만큼 진행해요 (js/lab/main.js).
# 결과: 맨 끝 한 줄 요약 + lab/qa/out/summary.txt, 실패가 있으면 종료 코드 1. 화면 사진은 lab/qa/out/*.png
import asyncio, functools, http.server, os, subprocess, sys, threading, time
from playwright.async_api import async_playwright

QA = os.path.dirname(os.path.abspath(__file__)); LAB = os.path.dirname(QA); OUT = os.path.join(QA, 'out'); os.makedirs(OUT, exist_ok=True)
SEED = 20261025
RES = []
def rec(name, ok, detail=''):
    RES.append((name, bool(ok), detail)); print(('PASS' if ok else 'FAIL'), name, '|', detail, flush=True)

class _Q(http.server.SimpleHTTPRequestHandler):
    def end_headers(self): self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def log_message(self, *a): pass

# 빈 굴에서 바라보는 쪽 바로 앞이 원하는 벽인 자리 찾기 (지도 모양에 기대지 않게 브라우저 안에서 찾아요)
FIND = """(want)=>{const G=__lab.G,N=Math.round(Math.sqrt(G.wall.length)),id=(x,y)=>y*N+x;
 for(let r=0;r<40;r++)for(let y=100-r;y<=100+r;y++)for(let x=100-r;x<=100+r;x++){const i=id(x,y);
  if(G.wall[i]||G.floor[i]===10||G.wall[id(x+1,y)]!==want)continue;
  if(G.wall[id(x,y-1)]||G.wall[id(x,y+1)]||G.wall[id(x-1,y)])continue; return [x,y];}
 return null}"""
STAND = """([x,y])=>{const G=__lab.G;G.p.x=x+.5;G.p.y=y+.6;G.p.face={x:1,y:0};G.digCd=0;}"""


# ---------- L2: 이끼 동굴 + 상점 (재미중심.md 13장) ----------
async def l2_checks(ev, pg):
    st = await ev("""()=>{const G=__lab.G,ts=[];for(const [i,o] of G.objs)if(o.t!=='_part')ts.push(o.t);
      return {bench:ts.includes('bench'),counter:[...G.objs.values()].some(o=>o.counter),shelves:G.shelves.length,gate:[...G.objs.values()].some(o=>o.gate),smith:G.smith.at,gold:G.gold,cats:G.cats}}""")
    rec('l2_base_ready', st['bench'] and st['counter'] and st['shelves'] == 2 and st['gate'] and st['smith'] == 'shelter' and st['gold'] == 0 and st['cats'] == ['raw', 'basic'], str(st))
    # 거점에서 발견 공간 입구까지 걸어서 닿음 (막힌 벽 2칸 앞까지)
    reach = await ev("""()=>{const G=__lab.G,N=200,id=(x,y)=>y*N+x,seen=new Uint8Array(N*N),q=[[100,103]];seen[id(100,103)]=1;
      while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy,i=id(X,Y);if(seen[i]||G.wall[i]||G.floor[i]===10)continue;const o=G.objs.get(i);if(o&&o.t!=='torch')continue;seen[i]=1;q.push([X,Y]);}}
      const out={};for(const [k,e] of [['grove',[85,92]],['vein',[117,93]],['shelter',[86,110]],['vault',[122,105]]])out[k]=!!seen[id(e[0],e[1])];return out}""")
    rec('l2_rooms_reachable', all(reach.values()), str(reach))
    # 뿌리기둥 베기 → 나무
    w = await ev("""()=>{const L=__lab,G=L.G;let a=-1;for(const [i,o] of G.objs)if(o.t==='root'){a=i;break;}const x=a%200,y=(a/200)|0;G.objs.forEach(()=>{});
      G.p.x=x+.5;G.p.y=y+1.6;G.p.face={x:0,y:-1};const b=G.bag.wood||0;L.step(1.2,{act:true});L.step(.05);return {gone:!G.objs.has(a),b,a2:G.bag.wood||0}}""")
    rec('l2_chop_root_wood', w['gone'] and w['a2'] > w['b'], str(w))
    # 작업대에서 횃불 만들기 (나무 1 → 횃불 2)
    cr = await ev("""()=>{const L=__lab,G=L.G;G.bag.wood=(G.bag.wood||0)+1;const w0=G.bag.wood,t0=G.bag.torch||0;L.runCmd({k:'craft',id:'torch'});return {dw:w0-(G.bag.wood||0),dt:(G.bag.torch||0)-t0}}""")
    rec('l2_craft_torch', cr['dw'] == 1 and cr['dt'] == 2, str(cr))
    # 진열 → 손님이 와서 삼 (거점 안, 60초) → 돈·장부
    sale = await ev("""()=>{const L=__lab,G=L.G;G.p.x=100.5;G.p.y=103.6;G.bag.copperOre=10;L.runCmd({k:'shelfPut',s:0,id:'copperOre',n:10});const pr=G.shelves[0].price;L.step(60);
      return {pr,gold:G.gold,sold:G.sold,left:G.shelves[0].n,ledger:G.ledger.copperOre}}""")
    rec('l2_customers_buy', sale['gold'] > 0 and sale['sold'] >= 3 and sale['left'] <= 10 - sale['sold'] and sale['ledger'] and sale['ledger']['ok'] == sale['pr'], str(sale))
    # 너무 비싸면 안 사고 장부에 「비싸대요」
    hi = await ev("""()=>{const L=__lab,G=L.G;const s=G.shelves[0];s.price=40;const g0=G.gold,n0=s.n;L.step(50);return {g0,g1:G.gold,n0,n1:s.n,no:(G.ledger.copperOre||{}).no}}""")
    rec('l2_too_pricey_refused', hi['g1'] == hi['g0'] and hi['n1'] == hi['n0'] and hi['no'] == 40, str(hi))
    # 가게를 비우면 손님이 드물게 · 꾸미면 조금 자주
    gap = await ev("""()=>{const L=__lab,G=L.G;G.p.x=100.5;G.p.y=103.6;const here=L.shop.custGap();G.p.x=85.5;G.p.y=97.6;const away=L.shop.custGap();G.p.x=100.5;G.p.y=103.6;
      G.bag.chair=1;G.p.face={x:0,y:1};L.runCmd({k:'place',id:'chair'});const dec=L.shop.decorCount(),here2=L.shop.custGap();return {here,away,dec,here2}}""")
    rec('l2_away_slower_decor_faster', gap['away'] > gap['here'] * 2 and gap['dec'] == 1 and gap['here2'] < gap['here'], str(gap))
    # 금속 물건은 대장장이 전엔 사 갈 손님이 없음
    pre = await ev("()=>__lab.shop.wantedNow('metal')")
    # 대장장이 쉼터: 입구 흙벽 2칸 캐기 → 말 걸기 → 마을로, 금속 손님 열림
    sm = await ev("""()=>{const L=__lab,G=L.G;G.p.x=86.5;G.p.y=110.6;G.p.face={x:-1,y:0};L.step(1,{act:true});G.p.x=85.5;L.step(1,{act:true});
      G.p.x=80.8;G.p.y=110.6;G.p.face={x:-1,y:0};L.step(.1);L.step(.05,{act:true});L.step(.1);return {at:G.smith.at,metal:L.shop.wantedNow('metal'),room:!!G.opened.shelter,sheet:!document.getElementById('sheetWrap').hidden}}""")
    rec('l2_smith_joins', (not pre) and sm['at'] == 'village' and sm['metal'] and sm['room'] and sm['sheet'], f'전 {pre} · {sm}')
    await ev("()=>{const b=document.querySelector('#sheet [data-x]');if(b)b.click()}")
    # 레시피 사기: 돈이 모자라면 안 됨 → 돈이 있으면 됨 (마을의 대장장이에게 말 걸어서)
    buy = await ev("""()=>{const L=__lab,G=L.G;G.gold=40;L.runCmd({k:'buyRecipe',id:'pickCopper'});const r0=G.recipes.includes('pickCopper');G.gold=130;
      G.p.x=96.5;G.p.y=101.0;G.p.face={x:0,y:-1};L.step(.1);L.step(.05,{act:true});const t=(document.querySelector('#sheet h2')||{}).textContent;document.querySelector('[data-buy=pickCopper]').click();document.querySelector('#sheet [data-x]').click();
      return {r0,t,r1:G.recipes.includes('pickCopper'),gold:G.gold}}""")
    rec('l2_buy_recipe', (not buy['r0']) and buy['t'] == '대장장이 하람' and buy['r1'] and buy['gold'] == 30, str(buy))
    # 구리 곡괭이 만들기 → 돌벽 4번 · 흙벽 2번
    pk = await ev("""()=>{const L=__lab,G=L.G;G.bag.copperOre=6;G.bag.wood=2;L.runCmd({k:'craft',id:'pickCopper'});return {pick:G.pick,ore:G.bag.copperOre||0}}""")
    stone = await ev(FIND, 2); await ev(STAND, stone); i = stone[1] * 200 + stone[0] + 1
    sd = await ev(f"()=>{{__lab.step({0.28 * 2 + .02},{{act:true}});const mid=__lab.G.wall[{i}];__lab.step(.3,{{act:true}});__lab.step(.05);return {{mid,end:__lab.G.wall[{i}],stone:__lab.G.bag.stone||0}}}}")
    rec('l2_copper_pick_digs_stone', pk['pick'] == 'pickCopper' and pk['ore'] == 0 and sd['mid'] == 2 and sd['end'] == 0 and sd['stone'] > 0, f'{pk} · {sd}')
    # 돌벽 너머 방: 입구 돌벽 2칸 → 상자 열기 → 버섯 램프
    vt = await ev("""()=>{const L=__lab,G=L.G;G.p.x=122.5;G.p.y=105.6;G.p.face={x:1,y:0};L.step(1.3,{act:true});G.p.x=123.5;L.step(1.3,{act:true});
      G.p.x=127.5;G.p.y=105.6;G.p.face={x:0,y:-1};L.step(.1);L.step(.05,{act:true});L.step(.05);return {lamp:G.bag.lampShroom||0,room:!!G.opened.vault}}""")
    rec('l2_vault_loot', vt['lamp'] == 1 and vt['room'], str(vt))
    # 버섯 군락 단서: 입구 벽이 있는 동안 가까이 가면 초록 포자가 피어올라요
    sp = await ev("""()=>{const L=__lab,G=L.G;G.p.x=85.5;G.p.y=93.6;G.parts.length=0;L.step(1.6);return G.parts.filter(q=>q.col==='#9ff07a'||q.col==='#d9ffb8').length}""")
    rec('l2_spore_clue', sp > 0, f'포자 {sp}')
    # 진열대 창: 진열대를 바라보고 누르면 창이 열리고 + 버튼으로 값이 올라요
    ui = await ev("""()=>{const L=__lab,G=L.G;G.bag.wood=5;L.runCmd({k:'shelfTake',s:1});L.runCmd({k:'shelfPut',s:1,id:'wood',n:5});G.p.x=102.5;G.p.y=101.6;G.p.face={x:0,y:-1};L.step(.1);L.step(.05,{act:true});
      const p0=G.shelves[1].price,b=document.querySelector('[data-pd="1"]');if(b)b.click();const p1=G.shelves[1].price;const t=(document.querySelector('#sheet h2')||{}).textContent;document.querySelector('#sheet [data-x]').click();return {t,p0,p1}}""")
    rec('l2_shelf_panel', ui['t'] and '진열대' in ui['t'] and ui['p1'] > ui['p0'], str(ui))
    await pg.screenshot(path=os.path.join(OUT, 'l2_shop.png'))

async def main():
    t0 = time.time()
    r = subprocess.run([sys.executable, os.path.join(LAB, 'build.py')], capture_output=True, text=True)
    rec('build', r.returncode == 0, (r.stdout + r.stderr).strip().splitlines()[-1] if (r.stdout + r.stderr).strip() else '')
    if r.returncode != 0: return finish(t0)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(_Q, directory=LAB)); threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/index.html?seed={SEED}'
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for light in ('force', 'old'):  # 새 빛(그래픽 칩 흉내)과, 새 빛이 꺼진 기기(어둠 그림) 둘 다
            ctx = await b.new_context(viewport={'width': 402, 'height': 874}, device_scale_factor=2, has_touch=True, is_mobile=True)
            if light == 'force': await ctx.add_init_script("try{localStorage.setItem('lantern-tree-light','force')}catch(e){}")
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            await pg.goto(url); await pg.wait_for_function('window.__lab', timeout=20000); await pg.wait_for_timeout(600)
            await pg.click('#btnNew'); await pg.wait_for_timeout(800)
            ev = pg.evaluate
            if light == 'force':
                info = await ev("()=>{const G=__lab.G;return {x:G.p.x,y:G.p.y,t:G.bag.torch,start:G.wall[100*200+100]}}")
                rec('start_room_open', info['start'] == 0 and info['t'] == 6, str(info))
                # 걷기: 오른쪽으로 0.5초 → 조금이라도 움직여야 해요 (거점은 열려 있어요)
                x0 = info['x']; await ev("()=>__lab.step(.5,{mx:1})"); x1 = await ev("()=>__lab.G.p.x")
                rec('walk_moves', 0.3 < x1 - x0 <= 2.3, f'{x1 - x0:.2f}칸 / 0.5초')
                # 벽은 못 지나감: 같은 자리에서 왼쪽 벽 쪽으로 오래 걸어도 벽 칸에 들어가지 않음
                inwall = await ev("()=>{__lab.step(3,{mx:-1});const G=__lab.G;return G.wall[Math.floor(G.p.y)*200+Math.floor(G.p.x)]}")
                rec('walls_block', inwall == 0, f'벽 번호 {inwall}')
                # 캐기 (기본 곡괭이): 흙벽 3번 · 구리 광맥 4번, 1번 쳤을 때는 금(wdmg) — 캐면 가방에 흙·구리광석
                for want, hits, item in ((1, 3, 'dirt'), (4, 4, 'copperOre')):
                    spot = await ev(FIND, want)
                    if not spot: rec(f'dig_wall_{want}', False, '자리를 못 찾음'); continue
                    await ev(STAND, spot); i = (spot[1]) * 200 + spot[0] + 1
                    before = await ev(f"()=>__lab.G.bag['{item}']||0")
                    one = await ev(f"()=>{{__lab.step(.05,{{act:true}});return __lab.G.wdmg.get({i})||0}}")
                    left = await ev(f"()=>{{__lab.step({0.28 * (hits - 1) + .02},{{act:true}});__lab.step(.05);return __lab.G.wall[{i}]}}")
                    after = await ev(f"()=>__lab.G.bag['{item}']||0")
                    rec(f'dig_wall_{want}', one == 1 and left == 0 and after > before, f'{hits}번 만에: 첫 번째 금 {one}, 끝난 뒤 벽 {left}, 가방 {item} {before}→{after}')
                # 돌벽은 기본 곡괭이로 못 캠 (재미중심 12장)
                stone = await ev(FIND, 2)
                await ev(STAND, stone); left = await ev(f"()=>{{__lab.step(2,{{act:true}});__lab.step(.05);return __lab.G.wall[{stone[1] * 200 + stone[0] + 1}]}}")
                rec('stone_needs_copper_pick', left == 2, f'벽 {left}')
                # 암반은 못 캠
                rock = await ev("""()=>{const G=__lab.G,N=200;for(let y=0;y<N;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(!G.wall[i]&&G.wall[i+1]===8&&G.floor[i]!==10&&!G.objs.has(i))return [x,y];}return null}""")
                if rock:
                    await ev(STAND, rock); left = await ev(f"()=>{{__lab.step(2,{{act:true}});__lab.step(.05);return __lab.G.wall[{rock[1] * 200 + rock[0] + 1}]}}")
                    rec('bedrock_stays', left == 8, f'벽 {left}')
                else: rec('bedrock_stays', False, '암반 옆 빈칸이 없음')
                # 횃불: 발밑에 놓으면 가방 횃불이 줄고 그 칸에 횃불
                tl = await ev("""()=>{const G=__lab.G;G.p.x=100.5;G.p.y=102.6;const before=G.bag.torch;__lab.runCmd({k:'torch'});__lab.step(.2);
                  return {before,after:G.bag.torch,obj:(G.objs.get(102*200+100)||{}).t}}""")
                rec('torch_place', tl['before'] - tl['after'] == 1 and tl['obj'] == 'torch', str(tl))
                # 횃불 버튼: 손가락이 닿는 순간(pointerdown)만으로 놓여야 해요 (L1.1 버그 수정)
                pd = await ev("""()=>{const G=__lab.G;G.p.x=100.5;G.p.y=101.6;__lab.step(.1);const before=G.bag.torch,b=document.getElementById('torchBtn');
                  b.dispatchEvent(new PointerEvent('pointerdown',{pointerId:5,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true}));return {before,after:G.bag.torch}}""")
                rec('torch_button_touch', pd['before'] - pd['after'] == 1, str(pd))
                st = await ev("()=>document.getElementById('torchN').textContent")
                rec('torch_count_shown', st == str(pd['after']), f'버튼 숫자 {st}')
                await l2_checks(ev, pg)
            # 화면이 그려지는지 (검은 화면이 아닌지): 세계 캔버스 가운데 밝기
            await ev("()=>{const G=__lab.G;G.p.x=100.5;G.p.y=100.6;__lab.step(.5);__lab.release()}"); await pg.wait_for_timeout(700)
            lum = await ev("""()=>{const c=document.getElementById('wcv'),g=c.getContext('2d'),d=g.getImageData(c.width/2-20,c.height/2-20,40,40).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i]+d[i+1]+d[i+2];return s/(d.length/4)/3}""")
            gl = await ev("()=>{try{return (typeof glDebug==='function')}catch(e){return null}}")
            rec(f'draws_{light}', lum > 12, f'가운데 밝기 {lum:.0f}')
            await pg.screenshot(path=os.path.join(OUT, f'play_{light}.png'))
            rec(f'no_errors_{light}', not errs, '; '.join(errs[:3])[:300])
            await ctx.close()
        await b.close()
    finish(t0)

def finish(t0):
    n = len(RES); bad = [r for r in RES if not r[1]]
    line = f'실험판 QA: 점검 {n}개 중 {n - len(bad)}개 통과 · {time.time() - t0:.0f}초' + (' · 실패: ' + ', '.join(r[0] for r in bad) if bad else '')
    open(os.path.join(OUT, 'summary.txt'), 'w').write(line + '\n' + '\n'.join(f"{'PASS' if ok else 'FAIL'} {nm} | {d}" for nm, ok, d in RES) + '\n')
    print(line); sys.exit(1 if bad else 0)

asyncio.run(main())
