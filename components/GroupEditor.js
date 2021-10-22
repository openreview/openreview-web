/* globals promptError,promptMessage: false */

import { nanoid } from 'nanoid'
import Link from 'next/link'
import React, { useEffect, useReducer, useState } from 'react'
import api from '../lib/api-client'
import { formatDateTime, prettyId, urlFromGroupId } from '../lib/utils'
import Dropdown from './Dropdown'
import Icon from './Icon'
import PaginationLinks from './PaginationLinks'

const GroupIdList = ({ groupIds }) => {
  const commonGroups = ['everyone', '(anonymous)', '(guest)', '~', '~Super_User1']
  if (!Array.isArray(groupIds)) return ''
  return groupIds.map((groupId, index) => {
    if (commonGroups.includes(groupId)) {
      return (
        <React.Fragment key={nanoid()}>
          {index > 0 && ', '}
          {prettyId(groupId)}
        </React.Fragment>
      )
    }
    return (
      <React.Fragment key={nanoid()}>
        {index > 0 && ', '}
        <Link href={urlFromGroupId(groupId)}><a>{prettyId(groupId)}</a></Link>
      </React.Fragment>
    )
  })
}

const GroupGeneralInfoView = ({ group, setEdit }) => {
  const groupParent = group.id.split('/').slice(0, -1).join('/')

  return (
    <>
      <div className="container info-container">
        <div className="row">
          <div className="col-sm-2 info-container__label">Parent Group:</div>
          <div className="col-sm-10 info-container__value"><Link href={urlFromGroupId(groupParent, true)}><a>{prettyId(groupParent)}</a></Link></div>
        </div>
        <div className="row">
          <div className="col-sm-2 info-container__label">Readers:</div>
          <div className="col-sm-10 info-container__value"><GroupIdList groupIds={group.readers} /></div>
        </div>
        {group.nonreaders?.length > 0
          && (
            <div className="row">
              <div className="col-sm-2 info-container__label">Non-readers:</div>
              <div className="col-sm-10 info-container__value"><GroupIdList groupIds={group.nonreaders} /></div>
            </div>
          )}
        <div className="row">
          <div className="col-sm-2 info-container__label">Writers:</div>
          <div className="col-sm-10 info-container__value"><GroupIdList groupIds={group.writers} /></div>
        </div>
        <div className="row">
          <div className="col-sm-2 info-container__label">Signatories:</div>
          <div className="col-sm-10 info-container__value"><GroupIdList groupIds={group.signatories} /></div>
        </div>
        <div className="row">
          <div className="col-sm-2 info-container__label">Signature:</div>
          <div className="col-sm-10 info-container__value"><GroupIdList groupIds={group.signatures} /></div>
        </div>
        {
          group.anonids
          && (
            <>
              <div className="row">
                <div className="col-sm-2 info-container__label">AnonymousId:</div>
                <div className="col-sm-10 info-container__value">True</div>
              </div>
              {
                group.secret && (
                  <div className="row">
                    <div className="col-sm-2 info-container__label">Secret:</div>
                    <div className="col-sm-10 info-container__value">{group.secret}</div>
                  </div>
                )
              }
              <div className="row">
                <div className="col-sm-2 info-container__label" title="deanonymizers">Deanonymizers:</div>
                <div className="col-sm-10 info-container__value"><GroupIdList key="deanonymizers" groupIds={group.deanonymizers} /></div>
              </div>
            </>
          )
        }
        <div className="row">
          <div className="col-sm-2 info-container__label">Created:</div>
          <div className="col-sm-10 info-container__value">{formatDateTime({ timestamp: group.cdate, month: 'long', timeZoneName: 'short' }) ?? formatDateTime({ timestamp: group.tcdate, month: 'long', timeZoneName: 'short' })}</div>
        </div>
        <div className="row">
          <div className="col-sm-2 info-container__label">Last Modified:</div>
          <div className="col-sm-10 info-container__value">{formatDateTime({ timestamp: group.mdate, month: 'long', timeZoneName: 'short' }) ?? formatDateTime({ timestamp: group.tmdate, month: 'long', timeZoneName: 'short' })}</div>
        </div>
      </div>
      <button type="button" className="btn btn-sm btn-primary edit-group-info" onClick={setEdit}>Edit General Info</button>
    </>
  )
}

