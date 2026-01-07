'use client'

import { useEffect, useState } from 'react'

const useBreakpoint = (breakpoint) => {
  const mediaQueries = {
    xs: '(max-width: 575px)',
    sm: '(min-width: 576px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 992px)',
    xl: '(min-width: 1200px)',
    xxl: '(min-width: 1600px)',
  }

  const [match, setMatch] = useState(true)
  useEffect(() => {
    const mediaQueryList = window.matchMedia(mediaQueries[breakpoint])
    const handleMediaChange = () => setMatch(mediaQueryList.matches)
    setMatch(mediaQueryList?.matches)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleMediaChange)
    } else {
      mediaQueryList.addEventListener('change', handleMediaChange)
    }
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleMediaChange)
      } else {
        mediaQueryList.addEventListener(handleMediaChange)
      }
    }
  }, [breakpoint])

  return match
}

export default useBreakpoint
