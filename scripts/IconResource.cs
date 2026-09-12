using System;using System.IO;using System.Runtime.InteropServices;
// Only modifies the freshly copied delivery executable, never the installed Electron runtime.
class IconResource {
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern IntPtr BeginUpdateResource(string file,bool delete);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool UpdateResource(IntPtr update,IntPtr type,IntPtr name,ushort language,byte[] data,uint length);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool EndUpdateResource(IntPtr update,bool discard);
 static void Check(bool ok){if(!ok)throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());}
 static void Main(string[] args){var ico=File.ReadAllBytes(args[1]);int size=BitConverter.ToInt32(ico,14),offset=BitConverter.ToInt32(ico,18);var png=new byte[size];Array.Copy(ico,offset,png,0,size);var group=new byte[20];Array.Copy(ico,0,group,0,6);Array.Copy(ico,6,group,6,12);group[18]=1;group[19]=0;IntPtr update=BeginUpdateResource(args[0],false);if(update==IntPtr.Zero)Check(false);try{Check(UpdateResource(update,new IntPtr(3),new IntPtr(1),0,png,(uint)png.Length));Check(UpdateResource(update,new IntPtr(14),new IntPtr(1),0,group,(uint)group.Length));Check(EndUpdateResource(update,false));update=IntPtr.Zero;}finally{if(update!=IntPtr.Zero)EndUpdateResource(update,true);}}
}
