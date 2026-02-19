/* eslint-disable global-require */

'use client'

import { useEffect, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { nanoid } from 'nanoid'
import mathjaxConfig from '../lib/mathjax-config'
import MathjaxScript from './MathjaxScript'
import TurnstileScript from './TurnstileScript'
import usePrompt from '../hooks/usePrompt'
import BibtexModal from '../components/BibtexModal'
import StripeScript from './StripeScript'

export default function AppInit() {
  const [libarysLoaded, setLibrariesLoaded] = useState(false)
  const { notificationHolder, promptFunctions } = usePrompt()

  useEffect(() => {
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
    require('../client/templates')
    require('../client/template-helpers')
    require('../client/globals')

    Object.assign(global, promptFunctions)

    // Setup marked options and renderer overwrite
    window.view.setupMarked()

    setLibrariesLoaded(true)

    // Set required constants for api call in view
    window.OR_API_URL = process.env.API_URL
    window.OR_API_V2_URL = process.env.API_V2_URL
    window.OR_GUEST_API_URL = process.env.GUEST_API_URL

    window.typesetMathJax = () => {
      const runTypeset = () => {
        // eslint-disable-next-line no-undef
        MathJax.startup.promise.then(MathJax.typesetPromise).catch((error) => {
          // eslint-disable-next-line no-console
          console.warn('Could not typeset TeX content')
        })
      }
      // eslint-disable-next-line no-undef
      if (window.isMathJaxLoaded && MathJax.startup?.promise) {
        runTypeset()
      } else {
        let tryCount = 0

        const waitForMathJax = () => {
          if (window.isMathJaxLoaded) {
            runTypeset()
          } else if (tryCount < 3) {
            tryCount += 1
            setTimeout(waitForMathJax, 500)
          } else {
            // eslint-disable-next-line no-console
            console.warn('Could not typeset TeX content')
          }
        }
        waitForMathJax()
      }
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Failed to register service worker: ', error)
      })
    }
  }, [])

  return (
    <>
      <MathjaxScript />
      <TurnstileScript />
      {notificationHolder}
      <StripeScript />
      {libarysLoaded && <BibtexModal />}
    </>
  )
}
