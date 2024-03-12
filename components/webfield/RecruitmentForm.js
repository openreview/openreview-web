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
import EditorWidget from './EditorWidget'
import EditorComponentContext from '../EditorComponentContext'
import WebFieldContext from '../WebFieldContext'
import { translateInvitationMessage } from '../../lib/webfield-utils'

import styles from '../../styles/components/RecruitmentForm.module.scss'
import EditorComponentHeader from '../EditorComponents/EditorComponentHeader'
import RecruitmentFormWidget from '../EditorComponents/RecruitmentFormWidget'

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
      <button
        type="button"
        className="btn-link reduced-load-link"
        onClick={() => setStatus('showReducedLoad')}
      >
        Request a reduced load
      </button>
    </p>
  </div>
)

const SubmitButton = ({
  fieldRequired,
  onSubmit,
  onCancel,
  isSaving,
  showCancelButton = false,
}) => (
  <div className="row submit-button">
    <SpinnerButton
      type="primary"
      onClick={onSubmit}
      loading={isSaving}
      disabled={isSaving || !fieldRequired}
    >
      Submit
    </SpinnerButton>
    {showCancelButton && (
      <button className="btn btn-default" onClick={onCancel} disabled={isSaving}>
        Cancel
      </button>
    )}
  </div>
)

const ReducedLoadInfo = ({
  hasReducedLoadField,
  setFormData,
  renderField,
  formData,
  onSubmit,
  isSaving,
  setStatus,
  showCancelButton = true,
}) => {
  useEffect(() => {
    setFormData('reset')
  }, [])

  if (!hasReducedLoadField) return null

  return (
    <div className={styles.declineForm}>
      <h4 className="reduced-load-label">
        Select a reduced load from the menu below and click on Submit to accept the invitation:
      </h4>
      {renderField('reduced_load')}
      <SubmitButton
        fieldRequired={formData.reduced_load}
        onSubmit={onSubmit}
        onCancel={() => {
          setFormData('reset')
          setStatus('init')
        }}
        isSaving={isSaving}
        showCancelButton={showCancelButton}
      />
    </div>
  )
}

