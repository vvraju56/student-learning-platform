#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process")
const fs = require("fs")
const net = require("net")
const path = require("path")

const ROOT = process.cwd()
const EYE_SCRIPT = process.env.PYTHON_EYE_SERVER_SCRIPT
  ? path.resolve(ROOT, process.env.PYTHON_EYE_SERVER_SCRIPT)
  : path.join(ROOT, "eye dectetion", "web_server.py")
const EYE_HOST = process.env.PYTHON_EYE_HOST || "127.0.0.1"
const EYE_PORT = Number(process.env.PYTHON_EYE_PORT || 8001)
const SKIP_EYE = /^(1|true|yes)$/i.test(process.env.SKIP_PYTHON_EYE || "")
const REUSE_EYE = /^(1|true|yes)$/i.test(process.env.PYTHON_EYE_REUSE || "")

let webProcess = null
let pythonProcess = null
let shuttingDown = false

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function findListeningPidOnPort(port) {
  if (process.platform !== "win32") return null
  try {
    const result = spawnSync("netstat", ["-ano", "-p", "tcp"], {
      encoding: "utf8",
      windowsHide: true,
    })
    if (result.status !== 0 || !result.stdout) return null
    const lines = result.stdout.split(/\r?\n/)
    for (const line of lines) {
      if (!line.includes("LISTENING")) continue
      if (!line.includes(`:${port}`)) continue
      const parts = line.trim().split(/\s+/)
      const pid = Number(parts[parts.length - 1])
      if (Number.isFinite(pid) && pid > 0) return pid
    }
  } catch {
    return null
  }
  return null
}

function killPidTree(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false
  if (process.platform === "win32") {
    const killResult = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      encoding: "utf8",
      windowsHide: true,
    })
    return killResult.status === 0
  }
  try {
    process.kill(pid, "SIGTERM")
    return true
  } catch {
    return false
  }
}

function isProcessAlive(child) {
  return !!child && child.exitCode === null && !child.killed
}

function isPortOpen(host, port, timeoutMs = 500) {
  // Prefer netstat checks on Windows to avoid noisy websocket handshake logs.
  if (process.platform === "win32") {
    return Promise.resolve(Boolean(findListeningPidOnPort(port)))
  }

  if (typeof WebSocket === "function") {
    return new Promise((resolve) => {
      const url = `ws://${host}:${port}`
      let settled = false
      const ws = new WebSocket(url)

      const done = (open) => {
        if (settled) return
        settled = true
        try {
          ws.close()
        } catch {
          // Ignore close errors.
        }
        resolve(open)
      }

      const timer = setTimeout(() => done(false), timeoutMs)
      ws.onopen = () => {
        clearTimeout(timer)
        done(true)
      }
      ws.onerror = () => {
        clearTimeout(timer)
        done(false)
      }
    })
  }

  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const done = (open) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(open)
    }

    socket.setTimeout(timeoutMs)
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false))
    socket.once("error", () => done(false))
    socket.connect(port, host)
  })
}

