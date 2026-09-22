using System;using System.Collections.Generic;using System.IO;using System.IO.Compression;using System.Linq;using System.Net;using System.Net.Http;using System.Threading.Tasks;using System.Web.Script.Serialization;
namespace ProjectMaties{
 public sealed class ReleaseMetadata{
  public bool Available{get;set;} public string Version{get;set;} public string Url{get;set;} public string Digest{get;set;} public DateTime CheckedAt{get;set;}
 }
 public sealed class ReleaseClient{
  readonly HttpClient http;
  const string Repository="https://api.github.com/repos/NorthAngel/project-maties/releases/";
  public ReleaseClient(HttpClient client=null){ServicePointManager.SecurityProtocol|=SecurityProtocolType.Tls12;http=client??new HttpClient();http.Timeout=TimeSpan.FromMinutes(10);http.DefaultRequestHeaders.UserAgent.ParseAdd("ConrollerPlus/1.0");http.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");}
  public static bool SafeAssetUrl(string value){Uri uri;return Uri.TryCreate(value,UriKind.Absolute,out uri)&&uri.Scheme=="https"&&uri.Host=="github.com"&&uri.IsDefaultPort&&uri.UserInfo==""&&uri.AbsolutePath.StartsWith("/NorthAngel/project-maties/releases/download/",StringComparison.OrdinalIgnoreCase)&&uri.AbsolutePath.EndsWith(".zip",StringComparison.OrdinalIgnoreCase);}
  public async Task<ReleaseMetadata> CheckAsync(string currentVersion,DateTime? lastCheckUtc,bool force){
   var now=DateTime.UtcNow;
   if(!force&&lastCheckUtc.HasValue&&lastCheckUtc<=now&&lastCheckUtc.Value.AddMonths(1)>now)return null;
   return await FetchAsync(Repository+"latest",currentVersion,false);
  }
  public async Task<ReleaseMetadata> SameVersionAsync(string version){
   try{return await FetchAsync(Repository+"tags/v"+Uri.EscapeDataString(version),version,true);}
   catch(HttpRequestException){return await FetchAsync(Repository+"tags/"+Uri.EscapeDataString(version),version,true);}
  }
  async Task<ReleaseMetadata> FetchAsync(string url,string current,bool same){
   var json=await http.GetStringAsync(url);
   var data=new JavaScriptSerializer{MaxJsonLength=8388608}.DeserializeObject(json) as Dictionary<string,object>;
   if(data==null)throw new InvalidOperationException("update-metadata");
   var version=Text(data,"tag_name").TrimStart('v','V');
   var result=new ReleaseMetadata{Version=version,CheckedAt=DateTime.UtcNow};
   if(Bool(data,"prerelease")||Bool(data,"draft"))return result;
   Version parsed,installed;if(!System.Version.TryParse(version,out parsed)||!System.Version.TryParse(current,out installed))throw new InvalidOperationException("update-version");
   if(same?parsed!=installed:parsed<=installed)return result;
   var assets=data.TryGetValue("assets",out var raw)?raw as object[]:null;
   foreach(var item in assets??new object[0]){
    var asset=item as Dictionary<string,object>;if(asset==null)continue;
    string name=Text(asset,"name"),link=Text(asset,"browser_download_url");
    if(!name.StartsWith("ConrollerPlus-",StringComparison.OrdinalIgnoreCase)||!name.EndsWith("-win-x64.zip",StringComparison.OrdinalIgnoreCase)||!SafeAssetUrl(link))continue;
    result.Url=link;result.Digest=Text(asset,"digest");result.Available=true;break;
   }
   return result;
  }
  public async Task<string> DownloadAsync(ReleaseMetadata release,string dataRoot,string currentVersion,bool same=false,IProgress<long> progress=null){
   if(release==null||!release.Available||!SafeAssetUrl(release.Url))throw new InvalidOperationException("update-unavailable");
   string stage=Path.Combine(dataRoot,"updates",Guid.NewGuid().ToString("N"));Directory.CreateDirectory(stage);
   string zip=Path.Combine(stage,"download.zip");long count=0;
   try{
    using(var response=await http.GetAsync(release.Url,HttpCompletionOption.ResponseHeadersRead)){
     response.EnsureSuccessStatusCode();
     using(var input=await response.Content.ReadAsStreamAsync())using(var output=File.Create(zip)){
      byte[] buffer=new byte[65536];int size;
      while((size=await input.ReadAsync(buffer,0,buffer.Length))>0){count+=size;if(count>1024L*1024*1024)throw new InvalidOperationException("update-too-large");await output.WriteAsync(buffer,0,size);progress?.Report(count);}
     }
    }
    if(!String.IsNullOrEmpty(release.Digest)){
     if(!release.Digest.StartsWith("sha256:",StringComparison.Ordinal)||!String.Equals(Maintenance.HashFile(zip),release.Digest.Substring(7),StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("update-integrity");
    }
    string extracted=Path.Combine(stage,"files");ExtractArchive(zip,extracted);
    var manifests=Directory.GetFiles(extracted,"release-manifest.json",SearchOption.AllDirectories);
    if(manifests.Length!=1)throw new InvalidOperationException("update-manifest");
    string appRoot=Path.GetDirectoryName(manifests[0]);
    var verified=Maintenance.VerifyRelease(appRoot,currentVersion,same);
    if(verified.Version!=release.Version)throw new InvalidOperationException("update-version");
    File.Delete(zip);return appRoot;
   }catch{if(File.Exists(zip))File.Delete(zip);throw;}
  }
  public static void ExtractArchive(string zip,string destination){
   string root=Path.GetFullPath(destination).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;
   Directory.CreateDirectory(root);long total=0;var names=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
   using(var archive=ZipFile.OpenRead(zip)){
    if(archive.Entries.Count>10000)throw new InvalidOperationException("update-too-large");
    foreach(var entry in archive.Entries){
     string relative=entry.FullName.Replace('\\','/');
     if(relative.StartsWith("/")||relative.Contains(":")||relative.Split('/').Any(p=>p==".."||p==".")||!names.Add(relative))throw new InvalidOperationException("update-path");
     string target=Path.GetFullPath(Path.Combine(root,relative));
     if(!target.StartsWith(root,StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("update-path");
     if(((entry.ExternalAttributes>>16)&0xF000)==0xA000)throw new InvalidOperationException("update-path");
     if(entry.Name==""){Directory.CreateDirectory(target);continue;}
     total+=entry.Length;if(entry.Length>256L*1024*1024||total>1024L*1024*1024)throw new InvalidOperationException("update-too-large");
     Directory.CreateDirectory(Path.GetDirectoryName(target));entry.ExtractToFile(target,false);
    }
   }
  }
  static string Text(Dictionary<string,object>d,string key){return d.TryGetValue(key,out var value)?value as string??"":"";}
  static bool Bool(Dictionary<string,object>d,string key){return d.TryGetValue(key,out var value)&&value is bool b&&b;}
 }
}
