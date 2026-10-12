# 게임 원본(dev/src/)을 한 파일짜리 게임(dev/index.html)으로 묶어요.
# 사용법: python3 dev/build.py [출력 파일]   (출력 파일을 안 주면 dev/index.html)
#
# dev/src/shell.html이 뼈대예요. 그 안의 「/* @include css/… */」·「// @include js/…」 줄을
# 그 파일 내용으로 바꿔 끼워요. 끼우는 순서 = shell.html에 적힌 순서이고, 자바스크립트는 모두
# 하나의 <script> 안에 차례로 들어가요 (파일을 나눠도 예전 한 파일과 똑같이 동작).
# 테스트(dev/qa)·위키(dev/wiki)·배포(build_web.py)는 이 결과물 dev/index.html을 써요.
#
# 모듈 파일 (구조 변경 계획 dev/PLAN.md, 0단계부터): import/export가 있는 .js 파일은 모듈로 다뤄요.
#   import { a, b } from './x.js';   export function f() {…}   export const c = …;   export { a, b };
# 묶을 때 import 줄은 지우고 export 낱말만 떼어 내 같은 자리에 넣어요 (이름은 그대로 — 테스트도 그대로 들여다볼 수 있어요).
# 대신 묶기 전에 확인해요: 가져오는 파일이 shell.html에 있는지, 그 이름을 정말 내보내는지,
# 맨 위 이름이 다른 파일과 겹치지 않는지. 모듈이 아직 옛 전역 이름(모듈이 아닌 파일의 이름)을 쓰면 개수를 알려 줘요.
import os, re, sys

DEV = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(DEV, 'src')
INC = re.compile(r'^\s*(?:/\*|//)\s*@include\s+(\S+?)\s*(?:\*/)?\s*$')

IS_MOD = re.compile(r'^(?:import|export)\b', re.M)
IMP = re.compile(r'''^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?[ \t]*(?:\n|$)''', re.M)
EXP_LIST = re.compile(r'^export\s*\{([^}]*)\}\s*;?[ \t]*(?:\n|$)', re.M)
EXP_DECL = re.compile(r'^export\s+(?=(?:async\s+)?function\b|class\b|const\b|let\b)', re.M)
# 맨 위(줄 맨 앞)에서 만드는 이름: function a · class a · const/let/var a = …, b = … · const { a, b } = …
DECL = re.compile(r'^(?:export\s+)?(?:async\s+)?(?:function\*?\s*([A-Za-z_$][\w$]*)|class\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+(.*))', re.M)
WORD = re.compile(r'(?<![\w$.])[A-Za-z_$][\w$]*')


class BuildError(Exception):
    pass


def top_names(s):
    """맨 위에서 만드는 이름들 (줄 맨 앞에서 시작하는 선언만 — 이 저장소의 코드 모양)"""
    names = []
    for m in DECL.finditer(s):
        if m.group(1) or m.group(2):
            names.append(m.group(1) or m.group(2)); continue
        rest = m.group(3)
        if rest.startswith('{') or rest.startswith('['):  # const { a, b: c } = …
            inner = rest[1:rest.index('}' if rest[0] == '{' else ']')] if ('}' if rest[0] == '{' else ']') in rest else ''
            for part in inner.split(','):
                part = part.split('=')[0].strip()
                if ':' in part: part = part.split(':')[1].strip()
                if re.fullmatch(r'[A-Za-z_$][\w$]*', part): names.append(part)
            continue
        # const a = …, b = … — 괄호 깊이 0에 있는 「, 이름 =」만 셈
        depth, i, start = 0, 0, True
        while i < len(rest):
            if start:
                mm = re.match(r'\s*([A-Za-z_$][\w$]*)\s*(?:=|;|,|$)', rest[i:])
                if mm: names.append(mm.group(1))
                start = False
            c = rest[i]
            if c in '([{': depth += 1
            elif c in ')]}': depth -= 1
            elif c in '\'"`':  # 문자열은 건너뛰기
                j = i + 1
                while j < len(rest) and rest[j] != c: j += 2 if rest[j] == '\\' else 1
                i = j
            elif c == ',' and depth == 0: start = True
            elif c == ';' and depth == 0: break
            i += 1
    return names


def module_parts(rel, s):
    """모듈 하나: (지운 뒤의 코드, 가져오기 [(이름, 파일)], 내보내기 이름들)"""
    imports, exports = [], []
    for m in IMP.finditer(s):
        target = os.path.normpath(os.path.join(os.path.dirname(rel), m.group(2))).replace(os.sep, '/')
        for n in m.group(1).split(','):
            n = n.strip()
            if not n: continue
            if not re.fullmatch(r'[A-Za-z_$][\w$]*', n):
                raise BuildError(f'{rel}: import {{ {n} }} — 「as」로 이름 바꾸기는 안 돼요 (같은 이름 그대로 가져와요)')
            imports.append((n, target))
    body = IMP.sub('', s)
    for m in EXP_LIST.finditer(body):
        exports += [n.strip() for n in m.group(1).split(',') if n.strip()]
    body = EXP_LIST.sub('', body)
    for m in DECL.finditer(body):
        if m.group(0).startswith('export'):
            exports += top_names(m.group(0))
    body = EXP_DECL.sub('', body)
    left = re.search(r'^\s*(?:import|export)\b.*', body, re.M)
    if left:
        raise BuildError(f'{rel}: 이 모양의 import/export는 못 묶어요 → {left.group(0).strip()[:80]}\n'
                         '  쓸 수 있는 모양: import { a, b } from \'./x.js\';  export function/const/let/class …;  export { a, b };')
    for n in exports:
        if n not in top_names(body):
            raise BuildError(f'{rel}: export {{ {n} }} — 이 파일 맨 위에 {n}이(가) 없어요')
    return body, imports, exports


