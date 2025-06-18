import Script from 'next/script'

export default function GoogleAnalyticsScript() {
  if (!['production', 'staging'].includes(process.env.SERVER_ENV)) return null
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_PROPERTY_ID}`}
      />
      <Script
        id="ga-script"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', '${process.env.GA_PROPERTY_ID}', {
page_location: location.origin + location.pathname + location.search,
});`,
        }}
      />
    </>
  )
}
