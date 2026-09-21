using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

internal class ControllerDevice {
 public string id, guid, name, kind, backend, path, serial;
 public bool mapped;
}
internal class ControllerSample {
 public bool connected, ready;
 public string slot = "none";
 public int buttons;
 public double x, y, rx, ry;
 public ControllerDevice device;
 public object raw;
}

// One backend owns all devices. Never poll SDL and XInput simultaneously.
internal sealed class ControllerInput : IDisposable {
 [StructLayout(LayoutKind.Sequential)] struct XPad { public ushort buttons; public byte lt,rt; public short lx,ly,rx,ry; }
 [StructLayout(LayoutKind.Sequential)] struct XState { public uint packet; public XPad pad; }
 [DllImport("xinput1_4.dll")] static extern uint XInputGetState(uint i, out XState state);
 readonly Stopwatch clock = Stopwatch.StartNew();
 readonly Dictionary<string,string> mappings = new Dictionary<string,string>();
 readonly HashSet<string> applied = new HashSet<string>();
 readonly Dictionary<string,string> defaults = new Dictionary<string,string>();
 readonly IntPtr eventBuffer = Marshal.AllocHGlobal(128);
 IntPtr joystick, gamepad;
 long nextRefresh;
 uint selected;
 string preferredGuid = "";
 public bool IsSdl { get; private set; }
 public bool Capture { get; private set; }
 public string Warning { get; private set; }
 public ControllerDevice Current { get; private set; }
 public List<ControllerDevice> Devices { get; private set; }
 public ControllerInput(string dataDirectory, bool forceXInput = false) {
  Devices = new List<ControllerDevice>(); Warning = "";
  try {
   if (forceXInput) throw new DllNotFoundException();
   Sdl.SDL_SetMainReady();
   Sdl.SDL_SetHint(Sdl.Utf8("SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS"), Sdl.Utf8("1"));
   Sdl.SDL_SetHint(Sdl.Utf8("SDL_JOYSTICK_HIDAPI"), Sdl.Utf8("1"));
   Sdl.SDL_SetHint(Sdl.Utf8("SDL_JOYSTICK_HIDAPI_PS5"), Sdl.Utf8("1"));
   // Generic HID devices may expose RawGameController through WGI while
   // DirectInput omits them. SDL coordinates its drivers to avoid duplicates.
   Sdl.SDL_SetHint(Sdl.Utf8("SDL_JOYSTICK_WGI"), Sdl.Utf8("1"));
   if (!Sdl.SDL_Init(0x2000)) throw new InvalidOperationException(Sdl.Text(Sdl.SDL_GetError()));
   IsSdl = true;
   string database = Path.Combine(dataDirectory, "gamecontrollerdb.txt");
   if (File.Exists(database)) Sdl.SDL_AddGamepadMappingsFromFile(Sdl.Utf8(database));
  } catch (Exception e) {
   if (!(e is DllNotFoundException || e is EntryPointNotFoundException || e is BadImageFormatException || e is InvalidOperationException)) throw;
   if (IsSdl) Sdl.SDL_Quit(); IsSdl = false;
   Warning = "兼容服务不可用，暂时仅支持 XInput 手柄";
  }
  Refresh();
 }
 static double Axis(short value) { return value < 0 ? value / 32768.0 : value / 32767.0; }
 static uint Number(ControllerDevice device) { return uint.Parse(device.id.Substring(device.id.IndexOf(':') + 1)); }
 static string GuidFor(uint id) { byte[] bytes = new byte[33]; Sdl.SDL_GUIDToString(Sdl.SDL_GetJoystickGUIDForID(id), bytes, bytes.Length); return Encoding.ASCII.GetString(bytes, 0, 32); }
 ControllerDevice Describe(uint id) {
  int type = Sdl.SDL_GetGamepadTypeForID(id); ushort vendor = Sdl.SDL_GetJoystickVendorForID(id);
  string serial=""; IntPtr probe=Sdl.SDL_OpenJoystick(id);
  try { if(probe!=IntPtr.Zero)serial=Sdl.Text(Sdl.SDL_GetJoystickSerial(probe)); }
  finally { if(probe!=IntPtr.Zero)Sdl.SDL_CloseJoystick(probe); }
  return new ControllerDevice { id="sdl:"+id, guid=GuidFor(id), path=Sdl.Text(Sdl.SDL_GetJoystickPathForID(id)), serial=serial, name=Sdl.Text(Sdl.SDL_GetJoystickNameForID(id)), backend="SDL3", mapped=Sdl.SDL_IsGamepad(id)&&(!defaults.ContainsKey(GuidFor(id))||defaults[GuidFor(id)]!=null||mappings.ContainsKey(GuidFor(id))), kind=(type>=4&&type<=6)||vendor==0x054c?"playstation":type>=7&&type<=10?"nintendo":type==2||type==3?"xbox":"generic" };
 }
 void CloseSelected() {
  if (gamepad != IntPtr.Zero) Sdl.SDL_CloseGamepad(gamepad);
  if (joystick != IntPtr.Zero) Sdl.SDL_CloseJoystick(joystick);
  gamepad = joystick = IntPtr.Zero; Current = null; selected = 0; Capture = false;
 }
 void OpenSelected(ControllerDevice device) {
  if (IsSdl) {
   CloseSelected(); if (device == null) return;
   selected = Number(device); joystick = Sdl.SDL_OpenJoystick(selected);
   if (joystick == IntPtr.Zero) { selected = 0; return; }
   if (device.mapped) gamepad = Sdl.SDL_OpenGamepad(selected);
   device.mapped = gamepad != IntPtr.Zero;
  }
  Current = device;
 }
 public void Refresh() {
  var devices = new List<ControllerDevice>();
  if (IsSdl) {
   int count; IntPtr ids = Sdl.SDL_GetJoysticks(out count);
   try {
    for (int i=0; i<count; i++) {
     uint id = unchecked((uint)Marshal.ReadInt32(ids,i*4)); string guid = GuidFor(id), mapping;
     if (!defaults.ContainsKey(guid)) { IntPtr original=Sdl.SDL_GetGamepadMappingForID(id); defaults[guid]=original==IntPtr.Zero?null:Sdl.Text(original); if(original!=IntPtr.Zero)Sdl.SDL_free(original); }
     if (mappings.TryGetValue(guid,out mapping) && !applied.Contains(guid)) { if (Sdl.SDL_SetGamepadMapping(id,Sdl.Utf8(mapping))) applied.Add(guid); }
     devices.Add(Describe(id));
    }
   } finally { if (ids!=IntPtr.Zero) Sdl.SDL_free(ids); }
  } else {
   for (uint i=0;i<4;i++) { XState state; if(XInputGetState(i,out state)==0)devices.Add(new ControllerDevice{id="xinput:"+i,guid="xinput:"+i,name="Xbox / XInput "+(i+1),kind="xbox",backend="XInput",mapped=true}); }
  }
  Devices = devices;
  ControllerDevice next = Current==null?null:devices.Find(d=>d.id==Current.id);
  if(next==null && preferredGuid!="")next=devices.Find(d=>d.guid==preferredGuid);
  if(next==null)next=devices.Find(d=>d.mapped)??(devices.Count>0?devices[0]:null);
  if(Current==null || next==null || next.id!=Current.id)OpenSelected(next);
  else { Current=next; if(IsSdl){if(!next.mapped&&gamepad!=IntPtr.Zero){Sdl.SDL_CloseGamepad(gamepad);gamepad=IntPtr.Zero;}if(gamepad==IntPtr.Zero&&next.mapped)gamepad=Sdl.SDL_OpenGamepad(selected);} }
  nextRefresh=clock.ElapsedMilliseconds+250;
 }
 public void Configure(Dictionary<string,object> value) {
  object mapValue, preference;
  preferredGuid=value.TryGetValue("preferredGuid",out preference)?Convert.ToString(preference):"";
  mappings.Clear();
  if(value.TryGetValue("mappings",out mapValue)) {
   var map=mapValue as Dictionary<string,object>;
   if(map!=null)foreach(var item in map)if(ValidMapping(item.Key,Convert.ToString(item.Value)))mappings[item.Key]=Convert.ToString(item.Value);
  }
  if(IsSdl) { foreach(var device in Devices)if(applied.Contains(device.guid))Sdl.SDL_SetGamepadMapping(Number(device),Sdl.Utf8(defaults[device.guid])); applied.Clear(); }
  Refresh();
  var preferred=Devices.Find(d=>d.guid==preferredGuid); if(preferred!=null && (Current==null||preferred.id!=Current.id))OpenSelected(preferred);
 }
 public void Select(string id) {
  Refresh(); var device=Devices.Find(d=>d.id==id);
  if(device==null)throw new InvalidOperationException("手柄已断开");
  preferredGuid=device.guid; OpenSelected(device);
 }
 public void SetCapture(string id, bool value) {
  if(!value){Capture=false;return;}
  if(!IsSdl || Current==null || Current.id!=id)throw new InvalidOperationException("请先选择已连接的手柄");
  Capture=true;
 }
 public static bool ValidMapping(string guid,string mapping) {
  if(!Regex.IsMatch(guid??"","^[0-9a-f]{32}$") || mapping==null || mapping.Length>2048)return false;
  string[] pieces=mapping.Split(','); if(pieces.Length<4||pieces[0]!=guid||pieces[1]!="Controller Companion")return false;
  var seen=new HashSet<string>();
  for(int i=2;i<pieces.Length;i++) {
   if(pieces[i]==""||pieces[i]=="platform:Windows")continue;
   if(!Regex.IsMatch(pieces[i],"^(a|b|x|y|back|start|leftstick|rightstick|leftshoulder|rightshoulder|lefttrigger|righttrigger|dpup|dpdown|dpleft|dpright|leftx|lefty|rightx|righty):([+-]?a[0-9]{1,2}~?|b[0-9]{1,2}|h[0-3]\\.[1248])$"))return false;
   if(!seen.Add(pieces[i].Split(':')[0]))return false;
  }
  return seen.Contains("leftx")&&seen.Contains("lefty")&&seen.Contains("a")&&seen.Contains("b")&&seen.Contains("x")&&seen.Contains("y");
 }
 public void Map(string id,string mapping) {
  if(!IsSdl||Current==null||Current.id!=id)throw new InvalidOperationException("手柄已断开，请重新校准");
  string guid=Current.guid;
  if(mapping!=null&&!ValidMapping(guid,mapping))throw new InvalidOperationException("校准数据不完整");
  if(!Sdl.SDL_SetGamepadMapping(selected,Sdl.Utf8(mapping??defaults[guid])))throw new InvalidOperationException("无法应用手柄校准");
  if(mapping==null){mappings.Remove(guid);applied.Remove(guid);}else{mappings[guid]=mapping;applied.Add(guid);}
  var device=Describe(selected);OpenSelected(device);Refresh();
 }
 public ControllerSample Poll() {
  if(IsSdl) {
   for(int i=0;i<256 && Sdl.SDL_PollEvent(eventBuffer);i++){}
   Sdl.SDL_UpdateGamepads();
   if(joystick!=IntPtr.Zero&&!Sdl.SDL_JoystickConnected(joystick)) { CloseSelected();nextRefresh=0;return new ControllerSample(); }
  }
  if(clock.ElapsedMilliseconds>=nextRefresh)Refresh();
  if(Current==null)return new ControllerSample();
  var result=new ControllerSample{connected=true,ready=Current.mapped,slot=Current.id,device=Current};
  if(!IsSdl) {
   XState state; if(XInputGetState(Number(Current),out state)!=0){Current=null;nextRefresh=0;return new ControllerSample();}
   result.buttons=(int)state.pad.buttons|(state.pad.lt>127?65536:0)|(state.pad.rt>127?131072:0);
   result.x=Axis(state.pad.lx);result.y=-Axis(state.pad.ly);result.rx=Axis(state.pad.rx);result.ry=-Axis(state.pad.ry);return result;
  }
  if(gamepad!=IntPtr.Zero && Sdl.SDL_GamepadConnected(gamepad)) {
   int[] flags={4096,8192,16384,32768,32,0,16,64,128,256,512,1,2,4,8};
   for(int i=0;i<flags.Length;i++)if(flags[i]!=0&&Sdl.SDL_GetGamepadButton(gamepad,i))result.buttons|=flags[i];
   if(Sdl.SDL_GetGamepadAxis(gamepad,4)>16383)result.buttons|=65536;
   if(Sdl.SDL_GetGamepadAxis(gamepad,5)>16383)result.buttons|=131072;
   result.x=Axis(Sdl.SDL_GetGamepadAxis(gamepad,0));result.y=Axis(Sdl.SDL_GetGamepadAxis(gamepad,1));result.rx=Axis(Sdl.SDL_GetGamepadAxis(gamepad,2));result.ry=Axis(Sdl.SDL_GetGamepadAxis(gamepad,3));
  } else result.ready=false;
  if(Capture) {
   double[] axes=new double[Math.Min(16,Math.Max(0,Sdl.SDL_GetNumJoystickAxes(joystick)))];
   bool[] buttons=new bool[Math.Min(64,Math.Max(0,Sdl.SDL_GetNumJoystickButtons(joystick)))];
   int[] hats=new int[Math.Min(4,Math.Max(0,Sdl.SDL_GetNumJoystickHats(joystick)))];
   for(int i=0;i<axes.Length;i++)axes[i]=Axis(Sdl.SDL_GetJoystickAxis(joystick,i));
   for(int i=0;i<buttons.Length;i++)buttons[i]=Sdl.SDL_GetJoystickButton(joystick,i);
   for(int i=0;i<hats.Length;i++)hats[i]=Sdl.SDL_GetJoystickHat(joystick,i);
   result.raw=new {axes=axes,buttons=buttons,hats=hats};
  }
  return result;
 }
 public void Dispose() { if(IsSdl){CloseSelected();Sdl.SDL_Quit();IsSdl=false;}Marshal.FreeHGlobal(eventBuffer); }
}
