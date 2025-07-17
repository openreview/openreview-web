import { screen, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import GroupMembers from '../components/group/GroupMembers'
import api from '../lib/api-client'

let messageMemberModalProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))

jest.mock('../components/group/MessageMemberModal', () => (props) => {
  messageMemberModalProps(props)
  return <span>MessageMemberModal</span>
})

global.promptError = jest.fn()
global.$ = jest.fn(() => ({
  modal: jest.fn(),
  tooltip: jest.fn(),
}))

beforeEach(() => {
  messageMemberModalProps = jest.fn()
})

describe('GroupMembers (customized by invitations)', () => {
  test('show buttons correctly when there is only message all invitation', () => {
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
        addRemoveMembersInvitaiton={undefined}
      />
    )
    expect(screen.queryByText('Add to Group')).not.toBeInTheDocument()
    expect(screen.queryByText('Select All')).not.toBeInTheDocument()
    expect(screen.queryByText('Copy Selected')).not.toBeInTheDocument()
    expect(screen.queryByText('Message Selected')).not.toBeInTheDocument()
    expect(screen.getByText('Message All')).toBeInTheDocument()
    expect(screen.queryByText('Remove Selected')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Message', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
  })

  test('show buttons correctly when there is only message single member invitation', () => {
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
        addRemoveMembersInvitaiton={undefined}
      />
    )
    expect(screen.queryByText('Add to Group')).not.toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.queryByText('Copy Selected')).not.toBeInTheDocument()
    expect(screen.getByText('Message Selected')).toBeInTheDocument()
    expect(screen.queryByText('Message All')).not.toBeInTheDocument()
    expect(screen.queryByText('Remove Selected')).not.toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').length).toEqual(2)
    expect(screen.getAllByText('Message', { exact: true }).length).toEqual(2)
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
  })

  test('show buttons correctly when there is only add remove members invitaiton', () => {
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
        addRemoveMembersInvitaiton="addRemoveMembersInvitaiton"
      />
    )
    expect(screen.getByText('Add to Group')).toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.getByText('Copy Selected')).toBeInTheDocument()
    expect(screen.queryByText('Message Selected')).not.toBeInTheDocument()
    expect(screen.queryByText('Message All')).not.toBeInTheDocument()
    expect(screen.getByText('Remove Selected')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').length).toEqual(2)
    expect(screen.queryByText('Message', { exact: true })).not.toBeInTheDocument()
    expect(screen.getAllByText('Remove').length).toEqual(2)
  })

  test('show buttons correctly when there is message all and edit members invitaiton', () => {
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
        addRemoveMembersInvitaiton="addRemoveMembersInvitaiton"
      />
    )
    expect(screen.getByText('Add to Group')).toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.getByText('Copy Selected')).toBeInTheDocument()
    expect(screen.queryByText('Message Selected')).not.toBeInTheDocument()
    expect(screen.getByText('Message All')).toBeInTheDocument()
    expect(screen.getByText('Remove Selected')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').length).toEqual(2)
    expect(screen.queryByText('Message', { exact: true })).not.toBeInTheDocument()
    expect(screen.getAllByText('Remove').length).toEqual(2)
  })

  test('show buttons correctly when there is message single and edit members invitaiton', () => {
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
        addRemoveMembersInvitaiton="addRemoveMembersInvitaiton"
      />
    )
    expect(screen.getByText('Add to Group')).toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.getByText('Copy Selected')).toBeInTheDocument()
    expect(screen.getByText('Message Selected')).toBeInTheDocument()
    expect(screen.queryByText('Message All')).not.toBeInTheDocument()
    expect(screen.getByText('Remove Selected')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').length).toEqual(2)
    expect(screen.getAllByText('Message', { exact: true }).length).toEqual(2)
    expect(screen.getAllByText('Remove').length).toEqual(2)
  })

  test('show buttons correctly when there is message single and message all invitaiton', () => {
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
        addRemoveMembersInvitaiton={undefined}
      />
    )
    expect(screen.queryByText('Add to Group')).not.toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.queryByText('Copy Selected')).not.toBeInTheDocument()
    expect(screen.getByText('Message Selected')).toBeInTheDocument()
    expect(screen.getByText('Message All')).toBeInTheDocument()
    expect(screen.queryByText('Remove Selected')).not.toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').length).toEqual(2)
    expect(screen.getAllByText('Message', { exact: true }).length).toEqual(2)
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
  })

  test('show buttons correctly when there is message single, message all and edit member invitaiton', () => {
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
        addRemoveMembersInvitaiton="addRemoveMembersInvitaiton"
      />
    )
    expect(screen.getByText('Add to Group')).toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.getByText('Copy Selected')).toBeInTheDocument()
    expect(screen.getByText('Message Selected')).toBeInTheDocument()
    expect(screen.getByText('Message All')).toBeInTheDocument()
    expect(screen.getByText('Remove Selected')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').length).toEqual(2)
    expect(screen.getAllByText('Message', { exact: true }).length).toEqual(2)
    expect(screen.getAllByText('Remove').length).toEqual(2)
  })

  test('use correct message invitation when sending messages', async () => {
    const group = {
      id: 'some id',
      domain: 'some domain',
      members: ['~Test_Id1', 'test@email.com'],
      details: {},
    }
    render(
      <GroupMembers
        group={group}
        messageAllMembersInvitation="messageAllMembersInvitation"
        messageSingleMemberInvitation="messageSingleMemberInvitation"
        addRemoveMembersInvitaiton={undefined}
      />
    )

    await userEvent.click(screen.getByText('Message All')) // message all with group id using messageAllMembersInvitation
    expect(messageMemberModalProps).toHaveBeenCalledWith(
      expect.objectContaining({
        membersToMessage: ['some id'],
        messageMemberInvitation: 'messageAllMembersInvitation',
      })
    )

    await userEvent.click(screen.getByText('Select All')) // select all then message use message single invitation
    await userEvent.click(screen.getByText('Message Selected'))
    expect(messageMemberModalProps).toHaveBeenCalledWith(
      expect.objectContaining({
        membersToMessage: ['~Test_Id1', 'test@email.com'],
        messageMemberInvitation: 'messageSingleMemberInvitation',
      })
    )

    await userEvent.click(screen.getAllByText('Message', { exact: true })[0]) // message individual use message single invitation
    expect(messageMemberModalProps).toHaveBeenCalledWith(
      expect.objectContaining({
        membersToMessage: ['~Test_Id1'],
        messageMemberInvitation: 'messageSingleMemberInvitation',
      })
    )
  })

  test('use correct edit member invitation when editing members', async () => {
    api.post = jest.fn(() => Promise.resolve({}))
    global.window.confirm = () => true

    const group = {
      id: 'some id',
      domain: 'some domain',
      members: ['~Test_Id1', 'test@email.com'],
      details: {},
    }
    render(
      <GroupMembers
        group={group}
        messageAllMembersInvitation={undefined}
        messageSingleMemberInvitation={undefined}
        addRemoveMembersInvitaiton={{ id: 'addRemoveMembersInvitaiton' }}
      />
    )

    await userEvent.click(screen.getAllByText('Remove', { exact: true })[0]) // remove single
    expect(api.post).toHaveBeenCalledWith(
      '/groups/edits',
      expect.objectContaining({
        group: expect.objectContaining({
          members: { remove: ['~Test_Id1'] },
        }),
        invitation: 'addRemoveMembersInvitaiton',
      }),
      expect.anything()
    )

    await userEvent.click(screen.getByText('Select All')) // remove selected
    await userEvent.click(screen.getByText('Remove Selected'))
    expect(api.post).toHaveBeenCalledWith(
      '/groups/edits',
      expect.objectContaining({
        group: expect.objectContaining({
          members: { remove: ['test@email.com'] },
        }),
        invitation: 'addRemoveMembersInvitaiton',
      }),
      expect.anything()
    )

    await userEvent.type(screen.getByRole('textbox'), '~Test_Id2') // add
    await userEvent.click(screen.getByText('Add to Group'))
    expect(api.post).toHaveBeenCalledWith(
      '/groups/edits',
      expect.objectContaining({
        group: expect.objectContaining({
          members: { add: ['~Test_Id2'] },
        }),
        invitation: 'addRemoveMembersInvitaiton',
      }),
      expect.anything()
    )
  })
})
