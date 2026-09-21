export const LOCALES=['zh-CN','en','ja'];
export function windowsLocale(value='en'){
 if(/^zh-(CN|SG|Hans)(-|$)/i.test(value))return 'zh-CN';
 if(/^ja(-|$)/i.test(value))return 'ja';
 return 'en';
}
export function normalizeSystem(value={},displayLanguage=globalThis.navigator?.language??'en'){
 if(!value||typeof value!=='object')value={};
 return {schemaVersion:2,locale:LOCALES.includes(value.locale)?value.locale:windowsLocale(displayLanguage),theme:['system','light','dark'].includes(value.theme)?value.theme:'system',startAtLogin:value.startAtLogin===true,closeBehavior:value.closeBehavior==='quit'?'quit':'tray'};
}
