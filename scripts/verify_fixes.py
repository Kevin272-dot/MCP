import re
import subprocess

chrome = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe'
subprocess.run([chrome, '--headless=new', '--disable-gpu', '--no-first-run',
                '--virtual-time-budget=8000', '--dump-dom', 'http://localhost:3000'],
               stdout=open('/tmp/dom2.html', 'w'), stderr=open('/tmp/chrome2.err', 'w'))
html = open('/tmp/dom2.html').read()

checks = {
    'hero words (data-hero-word)': html.count('data-hero-word'),
    'split-type chars gone (.char span)': html.count('class="char'),
    'source labels hidden on mobile': html.count('hidden fill-body-dark'),
    'mobile source legend': html.count('External services'),
    'terminal pre-wrap': html.count('whitespace-pre-wrap'),
    'topbar CTA removed': html.count('See how it works'),
    'invalid scope in render': html.lower().count('invalid scope'),
}
for k, v in checks.items():
    print(f'{k}: {v}')

print('--- headless stderr errors ---')
errs = [l for l in open('/tmp/chrome2.err').read().splitlines() if 'error' in l.lower() or 'exception' in l.lower()]
print('\n'.join(errs[:10]) if errs else 'none')
