import {
  CloseOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Button, Input, Popconfirm, Space, Tooltip } from 'antd'
import { uniq, uniqBy } from 'lodash'
import { nanoid } from 'nanoid'
import dynamic from 'next/dynamic'
import { useEffect, useReducer, useState } from 'react'
import useBreakpoint from '../../hooks/useBreakPoint'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { getStartEndYear, prettyId } from '../../lib/utils'
import ProfileSearchWidget from '../EditorComponents/ProfileSearchWidget'
import Icon from '../Icon'

import { colors } from '../../lib/legacy-bootstrap-styles'

const CreatableDropdown = dynamic(
  () => import('../Dropdown').then((mod) => mod.CreatableDropdown),
  {
    ssr: false,
    loading: () => (
      <input className="form-control relation__placeholder" value="loading..." readOnly />
    ),
  }
)
const MultiSelectorDropdown = dynamic(() => import('../MultiSelectorDropdown'), { ssr: false })
// #region action type constants
const relationType = 'updateRelation'
const readersType = 'updateReaders'
const startType = 'updateStart'
const endType = 'updateEnd'
const nameType = 'updateName'
const profileType = 'updateProfile'
const customProfileType = 'updateCustomProfile'
const addRelationType = 'addRelation'
const removeRelationType = 'removeRelation'
const vouchRelationType = 'vouchRelation'
const mergeVouchTagsType = 'mergeVouchTags'
// #endregion

const vouchInvitationId = `${process.env.SUPER_USER}/Support/-/Vouch`

const encodeVouchLabel = (relation) =>
  JSON.stringify({
    relation: relation.relation ?? '',
    start: relation.start ?? null,
    end: relation.end ?? null,
  })

const decodeVouchLabel = (label) => {
  try {
    const parsed = JSON.parse(label ?? '')
    return {
      relation: parsed.relation || 'Vouchee',
      start: parsed.start ?? null,
      end: parsed.end ?? null,
    }
  } catch {
    return { relation: 'Vouchee', start: null, end: null }
  }
}

const CustomProfileSearchForm = ({
  error,
  styles,
  searchTerm,
  setSearchTerm,
  setProfileSearchResults,
  setShowCustomAuthorForm,
  searchProfiles,
  setPageNumber,
}) => (
  <div>
    <Space.Compact block>
      <Input
        style={error ? { borderColor: colors.orRed } : undefined}
        placeholder="Search relation by name or OpenReview profile ID"
        allowClear={{ clearIcon: <CloseOutlined /> }}
        value={searchTerm ?? ''}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setProfileSearchResults(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            setShowCustomAuthorForm(false)
            searchProfiles(searchTerm, 1)
            setPageNumber(null)
          }
        }}
      />
      <Tooltip title="Search relation by name or OpenReview profile ID">
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={(e) => {
            e.preventDefault()
            setShowCustomAuthorForm(false)
            searchProfiles(searchTerm, 1)
            setPageNumber(null)
          }}
          disabled={!searchTerm?.trim()}
        />
      </Tooltip>
    </Space.Compact>
  </div>
)

