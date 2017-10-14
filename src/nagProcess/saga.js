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

function* initiateShutdown() {
  logger.nag.log('info', 'Initiating pomodoro nag shutdown...');
  yield put(shutdown());
}

function* launchNagProcess() {
  yield take(LAUNCH);
  yield race({
    task: call(startMessaging, initiateShutdown),
    cancel: take(STOP_MESSAGING),
  });
}

function* shutdownNagProcess() {
  yield take(SHUTDOWN);
  logger.nag.log('info', 'Shutting down pomodoro nag process...');
  yield put(stopMessaging());
}

function* nagProcess() {
  logger.nag.log('info', 'Spawning pomodoro nag process...');
  yield fork(launchNagProcess);
  yield call(shutdownNagProcess);
  logger.nag.log('info', 'pomodoro nag process shutdown complete');
  process.exit(0);
}

export default nagProcess;
