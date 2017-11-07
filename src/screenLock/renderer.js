import electron from 'electron';

import { createPomodoroStatusRequest } from './actions';
import { ELECTRON_IPC_CHANNEL } from './constants';

electron.ipcRenderer.send(ELECTRON_IPC_CHANNEL, JSON.stringify(createPomodoroStatusRequest()));

electron.ipcRenderer.on(ELECTRON_IPC_CHANNEL, (event, data) => {
  process.stdout.write(JSON.stringify(data));
});
