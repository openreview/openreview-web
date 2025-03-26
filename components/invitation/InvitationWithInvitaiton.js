/* globals promptError,promptMessage,$: false */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { get } from 'lodash'
import {
  formatDateTime,
  getPath,
  prettyField,
  prettyId,
  prettyInvitationId,
} from '../../lib/utils'
import styles from '../../styles/components/InvitationWithInvitation.module.scss'
import Markdown from '../EditorComponents/Markdown'
import Icon from '../Icon'
import InvitationEditor from '../group/InvitationEditor'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import { Tab, TabList, TabPanel, TabPanels } from '../Tabs'
import { InvitationReplyV2 } from './InvitationReply'
import CodeEditor from '../CodeEditor'

const getReplyFieldByInvitationType = (invitation) => {
  if (!invitation) return 'edit'
  if (invitation.edge) return 'edge'
  if (invitation.tag) return 'tag'
  if (invitation.message) return 'message'
  return 'edit'
}

const invitationTabsConfig = (invitation) =>
  invitation?.edit === true
    ? []
    : [
        {
          id: 'invitationReply',
          label: prettyField(getReplyFieldByInvitationType(invitation)),
          sections: ['invitationReply'],
          default: true,
        },
        {
          id: 'invitationReplyForumView',
          label: 'Reply Forum View',
          sections: ['invitationReplyForumView'],
        },
        {
          id: 'invitationCode',
          label: 'Code',
          sections: ['invitationCode'],
        },
      ]

const InvitationWithInvitation = ({ invitation, reloadInvitation }) => {
  const [editInvitationInvitations, setEditInvitationInvitations] = useState([])
  const [activeInvitationInvitation, setActivateInvitationInvitation] = useState(null)
  const { accessToken } = useUser()

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'invitationReply':
        return (
          <InvitationReplyV2
            key={sectionName}
            invitation={invitation}
            replyField={getReplyFieldByInvitationType(invitation)}
            readOnly={true}
            noTitle
          />
        )
      case 'invitationReplyForumView':
        return (
          <InvitationReplyV2
            key={sectionName}
            invitation={invitation}
            replyField="replyForumViews"
            readOnly={true}
            noTitle
          />
        )
      case 'invitationCode':
        return <CodeEditor key={sectionName} code={invitation.web} readOnly />
      default:
        return null
    }
  }

  const getInvitationsByReplyInvitation = async () => {
    try {
      const result = await api.get(
        '/invitations',
        { 'edit.invitation.id': invitation.id, details: 'writable' },
        { accessToken }
      )
      const writableInvitations = (result.invitations ?? []).filter((p) => p.details?.writable)
      setEditInvitationInvitations(writableInvitations)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!invitation) return
    getInvitationsByReplyInvitation()
    $('[data-toggle="tooltip"]').tooltip({ html: true })
  }, [invitation])

  return (
    <>
      <div className={styles.invitationDescription}>
        <Markdown text={invitation.description} />
      </div>
      <div className={styles.invitationMeta}>
        <span className="date item">
          <Icon name="calendar" />
          <span>
            Created:{' '}
            <span data-toggle="tooltip" data-placement="top" title={invitation.cdate}>
              {formatDateTime(invitation.cdate)}
            </span>
            , Last Modified:{' '}
            <span data-toggle="tooltip" data-placement="top" title={invitation.mdate}>
              {formatDateTime(invitation.mdate)}
            </span>
          </span>
        </span>
        {invitation.readers && (
          <span
            className="readers item"
            data-toggle="tooltip"
            data-placement="top"
            title={`Visible to <br/>${invitation.readers.join(',<br/>')}`}
          >
            <Icon name="eye-open" />
            {invitation.readers.map((reader) => prettyId(reader, true)).join(', ')}
          </span>
        )}
        <span className="item">
          <Icon name="duplicate" />
          <Link href={`/invitation/revisions?id=${invitation.id}`}>Revisions</Link>
        </span>
      </div>
      <div className={styles.groupInvitations}>
        <div className={styles.invitationButtons}>
          {editInvitationInvitations.length > 0 && <span className="item">Add:</span>}
          {editInvitationInvitations.map((p) => (
            <button
              key={p.id}
              type="button"
              className="btn btn-xs mr-2"
              onClick={() =>
                setActivateInvitationInvitation(activeInvitationInvitation ? null : p)
              }
            >
              {prettyInvitationId(p.id)}
            </button>
          ))}
        </div>
        <div className={styles.activeGroupDescription}>
          <Markdown text={activeInvitationInvitation?.description} />
        </div>
        <div>
          {activeInvitationInvitation && (
            <>
              <InvitationEditor
                invitation={activeInvitationInvitation}
                existingValue={Object.fromEntries(
                  Object.keys(activeInvitationInvitation.edit?.content ?? {}).map((key) => {
                    const path = getPath(activeInvitationInvitation.edit.invitation, key)
                    const existingFieldValue = get(invitation, path)
                    return [key, existingFieldValue]
                  })
                )}
                closeInvitationEditor={() => setActivateInvitationInvitation(null)}
                onInvitationEditPosted={() => {
                  promptMessage('Edit is posted')
                  reloadInvitation()
                }}
                isGroupInvitation={false}
              />
            </>
          )}
        </div>
      </div>
      <TabList>
        {invitationTabsConfig(invitation).map((tabConfig) => (
          <Tab key={tabConfig.id} id={tabConfig.id} active={tabConfig.default}>
            {tabConfig.label}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {invitationTabsConfig(invitation).map((tabConfig) => (
          <TabPanel key={tabConfig.id} id={tabConfig.id}>
            {tabConfig.sections.map((section) => renderSection(section))}
          </TabPanel>
        ))}
      </TabPanels>
    </>
  )
}

export default InvitationWithInvitation
