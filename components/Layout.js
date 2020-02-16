import React from 'react'
import Head from 'next/Head'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import Banner from '../components/Banner'

const Layout = ({ children, title }) => (
  <>
    <Head>
      <title>{title} | OpenReview</title>
    </Head>

    <Nav user={null} />
    <Banner hidden={false} />

    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          <main id="content" className="clearfix">

            {children}

          </main>
        </div>
      </div>
    </div>

    <Footer />
  </>
)

export default Layout
