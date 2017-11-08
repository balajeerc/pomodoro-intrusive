/*
 * Action creator functions for various actions internal to pomodoro-screenlock
 */
import { QUERY_POMODORO_NAG_STATUS, SCREENLOCK_DETECTED_ACTIVITY } from '../controlCommands';

import { LAUNCH, SHUTDOWN, REGISTER_MAIN_WINDOW } from './constants';

export function launch(command) {
  return {
    type: LAUNCH,
    command,
  };
}

export function registerMainWindow(mainWindow) {
  return {
    type: REGISTER_MAIN_WINDOW,
    mainWindow,
  };
}

export function createPomodoroStatusRequest() {
  return { type: QUERY_POMODORO_NAG_STATUS };
}

export function screenLockDetectedActivity() {
  return { type: SCREENLOCK_DETECTED_ACTIVITY };
}

export function shutdown() {
  return {
    type: SHUTDOWN,
  };
}
