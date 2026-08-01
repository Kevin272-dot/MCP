import re
import subprocess

chrome = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe'
subprocess.run([chrome, '--headless=new', '--disable-gpu', '--no-first-run',
                '--virtual-time-budget=9000', '--dump-dom', 'http://localhost:3000'],
               stdout=open('/tmp/dom3.html', 'w'), stderr=open('/tmp/chrome3.err', 'w'))
html = open('/tmp/dom3.html').read()

checks = {
    'problem grid (minmax card cols)': html.count('grid-template-columns:repeat(auto-fit,minmax(280px,1fr))'),
    'problem pin gone (ScrollTrigger pinned)': html.count('data-problem-card'),
    'evolution grid cols': html.count('lg:grid-cols-3'),
    'evolution dots gone (data-stage)': html.count('data-stage'),
    'mesh panel apps': len(re.findall(r'Claude Desktop', html)),
    'mesh toggle': html.count('Add a service'),
    'mesh stats': html.count('Direct integrations'),
    'with-hub label': html.count('MCP Server'),
    'warn badge (!)': html.count('Broken API update') + html.count('Duplicate auth token'),
    'sim speed 1x': html.count('1x'),
    'sim step': html.count('Step'),
    'sim stats strip': html.count('Maintenance load') + html.count('Codebase footprint'),
    'invalid scope in render': html.lower().count('invalid scope'),
    'runtime error marker': html.count('__NEXT_ERROR__'),
}
for k, v in checks.items():
    print(f'{k}: {v}')

errs = [l for l in open('/tmp/chrome3.err').read().splitlines() if 'error' in l.lower() or 'exception' in l.lower()]
print('--- headless stderr errors ---')
print('\n'.join(errs[:12]) if errs else 'none')
