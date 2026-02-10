import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Contact from '../app/contact/page'
import useTurnstileToken from '../hooks/useTurnstileToken'
import api from '../lib/api-client'
import useUser from '../hooks/useUser'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useTurnstileToken')
jest.mock('../hooks/useUser')

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
})

global.promptError = jest.fn()
global.promptMessage = jest.fn()

describe('Contact page', () => {
  test('show link to venue request form', () => {
    render(<Contact />)

    expect(screen.getByRole('link', { name: 'venue request form' })).toBeInTheDocument()
  })

  test('show feedback form fields when user is guest', () => {
    render(<Contact />)

    expect(screen.getByPlaceholderText('Your email address')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // topic
    expect(screen.getByPlaceholderText('Message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  test('prefill email when user is logged in', () => {
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

    render(<Contact />)
    expect(screen.getByDisplayValue('test@email.com')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // topic
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

  test('show feedback options', async () => {
    api.put = jest.fn()
    render(<Contact />)

    const topicSelect = screen.getByRole('combobox')

    await userEvent.click(topicSelect)

    expect(
      screen.getByRole('option', {
        name: 'I have a question about my existing OpenReview profile',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', {
        name: 'A conference I submitted to',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', {
        name: 'A conference I organized',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', {
        name: 'I am a reviewer or committee member',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', {
        name: 'I am trying to create my profile',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', {
        name: 'I am trying to access a publication',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', {
        name: 'Please add my domain to your list of publishing institutions',
      })
    ).toBeInTheDocument()
  })

  test('show fields based on selected feedback option', async () => {
    api.put = jest.fn()
    render(<Contact />)

    // by default not to show extra fields
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Email Domain of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Full Name of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Official Website URL of Your Institution')
    ).not.toBeInTheDocument()

    // I have a question about my existing OpenReview profile - show only profile id input
    await userEvent.click(screen.getByRole('combobox'))
    const profileOption = screen.getByRole('option', {
      name: 'I have a question about my existing OpenReview profile',
    })
    await userEvent.click(profileOption)
    expect(screen.getByPlaceholderText('Profile ID')).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Email Domain of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Full Name of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Official Website URL of Your Institution')
    ).not.toBeInTheDocument()

    // a conference i submitted to - show venue id and submission id
    await userEvent.click(screen.getByRole('button', { name: 'remove' }))
    await userEvent.click(screen.getByRole('combobox'))

    const conferenceSubmittedToOptions = screen.getByRole('option', {
      name: 'A conference I submitted to',
    })
    await userEvent.click(conferenceSubmittedToOptions)
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Venue ID or Conference Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Submission ID')).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Email Domain of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Full Name of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Official Website URL of Your Institution')
    ).not.toBeInTheDocument()

    // a conference i organized - show venue id
    await userEvent.click(screen.getByRole('button', { name: 'remove' }))
    await userEvent.click(screen.getByRole('combobox'))

    const conferenceOrganizedOptions = screen.getByRole('option', {
      name: 'A conference I organized',
    })
    await userEvent.click(conferenceOrganizedOptions)
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Venue ID or Conference Name')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Email Domain of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Full Name of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Official Website URL of Your Institution')
    ).not.toBeInTheDocument()

    // I am a reviewer or committee member - show venue id
    await userEvent.click(screen.getByRole('button', { name: 'remove' }))
    await userEvent.click(screen.getByRole('combobox'))

    const reviewerOption = screen.getByRole('option', {
      name: 'I am a reviewer or committee member',
    })
    await userEvent.click(reviewerOption)
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Venue ID or Conference Name')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Email Domain of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Full Name of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Official Website URL of Your Institution')
    ).not.toBeInTheDocument()

    // I am trying to create my profile - no extra fields
    await userEvent.click(screen.getByRole('button', { name: 'remove' }))
    await userEvent.click(screen.getByRole('combobox'))

    const createProfileOption = screen.getByRole('option', {
      name: 'I am trying to create my profile',
    })
    await userEvent.click(createProfileOption)
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Email Domain of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Full Name of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Official Website URL of Your Institution')
    ).not.toBeInTheDocument()

    // I am trying to access a publication - show submission id
    await userEvent.click(screen.getByRole('button', { name: 'remove' }))
    await userEvent.click(screen.getByRole('combobox'))

    const accessPublicationOption = screen.getByRole('option', {
      name: 'I am trying to access a publication',
    })
    await userEvent.click(accessPublicationOption)
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Submission ID')).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Email Domain of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Full Name of Your Institution')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Official Website URL of Your Institution')
    ).not.toBeInTheDocument()

    // add institution domain - show email domain, full name and website url
    await userEvent.click(screen.getByRole('button', { name: 'remove' }))
    await userEvent.click(screen.getByRole('combobox'))

    const addInstitutionOption = screen.getByRole('option', {
      name: 'Please add my domain to your list of publishing institutions',
    })
    await userEvent.click(addInstitutionOption)
    expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email Domain of Your Institution')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Full Name of Your Institution')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Official Website URL of Your Institution')
    ).toBeInTheDocument()
  })

  test('show missing field error when there are fields missing', async () => {
    api.put = jest.fn()
    render(<Contact />)

    const emailInput = screen.getByPlaceholderText('Your email address')
    const topicSelect = screen.getByRole('combobox')
    const messageInput = screen.getByPlaceholderText('Message')

    // from and message are always required
    await userEvent.type(emailInput, 'test@mail.com')
    await userEvent.type(messageInput, 'some message')
    await userEvent.click(topicSelect)
    await userEvent.click(
      // profile id will be required
      screen.getByRole('option', {
        name: 'I have a question about my existing OpenReview profile',
      })
    )
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(api.put).not.toHaveBeenCalled()
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()

    // clear error when user update form
    await userEvent.type(screen.getByPlaceholderText('Profile ID'), '~Test_User1')
    expect(screen.queryByText('Please fill in all fields.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled()

    // send message with no error
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(api.put).toHaveBeenCalledWith(expect.anything(), {
      from: 'test@mail.com',
      message: 'Profile ID: ~Test_User1\n\nsome message',
      subject: 'I have a question about my existing OpenReview profile - ~Test_User1',
      token: 'some token',
    })
    expect(global.promptMessage).toHaveBeenCalledWith(
      'Your feedback has been submitted. Thank you.'
    )
  })

  test('send feedback', async () => {
    api.put = jest.fn()
    render(<Contact />)

    const emailInput = screen.getByPlaceholderText('Your email address')
    const topicSelect = screen.getByRole('combobox')
    const messageInput = screen.getByPlaceholderText('Message')

    await userEvent.type(emailInput, 'test@mail.com')
    await userEvent.click(topicSelect)
    await userEvent.click(
      screen.getByRole('option', {
        name: 'A conference I organized',
      })
    )
    const venueInput = screen.getByPlaceholderText('Venue ID or Conference Name')
    await userEvent.type(venueInput, 'some venue')
    await userEvent.type(messageInput, 'some message')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(api.put).toHaveBeenCalledWith(expect.anything(), {
      from: 'test@mail.com',
      message: 'Venue ID: some venue\n\nsome message',
      subject: 'Venue - some venue',
      token: 'some token',
    })
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
    useUser.mockImplementation(() => ({
      // only guest can access sign up
      isRefreshing: false,
      user: undefined,
    }))
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
