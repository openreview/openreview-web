/* globals promptMessage: false */
/* globals promptError: false */

import { useState } from 'react'
import EditorSection from '../EditorSection'
import CodeEditor from '../CodeEditor'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'
import { getMetaInvitationId, prettyId } from '../../lib/utils'

// Used for both reply/edit and reply forum views
const InvitationReply = ({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  replyField,
  readOnly = false,
}) => {
  const [replyString, setReplyString] = useState(
    invitation[replyField] ? JSON.stringify(invitation[replyField], undefined, 2) : '[]'
  )
  const [isSaving, setIsSaving] = useState(false)
  const isV1Invitation = invitation.apiVersion === 1

  const titleMap = {
    reply: 'Reply Parameters',
    edge: 'Edge',
    edit: 'Edit',
    replyForumViews: 'Reply Forum Views',
  }
  const sectionTitle = titleMap[replyField] || replyField

  const getRequestBody = (replyObj) => {
    const metaInvitationId = getMetaInvitationId(invitation)
    switch (replyField) {
      case 'reply':
        return {
          ...invitation,
          reply: replyObj,
          apiVersion: undefined,
          rdate: undefined,
        }
      case 'edge':
        if (!metaInvitationId) throw new Error('No meta invitation found')
        return {
          invitation: {
            id: invitation.id,
            signatures: invitation.signatures,
            edge: replyObj,
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
          invitations: metaInvitationId,
        }
      case 'replyForumViews':
        if (isV1Invitation)
          return {
            ...invitation,
            replyForumViews: replyObj,
            apiVersion: undefined,
            rdate: undefined,
          }
        if (!metaInvitationId) throw new Error('No meta invitation found')
        return {
          invitation: {
            id: invitation.id,
            signatures: invitation.signatures,
            replyForumViews: replyObj,
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
          invitations: metaInvitationId,
        }
      case 'edit':
        if (!metaInvitationId) throw new Error('No meta invitation found')
        return {
          invitation: {
            id: invitation.id,
            signatures: invitation.signatures,
            edit: {
              ...replyObj,
            },
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
          invitations: metaInvitationId,
        }
      default:
        return null
    }
  }

  const saveInvitationReply = async () => {
    try {
      setIsSaving(true)
      const cleanReplyString = replyString.trim()
      const replyObj = JSON.parse(cleanReplyString.length ? cleanReplyString : '[]')
      const requestPath = isV1Invitation ? '/invitations' : '/invitations/edits'
      const requestBody = getRequestBody(replyObj)
      await api.post(requestPath, requestBody, {
        accessToken,
        version: isV1Invitation ? 1 : 2,
      })
      promptMessage(`Settings for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      let { message } = error
      if (error instanceof SyntaxError) {
        message = `Reply content is not valid JSON - ${error.message}. Make sure all quotes and brackets match.`
      }
      promptError(message, { scrollToTop: false })
    }
    setIsSaving(false)
  }

  return (
    <EditorSection title={sectionTitle}>
      <CodeEditor code={replyString} onChange={setReplyString} readOnly={readOnly} isJson />

      {!readOnly && (
        <div className="mt-2">
          <SpinnerButton
            type="primary"
            onClick={saveInvitationReply}
            disabled={isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Save Invitation'}
          </SpinnerButton>
        </div>
      )}
    </EditorSection>
  )
}

export default InvitationReply
