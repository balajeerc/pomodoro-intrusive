import { call, take } from 'redux-saga/effects';

import logger from '../logger';
import config from '../../config.json';

import { createMessageQueue, createMessageChannel } from '../messageQueue';
import { SHUTDOWN_POMODORO_NAG } from '../controlCommands';

export default function* startMessaging(shutdownAction) {
  let messageChannel;
  try {
    logger.nag.log('info', 'Registering message listener for control events');
    const messageQueue = yield call(createMessageQueue, config.messageQueue.id);
    messageChannel = yield call(createMessageChannel, messageQueue);

    while (true) {
      const message = yield take(messageChannel);
      logger.nag.log('info', `Recieved message: ${message}`);
      if (message === SHUTDOWN_POMODORO_NAG) {
        yield shutdownAction();
      }
    }
  } catch (err) {
    logger.nag.log('error', 'Error when attempting to open message queue');
  } finally {
    messageChannel.close();
    logger.nag.log('info', 'Deregistering message listeners');
  }
}
