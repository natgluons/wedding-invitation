#!/usr/bin/env python3
"""Install Vowfable ending into natgluons/wedding-invitation without editing main.js.
Usage: python3 apply_vowfable.py ./wedding-invitation --url https://your-site/
Idempotent; makes only additions to index.html and copies new assets.
"""
from pathlib import Path
import argparse, shutil, re, sys, html
parser=argparse.ArgumentParser(description='Install Vowfable end section to the wedding invitation')
parser.add_argument('repo', nargs='?', default='.', help='Original wedding-invitation repository directory')
parser.add_argument('--url', default='https://YOUR-VOWFABLE-DOMAIN.example/', help='Your actual Vowfable website URL')
args=parser.parse_args()
root=Path(args.repo).resolve();here=Path(__file__).resolve().parent
index=root/'index.html'
if not index.is_file() or not (root/'main.js').is_file() or not (root/'styles.css').is_file():
    sys.exit('Expected index.html, main.js and styles.css in the given repository root')
if not args.url.startswith('https://') or any(c in args.url for c in '<>"\r\n'):
    sys.exit('Use a valid https:// URL (no quotation marks or angle brackets)')
source=index.read_text('utf-8')
csslink='  <link rel="stylesheet" href="vowfable-outro.css?v=1" />'
jslink='  <script defer src="vowfable-outro.js?v=1"></script>'
if csslink not in source:
    marker='  <script defer src="config.js'
    if marker not in source: sys.exit('Could not locate config.js in index.html; original unchanged')
    source=source.replace(marker,csslink+'\n'+marker,1)
if jslink not in source:
    marker='</head>'
    if marker not in source: sys.exit('Could not locate </head>; original unchanged')
    source=source.replace(marker,jslink+'\n'+marker,1)
if 'id="vowfable-outro"' not in source:
    match=re.search(r'(\s*</footer>)(\s*</main>)',source)
    if not match:sys.exit('Could not locate closing footer before </main>; original unchanged')
    addition=(here/'vowfable-outro.html').read_text('utf-8').strip().replace('https://YOUR-VOWFABLE-DOMAIN.example/',html.escape(args.url,quote=True))
    source=source[:match.start()]+match.group(1)+'\n\n'+addition+'\n'+match.group(2)+source[match.end():]
else:
    source=re.sub(r'(<a class="vf-outro__button" href=")[^"]+',lambda m:m.group(1)+html.escape(args.url,quote=True),source,count=1)
# Only after all validations succeed, change files.
out=root/'assets'/'vowfable';out.mkdir(parents=True,exist_ok=True)
for name in ['vowfable-seal.svg','wave-mini.svg','floral-corner.svg']:
    shutil.copy2(here/'assets'/'vowfable'/name,out/name)
for name in ['vowfable-outro.css','vowfable-outro.js']:
    shutil.copy2(here/name,root/name)
index.write_text(source,encoding='utf-8')
print('Done:',index,'\nExisting main.js, styles.css and backend unchanged.')
if 'YOUR-VOWFABLE-DOMAIN.example' in args.url: print('IMPORTANT: Set --url to your real site before publishing.')
