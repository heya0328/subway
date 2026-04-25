// Patch fs to handle EMFILE gracefully
const realFs = require('fs');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

// Run granite dev
require('./node_modules/@granite-js/cli/dist/index.js');
