/*
 * Action creators for various state changes in pomodoro-intrusive's nagProcess
 */

import { LAUNCH, SHUTDOWN } from './constants';

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
