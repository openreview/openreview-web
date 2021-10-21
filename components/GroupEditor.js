import { nanoid } from 'nanoid'
import Link from 'next/link'
import React, { useReducer, useState } from 'react'
import api from '../lib/api-client'
import { formatDateTime, prettyId, urlFromGroupId } from '../lib/utils'
import Dropdown from './Dropdown'

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
    { value: 'true', label: 'True' },
    { value: 'false', label: 'False' },
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
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-2 edit-container__label">Deanonymizers:</div>
                <div className="col-sm-6"><input className="form-control" value={generalInfo.deanonymizers} /></div>
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

const GeneralInfoEditor = ({ group, isSuperUser, accessToken }) => {
  const [edit, setEdit] = useState(false)
  const saveGeneralInfo = async (generalInfo) => {
    const result = await api.getGroupById(group.id, accessToken)
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

const GroupEditor = ({ group, isSuperUser, accessToken }) => {
  if (!group) return null

  return (
    <>
      <GeneralInfoEditor group={group} isSuperUser={isSuperUser} accessToken={accessToken} />
    </>
  )
}

export default GroupEditor
