/* globals promptMessage,promptError: false */
import { useReducer, useState } from 'react'
import Link from 'next/link'
import api from '../../lib/api-client'
import {
  formatDateTime, getGroupVersion, prettyId, urlFromGroupId,
} from '../../lib/utils'
import Dropdown from '../Dropdown'
import GroupIdList from './GroupIdList'
import EditorSection from '../EditorSection'

export const GroupGeneralView = ({ group, showEditButton = true, setEdit }) => {
  const groupParent = group.id.split('/').slice(0, -1).join('/')

  return (
    <>
      <div className="info-container">
        <div className="row">
          <div className="info-container__label">Parent Group:</div>
          <div><Link href={urlFromGroupId(groupParent, true)}><a>{prettyId(groupParent)}</a></Link></div>
        </div>
        <div className="row">
          <div className="info-container__label">Readers:</div>
          <GroupIdList groupIds={group.readers} />
        </div>
        {group.nonreaders?.length > 0
          && (
            <div className="row">
              <div className="info-container__label">Non-readers:</div>
              <GroupIdList groupIds={group.nonreaders} />
            </div>
          )}
        <div className="row">
          <div className="info-container__label">Writers:</div>
          <GroupIdList groupIds={group.writers} />
        </div>
        <div className="row">
          <div className="info-container__label">Signatories:</div>
          <GroupIdList groupIds={group.signatories} />
        </div>
        <div className="row">
          <div className="info-container__label">Signature:</div>
          <GroupIdList groupIds={group.signatures} />
        </div>
        {
          group.anonids
          && (
            <>
              <div className="row">
                <div className="info-container__label">AnonymousId:</div>
                True
              </div>
              {
                group.secret && (
                  <div className="row">
                    <div className="info-container__label">Secret:</div>
                    {group.secret}
                  </div>
                )
              }
              <div className="row">
                <div className="info-container__label" title="deanonymizers">Deanonymizers:</div>
                <GroupIdList key="deanonymizers" groupIds={group.deanonymizers} />
              </div>
            </>
          )
        }
        <div className="row">
          <div className="info-container__label">Created:</div>
          {formatDateTime(group.cdate, { month: 'long', timeZoneName: 'short' }) ?? formatDateTime(group.tcdate, { month: 'long', timeZoneName: 'short' })}
        </div>
        <div className="row">
          <div className="info-container__label">Last Modified:</div>
          {formatDateTime(group.mdate, { month: 'long', timeZoneName: 'short' }) ?? formatDateTime(group.tmdate, { month: 'long', timeZoneName: 'short' })}
        </div>
      </div>
      {showEditButton && <button type="button" className="btn btn-sm btn-primary edit-group-info" onClick={setEdit}>Edit General Info</button>}
    </>
  )
}

const GroupGeneralEdit = ({
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
    <div className="edit-container">
      <div className="row">
        <div className="edit-container__label">Readers:</div>
        <div className="edit-container__control">
          <input className="form-control input-sm" value={generalInfo.readers} onChange={e => setGeneralInfo({ type: 'readers', value: e.target.value })} />
        </div>
      </div>
      <div className="row">
        <div className="edit-container__label">Non-Readers:</div>
        <div className="edit-container__control">
          <input className="form-control input-sm" value={generalInfo.nonreaders} onChange={e => setGeneralInfo({ type: 'nonreaders', value: e.target.value })} />
        </div>
      </div>
      <div className="row">
        <div className="edit-container__label">Writers:</div>
        <div className="edit-container__control">
          <input className="form-control input-sm" value={generalInfo.writers} onChange={e => setGeneralInfo({ type: 'writers', value: e.target.value })} />
        </div>
      </div>
      <div className="row">
        <div className="edit-container__label">Signatories:</div>
        <div className="edit-container__control">
          <input className="form-control input-sm" value={generalInfo.signatories} onChange={e => setGeneralInfo({ type: 'signatories', value: e.target.value })} />
        </div>
      </div>
      {
          isSuperUser && (
            <>
              <div className="row">
                <div className="edit-container__label">AnonymousId:</div>
                <div className="edit-container__control">
                  <Dropdown
                    className="dropdown-select dropdown-sm"
                    placeholder="select whether to enable anonymous id"
                    options={anonymousIdOptions}
                    onChange={e => setGeneralInfo({ type: 'anonids', value: e.value })}
                    value={generalInfo.anonids ? { value: true, label: 'True' } : { value: false, label: 'False' }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="edit-container__label">Deanonymizers:</div>
                <div className="edit-container__control">
                  <input className="form-control input-sm" value={generalInfo.deanonymizers} onChange={e => setGeneralInfo({ type: 'deanonymizers', value: e.target.value })} />
                </div>
              </div>
            </>
          )
        }
      <div className="row">
        <div className="edit-container__label" />
        <div className="edit-container__control">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => saveGeneralInfo(generalInfo)}>Save Group</button>
          <button type="button" className="btn btn-sm btn-default ml-1" onClick={() => setEdit(false)}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const GroupGeneral = ({
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
      await api.post('/groups', resultToPost, { accessToken, version: getGroupVersion(group.id) })
      promptMessage(`Settings for ${prettyId(group.id)} updated`, { scrollToTop: false })
      await reloadGroup()
      setEdit(false)
    } catch (error) {
      promptError(error.message)
    }
  }
  return (
    <EditorSection getTitle={() => 'General Info'} classes="general" >
      {edit
        ? (
          <GroupGeneralEdit
            group={group}
            isSuperUser={isSuperUser}
            setEdit={value => setEdit(value)}
            saveGeneralInfo={saveGeneralInfo}
          />
        )
        : <GroupGeneralView group={group} setEdit={() => setEdit(true)} />}
    </EditorSection>
  )
}

export default GroupGeneral
