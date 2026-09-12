using System;
using System.Collections.Generic;
namespace ProjectMaties {
 internal static class HostPolicy {
  internal static bool Trusted(string source) { Uri u;return Uri.TryCreate(source,UriKind.Absolute,out u)&&u.Scheme=="https"&&u.Host=="maties.local"&&u.IsDefaultPort&&u.UserInfo==""; }
  internal static Dictionary<string,object> NormalizeSystem(Dictionary<string,object> value) {
   var d=value??new Dictionary<string,object>();
   string locale=Text(d,"locale"),theme=Text(d,"theme"),close=Text(d,"closeBehavior");
   return new Dictionary<string,object>{{"schemaVersion",1},{"locale",Array.IndexOf(new[]{"zh-CN","zh-TW","en","ja","fr","de","it","es"},locale)>=0?locale:"zh-CN"},{"theme",theme=="dark"||theme=="light"?theme:"system"},{"startAtLogin",d.ContainsKey("startAtLogin")&&d["startAtLogin"] is bool b&&b},{"closeBehavior",close=="minimize"||close=="quit"?close:"tray"}};
  }
  internal static string Text(Dictionary<string,object> d,string key,string fallback="") {return d!=null&&d.TryGetValue(key,out var v)&&v is string s?s:fallback;}
  internal static double Number(Dictionary<string,object> d,string key,double fallback){try{return d!=null&&d.TryGetValue(key,out var v)?Convert.ToDouble(v):fallback;}catch{return fallback;}}
  // Input and output are physical screen pixels. Scale the original SVG viewbox by the monitor DPI.
  internal static int[] Bounds(double ax,double ay,int x,int y,int width,int height,double dpi,double percent,bool dual) {
   double baseWidth=dual?1584.356:768.178;
   double scale=Math.Max(.01,Math.Min(Math.Max(55,Math.Min(110,percent))/100*dpi,Math.Min((width-24)/baseWidth,(height-24)/714.608)));
   int w=(int)Math.Round(baseWidth*scale),h=(int)Math.Round(714.608*scale);
   return new[]{(int)Math.Round(Math.Max(x,Math.Min(x+width-w,ax-w/2))),(int)Math.Round(Math.Max(y,Math.Min(y+height-h,ay+24*dpi))),w,h};
  }
 }
}
