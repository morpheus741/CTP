// Starts the local server, waits, runs the crawler, and exits with pass/fail.
import { spawn } from 'node:child_process';
import { waitForPort } from '../scripts/server-helpers.mjs';

const server = spawn(process.execPath, ['scripts/serve.mjs'], { stdio: 'inherit' });

try {
  await waitForPort(8080, 8000);
  const test = spawn(process.execPath, ['tests/link-check.mjs'], { stdio: 'inherit' });
  const code = await new Promise(res => test.on('close', res));
  server.kill('SIGINT');
  process.exit(code || 0);
} catch (e) {
  console.error(e);
  server.kill('SIGINT');
  process.exit(1);
}
