/* global promptRefresh:false */

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
        return
      }
      const { version: serverVersion } = await response.json()
      if (!version) {
        dispatch(setVersion({ value: serverVersion }))
        return
      }
      if (version !== serverVersion) {
        promptRefresh(
          'A new version of OpenReview is available. Please refresh the page to get latest changes.',
          10
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
