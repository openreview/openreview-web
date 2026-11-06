import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Contact from '../app/contact/page'
import useTurnstileToken from '../hooks/useTurnstileToken'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useTurnstileToken')
jest.mock('../hooks/useUser')

const askResponse = {
  answer: 'Open the Program Chairs group and select Add to Group.',
  sources: [
    {
      title: 'How do I add a Program Chair to my venue?',
      url: 'https://docs.openreview.net/getting-started/frequently-asked-questions/how-do-i-add-a-program-chair-to-my-venue',
    },
  ],
}

const mockAsk = (response = askResponse, ok = true) => {
  global.fetch = jest.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(response) }))
}

const renderWithForm = async () => {
  render(<Contact />)
  // the support form is only reachable after a documentation search
  await userEvent.click(screen.getByRole('button', { name: 'How do I find a venue ID?' }))
  await screen.findByText(askResponse.answer)
  await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
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
  mockAsk()
})

global.promptError = jest.fn()
global.promptMessage = jest.fn()
global.DOMPurify = { sanitize: (html) => html }
global.marked = (text) => `<p>${text}</p>`

describe('Contact page', () => {
  test('lead with the documentation instead of the support form', () => {
    render(<Contact />)

    expect(
      screen.getByPlaceholderText(
        'Ask a question, e.g. how do I add a program chair to my venue?'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Frequently Asked Questions/ })).toHaveAttribute(
      'href',
      'https://docs.openreview.net/getting-started/frequently-asked-questions'
    )

    // nothing offers the support form before a search has been run
    expect(screen.queryByPlaceholderText('Your email address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument()
    expect(screen.queryByText('Still need help?')).not.toBeInTheDocument()
  })

  test('keep the venue request form and issue reporting at the top', () => {
    render(<Contact />)

    expect(screen.getByRole('link', { name: 'venue request form' })).toHaveAttribute(
      'href',
      '/group?id=OpenReview.net/Support'
    )
    expect(screen.getByRole('link', { name: 'open an issue' })).toHaveAttribute(
      'href',
      'https://github.com/openreview/openreview/issues/new/choose'
    )
  })

  test('point venue questions to the venue', () => {
    render(<Contact />)

    expect(
      screen.getByText(
        'For questions about a specific venue, use the contact address on the venue invitation.'
      )
    ).toBeInTheDocument()
  })

  test('only offer the support form once a search has been run', async () => {
    render(<Contact />)

    expect(screen.queryByText('Still need help?')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'How do I find a venue ID?' }))
    await screen.findByText(askResponse.answer)

    expect(screen.getByText('Still need help?')).toBeInTheDocument()
    // still only an offer, the form itself stays closed
    expect(screen.queryByPlaceholderText('Message')).not.toBeInTheDocument()
  })

  test('dismiss the help prompt without opening the form', async () => {
    render(<Contact />)

    await userEvent.click(screen.getByRole('button', { name: 'How do I find a venue ID?' }))
    await screen.findByText(askResponse.answer)
    await userEvent.click(screen.getByRole('button', { name: 'No' }))

    expect(screen.getByText('Glad that helped.')).toBeInTheDocument()
    expect(screen.queryByText('Still need help?')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Message')).not.toBeInTheDocument()
  })

  test('carry the question into the form when the search failed', async () => {
    mockAsk({ message: 'The documentation search is unavailable right now.' }, false)
    render(<Contact />)

    await userEvent.click(
      screen.getByRole('button', { name: 'How do I withdraw my submission?' })
    )
    await screen.findByText('The documentation search is unavailable right now.')
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(screen.getByPlaceholderText('Message')).toHaveValue(
      'How do I withdraw my submission?'
    )
  })

  test('move focus into the form when it opens', async () => {
    render(<Contact />)

    await userEvent.click(screen.getByRole('button', { name: 'How do I find a venue ID?' }))
    await screen.findByText(askResponse.answer)
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(screen.getByPlaceholderText('Your email address')).toHaveFocus()
  })

  test('reveal the already open form again after a later search', async () => {
    render(<Contact />)

    await userEvent.click(screen.getByRole('button', { name: 'How do I find a venue ID?' }))
    await screen.findByText(askResponse.answer)
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByPlaceholderText('Message')).toHaveValue('How do I find a venue ID?')

    // a second search re-offers the prompt, and accepting it updates the open form
    await userEvent.click(
      screen.getByRole('button', { name: 'How do I withdraw my submission?' })
    )
    await screen.findByText(askResponse.answer)
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(screen.getByPlaceholderText('Message')).toHaveValue(
      'How do I withdraw my submission?'
    )
    expect(screen.getByPlaceholderText('Your email address')).toHaveFocus()
  })

  test('answer a question from the documentation and link to its sources', async () => {
    render(<Contact />)

    await userEvent.type(
      screen.getByPlaceholderText(
        'Ask a question, e.g. how do I add a program chair to my venue?'
      ),
      'how do I add a program chair'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Search the docs' }))

    expect(global.fetch).toHaveBeenCalledWith(
      '/contact/ask',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ question: 'how do I add a program chair' }),
      })
    )
    expect(await screen.findByText(askResponse.answer)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'How do I add a Program Chair to my venue?' })
    ).toHaveAttribute('href', askResponse.sources[0].url)
  })

  test('cancel the search and dismiss the answer', async () => {
    render(<Contact />)

    await userEvent.click(screen.getByRole('button', { name: 'How do I find a venue ID?' }))
    await screen.findByText(askResponse.answer)

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText(askResponse.answer)).not.toBeInTheDocument()
    expect(screen.queryByText('Still need help?')).not.toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        'Ask a question, e.g. how do I add a program chair to my venue?'
      )
    ).toHaveValue('')
  })

  test('offer the support form even when the search itself failed', async () => {
    mockAsk({ message: 'The documentation search is unavailable right now.' }, false)
    render(<Contact />)

    await userEvent.click(screen.getByRole('button', { name: 'How do I find a venue ID?' }))
    await screen.findByText('The documentation search is unavailable right now.')

    expect(screen.getByText('Still need help?')).toBeInTheDocument()
  })

  test('open the support form prefilled with the question', async () => {
    render(<Contact />)

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Why is my profile limited and how do I activate it?',
      })
    )
    await screen.findByText(askResponse.answer)

    expect(screen.queryByPlaceholderText('Message')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(screen.getByPlaceholderText('Your email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Message')).toHaveValue(
      'Why is my profile limited and how do I activate it?'
    )
    // the prompt is replaced by the form, not shown alongside it
    expect(screen.queryByText('Still need help?')).not.toBeInTheDocument()
  })

  test('show feedback form fields when user is guest', async () => {
    await renderWithForm()

    expect(screen.getByPlaceholderText('Your email address')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // topic
    expect(screen.getByPlaceholderText('Message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
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
    expect(screen.getByDisplayValue('test@email.com')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // topic
    expect(screen.getByPlaceholderText('Message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  test('disable send button when turnstile token fail', async () => {
    useTurnstileToken.mockImplementation(() => ({
      turnstileToken: undefined,
    }))

    await renderWithForm()
    const sendButton = screen.getByRole('button', { name: 'Send' })
    expect(sendButton).toBeDisabled()
  })

  test('show feedback options', async () => {
    api.put = jest.fn()
    await renderWithForm()

    const topicSelect = screen.getByRole('combobox')

    await userEvent.click(topicSelect)

    expect(
      screen.getByTitle('I have a question about my existing OpenReview profile')
    ).toBeInTheDocument()
    expect(screen.getByTitle('A conference I submitted to')).toBeInTheDocument()
    expect(screen.getByTitle('A conference I organized')).toBeInTheDocument()
    expect(screen.getByTitle('I am a reviewer or committee member')).toBeInTheDocument()
    expect(screen.getByTitle('I am trying to create my profile')).toBeInTheDocument()
    expect(screen.getByTitle('I am trying to access a publication')).toBeInTheDocument()
    expect(
      screen.queryByTitle('Please add my domain to your list of publishing institutions')
    ).not.toBeInTheDocument()
  })

  test('show fields based on selected feedback option', async () => {
    api.put = jest.fn()
    await renderWithForm()

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
    const profileOption = screen.getByTitle(
      'I have a question about my existing OpenReview profile'
    )
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
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('combobox'))

    const conferenceSubmittedToOptions = screen.getByTitle('A conference I submitted to')
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
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('combobox'))

    const conferenceOrganizedOptions = screen.getByTitle('A conference I organized')
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
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('combobox'))

    const reviewerOption = screen.getByTitle('I am a reviewer or committee member')
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
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('combobox'))

    const createProfileOption = screen.getByTitle('I am trying to create my profile')
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
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('combobox'))

    const accessPublicationOption = screen.getByTitle('I am trying to access a publication')
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
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('combobox'))

    // const addInstitutionOption = screen.getByRole('option', {
    //   name: 'Please add my domain to your list of publishing institutions',
    // })
    // await userEvent.click(addInstitutionOption)
    // expect(screen.queryByPlaceholderText('Profile ID')).not.toBeInTheDocument()
    // expect(
    //   screen.queryByPlaceholderText('Venue ID or Conference Name')
    // ).not.toBeInTheDocument()
    // expect(screen.queryByPlaceholderText('Submission ID')).not.toBeInTheDocument()
    // expect(screen.getByPlaceholderText('Email Domain of Your Institution')).toBeInTheDocument()
    // expect(screen.getByPlaceholderText('Full Name of Your Institution')).toBeInTheDocument()
    // expect(
    //   screen.getByPlaceholderText('Official Website URL of Your Institution')
    // ).toBeInTheDocument()
  })

  test('show missing field error when there are fields missing', async () => {
    api.put = jest.fn()
    await renderWithForm()

    const emailInput = screen.getByPlaceholderText('Your email address')
    const topicSelect = screen.getByRole('combobox')
    const messageInput = screen.getByPlaceholderText('Message')

    // from and message are always required
    await userEvent.type(emailInput, 'test@mail.com')
    await userEvent.clear(messageInput)
    await userEvent.type(messageInput, 'some message')
    await userEvent.click(topicSelect)
    await userEvent.click(
      // profile id will be required
      screen.getByTitle('I have a question about my existing OpenReview profile')
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
    await renderWithForm()

    const emailInput = screen.getByPlaceholderText('Your email address')
    const topicSelect = screen.getByRole('combobox')
    const messageInput = screen.getByPlaceholderText('Message')

    await userEvent.type(emailInput, 'test@mail.com')
    await userEvent.click(topicSelect)
    await userEvent.click(screen.getByTitle('A conference I organized'))
    const venueInput = screen.getByPlaceholderText('Venue ID or Conference Name')
    await userEvent.type(venueInput, 'some venue')
    await userEvent.clear(messageInput)
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
    expect(screen.getByPlaceholderText('Your email address')).toHaveValue('')
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getByPlaceholderText('Message')).toHaveValue('')
    // the venue field only shows for a venue topic, so it goes away with the reset
    expect(
      screen.queryByPlaceholderText('Venue ID or Conference Name')
    ).not.toBeInTheDocument()
  })

  test('show error when feedback cannot be sent', async () => {
    api.put = jest.fn()
    await renderWithForm()

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(api.put).not.toHaveBeenCalled()
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()

    // clear error when user update form
    await userEvent.type(screen.getByPlaceholderText('Your email address'), 'test@mail.com')
    expect(screen.queryByText('Please fill in all fields.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled()
  })

  test('read feedbackInstitution and open the support form', () => {
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
