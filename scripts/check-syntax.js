const { execFileSync, spawnSync } = require('node:child_process');

const files = execFileSync('git', ['ls-files', '--', '*.js'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'ignore' });
  if (result.status !== 0) {
    failed = true;
    console.error(`Syntax check failed: ${file}`);
  }
}

if (failed) process.exitCode = 1;
