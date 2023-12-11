import { screen, render, waitFor } from '@testing-library/react'
import ProfileMergeModal from '../components/ProfileMergeModal'
import '@testing-library/jest-dom'
import api from '../lib/api-client'
// eslint-disable-next-line import/order
import userEvent from '@testing-library/user-event'

jest.mock('../hooks/useUser', () => () => ({
  user: {
    profile: {
      id: 'some id',
    },
  },
  accessToken: 'some token',
}))
global.$ = jest.fn(() => ({ on: jest.fn(), off: jest.fn(), modal: jest.fn() }))
global.promptMessage = jest.fn()

beforeEach(() => {
  global.view2 = { constructEdit: jest.fn(() => ({ edit: 'to post' })) }
})

describe('ProfileMergeModal', () => {
  test('display email, id, comment input and buttons', () => {
    render(<ProfileMergeModal />)

    expect(screen.getByLabelText('Your email')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Profile IDs or emails to merge, separated by commas')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Comment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('disabled')
  })

  test('disable sumit button unless info is valid', async () => {
    api.get = jest.fn(() => Promise.resolve({ invitations: [{ id: 'merge invitation' }] }))
    api.post = jest.fn()
    render(<ProfileMergeModal />)

    const emailInput = screen.getByLabelText('Your email')
    const idsInput = screen.getByLabelText(
      'Profile IDs or emails to merge, separated by commas'
    )
    const commentInput = screen.getByLabelText('Comment')
    const submitButton = screen.getByRole('button', { name: 'Submit' })

    await userEvent.type(emailInput, 'invalid email')
    await userEvent.type(idsInput, '~Test_Id1,~Test_Id2')
    await userEvent.type(commentInput, 'some comment')
    screen.debug()

    expect(submitButton).toHaveAttribute('disabled')

    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'valid@email.com')
    expect(submitButton).not.toHaveAttribute('disabled')

    await userEvent.clear(idsInput)
    await userEvent.type(idsInput, '~Test_Id1')
    expect(submitButton).toHaveAttribute('disabled')

    await userEvent.type(idsInput, ',~Test_Id1') // duplicated id
    expect(submitButton).toHaveAttribute('disabled')

    await userEvent.clear(idsInput)
    await userEvent.type(idsInput, ',~Test_Id2')
    expect(submitButton).not.toHaveAttribute('disabled')
  })

  test('post merge note based on id/email pair', async () => {
    const profileMergeInvitation = { id: 'merge invitation' }
    api.getInvitationById = jest.fn(() => Promise.resolve(profileMergeInvitation))
    const postNote = jest.fn()
    api.post = postNote

    render(<ProfileMergeModal />)

    const emailInput = screen.getByLabelText('Your email')
    const idsInput = screen.getByLabelText(
      'Profile IDs or emails to merge, separated by commas'
    )
    const commentInput = screen.getByLabelText('Comment')
    const submitButton = screen.getByRole('button', { name: 'Submit' })

    await userEvent.type(emailInput, 'valid@email.com')
    await userEvent.type(
      idsInput,
      '   ~Test_Id1   ,    test@email.com    ,~Test_Id1,TEST@EMAIL.COM'
    )
    await userEvent.type(commentInput, 'some comment')
    await userEvent.click(submitButton)
    await waitFor(() => {
      expect(global.view2.constructEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          formData: expect.objectContaining({
            email: expect.anything(),
            left: '~Test_Id1',
            right: 'test@email.com',
            comment: 'some comment',
            status: 'Pending',
            editSignatureInputValues: ['(guest)'],
          }),
          invitationObj: profileMergeInvitation,
        })
      )
      expect(postNote).toHaveBeenCalledWith(
        '/notes/edits',
        { edit: 'to post' },
        expect.anything()
      )
    })
  })

  test('post multiple merge note if there are multiple id/email pair', async () => {
    api.get = jest.fn(() => Promise.resolve({ invitations: [{ id: 'merge invitation' }] }))
    const postNote = jest.fn()
    api.post = postNote
    render(<ProfileMergeModal />)

    const emailInput = screen.getByLabelText('Your email')
    const idsInput = screen.getByLabelText(
      'Profile IDs or emails to merge, separated by commas'
    )
    const commentInput = screen.getByLabelText('Comment')
    const submitButton = screen.getByRole('button', { name: 'Submit' })

    await userEvent.type(emailInput, 'valid@email.com')
    await userEvent.type(idsInput, '~Test_Id1,test1@email.com,~Test_Id2,test2@email.com')
    await userEvent.type(commentInput, 'some comment')
    await userEvent.click(submitButton)
    await waitFor(() => expect(postNote).toHaveBeenCalledTimes(6))
  })

  test('add ~ if missing from tilde id', async () => {
    api.get = jest.fn(() => Promise.resolve({ id: 'merge invitation' }))
    const postNote = jest.fn()
    api.post = postNote
    render(<ProfileMergeModal />)

    const emailInput = screen.getByLabelText('Your email')
    const idsInput = screen.getByLabelText(
      'Profile IDs or emails to merge, separated by commas'
    )
    const commentInput = screen.getByLabelText('Comment')
    const submitButton = screen.getByRole('button', { name: 'Submit' })

    await userEvent.type(emailInput, 'valid@email.com')
    await userEvent.type(idsInput, 'Test_Id1,Test_Id2')
    await userEvent.type(commentInput, 'some comment')
    await userEvent.click(submitButton)
    await waitFor(() => {
      expect(global.view2.constructEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          formData: expect.objectContaining({
            left: '~Test_Id1',
            right: '~Test_Id2',
          }),
        })
      )
    })
  })
})
