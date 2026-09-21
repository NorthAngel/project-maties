import {RadialInput} from './radial.js';
import {actionsDown,normalizeBindings} from './controls.js';
import {DualActivation} from './activation.js';
export const BUTTONS={space:1,backspace:4,enter:2,shift:8,menu:16,toggle:64,A:4096,B:8192,X:16384,Y:32768,R3:128};
export class InputSession{
 constructor(){this.radial=new RadialInput();this.leftRadial=new RadialInput();this.activation=new DualActivation();this.lastSlot=null;this.lastTarget=null;this.stop();}
 stop(){this.active=false;this.target=null;this.layout='single';this.radial.reset();this.leftRadial.reset();this.activation.reset();this.armed=false;}
 setLayout(layout,leftDisc=0,rightDisc=0){this.layout=layout==='dual'?'dual':'single';this.radial.reset();this.leftRadial.reset();this.radial.mode=this.layout==='dual'?rightDisc:leftDisc;this.leftRadial.mode=leftDisc;}
 toggle(packet,ownPid=-1,settings={},layout=settings.keyboardMode??'single'){
  if(this.active){this.stop();return false;}
  if(packet.pid===ownPid||packet.target==='0'||packet.target==null)return false;
  this.active=true;this.target=packet.target;this.setLayout(layout,settings.leftDisc,settings.rightDisc);return true;
 }
 blankResult(){return {events:[],toggled:false,layout:this.layout,layoutChanged:false,imeSwitch:false,opacity:0,pulses:[],pointerButtons:0,tapR3:false,tapCount:0};}
 step(packet,now,settings={}){
  const {enabled=true,ownPid=-1,keyboardMode='single',deadzoneLeft=10,deadzoneRight=10}=settings;
  const bindings=normalizeBindings(settings.bindings);
  const changed=this.lastSlot!==null&&packet.slot!==this.lastSlot;
  const targetChanged=this.lastTarget!==null&&packet.target!==this.lastTarget;
  this.lastSlot=packet.connected?packet.slot:null;this.lastTarget=packet.target??null;
  if(!packet.connected||changed||!enabled||targetChanged){this.stop();this.armed=packet.buttons===0;return this.blankResult();}
  if(packet.buttons===0)this.armed=true;
  if(!this.armed)return this.blankResult();
  const gesture=this.activation.step(packet.buttons,now);
  const result={...this.blankResult(),...gesture,layout:this.layout};
  if(gesture.toggle){
   this.toggle(packet,ownPid,settings,keyboardMode);
   result.toggled=true;result.layoutChanged=true;result.layout=this.layout;
   if(!this.active){result.pointerButtons=0;return result;}
  }
  if(!this.active)return result;
  const mode=this.layout==='dual'?'dual':'typing';
  const down=actionsDown(result.pointerButtons|(result.tapR3?128:0),bindings,mode);
  if(down.has('modifier:shift'))down.add('shift');
  const axes=(x=0,y=0,dz=10)=>Math.hypot(x,y)<=dz/100?[0,0]:[x,y];
  const sets=source=>{
   const right=new Set([...source].filter(k=>!k.startsWith('left')));
   const left=new Set([...source].filter(k=>k.startsWith('left')).map(k=>k.slice(4)));
   if(source.has('shift'))left.add('shift');
   if(source.has('cycleLeft'))left.add('cycleNext');
   if(source.has('cycleRight'))right.add('cycleNext');
   if(mode==='typing'&&source.has('cycleLeft'))right.add('cycleNext');
   return {left,right};
  };
  const run=source=>{
   const {left,right}=sets(source);
   if(mode==='dual')return [...this.leftRadial.step(...axes(packet.x,packet.y,deadzoneLeft),left,now),...this.radial.step(...axes(packet.rx,packet.ry,deadzoneRight),right,now)];
   return this.radial.step(...axes(packet.x,packet.y,deadzoneLeft),right,now);
  };
  result.events=run(down);
  result.pulses=[...(mode==='dual'?(this.leftRadial.pulses??[]).map(slot=>({side:'left',slot})):[]),...(this.radial.pulses??[]).map(slot=>({side:'right',slot}))];
  // Replayed R3 taps are complete press/release pairs.
  if(result.tapR3)run(actionsDown(result.pointerButtons,bindings,mode));
  result.layout=this.layout;return result;
 }
}
