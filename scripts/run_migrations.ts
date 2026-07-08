import { spawnSync } from "child_process";
import path from "path";

async function run() {
  const pythonCmd = "python3";
  const backendDir = path.join(process.cwd(), "backend");

  console.log("Running makemigrations...");
  spawnSync(pythonCmd, ["manage.py", "makemigrations"], { cwd: backendDir, stdio: "inherit" });

  console.log("Running migrate...");
  spawnSync(pythonCmd, ["manage.py", "migrate"], { cwd: backendDir, stdio: "inherit" });

  console.log("Migrations complete.");
}

run().catch(console.error);
