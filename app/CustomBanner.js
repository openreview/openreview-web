'use client'

import { useSelector } from 'react-redux'
import Banner from '../components/Banner'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

// it could be:
// default banner - prompt open review message
// page set banner - banner prop
// store set banner - set by sub componts
// null - no banner

export default function CustomBanner({ banner = true }) {
  const { type, value } = useSelector((state) => state.banner)

  let storeBanner = null
  switch (type) {
    case 'referrerLink':
      storeBanner = referrerLink(value)
      break
    case 'venueHomepageLink':
      storeBanner = venueHomepageLink(value)
      break
    case 'error':
      storeBanner = <span className="important_message">{value}</span>
      break
    default:
      break
  }

  if (banner === null) return storeBanner ? <Banner type={type}>{storeBanner}</Banner> : null
  return banner === true ? <Banner /> : banner
}
