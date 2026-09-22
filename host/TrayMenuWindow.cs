using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Effects;
using System.Windows.Shapes;
using Forms=System.Windows.Forms;
namespace ProjectMaties {
 // A small WPF surface avoids the legacy WinForms menu renderer and scales at monitor DPI.
 internal sealed class TrayMenuWindow : Window {
  readonly StackPanel items=new StackPanel();
  readonly Border panel;
  readonly Action open,quit;
  internal TrayMenuWindow(Action openSettings,Action exit){
   open=openSettings;quit=exit;WindowStyle=WindowStyle.None;AllowsTransparency=true;Background=Brushes.Transparent;
   ShowInTaskbar=false;ResizeMode=ResizeMode.NoResize;SizeToContent=SizeToContent.WidthAndHeight;Topmost=true;
   panel=new Border{CornerRadius=new CornerRadius(12),Padding=new Thickness(6),Margin=new Thickness(12),BorderThickness=new Thickness(1),Child=items,Effect=new DropShadowEffect{BlurRadius=18,ShadowDepth=3,Opacity=.22}};
   Content=panel;Deactivated+=(s,e)=>Hide();PreviewKeyDown+=(s,e)=>{if(e.Key==Key.Escape){Hide();e.Handled=true;}};
  }
  internal void Configure(string locale,bool dark){
   items.Children.Clear();panel.Background=Brush(dark?"#252526":"#FFFFFF");panel.BorderBrush=Brush(dark?"#454545":"#DEDEDE");
   string label=locale=="zh-CN"?"打开 Conroller Plus":locale=="ja"?"Conroller Plus を開く":"Open Conroller Plus";
   AddItem(label,"M3,3 L17,3 L17,17 L3,17 Z M3,7 L17,7",dark,open);
   items.Children.Add(new Border{Height=1,Margin=new Thickness(7,4,7,4),Background=Brush(dark?"#414141":"#EAEAEA")});
   AddItem(locale=="zh-CN"?"退出":locale=="ja"?"終了":"Quit","M10,2 L10,10 M5,4 A7,7 0 1 0 15,4",dark,quit);
  }
  internal void Open(string locale,bool dark){
   Configure(locale,dark);
   // Determine the physical monitor at the tray cursor, then convert its bounds to WPF units.
   NativeWindows.GetCursorPos(out var cursor);uint dpi=NativeWindows.DpiAt(cursor);double scale=dpi/96.0;
   var area=Forms.Screen.FromPoint(new System.Drawing.Point(cursor.X,cursor.Y)).WorkingArea;
   // Establish the destination monitor before showing, including mixed-DPI desktops.
   Left=cursor.X/scale;Top=cursor.Y/scale;
   Show();UpdateLayout();
   var transform=PresentationSource.FromVisual(this)?.CompositionTarget?.TransformFromDevice??Matrix.Identity;
   var point=transform.Transform(new Point(cursor.X,cursor.Y));
   var min=transform.Transform(new Point(area.Left,area.Top));var max=transform.Transform(new Point(area.Right,area.Bottom));
   Left=Math.Max(min.X,Math.Min(point.X-ActualWidth+12,max.X-ActualWidth));Top=Math.Max(min.Y,Math.Min(point.Y-ActualHeight+12,max.Y-ActualHeight));
   Activate();((Button)items.Children[0]).Focus();
  }
  void AddItem(string label,string geometry,bool dark,Action action){
   var content=new StackPanel{Orientation=Orientation.Horizontal};
   content.Children.Add(new Path{Data=Geometry.Parse(geometry),Stroke=Brush(dark?"#DEDEDE":"#454545"),StrokeThickness=1.5,Width=18,Height=18,Stretch=Stretch.Uniform,Margin=new Thickness(0,0,12,0)});
   content.Children.Add(new TextBlock{Text=label,VerticalAlignment=VerticalAlignment.Center});
   var button=new Button{Content=content,Width=232,Height=36,FontFamily=new FontFamily(new Uri(System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"web/assets/fonts/")),"./#SF Pro, ./#PingFang SC, ./#Hiragino Sans"),FontSize=14,Foreground=Brush(dark?"#EEEEEE":"#282828"),Background=Brushes.Transparent,BorderThickness=new Thickness(0),Padding=new Thickness(12,0,12,0),HorizontalContentAlignment=HorizontalAlignment.Left,Cursor=Cursors.Arrow};
   var template=new ControlTemplate(typeof(Button));var border=new FrameworkElementFactory(typeof(Border));border.Name="surface";border.SetValue(Border.CornerRadiusProperty,new CornerRadius(7));border.SetValue(Border.BackgroundProperty,Brushes.Transparent);border.SetValue(Border.PaddingProperty,new Thickness(12,0,12,0));var presenter=new FrameworkElementFactory(typeof(ContentPresenter));presenter.SetValue(VerticalAlignmentProperty,VerticalAlignment.Center);border.AppendChild(presenter);template.VisualTree=border;
   foreach(var property in new[]{Button.IsMouseOverProperty,Button.IsKeyboardFocusedProperty}){var trigger=new Trigger{Property=property,Value=true};trigger.Setters.Add(new Setter(Border.BackgroundProperty,Brush(dark?"#3A3A3B":"#F0F0F0"),"surface"));template.Triggers.Add(trigger);}
   button.Template=template;button.Click+=(s,e)=>{Hide();action();};items.Children.Add(button);
  }
  static SolidColorBrush Brush(string value)=>(SolidColorBrush)new BrushConverter().ConvertFromString(value);
 }
}
