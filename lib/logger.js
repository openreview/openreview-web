import { LoggingWinston } from '@google-cloud/logging-winston'
import { createLogger, format, transports } from 'winston'

const cloudLogging = new LoggingWinston({
  projectId: 'openreview.web',
  serviceContext: {
    service: 'openreview.web',
  },
})

const logger = createLogger({
  level: 'error',
  format: format.combine(format.timestamp(), format.json()),
  transports: process.env.SERVER_ENV === 'production' ? [cloudLogging] : [],
})

if (process.env.SERVER_ENV === 'production') {
  console.log = (message, context = {}) => {
    logger.error({ message, ...context })
  }
}
