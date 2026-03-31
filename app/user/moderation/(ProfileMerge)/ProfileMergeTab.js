import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Input, Modal, Pagination, Row, Space, Tag, Tooltip } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import api from '../../../../lib/api-client'
import { formatDateTime, getBootstrap337LabelColor, prettyId } from '../../../../lib/utils'

import styles from './profileMerge.module.scss'

const pageSize = 25
const modalWidth = { xs: '90%', sm: '70%', md: '50%' }
const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`
const profileMergeDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge_Decision`

const getStatusColor = (note) => {
  switch (note.content.status.value) {
    case 'Accepted':
      return 'success'
    case 'Rejected':
      return 'error'
    default:
      return 'default'
  }
}

const getProcessLogStatusColor = (note) => {
  switch (note.processLogStatus) {
    case 'ok':
      return 'success'
    case 'error':
      return 'error'
    case 'running':
      return 'default'
    default:
      return 'default'
  }
}

export default function ProfileMergeTab() {
  const [profileMergeNotes, setProfileMergeNotes] = useState(null)
  const [page, setPage] = useState(1)
  const [noteToReject, setNoteToReject] = useState(null)
  const [rejectionComment, setRejectionComment] = useState('')
  const [idsLoading, setIdsLoading] = useState([])

  const profileMergeNotesToShow = useMemo(() => {
    if (!profileMergeNotes) return null
    return profileMergeNotes.slice((page - 1) * pageSize, page * pageSize)
  }, [profileMergeNotes, page])

  const updateRequestStatus = async (noteId) => {
    try {
      const profileMergeNotesP = api.get('/notes', { id: noteId })
      const decisionResultsP = api.getAll(
        '/notes/edits',
        { 'note.id': noteId },
        { resultsKey: 'edits' }
      )
      const [profileMergeNotesResults, decisionResults] = await Promise.all([
        profileMergeNotesP,
        decisionResultsP,
      ])
      setProfileMergeNotes((notes) => [
        ...notes.filter((p) => p.content.status.value === 'Pending' && p.id !== noteId),
        {
          ...profileMergeNotesResults.notes[0],
          processLogStatus: 'running',
          processLogUrl: `${process.env.API_V2_URL}/logs/process?id=${decisionResults[0].id}`,
        },
        ...notes.filter((p) => p.content.status.value !== 'Pending'),
      ])
    } catch (error) {
      promptError(error.message)
    }
  }

  const acceptRejectProfileMergeNote = async (profileMergeNote, response, supportComment) => {
    try {
      setIdsLoading((p) => [...p, profileMergeNote.id])
      const profileMergeDecisionInvitation = await api.getInvitationById(
        profileMergeDecisionInvitationId
      )
      const editToPost = view2.constructEdit({
        formData: {
          id: profileMergeNote.id,
          status: response,
          ...(response === 'Rejected' && { support_comment: supportComment }),
        },
        invitationObj: profileMergeDecisionInvitation,
      })
      await api.post('/notes/edits', editToPost)
      setNoteToReject(null)
      setRejectionComment('')
      updateRequestStatus(profileMergeNote.id)
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== profileMergeNote.id))
    }
  }

  const loadProfileMergeRequests = async () => {
    try {
      const profileMergeNotesP = api.get('/notes', {
        invitation: profileMergeInvitationId,
      })
      const decisionResultsP = api.getAll(
        '/notes/edits',
        { invitation: profileMergeDecisionInvitationId },
        { resultsKey: 'edits' }
      )
      const processLogsP = api.getAll(
        '/logs/process',
        { invitation: profileMergeDecisionInvitationId },
        { resultsKey: 'logs' }
      )

      const [profileMergeNotesResults, decisionResults, processLogs] = await Promise.all([
        profileMergeNotesP,
        decisionResultsP,
        processLogsP,
      ])

      const sortedResult = [
        ...profileMergeNotesResults.notes.filter((p) => p.content.status.value === 'Pending'),
        ...profileMergeNotesResults.notes.filter((p) => p.content.status.value !== 'Pending'),
      ].map((p) => {
        const decisionEdit = decisionResults.find((q) => q.note.id === p.id)
        let processLogStatus = 'N/A'
        if (p.content.status.value !== 'Pending')
          processLogStatus =
            processLogs.find((q) => q.id === decisionEdit?.id)?.status ?? 'running'
        return {
          ...p,
          processLogStatus,
          processLogUrl: decisionEdit
            ? `${process.env.API_V2_URL}/logs/process?id=${decisionEdit.id}`
            : null,
        }
      })

      setProfileMergeNotes(sortedResult)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadProfileMergeRequests()
  }, [])

  if (!profileMergeNotesToShow) return <LoadingSpinner />

  return (
    <>
      <Row
        align="middle"
        gutter={[8, 0]}
        className={styles.columnheaders}
        style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
      >
        <Col xs={8} sm={4} md={4} lg={3}>
          Status
        </Col>
        <Col xs={16} sm={4} md={4} lg={4}>
          Signature/Email
        </Col>
        <Col xs={12} sm={5} md={5} lg={5}>
          Compare
        </Col>
        <Col xs={12} sm={3} md={2} lg={2}>
          Comment
        </Col>
        <Col xs={12} sm={4} md={4} lg={4}>
          Date
        </Col>
        <Col xs={12} sm={4} md={5} lg={6}>
          Actions
        </Col>
      </Row>

      <Flex vertical gap="small" style={{ marginBottom: '1.5rem', minHeight: '600px' }}>
        {profileMergeNotesToShow.map((note) => (
          <Row key={note.id} align="middle" gutter={[8, 8]}>
            <Col xs={8} sm={4} md={4} lg={3}>
              <Space size={4} wrap>
                {note.content.support_comment?.value ? (
                  <Tooltip title={note.content.support_comment.value}>
                    <Tag
                      className={styles.statustag}
                      color={getBootstrap337LabelColor(getStatusColor(note))}
                      variant="solid"
                    >
                      {note.content.status.value}
                    </Tag>
                  </Tooltip>
                ) : (
                  <Tag
                    className={styles.statustag}
                    color={getBootstrap337LabelColor(getStatusColor(note))}
                    variant="solid"
                  >
                    {note.content.status.value}
                  </Tag>
                )}
                {note.processLogStatus !== 'N/A' && (
                  <a href={note.processLogUrl} target="_blank" rel="noreferrer">
                    <Tag
                      color={getBootstrap337LabelColor(getProcessLogStatusColor(note))}
                      variant="solid"
                    >
                      {note.processLogStatus}
                    </Tag>
                  </a>
                )}
              </Space>
            </Col>
            <Col xs={16} sm={4} md={4} lg={4} className={styles.truncatedtext}>
              {note.signatures[0] === '(guest)' ? (
                note.content.email.value
              ) : (
                <a href={`/profile?id=${note.signatures[0]}`} target="_blank" rel="noreferrer">
                  {prettyId(note.signatures[0])}
                </a>
              )}
            </Col>
            <Col xs={12} sm={5} md={5} lg={5} className={styles.truncatedtext}>
              <a
                href={`/profile/compare?left=${note.content.left.value}&right=${note.content.right.value}`}
                target="_blank"
                rel="noreferrer"
              >
                {`${note.content.left.value}, ${note.content.right.value}`}
              </a>
            </Col>
            <Col xs={12} sm={3} md={2} lg={2} className={styles.truncatedtext}>
              {note.content.comment.value}
            </Col>
            <Col xs={12} sm={4} md={4} lg={4}>
              {formatDateTime(note.tcdate)}
            </Col>
            <Col xs={24} sm={4} md={5} lg={6}>
              {note.content.status.value === 'Pending' && (
                <Space size={4} wrap>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    classNames={{ content: styles.actionbuttoncontent }}
                    disabled={idsLoading.includes(note.id)}
                    onClick={() => acceptRejectProfileMergeNote(note, 'Accepted')}
                  >
                    Done
                  </Button>
                  <Button
                    size="small"
                    icon={<CloseCircleOutlined />}
                    classNames={{ content: styles.actionbuttoncontent }}
                    disabled={idsLoading.includes(note.id)}
                    onClick={() => setNoteToReject(note)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    classNames={{ content: styles.actionbuttoncontent }}
                    disabled={idsLoading.includes(note.id)}
                    onClick={() => acceptRejectProfileMergeNote(note, 'Ignored')}
                  >
                    Ignore
                  </Button>
                </Space>
              )}
            </Col>
          </Row>
        ))}
      </Flex>

      {profileMergeNotes.length === 0 ? (
        <p>No profile merge requests.</p>
      ) : (
        <Pagination
          align="center"
          current={page}
          pageSize={pageSize}
          total={profileMergeNotes.length}
          onChange={(newPage) => setPage(newPage)}
          showSizeChanger={false}
          hideOnSinglePage
        />
      )}

      <Modal
        title="Reason for rejection"
        open={!!noteToReject}
        okText="Submit"
        okButtonProps={{ disabled: !rejectionComment.trim() }}
        destroyOnHidden
        onCancel={() => {
          setNoteToReject(null)
          setRejectionComment('')
        }}
        onOk={() => acceptRejectProfileMergeNote(noteToReject, 'Rejected', rejectionComment)}
        width={modalWidth}
      >
        <Input.TextArea
          rows={5}
          value={rejectionComment}
          onChange={(e) => setRejectionComment(e.target.value)}
          placeholder="Enter reason for rejection"
        />
      </Modal>
    </>
  )
}
