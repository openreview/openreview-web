import Head from 'next/head'
import Link from 'next/link'

// Page Styles
import '../styles/pages/signup.less'

const SignupForm = () => (
  <div className="signup-form-container">
    <form>
      <div className="row">
        <div className="form-group col-xs-12 col-sm-4 col-md-3">
          <label htmlFor="first-input">First</label>
          <input type="text" id="first-input" className="form-control" name="first" />
          <p className="help-block">required</p>
        </div>

        <div className="form-group col-xs-12 col-sm-4 col-md-3">
          <label htmlFor="middle-input">Middle</label>
          <input type="text" id="middle-input" className="form-control" name="middle" />
          <p className="help-block">optional</p>
        </div>

        <div className="form-group col-xs-12 col-sm-4 col-md-3">
          <label htmlFor="last-input">Last</label>
          <input type="text" id="last-input" className="form-control" name="last" />
          <p className="help-block">required</p>
        </div>
      </div>
    </form>

    <hr className="spacer" />

    <form className="form-inline">
      <input type="email" className="form-control" name="email" placeholder="Your email address" />
      <button type="button" className="btn btn-signup">
        Sign Up
      </button>
    </form>
  </div>
)

const SignUp = ({ query }) => (
  <div>
    <Head>
      <title key="title">Sign Up | OpenReview</title>
    </Head>

    <h1>Sign Up</h1>
    <p className="hint">How do you usually write your name as author of a paper?</p>

    <SignupForm />
  </div>
)

SignUp.getInitialProps = async ctx => ({ query: ctx.query })

SignUp.bodyClass = 'sign-up'

export default SignUp
