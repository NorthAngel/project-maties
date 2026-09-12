const {app,BrowserWindow}=require('electron');const fs=require('fs');const path=require('path');
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true,nodeIntegration:false}});await win.loadURL('about:blank');
 const svg=fs.readFileSync(path.resolve('assets/app-icon.svg'),'utf8');
 const png=await win.webContents.executeJavaScript(`(async()=>{const img=new Image();img.src='data:image/svg+xml;base64,'+${JSON.stringify(Buffer.from(svg).toString('base64'))};await img.decode();const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.drawImage(img,53,14,150,227);return c.toDataURL('image/png').split(',')[1];})()`);
 const bytes=Buffer.from(png,'base64');fs.writeFileSync('assets/app-icon.png',bytes);const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(bytes.length,14);ico.writeUInt32LE(22,18);fs.writeFileSync('assets/app-icon.ico',Buffer.concat([ico,bytes]));console.log('Figma icon exported as PNG and ICO');app.quit();
}).catch(e=>{console.error(e);app.exit(1);});
