import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Input, Modal, Pagination, Row, Space, Tag, Tooltip } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import Markdown from '../../../../components/EditorComponents/Markdown'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import api from '../../../../lib/api-client'
import { formatDateTime, getBootstrap337LabelColor, prettyId } from '../../../../lib/utils'

import styles from './nameDeletion.module.scss'

const nameDeletionDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal_Decision`
const pageSize = 25
const modalWidth = { xs: '90%', sm: '70%', md: '50%' }
const tooltipTrigger = ['hover', 'click']
const tooltipStyles = { root: { maxWidth: '500px', wordBreak: 'break-word' } }

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
    default:
      return 'default'
  }
}

export default function NameDeletionTab() {
  const [nameDeletionNotes, setNameDeletionNotes] = useState(null)
  const [page, setPage] = useState(1)
  const [idsLoading, setIdsLoading] = useState([])
  const [noteToReject, setNoteToReject] = useState(null)
  const [rejectionComment, setRejectionComment] = useState('')

  const nameDeletionNotesToShow = useMemo(() => {
    if (!nameDeletionNotes) return null
    return nameDeletionNotes.slice((page - 1) * pageSize, page * pageSize)
  }, [nameDeletionNotes, page])

  const updateRequestStatus = async (noteId) => {
    const nameRemovalNotesP = api.get('/notes', { id: noteId })
    const decisionResultsP = api.getAll(
      '/notes/edits',
      { 'note.id': noteId, invitation: nameDeletionDecisionInvitationId },
      { resultsKey: 'edits' }
    )
    const [nameRemovalNotes, decisionResults] = await Promise.all([
      nameRemovalNotesP,
      decisionResultsP,
    ])

    setNameDeletionNotes((notes) => [
      ...notes.filter((p) => p.content.status.value === 'Pending' && p.id !== noteId),
      {
        ...nameRemovalNotes.notes[0],
        processLogStatus: 'running',
        processLogUrl: `${process.env.API_V2_URL}/logs/process?id=${decisionResults[0].id}`,
      },
      ...notes.filter((p) => p.content.status.value !== 'Pending'),
    ])
  }

  const acceptRejectNameDeletionNote = async (nameDeletionNote, response, supportComment) => {
    try {
      setIdsLoading((p) => [...p, nameDeletionNote.id])
      const nameDeletionDecisionInvitation = await api.getInvitationById(
        nameDeletionDecisionInvitationId
      )

      const editToPost = view2.constructEdit({
        formData: {
          id: nameDeletionNote.id,
          status: response,
          ...(response === 'Rejected' && { support_comment: supportComment }),
        },
        invitationObj: nameDeletionDecisionInvitation,
      })
      await api.post('/notes/edits', editToPost)
      setNoteToReject(null)
      setRejectionComment('')
      updateRequestStatus(nameDeletionNote.id)
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== nameDeletionNote.id))
    }
  }

  const loadNameDeletionRequests = async () => {
    try {
      const nameRemovalNotesP = api.get('/notes', {
        invitation: `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal`,
      })
      const decisionResultsP = api.getAll(
        '/notes/edits',
        { invitation: nameDeletionDecisionInvitationId },
        { resultsKey: 'edits' }
      )
      const processLogsP = api.getAll(
        '/logs/process',
        { invitation: nameDeletionDecisionInvitationId },
        { resultsKey: 'logs' }
      )

      const [nameRemovalNotes, decisionResults, processLogs] = await Promise.all([
        nameRemovalNotesP,
        decisionResultsP,
        processLogsP,
      ])

      const sortedResult = [
        ...nameRemovalNotes.notes.filter((p) => p.content.status.value === 'Pending'),
        ...nameRemovalNotes.notes.filter((p) => p.content.status.value !== 'Pending'),
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

      setNameDeletionNotes(sortedResult)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadNameDeletionRequests()
  }, [])

  if (!nameDeletionNotesToShow) return <LoadingSpinner />

  return (
    <>
      <Row
        align="middle"
        gutter={[8, 0]}
        className={styles.columnheaders}
        style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
      >
        <Col xs={8} sm={6} md={4} lg={3}>
          Status
        </Col>
        <Col xs={16} sm={6} md={4} lg={4}>
          Requester
        </Col>
        <Col xs={12} sm={8} md={4} lg={4}>
          Name to delete
        </Col>
        <Col xs={12} sm={8} md={5} lg={5}>
          Reason
        </Col>
        <Col xs={12} sm={8} md={4} lg={4}>
          Date
        </Col>
        <Col xs={12} sm={8} md={3} lg={4}>
          Actions
        </Col>
      </Row>

      <Flex vertical gap="small" style={{ marginBottom: '1.5rem', minHeight: '600px' }}>
        {nameDeletionNotesToShow.map((note) => (
          <Row key={note.id} align="middle" gutter={[8, 8]}>
            <Col xs={8} sm={6} md={4} lg={3}>
              <Space size={4} wrap>
                <Tag color={getBootstrap337LabelColor(getStatusColor(note))} variant="solid">
                  {note.content.status.value}
                </Tag>
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
            <Col xs={16} sm={6} md={4} lg={4} className={styles.truncatedtext}>
              <a href={`/profile?id=${note.signatures[0]}`} target="_blank" rel="noreferrer">
                {prettyId(note.signatures[0])}
              </a>
            </Col>
            <Col xs={12} sm={8} md={4} lg={4}>
              <Tooltip
                title={
                  <>
                    {note.content.usernames.value.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </>
                }
                trigger={tooltipTrigger}
                styles={tooltipStyles}
              >
                <span className={styles.truncatedtext}>{note.content.usernames.value.join(', ')}</span>
              </Tooltip>
            </Col>
            <Col xs={12} sm={8} md={5} lg={5}>
              <Tooltip
                title={<Markdown text={note.content.comment.value} />}
                trigger={tooltipTrigger}
                styles={tooltipStyles}
              >
                <span className={styles.truncatedtext}>{note.content.comment.value}</span>
              </Tooltip>
            </Col>
            <Col xs={12} sm={8} md={4} lg={4}>
              {formatDateTime(note.tcdate)}
            </Col>
            <Col xs={12} sm={8} md={3} lg={4}>
              {note.content.status.value === 'Pending' && (
                <Space size={4}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    classNames={{ content: styles.actionbuttoncontent }}
                    disabled={idsLoading.includes(note.id)}
                    onClick={() => acceptRejectNameDeletionNote(note, 'Accepted')}
                  >
                    Accept
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
                </Space>
              )}
            </Col>
          </Row>
        ))}
      </Flex>

      {nameDeletionNotes.length === 0 ? (
        <p>No name deletion requests.</p>
      ) : (
        <Pagination
          align="center"
          current={page}
          pageSize={pageSize}
          total={nameDeletionNotes.length}
          onChange={(newPage) => setPage(newPage)}
          showSizeChanger={false}
          hideOnSinglePage
        />
      )}

      <Modal
        title={`Reason for rejecting ${noteToReject?.content?.name?.value ?? ''}`}
        open={!!noteToReject}
        okText="Submit"
        okButtonProps={{ disabled: !rejectionComment.trim() }}
        destroyOnHidden
        onCancel={() => {
          setNoteToReject(null)
          setRejectionComment('')
        }}
        onOk={() => acceptRejectNameDeletionNote(noteToReject, 'Rejected', rejectionComment)}
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
