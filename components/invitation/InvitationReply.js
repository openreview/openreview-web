/* globals promptError,promptMessage,view: false */

import { useState } from 'react'
import EditorSection from '../EditorSection'
import CodeEditor from '../CodeEditor'
import SpinnerButton from '../SpinnerButton'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { getMetaInvitationId, prettyId } from '../../lib/utils'

// Used for both reply/edit and reply forum views
export default function InvitationReply({
  invitation,
  accessToken,
  loadInvitation,
  replyField,
  readOnly = false,
}) {
  const [replyString, setReplyString] = useState(
    invitation[replyField] ? JSON.stringify(invitation[replyField], undefined, 2) : '[]'
  )
  const [isSaving, setIsSaving] = useState(false)

  const titleMap = {
    reply: 'Reply Parameters',
    replyForumViews: 'Reply Forum Views',
  }
  const sectionTitle = titleMap[replyField] || replyField

  const getRequestBody = (replyObj) => {
    switch (replyField) {
      case 'reply':
        return {
          ...invitation,
          reply: replyObj,
          apiVersion: undefined,
          rdate: undefined,
        }
      case 'replyForumViews':
        return {
          ...invitation,
          replyForumViews: replyObj,
          apiVersion: undefined,
          rdate: undefined,
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
      const requestPath = '/invitations'
      const requestBody = getRequestBody(replyObj)
      await api.post(requestPath, requestBody, {
        accessToken,
        version: 1,
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

export const InvitationReplyV2 = ({
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

  const titleMap = {
    edge: 'Edge',
    edit: 'Edit',
    replyForumViews: 'Reply Forum Views',
  }
  const sectionTitle = titleMap[replyField] || replyField

  const getRequestBody = (replyObj) => {
    const metaInvitationId = getMetaInvitationId(invitation)
    switch (replyField) {
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
      const requestPath = '/invitations/edits'
      const requestBody = getRequestBody(replyObj)
      await api.post(requestPath, requestBody, {
        accessToken,
        version: 2,
      })
      promptMessage(`Settings for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      let { message } = error
      if (error instanceof SyntaxError) {
        message = `Reply is not valid JSON: ${error.message}. Make sure all quotes and brackets match.`
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

// for v1 invitations only
export function InvitationReplyWithPreview({ invitation, accessToken, loadInvitation }) {
  const [replyString, setReplyString] = useState(
    invitation.reply ? JSON.stringify(invitation.reply, undefined, 2) : '[]'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [previewContent, setPreivewContent] = useState(null)
  const { user } = useUser()

  const getRequestBody = () => {
    try {
      const cleanReplyString = replyString.trim()
      const replyObj = JSON.parse(cleanReplyString.length ? cleanReplyString : '[]')
      return {
        ...invitation,
        reply: replyObj,
        apiVersion: undefined,
        rdate: undefined,
      }
    } catch (error) {
      promptError(`Reply is not valid JSON: ${error.message}.`, { scrollToTop: false })
    }
    return {}
  }

  const saveInvitationReply = async () => {
    try {
      setIsSaving(true)
      const requestBody = getRequestBody()
      await api.post('/invitations', requestBody, {
        accessToken,
        version: 1,
      })
      promptMessage(`Settings for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      let { message } = error
      if (error instanceof SyntaxError) {
        message = `Reply is not valid JSON: ${error.message}. Make sure all quotes and brackets match.`
      }
      promptError(message, { scrollToTop: false })
    }
    setIsSaving(false)
  }

  const generateReplyPreview = () => {
    const invitationToPreview = getRequestBody()
    if (!invitationToPreview?.reply?.content) {
      setPreivewContent('Nothing to preview')
      return
    }
    view.mkNewNoteEditor(invitationToPreview, null, null, user, {
      isPreview: true,
      onCompleted: (editor) => {
        setPreivewContent(editor.html())
      },
    })
  }

  return (
    <EditorSection title="Reply Parameters" className="reply-preview">
      <Tabs>
        <TabList>
          <Tab id="reply" active>
            Reply
          </Tab>
          <Tab id="preview" onClick={generateReplyPreview}>
            Preview
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="reply">
            <CodeEditor code={replyString} onChange={setReplyString} readOnly={false} isJson />
          </TabPanel>
          <TabPanel id="preview">
            <div
              className="note-editor-preview"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

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
    </EditorSection>
  )
}
