import Link from 'next/link'
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
  const { forum, id, signatures, content } = note
  const isV2Note = note.version === 2
  const invitation = isV2Note ? note.invitations[0] : note.invitation
  const forumUrl = forum ? `/forum?id=${forum}${id && id !== forum ? `&noteId=${id}` : ''}` : '/'
  const title = isV2Note
    ? content.title.value
    : content.title || buildNoteTitle(invitation, signatures)
  const truncatedTitle = title ? truncate(title, { length: 50, separator: /,? +/ }) : 'No Title'

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
 * Builds profile edit button
 */
export function editProfileLink() {
  return (
    <span>
      Currently showing your profile in View mode. To switch to Edit mode click here:
      <Link href="/profile/edit">
        <a className="btn btn-xs btn-primary toggle-profile-mode">Edit Profile</a>
      </Link>
    </span>
  )
}

/**
 * Builds profile view button
 */
export function viewProfileLink() {
  return (
    <span>
      Currently showing your profile in Edit mode. To switch to View mode click here:
      <Link href="/profile">
        <a className="btn btn-xs btn-primary toggle-profile-mode">View Profile</a>
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
