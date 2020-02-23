import Head from 'next/head'
import Nav from './Nav'
import Footer from './Footer'
import Banner from './Banner'

const Layout = ({
  children, title, bodyClass, bannerHidden, bannerContent,
}) => (
  <>
    <Head>
      <title>{`${title} | OpenReview`}</title>
    </Head>

    <Nav />
    <Banner content={bannerContent} hidden={bannerHidden} />

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
