import { render, screen, waitFor } from '@testing-library/react'
import WorkflowInvitations from '../components/group/WorkflowInvitations'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

let socketEvent

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))
jest.mock('../hooks/useSocket', () => () => socketEvent)
jest.mock('../components/group/InvitationEditor', () => () => <span>InvitationEditor</span>)
jest.mock('framer-motion', () => ({
  motion: { div: ({ children }) => <div>{children}</div> },
}))

global.promptError = jest.fn()
global.$ = jest.fn(() => ({
  tooltip: jest.fn(),
  attr: jest.fn(),
}))

const group = {
  id: 'ICLR.cc/2027/Conference',
  domain: 'ICLR.cc/2027/Conference',
  content: { submission_name: { value: 'Submission' } },
}

// A workflow invitation with date processes (its logs are shown in the timeline) and one
// without (it has no log status to show)
const dateProcessInvitation = {
  id: 'ICLR.cc/2027/Conference/-/Submission',
  domain: 'ICLR.cc/2027/Conference',
  cdate: 1700000000000,
  invitees: ['ICLR.cc/2027/Conference'],
  dateprocesses: [{ dates: ['#{4/edit/invitation/cdate}'] }],
}
const noDateProcessInvitation = {
  id: 'ICLR.cc/2027/Conference/-/Post_Submission',
  domain: 'ICLR.cc/2027/Conference',
  cdate: 1700000000000,
  invitees: ['ICLR.cc/2027/Conference'],
}

const getProcessLogQueries = () =>
  api.get.mock.calls.filter((call) => call[0] === '/logs/process').map((call) => call[1])

beforeEach(() => {
  socketEvent = null
  api.get = jest.fn((path) => {
    if (path === '/groups') return Promise.resolve({ groups: [] })
    if (path === '/logs/process') return Promise.resolve({ logs: [] })
    return Promise.resolve({})
  })
  api.getAll = jest.fn(() => Promise.resolve([dateProcessInvitation, noDateProcessInvitation]))
})

describe('WorkflowInvitations', () => {
  test('load process logs by invitation id, only for invitations with date processes', async () => {
    render(<WorkflowInvitations group={group} />)

    // one query per invitation with date processes, no prefix query of the whole venue
    await waitFor(() => expect(getProcessLogQueries().length).toEqual(1))
    expect(getProcessLogQueries()[0]).toEqual(
      expect.objectContaining({ invitation: dateProcessInvitation.id })
    )
    expect(api.getAll.mock.calls.some((call) => call[0] === '/logs/process')).toBe(false)
  })

  test('show the running log of an invitation instead of its last finished log', async () => {
    api.get = jest.fn((path) => {
      if (path === '/groups') return Promise.resolve({ groups: [] })
      if (path === '/logs/process')
        return Promise.resolve({
          logs: [
            {
              id: 'last log id',
              invitation: dateProcessInvitation.id,
              edate: 1700000000000,
              status: 'ok',
              log: ['all done'],
            },
            {
              id: 'running log id',
              invitation: dateProcessInvitation.id,
              sdate: 1700000001000,
              status: 'running',
            },
          ],
        })
      return Promise.resolve({})
    })

    render(<WorkflowInvitations group={group} />)

    expect(await screen.findByText('. Running…')).toBeInTheDocument()
    expect(screen.queryByText('. all done.')).not.toBeInTheDocument()
  })

  test('refresh only the logs of the invitation reported by the workflow event', async () => {
    const { rerender } = render(<WorkflowInvitations group={group} />)

    await waitFor(() => expect(getProcessLogQueries().length).toEqual(1))

    socketEvent = {
      eventName: 'date-process-updated',
      data: { invitation: dateProcessInvitation.id, status: 'ok' },
      uniqueId: 'some event id',
    }
    jest.useFakeTimers()
    rerender(<WorkflowInvitations group={group} />)
    jest.advanceTimersByTime(5000)
    jest.useRealTimers()

    await waitFor(() => expect(getProcessLogQueries().length).toEqual(2))
    expect(
      getProcessLogQueries().every((query) => query.invitation === dateProcessInvitation.id)
    ).toBe(true)
  })

  test('ignore workflow events of invitations not shown in the timeline', async () => {
    const { rerender } = render(<WorkflowInvitations group={group} />)

    await waitFor(() => expect(getProcessLogQueries().length).toEqual(1))

    socketEvent = {
      eventName: 'date-process-updated',
      data: {
        invitation: 'ICLR.cc/2027/Conference/Submission1/-/Official_Review',
        status: 'ok',
      },
      uniqueId: 'some event id',
    }
    jest.useFakeTimers()
    rerender(<WorkflowInvitations group={group} />)
    jest.advanceTimersByTime(5000)
    jest.useRealTimers()

    await waitFor(() => expect(getProcessLogQueries().length).toEqual(1))
  })
})
