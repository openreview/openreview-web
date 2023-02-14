/* globals promptError: false */

import { useEffect, useState } from 'react'
import uniq from 'lodash/uniq'
import flatten from 'lodash/flatten'
import MarkdownPreviewTab from '../MarkdownPreviewTab'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId, prettyInvitationId } from '../../lib/utils'

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
  const { user, accessToken } = useUser()

  const tabName = document.querySelector('.filter-tabs > li.active > a')?.text

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

      setSignatureOptions(
        uniqueGroupResults.map((p) => {
          let label = prettyId(p.id, true)
          if (!p.id.startsWith('~') && p.members?.length === 1) {
            label = `${label} (${prettyId(p.members[0])})`
          }
          return { label, value: p.id }
        })
      )
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

  return (
    <form onSubmit={postNoteEdit}>
      {replyToNote && (
        <div className="reply-details">
          <Icon name="share-alt" /> Replying to {prettyId(replyToNote.signatures[0])}{' '}
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
        </div>
      )}
      <div className="form-group">
        <MarkdownPreviewTab
          value={message}
          onValueChanged={setMessage}
          placeholder={`Type a new message ${tabName ? `to ${tabName}` : ''}...`}
          rows={2}
        />
        {/*
        <textarea
          name="message"
          className="form-control"
          placeholder={`Type a new message ${tabName ? `to ${tabName}` : ''}...`}
          rows="2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        */}
      </div>
      <div className="clearfix">
        <div className="signatures-container pull-left">
          <Dropdown
            options={signatureOptions}
            onChange={(e) => setSignature(e.value)}
            value={signatureOptions.find((p) => p.value === signature)}
            placeholder="Signature"
          />
        </div>
        <div className="pull-right">
          <button type="submit" className="btn btn-primary">
            Post {prettyInvitationId(invitation.id)}
            {/* <Icon name="send" /> */}
          </button>
        </div>
      </div>
    </form>
  )
}
