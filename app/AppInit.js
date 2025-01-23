/* eslint-disable global-require */

'use client'

import { useEffect } from 'react'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { nanoid } from 'nanoid'
import mathjaxConfig from '../lib/mathjax-config'
import MathjaxScript from './MathjaxScript'

export default function AppInit() {
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
    require('../client/templates')
    require('../client/template-helpers')
    require('../client/globals')

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

  return <MathjaxScript />
}
