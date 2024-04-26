/* globals promptError,DOMPurify,marked,MathJax: false */

import { useEffect, useState } from 'react'
import uniqBy from 'lodash/uniqBy'
import truncate from 'lodash/truncate'
import flatten from 'lodash/flatten'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId, prettyInvitationId } from '../../lib/utils'
import { readersList, getSignatureColors } from '../../lib/forum-utils'

import styles from '../../styles/components/ChatEditorForm.module.scss'

export default function ChatEditorForm({
  invitation,
  forumId,
  replyToNote,
  setReplyToNote,
  showNotifications,
  setShowNotifications,
  onSubmit,
}) {
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState(null)
  const [signatureOptions, setSignatureOptions] = useState([])
  const [showSignatureDropdown, setShowSignatureDropdown] = useState(false)
  const [showMessagePreview, setShowMessagePreview] = useState(false)
  const [notificationPermissions, setNotificationPermissions] = useState('loading')
  const [sanitizedHtml, setSanitizedHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, accessToken } = useUser()

  const tabName = document.querySelector('.filter-tabs > li.active > a')?.text
  const invitationShortName = prettyInvitationId(invitation.id)
  const hasFixedReaders = Array.isArray(invitation.edit.note.readers)
  const colorHash = signature ? getSignatureColors(prettyId(signature, true)) : 'transparent'

  const loadSignatureOptions = async () => {
    try {
      const fieldDescription = invitation.edit.signatures
      let options = []
      if (fieldDescription.param.enum) {
        options = fieldDescription.param.enum
      } else if (fieldDescription.param.items) {
        options = fieldDescription.param.items
          .map((item) => item.value ?? item.prefix)
          .filter(Boolean)
      }
      const optionsP = options.map((p) => {
        const params = p.includes('.*')
          ? { prefix: p, signatory: user?.id }
          : { id: p, signatory: user?.id }
        return api
          .get('/groups', params, { accessToken })
          .then((result) => result.groups ?? [])
      })
      const groupResults = await Promise.all(optionsP)

      const uniqueGroupResults = uniqBy(flatten(groupResults), 'id')
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
      promptError(err.message, { scrollToTop: false })
    }
  }

  const postNoteEdit = (e) => {
    e.preventDefault()
    if (!message || loading) return

    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setLoading(true)

    // TODO: construct this edit in a more general way
    const noteEdit = {
      invitation: invitation.id,
      signatures: [signature],
      note: {
        replyto: replyToNote?.id || forumId,
        content: {
          message: {
            value: trimmedMessage,
          },
        },
      },
    }

    api
      .post('/notes/edits', noteEdit, { accessToken })
      .then((result) => {
        setMessage('')
        setReplyToNote(null)
        setShowMessagePreview(false)
        setShowSignatureDropdown(false)

        if (!onSubmit) return

        // Scroll chat to the bottom so new message is visible
        const containerElem = document.querySelector('#forum-replies .rc-virtual-list-holder')
        if (containerElem) {
          containerElem.scrollTop = containerElem.scrollHeight
        }

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
            { accessToken }
          )
          .then((noteRes) => {
            onSubmit(noteRes.notes?.length > 0 ? noteRes.notes[0] : constructedNote)
            setLoading(false)
          })
          .catch(() => {
            onSubmit(constructedNote)
            setLoading(false)
          })
      })
      .catch((err) => {
        promptError(err.message, { scrollToTop: false })
        setLoading(false)
      })
  }

  const getNotificationState = () => {
    if (!('Notification' in window)) {
      return Promise.resolve('denied')
    }
    if (navigator.permissions) {
      return navigator.permissions
        .query({ name: 'notifications' })
        .then((result) => result.state)
    }
    return Promise.resolve(Notification.permission)
  }

  useEffect(() => {
    if (!invitation) return

    loadSignatureOptions()
    getNotificationState().then((state) => {
      // Can be 'granted', 'denied', or 'prompt'
      setNotificationPermissions(state)
    })
  }, [invitation])

  useEffect(() => {
    if (!showMessagePreview) return

    setSanitizedHtml(DOMPurify.sanitize(marked(message)))
    try {
      MathJax.typesetPromise()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Could not format math notation')
    }
  }, [showMessagePreview, message])

  return (
    <form
      onSubmit={postNoteEdit}
      style={{ backgroundColor: `${colorHash}1E` }}
      className={styles.container}
    >
      {replyToNote && (
        <div className="parent-info">
          <h5 onClick={() => {}}>
            {/* <Icon name="share-alt" />{' '} */}
            <span>Replying to {prettyId(replyToNote.signatures[0], true)}</span>
            {' – '}
            {truncate(
              replyToNote.content.message?.value ||
                replyToNote.content.title?.value ||
                replyToNote.generatedTitle,
              {
                length: 100,
                omission: '...',
                separator: ' ',
              }
            )}
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
            onChange={(e) => {
              setSignature(e.value)
              setShowSignatureDropdown(false)
            }}
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
              setShowMessagePreview(false)
              setShowSignatureDropdown(true)
            }}
          >
            <Icon name="pencil" /> Change
          </a>
        )}
      </div>

      <div className="form-group">
        {showMessagePreview ? (
          <div
            className="preview markdown-rendered"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          <textarea
            name="message"
            className="form-control"
            placeholder={`Type a new message ${tabName ? `to ${tabName}` : ''}...`}
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey === true) {
                postNoteEdit(e)
              }
            }}
          />
        )}
      </div>

      <div className="d-flex">
        <div className="readers-container">
          {hasFixedReaders && (
            <p className="mb-0 text-muted">
              <Icon name="eye-open" extraClasses="pr-1" />{' '}
              <em>
                {invitationShortName} replies are only visible to{' '}
                {readersList(invitation.edit.note.readers)}
              </em>
            </p>
          )}
        </div>
        <div className="buttons-container">
          {'Notification' in window && (
            <div className="custom-switch custom-control">
              <input
                id="notifications-toggle"
                type="checkbox"
                className="custom-control-input"
                value="notify"
                checked={showNotifications && notificationPermissions === 'granted'}
                onChange={(e) => {
                  if (
                    notificationPermissions === 'denied' ||
                    notificationPermissions === 'loading'
                  ) {
                    return
                  }

                  if (!showNotifications) {
                    if (notificationPermissions === 'prompt') {
                      Notification.requestPermission().then((permission) => {
                        setNotificationPermissions(permission)
                        setShowNotifications(true)
                      })
                    } else {
                      // Notification permission is already granted
                      setShowNotifications(true)
                    }
                  } else {
                    setShowNotifications(false)
                  }
                }}
              />
              <label className="custom-control-label" htmlFor="notifications-toggle">
                Notifications
              </label>
            </div>
          )}

          <button
            type="button"
            className="btn btn-sm btn-default mr-2"
            onClick={(e) => {
              e.preventDefault()
              setShowMessagePreview((prev) => !prev)
              setShowSignatureDropdown(false)
            }}
            disabled={!message || !message.trim()}
          >
            {showMessagePreview ? 'Edit' : 'Preview'}
            {/* <SvgIcon name="markdown" /> */}
          </button>

          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={!message || !message.trim() || loading}
          >
            Post {invitationShortName}
            {/* <Icon name="send" /> */}
          </button>
        </div>
      </div>
    </form>
  )
}
