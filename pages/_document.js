import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class OpenReviewDocument extends Document {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Html lang="en">
        <Head>
          <script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            defer
          ></script>
          <script async src="https://js.stripe.com/v3/buy-button.js"></script>
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
