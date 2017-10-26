/*
 * Sagas controlling effects in pomodoro nagger
 *
 * Basically the nerve centre of the nagger app, coordinating
 * incoming messages and corresponding state changes
 */

import { exec, spawn } from 'child_process';

import { delay } from 'redux-saga';
import { call, take, cps, race } from 'redux-saga/effects';

import config from '../configLoader';

import { LAUNCH } from './constants';
import { connect, createSocketChannel, writeMessage } from './tcpSocket';
import logger from '../logger';

import { SPAWN_POMODORO_NAG, SHUTDOWN_POMODORO_NAG } from '../controlCommands';

/*
 * Wraps string constant in an object with type param
 * making it a valid Flux standard type
 */
function createCommand(commandType) {
  return {
    type: commandType,
  };
}

function childProcessCall(func, args) {
  const child = func.call(undefined, ...args);
  return new Promise((resolve, reject) => {
    let output = '';
    let error = '';
    function onDone() {
      if (error.length > 0) {
        reject(new Error(error));
        return;
      }
      resolve(output);
    }
    child.stdout.on('data', data => {
      output += data;
    });
    child.stderr.on('data', data => {
      error += data;
    });
    child.addListener('error', reject);
    child.addListener('exit', onDone);
  });
}

/*
 * Sends a command to pomodoro nag and waits till timeout
 * for a response.
 * Returns a status object of form { status: boolean, response: string, error: errorIfAny }
 */
function* request(commandType) {
  try {
    const command = createCommand(commandType);
    const connection = yield call(connect, config.control.tcp.port, '127.0.0.1', 3000);
    const messageChannel = yield call(createSocketChannel, connection);
    yield call(writeMessage, connection, JSON.stringify(command));
    const response = yield take(messageChannel);
    const dataRecieved = response.message;
    const parsedResponse = JSON.parse(dataRecieved);
    if ('error' in parsedResponse) {
      throw new Error(dataRecieved);
    }
    return { status: true, response };
  } catch (error) {
    return { status: false, response: '', error };
  }
}

/*
 * Prints response to stdout and stderr as appropriate
 */
function outputResponseToConsole(response) {
  if ('error' in response) {
    console.error(response.error); // eslint-disable-line no-console
  } else {
    console.log(response.response); // eslint-disable-line no-console
  }
}

/*
 * Checks in a timed loop for a specified time
 * as to whether the pomodoro nag process has been spawned.
 * Returns true if pomodoro-nag process exists in process table, false otherwise
 */
function* isPomodoroNagRunning() {
  try {
    const psContents = yield call(childProcessCall, exec, [
      'ps -eff | grep -v grep | grep pomodoro-nag',
    ]);
    if (psContents && psContents.length > 0) {
      return true;
    }
  } catch (error) {
    logger.client.error(`Error when checking for pomodoro in process table: ${error}`);
    process.exit(1);
  }
  return false;
}

/*
 * Waits for commands to spawn nag processes
 */
function* spawnPomodoroNag() {
  // do the spawning
  const nagModulePath = 'dist/pomodoro-nag.js';
  logger.client.info(`Spawning pomodoro nag process: ${nagModulePath}`);
  yield childProcessCall(spawn, ['node', [nagModulePath], { detached: true }]);
  // TODO: Figure out why removing the delay added below causes the child process to end
  // Does the parent process exiting too soon after spawning child end up closing child also?
  yield delay(1000);
  const hasChildSpawned = yield call(isPomodoroNagRunning);
  if (!hasChildSpawned) {
    console.error('Unable to spawn pomodoro nag process'); // eslint-disable-line no-console
  } else {
    logger.client.info('Successfully spawned pomodoro nag process');
  }
}

function* processCommand(command) {
  const isNagRunning = yield call(isPomodoroNagRunning);
  if (!isNagRunning) {
    outputResponseToConsole({ error: 'No Pomodoro process running' });
    return;
  }

  // eslint-disable-next-line no-unused-vars
  const { response, _ } = yield race({
    response: call(request, command),
    timeout: call(delay, 2000),
  });

  if (response) {
    outputResponseToConsole(response);
  } else {
    outputResponseToConsole({
      error:
        'Command sent to Pomodoro but timed out waiting for response. Pomodoro process unresponsive',
    });
  }
}

function* forceShutdownNagProcess() {
  yield delay(2000);
  const isNagRunning = yield call(isPomodoroNagRunning);
  if (!isNagRunning) {
    return;
  }
  try {
    yield cps(
      exec,
      "ps -eff | grep -v grep | grep pomodoro-nag | awk '{print $2}' | xargs kill -9 > /dev/null 2>&1",
    );
  } catch (_) {
    console.error('No existing pomodoro nag process running.'); // eslint-disable-line no-console
  }
}

/*
 * Root saga for pomodoro client
 */
function* launch() {
  const commandAction = yield take(LAUNCH);
  const { command } = commandAction;
  if (command === SPAWN_POMODORO_NAG) {
    yield call(spawnPomodoroNag);
  } else {
    yield call(processCommand, command);
    if (command === SHUTDOWN_POMODORO_NAG) {
      yield call(forceShutdownNagProcess);
    }
  }

  process.exit(0);
}

export default launch;
