import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Page Styles
import '../styles/pages/signup.less'

const SignupForm = () => {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [newUsername, setNewUsername] = useState('')

  useEffect(() => {
    if (firstName === '' || lastName === '') {
      setNewUsername('')
    } else {
      const middleNameWithSep = middleName ? `${middleName}_` : ''
      setNewUsername(`~${firstName}_${middleNameWithSep}${lastName}1`)
    }
  }, [firstName, middleName, lastName])

  return (
    <div className="signup-form-container">
      <form>
        <div className="row">
          <div className="form-group col-xs-12 col-sm-4 col-md-3">
            <label htmlFor="first-input">First</label>
            <input
              type="text"
              id="first-input"
              className="form-control"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
            <p className="help-block">required</p>
          </div>

          <div className="form-group col-xs-12 col-sm-4 col-md-3">
            <label htmlFor="middle-input">Middle</label>
            <input
              type="text"
              id="middle-input"
              className="form-control"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
            />
            <p className="help-block">optional</p>
          </div>

          <div className="form-group col-xs-12 col-sm-4 col-md-3">
            <label htmlFor="last-input">Last</label>
            <input
              type="text"
              id="last-input"
              className="form-control"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
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
        {newUsername && (
          <span className="new-username hint">{newUsername}</span>
        )}
      </form>
    </div>
  )
}

const SignUp = () => (
  <div>
    <Head>
      <title key="title">Sign Up | OpenReview</title>
    </Head>

    <h1>Sign Up</h1>
    <p className="hint">How do you usually write your name as author of a paper?</p>

    <SignupForm />
  </div>
)

SignUp.bodyClass = 'sign-up'

export default SignUp
