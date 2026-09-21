using System;using System.Collections.Generic;using ProjectMaties;
class PolicyTests {
 static int Main(){try{ System.Threading.Thread.CurrentThread.CurrentUICulture=new System.Globalization.CultureInfo("en-US");
  Check(HostPolicy.Trusted("https://maties.local/settings.html"),"local page");
  foreach(var s in new[]{"https://evil.local/settings.html","https://maties.local.evil/settings.html","http://maties.local/settings.html","file:///settings.html","https://maties.local:8443/settings.html"})Check(!HostPolicy.Trusted(s),"reject "+s);
  var s1=HostPolicy.NormalizeSystem(new Dictionary<string,object>{{"locale","ja"},{"theme","dark"},{"startAtLogin",true},{"closeBehavior","minimize"}});Check((string)s1["locale"]=="ja"&&(bool)s1["startAtLogin"],"keep config");
  var s2=HostPolicy.NormalizeSystem(new Dictionary<string,object>{{"locale","invalid"},{"theme",false},{"startAtLogin","true"},{"closeBehavior","delete"}});Check((string)s2["locale"]=="en"&&!(bool)s2["startAtLogin"]&&(string)s2["closeBehavior"]=="tray","normalize invalid config");
  var b=HostPolicy.Bounds(-1900,100,-1920,0,1920,1080,1.5,85,true);Check(b[0]>=-1920&&b[1]>=0&&b[0]+b[2]<=0&&b[1]+b[3]<=1080,"dual high DPI negative monitor stays inside work area");
  var b2=HostPolicy.Bounds(500,750,0,0,1024,768,1,110,false);Check(b2[2]<=1000&&b2[3]<=744&&b2[1]+b2[3]<=768,"small screen clamps wheel");
  Console.WriteLine("Host policy: 9 checks passed");return 0;
 }catch(Exception e){Console.Error.WriteLine(e.Message);return 1;}}
 static void Check(bool v,string m){if(!v)throw new Exception(m);}
}

