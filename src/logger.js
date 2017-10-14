import winston from 'winston';

function createLogger(logFilePrefix) {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      // Write to all logs with level `info` and below to `combined.log`
      // Write all logs error (and below) to `error.log`.
      new winston.transports.File({ filename: `${logFilePrefix}/error.log`, level: 'error' }),
      new winston.transports.File({ filename: `${logFilePrefix}/combined.log` }),
    ],
  });

  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  if (process.env.NODE_ENV !== 'production') {
    logger.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    );
  }

  return logger;
}

const logger = {
  client: createLogger('/tmp/pomodoro-intrusive/client'),
  nag: createLogger('/tmp/pomodoro-intrusive/nag'),
};

export default logger;
