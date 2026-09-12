using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using ProjectMaties;

internal static class HostMaintenanceTests
{
    private static readonly string[] NativeFiles =
    {
        "ControllerBridge.exe",
        "SDL3.dll",
        "gamecontrollerdb.txt"
    };

    private static readonly string[] RequiredReleaseFiles =
    {
        "ControllerCompanion.exe",
        "Microsoft.Web.WebView2.Core.dll",
        "Microsoft.Web.WebView2.Wpf.dll",
        "WebView2Loader.dll",
        "web/settings.html",
        "web/overlay.html",
        "web/src/runtime-entry.js",
        "web/src/runtime-engine.js",
        "web/src/webview-bridge.js",
        "web/src/settings.js",
        "web/src/overlay.js",
        "native/ControllerBridge.exe",
        "native/SDL3.dll",
        "native/gamecontrollerdb.txt",
        "recovery.zip"
    };

    private static int checks;

    private static int Main(string[] args)
    {
        if (args.Contains("--test-input"))
        {
            return RunFakeBridge();
        }

        try
        {
            RunAsync().GetAwaiter().GetResult();
            Console.WriteLine("TOTAL " + checks + " checks passed");
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("FAIL " + error);
            return 1;
        }
    }

    private static async Task RunAsync()
    {
        HashFileReturnsLowercaseSha256();
        DiagnoseWithoutRecoveryReportsUnavailable();
        DiagnoseComparesEveryRuntimeFileWithRecoveryManifest();
        RepairRestoresOnlyDamagedFilesFromVerifiedArchive();
        RepairRejectsUnsafeOrTamperedArchiveBeforeChangingRuntime();
        RepairRollsBackEarlierReplacementWhenLaterCommitFails();
        VerifyReleaseAcceptsCompleteNewerX64Release();
        VerifyReleaseRejectsInvalidManifestPathsProductsVersionsAndHashes();
        await NativeServiceStartsRoutesRequestsAndStopsCleanly();
        await NativeServiceTimesOutAndKillsUnresponsiveOwnedHelper();
        await NativeServiceReportsStartupAndUnexpectedExitFailures();
    }

    private static void DiagnoseWithoutRecoveryReportsUnavailable()
    {
        WithTempDirectory(root =>
        {
            List<Dictionary<string, object>> result = Maintenance.Diagnose(root);
            Check(result.All(item =>
                !Convert.ToBoolean(item["ok"]) &&
                Convert.ToString(item["code"]) == "repair-unavailable"),
                "Diagnose reports unavailable recovery for every native file");
            ThrowsCode(() => Maintenance.Repair(root), "repair-unavailable", "Repair reports missing recovery archive clearly");
        });
    }

    private static void HashFileReturnsLowercaseSha256()
    {
        WithTempDirectory(root =>
        {
            string file = Path.Combine(root, "sample.bin");
            File.WriteAllText(file, "abc", new UTF8Encoding(false));
            Equal(
                "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                Maintenance.HashFile(file),
                "HashFile returns the standard lowercase SHA-256 digest");
        });
    }

    private static void DiagnoseComparesEveryRuntimeFileWithRecoveryManifest()
    {
        WithTempDirectory(root =>
        {
            Dictionary<string, byte[]> recovery = RecoveryBytes("diagnose");
            CreateRecoveryArchive(root, recovery);
            string native = Path.Combine(root, "native");
            Directory.CreateDirectory(native);
            File.WriteAllBytes(Path.Combine(native, NativeFiles[0]), recovery[NativeFiles[0]]);
            File.WriteAllText(Path.Combine(native, NativeFiles[1]), "corrupt");

            List<Dictionary<string, object>> result = Maintenance.Diagnose(root);
            Equal(3, result.Count, "Diagnose reports all required native files");
            Check(Result(result, NativeFiles[0]), "Diagnose marks matching file healthy");
            Check(!Result(result, NativeFiles[1]), "Diagnose marks corrupted file unhealthy");
            Check(!Result(result, NativeFiles[2]), "Diagnose marks missing file unhealthy");
        });
    }

