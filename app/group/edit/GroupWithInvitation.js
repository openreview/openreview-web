'use client'

/* globals promptError,promptMessage,$: false */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get } from 'lodash'
import api from '../../../lib/api-client'
import {
  formatDateTime,
  prettyContentValue,
  prettyField,
  prettyId,
  prettyInvitationId,
} from '../../../lib/utils'
import styles from '../../../styles/components/GroupWithInvitation.module.scss'
import Markdown from '../../../components/EditorComponents/Markdown'
import InvitationEditor from '../../../components/group/InvitationEditor'
import Icon from '../../../components/Icon'
import GroupMembersInfo from '../../../components/group/info/GroupMembersInfo'
import CodeEditor from '../../../components/CodeEditor'
import GroupSignedNotes from '../../../components/group/GroupSignedNotes'
import GroupChildGroups from '../../../components/group/GroupChildGroups'
import GroupRelatedInvitations from '../../../components/group/GroupRelatedInvitations'
import GroupMembers from '../../../components/group/GroupMembers'
import WorkFlowInvitations from '../../../components/group/WorkflowInvitations'
import ConsoleTabs from '../../../components/webfield/ConsoleTabs'

const groupTabsConfig = (group) => {
  const tabs = [
    ...(group.id === group.domain && group.details.writable
      ? [
          {
            id: 'workflowInvitations',
            label: 'Workflow Step Timeline',
            sections: ['workflowInvitations'],
          },
        ]
      : []),
    ...(group.content && group.details.writable
      ? [
          {
            id: 'groupContent',
            label: 'Content',
            sections: ['groupContent'],
          },
        ]
      : []),
    {
      id: 'groupMembers',
      label: 'Members',
      sections: ['groupMembers'],
    },
    {
      id: 'groupUICode',
      label: 'UI Code',
      sections: ['groupUICode'],
    },
    { id: 'signedNotes', label: 'Signed Notes', sections: ['groupSignedNotes'] },
    { id: 'childGroups', label: 'Child Groups', sections: ['groupChildGroups'] },
    {
      id: 'relatedInvitations',
      label: 'Related Invitations',
      sections: ['groupRelatedInvitations'],
    },
  ]
  tabs[0].default = true
  return tabs
}

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

        const isDateField = fieldName.endsWith('date')
        let fieldValue
        if (isDateField && !presentation?.[i]?.type) {
          fieldValue = prettyContentValue(rawFieldValue, 'date')
        } else {
          fieldValue = prettyContentValue(rawFieldValue, presentation?.[i]?.type)
        }

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

const GroupWithInvitation = ({ group, reloadGroup, accessToken }) => {
  const [editGroupInvitations, setEditGroupInvitations] = useState([])
  const [activeGroupInvitation, setActivateGroupInvitation] = useState(null)
  const [messageAllMembersInvitation, setMessageAllMembersInvitation] = useState(null)
  const [messageSingleMemberInvitation, setMessageSingleMemberInvitation] = useState(null)
  const [addRemoveMembersInvitaiton, setAddRemoveMembersInvitaiton] = useState(null)

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'workflowInvitations':
        return (
          <WorkFlowInvitations key={sectionName} group={group} accessToken={accessToken} />
        )
      case 'groupContent':
        return (
          <GroupContent
            key={sectionName}
            groupContent={group.content}
            presentation={group.details?.presentation}
            groupReaders={group.readers}
          />
        )
      case 'groupMembers':
        return messageAllMembersInvitation ||
          messageSingleMemberInvitation ||
          addRemoveMembersInvitaiton ? (
          <GroupMembers
            key={sectionName}
            group={group}
            messageAllMembersInvitation={messageAllMembersInvitation}
            messageSingleMemberInvitation={messageSingleMemberInvitation}
            addRemoveMembersInvitaiton={addRemoveMembersInvitaiton}
            reloadGroup={reloadGroup}
          />
        ) : (
          <GroupMembersInfo key={sectionName} group={group} />
        )
      case 'groupUICode':
        return <CodeEditor key={sectionName} code={group.web} readOnly />
      case 'groupSignedNotes':
        return <GroupSignedNotes key={sectionName} group={group} accessToken={accessToken} />
      case 'groupChildGroups':
        return (
          <GroupChildGroups key={sectionName} groupId={group.id} accessToken={accessToken} />
        )
      case 'groupRelatedInvitations':
        return (
          <GroupRelatedInvitations key={sectionName} group={group} accessToken={accessToken} />
        )
      default:
        return null
    }
  }

  const getMessageMemberInvitations = async () => {
    try {
      const messageAllMembersInvitationId = `${group.domain}/-/Message`
      const messageSingleMemberInvitationId = `${group.id}/-/Message`
      const addRemoveMembersInvitationId = `${group.id}/-/Members`

      const result = await Promise.all([
        api.getInvitationById(messageAllMembersInvitationId, accessToken, { invitee: true }),
        api.getInvitationById(messageSingleMemberInvitationId, accessToken, {
          invitee: true,
        }),
        api.getInvitationById(addRemoveMembersInvitationId, accessToken, { invitee: true }),
      ])
      if (result?.length) {
        setMessageAllMembersInvitation(result[0])
        setMessageSingleMemberInvitation(result[1])
        setAddRemoveMembersInvitaiton(result[2])
      }
    } catch (error) {
      /* empty */
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
        (invitation) =>
          invitation.details?.writable &&
          Object.values(invitation.edit?.content ?? {}).some((p) => p.value?.param)
      )
      setEditGroupInvitations(writableInvitations)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!group) return
    getMessageMemberInvitations()
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

      {/* <div className={styles.groupContent}></div> */}
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
              <InvitationEditor
                invitation={activeGroupInvitation}
                existingValue={Object.fromEntries(
                  Object.keys(activeGroupInvitation.edit?.content ?? {}).map((key) => {
                    const existingFieldValue = get(
                      group,
                      activeGroupInvitation?.edit?.group?.content
                        ? ['content', key, 'value'] // editing group content
                        : [key] // editing other group info
                    )
                    return [key, existingFieldValue]
                  })
                )}
                closeInvitationEditor={() => setActivateGroupInvitation(null)}
                onInvitationEditPosted={() => {
                  promptMessage('Edit is posted')
                  reloadGroup()
                }}
                isGroupInvitation={true}
                group={group}
              />
            </>
          )}
        </div>
      </div>

      <ConsoleTabs
        defaultActiveTabId={groupTabsConfig(group)[0].id}
        tabs={groupTabsConfig(group).map((tabConfig) => ({
          ...tabConfig,
          content: tabConfig.sections.map((section) => renderSection(section)),
          visible: true,
        }))}
      />
    </div>
  )
}

export default GroupWithInvitation
