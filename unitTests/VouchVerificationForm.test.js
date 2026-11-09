import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cloneDeep } from 'lodash'
import VouchVerificationForm from '../components/webfield/VouchVerificationForm'
import api from '../lib/api-client'
import { renderWithWebFieldContext } from './util'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/EditorComponents/Markdown', () => (props) => (
  <span>{props.text}</span>
))

global.promptError = jest.fn()

const statements = [
  'I know this person, and the information above is correct.',
  'This vouch will be public on my profile and on theirs.',
  'I cannot delete this vouch after I post it.',
]

const checkAllStatements = async () => {
  for (const statement of statements) {
    await userEvent.click(screen.getByLabelText(statement))
  }
}

const invitation = {
  id: 'openreview.net/Support/Vouch_Request3/-/Vouch_Verification',
  expdate: Date.now() + 24 * 60 * 60 * 1000,
  assertion: {
    signatures: ['~Ana_Lee1'],
    content: {
      confirmations: {
        value: { param: { type: 'string[]', input: 'checkbox', enum: statements } },
      },
    },
    profile: {
      id: '~Jane_Doe1',
      content: {
        names: {
          value: { const: { add: [{ fullname: 'Jane Doe', username: '~Jane_Doe1' }] } },
        },
        history: {
          value: {
            const: {
              add: [
                {
                  position: 'Independent Researcher',
                  start: 2023,
                  end: null,
                  institution: { domain: 'independent-researcher.org', name: 'Independent' },
                },
                {
                  position: 'PhD Student',
                  start: 2015,
                  end: 2020,
                  institution: { domain: 'umass.edu', name: 'UMass' },
                },
              ],
            },
          },
        },
        homepage: { value: 'https://jane.example.org' },
        emails: {
          value: {
            param: {
              type: 'string{}',
              change: 'add',
              regex: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
            },
          },
        },
      },
    },
  },
}

const providerProps = (entity) => ({
  value: {
    entity,
    instructions: 'Vouch for a colleague',
    vouchedMessage: 'You vouched for this profile',
  },
})

beforeEach(() => {
  global.promptError.mockClear()
})

describe('VouchVerificationForm', () => {
  test('show the fixed name and positions and post the vouch with the typed email', async () => {
    api.get = jest.fn(() => Promise.resolve({ assertions: [] }))
    api.post = jest.fn(() => Promise.resolve({ id: 'assertion id' }))

    renderWithWebFieldContext(<VouchVerificationForm />, providerProps(invitation))

    await waitFor(() => {
      expect(screen.getByText('Vouch for a colleague')).toBeInTheDocument()
    })
    expect(api.get).toHaveBeenCalledWith('/profiles/assertions', { invitation: invitation.id })
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Independent Researcher, Independent (independent-researcher.org), 2023 – Present'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('PhD Student, UMass (umass.edu), 2015 – 2020')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://jane.example.org' })).toHaveAttribute(
      'href',
      'https://jane.example.org'
    )
    expect(screen.getByRole('button', { name: 'Vouch for Jane Doe' })).toBeDisabled()

    await userEvent.type(
      screen.getByLabelText("Jane Doe's email address"),
      ' Jane@Example.com '
    )
    expect(screen.getByRole('button', { name: 'Vouch for Jane Doe' })).toBeDisabled()
    await userEvent.click(screen.getByLabelText(statements[0]))
    await userEvent.click(screen.getByLabelText(statements[1]))
    expect(screen.getByRole('button', { name: 'Vouch for Jane Doe' })).toBeDisabled()
    await userEvent.click(screen.getByLabelText(statements[2]))
    await userEvent.click(screen.getByRole('button', { name: 'Vouch for Jane Doe' }))

    await waitFor(() => {
      expect(screen.getByText('You vouched for this profile')).toBeInTheDocument()
    })
    expect(api.post).toHaveBeenCalledWith('/profiles/assertions', {
      invitation: invitation.id,
      signatures: ['~Ana_Lee1'],
      content: { confirmations: { value: statements } },
      profile: {
        id: '~Jane_Doe1',
        content: { emails: { value: { add: ['jane@example.com'] } } },
      },
    })
  })

  test('keep the form and show the API error when the vouch is refused', async () => {
    api.get = jest.fn(() => Promise.resolve({ assertions: [] }))
    api.post = jest.fn(() =>
      Promise.reject(new Error('This email address does not match their OpenReview profile.'))
    )

    renderWithWebFieldContext(<VouchVerificationForm />, providerProps(invitation))

    await waitFor(() => {
      expect(screen.getByLabelText("Jane Doe's email address")).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText("Jane Doe's email address"), 'jane@wrong.com')
    await checkAllStatements()
    await userEvent.click(screen.getByRole('button', { name: 'Vouch for Jane Doe' }))

    await waitFor(() => {
      expect(global.promptError).toHaveBeenCalledWith(
        'This email address does not match their OpenReview profile.'
      )
    })
    expect(screen.queryByText('You vouched for this profile')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vouch for Jane Doe' })).toBeEnabled()
  })

  test('hide the homepage when the profile had none at request time', async () => {
    api.get = jest.fn(() => Promise.resolve({ assertions: [] }))
    const withoutHomepage = cloneDeep(invitation)
    withoutHomepage.assertion.profile.content.homepage = {
      value: '${6/content/homepage/value?}',
    }

    renderWithWebFieldContext(<VouchVerificationForm />, providerProps(withoutHomepage))

    await waitFor(() => {
      expect(screen.getByText('Vouch for a colleague')).toBeInTheDocument()
    })
    expect(screen.queryByText('Homepage:')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('show the vouched message when the vouch was already posted', async () => {
    api.get = jest.fn(() => Promise.resolve({ assertions: [{ id: 'assertion id' }] }))
    api.post = jest.fn()

    renderWithWebFieldContext(<VouchVerificationForm />, providerProps(invitation))

    await waitFor(() => {
      expect(screen.getByText('You vouched for this profile')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText("Jane Doe's email address")).not.toBeInTheDocument()
  })

  test('show an expired message when the invitation has expired', async () => {
    api.get = jest.fn(() => Promise.resolve({ assertions: [] }))
    api.post = jest.fn()

    renderWithWebFieldContext(
      <VouchVerificationForm />,
      providerProps({ ...invitation, expdate: Date.now() - 1000 })
    )

    await waitFor(() => {
      expect(screen.getByText(/This vouch link has expired/)).toBeInTheDocument()
    })
    expect(screen.queryByLabelText("Jane Doe's email address")).not.toBeInTheDocument()
  })
})
