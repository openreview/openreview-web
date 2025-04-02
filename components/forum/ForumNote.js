/* globals $, promptError, view2, DOMPurify: false */

import React, { useState } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import NoteEditor from '../NoteEditor'
import { NoteAuthorsV2 } from '../NoteAuthors'
import { NoteContentV2 } from '../NoteContent'
import Icon from '../Icon'
import { prettyId, prettyInvitationId, forumDate, classNames } from '../../lib/utils'
import getLicenseInfo from '../../lib/forum-utils'
import ToggleButton from '../EditorComponents/ToggleButton'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import { isSuperUser } from '../../lib/auth'

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
      />
      <ForumTags
        loadedTags={note.details?.tags}
        tagInvitations={tagInvitations}
        forumId={note.id}
      />
    </div>
  )
}

function ForumTag({ tagInvitation, tag, forumId, profileId }) {
  const { enum: enumValues } = tagInvitation.tag?.label?.param ?? {}
  const [existingTag, setExistingTag] = useState(tag)
  const [isLoading, setIsLoading] = useState(false)

  function mapLabelToValue(label) {
    if (!label) return false
    if (label === enumValues[0]) return true
    if (label === enumValues[1]) return false
    return false
  }

  const tagValue = mapLabelToValue(existingTag?.label)

  const handleTagChange = async (value) => {
    setIsLoading(true)
    const newLabel = value ? enumValues[0] : enumValues[1]
    try {
      const result = await api.post('/tags', {
        id: existingTag ? existingTag.id : undefined,
        forum: forumId,
        note: forumId,
        signature: existingTag ? existingTag.signature : profileId,
        invitation: tagInvitation.id,
        label: newLabel,
      })
      setExistingTag(result)
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  return (
    <ToggleButton
      value={tagValue}
      trueLabel={enumValues[0]}
      falseLabel={enumValues[1]}
      onChange={handleTagChange}
      isLoading={isLoading}
    />
  )
}

const ForumTags = ({ loadedTags, tagInvitations, forumId }) => {
  const { user } = useUser()
  if (!tagInvitations?.length) return null
  return (
    <div className="forum-tags">
      {tagInvitations.map((p) => {
        const tagsOfInvitation = loadedTags?.filter((q) => q.invitation === p.id)
        const { enum: enumValues } = p.tag?.label?.param ?? {}
        return (
          <React.Fragment key={p.id}>
            <ForumTag
              key={p.id}
              tagInvitation={p}
              tag={tagsOfInvitation?.[0]}
              forumId={forumId}
              profileId={user?.profile?.id}
            />
            {isSuperUser(user) && (
              <div className="forum-tag-stats">
                <Icon name="stats" extraClasses="mr-2" />
                {enumValues.map((label) => {
                  const count = tagsOfInvitation?.filter((q) => q.label === label).length
                  return (
                    <a
                      href={`${process.env.API_V2_URL}/tags?invitation=${p.id}&label=${label}`}
                      target="_blank"
                      key={label}
                      className="mr-2"
                    >
                      {label} {count}
                    </a>
                  )
                })}
              </div>
            )}
          </React.Fragment>
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
