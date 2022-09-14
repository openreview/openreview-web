import Alert from '../Alert'
import Icon from '../Icon'

const LimitedStateAlert = () => (
  <Alert color="warning">
    <span>
      Your profile status is currently limited, please enter your year of birth to activate
      your profile again.
    </span>
    <a
      href="https://docs.openreview.net/getting-started/frequently-asked-questions/my-profile-is-limited-.-what-does-that-mean"
      target="_blank"
      rel="noreferrer"
    >
      {' '}
      <Icon name="info-sign" extraClasses="limited-state-info" />
    </a>
  </Alert>
)

export default LimitedStateAlert
