import Script from 'next/script'

export default function StripeScript() {
  return <Script src="https://js.stripe.com/v3/buy-button.js" strategy="afterInteractive" />
}