    private static void RepairRestoresOnlyDamagedFilesFromVerifiedArchive()
    {
        WithTempDirectory(root =>
        {
            Dictionary<string, byte[]> recovery = RecoveryBytes("repair");
            CreateRecoveryArchive(root, recovery);
            string native = Path.Combine(root, "native");
            Directory.CreateDirectory(native);
            File.WriteAllBytes(Path.Combine(native, NativeFiles[0]), recovery[NativeFiles[0]]);
            File.WriteAllText(Path.Combine(native, NativeFiles[1]), "corrupt");

            DateTime untouchedWrite = File.GetLastWriteTimeUtc(Path.Combine(native, NativeFiles[0]));
            List<string> repaired = Maintenance.Repair(root);
            SequenceEqual(
                new[] { NativeFiles[1], NativeFiles[2] },
                repaired,
                "Repair returns only damaged or missing file names");
            foreach (string name in NativeFiles)
            {
                BytesEqual(recovery[name], File.ReadAllBytes(Path.Combine(native, name)), "Repair restores " + name);
            }
            Equal(untouchedWrite, File.GetLastWriteTimeUtc(Path.Combine(native, NativeFiles[0])), "Repair leaves healthy native file untouched");
            Check(Maintenance.Diagnose(root).All(item => Convert.ToBoolean(item["ok"])), "Repair leaves diagnosis healthy");
        });
    }

    private static void RepairRejectsUnsafeOrTamperedArchiveBeforeChangingRuntime()
    {
        WithTempDirectory(root =>
        {
            Dictionary<string, byte[]> recovery = RecoveryBytes("unsafe");
            CreateRecoveryArchive(root, recovery, archive =>
            {
                WriteEntry(archive, "../outside.txt", Encoding.UTF8.GetBytes("unsafe"));
            });
            string native = Path.Combine(root, "native");
            Directory.CreateDirectory(native);
            foreach (string name in NativeFiles)
            {
                File.WriteAllText(Path.Combine(native, name), "original " + name);
            }

            Dictionary<string, byte[]> before = NativeFiles.ToDictionary(
                name => name,
                name => File.ReadAllBytes(Path.Combine(native, name)));
            ThrowsCode(() => Maintenance.Repair(root), "repair-backup", "Repair rejects unsafe recovery entry");
            foreach (string name in NativeFiles)
            {
                BytesEqual(before[name], File.ReadAllBytes(Path.Combine(native, name)), "Unsafe archive changes no runtime file " + name);
            }

            CreateRecoveryArchive(root, recovery, archive =>
            {
                WriteEntry(archive, NativeFiles[0], recovery[NativeFiles[0]]);
            });
            ThrowsCode(() => Maintenance.Repair(root), "repair-backup", "Repair rejects duplicate recovery entry");

            Dictionary<string, byte[]> tampered = RecoveryBytes("tampered");
            CreateRecoveryArchive(root, tampered, null, new Dictionary<string, byte[]>(tampered)
            {
                [NativeFiles[2]] = Encoding.UTF8.GetBytes("content does not match manifest")
            });
            ThrowsCode(() => Maintenance.Repair(root), "repair-backup", "Repair validates every backup hash before replacement");
            foreach (string name in NativeFiles)
            {
                BytesEqual(before[name], File.ReadAllBytes(Path.Combine(native, name)), "Tampered archive changes no runtime file " + name);
            }
        });
    }

