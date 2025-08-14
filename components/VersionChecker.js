/* global generalPrompt:false */

'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setVersion } from '../versionSlice'

const VersionChecker = () => {
  const { version } = useSelector((state) => state.version)
  const dispatch = useDispatch()

  const checkVersion = async () => {
    try {
      const response = await fetch('/version')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const { version: serverVersion } = await response.json()
      if (!version) {
        dispatch(setVersion({ value: serverVersion }))
        return
      }
      if (version !== serverVersion) {
        generalPrompt(
          'info',
          'A new version of OpenReview is available. Please refresh the page to get latest changes. <button class="btn btn-xs" onclick="window.location.reload()">Refresh</button>',
          { html: true }
        )
      }
    } catch (_) {
      /* empty */
    }
  }

  useEffect(() => {
    checkVersion()
  }, [])
}

export default VersionChecker
