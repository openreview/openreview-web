/* globals promptError,promptMessage: false */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import api from '../../lib/api-client'
import { getGroupVersion } from '../../lib/utils'
import EditorSection from '../EditorSection'
import LoadingSpinner from '../LoadingSpinner'
import SpinnerButton from '../SpinnerButton'

const CodeEditor = dynamic(() => import('../CodeEditor'), {
  loading: () => <LoadingSpinner inline/>,
})

const GroupUICode = ({ group, accessToken, reloadGroup }) => {
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modifiedWebCode, setModifiedWebCode] = useState(group.web)

  const handleUpdateCodeClick = async () => {
    try {
      setIsSaving(true)
      const groupToPost = {
        ...group,
        web: modifiedWebCode.trim() ? modifiedWebCode.trim() : null,
      }
      const result = await api.post('/groups', groupToPost, {
        accessToken,
        version: getGroupVersion(group.id),
      })
      setShowCodeEditor(false)
      promptMessage(`UI code for ${group.id} has been updated`, { scrollToTop: false })
      reloadGroup()
    } catch (error) {
      promptError(error.message)
    }
    setIsSaving(false)
  }

  useEffect(() => {
    // Close code editor when changing groups
    setShowCodeEditor(false)
  }, [group.id])

  return (
    <EditorSection title="Group UI Code">
      {showCodeEditor && (
        <CodeEditor
          code={group.web}
          onChange={setModifiedWebCode}
          scrollIntoView
        />
      )}

      {showCodeEditor ? (
        <div className="mt-2">
          <SpinnerButton
            type="primary"
            onClick={handleUpdateCodeClick}
            disabled={group.web === modifiedWebCode || isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Update Code'}
          </SpinnerButton>
          <button type="button" className="btn btn-default ml-1" onClick={() => setShowCodeEditor(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn-primary" onClick={() => setShowCodeEditor(true)}>
            Show Code Editor
          </button>
        </div>
      )}
    </EditorSection>
  )
}

export default GroupUICode
