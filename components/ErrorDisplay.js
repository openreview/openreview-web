import Head from 'next/head'
import Link from 'next/link'

const ErrorDisplay = ({ statusCode, message }) => (
  <div className="row error-display">
    <Head>
      <title key="title">Error | OpenReview</title>
    </Head>

    <header className="col-xs-12 col-md-10 col-md-offset-1 text-center">
      <h1>{`Error ${statusCode}`}</h1>
      <hr />
    </header>

    <div className="col-xs-12 col-md-10 col-md-offset-1 text-center">
      <h4>The server responded with the following message:</h4>
      <pre className="error-message">{message}</pre>

      {statusCode === 403 && (
        <>
          <p className="error-help">
            <strong>
              Important: If this URL was sent to you in an email, then in order to access this
              page the same email address must be added to your OpenReview profile and
              confirmed.
            </strong>
          </p>
          <p className="error-help">
            To add a new email to your profile, navigate to the{' '}
            <Link href="/profile/edit">Edit Profile page</Link>, click the + icon at the bottom
            of the Emails section and enter the new email address. Then, click the Confirm
            button, check your email for the confirmation message from OpenReview, and finally
            click the link to complete the confirmation.
          </p>
        </>
      )}

      <p>
        If you&apos;d like to report this error to the developers, please{' '}
        <Link href="/contact">contact us</Link>.
      </p>
    </div>
  </div>
)

export default ErrorDisplay
