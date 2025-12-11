import { forwardRef } from 'react'
import { useRouter } from 'next/navigation'

const WebfieldContainer = forwardRef((props, ref) => {
  const router = useRouter()

  const handleLinkClick = (e) => {
    // Intercept clicks on links in webfields and use client side routing
    if (e.target.tagName !== 'A' && e.target.parentElement.tagName !== 'A') return

    const target = e.target.tagName === 'A' ? e.target : e.target.parentElement
    const href = target.getAttribute('href')
    if (!href) return

    // Open link in new tab if link has target="_blank", or if it's a ctrl-click or middle click
    if (
      target.getAttribute('target') === '_blank' ||
      e.metaKey ||
      e.ctrlKey ||
      e.button === 1
    ) {
      e.preventDefault()
      window.open(href, '_blank')
      return
    }

    if (href.match(/^\/(forum|group|profile|invitation|assignments)/)) {
      e.preventDefault()
      router.push(href)
    } else if (href.startsWith('#') && target.getAttribute('data-modify-history') === 'true') {
      router.replace(window.location.pathname + window.location.search + href)
    }
  }

  return (
    <div id={props.id} ref={ref} onClick={handleLinkClick}>
      {props.children}
    </div>
  )
})
WebfieldContainer.displayName = 'WebfieldContainer'

export default WebfieldContainer
