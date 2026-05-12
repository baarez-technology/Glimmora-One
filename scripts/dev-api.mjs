import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const isWin = process.platform === 'win32';
const venvBin = resolve('backend', '.venv', isWin ? 'Scripts' : 'bin');
const uvicorn = resolve(venvBin, isWin ? 'uvicorn.exe' : 'uvicorn');

if (!existsSync(uvicorn)) {
  console.error(`[dev-api] uvicorn not found at ${uvicorn}`);
  console.error('[dev-api] Create the venv:');
  console.error('  cd backend && python -m venv .venv');
  console.error(isWin ? '  ./.venv/Scripts/pip install -e .' : '  ./.venv/bin/pip install -e .');
  process.exit(1);
}

const args = ['app.main:app', '--host', '127.0.0.1', '--port', '8000'];
// --reload is unreliable on Windows (WatchFiles + multiprocess hangs). macOS/Linux can use it.
if (!isWin) args.push('--reload');

const child = spawn(uvicorn, args, { cwd: 'backend', stdio: 'inherit', env: process.env });
child.on('exit', (code) => process.exit(code ?? 0));