export const RelationRow = ({
  relation,
  setRelation,
  profileRelation,
  relationOptions,
  relationReaderOptions,
  isMobile,
  user,
  showVouchButton,
  vouchLimit,
}) => {
  const relationPlaceholder = 'Choose or type a relation'
  const [relationClicked, setRelationClicked] = useState(false)
  const [isVouching, setIsVouching] = useState(false)
  const [vouchConfirmOpen, setVouchConfirmOpen] = useState(false)
  const isVouched = relation.vouched
  const relationReadersOptionWithExistingRelation = uniqBy(
    relationReaderOptions.concat(
      (relation.readers ?? []).map((r) => ({ value: r, label: r }))
    ),
    (p) => p.value
  )
  const relationInvalid = profileRelation?.find((q) => q.key === relation.key)?.valid === false

  const invalidInputStyle = relationInvalid ? { borderColor: colors.orRed } : undefined

  const handleVouch = async () => {
    setIsVouching(true)
    try {
      await api.post('/tags', {
        profile: relation.username,
        signature: user.profile.id,
        invitation: vouchInvitationId,
        label: encodeVouchLabel(relation),
      })
      setRelation({ type: vouchRelationType, data: { key: relation.key } })
      promptMessage(`You have vouched for ${relation.name}.`)
    } catch (error) {
      promptError(error.message)
    } finally {
      setIsVouching(false)
    }
  }

  const getReaderText = (selectedValues) => {
    if (!selectedValues || !selectedValues.length || selectedValues.includes('everyone'))
      return 'everyone'
    return selectedValues.join(',')
  }

  const renderRelationName = (relation) => {
    if (isVouched) {
      return (
        <div className="col-md-6 relation__value">
          <Tooltip title="This relation has been vouched for and cannot be edited">
            <Input value={`${relation.name} (${relation.username})`} disabled />
          </Tooltip>
        </div>
      )
    } else if (relation.name) {
      if (relation.username) {
        // added using tilde id
        return (
          <div className="col-md-6 relation__value">
            <Space.Compact block>
              <Input
                style={invalidInputStyle}
                value={`${relation.name} (${relation.username})`}
                allowClear={{ clearIcon: <CloseOutlined /> }}
                onClear={() =>
                  setRelation({
                    type: nameType,
                    data: { value: undefined, key: relation.key },
                  })
                }
              />

              {showVouchButton && (
                <Popconfirm
                  title={`You are about to vouch for ${relation.name}`}
                  icon={<WarningOutlined style={{ color: '#8c1b13' }} />}
                  styles={{
                    container: {
                      backgroundColor: colors.inputBackground,
                      border: `1px solid ${colors.mediumDarkBlue}`,
                      minWidth: 340,
                    },
                  }}
                  description={
                    <ul style={{ paddingLeft: 18, margin: '4px 0 0' }}>
                      <li>Only vouch for people you personally know.</li>
                      {vouchLimit && (
                        <li>
                          You can vouch for at most <strong>{vouchLimit}</strong> people in
                          total.
                        </li>
                      )}
                      <li>
                        This relation stays on your profile{' '}
                        <strong>permanently, visible to everyone</strong>.
                      </li>
                      <li>
                        Vouching <strong>can&apos;t be undone or deleted</strong>.
                      </li>
                    </ul>
                  }
                  okText="Vouch"
                  cancelText="Cancel"
                  okButtonProps={{ size: 'middle' }}
                  cancelButtonProps={{ size: 'middle' }}
                  onConfirm={handleVouch}
                  onOpenChange={setVouchConfirmOpen}
                >
                  <Tooltip
                    title="Vouch to help verify this user's OpenReview account"
                    open={vouchConfirmOpen ? false : undefined}
                  >
                    <Button
                      style={invalidInputStyle}
                      type="primary"
                      icon={<SafetyCertificateOutlined />}
                      loading={isVouching}
                      aria-label="Vouch for this user"
                    />
                  </Tooltip>
                </Popconfirm>
              )}
            </Space.Compact>
          </div>
        )
      }
      // added using email or name only
      return (
        <>
          <div className="col-md-6 relation__value">
            {isMobile && <div className="small-heading col-md-3">Name</div>}
            <Input
              value={`${relation.name}${relation.email ? ` <${relation.email}>` : ''}`}
              allowClear={{ clearIcon: <CloseOutlined /> }}
              onClear={() =>
                setRelation({
                  type: nameType,
                  data: { value: undefined, key: relation.key },
                })
              }
            />
          </div>
        </>
      )
    }
    return (
      <div className="col-md-6 relation__value">
        {isMobile && <div className="small-heading col-md-3">Name</div>}
        <ProfileSearchWidget
          multiple={false}
          isEditor={false}
          pageSize={10}
          pageListLength={12}
          field={{ relation: '' }}
          error={profileRelation?.find((q) => q.key === relation.key)?.valid === false}
          onChange={(username, name, email, profile) => {
            if (username) {
              setRelation({
                type: profileType,
                data: {
                  value: { username, name },
                  key: relation.key,
                },
              })
            } else {
              // custom relation
              setRelation({
                type: customProfileType,
                data: {
                  value: { name, email },
                  key: relation.key,
                },
              })
            }
          }}
          className="relation-search"
          CustomProfileSearchForm={CustomProfileSearchForm}
        />
      </div>
    )
  }

  return (
    <div className="row">
      <div className="col-md-2 relation__value">
        {isMobile && <div className="small-heading col-md-2">Relation</div>}
        {relationClicked && !isVouched ? (
          <CreatableDropdown
            autofocus
            clientOnly
            defaultMenuIsOpen
            hideArrow
            disableMouseMove
            isClearable
            classNamePrefix="relation-dropdown"
            placeholder={relationPlaceholder}
            defaultValue={
              relation.relation ? { value: relation.relation, label: relation.relation } : null
            }
            onChange={(e) => {
              setRelation({
                type: relationType,
                data: { value: e ? e.value : '', key: relation.key },
              })
              if (e) setRelationClicked(false)
            }}
            options={relationOptions}
            styles={{
              control: (provided, state) => ({
                ...provided,
                borderColor: state.selectProps.isInvalid
                  ? '#8c1b13!important'
                  : provided.borderColor,
              }),
            }}
            isInvalid={profileRelation?.find((q) => q.key === relation.key)?.valid === false}
          />
        ) : (
          <Input
            placeholder={relationPlaceholder}
            value={relation.relation}
            disabled={isVouched}
            onClick={() => setRelationClicked(true)}
          />
        )}
      </div>

      {renderRelationName(relation)}

      <div className="col-md-1 relation__value">
        {isMobile && <div className="small-heading col-md-1">Start</div>}
        <Input
          style={invalidInputStyle}
          value={relation.start ?? ''}
          placeholder={isVouched ? '' : 'year'}
          disabled={isVouched}
          onChange={(e) =>
            setRelation({
              type: startType,
              data: { value: e.target.value, key: relation.key },
            })
          }
          aria-label="Start Year"
        />
      </div>
      <div className="col-md-1 relation__value">
        {isMobile && <div className="small-heading col-md-1">End</div>}
        <Input
          style={invalidInputStyle}
          value={relation.end ?? ''}
          placeholder={isVouched ? '' : 'year'}
          disabled={isVouched}
          onChange={(e) =>
            setRelation({ type: endType, data: { value: e.target.value, key: relation.key } })
          }
          aria-label="End Year"
        />
      </div>
      <div className="col-md-1 relation__value additional-width-col">
        {isMobile && <div className="small-heading col-md-1">Visible to</div>}
        {isVouched ? (
          <Input value={getReaderText(relation.readers)} disabled />
        ) : (
          <MultiSelectorDropdown
            extraClass={`relation__multiple-select${
              isMobile ? ' relation__multiple-select-mobile' : ''
            }`}
            options={relationReadersOptionWithExistingRelation}
            selectedValues={relation.readers ?? []}
            setSelectedValues={(values) =>
              setRelation({ type: readersType, data: { value: values, key: relation.key } })
            }
            displayTextFn={getReaderText}
          />
        )}
      </div>
      <div className="col-md-1 relation__value fixed-width-col">
        {!isVouched && (
          <div
            role="button"
            aria-label="remove relation"
            tabIndex={0}
            onClick={() =>
              setRelation({ type: removeRelationType, data: { key: relation.key } })
            }
          >
            <Icon name="minus-sign" tooltip="remove relation" />
          </div>
        )}
      </div>
    </div>
  )
}

