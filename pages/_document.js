import Document, { Head, Main, NextScript } from 'next/document'
import GoogleAnalyticsScript from '../components/GoogleAnalyticsScript'

class OpenReviewDocument extends Document {
  render() {
    return (
      <html lang="en">
        <Head>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Noto+Sans:400,400i,700,700i" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
          <GoogleAnalyticsScript />
        </body>
      </html>
    )
  }
}

export default OpenReviewDocument
