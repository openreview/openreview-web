import { InfoCircleFilled } from '@ant-design/icons'
import { Space, Tooltip } from 'antd'
import EditorSection from '../EditorSection'
import { AntdTabs } from '../Tabs'
import DateProcessesEditor from './DateProcessesEditor'
import { InvitationCodeV2 } from './InvitationCode'

const InvitationProcessFunctionsV2 = ({
  invitation,
  profileId,
  loadInvitation,
  isMetaInvitation,
}) => {
  return (
    <EditorSection title="Process Functions" className="process-functions">
      <AntdTabs
        type="card"
        styles={{ header: { marginBottom: 0 }, root: { marginTop: '1rem' } }}
        items={[
          {
            key: 'preprocess',
            label: 'Pre Process',
            children: (
              <InvitationCodeV2
                key={invitation.id}
                invitation={invitation}
                profileId={profileId}
                loadInvitation={loadInvitation}
                codeType="preprocess"
                isMetaInvitation={isMetaInvitation}
                alwaysShowEditor={true}
                noTitle={true}
              />
            ),
          },
          {
            key: 'process',
            label: 'Process',
            children: (
              <InvitationCodeV2
                key={invitation.id}
                invitation={invitation}
                profileId={profileId}
                loadInvitation={loadInvitation}
                codeType="process"
                isMetaInvitation={isMetaInvitation}
                alwaysShowEditor={true}
                noTitle={true}
              />
            ),
          },
          {
            key: 'dateprocesses',
            label: (
              <Space>
                Date Process
                <Tooltip title="Use the form below to specify dates expression and delay of date processes, invitation properties can be references with #{}, e.g. #{4/duedate}">
                  <InfoCircleFilled />
                </Tooltip>
              </Space>
            ),
            children: (
              <DateProcessesEditor
                key={invitation.id}
                invitation={invitation}
                profileId={profileId}
                loadInvitation={loadInvitation}
                isMetaInvitation={isMetaInvitation}
              />
            ),
          },
          {
            key: 'postprocesses',
            label: (
              <Space>
                Post Process
                <Tooltip title="Use the form below to specify dates expression and delay of post processes, invitation properties can be references with #{}, e.g. #{4/duedate}">
                  <InfoCircleFilled />
                </Tooltip>
              </Space>
            ),
            children: (
              <DateProcessesEditor
                key={invitation.id}
                invitation={invitation}
                profileId={profileId}
                loadInvitation={loadInvitation}
                isMetaInvitation={isMetaInvitation}
                field="postprocesses"
              />
            ),
          },
        ]}
        defaultActiveKey="process"
      />
    </EditorSection>
  )
}

export default InvitationProcessFunctionsV2
