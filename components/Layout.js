import Head from 'next/head'
/* eslint-disable camelcase */
import { Noto_Sans } from 'next/font/google'
import Nav from './Nav'
import Banner from './Banner'
import EditBanner from './EditBanner'
import FlashAlert from './FlashAlert'
import Footer from './Footer'
import FooterMinimal from './FooterMinimal'
import BibtexModal from './BibtexModal'

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'fallback',
})

export default function Layout({
  children,
  bodyClass,
  bannerHidden,
  bannerContent,
  editBannerContent,
  fullWidth,
  minimalFooter,
}) {
  return (
    <div className={notoSans.className}>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title key="title">OpenReview</title>
        <meta
          name="description"
          content="Promoting openness in scientific communication and the peer-review process"
        />

        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />

        <meta property="og:title" key="og:title" content="OpenReview" />
        <meta property="og:description" key="og:description" content="" />
        <meta
          property="og:image"
          key="og:image"
          content="https://openreview.net/images/openreview_logo_512.png"
        />
        <meta property="og:type" key="og:type" content="website" />
        <meta property="og:site_name" key="og:site_name" content="OpenReview" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@openreviewnet" />

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
      </Head>

      <Nav />

      <Banner hidden={bannerHidden}>{bannerContent}</Banner>
      <EditBanner>{editBannerContent}</EditBanner>
      <FlashAlert />

      <div className={`container${fullWidth ? '-fluid' : ''}`}>
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
      </div>

      {minimalFooter ? <FooterMinimal /> : <Footer />}

      <BibtexModal />
    </div>
  )
}
