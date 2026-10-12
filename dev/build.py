# 게임 원본(dev/src/)을 한 파일짜리 게임(dev/index.html)으로 묶어요.
# 사용법: python3 dev/build.py [출력 파일]   (출력 파일을 안 주면 dev/index.html)
#
# dev/src/shell.html이 뼈대예요. 그 안의 「/* @include css/… */」·「// @include js/…」 줄을
# 그 파일 내용으로 바꿔 끼워요. 끼우는 순서 = shell.html에 적힌 순서이고, 자바스크립트는 모두
# 하나의 <script> 안에 차례로 들어가요 (파일을 나눠도 예전 한 파일과 똑같이 동작).
# 테스트(dev/qa)·위키(dev/wiki)·배포(build_web.py)는 이 결과물 dev/index.html을 써요.
import os, re, sys

DEV = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(DEV, 'src')
INC = re.compile(r'^\s*(?:/\*|//)\s*@include\s+(\S+?)\s*(?:\*/)?\s*$')


def bundle():
    out, used = [], set()
    for line in open(os.path.join(SRC, 'shell.html'), encoding='utf-8').read().splitlines(keepends=True):
        m = INC.match(line)
        if not m:
            out.append(line); continue
        rel = m.group(1)
        fp = os.path.join(SRC, rel)
        if not os.path.isfile(fp):
            sys.exit(f'dev/src/shell.html: {rel} 파일이 없어요')
        if rel in used:
            sys.exit(f'dev/src/shell.html: {rel}을(를) 두 번 넣었어요')
        used.add(rel)
        s = open(fp, encoding='utf-8').read()
        out.append(s if s.endswith('\n') else s + '\n')
    # shell.html에 안 적힌 .js/.css가 있으면 알려 줘요 (새 파일을 만들고 깜빡한 경우)
    for root, _, files in os.walk(SRC):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), SRC).replace(os.sep, '/')
            if f.endswith(('.js', '.css')) and rel not in used:
                print(f'⚠ dev/src/{rel}: shell.html에 @include가 없어서 게임에 들어가지 않아요')
    return ''.join(out)


def main(out=None):
    out = out or os.path.join(DEV, 'index.html')
    html = bundle()
    old = open(out, encoding='utf-8').read() if os.path.isfile(out) else None
    if html != old:
        open(out, 'w', encoding='utf-8').write(html)
    print('build', out, f'({len(html.encode()) // 1024} KB)')
    return out


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
