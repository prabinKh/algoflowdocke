import { spawn } from "child_process";
import http from "http";
import path from "path";
import fs from "fs";
import { startDjango } from "./run_backend.ts";

async function isDjangoReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      hostname: "127.0.0.1",
      port: 8001,
      path: "/api/store/current-company/",
      method: "GET",
      headers: {
        "X-Forwarded-Host": "127.0.0.1:3000",
        "Host": "127.0.0.1:3000"
      },
      timeout: 1000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403);
    });

    req.on("error", () => {
      resolve(false);
    });

    req.end();
  });
}

async function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`[Test Runner] Running command: ${cmd} ${args.join(" ")}`);
    const proc = spawn(cmd, args);
    let out = "";
    proc.stdout.on("data", (data) => {
      out += data.toString();
    });
    proc.stderr.on("data", (data) => {
      out += data.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(out);
      } else {
        reject(new Error(`Exit code ${code}. Output: ${out}`));
      }
    });
    proc.on("error", (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log("=== STARTING DJANGO TENANT TEST RUNNER ===");
  
  // Start Django
  console.log("[1] Starting Django backend asynchronously...");
  startDjango();
  
  // Wait for Django to be ready
  console.log("[2] Waiting for Django server to migrate, seed, and listen on port 8000...");
  const maxRetries = 150; // At 2s per retry, up to 300 seconds
  let ready = false;
  
  for (let i = 0; i < maxRetries; i++) {
    ready = await isDjangoReady();
    if (ready) {
      console.log("\n[✓] Django server is up, seeded, and ready on port 8000!");
      break;
    }
    
    // Check if there are error logs in backend.log
    if (fs.existsSync("backend.log")) {
      const logs = fs.readFileSync("backend.log", "utf-8");
      // Print the last few lines of log to show progress
      const lines = logs.trim().split("\n").slice(-3);
      process.stdout.write(`Waiting... Last logs: ${lines.join(" | ")}\r`);
    } else {
      process.stdout.write("Waiting for Django to initialize...\r");
    }
    
    await new Promise((r) => setTimeout(r, 2000));
  }
  
  if (!ready) {
    console.error("\n[❌] Django failed to start or was not ready in time. Please check backend.log.");
    if (fs.existsSync("backend.log")) {
      console.log("=== BACKEND LOGS ===");
      console.log(fs.readFileSync("backend.log", "utf-8").slice(-1000));
    }
    process.exit(1);
  }
  
  // Run test_ip.js
  console.log("\n[3] Running IP-based multi-tenant test (test_ip.js)...");
  try {
    const ipOutput = await runCommand("node", ["test_ip.js"]);
    console.log("=== test_ip.js output ===");
    console.log(ipOutput);
  } catch (errorUnknown) {
    const error = errorUnknown as Error;
    console.error("Failed running test_ip.js:", error.message);
  }
  
  // Run test_admin_api.cjs
  console.log("\n[4] Running Multi-Tenant Admin API test (test_admin_api.cjs)...");
  try {
    const adminOutput = await runCommand("node", ["test_admin_api.cjs"]);
    console.log("=== test_admin_api.cjs output ===");
    console.log(adminOutput);
  } catch (errorUnknown) {
    const error = errorUnknown as Error;
    console.error("Failed running test_admin_api.cjs:", error.message);
  }
  
  console.log("\n=== TEST RUNNER FINISHED ===");
  process.exit(0);
}

main();
