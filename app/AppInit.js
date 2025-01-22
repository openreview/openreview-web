/* eslint-disable global-require */

'use client'

import { useContext, useEffect } from 'react'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { nanoid } from 'nanoid'
import random from 'lodash/random'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { auth, getTokenPayload, cookieExpiration, refreshExpiration } from '../lib/auth'
import mathjaxConfig from '../lib/mathjax-config'
import UserContext from '../components/UserContext'
import { refreshToken } from '../rootSlice'

export default function AppInit() {
  // const dispatch = useDispatch()
  // const user = useSelector((state) => state.root.user)
  // throw new Error('test')

  useEffect(() => {
    // Load required vendor libraries
    window.jQuery = require('jquery')
    window.$ = window.jQuery
    require('bootstrap')
    window._ = require('lodash')
    window.Handlebars = require('handlebars/runtime')
    window.marked = marked
    window.DOMPurify = DOMPurify
    window.MathJax = mathjaxConfig
    window.nanoid = nanoid

    // Load legacy JS code
    window.mkStateManager = require('../client/state-manager')
    window.view = require('../client/view')
    window.view2 = require('../client/view-v2')
    window.Webfield = require('../client/webfield')
    window.Webfield2 = require('../client/webfield-v2')
    // window.OpenBanner = this.getLegacyBannerObject()
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

    // Set required constants for api call in view
    window.OR_API_URL = process.env.API_URL
    window.OR_API_V2_URL = process.env.API_V2_URL

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Failed to register service worker: ', error)
      })
    }
  }, [])

  // useEffect(() => {
  //   if (user || user === null) return
  //   dispatch(refreshToken())
  // }, [user])

  return null
}
