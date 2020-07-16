import Head from 'next/head'

const Contact = () => (
  <div>
    <Head>
      <title key="title">Contact | OpenReview</title>
    </Head>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1"><h1>Contact Us</h1></div>
    </div>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <p>
          We are currently supporting several computer science conferences and
          workshops, and are open to hosting journals and conferences in any
          field; please contact us at
          {' '}
          <a href="mailto:info@openreview.net">info@openreview.net</a>
          {' '}
          for more information.
        </p>
        <p>
          If you would like to send feedback to the developers, please use the
          {' '}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" data-toggle="modal" data-target="#feedback-modal">Feedback form</a>
          .
        </p>
      </div>
    </div>
  </div>
)

Contact.bodyClass = 'contact'

export default Contact
