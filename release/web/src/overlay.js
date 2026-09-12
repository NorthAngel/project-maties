import {createWheel} from './wheel-view.js';
import {applyWheelStyle} from './appearance.js';
import {applyTheme, watchSystemTheme} from './theme.js';
const right=await createWheel(document.querySelector('#sectors'));
const leftHost=document.createElement('div');leftHost.id='left-sectors';document.querySelector('#wheel').prepend(leftHost);
const left=await createWheel(leftHost);let dual=false;let system={theme:'system',resolvedTheme:''};let currentAppearance=null;
function resize(){document.documentElement.style.setProperty('--wheel-scale',Math.min(innerWidth/(dual?1584.356:768.178),innerHeight/714.608));}
function applySystem(value={}){system={...system,...value};const resolved=system.theme==='system'&&['light','dark'].includes(system.resolvedTheme)?system.resolvedTheme:applyTheme(system.theme,document.documentElement,window);document.documentElement.dataset.theme=resolved;if(currentAppearance)applyWheelStyle(currentAppearance);}
function applyAppearance(a){currentAppearance=a;applyWheelStyle(a);document.body.classList.toggle('dual',dual);resize();}
function runtime(s={}){if(s.layout==='single'||s.layout==='dual'){dual=s.layout==='dual';document.body.classList.toggle('dual',dual);resize();}right.update(s.right??s);left.update(s.left??{mode:0,selected:null,shift:false});for(const p of s.pulses||[]){const side=p.side??'right';(side==='left'?left:right).pulse(side==='left'?s.left:s.right??s,p.slot??p);setTimeout(()=>document.querySelectorAll('.pulse').forEach(e=>e.classList.remove('pulse')),160);}}
window.desktop.onAppearance(applyAppearance);window.desktop.onRuntime(runtime);window.desktop.onSystem?.(applySystem);
applySystem(await window.desktop.getSystem?.()??{});applyAppearance(await window.desktop.getAppearance());runtime(await window.desktop.getRuntime());
watchSystemTheme(()=>{if(system.theme==='system')applySystem(system);});
new ResizeObserver(resize).observe(document.body);document.body.dataset.ready='true';
