/*
 * Sagas used in the screenlock app
 * Primarily, these are a series of (stateful) processes
 * that run as part of the screenlock application
 */
import path from 'path';
import url from 'url';

import { delay } from 'redux-saga';
import { call, cancel, fork, take, put } from 'redux-saga/effects';
import electron from 'electron';

import { HALT_SCREENLOCK } from '../controlCommands';
import logger from '../logger';

import { LAUNCH } from './constants';

import { startNagMessaging, startRendererMessaging } from './messaging';
import { registerMainWindow } from './actions';

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

function* showScreenLockWindow() {
  let windowHandle;
  try {
    windowHandle = createWindow();
    yield put(registerMainWindow(windowHandle.mainWindow));
    yield call(() => windowHandle.promise);
    windowHandle.mainWindow = undefined;
    yield put({ type: HALT_SCREENLOCK });
  } catch (err) {
    logger.screenLock.error(`When handling window open/close: ${err}`);
  } finally {
    if (windowHandle.mainWindow) {
      windowHandle.mainWindow.close();
    }
  }
}

export default function* screenLockMainSaga() {
  yield take(LAUNCH);

  const nagMessaging = yield fork(startNagMessaging);
  const rendererMessaging = yield fork(startRendererMessaging);
  yield call(delay, 1000);
  const windowSpawner = yield fork(showScreenLockWindow);

  yield take(HALT_SCREENLOCK);

  yield cancel(windowSpawner);
  yield cancel(nagMessaging);
  yield cancel(rendererMessaging);

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
  process.exit(0);
}
