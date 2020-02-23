import Link from 'next/link'
import { prettyId } from './utils'

/**
 * Builds link back to venue homepage for breadcrumb banner
 *
 * @param {string} groupId - the venue to link back to
 */
export function venueHomepageLink(groupId, mode) {
  const modeParam = mode ? `&mode=${mode}` : ''
  const pageType = mode === 'edit' ? 'group page' : 'homepage'
  const url = groupId ? `/group?id=${groupId}${modeParam}` : '/'

  return (
    <Link href={url}>
      <a title="Venue Homepage">
        <img className="icon" src="/images/arrow_left.svg" alt="back arrow" />
        Go to
        {' '}
        <strong>{prettyId(groupId)}</strong>
        {' '}
        {pageType}
      </a>
    </Link>
  )
}

/**
 * Builds link based on url encoded referrer param
 *
 * @param {string} encodedReferrer - referrer param from query string
 */
export function referrerLink(encodedReferrer) {
  let referrerUrl = encodedReferrer
  let backText = ''
  let referrerText = 'Back'
  const reMatch = referrerUrl.match(/\[(.*)\]\((.*)\)/)
  if (reMatch) {
    backText = 'Back to'
    referrerText = reMatch[1]
    referrerUrl = reMatch[2]
  }
  if (referrerUrl.charAt(0) !== '/') {
    referrerUrl = `/${referrerUrl}`
  }

  return (
    <Link href={referrerUrl}>
      <a title="Back">
        <img className="icon" src="/images/arrow_left.svg" alt="back arrow" />
        {backText}
        {' '}
        <strong>{referrerText}</strong>
      </a>
    </Link>
  )
}
