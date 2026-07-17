param(
    [switch] $SmokeTest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$port = 4173
$serverUrl = "http://127.0.0.1:$port/"
$statePath = Join-Path $projectRoot ".server-state.json"
$jobHandle = [IntPtr]::Zero
$serverProcess = $null

if (-not ("ElementalOrbit.ServerJob" -as [type])) {
    Add-Type -TypeDefinition @"
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

namespace ElementalOrbit
{
    public static class ServerJob
    {
        private const uint JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000;
        private const int JobObjectExtendedLimitInformation = 9;

        [StructLayout(LayoutKind.Sequential)]
        private struct JOBOBJECT_BASIC_LIMIT_INFORMATION
        {
            public long PerProcessUserTimeLimit;
            public long PerJobUserTimeLimit;
            public uint LimitFlags;
            public UIntPtr MinimumWorkingSetSize;
            public UIntPtr MaximumWorkingSetSize;
            public uint ActiveProcessLimit;
            public UIntPtr Affinity;
            public uint PriorityClass;
            public uint SchedulingClass;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct IO_COUNTERS
        {
            public ulong ReadOperationCount;
            public ulong WriteOperationCount;
            public ulong OtherOperationCount;
            public ulong ReadTransferCount;
            public ulong WriteTransferCount;
            public ulong OtherTransferCount;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
        {
            public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
            public IO_COUNTERS IoInfo;
            public UIntPtr ProcessMemoryLimit;
            public UIntPtr JobMemoryLimit;
            public UIntPtr PeakProcessMemoryUsed;
            public UIntPtr PeakJobMemoryUsed;
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr CreateJobObject(IntPtr securityAttributes, string name);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool SetInformationJobObject(
            IntPtr job,
            int informationClass,
            IntPtr information,
            uint informationLength);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool CloseHandle(IntPtr handle);

        public static IntPtr CreateKillOnCloseJob()
        {
            IntPtr job = CreateJobObject(IntPtr.Zero, null);
            if (job == IntPtr.Zero)
                throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not create the server job object.");

            var limits = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
            limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            int length = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
            IntPtr pointer = Marshal.AllocHGlobal(length);

            try
            {
                Marshal.StructureToPtr(limits, pointer, false);
                if (!SetInformationJobObject(job, JobObjectExtendedLimitInformation, pointer, (uint)length))
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not configure server process cleanup.");
            }
            catch
            {
                CloseHandle(job);
                throw;
            }
            finally
            {
                Marshal.FreeHGlobal(pointer);
            }

            return job;
        }

        public static void AddProcess(IntPtr job, IntPtr process)
        {
            if (!AssignProcessToJobObject(job, process))
                throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not supervise the server process.");
        }

        public static void Close(IntPtr job)
        {
            if (job != IntPtr.Zero)
                CloseHandle(job);
        }
    }
}
"@
}

function Get-ListeningProcessIds {
    @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique)
}

function Test-ElementalOrbitServer {
    try {
        $response = Invoke-WebRequest -Uri $serverUrl -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content -match "<title>Elemental Orbit"
    }
    catch {
        return $false
    }
}

function Stop-ProcessTree {
    param([Parameter(Mandatory)][int] $RootProcessId)

    $snapshot = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue)
    $queue = [Collections.Generic.Queue[int]]::new()
    $ordered = [Collections.Generic.List[int]]::new()
    $queue.Enqueue($RootProcessId)

    while ($queue.Count -gt 0) {
        $currentId = $queue.Dequeue()
        $ordered.Add($currentId)
        foreach ($child in $snapshot | Where-Object ParentProcessId -eq $currentId) {
            $queue.Enqueue([int]$child.ProcessId)
        }
    }

    $processIds = $ordered.ToArray()
    [array]::Reverse($processIds)
    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

function Remove-TrackedServer {
    if (-not (Test-Path -LiteralPath $statePath)) {
        return
    }

    try {
        $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
        $candidate = Get-Process -Id ([int]$state.processId) -ErrorAction SilentlyContinue
        if ($candidate) {
            $actualStart = $candidate.StartTime.ToUniversalTime().ToString("o")
            if ($actualStart -eq [string]$state.startedAtUtc) {
                Write-Host "[CLEANUP] Stopping the previously tracked server process tree (PID $($candidate.Id))." -ForegroundColor Yellow
                Stop-ProcessTree -RootProcessId $candidate.Id
            }
        }
    }
    catch {
        Write-Warning "The previous server state could not be read; listener checks will still run."
    }
    finally {
        Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue
    }
}

function Remove-StaleListener {
    $listenerIds = @(Get-ListeningProcessIds)
    if ($listenerIds.Count -eq 0) {
        return
    }

    if (-not (Test-ElementalOrbitServer)) {
        $owners = $listenerIds -join ", "
        throw "Port $port is occupied by an unrelated application (PID $owners). It was not stopped."
    }

    foreach ($listenerId in $listenerIds) {
        Write-Host "[CLEANUP] Found an existing Elemental Orbit server on port $port (PID $listenerId); replacing it." -ForegroundColor Yellow
        Stop-ProcessTree -RootProcessId ([int]$listenerId)
    }

    foreach ($attempt in 1..20) {
        if (@(Get-ListeningProcessIds).Count -eq 0) {
            return
        }
        Start-Sleep -Milliseconds 150
    }

    throw "The previous Elemental Orbit server did not release port $port."
}

function Wait-ForServer {
    foreach ($attempt in 1..80) {
        if ($serverProcess.HasExited) {
            throw "The server process exited before becoming ready (exit code $($serverProcess.ExitCode))."
        }

        if (Test-ElementalOrbitServer) {
            return
        }

        Start-Sleep -Milliseconds 250
    }

    throw "The server did not become ready at $serverUrl within the startup window."
}

try {
    Write-Host ""
    Write-Host "  ELEMENTAL ORBIT" -ForegroundColor Cyan
    Write-Host "  Safe development server launcher" -ForegroundColor DarkGray
    Write-Host ""

    Remove-TrackedServer
    Remove-StaleListener

    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npmCommand) {
        throw "npm.cmd was not found. Install Node.js and npm, then try again."
    }

    $jobHandle = [ElementalOrbit.ServerJob]::CreateKillOnCloseJob()
    $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = '/d /s /c ""' + $npmCommand.Source + '" run dev -- --host 127.0.0.1 --port ' + $port + '"'
    $startInfo.WorkingDirectory = $projectRoot
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $false

    $serverProcess = [Diagnostics.Process]::Start($startInfo)
    [ElementalOrbit.ServerJob]::AddProcess($jobHandle, $serverProcess.Handle)

    @{
        processId = $serverProcess.Id
        startedAtUtc = $serverProcess.StartTime.ToUniversalTime().ToString("o")
        projectRoot = $projectRoot
        port = $port
    } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8

    Wait-ForServer
    Write-Host ""
    Write-Host "[READY] $serverUrl" -ForegroundColor Green
    Write-Host "[INFO] Close this window or press Ctrl+C to stop the entire server process tree." -ForegroundColor DarkGray
    Write-Host ""

    if ($SmokeTest) {
        Write-Host "[TEST] Startup succeeded; verifying automatic shutdown." -ForegroundColor Cyan
        Start-Sleep -Milliseconds 400
    }
    else {
        $serverProcess.WaitForExit()
        if ($serverProcess.ExitCode -ne 0) {
            throw "The npm server process exited with code $($serverProcess.ExitCode)."
        }
    }
}
catch {
    Write-Host ""
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    if ($jobHandle -ne [IntPtr]::Zero) {
        [ElementalOrbit.ServerJob]::Close($jobHandle)
        $jobHandle = [IntPtr]::Zero
    }

    if ($serverProcess -and -not $serverProcess.HasExited) {
        Stop-ProcessTree -RootProcessId $serverProcess.Id
    }

    Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue

    foreach ($attempt in 1..20) {
        if (@(Get-ListeningProcessIds).Count -eq 0) {
            break
        }
        Start-Sleep -Milliseconds 100
    }

    if (@(Get-ListeningProcessIds).Count -eq 0) {
        Write-Host "[CLEAN] Server processes stopped and port $port released." -ForegroundColor Green
    }
    else {
        Write-Warning "A process is still listening on port $port after cleanup."
    }
}
