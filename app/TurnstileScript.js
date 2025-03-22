import Script from 'next/script'

export default function TurnstileScript() {
  return (
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js"
      strategy="beforeInteractive"
    />
  )
}
