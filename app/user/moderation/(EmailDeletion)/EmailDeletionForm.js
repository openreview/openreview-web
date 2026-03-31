'use client'

import { Button, Col, Input, Row } from 'antd'
import { useState } from 'react'
import api from '../../../../lib/api-client'

export default function EmailDeletionForm({
  emailRemovalInvitationId,
  setEmailDeletionNotes,
}) {
  const [email, setEmail] = useState('')
  const [profileId, setProfileId] = useState('')
  const [comment, setComment] = useState('')

  const handleEmailDeletionRequest = async () => {
    const formContent = {
      email: email.trim() || undefined,
      profile_id: profileId.trim() || undefined,
      comment: comment.trim() || undefined,
    }
    try {
      const emailRemovalInvitation = await api.getInvitationById(emailRemovalInvitationId)

      const editToPost = view2.constructEdit({
        formData: formContent,
        invitationObj: emailRemovalInvitation,
      })

      const editResult = await api.post('/notes/edits', editToPost, {
        version: 2,
      })
      const noteResult = await api.getNoteById(editResult.note.id)

      setEmailDeletionNotes((emailDeletionNotes) => [
        { ...noteResult, processLogStatus: 'running' },
        ...emailDeletionNotes,
      ])

      setEmail('')
      setProfileId('')
      setComment('')
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <Row
      gutter={[8, 8]}
      align="middle"
      style={{
        backgroundColor: '#efece3',
        padding: '0.5rem',
        marginBottom: '0.75rem',
      }}
    >
      <Col xs={24} md={6}>
        <Input
          placeholder="Email to delete"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onPressEnter={handleEmailDeletionRequest}
        />
      </Col>
      <Col xs={24} md={6}>
        <Input
          placeholder="Profile ID the email is associated with"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          onPressEnter={handleEmailDeletionRequest}
        />
      </Col>
      <Col xs={24} md={10}>
        <Input
          placeholder="Moderator comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onPressEnter={handleEmailDeletionRequest}
        />
      </Col>
      <Col xs={24} md={2}>
        <Button type="primary" onClick={handleEmailDeletionRequest}>
          Submit
        </Button>
      </Col>
    </Row>
  )
}
