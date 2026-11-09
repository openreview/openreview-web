import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VouchRequestForm from '../components/webfield/VouchRequestForm'
import api from '../lib/api-client'
import { renderWithWebFieldContext } from './util'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/EditorComponents/Markdown', () => (props) => (
  <span>{props.text}</span>
))

global.promptError = jest.fn()
global.promptMessage = jest.fn()
global.view2 = {
  constructEdit: jest.fn(() => ({ invitation: 'openreview.net/Support/-/Vouch_Request' })),
}

const invitation = {
  id: 'openreview.net/Support/-/Vouch_Request',
  apiVersion: 2,
  guestPosting: true,
  edit: {
    note: {
      content: { voucher: { value: { param: { type: 'string', regex: '^~\\S+\\d+$' } } } },
    },
  },
}

const voucheeProfile = {
  id: '~Jane_Doe1',
  state: 'Rejected',
  content: {
    names: [{ fullname: 'Jane Doe', username: '~Jane_Doe1', preferred: true }],
    homepage: 'https://jane.example.org',
    history: [
      {
        position: 'Independent Researcher',
        start: 2023,
        institution: { domain: 'independent-researcher.org', name: 'Independent Researcher' },
      },
      {
        position: 'Postdoc',
        start: 2019,
        end: 2022,
        institution: { domain: 'umass.edu', name: 'UMass' },
      },
    ],
  },
}

const providerProps = (args) => ({
  value: {
    entity: invitation,
    args,
    instructions: 'Ask a colleague to vouch for you',
    requestedMessage: 'Your vouch request was created',
    vouchInvitationId: 'openreview.net/Support/Vouch_Request{{number}}/-/Vouch_Verification',
  },
})

beforeEach(() => {
  global.promptError.mockClear()
  global.view2.constructEdit.mockClear()
  api.get = jest.fn(() => Promise.resolve({ profiles: [voucheeProfile] }))
})

describe('VouchRequestForm', () => {
  test('show an error when the link has no user or key', () => {
    renderWithWebFieldContext(
      <VouchRequestForm />,
      providerProps({ id: invitation.id, user: '~Jane_Doe1' })
    )

    expect(screen.getByText(/The link is invalid/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request a vouch' })).not.toBeInTheDocument()
  })

  test('post the request with the guest token without looking up the colleague', async () => {
    api.post = jest.fn(() =>
      Promise.resolve({ id: 'edit id', note: { id: 'note id', number: 7 } })
    )

    renderWithWebFieldContext(
      <VouchRequestForm />,
      providerProps({
        id: invitation.id,
        user: '~Jane_Doe1',
        email: 'jane@example.com',
        key: 'some key',
      })
    )

    expect(screen.getByText('Ask a colleague to vouch for you')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request a vouch' })).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('Name: Jane Doe')).toBeInTheDocument()
    })
    expect(screen.getByText('Email: jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Homepage: https://jane.example.org')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Position: Independent Researcher, Independent Researcher (independent-researcher.org), 2023 – Present'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('Position: Postdoc, UMass (umass.edu), 2019 – 2022')
    ).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText("Your colleague's profile ID"), ' ~Ana_Lee1 ')
    expect(
      screen.queryByText('Enter a profile ID such as ~Jane_Doe1.')
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Request a vouch' }))

    await waitFor(() => {
      expect(screen.getByText('Your vouch request was created')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Link for Ana Lee')).toHaveValue(
      `${window.location.origin}/invitation?id=openreview.net/Support/Vouch_Request7/-/Vouch_Verification`
    )
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(global.promptMessage).toHaveBeenCalledWith('Link copied')
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.get).toHaveBeenCalledWith('/profiles', { id: '~Jane_Doe1' })
    expect(global.view2.constructEdit).toHaveBeenCalledWith({
      formData: {
        voucher: '~Ana_Lee1',
        editSignatureInputValues: ['~Jane_Doe1'],
      },
      invitationObj: invitation,
    })
    expect(api.post).toHaveBeenCalledWith(
      '/notes/edits',
      { invitation: 'openreview.net/Support/-/Vouch_Request' },
      { guestToken: 'some key' }
    )
  })

  test('keep the button disabled until the profile ID matches the invitation regex', async () => {
    api.post = jest.fn()

    renderWithWebFieldContext(
      <VouchRequestForm />,
      providerProps({ id: invitation.id, user: '~Jane_Doe1', key: 'some key' })
    )

    await userEvent.type(
      screen.getByLabelText("Your colleague's profile ID"),
      'ana.lee@umass.edu'
    )

    expect(screen.getByText('Enter a profile ID such as ~Jane_Doe1.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request a vouch' })).toBeDisabled()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('show the API error when the request is refused', async () => {
    api.post = jest.fn(() => Promise.reject(new Error('You cannot ask yourself for a vouch.')))

    renderWithWebFieldContext(
      <VouchRequestForm />,
      providerProps({ id: invitation.id, user: '~Jane_Doe1', key: 'some key' })
    )

    await waitFor(() => expect(screen.getByText('Name: Jane Doe')).toBeInTheDocument())
    expect(screen.queryByText(/^Email:/)).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText("Your colleague's profile ID"), '~Jane_Doe2')
    await userEvent.click(screen.getByRole('button', { name: 'Request a vouch' }))

    await waitFor(() => {
      expect(global.promptError).toHaveBeenCalledWith('You cannot ask yourself for a vouch.')
    })
    expect(screen.queryByText('Your vouch request was created')).not.toBeInTheDocument()
  })
})
