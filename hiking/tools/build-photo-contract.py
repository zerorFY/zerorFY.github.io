"""Render this project's limited Markdown subset with Python standard library only."""
from pathlib import Path
import html,json,re
H=Path(__file__).resolve().parents[1]
manifest=json.loads((H/'photo-viewer-contract.json').read_text(encoding='utf8'))
markdown=(H/'PHOTO-INTERACTIONS.md').read_text(encoding='utf8')
assert '版本：'+manifest['version'] in markdown,'Specification/manifest version mismatch'
def inline(value):
    parts=re.split(r'(`[^`]+`)',value)
    def plain(part):
        escaped=html.escape(part)
        return re.sub(r'\[([^\]]+)\]\((/[^\s)]+)\)',r'<a href="\2">\1</a>',escaped)
    return ''.join('<code>'+html.escape(part[1:-1])+'</code>' if part.startswith('`') else plain(part) for part in parts)
blocks=[];paragraph=[];code=[];fenced=False;list_type=None
def flush():
    if paragraph:blocks.append('<p>'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
def end_list():
    global list_type
    if list_type:blocks.append('</'+list_type+'>');list_type=None
for line in markdown.splitlines():
    if line.startswith('```'):
        flush();end_list()
        if fenced:blocks.append('<pre><code>'+html.escape('\n'.join(code))+'</code></pre>');code=[]
        fenced=not fenced;continue
    if fenced:code.append(line);continue
    if not line.strip():flush();end_list();continue
    heading=re.match(r'^(#{1,3}) (.+)$',line)
    item=re.match(r'^(- |\d+\. )(.+)$',line)
    if heading:
        flush();end_list();level=len(heading[1]);blocks.append(f'<h{level}>'+inline(heading[2])+f'</h{level}>')
    elif item:
        flush();kind='ul' if item[1]=='- ' else 'ol'
        if list_type!=kind:end_list();blocks.append('<'+kind+'>');list_type=kind
        blocks.append('<li>'+inline(item[2])+'</li>')
    else:paragraph.append(line)
assert not fenced,'Unclosed code fence';flush();end_list()
page='''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>游记照片交互规范 · Hiking</title><meta name="description" content="Hiking 游记共用照片交互规范、接入示例、测试与版本更新方法，供任何 AI 工具或人工维护者复用。">
<link rel="canonical" href="https://zeror.ca/hiking/photo-interactions/">
<link rel="alternate" type="text/markdown" href="/hiking/PHOTO-INTERACTIONS.md">
<link rel="describedby" type="application/json" href="/hiking/photo-viewer-contract.json">
<style>*{box-sizing:border-box}body{margin:0;background:#f7f4ec;color:#2e2a24;font:16px/1.85 system-ui,"Microsoft YaHei",sans-serif}header,main,footer{max-width:900px;margin:auto;padding:24px}header{border-bottom:1px solid #d8cfb8}header a{font-weight:650;text-decoration:none}a{color:#3e5739;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #b07b37;outline-offset:4px}h1{font-size:clamp(26px,5vw,36px);line-height:1.4}h2{font-size:23px;margin-top:40px}li{margin:10px 0}code{font-size:.9em;overflow-wrap:anywhere}pre{max-width:100%;padding:18px;background:#fffdf7;border:1px solid #d8cfb8;border-radius:10px;overflow-x:auto;line-height:1.55}pre code{white-space:pre;overflow-wrap:normal}footer{font-size:13px;color:#746b59;border-top:1px solid #d8cfb8}@media(max-width:600px){header,main,footer{padding:20px}body{font-size:15px}ul,ol{padding-left:24px}pre{padding:12px}}</style></head>
<body><header><a href="/hiking/">← 徒步游记 Hiking</a></header><main>
'''+ '\n'.join(blocks)+'''
</main><footer>规范维护源：<a href="/hiking/PHOTO-INTERACTIONS.md">Markdown</a> · <a href="/hiking/photo-viewer-contract.json">版本索引</a> · <a href="/hiking/examples/journal.html">接入示例</a> · <a href="/hiking/tests/photo-viewer.test.cjs">回归测试</a></footer></body></html>
'''
target=H/'photo-interactions/index.html';target.parent.mkdir(exist_ok=True);target.write_text(page,encoding='utf8',newline='\n')
print('Built hiking/photo-interactions/index.html, contract '+manifest['version'])
