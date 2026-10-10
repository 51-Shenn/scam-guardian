/** Build a dependency-free local HTML presenter manual from the versioned Markdown; no remote assets or participant data. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline=s=>escape(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const source=fs.readFileSync(path.join(root,'docs/four-minute-pitch.md'),'utf8');
const lines=source.split(/\r?\n/);let html='',table=false;
for(const line of lines){
  if(line.startsWith('|')){
    if(/^\|[\s:|\-]+$/.test(line))continue;
    if(!table){html+='<div class="table"><table>';table=true;}
    html+='<tr>'+line.split('|').slice(1,-1).map(c=>`<td>${inline(c.trim())}</td>`).join('')+'</tr>';continue;
  }
  if(table){html+='</table></div>';table=false;}
  if(line.startsWith('### '))html+=`<h3>${inline(line.slice(4))}</h3>`;
  else if(line.startsWith('## '))html+=`<h2>${inline(line.slice(3))}</h2>`;
  else if(line.startsWith('# '))html+=`<h1>${inline(line.slice(2))}</h1>`;
  else if(line.startsWith('> '))html+=`<blockquote>${inline(line.slice(2))}</blockquote>`;
  else if(line.startsWith('- '))html+=`<p class="item">• ${inline(line.slice(2))}</p>`;
  else if(line.trim())html+=`<p>${inline(line)}</p>`;
}
if(table)html+='</table></div>';
const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scam Guardian · four-minute presenter manual</title><style>
*{box-sizing:border-box}body{margin:0;background:#faf6f6;color:#261923;font:17px/1.65 system-ui,sans-serif}nav{position:sticky;top:0;background:#faf6f6;border-bottom:1px solid #dfd4d8;padding:14px 24px;display:flex;gap:24px;flex-wrap:wrap}a{color:#8f1232}main{max-width:1020px;margin:auto;padding:32px 24px 80px}h1,h2,h3{line-height:1.2}h1{font-size:42px}h2{margin-top:48px;font-size:30px}h3{margin-top:36px;font-size:24px}blockquote{margin:18px 0;padding:20px 24px;border-left:4px solid #8f1232;background:#fff;font-size:20px;line-height:1.65}.table{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:480px;margin:18px 0}td{padding:12px 14px;text-align:left;border-bottom:1px solid #dfd4d8;vertical-align:top}tr:first-child{font-weight:bold}code{background:#eee5e8;padding:2px 5px;border-radius:4px;font-size:.9em}.item{margin:12px 0}@media print{nav{display:none}body{background:white;font-size:11pt}h1{font-size:26pt}h2{font-size:18pt}h3,blockquote{font-size:13pt}.table{overflow:visible}table{min-width:0}blockquote,tr{break-inside:avoid}}
</style></head><body><nav><a href="/demo">Live demo</a><a href="/evidence">Five-criterion evidence</a><span>Simulated prototype · no money moves</span></nav><main>${html}</main></body></html>`;
fs.mkdirSync(path.join(root,'public'),{recursive:true});
fs.writeFileSync(path.join(root,'public/pitch-manual.html'),page+'\n');
console.log('Presenter manual ready: /pitch-manual.html');
