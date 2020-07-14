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
      userLoading: true,
      accessToken: null,
      clientJsLoading: true,
      bannerHidden: false,
      bannerContent: null,
      layoutOptions: { fullWidth: false, footerMinimal: false },
    }
    this.firstRouteChange = true

    this.loginUser = this.loginUser.bind(this)
    this.logoutUser = this.logoutUser.bind(this)
    this.setBannerHidden = this.setBannerHidden.bind(this)
    this.setBannerContent = this.setBannerContent.bind(this)
    this.setLayoutOptions = this.setLayoutOptions.bind(this)
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

    window.Webfield.setToken(null)
    window.controller.setToken(null)

    Router.push(redirectPath)
  }

  setBannerHidden(newHidden) {
    this.setState({ bannerHidden: newHidden })
  }

  setBannerContent(newContent) {
    this.setState({ bannerContent: newContent })
  }

  setLayoutOptions(options) {
    this.setState(previous => ({
      layoutOptions: { ...previous.layoutOptions, ...options },
    }))
  }

  onRouteChange(url) {
    // Reset banner only if coming from another page
    if (!this.firstRouteChange) {
      this.setState({
        bannerHidden: false,
        bannerContent: null,
        layoutOptions: { fullWidth: false, footerMinimal: false },
      })
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
      this.setState({ user, accessToken: token, userLoading: false })
    } else {
      this.setState({ userLoading: false })
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
    window.MathJax = require('../lib/mathjax-config')

    // MathJax has to be loaded asynchronously from the CDN after the config file loads
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3.0.5/es5/tex-chtml.js'
    script.async = true
    document.head.appendChild(script)

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
      userLoading: this.state.userLoading,
      accessToken: this.state.accessToken,
      loginUser: this.loginUser,
      logoutUser: this.logoutUser,
    }
    const appContext = {
      clientJsLoading: this.state.clientJsLoading,
      setBannerHidden: this.setBannerHidden,
      setBannerContent: this.setBannerContent,
      setLayoutOptions: this.setLayoutOptions,
    }

    return (
      <UserContext.Provider value={userContext}>
        <Layout
          bodyClass={Component.bodyClass}
          bannerHidden={this.state.bannerHidden}
          bannerContent={this.state.bannerContent}
          fullWidth={this.state.layoutOptions.fullWidth}
          minimalFooter={this.state.layoutOptions.minimalFooter}
        >
          <Component {...pageProps} appContext={appContext} />
        </Layout>
      </UserContext.Provider>
    )
  }
}

export default OpenReviewApp
