import {createWheel} from './wheel-view.js';
import {normalizeAppearance,applyWheelStyle} from './appearance.js';
import {normalizeSystem} from './system.js';
import {applyTheme,watchSystemTheme} from './theme.js';
import {ACTIONS,PHYSICAL,LOCKED_BINDINGS,normalizeBindings} from './controls.js';
import {FIGMA_ASSETS} from './figma-assets.js';
import {text,bindingText} from './settings-copy.js';
import {showOptions,showMessage} from './settings-controls.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const desktop=window.desktop??{};
const call=(method,...args)=>typeof desktop[method]==='function'?desktop[method](...args):Promise.reject(new Error('Windows desktop host is unavailable'));
let appearance=normalizeAppearance(),system=normalizeSystem(),runtime={connected:false},bindMode='idle',previewDisc=0;
const right=await createWheel($('#sectors')),left=await createWheel($('#preview-left'));
const t=key=>text(system.locale,key),actionText=key=>bindingText(system.locale,key);
const iconKey=key=>({Up:'up',Down:'down',Left:'left',Right:'right'})[key]??key;
function setIcon(el,name){
 const asset=FIGMA_ASSETS[name];if(!asset)return;
 el.dataset.sourceNode=asset.nodeId;
 if(asset.src.endsWith('.png')){
  const id='icon-'+name;el.style.background='transparent';
  el.innerHTML='<svg viewBox="0 0 '+asset.width+' '+asset.height+'" width="100%" height="100%"><defs><filter id="'+id+'" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 -2 0 0 2" result="shape"/><feFlood flood-color="var(--accent)" result="paint"/><feComposite in="paint" in2="shape" operator="in"/></filter></defs><image href="'+asset.src+'" width="'+asset.width+'" height="'+asset.height+'" filter="url(#'+id+')"/></svg>';
 }else el.style.maskImage='url("'+asset.src+'")';
}
$$('[data-icon]').forEach(el=>setIcon(el,el.dataset.icon));
function notice(message){$('#notice').textContent=message;$('#notice').hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('#notice').hidden=true,5000);}
async function save(patch){if(!runtime.connected)return;try{appearance=normalizeAppearance(await call('setAppearance',patch));render();}catch(e){notice(e.message);}}
async function saveSystem(patch){try{system=normalizeSystem({...system,...await call('setSystem',patch)});render();}catch(e){notice(e.message);}}
function selectSetting(button,key,values){showOptions(button,t(key),values.map(([value,label])=>({value,label,selected:appearance[key]===value})),value=>save({[key]:value}));}
function renderBindings(){
 const list=$('#binding-list');list.replaceChildren();
 const order=['Y','A','X','B','Up','Left','Right','Down','View','Menu','LB','RB','LT','RT','R3','L3'];
 for(const key of order){
  const row=document.createElement('div');row.className='binding-row';const icon=document.createElement('i');setIcon(icon,iconKey(key));
  const button=document.createElement('button');button.dataset.physical=key;button.disabled=!runtime.connected||Object.hasOwn(LOCKED_BINDINGS[bindMode],key);
  button.textContent=actionText(appearance.bindings[bindMode][key]);const chevron=document.createElement('span');chevron.className='chevron';button.append(chevron);
  button.onclick=()=>{
   const choices=Object.keys(ACTIONS).filter(a=>!['Y','A','X','B','leftY','leftA','leftX','leftB'].includes(a)&&(bindMode!=='idle'||!a.startsWith('cycle')));
   showOptions(button,key,choices.map(value=>({value,label:actionText(value),selected:appearance.bindings[bindMode][key]===value})),value=>save({bindings:{...appearance.bindings,[bindMode]:{...appearance.bindings[bindMode],[key]:value}}}),{search:true,placeholder:t('search')});
  };
  row.append(icon,button);list.append(row);
 }
 $$('.binding-tabs [data-bind-mode]').forEach(b=>b.classList.toggle('active',b.dataset.bindMode===bindMode));
 const diagram=$('#controller-diagram');diagram.replaceChildren();
 const locations={LT:[70,20],RT:[350,20],LB:[70,75],RB:[350,75],View:[164,48],Menu:[249,48],Up:[112,158],Left:[45,221],Right:[181,221],Down:[112,284],Y:[350,158],X:[285,221],B:[410,221],A:[350,284]};
 for(const [key,[x,y]]of Object.entries(locations)){const group=document.createElement('div');group.className='diagram-key';group.style.left=x+'px';group.style.top=y+'px';const icon=document.createElement('i');setIcon(icon,iconKey(key));const label=document.createElement('span');label.textContent=actionText(appearance.bindings[bindMode][key]);group.append(icon,label);diagram.append(group);}
}
function renderPreview(){
 const dual=appearance.keyboardMode==='dual';const holder=$('.preview-wheels');holder.classList.toggle('dual',dual);holder.style.transform='scale('+(.58*appearance.scale/100)+')';holder.style.left=dual?'-227px':'-3px';
 const fallback={mode:previewDisc,selected:null,shift:false};right.update(runtime.active?(runtime.right??runtime):fallback);left.update(runtime.active?(runtime.left??fallback):{...fallback,mode:appearance.leftDisc});
 for(const pulse of runtime.pulses??[])(pulse.side==='left'?left:right).pulse(pulse.side==='left'?runtime.left:runtime.right??runtime,pulse.slot);
 if(runtime.pulses?.length)setTimeout(()=>$$('.pulse').forEach(el=>el.classList.remove('pulse')),80);
 $$('.disc-tabs button').forEach(b=>{b.classList.toggle('active',Number(b.dataset.disc)===(runtime.active?runtime.mode:previewDisc));b.disabled=!runtime.connected;});
}
function deviceView(){
 document.body.classList.toggle('connected',!!runtime.connected);
 $('#device-name').textContent=runtime.connected?(runtime.device?.name??t('chooseDevice')):t('disconnected');
 const kind=runtime.device?.kind??'generic',host=$('#model-icon');host.dataset.kind=kind;host.replaceChildren();
 if(runtime.connected&&FIGMA_ASSETS[kind]){const image=document.createElement('img');image.src=FIGMA_ASSETS[kind].src;host.append(image);}
}
function render(){
 document.documentElement.lang=system.locale;
 applyTheme(system.theme);if(system.theme==='system'&&system.resolvedTheme)document.documentElement.dataset.theme=system.resolvedTheme;
 applyWheelStyle(appearance);
 $$('[data-copy]').forEach(el=>el.textContent=t(el.dataset.copy));
 $('[data-tab="appearance"]').firstChild.textContent=t('appearance')+' ';
 $('[data-tab="controller"]').textContent=t('controller');$('[data-action="start"]').textContent=t('start');
 $('[data-action="close-choice"]').textContent=t(system.closeBehavior);
 $$('[data-setting]').forEach(el=>{const v=appearance[el.dataset.setting];el.value=v;el.disabled=!runtime.connected;el.style.setProperty('--progress',((v-Number(el.min))/(Number(el.max)-Number(el.min))*100)+'%');});
 $$('[data-system="theme"]').forEach(el=>{el.value=['light','system','dark'].indexOf(system.theme);el.disabled=!runtime.connected;});
 $('[data-system="startAtLogin"]').checked=system.startAtLogin;
 $$('[data-opacity]').forEach(el=>{el.classList.toggle('active',Number(el.dataset.opacity)===appearance.opacity);el.disabled=!runtime.connected;});
 $$('[data-mode]').forEach(el=>{el.classList.toggle('active',el.dataset.mode===appearance.keyboardMode);el.disabled=!runtime.connected;});
 $$('[data-select-setting]').forEach(el=>{el.textContent=['abc','ABC','123'][appearance[el.dataset.selectSetting]]+' ⌄';el.disabled=!runtime.connected;});
 $('[data-action="restore"]').disabled=!runtime.connected;
 $('#right-stick-role').textContent=t(appearance.keyboardMode==='dual'?'selection':'mouse');
 for(const side of ['left','right'])$('[data-stick="'+side+'"] .deadzone-circle').style.cssText='width:'+appearance['deadzone'+(side==='left'?'Left':'Right')]+'%;height:'+appearance['deadzone'+(side==='left'?'Left':'Right')]+'%';
 renderBindings();deviceView();renderPreview();
}
$$('[data-tab]').forEach(button=>button.onclick=()=>{$$('[data-tab]').forEach(b=>b.classList.toggle('active',b===button));$('#appearance-page').hidden=button.dataset.tab!=='appearance';$('#controller-page').hidden=button.dataset.tab!=='controller';$('#popup').hidden=true;});
$$('[data-bind-mode]').forEach(button=>button.onclick=()=>{bindMode=button.dataset.bindMode;renderBindings();});
$$('[data-setting]').forEach(input=>input.addEventListener(input.type==='range'?'input':'change',()=>{const value=Number(input.value);if(Number.isFinite(value))save({[input.dataset.setting]:Math.max(Number(input.min),Math.min(Number(input.max),value))});}));
$$('[data-opacity]').forEach(b=>b.onclick=()=>save({opacity:Number(b.dataset.opacity)}));
$$('[data-mode]').forEach(b=>b.onclick=()=>save({keyboardMode:b.dataset.mode}));
$$('[data-disc]').forEach(b=>b.onclick=()=>{previewDisc=Number(b.dataset.disc);renderPreview();});
$('[data-system="theme"]').oninput=e=>saveSystem({theme:['light','system','dark'][Number(e.target.value)]});
$('[data-system="startAtLogin"]').onchange=e=>saveSystem({startAtLogin:e.target.checked});
$$('[data-select-setting]').forEach(b=>b.onclick=()=>selectSetting(b,b.dataset.selectSetting,[[0,'abc'],[1,'ABC'],[2,'123']]));
$$('[data-window]').forEach(b=>b.onclick=()=>call('windowAction',b.dataset.window).catch(e=>notice(e.message)));
$('[data-action="start"]').onclick=()=>call('windowAction','hide').catch(e=>notice(e.message));
$('[data-action="restore"]').onclick=()=>save({bindings:{...appearance.bindings,[bindMode]:normalizeBindings()[bindMode]}});
$('[data-action="language"]').onclick=e=>showOptions(e.currentTarget,t('language'),[['zh-CN','简体中文'],['en','English'],['ja','日本語']].map(([value,label])=>({value,label,selected:value===system.locale})),value=>saveSystem({locale:value}));
$('[data-action="close-choice"]').onclick=e=>showOptions(e.currentTarget,t('closeBehavior'),['tray','quit'].map(value=>({value,label:t(value),selected:system.closeBehavior===value})),value=>saveSystem({closeBehavior:value}));
$('[data-action="device"]').onclick=e=>showOptions(e.currentTarget,t('chooseDevice'),(runtime.devices??[]).map(d=>({value:d.id,label:d.name,selected:d.id===runtime.selectedDevice})),async id=>{const result=await call('controllerAction',{action:'select',id});if(!result.ok)notice(result.error??t('failed'));});
async function maintenance(action,button){
 try{
  notice(t('checking'));
  const result=await call('systemAction',{action});
  $('#notice').hidden=true;
  if(!result.ok){showMessage(button,t(action==='diagnose'?'repair':'update'),result.error??t('failed'));return;}
  if(action==='check-update'){
   $('#update-dot').hidden=!result.available;
   showMessage(button,t('update'),result.available?'Conroller Plus '+result.version:t('latest'),result.available?[{label:t('download'),run:()=>maintenance('download-update',button)}]:[]);
  }else if(action==='download-update'){
   showMessage(button,t('update'),t('complete'),[{label:t('restart'),run:()=>maintenance('install-update',button)}]);
  }else if(action==='diagnose'){
   const checks=result.details?.checks??result.checks??[];const problems=checks.filter(c=>!c.ok);
   showMessage(button,t('repair'),problems.length?problems.map(c=>c.name??c.file??c.code).join('\n')+'\n\n'+t('repairConfirm'):t('noIssues'),problems.length?[{label:t('confirm'),run:()=>maintenance('repair',button)}]:[]);
  }else notice(t('complete'));
 }catch(e){notice(e.message??t('failed'));}
}
$('[data-action="update"]').onclick=e=>maintenance('check-update',e.currentTarget);
$('[data-action="repair"]').onclick=e=>maintenance('diagnose',e.currentTarget);
desktop.onAppearance?.(a=>{appearance=normalizeAppearance(a);render();});
desktop.onSystem?.(s=>{system={...normalizeSystem(s),resolvedTheme:s.resolvedTheme};$('#update-dot').hidden=!s.updateAvailable;render();});
desktop.onRuntime?.(s=>{const changed=runtime.connected!==s.connected||runtime.device?.id!==s.device?.id;runtime=s;if(changed)render();else{deviceView();renderPreview();}});
desktop.onController?.(s=>{
 for(const [side,x,y]of [['left',s.x,s.y],['right',s.rx,s.ry]]){
  const group=$('[data-stick="'+side+'"]');group.querySelector('output').textContent=[x??0,y??0].map(v=>Number(v).toFixed(2)).join(', ');
  const point=group.querySelector('.stick-point');point.style.left=(50+Math.max(-1,Math.min(1,x??0))*50)+'%';point.style.top=(50+Math.max(-1,Math.min(1,y??0))*50)+'%';
 }
});
try{const [a,s,r]=await Promise.all([call('getAppearance'),call('getSystem'),call('getRuntime')]);appearance=normalizeAppearance(a);system={...normalizeSystem(s),resolvedTheme:s.resolvedTheme};runtime=r;}catch{}
render();watchSystemTheme(()=>render());document.body.dataset.ready='true';
