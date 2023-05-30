/* globals promptError: false */

import React, { useEffect, useState } from 'react'
import { difference, isEqual } from 'lodash'
import { prettyId } from '../lib/utils'
import api from '../lib/api-client'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import TagsWidget from './EditorComponents/TagsWidget'
import useUser from '../hooks/useUser'
import { NoteEditorReadersDropdown } from './Dropdown'

export const NewNoteReaders = ({
  fieldDescription,
  closeNoteEditor,
  value,
  onChange,
  setLoading,
  placeholder,
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
      const enumItemsConfigOptions = fieldDescription.param.enum
        ? fieldDescription.param.enum.map((p) => ({
            [p.includes('.*') ? 'prefix' : 'value']: p,
            description: p,
            optional: true,
          }))
        : fieldDescription.param.items
      const optionsP = enumItemsConfigOptions.map((p) =>
        p.prefix
          ? api
              .get('/groups', { prefix: p.prefix }, { accessToken, version: 2 })
              .then((result) =>
                result.groups.map((q) => ({
                  value: q.id,
                  description: prettyId(q.id, true),
                  optional: p.optional,
                }))
              )
          : Promise.resolve([
              {
                ...p,
                description: prettyId(p.description)
                  .split(/\{(\S+)\}/g)
                  .filter((q) => q.trim())
                  .join(),
              },
            ])
      )
      const groupResults = await Promise.all(optionsP)
      let options
      let mandatoryValues
      let defaultValues
      switch (groupResults.flat().length) {
        case 0:
          throw new Error('You do not have permission to create a note')
        case 1:
          setDescriptionType('singleValueEnum')
          setReaderOptions([groupResults.flat()[0].description]) // tag only need description
          onChange([groupResults.flat()[0].value])
          break
        default:
          options = groupResults.flat().map((p) => ({
            label: p.description,
            value: p.value,
            optional: p.optional,
          }))
          mandatoryValues = options.flatMap((p) => (p.optional === false ? p.value : [])) ?? []
          defaultValues = fieldDescription?.param?.default ?? []

          if (!value && (defaultValues?.length || mandatoryValues?.length)) {
            onChange([...new Set([...defaultValues, ...mandatoryValues])])
          }
          setReaderOptions(options)
      }
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setLoading((loading) => ({ ...loading, fieldName: false }))
  }

  const dropdownChangeHandler = (selectedOptions, actionMeta) => {
    let updatedValue
    let mandatoryValues
    switch (actionMeta.action) {
      case 'select-option':
        updatedValue = (value ?? []).concat(actionMeta.option.value)
        onChange(updatedValue)
        break
      case 'remove-value':
        if (actionMeta.removedValue.optional) {
          updatedValue = value.filter((p) => p !== actionMeta.removedValue.value)
          onChange(updatedValue.length ? updatedValue : undefined)
        }
        break
      case 'clear':
        mandatoryValues = readerOptions.flatMap((p) => (p.optional === true ? [] : p.value))
        onChange(mandatoryValues.length ? mandatoryValues : undefined)
        break
      default:
        break
    }
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
          <NoteEditorReadersDropdown
            placeholder={placeholder}
            options={readerOptions}
            value={readerOptions.filter((p) => value?.includes(p.value))}
            onChange={dropdownChangeHandler}
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
    } else if (fieldDescription.param.enum || fieldDescription.param.items) {
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
  closeNoteEditor,
  value,
  onChange,
  setLoading,
  isDirectReplyToForum,
  placeholder,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { user, accessToken } = useUser()

  const addEnumParentReaders = (groupResults, parentReaders) => {
    if (!parentReaders?.length) return groupResults
    if (parentReaders.includes('everyone')) return groupResults
    const readersIntersection = parentReaders.flatMap((p) => {
      const groupResult = groupResults.find((q) => q.value === p)
      return groupResult ?? []
    })

    if (
      readersIntersection.find((p) => p.value.endsWith('/Reviewers')) &&
      !readersIntersection.find(
        (p) => p.value.includes('/AnonReviewer') || p.value.includes('/Reviewer_')
      )
    ) {
      const readersIntersectionWithAnonReviewers = readersIntersection.concat(
        groupResults.filter(
          (p) => p.value.includes('AnonReviewer') || p.value.includes('Reviewer_')
        )
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
      const enumItemsConfigOptions = fieldDescription.param.enum
        ? fieldDescription.param.enum.map((p) => ({
            [p.includes('.*') ? 'prefix' : 'value']: p,
            description: p,
            optional: true,
          }))
        : fieldDescription.param.items
      const optionsP = enumItemsConfigOptions.map((p) =>
        p.prefix
          ? api
              .get('/groups', { prefix: p.prefix }, { accessToken, version: 2 })
              .then((result) =>
                result.groups.map((q) => ({
                  value: q.id,
                  description: prettyId(q.id, true),
                  optional: p.optional,
                }))
              )
          : Promise.resolve([
              {
                ...p,
                description: prettyId(p.description)
                  .split(/\{(\S+)\}/g)
                  .filter((q) => q.trim())
                  .join(),
              },
            ])
      )
      const groupResults = await Promise.all(optionsP)

      const optionWithParentReaders = addEnumParentReaders(
        groupResults.flat(),
        replyToNote?.readers
      )

      let options
      let mandatoryValues
      let defaultValues
      switch (groupResults.flat().length) {
        case 0:
          throw new Error('You do not have permission to create a note')
        case 1:
          if (!optionWithParentReaders.length)
            throw new Error('You do not have permission to create a note')
          if (
            difference(
              fieldDescription.param.default,
              optionWithParentReaders.map((p) => p.value)
            ).length
          )
            throw new Error('Default reader is not in the list of readers')

          setDescriptionType('singleValueEnum')
          setReaderOptions([optionWithParentReaders[0].description])
          onChange([optionWithParentReaders[0].value])
          break
        default:
          if (!optionWithParentReaders.length)
            throw new Error('You do not have permission to create a note')
          if (
            difference(
              fieldDescription.param.default,
              optionWithParentReaders.map((p) => p.value)
            ).length
          ) {
            throw new Error('Default reader is not in the list of readers')
          }

          options = optionWithParentReaders.map((p) => ({
            label: p.description,
            value: p.value,
            optional: p.optional,
          }))
          mandatoryValues =
            groupResults.flat().flatMap((p) => (p.optional === false ? p.value : [])) ?? []
          defaultValues = fieldDescription?.param?.default ?? []

          if (value && mandatoryValues.length)
            onChange([...new Set([...value, ...mandatoryValues])])
          if (!value && (defaultValues.length || mandatoryValues.length))
            onChange([...new Set([...defaultValues, ...mandatoryValues])])
          setReaderOptions(options)
      }
    } catch (error) {
      promptError(error.message)
      closeNoteEditor()
    }
    setLoading((loading) => ({ ...loading, fieldName: false }))
  }

  const isEqualOrSubset = (replyReaders, parentReaders) => {
    if (isEqual(replyReaders, parentReaders)) return true
    return replyReaders.every((p) => {
      if (parentReaders.includes(p)) return true
      if (p.includes('/Reviewer_')) return parentReaders.find((q) => q.includes('/Reviewers'))
      return false
    })
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
    // eslint-disable-next-line no-template-curly-in-string
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

  const dropdownChangeHandler = (selectedOptions, actionMeta) => {
    let updatedValue
    let mandatoryValues
    switch (actionMeta.action) {
      case 'select-option':
        updatedValue = (value ?? []).concat(actionMeta.option.value)
        onChange(updatedValue)
        break
      case 'remove-value':
        if (actionMeta.removedValue.optional) {
          updatedValue = value.filter((p) => p !== actionMeta.removedValue.value)
          onChange(updatedValue.length ? updatedValue : undefined)
        }
        break
      case 'clear':
        mandatoryValues = readerOptions.flatMap((p) => (p.optional === true ? [] : p.value))
        onChange(mandatoryValues.length ? mandatoryValues : undefined)
        break
      default:
        break
    }
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
          <NoteEditorReadersDropdown
            placeholder={placeholder}
            options={readerOptions}
            value={readerOptions.filter((p) => value?.includes(p.value))}
            onChange={dropdownChangeHandler}
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
    } else if (fieldDescription.param.enum || fieldDescription.param.items) {
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
