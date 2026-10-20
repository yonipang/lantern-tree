# 비교 테스트(스냅샷): 게임 데이터와 세이브 불러오기 결과가 예전과 똑같은지 1분 안에 확인해요.
# 사용법: python3 dev/qa/snapshot.py            → 기록(dev/qa/snapshot/)과 비교. 다르면 무엇이 바뀌었는지 보여 줘요
#         python3 dev/qa/snapshot.py --update   → 지금 상태를 새 기록으로 저장 (일부러 바꾼 뒤에만!)
#         python3 dev/qa/snapshot.py --fixtures → LEGACY에 새로 넣은 옛 세이브 사례를 snapshot/fixtures.json에 추가 (이미 있는 세이브는 그대로)
#
# 기록하는 것
#  1) data.json   : 아이템·물체·레시피(순서 포함)·몬스터·보스·퀘스트·스킬·요리 …의 값, 그림(스프라이트·아이콘)의 지문
#  2) saves.json  : snapshot/fixtures.json의 세이브(옛 버전 v1~v3, v62, 옛 기능이 남은 세이브 …)를 불러온 뒤 다시 저장한 결과
# 구조를 정리하거나 코드를 옮긴 뒤 이 테스트가 통과하면 밸런스·순서·그림·세이브 호환이 그대로라는 뜻이에요.
import asyncio, hashlib, json, os, sys
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
DEV = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
SNAP = os.path.join(HERE, 'snapshot')
FIXTURES = os.path.join(SNAP, 'fixtures.json')  # {이름: 세이브 JSON 글자}

# 무작위·시간을 고정해서 몇 번을 돌려도 같은 결과가 나오게 해요 (게임 코드보다 먼저 실행)
FIX = """<script>(()=>{let a=1234567;const r=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
Math.random=r;window.__seed=s=>{a=s};const T0=1760000000000;Date.now=()=>T0;try{localStorage.clear();localStorage.setItem('lantern-tree-layout','%d')}catch(e){}})()</script>"""

REG = ('ITEMS,OBJ,RECIPES,ENEMY,BOSSES,GUIDE,QSIDE,SKILLS,SK_CAT,STATN,ANIMALS,RINGS,REGION_MAT,WALLS,BIOME,CATCH,STN,RARITY,RAR,'
       'TIERNAME,BENCH_N,GEAR_N,DISH,EFF,BUFF_DUR,REMATCH,UNIQ_OF,ACC_OF,CROP_SOIL,SOIL_N,STAR_OF,MAX_LV,BAG_UPS,MULTI,TIPS,KNOWN0,'
       'WEAPONS,WEAPON_DUR,DUR,DECOR,ARROWS,NATURE,TERRAIN,BENCH_UP,BENCH_IT,GEAR_IT,TIER_MAT,BT1,BT2,FURN2,REQ_FIX,SALVAGE_RATE,'
       'ROOM_LOOT,ROOM_N,SPAWN_CAP,REGION_HP,DEEP_DISHES,DISHES,FLOWERS,USE,SETN,LAY,W,H,CX,CY')
HOOK = ('window.__S={get G(){return G},newGame,serialize,deserialize,iconURL,get SPR(){return SPR},'
        'reg:()=>{const o={};for(const [k,f] of Object.entries({%s}))try{o[k]=f()}catch(e){o[k]="[없음]"}return o}};window.claude?.hot?.snapshot'
        % ','.join(f'{n}:()=>{n}' for n in REG.split(',')))

# 그림·함수를 글자로 바꾸고, 키 순서는 그대로 두되 같은 입력이면 늘 같은 글자가 나오게 해요
CANON = r"""(v)=>{const h=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}return (x>>>0).toString(16)};
const seen=new WeakSet();const walk=(v,d)=>{if(v===null||typeof v!=='object'&&typeof v!=='function')return typeof v==='number'&&!isFinite(v)?String(v):v;
 if(typeof v==='function')return '[함수]';if(v instanceof HTMLCanvasElement||v instanceof HTMLImageElement){try{return `[그림 ${v.width}x${v.height} ${h(v.toDataURL?v.toDataURL():v.src)}]`}catch(e){return '[그림]'}}
 if(seen.has(v))return '[같은 값]';if(d>9)return '[깊음]';seen.add(v);let r;
 if(v instanceof Map)r={'[Map]':[...v.entries()].map(e=>walk(e,d+1))};else if(v instanceof Set)r={'[Set]':[...v].map(e=>walk(e,d+1))};
 else if(ArrayBuffer.isView(v))r=`[${v.constructor.name} ${v.length} ${h(Array.from(v).join(','))}]`;
 else if(Array.isArray(v))r=v.map(e=>walk(e,d+1));else{r={};for(const k of Object.keys(v))r[k]=walk(v[k],d+1)}seen.delete(v);return r};return walk(v,0)}"""


