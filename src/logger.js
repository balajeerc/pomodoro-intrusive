import bunyan from 'bunyan';
import fs from 'fs';

const LOG_DELIMITER = '--------------------------------------------';

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

const logger = {
  client: createLogger('pomodoro-intrusive', '/tmp/pomodoro-intrusive'),
  nag: createLogger('pomodoro-nag', '/tmp/pomodoro-nag'),
};

export default logger;
