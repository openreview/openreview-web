import Alert from './Alert'
import Icon from './Icon'
import { translateErrorDetails } from '../lib/utils'

function ErrorAlert({ error }) {
  return (
    <Alert color="danger">
      <Icon name="exclamation-sign" />
      {' '}
      <strong>Error:</strong>
      {' '}
      {error.message}
    </Alert>
  )
}

export default ErrorAlert
