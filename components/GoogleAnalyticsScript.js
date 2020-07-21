const GoogleAnalyticsScript = () => {
  const googleAnalyticsId = process.env.GA_PROPERTY_ID

  if (!process.env.IS_PRODUCTION && !process.env.IS_STAGING) {
    return null
  }

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} />
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}', {
              page_path: window.location.pathname,
            });`,
        }}
      />
    </>
  )
}

export default GoogleAnalyticsScript
