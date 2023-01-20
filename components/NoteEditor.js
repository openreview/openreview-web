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

const NoteEditorNewNoteReaders = ({
  invitation,
  closeNoteEditor,
  noteEditorData,
  setNoteEditorData,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [descriptionType, setDescriptionType] = useState(null)
  const [regexReaderOptions, setRegexReaderOptions] = useState(null)
  const [enumReaderOptions, setEnumReaderOptions] = useState(null)
  const { accessToken } = useUser()
  const noteReadersDescription = invitation.edit.note.readers

  const getRegexNewNoteReaders = async () => {
    setIsLoading(true)
    try {
      const regexGroupResult = await api.get(
        '/groups',
        { prefix: noteReadersDescription.param.regex },
        { accessToken, version: 2 }
      )
      if (!regexGroupResult.groups?.length)
        throw new Error('You do not have permission to create a note')
      const hasEveryoneGroup = regexGroupResult.groups.find((p) => p.id === 'everyone')
      const orderAdjustedGroups = hasEveryoneGroup
        ? [hasEveryoneGroup, ...regexGroupResult.groups.filter((p) => p.id !== 'everyone')]
        : regexGroupResult.groups
      setRegexReaderOptions(
        orderAdjustedGroups.map((p) => ({ label: prettyId(p.id), value: p.id }))
      )
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setIsLoading(false)
  }

  const getEnumNewNoteReaders = async () => {
    setIsLoading(true)
    try {
      const options = noteReadersDescription.param.enum
      const optionsP = options.map((p) =>
        p.includes('.*')
          ? api
              .get('/groups', { prefix: p }, { accessToken, version: 2 })
              .then((result) => result.groups.map((q) => q.id))
          : Promise.resolve([p])
      )
      const groupResults = await Promise.all(optionsP)
      setEnumReaderOptions(groupResults.flat().map((p) => ({ label: prettyId(p), value: p })))
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setIsLoading(false)
  }

  const renderNewNoteReaders = () => {
    switch (descriptionType) {
      case 'const':
        return (
          <EditorComponentContext.Provider
            value={{
              field: { readers: noteReadersDescription },
              isWebfield: false,
            }}
          >
            <EditorWidget />
          </EditorComponentContext.Provider>
        )
      case 'regex':
        return regexReaderOptions ? (
          <EditorComponentContext.Provider
            value={{
              invitation,
              field: { readers: {} },
            }}
          >
            <EditorComponentHeader>
              <Dropdown
                options={regexReaderOptions}
                onChange={(e) =>
                  setNoteEditorData({ fieldName: 'noteReader', value: e.value })
                }
                value={regexReaderOptions.find((p) => p.value === noteEditorData.noteReader)}
              />
            </EditorComponentHeader>
          </EditorComponentContext.Provider>
        ) : null
      case 'enum':
        return enumReaderOptions ? (
          <EditorComponentContext.Provider
            value={{
              invitation,
              field: { readers: {} },
            }}
          >
            <EditorComponentHeader>
              <Dropdown
                options={enumReaderOptions}
                onChange={(e) =>
                  setNoteEditorData({ fieldName: 'noteReader', value: e.value })
                }
                value={enumReaderOptions.find((p) => p.value === noteEditorData.noteReader)}
              />
            </EditorComponentHeader>
          </EditorComponentContext.Provider>
        ) : null
      default:
        return null
    }
  }

  useEffect(() => {
    if (!noteReadersDescription) return // not essentially an error
    if (!noteReadersDescription.param) {
      setDescriptionType('const')
    } else if (noteReadersDescription.param.regex) {
      setDescriptionType('regex')
    } else if (noteReadersDescription.param.enum) {
      setDescriptionType('enum')
    }
  }, [])

  useEffect(() => {
    if (descriptionType === 'regex') getRegexNewNoteReaders()
    if (descriptionType === 'enum') getEnumNewNoteReaders()
  }, [descriptionType])

  if (isLoading) return <LoadingSpinner />
  return renderNewNoteReaders()
}

const NoteEditorNoteSignatures = ({
  invitation,
  closeNoteEditor,
  noteEditorData,
  setNoteEditorData,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [descriptionType, setDescriptionType] = useState(null)
  const [signatureOptions, setSignatureOptions] = useState(null)
  const { user, accessToken } = useUser()
  const noteSignaturesDescription = invitation.edit.note.signatures

  const getRegexSignatureOptions = async () => {
    setIsLoading(true)
    try {
      const regexGroupResult = await api.get(
        '/groups',
        { prefix: noteSignaturesDescription.param.regex, signatory: user.id },
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
      const options = noteSignaturesDescription.param.enum
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
          <EditorComponentContext.Provider
            value={{
              field: { signatures: {} },
              isWebfield: false,
            }}
          >
            <TagsWidget values={[user.profile.id]} />
          </EditorComponentContext.Provider>
        )
      case 'regex':
      case 'enum':
        if (!signatureOptions) return null
        if (signatureOptions.length === 1)
          return (
            <EditorComponentContext.Provider
              value={{
                field: { signatures: {} },
                isWebfield: false,
              }}
            >
              <TagsWidget values={signatureOptions} />
            </EditorComponentContext.Provider>
          )
        return (
          <EditorComponentContext.Provider
            value={{
              invitation,
              field: { signatures: {} },
            }}
          >
            <EditorComponentHeader>
              <Dropdown
                options={signatureOptions}
                onChange={(e) =>
                  setNoteEditorData({ fieldName: 'noteSignature', value: e.value })
                }
                value={signatureOptions.find((p) => p.value === noteEditorData.noteSignature)}
              />
            </EditorComponentHeader>
          </EditorComponentContext.Provider>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    // currentUser,regex,enum of regexes, enum of values
    if (!noteSignaturesDescription) return
    if (noteSignaturesDescription.param?.regex) {
      if (noteSignaturesDescription.param.regex === '~.*') {
        setDescriptionType('currentUser')
      } else {
        setDescriptionType('regex')
      }
      return
    }
    if (noteSignaturesDescription.param?.enum) {
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
        <NoteEditorNewNoteReaders
          invitation={invitation}
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
      <NoteEditorNoteSignatures
        invitation={invitation}
        closeNoteEditor={closeNoteEditor}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
      />
      {/* {renderField({ fieldName: 'Writers', fieldDescription: invitation.edit.note.writers })} */}
      {/* {renderField({
        fieldName: 'Signatures',
        fieldDescription: invitation.edit.note.signatures,
      })} */}
      {/* {renderField({ fieldName: 'Edit Readers', fieldDescription: invitation.edit.readers })} */}
      {/* {renderField({ fieldName: 'Edit Writers', fieldDescription: invitation.edit.writers })} */}
      {/* {renderField({
        fieldName: 'Edit Signatures',
        fieldDescription: invitation.edit.signatures,
      })} */}
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
