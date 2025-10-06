/* globals promptError: false */

import React, { useEffect, useState } from 'react'
import difference from 'lodash/difference'
import isEqual from 'lodash/isEqual'
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
  useCheckboxWidget,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { user, accessToken, isRefreshing } = useUser()

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
          ? api.get('/groups', { prefix: p.prefix }, { accessToken }).then((result) =>
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
              useCheckboxWidget && p.optional === false ? (
                <span>
                  {p.description} <span className="mandatory-value">[Mandatory]</span>
                </span>
              ) : (
                p.description
              ),
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
            onChange={({ fieldName, value: updatedValue }) => {
              if (isEqual(value, ['everyone'])) {
                onChange(updatedValue?.filter((p) => p !== 'everyone'))
              } else if (updatedValue?.includes('everyone')) {
                onChange(['everyone'])
              } else {
                onChange(updatedValue)
              }
            }}
            isEditor={false}
            isArrayType={true}
            dataType="string"
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
    if (isRefreshing || !user || !fieldDescription) return // not essentially an error
    if (Array.isArray(fieldDescription) || fieldDescription.param.const) {
      setDescriptionType('const')
    } else if (fieldDescription.param.regex) {
      setDescriptionType('regex')
    } else if (fieldDescription.param.enum || fieldDescription.param.items) {
      setDescriptionType('enum')
    }
  }, [isRefreshing])

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
  onError,
  clearError,
  className,
  useCheckboxWidget,
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [readerOptions, setReaderOptions] = useState(null)
  const { user, accessToken, isRefreshing } = useUser()

  const addEnumParentReaders = (groupResults, parentReaders, invitationReaders) => {
    if (!parentReaders?.length || parentReaders.includes('everyone') || isDirectReplyToForum)
      return groupResults

    const invitationReadersWithRegex = invitationReaders.filter((p) => p.prefix)

    const filteredGroups = parentReaders
      .map((p) => {
        const committeeName = p.split('/').pop()
        const singularCommitteeName = committeeName.endsWith('s')
          ? committeeName.slice(0, -1)
          : committeeName

        return groupResults.filter(
          (q) =>
            // 1. parent reader is the same as the invitation group reader
            // 2. parent reader is a committee reader and invitation group reader is an anonymous committee reader
            // 3. parent reader is a committee reader and invitation group reader is a reader with a longer path
            q.value === p ||
            q.value.split('/').pop().startsWith(`${singularCommitteeName}_`) ||
            (q.value.endsWith(`/${committeeName}`) && q.value.length > p.length)
        )
      })
      .flat()

    const readersIntersection = []
    groupResults.forEach((q) => {
      if (
        !readersIntersection.find((r) => r.value === q.value) &&
        filteredGroups.find((r) => r.value === q.value)
      ) {
        readersIntersection.push(q)
      }
    })

    // 4. parent reader matches with a prefix of the invitation readers even if the API call doesn't return the group
    parentReaders.forEach((p) => {
      const isRegexReader = invitationReadersWithRegex.some((q) => p.match(q.prefix))

      if (isRegexReader && !readersIntersection.find((q) => q.value === p)) {
        readersIntersection.push({ value: p, description: prettyId(p, false) })
      }
    })

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
      if (typeof onError === 'function') {
        onError(apiError.message)
      } else {
        promptError(apiError.message)
      }
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
      const optionsP = enumItemsConfigOptions.map((p) => {
        if (p.prefix)
          return api.get('/groups', { prefix: p.prefix }, { accessToken }).then((result) =>
            result.groups.map((q) => ({
              value: q.id,
              description: prettyId(q.id, false),
              optional: p.optional,
            }))
          )
        if (p.inGroup) {
          return api
            .get('/groups', { id: p.inGroup }, { accessToken })
            .then((result) => {
              const groupMembers = result.groups[0]?.members
              if (!groupMembers?.length) return []
              return groupMembers.map((q) => ({
                value: q,
                description: prettyId(q, false),
                optional: p.optional,
              }))
            })
            .catch(() => [])
        }
        return Promise.resolve([
          {
            ...p,
            description: prettyId(p.description ?? p.value)
              .split(/\{(\S+)\}/g)
              .filter((q) => q.trim())
              .join(),
          },
        ])
      })
      const groupResults = await Promise.all(optionsP)

      const optionWithParentReaders = addEnumParentReaders(
        groupResults.flat(),
        replyToNote?.readers,
        enumItemsConfigOptions
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
              useCheckboxWidget && p.optional === false ? (
                <span>
                  {p.description} <span className="mandatory-value">[Mandatory]</span>
                </span>
              ) : (
                p.description
              ),
            value: p.value,
          }))
          parentReadersToAutoSelect = isDirectReplyToForum
            ? []
            : (replyToNote?.readers?.filter((p) =>
                optionWithParentReaders.find((q) => q.value === p)
              ) ?? [])
          defaultValues = fieldDescription?.param?.default ?? []

          if (!value && (defaultValues.length || parentReadersToAutoSelect.length))
            onChange([...new Set([...defaultValues, ...parentReadersToAutoSelect])])
          setReaderOptions(options)
      }
    } catch (apiError) {
      if (typeof onError === 'function') {
        onError(apiError.message)
      } else {
        promptError(apiError.message)
      }
      closeNoteEditor()
    }
    setLoading((loading) => ({ ...loading, fieldName: false }))
  }

  const isEqualOrSubset = (replyReaders, parentReaders) => {
    if (isEqual(replyReaders, parentReaders)) return true
    return replyReaders.every((p) => {
      if (parentReaders.includes(p)) return true
      if (p.includes('/Reviewer_')) return parentReaders.find((q) => q.includes('/Reviewers'))
      if (p.includes('/signatures')) return true
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
      const errorMessage = 'Can not create note, readers must match parent note'
      if (typeof onError === 'function') {
        onError(errorMessage)
      } else {
        promptError(errorMessage)
      }
      closeNoteEditor()
    }
  }

  const dropdownChangeHandler = (_, actionMeta) => {
    if (typeof clearError === 'function') clearError()

    let updatedValue
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
    if (!readerOptions) return null

    switch (descriptionType) {
      case 'const':
        return <TagsWidget values={readerOptions} fieldNameOverwrite="Readers" />
      case 'regex':
      case 'enum':
        return useCheckboxWidget ? (
          <CheckboxWidget
            field={{ reader: { value: fieldDescription } }}
            value={value}
            options={readerOptions}
            // eslint-disable-next-line no-shadow
            onChange={({ fieldName, value: updatedValue }) => {
              if (isEqual(value, ['everyone'])) {
                onChange(updatedValue?.filter((p) => p !== 'everyone'))
              } else if (updatedValue?.includes('everyone')) {
                onChange(['everyone'])
              } else {
                onChange(updatedValue)
              }
            }}
            isEditor={false}
            isArrayType={true}
            dataType="string"
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
        return <TagsWidget values={readerOptions} fieldNameOverwrite="Readers" />
      default:
        return null
    }
  }

  const getReadersWarning = () => {
    if (isDirectReplyToForum) return null
    if (!value) return null

    const replyNoteSignature = replyToNote.signatures[0]
    const signatureInValue = value.find((p) => {
      if (p === replyNoteSignature || p === 'everyone') return true
      const committeeName = p.split('/').pop()
      const singularCommitteeName = committeeName.endsWith('s')
        ? committeeName.slice(0, -1)
        : committeeName

      return (
        replyNoteSignature.split('/').pop().startsWith(`${singularCommitteeName}_`) ||
        (replyNoteSignature.endsWith(`/${committeeName}`) &&
          replyNoteSignature.length > p.length)
      )
    })

    if (!signatureInValue)
      return { message: "This reply won't be visible to the parent note author" }
    if (!isEqualOrSubset(replyToNote.readers, value)) {
      return { message: "This reply won't be visible to all the readers of the parent note" }
    }
    return null
  }

  useEffect(() => {
    if (isRefreshing || !user || !fieldDescription) return // not essentially an error
    if (Array.isArray(fieldDescription) || fieldDescription.param.const) {
      setDescriptionType('const')
    } else if (fieldDescription.param.regex) {
      setDescriptionType('regex')
    } else if (fieldDescription.param.enum || fieldDescription.param.items) {
      setDescriptionType('enum')
    }
  }, [isRefreshing])

  useEffect(() => {
    if (descriptionType === 'regex') getRegexReaders()
    if (descriptionType === 'enum') getEnumReaders()
    if (descriptionType === 'const') getConstReaders()
  }, [descriptionType])

  if (!user || !fieldDescription) return null

  return (
    <EditorComponentHeader
      fieldNameOverwrite="Readers"
      inline={true}
      error={error ?? getReadersWarning()}
      className={className}
    >
      {renderReaders()}
    </EditorComponentHeader>
  )
}
