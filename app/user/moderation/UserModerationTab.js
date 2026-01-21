/* globals promptMessage,promptError,view2,$: false */
import { useEffect, useReducer, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { cloneDeep, over, uniqBy } from 'lodash'
import api from '../../../lib/api-client'
import {
  formatDateTime,
  getProfileStateLabelClass,
  getRejectionReasons,
  inflect,
  prettyId,
} from '../../../lib/utils'
import Dropdown from '../../../components/Dropdown'
import { formatProfileData } from '../../../lib/profiles'
import Icon from '../../../components/Icon'
import LoadingSpinner from '../../../components/LoadingSpinner'
import PaginationLinks from '../../../components/PaginationLinks'
import BasicModal from '../../../components/BasicModal'
import ProfilePreviewModal from '../../../components/profile/ProfilePreviewModal'

import styles from '../../../styles//components/UserModerationTab.module.scss'
// import Button from '@components/Button'
// import Select from 'components/Select'
import { Col, Divider, Modal, Pagination, Row, Select, Space, Tag, Input } from 'antd'
import { Flex, Button } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  StopOutlined,
  UndoOutlined,
} from '@ant-design/icons'

export const RejectionModal = ({
  profileToReject,
  setProfileToReject,
  rejectUser,
  signedNotes,
}) => {
  const [rejectionMessage, setRejectionMessage] = useState('')

  const currentInstitutionName = profileToReject?.content?.history?.find(
    (p) => !p.end || p.end >= new Date().getFullYear()
  )?.institution?.name

  const rejectionReasons = getRejectionReasons(currentInstitutionName)

  const updateMessageForPastRejectProfile = (messageToAdd) => {
    setRejectionMessage((p) => `${messageToAdd}\n\n${p}`)
  }

  return (
    <Modal
      title={`Reason for rejecting ${prettyId(profileToReject?.id)}`}
      open={profileToReject}
      okText="Submit"
      closable={true}
      destroyOnHidden={true}
      onCancel={() => {
        setRejectionMessage('')
        setProfileToReject(null)
      }}
      onOk={() => {
        setRejectionMessage('')
        rejectUser(rejectionMessage, profileToReject.id)
      }}
      width={{
        xs: '90%',
        sm: '50%',
      }}
    >
      <Flex vertical gap="small" align="flex-start">
        <Select
          allowClear
          style={{ width: '100%' }}
          placeholder="Choose a common reject reason..."
          options={rejectionReasons}
          onChange={(value) => {
            const rejectOption = rejectionReasons.find((r) => r.value === value)
            setRejectionMessage(rejectOption?.rejectionText || '')
          }}
        />
        <Space wrap>
          <Button
            type="primary"
            onClick={() =>
              updateMessageForPastRejectProfile(
                "Submitting invalid info is a violation of OpenReview's Terms and Conditions (https://openreview.net/legal/terms) which may result in terminating your access to the system."
              )
            }
          >
            Add Invalid Info Warning
          </Button>
          <Button
            type="primary"
            onClick={() =>
              updateMessageForPastRejectProfile(
                'If invalid info is submitted again, your email will be blocked.'
              )
            }
          >
            Add Last Notice Warning
          </Button>
        </Space>
        <Input.TextArea
          autoSize={{ minRows: 5 }}
          value={rejectionMessage}
          onChange={(e) => {
            setRejectionMessage(e.target.value)
          }}
        />
        {signedNotes.length > 0 && (
          <>
            <h4>{`There ${inflect(signedNotes.length, 'is', 'are', false)} ${inflect(
              signedNotes.length,
              'note',
              'notes',
              true
            )} signed by this profile.`}</h4>
            {signedNotes.slice(0, 10).map((p) => (
              <div key={p.id}>
                <a
                  href={`${
                    p.apiVersion === 2 ? process.env.API_V2_URL : process.env.API_URL
                  }/notes?id=${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.id}
                </a>
              </div>
            ))}
          </>
        )}
      </Flex>
    </Modal>
  )
}

const BlockModal = ({
  profileToBlockUnblock,
  setProfileToBlockUnblock,
  signedNotes,
  reload,
  accessToken,
}) => {
  const [blockTag, setBlockTag] = useState('')
  const actionIsBlock = profileToBlockUnblock?.state !== 'Blocked'

  const blockUnblockUser = async (profile) => {
    if (!profile) return

    try {
      await api.post('/tags', {
        profile: profileToBlockUnblock.id,
        label: blockTag.trim(),
        signature: `${process.env.SUPER_USER}/Support`,
        invitation: `${process.env.SUPER_USER}/Support/-/Profile_Blocked_Status`,
        readers: [`${process.env.SUPER_USER}/Support`],
      })

      await api.post(
        '/profile/moderate',
        { id: profile.id, decision: actionIsBlock ? 'block' : 'unblock' },
        { accessToken }
      )
      setBlockTag('')
    } catch (error) {
      promptError(error.message)
    }
    reload()
  }

  useEffect(() => {}, [profileToBlockUnblock])

  return (
    <Modal
      title={`You are about to ${actionIsBlock ? 'block' : 'unblock'} ${
        profileToBlockUnblock?.content?.names?.[0]?.fullname
      }.`}
      open={profileToBlockUnblock}
      okText={`${profileToBlockUnblock?.state === 'Blocked' ? 'Unblock' : 'Block'}`}
      onCancel={() => {
        setBlockTag('')
        setProfileToBlockUnblock(null)
      }}
      onOk={() => {
        setBlockTag('')
        setProfileToBlockUnblock(null)
        blockUnblockUser(profileToBlockUnblock)
      }}
      width={{
        xs: '90%',
        sm: '50%',
      }}
    >
      <Flex vertical gap="small" align="flex-start">
        <Input
          placeholder="a tag to be added to this profile such as block/unblock reason"
          value={blockTag}
          onChange={(e) => setBlockTag(e.target.value)}
        />
        {actionIsBlock && signedNotes.length > 0 && (
          <>
            <h4>{`There ${inflect(signedNotes.length, 'is', 'are', false)} ${inflect(
              signedNotes.length,
              'note',
              'notes',
              true
            )} signed by this profile.`}</h4>
            {signedNotes.slice(0, 10).map((p) => (
              <div key={p.id}>
                <a
                  href={`${
                    p.apiVersion === 2 ? process.env.API_V2_URL : process.env.API_URL
                  }/notes?id=${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.id}
                </a>
              </div>
            ))}
          </>
        )}
      </Flex>
    </Modal>
  )
}

const UserModerationQueue = ({
  accessToken,
  title,
  onlyModeration = true,
  reload,
  shouldReload,
  showSortButton = false,
}) => {
  const [profiles, setProfiles] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [filters, setFilters] = useState({})
  const [profileToReject, setProfileToReject] = useState(null)
  const [profileToBlockUnblock, setProfileToBlockUnblock] = useState(null)
  const [signedNotes, setSignedNotes] = useState(0)
  const [idsLoading, setIdsLoading] = useState([])
  const [descOrder, setDescOrder] = useState(true)
  const [pageSize, setPageSize] = useState(onlyModeration ? 200 : 10)
  const [profileToPreview, setProfileToPreview] = useState(null)
  const [lastPreviewedProfileId, setLastPreviewedProfileId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const blockModalId = `${onlyModeration ? 'new' : ''}-user-block-modal`
  const pageSizeOptions = [15, 30, 50, 100, 200].map((p) => ({
    label: `${p} items`,
    value: p,
  }))
  const [profileStateOption, setProfileStateOption] = useState('All')
  const profileStateOptions = [
    'All',
    'Active Automatic',
    'Blocked',
    'Rejected',
    'Limited',
    'Inactive',
    'Merged',
    'Needs Moderation',
  ].map((p) => ({ label: p, value: p }))
  const twoWeeksAgo = dayjs().subtract(2, 'week').valueOf()

  const getProfiles = async () => {
    const queryOptions = onlyModeration ? { needsModeration: true } : {}
    const searchTerm = filters.term
    const shouldSearchProfile = profileStateOption === 'All' && searchTerm
    const sortKey = onlyModeration ? 'tmdate' : 'tcdate'
    let searchQuery = { fullname: searchTerm?.toLowerCase() }
    if (searchTerm?.startsWith('~')) searchQuery = { id: searchTerm }
    if (searchTerm?.includes('@')) searchQuery = { email: searchTerm.toLowerCase() }

    try {
      const result = await api.get(
        shouldSearchProfile ? '/profiles/search' : '/profiles',
        {
          ...queryOptions,

          ...(!shouldSearchProfile && { sort: `${sortKey}:${descOrder ? 'desc' : 'asc'}` }),
          limit: pageSize,
          offset: (pageNumber - 1) * pageSize,
          withBlocked: onlyModeration ? undefined : true,
          ...(!onlyModeration && { trash: true }),
          ...(shouldSearchProfile && { es: true }),
          ...(shouldSearchProfile && searchQuery),
          ...(profileStateOption !== 'All' && { state: profileStateOption }),
        },
        { accessToken, cachePolicy: 'no-cache' }
      )
      setTotalCount(result.count ?? 0)
      setProfiles(result.profiles ?? [])
    } catch (error) {
      promptError(error.message)
    }
  }

  const filterProfiles = () => {
    const cleanSearchTerm = searchTerm.trim()

    setPageNumber(1)
    if (profileStateOption !== 'All') setProfileStateOption('All')
    setFilters({ term: cleanSearchTerm })
  }

  const acceptUser = async (profileId) => {
    try {
      setIdsLoading((p) => [...p, profileId])
      await api.post(
        '/profile/moderate',
        { id: profileId, decision: 'accept' },
        { accessToken }
      )
      if (profiles.length === 1 && pageNumber !== 1) {
        setPageNumber((p) => p - 1)
      }
      reload()
      promptMessage(`${prettyId(profileId)} is now active`)
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== profileId))
    }
  }

  const getSignedAuthoredNotesCount = async (profileId) => {
    const signedNotesP = api.getCombined(
      '/notes',
      { signature: profileId, select: 'id' },
      null,
      {
        accessToken,
        includeVersion: true,
      }
    )
    const authoredNotesP = api.getCombined(
      '/notes',
      { 'content.authorids': profileId, select: 'id' },
      null,
      { accessToken, includeVersion: true }
    )

    const [signedNotesResult, authoredNotesResult] = await Promise.all([
      signedNotesP,
      authoredNotesP,
    ])

    return uniqBy([...signedNotesResult.notes, ...authoredNotesResult.notes], 'id')
  }

  const showRejectionModal = async (profile) => {
    if (!onlyModeration) {
      const signedAuthoredNotes = await getSignedAuthoredNotesCount(profile.id)
      setSignedNotes(signedAuthoredNotes)
    }
    setProfileToReject(profile)
  }

  const showBlockUnblockModal = async (profile) => {
    const signedAuthoredNotes = await getSignedAuthoredNotesCount(profile.id)
    setSignedNotes(signedAuthoredNotes)
    setProfileToBlockUnblock(profile)
  }

  const rejectUser = async (rejectionMessage, id) => {
    try {
      await api.post(
        '/profile/moderate',
        {
          id,
          decision: 'reject',
          reason: rejectionMessage,
        },
        { accessToken }
      )
      if (profiles.length === 1 && pageNumber !== 1) {
        setPageNumber((p) => p - 1)
      }
      reload()
    } catch (error) {
      promptError(error.message)
    }
  }

  const deleteRestoreUser = async (profile) => {
    if (!profile) return

    const actionIsDelete = !profile.ddate

    const signedAuthoredNotesCount = actionIsDelete
      ? (await getSignedAuthoredNotesCount(profile.id)).length
      : 0

    const noteCountMessage =
      actionIsDelete && signedAuthoredNotesCount
        ? `There ${inflect(signedAuthoredNotesCount, 'is', 'are', false)} ${inflect(
            signedAuthoredNotesCount,
            'note',
            'notes',
            true
          )} signed by this profile.`
        : ''

    const actionLabel = actionIsDelete ? 'delete' : 'restore'
    const name = profile.content?.names?.[0]?.fullname ?? 'this profile'

    const confirmResult = window.confirm(
      `Are you sure you want to ${actionLabel} ${name}?\n\n${noteCountMessage}`
    )
    if (confirmResult) {
      try {
        await api.post(
          '/profile/moderate',
          { id: profile.id, decision: actionIsDelete ? 'delete' : 'restore' },
          { accessToken }
        )
      } catch (error) {
        promptError(error.message)
      }
      reload()
    }
  }

  const addSDNException = async (profileId) => {
    const sdnExceptionGroupId = `${process.env.SUPER_USER}/Support/SDN_Profiles/Exceptions`
    try {
      const sdnExceptionGroup = await api.getGroupById(sdnExceptionGroupId, accessToken)
      await api.post(
        '/groups/edits',
        {
          group: {
            id: `${process.env.SUPER_USER}/Support/SDN_Profiles/Exceptions`,
            members: {
              append: [profileId],
            },
          },
          readers: sdnExceptionGroup.signatures,
          writers: sdnExceptionGroup.signatures,
          signatures: sdnExceptionGroup.signatures,
          invitation: sdnExceptionGroup.invitations?.[0],
        },
        { accessToken }
      )
      promptMessage(`${profileId} is added to SDN exception group`)
    } catch (error) {
      promptError(error.message)
    }
  }

  const showNextProfile = (currentProfileId) => {
    const nextProfile = profiles[profiles.findIndex((p) => p.id === currentProfileId) + 1]
    if (nextProfile) {
      setProfileToPreview(formatProfileData(cloneDeep(nextProfile)))
      setLastPreviewedProfileId(nextProfile.id)
    }
  }

  useEffect(() => {
    console.log('filters changed', filters)
    getProfiles()
  }, [pageNumber, filters, shouldReload, descOrder, pageSize, profileStateOption])

  return (
    <div className="profiles-list123">
      <h4>
        {title} ({totalCount})
      </h4>
      {showSortButton && profiles && profiles.length !== 0 && (
        <Button type="primary" size="small" onClick={() => setDescOrder((p) => !p)}>{`${
          descOrder ? 'Sort: Most Recently Modified' : 'Sort: Least Recently Modified'
        }`}</Button>
      )}

      {!onlyModeration && (
        <Flex
          justify="space-start"
          align="center"
          gap="middle"
          wrap
          style={{ marginBottom: '0.5rem' }}
        >
          <Input
            type="text"
            style={{ flex: '5 1 200px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={filterProfiles}
          />
          <Select
            style={{ flex: '2 1 150px' }}
            options={profileStateOptions}
            value={profileStateOption}
            placeholder="Select profile state"
            onChange={(e) => {
              setPageNumber(1)
              setProfileStateOption(e)
            }}
          />
          <Button type="primary" className="btn btn-xs" onClick={filterProfiles}>
            Search
          </Button>
        </Flex>
      )}

      {profiles ? (
        <Flex vertical gap="small" style={{ marginBottom: '1.5rem' }}>
          {profiles.map((profile) => {
            const name = profile.content.names[0]
            const state =
              profile.ddate && profile.state !== 'Merged' ? 'Deleted' : profile.state
            return (
              <Row key={profile.id} align="middle" gutter={[15, 15]}>
                <Col xs={24} sm={12} md={6} lg={3} xl={3}>
                  <a
                    href={`/profile?id=${profile.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title={profile.id}
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name.fullname}
                  </a>
                </Col>
                <Col
                  xs={24}
                  sm={12}
                  md={6}
                  lg={4}
                  xl={4}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile.content.preferredEmail}
                </Col>
                <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                  {profile.tcdate !== profile.tmdate && (
                    <>
                      <span>
                        {formatDateTime(profile.tcdate, {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: undefined,
                          timeZoneName: undefined,
                          hour12: false,
                        })}
                      </span>
                      {' / '}
                    </>
                  )}
                  <span
                    className={`${
                      onlyModeration && profile.tmdate < twoWeeksAgo ? 'passed-moderation' : ''
                    }`}
                  >
                    {formatDateTime(profile.tmdate, {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: undefined,
                      timeZoneName: undefined,
                      hour12: false,
                    })}
                  </span>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5} xl={5}>
                  <Space>
                    <Tag color={profile.password ? 'success' : 'error'} variant="solid">
                      password
                    </Tag>
                    <Tag
                      color={getProfileStateLabelClass(state)}
                      variant="solid"
                      onClick={() =>
                        setProfileToPreview(formatProfileData(cloneDeep(profile)))
                      }
                      style={{ cursor: 'pointer' }}
                    >
                      {state}
                    </Tag>
                  </Space>
                </Col>

                {onlyModeration ? (
                  <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                    <Space.Compact>
                      <Button
                        icon={<CheckCircleOutlined />}
                        disabled={idsLoading.includes(profile.id)}
                        onClick={() => acceptUser(profile.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        icon={<CloseCircleOutlined />}
                        onClick={() => showRejectionModal(profile)}
                      >
                        Reject
                      </Button>
                      <Button
                        icon={<StopOutlined />}
                        onClick={() => showBlockUnblockModal(profile)}
                      >
                        Block
                      </Button>
                    </Space.Compact>
                  </Col>
                ) : (
                  <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                    <Space.Compact>
                      {(profile.state === 'Needs Moderation' ||
                        profile.state === 'Rejected') && (
                        <Button
                          icon={<CheckCircleOutlined />}
                          onClick={() => acceptUser(profile.id)}
                        >
                          Accept
                        </Button>
                      )}
                      {!(
                        profile.state === 'Blocked' ||
                        profile.state === 'Limited' ||
                        profile.state === 'Rejected' ||
                        profile.ddate
                      ) && (
                        <Button
                          icon={<CheckCircleOutlined />}
                          onClick={() => showRejectionModal(profile)}
                        >
                          Reject
                        </Button>
                      )}
                      {profile.state === 'Limited' && profile.content.yearOfBirth && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => addSDNException(profile.id)}
                        >
                          Exception
                        </Button>
                      )}
                      {!profile.ddate && (
                        <Button
                          icon={
                            profile.state === 'Blocked' ? <UndoOutlined /> : <StopOutlined />
                          }
                          onClick={() => showBlockUnblockModal(profile)}
                        >
                          {`${profile.state === 'Blocked' ? 'Unblock' : 'Block'}`}
                        </Button>
                      )}
                      {state !== 'Merged' && profile.state !== 'Needs Moderation' && (
                        <Button
                          icon={profile.ddate ? <UndoOutlined /> : <DeleteOutlined />}
                          onClick={() => deleteRestoreUser(profile)}
                          title={
                            profile.ddate ? 'restore this profile' : 'delete this profile'
                          }
                        ></Button>
                      )}
                    </Space.Compact>
                  </Col>
                )}
              </Row>
            )
          })}
          {profiles.length === 0 && (
            <p className="empty-message">{`${
              onlyModeration ? 'No profiles pending moderation.' : 'No matching profile found'
            }`}</p>
          )}
        </Flex>
      ) : (
        <LoadingSpinner inline />
      )}
      <Pagination
        align="center"
        current={pageNumber}
        pageSize={pageSize}
        total={totalCount}
        onChange={(page, size) => {
          setPageNumber(page)
        }}
        onShowSizeChange={(current, size) => {
          setPageSize(size)
        }}
        hideOnSinglePage
      />

      <RejectionModal
        profileToReject={profileToReject}
        setProfileToReject={setProfileToReject}
        rejectUser={rejectUser}
        signedNotes={signedNotes}
      />
      <BlockModal
        profileToBlockUnblock={profileToBlockUnblock}
        setProfileToBlockUnblock={setProfileToBlockUnblock}
        signedNotes={signedNotes}
        reload={reload}
        accessToken={accessToken}
      />
      <ProfilePreviewModal
        profileToPreview={profileToPreview}
        setProfileToPreview={setProfileToPreview}
        contentToShow={[
          'names',
          'emails',
          'links',
          'history',
          'relations',
          'expertise',
          'publications',
          'messages',
          'tags',
        ]}
        showNextProfile={showNextProfile}
        acceptUser={acceptUser}
        rejectUser={rejectUser}
      />
    </div>
  )
}

export default function UserModerationTab({ accessToken }) {
  const [shouldReload, reload] = useReducer((p) => !p, true)
  const [configNote, setConfigNote] = useState(null)

  const getModerationStatus = async () => {
    try {
      const result = await api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/-/OpenReview_Config`,
          details: 'invitation',
          limit: 1,
        },
        { accessToken }
      )

      if (result?.notes?.[0]) {
        setConfigNote(result?.notes?.[0])
      } else {
        promptError('Moderation config could not be loaded')
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    getModerationStatus()
  }, [])

  const updateTermStamp = async () => {
    const currentTimeStamp = dayjs().valueOf()
    const result = window.confirm(
      `Update terms of service timestamp to ${currentTimeStamp}? (${dayjs(
        currentTimeStamp
      ).toISOString()})`
    )
    if (!result) return

    try {
      await api.post(
        '/notes/edits',
        view2.constructEdit({
          formData: { terms_timestamp: currentTimeStamp },
          invitationObj: configNote.details.invitation,
          noteObj: configNote,
        }),
        { accessToken }
      )

      getModerationStatus()
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <>
      {configNote && (
        <Flex gap="large" align="center">
          <span>
            {`Terms Timestamp is ${configNote?.content?.terms_timestamp?.value ?? 'unset'}`}
          </span>
          <Button onClick={updateTermStamp} size="small" type="primary">
            Update Terms Stamp
          </Button>
        </Flex>
      )}

      <div className="moderation-container123">
        <UserModerationQueue
          accessToken={accessToken}
          title="Recently Created Profiles"
          onlyModeration={false}
          reload={reload}
          shouldReload={shouldReload}
        />

        <UserModerationQueue
          accessToken={accessToken}
          title="New Profiles Pending Moderation"
          reload={reload}
          shouldReload={shouldReload}
          showSortButton
        />
      </div>
    </>
  )
}
