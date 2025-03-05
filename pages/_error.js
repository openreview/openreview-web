/* eslint-disable prefer-destructuring */

import ErrorDisplay from '../components/ErrorDisplay'

const Error = ({ statusCode, message }) => (
  <ErrorDisplay statusCode={statusCode} message={message} />
)

Error.getInitialProps = ({ res, err }) => {
  const errorMessageMap = {
    403: 'Access denied',
    404: 'Page not found',
    500: 'Internal server error',
  }

  let statusCode = 404
  if (res) {
    statusCode = res.statusCode
  } else if (err) {
    statusCode = err.statusCode
  }

  return { statusCode, message: errorMessageMap[statusCode] }
}

export default Error
