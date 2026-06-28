import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export function startDjango() {
  console.log("startDjango function called (run_backend.ts)");
  const backendDir = path.join(process.cwd(), "backend");
  
  const runCommand = (cmd: string, args: string[]) => {
    const commandStr = `Running: ${cmd} ${args.join(" ")}`;
    console.log(commandStr);
    const logStream = fs.createWriteStream(path.join(process.cwd(), 'backend.log'), { flags: 'a' });
    logStream.write(`\n[${new Date().toISOString()}] ${commandStr}\n`);
    const proc = spawn(cmd, args, {
      cwd: backendDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        logStream.write(data);
      });
    }
    if (proc.stderr) {
      proc.stderr.on('data', (data) => {
        logStream.write(data);
      });
    }

    return new Promise<number>((resolve) => {
      proc.on("close", (code) => {
        resolve(code || 0);
      });
      proc.on("error", (err) => {
        console.error(`Failed to start ${cmd}:`, err);
        resolve(-1);
      });
    });
  };

  const start = async () => {
    const pythonCmd = "python3";
    
    // Minimal checks - deployment script handles installation
    console.log("Checking for Django...");
    const checkDjango = await runCommand(pythonCmd, ["-c", "import django; print(django.get_version())"]);
    if (checkDjango !== 0) {
      console.log("Django not found. Installing requirements...");
      await runCommand(pythonCmd, ["-m", "pip", "install", "--break-system-packages", "-r", "requirements.txt"]);
    }

    console.log("Starting Gunicorn server on 8001...");
    const logStream = fs.createWriteStream(path.join(process.cwd(), 'backend.log'), { flags: 'a' });
    
    const wsgiApp = "fixitall_backend.wsgi:application";

    const server = spawn(pythonCmd, [
      "-m", "gunicorn",
      wsgiApp,
      "--bind", "0.0.0.0:8001",
      "--workers", "3",
      "--timeout", "120",
      "--access-logfile", "-",
      "--error-logfile", "-"
    ], {
      cwd: backendDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" }
    });

    if (server.stdout) {
      server.stdout.on('data', (data) => {
        const out = data.toString();
        process.stdout.write(`[GUNICORN STDOUT] ${out}`);
        logStream.write(out);
      });
    }
    if (server.stderr) {
      server.stderr.on('data', (data) => {
        const out = data.toString();
        process.stderr.write(`[GUNICORN STDERR] ${out}`);
        logStream.write(out);
      });
    }

    server.on("error", (err) => {
      console.error("Failed to start Gunicorn server:", err);
    });
    
    server.on("close", (code) => {
        console.log(`Gunicorn server closed with code ${code}`);
    });
  };

  start();
}
