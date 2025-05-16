/* eslint-disable global-require */

import App from 'next/app'
import Router from 'next/router'
import DOMPurify from 'isomorphic-dompurify'
import { nanoid } from 'nanoid'
import random from 'lodash/random'
import { marked } from 'marked'
import Layout from '../components/Layout'
import UserContext from '../components/UserContext'
import { auth, getTokenPayload, cookieExpiration, refreshExpiration } from '../lib/auth'
import api from '../lib/api-client'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'
import mathjaxConfig from '../lib/mathjax-config'

// Global Styles
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/global.scss'
import '../styles/components.scss'
import '../styles/pages.scss'

export default class OpenReviewApp extends App {
  constructor(props) {
    super(props)

    this.state = {
      user: null,
      accessToken: null,
      userLoading: true,
      unreadNotifications: 0,
      clientJsLoading: true,
      logoutRedirect: false,
      bannerHidden: false,
      bannerContent: null,
      editBannerContent: null,
      layoutOptions: { fullWidth: false, minimalFooter: false },
    }
    this.shouldResetBanner = false
    this.shouldResetEditBanner = false
    this.shouldResetLayout = false
    this.refreshTimer = null

    this.loginUser = this.loginUser.bind(this)
    this.loginUserWithToken = this.loginUserWithToken.bind(this)
    this.logoutUser = this.logoutUser.bind(this)
    this.updateUserName = this.updateUserName.bind(this)
    this.setUnreadNotificationCount = this.setUnreadNotificationCount.bind(this)
    this.decrementNotificationCount = this.decrementNotificationCount.bind(this)
    this.setBannerHidden = this.setBannerHidden.bind(this)
    this.setBannerContent = this.setBannerContent.bind(this)
    this.setEditBanner = this.setEditBanner.bind(this)
    this.setLayoutOptions = this.setLayoutOptions.bind(this)
    this.onRouteChangeStart = this.onRouteChangeStart.bind(this)
    this.onRouteChangeComplete = this.onRouteChangeComplete.bind(this)
  }

  loginUser(authenticatedUser, userAccessToken, redirectPath = '/') {
    this.setState({
      user: authenticatedUser,
      accessToken: userAccessToken,
      logoutRedirect: false,
    })

    // Need pass new accessToken to Webfield so legacy ajax functions work
    window.Webfield.setToken(userAccessToken)
    window.Webfield2.setToken(userAccessToken)

    if (authenticatedUser.id !== process.env.SUPER_USER) {
      this.loadUnreadNotificationCount(authenticatedUser.profile.emails?.[0], userAccessToken)
    }

    // Automatically refresh the accessToken 1m before it's set to expire.
    // Add randomness to prevent all open tabs from refreshing at the same time.
    const timeToExpiration = cookieExpiration - 60000 - random(0, 300) * 100
    this.refreshTimer = setTimeout(() => {
      this.refreshToken()
    }, timeToExpiration)

    // Set flag for token refresh
    window.localStorage.setItem('openreview.lastLogin', Date.now())

    if (redirectPath) {
      Router.push(redirectPath)
    }
  }

  loginUserWithToken(userAccessToken, setCookie = true) {
    const { user: authenticatedUser, expiration: tokenExpiration } =
      getTokenPayload(userAccessToken)
    if (!authenticatedUser) return

    this.setState({
      user: authenticatedUser,
      accessToken: userAccessToken,
      logoutRedirect: false,
    })

    if (!setCookie) return

    // Need pass new accessToken to Webfield so legacy ajax functions work
    window.Webfield.setToken(userAccessToken)
    window.Webfield2.setToken(userAccessToken)

    const timeToExpiration = tokenExpiration * 1000 - Date.now() - 60000
    this.refreshTimer = setTimeout(() => {
      this.refreshToken()
    }, timeToExpiration)
  }

  logoutUser(redirectPath = '/') {
    window.Webfield.setToken(null)
    window.Webfield2.setToken(null)

    this.setState({
      user: null,
      accessToken: null,
      logoutRedirect: !!redirectPath,
    })

    clearTimeout(this.refreshTimer)

    window.localStorage.removeItem('openreview.lastLogin')

    if (redirectPath) {
      Router.push(redirectPath)
    }
  }

