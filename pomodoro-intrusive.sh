#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const processPath = path.join(__dirname, 'dist/pomodoro-intrusive.js');

const production = 'NODE_ENV' in process.env ? process.env.NODE_ENV : 'production';
const env = Object.assign({}, process.env, { 'NODE_ENV': production });

spawnSync('node', [processPath, ...process.argv.slice(2)], 
         { cwd: __dirname, stdio: ['inherit', 'inherit', 'inherit'], env });
 
