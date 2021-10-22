// eslint-disable-next-line object-curly-newline
import Document, { Html, Head, Main, NextScript } from 'next/document'
import GoogleAnalyticsScript from '../components/GoogleAnalyticsScript'

export default class OpenReviewDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/css/bootstrap.min.css" rel="stylesheet" />
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
