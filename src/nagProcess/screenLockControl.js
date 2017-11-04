/*
 * Utility to lock and unlock screen
 *
 * Uses the commands specified in commandConfig.json to do the actual lock/unlock
 */

import { execFile } from 'child_process';
import path from 'path';

import { delay } from 'redux-saga';
import { call, cancelled, put } from 'redux-saga/effects';

import { HALT_SCREENLOCK } from '../controlCommands';
import logger from '../logger';

function spawnScreenLocker() {
  const appBaseDir = path.resolve(process.argv[1], '../..');
  const child = execFile(
    'node_modules/.bin/electron',
    [path.join(appBaseDir, 'dist', 'pomodoro-screenlock.js')],
    {
      cwd: appBaseDir,
      stdio: ['inherit', 'inherit', 'inherit'],
      shell: false,
    },
  );
  return {
    promise: new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    }),
    process: child,
  };
}

export default function* lockScreenLoop() {
  let processInfo;
  try {
    while (true) {
      const spawnResult = spawnScreenLocker();
      processInfo = spawnResult.process;
      yield call(() => spawnResult.promise);
    }
  } catch (err) {
    logger.nag.error(`While trying to spawn screenlock: ${err}`);
  } finally {
    if (yield cancelled()) {
      if (processInfo) {
        yield put({ type: HALT_SCREENLOCK });
        yield call(delay, 20 * 1000);
      }
    }
  }
}
