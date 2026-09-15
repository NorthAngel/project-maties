using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading;
using System.Web.Script.Serialization;

// Private stdin/stdout bridge. No sockets, keyboard hooks, clipboard access or text logging.
class Bridge {
 [StructLayout(LayoutKind.Sequential)] struct Rect { public int left,top,right,bottom; }
 [StructLayout(LayoutKind.Sequential)] struct Point { public int x,y; }
 [StructLayout(LayoutKind.Sequential)] struct Gui { public int size; public uint flags; public IntPtr active,focus,capture,menu,move,caret; public Rect rect; }
 [StructLayout(LayoutKind.Sequential)] struct Keyboard { public ushort vk,scan; public uint flags,time; public UIntPtr extra; }
 [StructLayout(LayoutKind.Sequential)] struct Mouse { public int dx,dy; public uint data,flags,time; public UIntPtr extra; }
 [StructLayout(LayoutKind.Explicit,Size=32)] struct Union { [FieldOffset(0)] public Keyboard keyboard; [FieldOffset(0)] public Mouse mouse; }
 [StructLayout(LayoutKind.Sequential)] struct Input { public uint type; public Union data; }
 [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 [DllImport("user32.dll")] static extern bool GetGUIThreadInfo(uint thread,ref Gui g);
 [DllImport("user32.dll")] static extern bool ClientToScreen(IntPtr h,ref Point p);
 [DllImport("user32.dll")] static extern bool GetCursorPos(out Point p);
 [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h,out Rect r);
 [DllImport("user32.dll",SetLastError=true)] static extern uint SendInput(uint n,Input[] input,int size);
 [DllImport("user32.dll")] static extern short GetAsyncKeyState(int key);
 [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
 [DllImport("user32.dll")] static extern IntPtr GetKeyboardLayout(uint idThread);
 [DllImport("user32.dll",SetLastError=true)] static extern int GetKeyboardLayoutList(int nBuff,[Out] IntPtr[] lpList);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern short VkKeyScanEx(char ch,IntPtr dwhkl);
 [DllImport("user32.dll",SetLastError=true)] static extern bool PostMessage(IntPtr hWnd,uint msg,IntPtr wParam,IntPtr lParam);
 const uint WM_INPUTLANGCHANGEREQUEST=0x0050;
 static readonly object gate=new object(),output=new object();
 static readonly JavaScriptSerializer json=new JavaScriptSerializer();
 static volatile bool running=true, suppressInput=true;
 static bool testing;
 static readonly Queue<Dictionary<string,object>> controllerCommands=new Queue<Dictionary<string,object>>();
 static IntPtr target=IntPtr.Zero; static bool shift;
 static readonly HashSet<string> mouseHeld=new HashSet<string>();
 static readonly HashSet<string> modifierOwners=new HashSet<string>();
 static void Modifier(string key,string owner,bool down){ushort vk=key=="ctrl"?(ushort)17:(ushort)16;string token=key+":"+owner;bool before=false;foreach(string item in modifierOwners)if(item.StartsWith(key+":"))before=true;if(down)modifierOwners.Add(token);else modifierOwners.Remove(token);bool after=false;foreach(string item in modifierOwners)if(item.StartsWith(key+":"))after=true;if(before!=after)Send(Key(vk,0,after?0u:2u));}
 static void ReleaseModifiers(){bool ctrl=false,shifted=false;foreach(string item in modifierOwners){if(item.StartsWith("ctrl:"))ctrl=true;if(item.StartsWith("shift:"))shifted=true;}if(ctrl)Send(Key(17,0,2));if(shifted)Send(Key(16,0,2));modifierOwners.Clear();shift=false;}
 static void Emit(object value){lock(output){Console.WriteLine(json.Serialize(value));Console.Out.Flush();}}
 static Input Key(ushort vk,ushort scan,uint flags){return new Input{type=1,data=new Union{keyboard=new Keyboard{vk=vk,scan=scan,flags=flags}}};}
 static bool Send(params Input[] keys){bool ok=SendInput((uint)keys.Length,keys,Marshal.SizeOf(typeof(Input)))==keys.Length;if(!ok)Emit(new{type="error",message="系统未接受输入，请检查目标窗口权限"});return ok;}
 static ushort LanguageId(IntPtr hkl){return unchecked((ushort)(hkl.ToInt64()&0xffff));}
 static int LanguageFamily(IntPtr hkl){switch(LanguageId(hkl)&0x03ff){case 0x04:return 0;case 0x09:return 1;case 0x11:return 2;default:return -1;}}
 static string LanguageCode(IntPtr hkl){
  switch(LanguageId(hkl)){
   case 0x0804:return "zh-CN";
   case 0x0404:return "zh-TW";
   case 0x0411:return "ja-JP";
   case 0x0409:return "en-US";
   default:
    switch(LanguageFamily(hkl)){case 0:return "zh";case 1:return "en";case 2:return "ja";default:return "";}
  }
 }
 static bool IsCjk(string language){return language=="zh-CN"||language=="zh-TW"||language=="zh"||language=="ja-JP"||language=="ja";}
 static IntPtr[] InstalledLayouts(){
  int count=GetKeyboardLayoutList(0,null);if(count<=0)return new IntPtr[0];
  var layouts=new IntPtr[count];int actual=GetKeyboardLayoutList(count,layouts);if(actual<=0)return new IntPtr[0];
  if(actual==count)return layouts;var result=new IntPtr[actual];Array.Copy(layouts,result,actual);return result;
 }
 static IntPtr PreferredFamilyLayout(IntPtr[] layouts,int family){
  ushort[] preferred=family==0?new ushort[]{0x0804,0x0404}:family==1?new ushort[]{0x0409}:new ushort[]{0x0411};
  foreach(ushort lang in preferred)foreach(IntPtr layout in layouts)if(LanguageId(layout)==lang)return layout;
  foreach(IntPtr layout in layouts)if(LanguageFamily(layout)==family)return layout;
  return IntPtr.Zero;
 }
 static IntPtr NextInstalledLayout(IntPtr current,IntPtr[] layouts,out string language){
  language="";int currentFamily=LanguageFamily(current);
  for(int offset=1;offset<=3;offset++){
   int family=((currentFamily<0?2:currentFamily)+offset)%3;
   IntPtr selected=PreferredFamilyLayout(layouts,family);
   if(selected!=IntPtr.Zero){language=LanguageCode(selected);return selected;}
  }
  for(int family=0;family<3;family++){IntPtr selected=PreferredFamilyLayout(layouts,family);if(selected!=IntPtr.Zero){language=LanguageCode(selected);return selected;}}
  return IntPtr.Zero;
 }
 static string ForegroundLanguage(){
  IntPtr fg=GetForegroundWindow();if(fg==IntPtr.Zero)return "";uint pid;uint thread=GetWindowThreadProcessId(fg,out pid);return LanguageCode(GetKeyboardLayout(thread));
 }
 static void ImeResult(bool ok,string language,string error){Emit(new{type="ime-result",ok,language=language??"",error=error??""});}
 static void CycleIme(string targetText){
  long value; if(!Int64.TryParse(targetText,out value)){ImeResult(false,"","invalid-target");return;}
  IntPtr wanted=new IntPtr(value);if(wanted==IntPtr.Zero||GetForegroundWindow()!=wanted){ImeResult(false,"","target-not-foreground");return;}
  uint pid;uint thread=GetWindowThreadProcessId(wanted,out pid);IntPtr current=GetKeyboardLayout(thread);string language;IntPtr selected=NextInstalledLayout(current,InstalledLayouts(),out language);
  if(selected==IntPtr.Zero){ImeResult(false,LanguageCode(current),"no-supported-language");return;}
  if(!PostMessage(wanted,WM_INPUTLANGCHANGEREQUEST,IntPtr.Zero,selected)){ImeResult(false,LanguageCode(current),"input-language-request-failed");return;}
  // Posting a request is not proof that the foreground application accepted
  // it. Confirm the target thread's effective language before reporting success.
  IntPtr actual=IntPtr.Zero;
  for(int attempt=0;attempt<20;attempt++){
   if(GetForegroundWindow()!=wanted){ImeResult(false,ForegroundLanguage(),"target-not-foreground");return;}
   actual=GetKeyboardLayout(thread);if(LanguageId(actual)==LanguageId(selected))break;Thread.Sleep(15);
  }
  actual=GetKeyboardLayout(thread);
  if(LanguageId(actual)!=LanguageId(selected)){ImeResult(false,LanguageCode(actual),"input-language-not-applied");return;}
  // A modern TSF IME can remain on the previous profile after the HKL has
  // changed. Activate the user's Windows default profile before acknowledging
  // the language request, so subsequent SendInput keystrokes reach the chosen
  // IME rather than the previous language's converter.
  string profileError;
  if(IsCjk(LanguageCode(actual))&&!Ime.TryActivateDefault(actual,LanguageId(actual),out profileError)){
   ImeResult(false,LanguageCode(actual),"input-profile-not-applied:"+profileError);return;
  }
  ImeResult(true,LanguageCode(actual),"");
 }
 static bool SendImeCharacter(char value,IntPtr layout){
  short mapped=VkKeyScanEx(value,layout);if(mapped==-1)return false;
  ushort vk=unchecked((ushort)(mapped&0xff));byte modifiers=unchecked((byte)((mapped>>8)&0xff));var input=new List<Input>();
  bool addShift=(modifiers&1)!=0&&GetAsyncKeyState(16)>=0,addCtrl=(modifiers&2)!=0&&GetAsyncKeyState(17)>=0,addAlt=(modifiers&4)!=0&&GetAsyncKeyState(18)>=0;
  if(addShift)input.Add(Key(16,0,0));
  if(addCtrl)input.Add(Key(17,0,0));
  if(addAlt)input.Add(Key(18,0,0));
  input.Add(Key(vk,0,0));input.Add(Key(vk,0,2));
  if(addAlt)input.Add(Key(18,0,2));
  if(addCtrl)input.Add(Key(17,0,2));
  if(addShift)input.Add(Key(16,0,2));
  return Send(input.ToArray());
 }
 static void SendText(string value){
  IntPtr fg=GetForegroundWindow();uint pid;uint thread=GetWindowThreadProcessId(fg,out pid);IntPtr layout=GetKeyboardLayout(thread);string language=LanguageCode(layout);bool cjk=IsCjk(language);
  foreach(char ch in value){
   if(cjk&&ch<128&&ch!='\r'&&ch!='\n'&&ch!=' '){if(!SendImeCharacter(ch,layout)){Send(Key(0,ch,4),Key(0,ch,6));}}
   else Send(Key(0,ch,4),Key(0,ch,6));
  }
 }
 static Input MouseEvent(uint flags,int dx=0,int dy=0,int data=0){return new Input{type=0,data=new Union{mouse=new Mouse{dx=dx,dy=dy,data=unchecked((uint)data),flags=flags}}};}
 static uint MouseFlag(string button,bool down){return button=="left"?(down?2u:4u):button=="right"?(down?8u:16u):(down?32u:64u);}
 static void ReleaseMouse(){foreach(string b in mouseHeld)Send(MouseEvent(MouseFlag(b,false)));mouseHeld.Clear();}
 static void Release(){ReleaseModifiers();ReleaseMouse();target=IntPtr.Zero;}
 static void Command(Dictionary<string,object> c){lock(gate){
  string type=Convert.ToString(c["type"]);
  if(type=="quit"){Release();running=false;return;}
  if(type=="end"){Release();return;}
  if(type=="controller"){controllerCommands.Enqueue(c);return;}
  if(type=="ime"){
   if(Convert.ToString(c.ContainsKey("action")?c["action"]:"")=="cycle")CycleIme(Convert.ToString(c.ContainsKey("target")?c["target"]:""));
   else ImeResult(false,"","unknown-action");
   return;
  }
  if(suppressInput&&!testing){Release();return;}
  if(type=="pointer"){
   string action=Convert.ToString(c["action"]);
   if(action=="release"){ReleaseMouse();ReleaseModifiers();return;}
   if(GetForegroundWindow()==IntPtr.Zero)return;
   if(action=="move"){int dx=Math.Max(-512,Math.Min(512,Convert.ToInt32(c["dx"]))),dy=Math.Max(-512,Math.Min(512,Convert.ToInt32(c["dy"])));Send(MouseEvent(1,dx,dy));}
   if(action=="scroll")Send(MouseEvent(c.ContainsKey("axis")&&Convert.ToString(c["axis"])=="vertical"?0x0800u:0x1000u,0,0,Math.Max(-1920,Math.Min(1920,Convert.ToInt32(c["delta"])))));
   if(action=="button"){string b=Convert.ToString(c["button"]);if(b!="left"&&b!="right"&&b!="middle")return;bool down=Convert.ToBoolean(c["down"]);if(mouseHeld.Contains(b)!=down&&Send(MouseEvent(MouseFlag(b,down)))){if(down)mouseHeld.Add(b);else mouseHeld.Remove(b);}}
   if(action=="modifier"){string key=Convert.ToString(c["key"]);if(key=="ctrl"||key=="shift")Modifier(key,"pointer",Convert.ToBoolean(c["down"]));}
   if(action=="key"){
    string key=Convert.ToString(c["key"]);var keys=new Dictionary<string,ushort>{{"tab",9},{"escape",27},{"delete",46},{"left",37},{"up",38},{"right",39},{"down",40},{"home",36},{"end",35},{"space",32},{"backspace",8},{"enter",13},{"copy",67},{"paste",86},{"undo",90},{"mediaNext",176},{"mediaPrevious",177},{"mediaPlay",179}};
    for(char k='a';k<='z';k++)keys[k.ToString()]=(ushort)char.ToUpperInvariant(k);for(char k='0';k<='9';k++)keys[k.ToString()]=(ushort)k;for(int i=1;i<=12;i++)keys["f"+i]=(ushort)(111+i);
    if(keys.ContainsKey(key)){bool ctrl=key=="copy"||key=="paste"||key=="undo";if(ctrl&&GetAsyncKeyState(17)>=0)Send(Key(17,0,0),Key(keys[key],0,0),Key(keys[key],0,2),Key(17,0,2));else Send(Key(keys[key],0,0),Key(keys[key],0,2));}
   }
   return;
  }
  if(type=="begin"){Release();IntPtr wanted=new IntPtr(Convert.ToInt64(c["target"]));if(wanted!=IntPtr.Zero&&GetForegroundWindow()==wanted)target=wanted;return;}
  if(target==IntPtr.Zero||GetForegroundWindow()!=target){Release();return;}
  if(type=="shift"){bool value=Convert.ToBoolean(c["value"]);Modifier("shift","radial",value);shift=value;return;}
  if(type=="input"){
   // Do not turn an external Ctrl/Alt/Win hold into unintended shortcuts.
   if(GetAsyncKeyState(0x11)<0||GetAsyncKeyState(0x12)<0||GetAsyncKeyState(0x5B)<0||GetAsyncKeyState(0x5C)<0)return;
   string action=Convert.ToString(c["action"]),value=c.ContainsKey("value")?Convert.ToString(c["value"]):"";
   ushort vk=action=="backspace"?(ushort)8:value=="\n"?(ushort)13:value==" "?(ushort)32:(ushort)0;
   if(vk!=0){Send(Key(vk,0,0),Key(vk,0,2));return;}
   if(value.Length>8)return;
   SendText(value);
  }
 }}
 public static void Main(string[] args){
  Console.InputEncoding=new System.Text.UTF8Encoding(false);Console.OutputEncoding=new System.Text.UTF8Encoding(false);
  testing=Array.IndexOf(args,"--test-input")>=0;
  try{SetProcessDpiAwarenessContext(new IntPtr(-4));}catch{}
  var reader=new Thread(()=>{try{string line;while(running&&(line=Console.ReadLine())!=null){try{Command(new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(line));}catch{Emit(new{type="error",message="输入桥接指令无效"});}}}finally{lock(gate){Release();running=false;}}});reader.IsBackground=true;reader.Start();
  using(var input=new ControllerInput(AppDomain.CurrentDomain.BaseDirectory,Array.IndexOf(args,"--xinput-only")>=0)) {
  string lastDevices="";
  while(running){
   Dictionary<string,object> command=null;
   lock(gate){if(controllerCommands.Count>0)command=controllerCommands.Dequeue();}
   if(command!=null){
    string requestId=command.ContainsKey("requestId")?Convert.ToString(command["requestId"]):"";
    try {
     string action=Convert.ToString(command["action"]);
     if(action=="configure")input.Configure((Dictionary<string,object>)command["config"]);
     else if(action=="select")input.Select(Convert.ToString(command["deviceId"]));
     else if(action=="capture")input.SetCapture(Convert.ToString(command["deviceId"]),Convert.ToBoolean(command["value"]));
     else if(action=="mapping")input.Map(Convert.ToString(command["deviceId"]),command["mapping"]==null?null:Convert.ToString(command["mapping"]));
     else throw new InvalidOperationException("未知手柄操作");
     Emit(new{type="controller-result",requestId=requestId,ok=true,device=input.Current,devices=input.Devices});
    }catch(Exception e){Emit(new{type="controller-result",requestId=requestId,ok=false,error=e.Message});}
   }
   ControllerSample sample=input.Poll();
   suppressInput=!sample.ready||input.Capture;
   var inventory=new{type="devices",items=input.Devices,selected=input.Current==null?"":input.Current.id,backend=input.IsSdl?"SDL3":"XInput",warning=input.Warning};
   string inventoryKey=new JavaScriptSerializer().Serialize(inventory);
   if(inventoryKey!=lastDevices){lastDevices=inventoryKey;Emit(inventory);}
   IntPtr fg=GetForegroundWindow();uint pid;uint thread=GetWindowThreadProcessId(fg,out pid);
   Point p;GetCursorPos(out p);var gui=new Gui{size=Marshal.SizeOf(typeof(Gui))};
   bool caret=GetGUIThreadInfo(thread,ref gui)&&gui.caret!=IntPtr.Zero;
   if(caret){p.x=gui.rect.left;p.y=gui.rect.bottom;ClientToScreen(gui.caret,ref p);}
   bool active;lock(gate){if(((!sample.ready||input.Capture)&&!testing)||(target!=IntPtr.Zero&&fg!=target))Release();active=target!=IntPtr.Zero;}
   Emit(new{type="state",connected=sample.connected,ready=sample.ready,slot=sample.slot,buttons=sample.buttons,x=sample.x,y=sample.y,rx=sample.rx,ry=sample.ry,device=sample.device,raw=sample.raw,target=fg.ToInt64().ToString(),pid=pid,inputLanguage=LanguageCode(GetKeyboardLayout(thread)),anchor=new{x=p.x,y=p.y},caret=caret});
   Thread.Sleep(sample.connected?16:40);
  }
  }
 }
}