    private static void RepairRollsBackEarlierReplacementWhenLaterCommitFails()
    {
        WithTempDirectory(root =>
        {
            Dictionary<string, byte[]> recovery = RecoveryBytes("rollback");
            CreateRecoveryArchive(root, recovery);
            string native = Path.Combine(root, "native");
            Directory.CreateDirectory(native);
            foreach (string name in NativeFiles)
            {
                File.WriteAllText(Path.Combine(native, name), "broken " + name);
            }

            Dictionary<string, byte[]> before = NativeFiles.ToDictionary(
                name => name,
                name => File.ReadAllBytes(Path.Combine(native, name)));
            using (FileStream locked = new FileStream(
                Path.Combine(native, NativeFiles[1]),
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read))
            {
                ThrowsCode(() => Maintenance.Repair(root), "repair-failed", "Repair reports commit failure");
                BytesEqual(before[NativeFiles[0]], File.ReadAllBytes(Path.Combine(native, NativeFiles[0])), "Repair rolls back earlier committed file");
                BytesEqual(before[NativeFiles[1]], File.ReadAllBytes(Path.Combine(native, NativeFiles[1])), "Repair preserves file whose commit failed");
            }
            BytesEqual(before[NativeFiles[2]], File.ReadAllBytes(Path.Combine(native, NativeFiles[2])), "Repair does not partially commit later file");
        });
    }

    private static void VerifyReleaseAcceptsCompleteNewerX64Release()
    {
        WithTempDirectory(root =>
        {
            Dictionary<string, string> files = CreateValidRelease(root, "0.6.0");
            ReleaseInfo result = Maintenance.VerifyRelease(root, "0.5.9");
            Equal("0.6.0", result.Version, "VerifyRelease returns manifest version");
            Equal(Path.GetFullPath(root), result.Root, "VerifyRelease returns normalized root");
            Equal(Path.Combine(Path.GetFullPath(root), "ControllerCompanion.exe"), result.Executable, "VerifyRelease returns fixed executable path");
            Equal(RequiredReleaseFiles.Length, files.Count, "Release fixture covers every contract-required file");
        });
    }

    private static void VerifyReleaseRejectsInvalidManifestPathsProductsVersionsAndHashes()
    {
        WithTempDirectory(root =>
        {
            Dictionary<string, string> files = CreateValidRelease(root, "0.6.0");
            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6.0", files);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.6.0"), "update-not-newer", "Release version must be newer");

            WriteReleaseManifest(root, "Other", "webview2", "0.6.0", files);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-product", "Release product is exact");
            WriteReleaseManifest(root, "ControllerCompanion", "electron", "0.6.0", files);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-product", "Release host is exact");

            Dictionary<string, string> missing = new Dictionary<string, string>(files);
            missing.Remove("web/src/runtime-engine.js");
            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6.0", missing);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-manifest", "Release manifest requires every runtime asset");

