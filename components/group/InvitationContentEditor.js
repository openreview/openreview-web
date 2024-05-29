/* globals promptLogin,promptError: false */
import { useEffect, useReducer, useState } from 'react'
import styles from '../../styles/components/InvitationContentEditor.module.scss'
import { classNames } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from '../EditorComponents/EditorComponentHeader'
import EditorWidget from '../webfield/EditorWidget'
import Icon from '../Icon'
import useUser from '../../hooks/useUser'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'
import JsonEditorWidget from '../EditorComponents/JsonEditorWidget'

const InvitationContentEditor = ({
  invitation,
  className,
  existingValue,
  closeInvitationEditor,
  onInvitationEditPosted,
}) => {
  const { user, userLoading, accessToken } = useUser()
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

  const renderField = (fieldName, fieldDescription) => {
    const isHiddenField = fieldDescription?.value?.param?.hidden
    const isContentField = fieldDescription?.value?.param?.type === 'content'
    const error = errors.find((e) => e.fieldName === fieldName)

    const fieldValue = invitationEditorData[fieldName]

    return (
      <div key={fieldName} className={isHiddenField ? null : styles.fieldContainer}>
        <EditorComponentContext.Provider
          value={{
            invitation,
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
            {isContentField ? <JsonEditorWidget /> : <EditorWidget />}
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

  const constructInvitationEdit = async (formData, invitationObj) => {
    const { content: contentFields, ...otherFields } = invitationObj.edit
    const editToPost = {}

    try {
      const editContent = {}
      Object.entries(otherFields).forEach(([field, value]) => {
        editToPost[field] = invitationObj.edit[field]
      })
      Object.entries(contentFields).forEach(([field, value]) => {
        editContent[field] = { value: formData[field] }
      })
      editToPost.content = editContent
      editToPost.invitations = invitationObj.id
      editToPost.invitation = undefined
      await api.post('/invitations/edits', editToPost, { accessToken })
      onInvitationEditPosted?.()
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleSubmitClick = async () => {
    setIsSubmitting(true)
    const editToPost = constructInvitationEdit(invitationEditorData, invitation)
    setIsSubmitting(false)
    closeInvitationEditor()
  }

  const handleCancelClick = () => {
    setErrors([])
    setInvitationEditorData({ type: 'reset' })
    closeInvitationEditor()
  }

  useEffect(() => {
    if (userLoading || !invitation?.edit?.content) return

    if (!user) {
      promptLogin()
      return
    }

    setFields(
      Object.entries(invitation.edit.content).sort(
        (a, b) => (a[1].order ?? 100) - (b[1].order ?? 100)
      )
    )
  }, [invitation, user, userLoading])

  if (!invitation?.edit?.content) return null
  return (
    <div className={classNames(className, styles.invitationEditor)}>
      {fields.map(([fieldName, fieldDescription]) => renderField(fieldName, fieldDescription))}
      <div className={styles.responseButtons}>
        <SpinnerButton
          className={styles.submitButton}
          onClick={handleSubmitClick}
          disabled={isSubmitting || errors.length}
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

export default InvitationContentEditor
