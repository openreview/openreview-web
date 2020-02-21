import Link from 'next/link'

// Page Styles
import '../styles/pages/login.less'

const LoginForm = () => (
  <form>
    <div className="form-group">
      <label htmlFor="email">Email</label>
      <input type="email" className="form-control" name="email" placeholder="Email" />
    </div>

    <div className="form-group">
      <label htmlFor="password">Password</label>
      <input type="password" className="form-control" name="password" placeholder="Password" />
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

const Login = () => (
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

Login.title = 'Login'

export default Login
