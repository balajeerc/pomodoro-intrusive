/*
 * Saga that controls the messaging in the pomodoro-nag process
 *
 * Sets up to listen for on a TCP socket incoming control
 * commands from the client app (pomodoro-intrusive)
 */

import moment from 'moment';
import { call, cancel, fork, take, put, select } from 'redux-saga/effects';

import logger from '../logger';
import config from '../configLoader';

import {
  HALT_SCREENLOCK,
  SCREENLOCK_WAIT_FOR_ACTIVITY,
  QUERY_POMODORO_NAG_STATUS,
  RESPONSE,
} from '../controlCommands';
import { WAIT_ON_WORK, WAIT_ON_BREAK } from '../pomodoroStates';
import { createServer, createListeningChannel, writeMessage } from '../tcpServer';

// Selector for pomodoro state
const getPomodoroMode = state => state.pomodoroMode;

/*
 * Query handler for status queries from clients
 */
export function* statusQueryHandler() {
  while (true) {
    logger.nag.info('Starting to listen for commands');
    yield take(QUERY_POMODORO_NAG_STATUS);
    logger.nag.info('Recieved query status request');
    const mode = yield select(getPomodoroMode);

    const timeStats = (() => {
      const startTime = moment(mode.since);
      const now = moment();
      const timeElapsed = now.diff(startTime, 'minutes');
      if (mode.current === WAIT_ON_WORK) {
        return {
          pending: config.pomodoro.pomodoroTimes.work - timeElapsed,
          interval: config.pomodoro.pomodoroTimes.work,
        };
      } else if (mode.current === WAIT_ON_BREAK) {
        return {
          pending: config.pomodoro.pomodoroTimes.break - timeElapsed,
          interval: config.pomodoro.pomodoroTimes.break,
        };
      }
      return Infinity;
    })();

    yield put({
      type: RESPONSE,
      response: Object.assign({}, mode, { since: mode.since.toISOString() }, timeStats),
    });
  }
}

/*
 * Starts a saga that relays a given commandType to the screenLock process
 */
export function* startScreenLockCommandRelay(server, commandType) {
  while (true) {
    const command = yield take(commandType);
    yield call(writeMessage, server, JSON.stringify(command));
  }
}

/*
 * Starts a TCP server on which nag process listens for incoming messages/requests
 * from screen lock processes.
 */
export function* startScreenLockMessaging() {
  let messageChannel;
  let commandRelays;
  try {
    logger.nag.info('Registering message listener for screen lock control');
    const server = yield call(createServer, config.control.screenLock.port);
    messageChannel = yield call(createListeningChannel, server);

    commandRelays = yield [
      fork(startScreenLockCommandRelay, server, HALT_SCREENLOCK),
      fork(startScreenLockCommandRelay, server, SCREENLOCK_WAIT_FOR_ACTIVITY),
      fork(startScreenLockCommandRelay, server, RESPONSE),
    ];

    while (true) {
      const incoming = yield take(messageChannel);
      logger.nag.info(`Recieved message: ${incoming.message}`);
      try {
        const remoteCommand = JSON.parse(incoming.message);
        logger.nag.info(
          `Recieved request from screenlocker process: ${JSON.stringify(incoming.message)}`,
        );
        if (typeof remoteCommand !== 'object' || !('type' in remoteCommand)) {
          throw new Error('Command must be a valid JSON object containing type');
        } else {
          yield put(remoteCommand);
        }
      } catch (commandParseError) {
        // Respond with a message back to caller saying that
        yield call(
          writeMessage,
          server,
          JSON.stringify({ error: `ERROR: When parsing command: ${commandParseError}` }),
          incoming.sender,
        );
      }
    }
  } catch (err) {
    logger.nag.error(`Error when attempting to open message queue: ${err}`);
    // throw new Error(err);
  } finally {
    yield cancel(commandRelays);
    messageChannel.close();
    logger.nag.info('Deregistering message listeners');
  }
}

/*
 * Sets up message queue processing
 *
 * @param {generator} shutdownAction Saga to be invoked on receiving shutdown command
 */
export default function* startMessaging() {
  let messageChannel;
  // Fork off the query handler saga
  const statusQuerySaga = yield fork(statusQueryHandler);
  const screenLockMessagingSaga = yield fork(startScreenLockMessaging);

  try {
    logger.nag.info('Registering message listener for control events');
    const server = yield call(createServer, config.control.command.port);
    messageChannel = yield call(createListeningChannel, server);

    while (true) {
      const incoming = yield take(messageChannel);
      logger.nag.info(`Recieved message: ${incoming.message}`);
      try {
        const remoteCommand = JSON.parse(incoming.message);
        logger.nag.info(`Recieved command: ${JSON.stringify(incoming.message)}`);
        if (typeof remoteCommand !== 'object' || !('type' in remoteCommand)) {
          throw new Error('Command must be a valid JSON object containing type');
        } else {
          yield put(remoteCommand);
          const response = yield take(RESPONSE);
          yield call(writeMessage, server, JSON.stringify(response), incoming.sender);
        }
      } catch (commandParseError) {
        // Respond with a message back to caller saying that
        yield call(
          writeMessage,
          server,
          JSON.stringify({ error: `ERROR: When parsing command: ${commandParseError}` }),
          incoming.sender,
        );
      }
    }
  } catch (err) {
    logger.nag.error(`Error when attempting to open message queue: ${err}`);
    // throw new Error(err);
  } finally {
    yield cancel(screenLockMessagingSaga);
    yield cancel(statusQuerySaga);
    messageChannel.close();
    logger.nag.info('Deregistering message listeners');
  }
}
