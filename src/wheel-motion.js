export const WHEEL_TRANSITION_MS=220;
export function springProgress(t){
 if(t<=0)return 0;if(t>=1)return 1;
 // Figma: mass 1, stiffness 220, damping 24. Compress its settling interval to 220 ms.
 const time=t*.62,decay=12,frequency=Math.sqrt(220-decay*decay);
 return 1-Math.exp(-decay*time)*(Math.cos(frequency*time)+decay/frequency*Math.sin(frequency*time));
}
export function transitionDisc(layer,visible){
 const current=getComputedStyle(layer);
 const opacity=Number(current.opacity),matrix=new DOMMatrix(current.transform);
 const scale=Math.hypot(matrix.a,matrix.b),angle=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
 layer.getAnimations().forEach(a=>a.cancel());
 const target={opacity:visible?1:0,scale:visible?1:.9,angle:visible?0:-18};
 const frames=Array.from({length:31},(_,i)=>{const p=springProgress(i/30);return {offset:i/30,opacity:opacity+(target.opacity-opacity)*p,transform:`rotate(${angle+(target.angle-angle)*p}deg) scale(${scale+(target.scale-scale)*p})`};});
 return layer.animate(frames,{duration:WHEEL_TRANSITION_MS,easing:'linear',fill:'none'});
}
