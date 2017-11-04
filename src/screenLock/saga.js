/*
 * Sagas used in the screenlock app
 * Primarily, these are a series of (stateful) processes
 * that run as part of the screenlock application
 */
import path from 'path';
import url from 'url';

import { call, cancel, fork, take, put } from 'redux-saga/effects';
import electron from 'electron';

import { HALT_SCREENLOCK } from '../controlCommands';
import logger from '../logger';
import { connect, createSocketChannel, writeMessage } from '../tcpSocket';
import config from '../configLoader';

import { LAUNCH, REQUEST } from './constants';

function createWindow() {
  let mainWindow;
  const promise = new Promise(resolve => {
    const scriptPath = path.resolve(process.argv[1]);
    const appDir = path.dirname(scriptPath);
    const htmlPath = path.join(appDir, 'index.html');

    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    mainWindow = new electron.BrowserWindow({
      width,
      height,
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      alwaysOnTop: true,
      //    focusable: false,
      fullscreen: true,
    });

    // and load the index.html of the app.
    mainWindow.loadURL(
      url.format({
        pathname: htmlPath,
        protocol: 'file:',
        slashes: true,
      }),
    );

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.on('ready-to-show', () => {});

    mainWindow.on('close', () => {
      resolve();
    });
  });
  return { mainWindow, promise };
}

function* screenLockLoop() {
  let mainWindow;
  try {
    const windowHandle = createWindow();
    ({ mainWindow } = windowHandle.mainWindow);
    yield call(() => windowHandle.promise);
    mainWindow = undefined;
    yield put({ type: HALT_SCREENLOCK });
  } catch (err) {
    logger.screenLock.error(`When handling window open/close: ${err}`);
  } finally {
    if (mainWindow) {
      mainWindow.close();
    }
  }
}

function* messageSender(connection) {
  while (true) {
    try {
      const request = yield take(REQUEST);
      yield call(writeMessage, connection, JSON.stringify(request.message));
    } catch (err) {
      logger.screenLock.error(`When attempting to send request to pomodoro-nag: ${err}`);
    }
  }
}

/*
 * Saga on which this screenlock instance listens for updates from
 * and sends updates to pomodoro-nag process on
 */
function* messageListener() {
  let requestListener;
  try {
    const connection = yield call(connect, config.control.screenLock.port, '127.0.0.1', 3000);
    const messageChannel = yield call(createSocketChannel, connection);
    requestListener = yield fork(messageSender);
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
  } finally {
    yield cancel(requestListener);
  }
}

export default function* screenLockMainSaga() {
  yield take(LAUNCH);
  const windowSpawner = yield fork(screenLockLoop);
  const messaging = yield fork(messageListener);
  yield take(HALT_SCREENLOCK);
  yield cancel(windowSpawner);
  yield cancel(messaging);
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
  process.exit(0);
}
