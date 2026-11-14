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

async function main() {
  const port = process.env.PW_PORT ? Number(process.env.PW_PORT) : await getFreePort();
  const env = { ...process.env, PW_PORT: String(port) };
  const cli = require.resolve('@playwright/test/cli');
  const child = spawn(process.execPath, [cli, 'test'], {
    stdio: 'inherit',
    env,
  });
  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
