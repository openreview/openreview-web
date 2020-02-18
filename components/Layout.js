import Head from 'next/Head'
import Nav from './Nav'
import Footer from './Footer'
import Banner from './Banner'

const Layout = ({ children, title, bodyClass, hideBanner }) => (
  <>
    <Head>
      <title>{title} | OpenReview</title>
    </Head>

    <Nav />
    <Banner hidden={hideBanner} />

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
