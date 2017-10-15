/*
 * Sagas controlling effects in pomodoro nagger
 *
 * Basically the nerve centre of the nagger app, coordinating
 * incoming messages and corresponding state changes
 */
import { call, fork, take, race, put } from 'redux-saga/effects';

import logger from '../logger';
import { LAUNCH, SHUTDOWN, STOP_MESSAGING } from './constants';
import { stopMessaging, shutdown } from './actions';
import startMessaging from './messaging';
import startPomodoroCycle from './timerCycle';

/*
 * Initiates the shutdown process
 */
function* initiateShutdown() {
  logger.nag.log('info', 'Initiating pomodoro nag shutdown...');
  yield put(shutdown());
}

/*
 * Starts the messaging saga that listens for control commands from
 * the pomodoro-intrusive client
 */
function* initiateMessaging() {
  yield take(LAUNCH);
  yield race({
    task: call(startMessaging, initiateShutdown),
    cancel: take(STOP_MESSAGING),
  });
}

/*
 * Initiates the pomodoro timing saga which starts tracking
 * the poodoro work-break cycle
 */
function* initiatePomodoroCycle() {
  yield take(LAUNCH);
  yield call(startPomodoroCycle);
}

/*
 * Shuts down pomodoro nag process
 * Terminates the messaging and pomodoro timing sagas
 */
function* shutdownNagProcess() {
  yield take(SHUTDOWN);
  logger.nag.log('info', 'Shutting down pomodoro nag process...');
  yield put(stopMessaging());
}

/*
 * Root saga for pomodoro nagger
 */
function* nagProcess() {
  logger.nag.log('info', 'Spawning pomodoro nag process...');
  yield [fork(initiateMessaging), fork(initiatePomodoroCycle)];
  yield call(shutdownNagProcess);
  logger.nag.log('info', 'pomodoro nag process shutdown complete');
  process.exit(0);
}

export default nagProcess;
