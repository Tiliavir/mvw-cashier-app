'use strict';

const { createServer } = require('node:net');
const { spawn } = require('node:child_process');

function getFreePort() {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

(async () => {
  const port = process.env.PW_PORT ? Number(process.env.PW_PORT) : await getFreePort();
  const env = { ...process.env, PW_PORT: String(port) };
  const child = spawn('npx', ['playwright', 'test'], {
    stdio: 'inherit',
    env,
  });
  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
})();

