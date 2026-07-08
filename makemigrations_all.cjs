const { execSync } = require('child_process');

try {
  console.log("Running makemigrations in backend...");
  const output = execSync('python3 manage.py makemigrations', { cwd: 'backend', encoding: 'utf8' });
  console.log(output);
  console.log("Completed makemigrations!");
} catch (error) {
  console.error("Error running makemigrations:", error.stdout || error.message);
  process.exit(1);
}
