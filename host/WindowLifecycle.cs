namespace ProjectMaties{
 internal sealed class WindowDecision{internal bool Hide,Quit,Release;}
 internal sealed class WindowLifecycle{
  bool connected;
  internal bool ConnectionChanged(bool next){bool show=connected&&!next;connected=next;return show;}
  internal static WindowDecision Decide(string action,string closeBehavior){
   bool quit=action=="quit"||(action=="close"&&closeBehavior=="quit");
   return new WindowDecision{Quit=quit,Release=quit,Hide=!quit&&(action=="hide"||action=="minimize"||action=="close")};
  }
 }
}
