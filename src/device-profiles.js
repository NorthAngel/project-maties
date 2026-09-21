import {normalizeAppearance} from './appearance.js';
const record=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
export function deviceKey(device){
 if(!device)return '';
 const model=String(device.guid??device.name??'unknown');
 if(device.serial)return JSON.stringify([model,'serial',String(device.serial)]);
 if(device.path)return JSON.stringify([model,'path',String(device.path)]);
 // Identical devices without serial/path share a model profile. XInput slots are not permanent identities.
 return JSON.stringify([device.backend??'', 'model', /^xinput:/i.test(model)?'xinput':model]);
}
function profile(value){const a=normalizeAppearance(value);return {bindings:a.bindings,deadzoneLeft:a.deadzoneLeft,deadzoneRight:a.deadzoneRight};}
export function normalizeControllerSettings(value={}){
 value=record(value);
 return {preferredKey:typeof value.preferredKey==='string'?value.preferredKey:'',profiles:Object.fromEntries(Object.entries(record(value.profiles)).map(([key,v])=>[key,profile(v)]))};
}
export function getDeviceProfile(settings,device){return profile(record(settings?.profiles)[deviceKey(device)]);}
export function setDeviceProfile(settings,device,patch){
 const next=normalizeControllerSettings(settings),key=deviceKey(device);
 if(key)next.profiles[key]=profile({...getDeviceProfile(next,device),...record(patch)});
 return next;
}
