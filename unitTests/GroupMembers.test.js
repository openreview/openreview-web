import { screen, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import GroupMembers from '../components/group/GroupMembers'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))
jest.mock('../components/BasicModal', () => () => <span>BasicModal</span>)

global.promptError = jest.fn()
global.$ = jest.fn(() => ({
  tooltip: jest.fn(),
}))

describe('GroupMembers', () => {
  test('show message all button when there is only message all invitation', () => {
    const group = {
      domain: 'some domain',
      members: ['~Test_Id1', 'test@email.com'],
      details: {},
    }
    render(
      <GroupMembers
        group={group}
        messageAllMembersInvitation="messageAllMembersInvitation"
        messageSingleMemberInvitation={undefined}
      />
    )
    expect(screen.getByText('Message All')).toBeInTheDocument()
    expect(screen.queryByText('Message', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('Message Selected')).not.toBeInTheDocument()
    expect(screen.queryByText('Select All')).not.toBeInTheDocument()
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    expect(screen.queryByText('Copy Selected')).not.toBeInTheDocument()
  })

  test('show message button when there is only message single member invitation', () => {
    const group = {
      domain: 'some domain',
      members: ['~Test_Id1', 'test@email.com'],
      details: {},
    }
    render(
      <GroupMembers
        group={group}
        messageAllMembersInvitation={undefined}
        messageSingleMemberInvitation="messageSingleMemberInvitation"
      />
    )
    expect(screen.queryByText('Message All')).not.toBeInTheDocument()
    expect(screen.getAllByText('Message', { exact: true }).length).toEqual(2)
    expect(screen.getByText('Message Selected')).toBeInTheDocument()
    expect(screen.queryByText('Select All')).not.toBeInTheDocument()
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    expect(screen.queryByText('Copy Selected')).not.toBeInTheDocument()
  })

  test('show message all and message single button when both invitation exist', () => {
    const group = {
      domain: 'some domain',
      members: ['~Test_Id1', 'test@email.com'],
      details: {},
    }
    render(
      <GroupMembers
        group={group}
        messageAllMembersInvitation="messageAllMembersInvitation"
        messageSingleMemberInvitation="messageSingleMemberInvitation"
      />
    )
    expect(screen.queryByText('Message All')).toBeInTheDocument()
    expect(screen.getAllByText('Message', { exact: true }).length).toEqual(2)
    expect(screen.getByText('Message Selected')).toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    expect(screen.queryByText('Copy Selected')).not.toBeInTheDocument()
  })

  test('show message button when there is no message invitation', () => {
    const group = {
      domain: 'some domain',
      members: ['~Test_Id1', 'test@email.com'],
      details: {},
    }
    render(
      <GroupMembers
        group={group}
        messageAllMembersInvitation={undefined}
        messageSingleMemberInvitation={undefined}
      />
    )
    expect(screen.queryByText('Message All')).not.toBeInTheDocument()
    expect(screen.getAllByText('Message', { exact: true }).length).toEqual(2)
    expect(screen.getAllByText('Remove').length).toEqual(2)
    expect(screen.getByText('Message Selected')).toBeInTheDocument()
    expect(screen.getByText('Copy Selected')).toBeInTheDocument()
  })
})
