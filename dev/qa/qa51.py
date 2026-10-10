import asyncio, sys, os, io, json, base64, shutil, subprocess
sys.argv=['x']
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'qa2.py')).read().split('async def main():')[0])
# v49: 32px 그림(한 칸 32px) — 세계를 2배 해상도로 그리고, dev/art의 손그림을 불러와 지금 그림 대신 씀
from PIL import Image, ImageDraw
QA=os.path.dirname(os.path.abspath(__file__)); DEV=os.path.join(QA,'..')
H2=HOOK.replace("computeLight}","computeLight,SPR,HD,effW,effH,ARTC,iconURL,animalImg,get lowCv(){return lowCv},newGame}")

def png(w,h,col,detail=True):
    im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rectangle([2,2,w-3,h-3],fill=col)
    if detail:  # 1-art-pixel checker stripe: only visible if the art is really drawn at 2 pixels per game pixel
        for x in range(2,w-2,2): d.point((x,h//2),fill=(255,255,255,255))
    b=io.BytesIO(); im.save(b,'PNG'); return b.getvalue()

ART={'obj/roundTree':(48,64,(40,120,70,255)),'item/berry':(32,32,(220,60,90,255)),'mon/slimeG':(32,28,(120,210,110,255)),
     'crop/berry/3':(32,32,(200,80,120,255)),'animal/dog':(32,32,(200,140,90,255)),'obj/torch.raw':(32,32,(250,200,90,255))}

def art_page(out):
    tmp=SP+'art_tmp'; shutil.rmtree(tmp,ignore_errors=True)
    for k,(w,h,c) in ART.items():
        fp=os.path.join(tmp,k+'.png'); os.makedirs(os.path.dirname(fp),exist_ok=True); open(fp,'wb').write(png(w,h,c))
    html=SP+'art_src.html'; shutil.copy(SRC,html)
    r=subprocess.run([sys.executable,os.path.join(DEV,'art_pack.py'),tmp,html],capture_output=True,text=True)
    mkpage(html,out,H2); return r.stdout+r.stderr, open(html,encoding='utf-8').read()

async def main():
    before=open(SRC,'rb').read()
    log,packed=art_page('qa.html')
    blk=packed[packed.index('/*@@ART*/'):packed.index('/*@@ARTEND*/')]
    art=json.loads(blk[len('/*@@ART*/const ART = '):-1])
    rec('그림 넣기','art_pack.py가 dev/art 그림을 원본 안에 넣음 (.raw는 테두리 없음 표시)', sorted(art)==sorted(['obj/roundTree','item/berry','mon/slimeG','crop/berry/3','animal/dog','obj/torch']) and art['obj/torch'][1]==0 and art['obj/roundTree'][1]==1, log.strip())
    rec('그림 넣기','원본 dev/index.html은 그대로 (테스트는 복사본으로)', open(SRC,'rb').read()==before, '')
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx,pg,errs=await new_ctx(b,390,844,True)
        r=await ev(pg,"()=>{const T=__T,S=T.SPR,o=S.obj.roundTree;return [o.hd,o.width,o.height,T.effW(o),T.effH(o),S.item.berry.hd,S.slimeG.hd,S.slimeGW.hd,S.slimeGW.width,S.crop.berry[3].every(c=>c.hd&&c.width===32),S.giant.berry.hd,S.giant.berry.width,S.young.roundTree.hd,!!S.obj.root.hd]}")
        rec('그림 바꾸기','손그림이 원래 그림 자리에 들어가고 2배 그림으로 표시됨 (세계 크기는 그대로)', r==[True,48,64,24,32,True,True,True,32,True,True,64,True,False], str(r))
        r=await ev(pg,"()=>{const S=__T.SPR;const a=S.obj.roundTree.getContext('2d').getImageData(0,0,48,64).data,t=S.obj.torch.getContext('2d').getImageData(0,0,32,32).data;let ol=0;for(let i=0;i<a.length;i+=4){const x=(i/4)%48,y=(i/4/48)|0;if(x===1&&y===10&&a[i+3])ol=1}return [ol,t[(1*32+1)*4+3],t[(2*32+2)*4+3]]}")
        rec('테두리','보통 그림은 자동 테두리, .raw 그림은 그린 그대로', r==[1,0,255], str(r))
        r=await ev(pg,"()=>{const S=__T.SPR,c=S.crop.berry[3],px=(k,x,y)=>Array.from(c[k].getContext('2d').getImageData(x,y,1,1).data).join();let diff=0;for(let y=26;y<32;y++)for(let x=0;x<32;x++)if(px(0,x,y)!==px(1,x,y))diff++;return [c.length,diff>0,px(0,16,16)===px(1,16,16),S.crop.berry[2].every(k=>!k.hd)]}")
        rec('작물','작물 그림 밑에 흙(마름·물 줌·비료)을 게임이 그대로 깔아 줌', r==[4,True,True,True], str(r))
        r=await ev(pg,"()=>{const T=__T,S=T.SPR;const d=T.animalImg('dog');return [d.hd,d.width,S.objOff.torch.hd,T.iconURL('berry').startsWith('data:image/png'),T.ARTC['obj/roundTree'].width]}")
        rec('그림 바꾸기','동물·꺼진 램프·아이콘도 손그림을 씀', r==[True,32,True,True,48], str(r))
        # world canvas is 2 art pixels per game pixel
        await ev(pg,"""()=>{const T=__T,G=T.G;const x=Math.floor(G.p.x)+2,y=Math.floor(G.p.y);for(const [dx,dy] of [[0,0],[1,0],[0,-1],[1,-1]])G.wall[T.idx(x+dx,y+dy)]=0;G.objs.set(T.idx(x,y),{t:'roundTree',hp:3});G.objs.set(T.idx(x+1,y-1),{t:'torch'});G.enemies.length=0}""")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=SP+'qa51_art.png')
        # the 1-pixel stripe of the drawn tree must reach the screen: count alternating pixels on the stripe row
        r=await ev(pg,"""()=>{const T=__T,c=T.lowCv,g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data;let best=0;
          for(let y=0;y<c.height;y++){let alt=0;for(let x=1;x<c.width;x++){const i=(y*c.width+x)*4,j=i-4;const w1=d[i]>200&&d[i+1]>200&&d[i+2]>200,w0=d[j]>200&&d[j+1]>200&&d[j+2]>200;if(w1!==w0)alt++}best=Math.max(best,alt)}return best}""")
        rec('화면','세계 캔버스가 2배 해상도라 그림의 1px 무늬가 그대로 보임', r>=20, r)
        rec('기능','콘솔 오류 없음', not errs, errs[:4])
        await ctx.close()
        # without art the game looks exactly as before: 16px sprites, no hd flags, same world size
        mkpage(SRC,'qa.html',H2)
        ctx,pg,errs=await new_ctx(b,390,844,True)
        r=await ev(pg,"()=>{const T=__T,S=T.SPR;return [Object.keys(T.ARTC).length,!!S.obj.roundTree.hd,S.obj.roundTree.width,T.effW(S.obj.roundTree),!!S.slimeGW.hd,T.lowCv.width%T.HD]}")
        rec('기본','손그림이 없으면 지금 그림 그대로 (2배 캔버스에 2×2로 그림)', r==[0,False,24,24,False,0], str(r))
        rec('기능','콘솔 오류 없음 (그림 없음)', not errs, errs[:4])
        await ctx.close(); await b.close()
    print('TOTAL',sum(1 for r in RES if r[2]),'/',len(RES))
asyncio.run(main())
