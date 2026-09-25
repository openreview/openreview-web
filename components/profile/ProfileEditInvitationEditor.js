import { Alert, AutoComplete, Button, Flex, Input, InputNumber } from 'antd'
import { useContext, useEffect, useReducer, useState } from 'react'
import api from '../../lib/api-client'
import { prettyInvitationId } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from '../EditorComponents/EditorComponentHeader'
import LoadingIcon from '../LoadingIcon'
import EditorWidget from '../webfield/EditorWidget'
import BirthDateSection from './BirthDateSection'

import styles from '../../styles/components/NoteEditor.module.scss'

const editableFields = (content) =>
  Object.entries(content ?? {}).filter(([_, fieldDescription]) => {
    return fieldDescription?.value?.param && !fieldDescription?.value?.param?.const
  })

const getEditFields = (invitation) => ({
  edit: editableFields(invitation?.edit?.content),
  profile: editableFields(invitation?.edit?.profile?.content),
})

const buildContent = (fields, formData) =>
  fields.reduce((prev, [fieldName]) => {
    let value = formData[fieldName]
    if (typeof value === 'string') value = value.trim()
    if (value === undefined || value === '') return prev
    prev[fieldName] = { value }
    return prev
  }, {})

const constructProfileEdit = (invitation, profileId, formData) => {
  const fields = getEditFields(invitation)
  const content = buildContent(fields.edit, formData)

  return {
    invitation: invitation.id,
    ...(Object.keys(content).length ? { content } : {}),
    profile: { id: profileId, content: buildContent(fields.profile, formData) },
  }
}

const historyReducer = (record, { type, value }) => {
  switch (type) {
    case 'updatePosition':
      return { ...record, position: value }
    case 'updateStart':
      return { ...record, start: value }
    case 'updateEnd':
      return { ...record, end: value }
    case 'updateInstitutionDomain':
      return { ...record, institution: { ...record.institution, domain: value } }
    case 'updateInstitutionName':
      return { ...record, institution: { ...record.institution, name: value } }
    default:
      return record
  }
}

const HistoryForm = ({ positions, institutionDomains }) => {
  const { field, value, onChange, clearError } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const [history, setHistory] = useReducer(historyReducer, value ?? {})

  useEffect(() => {
    const { position, start, end, institution } = history
    const { domain, name } = institution ?? {}
    const record = {
      ...(position && { position }),
      ...(start && { start }),
      ...(end && { end }),
      ...((domain || name) && {
        institution: { ...(domain && { domain }), ...(name && { name }) },
      }),
    }
    clearError?.()
    onChange({ fieldName, value: Object.keys(record).length ? record : undefined })
  }, [history])

  const year = { flex: '1 1 7rem' }

  return (
    <Flex vertical gap="small">
      <Flex gap="small" wrap>
        <AutoComplete
          style={{ flex: '2 1 14rem' }}
          options={positions}
          placeholder="Choose or type a position"
          value={history.position ?? ''}
          onChange={(position) =>
            setHistory({ type: 'updatePosition', value: position ?? '' })
          }
          showSearch={{ filterOption: true }}
        />
        <InputNumber
          style={year}
          min={1900}
          max={2100}
          precision={0}
          controls={false}
          placeholder="Start year"
          value={history.start ?? null}
          onChange={(start) => setHistory({ type: 'updateStart', value: start ?? undefined })}
        />
        <InputNumber
          style={year}
          min={1900}
          max={2100}
          precision={0}
          controls={false}
          placeholder="End year"
          value={history.end ?? null}
          onChange={(end) => setHistory({ type: 'updateEnd', value: end ?? undefined })}
        />
      </Flex>
      <Flex gap="small" wrap>
        <AutoComplete
          style={{ flex: '1 1 14rem' }}
          options={institutionDomains}
          placeholder="Choose or type an institution domain"
          value={history.institution?.domain ?? ''}
          onChange={(domain) =>
            setHistory({ type: 'updateInstitutionDomain', value: domain ?? '' })
          }
          showSearch={{ filterOption: true }}
        />
        <Input
          style={{ flex: '1 1 14rem' }}
          placeholder="Institution name"
          value={history.institution?.name ?? ''}
          onChange={(e) =>
            setHistory({ type: 'updateInstitutionName', value: e.target.value })
          }
        />
      </Flex>
    </Flex>
  )
}

const relationReducer = (record, { type, value }) => {
  switch (type) {
    case 'updateRelation':
      return { ...record, relation: value }
    case 'updateRelationName':
      return { ...record, name: value }
    case 'updateRelationEmail':
      return { ...record, email: value }
    case 'updateRelationStart':
      return { ...record, start: value }
    case 'updateRelationEnd':
      return { ...record, end: value }
    default:
      return record
  }
}

