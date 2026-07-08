const { spawn } = require('child_process');

console.log("Running Django django-admin tests...");
const testProc = spawn('python3', ['manage.py', 'test'], { stdio: 'inherit', cwd: 'backend' });

testProc.on('close', (code) => {
  console.log(`Django test runner exited with code ${code}`);
  process.exit(code);
});
