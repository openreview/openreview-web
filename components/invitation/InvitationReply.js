/* globals promptError,promptMessage,view: false */

import { useState, useEffect } from 'react'
import pickBy from 'lodash/pickBy'
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

export function InvitationReplyV2({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  replyField,
  isMetaInvitation = false,
  readOnly = false,
}) {
  const [replyString, setReplyString] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const titleMap = {
    edge: 'Edge',
    edit: 'Edit',
    replyForumViews: 'Reply Forum Views',
    content: 'Content',
  }
  const sectionTitle = titleMap[replyField] || replyField

  const getRequestBody = (replyObj) => {
    const metaInvitationId = getMetaInvitationId(invitation)
    if (!isMetaInvitation && !metaInvitationId) {
      throw new Error('No meta invitation found')
    }

    switch (replyField) {
      case 'edit':
      case 'edge':
      case 'replyForumViews':
        return {
          invitation: {
            id: invitation.id,
            signatures: invitation.signatures,
            [replyField]: replyObj,
            ...(isMetaInvitation && { edit: true }),
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
          ...(!isMetaInvitation && { invitations: metaInvitationId }),
        }
      case 'content':
        return {
          invitation: {
            id: invitation.id,
            signatures: invitation.signatures,
            content: {
              ...invitation.content,
              ...replyObj,
            },
            ...(isMetaInvitation && { edit: true }),
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
          ...(!isMetaInvitation && { invitations: metaInvitationId }),
        }
      default:
        return null
    }
  }

  const saveInvitationReply = async () => {
    setIsSaving(true)
    try {
      const cleanReplyString = replyString.trim()
      const replyObj = JSON.parse(cleanReplyString.length ? cleanReplyString : '[]')
      const requestBody = getRequestBody(replyObj)
      await api.post('/invitations/edits', requestBody, {
        accessToken,
        version: 2,
      })
      promptMessage(`Settings for ${prettyId(invitation.id)} updated`, { scrollToTop: false })
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

  useEffect(() => {
    if (!invitation || !replyField) return

    let code = invitation[replyField]
    if (!code) {
      setReplyString(replyField === 'replyForumViews' ? '[]' : '{}')
      return
    }

    if (replyField === 'content') {
      code = pickBy(
        code,
        (valueObj, key) => !key.endsWith('_script') || typeof valueObj.value !== 'string'
      )
    }
    setReplyString(JSON.stringify(code, undefined, 2))
  }, [invitation, replyField])

  return (
    <EditorSection title={sectionTitle}>
      {replyString && (
        <CodeEditor code={replyString} onChange={setReplyString} readOnly={readOnly} isJson />
      )}

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

// For v1 invitations only
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
