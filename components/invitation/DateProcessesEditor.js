import { DeleteOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Checkbox, Flex, Input, InputNumber, Select, Tooltip } from 'antd'
import { isNil, upperFirst } from 'lodash'
import { nanoid } from 'nanoid'
import { useReducer, useState } from 'react'
import api from '../../lib/api-client'
import { getMetaInvitationId, prettyId } from '../../lib/utils'
import CodeEditor from '../CodeEditor'
import LoadingIcon from '../LoadingIcon'

const rowButtonStyle = { marginTop: 0, marginRight: 0 }

const DateProcessRow = ({ process, setProcesses, typeOptions, isPostprocess }) => {
  return (
    <>
      <Flex align="flex-start" gap="middle" style={{ margin: '1rem 0' }}>
        <Select
          options={typeOptions}
          value={process.type}
          onChange={(value) => {
            setProcesses({
              type: 'UPDATETYPE',
              payload: { key: process.key, value },
            })
          }}
          style={{ width: 120 }}
        />
        <Flex vertical gap="small" flex={1}>
          {process.type === 'delay' && (
            <InputNumber
              suffix="ms"
              controls={false}
              placeholder="delay in ms"
              min={0}
              precision={0}
              status={process.valid ? undefined : 'error'}
              value={process.delay}
              onChange={(value) => {
                setProcesses({
                  type: 'UPDATEDELAY',
                  payload: { key: process.key, value },
                })
              }}
              style={{ width: '100%' }}
            />
          )}
          {process.type === 'dates' && (
            <>
              {process.dates?.map((date, i) => (
                <Flex gap="small" key={i}>
                  <Input
                    placeholder="date expression"
                    status={date.valid ? undefined : 'error'}
                    value={date.value}
                    onChange={(e) => {
                      setProcesses({
                        type: 'UPDATEDATE',
                        payload: { key: process.key, index: i, value: e.target.value },
                      })
                    }}
                  />
                  {process.dates?.length > 1 && (
                    <Tooltip title="remove execution date">
                      <Button
                        type="link"
                        icon={<MinusCircleOutlined />}
                        aria-label="remove execution date"
                        onClick={() =>
                          setProcesses({
                            type: 'DELETEDATE',
                            payload: { key: process.key, index: i },
                          })
                        }
                        style={rowButtonStyle}
                      />
                    </Tooltip>
                  )}
                </Flex>
              ))}
              <Tooltip title="add another execution date">
                <Button
                  type="link"
                  size="small"
                  icon={<PlusCircleOutlined />}
                  aria-label="add another execution date"
                  onClick={() =>
                    setProcesses({ type: 'ADDDATE', payload: { key: process.key } })
                  }
                  style={rowButtonStyle}
                />
              </Tooltip>
            </>
          )}
          {process.type === 'cron' && (
            <>
              <Input
                placeholder="cron expression"
                status={process.valid ? undefined : 'error'}
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
              <Input
                placeholder="start date expression"
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
              <Input
                placeholder="end date expression"
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
            </>
          )}
          <Flex align="center" gap="middle" wrap>
            {isPostprocess && (
              <>
                <Flex align="center" gap="small">
                  <span>Depends on</span>
                  <InputNumber
                    aria-label="depends on"
                    controls={false}
                    min={0}
                    precision={0}
                    value={process.dependsOn}
                    onChange={(value) => {
                      setProcesses({
                        type: 'UPDATESETTING',
                        payload: { key: process.key, name: 'dependsOn', value },
                      })
                    }}
                    style={{ width: 80 }}
                  />
                </Flex>
                <Checkbox
                  checked={!!process.ignoreFailure && !isNil(process.dependsOn)}
                  disabled={isNil(process.dependsOn)}
                  style={{ fontWeight: 'normal' }}
                  onChange={(e) => {
                    setProcesses({
                      type: 'UPDATESETTING',
                      payload: {
                        key: process.key,
                        name: 'ignoreFailure',
                        value: e.target.checked,
                      },
                    })
                  }}
                >
                  Ignore failure
                </Checkbox>
              </>
            )}
            <Flex align="center" gap="small">
              <span>Timeout</span>
              <InputNumber
                aria-label="timeout"
                suffix="ms"
                controls={false}
                min={1}
                precision={0}
                value={process.timeout}
                onChange={(value) => {
                  setProcesses({
                    type: 'UPDATESETTING',
                    payload: { key: process.key, name: 'timeout', value },
                  })
                }}
                style={{ width: 120 }}
              />
            </Flex>
          </Flex>
        </Flex>

        <Button
          onClick={() => setProcesses({ type: 'SHOWHIDESCRIPT', payload: process.key })}
          style={rowButtonStyle}
          type="primary"
        >
          {process.showScript ? 'Hide' : 'Show'} Script
        </Button>
        <Button
          icon={<DeleteOutlined />}
          aria-label="delete script"
          onClick={() => setProcesses({ type: 'DELETE', payload: process.key })}
          type="primary"
          style={rowButtonStyle}
        />
      </Flex>
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
          { type: 'delay', delay: null, key: nanoid(), showScript: true, valid: true },
          ...state,
        ]
      case 'DELETE':
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
                delay: p.delay ?? null,
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
            return { ...p, delay: action.payload.value, valid: true }
          }
          return p
        })
      case 'UPDATESETTING':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return { ...p, [action.payload.name]: action.payload.value }
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

  const typeOptions =
    field === 'postprocesses'
      ? [
          { label: 'Delay', value: 'delay' },
          { label: 'Script Only', value: 'unset' },
        ]
      : [
          { label: 'Dates', value: 'dates' },
          { label: 'Delay', value: 'delay' },
          { label: 'Cron', value: 'cron' },
          { label: 'Script Only', value: 'unset' },
        ]

  const getProcessType = (process) => {
    if (process.delay !== undefined) return 'delay'
    if (process.cron) return 'cron'
    if (process.dates) return 'dates'
    return 'unset'
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

  const saveCode = async () => {
    setIsSaving(true)

    try {
      const requestPath = '/invitations/edits'
      const metaInvitationId = getMetaInvitationId(invitation)
      if (!isMetaInvitation && !metaInvitationId) throw new Error('No meta invitation found')
      const processesToPost = processes.map((p) => {
        if (p.type === 'delay' && isNil(p.delay)) {
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
          ...(!isNil(p.timeout) && { timeout: p.timeout }),
          ...(!isNil(p.dependsOn) && { dependsOn: p.dependsOn }),
          ...(p.ignoreFailure && !isNil(p.dependsOn) && { ignoreFailure: true }),
          ...(p.type === 'dates' && {
            dates: p.dates.filter((q) => q.value.trim().length > 0).map((r) => r.value.trim()),
          }),
          ...(p.type === 'delay' && { delay: p.delay }),
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
    <div>
      {processes.length === 0 && <p>There are no {field} associated with this invitation</p>}

      <div>
        <Button
          type="primary"
          onClick={() => setProcesses({ type: 'ADD' })}
          style={{ marginTop: '1rem' }}
        >
          Add Script
        </Button>
      </div>

      {processes.length > 0 &&
        processes.map((process) => (
          <DateProcessRow
            key={process.key}
            process={process}
            setProcesses={setProcesses}
            typeOptions={typeOptions}
            isPostprocess={field === 'postprocesses'}
          />
        ))}

      <div style={{ marginTop: '1.5rem' }}>
        <Button
          type="primary"
          iconPlacement="end"
          loading={isSaving ? { icon: <LoadingIcon /> } : false}
          onClick={saveCode}
          style={{ marginTop: 0 }}
        >
          {isSaving ? 'Saving...' : `Save ${upperFirst(field)}`}
        </Button>
      </div>
    </div>
  )
}

export default DateProcessesEditor
