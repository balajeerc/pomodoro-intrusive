import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';

import { LAUNCH } from './constants';

function* watchForMessages() {}

function* launch() {
  yield takeEvery(LAUNCH, watchForMessages);
}

function* nagProcess() {
  yield [fork(firstSaga), fork(secondSaga), fork(thirdSaga)];
}

export default nagProcess;
