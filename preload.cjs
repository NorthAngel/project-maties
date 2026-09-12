const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
 getSystem:()=>ipcRenderer.invoke('system-get'),setSystem:value=>ipcRenderer.invoke('system-set',value),
 onSystem:callback=>ipcRenderer.on('system',(_e,value)=>callback(value)),systemAction:value=>ipcRenderer.invoke('system-action',value),
 controllerAction:value=>ipcRenderer.invoke('controller-action',value),
 getAppearance:()=>ipcRenderer.invoke('appearance-get'),setAppearance:value=>ipcRenderer.invoke('appearance-set',value),
 onAppearance:callback=>ipcRenderer.on('appearance',(_e,value)=>callback(value)),
 getRuntime:()=>ipcRenderer.invoke('runtime-get'),onRuntime:callback=>ipcRenderer.on('runtime',(_e,value)=>callback(value)),onController:callback=>ipcRenderer.on('controller',(_e,value)=>callback(value)),
 captureDesktop:()=>ipcRenderer.invoke('desktop-preview'),onDesktop:callback=>ipcRenderer.on('desktop-preview',(_e,value)=>callback(value)),
 windowAction:action=>ipcRenderer.send('window-action',action),setEnabled:value=>ipcRenderer.invoke('enabled-set',value),menu:()=>ipcRenderer.send('app-menu')
});
