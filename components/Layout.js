import Head from 'next/head'
import Nav from './Nav'
import Banner from './Banner'
import FlashAlert from './FlashAlert'
import Footer from './Footer'

// Global Styles
import '../styles/layout.less'

const Layout = ({
  children, title, bodyClass, bannerHidden, bannerContent,
}) => (
  <>
    <Head>
      <title>{`${title} | OpenReview`}</title>
    </Head>

    <Nav />
    <Banner content={bannerContent} hidden={bannerHidden} />
    <FlashAlert />

    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          <main id="content" className={`${bodyClass} clearfix`}>

            {children}

          </main>
        </div>
      </div>
    </div>

    <Footer />
  </>
)

export default Layout
