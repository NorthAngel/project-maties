// Converts a guided physical calibration into SDL's standard gamepad mapping.
export const CALIBRATION_STEPS = [
 ['leftx','Ⓛ →','左摇杆向右',true],['lefty','Ⓛ ↓','左摇杆向下',true],
 ['rightx','Ⓡ →','右摇杆向右',false],['righty','Ⓡ ↓','右摇杆向下',false],
 ['a','↓','按下方按键（A / ×）',true],['b','→','按右侧按键（B / ○）',true],
 ['x','←','按左侧按键（X / □）',true],['y','↑','按上方按键（Y / △）',true],
 ['leftstick','L3','按下左摇杆',false],['rightstick','R3','按下右摇杆',false],
 ['dpup','✚ ↑','十字键向上',false],['dpdown','✚ ↓','十字键向下',false],
 ['dpleft','✚ ←','十字键向左',false],['dpright','✚ →','十字键向右',false],
 ['start','≡','按 Menu / Options',false],['back','▣','按 View / Create',false],
 ['leftshoulder','LB / L1','按左肩键',false],['rightshoulder','RB / R1','按右肩键',false],
 ['lefttrigger','LT / L2','按左扳机',false],['righttrigger','RT / R2','按右扳机',false],
].map(([key,glyph,label,required])=>({key,glyph,label,required}));
const axesKeys=new Set(['leftx','lefty','rightx','righty']);
const tokenPattern=/^(?:[+-]?a\d{1,2}~?|b\d{1,2}|h[0-3]\.[1248])$/;
export function validMapping(guid,mapping){
 if(!/^[0-9a-f]{32}$/.test(guid??'')||typeof mapping!=='string'||mapping.length>2048)return false;
 const [id,name,...parts]=mapping.split(',');if(id!==guid||name!=='Controller Companion')return false;
 const keys=new Set();for(const part of parts){if(!part||part==='platform:Windows')continue;const [key,value,...extra]=part.split(':');if(extra.length||!CALIBRATION_STEPS.some(s=>s.key===key)||keys.has(key)||!tokenPattern.test(value))return false;keys.add(key);}
 return CALIBRATION_STEPS.filter(s=>s.required).every(s=>keys.has(s.key));
}
export class Calibration {
 constructor(deviceId,guid){this.deviceId=deviceId;this.guid=guid;this.index=0;this.bindings={};this.baseline=null;this.waitRelease=false;this.done=false;this.message='松开所有按键，让摇杆回中';}
 get step(){return CALIBRATION_STEPS[this.index]??null;}
 centered(raw){return raw.buttons.every((v,i)=>v===this.baseline.buttons[i])&&raw.hats.every((v,i)=>v===this.baseline.hats[i])&&raw.axes.every((v,i)=>Math.abs(v-this.baseline.axes[i])<.2);}
 accept(token){if(Object.values(this.bindings).includes(token)){this.message='这个输入已使用，请换一个';return false;}this.bindings[this.step.key]=token;this.waitRelease=true;this.message='已识别 · 松开并回中';return true;}
 feed(deviceId,raw){
 if(deviceId!==this.deviceId||!raw||this.done)return false;
 if(!this.baseline){this.baseline=structuredClone(raw);this.message=this.step.label;return true;}
 if(raw.axes.length!==this.baseline.axes.length||raw.buttons.length!==this.baseline.buttons.length||raw.hats.length!==this.baseline.hats.length)return false;
 if(this.waitRelease){if(this.centered(raw)){this.waitRelease=false;this.index++;this.done=this.index>=CALIBRATION_STEPS.length;this.message=this.done?'校准完成':this.step.label;return true;}return false;}
 const axis=axesKeys.has(this.step.key),trigger=this.step.key.endsWith('trigger');
 const changedAxes=raw.axes.map((v,i)=>({i,delta:v-this.baseline.axes[i]})).filter(a=>Math.abs(a.delta)>.65);
 if(axis||trigger){if(changedAxes.length===1){const {i,delta}=changedAxes[0];const usedAxis=Object.entries(this.bindings).some(([key,t])=>axesKeys.has(key)&&t.replace('~','')===`a${i}`);if(usedAxis){this.message='这根摇杆轴已使用';return false;}const half=trigger&&Math.abs(this.baseline.axes[i])<.25;return this.accept(`${half?(delta>0?'+':'-'):''}a${i}${!half&&delta<0?'~':''}`);}if(axis)return false;}
 const pressed=raw.buttons.flatMap((v,i)=>v&&!this.baseline.buttons[i]?[i]:[]);
 if(pressed.length===1)return this.accept(`b${pressed[0]}`);
 const hats=raw.hats.flatMap((v,i)=>v!==this.baseline.hats[i]&&[1,2,4,8].includes(v)?[{i,v}]:[]);
 if(hats.length===1)return this.accept(`h${hats[0].i}.${hats[0].v}`);
 return false;
 }
 skip(){if(this.done||this.waitRelease||this.step.required)return false;this.index++;this.done=this.index>=CALIBRATION_STEPS.length;this.message=this.done?'校准完成':this.step.label;return true;}
 mapping(){if(!this.done)throw Error('校准尚未完成');const mapping=`${this.guid},Controller Companion,${Object.entries(this.bindings).map(([key,value])=>`${key}:${value}`).join(',')},platform:Windows,`;if(!validMapping(this.guid,mapping))throw Error('校准数据不完整');return mapping;}
}
