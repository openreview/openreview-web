/* globals promptMessage: false */
/* globals promptError: false */

import { useReducer, useState } from 'react'
import Link from 'next/link'
import Dropdown from '../Dropdown'
import GroupIdList from './GroupIdList'
import EditorSection from '../EditorSection'
import api from '../../lib/api-client'
import { formatDateTime, prettyId, urlFromGroupId } from '../../lib/utils'

const GroupTableRow = ({ label, children }) => (
  <div className="table-row">
    <div className="info-label">{label ? `${label}:` : ''}</div>
    <div className="info-content">{children}</div>
  </div>
)

export const GroupGeneralView = ({ group }) => {
  const groupParent = group.id.split('/').slice(0, -1).join('/')
  const dateOptions = { month: 'long', timeZoneName: 'short' }

  return (
    <div className="info-container">
      <GroupTableRow label="Parent Group">
        <Link href={urlFromGroupId(groupParent, true)}>
          <a>{prettyId(groupParent)}</a>
        </Link>
      </GroupTableRow>

      <GroupTableRow label="Readers">
        <GroupIdList groupIds={group.readers} />
      </GroupTableRow>

      {group.nonreaders?.length > 0 && (
        <GroupTableRow label="Non-readers">
          <GroupIdList groupIds={group.nonreaders} />
        </GroupTableRow>
      )}

      <GroupTableRow label="Writers">
        <GroupIdList groupIds={group.writers} />
      </GroupTableRow>

      <GroupTableRow label="Signatories">
        <GroupIdList groupIds={group.signatories} />
      </GroupTableRow>

      <GroupTableRow label="Signature">
        <GroupIdList groupIds={group.signatures} />
      </GroupTableRow>

      {group.anonids && (
        <GroupTableRow label="AnonymousId">
          <span>True</span>
        </GroupTableRow>
      )}

      {group.anonids && group.secret && (
        <GroupTableRow label="Secret">
          <span>{group.secret}</span>
        </GroupTableRow>
      )}

      {group.anonids && (
        <GroupTableRow label="Deanonymizers">
          <GroupIdList groupIds={group.deanonymizers} />
        </GroupTableRow>
      )}

      {group.host && (
        <GroupTableRow label="Host">
          <GroupIdList groupIds={[group.host]} />
        </GroupTableRow>
      )}

      <GroupTableRow label="Created">
        <span>{formatDateTime(group.cdate ?? group.tcdate, dateOptions)}</span>
      </GroupTableRow>

      <GroupTableRow label="Last Modified">
        <span>{formatDateTime(group.mdate ?? group.tmdate, dateOptions)}</span>
      </GroupTableRow>
    </div>
  )
}

const GroupGeneralEdit = ({ group, isSuperUser, setEdit, saveGeneralInfo }) => {
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
    signatures: group.signatures?.join(', '),
    anonids: group.anonids,
    deanonymizers: group.deanonymizers?.join(', '),
    host: group.host,
  })

  return (
    <div className="edit-container">
      <GroupTableRow label="Readers">
        <input
          className="form-control input-sm"
          value={generalInfo.readers}
          onChange={(e) => setGeneralInfo({ type: 'readers', value: e.target.value })}
        />
      </GroupTableRow>

      <GroupTableRow label="Non-readers">
        <input
          className="form-control input-sm"
          value={generalInfo.nonreaders}
          onChange={(e) => setGeneralInfo({ type: 'nonreaders', value: e.target.value })}
        />
      </GroupTableRow>

      <GroupTableRow label="Writers">
        <input
          className="form-control input-sm"
          value={generalInfo.writers}
          onChange={(e) => setGeneralInfo({ type: 'writers', value: e.target.value })}
        />
      </GroupTableRow>

      <GroupTableRow label="Signatories">
        <input
          className="form-control input-sm"
          value={generalInfo.signatories}
          onChange={(e) => setGeneralInfo({ type: 'signatories', value: e.target.value })}
        />
      </GroupTableRow>
      <GroupTableRow label="Signature">
        <input
          className="form-control input-sm"
          value={generalInfo.signatures}
          onChange={(e) => setGeneralInfo({ type: 'signatures', value: e.target.value })}
        />
      </GroupTableRow>

      {isSuperUser && (
        <GroupTableRow label="AnonymousId">
          <Dropdown
            className="dropdown-select dropdown-sm"
            placeholder="select whether to enable anonymous id"
            options={anonymousIdOptions}
            onChange={(e) => setGeneralInfo({ type: 'anonids', value: e.value })}
            value={
              generalInfo.anonids
                ? { value: true, label: 'True' }
                : { value: false, label: 'False' }
            }
          />
        </GroupTableRow>
      )}

      {isSuperUser && (
        <GroupTableRow label="Deanonymizers">
          <input
            className="form-control input-sm"
            value={generalInfo.deanonymizers}
            onChange={(e) => setGeneralInfo({ type: 'deanonymizers', value: e.target.value })}
          />
        </GroupTableRow>
      )}

      {isSuperUser && (
        <GroupTableRow label="Host">
          <input
            className="form-control input-sm"
            value={generalInfo.host}
            onChange={(e) => setGeneralInfo({ type: 'host', value: e.target.value })}
          />
        </GroupTableRow>
      )}

      <GroupTableRow label="">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => saveGeneralInfo(generalInfo)}
        >
          Save Group
        </button>
        <button
          type="button"
          className="btn btn-sm btn-default ml-1"
          onClick={() => setEdit(false)}
        >
          Cancel
        </button>
      </GroupTableRow>
    </div>
  )
}

const GroupGeneral = ({ group, isSuperUser, accessToken, reloadGroup }) => {
  const [edit, setEdit] = useState(false)

  const convertInfoToArray = (value) =>
    value?.split(',').flatMap((p) => {
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
        signatures: convertInfoToArray(generalInfo.signatures),
        anonids: generalInfo.anonids,
        deanonymizers: convertInfoToArray(generalInfo.deanonymizers),
      }
      await api.post('/groups', resultToPost, { accessToken })
      promptMessage(`Settings for ${prettyId(group.id)} updated`, { scrollToTop: false })
      await reloadGroup()
      setEdit(false)
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <EditorSection title="General Info" className="general">
      {edit ? (
        <GroupGeneralEdit
          group={group}
          isSuperUser={isSuperUser}
          setEdit={(value) => setEdit(value)}
          saveGeneralInfo={saveGeneralInfo}
        />
      ) : (
        <>
          <GroupGeneralView group={group} />
          <button
            type="button"
            className="btn btn-sm btn-primary edit-group-info"
            onClick={() => setEdit(true)}
          >
            Edit General Info
          </button>
        </>
      )}
    </EditorSection>
  )
}

export default GroupGeneral
