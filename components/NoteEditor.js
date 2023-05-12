/* globals promptError, promptLogin, view2: false */

import React, { useEffect, useMemo, useReducer, useState } from 'react'
import debounce from 'lodash/debounce'
import { intersection, isEmpty } from 'lodash'
import EditorComponentContext from './EditorComponentContext'
import EditorWidget from './webfield/EditorWidget'
import styles from '../styles/components/NoteEditor.module.scss'
import { getAutoStorageKey, prettyField, prettyInvitationId } from '../lib/utils'
import { getErrorFieldName } from '../lib/webfield-utils'
import { getNoteContentValues } from '../lib/forum-utils'
import SpinnerButton from './SpinnerButton'
import LoadingSpinner from './LoadingSpinner'
import api from '../lib/api-client'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import Signatures from './Signatures'
import { NewNoteReaders, NewReplyEditNoteReaders } from './NoteEditorReaders'
import useUser from '../hooks/useUser'

const ExistingNoteReaders = NewReplyEditNoteReaders

const EditReaders = NewNoteReaders

const NoteSignatures = ({
  fieldDescription,
  setLoading,
  noteEditorData,
  setNoteEditorData,
  closeNoteEditor,
}) => {
  const onChange = ({ loading, value }) => {
    setLoading((existingLoadingState) => ({
      ...existingLoadingState,
      noteSignatures: loading,
    }))
    setNoteEditorData({ fieldName: 'noteSignatures', value })
  }

  const onError = (errorMessage) => {
    promptError(errorMessage)
    closeNoteEditor()
  }

  if (!fieldDescription) return null
  return (
    <EditorComponentHeader fieldNameOverwrite="Signatures" inline={true}>
      <Signatures
        fieldDescription={fieldDescription}
        onChange={onChange}
        currentValue={noteEditorData.noteSignatureInputValues}
        onError={onError}
        extraClasses={styles.signatures}
      />
    </EditorComponentHeader>
  )
}
const EditSignatures = ({
  fieldDescription,
  setLoading,
  noteEditorData,
  setNoteEditorData,
  closeNoteEditor,
}) => {
  const onChange = ({ loading, value }) => {
    setLoading((existingLoadingState) => ({
      ...existingLoadingState,
      editSignatures: loading,
    }))
    if (value) setNoteEditorData({ fieldName: 'editSignatureInputValues', value })
  }

  const onError = (errorMessage) => {
    promptError(errorMessage)
    closeNoteEditor()
  }

  return (
    <EditorComponentHeader fieldNameOverwrite="Signatures" inline={true}>
      <Signatures
        fieldDescription={fieldDescription}
        onChange={onChange}
        currentValue={noteEditorData.editSignatureInputValues}
        onError={onError}
        extraClasses={styles.signatures}
      />
    </EditorComponentHeader>
  )
}

