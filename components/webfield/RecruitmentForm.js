/* globals promptError: false */
import { useState, useReducer, useContext, useEffect } from 'react'
import api from '../../lib/api-client'
import {
  constructRecruitmentResponseNote,
  orderNoteInvitationFields,
  inflect,
} from '../../lib/utils'
import SpinnerButton from '../SpinnerButton'
import Markdown from '../EditorComponents/Markdown'
import { ReadOnlyField, ReadOnlyFieldV2 } from '../EditorComponents/ReadOnlyField'
import VenueHeader from './VenueHeader'
import { WebfieldWidget, WebfieldWidgetV2 } from './WebfieldWidget'
import EditorComponentContext from '../EditorComponentContext'
import WebFieldContext from '../WebFieldContext'
import { translateInvitationMessage } from '../../lib/webfield-utils'

const fieldsToHide = ['id', 'title', 'key', 'response']
const DeclineMessage = ({ declineMessage, args }) => (
  <div className="row decline-message">
    <Markdown text={translateInvitationMessage(declineMessage, args)} />
  </div>
)
const ReducedLoadMessage = ({ reducedLoadMessage }) => (
  <div className="row">
    <Markdown text={reducedLoadMessage} />
  </div>
)
const ReducedLoadLink = ({ setStatus }) => (
  <div className="row">
    <p>
      You can {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a className="reduced-load-link" onClick={() => setStatus('showReducedLoad')}>
        request a reduced load
      </a>
    </p>
  </div>
)
const CommentField = ({ renderField }) => renderField('comment')
const ReducedLoadField = ({ renderField }) => renderField('reduced_load')
const SubmitButton = ({ fieldRequired, onSubmit, isSaving }) => (
  <div className="row">
    <SpinnerButton
      type="primary"
      onClick={onSubmit}
      loading={isSaving}
      disabled={isSaving || !fieldRequired}
    >
      Submit
    </SpinnerButton>
  </div>
)

const DeclineForm = ({ responseNote, setDecision, setReducedLoad }) => {
  const {
    declineMessage,
    reducedLoadMessage,
    args,
    entity: invitation,
  } = useContext(WebFieldContext)
  const [isSaving, setIsSaving] = useState(false)
  const isV2Invitation = invitation.apiVersion === 2
  const hasReducedLoadField = isV2Invitation
    ? invitation.edit?.note?.content?.reduced_load
    : invitation.reply?.content?.reduced_load
  const hasCommentField = isV2Invitation
    ? invitation.edit?.note?.content?.comment
    : invitation.reply?.content?.comment
  const fieldsToRender = orderNoteInvitationFields(
    invitation,
    fieldsToHide.concat(['reduced_load', 'comment'])
  )
  const [status, setStatus] = useState('init')

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

  const onSubmit = async () => {
    setIsSaving(true)
    const isAcceptResponse = status === 'showReducedLoad'
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

      if (isAcceptResponse) {
        setDecision('accept')
        setReducedLoad(Number(formData.reduced_load))
      } else {
        setStatus('commentSubmitted')
      }
    } catch (error) {
      promptError(error.message)
      setIsSaving(false)
    }
  }

  const renderField = (fieldToRender) => {
    if (['reduced_load', 'comment'].includes(fieldToRender)) {
      return isV2Invitation ? (
        <EditorComponentContext.Provider
          key={fieldToRender}
          value={{
            field: { [fieldToRender]: invitation.edit?.note?.content?.[fieldToRender] },
            onChange: ({ fieldName, value }) => setFormData({ fieldName, value }),
            value: formData[fieldToRender],
            key: fieldToRender,
            isWebfield: true,
          }}
        >
          <WebfieldWidgetV2 />
        </EditorComponentContext.Provider>
      ) : (
        <EditorComponentContext.Provider
          key={fieldToRender}
          value={{
            field: { [fieldToRender]: invitation.reply?.content?.[fieldToRender] },
            onChange: ({ fieldName, value }) => setFormData({ fieldName, value }),
            value: formData[fieldToRender],
            key: fieldToRender,
            isWebfield: true,
          }}
        >
          <WebfieldWidget />
        </EditorComponentContext.Provider>
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

  const renderPage = () => {
    switch (status) {
      case 'init':
        return (
          <div className="decline-form">
            <DeclineMessage declineMessage={declineMessage} args={args} />
            {hasReducedLoadField && (
              <>
                <ReducedLoadMessage reducedLoadMessage={reducedLoadMessage} />
                <ReducedLoadLink setStatus={setStatus} />
              </>
            )}
            {hasCommentField && (
              <>
                <CommentField renderField={renderField} />
                <SubmitButton
                  fieldRequired={formData.comment}
                  onSubmit={onSubmit}
                  isSaving={isSaving}
                />
              </>
            )}
          </div>
        )
      case 'showReducedLoad':
        return (
          <div className="decline-form">
            {hasReducedLoadField && (
              <>
                <h4 className="reduced-load-label">
                  Select a reduced load from the menu below and click on Submit to accept the
                  invitation:
                </h4>
                <ReducedLoadField renderField={renderField} />
                <SubmitButton
                  fieldRequired={formData.reduced_load}
                  onSubmit={onSubmit}
                  isSaving={isSaving}
                />
              </>
            )}
          </div>
        )
      case 'commentSubmitted':
        return (
          <div className="decline-form">
            <DeclineMessage declineMessage={declineMessage} args={args} />
          </div>
        )
      default:
        return (
          <div className="decline-form">
            <DeclineMessage declineMessage={declineMessage} />
          </div>
        )
    }
  }

  return renderPage()
}

const RecruitmentForm = () => {
  const [decision, setDecision] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [responseNote, setResponseNote] = useState(null)
  const [reducedLoad, setReducedLoad] = useState(null)
  const {
    acceptMessage,
    header,
    entity: invitation,
    args,
    invitationMessage,
  } = useContext(WebFieldContext)
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
          <div className="accept-form">
            {reducedLoad && (
              <h4 className="reduced-load-message">{`You have requested a reduced load of ${inflect(
                reducedLoad,
                'paper',
                'papers',
                true
              )}`}</h4>
            )}
            <Markdown text={translateInvitationMessage(acceptMessage, args)} />
          </div>
        )
      case 'reject':
        return (
          <DeclineForm
            responseNote={responseNote}
            setDecision={setDecision}
            setReducedLoad={setReducedLoad}
          />
        )
      case 'error':
        return (
          <div className="alert alert-danger">
            <strong>Error:</strong> The link is invalid, please refer back to recruitment
            email.
          </div>
        )
      default:
        return (
          <div className="recruitment-form">
            {invitationMessage ? (
              <Markdown text={translateInvitationMessage(invitationMessage, args)} />
            ) : (
              <Markdown text={responseDescription} />
            )}
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
                type="default"
                onClick={() => onResponseClick('No')}
                loading={isSaving}
                disabled={isSaving}
                size="lg"
              >
                Decline
              </SpinnerButton>
            </div>
          </div>
        )
    }
  }

  useEffect(() => {
    if (!['id', 'user', 'key'].every((p) => typeof args[p] === 'string')) {
      setDecision('error')
    }
  }, [])
  return (
    <>
      <VenueHeader headerInfo={header} />
      <br />
      <div className="note_editor">{renderDecision()}</div>
    </>
  )
}

export default RecruitmentForm
