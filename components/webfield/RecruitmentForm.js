/* globals promptError: false */
import { useState, useReducer } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyField } from '../../lib/utils'
import {
  constructRecruitmentResponseNote,
  orderNoteInvitationFields,
} from '../../lib/webfield-utils'
import SpinnerButton from '../SpinnerButton'
import Markdown from './Markdown'
import { ReadOnlyField, ReadOnlyFieldV2 } from './ReadOnlyField'
import VenueHeader from './VenueHeader'
import { WebfieldWidget, WebfieldWidgetV2 } from './WebfieldWidget'

const fieldsToHide = ['id', 'title', 'user', 'key', 'response']
const DeclineForm = ({
  declineMessage,
  quotaMessage,
  args,
  entity: invitation,
  responseNote,
  setDecision,
  user,
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const isV2Invitation = invitation.apiVersion === 2
  const showReducedQuota = isV2Invitation
    ? invitation.edit?.note?.content?.['reduced_quota']
    : invitation.reply?.content?.['reduced_quota']
  const showComment = isV2Invitation
    ? invitation.edit?.note?.content?.comment
    : invitation.reply?.content?.comment
  const fieldsToRender = orderNoteInvitationFields(invitation, fieldsToHide)

  const formDataReducer = (state, action) => {
    return {
      ...state,
      [action.fieldName]: action.value,
    }
  }
  const [formData, setFormData] = useReducer(
    formDataReducer,
    fieldsToRender.reduce((acc, field) => {
      acc[field] = args[field]
      return acc
    }, {})
  )

  const onSubmit = async () => {
    setIsSaving(true)
    try {
      const noteContent = {
        title: 'Recruit response',
        user: args.user,
        key: args.key,
        response: 'Yes',
        ...formData,
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

  const renderField = (fieldName) => {
    if (['reduced_quota', 'comment'].includes(fieldName)) {
      return isV2Invitation ? (
        <WebfieldWidgetV2
          field={{ [fieldName]: invitation.edit?.note?.content?.[fieldName] }}
          onChange={({ fieldName, value }) => setFormData({ fieldName, value })}
          value={formData[fieldName]}
          key={fieldName}
          user={user}
          invitation={invitation}
        />
      ) : (
        <WebfieldWidget
          field={{ [fieldName]: invitation.reply?.content?.[fieldName] }}
          onChange={({ fieldName, value }) => setFormData({ fieldName, value })}
          value={formData[fieldName]}
          key={fieldName}
          user={user}
          invitation={invitation}
        />
      )
    }
    return isV2Invitation ? (
      <ReadOnlyFieldV2
        key={fieldName}
        field={{ [fieldName]: invitation.edit?.note?.content?.[fieldName] }}
        value={formData[fieldName]}
      />
    ) : (
      <ReadOnlyField
        key={fieldName}
        field={{ [fieldName]: invitation.reply?.content?.[fieldName] }}
        value={formData[fieldName]}
      />
    )
  }

  return (
    <>
      <div className="row">
        <Markdown text={declineMessage} />
        {showReducedQuota && <Markdown text={quotaMessage} />}
      </div>
      {(showReducedQuota || showComment) && (
        <>
          <div className="row">
            {fieldsToRender.map((fieldName) => renderField(fieldName))}
          </div>
          {showReducedQuota && (
            <div className="row">
              <SpinnerButton
                type="primary"
                onClick={onSubmit}
                loading={isSaving}
                disabled={isSaving || !formData.reduced_quota}
              >
                Accept with Reduced Quota
              </SpinnerButton>
            </div>
          )}
          {!showReducedQuota && showComment && (
            <div className="row">
              <SpinnerButton
                type="primary"
                onClick={onSubmit}
                loading={isSaving}
                disabled={isSaving || !formData.comment}
              >
                Submit
              </SpinnerButton>
            </div>
          )}
        </>
      )}
    </>
  )
}

const RecruitmentForm = (props) => {
  const [decision, setDecision] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [responseNote, setResponseNote] = useState(null)
  const { user } = useUser()
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
        ...Object.fromEntries(
          Object.entries(args ?? {}).filter(([key]) => !fieldsToHide.includes(key))
        ),
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
        return (
          <DeclineForm
            responseNote={responseNote}
            setDecision={setDecision}
            user={user}
            {...props}
          />
        )
      default:
        return (
          <>
            {Object.keys(args ?? {}).map((key) => {
              if (fieldsToHide.includes(key)) return null
              return (
                <div className="row" key={key}>
                  <strong>{`${prettyField(key)}:`}</strong> <span>{args[key]}</span>
                </div>
              )
            })}
            <div className="row">
              <SpinnerButton
                type="primary"
                onClick={() => onResponseClick('Yes')}
                loading={isSaving}
                disabled={isSaving}
              >
                Accept
              </SpinnerButton>
              <SpinnerButton
                type="primary"
                onClick={() => onResponseClick('No')}
                loading={isSaving}
                disabled={isSaving}
              >
                Reject
              </SpinnerButton>
            </div>
          </>
        )
    }
  }
  return (
    <>
      <VenueHeader headerInfo={header} />
      <div className="note_editor">{renderDecision()}</div>
    </>
  )
}

export default RecruitmentForm
