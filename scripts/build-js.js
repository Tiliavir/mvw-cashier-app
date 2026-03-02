'use strict';

/**
 * Minifies JS source files from src/js/ to public/.
 * Preserves directory structure for each mapped file.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

const mappings = [
  ['src/js/app.js',                    'public/js/app.js'],
  ['src/js/create/create-app.js',      'public/create/js/create-app.js'],
  ['src/js/edit/edit-app.js',          'public/edit/js/edit-app.js'],
  ['src/js/settings/settings-app.js',  'public/settings/js/settings-app.js'],
  ['src/js/stats/stats-app.js',        'public/stats/js/stats-app.js'],
  ['src/js/shared/models.js',          'public/shared/js/models.js'],
  ['src/js/shared/storage.js',         'public/shared/js/storage.js'],
  ['src/js/shared/ui.js',              'public/shared/js/ui.js'],
  ['src/js/shared/paths.js',           'public/shared/js/paths.js'],
];

for (const [src, dst] of mappings) {
  const srcPath = path.join(root, src);
  const dstPath = path.join(root, dst);

  fs.mkdirSync(path.dirname(dstPath), { recursive: true });

  execSync(
    `node_modules/.bin/terser "${srcPath}" --output "${dstPath}" --compress --mangle`,
    { cwd: root, stdio: 'inherit' },
  );

  console.log(`  ${src} → ${dst}`);
}

console.log('JS build complete.');
