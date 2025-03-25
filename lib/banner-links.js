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
 * Builds profile edit button
 */
export function profileModeToggle(mode) {
  if (mode !== 'view') return null

  return (
    <span>
      Currently showing your profile in View mode. Switch to Edit mode:{' '}
      <Link href="/profile/edit" className="btn btn-xs btn-primary toggle-mode">
        Edit Profile
      </Link>
    </span>
  )
}

/**
 * Builds group edit/view button
 */
export function groupModeToggle(mode, groupId, showEditMode = false) {
  let buttonUrl = null
  let buttonText = null
  switch (mode) {
    case 'view':
      // go to info mode
      buttonUrl = `/group/info?id=${groupId}`
      buttonText = 'Edit Group Info'
      break
    case 'info':
      // go to edit mode
      buttonUrl = showEditMode ? `/group/edit?id=${groupId}` : `/group?id=${groupId}`
      buttonText = showEditMode ? 'Edit Group' : 'View Group'
      break
    case 'edit':
      // go to view mode
      buttonUrl = `/group?id=${groupId}`
      buttonText = 'View Group'
      break
    case 'revisions':
      buttonUrl = `/group/info?id=${groupId}`
      buttonText = 'Edit Group Info'
      break
    default:
      break
  }

  if (!buttonUrl) return null
  return (
    <span>
      Currently showing group in {upperFirst(mode)} mode{' '}
      <Link href={buttonUrl} className="btn btn-xs btn-primary toggle-mode">
        {buttonText}
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

/**
 * Builds link based on url and text
 *
 * @param {string} text - text to show
 * @param {string} url - link to go to
 */
export function generalLink(text, url) {
  return (
    <Link href={url}>
      <strong>{text}</strong>
    </Link>
  )
}
