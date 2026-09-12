import {actionsDown} from './controls.js';

// Cursor motion remains time based so a slow or fast controller poll does not
// change the configured maximum speed. Wheel motion uses the same integration
// but emits fine WM_MOUSEWHEEL units instead of quantizing every event to 120.
export class PointerInput {
 constructor(){this.reset();}

 reset(){
  this.previous=new Set();
  this.lastTime=null;
  this.mode=null;
  this.fx=0;
  this.fy=0;
  this.scroll=0;
  this.scrollY=0;
  this.scrollVelocityX=0;
  this.scrollVelocityY=0;
  this.scrollRemainderX=0;
  this.scrollRemainderY=0;
  this.armed=false;
  this.slot=null;
 }

 transition(action,down){
  if(action.startsWith('mouse'))return {type:'button',button:action.slice(5).toLowerCase(),down};
  if(action.startsWith('modifier:'))return {type:'modifier',key:action.slice(9),down};
  return null;
 }

 releases(){return [...this.previous].map(a=>this.transition(a,false)).filter(Boolean);}

 smoothScroll(axis,value,deadzone,dt,speed){
  const vertical=axis==='vertical';
  const key=vertical?'scrollVelocityY':'scrollVelocityX';
  const remainderKey=vertical?'scrollRemainderY':'scrollRemainderX';
  const numeric=Number(value)||0;
  const magnitude=Math.abs(numeric);
  if(magnitude<=deadzone){
   this[key]=0;
   this[remainderKey]=0;
   return 0;
  }
  const normalized=Math.min(1,(magnitude-deadzone)/(1-deadzone));
  const target=Math.sign(numeric)*Math.pow(normalized,1.35)*speed*120;
  // A reversal starts from zero. This prevents stored fractional motion from
  // producing one last old-direction tick after the user changes direction.
  if(this[key]&&Math.sign(this[key])!==Math.sign(target)){
   this[key]=0;
   this[remainderKey]=0;
  }
  const alpha=dt<=0?0:1-Math.exp(-dt/0.08);
  this[key]+= (target-this[key])*alpha;
  const integrated=this[key]*dt+this[remainderKey];
  const units=Math.trunc(integrated);
  this[remainderKey]=integrated-units;
  return units;
 }

 step(p,active,settings,now,enabled=true){
  const events=[];
  if(!enabled||!p.connected||p.slot!==this.slot){
   events.push(...this.releases());
   this.reset();
   this.slot=p.connected?p.slot:null;
   return events;
  }
  const dt=this.lastTime===null?0:Math.max(0,Math.min(.06,(now-this.lastTime)/1000));
  this.lastTime=now;
  if(p.buttons===0)this.armed=true;
  const mode=active?(settings.keyboardMode==='dual'?'dual':'typing'):'idle';
  if(this.mode!==mode){
   events.push(...this.releases());
   this.previous.clear();
   this.fx=this.fy=this.scroll=this.scrollY=0;
   this.scrollVelocityX=this.scrollVelocityY=0;
   this.scrollRemainderX=this.scrollRemainderY=0;
   this.mode=mode;
   this.armed=p.buttons===0;
  }
  const down=actionsDown(p.buttons,settings.bindings,mode,settings.auxiliaryBindings);
  if(this.armed){
   for(const action of new Set([...down,...this.previous])){
    if(down.has(action)!==this.previous.has(action)){
     const event=this.transition(action,down.has(action));
     if(event)events.push(event);
    }
    if(down.has(action)&&!this.previous.has(action)){
     if(action.startsWith('key:'))events.push({type:'key',key:action.slice(4)});
     if(action==='app:keyboard')events.push({type:'keyboard'});
    }
   }
   this.previous=down;
  }
  // Modifiers must reach Windows before keys from the same controller packet.
  events.sort((a,b)=>Number(b.type==='modifier')-Number(a.type==='modifier'));
  if(mode==='dual')return events;

  const x=Number(active?p.rx:p.x)||0;
  const y=Number(active?p.ry:p.y)||0;
  const magnitude=Math.hypot(x,y);
  const deadzone=Math.max(0,Math.min(1,(Number(settings.deadzone)||0)/100));
  if(magnitude>deadzone){
   const speed=Math.pow(Math.min(1,(magnitude-deadzone)/(1-deadzone)),1.65)*(Number(settings.mouseSpeed)||0)*dt;
   this.fx+=x/magnitude*speed;
   this.fy+=y/magnitude*speed;
   const dx=Math.trunc(this.fx),dy=Math.trunc(this.fy);
   this.fx-=dx;this.fy-=dy;
   if(dx||dy)events.push({type:'move',dx,dy});
  }else this.fx=this.fy=0;

  if(!active){
   const scrollSpeed=Math.max(0,Number(settings.scrollSpeed)||0);
   const horizontal=this.smoothScroll('horizontal',Number(p.rx)||0,deadzone,dt,scrollSpeed);
   const vertical=this.smoothScroll('vertical',-(Number(p.ry)||0),deadzone,dt,scrollSpeed);
   if(horizontal)events.push({type:'scroll',delta:horizontal});
   if(vertical)events.push({type:'scroll',axis:'vertical',delta:vertical});
  }else{
   this.scrollVelocityX=this.scrollVelocityY=0;
   this.scrollRemainderX=this.scrollRemainderY=0;
  }
  return events;
 }
}
