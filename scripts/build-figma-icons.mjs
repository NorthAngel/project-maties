import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const source=await readFile('assets/figma-ui/logo.svg','utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:256,height:256},deviceScaleFactor:1});
 for(const [name,color]of [['app-icon','#F77E2D'],['tray-light','#F77E2D'],['tray-dark','#394F3E'],['tray-disconnected','#B8B9C1']]){
  const svg=source.replace(/#B8B9C1/gi,color);
  await page.setContent('<style>html,body{margin:0;background:transparent;width:256px;height:256px;display:grid;place-items:center}svg{width:236px;height:auto}</style>'+svg);
  const png=await page.screenshot({omitBackground:true});
  const header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(png.length,14);header.writeUInt32LE(22,18);
  await writeFile('assets/'+name+'.ico',Buffer.concat([header,png]));
  if(name==='app-icon')await writeFile('assets/app-icon.png',png);
 }
}finally{await browser.close();}
console.log('Generated application and three tray icons from Figma logo.');
