# 게임 위키 만들기: python3 dev/wiki/build_wiki.py
# dev/src/를 묶은 dev/index.html을 브라우저에서 열어 게임 데이터(아이템·제작법·몬스터·퀘스트 …)와 아이콘을 뽑고,
# dev/wiki/template.html에 넣어 wiki.html(저장소 맨 위)을 만들어요. 게임을 고친 뒤 다시 돌리면 위키도 맞춰져요.
import asyncio, json, os, re, subprocess, sys
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
DEV = os.path.dirname(HERE)
ROOT = os.path.dirname(DEV)
OUT = os.path.join(DEV, 'qa', 'out'); os.makedirs(OUT, exist_ok=True)

NAMES = ('ITEMS,OBJ,RECIPES,ENEMY,BOSSES,GUIDE,QSIDE,SKILLS,SK_CAT,STATN,ANIMALS,RINGS,REGION_MAT,WALLS,BIOME,CATCH,STN,RARITY,RAR,'
         'TIERNAME,BENCH_N,GEAR_N,DISH,EFF,BUFF_DUR,REMATCH,UNIQ_OF,ACC_OF,SPR,CROP_SOIL,SOIL_N,STAR_OF,MAX_LV,BAG_UPS,MULTI,iconURL,buffText,noteHint,animalImg,TIPS,KNOWN0')
HOOK = 'window.__W=()=>({%s});window.claude?.hot?.snapshot' % NAMES

def version():
    try:
        s = subprocess.run(['git', '-C', ROOT, 'log', '-50', '--format=%s'], capture_output=True, text=True).stdout
        for line in s.splitlines():  # 가장 최근 게임 버전 커밋 (v56: … 처럼 시작)
            m = re.match(r'(v\d+)\b', line.strip())
            if m: return m.group(1)
        return ''
    except Exception: return ''

async def extract():
    sys.path.insert(0, DEV); import build; build.main()  # dev/src/ → dev/index.html
    src = open(os.path.join(DEV, 'index.html'), encoding='utf-8').read().replace('window.claude?.hot?.snapshot', HOOK, 1)
    page = os.path.join(OUT, 'wiki_src.html')
    open(page, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"></head><body>' + src + '</body></html>')
    js = open(os.path.join(HERE, 'extract.js'), encoding='utf-8').read()
    js = js[js.index('async () =>'):]
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 800, 'height': 900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + page); await pg.wait_for_timeout(500)
        await pg.click('#btnNew'); await pg.evaluate("()=>{const g=document.getElementById('charGo');if(g&&!g.closest('[hidden]'))g.click()}"); await pg.wait_for_timeout(600)
        data = await pg.evaluate(js)
        await b.close()
    if errs: print('page errors:', errs[:3])
    return data

def main():
    data = asyncio.run(extract())
    data['ver'] = version()
    tpl = open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    html = tpl.replace('/*@@DATA*/null', blob, 1)
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'wiki.html')
    open(out, 'w', encoding='utf-8').write(html)
    print('wiki', data['ver'], '·', len(data['items']), 'items ·', len(data['recipes']), 'recipes ·', len(data['enemies']), 'monsters →', out, f'({len(html)//1024} KB)')

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        d = asyncio.run(extract()); json.dump(d, open(os.path.join(OUT, 'wiki.json'), 'w'), ensure_ascii=False); print('ok')
    else: main()
