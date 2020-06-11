/* globals promptError: false */

import { useState, useContext } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Router from 'next/router'
import UserContext from '../components/UserContext'
import api from '../lib/api-client'
import { auth } from '../lib/auth'

// Page Styles
import '../styles/pages/login.less'

const LoginForm = ({ redirectPath }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const { loginUser } = useContext(UserContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError(null)

    try {
      const { user, token } = await api.post('/login', { id: email, password })
      loginUser(user, token, redirectPath)
    } catch (error) {
      setLoginError(error)
      promptError(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {loginError && (
        <div className="alert alert-danger">
          <span>{loginError.message}</span>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="email-input">Email</label>
        <input
          id="email-input"
          type="text"
          className="form-control"
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
          className="form-control"
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

      <LoginForm redirectPath={redirect} />
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

Login.getInitialProps = (ctx) => {
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
