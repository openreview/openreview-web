/* globals promptError, promptLogin, view2, clearMessage: false */

import React, { useEffect, useCallback, useReducer, useState, useContext } from 'react'
import throttle from 'lodash/throttle'
import { intersection, isEmpty } from 'lodash'
import EditorComponentContext from './EditorComponentContext'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import EditorWidget from './webfield/EditorWidget'
import SpinnerButton from './SpinnerButton'
import LoadingSpinner from './LoadingSpinner'
import Signatures from './Signatures'
import { NewNoteReaders, NewReplyEditNoteReaders } from './NoteEditorReaders'
import Icon from './Icon'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import { getAutoStorageKey, prettyField, prettyInvitationId, classNames } from '../lib/utils'
import { getErrorFieldName, isNonDeletableError } from '../lib/webfield-utils'
import { getNoteContentValues } from '../lib/forum-utils'

import styles from '../styles/components/NoteEditor.module.scss'
import LicenseWidget from './EditorComponents/LicenseWidget'
import DatePickerWidget from './EditorComponents/DatePickerWidget'
import EditSignatures from './EditSignatures'
import Markdown from './EditorComponents/Markdown'
import WebFieldContext from './WebFieldContext'

const ExistingNoteReaders = NewReplyEditNoteReaders

const EditReaders = NewNoteReaders

const NoteSignatures = ({
  fieldDescription,
  setLoading,
  noteEditorData,
  setNoteEditorData,
  closeNoteEditor,
  errors,
  setErrors,
}) => {
  const fieldName = 'noteSignatureInputValues'
  const error = errors.find((e) => e.fieldName === fieldName)

  const onChange = ({ loading, value }) => {
    setLoading((existingLoadingState) => ({
      ...existingLoadingState,
      noteSignatures: loading,
    }))
    setNoteEditorData({ fieldName, value })
  }

  const onError = (errorMessage) => {
    promptError(errorMessage)
    closeNoteEditor()
  }

  if (!fieldDescription) return null

  return (
    <EditorComponentHeader fieldNameOverwrite="Signatures" inline={true} error={error}>
      <Signatures
        fieldDescription={fieldDescription}
        onChange={onChange}
        currentValue={noteEditorData[fieldName]}
        onError={onError}
        extraClasses={styles.signatures}
        clearError={() =>
          setErrors((existingErrors) =>
            existingErrors.filter((p) => p.fieldName !== fieldName)
          )
        }
      />
    </EditorComponentHeader>
  )
}

const EditContent = ({
  invitation,
  editContentData,
  setEditContentData,
  errors,
  setErrors,
}) => {
  if (!invitation.edit?.content) return null
  return Object.entries(invitation.edit.content).map(([fieldName, fieldDescription]) => (
    <div
      key={fieldName}
      className={fieldDescription?.value?.param?.hidden ? null : styles.fieldContainer}
    >
      <EditorComponentContext.Provider
        value={{
          invitation,
          field: { [fieldName]: fieldDescription },
          value: editContentData[fieldName],
          onChange: setEditContentData,
          error: errors.find((e) => e.fieldName === `content.${fieldName}`),
          setErrors,
          clearError: () => {
            setErrors([])
          },
        }}
      >
        <EditorComponentHeader>
          <EditorWidget />
        </EditorComponentHeader>
      </EditorComponentContext.Provider>
    </div>
  ))
}

