import { Button, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useRef, useState } from 'react'
import { prettyInvitationId } from '../../lib/utils'
import NoteEditor from '../NoteEditor'

import styles from './ForumReplyForm.module.scss'
import { forum as legacyStyles } from '../../lib/legacy-bootstrap-styles'

const ForumReplyForm = ({
  replyInvitations,
  replyDepth,
  updateNote,
  replyToNote,
  scrollToNote,
}) => {
  const [activeInvitation, setActiveInvitation] = useState(null)
  const buttonsRef = useRef(null)

  const toggleReplyFormNoteEditor = (invitation) => {
    if (activeInvitation?.id === invitation.id) {
      setActiveInvitation(null)
      return
    }
    setActiveInvitation(invitation)
    setTimeout(() => {
      buttonsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  if (!replyInvitations?.length) return null

  return (
    <div className={styles.container}>
      <div ref={buttonsRef} className={styles.buttons}>
        <span className={styles.hint}>Add:</span>
        {replyInvitations.map((inv) => {
          const expired = inv.expdate < Date.now()
          const isActive = activeInvitation?.id === inv.id
          return (
            <Tooltip
              key={inv.id}
              title={
                expired
                  ? `${prettyInvitationId(inv.id)} expired ${dayjs(inv.expdate).fromNow()}`
                  : null
              }
            >
              <Button
                type="primary"
                size="small"
                onClick={() => toggleReplyFormNoteEditor(inv)}
                styles={{
                  root: {
                    ...legacyStyles.replyInvitationButton,
                    ...(isActive && legacyStyles.replyInvitationButtonActive),
                    ...(expired && legacyStyles.replyInvitationButtonExpired),
                  },
                }}
              >
                {prettyInvitationId(inv.id)}
              </Button>
            </Tooltip>
          )
        })}
      </div>

      <NoteEditor
        key={activeInvitation?.id}
        invitation={activeInvitation}
        replyToNote={replyToNote}
        className={`${styles.editor} ${replyDepth % 2 === 0 ? styles.editorEven : styles.editorOdd}`}
        closeNoteEditor={() => {
          setActiveInvitation(null)
        }}
        onNoteCreated={(newNote) => {
          updateNote(newNote)
          setActiveInvitation(null)
          scrollToNote(newNote.id)
        }}
        isDirectReplyToForum={false}
      />
    </div>
  )
}

export default ForumReplyForm
