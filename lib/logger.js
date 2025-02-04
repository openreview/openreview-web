import logger, { emit } from 'fluent-logger'

if (process.env.SERVER_ENV === 'development') {
  logger.configure('openreview.web')

  // eslint-disable-next-line no-console
  console.log = (errorMessage, context) => {
    const payload = {
      serviceContext: {
        service: 'openreview.web',
      },
      message: errorMessage,
      context,
    }
    emit.bind(logger)(payload)
  }
}
