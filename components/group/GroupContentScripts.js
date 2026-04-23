/* globals promptMessage: false */
/* globals promptError: false */

import { useState } from 'react'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import EditorSection from '../EditorSection'
import CodeEditor from '../CodeEditor'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'
import { prettyField } from '../../lib/utils'

export default function GroupContentScripts({ group, profileId, reloadGroup }) {
  const contentScripts = Object.keys(group.content ?? {}).filter(
    (key) => key.endsWith('_script') && typeof group.content[key].value === 'string'
  )
  if (contentScripts.length === 0) {
    return null
  }

  return (
    <EditorSection title="Content Scripts" className="process-functions">
      <Tabs>
        <TabList>
          {contentScripts.map((fieldName, i) => (
            <Tab key={fieldName} id={fieldName} active={i === 0}>
              {prettyField(fieldName)}
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {contentScripts.map((fieldName) => (
            <TabPanel key={fieldName} id={fieldName}>
              <GroupCodeEditor
                group={group}
                fieldName={fieldName}
                profileId={profileId}
                reloadGroup={reloadGroup}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </EditorSection>
  )
}

function GroupCodeEditor({ group, fieldName, profileId, reloadGroup }) {
  const [code, setCode] = useState(group.content[fieldName].value || '')
  const [isSaving, setIsSaving] = useState(false)

  const saveCode = async () => {
    setIsSaving(true)
    try {
      const requestBody = {
        group: {
          id: group.id,
          content: {
            ...group.content,
            [fieldName]: { value: code },
          },
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
        invitation: group.domain ? `${group.domain}/-/Edit` : group.invitations[0],
      }
      await api.post('/groups/edits', requestBody)
      promptMessage(`Content object for ${group.id} has been updated`)
      reloadGroup()
    } catch (error) {
      promptError(error.message)
    }
    setIsSaving(false)
  }

  return (
    <div>
      <CodeEditor code={code} onChange={setCode} isText />

      <div className="mt-3">
        <SpinnerButton
          type="primary"
          onClick={saveCode}
          disabled={isSaving}
          loading={isSaving}
        >
          {isSaving ? 'Saving' : 'Update Code'}
        </SpinnerButton>
      </div>
    </div>
  )
}
