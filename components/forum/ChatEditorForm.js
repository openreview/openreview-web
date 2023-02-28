/* globals promptError,DOMPurify,marked,MathJax: false */

import { useEffect, useState } from 'react'
import uniq from 'lodash/uniq'
import truncate from 'lodash/truncate'
import flatten from 'lodash/flatten'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId, prettyInvitationId } from '../../lib/utils'
import { readersList, getInvitationColors } from '../../lib/forum-utils'

export default function ChatEditorForm({
  invitation,
  forumId,
  replyToNote,
  setReplyToNote,
  onSubmit,
}) {
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState(null)
  const [signatureOptions, setSignatureOptions] = useState([])
  const [showSignatureDropdown, setShowSignatureDropdown] = useState(false)
  const [showMessagePreview, setShowMessagePreview] = useState(false)
  const [sanitizedHtml, setSanitizedHtml] = useState('')
  const { user, accessToken } = useUser()

  const tabName = document.querySelector('.filter-tabs > li.active > a')?.text
  const invitationShortName = prettyInvitationId(invitation.id)
  const hasFixedReaders = Array.isArray(invitation.edit.note.readers)
  const colorHash = signature
    ? getInvitationColors(prettyId(signature, true)).backgroundColor
    : 'transparent'

  const loadSignatureOptions = async () => {
    try {
      const options = invitation.edit.signatures.param.enum
      const optionsP = options.map((p) => {
        const params = p.includes('.*')
          ? { prefix: p, signatory: user?.id }
          : { id: p, signatory: user?.id }
        return api
          .get('/groups', params, { accessToken, version: 2 })
          .then((result) => result.groups ?? [])
      })
      const groupResults = await Promise.all(optionsP)
      const uniqueGroupResults = uniq(flatten(groupResults))
      const sigOptions = uniqueGroupResults.map((p) => {
        let label = prettyId(p.id, true)
        if (!p.id.startsWith('~') && p.members?.length === 1) {
          label = `${label} (${prettyId(p.members[0])})`
        }
        return { label, value: p.id }
      })

      setSignatureOptions(sigOptions)
      setSignature(sigOptions[0]?.value)
    } catch (err) {
      promptError(err.message)
    }
  }

  const postNoteEdit = (e) => {
    e.preventDefault()

    // TODO: construct this edit in a more general way
    const noteEdit = {
      invitation: invitation.id,
      signatures: [signature],
      note: {
        replyto: replyToNote?.id || forumId,
        content: {
          message: {
            value: message,
          },
        },
      },
    }

    api
      .post('/notes/edits', noteEdit, { accessToken, version: 2 })
      .then((result) => {
        setMessage('')
        setReplyToNote(null)
        setShowMessagePreview(false)
        setShowSignatureDropdown(false)

        if (!onSubmit) return

        const constructedNote = {
          ...result.note,
          invitations: [invitation.id],
          details: { invitation, writable: true },
        }

        // Try to get the complete note, since edit does not contain all fields.
        // If it cannot be retrieved, use the note constructed from the edit response.
        api
          .get(
            '/notes',
            { id: result.note.id, details: 'invitation,presentation,writable' },
            { accessToken, version: 2 }
          )
          .then((noteRes) => {
            onSubmit(noteRes.notes?.length > 0 ? noteRes.notes[0] : constructedNote)
          })
          .catch(() => {
            onSubmit(constructedNote)
          })
      })
      .catch((err) => {
        promptError(err.message)
      })
  }

  useEffect(() => {
    if (!invitation) return

    loadSignatureOptions()
  }, [invitation])

  useEffect(() => {
    if (!showMessagePreview) return

    setSanitizedHtml(DOMPurify.sanitize(marked(message)))
    MathJax.typesetPromise()
  }, [showMessagePreview, message])

  return (
    <form onSubmit={postNoteEdit} style={{ boxShadow: `0 0 0 2px ${colorHash}` }}>
      {replyToNote && (
        <div className="parent-info">
          <h5 onClick={() => {}}>
            {/* <Icon name="share-alt" />{' '} */}
            <span>Replying to {prettyId(replyToNote.signatures[0], true)}</span>
            {' – '}
            {truncate(replyToNote.content.message?.value || replyToNote.content.title?.value, {
              length: 100,
              omission: '...',
              separator: ' ',
            })}
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              href="#"
              className="pl-3"
              role="button"
              onClick={(e) => {
                e.preventDefault()
                setReplyToNote(null)
              }}
            >
              <Icon name="remove" /> Cancel
            </a>
          </h5>
        </div>
      )}

      <div className="form-group signatures-container">
        {showSignatureDropdown ? (
          <Dropdown
            options={signatureOptions}
            onChange={(e) => setSignature(e.value)}
            value={signatureOptions.find((p) => p.value === signature)}
            placeholder="Signature"
            height={32}
            isSearchable={true}
          />
        ) : (
          <>
            <span className="indicator" style={{ backgroundColor: colorHash }} />
            <strong>{prettyId(signature, true)}</strong>
          </>
        )}
        {signatureOptions.length > 1 && !showSignatureDropdown && (
          // eslint-disable-next-line jsx-a11y/anchor-is-valid
          <a
            href="#"
            className="pl-3"
            role="button"
            onClick={(e) => {
              e.preventDefault()
              setShowSignatureDropdown(true)
            }}
          >
            <Icon name="pencil" /> Change
          </a>
        )}
      </div>

      <div className="form-group">
        {showMessagePreview ? (
          <div className="preview markdown-rendered" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        ) : (
          <textarea
            name="message"
            className="form-control"
            placeholder={`Type a new message ${tabName ? `to ${tabName}` : ''}...`}
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        )}
      </div>

      <div className="clearfix">
        <div className="readers-container pull-left">
          {hasFixedReaders && (
            <p className="mb-0 text-muted">
              <Icon name="eye-open" extraClasses="pr-1" />{' '}
              <em>
                {invitationShortName} replies are visible only to{' '}
                {readersList(invitation.edit.note.readers, 'short')}
              </em>
            </p>
          )}
        </div>
        <div className="pull-right">
          <button
            type="button"
            className="btn btn-sm btn-default mr-2"
            onClick={(e) => {
              e.preventDefault()
              setShowMessagePreview((prev) => !prev)
              setShowSignatureDropdown(false)
            }}
            disabled={!message}
          >
            {showMessagePreview ? 'Edit' : 'Preview'}
            {/* <SvgIcon name="markdown" /> */}
          </button>
          <button type="submit" className="btn btn-sm btn-primary">
            Post {invitationShortName}
            {/* <Icon name="send" /> */}
          </button>
        </div>
      </div>
    </form>
  )
}
