import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

async function run() {
  const pythonCmd = "python3";
  const backendDir = path.join(process.cwd(), "backend");

  console.log("Ensuring Python dependencies are installed...");
  spawnSync(pythonCmd, ["-m", "pip", "install", "--user", "django", "djangorestframework", "djangorestframework-simplejwt", "django-cors-headers", "django-filter", "django-ratelimit", "celery", "redis", "google-genai", "django-jazzmin", "python-dotenv", "pillow", "PyJWT"], { cwd: backendDir, stdio: "inherit" });

  console.log("Creating superuser script...");
  const scriptContent = `
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixitall_backend.settings')
django.setup()
from account.models import MyUser
email = 'admin@gmail.com'
password = 'admin'
if not MyUser.objects.filter(email=email).exists():
    user = MyUser.objects.create_superuser(email=email, password=password)
    print(f"Superuser {email} created successfully.")
else:
    user = MyUser.objects.get(email=email)
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print(f"Superuser {email} already exists, password updated.")
`;
  const scriptPath = path.join(backendDir, "create_admin_tmp.py");
  fs.writeFileSync(scriptPath, scriptContent);

  console.log("Executing superuser creation...");
  spawnSync(pythonCmd, ["create_admin_tmp.py"], { cwd: backendDir, stdio: "inherit" });
  
  if (fs.existsSync(scriptPath)) {
    fs.unlinkSync(scriptPath);
  }

  console.log("Setup complete.");
}

run().catch(console.error);
