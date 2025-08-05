import { LoggingWinston } from '@google-cloud/logging-winston'
import { createLogger, format } from 'winston'

const cloudLogging = new LoggingWinston({
  projectId: process.env.CLOUD_PROJECT_ID,
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
