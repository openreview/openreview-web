/* globals promptMessage: false */
/* globals promptError: false */

import React, { useEffect, useReducer, useState } from 'react'
import dynamic from 'next/dynamic'
import { nanoid } from 'nanoid'
import EditorSection from '../EditorSection'
import SpinnerButton from '../SpinnerButton'
import api from '../../lib/api-client'
import { getMetaInvitationId, prettyId } from '../../lib/utils'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Dropdown from '../Dropdown'
import Icon from '../Icon'

const CodeEditor = dynamic(() => import('../CodeEditor'))

const InvitationCode = ({ invitation, accessToken, loadInvitation, codeType }) => {
  const [code, setCode] = useState(invitation[codeType])
  const [showEditor, setShowEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const titleMap = {
    web: 'Invitation UI Code',
    process: 'Process Function Code',
    preprocess: 'Preprocess Function Code',
  }
  const sectionTitle = titleMap[codeType] || 'Code'

  const saveCode = async () => {
    setIsSaving(true)

    try {
      const requestPath = '/invitations'
      const requestBody = {
        ...invitation,
        [codeType]: code,
        apiVersion: undefined,
        rdate: undefined,
      }
      await api.post(requestPath, requestBody, {
        accessToken,
        version: 1,
      })
      promptMessage(`Code for ${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }

    setIsSaving(false)
  }

  const handleCancelClick = () => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }

  useEffect(() => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }, [invitation.id])

  return (
    <EditorSection title={sectionTitle}>
      {showEditor && <CodeEditor code={code} onChange={setCode} />}

      {showEditor ? (
        <div className="mt-2">
          <SpinnerButton
            type="primary"
            onClick={saveCode}
            disabled={isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Update Code'}
          </SpinnerButton>
          <button
            type="button"
            className="btn btn-sm btn-default"
            onClick={() => handleCancelClick()}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setShowEditor(true)}
          >
            Show Code Editor
          </button>
        </div>
      )}
    </EditorSection>
  )
}

export const InvitationCodeV2 = ({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  codeType,
  isMetaInvitation,
  alwaysShowEditor,
  noTitle,
}) => {
  const [code, setCode] = useState(invitation[codeType])
  const [showEditor, setShowEditor] = useState(alwaysShowEditor ?? false)
  const [isSaving, setIsSaving] = useState(false)

  const titleMap = {
    web: 'Invitation UI Code',
    process: 'Process Function Code',
    preprocess: 'Preprocess Function Code',
  }
  const sectionTitle = titleMap[codeType] || 'Code'

  const saveCode = async () => {
    setIsSaving(true)

    try {
      const requestPath = '/invitations/edits'
      const metaInvitationId = getMetaInvitationId(invitation)
      if (!isMetaInvitation && !metaInvitationId) throw new Error('No meta invitation found')
      const requestBody = {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          [codeType]: code,
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

  const handleCancelClick = () => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }

  useEffect(() => {
    setCode(invitation[codeType])
    setShowEditor(alwaysShowEditor ?? false)
  }, [invitation.id])

  return (
    <EditorSection title={noTitle ? null : sectionTitle}>
      {showEditor && <CodeEditor code={code} onChange={setCode} />}

      {showEditor ? (
        <div className="mt-2">
          <SpinnerButton
            type="primary"
            onClick={saveCode}
            disabled={isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving' : 'Update Code'}
          </SpinnerButton>
          {!alwaysShowEditor && (
            <button
              type="button"
              className="btn btn-sm btn-default"
              onClick={() => handleCancelClick()}
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setShowEditor(true)}
          >
            Show Code Editor
          </button>
        </div>
      )}
    </EditorSection>
  )
}

export const InvitationProcessFunctionsV2 = ({
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
        <Tab id="dateprocesses">Date Process</Tab>
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
  const dateProcessesReducer = (state, action) => {
    switch (action.type) {
      case 'ADD':
        return [
          ...state.map((p) => ({ ...p, showScript: false })),
          { type: 'delay', delay: '', key: nanoid(), showScript: true },
        ]
      case 'DELETE':
        return state.filter((p) => p.key !== action.payload)
      case 'SHOWSCRIPT':
        return state.map((p) =>
          p.key === action.payload ? { ...p, showScript: true } : { ...p, showScript: false }
        )
      case 'UPDATETYPE':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return {
              ...p,
              showScript: true,
              type: action.payload.value,
              ...(action.payload.value === 'dates' && { dates: [''], delay: undefined }),
              ...(action.payload.value === 'delay' && { dates: undefined, delay: '' }),
            }
          }
          return { ...p, showScript: false }
        })
      case 'UPDATEDELAY':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return { ...p, delay: action.payload.value }
          }
          return p
        })
      case 'ADDDATE':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            return { ...p, dates: [...p.dates, ''] }
          }
          return p
        })
      case 'DELETEDATE':
        return state.map((p) => {
          if (p.key === action.payload.key) {
            const newDates = p.dates.filter((q, i) => i !== action.payload.index)
            return {
              ...p,
              dates: newDates.length === 0 ? [''] : newDates,
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
              dates: p.dates.map((q, i) =>
                i === action.payload.index ? action.payload.value : q
              ),
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
    })) ?? []
  )
  const [isSaving, setIsSaving] = useState(false)

  const saveCode = async () => {
    setIsSaving(true)

    try {
      const requestPath = '/invitations/edits'
      const metaInvitationId = getMetaInvitationId(invitation)
      if (!isMetaInvitation && !metaInvitationId) throw new Error('No meta invitation found')
      const processesToPost = processes.flatMap((p) => {
        if (
          (p.type === 'delay' && typeof p === 'string' && p.delay.trim() === '') ||
          (p.type === 'dates' && !p.dates.filter((q) => q.trim()).length)
        )
          return []
        return {
          script: p.script,
          ...(p.type === 'dates' && {
            dates: p.dates.filter((q) => q.trim().length > 0).map((r) => r.trim()),
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
      {processes.length > 0
        ? processes.map((process, index) => (
            <React.Fragment key={index}>
              <div className="dateprocess-row">
                <div
                  role="button"
                  onClick={() => setProcesses({ type: 'DELETE', payload: process.key })}
                >
                  <Icon name="minus-sign" tooltip="remove history" />
                </div>
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
                  <input
                    type="number"
                    placeholder="delay in ms"
                    className="form-control delay-input"
                    value={process.delay}
                    onChange={(e) => {
                      setProcesses({
                        type: 'UPDATEDELAY',
                        payload: { key: process.key, value: e.target.value },
                      })
                    }}
                  />
                )}
                {process.type === 'dates' && (
                  <div className="dates">
                    {process.dates?.map((date, i) => (
                      <div className="date-row" key={i}>
                        <input
                          placeholder="date expression"
                          className="form-control date-input"
                          value={date}
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

                {!process.showScript && (
                  <button
                    type="button"
                    className="btn confirm-button"
                    onClick={() => setProcesses({ type: 'SHOWSCRIPT', payload: process.key })}
                  >
                    Show Script
                  </button>
                )}
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
                />
              )}
            </React.Fragment>
          ))
        : 'there are no date processes'}
      <div className="add-row">
        <button
          type="button"
          className="btn confirm-button"
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

export default InvitationCode
