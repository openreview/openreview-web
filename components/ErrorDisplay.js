'use client'

/* global promptError:false */
import CommonLayout from '../app/CommonLayout'
import api from '../lib/api-client'

const ErrorDisplay = ({ statusCode, message, withLayout = true }) => {
  const handleLogout = async () => {
    try {
      await api.post('/logout')
      window.location.reload()
      window.localStorage.setItem('openreview.lastLogout', Date.now())
    } catch (error) {
      console.log('Error in ErrorDisplay', {
        component: 'ErrorDisplay',
        apiError: error,
        apiRequest: {
          endpoint: '/logout',
        },
      })
      promptError(error.message)
    }
  }

  if (withLayout === false) {
    return (
      <div className="row error-display">
        <header className="col-xs-12 col-md-10 col-md-offset-1 text-center">
          <h1>Error</h1>
          <hr />
        </header>

        <div className="col-xs-12 col-md-10 col-md-offset-1 text-center">
          <pre className="error-message">{message}</pre>
        </div>
      </div>
    )
  }

  return (
    <CommonLayout>
      <div className="row error-display">
        <header className="col-xs-12 col-md-10 col-md-offset-1 text-center">
          <h1>{`Error${statusCode ? ` ${statusCode}` : ''}`}</h1>
          <hr />
        </header>

        <div className="col-xs-12 col-md-10 col-md-offset-1 text-center">
          <h4>The server responded with the following message:</h4>
          <pre className="error-message">{message}</pre>
          {message === 'Token has expired, please log out and log in again.' && (
            <button type="button" className="btn" onClick={handleLogout}>
              Log out
            </button>
          )}
        </div>
      </div>
    </CommonLayout>
  )
}

export default ErrorDisplay
