using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using Microsoft.Win32;
using Forms=System.Windows.Forms;
namespace ProjectMaties {
 internal sealed class AppHost {
  internal const string Version="0.6.0";
  internal bool Testing {get;private set;}
  internal bool Quitting {get;private set;}
  readonly string root=AppDomain.CurrentDomain.BaseDirectory;
  readonly string data;
  readonly Application app;
  BrowserWindow settings,overlay;
  NativeService native;
  Forms.NotifyIcon tray;
  Icon trayImage;
  Dictionary<string,object> appearance,controllers,system,runtime=new Dictionary<string,object>();
  string preview;
  bool maintenanceBusy,captureBusy,overlayActive;
  readonly TaskCompletionSource<bool> engineReady=new TaskCompletionSource<bool>();
  readonly TaskCompletionSource<bool> nativeReady=new TaskCompletionSource<bool>();
  static readonly JavaScriptSerializer Serializer=new JavaScriptSerializer{MaxJsonLength=8388608};
  internal static string Json(object value){return Serializer.Serialize(value);}
  internal static Dictionary<string,object> Parse(string value){return Serializer.DeserializeObject(value) as Dictionary<string,object>??new Dictionary<string,object>();}
  internal AppHost(Application application,bool testing){app=application;Testing=testing;data=testing?Path.Combine(root,"user-data-test"):Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),"ControllerCompanion");}
  internal async Task StartAsync(bool showSettings){
   Directory.CreateDirectory(data);
   bool firstRun=!File.Exists(Path.Combine(data,"appearance.json"));
   appearance=Read("appearance");controllers=Read("controllers");system=HostPolicy.NormalizeSystem(Read("system"));
   var browserData=Path.Combine(data,"WebView2");
   string flags="--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows"+(Testing?" --remote-debugging-port=9225":"");
   var environment=await CoreWebView2Environment.CreateAsync(null,browserData,new CoreWebView2EnvironmentOptions(flags));
   settings=new BrowserWindow(this,"settings");overlay=new BrowserWindow(this,"overlay");
   native=new NativeService(root,Testing);
   native.Message+=message=>app.Dispatcher.BeginInvoke(new Action(()=>Emit("native",message)));
   native.Failed+=message=>app.Dispatcher.BeginInvoke(new Action(()=>{StopInput();Emit("native",new{type="error",message});}));
   await LoadWindow(settings,environment);await LoadWindow(overlay,environment);
   if(await Task.WhenAny(engineReady.Task,Task.Delay(20000))!=engineReady.Task)throw new InvalidOperationException("运行引擎未加载，请检查 web 文件。");
   try{await native.StartAsync(controllers);nativeReady.TrySetResult(true);}catch(Exception ex){nativeReady.TrySetResult(false);Emit("native",new{type="error",message=ex.Message});}
   trayImage=new Icon(Path.Combine(root,"web","assets","app-icon.ico"));
   tray=new Forms.NotifyIcon{Icon=trayImage,Text="Controller Companion",Visible=true};
   tray.MouseClick+=(s,e)=>app.Dispatcher.BeginInvoke(new Action(()=>OpenSettings()));
   SystemEvents.UserPreferenceChanged+=PreferenceChanged;
   if(!Testing)SetLogin((bool)system["startAtLogin"]);
   if(showSettings||firstRun||Testing)OpenSettings();
  }
  async Task LoadWindow(BrowserWindow window,CoreWebView2Environment environment){
   var loaded=new TaskCompletionSource<bool>();
   window.Opacity=0;window.ShowActivated=false;window.ShowInTaskbar=false;
   window.Loaded+=async(s,e)=>{try{await window.InitializeAsync(environment,Path.Combine(root,"web"));loaded.TrySetResult(true);}catch(Exception ex){loaded.TrySetException(ex);}};
   window.Show();await loaded.Task;window.Hide();window.Opacity=1;
   if(window.Role=="settings"){window.ShowActivated=true;window.ShowInTaskbar=true;}
  }
  Dictionary<string,object> Read(string name){try{return Parse(File.ReadAllText(Path.Combine(data,name+".json")));}catch{return new Dictionary<string,object>();}}
  void Save(string name,object value){if(Testing)return;string path=Path.Combine(data,name+".json"),tmp=path+".tmp";File.WriteAllText(tmp,Json(value));if(File.Exists(path))File.Replace(tmp,path,null);else File.Move(tmp,path);}
  static Dictionary<string,object> Dict(object value){return value as Dictionary<string,object>??new Dictionary<string,object>();}
  internal async Task<object> RouteAsync(BrowserWindow sender,string method,object value){
   var d=Dict(value);
   if(method=="system.get")return SystemState();
   if(method=="appearance.get")return appearance;
   if(method=="runtime.get")return runtime;
   if(sender.Role!="settings")throw new InvalidOperationException("settings-only");
   switch(method){
    case "bootstrap":return new{appearance,controllers,ownPid=Process.GetCurrentProcess().Id,testing=Testing};
    case "engine.ready":engineReady.TrySetResult(true);return true;
    case "native.send":native?.Send(d);return true;
    case "controller.request":if(!native.IsRunning)await nativeReady.Task;return await native.RequestAsync(d);
    case "appearance.save":Save("appearance",d);appearance=d;return true;
    case "controllers.save":Save("controllers",d);controllers=d;return true;
    case "event.emit":{
     var name=HostPolicy.Text(d,"event");var payload=d.ContainsKey("payload")?d["payload"]:null;
     if(!new[]{"runtime","appearance","controller","system-notice"}.Contains(name))throw new InvalidOperationException("event-not-allowed");
     if(name=="runtime"){runtime=Dict(payload);engineReady.TrySetResult(true);}
     if(name=="appearance")appearance=Dict(payload);
     Emit(name,payload);return true;
    }
    case "overlay.set":{
     bool active=d.TryGetValue("active",out var v)&&v is bool b&&b;
     if(active){NativeWindows.Position(overlay,Dict(d.ContainsKey("packet")?d["packet"]:null),Dict(d.ContainsKey("appearance")?d["appearance"]:appearance),HostPolicy.Text(d,"layout","single"));if(!overlayActive){overlay.Show();NativeWindows.Escape(settings,true);}}
     else{overlay.Hide();NativeWindows.Escape(settings,false);}
     overlayActive=active;return true;
    }
    case "system.set":return SaveSystem(d);
    case "system.action":return await SystemAction(d);
    case "desktop.preview":try{return new{image=await CaptureAsync()};}catch{return new{error="无法捕捉桌面，点击重试"};}
    case "app.menu":OpenSettings();Emit("system-open",null);return true;
    case "window.action":{
     string action=value as string??HostPolicy.Text(d,"action");
     if(action=="close")CloseSettings();else if(action=="minimize"){StopInput();settings.WindowState=WindowState.Minimized;}
     else if(action=="quit")await QuitAsync();else if(action=="settings")OpenSettings();
     else if(action=="drag"&&System.Windows.Input.Mouse.LeftButton==System.Windows.Input.MouseButtonState.Pressed)settings.DragMove();
     return true;
    }
    default:throw new InvalidOperationException("unknown-method");
   }
  }
  internal void Emit(string name,object value){settings?.Emit(name,value);overlay?.Emit(name,value);}
  internal void StopInput(){try{if(native?.IsRunning==true)native.Send(new{type="end"});}catch{}Emit("stop",null);overlay?.Hide();overlayActive=false;if(settings!=null)NativeWindows.Escape(settings,false);}
  internal async void OpenSettings(){
   if(Quitting||settings==null)return;StopInput();
   if(preview==null&&!captureBusy){try{preview=await CaptureAsync();}catch{}}
   settings.WindowState=WindowState.Normal;settings.Show();settings.Activate();
   if(preview!=null)settings.Emit("desktop-preview",preview);Emit("system",SystemState());
  }
  internal void CloseSettings(){StopInput();Emit("settings-hidden",null);string action=HostPolicy.Text(system,"closeBehavior");if(action=="quit"){var unused=QuitAsync();}else if(action=="minimize")settings.WindowState=WindowState.Minimized;else settings.Hide();}
  async Task<string> CaptureAsync(){
   if(captureBusy)return preview;captureBusy=true;StopInput();bool visible=settings.IsVisible;settings.Hide();
   try{await Task.Delay(250);NativeWindows.Point p;NativeWindows.GetCursorPos(out p);var area=Forms.Screen.FromPoint(new System.Drawing.Point(p.X,p.Y)).Bounds;
    using(var source=new Bitmap(area.Width,area.Height)){
     using(var g=Graphics.FromImage(source))g.CopyFromScreen(area.Location,System.Drawing.Point.Empty,area.Size);
     double factor=Math.Min(1,Math.Min(1920.0/area.Width,1080.0/area.Height));
     using(var resized=new Bitmap(source,new System.Drawing.Size((int)(area.Width*factor),(int)(area.Height*factor))))using(var stream=new MemoryStream()){resized.Save(stream,System.Drawing.Imaging.ImageFormat.Jpeg);preview="data:image/jpeg;base64,"+Convert.ToBase64String(stream.ToArray());}
    }return preview;
   }finally{captureBusy=false;if(visible&&!Quitting){settings.Show();settings.Activate();}}
  }
  Dictionary<string,object> SystemState(){var d=new Dictionary<string,object>(system);d["version"]=Version;d["resolvedTheme"]=ResolvedTheme();return d;}
  string ResolvedTheme(){var theme=HostPolicy.Text(system,"theme");if(theme!="system")return theme;try{using(var key=Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"))return Convert.ToInt32(key?.GetValue("AppsUseLightTheme",1))==0?"dark":"light";}catch{return "light";}}
  void PreferenceChanged(object sender,UserPreferenceChangedEventArgs e){app.Dispatcher.BeginInvoke(new Action(()=>{if(!Quitting)Emit("system",SystemState());}));}
  object SaveSystem(Dictionary<string,object> value){var combined=new Dictionary<string,object>(system);foreach(var item in value)combined[item.Key]=item.Value;var next=HostPolicy.NormalizeSystem(combined);bool before=(bool)system["startAtLogin"],after=(bool)next["startAtLogin"];
   try{if(before!=after)SetLogin(after);Save("system",next);}catch{if(before!=after)SetLogin(before);throw;}system=next;var state=SystemState();Emit("system",state);return state;
  }
  void SetLogin(bool enabled){if(Testing)return;using(var key=Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run")){if(enabled)key.SetValue("ControllerCompanion","\""+Path.Combine(root,"ControllerCompanion.exe")+"\"");else key.DeleteValue("ControllerCompanion",false);}}
  internal void BrowserFailed(string reason){StopInput();File.WriteAllText(Path.Combine(data,"host-error.log"),"WebView2: "+reason);MessageBox.Show("界面组件已停止。请重新打开软件。\n"+reason,"Controller Companion");var unused=QuitAsync();}
  internal async Task QuitAsync(){if(Quitting)return;StopInput();Quitting=true;SystemEvents.UserPreferenceChanged-=PreferenceChanged;tray?.Dispose();trayImage?.Dispose();if(native!=null){try{await native.StopAsync();}finally{native.Dispose();}}overlay?.DisposeBrowser();settings?.DisposeBrowser();app.Shutdown();}
  async Task<object> SystemAction(Dictionary<string,object> value){
   string action=HostPolicy.Text(value,"action");
   if(maintenanceBusy)return new{ok=false,code="maintenance-busy"};
   if(action=="quit"){var scheduled=app.Dispatcher.BeginInvoke(new Action(async()=>await QuitAsync()));return new{ok=true};}
   if(action=="language-settings"){OpenExternal("ms-settings:regionlanguage");return new{ok=true,code="language-settings-opened"};}
   if(action=="firmware")return Firmware();
   if(action!="diagnose"&&action!="repair"&&action!="update")return new{ok=false,code="action-failed"};
   maintenanceBusy=true;StopInput();Emit("maintenance",true);
   try{
    if(action=="diagnose"){var checks=await Task.Run(()=>Maintenance.Diagnose(root));bool running=native.IsRunning;return new{ok=true,code=checks.All(x=>x.TryGetValue("ok",out var b)&&b is bool v&&v)&&running?"diagnostics-ok":"diagnostics-issues",details=new{checks,serviceRunning=running,devices=runtime.ContainsKey("devices")?runtime["devices"]:new object[0],backend=HostPolicy.Text(runtime,"backend"),inputLanguage=HostPolicy.Text(runtime,"inputLanguage")}};}
    if(action=="repair"){await native.StopAsync();var restored=await Task.Run(()=>Maintenance.Repair(root));await native.StartAsync(controllers);Emit("native",new{type="ready"});return new{ok=true,code="repair-ok",details=new{restoredFiles=restored}};}
    using(var picker=new Forms.FolderBrowserDialog{Description="Controller Companion · "+Translate("native.updateChoose"),ShowNewFolderButton=false}){
     if(picker.ShowDialog()!=Forms.DialogResult.OK)return new{ok=true,code="update-cancelled"};
     var release=await Task.Run(()=>Maintenance.VerifyRelease(picker.SelectedPath,Version));
     if(MessageBox.Show(settings,"Controller Companion v"+release.Version+"\n\n"+Translate("native.updateDetail"),Translate("native.updateTitle"),MessageBoxButton.OKCancel)!=MessageBoxResult.OK)return new{ok=true,code="update-cancelled"};
     Process.Start(new ProcessStartInfo(release.Executable,"--settings"){UseShellExecute=true});await QuitAsync();return new{ok=true,code="update-ready"};
    }
   }catch(Exception ex){if(action=="repair"&&!native.IsRunning){try{await native.StartAsync(controllers);}catch{}}string code=ex.Message.Split(':')[0];return new{ok=false,code=code.StartsWith("update-")||code.StartsWith("repair-")?code:"action-failed"};}
   finally{maintenanceBusy=false;if(!Quitting)Emit("maintenance",false);}
  }
  string Translate(string key){try{var translations=Parse(File.ReadAllText(Path.Combine(root,"web","native-translations.json")));var locale=HostPolicy.Text(system,"locale","zh-CN");return HostPolicy.Text(Dict(translations.ContainsKey(locale)?translations[locale]:null),key,key);}catch{return key;}}
  object Firmware(){
   var items=runtime.TryGetValue("devices",out var raw)?raw as object[]:null;var selected=runtime.ContainsKey("selectedDevice")?runtime["selectedDevice"]:null;
   var device=items?.Select(Dict).FirstOrDefault(d=>d.TryGetValue("id",out var id)&&Equals(id,selected));if(device==null)return new{ok=false,code="firmware-vendor-required"};
   string kind=HostPolicy.Text(device,"kind"),name=HostPolicy.Text(device,"name").ToLowerInvariant(),url;
   if(kind=="playstation")url="https://controller.dl.playstation.net/controller/lang/en/";
   else if(name.Contains("pico")||name.Contains("rp2040")||name.Contains("micropython"))url="https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html";
   else if(kind=="nintendo")url="https://en-americas-support.nintendo.com/app/answers/detail/a_id/26321/";
   else if(name.Contains("8bitdo"))url="https://support.8bitdo.com/";
   else if(kind=="xbox")url="https://support.xbox.com/help/hardware-network/controller/update-xbox-wireless-controller";
   else return new{ok=false,code="firmware-vendor-required"};
   OpenExternal(url);return new{ok=true,code="support-opened"};
  }
  static void OpenExternal(string url){Process.Start(new ProcessStartInfo(url){UseShellExecute=true});}
 }
 internal static class Program {
  [STAThread]static void Main(string[] args){
   bool testing=args.Contains("--test");
   using(var mutex=new Mutex(true,testing?"Local\\ProjectMaties.Test":"Local\\ProjectMaties.ControllerCompanion",out bool first)){
    if(!first){using(var wake=EventWaitHandle.OpenExisting(testing?"Local\\ProjectMaties.Test.Wake":"Local\\ProjectMaties.ControllerCompanion.Wake"))wake.Set();return;}
    using(var wake=new EventWaitHandle(false,EventResetMode.AutoReset,testing?"Local\\ProjectMaties.Test.Wake":"Local\\ProjectMaties.ControllerCompanion.Wake")){
     var app=new Application{ShutdownMode=ShutdownMode.OnExplicitShutdown};var host=new AppHost(app,testing);
     var waiter=ThreadPool.RegisterWaitForSingleObject(wake,(s,t)=>app.Dispatcher.BeginInvoke(new Action(host.OpenSettings)),null,-1,false);
     app.DispatcherUnhandledException+=(s,e)=>{e.Handled=true;Report(e.Exception);var unused=host.QuitAsync();};
     app.Startup+=async(s,e)=>{try{await host.StartAsync(args.Contains("--settings"));}catch(Exception ex){Report(ex);await host.QuitAsync();}};
     app.Run();waiter.Unregister(null);
    }
   }
  }
  static void Report(Exception ex){string path=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"ProjectMaties");Directory.CreateDirectory(path);File.WriteAllText(Path.Combine(path,"startup-error.log"),ex.ToString());MessageBox.Show("Controller Companion 无法启动。\n"+ex.Message+"\n\n请确认已安装 Microsoft Edge WebView2 Runtime。\n错误记录："+path,"Controller Companion");}
 }
}



