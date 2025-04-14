/* globals $, promptLogin, promptError, view2, DOMPurify: false */

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { countBy, orderBy } from 'lodash'
import NoteEditor from '../NoteEditor'
import { NoteAuthorsV2 } from '../NoteAuthors'
import { NoteContentV2 } from '../NoteContent'
import Icon from '../Icon'
import {
  prettyId,
  prettyInvitationId,
  forumDate,
  classNames,
  formatDateTime,
  inflect,
} from '../../lib/utils'
import getLicenseInfo from '../../lib/forum-utils'
import api from '../../lib/api-client'
import CheckableTag from '../CheckableTag'
import useUser from '../../hooks/useUser'

dayjs.extend(relativeTime)

function ForumNote({ note, updateNote, deleteOrRestoreNote }) {
  const {
    id,
    content,
    details,
    signatures,
    editInvitations,
    deleteInvitation,
    tagInvitations,
  } = note

  const pastDue = note.ddate && note.ddate < Date.now()
  // eslint-disable-next-line no-underscore-dangle
  const texDisabled = !!content?._disableTexRendering?.value

  const [activeInvitation, setActiveInvitation] = useState(null)
  const [activeNote, setActiveNote] = useState(null)

  const canShowIcon = (fieldName) => {
    if (!content?.[fieldName]?.value) return null

    const fieldReaders = Array.isArray(content?.[fieldName].readers)
      ? content[fieldName].readers.sort()
      : null
    if (
      !fieldReaders ||
      (note.sortedReaders && fieldReaders.every((p, j) => p === note.sortedReaders[j]))
    ) {
      return content[fieldName].value
    }
    return null
  }

  const openNoteEditor = (invitation, options) => {
    if (activeInvitation) {
      setActiveInvitation(null)
      setActiveNote(null)
      return
    }

    let noteToEdit
    if (options?.original) {
      noteToEdit = note.details?.original
    } else if (options?.revision) {
      noteToEdit = invitation.details?.repliedNotes?.[0]
      if (noteToEdit) {
        // Include both the referent and the note id so the API doesn't create a new reference
        noteToEdit = { ...noteToEdit, updateId: noteToEdit.id }
        noteToEdit.updateId = noteToEdit.id
      }
    }
    setActiveNote(noteToEdit ?? note)
    setActiveInvitation(activeInvitation ? null : invitation)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeNoteEditor = () => {
    setActiveInvitation(null)
    setActiveNote(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (activeInvitation) {
    return (
      <div className="forum-note">
        <NoteEditor
          note={activeNote}
          invitation={activeInvitation}
          closeNoteEditor={closeNoteEditor}
          onNoteCreated={updateNote}
        />
      </div>
    )
  }

  return (
    <div
      className={classNames(
        'forum-note',
        pastDue && 'trashed',
        texDisabled && 'disable-tex-rendering'
      )}
    >
      <ForumTitle
        id={id}
        title={DOMPurify.sanitize(content?.title?.value)}
        pdf={canShowIcon('pdf')}
        html={canShowIcon('html')}
      />

      <div className="forum-authors mb-2">
        <h3>
          <NoteAuthorsV2
            authors={content?.authors}
            authorIds={content?.authorids}
            signatures={signatures}
            noteReaders={note.readers}
          />
        </h3>
      </div>

      <ForumOtherVersions paperHash={content?.paperhash?.value} forumId={id} />

      <div className="clearfix mb-1">
        <ForumMeta note={note} />

        <div className="invitation-buttons">
          {editInvitations?.length > 0 && !pastDue && (
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-xs dropdown-toggle"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Edit &nbsp;
                <span className="caret" />
              </button>
              <ul className="dropdown-menu">
                {editInvitations?.map((invitation) => {
                  const expired = invitation.expdate < Date.now()
                  return (
                    <li
                      key={invitation.id}
                      className={expired ? 'expired' : ''}
                      data-toggle="tooltip"
                      data-placement="top"
                      title={
                        expired
                          ? `${prettyInvitationId(invitation.id)} expired ${dayjs(invitation.expdate).fromNow()}`
                          : ''
                      }
                    >
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <a
                        href="#"
                        data-id={invitation.id}
                        onClick={(e) => {
                          e.preventDefault()
                          openNoteEditor(invitation)
                        }}
                      >
                        {prettyInvitationId(invitation.id)}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {deleteInvitation && (
            <button
              type="button"
              className="btn btn-xs"
              onClick={() => {
                deleteOrRestoreNote(note, deleteInvitation, updateNote)
              }}
            >
              <Icon
                name={`${pastDue ? 'repeat' : 'trash'}`}
                tooltip={prettyInvitationId(deleteInvitation.id)}
              />
            </button>
          )}
        </div>
      </div>

      <NoteContentV2
        id={id}
        content={content}
        number={
          note.invitations[0].split('/-/')[1].includes('Submission') ? note.number : null
        }
        presentation={details.presentation}
        noteReaders={note.sortedReaders}
        omit={[canShowIcon('pdf') ? 'pdf' : null, canShowIcon('html') ? 'html' : null].filter(
          Boolean
        )}
        externalID={note.externalId}
      />
      <ForumTags
        loadedTags={note.details?.tags}
        tagInvitations={tagInvitations?.filter((p) => !p.id.endsWith('/Chat_Reaction'))}
        forumId={note.id}
      />
    </div>
  )
}

function ForumTag({ label, tagInvitation, hasTag, count, forumId, profileId, accessToken }) {
  const [existingTag, setExistingTag] = useState(hasTag)
  const [rawCount, setRawCount] = useState(count ?? 0)
  const [isLoading, setIsLoading] = useState(false)
  const { tag: tagText, noTag: noTagText } = tagInvitation?.content?.presentation?.value ?? {}
  const isDeletedTag = existingTag?.ddate

  const handleTagClick = async () => {
    if (!accessToken) {
      promptLogin()
      return
    }
    if (isLoading) return

    setIsLoading(true)
    try {
      const result = await api.post(
        '/tags',
        {
          id: existingTag ? existingTag.id : undefined,
          ...(existingTag && { ddate: isDeletedTag ? { delete: true } : Date.now() }),
          forum: forumId,
          note: forumId,
          signature: profileId,
          invitation: tagInvitation.id,
        },
        { accessToken }
      )
      setRawCount((prevCount) =>
        existingTag && !isDeletedTag ? prevCount - 1 : prevCount + 1
      )
      setExistingTag(result)
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  if (!label) return null

  return (
    <>
      <CheckableTag
        label={label}
        tagText={tagText}
        noTagText={noTagText}
        rawCount={rawCount}
        checked={existingTag && !isDeletedTag}
        onChange={handleTagClick}
      />
    </>
  )
}

const ForumTags = ({ loadedTags, tagInvitations, forumId }) => {
  const { user, accessToken } = useUser()
  if (!tagInvitations?.length) return null

  const tagsCountByLabel = countBy(loadedTags, (p) => p.label)
  return (
    <div className="forum-tags">
      {tagInvitations.map((p) => {
        const tagInvitationLabel = p.tag?.label
        const count = tagsCountByLabel[tagInvitationLabel]
        const tagsOfInvitation = loadedTags?.filter(
          (q) => q.invitation === p.id && q.signature === user?.profile?.id
        )

        return (
          <ForumTag
            key={p.id}
            label={tagInvitationLabel}
            tagInvitation={p}
            hasTag={tagsOfInvitation?.[0]}
            count={count}
            forumId={forumId}
            profileId={user?.profile?.id}
            accessToken={accessToken}
          />
        )
      })}
    </div>
  )
}

const ForumOtherVersions = ({ paperHash, forumId }) => {
  const [otherVersionNotes, setOtherVersionNotes] = useState([])
  const [showLinks, setShowLinks] = useState(false)
  const { accessToken } = useUser()

  const loadNotesByPaperHash = async () => {
    try {
      const { notes } = await api.get('/notes', { paperhash: paperHash }, { accessToken })

      if (notes.length > 1) {
        setOtherVersionNotes(
          orderBy(
            notes.filter((p) => p.id !== forumId),
            'mdate',
            'desc'
          )
        )
      }
    } catch (error) {
      /* empty */
    }
  }
  useEffect(() => {
    if (!paperHash) return
    loadNotesByPaperHash()
  }, [forumId])

  if (!otherVersionNotes?.length) return null

  return (
    <div className="forum-other-versions">
      <span className="view-versions-link" onClick={() => setShowLinks(!showLinks)}>
        View other {inflect(otherVersionNotes.length, 'version', 'versions', true)}
      </span>
      {showLinks &&
        otherVersionNotes.map((note) => {
          const lastModifiedDate = formatDateTime(note.mdate)
          return (
            <div key={note.id}>
              <a href={`/forum?id=${note.id}`} target="_blank" rel="noopener noreferrer">
                <span>{prettyId(note.id)} </span>
              </a>
              <span>last modified: {lastModifiedDate}</span>
            </div>
          )
        })}
    </div>
  )
}

function ForumTitle({ id, title, pdf, html }) {
  return (
    <div className="forum-title mt-2 mb-2">
      <h2 className="citation_title">{title}</h2>

      {pdf && (
        <div className="forum-content-link">
          <a
            className={pdf.startsWith('http') ? null : 'citation_pdf_url'}
            href={pdf.startsWith('http') ? pdf : `/pdf?id=${id}`}
            title="Download PDF"
            target="_blank"
            rel="noreferrer"
          >
            <img src="/images/pdf_icon_blue.svg" alt="Download PDF" />
          </a>
        </div>
      )}
      {html && (
        <div className="forum-content-link">
          <a href={html} title="Open Website" target="_blank" rel="noopener noreferrer">
            <img src="/images/html_icon_blue.svg" alt="Open Webpage" />
          </a>
        </div>
      )}
    </div>
  )
}

function ForumMeta({ note }) {
  const licenseInfo = getLicenseInfo(note.license)

  return (
    <div className="forum-meta">
      <span className="date item">
        <Icon name="calendar" />
        {forumDate(
          note.cdate,
          note.tcdate,
          note.mdate,
          note.tmdate,
          note.content?.year?.value,
          note.pdate,
          false
        )}
      </span>

      <span className="item">
        <Icon name="folder-open" />
        {note.content?.venue?.value || prettyId(note.invitations[0])}
      </span>

      {note.readers && (
        <span
          className="readers item"
          data-toggle="tooltip"
          data-placement="top"
          title={`Visible to <br/>${note.readers.join(',<br/>')}${
            note.odate ? `<br/>since ${forumDate(note.odate)}` : ''
          }`}
        >
          <Icon name="eye-open" />
          {note.readers.map((reader) => prettyId(reader, true)).join(', ')}
        </span>
      )}

      {note.tmdate !== note.tcdate && (
        <span className="item">
          <Icon name="duplicate" />
          <Link href={`/revisions?id=${note.id}`}>Revisions</Link>
        </span>
      )}

      {/* eslint-disable-next-line no-underscore-dangle */}
      {note.content?._bibtex?.value && (
        <span className="item">
          <Icon name="bookmark" />
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            data-target="#bibtex-modal"
            data-toggle="modal"
            // eslint-disable-next-line no-underscore-dangle
            data-bibtex={encodeURIComponent(note.content._bibtex.value)}
          >
            BibTeX
          </a>
        </span>
      )}

      {note.license && (
        <span className="item">
          <Icon name="copyright-mark" />
          {licenseInfo ? (
            <a
              href={licenseInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Licensed under ${licenseInfo.fullName}`}
              data-toggle="tooltip"
              data-placement="top"
            >
              {note.license}
            </a>
          ) : (
            note.license
          )}
        </span>
      )}
    </div>
  )
}

export default ForumNote
