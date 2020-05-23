import Head from 'next/head'
import Nav from './Nav'
import Banner from './Banner'
import FlashAlert from './FlashAlert'
import Footer from './Footer'

const Layout = ({
  children, bodyClass, bannerHidden, bannerContent,
}) => (
  <>
    <Head>
      <title key="title">OpenReview</title>
    </Head>

    <Nav />
    <Banner content={bannerContent} hidden={bannerHidden} />
    <FlashAlert />

    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          <main
            id="content"
            className={`${bodyClass} ${!bannerHidden && 'banner-visible'} clearfix`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>

    <Footer />
  </>
)

export default Layout
