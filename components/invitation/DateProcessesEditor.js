/* globals promptMessage,promptError,$: false */

import React, { useEffect, useReducer, useState } from 'react'
import { nanoid } from 'nanoid'
import { upperFirst } from 'lodash'
import CodeEditor from '../CodeEditor'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import IconButton from '../IconButton'
import { getMetaInvitationId, prettyId } from '../../lib/utils'

const DateProcessRow = ({ process, setProcesses }) => {
  const dateProcessTypeOptions = [
    { label: 'Dates', value: 'dates' },
    { label: 'Delay', value: 'delay' },
    { label: 'Cron', value: 'cron' },
  ]
  return (
    <>
      <div className={`dateprocess-row${process.deleted ? ' deleted' : ''}`}>
        <Dropdown
          options={dateProcessTypeOptions}
          value={dateProcessTypeOptions.find((p) => p.value === process.type)}
          onChange={(option) => {
            setProcesses({
              type: 'UPDATETYPE',
              payload: { key: process.key, value: option.value },
            })
          }}
        />
        {process.type === 'delay' && (
          <div className="dates">
            <input
              type="number"
              placeholder="delay in ms"
              className={`form-control delay-input${process.valid ? '' : ' invalid-value'}`}
              value={process.delay}
              onChange={(e) => {
                setProcesses({
                  type: 'UPDATEDELAY',
                  payload: { key: process.key, value: e.target.value },
                })
              }}
            />
          </div>
        )}
        {process.type === 'dates' && (
          <div className="dates">
            {process.dates?.map((date, i) => (
              <div className="date-row" key={i}>
                <input
                  placeholder="date expression"
                  className={`form-control date-input${date.valid ? '' : ' invalid-value'}`}
                  value={date.value}
                  onChange={(e) => {
                    setProcesses({
                      type: 'UPDATEDATE',
                      payload: { key: process.key, index: i, value: e.target.value },
                    })
                  }}
                />
                {process.dates?.length > 1 && (
                  <div
                    role="button"
                    onClick={() =>
                      setProcesses({
                        type: 'DELETEDATE',
                        payload: { key: process.key, index: i },
                      })
                    }
                  >
                    <Icon name="minus-sign" tooltip="remove execution date" />
                  </div>
                )}
              </div>
            ))}
            <div
              role="button"
              onClick={() => setProcesses({ type: 'ADDDATE', payload: { key: process.key } })}
            >
              <Icon name="plus-sign" tooltip="add another execution date" />
            </div>
          </div>
        )}
        {process.type === 'cron' && (
          <div className="dates">
            <div className="cron-expr">
              <input
                placeholder="cron expression"
                className={`form-control${process.valid ? '' : ' invalid-value'}`}
                value={process.cron}
                onChange={(e) => {
                  setProcesses({
                    type: 'UPDATECRON',
                    payload: {
                      key: process.key,
                      value: {
                        cron: e.target.value,
                        startDate: process.startDate,
                        endDate: process.endDate,
                      },
                    },
                  })
                }}
              />
            </div>
            <div className="cron-start">
              <input
                placeholder="start date expression"
                className="form-control"
                value={process.startDate}
                onChange={(e) => {
                  setProcesses({
                    type: 'UPDATECRON',
                    payload: {
                      key: process.key,
                      value: {
                        cron: process.cron,
                        startDate: e.target.value,
                        endDate: process.endDate,
                      },
                    },
                  })
                }}
              />
            </div>
            <div className="cron-end">
              <input
                placeholder="end date expression"
                className="form-control"
                value={process.endDate}
                onChange={(e) => {
                  setProcesses({
                    type: 'UPDATECRON',
                    payload: {
                      key: process.key,
                      value: {
                        cron: process.cron,
                        startDate: process.startDate,
                        endDate: e.target.value,
                      },
                    },
                  })
                }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-sm showscript-button"
          onClick={() => setProcesses({ type: 'SHOWHIDESCRIPT', payload: process.key })}
        >
          {process.showScript ? 'Hide' : 'Show'} Script
        </button>
        <IconButton
          name="trash"
          extraClasses="delete-button"
          onClick={() => setProcesses({ type: 'DELETE', payload: process.key })}
        />
      </div>
      {process.showScript && (
        <CodeEditor
          code={process.script}
          onChange={(e) =>
            setProcesses({
              type: 'UPDATESCRIPT',
              payload: { key: process.key, value: e },
            })
          }
          defaultToMinHeight
        />
      )}
      <hr />
    </>
  )
}

const DateProcessesEditor = ({
  invitation,
  profileId,
  loadInvitation,
  isMetaInvitation,
  field = 'dateprocesses',
}) => {
  const isInvalidDate = (value, type) => {
    if (type === 'delay') {
      return Number.isNaN(new Date(Date.now() + Number(value)))
    }
    if (type === 'dates') {
      const invitationFieldRx = /#{(.*?)}/g
      const matches = [...value.matchAll(invitationFieldRx)]

      const hasInvalidField = matches.some((p) => !invitation[p[1]])
      return hasInvalidField
    }
    return false
  }

  const dateProcessesReducer = (state, action) => {
    switch (action.type) {
      case 'ADD':
        return [
          { type: 'delay', delay: '', key: nanoid(), showScript: true, valid: true },
          ...state,
        ]
      case 'DELETE':
        $('.tooltip').remove()
        return state.filter((p) => p.key !== action.payload)
      case 'SHOWHIDESCRIPT':
        return state.map((p) => {
          if (p.key === action.payload) return { ...p, showScript: !p.showScript }
          return p
        })
      case 'UPDATETYPE':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return {
              ...p,
              showScript: true,
              type: action.payload.value,
              ...(action.payload.value === 'dates' && {
                dates: p.dates ?? [{ value: '', valid: true }],
              }),
              ...(action.payload.value === 'delay' && {
                delay: p.delay ?? '',
              }),
              ...(action.payload.value === 'cron' && {
                cron: p.cron ?? '',
                startDate: p.startDate ?? '',
                endDate: p.endDate ?? '',
              }),
            }
          }
          return p
        })
      case 'UPDATEDELAY':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            if (isInvalidDate(action.payload.value, p.type)) {
              return { ...p, delay: action.payload.value, valid: false }
            }
            return { ...p, delay: action.payload.value, valid: true }
          }
          return p
        })
      case 'UPDATECRON':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return { ...p, ...action.payload.value, valid: true }
          }
          return p
        })
      case 'ADDDATE':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return { ...p, dates: [...(p.dates ?? []), { value: '', valid: true }] }
          }
          return p
        })
      case 'DELETEDATE':
        $('.tooltip').remove()
        return state.map((p) => {
          if (p.key === action.payload.key) {
            const newDates = p.dates.filter((q, i) => i !== action.payload.index)
            return {
              ...p,
              dates: newDates.length === 0 ? [{ value: '', valid: true }] : newDates,
            }
          }
          return p
        })
      case 'UPDATEDATE':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            const newDates = p.dates.filter((d, i) => i !== action.payload.index)
            return {
              ...p,
              dates: p.dates.map((q, i) => {
                if (i === action.payload.index) {
                  if (isInvalidDate(action.payload.value, p.type)) {
                    return { value: action.payload.value, valid: false }
                  }
                  return { value: action.payload.value, valid: true }
                }
                return q
              }),
            }
          }
          return p
        })
      case 'UPDATESCRIPT':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return {
              ...p,
              script: action.payload.value,
            }
          }
          return p
        })
      case 'INVALIDDELAY':
        return state.map((p) => {
          if (p.key === action.payload) {
            return {
              ...p,
              valid: false,
            }
          }
          return p
        })
      case 'INVALIDDATE':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return {
              ...p,
              dates: p.dates.map((q, i) => {
                if (i === action.payload.index) {
                  return { ...q, valid: false }
                }
                return q
              }),
            }
          }
          return p
        })
      case 'INVALIDCRON':
        return state.map((p) => {
          if (p.key === action.payload) {
            return {
              ...p,
              valid: false,
            }
          }
          return p
        })
      default:
        return state
    }
  }

  const getProcessType = (process) => {
    if (process.delay) return 'delay'
    if (process.cron) return 'cron'
    return 'dates'
  }

  const [processes, setProcesses] = useReducer(
    dateProcessesReducer,
    invitation[field]?.map((p) => ({
      ...p,
      key: nanoid(),
      showScript: false,
      type: getProcessType(p),
      valid: true,
      ...(p.dates && { dates: p.dates.map((d) => ({ value: d, valid: true })) }),
      ...(p.cron && { startDate: p.startDate ?? '', endDate: p.endDate ?? '' }),
    })) ?? []
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip({ container: 'body' })
  }, [processes])

  const saveCode = async () => {
    setIsSaving(true)

    try {
      const requestPath = '/invitations/edits'
      const metaInvitationId = getMetaInvitationId(invitation)
      if (!isMetaInvitation && !metaInvitationId) throw new Error('No meta invitation found')
      const processesToPost = processes.map((p) => {
        if (p.type === 'delay' && typeof p.delay === 'string' && p.delay.trim() === '') {
          setProcesses({ type: 'INVALIDDELAY', payload: p.key })
          throw new Error("Delay value can't be empty")
        }
        if (p.type === 'dates' && p.dates.some((q) => !q.value.trim())) {
          setProcesses({
            type: 'INVALIDDATE',
            payload: { key: p.key, index: p.dates.findIndex((q) => !q.value.trim()) },
          })
          throw new Error("Date value can't be empty")
        }
        if (p.type === 'cron' && p.cron.trim() === '') {
          setProcesses({ type: 'INVALIDCRON', payload: p.key })
          throw new Error("Cron expression can't be empty")
        }
        return {
          script: p.script,
          ...(p.type === 'dates' && {
            dates: p.dates.filter((q) => q.value.trim().length > 0).map((r) => r.value.trim()),
          }),
          ...(p.type === 'delay' && {
            delay: Number.isInteger(p.delay) ? p.delay : Number(p.delay.trim()),
          }),
          ...(p.type === 'cron' && {
            cron: p.cron,
            startDate: p.startDate.trim().length > 0 ? p.startDate.trim() : { delete: true },
            endDate: p.endDate.trim().length > 0 ? p.endDate.trim() : { delete: true },
          }),
        }
      })
      const requestBody = {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          [field]: processesToPost.length ? processesToPost : { delete: true },
          ...(isMetaInvitation && { edit: true }),
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
        ...(!isMetaInvitation && { invitations: metaInvitationId }),
      }
      await api.post(requestPath, requestBody)
      promptMessage(`${upperFirst(field)} of ${prettyId(invitation.id)} updated`)
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message)
    }

    setIsSaving(false)
  }

  return (
    <div className="dateprocess-editor">
      {processes.length === 0 && (
        <p className="empty-message">There are no {field} associated with this invitation</p>
      )}

      <div className="add-row">
        <IconButton
          name="plus"
          onClick={() => setProcesses({ type: 'ADD' })}
          text="Add Script"
        />
      </div>

      {processes.length > 0 &&
        processes.map((process) => (
          <DateProcessRow key={process.key} process={process} setProcesses={setProcesses} />
        ))}

      <div className="mt-4">
        <SpinnerButton
          type="primary save-btn"
          onClick={saveCode}
          disabled={isSaving}
          loading={isSaving}
        >
          {isSaving ? 'Saving...' : `Save ${upperFirst(field)}`}
        </SpinnerButton>
      </div>
    </div>
  )
}

export default DateProcessesEditor
