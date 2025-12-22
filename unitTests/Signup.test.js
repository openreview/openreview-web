import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import Signup from '../app/signup/Signup'
import api from '../lib/api-client'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))
global.$ = jest.fn(() => ({
  on: jest.fn(),
  off: jest.fn(),
  modal: jest.fn(),
  tooltip: jest.fn(),
}))

beforeEach(() => {
  api.get = jest.fn()
})

describe('Signup', () => {
  test('show fullname input and confirm name checkbox (disabled)', () => {
    render(<Signup />)

    expect(
      screen.getByText('Enter your full name as you would write it as the author of a paper')
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { placeholder: 'Full Name' })).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', {
        name: 'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff,and may require two weeks processing time.',
      })
    ).toBeDisabled()

    expect(screen.queryByRole('button', { name: 'Sign Up' })).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  test('enable checkbox after full name is entered', async () => {
    render(<Signup />)

    const fullNameInput = screen.getByRole('textbox', { placeholder: 'Full Name' })
    await userEvent.type(fullNameInput, 'Valid Name')

    expect(
      screen.getByRole('checkbox', {
        name: 'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff,and may require two weeks processing time.',
      })
    ).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Sign Up' })).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  test('show new profile form when name is confirmed', async () => {
    render(<Signup />)

    const fullNameInput = screen.getByRole('textbox', { placeholder: 'Full Name' })
    const confirmNameCheckbox = screen.getByRole('checkbox', {
      name: 'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff,and may require two weeks processing time.',
    })

    await userEvent.type(fullNameInput, 'Valid Name')
    await userEvent.click(confirmNameCheckbox)

    expect(
      screen.getByRole('textbox', {
        name: 'Enter an email address to be associated with your profile',
      })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Enter a password')).toBeDisabled()
    expect(screen.getByLabelText('Enter the same password again')).toBeDisabled()

    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDisabled()
  })

  test('no show non institutional domain message when email is institutional email', async () => {
    api.get = jest.fn(() => Promise.resolve(['email.com']))
    render(<Signup />)

    await userEvent.type(
      screen.getByRole('textbox', { placeholder: 'Full Name' }),
      'Valid Name'
    )
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff,and may require two weeks processing time.',
      })
    )

    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Enter an email address to be associated with your profile',
      }),
      'non-institutional@email.com'
    )
    await userEvent.tab()
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.get).toHaveBeenCalledWith('/settings/institutionDomains')
    expect(
      screen.queryByText('does not appear in our list of publishing institutions.', {
        exact: false,
      })
    ).not.toBeInTheDocument()

    expect(screen.getByLabelText('Enter a password')).not.toBeDisabled()
    expect(screen.getByLabelText('Enter the same password again')).toBeDisabled()

    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDisabled()
  })

  test('validate password', async () => {
    api.get = jest.fn(() => Promise.resolve(['email.com']))
    render(<Signup />)

    await userEvent.type(
      screen.getByRole('textbox', { placeholder: 'Full Name' }),
      'Valid Name'
    )
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff,and may require two weeks processing time.',
      })
    )

    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Enter an email address to be associated with your profile',
      }),
      'non-institutional@email.com'
    )
    await userEvent.tab()

    await userEvent.type(screen.getByLabelText('Enter a password'), '1234567890')
    expect(screen.getByLabelText('Enter the same password again')).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Enter the same password again'), '2234567890') // not match with pwd
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDisabled()

    await userEvent.clear(screen.getByLabelText('Enter the same password again'))
    await userEvent.type(screen.getByLabelText('Enter the same password again'), '1234567890')
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeEnabled()
  })
})
