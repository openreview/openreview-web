import Document, { Head, Main, NextScript } from 'next/document'
import GoogleAnalyticsScript from '../components/GoogleAnalyticsScript'

class OpenReviewDocument extends Document {
  render() {
    return (
      <html lang="en">
        <Head>
          <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="true" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Noto+Sans:400,400i,700,700i&display=swap&subset=latin-ext" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <body>
          <Main />
          <NextScript />
          <GoogleAnalyticsScript />

          {/* This script tag is necessary to prevent a flash of unstyled content */}
          <script> </script>
        </body>
      </html>
    )
  }
}

export default OpenReviewDocument
