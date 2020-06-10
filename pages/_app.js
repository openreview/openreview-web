/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable global-require */

import App from 'next/app'
import Router from 'next/router'
import Layout from '../components/Layout'
import UserContext from '../components/UserContext'
import { auth, setAuthCookie, removeAuthCookie } from '../lib/auth'

// Global Styles
import '../styles/global.less'
import '../styles/components.less'

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
    this.firstRouteChange = true

    this.loginUser = this.loginUser.bind(this)
    this.logoutUser = this.logoutUser.bind(this)
    this.setBannerHidden = this.setBannerHidden.bind(this)
    this.setBannerContent = this.setBannerContent.bind(this)
    this.onRouteChange = this.onRouteChange.bind(this)
  }

  loginUser(authenticatedUser, userAccessToken, redirectPath = '/') {
    this.setState({ user: authenticatedUser, accessToken: userAccessToken })
    setAuthCookie(userAccessToken)

    // Need pass new accessToken to Webfield and controller so legacy ajax functions work
    window.Webfield.setToken(userAccessToken)
    window.controller.setToken(userAccessToken)

    Router.push(redirectPath)
  }

  logoutUser(redirectPath = '/') {
    this.setState({ user: null, accessToken: null })
    removeAuthCookie()

    window.Webfield.setToken()
    window.controller.setToken()

    Router.push(redirectPath)
  }

  setBannerHidden(newHidden) {
    this.setState({ bannerHidden: newHidden })
  }

  setBannerContent(newContent) {
    this.setState({ bannerContent: newContent })
  }

  onRouteChange(url) {
    // Reset banner only if coming from another page
    if (!this.firstRouteChange) {
      this.setState({ bannerHidden: false, bannerContent: null })
    }

    // Track pageview in Google Analytics
    // https://developers.google.com/analytics/devguides/collection/gtagjs/pages
    if (process.env.IS_PRODUCTION) {
      window.gtag('config', process.env.GA_PROPERTY_ID, {
        page_path: url,
      })
    }

    this.firstRouteChange = false
  }

  componentDidMount() {
    const { user, token } = auth()
    if (user) {
      this.setState({ user, accessToken: token })
    }

    Router.events.on('routeChangeComplete', this.onRouteChange)

    // Load required vendor libraries
    window.jQuery = require('jquery')
    window.$ = window.jQuery
    require('bootstrap')
    window._ = require('lodash')
    window.Handlebars = require('handlebars/runtime')
    window.marked = require('marked')
    window.DOMPurify = require('dompurify')

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
    window.Webfield.setToken(token)
    window.controller.setToken(token)

    this.setState({ clientJsLoading: false })
  }

  componentWillUnmount() {
    Router.events.off('routeChangeComplete', this.onRouteChange)
  }

  render() {
    const { Component, pageProps } = this.props
    const userContext = {
      user: this.state.user,
      accessToken: this.state.accessToken,
      loginUser: this.loginUser,
      logoutUser: this.logoutUser,
    }
    const appContext = {
      clientJsLoading: this.state.clientJsLoading,
      setBannerHidden: this.setBannerHidden,
      setBannerContent: this.setBannerContent,
    }

    return (
      <UserContext.Provider value={userContext}>
        <Layout
          bodyClass={Component.bodyClass}
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
