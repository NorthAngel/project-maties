using System;using System.Collections.Generic;using System.Linq;
namespace ProjectMaties{
 internal sealed class ScreenBox{
  internal double X,Y,Width,Height;internal bool Fits=true;
  internal ScreenBox(double x,double y,double w,double h){X=x;Y=y;Width=w;Height=h;}
  internal bool Intersects(ScreenBox other){return other!=null&&X<other.X+other.Width&&X+Width>other.X&&Y<other.Y+other.Height&&Y+Height>other.Y;}
 }
 internal static class OverlayPlacement{
  internal static ScreenBox Calculate(double ax,double ay,ScreenBox caret,ScreenBox area,double width,double height,double notchX,double notchY){
   bool fits=width<=area.Width&&height<=area.Height;
   var candidates=new List<ScreenBox>{
    new ScreenBox(ax-notchX,ay-notchY,width,height),
    new ScreenBox(ax-notchX,(caret?.Y??ay)-height-4,width,height),
    new ScreenBox((caret?.X??ax)-width-4,ay-notchY,width,height),
    new ScreenBox((caret==null?ax:caret.X+caret.Width)+4,ay-notchY,width,height)
   };
   foreach(var c in candidates){c.X=Math.Max(area.X,Math.Min(area.X+area.Width-width,c.X));c.Y=Math.Max(area.Y,Math.Min(area.Y+area.Height-height,c.Y));c.Fits=fits;}
   var avoid=caret==null?null:new ScreenBox(caret.X-4,caret.Y-4,caret.Width+8,caret.Height+8);
   return candidates.FirstOrDefault(c=>!c.Intersects(avoid))??candidates[0];
  }
 }
}
