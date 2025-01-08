import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/global.scss'
import '../styles/components.scss'
import '../styles/pages.scss'
// eslint-disable-next-line camelcase
import { Noto_Sans } from 'next/font/google'
import FlashAlert from '../components/FlashAlert'
import AppInit from './(Home)/appInit'
import { StoreProvider } from '../storeProvider'
import Nav from './(Home)/Nav'

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'fallback',
})

export const viewport = { width: 'device-width', initialScale: 1 }

export const metadata = {
  charSet: 'utf-8',
  description: 'Promoting openness in scientific communication and the peer-review process',
  openGraph: {
    title: 'OpenReview',
    description: '',
    image: 'https://openreview.net/images/openreview_logo_512.png',
    type: 'website',
    site_name: 'OpenReview',
  },
}

export default function Layout({ children }) {
  const fullWidth = false
  const bodyClass = false
  const bannerHidden = false
  const minimalFooter = false
  const bannerContent = null
  const editBannerContent = null

  return (
    <html lang="en">
      <head>
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        ></script>

        {/* <title key="title">OpenReview</title> */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />

        {/* Google Analytics */}
        {process.env.SERVER_ENV === 'production' || process.env.SERVER_ENV === 'staging' ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_PROPERTY_ID}`}
            />
            <script
              // eslint-disable-next-line react/no-danger
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
        ) : null}
      </head>
      <StoreProvider>
        <body className={notoSans.className}>
          <div id="__next">
            <Nav />
            {/* <Banner hidden={bannerHidden}>{bannerContent}</Banner> */}
            {/* <EditBanner>{editBannerContent}</EditBanner> */}
            <FlashAlert />
            <AppInit />
            {/* <div className={`container${fullWidth ? '-fluid' : ''}`}>
              <div className="row">
                <div className="col-xs-12">
                  <main
                    id="content"
                    className={`${bodyClass || ''} ${bannerHidden ? 'banner-hidden' : ''} ${
                      minimalFooter ? 'minimal-footer' : ''
                    }`}
                  >
                    {children}
                  </main>
                </div>
              </div>
            </div> */}
            {children}
          </div>
        </body>
      </StoreProvider>
    </html>
  )
}
