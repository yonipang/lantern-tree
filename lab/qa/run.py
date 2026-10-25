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
                info = await ev("()=>{const G=__lab.G;return {x:G.p.x,y:G.p.y,t:G.torches,start:G.wall[100*200+100]}}")
                rec('start_room_open', info['start'] == 0 and info['t'] == 6, str(info))
                # 걷기: 오른쪽으로 1초 → 4.4칸 안팎 (벽에 막히면 덜) — 시작 방이 열려 있으니 조금이라도 움직여야 해요
                x0 = info['x']; await ev("()=>__lab.step(.5,{mx:1})"); x1 = await ev("()=>__lab.G.p.x")
                rec('walk_moves', 0.3 < x1 - x0 <= 2.3, f'{x1 - x0:.2f}칸 / 0.5초')
                # 벽은 못 지나감: 같은 자리에서 왼쪽 벽 쪽으로 오래 걸어도 벽 칸에 들어가지 않음
                inwall = await ev("()=>{__lab.step(3,{mx:-1});const G=__lab.G;return G.wall[Math.floor(G.p.y)*200+Math.floor(G.p.x)]}")
                rec('walls_block', inwall == 0, f'벽 번호 {inwall}')
                # 캐기: 흙벽(1) 앞에서 누르고 있으면 3번 만에 부서짐 (0.28초 간격 → 0.9초 안), 1번 쳤을 때는 금(wdmg)
                for want, hits in ((1, 3), (2, 5), (4, 4)):
                    spot = await ev(FIND, want)
                    if not spot: rec(f'dig_wall_{want}', False, '자리를 못 찾음'); continue
                    await ev(STAND, spot); i = (spot[1]) * 200 + spot[0] + 1
                    one = await ev(f"()=>{{__lab.step(.05,{{act:true}});return __lab.G.wdmg.get({i})||0}}")
                    left = await ev(f"()=>{{__lab.step({0.28 * (hits - 1) + .02},{{act:true}});return __lab.G.wall[{i}]}}")
                    rec(f'dig_wall_{want}', one == 1 and left == 0, f'{hits}번 만에: 첫 번째 금 {one}, 끝난 뒤 벽 {left}')
                # 암반은 못 캠
                rock = await ev("""()=>{const G=__lab.G,N=200;for(let y=0;y<N;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(!G.wall[i]&&G.wall[i+1]===8&&G.floor[i]!==10)return [x,y];}return null}""")
                if rock:
                    await ev(STAND, rock); left = await ev(f"()=>{{__lab.step(2,{{act:true}});return __lab.G.wall[{rock[1] * 200 + rock[0] + 1}]}}")
                    rec('bedrock_stays', left == 8, f'벽 {left}')
                else: rec('bedrock_stays', False, '암반 옆 빈칸이 없음')
                # 횃불: 발밑에 놓으면 개수가 줄고 둘레가 밝아짐 (규칙상 밝기 lightAt)
                tl = await ev("""()=>{const G=__lab.G;G.p.x=100.5;G.p.y=100.6;const before=G.torches;__lab.runCmd({k:'torch'});__lab.step(.2);
                  return {before,after:G.torches,obj:(G.objs.get(100*200+100)||{}).t}}""")
                rec('torch_place', tl['before'] - tl['after'] == 1 and tl['obj'] == 'torch', str(tl))
                # 횃불 버튼: 손가락이 닿는 순간(pointerdown)만으로 놓여야 해요 — 폰에서 「클릭」이 안 올 때도 (L1.1 버그 수정)
                pd = await ev("""()=>{const G=__lab.G;G.p.x=100.5;G.p.y=101.6;__lab.step(.1);const before=G.torches,b=document.getElementById('torchBtn');
                  b.dispatchEvent(new PointerEvent('pointerdown',{pointerId:5,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true}));return {before,after:G.torches}}""")
                rec('torch_button_touch', pd['before'] - pd['after'] == 1, str(pd))
                st = await ev("()=>document.getElementById('torchN').textContent")
                rec('torch_count_shown', st == str(tl['after'] - 1), f'버튼 숫자 {st}')
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
