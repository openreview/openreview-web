import { useEffect, useState } from 'react'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import Dropdown from './Dropdown'
import TagsWidget from './EditorComponents/TagsWidget'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'
import useUser from '../hooks/useUser'

const prettyGroupIdWithMember = (group) => {
  let label = prettyId(group.id)
  if (!group.id.startsWith('~') && group.members?.length === 1)
    label = `${label} (${prettyId(group.members[0])})`
  return label
}

const Signatures = ({
  fieldDescription,
  onChange,
  currentValue,
  onError,
  clearError,
  extraClasses,
  placeholder = 'Select Signature...',
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [signatureOptions, setSignatureOptions] = useState(null)
  const { user } = useUser()

  const getRegexSignatureOptions = async () => {
    onChange({ loading: true })
    try {
      const regexExpression = fieldDescription.param.regex
      const regexContainsPipe = regexExpression.includes('|')
      const regexGroupResult = await api.get(
        '/groups',
        { [regexContainsPipe ? 'regex' : 'prefix']: regexExpression, signatory: user?.id },
        { version: regexContainsPipe ? 1 : 2 }
      )
      if (!regexGroupResult.groups?.length) {
        throw new Error('You do not have permission to create a note')
      }

      if (regexGroupResult.groups.length === 1) {
        setSignatureOptions([regexGroupResult.groups[0].id])
        onChange({ value: [regexGroupResult.groups[0].id], type: 'const' })
      } else {
        setSignatureOptions(
          uniqBy(regexGroupResult.groups, 'id').map((p) => ({
            label: prettyGroupIdWithMember(p),
            value: p.id,
          }))
        )
        onChange({ type: 'list' })
      }
    } catch (error) {
      onError(error.message)
    }
    onChange({ loading: false })
  }

  const getEnumSignatureOptions = async () => {
    onChange({ loading: true })
    try {
      const options = fieldDescription.param.enum
        ? fieldDescription.param.enum.map((p) => ({
            [p.includes('.*') ? 'prefix' : 'value']: p,
            description: p,
            optional: true,
          }))
        : fieldDescription.param.items

      const optionsP = options.map((p) => {
        const params = p.prefix
          ? { prefix: p.prefix, signatory: user?.id }
          : { id: p.value, signatory: user?.id }
        return api.get('/groups', params).then((result) => result.groups ?? [])
      })
      const groupResults = await Promise.all(optionsP)
      const uniqueGroupResults = uniqBy(flatten(groupResults), 'id')

      if (uniqueGroupResults.length === 1) {
        setSignatureOptions([uniqueGroupResults[0].id])
        onChange({ value: [uniqueGroupResults[0].id], type: 'const' })
      } else {
        setSignatureOptions(
          uniqueGroupResults.map((p) => ({ label: prettyGroupIdWithMember(p), value: p.id }))
        )
        const defaultValues = fieldDescription.param.default
        onChange(defaultValues ? { value: defaultValues, type: 'list' } : { type: 'list' })
      }
    } catch (error) {
      onError(error.message)
    }
    onChange({ loading: false })
  }

  const renderNoteSignatures = () => {
    switch (descriptionType) {
      case 'const':
        return <TagsWidget values={fieldDescription} />
      case 'currentUser':
        return <TagsWidget values={[user.profile?.id]} />
      case 'regex':
      case 'enum':
        if (!signatureOptions) return null
        if (signatureOptions.length === 1) return <TagsWidget values={signatureOptions} />
        return (
          <Dropdown
            options={signatureOptions}
            onChange={(e) => {
              clearError?.()
              onChange({ value: e ? [e.value] : undefined })
            }}
            value={signatureOptions.find((p) => p.value === currentValue?.[0])}
            isClearable={false}
            placeholder={placeholder}
          />
        )
      default:
        return null
    }
  }

  useEffect(() => {
    if (!fieldDescription || !user) return
    if (!fieldDescription.param) {
      setDescriptionType('const')
      onChange({ value: fieldDescription, type: 'const' })
      return
    }
    if (fieldDescription.param?.regex) {
      if (fieldDescription.param.regex === '~.*') {
        setDescriptionType('currentUser')
        onChange({ value: [user.profile.id], type: 'const' })
      } else {
        setDescriptionType('regex')
      }
      return
    }
    if (fieldDescription.param?.enum || fieldDescription.param?.items) {
      setDescriptionType('enum')
    }
  }, [fieldDescription, user])

  useEffect(() => {
    if (descriptionType === 'regex') {
      getRegexSignatureOptions()
    } else if (descriptionType === 'enum') {
      getEnumSignatureOptions()
    }
  }, [descriptionType])

  return <div className={`${extraClasses ?? ''}`}>{renderNoteSignatures()}</div>
}

export default Signatures
