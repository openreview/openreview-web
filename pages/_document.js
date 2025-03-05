import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class OpenReviewDocument extends Document {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Html lang="en">
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
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
