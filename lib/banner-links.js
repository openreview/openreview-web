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
  const modeParam = mode ? `&mode=${mode}` : ''
  const pageType = mode === 'edit' ? 'group page' : 'homepage'
  const url = groupId ? `/group?id=${groupId}${modeParam}` : '/'

  return (
    <Link href={url}>
      <a title="Venue Homepage">
        <img className="icon" src="/images/arrow_left.svg" alt="back arrow" />
        Go to <strong>{prettyId(groupId)}</strong> {pageType}
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
        {backText} <strong>{referrerText}</strong>
      </a>
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
    ? content.title?.value ?? details.forumContent?.title?.value
    : content.title || buildNoteTitle(invitation, signatures)
  const truncatedTitle = title
    ? truncate(title, { length: 50, separator: /,? +/ })
    : 'No Title'
  return (
    <Link href={forumUrl}>
      <a title="Venue Homepage">
        <img className="icon" src="/images/arrow_left.svg" alt="back arrow" />
        Back to forum for <strong>{truncatedTitle}</strong>
      </a>
    </Link>
  )
}

/**
 * Builds profile edit/view button
 */
export function profileModeToggle(mode) {
  if (mode !== 'edit' && mode !== 'view') return null

  const buttonText = mode === 'view' ? 'Edit' : 'View'
  const buttonUrl = mode === 'view' ? '/profile/edit' : '/profile'
  return (
    <span>
      Currently showing your profile in {upperFirst(mode)} mode. Switch to {buttonText} mode:{' '}
      <Link href={buttonUrl}>
        <a className="btn btn-xs btn-primary toggle-mode">{buttonText} Profile</a>
      </Link>
    </span>
  )
}

/**
 * Builds group edit/view button
 */
export function groupModeToggle(mode, groupId) {
  if (mode !== 'edit' && mode !== 'view' && mode !== 'info') return null

  const buttonText = mode === 'view' || mode === 'info' ? 'Edit' : 'View'
  const buttonUrl = `${buttonText === 'Edit' ? '/group/edit' : '/group'}?id=${groupId}`
  return (
    <span>
      Currently showing group in {upperFirst(mode)} mode{' '}
      <Link href={buttonUrl}>
        <a className="btn btn-xs btn-primary toggle-mode">{buttonText} Group</a>
      </Link>
    </span>
  )
}

/**
 * Builds invitation edit/view button
 */
export function invitationModeToggle(mode, invitationId) {
  if (mode !== 'edit' && mode !== 'view' && mode !== 'info') return null

  const buttonText = mode === 'view' || mode === 'info' ? 'Edit' : 'View'
  const buttonUrl = `${
    buttonText === 'Edit' ? '/invitation/edit' : '/invitation'
  }?id=${invitationId}`
  return (
    <span>
      Currently showing invitation in {upperFirst(mode)} mode{' '}
      <Link href={buttonUrl}>
        <a className="btn btn-xs btn-primary toggle-mode">{buttonText} Invitation</a>
      </Link>
    </span>
  )
}

/**
 * Builds link based on url and text
 *
 * @param {string} text - text to show
 * @param {string} url - link to go to
 */
export function generalLink(text, url) {
  return (
    <Link href={url}>
      <a>
        <strong>{text}</strong>
      </a>
    </Link>
  )
}
