/* globals promptMessage,$: false */

import dayjs from 'dayjs'
import { useState } from 'react'
import { get } from 'lodash'
import { prettyInvitationId } from '../../../lib/utils'
import styles from '../../../styles/components/GroupSectionWithEditInvitations.module.scss'
import Markdown from '../../../components/EditorComponents/Markdown'
import InvitationEditor from '../../../components/group/InvitationEditor'

export default function GroupSectionWithEditInvitation({
  group,
  editInvitations,
  reloadGroup,
  children,
}) {
  const [activeGroupInvitation, setActivateGroupInvitation] = useState(null)

  if (activeGroupInvitation)
    return (
      <div className={styles.editContainer}>
        <div className={styles.activeGroupDescription}>
          <Markdown text={activeGroupInvitation?.description} />
        </div>
        <div>
          {activeGroupInvitation && (
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
          )}
        </div>
      </div>
    )

  return (
    <div className={styles.container}>
      <div className={styles.sectionContent}>{children}</div>
      <div className={styles.invitationButtons}>
        {editInvitations?.length > 0 && (
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-xs dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Edit &nbsp;
              <span className="caret" />
            </button>
            <ul className="dropdown-menu">
              {editInvitations?.map((invitation) => {
                const expired = invitation.expdate < Date.now()
                return (
                  <li
                    key={invitation.id}
                    className={expired ? 'expired' : ''}
                    data-toggle="tooltip"
                    data-placement="top"
                    title={
                      expired
                        ? `${prettyInvitationId(invitation.id)} expired ${dayjs(invitation.expdate).fromNow()}`
                        : ''
                    }
                  >
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a
                      href="#"
                      data-id={invitation.id}
                      onClick={(e) => {
                        e.preventDefault()
                        setActivateGroupInvitation(invitation)
                      }}
                    >
                      {prettyInvitationId(invitation.id)}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
