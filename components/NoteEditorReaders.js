import React, { useEffect, useState } from 'react'
import { prettyId } from '../lib/utils'
import api from '../lib/api-client'
import MultiSelectorDropdown from './MultiSelectorDropdown'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import TagsWidget from './EditorComponents/TagsWidget'
import { difference, isEqual } from 'lodash'
import useUser from '../hooks/useUser'

export const NewNoteReaders = ({
  fieldDescription,
  fieldName,
  closeNoteEditor,
  noteEditorData,
  setNoteEditorData,
  setLoading,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { user, accessToken } = useUser()

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
          <MultiSelectorDropdown
            options={readerOptions}
            setSelectedValues={(values) =>
              setNoteEditorData({ fieldName: fieldName, value: values })
            }
            selectedValues={readerOptions
              .filter((p) => noteEditorData[fieldName]?.includes(p.value))
              .map((q) => q.value)}
          />
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
    if (!user || !fieldDescription) return // not essentially an error
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

  if (!user || !fieldDescription) return null
  return (
    <EditorComponentHeader fieldNameOverwrite="Readers" inline={true}>
      {renderReaders()}
    </EditorComponentHeader>
  )
}

// adding a reply note or editing a note
export const NewReplyEditNoteReaders = ({
  replyToNote,
  fieldDescription,
  fieldName,
  closeNoteEditor,
  noteEditorData,
  setNoteEditorData,
  setLoading,
  isDirectReplyToForum,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { user, accessToken } = useUser()

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
    if (isDirectReplyToForum || isEqualOrSubset(replyReaders, parentReaders)) {
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
          <MultiSelectorDropdown
            options={readerOptions}
            setSelectedValues={(values) =>
              setNoteEditorData({ fieldName: fieldName, value: values })
            }
            selectedValues={readerOptions
              .filter((p) => noteEditorData[fieldName]?.includes(p.value))
              .map((q) => q.value)}
          />
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
    if (!user || !fieldDescription) return // not essentially an error
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

  if (!user || !fieldDescription) return null
  return (
    <EditorComponentHeader fieldNameOverwrite="Readers" inline={true}>
      {renderReaders()}
    </EditorComponentHeader>
  )
}
