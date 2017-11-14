import path from 'path';
import os from 'os';

import bunyan from 'bunyan';
import fs from 'fs';

const LOG_DELIMITER = '\n--------------------------------------------\n';

function createLogger(appName, logFilePrefix) {
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  const debugStream = (() => {
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          level: 'info',
          stream: process.stdout, // log INFO and above to stdout
        },
      ];
    }
    return [];
  })();

  if (!fs.existsSync(logFilePrefix)) {
    fs.mkdirSync(logFilePrefix);
  }

  fs.writeFileSync(`${logFilePrefix}/error.log`, LOG_DELIMITER, { flag: 'a' });
  fs.writeFileSync(`${logFilePrefix}/combined.log`, LOG_DELIMITER, { flag: 'a' });

  const logger = bunyan.createLogger({
    name: appName,
    streams: [
      ...debugStream,
      {
        level: 'error',
        path: `${logFilePrefix}/error.log`, // log ERROR and above to a file
      },
      {
        level: 'info',
        path: `${logFilePrefix}/combined.log`, // log INFO and above to a file
      },
    ],
  });

  return logger;
}

const pomodoroTmpDir = path.join(os.tmpdir(), 'pomodoro-intrusive');

if (!fs.existsSync(pomodoroTmpDir)) {
  fs.mkdirSync(pomodoroTmpDir);
}

const logger = {
  client: createLogger('pomodoro-intrusive', path.join(pomodoroTmpDir, 'client')),
  nag: createLogger('pomodoro-nag', path.join(pomodoroTmpDir, 'nag')),
  screenLock: createLogger('pomodoro-screenLock', path.join(pomodoroTmpDir, 'screenlock')),
};

export default logger;
