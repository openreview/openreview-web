/* globals promptError,promptMessage,$: false */

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { get } from 'lodash'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
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
import InvitationReply, { InvitationReplyV2 } from './InvitationReply'
import CodeEditor from '../CodeEditor'
import EditorSection from '../EditorSection'
import InvitationChildInvitations, {
  InvitationChildInvitationsV2,
} from './InvitationChildInvitations'
import ConsoleTabs from '../webfield/ConsoleTabs'

dayjs.extend(isSameOrBefore)

const getReplyFieldByInvitationType = (invitation) => {
  if (!invitation) return 'edit'
  if (invitation.edge) return 'edge'
  if (invitation.tag) return 'tag'
  if (invitation.message) return 'message'
  return 'edit'
}

const invitationTabsConfig = (invitation) => {
  const isMetaInvitation = invitation?.edit === true
  const isV1Invitation = invitation.apiVersion !== 2
  const tabs = [
    {
      id: 'invitationReply',
      label: isV1Invitation
        ? 'Reply Forum Views'
        : prettyField(getReplyFieldByInvitationType(invitation)),
      sections: ['invitationReply'],
    },
    ...(isMetaInvitation
      ? []
      : [
          {
            id: 'childInvitations',
            label: 'Child Invitations',
            sections: ['invitationChildInvitations'],
          },
        ]),
    ...(isV1Invitation
      ? []
      : [
          {
            id: 'invitationContent',
            label: 'Content',
            sections: ['invitationContent'],
          },
          {
            id: 'contentProcessFunctions',
            label: 'Content Process Functions',
            sections: ['contentProcessFunctions'],
          },
        ]),
    {
      id: 'processFunctions',
      label: 'Process Functions',
      sections: ['invitationProcessFunctions'],
    },
    {
      id: 'invitationCode',
      label: 'Code',
      sections: ['invitationCode'],
    },
  ]
  tabs[0].default = true
  return tabs
}

