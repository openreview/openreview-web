import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Help from '../app/help/page'
import useTurnstileToken from '../hooks/useTurnstileToken'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useTurnstileToken')
jest.mock('../hooks/useUser')
jest.mock('../lib/api-client')

const renderWithForm = async () => {
  render(<Help />)
  await userEvent.click(screen.getByRole('button', { name: 'contact us' }))
}

const selectSubject = async (subject) => {
  const input = screen.getByPlaceholderText('Select a topic or type what you need help with')
  await userEvent.clear(input)
  await userEvent.type(input, subject)
}

const fillField = async (placeholder, value) => {
  const input = screen.getByPlaceholderText(placeholder)
  await userEvent.clear(input)
  await userEvent.type(input, value)
}

beforeEach(() => {
  useTurnstileToken.mockImplementation(() => ({
    turnstileToken: 'some token',
  }))
  useUser.mockImplementation(() => ({
    user: {
      profile: {
        id: 'some id',
      },
    },
    accessToken: 'some token',
  }))
  api.put.mockReset()
})

global.promptError = jest.fn()
global.promptMessage = jest.fn()
global.DOMPurify = { sanitize: (html) => html }
global.marked = (text) => `<p>${text}</p>`

describe('Help page', () => {
  test('show documentation cards under the help heading', () => {
    render(<Help />)

    expect(screen.getByRole('heading', { name: 'Help' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Frequently Asked Questions/ })).toHaveAttribute(
      'href',
      'https://docs.openreview.net/getting-started/frequently-asked-questions'
    )
    expect(
      screen.getByRole('link', { name: /^Creating and activating a profile/ })
    ).toHaveAttribute(
      'href',
      'https://docs.openreview.net/getting-started/creating-an-openreview-profile'
    )

    expect(screen.queryByPlaceholderText('Your email address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument()
  })

  test('show contact prompt at the bottom of the page', () => {
    render(<Help />)

    expect(
      screen.getByText((text) => text.includes('If you need more help, please'))
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'contact us' })).toBeInTheDocument()
  })

  test('open the support form when contact us is clicked', async () => {
    render(<Help />)

    await userEvent.click(screen.getByRole('button', { name: 'contact us' }))

    expect(screen.getByPlaceholderText('Your email address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your email address')).toHaveFocus()
  })

  test('prefill email when user is logged in', async () => {
    useUser.mockImplementation(() => ({
      user: {
        profile: {
          id: 'some id',
          preferredEmail: 'test@email.com',
        },
      },
      accessToken: 'some token',
      isRefreshing: false,
    }))

    await renderWithForm()

    expect(screen.getByPlaceholderText('Your email address')).toHaveValue('test@email.com')
  })

  test('disable send button when turnstile token is not ready', async () => {
    useTurnstileToken.mockImplementation(() => ({
      turnstileToken: undefined,
    }))

    await renderWithForm()

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  test('show feedback options in the support form', async () => {
    await renderWithForm()

    const subjectInput = screen.getByPlaceholderText(
      'Select a topic or type what you need help with'
    )

    const expectOptionVisible = async (subject) => {
      await userEvent.clear(subjectInput)
      await userEvent.type(subjectInput, subject)
      const list = await screen.findByRole('listbox')
      const optionTexts = Array.from(list.querySelectorAll('[role="option"]')).map((el) =>
        el.textContent.trim()
      )
      expect(optionTexts).toContain(subject)
    }

    await expectOptionVisible('I have a question about my existing OpenReview profile')
    await expectOptionVisible('A conference I submitted to')
    await expectOptionVisible('A conference I organized')
    await expectOptionVisible('I am a reviewer or committee member')
    await expectOptionVisible('I am trying to create my profile')
    await expectOptionVisible('I am trying to access a publication')
  })

  test('show fields based on selected feedback option', async () => {
    await renderWithForm()

    await selectSubject('I have a question about my existing OpenReview profile')
    expect(screen.getByPlaceholderText('Profile ID')).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()

    await selectSubject('A conference I submitted to')
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Venue ID or Conference Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Submission ID')).toBeInTheDocument()

    await selectSubject('A conference I organized')
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Venue ID or Conference Name')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()

    await selectSubject('I am a reviewer or committee member')
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Venue ID or Conference Name')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()

    await selectSubject('I am trying to create my profile')
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()

    await selectSubject('I am trying to access a publication')
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Submission ID')).toBeInTheDocument()
  })

  test('show missing field error when required fields are empty', async () => {
    await renderWithForm()

    await selectSubject('I have a question about my existing OpenReview profile')
    await fillField('Your email address', 'test@mail.com')
    await fillField('Message', 'some message')

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await screen.findByText('Please fill in all fields.')
    expect(api.put).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()

    await fillField('Profile ID', '~Test_User1')

    expect(screen.queryByText('Please fill in all fields.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled()
  })

  test('send feedback with a profile question', async () => {
    await renderWithForm()

    await selectSubject('I have a question about my existing OpenReview profile')
    await fillField('Your email address', 'test@mail.com')
    await fillField('Profile ID', '~Test_User1')
    await fillField('Message', 'some message')

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(api.put).toHaveBeenCalledWith('/feedback', {
      from: 'test@mail.com',
      message: 'Profile ID: ~Test_User1\n\nsome message',
      subject: 'I have a question about my existing OpenReview profile - ~Test_User1',
      token: 'some token',
    })
    expect(global.promptMessage).toHaveBeenCalledWith(
      'Your feedback has been submitted. Thank you.'
    )
  })

  test('send feedback with a venue question', async () => {
    await renderWithForm()

    await selectSubject('A conference I organized')
    await fillField('Your email address', 'test@mail.com')
    await fillField('Venue ID or Conference Name', 'some venue')
    await fillField('Message', 'some message')

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(api.put).toHaveBeenCalledWith('/feedback', {
      from: 'test@mail.com',
      message: 'Venue ID: some venue\n\nsome message',
      subject: 'Venue - some venue',
      token: 'some token',
    })
    expect(global.promptMessage).toHaveBeenCalledWith(
      'Your feedback has been submitted. Thank you.'
    )
  })

  test('show error when feedback cannot be sent', async () => {
    api.put.mockRejectedValue(new Error('feedback failed'))
    await renderWithForm()

    await selectSubject('I am trying to create my profile')
    await fillField('Your email address', 'test@mail.com')
    await fillField('Message', 'some message')

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await screen.findByText('feedback failed')
  })
})
