/* globals promptError,promptMessage,$: false */
import { useContext, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import CodeEditor from '../CodeEditor'
import EditorComponentContext from '../EditorComponentContext'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import WebFieldContext from '../WebFieldContext'
import LoadingSpinner from '../LoadingSpinner'
import { parseComponentCode } from '../../lib/webfield-utils'
import useUser from '../../hooks/useUser'

const CodeEditorPreviewWidget = () => {
  const { field, onChange, value, group } = useContext(EditorComponentContext)
  const [showWebfieldPreview, setShowWebfieldPreview] = useState(false)
  const [webComponentProps, setWebComponentProps] = useState({})
  const [WebComponent, setWebComponent] = useState(null)
  const { user, isRefreshing, accessToken } = useUser()

  const fieldName = Object.keys(field)[0]

  const [modifiedWebCode, setModifiedWebCode] = useState(value)

  const renderWebFieldPreview = async () => {
    let componentObj
    try {
      componentObj = await parseComponentCode(
        { ...group, web: modifiedWebCode },
        group.details.domain,
        user,
        null,
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
    setWebComponentProps(componentProps)
  }

  const onCodeChange = (updatedCode) => {
    if (!updatedCode) {
      onChange({ fieldName, value: undefined })
      return
    }

    setModifiedWebCode(updatedCode)
    onChange({ fieldName, value: updatedCode })
  }

  useEffect(() => {
    if (!showWebfieldPreview || isRefreshing) return
    renderWebFieldPreview()
  }, [showWebfieldPreview, isRefreshing])

  return (
    <Tabs>
      <TabList>
        <Tab
          id="web-ui-code"
          active
          onClick={() => {
            setShowWebfieldPreview(false)
            setWebComponentProps({})
            setWebComponent(null)
          }}
        >
          Code
        </Tab>
        <Tab id="web-ui-code-preview" onClick={() => setShowWebfieldPreview(true)}>
          Preview
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel id="web-ui-code">
          <CodeEditor code={modifiedWebCode} onChange={onCodeChange} />
        </TabPanel>
        <TabPanel id="web-ui-code-preview">
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
  )
}

export default CodeEditorPreviewWidget
