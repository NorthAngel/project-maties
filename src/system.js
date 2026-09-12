export const LOCALES=['zh-CN','zh-TW','en','ja','fr','de','it','es'];
export function normalizeSystem(value={}){
 if(!value||typeof value!=='object')value={};
 return {schemaVersion:1,locale:LOCALES.includes(value.locale)?value.locale:'zh-CN',theme:['system','light','dark'].includes(value.theme)?value.theme:'system',startAtLogin:value.startAtLogin===true,closeBehavior:['tray','minimize','quit'].includes(value.closeBehavior)?value.closeBehavior:'tray'};
}
