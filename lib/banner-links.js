import Link from 'next/link'
import upperFirst from 'lodash/upperFirst'
import truncate from 'lodash/truncate'
import { prettyId, buildNoteTitle } from './utils'

/**
 * Builds link back to venue homepage for breadcrumb banner
 *
 * @param {string} groupId - the venue to link back to
 */
export function venueHomepageLink(groupId, mode) {
  const modeParam = mode ? `/${mode}` : ''
  const pageType = mode === 'edit' ? 'group page' : 'homepage'
  const url = groupId ? `/group${modeParam}?id=${groupId}` : '/'

  return (
    <Link href={url} title="Venue Homepage">
      <img className="icon" src="/images/arrow_left.svg" alt="back arrow" />
      Go to <strong>{prettyId(groupId)}</strong> {pageType}
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
  if (typeof referrerUrl !== 'string') {
    return null
  }

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
    <Link href={referrerUrl} title="Back">
      <img className="icon" src="/images/arrow_left.svg" alt="back arrow" />
      {backText} <strong>{referrerText}</strong>
    </Link>
  )
}

/**
 * Builds link to a forum page using ids and title
 *
 * @param {object} note
 */
export function forumLink(note) {
  const { forum, id, signatures, content, replyto, details } = note
  const forumId = forum ?? replyto
  const isV2Note = note.version === 2
  const invitation = isV2Note ? note.invitations[0] : note.invitation
  const forumUrl = forumId
    ? `/forum?id=${forumId}${id && id !== forum ? `&noteId=${id}` : ''}`
    : '/'
  const title = isV2Note
    ? (content?.title?.value ?? details.forumContent?.title?.value)
    : content.title || buildNoteTitle(invitation, signatures)
  const truncatedTitle = title
    ? truncate(title, { length: 50, separator: /,? +/ })
    : 'No Title'
  return (
    <Link href={forumUrl} title="Venue Homepage">
      <img className="icon" src="/images/arrow_left.svg" alt="back arrow" />
      Back to forum for <strong>{truncatedTitle}</strong>
    </Link>
  )
}

/**
 * Builds group edit/view button
 */
export function groupModeToggle(mode, groupId) {
  if (!['edit', 'view', 'info', 'revisions'].includes(mode)) return null

  const buttonText = ['view', 'info', 'revisions'].includes(mode) ? 'Edit' : 'View'
  const buttonUrl = `${buttonText === 'Edit' ? '/group/edit' : '/group'}?id=${groupId}`
  return (
    <span>
      Currently showing group in {upperFirst(mode)} mode{' '}
      <Link href={buttonUrl} className="btn btn-xs btn-primary toggle-mode">
        {buttonText} Group
      </Link>
    </span>
  )
}

/**
 * Builds invitation edit/view button
 */
export function invitationModeToggle(mode, invitationId) {
  if (!['edit', 'view', 'info', 'revisions'].includes(mode)) return null

  const buttonText = ['view', 'info', 'revisions'].includes(mode) ? 'Edit' : 'View'
  const buttonUrl = `${
    buttonText === 'Edit' ? '/invitation/edit' : '/invitation'
  }?id=${invitationId}`
  return (
    <span>
      Currently showing invitation in {upperFirst(mode)} mode{' '}
      <Link href={buttonUrl} className="btn btn-xs btn-primary toggle-mode">
        {buttonText} Invitation
      </Link>
    </span>
  )
}
