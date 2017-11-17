/*
 * Sagas used in the screenlock app
 * Primarily, these are a series of (stateful) processes
 * that run as part of the screenlock application
 */
import path from 'path';
import url from 'url';

import { delay } from 'redux-saga';
import { call, cancel, fork, take, put, race } from 'redux-saga/effects';
import electron from 'electron';

import { HALT_SCREENLOCK, SCREENLOCK_WAIT_FOR_ACTIVITY } from '../controlCommands';
import logger from '../logger';

import { LAUNCH } from './constants';

import { startNagMessaging, startRendererMessaging } from './messaging';
import { registerMainWindow } from './actions';

/*
 * Creates a full screen window that is visible on all workspaces
 * @param boolean allowFocus   Specifies whether window should allow focus
 */
function createWindow() {
  let mainWindow;
  const promise = new Promise(resolve => {
    const scriptPath = path.resolve(process.argv[1]);
    const appDir = path.dirname(scriptPath);
    const htmlPath = path.join(appDir, 'index.html');

    logger.screenLock.info(`Using HTML at: ${htmlPath}`);
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    mainWindow = new electron.BrowserWindow({
      width,
      height,
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      alwaysOnTop: true,
      // fullscreen: true,
    });
    mainWindow.setVisibleOnAllWorkspaces(true);

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
      resolve('closed');
    });

    mainWindow.on('blur', () => {
      resolve('closed');
    });
  });
  return { mainWindow, promise };
}

function* showScreenLockWindow() {
  let windowHandle;
  logger.screenLock.info('Opening screenlock window');
  try {
    windowHandle = createWindow();
    yield put(registerMainWindow(windowHandle.mainWindow));
    const { readyToPromptForActivity } = yield race({
      readyToPromptForActivity: take(SCREENLOCK_WAIT_FOR_ACTIVITY),
      windowClosed: call(() => windowHandle.promise),
    });
    if (readyToPromptForActivity) {
      // The screenlock window spawned by default does not accept windowing
      // events to prevent it getting killed by the user.
      // This saga resets the window to start accepting windowing
      // events on receiving the so that it can be killed
      windowHandle.mainWindow.close();
      // Open a new window that is focusable
      windowHandle = createWindow();
      yield put(registerMainWindow(windowHandle.mainWindow));
      yield call(() => windowHandle.promise);
    }
    yield put({ type: HALT_SCREENLOCK });
    windowHandle.mainWindow = undefined;
  } catch (err) {
    logger.screenLock.error(`When handling window open/close: ${err}`);
  } finally {
    if (windowHandle.mainWindow) {
      windowHandle.mainWindow.close();
    }
  }
}

export default function* screenLockMainSaga() {
  logger.screenLock.info('Spawning screenlock sagas');
  yield take(LAUNCH);

  logger.screenLock.info('Spawning screenlock sagas');
  const nagMessaging = yield fork(startNagMessaging);
  const rendererMessaging = yield fork(startRendererMessaging);
  yield call(delay, 1000);
  const windowSpawner = yield fork(showScreenLockWindow);

  yield take(HALT_SCREENLOCK);

  if (windowSpawner) {
    yield cancel(windowSpawner);
  }
  if (nagMessaging) {
    yield cancel(nagMessaging);
  }
  if (rendererMessaging) {
    yield cancel(rendererMessaging);
  }

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
  process.exit(0);
}
