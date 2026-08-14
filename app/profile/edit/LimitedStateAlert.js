import { InfoCircleFilled } from '@ant-design/icons'
import { Alert } from 'antd'

export default function LimitedStateAlert({ profile }) {
  if (profile?.state !== 'Limited') return null

  return (
    <Alert
      type="warning"
      icon={<InfoCircleFilled />}
      showIcon
      title={
        <>
          <span>
            Your profile status is currently Limited. Please enter your year of birth to
            activate your profile again.
          </span>{' '}
          <a
            href="https://docs.openreview.net/getting-started/frequently-asked-questions/my-profile-is-limited-.-what-does-that-mean"
            target="_blank"
            rel="noreferrer"
          >
            Learn more &raquo;
          </a>
        </>
      }
    />
  )
}
