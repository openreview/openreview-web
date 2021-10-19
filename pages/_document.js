// eslint-disable-next-line object-curly-newline
import Document, { Html, Head, Main, NextScript } from 'next/document'
import GoogleAnalyticsScript from '../components/GoogleAnalyticsScript'

export default class OpenReviewDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="true" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Noto+Sans:400,400i,700,700i&display=swap&subset=latin-ext" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/css/bootstrap.min.css" />
          <link rel="icon" href="/favicon.ico" />

          <GoogleAnalyticsScript />
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
