import electron from 'electron';
import moment from 'moment';

import { createPomodoroStatusRequest } from './actions';
import { ELECTRON_IPC_CHANNEL } from './constants';

let startTime;
let currentInterval;

electron.ipcRenderer.send(ELECTRON_IPC_CHANNEL, JSON.stringify(createPomodoroStatusRequest()));
setInterval(() => {
  if (!startTime) {
    return;
  }

  const currentTime = moment();
  const timeToBreak = startTime.clone().add(currentInterval, 'minutes');

  process.stdout.write('\n');
  const timeDiff = timeToBreak.diff(currentTime);
  const timePending = moment.duration({ ms: timeDiff });

  const pad = num => `00${num}`.substr(-2, 2); // just padding with leading zeroes

  // eslint-disable-next-line no-undef
  document.getElementById('pending-time').innerHTML = `${pad(timePending.hours())}:${pad(
    timePending.minutes(),
  )}:${pad(timePending.seconds())}`;
}, 1000);

electron.ipcRenderer.on(ELECTRON_IPC_CHANNEL, (event, data) => {
  const nagStatus = JSON.parse(data);
  startTime = moment(nagStatus.response.since);
  currentInterval = nagStatus.response.interval;
});
