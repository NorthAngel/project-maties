const {app,BrowserWindow,ipcMain,Menu,screen,Tray,nativeImage,nativeTheme,desktopCapturer,globalShortcut,dialog,shell}=require('electron');
const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process'),readline=require('node:readline');
const {diagnoseNative,repairNative,verifyRelease}=require('./maintenance.cjs');
const testing=process.argv.includes('--test');
app.setName('Controller Companion');
app.setPath('userData',testing?path.join(app.getAppPath(),'user-data-test'):path.join(app.getPath('appData'),'ControllerCompanion'));
if(!testing&&!app.requestSingleInstanceLock()){app.quit();}else app.whenReady().then(async()=>{
 const {normalizeAppearance,migrateSettings}=await import('./src/appearance.js');const {InputSession}=await import('./src/session.js');
 const {normalizeSystem}=await import('./src/system.js');
 const {translate}=await import('./src/i18n.js');
 const systemFile=path.join(app.getPath('userData'),'system.json');let systemSettings=normalizeSystem();
 try{if(!testing)systemSettings=normalizeSystem(JSON.parse(fs.readFileSync(systemFile)));}catch{}
 nativeTheme.themeSource=systemSettings.theme;
 const systemState=()=>({...systemSettings,version:app.getVersion(),resolvedTheme:nativeTheme.shouldUseDarkColors?'dark':'light'});
 const tr=key=>translate(systemSettings.locale,key);
 const {PointerInput}=await import('./src/pointer.js');
 const {validMapping}=await import('./src/calibration.js');
 const controllerFile=path.join(app.getPath('userData'),'controllers.json');let controllerConfig={preferredGuid:'',mappings:{}};
 try{if(!testing){const v=JSON.parse(fs.readFileSync(controllerFile));controllerConfig={preferredGuid:typeof v.preferredGuid==='string'?v.preferredGuid:'',mappings:Object.fromEntries(Object.entries(v.mappings||{}).filter(([g,m])=>validMapping(g,m))) };}}catch{}
 let inventory={items:[],selected:null,backend:'',warning:''},calibrating=false,calibrationId=null,testControllerTransport=null,requestSerial=0;const pending=new Map();
 function saveControllers(){if(!testing){fs.mkdirSync(path.dirname(controllerFile),{recursive:true});fs.writeFileSync(controllerFile,JSON.stringify(controllerConfig,null,2));}}
 function controllerRequest(command){if(testing&&testControllerTransport)return Promise.resolve(testControllerTransport(command));return new Promise((resolve,reject)=>{const requestId=String(++requestSerial);const timer=setTimeout(()=>{pending.delete(requestId);reject(Error('手柄服务响应超时'));},5000);pending.set(requestId,{resolve,reject,timer});send({...command,requestId});});}
 function cancelCalibration(){calibrating=false;calibrationId=null;send({type:'controller',action:'capture',deviceId:inventory.selected,value:false});stop();}
 const configFile=path.join(app.getPath('userData'),'appearance.json');const firstRun=!fs.existsSync(configFile);let saved={};try{if(!testing)saved=JSON.parse(fs.readFileSync(configFile));}catch{}
 let appearance=migrateSettings(saved),enabled=true,quitting=false,lastPacket=null,lastState='',bridgeError='',screenshot=null,captureBusy=false,helper=null,maintenanceBusy=false;
 const session=new InputSession(),pointer=new PointerInput(),pointerEvidence=[];
 const webPreferences={preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true};
 const appIcon=path.join(__dirname,'assets/app-icon.png');
 const overlay=new BrowserWindow({width:653,height:608,frame:false,transparent:true,focusable:false,skipTaskbar:true,resizable:false,hasShadow:false,show:false,backgroundColor:'#00000000',webPreferences:{...webPreferences,backgroundThrottling:false}});
 overlay.setAlwaysOnTop(true,'pop-up-menu');overlay.setIgnoreMouseEvents(true);
 const settings=new BrowserWindow({width:1040,height:780,minWidth:940,minHeight:700,show:false,frame:false,maximizable:false,fullscreenable:false,icon:appIcon,backgroundColor:nativeTheme.shouldUseDarkColors?'#111827':'#f5f5f7',title:'Controller Companion · 设置',autoHideMenuBar:true,webPreferences});
 for(const win of [overlay,settings]){win.setMenu(null);win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());}
 const send=c=>{if(helper?.stdin.writable)helper.stdin.write(JSON.stringify(c)+'\n');};
 const model=r=>({mode:r.mode,selected:r.selected,shift:r.shift});
 const state=()=>({active:session.active,connected:!!lastPacket?.connected,enabled,error:bridgeError,inputLanguage:lastPacket?.inputLanguage||'',device:lastPacket?.device,devices:inventory.items,selectedDevice:inventory.selected,backend:inventory.backend,warning:inventory.warning,calibrating,layout:session.active?session.layout:appearance.keyboardMode,...model(session.radial),left:model(session.leftRadial),right:model(session.radial)});
 function publish(force=false,pulses=[]){const value=state(),key=JSON.stringify(value);if(force||key!==lastState||pulses.length){lastState=key;for(const win of [overlay,settings])if(!win.isDestroyed())win.webContents.send('runtime',{...value,pulses});}}
 function stop(){session.stop();pointer.reset();send({type:'end'});overlay.hide();globalShortcut.unregister('Escape');publish(true);}
 function position(packet){
  const anchor=packet?.anchor?screen.screenToDipPoint(packet.anchor):screen.getCursorScreenPoint();const area=screen.getDisplayNearestPoint(anchor).workArea;
  const baseWidth=(session.active?session.layout:appearance.keyboardMode)==='dual'?1584.356:768.178;
  const scale=Math.min(appearance.scale/100,(area.width-24)/baseWidth,(area.height-24)/714.608);
  const width=Math.round(baseWidth*scale),height=Math.round(714.608*scale);
  const x=Math.max(area.x,Math.min(area.x+area.width-width,anchor.x-width/2));
  const y=Math.max(area.y,Math.min(area.y+area.height-height,anchor.y+24));
  overlay.setBounds({x:Math.round(x),y:Math.round(y),width,height});
 }
 function update(value){if(['bindings','auxiliaryBindings','keyboardMode','chordInterval','leftDisc','rightDisc'].some(k=>k in value))stop();appearance=normalizeAppearance({...appearance,...value});if(!testing){try{fs.mkdirSync(path.dirname(configFile),{recursive:true});fs.writeFileSync(configFile,JSON.stringify(appearance));}catch{bridgeError='设置未能保存';}}for(const win of [settings,overlay])win.webContents.send('appearance',appearance);if(session.active)position(lastPacket);publish(true);return appearance;}
 function syncSession(wasActive,packet){if(wasActive&&!session.active){send({type:'end'});pointer.reset();overlay.hide();globalShortcut.unregister('Escape');}if(!wasActive&&session.active){send({type:'begin',target:session.target});pointer.reset();position(packet);overlay.showInactive();globalShortcut.register('Escape',stop);}}
 function feed(packet){
  lastPacket=packet;if(calibrating&&(!packet.connected||packet.slot!==calibrationId))cancelCalibration();if(settings.isVisible())settings.webContents.send('controller',{connected:packet.connected,x:packet.x,y:packet.y,buttons:packet.buttons,device:packet.device,raw:calibrating?packet.raw:undefined});const wasActive=session.active,oldShift=session.radial.shift;
  // A settings window left open behind another application must not disable L3.
  // InputSession excludes our own foreground window; only an explicit pause stops global input.
  const oldLayout=session.layout,allowed=enabled&&!bridgeError&&packet.ready!==false&&!calibrating&&!maintenanceBusy;const now=performance.now();const result=session.step(packet,now,{...appearance,enabled:allowed,ownPid:process.pid});
  syncSession(wasActive,packet);
  if(session.active&&oldLayout!==session.layout){pointer.reset();send({type:'shift',value:false});position(packet);}
  if(result.imeSwitch&&allowed&&packet.pid!==process.pid)send({type:'ime',action:'cycle',target:packet.target});
  if(session.active){
   if(oldShift!==session.radial.shift)send({type:'shift',value:session.radial.shift});
   for(const event of result.events)send({type:'input',action:event.type,value:event.value});
   if(result.opacity)update({opacity:appearance.opacity+result.opacity});
  }
  const pointerPacket={...packet,buttons:result.pointerButtons};
  const liveAppearance={...appearance,keyboardMode:session.active?session.layout:appearance.keyboardMode};
  const events=[];
  if(result.tapR3&&allowed)events.push(...pointer.step({...pointerPacket,buttons:pointerPacket.buttons|128},session.active,liveAppearance,now,allowed));
  events.push(...pointer.step(pointerPacket,session.active,liveAppearance,now,allowed));
  for(const event of events){if(testing){pointerEvidence.push(event);if(pointerEvidence.length>30)pointerEvidence.shift();}if(event.type==='keyboard'){const before=session.active;session.toggle(packet,process.pid,appearance);syncSession(before,packet);}else send({...event,action:event.type,type:'pointer'});}
  publish(false,result.pulses);return state();
 }
 function startHelper(){
  const child=spawn(path.join(__dirname,'native/bin/ControllerBridge.exe'),testing?['--test-input']:[],{windowsHide:true,stdio:['pipe','pipe','pipe']});helper=child;
  child.on('error',()=>{if(helper===child){bridgeError='输入服务未启动';stop();}});child.stdin.on('error',()=>{});child.stderr.resume();
  child.on('exit',()=>{if(helper===child&&!quitting){bridgeError='输入服务已停止，请重新打开软件';lastPacket=null;stop();}});
  readline.createInterface({input:child.stdout}).on('line',line=>{if(helper!==child)return;try{const p=JSON.parse(line);if(p.type==='error'){bridgeError=p.message;stop();}else if(p.type==='ime-result'){if(testing)imeEvidence.push(p);if(!p.ok){for(const win of [settings,overlay])win.webContents.send('system-notice',{code:'ime-unavailable'});}}else if(p.type==='devices'){if(testing&&testControllerTransport)return;inventory=p;if(calibrating&&(p.selected!==calibrationId||!p.items.some(d=>d.id===calibrationId)))cancelCalibration();publish(true);}else if(p.type==='controller-result'){const req=pending.get(p.requestId);if(req){clearTimeout(req.timer);pending.delete(p.requestId);p.ok?req.resolve(p):req.reject(Error(p.error||'手柄操作失败'));}}else if(p.type==='state'){if(testing){lastPacket=p;}else feed(p);}}catch{}});
  return controllerRequest({type:'controller',action:'configure',config:controllerConfig});
 }
 async function shutdownHelper(){const child=helper;helper=null;for(const req of pending.values()){clearTimeout(req.timer);req.reject(Error('输入服务正在重启'));}pending.clear();if(!child||!child.pid||child.exitCode!==null)return;await new Promise((resolve,reject)=>{let timer;const finish=()=>{clearTimeout(timer);resolve();};child.once('exit',finish);if(child.stdin.writable){child.stdin.write(JSON.stringify({type:'quit'})+'\n');child.stdin.end();}timer=setTimeout(()=>{child.kill();timer=setTimeout(()=>reject(Error('repair-service-timeout')),3000);},2000);});}
 const imeEvidence=[];startHelper().catch(e=>{bridgeError=e.message;stop();});
 const trayIcon=()=>{const source=nativeImage.createFromPath(appIcon).resize({width:32,height:32});if(!nativeTheme.shouldUseDarkColors)return source;const bitmap=source.toBitmap();for(let i=0;i<bitmap.length;i+=4)bitmap[i]=bitmap[i+1]=bitmap[i+2]=255;return nativeImage.createFromBitmap(bitmap,{width:32,height:32});};
 const tray=new Tray(trayIcon());nativeTheme.on('updated',()=>{if(!quitting){tray.setImage(trayIcon());publishSystem();}});tray.setToolTip('Controller Companion');
 function publishSystem(){for(const win of [settings,overlay])if(!win.isDestroyed())win.webContents.send('system',systemState());}
 function loginSettings(value,executable=process.execPath){if(!testing)app.setLoginItemSettings({openAtLogin:value,path:executable,args:[],name:'ControllerCompanion'});}
 function saveSystem(value){
  const next=normalizeSystem({...systemSettings,...value});
  if(next.startAtLogin!==systemSettings.startAtLogin)loginSettings(next.startAtLogin);
  if(!testing){try{fs.mkdirSync(path.dirname(systemFile),{recursive:true});fs.writeFileSync(systemFile+'.tmp',JSON.stringify(next));fs.renameSync(systemFile+'.tmp',systemFile);}catch(e){if(next.startAtLogin!==systemSettings.startAtLogin)loginSettings(systemSettings.startAtLogin);throw e;}}
  systemSettings=next;nativeTheme.themeSource=next.theme;publishSystem();return systemState();
 }
 async function capture(){
  if(captureBusy)return screenshot;captureBusy=true;stop();const visible=settings.isVisible();settings.hide();
  try{await new Promise(r=>setTimeout(r,250));const display=screen.getDisplayNearestPoint(screen.getCursorScreenPoint());const sources=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:1920,height:1080}});const source=sources.find(s=>s.display_id===String(display.id))||sources[0];if(!source||source.thumbnail.isEmpty())throw Error();screenshot=source.thumbnail.toDataURL();return screenshot;}finally{captureBusy=false;if(visible)settings.show();}
 }
 async function openSettings(){stop();if(!screenshot){try{await capture();}catch{}}if(settings.isMinimized())settings.restore();settings.show();settings.focus();if(screenshot)settings.webContents.send('desktop-preview',screenshot);publish(true);}
 tray.on('right-click',openSettings);tray.on('click',openSettings);
 ipcMain.on('app-menu',()=>{openSettings();settings.webContents.send('system-open');});
 ipcMain.handle('system-get',()=>systemState());
 ipcMain.handle('system-set',(e,v)=>{if(e.sender!==settings.webContents)throw Error('settings-only');return saveSystem(v&&typeof v==='object'?v:{});});
 ipcMain.handle('system-action',async(e,v)=>{
  if(e.sender!==settings.webContents)return {ok:false,code:'settings-only'};
  if(maintenanceBusy)return {ok:false,code:'maintenance-busy'};
  const action=v?.action;
  if(action==='quit'){app.quit();return {ok:true};}
  if(action==='language-settings'){await shell.openExternal('ms-settings:regionlanguage');return {ok:true,code:'language-settings-opened'};}
  if(action==='firmware'){
   const device=inventory.items.find(d=>d.id===inventory.selected),name=device?.name||'';
   if(!device)return {ok:false,code:'firmware-vendor-required'};
   const url=device?.kind==='playstation'?'https://controller.dl.playstation.net/controller/lang/en/':/pico|rp2040|micro.?python/i.test(name)?'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html':device?.kind==='nintendo'?'https://en-americas-support.nintendo.com/app/answers/detail/a_id/26321/':/8bitdo/i.test(name)?'https://support.8bitdo.com/':'https://support.xbox.com/help/hardware-network/controller/update-xbox-wireless-controller';
   // Unknown/custom HID devices need their own firmware; never recommend Xbox firmware for them.
   if(device&&!['playstation','nintendo','xbox'].includes(device.kind)&&!/8bitdo|pico|rp2040|micro.?python/i.test(name))return {ok:false,code:'firmware-vendor-required'};
   await shell.openExternal(url);return {ok:true,code:'support-opened'};
  }
  if(!['diagnose','repair','update'].includes(action))return {ok:false,code:'action-failed'};
  maintenanceBusy=true;stop();
  try{
   if(action==='diagnose'){
    const checks=await diagnoseNative(__dirname),serviceRunning=!!helper&&helper.exitCode===null&&!bridgeError;
    const details={checks,serviceRunning,devices:inventory.items.map(d=>({name:d.name,mapped:d.mapped})),backend:inventory.backend,inputLanguage:lastPacket?.inputLanguage||''};
    return {ok:true,code:checks.every(x=>x.ok)&&serviceRunning?'diagnostics-ok':'diagnostics-issues',details};
   }
   if(action==='repair'){
    cancelCalibration();await shutdownHelper();inventory={items:[],selected:null,backend:'',warning:''};
    const restored=await repairNative(__dirname);bridgeError='';await startHelper();publish(true);return {ok:true,code:'repair-ok',details:{restoredFiles:restored}};
   }
   const picked=await dialog.showOpenDialog(settings,{title:tr('native.updateChoose'),properties:['openDirectory'],buttonLabel:tr('native.updateCheck')});
   if(picked.canceled)return {ok:true,code:'update-cancelled'};
   const release=await verifyRelease(picked.filePaths[0],app.getVersion());
   const answer=await dialog.showMessageBox(settings,{type:'question',title:tr('native.updateTitle'),message:`Controller Companion v${release.version}`,detail:tr('native.updateDetail'),buttons:[tr('native.restart'),tr('common.cancel')],defaultId:0,cancelId:1,noLink:true});
   if(answer.response!==0)return {ok:true,code:'update-cancelled'};
   app.relaunch({execPath:release.executable,args:['--settings']});app.quit();return {ok:true,code:'update-ready'};
  }catch(err){
   if(action==='repair'){bridgeError='输入服务修复失败';if(!helper){try{await startHelper();bridgeError='';}catch{}}publish(true);}
   const code=String(err.message).split(':')[0];return {ok:false,code:/^(update-|repair-)/.test(code)?code:'action-failed'};
  }finally{maintenanceBusy=false;}
 });
 ipcMain.handle('appearance-get',()=>appearance);ipcMain.handle('appearance-set',(_e,v)=>update(v&&typeof v==='object'?v:{}));
 ipcMain.handle('runtime-get',()=>state());ipcMain.handle('desktop-preview',async()=>{try{return {image:await capture()};}catch{return {error:'无法捕捉桌面，点击重试'};}});
 function closeSettings(){stop();if(systemSettings.closeBehavior==='quit')app.quit();else if(systemSettings.closeBehavior==='minimize')settings.minimize();else settings.hide();}
 ipcMain.on('window-action',(_e,action)=>{if(action==='close')closeSettings();if(action==='minimize'){stop();settings.minimize();}if(action==='quit')app.quit();if(action==='settings')openSettings();});
 ipcMain.handle('enabled-set',(_e,value)=>{enabled=value===true;stop();return state();});
 ipcMain.handle('controller-action',async(e,v)=>{
  if(e.sender!==settings.webContents)throw Error('仅设置页可操作手柄');
  try{
   if(v?.action==='cancel'){cancelCalibration();return {ok:true};}
   const device=inventory.items.find(d=>d.id===v?.id);if(!device)throw Error('手柄已断开');
   if(v.action==='select'){cancelCalibration();await controllerRequest({type:'controller',action:'select',deviceId:device.id});controllerConfig.preferredGuid=device.guid;saveControllers();}
   else if(v.action==='capture'){stop();await controllerRequest({type:'controller',action:'capture',deviceId:device.id,value:true});calibrating=true;calibrationId=device.id;publish(true);}
   else if(v.action==='mapping'){if(v.mapping!==null&&!validMapping(device.guid,v.mapping))throw Error('校准数据不完整');await controllerRequest({type:'controller',action:'mapping',deviceId:device.id,mapping:v.mapping});calibrating=false;stop();if(v.mapping===null)delete controllerConfig.mappings[device.guid];else controllerConfig.mappings[device.guid]=v.mapping;saveControllers();}
   else throw Error('未知操作');return {ok:true};
  }catch(e){cancelCalibration();return {ok:false,error:e.message};}
 });
 settings.on('hide',()=>{if(calibrating)cancelCalibration();});
 settings.on('close',event=>{if(!quitting){event.preventDefault();closeSettings();}});
 settings.on('show',()=>{if(session.active)stop();});
 app.on('second-instance',openSettings);
 app.on('before-quit',()=>{quitting=true;globalShortcut.unregisterAll();send({type:'quit'});helper?.stdin.end();tray.destroy();});
 await Promise.all([overlay.loadFile('overlay.html'),settings.loadFile('settings.html')]);
 // Reconcile both enabled and disabled states only after this release loads.
 // Updating never redirects the login entry before the new app has started.
 loginSettings(systemSettings.startAtLogin);
 if(testing)global.__test={
  mockControllers:items=>{inventory={items,selected:items[0]?.id||'',backend:'SDL3',warning:''};testControllerTransport=c=>{if(c.action==='select')inventory.selected=c.deviceId;if(c.action==='mapping')inventory.items.find(d=>d.id===c.deviceId).mapped=c.mapping!==null;publish(true);return {ok:true};};publish(true);},
  controllerConfig:()=>controllerConfig,
  rawController:p=>settings.webContents.send('controller',p),
  feed:(p)=>feed({...lastPacket,ready:true,...p}),state,openSettings,stop,overlay:overlay.id,settings:settings.id,packet:()=>lastPacket,pointerEvidence:()=>pointerEvidence,imeEvidence:()=>imeEvidence,helperPid:()=>helper?.pid};
 if(!testing){if(firstRun)update(appearance);if(process.argv.includes('--settings'))await openSettings();}
});
app.on('window-all-closed',()=>{});