const addMissingReaders = (
  readersSelected,
  readersDefinedInInvitation,
  signatureInputValues,
  roleNames
) => {
  if (!readersSelected) return undefined
  const {
    reviewerName = 'Reviewers',
    anonReviewerName = 'Reviewer_',
    areaChairName = 'Area_Chairs',
    anonAreaChairName = 'Area_Chair_',
    secondaryAreaChairName = 'Secondary_Area_Chair_',
  } = roleNames
  if (signatureInputValues?.length && !readersSelected.includes('everyone')) {
    const signatureId = signatureInputValues[0]
    const anonReviewerIndex = signatureId.indexOf(anonReviewerName)
    if (anonReviewerIndex > 0) {
      const reviewersSubmittedGroupId = signatureId
        .slice(0, anonReviewerIndex)
        .concat(`${reviewerName}/Submitted`)
      const reviewersGroupId = signatureId.slice(0, anonReviewerIndex).concat(reviewerName)
      if (
        // reader does not contain the signature so user won't be able to see the note/edit
        isEmpty(
          intersection(readersSelected, [
            signatureId,
            reviewersSubmittedGroupId,
            reviewersGroupId,
          ])
        )
      ) {
        if (
          readersDefinedInInvitation?.includes(signatureId) ||
          readersDefinedInInvitation?.some(
            (p) => p.endsWith('.*') && signatureId.startsWith(p.slice(0, -2))
          )
        ) {
          return [...readersSelected, signatureId]
        }
        if (readersDefinedInInvitation?.includes(reviewersSubmittedGroupId)) {
          return [...readersSelected, reviewersSubmittedGroupId]
        }
        if (readersDefinedInInvitation?.includes(reviewersGroupId)) {
          return [...readersSelected, reviewersGroupId]
        }
      }
    } else {
      const acIndex = signatureId.indexOf(anonAreaChairName)
      const secondaryAcIndex = signatureId.indexOf(secondaryAreaChairName)

      const acGroupId =
        acIndex >= 0 ? signatureId.slice(0, acIndex).concat(areaChairName) : signatureId
      const secondaryAcGroupId =
        secondaryAcIndex >= 0
          ? signatureId.slice(0, secondaryAcIndex).concat(areaChairName)
          : signatureId

      const groupToAdd = [acGroupId, secondaryAcGroupId].filter((p) =>
        readersDefinedInInvitation?.includes(p)
      )

      return groupToAdd.length
        ? [...new Set([...readersSelected, ...groupToAdd])]
        : readersSelected
    }
  }
  return readersSelected
}

export const getNoteReaderValues = async (
  roleNames,
  invitation,
  noteEditorData,
  accessToken
) => {
  if (!invitation.edit.note.readers || Array.isArray(invitation.edit.note.readers)) {
    return undefined
  }

  const constNoteSignature = // when note signature is edit signature, note reader should use edit signatures
    invitation.edit.note?.signatures?.[0]?.includes('/signatures}') ||
    invitation.edit.note?.signatures?.param?.const?.[0]?.includes('/signatures}')
  const signatureInputValues = constNoteSignature
    ? noteEditorData.editSignatureInputValues
    : noteEditorData.noteSignatureInputValues

  const invitationNoteReaderValues =
    invitation.edit.note.readers?.param?.enum ??
    (await Promise.all(
      invitation.edit.note.readers?.param?.items?.map(async (p) => {
        if (p.value) return p.value
        if (p.inGroup) {
          try {
            const result = await api.get('/groups', { id: p.inGroup }, { accessToken })
            return result.groups[0]?.members
          } catch (error) {
            return []
          }
        }
        return p.prefix?.endsWith('*') ? p.prefix : `${p.prefix}.*`
      })
    ))

  return addMissingReaders(
    noteEditorData.noteReaderValues,
    invitationNoteReaderValues.flat(),
    signatureInputValues,
    roleNames
  )
}

export const getEditReaderValues = async (
  roleNames,
  invitation,
  noteEditorData,
  accessToken
) => {
  if (Array.isArray(invitation.edit.readers)) return undefined

  const invitationEditReaderValues =
    invitation.edit.readers?.param?.enum ??
    (await Promise.all(
      invitation.edit.readers?.param?.items?.map(async (p) => {
        if (p.value) return p.value
        if (p.inGroup) {
          try {
            const result = await api.get('/groups', { id: p.inGroup }, { accessToken })
            return result.groups[0]?.members
          } catch (error) {
            return []
          }
        }
        return p.prefix?.endsWith('*') ? p.prefix : `${p.prefix}.*`
      })
    ))

  return addMissingReaders(
    noteEditorData.editReaderValues,
    invitationEditReaderValues.flat(),
    noteEditorData.editSignatureInputValues,
    roleNames
  )
}

