import { NextResponse } from "next/server"
import { spawn, type ChildProcess } from "child_process"
import fs from "fs"
import path from "path"
import { execFile } from "child_process"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PythonEyeProcessState = {
  process: ChildProcess | null
  command: string | null
  scriptPath: string | null
}

const globalState = globalThis as typeof globalThis & {
  __pythonEyeProcessState__?: PythonEyeProcessState
}

if (!globalState.__pythonEyeProcessState__) {
  globalState.__pythonEyeProcessState__ = {
    process: null,
    command: null,
    scriptPath: null,
  }
}

function getState() {
  return globalState.__pythonEyeProcessState__!
}

function isProcessRunning(proc: ChildProcess | null) {
  return !!proc && !proc.killed && proc.exitCode === null
}

function resolveScriptPath() {
  const configured = process.env.PYTHON_EYE_SERVER_SCRIPT?.trim()
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured)
  }
  return path.join(process.cwd(), "eye dectetion", "web_server.py")
}

function resolveWsHost() {
  return process.env.PYTHON_EYE_HOST?.trim() || "127.0.0.1"
}

function resolveWsPort() {
  const parsed = Number(process.env.PYTHON_EYE_PORT || 8001)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8001
}

function isWsPortOpen(host: string, port: number, timeoutMs = 700) {
  if (process.platform === "win32") {
    return new Promise<boolean>((resolve) => {
      execFile("netstat", ["-ano", "-p", "tcp"], { windowsHide: true }, (error, stdout) => {
        if (error || !stdout) {
          resolve(false)
          return
        }
        const lines = stdout.split(/\r?\n/)
        const open = lines.some((line) => line.includes("LISTENING") && line.includes(`:${port}`))
        resolve(open)
      })
    })
  }

  return new Promise<boolean>((resolve) => {
    const WebSocketCtor = (globalThis as any).WebSocket
    if (!WebSocketCtor) {
      resolve(false)
      return
    }

    const url = `ws://${host}:${port}`
    let settled = false
    const ws = new WebSocketCtor(url)

    const finish = (open: boolean) => {
      if (settled) return
      settled = true
      try {
        ws.close()
      } catch {
        // Ignore close errors.
      }
      resolve(open)
    }

    const timer = setTimeout(() => finish(false), timeoutMs)
    ws.onopen = () => {
      clearTimeout(timer)
      finish(true)
    }
    ws.onerror = () => {
      clearTimeout(timer)
      finish(false)
    }
  })
}

function waitForStableStart(child: ChildProcess, ms = 900) {
  return new Promise<boolean>((resolve) => {
    let settled = false

    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(ok)
    }

    const timer = setTimeout(() => {
      finish(child.exitCode === null)
    }, ms)

    const onExit = () => finish(false)
    const onError = () => finish(false)

    const cleanup = () => {
      clearTimeout(timer)
      child.removeListener("exit", onExit)
      child.removeListener("error", onError)
    }

    child.once("exit", onExit)
    child.once("error", onError)
  })
}

export async function POST() {
  try {
    const state = getState()
    const wsHost = resolveWsHost()
    const wsPort = resolveWsPort()

    if (isProcessRunning(state.process)) {
      return NextResponse.json({
        success: true,
        status: "already_running",
        pid: state.process?.pid ?? null,
        command: state.command,
        scriptPath: state.scriptPath,
      })
    }

    const existingExternal = await isWsPortOpen(wsHost, wsPort)
    if (existingExternal) {
      return NextResponse.json({
        success: true,
        status: "already_running_external",
        wsUrl: `ws://${wsHost}:${wsPort}`,
      })
    }

    const scriptPath = resolveScriptPath()
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        {
          success: false,
          status: "script_not_found",
          error: `Python eye server script not found at: ${scriptPath}`,
        },
        { status: 404 },
      )
    }

    const candidates: Array<{ cmd: string; args: string[] }> = []
    const configuredPython = process.env.PYTHON_BIN?.trim()
    if (configuredPython) {
      candidates.push({ cmd: configuredPython, args: [scriptPath] })
    }
    candidates.push({ cmd: "python", args: [scriptPath] })
    candidates.push({ cmd: "python3", args: [scriptPath] })
    if (process.platform === "win32") {
      candidates.push({ cmd: "py", args: ["-3", scriptPath] })
    }

    let spawned: ChildProcess | null = null
    let usedCommand = ""
    const attemptErrors: string[] = []

    for (const candidate of candidates) {
      try {
        const child = spawn(candidate.cmd, candidate.args, {
          cwd: path.dirname(scriptPath),
          env: process.env,
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        })

        if (!child.pid) {
          attemptErrors.push(`${candidate.cmd}: no PID`)
          continue
        }

        const started = await waitForStableStart(child)
        if (started) {
          child.unref()
          spawned = child
          usedCommand = `${candidate.cmd} ${candidate.args.join(" ")}`
          break
        }
        attemptErrors.push(`${candidate.cmd}: process exited immediately`)
      } catch (error: any) {
        attemptErrors.push(`${candidate.cmd}: ${error?.message || "spawn error"}`)
      }
    }

    if (!spawned) {
      return NextResponse.json(
        {
          success: false,
          status: "spawn_failed",
          error: "Unable to start Python eye server. Set PYTHON_BIN if python is not in PATH.",
          attempts: attemptErrors,
        },
        { status: 500 },
      )
    }

    state.process = spawned
    state.command = usedCommand
    state.scriptPath = scriptPath

    spawned.once("exit", () => {
      const current = getState()
      if (current.process === spawned) {
        current.process = null
      }
    })

    return NextResponse.json({
      success: true,
      status: "started",
      pid: spawned.pid ?? null,
      command: usedCommand,
      scriptPath,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown server error" },
      { status: 500 },
    )
  }
}
