import Alert from './Alert'
import Icon from './Icon'
import { translateErrorDetails } from '../lib/utils'

function ErrorAlert({ error }) {
  const errorMessage = error.details ? translateErrorDetails(error.details) : error.message

  return (
    <Alert color="danger">
      <Icon name="exclamation-sign" />
      {' '}
      <strong>Error:</strong>
      {' '}
      {errorMessage}
    </Alert>
  )
}

export default ErrorAlert
