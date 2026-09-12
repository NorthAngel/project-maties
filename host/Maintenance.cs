using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;

namespace ProjectMaties
{
    public sealed class ReleaseInfo
    {
        public string Version { get; set; }
        public string Executable { get; set; }
        public string Root { get; set; }
    }

    public static class Maintenance
    {
        private const int MaximumReleaseFiles = 10000;
        private const long MaximumRecoveryEntryBytes = 256L * 1024L * 1024L;

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

        public static string HashFile(string path)
        {
            using (FileStream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
            using (SHA256 sha = SHA256.Create())
            {
                return ToHex(sha.ComputeHash(stream));
            }
        }

        public static List<Dictionary<string, object>> Diagnose(string appRoot)
        {
            string root;
            RecoveryData recovery;
            try
            {
                root = NormalizeRoot(appRoot, "repair-unavailable");
                recovery = LoadRecovery(root, false);
            }
            catch
            {
                return NativeFiles.Select(name => new Dictionary<string, object>
                {
                    ["name"] = name,
                    ["ok"] = false,
                    ["code"] = "repair-unavailable"
                }).ToList();
            }

            return Diagnose(root, recovery.Hashes);
        }

        public static List<string> Repair(string appRoot)
        {
            string root = NormalizeRoot(appRoot, "repair-unavailable");
            RecoveryData recovery = LoadRecovery(root, true);
            List<string> broken = Diagnose(root, recovery.Hashes)
                .Where(item => !Convert.ToBoolean(item["ok"], CultureInfo.InvariantCulture))
                .Select(item => Convert.ToString(item["name"], CultureInfo.InvariantCulture))
                .ToList();

            if (broken.Count == 0)
            {
                return broken;
            }

            string nativeRoot = Path.Combine(root, "native");
            try
            {
                EnsureNoReparsePoints(root, "native", true);
                Directory.CreateDirectory(nativeRoot);
                EnsureNoReparsePoints(root, "native", false);
            }
            catch
            {
                throw Error("repair-failed");
            }

            string token = Guid.NewGuid().ToString("N");
            var items = new List<RepairItem>();
            var committed = new List<RepairItem>();
            bool rollbackFailed = false;

            try
            {
                foreach (string name in broken)
                {
                    string relative = "native/" + name;
                    EnsureNoReparsePoints(root, relative, true);
                    string target = Path.Combine(nativeRoot, name);
                    if (Directory.Exists(target))
                    {
                        throw new IOException("Native component path is a directory.");
                    }

                    var item = new RepairItem
                    {
                        Name = name,
                        Target = target,
                        Stage = Path.Combine(nativeRoot, "." + name + ".repairing-" + token),
                        Backup = Path.Combine(nativeRoot, "." + name + ".before-repair-" + token),
                        Existed = File.Exists(target)
                    };
                    items.Add(item);

                    if (item.Existed)
                    {
                        File.Copy(item.Target, item.Backup, false);
                    }
                    File.WriteAllBytes(item.Stage, recovery.Files[name]);
                    if (!FixedTimeEquals(HashFile(item.Stage), recovery.Hashes[name]))
                    {
                        throw new InvalidDataException("Staged recovery file failed verification.");
                    }
                }

                foreach (RepairItem item in items)
                {
                    if (item.Existed)
                    {
                        File.Replace(item.Stage, item.Target, null, true);
                    }
                    else
                    {
                        File.Move(item.Stage, item.Target);
                    }
                    item.Committed = true;
                    committed.Add(item);
                }

                if (Diagnose(root, recovery.Hashes).Any(item => !Convert.ToBoolean(item["ok"], CultureInfo.InvariantCulture)))
                {
                    throw new InvalidDataException("Repaired files failed final verification.");
                }

                return broken;
            }
            catch
            {
                for (int index = committed.Count - 1; index >= 0; index--)
                {
                    RepairItem item = committed[index];
                    try
                    {
                        if (item.Existed)
                        {
                            if (File.Exists(item.Target))
                            {
                                File.Replace(item.Backup, item.Target, null, true);
                            }
                            else
                            {
                                File.Move(item.Backup, item.Target);
                            }
                        }
                        else if (File.Exists(item.Target))
                        {
                            File.Delete(item.Target);
                        }
                    }
                    catch
                    {
                        rollbackFailed = true;
                    }
                }
                throw Error("repair-failed" + (rollbackFailed ? ": rollback" : string.Empty));
            }
            finally
            {
                foreach (RepairItem item in items)
                {
                    DeleteIfExists(item.Stage);
                    DeleteIfExists(item.Backup);
                }
            }
        }

        public static ReleaseInfo VerifyRelease(string directory, string currentVersion)
        {
            string root = NormalizeRoot(directory, "update-manifest");
            if (!Directory.Exists(root))
            {
                throw Error("update-manifest");
            }

            try
            {
                EnsureNoReparsePoints(root, "release-manifest.json", false);
            }
            catch (UnsafePathException)
            {
                throw Error("update-path");
            }
            catch
            {
                throw Error("update-manifest");
            }

            Dictionary<string, object> manifest;
            try
            {
                string json = File.ReadAllText(Path.Combine(root, "release-manifest.json"), Encoding.UTF8);
                manifest = new JavaScriptSerializer().DeserializeObject(json) as Dictionary<string, object>;
                if (manifest == null)
                {
                    throw new InvalidDataException();
                }
            }
            catch
            {
                throw Error("update-manifest");
            }

            if (!StringValue(manifest, "product").Equals("ControllerCompanion", StringComparison.Ordinal) ||
                !StringValue(manifest, "host").Equals("webview2", StringComparison.Ordinal))
            {
                throw Error("update-product");
            }

            string version = StringValue(manifest, "version");
            if (!IsNewerVersion(version, currentVersion))
            {
                throw Error("update-not-newer");
            }

            Dictionary<string, object> files = ObjectValue(manifest, "files");
            if (files == null || files.Count == 0 || files.Count > MaximumReleaseFiles ||
                RequiredReleaseFiles.Any(name => !files.ContainsKey(name)))
            {
                throw Error("update-manifest");
            }

            foreach (KeyValuePair<string, object> item in files)
            {
                string relative = item.Key;
                if (!IsSafeRelativePath(relative))
                {
                    throw Error("update-path");
                }
                string expectedHash = item.Value as string;
                if (!IsSha256(expectedHash))
                {
                    throw Error("update-integrity: " + relative);
                }

                string target = SafeTarget(root, relative);
                try
                {
                    EnsureNoReparsePoints(root, relative, false);
                }
                catch (UnsafePathException)
                {
                    throw Error("update-path");
                }
                catch
                {
                    throw Error("update-integrity: " + relative);
                }

                if (!File.Exists(target))
                {
                    throw Error("update-integrity: " + relative);
                }
                try
                {
                    if (!FixedTimeEquals(HashFile(target), expectedHash))
                    {
                        throw Error("update-integrity: " + relative);
                    }
                }
                catch (InvalidOperationException)
                {
                    throw;
                }
                catch
                {
                    throw Error("update-integrity: " + relative);
                }
            }

            string executable = Path.Combine(root, "ControllerCompanion.exe");
            if (!IsX64PortableExecutable(executable))
            {
                throw Error("update-product");
            }

            return new ReleaseInfo
            {
                Version = version,
                Executable = executable,
                Root = root
            };
        }

        private static List<Dictionary<string, object>> Diagnose(string root, Dictionary<string, string> hashes)
        {
            var result = new List<Dictionary<string, object>>();
            foreach (string name in NativeFiles)
            {
                bool ok = false;
                try
                {
                    string relative = "native/" + name;
                    EnsureNoReparsePoints(root, relative, false);
                    string path = Path.Combine(root, "native", name);
                    ok = File.Exists(path) && FixedTimeEquals(HashFile(path), hashes[name]);
                }
                catch
                {
                    ok = false;
                }
                result.Add(new Dictionary<string, object>
                {
                    ["name"] = name,
                    ["ok"] = ok
                });
            }
            return result;
        }

        private static RecoveryData LoadRecovery(string root, bool includeFiles)
        {
            string archivePath = Path.Combine(root, "recovery.zip");
            if (!File.Exists(archivePath))
            {
                throw Error("repair-unavailable");
            }
            try
            {
                EnsureNoReparsePoints(root, "recovery.zip", false);
            }
            catch (UnsafePathException)
            {
                throw Error("repair-backup");
            }
            catch
            {
                throw Error("repair-unavailable");
            }

            try
            {
                using (FileStream stream = new FileStream(archivePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                using (var archive = new ZipArchive(stream, ZipArchiveMode.Read, false))
                {
                    var entries = new Dictionary<string, ZipArchiveEntry>(StringComparer.OrdinalIgnoreCase);
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        if (!IsSafeArchiveName(entry.FullName) || entries.ContainsKey(entry.FullName))
                        {
                            throw Error("repair-backup");
                        }
                        entries.Add(entry.FullName, entry);
                    }

                    if (!entries.ContainsKey("manifest.json") || NativeFiles.Any(name => !entries.ContainsKey(name)))
                    {
                        throw Error("repair-backup");
                    }

                    Dictionary<string, object> manifest;
                    using (Stream manifestStream = entries["manifest.json"].Open())
                    using (var reader = new StreamReader(manifestStream, new UTF8Encoding(false, true), true))
                    {
                        manifest = new JavaScriptSerializer().DeserializeObject(reader.ReadToEnd()) as Dictionary<string, object>;
                    }
                    Dictionary<string, object> fileValues = manifest == null ? null : ObjectValue(manifest, "files");
                    if (fileValues == null)
                    {
                        throw Error("repair-backup");
                    }

                    var hashes = new Dictionary<string, string>(StringComparer.Ordinal);
                    foreach (KeyValuePair<string, object> item in fileValues)
                    {
                        if (!IsSafeArchiveName(item.Key) || !(item.Value is string) || !IsSha256((string)item.Value))
                        {
                            throw Error("repair-backup");
                        }
                    }
                    foreach (string name in NativeFiles)
                    {
                        object hash;
                        if (!fileValues.TryGetValue(name, out hash) || !(hash is string) || !IsSha256((string)hash))
                        {
                            throw Error("repair-backup");
                        }
                        hashes[name] = (string)hash;
                    }

                    var files = new Dictionary<string, byte[]>(StringComparer.Ordinal);
                    if (includeFiles)
                    {
                        foreach (string name in NativeFiles)
                        {
                            byte[] bytes = ReadEntry(entries[name]);
                            if (!FixedTimeEquals(HashBytes(bytes), hashes[name]))
                            {
                                throw Error("repair-backup: " + name);
                            }
                            files[name] = bytes;
                        }
                    }

                    return new RecoveryData { Hashes = hashes, Files = files };
                }
            }
            catch (InvalidOperationException error)
            {
                if (error.Message.StartsWith("repair-", StringComparison.Ordinal))
                {
                    throw;
                }
                throw Error("repair-backup");
            }
            catch (InvalidDataException)
            {
                throw Error("repair-backup");
            }
            catch (IOException)
            {
                throw Error("repair-unavailable");
            }
            catch (UnauthorizedAccessException)
            {
                throw Error("repair-unavailable");
            }
            catch
            {
                throw Error("repair-backup");
            }
        }

        private static byte[] ReadEntry(ZipArchiveEntry entry)
        {
            if (entry.Length < 0 || entry.Length > MaximumRecoveryEntryBytes)
            {
                throw Error("repair-backup");
            }
            using (Stream input = entry.Open())
            using (var output = new MemoryStream(entry.Length > int.MaxValue ? 0 : (int)entry.Length))
            {
                input.CopyTo(output);
                if (output.Length > MaximumRecoveryEntryBytes)
                {
                    throw Error("repair-backup");
                }
                return output.ToArray();
            }
        }

        private static bool IsSafeArchiveName(string name)
        {
            return !string.IsNullOrEmpty(name) &&
                name != "." &&
                name != ".." &&
                name.IndexOf('/') < 0 &&
                name.IndexOf('\\') < 0 &&
                name.IndexOf(':') < 0 &&
                !Path.IsPathRooted(name);
        }

        private static bool IsSafeRelativePath(string name)
        {
            if (string.IsNullOrEmpty(name) || name.IndexOf('\\') >= 0 || name.IndexOf(':') >= 0 || Path.IsPathRooted(name))
            {
                return false;
            }
            string[] parts = name.Split('/');
            return parts.Length > 0 && parts.All(part => !string.IsNullOrEmpty(part) && part != "." && part != "..");
        }

        private static string SafeTarget(string root, string relative)
        {
            string target;
            try
            {
                target = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
            }
            catch
            {
                throw Error("update-path");
            }
            string prefix = root.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
            if (!target.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                throw Error("update-path");
            }
            return target;
        }

        private static void EnsureNoReparsePoints(string root, string relative, bool allowMissing)
        {
            string current = root;
            CheckNotReparse(current);
            foreach (string part in relative.Split('/'))
            {
                current = Path.Combine(current, part);
                if (!File.Exists(current) && !Directory.Exists(current))
                {
                    if (allowMissing)
                    {
                        return;
                    }
                    throw new FileNotFoundException("Checked path is missing.", current);
                }
                CheckNotReparse(current);
            }
        }

        private static void CheckNotReparse(string path)
        {
            FileAttributes attributes = File.GetAttributes(path);
            if ((attributes & FileAttributes.ReparsePoint) != 0)
            {
                throw new UnsafePathException();
            }
        }

        private static bool IsX64PortableExecutable(string path)
        {
            try
            {
                using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
                using (var reader = new BinaryReader(stream))
                {
                    if (stream.Length < 70 || reader.ReadUInt16() != 0x5a4d)
                    {
                        return false;
                    }
                    stream.Position = 0x3c;
                    int offset = reader.ReadInt32();
                    if (offset < 64 || offset > stream.Length - 6)
                    {
                        return false;
                    }
                    stream.Position = offset;
                    return reader.ReadUInt32() == 0x00004550 && reader.ReadUInt16() == 0x8664;
                }
            }
            catch
            {
                return false;
            }
        }

        private static bool IsNewerVersion(string candidate, string current)
        {
            int[] candidateParts;
            int[] currentParts;
            if (!TryParseVersion(candidate, out candidateParts) || !TryParseVersion(current, out currentParts))
            {
                return false;
            }
            for (int index = 0; index < 3; index++)
            {
                if (candidateParts[index] != currentParts[index])
                {
                    return candidateParts[index] > currentParts[index];
                }
            }
            return false;
        }

        private static bool TryParseVersion(string value, out int[] parts)
        {
            parts = null;
            if (string.IsNullOrEmpty(value))
            {
                return false;
            }
            string[] values = value.Split('.');
            if (values.Length != 3)
            {
                return false;
            }
            var parsed = new int[3];
            for (int index = 0; index < values.Length; index++)
            {
                if (values[index].Length == 0 || values[index].Any(character => character < '0' || character > '9') ||
                    !int.TryParse(values[index], NumberStyles.None, CultureInfo.InvariantCulture, out parsed[index]))
                {
                    return false;
                }
            }
            parts = parsed;
            return true;
        }

        private static string StringValue(Dictionary<string, object> value, string key)
        {
            object item;
            return value != null && value.TryGetValue(key, out item) && item is string ? (string)item : string.Empty;
        }

        private static Dictionary<string, object> ObjectValue(Dictionary<string, object> value, string key)
        {
            object item;
            return value != null && value.TryGetValue(key, out item) ? item as Dictionary<string, object> : null;
        }

        private static bool IsSha256(string value)
        {
            return value != null && value.Length == 64 && value.All(character =>
                (character >= '0' && character <= '9') || (character >= 'a' && character <= 'f'));
        }

        private static string HashBytes(byte[] bytes)
        {
            using (SHA256 sha = SHA256.Create())
            {
                return ToHex(sha.ComputeHash(bytes));
            }
        }

        private static string ToHex(byte[] bytes)
        {
            var text = new StringBuilder(bytes.Length * 2);
            foreach (byte value in bytes)
            {
                text.Append(value.ToString("x2", CultureInfo.InvariantCulture));
            }
            return text.ToString();
        }

        private static bool FixedTimeEquals(string left, string right)
        {
            if (left == null || right == null || left.Length != right.Length)
            {
                return false;
            }
            int difference = 0;
            for (int index = 0; index < left.Length; index++)
            {
                difference |= left[index] ^ right[index];
            }
            return difference == 0;
        }

        private static string NormalizeRoot(string value, string code)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(value))
                {
                    throw new ArgumentException();
                }
                return Path.GetFullPath(value).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            }
            catch
            {
                throw Error(code);
            }
        }

        private static void DeleteIfExists(string path)
        {
            try
            {
                if (!string.IsNullOrEmpty(path) && File.Exists(path))
                {
                    File.Delete(path);
                }
            }
            catch
            {
            }
        }

        private static InvalidOperationException Error(string code)
        {
            return new InvalidOperationException(code);
        }

        private sealed class RecoveryData
        {
            public Dictionary<string, string> Hashes;
            public Dictionary<string, byte[]> Files;
        }

        private sealed class RepairItem
        {
            public string Name;
            public string Target;
            public string Stage;
            public string Backup;
            public bool Existed;
            public bool Committed;
        }

        private sealed class UnsafePathException : Exception
        {
        }
    }
}
