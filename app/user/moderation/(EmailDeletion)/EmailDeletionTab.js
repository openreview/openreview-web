/* globals promptError: false */

import { Col, Flex, Pagination, Row, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import api from '../../../../lib/api-client'
import { formatDateTime } from '../../../../lib/utils'
import EmailDeletionForm from './EmailDeletionForm'

import styles from './emailDeletion.module.scss'
import {
  getBootstrap337LabelColor,
  moderation as legacyStyles,
} from '../../../../lib/legacy-bootstrap-styles'

const emailRemovalInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Email_Removal`
const pageSize = 25

export default function EmailDeletionTab() {
  const [emailDeletionNotes, setEmailDeletionNotes] = useState(null)
  const [page, setPage] = useState(1)

  const emailDeletionNotesToShow = useMemo(() => {
    if (!emailDeletionNotes) return null
    return emailDeletionNotes.slice((page - 1) * pageSize, page * pageSize)
  }, [emailDeletionNotes, page])

  const loadEmailDeletionNotes = async () => {
    try {
      const notesResultP = api.getAll('/notes', {
        invitation: emailRemovalInvitationId,
        sort: 'tcdate',
      })
      const editResultsP = api.getAll(
        '/notes/edits',
        { invitation: emailRemovalInvitationId },
        { resultsKey: 'edits' }
      )
      const processLogsP = api.getAll(
        '/logs/process',
        { invitation: emailRemovalInvitationId },
        { resultsKey: 'logs' }
      )
      const [notes, edits, processLogs] = await Promise.all([
        notesResultP,
        editResultsP,
        processLogsP,
      ])

      const notesWithStatus = notes.map((p) => {
        const edit = edits.find((q) => q.note.id === p.id)
        const processLog = processLogs.find((q) => q.id === edit?.id)
        return {
          ...p,
          processLogStatus: processLog?.status ?? 'running',
          processLogUrl: processLog
            ? `${process.env.API_V2_URL}/logs/process?id=${processLog.id}`
            : null,
        }
      })

      setEmailDeletionNotes(notesWithStatus)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadEmailDeletionNotes()
  }, [])

  if (!emailDeletionNotesToShow) return <LoadingSpinner />

  return (
    <>
      <EmailDeletionForm
        emailRemovalInvitationId={emailRemovalInvitationId}
        setEmailDeletionNotes={setEmailDeletionNotes}
      />

      <Row
        align="middle"
        gutter={[8, 0]}
        className={styles.columnheaders}
        style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
      >
        <Col xs={6} sm={4} md={3} lg={2}>
          Status
        </Col>
        <Col xs={18} sm={8} md={5} lg={6}>
          Email
        </Col>
        <Col xs={12} sm={8} md={6} lg={6}>
          Profile Id
        </Col>
        <Col xs={12} sm={8} md={6} lg={6}>
          Comment
        </Col>
        <Col xs={12} sm={8} md={4} lg={4}>
          Date
        </Col>
      </Row>

      <Flex vertical gap="small" style={{ marginBottom: '1.5rem', minHeight: '600px' }}>
        {emailDeletionNotesToShow.map((note) => (
          <Row key={note.id} align="middle" gutter={[8, 8]}>
            <Col xs={6} sm={4} md={3} lg={2}>
              <a href={note.processLogUrl} target="_blank" rel="noreferrer">
                <Tag
                  color={getBootstrap337LabelColor(
                    note.processLogStatus === 'ok' ? 'success' : 'default'
                  )}
                  variant="solid"
                  styles={{ root: legacyStyles.statusTag }}
                >
                  {note.processLogStatus}
                </Tag>
              </a>
            </Col>
            <Col xs={18} sm={8} md={5} lg={6} className={styles.truncatedtext}>
              {note.content.email.value}
            </Col>
            <Col xs={12} sm={8} md={6} lg={6} className={styles.truncatedtext}>
              <a
                href={`/profile?id=${note.content.profile_id.value}`}
                target="_blank"
                rel="noreferrer"
              >
                {note.content.profile_id.value}
              </a>
            </Col>
            <Col xs={12} sm={8} md={6} lg={6} className={styles.truncatedtext}>
              {note.content.comment.value}
            </Col>
            <Col xs={12} sm={8} md={4} lg={4}>
              {formatDateTime(note.tcdate)}
            </Col>
          </Row>
        ))}
      </Flex>

      {emailDeletionNotes.length === 0 ? (
        <p>No email deletion requests.</p>
      ) : (
        <Pagination
          align="center"
          current={page}
          pageSize={pageSize}
          total={emailDeletionNotes.length}
          onChange={(newPage) => setPage(newPage)}
          showSizeChanger={false}
          hideOnSinglePage
        />
      )}
    </>
  )
}