const InvitationWithInvitation = ({ invitation, reloadInvitation }) => {
  const [editInvitationInvitations, setEditInvitationInvitations] = useState([])
  const [activeInvitationInvitation, setActivateInvitationInvitation] = useState(null)
  const { accessToken } = useUser()
  const isV1Invitation = invitation.apiVersion !== 2
  const isActivated = dayjs(invitation.cdate).isSameOrBefore(dayjs())

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'invitationReply':
        if (isV1Invitation) {
          return (
            <InvitationReply
              key={sectionName}
              invitation={invitation}
              replyField="replyForumViews"
              readOnly={true}
              noTitle
            />
          )
        }
        return (
          <InvitationReplyV2
            key={sectionName}
            invitation={invitation}
            replyField={getReplyFieldByInvitationType(invitation)}
            readOnly={true}
            noTitle
          />
        )
      case 'invitationChildInvitations':
        if (isV1Invitation)
          return <InvitationChildInvitations key={sectionName} invitation={invitation} />
        return <InvitationChildInvitationsV2 key={sectionName} invitation={invitation} />
      case 'invitationReplyForumView':
        if (isV1Invitation)
          return (
            <InvitationReply
              key={sectionName}
              invitation={invitation}
              replyField="replyForumViews"
              readOnly={true}
            />
          )
        return (
          <InvitationReplyV2
            key={sectionName}
            invitation={invitation}
            replyField="replyForumViews"
            readOnly={true}
            noTitle
          />
        )
      case 'invitationContent':
        if (isV1Invitation) return null
        return (
          <InvitationReplyV2
            key={sectionName}
            invitation={invitation}
            replyField="content"
            readOnly={true}
            noTitle
          />
        )
      case 'contentProcessFunctions':
        const contentScripts = Object.keys(invitation.content ?? {}).filter(
          (key) => key.endsWith('_script') && typeof invitation.content[key].value === 'string'
        )
        if (!contentScripts.length)
          return (
            <p key={nanoid()} className="empty-message">
              No content process functions
            </p>
          )
        return contentScripts.map((contentScript, index) => (
          <React.Fragment key={index}>
            <EditorSection title={prettyField(contentScript)} />
            <CodeEditor code={invitation.content[contentScript].value} readOnly />
          </React.Fragment>
        ))
      case 'invitationProcessFunctions':
        return (
          <React.Fragment key="invitationProcessFunctions">
            <EditorSection title="Pre Process">
              <CodeEditor code={invitation.preprocess} readOnly />
            </EditorSection>
            <EditorSection title="Process">
              <CodeEditor code={invitation.process} readOnly />
            </EditorSection>
            <EditorSection title="Date Process">
              {invitation.dateprocesses?.length > 0 ? (
                <>
                  {invitation.dateprocesses.map((dateProcess, index) => {
                    const { dates, cron, startDate, endDate, delay, script } = dateProcess
                    return (
                      <React.Fragment key={index}>
                        {delay && <div>Delay: {delay}</div>}
                        {cron && (
                          <div>
                            Cron: {cron}, Start date: {startDate}, End date: {endDate}
                          </div>
                        )}
                        {dates && <div>Dates: {dates.join(', ')}</div>}
                        <CodeEditor key={index} code={script} readOnly />
                      </React.Fragment>
                    )
                  })}
                </>
              ) : (
                <p className="empty-message">No Date Process to display</p>
              )}
            </EditorSection>
            <EditorSection title="Post Process">
              {invitation.postprocesses?.length > 0 ? (
                <>
                  {invitation.postprocesses.map((postProcess, index) => {
                    const { dates, cron, startDate, endDate, delay, script } = postProcess
                    return (
                      <React.Fragment key={index}>
                        {delay && <div>Delay: {delay}</div>}
                        {cron && (
                          <div>
                            Cron: {cron}, Start date: {startDate}, End date: {endDate}
                          </div>
                        )}
                        {dates && <div>Dates: {dates.join(', ')}</div>}
                        <CodeEditor key={index} code={script} readOnly />
                      </React.Fragment>
                    )
                  })}
                </>
              ) : (
                <p className="empty-message">No Post Process to display</p>
              )}
            </EditorSection>
          </React.Fragment>
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
    <div className={invitation.ddate ? styles.deleted : ''}>
      <div className={styles.invitationDescription}>
        <Markdown text={invitation.description} />
      </div>
      <div className={styles.invitationMeta}>
        <span className="item">
          <Icon name="calendar" />
          <span>
            Created:{' '}
            <span data-toggle="tooltip" data-placement="top" title={invitation.tcdate}>
              {formatDateTime(invitation.tcdate)}
            </span>
            , {isActivated ? 'Activated' : 'Activate on'}:{' '}
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
      <div className={styles.invitationMeta}>
        {invitation.duedate && (
          <span className="item">
            <Icon name="calendar" />
            <span>
              Due:{' '}
              <span data-toggle="tooltip" data-placement="top" title={invitation.duedate}>
                {formatDateTime(invitation.duedate)}
              </span>
            </span>
          </span>
        )}
        {invitation.expdate && (
          <span className="item">
            <Icon name="calendar" />
            <span>
              Expiration:{' '}
              <span data-toggle="tooltip" data-placement="top" title={invitation.expdate}>
                {formatDateTime(invitation.expdate)}
              </span>
            </span>
          </span>
        )}
        {invitation.ddate && (
          <span className="item">
            <Icon name="calendar" />
            <span>
              Deleted:{' '}
              <span data-toggle="tooltip" data-placement="top" title={invitation.ddate}>
                {formatDateTime(invitation.ddate)}
              </span>
            </span>
          </span>
        )}
      </div>
      <div className={styles.invitationMeta}>
        <span>
          Invitees: <span>{invitation.invitees.map((p) => prettyId(p)).join(', ')}</span>
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

      <ConsoleTabs
        defaultActiveTabId={invitationTabsConfig(invitation)[0].id}
        tabs={invitationTabsConfig(invitation).map((tabConfig, index) => ({
          ...tabConfig,
          content: tabConfig.sections.map((section) => renderSection(section)),
          visible: true,
        }))}
      />
    </div>
  )
}

export default InvitationWithInvitation
