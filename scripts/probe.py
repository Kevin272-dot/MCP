import re
html = open('/tmp/dom3.html').read()
i = html.find('Playback speed')
print(html[i-40:i+400])
