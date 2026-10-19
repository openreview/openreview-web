import { get } from 'lodash'
import { useEffect, useReducer, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { classNames } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'
import ContentFieldEditor from '../EditorComponents/ContentFieldEditor'
import EditorComponentHeader from '../EditorComponents/EditorComponentHeader'
import EditSignatures from '../EditSignatures'
import Icon from '../Icon'
import SpinnerButton from '../SpinnerButton'
import EditorWidget from '../webfield/EditorWidget'

import styles from '../../styles/components/InvitationContentEditor.module.scss'

// For editing invitation
const InvitationEditor = ({
  invitation,
  className,
  existingValue,
  closeInvitationEditor,
  onInvitationEditPosted,
  isGroupInvitation = false,
  group,
  // Optional check before posting, given the form's values; resolve false to cancel the save.
  confirmBeforeSubmit,
  // Optional checks on the form's values as they change; returns [{ fieldName, message }]. Shown
  // under each field, and Submit stays disabled while there are any.
  validate,
  // Optional translation of a failed save; returns { message, fieldNames } or null to show the
  // API's own message. With fieldNames the message goes under those fields instead of the banner.
  formatSubmitError,
}) => {
  const { user, isRefreshing } = useUser()
  const [errors, setErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultInvitationEditorData = existingValue
  const invitationEditorDataReducer = (state, action) => {
    if (action.type === 'reset') {
      return defaultInvitationEditorData
    }
    return {
      ...state,
      [action.fieldName]: action.value,
    }
  }

  const [invitationEditorData, setInvitationEditorData] = useReducer(
    invitationEditorDataReducer,
    defaultInvitationEditorData
  )
  const [fields, setFields] = useState([])
  const [submitErrors, setSubmitErrors] = useState([])
  const validationErrors = validate?.(invitationEditorData) ?? []

  const renderField = (fieldName, fieldDescription) => {
    const isHiddenField = fieldDescription?.value?.param?.hidden
    const isContentField = fieldDescription?.value?.param?.type === 'content'
    const error =
      errors.find((e) => e.fieldName === fieldName) ??
      validationErrors.find((e) => e.fieldName === fieldName) ??
      submitErrors.find((e) => e.fieldName === fieldName)

    const fieldValue = invitationEditorData[fieldName]

    return (
      <div key={fieldName} className={isHiddenField ? null : styles.fieldContainer}>
        <EditorComponentContext.Provider
          value={{
            invitation,
            group,
            field: { [fieldName]: fieldDescription },
            onChange: setInvitationEditorData,
            value: fieldValue,
            isWebfield: false,
            error,
            setErrors,
            clearError: () => {
              setErrors((existingErrors) =>
                existingErrors.filter((p) => p.fieldName !== fieldName)
              )
            },
          }}
        >
          <EditorComponentHeader>
            {isContentField ? <ContentFieldEditor /> : <EditorWidget />}
          </EditorComponentHeader>
        </EditorComponentContext.Provider>

        {!isHiddenField && fieldDescription.readers && (
          <EditorComponentContext.Provider
            value={{
              field: { [fieldName]: fieldDescription.readers },
            }}
          >
            <div className={styles.fieldReaders}>
              <Icon name="eye-open" />
              <span>Visible only to:</span> <EditorWidget />
            </div>
          </EditorComponentContext.Provider>
        )}
      </div>
    )
  }

  const handleSubmitClick = async () => {
    if (confirmBeforeSubmit && !(await confirmBeforeSubmit(invitationEditorData))) return
    const { content: editContentFields, group: groupFields, ...otherFields } = invitation.edit
    const editToPost = {}

    const shouldSetValue = (fieldPath) => {
      const field = get(invitation, fieldPath)
      return field && field.param && !field.param.const
    }

    try {
      setIsSubmitting(true)
      const editContent = {}
      Object.entries(otherFields).forEach(([field, value]) => {
        if (shouldSetValue(`edit/${field}`)) {
          editToPost[field] = invitation.edit[field]
        }
        switch (field) {
          case 'signatures':
            editToPost.signatures = invitationEditorData.editSignatureInputValues
            break
          default:
            break
        }
      })
      Object.entries(editContentFields).forEach(([field, value]) => {
        editContent[field] = {
          value:
            invitationEditorData[field] === undefined
              ? { delete: true }
              : invitationEditorData[field],
        }
      })
      editToPost.content = editContent

      if (isGroupInvitation) {
        editToPost.invitations = undefined
        editToPost.invitation = invitation.id
      } else {
        // invitation edit invitation use invitations as invitation
        editToPost.invitations = invitation.id
        editToPost.invitation = undefined
      }

      await api.post(isGroupInvitation ? '/groups/edits' : '/invitations/edits', editToPost)
      onInvitationEditPosted?.()
      closeInvitationEditor()
    } catch (error) {
      const formattedError = formatSubmitError?.(error, invitationEditorData)
      if (formattedError?.fieldNames?.length) {
        setSubmitErrors(
          formattedError.fieldNames.map((fieldName) => ({
            fieldName,
            message: formattedError.message,
          }))
        )
      } else {
        promptError(formattedError?.message ?? error.message)
      }
    }
    setIsSubmitting(false)
  }

  const handleCancelClick = () => {
    setErrors([])
    setSubmitErrors([])
    setInvitationEditorData({ type: 'reset' })
    closeInvitationEditor()
  }

  // A failed save's errors describe the values that were sent, so any change clears them
  useEffect(() => {
    setSubmitErrors([])
  }, [invitationEditorData])

  useEffect(() => {
    if (isRefreshing || !invitation?.edit?.content) return

    if (!user) {
      promptLogin()
      return
    }

    setFields(
      Object.entries(invitation.edit.content).sort(
        (a, b) => (a[1].order ?? 100) - (b[1].order ?? 100)
      )
    )
  }, [invitation, user, isRefreshing])

  if (!invitation?.edit?.content) return null
  return (
    <div className={classNames(className, styles.invitationContentEditor)}>
      {fields.map(([fieldName, fieldDescription]) => renderField(fieldName, fieldDescription))}
      <EditSignatures
        fieldDescription={invitation.edit.signatures}
        setLoading={() => {}}
        editorData={invitationEditorData}
        setEditorData={setInvitationEditorData}
        closeEditor={handleCancelClick}
        errors={errors}
        setErrors={setErrors}
        extraClasses={styles.signatures}
      />
      <div className={styles.responseButtons}>
        <SpinnerButton
          className={styles.submitButton}
          onClick={handleSubmitClick}
          disabled={
            isSubmitting || errors.length || validationErrors.length || submitErrors.length
          }
          loading={isSubmitting}
        >
          Submit
        </SpinnerButton>
        <button
          className="btn btn-sm btn-default"
          onClick={handleCancelClick}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default InvitationEditor
