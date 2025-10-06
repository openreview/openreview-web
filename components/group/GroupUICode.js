/* globals promptError,promptMessage: false */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
import LoadingSpinner from '../LoadingSpinner'
import SpinnerButton from '../SpinnerButton'
import WebFieldContext from '../WebFieldContext'
import { parseComponentCode } from '../../lib/webfield-utils'
import useUser from '../../hooks/useUser'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'

const CodeEditor = dynamic(() => import('../CodeEditor'), {
  ssr: false,
  loading: () => <LoadingSpinner inline />,
})

const GroupUICode = ({ group, profileId, accessToken, reloadGroup }) => {
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modifiedWebCode, setModifiedWebCode] = useState(group.web)
  const [showWebfieldPreview, setShowWebfieldPreview] = useState(false)
  const [webComponentProps, setWebComponentProps] = useState({})
  const [WebComponent, setWebComponent] = useState(null)
  const { user } = useUser

  const handleUpdateCodeClick = async () => {
    setIsSaving(true)
    try {
      if (group.invitations) {
        const requestBody = {
          group: {
            id: group.id,
            web: modifiedWebCode,
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
          invitation: group.domain ? `${group.domain}/-/Edit` : group.invitations[0],
        }
        await api.post('/groups/edits', requestBody, { accessToken })
      } else {
        const groupToPost = {
          ...group,
          web: modifiedWebCode.trim() ? modifiedWebCode.trim() : null,
        }
        await api.post('/groups', groupToPost, { accessToken, version: 1 })
      }
      promptMessage(`UI code for ${group.id} has been updated`, { scrollToTop: false })
      setShowCodeEditor(false)
      reloadGroup()
    } catch (error) {
      promptError(error.message)
    }
    setIsSaving(false)
  }

  const renderWebFieldPreview = async () => {
    let componentObj
    try {
      componentObj = await parseComponentCode(
        { ...group, web: modifiedWebCode },
        group.details.domain,
        user,
        {},
        accessToken
      )
    } catch (error) {
      // eslint-disable-next-line react/display-name
      setWebComponent(() => () => (
        <em className="preview-error">{`Error parsing component code: ${error.message}`}</em>
      ))
      setWebComponentProps({})
      return
    }
    setWebComponent(() =>
      dynamic(
        () =>
          import(`../webfield/${componentObj.component}`).catch((e) => ({
            default: () => (
              <em className="preview-error">{`Error loading ${componentObj.component}: ${e.message}`}</em>
            ),
          })),
        { ssr: false, loading: () => <LoadingSpinner inline /> }
      )
    )
    const componentProps = {}
    Object.keys(componentObj.properties).forEach((propName) => {
      const prop = componentObj.properties[propName]
      if (prop?.component) {
        componentProps[propName] = () =>
          dynamic(() => import(`../webfield/${prop.component}`), {
            ssr: false,
            loading: () => <LoadingSpinner inline />,
          })
      } else {
        componentProps[propName] = prop
      }
    })
    setWebComponentProps({ ...componentProps, noteEditorPreview: true })
  }

  useEffect(() => {
    // Close code editor when changing groups
    setShowCodeEditor(false)
  }, [group.id])

  useEffect(() => {
    if (!showWebfieldPreview) return
    renderWebFieldPreview()
  }, [showWebfieldPreview])

  return (
    <EditorSection title="Group UI Code">
      {showCodeEditor && (
        <Tabs>
          <TabList>
            <Tab
              id="ui-code"
              active
              onClick={() => {
                setShowWebfieldPreview(false)
                setWebComponentProps({})
                setWebComponent(null)
              }}
            >
              Code
            </Tab>
            <Tab id="ui-code-preview" onClick={() => setShowWebfieldPreview(true)}>
              Preview
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel id="ui-code">
              <CodeEditor code={group.web} onChange={setModifiedWebCode} scrollIntoView />
            </TabPanel>
            <TabPanel id="ui-code-preview">
              <WebFieldContext.Provider value={webComponentProps}>
                <div id="group-container">
                  {WebComponent && webComponentProps ? (
                    <WebComponent
                      appContext={{
                        setBannerHidden: () => {},
                        setBannerContent: () => {},
                        setEditBanner: () => {},
                        setLayoutOptions: () => {},
                      }}
                    />
                  ) : (
                    <LoadingSpinner />
                  )}
                </div>
              </WebFieldContext.Provider>
            </TabPanel>
          </TabPanels>
        </Tabs>
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
          <button
            type="button"
            className="btn btn-sm btn-default ml-1"
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
