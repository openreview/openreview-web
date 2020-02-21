/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable global-require */

import React from 'react'
import App from 'next/app'
import Router from 'next/router'
import { kebabCase } from 'lodash'
import Layout from '../components/Layout'
import UserContext from '../components/UserContext'

// Global Styles
import '../styles/layout.less'

class OpenReviewApp extends App {
  constructor(props) {
    super(props)

    this.state = { user: null, clientJsLoading: true }
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      // Load required vendor libraries
      // eslint-disable-next-line no-multi-assign
      window.jQuery = window.$ = require('jquery')
      require('bootstrap')
      window._ = require('lodash')
      window.Handlebars = require('handlebars/runtime')

      // Load legacy JS code
      window.mkStateManager = require('../client/state-manager')
      window.controller = require('../client/controller')
      window.view = require('../client/view')
      window.Webfield = require('../client/webfield')
      require('../client/templates')
      require('../client/template-helpers')
      require('../client/globals')

      // Set required constants
      window.OR_API_URL = process.env.API_URL

      this.setState({ clientJsLoading: false })
    }
  }

  render() {
    const { Component, pageProps } = this.props
    const pageTitle = Component.title
    const bodyClass = Component.bodyClass || kebabCase(pageTitle)

    return (
      <UserContext.Provider value={{ user: this.state.user }}>
        <Layout title={pageTitle} bodyClass={bodyClass}>
          <Component {...pageProps} clientJsLoading={this.state.clientJsLoading} />
        </Layout>
      </UserContext.Provider>
    )
  }
}

Router.events.on('routeChangeComplete', (url) => {
  if (process.env.IS_PRODUCTION) return

  // https://developers.google.com/analytics/devguides/collection/gtagjs/pages
  window.gtag('config', process.env.GA_PROPERTY_ID, {
    page_path: url,
  })
})

export default OpenReviewApp
