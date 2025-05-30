import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Contact from '../pages/contact'
import useTurnstileToken from '../hooks/useTurnstileToken'
import api from '../lib/api-client'

jest.mock('../hooks/useUser', () => () => ({
  user: {
    profile: {
      id: 'some id',
    },
  },
  accessToken: 'some token',
}))
jest.mock('../hooks/useTurnstileToken')

beforeEach(() => {
  useTurnstileToken.mockImplementation(() => ({
    turnstileToken: 'some token',
  }))
})

global.promptError = jest.fn()
global.promptMessage = jest.fn()

describe('Contact page', () => {
  test('show link to venue request form', () => {
    render(<Contact />)

    expect(screen.getByRole('link', { name: 'venue request form' })).toBeInTheDocument()
    screen.debug()
  })

  test('show feedback form fields', () => {
    render(<Contact />)

    expect(screen.getByPlaceholderText('Your email address')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // topic
    expect(screen.getByPlaceholderText('Venue ID or Conference Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  test('disable send button when turnstile token fail', () => {
    useTurnstileToken.mockImplementation(() => ({
      turnstileToken: undefined,
    }))

    render(<Contact />)
    const sendButton = screen.getByRole('button', { name: 'Send' })
    expect(sendButton).toBeDisabled()
  })

  test('send feedback', async () => {
    api.put = jest.fn()
    render(<Contact />)

    const emailInput = screen.getByPlaceholderText('Your email address')
    const topicSelect = screen.getByRole('combobox')
    const venueInput = screen.getByPlaceholderText('Venue ID or Conference Name')
    const messageInput = screen.getByPlaceholderText('Message')

    await userEvent.type(emailInput, 'test@mail.com')
    await userEvent.click(topicSelect)
    await userEvent.click(
      screen.getByRole('option', {
        name: 'A conference I organized',
      })
    )
    await userEvent.type(venueInput, 'some venue')
    await userEvent.type(messageInput, 'some message')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(api.put).toHaveBeenCalledWith(
      expect.anything(),
      {
        from: 'test@mail.com',
        message: 'Venue ID: some venue\n\nsome message',
        subject: 'Venue - some venue',
        token: 'some token',
      },
      expect.anything()
    )
    expect(global.promptMessage).toHaveBeenCalledWith(
      'Your feedback has been submitted. Thank you.'
    )
    // form should be cleared
    expect(screen.queryByText('test@mail.com')).not.toBeInTheDocument()
    expect(screen.queryByText('some venue')).not.toBeInTheDocument()
    expect(screen.queryByText('A conference I organized')).not.toBeInTheDocument()
    expect(screen.queryByText('some message')).not.toBeInTheDocument()
  })

  test('show error when feedback cannot be sent', async () => {
    api.put = jest.fn()
    render(<Contact />)

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(api.put).not.toHaveBeenCalled()
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()

    // clear error when user update form
    await userEvent.type(screen.getByPlaceholderText('Your email address'), 'test@mail.com')
    expect(screen.queryByText('Please fill in all fields.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled()
  })

  test('read feedbackInstitution and select adding domain option', () => {
    const mockSessionStorage = {
      getItem: jest.fn(() => 'test@mail.com'),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    })
    render(<Contact />)

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('feedbackInstitution')
    expect(screen.getByDisplayValue('test@mail.com')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('Please add my domain to your list of publishing institutions')
    ).toBeInTheDocument()
  })
})
