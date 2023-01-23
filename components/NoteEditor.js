import { useCallback, useEffect, useReducer, useState } from 'react'
import EditorComponentContext from './EditorComponentContext'
import EditorWidget from './webfield/EditorWidget'
import styles from '../styles/components/NoteEditor.module.scss'
import debounce from 'lodash/debounce'
import { getAutoStorageKey, prettyId, prettyInvitationId } from '../lib/utils'
import useUser from '../hooks/useUser'
import { getNoteContent } from '../lib/webfield-utils'
import SpinnerButton from './SpinnerButton'
import LoadingSpinner from './LoadingSpinner'
import api from '../lib/api-client'
import Dropdown from './Dropdown'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import TagsWidget from './EditorComponents/TagsWidget'

const NewNoteReaders = ({
  fieldDescription,
  fieldName,
  closeNoteEditor,
  noteEditorData,
  setNoteEditorData,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { accessToken } = useUser()

  const getRegexReaders = async () => {
    setIsLoading(true)
    try {
      const regexGroupResult = await api.get(
        '/groups',
        { prefix: fieldDescription.param.regex },
        { accessToken, version: 2 }
      )
      if (!regexGroupResult.groups?.length)
        throw new Error('You do not have permission to create a note')
      const hasEveryoneGroup = regexGroupResult.groups.find((p) => p.id === 'everyone')
      const orderAdjustedGroups = hasEveryoneGroup
        ? [hasEveryoneGroup, ...regexGroupResult.groups.filter((p) => p.id !== 'everyone')]
        : regexGroupResult.groups
      setReaderOptions(
        orderAdjustedGroups.map((p) => ({ label: prettyId(p.id), value: p.id }))
      )
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setIsLoading(false)
  }

  const getEnumReaders = async () => {
    setIsLoading(true)
    try {
      const options = fieldDescription.param.enum
      const optionsP = options.map((p) =>
        p.includes('.*')
          ? api
              .get('/groups', { prefix: p }, { accessToken, version: 2 })
              .then((result) => result.groups.map((q) => q.id))
          : Promise.resolve([p])
      )
      const groupResults = await Promise.all(optionsP)
      setReaderOptions(groupResults.flat().map((p) => ({ label: prettyId(p), value: p })))
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setIsLoading(false)
  }

  const renderReaders = () => {
    switch (descriptionType) {
      case 'const':
        return (
          <EditorComponentContext.Provider
            value={{
              field: { readers: fieldDescription },
              isWebfield: false,
            }}
          >
            <EditorWidget />
          </EditorComponentContext.Provider>
        )
      case 'regex':
        return readerOptions ? (
          <EditorComponentHeader fieldNameOverwrite="Readers">
            <Dropdown
              options={readerOptions}
              onChange={(e) => setNoteEditorData({ fieldName: fieldName, value: e.value })}
              value={readerOptions.find((p) => p.value === noteEditorData[fieldName])}
            />
          </EditorComponentHeader>
        ) : null
      case 'enum':
        return readerOptions ? (
          <EditorComponentHeader fieldNameOverwrite="Readers">
            <Dropdown
              options={readerOptions}
              onChange={(e) => setNoteEditorData({ fieldName: fieldName, value: e.value })}
              value={readerOptions.find((p) => p.value === noteEditorData[fieldName])}
            />
          </EditorComponentHeader>
        ) : null
      default:
        return null
    }
  }

  useEffect(() => {
    if (!fieldDescription) return // not essentially an error
    if (!fieldDescription.param) {
      setDescriptionType('const')
    } else if (fieldDescription.param.regex) {
      setDescriptionType('regex')
    } else if (fieldDescription.param.enum) {
      setDescriptionType('enum')
    }
  }, [])

  useEffect(() => {
    if (descriptionType === 'regex') getRegexReaders()
    if (descriptionType === 'enum') getEnumReaders()
  }, [descriptionType])

  if (isLoading) return <LoadingSpinner />
  return renderReaders()
}

const EditReaders = NewNoteReaders

const Signatures = ({
  fieldDescription,
  fieldName,
  closeNoteEditor,
  noteEditorData,
  setNoteEditorData,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [descriptionType, setDescriptionType] = useState(null)
  const [signatureOptions, setSignatureOptions] = useState(null)
  const { user, accessToken } = useUser()

  const getRegexSignatureOptions = async () => {
    setIsLoading(true)
    try {
      const regexGroupResult = await api.get(
        '/groups',
        { prefix: fieldDescription.param.regex, signatory: user.id },
        { accessToken, version: 2 }
      )
      if (!regexGroupResult.groups?.length)
        throw new Error('You do not have permission to create a note')
      if (regexGroupResult.groups.length === 1) {
        setSignatureOptions([regexGroupResult.groups[0].id])
      } else {
        setSignatureOptions(
          regexGroupResult.groups
            .filter(
              (p, index) => regexGroupResult.groups.findIndex((q) => q.id === p.id) === index
            )
            .map((r) => {
              let label = prettyId(r.id)
              if (!r.id.startsWith('~') && r.members?.length === 1)
                label = `${label} (${prettyId(r.members[0])})`
              return { label: label, value: r.id }
            })
        )
      }
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setIsLoading(false)
  }

  const getEnumSignatureOptions = async () => {
    setIsLoading(true)
    try {
      const options = fieldDescription.param.enum
      const optionsP = options.map((p) =>
        p.includes('.*')
          ? api
              .get('/groups', { prefix: p, signatory: user.id }, { accessToken, version: 2 })
              .then((result) => result.groups)
          : api
              .get('/groups', { id: p, signatory: user.id }, { accessToken, version: 2 })
              .then((result) => result.groups)
      )
      let groupResults = await Promise.all(optionsP)
      groupResults = groupResults.flat()
      const uniqueGroupResults = groupResults.filter(
        (p, index) => groupResults.findIndex((q) => q.id === p.id) === index
      )
      if (uniqueGroupResults.length === 1) {
        setSignatureOptions([uniqueGroupResults[0].id])
      } else {
        setSignatureOptions(
          uniqueGroupResults.map((p) => {
            let label = prettyId(p.id)
            if (!p.id.startsWith('~') && p.members?.length === 1)
              label = `${label} (${prettyId(p.members[0])})`
            return { label: label, value: p.id }
          })
        )
      }
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setIsLoading(false)
  }

  const renderNoteSignatures = () => {
    switch (descriptionType) {
      case 'currentUser':
        return (
          <EditorComponentHeader fieldNameOverwrite="Signatures">
            <TagsWidget values={[user.profile.id]} />
          </EditorComponentHeader>
        )
      case 'regex':
      case 'enum':
        if (!signatureOptions) return null
        if (signatureOptions.length === 1)
          return (
            <EditorComponentHeader fieldNameOverwrite="Signatures">
              <TagsWidget values={signatureOptions} />
            </EditorComponentHeader>
          )
        return (
          <EditorComponentHeader fieldNameOverwrite="Signatures">
            <Dropdown
              options={signatureOptions}
              onChange={(e) => setNoteEditorData({ fieldName, value: e.value })}
              value={signatureOptions.find((p) => p.value === noteEditorData[fieldName])}
            />
          </EditorComponentHeader>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    // currentUser,regex,enum of regexes, enum of values
    if (!fieldDescription) return
    if (fieldDescription.param?.regex) {
      if (fieldDescription.param.regex === '~.*') {
        setDescriptionType('currentUser')
      } else {
        setDescriptionType('regex')
      }
      return
    }
    if (fieldDescription.param?.enum) {
      setDescriptionType('enum')
      return
    }
  }, [])

  useEffect(() => {
    if (descriptionType === 'regex') getRegexSignatureOptions()
    if (descriptionType === 'enum') getEnumSignatureOptions()
  }, [descriptionType])

  if (isLoading) return <LoadingSpinner />
  return renderNoteSignatures()
}

const NoteSignatures = Signatures
const EditSignatures = Signatures

// for v2 only
const NoteEditor = ({ invitation, note, replyToId, closeNoteEditor }) => {
  const { user } = useUser()
  const [fields, setFields] = useState([])
  const saveDraft = useCallback(
    debounce((fieldName, value) => {
      const keyOfSavedText = getAutoStorageKey(user, invitation.id, note?.id, fieldName)
      localStorage.setItem(keyOfSavedText, value)
      setAutoStorageKeys((keys) => [...keys, keyOfSavedText])
    }, 2000),
    []
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
  const [noteEditorData, setNoteEditorData] = useReducer(
    noteEditorDataReducer,
    getNoteContent(note, true)
  )

  const [autoStorageKeys, setAutoStorageKeys] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const renderField = ({ fieldName, fieldDescription }) => {
    return (
      <EditorComponentContext.Provider
        key={fieldName}
        value={{
          invitation,
          note,
          field: { [fieldName]: fieldDescription },
          onChange: ({ fieldName, value, shouldSaveDraft }) =>
            setNoteEditorData({ fieldName, value, shouldSaveDraft }),
          value: noteEditorData[fieldName],
          key: fieldName,
          isWebfield: false,
        }}
      >
        <EditorWidget />
      </EditorComponentContext.Provider>
    )
  }

  const renderExistingNoteReaders = () => {}

  const renderNewReplyNoteReaders = () => {}

  const renderNoteReaders = () => {
    if (!note && !replyToId)
      return (
        <NewNoteReaders
          fieldDescription={invitation.edit.note.readers}
          fieldName="noteReaders"
          closeNoteEditor={closeNoteEditor}
          noteEditorData={noteEditorData}
          setNoteEditorData={setNoteEditorData}
        />
      )
    if (note) return renderExistingNoteReaders()
    if (replyToId) return renderNewReplyNoteReaders()
    return null
  }

  const handleCancelClick = () => {
    autoStorageKeys.forEach((key) => localStorage.removeItem(key))
    closeNoteEditor()
  }

  const handleSubmitClick = () => {
    setIsSubmitting(true)
    // get note reader/writer/signature and edit reader/writer/signature
    console.log('noteEditorData', noteEditorData)
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (!invitation?.edit?.note?.content) return
    const orderedFields = Object.entries(invitation.edit.note.content)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([fieldName, fieldDescription]) => ({
        fieldName,
        fieldDescription,
      }))
    setFields(orderedFields)
  }, [invitation])

  return (
    <div className={styles.noteEditor}>
      {note && <h2 className={styles.title}>{`Edit ${prettyInvitationId(invitation.id)}`}</h2>}
      <div className={styles.requiredField}>* denotes a required field</div>
      {note && <hr />}
      {fields.map((field) => renderField(field))}
      {renderNoteReaders()}
      <NoteSignatures
        fieldDescription={invitation.edit.note.signatures}
        fieldName="noteSignatures"
        closeNoteEditor={closeNoteEditor}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
      />
      <EditReaders
        fieldDescription={invitation.edit.readers}
        fieldName="editReaders"
        closeNoteEditor={closeNoteEditor}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
      />
      <EditSignatures
        fieldDescription={invitation.edit.signatures}
        fieldName="editSignatures"
        closeNoteEditor={closeNoteEditor}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
      />
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
    </div>
  )
}

export default NoteEditor
