export class RepeatActions {
 constructor(){this.reset();}
 reset(){this.held=new Map();}
 step(down,now,repeatable=new Set()){
  const fired=new Set();
  for(const key of this.held.keys())if(!down.has(key))this.held.delete(key);
  for(const key of down){
   if(!this.held.has(key)){fired.add(key);this.held.set(key,now+400);}
   else if(repeatable.has(key)&&now>=this.held.get(key)){fired.add(key);this.held.set(key,now+60);}
  }
  return fired;
 }
}
