import path from 'path';

import electron from 'electron';
import moment from 'moment';

import logger from '../logger';
import { RESPONSE } from '../controlCommands';
import { START_ACTIVITY_CHECK } from '../pomodoroStates';

import { createPomodoroStatusRequest, screenLockDetectedActivity } from './actions';
import { ELECTRON_IPC_CHANNEL } from './constants';

import notificationFile from '../../sounds/back_to_work_notification.wav';

logger.screenLock.info('Starting screenlock renderer');

let startTime;
let currentInterval;

// eslint-disable-next-line no-unused-vars
function onScreenActivity() {
  logger.screenLock.info('Detected key press');
  electron.ipcRenderer.send(ELECTRON_IPC_CHANNEL, JSON.stringify(screenLockDetectedActivity()));
}

// eslint-disable-next-line no-undef
document.onkeydown = onScreenActivity;

electron.ipcRenderer.send(ELECTRON_IPC_CHANNEL, JSON.stringify(createPomodoroStatusRequest()));

electron.ipcRenderer.on(ELECTRON_IPC_CHANNEL, (event, data) => {
  const command = JSON.parse(data);
  logger.screenLock.info(`Renderer recieved command: ${data}`);
  switch (command.type) {
    case RESPONSE: {
      const nagStatus = command;
      startTime = moment(nagStatus.response.since);
      currentInterval = nagStatus.response.interval;
      logger.screenLock.info(`State to match to: ${START_ACTIVITY_CHECK}`);
      logger.screenLock.info(`Current state: ${nagStatus.response.current}`);
      if (nagStatus.response.current === START_ACTIVITY_CHECK) {
        logger.screenLock.info('Recieved check activity command');
        // eslint-disable-next-line no-undef
        document.getElementById('main-caption').innerHTML = 'Press any key to unlock screen';
        // Start playing return to work notification sound
        setInterval(() => {
          // While we could just hardcode the path of the notification file as sounds/<filename>.wav
          // we need to use the ES6 import so that webpack packages the sound file into dist.
          // However, the path returned by the module system is dist/sounds/<filename>.wav
          // The following code is just to snip the leading 'dist/' from the path
          const soundNotificationFilePath = path.join(
            'sounds',
            path.posix.basename(notificationFile),
          );
          logger.screenLock.info(`Playing notification: ${soundNotificationFilePath}`);
          // eslint-disable-next-line no-undef
          const audio = new Audio(soundNotificationFilePath);
          audio.play();
        }, 5000);
      }
      break;
    }
    default:
      break;
  }
});

setInterval(() => {
  if (!startTime) {
    return;
  }

  const currentTime = moment();
  const timeToBreak = startTime.clone().add(currentInterval, 'minutes');

  const timeDiff = timeToBreak.diff(currentTime);
  const timePending = moment.duration({ ms: timeDiff > 0 ? timeDiff : 0 });

  const pad = num => `00${num}`.substr(-2, 2); // just padding with leading zeroes

  const hours = pad(timePending.hours());
  const minutes = pad(timePending.minutes());
  const seconds = pad(timePending.seconds());
  // eslint-disable-next-line no-undef
  document.getElementById('pending-time').innerHTML = `${hours}:${minutes}:${seconds}`;
}, 1000);
