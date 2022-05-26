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
import Markdown from '../EditorComponents/Markdown'
import { ReadOnlyField, ReadOnlyFieldV2 } from '../EditorComponents/ReadOnlyField'
import VenueHeader from './VenueHeader'
import { WebfieldWidget, WebfieldWidgetV2 } from './WebfieldWidget'

const fieldsToHide = ['id', 'title', 'key', 'response']
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
    ? invitation.edit?.note?.content?.reduced_quota
    : invitation.reply?.content?.reduced_quota
  const showComment = isV2Invitation
    ? invitation.edit?.note?.content?.comment
    : invitation.reply?.content?.comment
  const fieldsToRender = orderNoteInvitationFields(invitation, fieldsToHide)
  const [formSubmitted, setFormSubmitted] = useState(false)

  const formDataReducer = (state, action) => ({
    ...state,
    [action.fieldName]: action.value,
  })

  const [formData, setFormData] = useReducer(
    formDataReducer,
    fieldsToRender.reduce((acc, field) => {
      acc[field] = args[field]
      return acc
    }, {})
  )

  const onSubmit = async (isAcceptResponse) => {
    setIsSaving(true)
    try {
      const noteContent = {
        title: 'Recruit response',
        user: args.user,
        key: args.key,
        response: isAcceptResponse ? 'Yes' : 'No',
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
      setFormSubmitted(true)
      if (isAcceptResponse) setDecision('accept')
    } catch (error) {
      promptError(error.message)
      setIsSaving(false)
    }
  }

  const renderField = (fieldToRender) => {
    if (['reduced_quota', 'comment'].includes(fieldToRender)) {
      return isV2Invitation ? (
        <WebfieldWidgetV2
          field={{ [fieldToRender]: invitation.edit?.note?.content?.[fieldToRender] }}
          onChange={({ fieldName, value }) => setFormData({ fieldName, value })}
          value={formData[fieldToRender]}
          key={fieldToRender}
          user={user}
          invitation={invitation}
        />
      ) : (
        <WebfieldWidget
          field={{ [fieldToRender]: invitation.reply?.content?.[fieldToRender] }}
          onChange={({ fieldName, value }) => setFormData({ fieldName, value })}
          value={formData[fieldToRender]}
          key={fieldToRender}
          user={user}
          invitation={invitation}
        />
      )
    }
    return isV2Invitation ? (
      <ReadOnlyFieldV2
        key={fieldToRender}
        field={{ [fieldToRender]: invitation.edit?.note?.content?.[fieldToRender] }}
        value={formData[fieldToRender]}
      />
    ) : (
      <ReadOnlyField
        key={fieldToRender}
        field={{ [fieldToRender]: invitation.reply?.content?.[fieldToRender] }}
        value={formData[fieldToRender]}
      />
    )
  }

  return (
    <>
      <div className="row">
        <Markdown text={declineMessage} />
        {showReducedQuota && !formSubmitted && <Markdown text={quotaMessage} />}
      </div>
      {(showReducedQuota || showComment) && !formSubmitted && (
        <>
          <div className="row">
            {fieldsToRender.map((fieldToRender) => renderField(fieldToRender))}
          </div>
          {showReducedQuota && (
            <div className="row">
              <SpinnerButton
                type="primary"
                onClick={() => onSubmit(true)}
                loading={isSaving}
                disabled={isSaving || !formData.reduced_quota}
              >
                Accept with Reduced Quota
              </SpinnerButton>
              {showComment && (
                <SpinnerButton
                  type="primary"
                  onClick={() => onSubmit(false)}
                  loading={isSaving}
                  disabled={isSaving || !formData.comment}
                >
                  Submit Comment
                </SpinnerButton>
              )}
            </div>
          )}
          {!showReducedQuota && showComment && (
            <div className="row">
              <SpinnerButton
                type="primary"
                onClick={() => onSubmit(false)}
                loading={isSaving}
                disabled={isSaving || !formData.comment}
              >
                Submit Comment
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
  const responseDescription = isV2Invitation
    ? invitation.edit?.note?.content?.response?.description
    : invitation.reply?.content?.response?.description
  const invitationContentFields = isV2Invitation
    ? Object.keys(invitation.edit?.note?.content)
    : Object.keys(invitation.reply?.content)

  const onResponseClick = async (response) => {
    setIsSaving(true)
    try {
      const noteContent = {
        title: 'Recruit response',
        key: args.key,
        response,
        ...Object.fromEntries(
          Object.entries(args ?? {}).filter(
            ([key]) => !fieldsToHide.includes(key) && invitationContentFields.includes(key)
          )
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
        return (
          <>
            <div className="response-args-container">
              {Object.keys(args ?? {}).map((key) => {
                if (fieldsToHide.includes(key) || !invitationContentFields.includes(key))
                  return null
                return (
                  <div className="response-args" key={key}>
                    <strong>{`${prettyField(key)}:`}</strong> <span>{args[key]}</span>
                  </div>
                )
              })}
            </div>
            <Markdown text={acceptMessage} />
          </>
        )
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
          <div className="recruitment-form">
            <Markdown text={responseDescription} />
            <div className="response-args-container">
              {Object.keys(args ?? {}).map((key) => {
                if (fieldsToHide.includes(key) || !invitationContentFields.includes(key))
                  return null
                return (
                  <div className="response-args" key={key}>
                    <strong>{`${prettyField(key)}:`}</strong> <span>{args[key]}</span>
                  </div>
                )
              })}
            </div>
            <div className="response-buttons">
              <SpinnerButton
                type="primary"
                onClick={() => onResponseClick('Yes')}
                loading={isSaving}
                disabled={isSaving}
                size="lg"
              >
                Accept
              </SpinnerButton>
              <SpinnerButton
                type="primary"
                onClick={() => onResponseClick('No')}
                loading={isSaving}
                disabled={isSaving}
                size="lg"
              >
                Reject
              </SpinnerButton>
            </div>
          </div>
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
