/* globals promptError: false */
/* globals promptMessage: false */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
import LoadingSpinner from '../LoadingSpinner'
import SpinnerButton from '../SpinnerButton'

const CodeEditor = dynamic(() => import('../CodeEditor'), {
  loading: () => <LoadingSpinner inline />,
})

export default function GroupContent({ group, accessToken, profileId, reloadGroup }) {
  const [showEditor, setShowEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modifiedContent, setModifiedContent] = useState(
    JSON.stringify(group.content, undefined, 2)
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const requestBody = {
        group: {
          id: group.id,
          content: JSON.parse(modifiedContent || '{}'),
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
        invitation: group.domain ? `${group.domain}/-/Edit` : group.invitations[0],
      }
      await api.post('/groups/edits', requestBody, { accessToken, version: 2 })
      promptMessage(`Content object for ${group.id} has been updated`, { scrollToTop: false })
      reloadGroup()
    } catch (error) {
      let { message } = error
      if (error instanceof SyntaxError) {
        message = `Reply is not valid JSON: ${error.message}. Make sure all quotes and brackets match.`
      }
      promptError(message)
    }
    setIsSaving(false)
  }

  useEffect(() => {
    // Close editor and reset contents when changing groups
    setShowEditor(false)

    setModifiedContent(JSON.stringify(group.content, undefined, 2))
  }, [group.id])

  return (
    <EditorSection title="Group Content">
      {showEditor && (
        <CodeEditor code={modifiedContent} onChange={setModifiedContent} isJson scrollIntoView />
      )}

      {showEditor ? (
        <div className="mt-2">
          <SpinnerButton
            type="primary"
            onClick={handleSave}
            disabled={group.content === modifiedContent || isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Update Content'}
          </SpinnerButton>
          <button
            type="button"
            className="btn btn-sm btn-default ml-1"
            onClick={() => setShowEditor(false)}
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
            Show Content
          </button>
        </div>
      )}
    </EditorSection>
  )
}
