'use client'

import { useSelector } from 'react-redux'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'
import Banner from '../components/Banner'

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
    default:
      break
  }

  if (banner === null) return storeBanner ? <Banner>{storeBanner}</Banner> : null
  return banner === true ? <Banner /> : banner
}
