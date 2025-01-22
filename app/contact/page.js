import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Contact | OpenReview',
}

export default function page() {
  return (
    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <h1>Contact Us</h1>
        <p className="mt-3">
          OpenReview currently supports numerous computer science conferences and workshops,
          and we are open to hosting journals and conferences in any field; please fill out the{' '}
          <Link href="/group?id=OpenReview.net/Support">venue request form</Link> to get
          started.
        </p>
        <p>
          If you would like to report a bug or suggest features to the developers please use
          the OpenReview documentation repository on GitHub:
          <br />
          <a
            href="https://github.com/openreview/openreview/issues/new/choose"
            target="_blank"
            rel="noreferrer"
          >
            Report an issue
          </a>
          .
        </p>
        <p>
          For other queries you can contact OpenReview support at{' '}
          <a href="mailto:info@openreview.net">info@openreview.net</a>.
        </p>
      </div>
    </div>
  )
}
