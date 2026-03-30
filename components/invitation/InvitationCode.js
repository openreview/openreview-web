/* globals promptMessage,promptError,$: false */

import React, { useEffect, useState } from 'react'
import get from 'lodash/get'
import dynamic from 'next/dynamic'
import EditorSection from '../EditorSection'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'
import { getMetaInvitationId, prettyId } from '../../lib/utils'

const CodeEditor = dynamic(() => import('../CodeEditor'), { ssr: false })

const InvitationCode = ({ invitation, loadInvitation, codeType }) => {
  const [code, setCode] = useState(invitation[codeType])
  const [showEditor, setShowEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const titleMap = {
    web: 'Invitation UI Code',
    process: 'Process Function Code',
    preprocess: 'Preprocess Function Code',
  }
  const sectionTitle = titleMap[codeType] || 'Code'

  const saveCode = async () => {
    setIsSaving(true)

    try {
      const requestBody = {
        ...invitation,
        [codeType]: code,
        apiVersion: undefined,
        rdate: undefined,
      }
      await api.post('/invitations', requestBody, {
        version: 1,
      })
      promptMessage(`Code for ${prettyId(invitation.id)} updated`)
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message)
    }

    setIsSaving(false)
  }

  const handleCancelClick = () => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }

  useEffect(() => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }, [invitation.id])

  return (
    <EditorSection title={sectionTitle}>
      {showEditor && <CodeEditor code={code} onChange={setCode} />}

      {showEditor ? (
        <div className="mt-2">
          <SpinnerButton
            type="primary"
            onClick={saveCode}
            disabled={isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Update Code'}
          </SpinnerButton>
          <button
            type="button"
            className="btn btn-sm btn-default"
            onClick={() => handleCancelClick()}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setShowEditor(true)}
          >
            Show Code Editor
          </button>
        </div>
      )}
    </EditorSection>
  )
}

export const InvitationCodeV2 = ({
  invitation,
  profileId,
  loadInvitation,
  codeType,
  isMetaInvitation,
  alwaysShowEditor,
  noTitle,
}) => {
  const [code, setCode] = useState(get(invitation, codeType))
  const [showEditor, setShowEditor] = useState(alwaysShowEditor ?? false)
  const [isSaving, setIsSaving] = useState(false)

  const titleMap = {
    web: 'Invitation UI Code',
    process: 'Process Function Code',
    preprocess: 'Preprocess Function Code',
  }
  const sectionTitle = titleMap[codeType] || 'Code'

  const saveCode = async () => {
    setIsSaving(true)

    try {
      const metaInvitationId = getMetaInvitationId(invitation)
      if (!isMetaInvitation && !metaInvitationId) {
        throw new Error('No meta invitation found')
      }

      let updateField = codeType
      let updateObj = code
      if (codeType.startsWith('content.')) {
        const contentField = codeType.replace('content.', '').replace('.value', '')
        updateField = 'content'
        updateObj = {
          ...invitation.content,
          [contentField]: { value: code },
        }
      }
      const requestBody = {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          [updateField]: updateObj,
          ...(isMetaInvitation && { edit: true }),
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
        ...(!isMetaInvitation && { invitations: metaInvitationId }),
      }
      await api.post('/invitations/edits', requestBody)
      promptMessage(`Code for ${prettyId(invitation.id)} updated`)
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message)
    }

    setIsSaving(false)
  }

  const handleCancelClick = () => {
    setCode(get(invitation, codeType))
    setShowEditor(false)
  }

  useEffect(() => {
    setCode(get(invitation, codeType))
    setShowEditor(alwaysShowEditor ?? false)
  }, [invitation.id])

  return (
    <EditorSection title={noTitle ? null : sectionTitle}>
      {showEditor && <CodeEditor code={code} onChange={setCode} />}

      {showEditor ? (
        <div className="mt-2">
          <SpinnerButton
            type="primary"
            onClick={saveCode}
            disabled={isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Update Code'}
          </SpinnerButton>
          {!alwaysShowEditor && (
            <button
              type="button"
              className="btn btn-sm btn-default"
              onClick={() => handleCancelClick()}
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setShowEditor(true)}
          >
            Show Code Editor
          </button>
        </div>
      )}
    </EditorSection>
  )
}

export default InvitationCode
