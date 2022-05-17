import { useRouter } from 'next/router'
import { useState } from 'react'
import api from '../../lib/api-client'
import { constructRecruitmentResponseNote } from '../../lib/webfield-utils'
import SpinnerButton from '../SpinnerButton'
import Markdown from './Markdown'
import VenueHeader from './VenueHeader'

const DeclineForm = ({
  declineMessage,
  allowReducedQuota,
  args,
  setDecision,
  invitation,
  isV2Invitation,
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const [quota, setQuota] = useState(null)
  const router = useRouter()

  const onSubmit = async (withReducedQuota) => {
    setIsSaving(true)
    try {
      const noteContent = {
        title: 'Recruit response',
        user: args.user,
        key: args.key,
        response: withReducedQuota ? 'Yes' : 'No',
        ...(withReducedQuota && { quota }),
      }
      const noteToPost = constructRecruitmentResponseNote(invitation, noteContent)
      await api.post(isV2Invitation ? '/notes/edits' : '/notes', noteToPost, {
        version: isV2Invitation ? 2 : 1,
      })
      setIsSaving(false)
      if (withReducedQuota) {
        setDecision('accept')
      } else {
        router.replace('/')
      }
    } catch (error) {
      promptError(error.message)
      setIsSaving(false)
      setDecision(null)
    }
  }
  return (
    <>
      <div className="row">
        <Markdown text={declineMessage} />
        {allowReducedQuota && (
          <div className="hover_title">
            <span className="line_heading">Load to request</span>
            <input
              placeholder="Load to request"
              className="form-control dropdown note_content_value"
              autoComplete="off"
              type="number"
              onChange={(e) => setQuota(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="row">
        {allowReducedQuota && (
          <SpinnerButton
            onClick={() => onSubmit(true)}
            loading={isSaving}
            disabled={isSaving || !quota}
          >
            Accept with Reduced Quota
          </SpinnerButton>
        )}
        <SpinnerButton onClick={() => onSubmit(false)} loading={isSaving} disabled={isSaving}>
          Reject
        </SpinnerButton>
      </div>
    </>
  )
}

const RecruitmentForm = ({
  acceptMessage,
  declineMessage,
  header,
  entity: invitation,
  allowReducedQuota,
  args,
}) => {
  const [decision, setDecision] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const isV2Invitation = invitation.apiVersion === 2
  const onAcceptClick = async () => {
    setIsSaving(true)
    try {
      const noteContent = {
        title: 'Recruit response',
        user: args.user,
        key: args.key,
        response: 'Yes',
      }
      const noteToPost = constructRecruitmentResponseNote(invitation, noteContent)
      await api.post(isV2Invitation ? '/notes/edits' : '/notes', noteToPost, {
        version: isV2Invitation ? 2 : 1,
      })
      setIsSaving(false)
      setDecision('accept')
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
        return (
          <DeclineForm
            declineMessage={declineMessage}
            allowReducedQuota={allowReducedQuota}
            args={args}
            setDecision={setDecision}
            invitation={invitation}
            isV2Invitation={isV2Invitation}
          />
        )
      default:
        return (
          <div className="row">
            <SpinnerButton onClick={onAcceptClick} loading={isSaving} disabled={isSaving}>
              Accept
            </SpinnerButton>
            <SpinnerButton
              onClick={() => setDecision('reject')}
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
