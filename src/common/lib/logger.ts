import { Singleton } from "typescript-ioc"
import winston from "winston"

@Singleton
export default class AppLogger {
  logger

  constructor() {
    const options: winston.LoggerOptions = {
      level: "info",
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
        new winston.transports.Console({ format: winston.format.simple() }),
      ],
    }

    this.logger = winston.createLogger(options)
  }

  debug(log: string, metadata?: object) {
    this.logger.debug(log, metadata)
  }

  info(log: string, metadata?: object) {
    this.logger.info(log, metadata)
  }

  warn(log: string, metadata?: object) {
    this.logger.warn(log, metadata)
  }

  error(log: string, metadata?: object) {
    this.logger.error(log, metadata)
  }

  log(level: string, log: string, metadata?: object) {
    const metadataObject: any = {}
    if (metadata) metadataObject.metadata = metadata

    // @ts-ignore
    this.logger[level](log, metadataObject)
  }
}