def bundle(src=SRC, report=True):
    out, used, js = [], set(), []  # js: [(rel, 원본 코드, 모듈이면 (imports, exports) 아니면 None)]
    for line in open(os.path.join(src, 'shell.html'), encoding='utf-8').read().splitlines(keepends=True):
        m = INC.match(line)
        if not m:
            out.append(line); continue
        rel = m.group(1)
        fp = os.path.join(src, rel)
        if not os.path.isfile(fp):
            raise BuildError(f'dev/src/shell.html: {rel} 파일이 없어요')
        if rel in used:
            raise BuildError(f'dev/src/shell.html: {rel}을(를) 두 번 넣었어요')
        used.add(rel)
        s = open(fp, encoding='utf-8').read()
        if rel.endswith('.js') and IS_MOD.search(s):
            s, imports, exports = module_parts(rel, s)
            js.append((rel, s, (imports, exports)))
        elif rel.endswith('.js'):
            js.append((rel, s, None))
        out.append(s if s.endswith('\n') else s + '\n')
    check(js, report)
    # shell.html에 안 적힌 .js/.css가 있으면 알려 줘요 (새 파일을 만들고 깜빡한 경우)
    for root, _, files in os.walk(src):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), src).replace(os.sep, '/')
            if f.endswith(('.js', '.css')) and rel not in used:
                print(f'⚠ dev/src/{rel}: shell.html에 @include가 없어서 게임에 들어가지 않아요')
    return ''.join(out)


def code_only(s):
    """이름을 셀 때 주석·글자('…' \"…\")·템플릿의 ${ 표시는 빼요 (글자 속 낱말이나 ${를 이름으로 착각하지 않게)"""
    s = re.sub(r'//[^\n]*|/\*.*?\*/', '', s, flags=re.S)
    s = re.sub(r"'(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"", '""', s)
    return s.replace('${', ' (')


def strip_art(s):
    return re.sub(r'/\*@@ART\*/.*?/\*@@ARTEND\*/', '', s, flags=re.S)  # 손그림 데이터 안의 글자는 이름이 아니에요


def check(js, report):
    """모듈 규칙 확인 + 진행 상황(옛 전역 이름이 몇 개 남았는지)"""
    owner, seen = {}, {}
    # 무작위는 engine/random.js의 rand()(게임 결과용)·fxRand()(보이기용)만 써요 — 멀티플레이에서 방장만 결과를 굴리게
    for rel, s, mod in js:
        if rel != 'js/engine/random.js' and 'Math.random' in re.sub(r'//[^\n]*', '', s):
            raise BuildError(f'{rel}: Math.random 대신 rand()(게임 결과에 영향) 또는 fxRand()(반짝이·소리 등 보이기만)를 써요 (engine/random.js)')
    for rel, s, mod in js:
        for n in top_names(strip_art(s)):
            if n in owner and owner[n] != rel:
                raise BuildError(f'맨 위 이름이 겹쳐요: {n} — {owner[n]}과(와) {rel}')
            owner[n] = rel
    order = {rel: i for i, (rel, _, _) in enumerate(js)}
    mods = {rel: mod for rel, _, mod in js if mod}
    legacy_names = {n for n, rel in owner.items() if rel not in mods}
    uses = 0
    for rel, s, mod in js:
        if not mod: continue
        imports, _ = mod
        for n, target in imports:
            if target not in order:
                raise BuildError(f'{rel}: {target}은(는) shell.html에 없어요 (import {{ {n} }})')
            if target not in mods:
                raise BuildError(f'{rel}: {target}은(는) 아직 모듈이 아니라 가져올 수 없어요 — 옛 파일의 이름은 import 없이 그대로 써요')
            # 뒤 파일에서 가져오는 것도 돼요 (서로 부르는 함수처럼 나중에 쓰는 이름). 다만 맨 위에서 바로 쓰면
            # 불러오자마자 오류가 나요 — 그건 게임을 켜 보면(비교 테스트) 바로 드러나요
            if n not in mods[target][1]:
                raise BuildError(f'{rel}: {target}은(는) {n}을(를) 내보내지 않아요 (export 확인)')
        mine = set(top_names(s)) | {n for n, _ in imports}
        words = set(WORD.findall(code_only(s)))
        for n in sorted(words - mine):
            if owner.get(n) in mods and owner[n] != rel:
                raise BuildError(f'{rel}: {n}은(는) {owner[n]}의 이름이에요 — import {{ {n} }} from …로 가져와요')
        uses += len((words - mine) & legacy_names)
    if report and mods:
        print(f'모듈 {len(mods)}개 · 옛 방식 파일 {len(js) - len(mods)}개 · 옛 전역 이름 {len(legacy_names)}개 남음'
              f' · 모듈이 아직 쓰는 옛 전역 이름 {uses}개')


def main(out=None):
    out = out or os.path.join(DEV, 'index.html')
    try:
        html = bundle()
    except BuildError as e:
        sys.exit('묶기 실패: ' + str(e))
    old = open(out, encoding='utf-8').read() if os.path.isfile(out) else None
    if html != old:
        open(out, 'w', encoding='utf-8').write(html)
    print('build', out, f'({len(html.encode()) // 1024} KB)')
    return out


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
