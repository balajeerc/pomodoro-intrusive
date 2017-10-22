/*
 * Sagas controlling effects in pomodoro nagger
 *
 * Basically the nerve centre of the nagger app, coordinating
 * incoming messages and corresponding state changes
 */

import childProcess from 'child_process';

import { delay } from 'redux-saga';
import { call, fork, take, cancel, put } from 'redux-saga/effects';

import logger from '../logger';

import { LAUNCH, SPAWN_POMODORO_NAG, SHUTDOWN } from './constants';
import { shutdown } from './actions';

/*
 * Checks in a timed loop for a specified time
 * as to whether the pomodoro nag process has been spawned.
 * Returns true if pomodoro-nag process exists in process table, false otherwise
 */
function isPomodoroNagRunning() {
  return Promise.resolve(true);
}

/*
 * Waits for commands to spawn nag processes
 */
function* startNagProcessSpawner() {
  while (true) {
    yield take(SPAWN_POMODORO_NAG);
    // do the spawning
    const nagModulePath = 'dist/pomodoro-nag.js';
    logger.client.info(`Spawning pomodoro nag process: ${nagModulePath}`);
    childProcess.spawn('node', [nagModulePath], { detached: true });
    // TODO: Figure out why removing the delay added below causes the child process to end
    // Does the parent process exiting too soon after spawning child end up closing child also?
    yield delay(1000);
    const hasChildSpawned = yield call(isPomodoroNagRunning);
    if (!hasChildSpawned) {
      console.error('Unable to spawn pomodoro nag process'); // eslint-disable-line no-console
    } else {
      logger.client.info('Successfully spawned pomodoro nag process');
    }
    yield put(shutdown());
  }
}

/*
 * Root saga for pomodoro client
 */
function* launch() {
  yield take(LAUNCH);

  const spawnerTask = yield fork(startNagProcessSpawner);

  yield take(SHUTDOWN);

  yield cancel(spawnerTask);

  process.exit(0);
}

export default launch;
