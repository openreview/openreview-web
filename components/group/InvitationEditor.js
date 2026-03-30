/* globals promptLogin,promptError: false */
import { useEffect, useReducer, useState } from 'react'
import { get } from 'lodash'
import styles from '../../styles/components/InvitationContentEditor.module.scss'
import { classNames } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from '../EditorComponents/EditorComponentHeader'
import EditorWidget from '../webfield/EditorWidget'
import Icon from '../Icon'
import useUser from '../../hooks/useUser'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'
import ContentFieldEditor from '../EditorComponents/ContentFieldEditor'
import EditSignatures from '../EditSignatures'

// For editing invitation
const InvitationEditor = ({
  invitation,
  className,
  existingValue,
  closeInvitationEditor,
  onInvitationEditPosted,
  isGroupInvitation = false,
  group,
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
        editContent[field] = { value: invitationEditorData[field] }
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
      promptError(error.message)
    }
    setIsSubmitting(false)
  }

  const handleCancelClick = () => {
    setErrors([])
    setInvitationEditorData({ type: 'reset' })
    closeInvitationEditor()
  }

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

export default InvitationEditor
