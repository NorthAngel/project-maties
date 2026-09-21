import {RepeatActions} from './repeat-actions.js';
export const DISCS = [
 {name:'小写字母',label:'abc',chars:'abcdefghijklmnopqrstuvwxyz,.'},
 {name:'大写字母',label:'ABC',chars:'ABCDEFGHIJKLMNOPQRSTUVWXYZ,.'},
 {name:'数字与符号',label:'123',chars:'1234567890!@%^#$&*()-_+=:”<>'},
];
export function sectorFromStick(x,y,previous=null) {
 if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)===0)return null;
 const bearing=(Math.atan2(x,-y)*180/Math.PI+360)%360;
 const direction=Math.floor((bearing+22.5)/45)%8;
 if(direction===0)return null;
 if(previous!==null){const distance=Math.abs(((bearing-(previous+1)*45+540)%360)-180);if(distance<25.5)return previous;}
 return direction-1;
}
export function characterAt(mode,sector,slot,shift=false){
 if(sector===null||slot<0||slot>3)return '';
 const effective=shift&&mode<2?1-mode:mode;
 return [...DISCS[effective].chars][sector*4+slot]??'';
}
export class RadialInput{
 constructor(){this.mode=0;this.reset();}
 reset(){this.selected=null;this.shift=false;this.previous=new Set();this.repeat=new RepeatActions();}
 step(x,y,down,now){
  this.selected=sectorFromStick(x,y,this.selected);this.shift=down.has('shift');
  const pressed=k=>down.has(k)&&!this.previous.has(k);
  if(pressed('cycleNext')||pressed('menu'))this.mode=(this.mode+1)%3;
  if(pressed('cyclePrevious'))this.mode=(this.mode+2)%3;
  const eligible=new Set([...down].filter(k=>!['Y','A','X','B'].includes(k)||this.selected!==null));
  const fired=this.repeat.step(eligible,now,new Set(['Y','A','X','B','space','backspace','enter']));
  const events=[];this.pulses=[];
  for(const [slot,key] of ['Y','A','X','B'].entries())if(fired.has(key)){
   const value=characterAt(this.mode,this.selected,slot,this.shift);if(value){events.push({type:'text',value});this.pulses.push(slot);}
  }
  for(const action of ['space','backspace','enter'])if(fired.has(action))events.push(action==='backspace'?{type:'backspace'}:{type:'text',value:action==='space'?' ':'\n'});
  this.previous=new Set(down);return events;
 }
}
