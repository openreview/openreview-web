/* globals promptError,promptMessage: false */
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import SpinnerButton from '../SpinnerButton'

const CodeEditor = dynamic(() => import('../CodeEditor'))

const InvitationCode = ({
  invitation, profileId, accessToken, loadInvitation, codeType,
}) => {
  const isV1Invitation = invitation.apiVersion === 1
  const [code, setCode] = useState(invitation[codeType])
  const [showEditor, setShowEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const saveCode = async () => {
    setIsSaving(true)
    try {
      const requestPath = isV1Invitation ? '/invitations' : '/invitations/edits'
      const requestBody = isV1Invitation
        ? {
          ...invitation,
          [codeType]: code,
          apiVersion: undefined,
        }
        : {
          invitation: {
            id: invitation.id,
            signatures: invitation.signatures,
            [codeType]: code,
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
        }
      await api.post(requestPath, requestBody, { accessToken, version: isV1Invitation ? 1 : 2 })
      promptMessage(`Code for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
    setIsSaving(false)
  }

  const handleCancelClick = () => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }

  const getTitle = () => {
    switch (codeType) {
      case 'web': return 'Invitation UI Code'
      case 'process': return 'Process Function Code'
      case 'preprocess': return 'PreProcess Function Code'
      default: return 'Code'
    }
  }

  useEffect(() => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }, [invitation.id])

  return (
    <section>
      <h4>{getTitle()}</h4>
      {showEditor ? (
        <>
          <CodeEditor code={code} onChange={setCode} />
          <SpinnerButton
            type='primary'
            onClick={saveCode}
            disabled={isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Update Code'}
          </SpinnerButton>
          <button
            type='button'
            className='btn btn-sm btn-default'
            onClick={() => handleCancelClick()}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type='button'
          className='btn btn-sm btn-primary'
          onClick={() => setShowEditor(true)}
        >
          Show Code Editor
        </button>
      )}
    </section>
  )
}

export default InvitationCode
