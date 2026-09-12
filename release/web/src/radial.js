// Prototype interaction layer on top of web-gamepad-starter's InputManager.
export const DISCS = [
  {name:'小写字母',label:'abc',chars:'abcdefghijklmnopqrstuvwxyz,.'},
  {name:'大写字母',label:'ABC',chars:'ABCDEFGHIJKLMNOPQRSTUVWXYZ,.'},
  {name:'数字与符号',label:'123',chars:'1234567890!@%^#$&*()-_+=:”<>'},
];
export function sectorFromStick(x,y,previous=null) {
  if (!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<.08) return previous;
  const bearing=(Math.atan2(x,-y)*180/Math.PI+360)%360;
  if(previous!==null) {
    const distance=Math.abs(((bearing-(previous+1)*45+540)%360)-180);
    if(distance<25.5) return previous;
  }
  const direction=Math.floor((bearing+22.5)/45)%8;
  return direction===0?null:direction-1;
}
export function characterAt(mode,sector,slot,shift=false) {
  if(sector===null||slot<0||slot>3) return '';
  const effective=shift&&mode<2?1-mode:mode;
  return [...DISCS[effective].chars][sector*4+slot]??'';
}
export class RadialInput {
  constructor(){this.mode=0;this.reset();}
  reset(){this.selected=null;this.shift=false;this.previous=new Set();this.repeats=new Map();}
  step(x,y,down,now) {
    this.selected=sectorFromStick(x,y,this.selected);this.shift=down.has('shift');
    const pressed=k=>down.has(k)&&!this.previous.has(k);
    if(pressed('menu'))this.mode=(this.mode+1)%3;
    const events=[];
    for(const [slot,key] of ['Y','A','X','B'].entries()) if(pressed(key)) {
      const value=characterAt(this.mode,this.selected,slot,this.shift);
      if(value)events.push({type:'text',value});
    }
    for(const action of ['space','backspace','enter']) {
      const repeatable=action!=='enter';
      if(pressed(action)||(repeatable&&down.has(action)&&now>=(this.repeats.get(action)??Infinity))) {
        events.push(action==='backspace'?{type:'backspace'}:{type:'text',value:action==='space'?' ':'\n'});
        this.repeats.set(action,now+(pressed(action)?450:80));
      }
      if(!down.has(action))this.repeats.delete(action);
    }
    this.previous=new Set(down);return events;
  }
}
