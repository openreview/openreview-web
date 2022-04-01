/* globals promptMessage,promptError,$: false */
import React, { useEffect, useReducer, useState } from 'react'
import { nanoid } from 'nanoid'
import dynamic from 'next/dynamic'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import EditorSection from '../EditorSection'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import { TrashButton } from '../IconButton'
import { InvitationCodeV2 } from './InvitationCode'
import { getMetaInvitationId, prettyId } from '../../lib/utils'

const CodeEditor = dynamic(() => import('../CodeEditor'))

const DateProcessesEditor = ({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  isMetaInvitation,
}) => {
  const dateProcessTypeOptions = [
    { label: 'Dates', value: 'dates' },
    { label: 'Delay', value: 'delay' },
  ]

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
          ...state,
          { type: 'delay', delay: '', key: nanoid(), showScript: true, valid: true },
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
                dates: [{ value: '', valid: true }],
                delay: undefined,
              }),
              ...(action.payload.value === 'delay' && { dates: undefined, delay: '' }),
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
      case 'ADDDATE':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return { ...p, dates: [...p.dates, { value: '', valid: true }] }
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
      default:
        return state
    }
  }
  const [processes, setProcesses] = useReducer(
    dateProcessesReducer,
    invitation.dateprocesses?.map((p) => ({
      ...p,
      key: nanoid(),
      showScript: false,
      type: p.delay !== undefined ? 'delay' : 'dates',
      valid: true,
      ...(p.dates && { dates: p.dates.map((d) => ({ value: d, valid: true })) }),
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
        return {
          script: p.script,
          ...(p.type === 'dates' && {
            dates: p.dates.filter((q) => q.value.trim().length > 0).map((r) => r.value.trim()),
          }),
          ...(p.type === 'delay' && {
            delay: Number.isInteger(p.delay) ? p.delay : Number(p.delay.trim()),
          }),
        }
      })
      const requestBody = {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          dateprocesses: processesToPost.length ? processesToPost : null,
          ...(isMetaInvitation && { edit: true }),
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
        ...(!isMetaInvitation && { invitations: metaInvitationId }),
      }
      await api.post(requestPath, requestBody, {
        accessToken,
        version: 2,
      })
      promptMessage(`Code for ${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }

    setIsSaving(false)
  }
  return (
    <div className="dateprocess-editor">
      {processes.length > 0 ? (
        processes.map((process, index) => (
          <React.Fragment key={index}>
            <div className="dateprocess-row">
              <TrashButton
                extraClasses="delete-button"
                onClick={() => setProcesses({ type: 'DELETE', payload: process.key })}
              />
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
                    className={`form-control delay-input${
                      process.valid ? '' : ' invalid-value'
                    }`}
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
                        className={`form-control date-input${
                          date.valid ? '' : ' invalid-value'
                        }`}
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
                    onClick={() =>
                      setProcesses({ type: 'ADDDATE', payload: { key: process.key } })
                    }
                  >
                    <Icon name="plus-sign" tooltip="add another execution date" />
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
          </React.Fragment>
        ))
      ) : (
        <p className="empty-message">There are no date processes</p>
      )}
      <div className="add-row">
        <button
          type="button"
          className="btn btn-sm confirm-button"
          onClick={() => setProcesses({ type: 'ADD' })}
        >
          Add a date process
        </button>
      </div>
      <div className="mt-2">
        <SpinnerButton
          type="primary"
          onClick={saveCode}
          disabled={isSaving}
          loading={isSaving}
        >
          {isSaving ? 'Saving' : 'Update Code'}
        </SpinnerButton>
      </div>
    </div>
  )
}

const InvitationProcessFunctionsV2 = ({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  isMetaInvitation,
}) => (
  <EditorSection title={'Process functions'}>
    <Tabs>
      <TabList>
        <Tab id="process" active>
          Process
        </Tab>
        <Tab id="preprocess">Pre Process</Tab>
        <Tab id="dateprocesses">
          Date Process{' '}
          <Icon
            name="info-sign"
            tooltip="Use the form below to specify dates expression and delay of date processes, invitation properties can be references with #{}, e.g. #{duedate}"
          />
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel id="process">
          <InvitationCodeV2
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            codeType="process"
            isMetaInvitation={isMetaInvitation}
            alwaysShowEditor={true}
            noTitle={true}
          />
        </TabPanel>
        <TabPanel id="preprocess">
          <InvitationCodeV2
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            codeType="preprocess"
            isMetaInvitation={isMetaInvitation}
            alwaysShowEditor={true}
            noTitle={true}
          />
        </TabPanel>
        <TabPanel id="dateprocesses">
          <DateProcessesEditor
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            isMetaInvitation={isMetaInvitation}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </EditorSection>
)

export default InvitationProcessFunctionsV2
