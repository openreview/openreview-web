import Alert from '../../../components/Alert'
import Icon from '../../../components/Icon'

export default function LimitedStateAlert({ profile }) {
  if (profile?.state !== 'Limited') return null

  return (
    <Alert color="warning">
      <Icon name="info-sign" extraClasses="pr-2" />
      <span>
        Your profile status is currently Limited. Please enter your year of birth to activate
        your profile again.{' '}
        <a
          href="https://docs.openreview.net/getting-started/frequently-asked-questions/my-profile-is-limited-.-what-does-that-mean"
          target="_blank"
          rel="noreferrer"
        >
          Learn more &raquo;
        </a>
      </span>
    </Alert>
  )
}
