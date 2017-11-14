import { eventChannel } from 'redux-saga';
import { call, cancel, fork, take, put, select } from 'redux-saga/effects';
import electron from 'electron';

import {
  RESPONSE,
  QUERY_POMODORO_NAG_STATUS,
  SCREENLOCK_DETECTED_ACTIVITY,
} from '../controlCommands';
import logger from '../logger';
import { connect, createSocketChannel, writeMessage } from '../tcpSocket';
import config from '../configLoader';

import { ELECTRON_IPC_CHANNEL } from './constants';

/*
 * Saga that relays commands/requests to pomodoro-nag
 */
export function* messageSender(connection, commandType) {
  logger.screenLock.info('Listening for requests to send to nag process process');
  while (true) {
    try {
      // TODO: Schema validate incoming requests
      const request = yield take(commandType);
      const requestStr = JSON.stringify(request);
      logger.screenLock.info(`Sending to nag process: ${requestStr}`);
      yield call(writeMessage, connection, requestStr);
    } catch (err) {
      logger.screenLock.error(`When attempting to send request to pomodoro-nag: ${err}`);
    }
  }
}

/*
 * Saga on which screenlock instance listens for incoming updates/responses from pomodoro-nag
 */
export function* startNagMessaging() {
  let requestListener;
  try {
    const connection = yield call(connect, config.control.screenLock.port, '127.0.0.1', 3000);
    const messageChannel = yield call(createSocketChannel, connection);

    // requestListener = yield [
    //  fork(messageSender, connection, QUERY_POMODORO_NAG_STATUS),
    //  fork(messageSender, connection, SCREENLOCK_DETECTED_ACTIVITY),
    // ];

    while (true) {
      try {
        const response = yield take(messageChannel);
        const dataRecieved = response.message;
        const parsedResponse = JSON.parse(dataRecieved);
        if ('error' in parsedResponse) {
          throw new Error(dataRecieved);
        }
        yield put(parsedResponse);
      } catch (messageError) {
        logger.screenLock.error(`When parsing message from pomodoro-nag: ${messageError}`);
      }
    }
  } catch (error) {
    logger.screenLock.error(`When initiating messaging with pomodoro-nag: ${error}`);
    // This is a fatal error, stop the screenlock
    process.exit(1);
  } finally {
    if (requestListener) {
      yield cancel(requestListener);
    }
  }
}

function createElectronIPCChannel() {
  return eventChannel(emit => {
    function onChannelData(event, data) {
      emit(data.toString());
    }

    electron.ipcMain.on(ELECTRON_IPC_CHANNEL, onChannelData);

    // the subscriber must return an unsubscribe function
    // this will be invoked when the saga calls `channel.close` method
    const unsubscribe = () => {
      electron.ipcMain.removeListener(ELECTRON_IPC_CHANNEL, onChannelData);
    };

    return unsubscribe;
  });
}

/*
 * Selector to return mainWindow from state
 */
const getMainWindow = state => state.mainWindow;

/*
 * Starts a saga that repeatedly relays commands/actions to renderer process
 */
function* startCommandRelay(commandType) {
  while (true) {
    const command = yield take(commandType);
    const mainWindow = yield select(getMainWindow);
    const commandStr = JSON.stringify(command);
    logger.screenLock.info(`Relaying command: ${commandStr} to renderer`);
    mainWindow.webContents.send(ELECTRON_IPC_CHANNEL, commandStr);
    // Some commands, such as HALT_SCREENLOCK need to be handled internally
    // by the renderer process. So relay it as an action.
    yield put(command);
  }
}

/*
 * Saga on which screenLock main process listens for incoming requests from renderer process
 */
export function* startRendererMessaging() {
  // Create a saga for each of the commands we need to relay
  // to the renderer process
  const commandRelays = yield [fork(startCommandRelay, RESPONSE)];
  try {
    const ipcMessageChannel = yield call(createElectronIPCChannel);
    while (true) {
      try {
        const incoming = yield take(ipcMessageChannel);
        const incomindParsed = JSON.parse(incoming);
        logger.screenLock.info(`Recieved from renderer: ${incoming}`);
        yield put(incomindParsed);
      } catch (messagingError) {
        logger.screenLock.error(
          `Error when handling message from renderer process: ${messagingError}`,
        );
      }
    }
  } catch (err) {
    logger.screenLock.error(`Error when setting up IPC messaging channel with renderer: ${err}`);
    // This is a fatal error, terminate screenlock
    process.exit(1);
  } finally {
    if (commandRelays) {
      yield cancel(commandRelays);
    }
  }
}