const RelationsSection = ({
  profileRelation,
  savedRelations,
  prefixedRelations,
  relationReaders,
  updateRelations,
}) => {
  const isMobile = !useBreakpoint('lg')
  const { user } = useUser()
  const relationOptions = prefixedRelations?.map((p) => ({ value: p, label: p })) ?? []
  const relationReaderOptions = relationReaders?.map((p) => ({ value: p, label: p })) ?? []
  const [relationProfileStates, setRelationProfileStates] = useState({})
  const [lifetimeVouchLimit, setLifetimeVouchLimit] = useState(null)

  const relationReducer = (state, action) => {
    switch (action.type) {
      case relationType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.relation = action.data.value
          return recordCopy
        })
      case readersType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.readers = action.data.value?.length ? action.data.value : ['everyone']
          }
          return recordCopy
        })
      case startType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            const cleanStart = action.data.value?.trim()
            const parsedStart = Number(cleanStart)
            recordCopy.start = Number.isNaN(parsedStart) || !cleanStart ? null : parsedStart
          }
          return recordCopy
        })
      case endType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            const cleanEnd = action.data.value?.trim()
            const parsedEnd = Number(cleanEnd)
            recordCopy.end = Number.isNaN(parsedEnd) || !cleanEnd ? null : parsedEnd
          }
          return recordCopy
        })
      case nameType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.name = action.data.value
          return recordCopy
        })
      case profileType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.username = action.data.value.username
            recordCopy.name = action.data.value.name
            recordCopy.email = undefined
          }
          return recordCopy
        })
      case customProfileType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.username = undefined
            recordCopy.name = action.data.value.name
            recordCopy.email = action.data.value.email
          }
          return recordCopy
        })
      case addRelationType:
        return [
          ...state,
          {
            key: nanoid(),
            relation: '',
            name: '',
            email: '',
            start: null,
            end: null,
            readers: ['everyone'],
          },
        ]
      case removeRelationType:
        return state.length > 1
          ? state.filter((p) => p.key !== action.data.key)
          : [
              {
                key: nanoid(),
                relation: '',
                name: '',
                email: '',
                start: null,
                end: null,
                readers: ['everyone'],
              },
            ]
      case vouchRelationType:
        return state.map((p) =>
          p.key === action.data.key ? { ...p, vouched: true, readers: ['everyone'] } : p
        )
      case mergeVouchTagsType: {
        const vouchedRelations = action.data ?? []

        const updatedRelationsWithVouchInfo = state.map((p) => {
          const vouch = p.username && vouchedRelations.find((v) => v.username === p.username)
          return vouch
            ? {
                ...p,
                relation: vouch.relation ?? '',
                start: vouch.start ?? null,
                end: vouch.end ?? null,
                readers: ['everyone'],
                vouched: true,
              }
            : p
        })

        const existingUsernames = new Set(
          updatedRelationsWithVouchInfo.map((p) => p.username).filter(Boolean)
        )
        const reconstructed = vouchedRelations
          .filter((v) => !existingUsernames.has(v.username))
          .map((v) => ({
            key: nanoid(),
            relation: v.relation ?? '',
            name: v.name ?? prettyId(v.username),
            email: undefined,
            username: v.username,
            start: v.start ?? null,
            end: v.end ?? null,
            readers: ['everyone'],
            vouched: true,
            reconstructed: true,
          }))
        return [...updatedRelationsWithVouchInfo, ...reconstructed]
      }
      default:
        return state
    }
  }

  const [relations, setRelation] = useReducer(
    relationReducer,
    profileRelation?.length > 0
      ? profileRelation?.map((p) => ({
          ...p,
          start: getStartEndYear(p.start),
          end: getStartEndYear(p.end),
          key: p.key ?? nanoid(),
        }))
      : [...Array(3).keys()].map(() => ({
          key: nanoid(),
          relation: '',
          name: '',
          email: '',
          start: null,
          end: null,
          readers: ['everyone'],
        }))
  )

  const savedPublicUsernamesKey = uniq(
    (savedRelations ?? [])
      .filter((relation) => relation.username && relation.readers?.includes('everyone'))
      .map((relation) => relation.username)
  ).join(',')

  const loadVouchCandidateProfiles = async (usernames) => {
    try {
      const { profiles } = await api.getAllProfilesByIds(usernames)
      setRelationProfileStates(
        Object.fromEntries(
          profiles.map((candidateProfile) => [candidateProfile.id, candidateProfile.state])
        )
      )
    } catch {}
  }

  const loadVouchTags = async () => {
    try {
      const { tags } = await api.get('/tags', {
        invitation: vouchInvitationId,
        signature: user.profile.id,
      })
      const vouchTags = (tags ?? []).filter((tag) => tag.profile)
      if (!vouchTags.length) return
      const vouchedRelations = vouchTags.map((tag) => {
        const decoded = decodeVouchLabel(tag.label)
        return {
          username: tag.profile,
          name: prettyId(tag.profile),
          relation: decoded.relation,
          start: decoded.start,
          end: decoded.end,
        }
      })
      setRelation({ type: mergeVouchTagsType, data: vouchedRelations })
    } catch {}
  }

  const loadVouchInvitation = async () => {
    try {
      const vouchInvitation = await api.getInvitationById(vouchInvitationId)
      setLifetimeVouchLimit(vouchInvitation.content?.lifetimeLimit?.value)
    } catch {}
  }

  useEffect(() => {
    updateRelations(relations.filter((relation) => !relation.reconstructed))
  }, [relations])

  useEffect(() => {
    const usernames = savedPublicUsernamesKey ? savedPublicUsernamesKey.split(',') : []
    if (!usernames.length) {
      setRelationProfileStates({})
      return
    }
    loadVouchCandidateProfiles(usernames)
    loadVouchInvitation()
  }, [savedPublicUsernamesKey])

  useEffect(() => {
    if (!user?.profile?.id) return
    loadVouchTags()
  }, [user])

  return (
    <div className="container relation relation-new">
      {!isMobile && (
        <div className="row">
          <div className="small-heading col-md-2">Relation</div>
          <div className="small-heading col-md-6">Name</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
          <div className="small-heading col-md-1">Visible to</div>
        </div>
      )}
      {relations.map((relation) => {
        const isRejected = relationProfileStates?.[relation.username] === 'Rejected'
        const isSavedPublicRelation =
          relation.username &&
          savedRelations?.find(
            (p) => p.username === relation.username && p.readers?.includes('everyone')
          )

        return (
          <RelationRow
            key={relation.key}
            relation={relation}
            setRelation={setRelation}
            profileRelation={profileRelation}
            relationOptions={relationOptions}
            relationReaderOptions={relationReaderOptions}
            isMobile={isMobile}
            user={user}
            showVouchButton={isRejected && isSavedPublicRelation}
            vouchLimit={lifetimeVouchLimit}
          />
        )
      })}
      <div className="row">
        <div
          role="button"
          aria-label="add another relation"
          tabIndex={0}
          onClick={() => setRelation({ type: addRelationType })}
        >
          <Icon name="plus-sign" tooltip="add another relation" />
        </div>
      </div>
    </div>
  )
}

export default RelationsSection
