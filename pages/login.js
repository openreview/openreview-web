/* globals promptError: false */

import { useState, useContext } from 'react'
import Link from 'next/link'
import Router from 'next/router'
import UserContext from '../components/UserContext'
import api from '../lib/api-client'
import { handleLogin, auth } from '../lib/auth'

// Page Styles
import '../styles/pages/login.less'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const { setLoggedInUser } = useContext(UserContext)

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
    setLoggedInUser(user, token)
    handleLogin(token)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/*
      {loginError && (
        <div className="alert alert-danger">
          <span>{loginError.message}</span>
        </div>
      )}
      */}
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          className="form-control"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
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
        <Link href="/forgot"><a>Forgot your password?</a></Link>
        <br />
        <a>Didn&apos;t receive email confirmation?</a>
      </p>
    </form>
  )
}

const Login = ({ redirect }) => (
  <div className="row">
    <div className="login-container col-sm-12 col-md-5 col-lg-4 col-md-offset-1 col-lg-offset-2">
      <h1>Login</h1>
      <LoginForm />
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
Login.title = 'Login'

export default Login
