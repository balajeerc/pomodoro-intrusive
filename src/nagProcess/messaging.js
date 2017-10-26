/*
 * Saga that controls the messaging in the pomodoro-nag process
 *
 * Sets up to listen for on a TCP socket incoming control
 * commands from the client app (pomodoro-intrusive)
 */
import { call, take, put } from 'redux-saga/effects';

import logger from '../logger';
import config from '../configLoader';

import { RESPONSE } from '../controlCommands';
import { createServer, createListeningChannel, writeMessage } from '../tcpServer';

/*
 * Sets up message queue processing
 *
 * @param {generator} shutdownAction Saga to be invoked on receiving shutdown command
 */
export default function* startMessaging() {
  let messageChannel;
  try {
    logger.nag.info('Registering message listener for control events');
    const server = yield call(createServer, config.control.tcp.port);
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
    throw new Error(err);
  } finally {
    messageChannel.close();
    logger.nag.info('Deregistering message listeners');
  }
}
