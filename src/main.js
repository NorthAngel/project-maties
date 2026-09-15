import {InputManager} from './input.js';
import {RadialInput,DISCS,characterAt} from './radial.js';
import {createWheel} from './wheel-view.js';
import {normalizeAppearance} from './appearance.js';
const $=id=>document.getElementById(id);
const bindings={Y:{pad:'FACE_UP'},A:{pad:'FACE_DOWN'},X:{pad:'FACE_LEFT'},B:{pad:'FACE_RIGHT'},menu:{pad:'START'},space:{pad:'DPAD_UP'},backspace:{pad:'DPAD_LEFT'},enter:{pad:'DPAD_DOWN'},shift:{pad:'DPAD_RIGHT'},view:{pad:'SELECT'},lighter:{pad:'L1'},solid:{pad:'R1'}};
const input=new InputManager({bindings,deadzone:.22}).attach(),radial=new RadialInput(),editor=$('editor');
let focused=document.hasFocus(),armed=false,lastPad=null,viewKey='',lastPulse=0,mouseShift=false;
const wheelView=await createWheel($('sectors'));
let appearance=normalizeAppearance(window.desktop?await window.desktop.getAppearance():{});
function applyAppearance(value){
 appearance=normalizeAppearance(value);
 document.body.classList.toggle('wheel-mode',appearance.mode==='wheel');
 document.body.classList.toggle('practice-mode',appearance.mode==='practice');
 document.documentElement.style.setProperty('--material-alpha',appearance.opacity/100);
 document.documentElement.style.setProperty('--glyph-color',appearance.ink==='white'?'#fff':'rgba(0,0,0,.65)');
 $('material-opacity').value=appearance.opacity;$('material-value').textContent=`${appearance.opacity}%`;
 $('ink-toggle').textContent=appearance.ink==='white'?'字符：浅色':'字符：Figma 原色';
}
async function changeAppearance(value){applyAppearance(window.desktop?await window.desktop.setAppearance(value):{...appearance,...value});}
applyAppearance(appearance);
window.desktop?.onAppearance(applyAppearance);
$('enter-wheel').addEventListener('click',()=>changeAppearance({mode:'wheel'}));
$('material-opacity').addEventListener('input',e=>changeAppearance({opacity:Number(e.target.value)}));
document.querySelectorAll('[data-opacity]').forEach(b=>b.addEventListener('click',()=>changeAppearance({opacity:Number(b.dataset.opacity)})));
$('ink-toggle').addEventListener('click',()=>changeAppearance({ink:appearance.ink==='white'?'original':'white'}));
$('minimize-window').addEventListener('click',()=>window.desktop?.windowAction('minimize'));
$('close-window').addEventListener('click',()=>window.desktop?.windowAction('close'));
window.addEventListener('contextmenu',e=>{e.preventDefault();window.desktop?.contextMenu();});
let passthrough=null;
window.addEventListener('mousemove',e=>{const ignore=appearance.mode==='wheel'&&!e.target.closest('.letter,.plate path,.drag-zone');if(ignore!==passthrough){passthrough=ignore;window.desktop?.passMouse(ignore);}});
$('sectors').addEventListener('click',e=>{const tile=e.target.closest('.sector');if(!tile)return;radial.selected=Number(tile.dataset.sector);const letter=e.target.closest('.letter');if(letter){const slot=Number(letter.dataset.slot);write({type:'text',value:characterAt(radial.mode,radial.selected,slot,radial.shift)});pulse(radial.selected,slot);}render();});
function render(){
  const key=`${radial.mode}:${radial.selected}:${radial.shift}`;if(key===viewKey)return;viewKey=key;
  wheelView.update(radial);
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-selected',String(Number(b.dataset.mode)===radial.mode)));
  $('disc-name').textContent=DISCS[radial.mode].name;
  $('center-value').textContent=radial.selected===null?'就绪':Array.from({length:4},(_,b)=>characterAt(radial.mode,radial.selected,b,radial.shift)).join('');
  $('center-hint').textContent=radial.selected===null?'拨动摇杆开始':`扇区 ${radial.selected+1} / 7`;
  $('shift-indicator').classList.toggle('active',radial.shift);$('shift-indicator').textContent=radial.shift?'SHIFT · 已按下':'SHIFT · 按住十字键右';
}
function write(event){
  let start=editor.selectionStart,end=editor.selectionEnd;
  if(event.type==='backspace'){
    if(start===end&&start>0){const prefix=editor.value.slice(0,start),segments=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(prefix)];start=segments.at(-1)?.index??0;}
    editor.setRangeText('',start,end,'end');$('last-action').textContent='← 退格';
  }else{editor.setRangeText(event.value,start,end,'end');$('last-action').textContent=event.value===' '?'↑ 空格':event.value==='\n'?'↓ 回车':`已输入 ${event.value}`;}
  editor.scrollTop=editor.scrollHeight;updateCount();
}
function updateCount(){$('char-count').textContent=`${Array.from(editor.value).length} 字符`;}
function pulse(s,b){if(s===null)return;document.querySelectorAll('.pulse').forEach(e=>e.classList.remove('pulse'));wheelView.pulse(radial,b);lastPulse=performance.now();}
editor.addEventListener('input',updateCount);
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{radial.mode=Number(b.dataset.mode);render();}));
$('copy').addEventListener('click',async()=>{try{if(window.desktop)await window.desktop.copyText(editor.value);else await navigator.clipboard.writeText(editor.value);$('last-action').textContent='已复制到剪贴板';}catch{$('last-action').textContent='复制失败，请选中文本后 Ctrl+C';}});
$('deadzone').addEventListener('input',e=>{input.deadzone=Number(e.target.value)/100;$('deadzone-value').textContent=`${e.target.value}%`;});
function reset(){radial.reset();input._keys.clear();armed=false;document.querySelectorAll('.pulse').forEach(e=>e.classList.remove('pulse'));render();}
window.addEventListener('blur',()=>{focused=false;mouseShift=false;reset();});
window.addEventListener('focus',()=>{focused=true;armed=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){focused=false;reset();}else focused=document.hasFocus();});
window.addEventListener('keydown',e=>{if(e.key==='Shift'){mouseShift=true;radial.shift=true;render();}});
window.addEventListener('keyup',e=>{if(e.key==='Shift')mouseShift=false;});
new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;$('wheel').style.setProperty('--wheel-scale',Math.min(1,(width-2)/wheelView.size.width,(height-2)/wheelView.size.height));}).observe(document.querySelector('.wheel-space'));
function frame(now){
  input.poll();const pad=input.pad,padKey=pad?`${pad.index}:${pad.id}`:null;
  if(padKey!==lastPad){reset();lastPad=padKey;}
  const supported=pad?.mapping==='standard',down=new Set(Object.keys(bindings).filter(k=>input.isDown(k)));
  if(!armed&&focused&&supported&&down.size===0)armed=true;
  if(mouseShift)down.add('shift');
  if(focused&&supported&&armed){
    const stick=input.stick('LEFT'),previous=new Set(radial.previous);
    if(input.justPressed('view'))changeAppearance({mode:appearance.mode==='wheel'?'practice':'wheel'});
    if(input.justPressed('lighter'))changeAppearance({opacity:appearance.opacity-10});
    if(input.justPressed('solid'))changeAppearance({opacity:appearance.opacity+10});
    for(const event of radial.step(stick.x,stick.y,down,now))write(event);
    ['Y','A','X','B'].forEach((k,b)=>{if(down.has(k)&&!previous.has(k)&&radial.selected!==null)pulse(radial.selected,b);});
  }else radial.shift=mouseShift;
  const status=!focused?'窗口未激活 · 输入已暂停':!pad?'连接 Xbox 手柄，然后按任意键':!supported?'未识别为 Xbox 标准布局，请切换 XInput 模式':!armed?'手柄已连接 · 松开按键即可开始':'Xbox 手柄已连接';
  $('connection').classList.toggle('connected',Boolean(supported&&focused&&armed));
  if($('connection-text').textContent!==status)$('connection-text').textContent=status;
  $('connection').title=pad?.id??'';
  const foot=!focused?'输入已暂停':supported?'左摇杆选区 · Y / A / X / B 输入':'等待手柄连接';
  if($('footer-state').textContent!==foot)$('footer-state').textContent=foot;
  if(now-lastPulse>180)document.querySelectorAll('.pulse').forEach(e=>e.classList.remove('pulse'));
  render();requestAnimationFrame(frame);
}
render();requestAnimationFrame(frame);

window.desktop?.onCopy(()=>$('copy').click());
document.body.dataset.ready='true';
