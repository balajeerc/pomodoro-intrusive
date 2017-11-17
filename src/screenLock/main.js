import 'babel-polyfill';
import electron from 'electron';

import store from './stateStore';
import { launch } from './actions';

import logger from '../logger';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on('ready', () => {
  // Dispatch an action to the application state machine to start
  // process state machine
  logger.screenLock.info('Starting screenlock main process');
  store.dispatch(launch());
});

electron.app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});
