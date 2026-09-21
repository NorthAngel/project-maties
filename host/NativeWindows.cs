using System;
using System.Runtime.InteropServices;
using System.Windows.Interop;
using Forms=System.Windows.Forms;
namespace ProjectMaties {
 internal static class NativeWindows {
  [StructLayout(LayoutKind.Sequential)]internal struct Point {public int X,Y;}
  [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")]static extern IntPtr GetStyle(IntPtr h,int i);
  [DllImport("user32.dll",EntryPoint="SetWindowLongPtrW")]static extern IntPtr SetStyle(IntPtr h,int i,IntPtr v);
  [DllImport("user32.dll")]static extern bool SetWindowPos(IntPtr h,IntPtr after,int x,int y,int w,int height,uint flags);
  [DllImport("user32.dll")]internal static extern bool GetCursorPos(out Point p);
  [DllImport("user32.dll")]static extern bool ReleaseCapture();
  [DllImport("user32.dll")]static extern IntPtr SendMessage(IntPtr h,uint message,IntPtr w,IntPtr l);
  [DllImport("user32.dll")]static extern short GetAsyncKeyState(int key);
  internal static void BeginDrag(BrowserWindow window){if(GetAsyncKeyState(1)>=0)return;ReleaseCapture();SendMessage(new WindowInteropHelper(window).Handle,0x00A1,new IntPtr(2),IntPtr.Zero);}
  [DllImport("user32.dll")]static extern IntPtr MonitorFromPoint(Point p,uint flags);
  [DllImport("shcore.dll")]static extern int GetDpiForMonitor(IntPtr monitor,int type,out uint x,out uint y);
  [DllImport("user32.dll")]static extern bool RegisterHotKey(IntPtr h,int id,uint modifiers,uint vk);
  [DllImport("user32.dll")]static extern bool UnregisterHotKey(IntPtr h,int id);
  internal static void MakeOverlay(IntPtr handle){SetStyle(handle,-20,new IntPtr(GetStyle(handle,-20).ToInt64()|0x08000020));}
  internal static void Escape(BrowserWindow settings,bool enabled){var h=new WindowInteropHelper(settings).Handle;UnregisterHotKey(h,1);if(enabled)RegisterHotKey(h,1,0x4000,27);}
  internal static void Position(BrowserWindow window,System.Collections.Generic.Dictionary<string,object> packet,System.Collections.Generic.Dictionary<string,object> appearance,string layout){
   Point p;GetCursorPos(out p);if(packet!=null&&packet.TryGetValue("anchor",out var raw)&&raw is System.Collections.Generic.Dictionary<string,object> anchor){p.X=(int)HostPolicy.Number(anchor,"x",p.X);p.Y=(int)HostPolicy.Number(anchor,"y",p.Y);}
   var area=Forms.Screen.FromPoint(new System.Drawing.Point(p.X,p.Y)).WorkingArea;uint dx=96,dy=96;try{GetDpiForMonitor(MonitorFromPoint(p,2),0,out dx,out dy);}catch{}
   double scale=Math.Max(50,Math.Min(150,HostPolicy.Number(appearance,"scale",100)))/100*Math.Max(96,dx)/96.0;
   double baseWidth=layout=="dual"?1584.356:768.178;
   // User approved temporary screen fitting, without changing the saved size.
   scale=Math.Min(scale,Math.Min((area.Width-16)/baseWidth,(area.Height-16)/714.608));
   ScreenBox caret=null;
   if(packet!=null&&packet.TryGetValue("caretRect",out var rawCaret)&&rawCaret is System.Collections.Generic.Dictionary<string,object> c)caret=new ScreenBox(HostPolicy.Number(c,"x",p.X),HostPolicy.Number(c,"y",p.Y),HostPolicy.Number(c,"width",2),HostPolicy.Number(c,"height",20));
   var box=OverlayPlacement.Calculate(p.X,p.Y,caret,new ScreenBox(area.X,area.Y,area.Width,area.Height),baseWidth*scale,714.608*scale,baseWidth*scale/2,112.981*scale);
   var b=new[]{(int)Math.Round(box.X),(int)Math.Round(box.Y),(int)Math.Round(box.Width),(int)Math.Round(box.Height)};
   SetWindowPos(new WindowInteropHelper(window).Handle,new IntPtr(-1),b[0],b[1],b[2],b[3],0x0010|0x0040);
  }
 }
}
