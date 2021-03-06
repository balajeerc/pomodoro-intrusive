/*
 * Action creators for various state changes in pomodoro-intrusive's nagProcess
 */

import {
  LAUNCH,
  SHUTDOWN,
  STOP_MESSAGING,
  STOP_POMODORO_CYCLE,
  START_LOCK_SCREEN_LOOP,
  STOP_LOCK_SCREEN_LOOP,
} from './constants';

import { WAIT_ON_WORK, WAIT_ON_BREAK, START_ACTIVITY_CHECK } from '../pomodoroStates';

export function launch() {
  return {
    type: LAUNCH,
  };
}

export function shutdown() {
  return {
    type: SHUTDOWN,
  };
}

export function stopMessaging() {
  return {
    type: STOP_MESSAGING,
  };
}

export function startPomodoroCycle() {
  return {
    type: STOP_POMODORO_CYCLE,
  };
}

export function startLockScreenLoop() {
  return {
    type: START_LOCK_SCREEN_LOOP,
  };
}

export function stopLockScreenLoop() {
  return {
    type: STOP_LOCK_SCREEN_LOOP,
  };
}

export function startWork() {
  return {
    type: WAIT_ON_WORK,
  };
}

export function startBreak() {
  return {
    type: WAIT_ON_BREAK,
  };
}

export function startActivityCheck(screenLockTask) {
  return {
    type: START_ACTIVITY_CHECK,
    screenLockTask,
  };
}
