using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Collections.Generic;
class ControllerBackendTests {
 [StructLayout(LayoutKind.Sequential)] struct Desc {
  public uint version; public ushort type,padding,vendor,product,axes,buttons,balls,hats,touchpads,sensors,padding2,padding3; public uint buttonMask,axisMask;
  public IntPtr name,touchpadInfo,sensorInfo,userdata,update,player,rumble,triggerRumble,led,effect,sensorsEnabled,cleanup;
 }
 [DllImport("SDL3.dll",CallingConvention=CallingConvention.Cdecl)] static extern uint SDL_AttachVirtualJoystick(ref Desc d);
 [DllImport("SDL3.dll",CallingConvention=CallingConvention.Cdecl)][return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_DetachVirtualJoystick(uint id);
 [DllImport("SDL3.dll",CallingConvention=CallingConvention.Cdecl)][return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_SetJoystickVirtualAxis(IntPtr j,int a,short v);
 [DllImport("SDL3.dll",CallingConvention=CallingConvention.Cdecl)][return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_SetJoystickVirtualButton(IntPtr j,int b,[MarshalAs(UnmanagedType.I1)]bool v);
 [DllImport("SDL3.dll",CallingConvention=CallingConvention.Cdecl)][return:MarshalAs(UnmanagedType.I1)] static extern bool SDL_SetJoystickVirtualHat(IntPtr j,int h,byte v);
 static int checks;
 static void Check(bool v,string name){if(!v)throw new Exception(name+": "+Sdl.Text(Sdl.SDL_GetError()));checks++;Console.WriteLine("PASS "+name);}
 static uint Attach(bool ps){var d=new Desc{version=(uint)Marshal.SizeOf(typeof(Desc)),type=(ushort)(ps?1:0),vendor=(ushort)(ps?0x054c:0x1209),product=(ushort)(ps?0x0ce6:0x0001),axes=6,buttons=16,hats=1,buttonMask=32767,axisMask=63,name=Marshal.StringToHGlobalAnsi(ps?"DualSense Virtual Test":"Generic HID Virtual Test")};try{uint id=SDL_AttachVirtualJoystick(ref d);Check(id!=0,"attach "+(ps?"DualSense":"generic"));return id;}finally{Marshal.FreeHGlobal(d.name);}}
 static void Main(){try{Run();}catch(Exception e){Console.WriteLine("FAIL "+e.Message);Environment.ExitCode=1;}}
 static void Run(){using(var input=new ControllerInput(AppDomain.CurrentDomain.BaseDirectory)){
  Check(input.IsSdl,"SDL initialized");uint ps=Attach(true);input.Refresh();input.Select("sdl:"+ps);IntPtr pj=Sdl.SDL_OpenJoystick(ps);
  SDL_SetJoystickVirtualAxis(pj,4,-32768);SDL_SetJoystickVirtualAxis(pj,5,-32768);var s=input.Poll();Check(s.ready&&s.device.kind=="playstation","PlayStation identity and automatic mapping");
  int[] flags={4096,8192,16384,32768,32,0,16,64,128,256,512,1,2,4,8};
  for(int i=0;i<flags.Length;i++){if(flags[i]==0)continue;SDL_SetJoystickVirtualButton(pj,i,true);s=input.Poll();Check(s.buttons==flags[i],"physical gamepad button "+i);SDL_SetJoystickVirtualButton(pj,i,false);input.Poll();}
  SDL_SetJoystickVirtualAxis(pj,0,32767);SDL_SetJoystickVirtualAxis(pj,1,32767);SDL_SetJoystickVirtualAxis(pj,2,-32768);SDL_SetJoystickVirtualAxis(pj,3,-32768);s=input.Poll();Check(s.x==1&&s.y==1&&s.rx==-1&&s.ry==-1,"stick orientation and full range");
  SDL_SetJoystickVirtualAxis(pj,4,32767);SDL_SetJoystickVirtualAxis(pj,5,32767);s=input.Poll();Check((s.buttons&196608)==196608,"independent analog triggers");
  string pguid=s.device.guid;input.Map("sdl:"+ps,pguid+",Controller Companion,leftx:a0,lefty:a1,a:b3,b:b0,x:b1,y:b2,platform:Windows,");input.Map("sdl:"+ps,null);SDL_SetJoystickVirtualAxis(pj,4,-32768);SDL_SetJoystickVirtualAxis(pj,5,-32768);SDL_SetJoystickVirtualButton(pj,0,true);s=input.Poll();Check(s.ready&&s.buttons==4096,"reset restores original known gamepad mapping");SDL_SetJoystickVirtualButton(pj,0,false);
  uint raw=Attach(false);input.Refresh();input.Select("sdl:"+raw);IntPtr rj=Sdl.SDL_OpenJoystick(raw);s=input.Poll();Check(!s.ready&&s.connected,"unknown HID suppressed before calibration");
  input.SetCapture("sdl:"+raw,true);s=input.Poll();Check(s.raw!=null&&input.Capture,"raw calibration capture");string guid=s.device.guid;
  string mapping=guid+",Controller Companion,leftx:a2~,lefty:a0,rightx:a1,righty:a3,a:b3,b:b0,x:b1,y:b2,leftstick:b8,rightstick:b9,dpup:h0.1,dpdown:h0.4,dpleft:h0.8,dpright:h0.2,lefttrigger:+a4,righttrigger:+a5,platform:Windows,";
  input.Map("sdl:"+raw,mapping);s=input.Poll();Check(s.ready&&!input.Capture,"custom mapping applied and capture ended");
  SDL_SetJoystickVirtualAxis(rj,2,-32768);SDL_SetJoystickVirtualAxis(rj,0,32767);SDL_SetJoystickVirtualButton(rj,3,true);SDL_SetJoystickVirtualHat(rj,0,1);s=input.Poll();Check(s.x>.99&&s.y==1&&(s.buttons&4097)==4097,"reordered/reversed axes plus button and hat");
  SDL_SetJoystickVirtualAxis(rj,4,32767);s=input.Poll();Check((s.buttons&65536)!=0,"half axis trigger mapping");
  input.Map("sdl:"+raw,null);s=input.Poll();Check(!s.ready,"reset restores unknown HID state");
  input.Map("sdl:"+raw,mapping);Sdl.SDL_CloseJoystick(rj);SDL_DetachVirtualJoystick(raw);input.Poll();input.Refresh();Check(input.Current==null||input.Current.id!="sdl:"+raw,"disconnect removes active HID");
  uint again=Attach(false);input.Refresh();input.Configure(new Dictionary<string,object>{{"preferredGuid",guid},{"mappings",new Dictionary<string,object>{{guid,mapping}}}});s=input.Poll();Check(s.device.id=="sdl:"+again&&s.device.guid==guid&&s.ready,"reconnect restores preferred GUID and mapping");
  Sdl.SDL_CloseJoystick(pj);SDL_DetachVirtualJoystick(ps);SDL_DetachVirtualJoystick(again);
 }Console.WriteLine("TOTAL "+checks+" passed");}
}
