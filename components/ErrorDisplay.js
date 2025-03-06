'use client'

/* global promptError:false */
import { useRouter } from 'next/navigation'
import CommonLayout from '../app/CommonLayout'
import api from '../lib/api-client'

const ErrorDisplay = ({ statusCode, message }) => {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.post('/logout')
      router.replace('/')
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
