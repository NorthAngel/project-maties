import {RadialInput} from './radial.js';
import {actionsDown,normalizeBindings} from './controls.js';
import {DualActivation} from './activation.js';

export const BUTTONS={space:1,backspace:4,enter:2,shift:8,menu:16,toggle:64,lighter:256,solid:512,A:4096,B:8192,X:16384,Y:32768,R3:128};

export class InputSession {
 constructor(){
  this.radial=new RadialInput();
  this.leftRadial=new RadialInput();
  this.activation=new DualActivation();
  this.active=false;
  this.armed=false;
  this.lastSlot=null;
  this.previous=0;
  this.target=null;
  this.lastTarget=null;
  this.layout='single';
 }

 stop(){
  this.active=false;
  this.target=null;
  this.layout='single';
  this.radial.reset();
  this.leftRadial.reset();
  this.activation.reset();
  this.armed=false;
 }

 setLayout(layout,leftDisc=0,rightDisc=2){
  this.layout=layout==='dual'?'dual':'single';
  this.radial.reset();
  this.leftRadial.reset();
  if(this.layout==='dual'){
   this.radial.mode=rightDisc??2;
   this.leftRadial.mode=leftDisc??0;
  }else this.radial.mode=0;
 }

 toggle(packet,ownPid=-1,settings={},layout=settings.layout??settings.keyboardMode??'single'){
  if(this.active){this.stop();return false;}
  if(packet.pid===ownPid||packet.target==='0'||packet.target==null)return false;
  this.active=true;
  this.target=packet.target;
  this.setLayout(layout,settings.leftDisc,settings.rightDisc);
  return true;
 }

 blankResult(packet){
  return {events:[],toggled:false,layout:this.layout,layoutChanged:false,imeSwitch:false,opacity:0,pulses:[],pointerButtons:packet.buttons&~64,tapR3:false,tapCount:0};
 }

