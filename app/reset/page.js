'use client'

import Link from 'next/link'
import Reset from './Reset'
import styles from './Reset.module.scss'

export default function Page() {
  return (
    <div className={styles.reset}>
      <div className="reset-container col-sm-12 col-md-8 col-lg-6 col-md-offset-2 col-lg-offset-3">
        <h1>Request Password Reset</h1>
        <Reset />
        <p className="help-block">
          <Link href="/login">Back to Login</Link>
          <br />
          <Link href="/signup">Sign Up for OpenReview</Link>
        </p>
      </div>
    </div>
  )
}
