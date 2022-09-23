/* globals promptMessage,promptError,$: false */

import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import EditorSection from '../EditorSection'
import Icon from '../Icon'
import { InvitationCodeV2 } from './InvitationCode'
import DateProcessesEditor from './DateProcessesEditor'

const InvitationProcessFunctionsV2 = ({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  isMetaInvitation,
}) => (
  <EditorSection title="Process Functions" className="process-functions">
    <Tabs>
      <TabList>
        <Tab id="preprocess">Pre Process</Tab>
        <Tab id="process" active>
          Process
        </Tab>
        <Tab id="dateprocesses">
          Date Process{' '}
          <Icon
            name="info-sign"
            tooltip="Use the form below to specify dates expression and delay of date processes, invitation properties can be references with #{}, e.g. #{duedate}"
          />
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel id="preprocess">
          <InvitationCodeV2
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            codeType="preprocess"
            isMetaInvitation={isMetaInvitation}
            alwaysShowEditor={true}
            noTitle={true}
          />
        </TabPanel>
        <TabPanel id="process">
          <InvitationCodeV2
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            codeType="process"
            isMetaInvitation={isMetaInvitation}
            alwaysShowEditor={true}
            noTitle={true}
          />
        </TabPanel>
        <TabPanel id="dateprocesses">
          <DateProcessesEditor
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            isMetaInvitation={isMetaInvitation}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </EditorSection>
)

export default InvitationProcessFunctionsV2
