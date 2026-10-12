#!/usr/bin/env python3
"""Pack hand-drawn 16px art (one tile = 16×16 since v53) from dev/art/ into dev/src/js/art/hand-art.js.

dev/art/<path>.png      -> ART["<path>"]  (automatic outline, like the old sprite)
dev/art/<path>.raw.png  -> ART["<path>"]  (kept exactly as drawn, no outline)

<path> is where the sprite lives in the game, e.g. obj/roundTree, item/berry, crop/berry/3, slimeG, animal/dog.
Run it after adding or changing art, then build (dev/build.py), test and deploy as usual.
"""
import base64, json, os, re, struct, sys

DEV = os.path.dirname(os.path.abspath(__file__))
ART_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(DEV, 'art')
SRC = sys.argv[2] if len(sys.argv) > 2 else os.path.join(DEV, 'src', 'js', 'art', 'hand-art.js')


def png_size(b):
    if b[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    return struct.unpack('>II', b[16:24])


def main():
    art, warn = {}, []
    if os.path.isdir(ART_DIR):
        for root, dirs, files in os.walk(ART_DIR):
            dirs.sort()  # same order on every computer (GitHub Actions too), so packing twice changes nothing
            for f in sorted(files):
                if not f.lower().endswith('.png'):
                    continue
                fp = os.path.join(root, f)
                rel = os.path.relpath(fp, ART_DIR).replace(os.sep, '/')[:-4]
                raw = rel.endswith('.raw')
                key = rel[:-4] if raw else rel
                b = open(fp, 'rb').read()
                sz = png_size(b)
                if not sz:
                    warn.append(f'{rel}.png: PNG 파일이 아니에요 (건너뜀)')
                    continue
                if (sz[0] % 2 or sz[1] % 2) and not rel.startswith('wfront/'):  # a wall front is 16×5 by design
                    warn.append(f'{rel}.png: 크기 {sz[0]}×{sz[1]} — 가로·세로가 짝수여야 칸에 딱 맞아요')
                art[key] = ['data:image/png;base64,' + base64.b64encode(b).decode(), 0 if raw else 1]
    s = open(SRC, encoding='utf-8').read()
    decl = 'export const ART = ' if SRC.endswith('.js') else 'const ART = '  # 원본 art/hand-art.js는 모듈이라 export, 이미 묶은 html(테스트)에는 export 없이
    block = '/*@@ART*/\n' + decl + (json.dumps(art, ensure_ascii=False, separators=(',', ':')) if art else '{}') + ';\n/*@@ARTEND*/'  # 표시는 따로 줄에
    new, n = re.subn(r'/\*@@ART\*/.*?/\*@@ARTEND\*/', lambda m: block, s, count=1, flags=re.S)
    if n != 1:
        sys.exit(f'{SRC} 안에 /*@@ART*/ 표시를 찾지 못했어요')
    if new != s:
        open(SRC, 'w', encoding='utf-8').write(new)
    for w in warn:
        print('⚠', w)
    print(f'그림 {len(art)}장을 넣었어요' + (': ' + ', '.join(sorted(art)) if 0 < len(art) <= 30 else ''))


if __name__ == '__main__':
    main()
