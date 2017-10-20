/*
 * Process spawned by pomodoro-intrusive
 *
 * Spawns a process with the following 3 states:
 * 1) When spawned, it starts a timer as specified in config.json
 * indicating the time for which the timer must wait in 'work' mode.
 *
 * 2) Once this time is exceeded, it will lock screen. It then starts
 * another timer for the 'break' duration in config.json
 * During this period, it will periodically call screenlock every
 * 15 secs to prevent user from unlocking screen and working.
 *
 * 3) After break wait is done, it will open screen, play a sound
 * denoting resumption of work and then start monitoring for mouse and
 * keyboard activity. When the machine is in use again, it starts the
 * pomodoro loop again.
 *
 * All communication between this process and the intrusive-pomodoro
 * client is using TCP socket
 */
import 'babel-polyfill';
import store from './stateStore';
import { launch } from './actions';

// Dispatch an action to the application state machine to start
// process state machine
store.dispatch(launch());
