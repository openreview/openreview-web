/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable global-require */

import React from 'react'
import App from 'next/app'
import Router from 'next/router'
import kebabCase from 'lodash/kebabCase'
import Layout from '../components/Layout'
import UserContext from '../components/UserContext'
import { auth } from '../lib/auth'

class OpenReviewApp extends App {
  constructor(props) {
    super(props)

    this.state = {
      user: null,
      accessToken: null,
      clientJsLoading: true,
      bannerHidden: false,
      bannerContent: null,
    }

    Router.events.on('routeChangeComplete', (url) => {
      // Reset banner
      this.setState({ bannerHidden: false, bannerContent: null })

      // Track pageview in Google Analytics
      // https://developers.google.com/analytics/devguides/collection/gtagjs/pages
      if (process.env.IS_PRODUCTION) {
        window.gtag('config', process.env.GA_PROPERTY_ID, {
          page_path: url,
        })
      }
    })

    this.setUser = this.setUser.bind(this)
    this.setBannerHidden = this.setBannerHidden.bind(this)
    this.setBannerContent = this.setBannerContent.bind(this)
  }

  setUser(authenticatedUser, userAccessToken) {
    this.setState({ user: authenticatedUser, accessToken: userAccessToken })
  }

  setBannerHidden(newHidden) {
    this.setState({ bannerHidden: newHidden })
  }

  setBannerContent(newContent) {
    this.setState({ bannerContent: newContent })
  }

  componentDidMount() {
    const { user, token } = auth()
    if (user) {
      this.setUser(user, token)
    }

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

  render() {
    const { Component, pageProps } = this.props
    const pageTitle = Component.title
    const bodyClass = Component.bodyClass || kebabCase(pageTitle)
    const userContext = {
      user: this.state.user,
      accessToken: this.state.accessToken,
      setLoggedInUser: this.setUser,
    }
    const appContext = {
      clientJsLoading: this.state.clientJsLoading,
      setBannerHidden: this.setBannerHidden,
      setBannerContent: this.setBannerContent,
    }

    return (
      <UserContext.Provider value={userContext}>
        <Layout
          title={pageTitle}
          bodyClass={bodyClass}
          bannerHidden={this.state.bannerHidden}
          bannerContent={this.state.bannerContent}
        >
          <Component {...pageProps} appContext={appContext} />
        </Layout>
      </UserContext.Provider>
    )
  }
}

export default OpenReviewApp
