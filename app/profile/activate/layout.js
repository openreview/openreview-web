import CommonLayout from '../../CommonLayout'
import styles from './Activate.module.scss'

export default function layout({ children }) {
  return (
    <CommonLayout banner={null}>
      <div className={styles.activate}>
        <header>
          <h1>Complete Registration</h1>
          <h5>
            Enter your current institution and at least one web URL to complete your
            registration. All other fields are optional.
          </h5>
        </header>
        {children}
      </div>
    </CommonLayout>
  )
}
