/*
 * Saga that controls the messaging in the pomodoro-nag process
 *
 * Sets up to listen for on a TCP socket incoming control
 * commands from the client app (pomodoro-intrusive)
 */
import { call, take } from 'redux-saga/effects';

import logger from '../logger';
import config from '../configLoader';

import { createServer, createListeningChannel } from '../tcpServer';
import { SHUTDOWN_POMODORO_NAG } from '../controlCommands';

/*
 * Sets up message queue processing
 *
 * @param {generator} shutdownAction Saga to be invoked on receiving shutdown command
 */
export default function* startMessaging(shutdownAction) {
  let messageChannel;
  try {
    logger.nag.info('Registering message listener for control events');
    const server = yield call(createServer, config.control.tcp.port);
    messageChannel = yield call(createListeningChannel, server);

    while (true) {
      const incoming = yield take(messageChannel);
      logger.nag.info(`Recieved message: ${incoming.message}`);
      if (incoming.message === SHUTDOWN_POMODORO_NAG) {
        yield shutdownAction();
      }
    }
  } catch (err) {
    logger.nag.error('Error when attempting to open message queue');
  } finally {
    messageChannel.close();
    logger.nag.info('Deregistering message listeners');
  }
}
