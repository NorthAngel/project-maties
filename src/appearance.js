import {normalizeBindings,normalizeAuxiliary} from './controls.js';
const bounded=(v,min,max,fallback)=>Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
const color=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(v??'')?v:fallback;
export function normalizeAppearance(value={}) {
 return {schemaVersion:5,keyboardMode:value.keyboardMode==='single'?'single':'dual',chordInterval:bounded(value.chordInterval,50,1000,300),leftDisc:bounded(value.leftDisc,0,2,0)|0,rightDisc:bounded(value.rightDisc,0,2,2)|0,mode:'wheel',opacity:bounded(value.opacity,0,100,15),ink:['white','custom'].includes(value.ink)?value.ink:'original',scale:bounded(value.scale,55,110,85),deadzone:bounded(value.deadzone,12,40,22),mouseSpeed:bounded(value.mouseSpeed,150,6400,850),scrollSpeed:bounded(value.scrollSpeed,1,16,6),outlineColor:color(value.outlineColor,'#1058f9'),outlineWidth:bounded(value.outlineWidth,1,8,3),fillColor:color(value.fillColor,'#ffffff'),textColor:color(value.textColor,'#444444'),bindings:normalizeBindings(value.bindings),auxiliaryBindings:normalizeAuxiliary(value.auxiliaryBindings)};
}
export function migrateSettings(value={}){const next=structuredClone(value);if(!value.schemaVersion||value.schemaVersion<5){next.bindings??={};next.bindings.idle??={};for(const [key,action] of [['A','mouseLeft'],['B','mouseRight']])if(!next.bindings.idle[key]||next.bindings.idle[key]==='none')next.bindings.idle[key]=action;}return normalizeAppearance(next);}
export function applyWheelStyle(a,root=document.documentElement){
 const theme=root?.dataset?.theme??(globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light');
 const defaultFill=(a.fillColor??'').toLowerCase()==='#ffffff';
 const glyph=a.ink==='custom'?a.textColor:a.ink==='white'?'#fff':theme==='dark'?'rgba(255,255,255,.84)':'rgba(0,0,0,.65)';
 const fill=defaultFill&&theme==='dark'?'#26364a':a.fillColor;
 root.style.setProperty('--material-alpha',a.opacity/100);
 root.style.setProperty('--material-color',fill);
 root.style.setProperty('--glyph-color',glyph);
 root.style.setProperty('--selection-color',a.outlineColor);
 root.style.setProperty('--selection-width',a.outlineWidth);
}
