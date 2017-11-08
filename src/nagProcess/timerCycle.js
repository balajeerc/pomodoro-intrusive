/*
 * Saga controlling the Pomodoro timing cycle/state machine
 *
 * 1) Once started, it goes into WAIT_ON_WORK, waiting for work time to elapse
 *      then moves to WAIT_ON_WORK state
 * 2) In the WAIT_ON_BREAK state, it periodically calls screen lock
 *      thus intrusively preventing any work, then moves to TRANSITION_TO_WORK
 * 3) During TRANSITION_TO_WORK, it repeatedly checks for desktop activity.
 *      If no work activity is detected, it plays a sound alerting user to resume work.
 *      Once work activity is detected, it moves back to WAIT_ON_WORK state.
 *
 */
import { delay } from 'redux-saga';
import { call, cancel, cps, fork, take, put } from 'redux-saga/effects';
import soundPlay from 'play-sound';

import config from '../configLoader';
import lockScreenLoop from './screenLockControl';
import logger from '../logger';
import SOUND_NOTIFICATION_FILE from '../../sounds/back_to_work_notification.wav';
import {
  RESPONSE,
  SCREENLOCK_WAIT_FOR_ACTIVITY,
  SCREENLOCK_DETECTED_ACTIVITY,
} from '../controlCommands';
import { WAIT_ON_WORK, WAIT_ON_BREAK, START_ACTIVITY_CHECK } from '../pomodoroStates';

import { STOP_POMODORO_CYCLE } from './constants';
import { startWork, startBreak, startActivityCheck } from './actions';

// TODO: Make the following configurable using JSON
const INACTIVITY_CHECK_REPEAT_INTERVAL = 5; // in secs

const soundPlayer = soundPlay({});
const playSound = soundPlayer.play.bind(soundPlayer);

function* waitForActivity() {
  while (true) {
    try {
      logger.nag.info('Playing notification to return to work');
      yield cps(playSound, SOUND_NOTIFICATION_FILE);
      yield call(delay, INACTIVITY_CHECK_REPEAT_INTERVAL * 1000);
    } catch (error) {
      logger.nag.error(`Malfunction when playing sound after break: ${error}`);
      break; // break out of activity check since there is no point repeating check
    }
  }
}

function* waitOnWork() {
  while (true) {
    yield take(WAIT_ON_WORK);
    logger.nag.info('Now in WAIT_ON_WORK');
    yield call(delay, config.pomodoro.pomodoroTimes.work * 60 * 1000);

    yield put(startBreak());
  }
}

function* waitOnBreak() {
  while (true) {
    yield take(WAIT_ON_BREAK);
    logger.nag.info('Now in WAIT_ON_BREAK');

    const lockScreenLoopTask = yield fork(lockScreenLoop);
    yield call(delay, config.pomodoro.pomodoroTimes.break * 60 * 1000);
    logger.nag.info('Unlocking screen after elapse of break');

    yield put(startActivityCheck(lockScreenLoopTask));
  }
}

function* transitionToWork() {
  while (true) {
    const activityCheckCommand = yield take(START_ACTIVITY_CHECK);

    logger.nag.info('Now in TRANSITION_TO_WORK');
    logger.nag.info('Waiting for activity');

    yield put({ type: SCREENLOCK_WAIT_FOR_ACTIVITY });

    const soundPlayLoop = yield fork(waitForActivity);
    yield take(SCREENLOCK_DETECTED_ACTIVITY);
    logger.nag.info('Detected activity. Closing screenlock');
    yield put({
      type: RESPONSE,
      response: 'OK',
    });

    yield cancel(activityCheckCommand.screenLockTask);
    yield cancel(soundPlayLoop);

    yield put(startWork());
  }
}

function* stopPomodoroTasks(tasks) {
  yield take(STOP_POMODORO_CYCLE);
  logger.nag.info('Stopping pomodoro timing cycle');
  tasks.map(function* cancelTask(task) {
    yield cancel(task);
  });
}

export default function* startPomodoroCycle() {
  logger.nag.info('Starting pomodoro timing cycle');
  const waitOnWorkTask = yield fork(waitOnWork);
  const waitOnBreakTask = yield fork(waitOnBreak);
  const transitionToWorkTask = yield fork(transitionToWork);

  yield put(startWork());
  yield stopPomodoroTasks([waitOnWorkTask, waitOnBreakTask, transitionToWorkTask]);
}
