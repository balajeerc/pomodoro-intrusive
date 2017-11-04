/*
 * Action creator functions for various actions internal to pomodoro-screenlock
 */

import { LAUNCH, SHUTDOWN } from './constants';

export function launch(command) {
  return {
    type: LAUNCH,
    command,
  };
}

export function shutdown() {
  return {
    type: SHUTDOWN,
  };
}
