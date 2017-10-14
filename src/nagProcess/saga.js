/*
 * Sagas controlling effects in pomodoro nagger
 *
 * Basically the nerve centre of the nagger app, coordinating
 * incoming messages and corresponding state changes
 */
import { call, fork, take, takeEvery } from 'redux-saga/effects';

import { LAUNCH, SHUTDOWN } from './constants';
import config from '../../config.json';
import { createMessageQueue, createMessageChannel } from '../messageQueue';

function* watchForMessages() {
  const messageQueue = yield call(createMessageQueue, config.messageQueue.id);
  const messageChannel = yield call(createMessageChannel, messageQueue);

  while (true) {
    const message = yield take(messageChannel);
    console.log('recieved message: ' + message);
  }
}

function* launch() {
  yield takeEvery(LAUNCH, watchForMessages);
}

function* shutdown() {
  yield takeEvery(SHUTDOWN, () => {
    console.log('shutting down...');
  });
}

function* nagProcess() {
  console.log('Staring pomodoro nag process');
  yield [fork(launch), fork(shutdown)];
}

export default nagProcess;
