/*
 * Action creator functions for various actions internal to pomodoro-intrusive client
 */

import { LAUNCH, SPAWN_POMODORO_NAG, SHUTDOWN } from './constants';

export function launch() {
  return {
    type: LAUNCH,
  };
}

export function spawnPomodoroNag() {
  return {
    type: SPAWN_POMODORO_NAG,
  };
}

export function shutdown() {
  return {
    type: SHUTDOWN,
  };
}
