import Head from 'next/head'
import Nav from './Nav'
import Banner from './Banner'
import FlashAlert from './FlashAlert'
import Footer from './Footer'
import FooterMinimal from './FooterMinimal'
import FeedbackModal from './FeedbackModal'

export default function Layout({
  children, bodyClass, bannerHidden, bannerContent, fullWidth, minimalFooter,
}) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title key="title">OpenReview</title>
        <meta name="description" content="Promoting openness in scientific communication and the peer-review process" />

        <meta property="og:title" key="og:title" content="OpenReview" />
        <meta property="og:description" key="og:description" content="" />
        <meta property="og:image" key="og:image" content="https://openreview.net/images/openreview_logo_512.png" />
        <meta property="og:type" key="og:type" content="website" />
        <meta property="og:site_name" key="og:site_name" content="OpenReview" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@openreviewnet" />
      </Head>

      <Nav />
      <Banner content={bannerContent} hidden={bannerHidden} />
      <FlashAlert />

      <div className={`container${fullWidth ? '-fluid' : ''}`}>
        <div className="row">
          <div className="col-xs-12">
            <main
              id="content"
              className={`${bodyClass || ''} ${bannerHidden ? 'banner-hidden' : ''} ${minimalFooter ? 'minimal-footer' : ''}`}
            >
              {children}
            </main>
          </div>
        </div>
      </div>

      {minimalFooter ? (
        <FooterMinimal />
      ) : (
        <Footer />
      )}

      <FeedbackModal />
    </>
  )
}
