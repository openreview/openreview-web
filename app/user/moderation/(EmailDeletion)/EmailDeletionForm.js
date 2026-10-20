'use client'

import { Button, Col, Input, Row } from 'antd'
import { useState } from 'react'
import api from '../../../../lib/api-client'

import { moderation as legacyStyles } from '../../../../lib/legacy-bootstrap-styles'

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
    <Row gutter={[8, 8]} align="middle" style={legacyStyles.filterForm}>
      <Col xs={24} md={6}>
        <Input
          placeholder="Email to delete"
          style={legacyStyles.formInput}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onPressEnter={handleEmailDeletionRequest}
        />
      </Col>
      <Col xs={24} md={6}>
        <Input
          placeholder="Profile ID the email is associated with"
          style={legacyStyles.formInput}
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          onPressEnter={handleEmailDeletionRequest}
        />
      </Col>
      <Col xs={24} md={10}>
        <Input
          placeholder="Moderator comment"
          style={legacyStyles.formInput}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onPressEnter={handleEmailDeletionRequest}
        />
      </Col>
      <Col xs={24} md={2}>
        <Button
          type="primary"
          styles={{ root: legacyStyles.formButton }}
          onClick={handleEmailDeletionRequest}
        >
          Submit
        </Button>
      </Col>
    </Row>
  )
}