const DeclineForm = ({ responseNote, setDecision, setReducedLoad }) => {
  const {
    declineMessage,
    reducedLoadMessage,
    args,
    entity: invitation,
    allowAcceptWithReducedLoad = false,
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
  const [status, setStatus] = useState(
    allowAcceptWithReducedLoad && !responseNote ? 'showReducedLoad' : 'init'
  )

  const initialState = fieldsToRender.reduce((acc, field) => {
    acc[field] = args[field]
    return acc
  }, {})

  const formDataReducer = (state, action) => {
    if (action === 'reset') return initialState
    return {
      ...state,
      [action.fieldName]: action.value,
    }
  }

  const [formData, setFormData] = useReducer(formDataReducer, initialState)

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
      return (
        <EditorComponentContext.Provider
          key={fieldToRender}
          value={{
            field: {
              [fieldToRender]: isV2Invitation
                ? invitation.edit?.note?.content?.[fieldToRender]
                : invitation.reply?.content?.[fieldToRender],
            },
            onChange: ({ fieldName, value }) => setFormData({ fieldName, value }),
            value: formData[fieldToRender],
            key: fieldToRender,
            isWebfield: true,
          }}
        >
          <EditorComponentHeader>
            {isV2Invitation ? <EditorWidget /> : <RecruitmentFormWidget />}
          </EditorComponentHeader>
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

  if (status === 'init') {
    return (
      <div className={styles.declineForm}>
        <DeclineMessage declineMessage={declineMessage} args={args} />
        {hasReducedLoadField && (
          <>
            <ReducedLoadMessage reducedLoadMessage={reducedLoadMessage} />
            <ReducedLoadLink setStatus={setStatus} />
          </>
        )}
        {hasCommentField && (
          <>
            {renderField('comment')}
            <SubmitButton fieldRequired={true} onSubmit={onSubmit} isSaving={isSaving} />
          </>
        )}
      </div>
    )
  }
  if (status === 'showReducedLoad') {
    return (
      <ReducedLoadInfo
        renderField={renderField}
        hasReducedLoadField={hasReducedLoadField}
        setFormData={setFormData}
        formData={formData}
        onSubmit={onSubmit}
        isSaving={isSaving}
        setStatus={setStatus}
        showCancelButton={responseNote}
      />
    )
  }
  if (status === 'commentSubmitted') {
    return (
      <div className={styles.declineForm}>
        <DeclineMessage declineMessage={declineMessage} args={args} />
      </div>
    )
  }
  return (
    <div className={styles.declineForm}>
      <DeclineMessage declineMessage={declineMessage} />
    </div>
  )
}

const RecruitmentForm = () => {
  const [decision, setDecision] = useState(null)
  const [responseNote, setResponseNote] = useState(null)
  const [reducedLoad, setReducedLoad] = useState(null)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const {
    acceptMessage,
    header,
    entity: invitation,
    args,
    invitationMessage,
    allowAcceptWithReducedLoad = false,
  } = useContext(WebFieldContext)
  const isV2Invitation = invitation.apiVersion === 2
  const responseDescription = isV2Invitation
    ? invitation.edit?.note?.content?.response?.description
    : invitation.reply?.content?.response?.description
  const invitationContentFields = isV2Invitation
    ? Object.keys(invitation.edit?.note?.content)
    : Object.keys(invitation.reply?.content)
  const invalidTurnstileToken = process.env.TURNSTILE_SITEKEY && !turnstileToken

  const defaultButtonState = [
    { response: 'Yes', loading: false, disabled: false },
    { response: 'YesWithReducedLoad', loading: false, disabled: false },
    { response: 'No', loading: false, disabled: false },
  ]
  const [buttonStatus, setButtonStatus] = useState(defaultButtonState)

  const onResponseClick = async (response) => {
    if (response === 'YesWithReducedLoad') {
      setDecision('acceptWithReducedLoad')
      return
    }
    setButtonStatus([
      { response: 'Yes', loading: response === 'Yes', disabled: true },
      {
        response: 'YesWithReducedLoad',
        loading: response === 'YesWithReducedLoad',
        disabled: true,
      },
      { response: 'No', loading: response === 'No', disabled: true },
    ])
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
      setButtonStatus(defaultButtonState)
      setDecision(response === 'Yes' ? 'accept' : 'reject')
    } catch (error) {
      promptError(error.message)
      setButtonStatus(defaultButtonState)
      setDecision(null)
    }
  }

  const renderDecision = () => {
    switch (decision) {
      case 'accept':
        return (
          <div className={styles.acceptForm}>
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
      case 'acceptWithReducedLoad':
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
          <div className={styles.recruitmentForm}>
            {invitationMessage ? (
              <Markdown text={translateInvitationMessage(invitationMessage, args)} />
            ) : (
              <Markdown text={responseDescription} />
            )}
            <div className="response-buttons">
              <SpinnerButton
                type="primary"
                onClick={() => onResponseClick('Yes')}
                loading={buttonStatus.find((p) => p.response === 'Yes').loading}
                disabled={
                  buttonStatus.find((p) => p.response === 'Yes').disabled ||
                  invalidTurnstileToken
                }
                size="lg"
              >
                Accept
              </SpinnerButton>
              {allowAcceptWithReducedLoad && (
                <SpinnerButton
                  type="primary"
                  className="reduced-load-button"
                  onClick={() => onResponseClick('YesWithReducedLoad')}
                  loading={
                    buttonStatus.find((p) => p.response === 'YesWithReducedLoad').loading
                  }
                  disabled={
                    buttonStatus.find((p) => p.response === 'YesWithReducedLoad').disabled ||
                    invalidTurnstileToken
                  }
                  size="lg"
                >
                  Accept (Reduced Load)
                </SpinnerButton>
              )}
              <SpinnerButton
                type="default"
                className="decline-button"
                onClick={() => onResponseClick('No')}
                loading={buttonStatus.find((p) => p.response === 'No').loading}
                disabled={
                  buttonStatus.find((p) => p.response === 'No').disabled ||
                  invalidTurnstileToken
                }
                size="lg"
              >
                Decline
              </SpinnerButton>
            </div>
            {process.env.TURNSTILE_SITEKEY && (
              <div id="turnstile-recruitment" className="mt-4 text-center"></div>
            )}
          </div>
        )
    }
  }

  useEffect(() => {
    if (decision || !process.env.TURNSTILE_SITEKEY) return
    if (window.turnstile) {
      window.turnstile.render('#turnstile-recruitment', {
        sitekey: process.env.TURNSTILE_SITEKEY,
        action: 'recruitment',
        callback: (token) => {
          setTurnstileToken(token)
        },
      })
    } else {
      promptError(
        'Could not verify browser. Please make sure third-party scripts are not being blocked and try again.'
      )
    }
  }, [decision])

  useEffect(() => {
    if (!['id', 'user', 'key'].every((p) => typeof args[p] === 'string')) {
      setDecision('error')
    }
  }, [])

  return (
    <>
      <VenueHeader headerInfo={header} />

      <div className="note_editor">{renderDecision()}</div>
    </>
  )
}

export default RecruitmentForm
