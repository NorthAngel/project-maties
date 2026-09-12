using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace ProjectMaties
{
    public sealed class NativeService : IDisposable
    {
        private const int RequestTimeoutMilliseconds = 5000;
        private const int StopTimeoutMilliseconds = 2000;

        private readonly string executable;
        private readonly bool testing;
        private readonly object stateGate = new object();
        private readonly object sendGate = new object();
        private readonly object requestGate = new object();
        private readonly Dictionary<string, TaskCompletionSource<Dictionary<string, object>>> pending =
            new Dictionary<string, TaskCompletionSource<Dictionary<string, object>>>(StringComparer.Ordinal);

        private Process process;
        private bool starting;
        private bool expectedStop;
        private bool disposed;
        private long requestSerial;
        private string stderr = string.Empty;

        public NativeService(string appRoot, bool testing)
        {
            if (string.IsNullOrWhiteSpace(appRoot))
            {
                throw new ArgumentException("An application root is required.", nameof(appRoot));
            }
            executable = Path.Combine(Path.GetFullPath(appRoot), "native", "ControllerBridge.exe");
            this.testing = testing;
        }

        public event Action<Dictionary<string, object>> Message;
        public event Action<string> Failed;

        public bool IsRunning
        {
            get
            {
                lock (stateGate)
                {
                    return process != null && !HasExited(process);
                }
            }
        }

        public int? ProcessId
        {
            get
            {
                lock (stateGate)
                {
                    if (process == null || HasExited(process))
                    {
                        return null;
                    }
                    try
                    {
                        return process.Id;
                    }
                    catch
                    {
                        return null;
                    }
                }
            }
        }

        public async Task StartAsync(Dictionary<string, object> controllerConfig)
        {
            Process child = null;
            lock (stateGate)
            {
                ThrowIfDisposed();
                if (starting || (process != null && !HasExited(process)))
                {
                    throw new InvalidOperationException("Native input service is already running.");
                }
                starting = true;
            }

            try
            {
                if (!File.Exists(executable))
                {
                    throw new FileNotFoundException("ControllerBridge.exe was not found.", executable);
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = executable,
                    Arguments = testing ? "--test-input" : string.Empty,
                    WorkingDirectory = Path.GetDirectoryName(executable),
                    UseShellExecute = false,
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                child = new Process { StartInfo = startInfo, EnableRaisingEvents = true };
                child.Exited += ChildExited;
                if (!child.Start())
                {
                    throw new InvalidOperationException("ControllerBridge.exe did not start.");
                }
                child.StandardInput.AutoFlush = true;

                lock (stateGate)
                {
                    ThrowIfDisposed();
                    process = child;
                    expectedStop = false;
                    starting = false;
                    stderr = string.Empty;
                }

                Observe(ReadStdoutAsync(child));
                Observe(ReadStderrAsync(child));

                Dictionary<string, object> response = await RequestAsync(new Dictionary<string, object>
                {
                    ["type"] = "controller",
                    ["action"] = "configure",
                    ["config"] = controllerConfig ?? new Dictionary<string, object>()
                }).ConfigureAwait(false);

                object ok;
                if (!response.TryGetValue("ok", out ok) || !Convert.ToBoolean(ok))
                {
                    object error;
                    string reason = response.TryGetValue("error", out error)
                        ? Convert.ToString(error)
                        : "Controller configuration failed.";
                    throw new InvalidOperationException(reason);
                }
            }
            catch (Exception error)
            {
                bool raiseFailure;
                lock (stateGate)
                {
                    starting = false;
                    raiseFailure = child == null || ReferenceEquals(process, child);
                    if (ReferenceEquals(process, child))
                    {
                        expectedStop = true;
                    }
                }

                if (child != null)
                {
                    await StopOwnedProcessAsync(child, true).ConfigureAwait(false);
                }
                FailPending(new IOException("Native input service failed during startup.", error));
                if (raiseFailure)
                {
                    RaiseFailed("Native input service failed to start: " + error.Message);
                }
                throw;
            }
        }

        public void Send(object command)
        {
            if (command == null)
            {
                throw new ArgumentNullException(nameof(command));
            }
            Process child;
            lock (stateGate)
            {
                ThrowIfDisposed();
                child = process;
                if (child == null || HasExited(child))
                {
                    throw new InvalidOperationException("Native input service is not running.");
                }
            }
            WriteLine(child, command);
        }

        public async Task<Dictionary<string, object>> RequestAsync(Dictionary<string, object> command)
        {
            if (command == null)
            {
                throw new ArgumentNullException(nameof(command));
            }

            string requestId = Interlocked.Increment(ref requestSerial).ToString(System.Globalization.CultureInfo.InvariantCulture);
            var outgoing = new Dictionary<string, object>(command, StringComparer.Ordinal)
            {
                ["requestId"] = requestId
            };
            var completion = new TaskCompletionSource<Dictionary<string, object>>(TaskCreationOptions.RunContinuationsAsynchronously);
            lock (requestGate)
            {
                pending.Add(requestId, completion);
            }

            try
            {
                Send(outgoing);
            }
            catch (Exception error)
            {
                RemovePending(requestId, completion);
                completion.TrySetException(error);
            }

            Task winner = await Task.WhenAny(completion.Task, Task.Delay(RequestTimeoutMilliseconds)).ConfigureAwait(false);
            if (winner != completion.Task && RemovePending(requestId, completion))
            {
                throw new TimeoutException("Native input service request timed out.");
            }
            return await completion.Task.ConfigureAwait(false);
        }

        public async Task StopAsync()
        {
            Process child;
            lock (stateGate)
            {
                child = process;
                if (child == null)
                {
                    return;
                }
                expectedStop = true;
            }

            await StopOwnedProcessAsync(child, true).ConfigureAwait(false);
            FailPending(new OperationCanceledException("Native input service stopped."));
        }

        public void Dispose()
        {
            lock (stateGate)
            {
                if (disposed)
                {
                    return;
                }
            }

            try
            {
                StopAsync().GetAwaiter().GetResult();
            }
            finally
            {
                lock (stateGate)
                {
                    disposed = true;
                }
            }
        }

        private async Task ReadStdoutAsync(Process child)
        {
            try
            {
                string line;
                while ((line = await child.StandardOutput.ReadLineAsync().ConfigureAwait(false)) != null)
                {
                    Dictionary<string, object> message;
                    try
                    {
                        message = new JavaScriptSerializer().DeserializeObject(line) as Dictionary<string, object>;
                    }
                    catch
                    {
                        continue;
                    }
                    if (message == null)
                    {
                        continue;
                    }

                    TaskCompletionSource<Dictionary<string, object>> completion = null;
                    object type;
                    object requestIdValue;
                    if (message.TryGetValue("type", out type) &&
                        string.Equals(Convert.ToString(type), "controller-result", StringComparison.Ordinal) &&
                        message.TryGetValue("requestId", out requestIdValue))
                    {
                        string requestId = Convert.ToString(requestIdValue);
                        if (!string.IsNullOrEmpty(requestId))
                        {
                            lock (requestGate)
                            {
                                if (pending.TryGetValue(requestId, out completion))
                                {
                                    pending.Remove(requestId);
                                }
                            }
                        }
                    }

                    if (completion != null)
                    {
                        completion.TrySetResult(message);
                    }
                    else
                    {
                        RaiseMessage(message);
                    }
                }
            }
            catch (ObjectDisposedException)
            {
            }
            catch (IOException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }

        private async Task ReadStderrAsync(Process child)
        {
            try
            {
                string line;
                while ((line = await child.StandardError.ReadLineAsync().ConfigureAwait(false)) != null)
                {
                    lock (stateGate)
                    {
                        if (!ReferenceEquals(process, child))
                        {
                            return;
                        }
                        string combined = string.IsNullOrEmpty(stderr) ? line : stderr + Environment.NewLine + line;
                        stderr = combined.Length > 4096 ? combined.Substring(combined.Length - 4096) : combined;
                    }
                }
            }
            catch (ObjectDisposedException)
            {
            }
            catch (IOException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }

        private void ChildExited(object sender, EventArgs args)
        {
            var child = (Process)sender;
            bool unexpected;
            string errorOutput;
            int? exitCode = null;
            try
            {
                exitCode = child.ExitCode;
            }
            catch
            {
            }

            lock (stateGate)
            {
                if (!ReferenceEquals(process, child))
                {
                    return;
                }
                unexpected = !expectedStop;
                errorOutput = stderr;
                process = null;
                expectedStop = false;
                stderr = string.Empty;
            }

            FailPending(new IOException("Native input service exited."));
            if (unexpected)
            {
                string message = "Native input service exited unexpectedly" +
                    (exitCode.HasValue ? " (code " + exitCode.Value + ")" : string.Empty) + ".";
                if (!string.IsNullOrWhiteSpace(errorOutput))
                {
                    message += " " + errorOutput.Trim();
                }
                RaiseFailed(message);
            }
        }

        private async Task StopOwnedProcessAsync(Process child, bool sendQuit)
        {
            if (sendQuit && !HasExited(child))
            {
                try
                {
                    WriteLine(child, new Dictionary<string, object> { ["type"] = "quit" });
                }
                catch
                {
                }
            }

            bool exited = await Task.Run(() =>
            {
                try
                {
                    return child.WaitForExit(StopTimeoutMilliseconds);
                }
                catch
                {
                    return true;
                }
            }).ConfigureAwait(false);

            if (!exited && IsOwned(child))
            {
                try
                {
                    child.Kill();
                    await Task.Run(() => child.WaitForExit(StopTimeoutMilliseconds)).ConfigureAwait(false);
                }
                catch
                {
                }
            }

            lock (stateGate)
            {
                if (ReferenceEquals(process, child))
                {
                    process = null;
                    expectedStop = false;
                    stderr = string.Empty;
                }
            }
            try
            {
                child.Dispose();
            }
            catch
            {
            }
        }

        private void WriteLine(Process child, object command)
        {
            string line = new JavaScriptSerializer().Serialize(command);
            lock (sendGate)
            {
                lock (stateGate)
                {
                    if (!ReferenceEquals(process, child) || HasExited(child))
                    {
                        throw new InvalidOperationException("Native input service is not running.");
                    }
                }
                child.StandardInput.WriteLine(line);
                child.StandardInput.Flush();
            }
        }

        private bool IsOwned(Process child)
        {
            lock (stateGate)
            {
                return ReferenceEquals(process, child);
            }
        }

        private bool RemovePending(string requestId, TaskCompletionSource<Dictionary<string, object>> completion)
        {
            lock (requestGate)
            {
                TaskCompletionSource<Dictionary<string, object>> current;
                if (pending.TryGetValue(requestId, out current) && ReferenceEquals(current, completion))
                {
                    pending.Remove(requestId);
                    return true;
                }
                return false;
            }
        }

        private void FailPending(Exception error)
        {
            TaskCompletionSource<Dictionary<string, object>>[] requests;
            lock (requestGate)
            {
                requests = new TaskCompletionSource<Dictionary<string, object>>[pending.Count];
                pending.Values.CopyTo(requests, 0);
                pending.Clear();
            }
            foreach (TaskCompletionSource<Dictionary<string, object>> request in requests)
            {
                request.TrySetException(error);
            }
        }

        private void RaiseMessage(Dictionary<string, object> message)
        {
            Action<Dictionary<string, object>> handler = Message;
            if (handler == null)
            {
                return;
            }
            foreach (Action<Dictionary<string, object>> subscriber in handler.GetInvocationList())
            {
                try
                {
                    subscriber(message);
                }
                catch
                {
                }
            }
        }

        private void RaiseFailed(string message)
        {
            Action<string> handler = Failed;
            if (handler == null)
            {
                return;
            }
            foreach (Action<string> subscriber in handler.GetInvocationList())
            {
                try
                {
                    subscriber(message);
                }
                catch
                {
                }
            }
        }

        private static bool HasExited(Process child)
        {
            try
            {
                return child.HasExited;
            }
            catch
            {
                return true;
            }
        }

        private static void Observe(Task task)
        {
            task.ContinueWith(
                completed => { var ignored = completed.Exception; },
                CancellationToken.None,
                TaskContinuationOptions.OnlyOnFaulted | TaskContinuationOptions.ExecuteSynchronously,
                TaskScheduler.Default);
        }

        private void ThrowIfDisposed()
        {
            if (disposed)
            {
                throw new ObjectDisposedException(nameof(NativeService));
            }
        }
    }
}
