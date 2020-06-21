import Head from 'next/head'
import Nav from './Nav'
import Banner from './Banner'
import FlashAlert from './FlashAlert'
import Footer from './Footer'
import FooterMinimal from './FooterMinimal'

const Layout = ({
  children, bodyClass, bannerHidden, bannerContent, fullWidth, minimalFooter,
}) => (
  <>
    <Head>
      <title key="title">OpenReview</title>
    </Head>

    <Nav />
    <Banner content={bannerContent} hidden={bannerHidden} />
    <FlashAlert />

    <div className={`container${fullWidth ? '-fluid' : ''}`}>
      <div className="row">
        <div className="col-xs-12">
          <main
            id="content"
            className={`${bodyClass} ${bannerHidden ? '' : 'banner-visible'} clearfix`}
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
  </>
)

export default Layout
