/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable global-require */

import App from 'next/app'
import Router from 'next/router'
import Layout from '../components/Layout'
import UserContext from '../components/UserContext'
import { auth, setAuthCookie, removeAuthCookie } from '../lib/auth'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

// Global Styles
import '../styles/global.less'
import '../styles/components.less'

export default class OpenReviewApp extends App {
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
    this.shouldResetBanner = false
    this.shouldResetLayout = false

    this.loginUser = this.loginUser.bind(this)
    this.logoutUser = this.logoutUser.bind(this)
    this.updateUserName = this.updateUserName.bind(this)
    this.setBannerHidden = this.setBannerHidden.bind(this)
    this.setBannerContent = this.setBannerContent.bind(this)
    this.setLayoutOptions = this.setLayoutOptions.bind(this)
    this.onRouteChangeStart = this.onRouteChangeStart.bind(this)
    this.onRouteChangeComplete = this.onRouteChangeComplete.bind(this)
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

  updateUserName(first, middle, last) {
    this.setState((state, props) => ({
      user: {
        ...state.user,
        profile: {
          ...state.user.profile, first, middle, last,
        },
      },
    }))
  }

  setBannerHidden(newHidden) {
    this.setState({ bannerHidden: newHidden })
    this.shouldResetBanner = false
  }

  setBannerContent(newContent) {
    this.setState({ bannerContent: newContent, bannerHidden: false })
    this.shouldResetBanner = false
  }

  setLayoutOptions(options) {
    this.setState(previous => ({
      layoutOptions: { ...previous.layoutOptions, ...options },
    }))
    this.shouldResetLayout = false
  }

  getLegacyBannerObject() {
    // Returns an object with all the functions that window.OpenBanner has in the old UI.
    // Only needs to implement the methods that are actually used in webfield code.
    return {
      hide: () => {
        this.setBannerHidden(true)
      },
      show: () => {
        this.setBannerHidden(false)
      },
      welcome: () => {
        this.setBannerContent(null)
      },
      venueHomepageLink: (groupId) => {
        this.setBannerContent(venueHomepageLink(groupId))
      },
      referrerLink: (referrer) => {
        this.setBannerContent(referrerLink(referrer))
      },
      set: () => {},
      clear: () => {},
      forumLink: () => {},
      breadcrumbs: () => {},
    }
  }

  onRouteChangeStart() {
    this.shouldResetBanner = true
    this.shouldResetLayout = true

    // Close mobile nav menu if open
    if (document.getElementById('navbar').attributes['aria-expanded']?.value === 'true') {
      document.querySelector('nav.navbar button.navbar-toggle').click()
    }
  }

  onRouteChangeComplete(url) {
    // Reset banner and Layout
    if (this.shouldResetBanner) {
      this.setState({
        bannerHidden: false,
        bannerContent: null,
      })
    }
    if (this.shouldResetLayout) {
      this.setState({
        layoutOptions: { fullWidth: false, footerMinimal: false },
      })
    }

    // Track pageview in Google Analytics
    // https://developers.google.com/analytics/devguides/collection/gtagjs/pages
    if (process.env.IS_PRODUCTION || process.env.IS_STAGING) {
      window.gtag('config', process.env.GA_PROPERTY_ID, {
        page_path: url,
        transport_type: 'beacon',
      })
    }
  }

  componentDidMount() {
    const { user, token } = auth()
    if (user) {
      this.setState({ user, accessToken: token, userLoading: false })
    } else {
      this.setState({ userLoading: false })
    }

    // Track unhandled JavaScript errors
    const reportError = (errorDescription) => {
      if (process.env.IS_PRODUCTION || process.env.IS_STAGING) {
        window.gtag('event', 'exception', {
          description: errorDescription,
          fatal: true,
        })
      }
    }
    window.addEventListener('error', (event) => {
      if (event.message === 'ResizeObserver loop limit exceeded') return false
      const description = `JavaScript Error: "${event.message}" in ${event.filename} at line ${event.lineno}`
      reportError(description)
      return false
    })
    window.addEventListener('unhandledrejection', (event) => {
      const description = `Unhandled Promise Rejection: ${JSON.stringify(event.reason)}`
      reportError(description)
    })

    // Load required vendor libraries
    window.jQuery = require('jquery')
    window.$ = window.jQuery
    require('bootstrap')
    window._ = require('lodash')
    window.Handlebars = require('handlebars/runtime')
    window.marked = require('marked')
    window.DOMPurify = require('dompurify')
    require('formdata-polyfill')
    window.MathJax = require('../lib/mathjax-config')

    // MathJax has to be loaded asynchronously from the CDN after the config file loads
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3.0.5/es5/tex-chtml.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)

    // Load legacy JS code
    window.mkStateManager = require('../client/state-manager')
    window.controller = require('../client/controller')
    window.view = require('../client/view')
    window.Webfield = require('../client/webfield')
    window.OpenBanner = this.getLegacyBannerObject()
    require('../client/templates')
    require('../client/template-helpers')
    require('../client/globals')

    // setup marked options and renderer overwrite
    window.view.setupMarked()

    // Set required constants
    window.OR_API_URL = process.env.API_URL
    window.Webfield.setToken(token)
    window.controller.setToken(token)

    this.setState({ clientJsLoading: false })

    // Register route change handlers
    Router.events.on('routeChangeStart', this.onRouteChangeStart)
    Router.events.on('routeChangeComplete', this.onRouteChangeComplete)
  }

  componentWillUnmount() {
    Router.events.off('routeChangeStart', this.onRouteChangeStart)
    Router.events.off('routeChangeComplete', this.onRouteChangeComplete)
  }

  render() {
    const { Component, pageProps } = this.props
    const userContext = {
      user: this.state.user,
      userLoading: this.state.userLoading,
      accessToken: this.state.accessToken,
      loginUser: this.loginUser,
      logoutUser: this.logoutUser,
      updateUserName: this.updateUserName,
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

// Send page page performace information to Google Analytics. For more info see:
// https://nextjs.org/docs/advanced-features/measuring-performance
export function reportWebVitals({
  id, name, label, value,
}) {
  if (process.env.IS_PRODUCTION || process.env.IS_STAGING) {
    window.gtag('event', name, {
      event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js Metrics',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    })
  }
}
