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
import { call, cancel, fork, take, put } from 'redux-saga/effects';

import config from '../../config.json';
import { lockScreen, unlockScreen } from './screenLock';

import { STOP_POMODORO_CYCLE, WAIT_ON_WORK, WAIT_ON_BREAK, TRANSITION_TO_WORK } from './constants';
import { startWork, startBreak } from './actions';
import logger from '../logger';

const DEFAULT_POMODORO_WORK_TIME = 25; // in minutes
const DEFAULT_POMODORO_BREAK_TIME = 5; // in minutes
const LOCK_SCREEN_REPEAT_INTERVAL = 6; // in seconds

function* waitOnWork() {
  while (true) {
    yield take(WAIT_ON_WORK);
    logger.nag.log('info', 'Now in WAIT_ON_WORK');
    const workInterval = () => {
      if (
        'pomodoroTimes' in config &&
        'work' in config.pomodoroTimes &&
        !Number.isNaN(parseFloat(config.pomodoroTimes.work)) &&
        Number.isFinite(config.pomodoroTimes.work)
      ) {
        return config.pomodoroTimes.work;
      }
      logger.nag.log(
        'error',
        'Improper configuration detected. Cannot find pomodoroTimes.work param. Using default: 25',
      );
      return DEFAULT_POMODORO_WORK_TIME;
    };
    yield call(delay, workInterval() * 60 * 1000);
    yield put(startBreak());
  }
}

function* lockScreenLoop() {
  while (true) {
    try {
      logger.nag.info('Attempting to lock screen');
      // yield call(lockScreen);
    } catch (error) {
      logger.nag.log('error', `Error when attempting to call screenlock: ${error}`);
    }
    yield call(delay, /*LOCK_SCREEN_REPEAT_INTERVAL*/ 0.1 * 60 * 1000);
  }
}

function* waitOnBreak() {
  while (true) {
    yield take(WAIT_ON_BREAK);
    logger.nag.log('info', 'Now in WAIT_ON_BREAK');
    const breakInterval = () => {
      if (
        'pomodoroTimes' in config &&
        'break' in config.pomodoroTimes &&
        !Number.isNaN(parseFloat(config.pomodoroTimes.break)) &&
        Number.isFinite(config.pomodoroTimes.break)
      ) {
        return config.pomodoroTimes.break;
      }
      logger.nag.log(
        'error',
        'Improper configuration detected. Cannot find pomodoroTimes.break param. Using default: 5',
      );
      return DEFAULT_POMODORO_BREAK_TIME;
    };
    const lockScreenLoopTask = yield fork(lockScreenLoop);
    yield call(delay, breakInterval() * 60 * 1000);
    yield cancel(lockScreenLoopTask);

    logger.nag.log('info', 'Unlocking screen after elapse of break');
    // yield call(unlockScreen);
    //
    yield put(startWork());
  }
}

function* transitionToWork() {
  while (true) {
    yield take(TRANSITION_TO_WORK);
    logger.nag.log('info', 'Now in TRANSITION_TO_BREAK');
  }
}

function* stopPomodoroTasks(tasks) {
  yield take(STOP_POMODORO_CYCLE);
  logger.nag.log('info', 'Stopping pomodoro timing cycle');
  tasks.map(function* cancelTask(task) {
    yield cancel(task);
  });
}

export default function* startPomodoroCycle() {
  logger.nag.log('info', 'Starting pomodoro timing cycle');
  const waitOnWorkTask = yield fork(waitOnWork);
  const waitOnBreakTask = yield fork(waitOnBreak);
  const transitionToWorkTask = yield fork(transitionToWork);

  yield put(startWork());
  yield stopPomodoroTasks([waitOnWorkTask, waitOnBreakTask, transitionToWorkTask]);
}
