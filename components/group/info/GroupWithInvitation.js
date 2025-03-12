/* globals promptError,promptMessage,$: false */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get } from 'lodash'
import api from '../../../lib/api-client'
import useUser from '../../../hooks/useUser'
import {
  formatDateTime,
  prettyContentValue,
  prettyField,
  prettyId,
  prettyInvitationId,
} from '../../../lib/utils'
import Markdown from '../../EditorComponents/Markdown'
import InvitationContentEditor from '../InvitationContentEditor'
import Icon from '../../Icon'
import styles from '../../../styles/components/GroupWithInvitation.module.scss'
import GroupMembersInfo from './GroupMembersInfo'
import { Tab, TabList, TabPanel, TabPanels } from '../../Tabs'
import CodeEditor from '../../CodeEditor'

const groupTabsConfig = [
  {
    id: 'groupMembers',
    label: ' Members',
    sections: ['groupMembers'],
    default: true,
  },
  {
    id: 'groupUICode',
    label: 'UI Code',
    sections: ['groupUICode'],
  },
]

const GroupContent = ({ groupContent, presentation, groupReaders }) => {
  if (!groupContent) return null

  const contentKeys = Object.keys(groupContent)
  const contentOrder =
    presentation?.length > 0
      ? Array.from(new Set(presentation.map((p) => p.name).concat(contentKeys)))
      : contentKeys

  return (
    <div className={styles.groupContents}>
      {contentOrder.map((fieldName, i) => {
        let rawFieldValue = presentation?.[i]?.description
        if (Array.isArray(rawFieldValue)) {
          rawFieldValue = rawFieldValue.filter(Boolean)
          if (rawFieldValue.length === 0) rawFieldValue = null
        }

        if (!rawFieldValue) {
          rawFieldValue = groupContent[fieldName]?.value
        }
        const fieldValue = prettyContentValue(rawFieldValue, presentation?.[i]?.type)

        if (!fieldValue) return null

        const enableMarkdown = presentation?.[i]?.markdown
        const customFieldName = presentation?.[i]?.fieldName
        const fieldReaders = Array.isArray(groupContent[fieldName]?.readers)
          ? groupContent[fieldName].readers.sort()
          : null
        const showPrivateIcon =
          fieldReaders && groupReaders && !groupReaders.every((p, j) => p === fieldReaders[j])

        return (
          <div key={fieldName}>
            <strong className={`disable-tex-rendering ${styles.groupContentFieldName}`}>
              {customFieldName ?? prettyField(fieldName)}:
            </strong>
            {showPrivateIcon && (
              <Icon
                name="eye-open"
                extraClasses={styles.privateIcon}
                tooltip={`Privately revealed to ${fieldReaders
                  .map((p) => prettyId(p))
                  .join(', ')}`}
              />
            )}
            <span>{fieldValue}</span>
          </div>
        )
      })}
    </div>
  )
}

const GroupWithInvitation = ({ group, reloadGroup }) => {
  const [editGroupInvitations, setEditGroupInvitations] = useState([])
  const [activeGroupInvitation, setActivateGroupInvitation] = useState(null)
  const { user, accessToken } = useUser()

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'groupMembers':
        return <GroupMembersInfo group={group} />
      case 'groupUICode':
        return <CodeEditor code={group.web} readOnly />
      default:
        return null
    }
  }

  const getInvitationsByReplyGroup = async () => {
    try {
      const result = await api.get(
        '/invitations',
        { 'edit.group.id': group.id, details: 'writable' },
        { accessToken }
      )
      const writableInvitations = (result.invitations ?? []).filter(
        (invitation) => invitation.details?.writable
      )
      setEditGroupInvitations(writableInvitations)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!group) return
    getInvitationsByReplyGroup()
    $('[data-toggle="tooltip"]').tooltip({ html: true })
  }, [group])

  return (
    <div className={styles.groupWithInvitation}>
      <div className={styles.groupDescription}>
        <Markdown text={group.description} />
      </div>
      <div className={styles.invitationMeta}>
        <span className="date item">
          <Icon name="calendar" />
          <span>
            Created:{' '}
            <span data-toggle="tooltip" data-placement="top" title={group.cdate}>
              {formatDateTime(group.cdate)}
            </span>
            , Last Modified:{' '}
            <span data-toggle="tooltip" data-placement="top" title={group.mdate}>
              {formatDateTime(group.mdate)}
            </span>
          </span>
        </span>
        {group.readers && (
          <span
            className="readers item"
            data-toggle="tooltip"
            data-placement="top"
            title={`Visible to <br/>${group.readers.join(',<br/>')}`}
          >
            <Icon name="eye-open" />
            {group.readers.map((reader) => prettyId(reader, true)).join(', ')}
          </span>
        )}
        <span className="item">
          <Icon name="duplicate" />
          <Link href={`/group/revisions?id=${group.id}`}>Revisions</Link>
        </span>
      </div>

      <div className={styles.groupContent}>
        <GroupContent
          groupContent={group.content}
          presentation={group.presentation}
          groupReaders={group.readers}
        />
      </div>
      <div className={styles.groupInvitations}>
        <div className={styles.groupInvitationButtons}>
          {editGroupInvitations.length > 0 && <span className="item">Add:</span>}
          {editGroupInvitations.map((invitation) => (
            <button
              key={invitation.id}
              type="button"
              className="btn btn-xs mr-2"
              onClick={() =>
                setActivateGroupInvitation(activeGroupInvitation ? null : invitation)
              }
            >
              {prettyInvitationId(invitation.id)}
            </button>
          ))}
        </div>
        <div className={styles.activeGroupDescription}>
          <Markdown text={activeGroupInvitation?.description} />
        </div>
        <div>
          {activeGroupInvitation && (
            <>
              <InvitationContentEditor
                invitation={activeGroupInvitation}
                existingValue={Object.fromEntries(
                  Object.keys(activeGroupInvitation.edit?.content ?? {}).map((key) => {
                    const existingFieldValue = get(group, ['content', key, 'value'])
                    return [key, existingFieldValue]
                  })
                )}
                closeInvitationEditor={() => setActivateGroupInvitation(null)}
                onInvitationEditPosted={() => {
                  promptMessage('Edit is posted')
                  reloadGroup()
                }}
                isGroupInvitation={true}
              />
            </>
          )}
        </div>
      </div>

      <TabList>
        {groupTabsConfig.map((tabConfig) => (
          <Tab key={tabConfig.id} id={tabConfig.id} active={tabConfig.default}>
            {tabConfig.label}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {groupTabsConfig.map((tabConfig) => (
          <TabPanel key={tabConfig.id} id={tabConfig.id}>
            {tabConfig.sections.map((section) => renderSection(section))}
          </TabPanel>
        ))}
      </TabPanels>
    </div>
  )
}

export default GroupWithInvitation
