using System;using ProjectMaties;
class WindowLifecycleTests{
 static int Main(){try{
  foreach(var action in new[]{"hide","minimize","close"}){var result=WindowLifecycle.Decide(action,"tray");Check(result.Hide&&!result.Release&&!result.Quit,action);}
  var quit=WindowLifecycle.Decide("close","quit");Check(quit.Quit&&quit.Release,"quit releases");
  var life=new WindowLifecycle();Check(!life.ConnectionChanged(false),"initial disconnected");
  Check(!life.ConnectionChanged(true),"connect");Check(life.ConnectionChanged(false),"disconnect shows");
  Check(!life.ConnectionChanged(false),"disconnected packets do not repeatedly show");
  Console.WriteLine("Window lifecycle: 8 checks passed");return 0;
 }catch(Exception e){Console.Error.WriteLine(e.Message);return 1;}}
 static void Check(bool x,string message){if(!x)throw new Exception(message);}
}