            Dictionary<string, string> traversal = new Dictionary<string, string>(files)
            {
                ["../outside.dll"] = files["WebView2Loader.dll"]
            };
            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6.0", traversal);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-path", "Release rejects traversal manifest path");

            Dictionary<string, string> backslash = new Dictionary<string, string>(files)
            {
                ["web\\outside.js"] = files["WebView2Loader.dll"]
            };
            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6.0", backslash);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-path", "Release rejects backslash manifest path");

            Dictionary<string, string> absolute = new Dictionary<string, string>(files)
            {
                ["C:/outside.dll"] = files["WebView2Loader.dll"]
            };
            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6.0", absolute);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-path", "Release rejects absolute or colon manifest path");

            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6", files);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-not-newer", "Release version uses integer x.y.z form");

            Dictionary<string, string> oversized = new Dictionary<string, string>(files);
            for (int index = oversized.Count; index <= 10000; index++)
            {
                oversized["extra/" + index + ".bin"] = files["WebView2Loader.dll"];
            }
            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6.0", oversized);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-manifest", "Release manifest caps file count at 10000");

            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6.0", files);
            File.WriteAllText(Path.Combine(root, "web", "overlay.html"), "corrupt");
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-integrity", "Release verifies every manifest hash");

            files = CreateValidRelease(root, "0.6.0");
            byte[] x86 = PeImage(0x014c);
            File.WriteAllBytes(Path.Combine(root, "ControllerCompanion.exe"), x86);
            files["ControllerCompanion.exe"] = Sha256(x86);
            WriteReleaseManifest(root, "ControllerCompanion", "webview2", "0.6.0", files);
            ThrowsCode(() => Maintenance.VerifyRelease(root, "0.5.9"), "update-product", "Release executable must be x64 PE");
        });
    }

    private static async Task NativeServiceTimesOutAndKillsUnresponsiveOwnedHelper()
    {
        string root = CreateTempDirectory();
        try
        {
            InstallFakeBridge(root);
            int failures = 0;
            using (var service = new NativeService(root, true))
            {
                service.Failed += message => Interlocked.Increment(ref failures);
                await service.StartAsync(new Dictionary<string, object> { ["ignoreQuit"] = true });
                var timeoutWatch = Stopwatch.StartNew();
                try
                {
                    await service.RequestAsync(new Dictionary<string, object>
                    {
                        ["type"] = "controller",
                        ["action"] = "hang"
                    });
                    throw new Exception("NativeService request timeout: expected TimeoutException");
                }
                catch (TimeoutException)
                {
                    Check(timeoutWatch.ElapsedMilliseconds >= 4500 && timeoutWatch.ElapsedMilliseconds < 8000, "NativeService request timeout is five seconds");
                }

                Task<Dictionary<string, object>> pending = service.RequestAsync(new Dictionary<string, object>
                {
                    ["type"] = "controller",
                    ["action"] = "hang"
                });
                await Task.Delay(50);
                int ownedPid = service.ProcessId.Value;
                await service.StopAsync();
                await ThrowsAsync(async () => await pending, "NativeService stop fails pending requests");
                Check(!service.IsRunning && !IsProcessAlive(ownedPid), "NativeService kills its unresponsive owned helper after orderly timeout");
                Equal(0, failures, "Timed-out expected shutdown does not emit Failed");
            }
        }
        finally
        {
            DeleteDirectory(root);
        }
    }

    private static async Task NativeServiceStartsRoutesRequestsAndStopsCleanly()
    {
        string root = CreateTempDirectory();
        try
        {
            InstallFakeBridge(root);
            var messages = new List<Dictionary<string, object>>();
            var messageGate = new object();
            var inventory = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            int failures = 0;
            using (var service = new NativeService(root, true))
            {
                service.Message += message =>
                {
                    lock (messageGate)
                    {
                        messages.Add(message);
                    }
                    if (Convert.ToString(message["type"]) == "devices")
                    {
                        inventory.TrySetResult(true);
                    }
                };
                service.Failed += message => Interlocked.Increment(ref failures);

                await service.StartAsync(new Dictionary<string, object> { ["preferredGuid"] = "fixture-guid" });
                Check(service.IsRunning, "NativeService reports running after configure response");
                Check(service.ProcessId.HasValue && service.ProcessId.Value != Process.GetCurrentProcess().Id, "NativeService exposes only helper process id");
                await Await(inventory.Task, 2000, "NativeService forwards unsolicited stdout messages");

                Task<Dictionary<string, object>> first = service.RequestAsync(new Dictionary<string, object>
                {
                    ["type"] = "controller",
                    ["action"] = "echo",
                    ["value"] = "first"
                });
                Task<Dictionary<string, object>> second = service.RequestAsync(new Dictionary<string, object>
                {
                    ["type"] = "controller",
                    ["action"] = "echo",
                    ["value"] = "second"
                });
                Dictionary<string, object>[] responses = await Task.WhenAll(first, second);
                Equal("first", Convert.ToString(responses[0]["value"]), "NativeService matches first response by requestId");
                Equal("second", Convert.ToString(responses[1]["value"]), "NativeService matches concurrent response by requestId");

                var direct = new TaskCompletionSource<Dictionary<string, object>>(TaskCreationOptions.RunContinuationsAsynchronously);
                service.Message += message =>
                {
                    if (Convert.ToString(message["type"]) == "notice")
                    {
                        direct.TrySetResult(message);
                    }
                };
                service.Send(new Dictionary<string, object> { ["type"] = "notice", ["value"] = 7 });
                Equal(7, Convert.ToInt32((await Await(direct.Task, 2000, "NativeService Send writes one serialized line"))["value"]), "NativeService forwards direct send response");

                await service.StopAsync();
                Check(!service.IsRunning && !service.ProcessId.HasValue, "NativeService stops its helper process");
                Equal(0, failures, "Expected NativeService shutdown does not emit Failed");
            }
        }
        finally
        {
            DeleteDirectory(root);
        }
    }

    private static async Task NativeServiceReportsStartupAndUnexpectedExitFailures()
    {
        string missingRoot = CreateTempDirectory();
        try
        {
            int startupFailures = 0;
            using (var missing = new NativeService(missingRoot, true))
            {
                missing.Failed += message => Interlocked.Increment(ref startupFailures);
                await ThrowsAsync(() => missing.StartAsync(new Dictionary<string, object>()), "NativeService missing helper fails startup");
                Equal(1, startupFailures, "NativeService startup failure emits Failed once");
            }
        }
        finally
        {
            DeleteDirectory(missingRoot);
        }

        string root = CreateTempDirectory();
        try
        {
            InstallFakeBridge(root);
            int configureFailures = 0;
            using (var rejected = new NativeService(root, true))
            {
                rejected.Failed += message => Interlocked.Increment(ref configureFailures);
                await ThrowsAsync(
                    () => rejected.StartAsync(new Dictionary<string, object> { ["failConfigure"] = true }),
                    "NativeService rejected configure fails startup");
                Equal(1, configureFailures, "NativeService configure failure emits Failed once");
                Check(!rejected.IsRunning, "NativeService stops helper after configure failure");
            }

            var failed = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
            using (var service = new NativeService(root, true))
            {
                service.Failed += message => failed.TrySetResult(message);
                await service.StartAsync(new Dictionary<string, object>());
                Task<Dictionary<string, object>> pending = service.RequestAsync(new Dictionary<string, object>
                {
                    ["type"] = "controller",
                    ["action"] = "crash"
                });
                string failure = await Await(failed.Task, 3000, "Unexpected helper exit emits Failed");
                Check(!string.IsNullOrWhiteSpace(failure), "Unexpected helper exit includes a failure message");
                await ThrowsAsync(async () => await pending, "Unexpected helper exit fails pending request");
                Check(!service.IsRunning, "NativeService clears running state after unexpected exit");
            }
        }
        finally
        {
            DeleteDirectory(root);
        }
    }

    private static int RunFakeBridge()
    {
        var serializer = new JavaScriptSerializer();
        bool ignoreQuit = false;
        Emit(serializer, new Dictionary<string, object>
        {
            ["type"] = "devices",
            ["items"] = new object[0]
        });
        string line;
        while ((line = Console.ReadLine()) != null)
        {
            var command = serializer.DeserializeObject(line) as Dictionary<string, object>;
            if (command == null)
            {
                continue;
            }
            string type = Convert.ToString(command.ContainsKey("type") ? command["type"] : "");
            if (type == "quit")
            {
                if (!ignoreQuit)
                {
                    return 0;
                }
                continue;
            }
            if (type == "notice")
            {
                Emit(serializer, new Dictionary<string, object>
                {
                    ["type"] = "notice",
                    ["value"] = command["value"]
                });
                continue;
            }
            if (type != "controller")
            {
                continue;
            }
            string action = Convert.ToString(command["action"]);
            if (action == "hang")
            {
                continue;
            }
            if (action == "crash")
            {
                return 23;
            }
            var response = new Dictionary<string, object>
            {
                ["type"] = "controller-result",
                ["requestId"] = Convert.ToString(command["requestId"]),
                ["ok"] = true
            };
            if (action == "configure")
            {
                var config = command["config"] as Dictionary<string, object>;
                object value;
                ignoreQuit = config != null && config.TryGetValue("ignoreQuit", out value) && Convert.ToBoolean(value);
                if (config != null && config.TryGetValue("failConfigure", out value) && Convert.ToBoolean(value))
                {
                    response["ok"] = false;
                    response["error"] = "fixture rejected configuration";
                }
            }
            if (command.ContainsKey("value"))
            {
                response["value"] = command["value"];
            }
            Emit(serializer, response);
        }
        return 0;
    }

    private static bool IsProcessAlive(int processId)
    {
        try
        {
            using (Process candidate = Process.GetProcessById(processId))
            {
                return !candidate.HasExited;
            }
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    private static void Emit(JavaScriptSerializer serializer, Dictionary<string, object> value)
    {
        Console.WriteLine(serializer.Serialize(value));
        Console.Out.Flush();
    }

    private static void InstallFakeBridge(string root)
    {
        string native = Path.Combine(root, "native");
        Directory.CreateDirectory(native);
        string source = Process.GetCurrentProcess().MainModule.FileName;
        File.Copy(source, Path.Combine(native, "ControllerBridge.exe"));
        string config = source + ".config";
        if (File.Exists(config))
        {
            File.Copy(config, Path.Combine(native, "ControllerBridge.exe.config"));
        }
    }

    private static Dictionary<string, byte[]> RecoveryBytes(string prefix)
    {
        return NativeFiles.ToDictionary(
            name => name,
            name => Encoding.UTF8.GetBytes(prefix + " verified " + name));
    }

    private static void CreateRecoveryArchive(
        string root,
        Dictionary<string, byte[]> manifestBytes,
        Action<ZipArchive> append = null,
        Dictionary<string, byte[]> archiveBytes = null)
    {
        string archivePath = Path.Combine(root, "recovery.zip");
        if (File.Exists(archivePath))
        {
            File.Delete(archivePath);
        }
        var serializer = new JavaScriptSerializer();
        var hashes = manifestBytes.ToDictionary(item => item.Key, item => (object)Sha256(item.Value));
        using (ZipArchive archive = ZipFile.Open(archivePath, ZipArchiveMode.Create))
        {
            WriteEntry(archive, "manifest.json", Encoding.UTF8.GetBytes(serializer.Serialize(new Dictionary<string, object>
            {
                ["files"] = hashes
            })));
            foreach (KeyValuePair<string, byte[]> item in archiveBytes ?? manifestBytes)
            {
                WriteEntry(archive, item.Key, item.Value);
            }
            append?.Invoke(archive);
        }
    }

    private static void WriteEntry(ZipArchive archive, string name, byte[] bytes)
    {
        ZipArchiveEntry entry = archive.CreateEntry(name, CompressionLevel.NoCompression);
        using (Stream stream = entry.Open())
        {
            stream.Write(bytes, 0, bytes.Length);
        }
    }

    private static Dictionary<string, string> CreateValidRelease(string root, string version)
    {
        var files = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (string relative in RequiredReleaseFiles)
        {
            string path = Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            byte[] bytes = relative == "ControllerCompanion.exe"
                ? PeImage(0x8664)
                : Encoding.UTF8.GetBytes(version + " " + relative);
            File.WriteAllBytes(path, bytes);
            files[relative] = Sha256(bytes);
        }
        WriteReleaseManifest(root, "ControllerCompanion", "webview2", version, files);
        return files;
    }

    private static void WriteReleaseManifest(
        string root,
        string product,
        string host,
        string version,
        Dictionary<string, string> files)
    {
        var serializedFiles = files.ToDictionary(item => item.Key, item => (object)item.Value);
        string json = new JavaScriptSerializer().Serialize(new Dictionary<string, object>
        {
            ["product"] = product,
            ["version"] = version,
            ["host"] = host,
            ["files"] = serializedFiles
        });
        File.WriteAllText(Path.Combine(root, "release-manifest.json"), json, new UTF8Encoding(false));
    }

    private static byte[] PeImage(ushort machine)
    {
        byte[] bytes = new byte[128];
        bytes[0] = (byte)'M';
        bytes[1] = (byte)'Z';
        BitConverter.GetBytes(64).CopyTo(bytes, 60);
        bytes[64] = (byte)'P';
        bytes[65] = (byte)'E';
        BitConverter.GetBytes(machine).CopyTo(bytes, 68);
        return bytes;
    }

    private static string Sha256(byte[] bytes)
    {
        using (SHA256 sha = SHA256.Create())
        {
            return string.Concat(sha.ComputeHash(bytes).Select(value => value.ToString("x2")));
        }
    }

    private static bool Result(IEnumerable<Dictionary<string, object>> values, string name)
    {
        Dictionary<string, object> item = values.Single(value => Convert.ToString(value["name"]) == name);
        return Convert.ToBoolean(item["ok"]);
    }

    private static async Task<T> Await<T>(Task<T> task, int timeoutMilliseconds, string name)
    {
        if (await Task.WhenAny(task, Task.Delay(timeoutMilliseconds)) != task)
        {
            throw new Exception(name + ": timed out");
        }
        checks++;
        Console.WriteLine("PASS " + name);
        return await task;
    }

    private static async Task ThrowsAsync(Func<Task> action, string name)
    {
        try
        {
            await action();
        }
        catch
        {
            checks++;
            Console.WriteLine("PASS " + name);
            return;
        }
        throw new Exception(name + ": expected exception");
    }

    private static void ThrowsCode(Action action, string code, string name)
    {
        try
        {
            action();
        }
        catch (Exception error)
        {
            Check(error.Message.StartsWith(code, StringComparison.Ordinal), name + " (actual: " + error.Message + ")");
            return;
        }
        throw new Exception(name + ": expected " + code);
    }

    private static void Check(bool condition, string name)
    {
        if (!condition)
        {
            throw new Exception(name);
        }
        checks++;
        Console.WriteLine("PASS " + name);
    }

    private static void Equal<T>(T expected, T actual, string name)
    {
        if (!EqualityComparer<T>.Default.Equals(expected, actual))
        {
            throw new Exception(name + ": expected " + expected + ", actual " + actual);
        }
        checks++;
        Console.WriteLine("PASS " + name);
    }

    private static void SequenceEqual(IEnumerable<string> expected, IEnumerable<string> actual, string name)
    {
        string[] expectedArray = expected.ToArray();
        string[] actualArray = actual.ToArray();
        if (!expectedArray.SequenceEqual(actualArray, StringComparer.Ordinal))
        {
            throw new Exception(name + ": expected [" + string.Join(",", expectedArray) + "], actual [" + string.Join(",", actualArray) + "]");
        }
        checks++;
        Console.WriteLine("PASS " + name);
    }

    private static void BytesEqual(byte[] expected, byte[] actual, string name)
    {
        Check(expected.SequenceEqual(actual), name);
    }

    private static void WithTempDirectory(Action<string> action)
    {
        string root = CreateTempDirectory();
        try
        {
            action(root);
        }
        finally
        {
            DeleteDirectory(root);
        }
    }

    private static string CreateTempDirectory()
    {
        string root = Path.Combine(Path.GetTempPath(), "project-maties-host-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        return root;
    }

    private static void DeleteDirectory(string root)
    {
        try
        {
            if (Directory.Exists(root))
            {
                Directory.Delete(root, true);
            }
        }
        catch
        {
            // A failing test should not be hidden by best-effort fixture cleanup.
        }
    }
}
