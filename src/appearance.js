import {normalizeBindings} from './controls.js';
const bounded=(v,min,max,fallback)=>Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
export function normalizeAppearance(value={}) {
 value=value&&typeof value==='object'?value:{};
 return {schemaVersion:6,keyboardMode:value.keyboardMode==='dual'?'dual':'single',leftDisc:bounded(value.leftDisc,0,2,0)|0,rightDisc:bounded(value.rightDisc,0,2,0)|0,mode:'wheel',opacity:bounded(value.opacity,0,100,50),scale:bounded(value.scale,50,150,100),deadzoneLeft:bounded(value.deadzoneLeft,0,40,10),deadzoneRight:bounded(value.deadzoneRight,0,40,10),mouseSpeed:bounded(value.mouseSpeed,150,8000,5500),scrollSpeed:bounded(value.scrollSpeed,1,20,10),bindings:normalizeBindings(value.bindings)};
}
// The new application owns a separate config directory; no legacy migration.
export function migrateSettings(value={}){return normalizeAppearance(value);}
export function applyWheelStyle(a,root=document.documentElement){
 const theme=root?.dataset?.theme??(globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light');
 const dark=theme==='dark';
 root.style.setProperty('--material-alpha',a.opacity<=50?.1+.4*a.opacity/50:.5+.3*(a.opacity-50)/50);
 root.style.setProperty('--glass-blur',String(22*(1-a.opacity/100))+'px');
 root.style.setProperty('--glass-light',String(.72*(1-a.opacity/100)));
 root.style.setProperty('--material-color',dark?'#484848':'#ffffff');
 root.style.setProperty('--glyph-color',dark?'rgba(255,255,255,.65)':'rgba(0,0,0,.65)');
 root.style.setProperty('--selection-color',dark?'#394F3E':'#F77E2D');
 root.style.setProperty('--selection-width',3);
}

