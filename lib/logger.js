import logger, { emit } from 'fluent-logger'
import { headers } from 'next/headers'

if (process.env.SERVER_ENV === 'production' && false) {
  logger.configure('openreview.web')

  // eslint-disable-next-line no-console
  console.log = async (errorMessage, context) => {
    const requestHeaders = await headers()
    delete requestHeaders.headers.cookie
    const payload = {
      serviceContext: {
        service: 'openreview.web',
      },
      message: errorMessage,
      context,
      requestHeaders,
    }
    emit.bind(logger)(payload)
  }
}
