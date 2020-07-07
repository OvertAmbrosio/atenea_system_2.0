import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.colorize(),
    format.json(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message} - ${info.service}`)
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.File({ 
      maxsize: 5120000,
      maxFiles: 5,
      level: 'error',
      filename: `${__dirname}/../logs/error-log-api.log`
    }),
    new transports.File({
      maxsize: 5120000,
      maxFiles: 5,
      level: 'info',
      filename: `${__dirname}/../logs/info-log-api.log`
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
};

export default logger;

