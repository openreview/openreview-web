/* globals DOMPurify,marked,$,promptError,promptMessage: false */
import React, { useState } from 'react'
import get from 'lodash/get'
import BasicModal from '../BasicModal'
import MarkdownPreviewTab from '../MarkdownPreviewTab'
import api from '../../lib/api-client'
import { isValidEmail, prettyId } from '../../lib/utils'

const MessageMemberModal = ({
  groupId,
  domainId,
  groupDomainContent,
  membersToMessage,
  setJobId,
  messageMemberInvitation,
}) => {
  const [subject, setSubject] = useState(`Message to ${prettyId(groupId)}`)
  const [replyToEmail, setReplyToEmail] = useState(
    messageMemberInvitation?.message.replyTo ?? groupDomainContent?.contact?.value ?? ''
  )
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const sendMessage = async () => {
    setSubmitting(true)
    setError(null)
    const sanitizedMessage = DOMPurify.sanitize(message)
    const cleanReplytoEmail = replyToEmail.trim()

    if (!subject || !sanitizedMessage) {
      setError('Email Subject and Body are required to send messages.')
      setSubmitting(false)
      return
    }

    if (cleanReplytoEmail && !isValidEmail(cleanReplytoEmail)) {
      setError('Reply to email is invalid.')
      setSubmitting(false)
      return
    }

    const skipCheckNewMembers =
      membersToMessage.length === 1 && membersToMessage[0] === groupId
    // Reload group to make sure members haven't been removed since the modal was opened
    if (!skipCheckNewMembers) {
      try {
        const apiRes = await api.get('/groups', { id: groupId, select: 'members' })
        const newMembers = get(apiRes, 'groups.0.members', [])
        if (!membersToMessage.every((p) => newMembers.includes(p))) {
          throw new Error(
            'The members of this group, including members selected below, have changed since the page was opened. Please reload the page and try again.'
          )
        }
      } catch (e) {
        setError(e.message)
        setSubmitting(false)
        return
      }
    }

    try {
      const result = await api.post(
        '/messages',
        messageMemberInvitation
          ? {
              subject,
              message: sanitizedMessage,
              groups: membersToMessage,
              invitation: messageMemberInvitation.id,
              signature: messageMemberInvitation.message.signature,
              ...(cleanReplytoEmail && { replyTo: cleanReplytoEmail }),
            }
          : {
              invitation: `${domainId}/-/Edit`,
              signature: domainId,
              groups: membersToMessage,
              subject,
              message: sanitizedMessage,
              parentGroup: groupId,
              ...(cleanReplytoEmail && { replyTo: cleanReplytoEmail }),
              useJob: true,
              fromName: groupDomainContent?.message_sender?.value?.fromName,
              fromEmail: groupDomainContent?.message_sender?.value?.fromEmail,
            }
      )
      if (result.jobId) {
        setJobId(result.jobId)
      } else {
        promptMessage('Message sent successfully')
      }
      setSubject(`Message to ${prettyId(groupId)}`)
      setMessage('')
      // Save the timestamp in the local storage (used in PC console)
      membersToMessage.forEach((member) => {
        try {
          localStorage.setItem(`${groupId}|${member}`, Date.now())
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`Could not save timestamp for ${member}`)
        }
      })
      $('#message-group-members').modal('hide')
    } catch (e) {
      setError(e.message)
    }
    setSubmitting(false)
  }

  return (
    <BasicModal
      id="message-group-members"
      title="Message Group Members"
      primaryButtonText="Send Messages"
      onPrimaryButtonClick={sendMessage}
      primaryButtonDisabled={submitting}
      isLoading={submitting}
      onClose={() => {
        setMessage('')
        setError(null)
        setSubmitting(false)
      }}
      options={{ useSpinnerButton: true }}
    >
      {error && <div className="alert alert-danger">{error}</div>}

      <p>
        Enter a subject and message below. Your message will be sent via email to the following{' '}
        {membersToMessage?.length} group member(s):
      </p>
      <div className="well receiver-list">
        {membersToMessage.map((p) => (p.includes('@') ? p : prettyId(p)))?.join(', ')}
      </div>

      <div id="message-group-members-form">
        <div className="form-group">
          <label htmlFor="subject">Email Subject</label>
          <input
            type="text"
            name="subject"
            className="form-control"
            placeholder="Subject"
            value={subject}
            required
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">Reply To</label>
          <input
            type="text"
            name="replyto"
            className="form-control"
            value={replyToEmail}
            onChange={(e) => setReplyToEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Email Body</label>
          <p className="hint">
            Hint: You can personalize emails using template variables. The text {'{{'}fullname
            {'}}'} will automatically be replaced with the recipient&apos;s full name if they
            have an OpenReview profile. If a profile isn&apos;t found their email address will
            be used instead.
          </p>
          <p className="hint">
            You can use Markdown syntax to add basic formatting to your email. Use the Preview
            tab to see how your email will look.
          </p>
          <MarkdownPreviewTab
            value={message}
            onValueChanged={setMessage}
            placeholder="Message"
          />
        </div>
      </div>
    </BasicModal>
  )
}

export default MessageMemberModal
