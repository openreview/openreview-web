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
      <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3.0.5/es5/tex-chtml.js" />
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
  </>
)

export default Layout
