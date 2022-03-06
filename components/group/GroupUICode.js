/* globals promptError,promptMessage: false */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import upperFirst from 'lodash/upperFirst'
import EditorSection from '../EditorSection'
import LoadingSpinner from '../LoadingSpinner'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'

const CodeEditor = dynamic(() => import('../CodeEditor'), {
  loading: () => <LoadingSpinner inline />,
})

const GroupUICode = ({ group, fieldName, accessToken, reloadGroup }) => {
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modifiedWebCode, setModifiedWebCode] = useState(group[fieldName] ?? '')

  const handleUpdateCodeClick = async () => {
    setIsSaving(true)
    const groupToPost = {
      ...group,
      [fieldName]: modifiedWebCode.trim() || null,
    }
    try {
      await api.post('/groups', groupToPost, { accessToken })
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
  }, [group.id, fieldName])

  return (
    <EditorSection title={`${upperFirst(fieldName)} Code`}>
      {showCodeEditor && (
        <CodeEditor code={group[fieldName]} onChange={setModifiedWebCode} scrollIntoView />
      )}

      {showCodeEditor ? (
        <div className="mt-2">
          <SpinnerButton
            type="primary"
            onClick={handleUpdateCodeClick}
            disabled={group[fieldName] === modifiedWebCode || isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Update Code'}
          </SpinnerButton>
          <button
            type="button"
            className="btn btn-default ml-1"
            onClick={() => setShowCodeEditor(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setShowCodeEditor(true)}
          >
            Show Code Editor
          </button>
        </div>
      )}
    </EditorSection>
  )
}

export default GroupUICode