const RelationForm = () => {
  const { field, value, onChange, clearError } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const [relation, setRelation] = useReducer(relationReducer, value ?? { relation: 'Parent' })

  useEffect(() => {
    const name = relation.name?.trim()
    const email = relation.email?.trim().toLowerCase()
    const record = {
      ...(relation.relation && { relation: relation.relation }),
      ...(name && { name }),
      ...(email && { email }),
      ...(relation.start && { start: relation.start }),
      ...(relation.end && { end: relation.end }),
    }
    clearError?.()
    onChange({ fieldName, value: Object.keys(record).length ? record : undefined })
  }, [relation])

  return (
    <Flex vertical gap="small">
      <Flex gap="small" wrap>
        <Input
          style={{ flex: '1 1 10rem' }}
          placeholder="Relation"
          value={relation.relation ?? ''}
          onChange={(e) => setRelation({ type: 'updateRelation', value: e.target.value })}
        />
        <Input
          style={{ flex: '2 1 12rem' }}
          placeholder="Parent name"
          value={relation.name ?? ''}
          onChange={(e) => setRelation({ type: 'updateRelationName', value: e.target.value })}
        />
        <Input
          style={{ flex: '2 1 12rem' }}
          placeholder="Parent email"
          value={relation.email ?? ''}
          onChange={(e) => setRelation({ type: 'updateRelationEmail', value: e.target.value })}
        />
      </Flex>
      <Flex gap="small" wrap>
        <InputNumber
          min={1900}
          max={2100}
          precision={0}
          controls={false}
          placeholder="Start year"
          value={relation.start ?? null}
          onChange={(start) =>
            setRelation({ type: 'updateRelationStart', value: start ?? undefined })
          }
        />
        <InputNumber
          min={1900}
          max={2100}
          precision={0}
          controls={false}
          placeholder="End year"
          value={relation.end ?? null}
          onChange={(end) =>
            setRelation({ type: 'updateRelationEnd', value: end ?? undefined })
          }
        />
      </Flex>
    </Flex>
  )
}

const ProfileEditInvitationEditor = ({ invitation, profile, onEditPosted }) => {
  const { edit: editFields, profile: profileFields } = getEditFields(invitation)
  const fields = [...profileFields, ...editFields]
  const [formData, setFormData] = useReducer(
    (state, action) => ({ ...state, [action.fieldName]: action.value }),
    {
      fullname: (profile.names.find((p) => p.preferred) ?? profile.names[0])?.fullname,
      dob: profile.dob,
      history: profile.history?.find((p) => p.institution?.domain),
    }
  )
  const [historyOptions, setHistoryOptions] = useState({})
  const [errors, setErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    if (invitation.id !== `${process.env.SUPER_USER}/Support/-/Affiliation_Verification`)
      return
    const loadOptions = async () => {
      try {
        const [positions, institutionDomains] = await Promise.all([
          api.get('/settings/prefixedPositions'),
          api.get('/settings/institutionDomains'),
        ])
        setHistoryOptions({
          positions: positions?.map((p) => ({ value: p, label: p })),
          institutionDomains: institutionDomains?.map((p) => ({ value: p, label: p })),
        })
        // oxlint-disable-next-line no-empty
      } catch {}
    }
    loadOptions()
  }, [])

  const updateField = (fieldName, value) => {
    setErrors((existing) => existing.filter((p) => p.fieldName !== fieldName))
    setFormData({ fieldName, value })
  }

  const renderWidget = (fieldName) => {
    if (fieldName === 'dob')
      return (
        <BirthDateSection
          profileDateOfBirth={{
            value: formData.dob,
            valid: !errors.some((e) => e.fieldName === 'dob'),
          }}
          updateDateOfBirth={({ value }) => updateField('dob', value)}
        />
      )
    if (fieldName === 'history')
      return (
        <HistoryForm
          positions={historyOptions.positions}
          institutionDomains={historyOptions.institutionDomains}
        />
      )
    if (fieldName === 'relations') return <RelationForm />
    return <EditorWidget />
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)
    setErrors([])
    try {
      await api.post('/profiles/edits', constructProfileEdit(invitation, profile.id, formData))
      promptMessage(`${prettyInvitationId(invitation.id)} posted for ${profile.id}`)
      onEditPosted()
    } catch (error) {
      if (error.errors) {
        setErrors(
          error.errors.map((p) => ({
            fieldName: p.details?.path?.split('/').pop(),
            message: p.message,
          }))
        )
      }
      setErrorMessage(
        error.errors?.every((p) => p.name === 'MissingRequiredError')
          ? 'Required field values are missing.'
          : error.message
      )
    }
    setIsSubmitting(false)
  }

  if (!fields.length) return null

  return (
    <Flex vertical gap="small">
      {fields.map(([fieldName, fieldDescription]) => (
        <div key={fieldName} className={styles.fieldContainer}>
          <EditorComponentContext.Provider
            value={{
              invitation,
              field: { [fieldName]: fieldDescription },
              value: formData[fieldName],
              onChange: setFormData,
              error: errors.find((e) => e.fieldName === fieldName),
              setErrors,
              isWebfield: false,
              clearError: () =>
                setErrors((existing) => existing.filter((p) => p.fieldName !== fieldName)),
            }}
          >
            <EditorComponentHeader>{renderWidget(fieldName)}</EditorComponentHeader>
          </EditorComponentContext.Provider>
        </div>
      ))}

      {errorMessage && <Alert type="error" title={errorMessage} showIcon />}

      <Flex gap="small" align="center">
        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          iconPlacement="end"
          loading={isSubmitting ? { icon: <LoadingIcon /> } : false}
        >
          Post {prettyInvitationId(invitation.id)}
        </Button>
      </Flex>
    </Flex>
  )
}

export default ProfileEditInvitationEditor
