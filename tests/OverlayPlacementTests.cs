using System;using ProjectMaties;
class OverlayPlacementTests{
 static int Main(){try{
 var area=new ScreenBox(0,0,1920,1080);
 var below=OverlayPlacement.Calculate(960,200,null,area,600,600,300,0);
 Check(below.Y==200&&below.X==660,"notch anchors to mouse");
 var above=OverlayPlacement.Calculate(960,1000,new ScreenBox(950,980,20,20),area,600,600,300,0);
 Check(above.Y+above.Height<=976,"moves above typing");
 var left=OverlayPlacement.Calculate(-1900,100,null,new ScreenBox(-1920,0,1920,1080),800,700,400,0);
 Check(left.X>=-1920&&left.X+left.Width<=0,"negative monitor");
 var huge=OverlayPlacement.Calculate(100,100,null,area,2400,1100,1200,0);
 Check(!huge.Fits,"oversized identified explicitly");
 Console.WriteLine("Overlay placement: 4 checks passed");return 0;
 }catch(Exception e){Console.Error.WriteLine(e.Message);return 1;}}
 static void Check(bool x,string message){if(!x)throw new Exception(message);}
}
