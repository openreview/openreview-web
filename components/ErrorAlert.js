import Alert from './Alert'
import Icon from './Icon'

function ErrorAlert({ error }) {
  const errorMessage = error.message

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
