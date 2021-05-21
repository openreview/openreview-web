import Head from 'next/head'

export default function Donate() {
  return (
    <div>
      <Head>
        <title key="title">Donate | OpenReview</title>
      </Head>

      <div className="row">
        <div className="col-xs-12 col-md-8 col-md-offset-2 text-center">
          <h1>Donate to OpenReview</h1>
          <p>All donations go directly to the continued maintenance of the platform.</p>

          <div>
            <iframe
              title="Donate to OpenReview"
              allowpaymentrequest=""
              frameBorder="0"
              height="900px"
              name="donorbox"
              scrolling="no"
              seamless="seamless"
              src="https://donorbox.org/embed/openreview?default_interval=m"
              style={{ maxWidth: '425px', height: '500px', marginTop: '2rem' }}
              width="100%"
            />
            <p className="hint">
              Code for Science and Society is a registered US 501(c)(3) nonprofit.
              <br />
              Donations are tax deductible to the extent allowed by law in US. Tax
              ID 81-3791683.
            </p>
          </div>
        </div>
      </div>

      <script src="https://donorbox.org/widget.js" paypalExpress="true" />
    </div>
  )
}

Donate.bodyClass = 'donate'
