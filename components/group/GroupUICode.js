/* globals promptError,promptMessage: false */
import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import api from '../../lib/api-client'
import { getGroupVersion } from '../../lib/utils'
import EditorSection from '../EditorSection'
import LoadingSpinner from '../LoadingSpinner'

const CodeEditor = dynamic(() => import('../CodeEditor'), { loading: () => <LoadingSpinner inline/> })

const GroupUICode = ({ group, accessToken, reloadGroup }) => {
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modifiedWebCode, setModifiedWebCode] = useState(group.web)
  const code = useRef(group.web ?? '')

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

  return (
    <EditorSection title='Group UI Code'>
      {showCodeEditor ? (
        <>
          {/* eslint-disable-next-line max-len */}
          <CodeEditor
            code={code.current}
            onChange={modifiedCode => setModifiedWebCode(modifiedCode)}
            scrollIntoView
          />
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdateCodeClick}
              disabled={code.current === modifiedWebCode || isSaving}
            >
              {isSaving ? (
                <div className="save-button-wrapper">
                  Saving
                  <LoadingSpinner inline text="" extraClass="spinner-small" />
                </div>
              ) : (
                <>Update Code</>
              )}
            </button>
            <button
              type="button"
              className="btn btn-default ml-1"
              onClick={() => setShowCodeEditor(false)}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCodeEditor(true)}
        >
          Show Code Editor
        </button>
      )}
    </EditorSection>
  )
}

export default GroupUICode