def build():
    sys.path.insert(0, DEV); import build as b
    return b.main()


def page(src, out, hook, layout=1):
    html = open(src, encoding='utf-8').read().replace('window.claude?.hot?.snapshot', hook, 1)
    fp = os.path.join(OUT, out)
    open(fp, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8">' + (FIX % layout) + '</head><body>' + html + '</body></html>')
    return 'file://' + fp


async def ready(pg):
    for _ in range(100):
        if await pg.evaluate("()=>!!(window.__S&&__S.G&&__S.SPR.player)"): return
        await pg.wait_for_timeout(100)
    raise SystemExit('게임이 시작되지 않았어요')


# ---- 세이브 입력 만들기 (--fixtures): 한 번 만들어 저장해 두고 계속 같은 파일로 비교해요 ----
LEGACY = {
    # v69 전 세이브: 반벽·기둥·얇은 벽·창문벽·창문 틀이 세워져 있고 가방·상자·꾸러미에도 있음 → 재료로 돌려받음 (가방이 차면 환급 상자)
    'old_build_pieces': "s.objs.push([I(2,0),{t:'bThinWood'}],[I(3,0),{t:'bWinStone'}],[I(4,0),{t:'bPillarWood'}],[I(5,0),{t:'bFrameStone'}],[I(2,2),{t:'chest',items:[{id:'bThinStone',c:3},{id:'bHalfWood',c:3}].concat(Array(16).fill(null))}],[I(4,2),{t:'lostBag',items:[{id:'bFrameWood',c:2},{id:'wood',c:4}],at:1}]);s.inv[3]={id:'bHalfStone',c:5};s.inv[4]={id:'bWinWood',c:2};for(let k=9;k<s.inv.length;k++)s.inv[k]={id:'gel',c:99}",
    # 옛 기능이 남아 있는 세이브: 각각 불러올 때 고쳐 주는 코드(옛 세이브 보정)가 돌아요
    'old_bag': "s.invV=undefined;s.bagLv=undefined;s.inv=Array(30).fill(null);s.inv[0]={id:'berry',c:3};s.inv[5]={id:'torch',c:2};s.inv[6]={id:'wood',c:9};s.inv[29]={id:'stone',c:4};s.sel=5",
    'old_fields': "for(const k of ['rpg','fzones','regen','under','terrain','rooms','pets','petOn','run','playT','qt','playTEst','look','char','equip'])delete s[k];for(const k of ['uniq','nm58','nm61'])delete s.stats[k]",
    'old_roof_drill_weapon': "s.inv[3]={id:'roofWood',c:4};s.inv[4]={id:'roofStone',c:3};s.inv[5]={id:'drillStone',c:2};s.inv[6]={id:'drillCu',c:1};s.inv[7]={id:'swordCopper',c:1};s.equip={weapon:{id:'bowIron',c:1,dur:77}}",
    'old_stations': "delete s.fpV;delete s.stats.nm61;s.objs=s.objs.filter(([i])=>i!==I(4,6)&&i!==I(5,6)&&i!==I(8,6));s.objs.push([I(4,6),{t:'bench'}],[I(8,6),{t:'forge'}]);s.inv[8]={id:'forge',c:1}",
    'bosses_beaten': "s.bossDead={slime:true,queen:true,golem:true,turtle:true,spirit:true};s.treeSeeds=3",
    'no_mapV': "delete s.mapV",
    # v113 전 세이브: 채굴장·나무 작업장이 놓여 있고(안에 돌) 가방에도 있음 → 만들 때 든 재료로 돌려받음
    'old_pits_v111': "s.inv[3]={id:'pitCu',c:1};s.inv[4]={id:'treeFarm',c:2};s.objs=s.objs.filter(([i])=>![I(2,4),I(3,4),I(2,5),I(3,5)].includes(i));s.objs.push([I(2,4),{t:'quarry',p:0,store:[{id:'stone',c:7}]}],[I(3,4),{t:'_part',a:I(2,4)}],[I(2,5),{t:'_part',a:I(2,4)}],[I(3,5),{t:'_part',a:I(2,4)}])",
    # v84 전 세이브: 활성 퀘스트가 없음 → 진행 중인 이야기가 활성
    'old_no_quest_active': "delete s.qAct;s.guide=3",
    # v83 전 세이브: 장비 세트가 없음 → 입은 장비(강화 단계 포함)와 펫이 세트 I
    'old_equip_no_sets': "delete s.eqSets;delete s.eqSet;s.equip={body:{id:'frostRobe',c:1,lv:2},head:{id:'woolHat',c:1},neck:null,ring:null};s.pets={dog:1,cat:1};s.petOn='dog'",
    # v65 전 세이브: 도구가 가방·단축칸에 있고 곡괭이를 들고 있음 → 도구 주머니로 옮겨짐
    'old_tools_in_bag': "for(const k of ['tools','tsel','tHand','lastW'])delete s[k];delete s.stats.nm65;s.inv[3]={id:'pickCopper',c:1,dur:120};s.inv[4]={id:'axeStone',c:1};s.inv[12]={id:'shovel',c:2};s.inv[13]={id:'rod',c:1,dur:5};s.inv[14]={id:'swordIron',c:1};s.inv[15]={id:'pickWood',c:1,dur:200};s.sel=3",
}


async def make_fixtures(b, src):
    fx = {}
    old = os.path.join(DEV, 'old')
    for v in (1, 2, 3):  # 예전 버전 게임에서 새 게임을 시작해 바로 저장
        pg = await b.new_page()
        await pg.goto(page(os.path.join(old, f'index.v{v}.html'), f'snap_old{v}.html', "window.__S={get G(){return G},serialize};window.claude?.hot?.snapshot"))
        await pg.wait_for_timeout(500)
        s = await pg.evaluate("()=>JSON.stringify(__S.serialize())")
        fx[f'v{v}'] = s; await pg.close()
    for lay in (1, 2):
        pg = await b.new_page(); await pg.goto(page(src, 'snap_fx.html', HOOK, lay)); await ready(pg)
        s = await pg.evaluate("()=>{__seed(42);__S.newGame(20261012);return JSON.stringify(__S.serialize())}")
        fx[f'v62_layout{lay}'] = s
        if lay == 1:
            pos = await pg.evaluate("()=>{const G=__S.G;return [Math.floor(G.p.x),Math.floor(G.p.y),__S.reg().W]}")  # I(dx,dy): 플레이어 근처 칸 번호
            for name, js in LEGACY.items():
                t = await pg.evaluate("(a)=>{const s=JSON.parse(a[0]),I=(dx,dy)=>(a[2]+dy)*a[3]+a[1]+dx;" + js + ";return JSON.stringify(s)}", [s, *pos])
                fx[name] = t
        await pg.close()
    if os.path.isfile(FIXTURES): fx.update(json.load(open(FIXTURES)))  # 이미 있는 세이브는 그대로 (새 사례만 추가돼요)
    json.dump(dict(sorted(fx.items())), open(FIXTURES, 'w'), ensure_ascii=False, indent=0)


def summarize(v):
    """세이브 결과를 보기 좋게: 큰 값(지도 배열 등)은 지문만, 작은 값은 그대로"""
    out = {}
    for k, x in v.items():
        t = json.dumps(x, ensure_ascii=False, separators=(',', ':'))
        out[k] = x if len(t) <= 2000 else f'[큰 값 {len(t)}자 {hashlib.sha1(t.encode()).hexdigest()[:12]}]'
    return out


async def collect(b, src):
    pg = await b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(page(src, 'snap.html', HOOK)); await ready(pg)
    # v73: SPR.glow(빛 번짐 그림)는 그리는 동안 채워지는 임시 저장소라 빼요 — 새 빛(GPU)으로 그리면 비어 있고 예전 빛이면 채워져요
    data = await pg.evaluate("(C)=>{const canon=eval(C);const R=__S.reg();R.SPR=Object.assign({},__S.SPR);delete R.SPR.glow;R.icons={};for(const id of Object.keys(R.ITEMS))try{R.icons[id]=__S.iconURL(id)}catch(e){R.icons[id]='[오류]'}"
                             "const h=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}return (x>>>0).toString(16)};for(const k in R.icons)R.icons[k]=h(R.icons[k]);return canon(R)}", CANON)
    saves = {}
    for name, s in json.load(open(FIXTURES)).items():
        r = await pg.evaluate("(s)=>{__seed(7);try{__S.deserialize(JSON.parse(s));return {ok:JSON.parse(JSON.stringify(__S.serialize()))}}catch(e){return {err:String(e)}}}", s)
        saves[name] = summarize(r['ok']) if 'ok' in r else {'오류': r['err']}
    await pg.close()
    return data, saves, errs


def diff(a, b, path='', out=None, lim=40):
    out = [] if out is None else out
    if len(out) >= lim: return out
    if type(a) != type(b): out.append(f'{path}: {json.dumps(a, ensure_ascii=False)[:120]} → {json.dumps(b, ensure_ascii=False)[:120]}')
    elif isinstance(a, dict):
        for k in a:
            if k not in b: out.append(f'{path}.{k}: 없어짐')
            else: diff(a[k], b[k], f'{path}.{k}', out, lim)
        for k in b:
            if k not in a: out.append(f'{path}.{k}: 새로 생김 = {json.dumps(b[k], ensure_ascii=False)[:120]}')
        if list(a) != list(b) and set(a) == set(b): out.append(f'{path}: 키 순서가 바뀜')
    elif isinstance(a, list):
        if len(a) != len(b): out.append(f'{path}: 개수 {len(a)} → {len(b)}')
        for i, (x, y) in enumerate(zip(a, b)): diff(x, y, f'{path}[{i}]', out, lim)
    elif a != b: out.append(f'{path}: {json.dumps(a, ensure_ascii=False)[:120]} → {json.dumps(b, ensure_ascii=False)[:120]}')
    return out


async def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    src = build()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        if mode == '--fixtures' or not os.path.isfile(FIXTURES): await make_fixtures(b, src)
        data, saves, errs = await collect(b, src)
        data2, saves2, _ = await collect(b, src)  # 두 번 돌려서 결과가 흔들리지 않는지도 확인
        await b.close()
    if data != data2 or saves != saves2:
        print('FAIL 같은 게임을 두 번 돌렸는데 결과가 달라요 (무작위·시간 고정이 빠진 곳이 있어요)'); print(*diff(data, data2)[:10], *diff(saves, saves2)[:10], sep='\n'); sys.exit(1)
    if errs: print('FAIL 콘솔 오류:', errs[:3]); sys.exit(1)
    cur = {'data': data, 'saves': saves}
    if mode in ('--update', '--fixtures') or not os.path.isfile(os.path.join(SNAP, 'data.json')):
        for k in cur: json.dump(cur[k], open(os.path.join(SNAP, k + '.json'), 'w'), ensure_ascii=False, indent=0, sort_keys=False)
        print('기록을 새로 저장했어요:', ', '.join(f'snapshot/{k}.json' for k in cur), f'(세이브 {len(saves)}개)'); print('TOTAL 1 / 1'); return
    bad = 0
    for k in cur:
        old = json.load(open(os.path.join(SNAP, k + '.json')))
        d = diff(old, cur[k], k)
        if d: bad += 1; print(f'FAIL {k}: 기록과 달라요 ({len(d)}곳 이상)'); print('  ' + '\n  '.join(d))
        else: print(f'PASS {k}: 기록과 같아요')
    if bad: print('일부러 바꾼 거라면: python3 dev/qa/snapshot.py --update')
    print('TOTAL', 2 - bad, '/', 2)
    sys.exit(1 if bad else 0)

asyncio.run(main())
