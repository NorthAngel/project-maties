// L3 toggles immediately. R3 retains the existing 600 ms triple-tap arbitration.
export const L3_BUTTON=64;
export const R3_BUTTON=128;
export const CHORD_WINDOW_MS=300;
export const R3_TRIPLE_WINDOW_MS=600;

export class DualActivation {
 constructor(){this.reset();}

 reset(){
  this.previous=0;
  this.leftTime=null;
  this.rightTime=null;
  this.leftResolved=false;
  this.consumed=false;
  this.r3DownAt=null;
  this.r3Forwarded=false;
  this.r3Sequence=[];
  this.pendingTapCount=0;
  this.tapReadyAt=null;
 }

 result(buttons,layout=null,toggle=false,tapR3=false,tapCount=0,imeSwitch=false){
  let pointerButtons=buttons&~L3_BUTTON;
  if(!this.r3Forwarded||this.consumed)pointerButtons&=~R3_BUTTON;
  return {layout,toggle,tapR3,tapCount,imeSwitch,pointerButtons};
 }

 step(buttons,now){
  const current=Number.isFinite(now)?now:0;
  const left=!!(buttons&L3_BUTTON),right=!!(buttons&R3_BUTTON);
  const wasLeft=!!(this.previous&L3_BUTTON),wasRight=!!(this.previous&R3_BUTTON);
  const newLeft=left&&!wasLeft,newRight=right&&!wasRight;
  const releasedLeft=!left&&wasLeft,releasedRight=!right&&wasRight;
  let layout=null,toggle=false,tapR3=false,tapCount=0,imeSwitch=false;

  // A pending sequence is no longer eligible for a triple once its 600 ms
  // ambiguity window expires. Flush its short presses as ordinary R3 taps.
  if(this.r3Sequence.length&&current-this.r3Sequence[0]>R3_TRIPLE_WINDOW_MS){
   this.pendingTapCount+=this.r3Sequence.length;
   this.r3Sequence=[];
  }

  if(newLeft)toggle=true;
  if(newRight){
   this.rightTime=current;
   this.r3DownAt=current;
   this.r3Forwarded=false;
   if(!this.r3Sequence.length&&!this.pendingTapCount)this.tapReadyAt=current+R3_TRIPLE_WINDOW_MS;
   else if(this.tapReadyAt===null)this.tapReadyAt=current+R3_TRIPLE_WINDOW_MS;
  }

  if(releasedRight&&!this.consumed&&this.r3DownAt!==null){
   const duration=current-this.r3DownAt;
   const wasForwarded=this.r3Forwarded;
   // A short release is a candidate triple tap. A longer release that did
   // not reach the held-button timeout still retains one ordinary R3 tap.
   if(duration<=CHORD_WINDOW_MS){
    if(!this.r3Sequence.length||current-this.r3Sequence[0]<=R3_TRIPLE_WINDOW_MS)this.r3Sequence.push(current);
    else {this.pendingTapCount+=this.r3Sequence.length;this.r3Sequence=[current];}
    if(this.r3Sequence.length>=3&&current-this.r3Sequence[0]<=R3_TRIPLE_WINDOW_MS){
     this.r3Sequence=[];
     this.pendingTapCount=0;
     this.tapReadyAt=null;
     imeSwitch=true;
    }
   }else if(!wasForwarded){
    this.pendingTapCount++;
    if(this.tapReadyAt===null)this.tapReadyAt=this.r3DownAt+R3_TRIPLE_WINDOW_MS;
   }
   this.r3DownAt=null;
   this.r3Forwarded=false;
  }

  // Preserve a held R3 binding once triple recognition has timed out. The
  // strict comparison leaves the 600 ms edge available to a short release.
  if(right&&!this.consumed&&!this.r3Forwarded&&this.r3DownAt!==null&&current-this.r3DownAt>R3_TRIPLE_WINDOW_MS)this.r3Forwarded=true;

  if(!tapR3&&!imeSwitch&&!this.consumed&&!right&&this.pendingTapCount>0&&(this.tapReadyAt===null||current>=this.tapReadyAt)){
   tapR3=true;
   tapCount=1;
   this.pendingTapCount--;
   if(this.pendingTapCount===0&&!this.r3Sequence.length)this.tapReadyAt=null;
  }

  // A chord owns both buttons until the user releases both. This also clears
  // stale edge timestamps so a later press cannot form a latent chord.
  if(!left&&!right){
   if(this.consumed)this.consumed=false;
   this.leftTime=null;
   this.rightTime=null;
   this.leftResolved=false;
  }else{
   if(!left&&!this.consumed)this.leftTime=null;
   if(!right&&!this.consumed)this.rightTime=null;
  }

  this.previous=buttons;
  return this.result(buttons,layout,toggle,tapR3,tapCount,imeSwitch);
 }
}
