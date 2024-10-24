import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class OpenReviewDocument extends Document {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Html lang="en">
        <Head>
          <link
            rel="preload"
            href="https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5aDdu3mhPy1Fig.woff2"
            as="font"
            type="font/woff2"
            crossorigin
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=fallback"
            rel="stylesheet"
          />
          <script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            defer
          ></script>
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
