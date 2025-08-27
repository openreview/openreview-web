'use client'

import Link from 'next/link'
import LoginForm from './LoginForm'
import styles from './Login.module.scss'

export default function Login() {
  return (
    <div className={styles.login}>
      <div className="row">
        <div className="login-container col-sm-6 col-md-5 col-lg-4 col-md-offset-1 col-lg-offset-2">
          <h1>Login</h1>
          <LoginForm />
        </div>

        <div className="signup-container col-sm-6 col-md-5 col-lg-4">
          <h1>New User?</h1>

          <div>
            <Link href="/signup" className="btn">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
