import re

p = 'content/sections.ts'
s = open(p, encoding='utf-8').read()

def fix(eyebrow, newidx):
    global s
    pat = re.compile(r"(index: '08',\n  eyebrow: '" + eyebrow + r"')")
    s = pat.sub(lambda m: m.group(1).replace("'08'", "'" + newidx + "'"), s)

fix('The Architecture', '06')
fix('The Building Blocks', '07')
fix('The Demonstration', '05')

open(p, 'w', encoding='utf-8').write(s)
print('fixed')
