// Simple helpers used by tests to wait for a port
import net from 'node:net';

export async function waitForPort(port, timeoutMs = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function check() {
      const sock = net.createConnection({ port }, () => {
        sock.end(); resolve(true);
      });
      sock.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Timeout waiting for server'));
        else setTimeout(check, 100);
      });
    })();
  });
}
