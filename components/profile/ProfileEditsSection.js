import { Collapse, Space, Tag } from 'antd'
import { orderBy } from 'lodash'
import { formatDateTime, prettyInvitationId } from '../../lib/utils'

import {
  colors,
  getBootstrap337LabelColor,
  getProfileStateLabelClass,
  moderation as legacyStyles,
} from '../../lib/legacy-bootstrap-styles'

const ProfileEditsSection = ({ profileEdits }) => {
  if (!profileEdits.length) return <p className="empty-message">No profile edits</p>

  return (
    <Collapse
      ghost
      size="small"
      styles={{ header: { paddingInline: 0 }, body: { paddingInline: 0 } }}
      items={orderBy(profileEdits, ['tcdate'], ['desc']).map((edit) => {
        const state = edit.invitation.endsWith('/-/Profile_State') ? edit.profile?.state : null
        const labels = edit.content?.labels?.value ?? []
        return {
          key: edit.id,
          showArrow: false,
          label: (
            <Space size="small" align="center" wrap>
              {edit.tcdate && (
                <span>
                  {formatDateTime(edit.tcdate, {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: undefined,
                    timeZoneName: undefined,
                    hour12: false,
                  })}
                </span>
              )}
              <strong>{prettyInvitationId(edit.invitation)}</strong>
              {state && (
                <Tag
                  color={getBootstrap337LabelColor(getProfileStateLabelClass(state))}
                  variant="solid"
                  styles={{ root: legacyStyles.statusTag }}
                >
                  {state}
                </Tag>
              )}
              {labels.map((label) => (
                <Tag key={label} variant="outlined">
                  {label}
                </Tag>
              ))}
              <span style={{ color: colors.subtleGray, fontSize: '0.85em' }}>
                {edit.tauthor}
              </span>
            </Space>
          ),
          children: (
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {JSON.stringify(edit, null, 2)}
            </pre>
          ),
        }
      })}
    />
  )
}

export default ProfileEditsSection
