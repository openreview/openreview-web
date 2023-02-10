import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import EditorComponentContext from './EditorComponentContext'
import EditorWidget from './webfield/EditorWidget'
import styles from '../styles/components/NoteEditor.module.scss'
import debounce from 'lodash/debounce'
import { getAutoStorageKey, prettyId, prettyInvitationId } from '../lib/utils'
import useLoginRedirect from '../hooks/useLoginRedirect'
import { getNoteContent } from '../lib/webfield-utils'
import SpinnerButton from './SpinnerButton'
import LoadingSpinner from './LoadingSpinner'
import api from '../lib/api-client'
import Dropdown from './Dropdown'
import MultiSelectorDropdown from './MultiSelectorDropdown'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import TagsWidget from './EditorComponents/TagsWidget'
import { difference, intersection, isEmpty, isEqual } from 'lodash'
import Signatures from './Signatures'

const NewNoteReaders = ({
  fieldDescription,
  fieldName,
  closeNoteEditor,
  noteEditorData,
  setNoteEditorData,
  setLoading,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { accessToken } = useLoginRedirect()

  const getRegexReaders = async () => {
    setLoading((loading) => ({ ...loading, fieldName: true }))
    try {
      const regexExpression = fieldDescription.param.regex
      const regexContainsPipe = regexExpression.includes('|')
      const regexGroupResult = await api.get(
        '/groups',
        { [regexContainsPipe ? 'regex' : 'prefix']: regexExpression },
        { accessToken, version: regexContainsPipe ? 1 : 2 }
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
    setLoading((loading) => ({ ...loading, fieldName: false }))
  }

  const getEnumReaders = async () => {
    setLoading((loading) => ({ ...loading, fieldName: true }))
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
      switch (groupResults.flat().length) {
        case 0:
          throw new Error('You do not have permission to create a note')
        case 1:
          setDescriptionType('singleValueEnum')
          setReaderOptions([groupResults.flat()[0]])
          setNoteEditorData({ fieldName: fieldName, value: [groupResults.flat()[0]] })
          break
        default:
          setReaderOptions(groupResults.flat().map((p) => ({ label: prettyId(p), value: p })))
      }
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setLoading((loading) => ({ ...loading, fieldName: false }))
  }

  const renderReaders = () => {
    switch (descriptionType) {
      case 'const':
        return (
          <TagsWidget
            values={fieldDescription.param?.const ?? fieldDescription}
            fieldNameOverwrite="Readers"
          />
        )
      case 'regex':
      case 'enum':
        return readerOptions ? (
          <EditorComponentHeader fieldNameOverwrite="Readers">
            <MultiSelectorDropdown
              options={readerOptions}
              setSelectedValues={(values) =>
                setNoteEditorData({ fieldName: fieldName, value: values })
              }
              selectedValues={readerOptions
                .filter((p) => noteEditorData[fieldName]?.includes(p.value))
                .map((q) => q.value)}
            />
          </EditorComponentHeader>
        ) : null
      case 'singleValueEnum':
        return readerOptions ? (
          <TagsWidget values={readerOptions} fieldNameOverwrite="Readers" />
        ) : null
      default:
        return null
    }
  }

  useEffect(() => {
    if (!fieldDescription) return // not essentially an error
    if (Array.isArray(fieldDescription) || fieldDescription.param.const) {
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

  return renderReaders()
}

// adding a reply note or editing a note
const NewReplyEditNoteReaders = ({
  replyToNote,
  fieldDescription,
  fieldName,
  closeNoteEditor,
  noteEditorData,
  setNoteEditorData,
  setLoading,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { accessToken } = useLoginRedirect()

  const addEnumParentReaders = (groupResults, parentReaders) => {
    if (!parentReaders?.length) return groupResults
    if (parentReaders.includes('everyone')) return groupResults
    const readersIntersection = parentReaders.filter((p) => groupResults.includes(p))
    if (
      readersIntersection.find((p) => p.endsWith('/Reviewers')) &&
      !readersIntersection.find((p) => p.includes('/AnonReviewer') || p.includes('/Reviewer_'))
    ) {
      const readersIntersectionWithAnonReviewers = readersIntersection.concat(
        groupResults.filter((p) => p.includes('AnonReviewer') || p.includes('Reviewer_'))
      )
      return readersIntersectionWithAnonReviewers
    }
    return readersIntersection
  }

  const getRegexReaders = async () => {
    setLoading((loading) => ({ ...loading, fieldName: true }))
    try {
      const regexExpression = fieldDescription.param.regex
      const regexContainsPipe = regexExpression.includes('|')
      const regexGroupResult = await api.get(
        '/groups',
        { [regexContainsPipe ? 'regex' : 'prefix']: regexExpression },
        { accessToken, version: regexContainsPipe ? 1 : 2 }
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
    setLoading((loading) => ({ ...loading, fieldName: false }))
  }

  const getEnumReaders = async () => {
    setLoading((loading) => ({ ...loading, fieldName: true }))
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
      const optionWithParentReaders = addEnumParentReaders(
        groupResults.flat(),
        replyToNote?.readers
      )
      switch (groupResults.flat().length) {
        case 0:
          throw new Error('You do not have permission to create a note')
        case 1:
          if (!optionWithParentReaders.length)
            throw new Error('You do not have permission to create a note')
          if (difference(fieldDescription.param.default, optionWithParentReaders).length)
            throw new Error('Default reader is not in the list of readers')

          setDescriptionType('singleValueEnum')
          setReaderOptions([optionWithParentReaders[0]])
          setNoteEditorData({ fieldName: fieldName, value: [optionWithParentReaders[0]] })
          break
        default:
          if (!optionWithParentReaders.length)
            throw new Error('You do not have permission to create a note')
          if (difference(fieldDescription.param.default, optionWithParentReaders).length) {
            throw new Error('Default reader is not in the list of readers')
          }
          setReaderOptions(
            optionWithParentReaders.map((p) => ({
              label: prettyId(p),
              value: p,
            }))
          )
      }
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setLoading((loading) => ({ ...loading, fieldName: false }))
  }

  const getConstReaders = () => {
    const replyReaders = Array.isArray(fieldDescription)
      ? fieldDescription
      : fieldDescription.param.const

    if (!replyToNote) {
      setReaderOptions(replyReaders)
      return
    }
    const parentReaders = replyToNote.readers
    if (replyReaders[0] === '${{note.replyto}.readers}') {
      setReaderOptions(parentReaders)
      return
    }
    if (parentReaders.includes('everyone')) {
      setReaderOptions(replyReaders)
      return
    }
    if (isEqualOrSubset(replyReaders, parentReaders)) {
      setReaderOptions(replyReaders)
    } else {
      promptError('Can not create note, readers must match parent note')
      closeNoteEditor()
    }
  }

  const isEqualOrSubset = (replyReaders, parentReaders) => {
    if (isEqual(replyReaders, parentReaders)) return true
    return replyReaders.every((value) => {
      if (parentReaders.includes(value)) return true
      if (value.includes('/Reviewer_'))
        return parentReaders.find((p) => p.includes('/Reviewers'))
      return false
    })
  }

  const renderReaders = () => {
    switch (descriptionType) {
      case 'const':
        return readerOptions ? (
          <TagsWidget values={readerOptions} fieldNameOverwrite="Readers" />
        ) : null
      case 'regex':
      case 'enum':
        return readerOptions ? (
          <EditorComponentHeader fieldNameOverwrite="Readers">
            <MultiSelectorDropdown
              options={readerOptions}
              setSelectedValues={(values) =>
                setNoteEditorData({ fieldName: fieldName, value: values })
              }
              selectedValues={readerOptions
                .filter((p) => noteEditorData[fieldName]?.includes(p.value))
                .map((q) => q.value)}
            />
          </EditorComponentHeader>
        ) : null
      case 'singleValueEnum':
        return readerOptions ? (
          <TagsWidget values={readerOptions} fieldNameOverwrite="Readers" />
        ) : null
      default:
        return null
    }
  }

  useEffect(() => {
    if (!fieldDescription) return // not essentially an error
    if (Array.isArray(fieldDescription) || fieldDescription.param.const) {
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
    if (descriptionType === 'const') getConstReaders()
  }, [descriptionType])

  return renderReaders()
}

const ExistingNoteReaders = NewReplyEditNoteReaders

const EditReaders = NewNoteReaders

// const Signatures = ({
//   fieldDescription,
//   fieldName,
//   closeNoteEditor,
//   noteEditorData,
//   setNoteEditorData,
//   setLoading,
// }) => {
//   const [descriptionType, setDescriptionType] = useState(null)
//   const [signatureOptions, setSignatureOptions] = useState(null)
//   const { user, accessToken } = useLoginRedirect()

//   const getRegexSignatureOptions = async () => {
//     setLoading((loading) => ({ ...loading, fieldName: true }))
//     try {
//       const regexExpression = fieldDescription.param.regex
//       const regexContainsPipe = regexExpression.includes('|')
//       const regexGroupResult = await api.get(
//         '/groups',
//         { [regexContainsPipe ? 'regex' : 'prefix']: regexExpression, signatory: user?.id },
//         { accessToken, version: regexContainsPipe ? 1 : 2 }
//       )
//       if (!regexGroupResult.groups?.length)
//         throw new Error('You do not have permission to create a note')
//       if (regexGroupResult.groups.length === 1) {
//         setSignatureOptions([regexGroupResult.groups[0].id])
//         setNoteEditorData({ fieldName, value: [regexGroupResult.groups[0].id] })
//       } else {
//         setSignatureOptions(
//           regexGroupResult.groups
//             .filter(
//               (p, index) => regexGroupResult.groups.findIndex((q) => q.id === p.id) === index
//             )
//             .map((r) => {
//               let label = prettyId(r.id)
//               if (!r.id.startsWith('~') && r.members?.length === 1)
//                 label = `${label} (${prettyId(r.members[0])})`
//               return { label: label, value: r.id }
//             })
//         )
//       }
//     } catch (error) {
//       promptError(error.message)
//       closeNoteEditor()
//     }
//     setLoading((loading) => ({ ...loading, fieldName: false }))
//   }

//   const getEnumSignatureOptions = async () => {
//     setLoading((loading) => ({ ...loading, fieldName: true }))
//     try {
//       const options = fieldDescription.param.enum
//       const optionsP = options.map((p) =>
//         p.includes('.*')
//           ? api
//               .get('/groups', { prefix: p, signatory: user?.id }, { accessToken, version: 2 })
//               .then((result) => result.groups)
//           : api
//               .get('/groups', { id: p, signatory: user?.id }, { accessToken, version: 2 })
//               .then((result) => result.groups)
//       )
//       let groupResults = await Promise.all(optionsP)
//       groupResults = groupResults.flat()
//       const uniqueGroupResults = groupResults.filter(
//         (p, index) => groupResults.findIndex((q) => q.id === p.id) === index
//       )
//       if (uniqueGroupResults.length === 1) {
//         setSignatureOptions([uniqueGroupResults[0].id])
//         setNoteEditorData({ fieldName, value: [uniqueGroupResults[0].id] })
//       } else {
//         setSignatureOptions(
//           uniqueGroupResults.map((p) => {
//             let label = prettyId(p.id)
//             if (!p.id.startsWith('~') && p.members?.length === 1)
//               label = `${label} (${prettyId(p.members[0])})`
//             return { label: label, value: p.id }
//           })
//         )
//       }
//     } catch (error) {
//       promptError(error.message)
//       closeNoteEditor()
//     }
//     setLoading((loading) => ({ ...loading, fieldName: false }))
//   }

//   const renderNoteSignatures = () => {
//     switch (descriptionType) {
//       case 'const':
//         return <TagsWidget values={fieldDescription} fieldNameOverwrite="Signatures" />
//       case 'currentUser':
//         return <TagsWidget values={[user.profile?.id]} fieldNameOverwrite="Signatures" />
//       case 'regex':
//       case 'enum':
//         if (!signatureOptions) return null
//         if (signatureOptions.length === 1)
//           return <TagsWidget values={signatureOptions} fieldNameOverwrite="Signatures" />
//         return (
//           <EditorComponentHeader fieldNameOverwrite="Signatures">
//             <Dropdown
//               options={signatureOptions}
//               onChange={(e) => setNoteEditorData({ fieldName, value: [e.value] })}
//               value={signatureOptions.find((p) => p.value === noteEditorData[fieldName])}
//             />
//           </EditorComponentHeader>
//         )
//       default:
//         return null
//     }
//   }

//   useEffect(() => {
//     ;``
//     if (!fieldDescription) return
//     if (!fieldDescription.param) {
//       setDescriptionType('const')
//       return
//     }
//     if (fieldDescription.param?.regex) {
//       if (fieldDescription.param.regex === '~.*') {
//         setDescriptionType('currentUser')
//         setNoteEditorData({ fieldName, value: [user.profile.id] })
//       } else {
//         setDescriptionType('regex')
//       }
//       return
//     }
//     if (fieldDescription.param?.enum) {
//       setDescriptionType('enum')
//       return
//     }
//   }, [])

//   useEffect(() => {
//     if (descriptionType === 'regex') getRegexSignatureOptions()
//     if (descriptionType === 'enum') getEnumSignatureOptions()
//   }, [descriptionType])

//   return renderNoteSignatures()
// }

const NoteSignatures = ({
  fieldDescription,
  setLoading,
  noteEditorData,
  setNoteEditorData,
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

  return (
    <EditorComponentHeader fieldNameOverwrite="Signatures" inline={true}>
      <Signatures
        fieldDescription={fieldDescription}
        onChange={onChange}
        currentValue={noteEditorData.noteSignatureInputValues}
        onError={onError}
      />
    </EditorComponentHeader>
  )
}
const EditSignatures = ({
  fieldDescription,
  setLoading,
  noteEditorData,
  setNoteEditorData,
}) => {
  const onChange = ({ loading, value }) => {
    setLoading((existingLoadingState) => ({
      ...existingLoadingState,
      editSignatures: loading,
    }))
    setNoteEditorData({ fieldName: 'editSignatures', value })
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
      />
    </EditorComponentHeader>
  )
}

// for v2 only
const NoteEditor = ({ invitation, note, replyToNote, closeNoteEditor, onNoteCreated }) => {
  const { user, accessToken } = useLoginRedirect()
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState({
    noteReaders: false,
    noteSignatures: false,
    editReaders: false,
    editSignatures: false,
  })

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
    ...getNoteContent(note, true),
    ...(note && { noteReaderValues: note.readers }),
  })

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
          isContentField: true,
        }}
      >
        <EditorWidget />
      </EditorComponentContext.Provider>
    )
  }

  const renderNoteReaders = () => {
    if (!note && !replyToNote)
      return (
        <NewNoteReaders
          fieldDescription={invitation.edit.note.readers}
          fieldName="noteReaderValues"
          closeNoteEditor={closeNoteEditor}
          noteEditorData={noteEditorData}
          setNoteEditorData={setNoteEditorData}
          setLoading={setLoading}
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
    if (signatureInputValues.length && !readersSelected.includes('everyone')) {
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
          } else if (readersDefinedInInvitation?.includes(reviewersSubmittedGroupId)) {
            return [...readersSelected, reviewersSubmittedGroupId]
          } else if (readersDefinedInInvitation?.includes(reviewersGroupId)) {
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
    if (Array.isArray(invitation.edit.note.readers)) return undefined
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

    if (writers?.param?.regex === '~.*') {
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
    // get note reader/writer/signature and edit reader/writer/signature
    try {
      const editToPost = view2.constructEdit({
        formData: {
          ...noteEditorData,
          noteReaderValues: getNoteReaderValues(),
          editReaderValues: getEditReaderValues(),
          editWriterValues: getEditWriterValues(),
        },
        invitationObj: invitation,
        noteObj: note,
      })
      const result = await api.post('/notes/edits', editToPost, { accessToken, version: 2 })
      const createdNote = await getCreatedNote(result.note)
      closeNoteEditor()
      onNoteCreated(createdNote)
    } catch (error) {
      promptError(error.message)
    }

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

  if (!invitation) return null

  return (
    <div className={styles.noteEditor}>
      {note && <h2 className={styles.title}>{`Edit ${prettyInvitationId(invitation.id)}`}</h2>}
      {replyToNote && (
        <h2 className={styles.title}>{`New ${prettyInvitationId(invitation.id)}`}</h2>
      )}
      <div className={styles.requiredField}>* denotes a required field</div>
      {(note || replyToNote) && <hr />}
      {/* {fields.map((field) => renderField(field))}
      {renderNoteReaders()} */}
      <NoteSignatures
        fieldDescription={invitation.edit.note.signatures}
        fieldName="noteSignatureInputValues"
        closeNoteEditor={closeNoteEditor}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
        setLoading={setLoading}
      />
      {/* <EditReaders
        fieldDescription={invitation.edit.readers}
        fieldName="editReaderValues"
        closeNoteEditor={closeNoteEditor}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
        setLoading={setLoading}
      />*/}
      <EditSignatures
        fieldDescription={invitation.edit.signatures}
        fieldName="editSignatureInputValues"
        closeNoteEditor={closeNoteEditor}
        noteEditorData={noteEditorData}
        setNoteEditorData={setNoteEditorData}
        setLoading={setLoading}
      />
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
