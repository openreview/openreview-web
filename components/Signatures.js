import { useEffect, useState } from 'react'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'
import Dropdown from './Dropdown'
import TagsWidget from './EditorComponents/TagsWidget'

const Signatures = ({
  fieldDescription,
  onChange,
  currentValue,
  onError,
  extraClasses,
  placeholder = 'Select Signature...',
}) => {
  const [descriptionType, setDescriptionType] = useState(null)
  const [signatureOptions, setSignatureOptions] = useState(null)
  const { user, accessToken } = useLoginRedirect()

  const getRegexSignatureOptions = async () => {
    onChange({ loading: true })
    try {
      const regexExpression = fieldDescription.param.regex
      const regexContainsPipe = regexExpression.includes('|')
      const regexGroupResult = await api.get(
        '/groups',
        { [regexContainsPipe ? 'regex' : 'prefix']: regexExpression, signatory: user?.id },
        { accessToken, version: regexContainsPipe ? 1 : 2 }
      )

      if (!regexGroupResult.groups?.length)
        throw new Error('You do not have permission to create a note')
      if (regexGroupResult.groups.length === 1) {
        setSignatureOptions([regexGroupResult.groups[0].id])
        onChange({ value: [regexGroupResult.groups[0].id] })
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
              return { label, value: r.id }
            })
        )
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
      const optionsP = options.map((p) =>
        p.includes('.*')
          ? api
              .get('/groups', { prefix: p, signatory: user?.id }, { accessToken, version: 2 })
              .then((result) => result.groups)
          : api
              .get('/groups', { id: p, signatory: user?.id }, { accessToken, version: 2 })
              .then((result) => result.groups)
      )
      let groupResults = await Promise.all(optionsP)
      groupResults = groupResults.flat()
      const uniqueGroupResults = groupResults.filter(
        (p, index) => groupResults.findIndex((q) => q.id === p.id) === index
      )
      if (uniqueGroupResults.length === 1) {
        setSignatureOptions([uniqueGroupResults[0].id])
        onChange({ value: [uniqueGroupResults[0].id] })
      } else {
        setSignatureOptions(
          uniqueGroupResults.map((p) => {
            let label = prettyId(p.id)
            if (!p.id.startsWith('~') && p.members?.length === 1)
              label = `${label} (${prettyId(p.members[0])})`
            return { label, value: p.id }
          })
        )
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
            onChange={(e) => onChange({ value: [e.value] })}
            value={signatureOptions.find((p) => p.value === currentValue)}
            placeholder={placeholder}
          />
        )
      default:
        return null
    }
  }

  useEffect(() => {
    if (!fieldDescription) return
    if (!fieldDescription.param) {
      setDescriptionType('const')
      return
    }
    if (fieldDescription.param?.regex) {
      if (fieldDescription.param.regex === '~.*') {
        setDescriptionType('currentUser')
        onChange({ value: [user.profile.id] })
      } else {
        setDescriptionType('regex')
      }
      return
    }
    if (fieldDescription.param?.enum) {
      setDescriptionType('enum')
    }
  }, [])

  useEffect(() => {
    if (descriptionType === 'regex') getRegexSignatureOptions()
    if (descriptionType === 'enum') getEnumSignatureOptions()
  }, [descriptionType])

  return <div className={`${extraClasses ?? ''}`}>{renderNoteSignatures()}</div>
}

export default Signatures
