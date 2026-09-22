using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
namespace ProjectMaties {
 internal sealed class BrowserWindow : Window {
  internal readonly string Role;
  internal readonly WebView2CompositionControl View;
  readonly AppHost host;
  internal BrowserWindow(AppHost owner,string role) {
   host=owner;Role=role;Title=role=="settings"?"Conroller Plus":"Conroller Plus · 转盘";
   WindowStyle=WindowStyle.None;ShowActivated=role=="settings";ShowInTaskbar=role=="settings";
   Width=role=="settings"?893:768;Height=role=="settings"?917:715;
   MinWidth=role=="settings"?893:0;MinHeight=role=="settings"?917:0;
   ResizeMode=ResizeMode.NoResize;
   if(role=="overlay"){AllowsTransparency=true;Background=Brushes.Transparent;Topmost=true;Focusable=false;}
   else {AllowsTransparency=true;Background=Brushes.Transparent;}
   View=new WebView2CompositionControl{DefaultBackgroundColor=System.Drawing.Color.Transparent,Focusable=role=="settings",IsHitTestVisible=role=="settings"};
   Content=View;
   if(role=="settings"){View.Clip=new RectangleGeometry(new Rect(0,0,Width,Height),20,20);SizeChanged+=(s,e)=>View.Clip=new RectangleGeometry(new Rect(0,0,ActualWidth,ActualHeight),20,20);}
   SourceInitialized+=(s,e)=>{var h=new WindowInteropHelper(this).Handle;HwndSource.FromHwnd(h).AddHook(WindowProc);if(role=="overlay")NativeWindows.MakeOverlay(h);};
   Closing+=(s,e)=>{if(!host.Quitting){e.Cancel=true;if(role=="settings")host.CloseSettings();}};
   StateChanged+=(s,e)=>{if(WindowState==WindowState.Maximized)WindowState=WindowState.Normal;if(WindowState==WindowState.Minimized&&Role=="settings")host.HideSettings();};
  }
  IntPtr WindowProc(IntPtr hwnd,int msg,IntPtr wp,IntPtr lp,ref bool handled){if(msg==0x0312){host.StopInput();handled=true;}return IntPtr.Zero;}
  internal async Task InitializeAsync(CoreWebView2Environment environment,string webRoot) {
   await View.EnsureCoreWebView2Async(environment);
   var core=View.CoreWebView2;
   core.SetVirtualHostNameToFolderMapping("maties.local",webRoot,CoreWebView2HostResourceAccessKind.DenyCors);
   core.Settings.AreDevToolsEnabled=host.Testing;core.Settings.AreDefaultContextMenusEnabled=false;core.Settings.IsStatusBarEnabled=false;core.Settings.IsZoomControlEnabled=false;core.Settings.AreBrowserAcceleratorKeysEnabled=false;
   core.NewWindowRequested+=(s,e)=>e.Handled=true;
   core.PermissionRequested+=(s,e)=>e.State=CoreWebView2PermissionState.Deny;
   core.DownloadStarting+=(s,e)=>e.Cancel=true;
   core.NavigationStarting+=(s,e)=>{if(e.Uri!="https://maties.local/"+Role+".html")e.Cancel=true;};
   core.ProcessFailed+=(s,e)=>host.BrowserFailed(e.ProcessFailedKind.ToString());
   core.WebMessageReceived+=async(s,e)=>{
    string id=null;
    try {
     if(!HostPolicy.Trusted(e.Source)||e.WebMessageAsJson.Length>1048576)return;
     var request=AppHost.Parse(e.WebMessageAsJson);object requestId;
     if(request.TryGetValue("id",out requestId)&&requestId!=null)id=Convert.ToString(requestId);
     var result=await host.RouteAsync(this,HostPolicy.Text(request,"method"),request.ContainsKey("args")?request["args"]:null);
     if(id!=null)Reply(new{id=requestId,result});
    }catch(Exception ex){if(id!=null)Reply(new{id,error=ex.Message});}
   };
   await core.AddScriptToExecuteOnDocumentCreatedAsync("window.__hostRole='"+Role+"';document.addEventListener('DOMContentLoaded',()=>document.documentElement.dataset.hostRole='"+Role+"',{once:true});");
   core.Navigate("https://maties.local/"+Role+".html");
  }
  void Reply(object message){if(View.CoreWebView2!=null&&!host.Quitting)View.CoreWebView2.PostWebMessageAsJson(AppHost.Json(message));}
  internal void Emit(string name,object payload){Reply(new{ @event=name,payload });}
  internal void DisposeBrowser(){View.Dispose();}
 }
}
