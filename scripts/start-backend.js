const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');
const backendEnv = path.join(backendDir, '.env');
const backendEnvExample = path.join(backendDir, '.env.example');

// 1. Ensure backend/.env exists (vital when downloaded fresh from GitHub ZIP)
if (!fs.existsSync(backendEnv) && fs.existsSync(backendEnvExample)) {
  fs.copyFileSync(backendEnvExample, backendEnv);
  console.log('[BACKEND NOTICE] Created backend/.env from .env.example.');
  console.log('[BACKEND NOTICE] Remember to set your GEMINI_API_KEY in backend/.env for AI reviews.');
}

function hasUvicorn(pythonExe) {
  const dir = path.dirname(pythonExe);
  return (
    fs.existsSync(path.join(dir, 'uvicorn.exe')) ||
    fs.existsSync(path.join(dir, 'Scripts', 'uvicorn.exe')) ||
    fs.existsSync(path.join(dir, 'uvicorn'))
  );
}

function findPython() {
  // 1. Check local virtual environments (backend/venv or venv)
  const venvs = [
    path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
    path.join(backendDir, 'venv', 'bin', 'python'),
    path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe'),
    path.join(__dirname, '..', 'venv', 'bin', 'python'),
  ];

  for (const candidate of venvs) {
    if (fs.existsSync(candidate) && hasUvicorn(candidate)) {
      return candidate;
    }
  }

  // 2. Machine-specific Python 3.9 installation (primary dev machine)
  const localPy39 = 'C:\\Users\\eldan\\AppData\\Local\\Programs\\Python\\Python39\\python.exe';
  if (process.platform === 'win32' && fs.existsSync(localPy39) && hasUvicorn(localPy39)) {
    return localPy39;
  }

  // 3. Any venv candidate that exists even if uvicorn wasn't detected by file
  for (const candidate of venvs) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 4. System default python
  return process.platform === 'win32' ? 'python' : 'python3';
}

const pythonCmd = findPython();
console.log(`[BACKEND] Starting Uvicorn using: ${pythonCmd}`);

const child = spawn(
  pythonCmd,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'],
  {
    cwd: backendDir,
    stdio: 'inherit',
  }
);

child.on('error', (err) => {
  console.error('[BACKEND ERROR] Failed to start backend:', err.message);
  console.error('[BACKEND ERROR] Please ensure Python is installed and run:');
  console.error('                cd backend && pip install -r requirements.txt');
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
