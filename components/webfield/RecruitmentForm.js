/* globals promptError: false */
import { useState } from 'react'
import api from '../../lib/api-client'
import { constructRecruitmentResponseNote } from '../../lib/webfield-utils'
import SpinnerButton from '../SpinnerButton'
import Markdown from './Markdown'
import VenueHeader from './VenueHeader'
import { WebfieldWidget, WebfieldWidgetV2 } from './WebfieldWidget'

const DeclineForm = ({
  declineMessage,
  quotaMessage,
  allowReducedQuota,
  args,
  entity: invitation,
  responseNote,
  setDecision,
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const [quota, setQuota] = useState(null)
  const isV2Invitation = invitation.apiVersion === 2

  const onSubmit = async () => {
    setIsSaving(true)
    try {
      const noteContent = {
        title: 'Recruit response',
        user: args.user,
        key: args.key,
        response: 'Yes',
        quota,
      }
      const noteToPost = constructRecruitmentResponseNote(
        invitation,
        noteContent,
        responseNote
      )
      await api.post(isV2Invitation ? '/notes/edits' : '/notes', noteToPost, {
        version: isV2Invitation ? 2 : 1,
      })
      setIsSaving(false)
      setDecision('accept')
    } catch (error) {
      promptError(error.message)
      setIsSaving(false)
    }
  }

  if (!allowReducedQuota)
    return (
      <div className="row">
        <Markdown text={declineMessage} />
      </div>
    )

  return (
    <>
      <div className="row">
        <Markdown text={declineMessage} />
        <Markdown text={quotaMessage} />
      </div>
      <div className="row">
        {isV2Invitation ? (
          <WebfieldWidgetV2
            field={{ quota: invitation.edit?.note?.content?.quota }}
            onChange={({ fieldName, value }) => setQuota(value)}
            value={quota}
          />
        ) : (
          <WebfieldWidget
            field={{ quota: invitation.reply?.content?.quota }}
            onChange={({ fieldName, value }) => setQuota(value)}
            value={quota}
          />
        )}
      </div>
      <div className="row">
        <SpinnerButton onClick={onSubmit} loading={isSaving} disabled={isSaving || !quota}>
          Accept with Reduced Quota
        </SpinnerButton>
      </div>
    </>
  )
}

const RecruitmentForm = (props) => {
  const [decision, setDecision] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [responseNote, setResponseNote] = useState(null)
  const { acceptMessage, header, entity: invitation, args } = props
  const isV2Invitation = invitation.apiVersion === 2

  const onResponseClick = async (response) => {
    setIsSaving(true)
    try {
      const noteContent = {
        title: 'Recruit response',
        user: args.user,
        key: args.key,
        response,
      }
      const noteToPost = constructRecruitmentResponseNote(invitation, noteContent)
      const result = await api.post(isV2Invitation ? '/notes/edits' : '/notes', noteToPost, {
        version: isV2Invitation ? 2 : 1,
      })
      setResponseNote(result)
      setIsSaving(false)
      setDecision(response === 'Yes' ? 'accept' : 'reject')
    } catch (error) {
      promptError(error.message)
      setIsSaving(false)
      setDecision(null)
    }
  }

  const renderDecision = () => {
    switch (decision) {
      case 'accept':
        return <Markdown text={acceptMessage} />
      case 'reject':
        return <DeclineForm responseNote={responseNote} setDecision={setDecision} {...props} />
      default:
        return (
          <div className="row">
            <SpinnerButton
              onClick={() => onResponseClick('Yes')}
              loading={isSaving}
              disabled={isSaving}
            >
              Accept
            </SpinnerButton>
            <SpinnerButton
              onClick={() => onResponseClick('No')}
              loading={isSaving}
              disabled={isSaving}
            >
              Reject
            </SpinnerButton>
          </div>
        )
    }
  }
  return (
    <>
      <VenueHeader headerInfo={header} />
      <div className="note_editor existing panel">{renderDecision()}</div>
    </>
  )
}

export default RecruitmentForm