const GroupGeneralInfoEdit = ({
  group, isSuperUser, setEdit, saveGeneralInfo,
}) => {
  const anonymousIdOptions = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ]
  const generalInfoReducer = (state, action) => ({
    ...state,
    [action.type]: action.value,
  })
  const [generalInfo, setGeneralInfo] = useReducer(generalInfoReducer, {
    readers: group.readers?.join(', '),
    nonreaders: group.nonreaders?.join(', '),
    writers: group.writers?.join(', '),
    signatories: group.signatories?.join(', '),
    anonids: group.anonids,
    deanonymizers: group.deanonymizers?.join(', '),
  })

  return (
    <>
      <div className="container edit-container">
        <div className="row">
          <div className="col-sm-2 edit-container__label">Readers:</div>
          <div className="col-sm-6">
            <input className="form-control" value={generalInfo.readers} onChange={e => setGeneralInfo({ type: 'readers', value: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div className="col-sm-2 edit-container__label">Non-Readers:</div>
          <div className="col-sm-6">
            <input className="form-control" value={generalInfo.nonreaders} onChange={e => setGeneralInfo({ type: 'nonreaders', value: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div className="col-sm-2 edit-container__label">Writers:</div>
          <div className="col-sm-6">
            <input className="form-control" value={generalInfo.writers} onChange={e => setGeneralInfo({ type: 'writers', value: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div className="col-sm-2 edit-container__label">Signatories:</div>
          <div className="col-sm-6">
            <input className="form-control" value={generalInfo.signatories} onChange={e => setGeneralInfo({ type: 'signatories', value: e.target.value })} />
          </div>
        </div>
        {
          isSuperUser && (
            <>
              <div className="row">
                <div className="col-sm-2 edit-container__label">AnonymousId:</div>
                <div className="col-sm-6">
                  <Dropdown
                    className="dropdown-select"
                    placeholder="select whether to enable anonymous id"
                    options={anonymousIdOptions}
                    onChange={e => setGeneralInfo({ type: 'anonids', value: e.value })}
                    value={generalInfo.anonids ? { value: true, label: 'True' } : { value: false, label: 'False' }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-2 edit-container__label">Deanonymizers:</div>
                <div className="col-sm-6"><input className="form-control" value={generalInfo.deanonymizers} onChange={e => setGeneralInfo({ type: 'deanonymizers', value: e.target.value })} /></div>
              </div>
            </>
          )
        }
        <div className="row">
          <div className="col-sm-2 edit-container__label" />
          <div className="col-sm-10 edit-container">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => saveGeneralInfo(generalInfo)}>Save Group</button>
            <button type="button" className="btn btn-sm btn-default ml-1" onClick={() => setEdit(false)}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}

const GeneralInfoEditor = ({
  group, isSuperUser, accessToken, reloadGroup,
}) => {
  const [edit, setEdit] = useState(false)

  const convertInfoToArray = value => value?.split(',').flatMap((p) => {
    const trimmedP = p.trim()
    return trimmedP || []
  })

  const saveGeneralInfo = async (generalInfo) => {
    try {
      const result = await api.getGroupById(group.id, accessToken)
      const resultToPost = {
        ...result,
        readers: convertInfoToArray(generalInfo.readers),
        nonreaders: convertInfoToArray(generalInfo.nonreaders),
        writers: convertInfoToArray(generalInfo.writers),
        signatories: convertInfoToArray(generalInfo.signatories),
        anonids: generalInfo.anonids,
        deanonymizers: convertInfoToArray(generalInfo.deanonymizers),
      }
      await api.post('/groups', resultToPost, { accessToken, version: group.id.startsWith('.') ? 2 : 1 })
      promptMessage(`Settings for ${prettyId(group.id)} updated`)
      await reloadGroup()
      setEdit(false)
    } catch (error) {
      promptError(error.message)
    }
  }
  return (
    <section className="general">
      <h4>General Info</h4>
      {edit
        ? (
          <GroupGeneralInfoEdit
            group={group}
            isSuperUser={isSuperUser}
            setEdit={value => setEdit(value)}
            saveGeneralInfo={saveGeneralInfo}
          />
        )
        : <GroupGeneralInfoView group={group} setEdit={() => setEdit(true)} />}
    </section>
  )
}

const GroupMembers = ({ group, isSuperUser, accessToken }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [memberAnonIds, setMemberAnonIds] = useState([])
  // eslint-disable-next-line max-len
  const [displayedMembers, setDisplayedMembers] = useState(group.members.length > 15 ? group.members.slice(0, 15) : group.members)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMembers, setSelectedMembers] = useState([])
  const showMembers = group.members?.length > 0

  useEffect(() => {
    setDisplayedMembers(group.members.slice((currentPage - 1) * 15, currentPage * 15))
  }, [currentPage])

  useEffect(() => {
    const getMemberAnonIds = async () => {
      try {
        const anonGroupRegex = group.id.endsWith('s') ? `${group.id.slice(0, -1)}_` : `${group.id}_`
        const result = await api.get(`/groups?regex=${anonGroupRegex}`, {}, { accessToken, version: group.id.startsWith('.') ? 2 : 1 })
        setMemberAnonIds(group.members.flatMap((member) => {
          // eslint-disable-next-line eqeqeq
          const anonId = result.groups.find(p => p?.members == member)?.id
          return anonId ? { member, anonId } : []
        }))
      } catch (error) {
        promptError(error.message)
      }
    }
    getMemberAnonIds()
  }, [])

  return (
    <section className="members">
      <h4>Group Members</h4>
      <div className="container members-container">
        <div className="search-row">
          <div className="input-group">
            <input
              className="form-control input-sm"
              placeholder="e.g. ~Jane_Doe1, jane@example.com, abc.com/2018/Conf/Authors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {/* <Icon name="search" /> */}
          </div>
          <button type="button" className="btn btn-sm btn-primary mr-3 search-button">Add to Group</button>
          <div className="space-taker" />
          <button type="button" className="btn btn-sm btn-primary">Select All</button>
          <button type="button" className="btn btn-sm btn-primary">Message Selected</button>
          <button type="button" className="btn btn-sm btn-primary">Remove Selected</button>
        </div>
        {showMembers
          ? (
            <>
              {displayedMembers.map((member) => {
                const hasAnonId = memberAnonIds.find(p => p.member === member)
                return (
                  <React.Fragment key={member}>
                    <div className="member-row" key={member}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers(p => [...p, member])
                          } else {
                            setSelectedMembers(p => p.filter(q => q !== member))
                          }
                        }}
                      />
                      <Link href={urlFromGroupId(member)}>
                        <a>
                          {member}
                        </a>
                      </Link>
                      {
                    hasAnonId && (
                      <>
                        {' | '}
                        <Link href={urlFromGroupId(hasAnonId.anonId)}>
                          <a>
                            {prettyId(hasAnonId.anonId)}
                          </a>
                        </Link>
                      </>
                    )
                  }
                      <button type="button" className="btn btn-xs btn-primary">
                        <Icon name="envelope" />
                        Message
                      </button>
                      <button type="button" className="btn btn-xs btn-primary">
                        <Icon name="remove" />
                        Remove
                      </button>
                      <button type="button" className="btn btn-xs btn-primary">
                        <Icon name="repeat" />
                        Undo
                      </button>
                    </div>
                  </React.Fragment>
                )
              })}
              <PaginationLinks
                setCurrentPage={e => setCurrentPage(e)}
                totalCount={group.members.length}
                itemsPerPage={15}
                currentPage={currentPage}
                options={{ noScroll: true }}
              />
            </>
          ) : (
            <div className="empty-message-row">
              {searchTerm ? `No members matching the search "${searchTerm}" found. Click Add to Group above to add a new member.` : 'No members to display'}
            </div>
          )}
      </div>
    </section>
  )
}

const GroupEditor = ({
  group, isSuperUser, accessToken, reloadGroup,
}) => {
  if (!group) return null

  return (
    <>
      <GeneralInfoEditor group={group} isSuperUser={isSuperUser} accessToken={accessToken} reloadGroup={reloadGroup} />
      <GroupMembers group={group} isSuperUser={isSuperUser} accessToken={accessToken} />
    </>
  )
}

export default GroupEditor
