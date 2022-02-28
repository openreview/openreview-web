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
    const handleMediaChange = (e) => {
      // eslint-disable-next-line no-unused-expressions
      mediaQueryList?.matches ? setMatch(true) : setMatch(false)
    }
    setMatch(mediaQueryList?.matches)
    // eslint-disable-next-line no-unused-expressions
    mediaQueryList.addEventListener
      ? mediaQueryList.addEventListener('change', handleMediaChange)
      : mediaQueryList.addListener(handleMediaChange)
    return () =>
      // eslint-disable-next-line no-unused-expressions
      mediaQueryList.removeEventListener
        ? mediaQueryList.removeEventListener('change', handleMediaChange)
        : mediaQueryList.removeListener(handleMediaChange)
  }, [breakpoint])

  return match
}

export default useBreakpoint
