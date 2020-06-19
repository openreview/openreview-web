/* globals promptError: false */
/* globals promptMessage: false */

import { useState, useContext } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Router from 'next/router'
import UserContext from '../components/UserContext'
import api from '../lib/api-client'
import { auth } from '../lib/auth'

// Page Styles
import '../styles/pages/login.less'

const LoginForm = ({ redirect }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const { loginUser } = useContext(UserContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError(null)

    let apiRes
    try {
      apiRes = await api.post('/login', { id: email, password })
    } catch (error) {
      setLoginError(error)
      promptError(error.message)
      return
    }

    const { user, token } = apiRes
    loginUser(user, token, redirect)
  }

  const handleResendConfirmation = async (e) => {
    e.preventDefault()

    try {
      await api.post('/activatable', { id: email })
      promptMessage(`A confirmation email with the subject "OpenReview signup confirmation" has been sent to ${email}.
        Please click the link in this email to confirm your email address and complete registration.`, { noTimeout: true })
    } catch (error) {
      setLoginError(error)
      promptError(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email-input">Email</label>
        <input
          id="email-input"
          type="text"
          className={`form-control ${loginError ? 'form-invalid' : ''}`}
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password-input">Password</label>
        <input
          id="password-input"
          type="password"
          className={`form-control ${loginError ? 'form-invalid' : ''}`}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-login">
        Login to OpenReview
      </button>

      <p className="help-block">
        <Link href="/reset"><a>Forgot your password?</a></Link>
        <br />
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a href="#" onClick={handleResendConfirmation}>Didn&apos;t receive email confirmation?</a>
      </p>
    </form>
  )
}

const Login = ({ redirect }) => (
  <div className="row">
    <Head>
      <title key="title">Login | OpenReview</title>
    </Head>

    <div className="login-container col-sm-12 col-md-5 col-lg-4 col-md-offset-1 col-lg-offset-2">
      <h1>Login</h1>
      <LoginForm redirect={redirect} />
    </div>

    <div className="signup-container col-sm-12 col-md-5 col-lg-4">
      <h1>New User?</h1>
      <div>
        <Link href="/signup">
          <a className="btn">Sign Up</a>
        </Link>
      </div>
    </div>
  </div>
)

Login.getInitialProps = async (ctx) => {
  const { user } = auth(ctx)
  if (user) {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: '/' }).end()
    } else {
      Router.replace('/')
    }
  }

  return {
    redirect: ctx.query.redirect,
  }
}

Login.bodyClass = 'login'

export default Login
