using System;using System.Net;using System.Net.Http;using System.Threading;using System.Threading.Tasks;using ProjectMaties;
class ReleaseClientTests{
 class Handler:HttpMessageHandler{internal int Count;internal string Body="{\"tag_name\":\"v1.1.0\",\"prerelease\":false,\"draft\":false,\"assets\":[{\"name\":\"ConrollerPlus-1.1.0-win-x64.zip\",\"browser_download_url\":\"https://github.com/NorthAngel/project-maties/releases/download/v1.1.0/ConrollerPlus-1.1.0-win-x64.zip\"}]}";protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r,CancellationToken t){Count++;return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK){Content=new StringContent(Body)});}}
 static int Main(){try{Run().GetAwaiter().GetResult();return 0;}catch(Exception e){Console.Error.WriteLine(e);return 1;}}
 static async Task Run(){
 var handler=new Handler();var client=new ReleaseClient(new HttpClient(handler));var now=DateTime.UtcNow;
 Check(await client.CheckAsync("1.0.0",now,false)==null&&handler.Count==0,"no monthly request before due");
 var result=await client.CheckAsync("1.0.0",now.AddMonths(-2),false);
 Check(result.Available&&result.Version=="1.1.0"&&handler.Count==1,"metadata only");
 handler.Body="{\"tag_name\":\"v2.0.0\",\"prerelease\":true,\"assets\":[]}";
 Check(!(await client.CheckAsync("1.0.0",null,true)).Available,"ignore prerelease");
 Check(!ReleaseClient.SafeAssetUrl("https://github.com.evil/NorthAngel/project-maties/releases/download/a/b.zip"),"reject other origin");
 Check(!ReleaseClient.SafeAssetUrl("https://github.com/NorthAngel/other/releases/download/a/b.zip"),"reject other repository");
 Console.WriteLine("Release client: 5 checks passed");
 }
 static void Check(bool v,string m){if(!v)throw new Exception(m);}
}
