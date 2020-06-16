import Head from 'next/head'

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
              page you must first add that same email address to your OpenReview profile.
            </strong>
          </p>
          <p className="error-help">
            To add a new email to your profile, navigate to the
            {' '}
            <a href="/profile/edit">Edit Profile page</a>
            , click the + icon at the bottom of the Emails section and enter the new email
            address. Then, click the Save Profile Changes button at the bottom of the page.
          </p>
        </>
      )}

      <p>
        If you&apos;d like to report this error to the developers, please use the
        {' '}
        <a href="/contact" data-toggle="modal" data-target="#feedback-modal">Feedback form</a>
        .
      </p>
    </div>
  </div>
)

export default ErrorDisplay