// for v2 only
const NoteEditor = ({
  invitation,
  note,
  replyToNote,
  closeNoteEditor,
  onNoteCreated,
  isDirectReplyToForum,
}) => {
  const { user, accessToken } = useUser()
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

  const saveDraft = useMemo(
    () =>
      debounce((fieldName, value) => {
        const keyOfSavedText = getAutoStorageKey(user, invitation.id, note?.id, fieldName)
        localStorage.setItem(keyOfSavedText, value)
        setAutoStorageKeys((keys) => [...keys, keyOfSavedText])
      }, 2000),
    [invitation, note, replyToNote]
  )

  const noteEditorDataReducer = (state, action) => {
    if (action.shouldSaveDraft) {
      saveDraft(action.fieldName, action.value)
    }
    return {
      ...state,
      [action.fieldName]: action.value,
    }
  }
  const [noteEditorData, setNoteEditorData] = useReducer(noteEditorDataReducer, {
    ...getNoteContentValues(note?.content ?? {}),
    ...(note && { noteReaderValues: note.readers }),
  })

  const renderField = ({ fieldName, fieldDescription }) => {
    const fieldNameOverwrite = fieldName === 'authorids' ? 'Authors' : undefined
    let fieldValue = noteEditorData[fieldName]
    const error = errors.find((e) => e.fieldName === fieldName)
    if (fieldName === 'authorids' && note) {
      fieldValue = noteEditorData.authorids?.map((p, index) => ({
        authorId: p,
        authorName: noteEditorData.authors?.[index],
      }))
    }
    return (
      <React.Fragment key={fieldName}>
        <EditorComponentContext.Provider
          value={{
            invitation,
            note,
            field: { [fieldName]: fieldDescription },
            // eslint-disable-next-line no-shadow
            onChange: ({ fieldName, value, shouldSaveDraft }) =>
              setNoteEditorData({ fieldName, value, shouldSaveDraft }),
            value: fieldValue,
            key: fieldName,
            isWebfield: false,
            error,
            clearError: () =>
              setErrors((existingErrors) =>
                existingErrors.filter((p) => p.fieldName !== fieldName)
              ),
          }}
        >
          <EditorComponentHeader fieldNameOverwrite={fieldNameOverwrite}>
            <EditorWidget />
          </EditorComponentHeader>
        </EditorComponentContext.Provider>
        {fieldDescription.readers && (
          <EditorComponentContext.Provider
            key={`${fieldName}-readers`}
            value={{
              field: { [fieldName]: fieldDescription.readers },
            }}
          >
            <div>
              <span>Visible to:</span> <EditorWidget />
            </div>
          </EditorComponentContext.Provider>
        )}
      </React.Fragment>
    )
  }

  const renderNoteReaders = () => {
    if (!invitation.edit.note.readers) return null
    if (!note && !replyToNote)
      return (
        <NewNoteReaders
          fieldDescription={invitation.edit.note.readers}
          fieldName="noteReaderValues"
          closeNoteEditor={closeNoteEditor}
          noteEditorData={noteEditorData}
          setNoteEditorData={setNoteEditorData}
          setLoading={setLoading}
          placeholder="Select note readers"
        />
      )
    if (note)
      return (
        <ExistingNoteReaders
          replyToNote={replyToNote}
          fieldDescription={invitation.edit.note.readers}
          fieldName="noteReaderValues"
          closeNoteEditor={closeNoteEditor}
          noteEditorData={noteEditorData}
          setNoteEditorData={setNoteEditorData}
          setLoading={setLoading}
          placeholder="Select note readers"
        />
      )
    if (replyToNote)
      return (
        <NewReplyEditNoteReaders
          replyToNote={replyToNote}
          fieldDescription={invitation.edit.note.readers}
          fieldName="noteReaderValues"
          closeNoteEditor={closeNoteEditor}
          noteEditorData={noteEditorData}
          setNoteEditorData={setNoteEditorData}
          setLoading={setLoading}
          isDirectReplyToForum={isDirectReplyToForum}
          placeholder="Select note readers"
        />
      )
    return null
  }

  const handleCancelClick = () => {
    autoStorageKeys.forEach((key) => localStorage.removeItem(key))
    closeNoteEditor()
  }

  const addMissingReaders = (
    readersSelected,
    readersDefinedInInvitation,
    signatureInputValues
  ) => {
    if (signatureInputValues?.length && !readersSelected.includes('everyone')) {
      const signatureId = signatureInputValues[0]
      const anonReviewerIndex = Math.max(
        signatureId.indexOf('AnonReviewer'),
        signatureId.indexOf('Reviewer_')
      )
      if (anonReviewerIndex > 0) {
        const reviewersSubmittedGroupId = signatureId
          .slice(0, anonReviewerIndex)
          .concat('Reviewers/Submitted')
        const reviewersGroupId = signatureId.slice(0, anonReviewerIndex).concat('Reviewers')
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
          if (readersDefinedInInvitation?.includes(signatureId)) {
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
        const acIndex = Math.max(
          signatureId.indexOf('Area_Chair1'),
          signatureId.indexOf('Area_Chair_')
        )
        const acGroupId =
          acIndex >= 0 ? signatureId.slice(0, acIndex).concat('Area_Chairs') : signatureId
        return readersDefinedInInvitation?.includes(acGroupId)
          ? [...readersSelected, acGroupId]
          : readersSelected
      }
    }
    return readersSelected
  }

  const getNoteReaderValues = () => {
    if (!invitation.edit.note.readers || Array.isArray(invitation.edit.note.readers))
      return undefined
    const constNoteSignature = // when note signature is edit signature, note reader should use edit signatures
      invitation.edit.note?.signatures?.[0]?.includes('/signatures}') ||
      invitation.edit.note?.signatures?.param?.const?.[0]?.includes('/signatures}')
    const signatureInputValues = constNoteSignature
      ? noteEditorData.editSignatureInputValues
      : noteEditorData.noteSignatureInputValues

    return addMissingReaders(
      noteEditorData.noteReaderValues,
      invitation.edit.note.readers?.param?.enum,
      signatureInputValues
    )
  }

  const getEditReaderValues = () => {
    if (Array.isArray(invitation.edit.readers)) return undefined
    return addMissingReaders(
      noteEditorData.editReaderValues,
      invitation.edit.readers?.param?.enum,
      noteEditorData.editSignatureInputValues
    )
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
        { accessToken, version: 2 }
      )
      return result.notes?.[0] ? result.notes[0] : constructedNote
    } catch (error) {
      if (error.name === 'ForbiddenError') return constructedNote
      throw error
    }
  }

  const handleSubmitClick = async () => {
    setIsSubmitting(true)
    setErrors([])
    // get note reader/writer/signature and edit reader/writer/signature
    try {
      const editToPost = view2.constructEdit({
        formData: {
          ...noteEditorData,
          ...Object.entries(noteEditorData)
            .filter(([key, value]) => value === undefined)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: { delete: true } }), {}),
          ...(noteEditorData.authorids
            ? {
                authors: noteEditorData.authorids?.map((p) => p.authorName),
                authorids: noteEditorData.authorids?.map((p) => p.authorId),
              }
            : { authors: { delete: true }, authorids: { delete: true } }),
          noteReaderValues: getNoteReaderValues(),
          editReaderValues: getEditReaderValues(),
          editWriterValues: getEditWriterValues(),
          ...(replyToNote && { replyto: replyToNote.id }),
        },
        invitationObj: invitation,
        noteObj: note,
      })
      const result = await api.post('/notes/edits', editToPost, { accessToken, version: 2 })
      const createdNote = await getCreatedNote(result.note)
      autoStorageKeys.forEach((key) => localStorage.removeItem(key))
      closeNoteEditor()
      onNoteCreated(createdNote)
    } catch (error) {
      if (error.errors) {
        setErrors(
          error.errors.map((p) => {
            const fieldName = getErrorFieldName(p.details.path)
            return { fieldName, message: p.message.replace(fieldName, prettyField(fieldName)) }
          })
        )
        promptError('Some info submitted are invalid.')
      } else if (error.details.path) {
        const fieldName = getErrorFieldName(error.details.path)
        setErrors([
          {
            fieldName,
            message: error.message.replace(fieldName, prettyField(fieldName)),
          },
        ])
        promptError(error.message)
      } else {
        promptError(error.message)
      }
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    if (!user) {
      promptLogin()
      return
    }
    if (!invitation?.edit?.note?.content) return
    const orderedFields = Object.entries(invitation.edit.note.content)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([fieldName, fieldDescription]) => ({
        fieldName,
        fieldDescription,
      }))
    setFields(orderedFields)
  }, [invitation, user])

  if (!invitation || !user) return null

  return (
    <div className={styles.noteEditor}>
      {note && <h2 className={styles.title}>{`Edit ${prettyInvitationId(invitation.id)}`}</h2>}
      {replyToNote && (
        <h2 className={styles.title}>{`New ${prettyInvitationId(invitation.id)}`}</h2>
      )}
      <div className={styles.requiredField}>* denotes a required field</div>
      {(note || replyToNote) && <hr />}
      {fields.map((field) => renderField(field))}
      {renderNoteReaders()}
      <NoteSignatures
        fieldDescription={invitation.edit.note.signatures}
        setLoading={setLoading}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
        closeNoteEditor={closeNoteEditor}
      />
      <div className={styles.editReaderSignature}>
        <h2>Edit History</h2>
        <hr className="small" />
        <EditReaders
          fieldDescription={invitation.edit.readers}
          fieldName="editReaderValues"
          closeNoteEditor={closeNoteEditor}
          noteEditorData={noteEditorData}
          setNoteEditorData={setNoteEditorData}
          setLoading={setLoading}
          placeholder="Select edit readers"
        />
        <EditSignatures
          fieldDescription={invitation.edit.signatures}
          setLoading={setLoading}
          noteEditorData={noteEditorData}
          setNoteEditorData={setNoteEditorData}
          closeNoteEditor={closeNoteEditor}
        />
      </div>
      {Object.values(loading).some((p) => p) ? (
        <LoadingSpinner inline />
      ) : (
        <div className={styles.responseButtons}>
          <SpinnerButton
            className={styles.submitButton}
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Submit
          </SpinnerButton>
          <button className="btn btn-sm" onClick={handleCancelClick} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default NoteEditor