  async refreshToken() {
    try {
      const { token, user } = await api.post('/refreshToken')
      this.loginUser(user, token, null)
    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'MissingTokenError') {
        this.logoutUser(null)
      } else {
        Router.reload()
      }
    }
  }

  static async attemptRefresh() {
    try {
      const { token, user } = await api.post('/refreshToken')
      const expiration = Date.now() + cookieExpiration
      return { user, token, expiration }
    } catch (error) {
      window.Webfield.setToken(null)
      window.Webfield2.setToken(null)
      window.localStorage.removeItem('openreview.lastLogin')
      clearTimeout(this.refreshTimer)

      return { user: null, accessToken: null }
    }
  }

  async loadUnreadNotificationCount(userEmail, accessToken) {
    if (!userEmail || !accessToken) return

    try {
      const response = await api.get(
        '/messages',
        { to: userEmail, viewed: false, transitiveMembers: true },
        { accessToken }
      )
      const count = response.messages?.length
      this.setState({ unreadNotifications: count ?? 0 })
    } catch (error) {
      this.setState({ unreadNotifications: 0 })
    }
  }

  setUnreadNotificationCount(count) {
    this.setState({ unreadNotifications: count })
  }

  decrementNotificationCount(num = 1) {
    this.setState((state, props) => ({
      unreadNotifications: state.unreadNotifications - num,
    }))
  }

  updateUserName(fullname) {
    this.setState((state, props) => ({
      user: {
        ...state.user,
        profile: {
          ...state.user.profile,
          fullname,
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

  setEditBanner(newContent) {
    this.setState({ editBannerContent: newContent })
    this.shouldResetEditBanner = false
  }

  setLayoutOptions(options) {
    this.setState((previous) => ({
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

  onRouteChangeStart(url) {
    this.shouldResetBanner = url.split('?')[0] !== window.location.pathname
    this.shouldResetLayout = true
    this.shouldResetEditBanner = true

    // Close mobile nav menu if open
    if (document.getElementById('navbar')?.attributes['aria-expanded']?.value === 'true') {
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
        layoutOptions: { fullWidth: false, minimalFooter: false },
      })
    }
    if (this.shouldResetEditBanner) {
      this.setState({ editBannerContent: null })
    }

    // Track pageview in Google Analytics
    // https://developers.google.com/analytics/devguides/collection/gtagjs/pages
    if (process.env.SERVER_ENV === 'production' || process.env.SERVER_ENV === 'staging') {
      window.gtag('config', process.env.GA_PROPERTY_ID, {
        page_location: window.location.origin + url,
      })
    }
  }

  componentDidMount() {
    // Load required vendor libraries
    window.jQuery = require('jquery')
    window.$ = window.jQuery
    require('bootstrap')
    window._ = require('lodash')
    window.Handlebars = require('handlebars/runtime')
    window.marked = marked
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    })
    window.DOMPurify = DOMPurify
    window.MathJax = mathjaxConfig
    window.nanoid = nanoid

    // Load legacy JS code
    window.mkStateManager = require('../client/state-manager')
    window.view = require('../client/view')
    window.view2 = require('../client/view-v2')
    window.Webfield = require('../client/webfield')
    window.Webfield2 = require('../client/webfield-v2')
    window.OpenBanner = this.getLegacyBannerObject()
    require('../client/templates')
    require('../client/template-helpers')
    require('../client/globals')

    // MathJax has to be loaded asynchronously from the CDN after the config file loads
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml-full.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)

    // Setup marked options and renderer overwrite
    window.view.setupMarked()

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Failed to register service worker: ', error)
      })
    }

    const setUserState = ({ user, token, expiration }) => {
      if (!user) {
        this.setState({ userLoading: false })
        return
      }

      this.setState({ user, accessToken: token, userLoading: false })

      window.Webfield.setToken(token)
      window.Webfield2.setToken(token)

      if (user.id !== process.env.SUPER_USER) {
        this.loadUnreadNotificationCount(user.profile.emails[0], token)
      }

      // Automatically refresh the accessToken 1m before it's set to expire.
      // Add randomness to prevent all open tabs from refreshing at the same time.
      const timeToExpiration = expiration - Date.now() - 60000 - random(0, 300) * 100
      this.refreshTimer = setTimeout(() => {
        this.refreshToken()
      }, timeToExpiration)
    }

    // Load user state from auth cookie
    const authCookieData = auth()

    // Access token may be expired, but refresh token is valid for 6 more days
    const refreshFlag = Number(window.localStorage.getItem('openreview.lastLogin') || 0)
    if (
      (!authCookieData.user && refreshFlag && refreshFlag + refreshExpiration > Date.now()) ||
      (authCookieData.expiration && authCookieData.expiration < Date.now() + 65000)
    ) {
      OpenReviewApp.attemptRefresh().then((refreshCookieData) => {
        setUserState(refreshCookieData)
        this.setState({ clientJsLoading: false })
      })
    } else {
      setUserState(authCookieData)
      this.setState({ clientJsLoading: false })
    }

    // When the user logs out in another tab, trigger logout for this app
    window.addEventListener('storage', (e) => {
      if (e.key === 'openreview.lastLogout') {
        this.logoutUser(null)
      }
    })

    // Make sure that even if the timer is not triggered (for example if the computer was
    // in sleep mode), the token is refreshed
    window.addEventListener('focus', () => {
      const cookieData = auth()
      if (
        (this.state.user && !cookieData.user) ||
        (cookieData.expiration && cookieData.expiration < Date.now() + 65000)
      ) {
        this.refreshToken()
      }
    })

    // Track unhandled JavaScript errors
    const reportError = (errorDescription) => {
      if (process.env.SERVER_ENV === 'production' || process.env.SERVER_ENV === 'staging') {
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

    // Set required constants
    window.OR_API_URL = process.env.API_URL
    window.OR_API_V2_URL = process.env.API_V2_URL

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
      unreadNotifications: this.state.unreadNotifications,
      userLoading: this.state.userLoading,
      accessToken: this.state.accessToken,
      loginUser: this.loginUser,
      loginUserWithToken: this.loginUserWithToken,
      logoutUser: this.logoutUser,
      logoutRedirect: this.state.logoutRedirect,
      updateUserName: this.updateUserName,
      setUnreadNotificationCount: this.setUnreadNotificationCount,
      decrementNotificationCount: this.decrementNotificationCount,
    }
    const appContext = {
      clientJsLoading: this.state.clientJsLoading,
      setBannerHidden: this.setBannerHidden,
      setBannerContent: this.setBannerContent,
      setEditBanner: this.setEditBanner,
      setLayoutOptions: this.setLayoutOptions,
    }

    if (Component.bodyClass === 'embed') {
      return <Component {...pageProps} appContext={appContext} userContext={userContext} />
    }

    return (
      <UserContext.Provider value={userContext}>
        <Layout
          bodyClass={Component.bodyClass}
          bannerHidden={this.state.bannerHidden}
          bannerContent={this.state.bannerContent}
          editBannerContent={this.state.editBannerContent}
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
export function reportWebVitals({ id, name, label, value }) {
  if (process.env.SERVER_ENV === 'production' || process.env.SERVER_ENV === 'staging') {
    window.gtag('event', name, {
      event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js Metrics',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    })
  }
}
