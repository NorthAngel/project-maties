using System;
using System.Runtime.InteropServices;

// The keyboard layout (HKL) and the active Text Services Framework (TSF)
// profile are separate pieces of Windows input state.  WM_INPUTLANGCHANGEREQUEST
// changes the former, but modern Microsoft IMEs can keep the latter unchanged.
// This helper activates the user's existing default profile for the selected
// language.  It never registers, enables, disables, or replaces a profile.
static class Ime
{
 [ComImport, Guid("1f02b6c5-7842-4ee6-8a0b-9a24183a95ca"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface ITfInputProcessorProfiles
 {
  [PreserveSig] int Register(ref Guid clsid);
  [PreserveSig] int Unregister(ref Guid clsid);
  [PreserveSig] int AddLanguageProfile(ref Guid clsid, ushort langid, ref Guid profile, [MarshalAs(UnmanagedType.LPWStr)] string desc, uint cchDesc, [MarshalAs(UnmanagedType.LPWStr)] string icon, uint cchIcon, uint index);
  [PreserveSig] int RemoveLanguageProfile(ref Guid clsid, ushort langid, ref Guid profile);
  [PreserveSig] int EnumInputProcessorInfo(IntPtr enumGuid);
  [PreserveSig] int GetDefaultLanguageProfile(ushort langid, ref Guid category, out Guid clsid, out Guid profile);
  [PreserveSig] int SetDefaultLanguageProfile(ushort langid, ref Guid clsid, ref Guid profile);
  [PreserveSig] int ActivateLanguageProfile(ref Guid clsid, ushort langid, ref Guid profile);
  [PreserveSig] int GetActiveLanguageProfile(ref Guid clsid, out ushort langid, out Guid profile);
  [PreserveSig] int GetLanguageProfileDescription(ref Guid clsid, ushort langid, ref Guid profile, out IntPtr description);
  [PreserveSig] int GetCurrentLanguage(out ushort langid);
  [PreserveSig] int ChangeCurrentLanguage(ushort langid);
  [PreserveSig] int GetLanguageList(out IntPtr langids, out uint count);
  [PreserveSig] int EnumLanguageProfiles(ushort langid, IntPtr profiles);
  [PreserveSig] int EnableLanguageProfile(ref Guid clsid, ushort langid, ref Guid profile, [MarshalAs(UnmanagedType.Bool)] bool enable);
  [PreserveSig] int IsEnabledLanguageProfile(ref Guid clsid, ushort langid, ref Guid profile, [MarshalAs(UnmanagedType.Bool)] out bool enabled);
  [PreserveSig] int EnableLanguageProfileByDefault(ref Guid clsid, ushort langid, ref Guid profile, [MarshalAs(UnmanagedType.Bool)] bool enable);
  [PreserveSig] int SubstituteKeyboardLayout(ref Guid clsid, ushort langid, ref Guid profile, IntPtr hkl);
 }

 [ComImport, Guid("71c6e74c-0f28-11d8-a82a-00065b84435c"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface ITfInputProcessorProfileMgr
 {
  [PreserveSig] int ActivateProfile(uint profileType, ushort langid, ref Guid clsid, ref Guid profile, IntPtr hkl, uint flags);
  [PreserveSig] int DeactivateProfile(uint profileType, ushort langid, ref Guid clsid, ref Guid profile, IntPtr hkl, uint flags);
  [PreserveSig] int GetProfile(uint profileType, ushort langid, ref Guid clsid, ref Guid profile, IntPtr hkl, IntPtr output);
  [PreserveSig] int EnumProfiles(ushort langid, IntPtr output);
  [PreserveSig] int ReleaseInputProcessor(ref Guid clsid, uint flags);
  [PreserveSig] int RegisterProfile(ref Guid clsid, ushort langid, ref Guid profile, [MarshalAs(UnmanagedType.LPWStr)] string desc, uint cchDesc, [MarshalAs(UnmanagedType.LPWStr)] string icon, uint cchIcon, uint index, IntPtr substitute, uint preferredLayout, [MarshalAs(UnmanagedType.Bool)] bool enabledByDefault, uint flags);
  [PreserveSig] int UnregisterProfile(ref Guid clsid, ushort langid, ref Guid profile, uint flags);
  [PreserveSig] int GetActiveProfile(ref Guid category, IntPtr output);
 }

 static readonly Guid ClsidTfInputProcessorProfiles=new Guid("33c53a50-f456-4884-b049-85fd643ecfed");
 static readonly Guid GuidTfcATipKeyboard=new Guid("34745c63-b2f0-4784-8b67-5e12c8701a31");
 const uint TfProfileTypeInputProcessor=1;
 const uint TfProfileTypeKeyboardLayout=2;
 const uint TfIppmForSession=0x20000000;
 const uint TfIppmDontCareCurrentInputLanguage=0x00000004;

 static string HResult(int hr){return "0x"+unchecked((uint)hr).ToString("X8");}

 // Activate the Windows default profile for langid on the current desktop.
 // selectedLayout is used only for the keyboard-layout fallback profile.
 public static bool TryActivateDefault(IntPtr selectedLayout,ushort langid,out string error){
  error="";object server=null;
  try{
   Type type=Type.GetTypeFromCLSID(ClsidTfInputProcessorProfiles);
   if(type==null){error="tsf-class-unavailable";return false;}
   server=Activator.CreateInstance(type);
   var profiles=(ITfInputProcessorProfiles)server;
   Guid category=GuidTfcATipKeyboard,clsid,profile;
   int hr=profiles.GetDefaultLanguageProfile(langid,ref category,out clsid,out profile);
   if(hr<0){error="default-profile:"+HResult(hr);return false;}
   bool inputProcessor=clsid!=Guid.Empty&&profile!=Guid.Empty;
   uint profileType=inputProcessor?TfProfileTypeInputProcessor:TfProfileTypeKeyboardLayout;
   Guid callClsid=inputProcessor?clsid:Guid.Empty;
   Guid callProfile=inputProcessor?profile:Guid.Empty;
   IntPtr callLayout=inputProcessor?IntPtr.Zero:selectedLayout;
   var manager=(ITfInputProcessorProfileMgr)server;
   hr=manager.ActivateProfile(profileType,langid,ref callClsid,ref callProfile,callLayout,TfIppmForSession|TfIppmDontCareCurrentInputLanguage);
   if(hr<0){error="activate-profile:"+HResult(hr);return false;}
   if(hr!=0){error="profile-not-enabled:"+HResult(hr);return false;}
   return true;
  }catch(Exception ex){
   var com=ex as COMException;
   error=com==null?"tsf-exception:"+ex.GetType().Name:"tsf-exception:"+HResult(com.ErrorCode);
   return false;
  }finally{if(server!=null){try{Marshal.FinalReleaseComObject(server);}catch{}}}
 }
}