function waitForStableStart(child, ms = 1600) {
  return new Promise((resolve) => {
    let settled = false

    const finish = (ok) => {
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

function getPythonCandidates(scriptPath) {
  const candidates = []
  const configured = process.env.PYTHON_BIN?.trim()
  if (configured) {
    candidates.push({ cmd: configured, args: [scriptPath], label: `${configured} ${scriptPath}` })
  }

  const venvCandidates = [
    path.join(ROOT, "eye dectetion", ".venv", "Scripts", "python.exe"),
    path.join(ROOT, ".venv", "Scripts", "python.exe"),
    path.join(ROOT, "eye dectetion", ".venv", "bin", "python"),
    path.join(ROOT, ".venv", "bin", "python"),
  ]

  for (const interpreter of venvCandidates) {
    if (fs.existsSync(interpreter)) {
      candidates.push({ cmd: interpreter, args: [scriptPath], label: `${interpreter} ${scriptPath}` })
    }
  }

  candidates.push({ cmd: "python", args: [scriptPath], label: `python ${scriptPath}` })
  candidates.push({ cmd: "python3", args: [scriptPath], label: `python3 ${scriptPath}` })
  if (process.platform === "win32") {
    candidates.push({ cmd: "py", args: ["-3", scriptPath], label: `py -3 ${scriptPath}` })
  }

  const deduped = []
  const seen = new Set()
  for (const candidate of candidates) {
    const key = `${candidate.cmd}::${candidate.args.join(" ")}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(candidate)
  }
  return deduped
}

async function startPythonServer(scriptPath) {
  const existingPid = findListeningPidOnPort(EYE_PORT)
  if (existingPid) {
    if (REUSE_EYE) {
      console.log(`[eye] Reusing running Python eye server at ws://${EYE_HOST}:${EYE_PORT}`)
      return { child: null, reused: true, attempts: [] }
    }

    console.log(`[eye] Port ${EYE_PORT} already in use by PID ${existingPid}. Restarting eye server...`)
    const killed = killPidTree(existingPid)
    if (!killed) {
      console.warn(`[eye] Could not stop PID ${existingPid}. Reusing existing eye server.`)
      return { child: null, reused: true, attempts: [] }
    }
    await wait(800)
  }

  const candidates = getPythonCandidates(scriptPath)
  const attempts = []

  for (const candidate of candidates) {
    try {
      console.log(`[eye] Starting with: ${candidate.label}`)
      const child = spawn(candidate.cmd, candidate.args, {
        cwd: path.dirname(scriptPath),
        env: process.env,
        stdio: "inherit",
        windowsHide: true,
      })

      const stable = await waitForStableStart(child)
      if (!stable) {
        attempts.push(`${candidate.label}: exited early`)
        continue
      }

      const startedAt = Date.now()
      let ready = false
      while (Date.now() - startedAt < 12000) {
        if (child.exitCode !== null) {
          break
        }
        // Poll because web_server.py can take a few seconds before websocket bind.
        // eslint-disable-next-line no-await-in-loop
        ready = process.platform === "win32"
          ? Boolean(findListeningPidOnPort(EYE_PORT))
          : await isPortOpen(EYE_HOST, EYE_PORT, 500)
        if (ready) break
        // eslint-disable-next-line no-await-in-loop
        await wait(250)
      }

      if (!ready) {
        attempts.push(`${candidate.label}: started but websocket port ${EYE_PORT} did not open in time`)
        try {
          child.kill()
        } catch {
          // Ignore kill failures.
        }
        continue
      }

      console.log(`[eye] Python eye server is running at ws://${EYE_HOST}:${EYE_PORT}`)
      return { child, reused: false, attempts }
    } catch (error) {
      attempts.push(`${candidate.label}: ${error?.message || "spawn error"}`)
    }
  }

  return { child: null, reused: false, attempts }
}

function terminateChild(child, name) {
  return new Promise((resolve) => {
    if (!isProcessAlive(child)) {
      resolve()
      return
    }

    const done = () => resolve()
    child.once("exit", done)

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      })
      killer.once("exit", done)
      killer.once("error", () => {
        try {
          child.kill()
        } catch {
          // Ignore kill failures.
        }
        setTimeout(done, 600)
      })
      return
    }

    try {
      child.kill("SIGTERM")
    } catch {
      resolve()
      return
    }

    setTimeout(() => {
      if (isProcessAlive(child)) {
        try {
          child.kill("SIGKILL")
        } catch {
          // Ignore kill failures.
        }
      }
    }, 1000)
  }).catch(() => {
    console.warn(`[dev] Failed to terminate ${name} cleanly`)
  })
}

async function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  await Promise.all([
    terminateChild(webProcess, "next"),
    terminateChild(pythonProcess, "python-eye"),
  ])

  process.exit(code)
}

async function main() {
  if (!SKIP_EYE) {
    if (!fs.existsSync(EYE_SCRIPT)) {
      console.error(`[eye] Script not found: ${EYE_SCRIPT}`)
      console.error("[eye] Set PYTHON_EYE_SERVER_SCRIPT or fix the path.")
      process.exit(1)
    }

    const started = await startPythonServer(EYE_SCRIPT)
    if (!started.reused && !started.child) {
      console.error("[eye] Failed to start Python eye server.")
      for (const line of started.attempts) {
        console.error(`  - ${line}`)
      }
      console.error("[eye] Set PYTHON_BIN to your working Python interpreter and retry.")
      process.exit(1)
    }
    pythonProcess = started.child
  } else {
    console.log("[eye] SKIP_PYTHON_EYE=true, skipping Python eye server startup.")
  }

  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next")
  if (!fs.existsSync(nextBin)) {
    console.error(`[dev] Next.js binary not found at: ${nextBin}`)
    console.error("[dev] Run npm install and retry.")
    process.exit(1)
  }

  webProcess = spawn(process.execPath, [nextBin, "dev"], {
    cwd: ROOT,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  })

  webProcess.once("exit", async (code) => {
    await shutdown(code ?? 0)
  })

  webProcess.once("error", async (error) => {
    console.error(`[dev] Failed to start Next.js dev server: ${error?.message || "unknown error"}`)
    await shutdown(1)
  })
}

process.on("SIGINT", () => {
  void shutdown(0)
})

process.on("SIGTERM", () => {
  void shutdown(0)
})

void main()
