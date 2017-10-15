/*
 * Saga controlling the Pomodoro timing cycle/state machine
 *
 * 1) Once started, it goes into WAIT_ON_WORK, waiting for work time to elapse
 *      then moves to TRANSITION_TO_BREAK state
 * 2) During TRANSITION_TO_BREAK, it locks the screen, then moves to WAIT_ON_BREAK
 * 3) In the WAIT_ON_BREAK state, it repeatedly calls screen lock at an interval
 *      thus intrusively preventing any work, then moves to TRANSITION_TO_WORK
 * 4) During TRANSITION_TO_WORK, it repeatedly checks for desktop activity.
 *      If no work activity is detected, it plays a sound alerting user to resume work.
 *      Once work activity is detected, it moves back to WAIT_ON_WORK state.
 *
 */
import { cancel, fork, take } from 'redux-saga/effects';

import {
  STOP_POMODORO_CYCLE,
  WAIT_ON_WORK,
  TRANSITION_TO_BREAK,
  WAIT_ON_BREAK,
  TRANSITION_TO_WORK,
} from './constants';
import logger from '../logger';

function* waitOnWork() {
  while (true) {
    yield take(WAIT_ON_WORK);
    logger.nag.log('info', 'Now in WAIT_ON_WORK');
  }
}

function* transitionToBreak() {
  while (true) {
    yield take(TRANSITION_TO_BREAK);
    logger.nag.log('info', 'Now in TRANSITION_TO_BREAK');
  }
}

function* waitOnBreak() {
  while (true) {
    yield take(WAIT_ON_BREAK);
    logger.nag.log('info', 'Now in WAIT_ON_BREAK');
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
  const transitionToBreakTask = yield fork(transitionToBreak);
  const waitOnBreakTask = yield fork(waitOnBreak);
  const transitionToWorkTask = yield fork(transitionToWork);

  yield stopPomodoroTasks([
    waitOnWorkTask,
    transitionToBreakTask,
    waitOnBreakTask,
    transitionToWorkTask,
  ]);
}
