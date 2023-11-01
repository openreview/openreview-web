/* globals promptError: false */

import React, { useEffect, useState } from 'react'
import { difference, isEqual } from 'lodash'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import TagsWidget from './EditorComponents/TagsWidget'
import { NoteEditorReadersDropdown } from './Dropdown'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'
import CheckboxWidget from './EditorComponents/CheckboxWidget'

export const NewNoteReaders = ({
  fieldDescription,
  closeNoteEditor,
  value,
  onChange,
  setLoading,
  placeholder,
  error,
  clearError,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { user, accessToken } = useUser()
  const useCheckboxWidget = true

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
        orderAdjustedGroups.map((p) => ({
          label: prettyId(p.id),
          value: p.id,
        }))
      )
    } catch (apiError) {
      promptError(apiError.message)
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
          }))
        : fieldDescription.param.items
      const optionsP = enumItemsConfigOptions.map((p) =>
        p.prefix
          ? api
              .get('/groups', { prefix: p.prefix }, { accessToken, version: 2 })
              .then((result) =>
                result.groups.map((q) => ({
                  value: q.id,
                  description: prettyId(q.id, false),
                  optional: p.optional,
                }))
              )
          : Promise.resolve([
              {
                ...p,
                description: prettyId(p.description ?? p.value)
                  .split(/\{(\S+)\}/g)
                  .filter((q) => q.trim())
                  .join(),
              },
            ])
      )
      const groupResults = await Promise.all(optionsP)
      let options
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
            label:
              useCheckboxWidget && p.optional === false
                ? `${p.description} [Mandatory]`
                : p.description,
            value: p.value,
          }))
          defaultValues = fieldDescription?.param?.default ?? []

          if (!value && defaultValues?.length) {
            onChange([...new Set([...defaultValues])])
          }
          setReaderOptions(options)
      }
    } catch (apiError) {
      promptError(apiError.message)
      closeNoteEditor()
    }
    setLoading((loading) => ({ ...loading, fieldName: false }))
  }

  const dropdownChangeHandler = (_, actionMeta) => {
    let updatedValue
    clearError?.()
    switch (actionMeta.action) {
      case 'select-option':
        updatedValue = (value ?? []).concat(actionMeta.option.value)
        onChange(updatedValue)
        break
      case 'remove-value':
        updatedValue = value.filter((p) => p !== actionMeta.removedValue.value)
        onChange(updatedValue.length ? updatedValue : undefined)
        break
      case 'clear':
        onChange(undefined)
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
        if (!readerOptions) return null
        return useCheckboxWidget ? (
          <CheckboxWidget
            field={{ reader: { value: fieldDescription } }}
            value={value}
            options={readerOptions}
            // eslint-disable-next-line no-shadow
            onChange={({ fieldName, value }) => {
              if (value?.includes('everyone')) {
                onChange(['everyone'])
              } else {
                onChange(value)
              }
            }}
            isEditor={false}
            isArrayType={true}
            clearError={clearError}
          />
        ) : (
          <NoteEditorReadersDropdown
            placeholder={placeholder}
            options={readerOptions}
            value={value?.map((p) => readerOptions.find((q) => q.value === p))}
            onChange={dropdownChangeHandler}
          />
        )

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
    <EditorComponentHeader fieldNameOverwrite="Readers" inline={true} error={error}>
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
  error,
  clearError,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { user, accessToken } = useUser()
  const useCheckboxWidget = true

  const addEnumParentReaders = (groupResults, parentReaders) => {
    if (!parentReaders?.length || parentReaders.includes('everyone') || isDirectReplyToForum)
      return groupResults
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
    } catch (apiError) {
      promptError(apiError.message)
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
          }))
        : fieldDescription.param.items
      const optionsP = enumItemsConfigOptions.map((p) =>
        p.prefix
          ? api
              .get('/groups', { prefix: p.prefix }, { accessToken, version: 2 })
              .then((result) =>
                result.groups.map((q) => ({
                  value: q.id,
                  description: prettyId(q.id, false),
                  optional: p.optional,
                }))
              )
          : Promise.resolve([
              {
                ...p,
                description: prettyId(p.description ?? p.value)
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
      let defaultValues
      let parentReadersToAutoSelect
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
            label:
              useCheckboxWidget && p.optional === false
                ? `${p.description} [Mandatory]`
                : p.description,
            value: p.value,
          }))
          parentReadersToAutoSelect = isDirectReplyToForum
            ? []
            : replyToNote?.readers?.filter((p) =>
                optionWithParentReaders.find((q) => q.value === p)
              ) ?? []
          defaultValues = fieldDescription?.param?.default ?? []

          if (!value && (defaultValues.length || parentReadersToAutoSelect.length))
            onChange([...new Set([...defaultValues, ...parentReadersToAutoSelect])])
          setReaderOptions(options)
      }
    } catch (apiError) {
      promptError(apiError.message)
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

  const dropdownChangeHandler = (_, actionMeta) => {
    let updatedValue
    clearError?.()
    switch (actionMeta.action) {
      case 'select-option':
        updatedValue = (value ?? []).concat(actionMeta.option.value)
        onChange(updatedValue)
        break
      case 'remove-value':
        updatedValue = value.filter((p) => p !== actionMeta.removedValue.value)
        onChange(updatedValue.length ? updatedValue : undefined)

        break
      case 'clear':
        onChange(undefined)
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
        if (!readerOptions) return null
        return useCheckboxWidget ? (
          <CheckboxWidget
            field={{ reader: { value: fieldDescription } }}
            value={value}
            options={readerOptions}
            // eslint-disable-next-line no-shadow
            onChange={({ fieldName, value }) => {
              if (value?.includes('everyone')) {
                onChange(['everyone'])
              } else {
                onChange(value)
              }
            }}
            isEditor={false}
            isArrayType={true}
            clearError={clearError}
          />
        ) : (
          <NoteEditorReadersDropdown
            placeholder={placeholder}
            options={readerOptions}
            value={value?.map((p) => readerOptions.find((q) => q.value === p))}
            onChange={dropdownChangeHandler}
          />
        )
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
    <EditorComponentHeader fieldNameOverwrite="Readers" inline={true} error={error}>
      {renderReaders()}
    </EditorComponentHeader>
  )
}
