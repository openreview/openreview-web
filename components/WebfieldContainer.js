import React from 'react'
import { useRouter } from 'next/router'

const WebfieldContainer = React.forwardRef((props, ref) => {
  const router = useRouter()

  const handleLinkClick = (e) => {
    // Intercept clicks on links in webfields and use client side routing
    if (e.target.tagName !== 'A' && e.target.parentElement.tagName !== 'A') return

    const href = e.target.getAttribute('href') || e.target.parentElement.getAttribute('href')
    if (!href) return

    if (href.match(/^\/(forum|group|profile)/)) {
      e.preventDefault()
      // Need to manually scroll to top of page after using router.push,
      // see https://github.com/vercel/next.js/issues/3249
      router.push(href).then(() => window.scrollTo(0, 0))
    } else if (href.startsWith('#')) {
      router.replace(window.location.pathname + window.location.search + href)
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div id={props.id} ref={ref} onClick={handleLinkClick} />
  )
})

export default WebfieldContainer
