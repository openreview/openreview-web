/* globals promptError,promptMessage: false */
import { useState } from 'react'
import dynamic from 'next/dynamic'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import EditorSection from '../EditorSection'
import SpinnerButton from '../SpinnerButton'

const CodeEditor = dynamic(() => import('../CodeEditor'))

// for both reply and reply forum
const InvitationReply = ({
  invitation, profileId, accessToken, loadInvitation, replyField, readOnly = false,
}) => {
  const isV1Invitation = invitation.apiVersion === 1
  const [replyString, setReplyString] = useState(invitation[replyField] ? JSON.stringify(invitation[replyField], undefined, 2) : '[]')
  const [isSaving, setIsSaving] = useState(false)

  const getTitle = () => {
    switch (replyField) {
      case 'reply': return 'Reply Parameters'
      case 'edge': return 'Edge'
      case 'edit': return 'Edit'
      case 'replyForumViews': return 'Reply Forum Views'
      default: return replyField
    }
  }

  const getRequestBody = (replyObj) => {
    switch (replyField) {
      case 'reply': return {
        ...invitation,
        reply: replyObj,
        apiVersion: undefined,
        rdate: undefined,
      }
      case 'edge': return {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          edge: replyObj,
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
      }
      case 'replyForumViews': return isV1Invitation ? {
        ...invitation,
        replyForumViews: replyObj,
        apiVersion: undefined,
        rdate: undefined,
      } : {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          replyForumViews: replyObj,
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
      }
      case 'edit': return {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          edit: {
            note: {
              signatures: null,
              readers: null,
              writers: null,
              content: invitation.edit.note.content,
            },
            ...replyObj,
          },
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
      }
      default: return null
    }
  }

  const saveInvitationReply = async () => {
    try {
      setIsSaving(true)
      const cleanReplyString = replyString.trim()
      const replyObj = JSON.parse(cleanReplyString.length ? cleanReplyString : '[]')
      const requestPath = isV1Invitation ? '/invitations' : '/invitations/edits'
      const requestBody = getRequestBody(replyObj)
      await api.post(requestPath, requestBody, { accessToken, version: isV1Invitation ? 1 : 2 })
      promptMessage(`Settings for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      if (error instanceof SyntaxError) {
        promptError(`Reply content is not valid JSON - ${error.message}. Make sure all quotes and brackets match.`, { scrollToTop: false })
      } else {
        promptError(error.message, { scrollToTop: false })
      }
    }
    setIsSaving(false)
  }

  return (
    <EditorSection title={getTitle()}>
      <CodeEditor
        code={replyString}
        onChange={setReplyString}
        isJson
        readOnly={readOnly}
      />
      {!readOnly && (
        <SpinnerButton
          type='primary'
          onClick={saveInvitationReply}
          disabled={isSaving}
          loading={isSaving}
        >
          {isSaving ? 'Saving' : 'Save Invitation'}
        </SpinnerButton>
      )}
    </EditorSection>
  )
}

export default InvitationReply
