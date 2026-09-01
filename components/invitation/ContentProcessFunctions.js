import { useMemo } from 'react'
import { prettyField } from '../../lib/utils'
import EditorSection from '../EditorSection'
import { AntdTabs } from '../Tabs'
import { InvitationCodeV2 } from './InvitationCode'

export default function InvitationProcessFunctionsV2({
  invitation,
  profileId,
  loadInvitation,
  isMetaInvitation,
}) {
  const contentScripts = Object.keys(invitation.content ?? {}).filter(
    (key) => key.endsWith('_script') && typeof invitation.content[key].value === 'string'
  )
  const items = useMemo(
    () =>
      contentScripts.map((fieldName) => ({
        key: fieldName,
        label: prettyField(fieldName),
        children: (
          <InvitationCodeV2
            invitation={invitation}
            profileId={profileId}
            loadInvitation={loadInvitation}
            codeType={`content.${fieldName}.value`}
            isMetaInvitation={isMetaInvitation}
            alwaysShowEditor
            noTitle
          />
        ),
      })),
    [invitation]
  )

  if (contentScripts.length === 0) {
    return null
  }

  return (
    <EditorSection title="Content Process Functions" className="process-functions">
      <AntdTabs
        type="card"
        styles={{ header: { marginBottom: 0 }, root: { marginTop: '1rem' } }}
        items={items}
      />
    </EditorSection>
  )
}