 step(packet,now,{enabled=true,deadzone=22,ownPid=-1,bindings=normalizeBindings(),auxiliaryBindings={},keyboardMode='single',leftDisc=0,rightDisc=2}={}){
  let result=this.blankResult(packet);
  const slotChanged=this.lastSlot!==null&&packet.slot!==this.lastSlot;
  const targetChanged=this.lastTarget!==null&&packet.target!==this.lastTarget;
  this.lastSlot=packet.connected?packet.slot:null;
  if(!packet.connected||slotChanged){
   this.stop();
   this.lastSlot=packet.connected?packet.slot:null;
   this.lastTarget=packet.target??null;
   this.previous=packet.buttons;
   this.armed=packet.buttons===0;
   result=this.blankResult(packet);
   result.pointerButtons=0;
   return result;
  }
  if(targetChanged&&!this.active){
   // Foreground changes also invalidate a pending L3/R3 edge while the
   // companion is idle; otherwise a later release could activate a stale
   // target after the user switched applications.
   this.stop();
   this.lastTarget=packet.target??null;
   this.previous=packet.buttons;
   this.armed=packet.buttons===0;
   result=this.blankResult(packet);
   result.pointerButtons=0;
   return result;
  }
  if(!enabled){
   this.stop();
   this.lastSlot=packet.connected?packet.slot:null;
   this.lastTarget=packet.target??null;
   this.previous=packet.buttons;
   this.armed=packet.buttons===0;
   result=this.blankResult(packet);
   result.pointerButtons=0;
   return result;
  }
  if(this.active&&packet.target!==this.target){
   this.stop();
   this.lastTarget=packet.target??null;
   result=this.blankResult(packet);
   result.toggled=true;
   result.pointerButtons=0;
   this.lastSlot=packet.slot;
   this.previous=packet.buttons;
   this.armed=packet.buttons===0;
   return result;
  }

  if(!this.armed&&packet.buttons===0){
   this.armed=true;
   this.activation.reset();
  }
  if(!this.armed){
   this.previous=packet.buttons;
   result.pointerButtons=packet.buttons&~64&~128;
   return result;
  }

  // Gesture interpretation is always live. The saved keyboardMode controls
  // only the settings preview; L3 means single and an overlapping L3+R3
  // edge means dual for the current target.
  const gesture=this.activation.step(packet.buttons,now);
  result.pointerButtons=gesture.pointerButtons;
  result.tapR3=gesture.tapR3;
  result.tapCount=gesture.tapCount;
  result.imeSwitch=gesture.imeSwitch;

  if(gesture.toggle){
   if(this.active&&this.layout===gesture.layout){
    this.stop();
    result.toggled=true;
    result.layoutChanged=true;
    result.layout=this.layout;
    result.pointerButtons=0;
    this.previous=packet.buttons;
    return result;
   }
   if(this.active){
    this.setLayout(gesture.layout,leftDisc,rightDisc);
    result.toggled=true;
    result.layoutChanged=true;
   }else if(this.toggle(packet,ownPid,{leftDisc,rightDisc},gesture.layout)){
    result.toggled=true;
    result.layoutChanged=true;
   }
   result.layout=this.layout;
  }

  if(this.active){
   const mode=this.layout==='dual'?'dual':'typing';
   const down=actionsDown(result.pointerButtons|(result.tapR3?128:0),bindings,mode,auxiliaryBindings);
   if(down.has('modifier:shift'))down.add('shift');
   if(mode==='typing'&&down.has('cycleRight'))down.add('menu');
   const previous=this.radial.previous;
   const axes=(x=0,y=0)=>Math.hypot(x,y)<deadzone/100?[0,0]:[x,y];
   const pulses=(model,keys,side)=>keys.flatMap((key,slot)=>down.has(key)&&!model.previous.has(side==='left'?key.slice(4):key)?[{side,slot}]:[]);
   if(mode==='dual'){
    const leftDown=new Set([...down].filter(k=>k==='shift'||k==='menu').concat([...down].filter(k=>k.startsWith('left')).map(k=>k.slice(4))));
    if(down.has('cycleLeft'))leftDown.add('menu');
    const rightDown=new Set(down);if(down.has('cycleRight'))rightDown.add('menu');
    result.pulses=[...pulses(this.leftRadial,['leftY','leftA','leftX','leftB'],'left'),...pulses(this.radial,['Y','A','X','B'],'right')];
    result.events=[...this.leftRadial.step(...axes(packet.x,packet.y),leftDown,now),...this.radial.step(...axes(packet.rx,packet.ry),rightDown,now)];
   }else{
    result.pulses=pulses(this.radial,['Y','A','X','B'],'right');
    result.events=this.radial.step(...axes(packet.x,packet.y),down,now);
   }
   if(down.has('lighter')&&!previous.has('lighter'))result.opacity=-10;
   if(down.has('solid')&&!previous.has('solid'))result.opacity=10;
   // A deferred R3 tap has a release in this same packet, so consecutive
   // replayed taps each produce an edge without re-triggering held face keys.
   if(result.tapR3){
    const up=actionsDown(result.pointerButtons,bindings,mode,auxiliaryBindings);
    if(up.has('modifier:shift'))up.add('shift');
    if(mode==='dual'){
     const leftUp=new Set([...up].filter(k=>k==='shift'||k==='menu').concat([...up].filter(k=>k.startsWith('left')).map(k=>k.slice(4))));
     if(up.has('cycleLeft'))leftUp.add('menu');
     const rightUp=new Set(up);if(up.has('cycleRight'))rightUp.add('menu');
     this.leftRadial.step(...axes(packet.x,packet.y),leftUp,now);this.radial.step(...axes(packet.rx,packet.ry),rightUp,now);
    }else{if(up.has('cycleRight'))up.add('menu');this.radial.step(...axes(packet.x,packet.y),up,now);}
   }
  }
  this.previous=packet.buttons;
  this.lastSlot=packet.slot;
  this.lastTarget=packet.target??null;
  result.layout=this.layout;
  return result;
 }
}
