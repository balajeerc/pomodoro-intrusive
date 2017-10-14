/*
 * Action creators for various state changes in pomodoro-intrusive's nagProcess
 */

import { LAUNCH, SHUTDOWN, STOP_MESSAGING } from './constants';

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
