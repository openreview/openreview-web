import React from 'react'
import App from 'next/app'
import { kebabCase } from 'lodash'
import Layout from '../components/Layout'
import UserContext from '../components/UserContext'

// Global Styles
import '../styles/main.less'

class OpenReviewApp extends App {
  constructor(props) {
    super(props);

    this.state = { user: null }
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.jQuery = window.$ = require('jquery')
      require('bootstrap')
      window._ = require('lodash')
    }
  }

  render() {
    const { Component, pageProps } = this.props
    const pageTitle = Component.title
    const bodyClass = Component.bodyClass || kebabCase(pageTitle)

    return (
      <UserContext.Provider value={{ user: this.state.user }}>
        <Layout title={pageTitle} bodyClass={bodyClass}>
          <Component {...pageProps} />
        </Layout>
      </UserContext.Provider>
    )
  }
}

export default OpenReviewApp
