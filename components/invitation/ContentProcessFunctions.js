/* globals promptMessage,promptError,$: false */

import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import EditorSection from '../EditorSection'
import { InvitationCodeV2 } from './InvitationCode'
import { prettyField } from '../../lib/utils'

export default function InvitationProcessFunctionsV2({
  invitation,
  profileId,
  loadInvitation,
  isMetaInvitation,
}) {
  const contentScripts = Object.keys(invitation.content ?? {}).filter(
    (key) => key.endsWith('_script') && typeof invitation.content[key].value === 'string'
  )
  if (contentScripts.length === 0) {
    return null
  }

  return (
    <EditorSection title="Content Process Functions" className="process-functions">
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
              <InvitationCodeV2
                invitation={invitation}
                profileId={profileId}
                loadInvitation={loadInvitation}
                codeType={`content.${fieldName}.value`}
                isMetaInvitation={isMetaInvitation}
                alwaysShowEditor
                noTitle
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </EditorSection>
  )
}