// For v2 invitations only
const NoteEditor = ({
  invitation,
  edit,
  note,
  replyToNote,
  closeNoteEditor,
  onNoteCreated,
  isDirectReplyToForum,
  setErrorAlertMessage,
  customValidator,
  className,
}) => {
  const { user, isRefreshing, accessToken } = useUser()
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState({
    noteReaders: false,
    noteSignatures: false,
    editReaders: false,
    editSignatures: false,
  })
  const [autoStorageKeys, setAutoStorageKeys] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState([])
  const { noteEditorPreview } = useContext(WebFieldContext) ?? {}
  if (noteEditorPreview)
    // eslint-disable-next-line no-param-reassign
    customValidator = () => ({
      isValid: false,
      errorMessage: 'This is a note editor preview',
    })
  const useCheckboxWidget = true

  const displayError =
    typeof setErrorAlertMessage === 'function' ? setErrorAlertMessage : (p) => promptError(p)

  const saveDraft = useCallback(
    throttle((fieldName, value) => {
      const keyOfSavedText = getAutoStorageKey(
        user,
        invitation.id,
        note?.id,
        replyToNote?.id,
        fieldName
      )
      localStorage.setItem(keyOfSavedText, value ?? '')
      setAutoStorageKeys((keys) => [...keys, keyOfSavedText])
    }, 1500),
    [invitation, note, replyToNote]
  )

  const defaultNoteEditorData = {
    ...getNoteContentValues(note?.content ?? {}),
    ...(note?.id && {
      noteReaderValues: note.readers,
      noteLicenseValue: note.license,
      notePDateValue: note.pdate,
    }),
  }

  const noteEditorDataReducer = (state, action) => {
    if (action.type === 'reset') {
      return defaultNoteEditorData
    }
    if (action.shouldSaveDraft) {
      saveDraft(action.fieldName, action.value)
    }
    return {
      ...state,
      [action.fieldName]: action.value,
    }
  }
  const [noteEditorData, setNoteEditorData] = useReducer(
    noteEditorDataReducer,
    defaultNoteEditorData
  )

  const [editContentData, setEditContentData] = useReducer(noteEditorDataReducer, {
    ...getNoteContentValues(edit?.content ?? {}),
  })

  const renderField = (fieldName, fieldDescription) => {
    let fieldNameOverwrite = fieldDescription?.value?.param?.fieldName
    if (!fieldNameOverwrite) {
      fieldNameOverwrite = fieldName === 'authorids' ? 'Authors' : undefined
    }
    const isHiddenField = fieldDescription?.value?.param?.hidden

    const error = errors.find((e) => e.fieldName === fieldName)

    let fieldValue = noteEditorData[fieldName]
    if (fieldName === 'authorids' && note?.id) {
      if (fieldDescription?.value?.param?.const?.replace) return null
      fieldValue = noteEditorData.authorids?.map((p, index) => ({
        authorId: p,
        authorName: noteEditorData.authors?.[index],
      }))
    }

    if (fieldName === 'authors' && Array.isArray(fieldDescription?.value)) return null

    return (
      <div key={fieldName} className={isHiddenField ? null : styles.fieldContainer}>
        <EditorComponentContext.Provider
          value={{
            invitation,
            note,
            replyToNote,
            field: { [fieldName]: fieldDescription },
            onChange: setNoteEditorData,
            value: fieldValue,
            isWebfield: false,
            error,
            setErrors,
            clearError: () => {
              setErrors((existingErrors) => {
                if (fieldName === 'authorids')
                  return existingErrors.filter(
                    (p) => p.fieldName !== 'authorids' && p.fieldName !== 'authors'
                  )
                return existingErrors.filter((p) => p.fieldName !== fieldName)
              })
            },
            noteEditorPreview,
          }}
        >
          <EditorComponentHeader fieldNameOverwrite={fieldNameOverwrite}>
            <EditorWidget />
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

  const renderNoteReaders = () => {
    if (!invitation.edit.note.readers) return null

    const fieldName = 'noteReaderValues'
    const error = errors.find((e) => e.fieldName === fieldName)
    const clearError = () =>
      setErrors((existingErrors) => existingErrors.filter((p) => p.fieldName !== fieldName))

    if (!note?.id && !replyToNote) {
      return (
        <NewNoteReaders
          fieldDescription={invitation.edit.note.readers}
          closeNoteEditor={closeNoteEditor}
          value={noteEditorData[fieldName]}
          onChange={(value) => setNoteEditorData({ fieldName, value })}
          setLoading={setLoading}
          placeholder="Select note readers"
          error={error}
          clearError={clearError}
          useCheckboxWidget={useCheckboxWidget}
        />
      )
    }
    if (note) {
      return (
        <ExistingNoteReaders
          replyToNote={replyToNote}
          fieldDescription={invitation.edit.note.readers}
          closeNoteEditor={closeNoteEditor}
          value={noteEditorData[fieldName]}
          onChange={(value) => setNoteEditorData({ fieldName, value })}
          setLoading={setLoading}
          isDirectReplyToForum={isDirectReplyToForum}
          placeholder="Select note readers"
          error={error}
          clearError={clearError}
          useCheckboxWidget={useCheckboxWidget}
        />
      )
    }
    if (replyToNote) {
      return (
        <NewReplyEditNoteReaders
          replyToNote={replyToNote}
          fieldDescription={invitation.edit.note.readers}
          closeNoteEditor={closeNoteEditor}
          value={noteEditorData.noteReaderValues}
          onChange={(value) => setNoteEditorData({ fieldName: 'noteReaderValues', value })}
          setLoading={setLoading}
          isDirectReplyToForum={isDirectReplyToForum}
          placeholder="Select note readers"
          error={error}
          clearError={clearError}
          useCheckboxWidget={useCheckboxWidget}
        />
      )
    }
    return null
  }

  const handleCancelClick = () => {
    setErrors([])
    autoStorageKeys.forEach((key) => localStorage.removeItem(key))
    setNoteEditorData({ type: 'reset' })
    closeNoteEditor()
  }

  const getEditWriterValues = () => {
    const writerDescription = invitation.edit.writers
    if (Array.isArray(writerDescription) || writerDescription?.param?.const) {
      return undefined
    }

    if (writerDescription?.param?.regex === '~.*') {
      return [user.profile?.id]
    }

    return noteEditorData.editSignatureInputValues
  }

  const getCreatedNote = async (noteCreated) => {
    const constructedNote = {
      ...noteCreated,
      invitations: [invitation.id],
      details: { invitation, writable: true },
    }
    try {
      const result = await api.get(
        '/notes',
        { id: noteCreated.id, details: 'invitation,presentation,writable' },
        { accessToken }
      )
      return result.notes?.[0] ? result.notes[0] : constructedNote
    } catch (error) {
      if (error.name === 'ForbiddenError') return constructedNote
      throw error
    }
  }

  const handleSubmitClick = async () => {
    setIsSubmitting(true)
    clearMessage()
    setErrors([])

    // get note reader/writer/signature and edit reader/writer/signature
    try {
      if (edit || note?.id) {
        let apiPath
        let noteOrEdit
        let label
        if (edit) {
          apiPath = '/notes/edits'
          noteOrEdit = edit
          label = 'edit'
        } else {
          apiPath = '/notes'
          noteOrEdit = note
          label = 'note'
        }
        const latestNoteOrEdit = (
          await api.get(apiPath, { id: noteOrEdit.id }, { accessToken })
        )?.[`${label}s`]?.[0]

        if (latestNoteOrEdit?.tmdate && latestNoteOrEdit.tmdate !== noteOrEdit.tmdate) {
          throw new Error(
            `This ${label} has been modified since you opened it. Please refresh the page and try again.`
          )
        }
      }

      const domainGroup =
        !invitation.domain || invitation.domain === process.env.SUPER_USER
          ? {}
          : await api.get('/groups', { id: invitation.domain }, { accessToken })
      const {
        reviewers_name: { value: reviewerName } = {},
        reviewers_anon_name: { value: anonReviewerName } = {},
        area_chairs_name: { value: areaChairName } = {},
        area_chairs_anon_name: { value: anonAreaChairName } = {},
        secondary_area_chairs_name: { value: secondaryAreaChairName } = {},
      } = domainGroup?.groups?.[0]?.content ?? {}

      const roleNames = {
        reviewerName,
        anonReviewerName,
        areaChairName,
        anonAreaChairName,
        secondaryAreaChairName,
      }

      const formData = {
        ...noteEditorData,
        ...(note?.id &&
          Object.entries(noteEditorData)
            .filter(([key, value]) => value === undefined)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: { delete: true } }), {})),
        noteReaderValues: await getNoteReaderValues(
          roleNames,
          invitation,
          noteEditorData,
          accessToken
        ),
        editReaderValues: await getEditReaderValues(
          roleNames,
          invitation,
          noteEditorData,
          accessToken
        ),
        editWriterValues: getEditWriterValues(),
        ...(replyToNote && { replyto: replyToNote.id }),
        editContent: editContentData,
      }

      if (noteEditorData.authorids) {
        if (!noteEditorData.authorids.replace) {
          formData.authors = noteEditorData.authorids.map((p) => p.authorName)
          formData.authorids = noteEditorData.authorids.map((p) => p.authorId)
        }
      } else {
        formData.authors = { delete: true }
        formData.authorids = { delete: true }
      }

      const { isValid, errorMessage } =
        typeof customValidator === 'function' ? customValidator(formData) : { isValid: true }
      if (isValid === false) {
        throw new Error(errorMessage)
      }

      const editToPost = edit
        ? view2.constructUpdatedEdit(edit, invitation, formData)
        : view2.constructEdit({
            formData,
            invitationObj: invitation,
            noteObj: note,
          })
      const result = await api.post('/notes/edits', editToPost, { accessToken })
      const createdNote = await getCreatedNote(result.note)
      autoStorageKeys.forEach((key) => localStorage.removeItem(key))
      setNoteEditorData({ type: 'reset' })
      setEditContentData({ type: 'reset' })
      closeNoteEditor()
      onNoteCreated(createdNote)
    } catch (error) {
      if (error.errors) {
        setErrors(
          error.errors.map((p) => {
            const fieldName = getErrorFieldName(p.details.path)
            const fieldNameInError =
              fieldName === 'notePDateValue' ? 'Publication Date' : prettyField(fieldName)
            if (isNonDeletableError(p.details.invalidValue))
              return { fieldName, message: `${fieldNameInError} is not deletable` }
            return { fieldName, message: p.message.replace(fieldName, fieldNameInError) }
          })
        )
        const hasOnlyMissingFieldsError = error.errors.every(
          (p) => p.name === 'MissingRequiredError'
        )
        displayError(
          hasOnlyMissingFieldsError
            ? 'Required field values are missing.'
            : 'Some info submitted are invalid.'
        )
      } else if (error.details?.path) {
        const fieldName = getErrorFieldName(error.details.path)
        const fieldNameInError =
          fieldName === 'notePDateValue' ? 'Publication Date' : prettyField(fieldName)
        const prettyErrorMessage = isNonDeletableError(error.details.invalidValue)
          ? `${fieldNameInError} is not deletable`
          : error.message.replace(fieldName, fieldNameInError)
        setErrors([
          {
            fieldName,
            message: prettyErrorMessage,
          },
        ])
        displayError(prettyErrorMessage)
      } else {
        displayError(error.message)
      }
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    if (isRefreshing || !invitation?.edit?.note?.content) return

    if (!user) {
      promptLogin()
      return
    }

    setFields(
      Object.entries(invitation.edit.note.content).sort(
        (a, b) => (a[1].order ?? 100) - (b[1].order ?? 100)
      )
    )
  }, [invitation, user, isRefreshing])

  if (!invitation?.edit?.note?.content || !user) return null

  return (
    <div className={classNames(className, styles.noteEditor)}>
      {(note?.id || replyToNote) && (
        <h2 className={styles.title}>
          {note?.id ? 'Edit' : 'New'} {prettyInvitationId(invitation.id)}
        </h2>
      )}

      <Markdown text={invitation.description} />
      {(note?.id || replyToNote) && <hr className={styles.titleSeparator} />}

      <div className={styles.requiredField}>
        <span>*</span> denotes a required field
      </div>

      {fields.map(([fieldName, fieldDescription]) => renderField(fieldName, fieldDescription))}

      <LicenseWidget
        fieldDescription={invitation.edit.note.license}
        value={noteEditorData.noteLicenseValue}
        onChange={(value) => setNoteEditorData({ fieldName: 'noteLicenseValue', value })}
        error={errors.find((e) => e.fieldName === 'noteLicenseValue')}
        clearError={() =>
          setErrors((existingErrors) =>
            existingErrors.filter((p) => p.fieldName !== 'noteLicenseValue')
          )
        }
      />

      {invitation.edit.note.pdate && (
        <EditorComponentHeader
          inline={true}
          fieldNameOverwrite="Publication Date"
          error={errors.find((e) => e.fieldName === 'notePDateValue')}
        >
          <DatePickerWidget
            isEditor={false}
            field={{ 'publication date': null }}
            value={noteEditorData.notePDateValue ?? ''}
            error={errors.find((e) => e.fieldName === 'notePDateValue')}
            clearError={() =>
              setErrors((existingErrors) =>
                existingErrors.filter((p) => p.fieldName !== 'notePDateValue')
              )
            }
            onChange={({ fieldName, value }) =>
              setNoteEditorData({ fieldName: 'notePDateValue', value })
            }
          />
        </EditorComponentHeader>
      )}

      {renderNoteReaders()}

      <NoteSignatures
        fieldDescription={invitation.edit.note.signatures}
        setLoading={setLoading}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
        closeNoteEditor={closeNoteEditor}
        errors={errors}
        setErrors={setErrors}
      />

      {(invitation.edit?.content || invitation.edit.readers || invitation.edit.signatures) && (
        <div className={styles.editReaderSignature}>
          <h2>Edit History</h2>
          <hr />

          <EditContent
            invitation={invitation}
            editContentData={editContentData}
            setEditContentData={setEditContentData}
            errors={errors}
            setErrors={setErrors}
          />

          <EditReaders
            fieldDescription={invitation.edit.readers}
            closeNoteEditor={closeNoteEditor}
            value={noteEditorData.editReaderValues}
            onChange={(value) => setNoteEditorData({ fieldName: 'editReaderValues', value })}
            setLoading={setLoading}
            placeholder="Select edit readers"
            error={errors.find((e) => e.fieldName === 'editReaderValues')}
            clearError={() =>
              setErrors((existingErrors) =>
                existingErrors.filter((p) => p.fieldName !== 'editReaderValues')
              )
            }
          />
          <EditSignatures
            fieldDescription={invitation.edit.signatures}
            setLoading={setLoading}
            editorData={noteEditorData}
            setEditorData={setNoteEditorData}
            closeEditor={closeNoteEditor}
            errors={errors}
            setErrors={setErrors}
            extraClasses={styles.signatures}
          />
        </div>
      )}

      {Object.values(loading).some((p) => p) ? (
        <LoadingSpinner inline />
      ) : (
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
      )}
    </div>
  )
}

export default NoteEditor
