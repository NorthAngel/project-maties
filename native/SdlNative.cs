using System;
using System.Runtime.InteropServices;
using System.Text;

// SDL 3.4.16 x64 ABI. C bool is one byte; every native string is UTF-8.
internal static class Sdl {
 const string Dll = "SDL3.dll";
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr SDL_GetGamepadMappingForID(uint id);
 public static byte[] Utf8(string value) { return value == null ? null : Encoding.UTF8.GetBytes(value + "\0"); }
 public static string Text(IntPtr value) {
  if (value == IntPtr.Zero) return "";
  int size = 0; while (size < 8192 && Marshal.ReadByte(value, size) != 0) size++;
  byte[] bytes = new byte[size]; Marshal.Copy(value, bytes, 0, size); return Encoding.UTF8.GetString(bytes);
 }
 [StructLayout(LayoutKind.Sequential)] public struct Guid { public uint a, b, c, d; }
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern void SDL_SetMainReady();
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_Init(uint flags);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern void SDL_Quit();
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr SDL_GetError();
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_SetHint(byte[] name, byte[] value);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern int SDL_AddGamepadMappingsFromFile(byte[] file);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_SetGamepadMapping(uint id, byte[] mapping);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr SDL_GetJoysticks(out int count);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern void SDL_free(IntPtr value);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_PollEvent(IntPtr value);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern void SDL_UpdateGamepads();
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern void SDL_UpdateJoysticks();
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_IsGamepad(uint id);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr SDL_GetJoystickNameForID(uint id);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern Guid SDL_GetJoystickGUIDForID(uint id);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern void SDL_GUIDToString(Guid guid, byte[] text, int size);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern ushort SDL_GetJoystickVendorForID(uint id);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern int SDL_GetGamepadTypeForID(uint id);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr SDL_OpenJoystick(uint id);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern void SDL_CloseJoystick(IntPtr joystick);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_JoystickConnected(IntPtr joystick);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern int SDL_GetNumJoystickAxes(IntPtr joystick);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern int SDL_GetNumJoystickButtons(IntPtr joystick);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern int SDL_GetNumJoystickHats(IntPtr joystick);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern short SDL_GetJoystickAxis(IntPtr joystick, int axis);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_GetJoystickButton(IntPtr joystick, int button);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern byte SDL_GetJoystickHat(IntPtr joystick, int hat);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern IntPtr SDL_OpenGamepad(uint id);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern void SDL_CloseGamepad(IntPtr gamepad);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_GamepadConnected(IntPtr gamepad);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] public static extern short SDL_GetGamepadAxis(IntPtr gamepad, int axis);
 [DllImport(Dll, CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] public static extern bool SDL_GetGamepadButton(IntPtr gamepad, int button);
}
