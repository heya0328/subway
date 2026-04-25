#!/usr/bin/env node
/**
 * Patch @granite-js/mpack to enable watchman.
 *
 * Granite ships with `useWatchman: false` hardcoded, which forces metro to use
 * NodeWatcher. With ~74K+ files in node_modules that triggers EMFILE errors on
 * macOS. Flipping it to `true` makes metro use watchman, which is the supported
 * path on macOS.
 *
 * Runs automatically via the `postinstall` script in package.json so every
 * `npm install` re-applies the patch (node_modules is regenerated on install).
 *
 * Idempotent: skips silently if the file is missing or already patched.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@granite-js',
  'mpack',
  'dist',
  'metro',
  'getMetroConfig.js'
);

if (fs.existsSync(target)) {
  const before = fs.readFileSync(target, 'utf8');
  const after = before.replace(/useWatchman:\s*false/g, 'useWatchman: true');

  if (before !== after) {
    fs.writeFileSync(target, after);
    console.log('[postinstall] patched useWatchman: false → true in @granite-js/mpack');
  }
}
