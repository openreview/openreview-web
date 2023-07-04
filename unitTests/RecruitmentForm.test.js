import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import api from '../lib/api-client'
import { renderWithWebFieldContext } from './util'
import RecruitmentForm from '../components/webfield/RecruitmentForm'

let markdownProps
let responseEditMock
let responseUpdateEditMock
jest.mock('../components/EditorComponents/Markdown', () => (props) => {
  markdownProps(props)
  return <span>{props.text}</span>
})
jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))
jest.mock('../lib/utils', () => {
  const original = jest.requireActual('../lib/utils')
  return {
    ...original,
    constructRecruitmentResponseNote: jest.fn((invitation, content, existingNote) => {
      if (!existingNote) return responseEditMock
      return responseUpdateEditMock
    }),
  }
})
global.marked = jest.fn()
global.promptError = jest.fn()
global.DOMPurify = {
  sanitize: jest.fn(),
}

beforeEach(() => {
  markdownProps = jest.fn()
  responseEditMock = null
  responseUpdateEditMock = null
})

describe('RecruitmentForm', () => {
  test('show error when link does not have id,user and key', () => {
    const providerProps = {
      value: {
        venueId: 'ICML.cc/2023/Conference',
        header: {
          contact: 'contact@email.com',
          subtitle: 'ICML 2023',
          title: 'International Conference on Machine Learning',
          website: 'https://openreview.net',
        },
        entity: {
          apiVersion: 2,
          edit: {
            note: {
              content: {},
            },
          },
        },
        args: {
          id: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
          user: 'test@email.com',
          key: undefined,
        },
        invitationMessage: 'You have been invited',
        acceptMessage: 'Thank you for accepting this invitation',
        declineMessage: 'You have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)
    expect(screen.getByText('The link is invalid, please refer back to recruitment email.')).toBeInTheDocument()
  })

  test('show title, contact, invitation message and action buttons', () => {
    const providerProps = {
      value: {
        venueId: 'ICML.cc/2023/Conference',
        header: {
          contact: 'conact@email.com',
          subtitle: 'ICML 2023',
          title: 'International Conference on Machine Learning',
          website: 'https://openreview.net',
        },
        entity: {
          apiVersion: 2,
          edit: {
            note: {
              content: {},
            },
          },
        },
        args: {
          id: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
          user: 'test@email.com',
          key: 'somekey',
        },
        invitationMessage: '# You have been invited #',
        acceptMessage: 'Thank you for accepting this invitation',
        declineMessage: 'You have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)
    expect(screen.getByText(providerProps.value.header.title))
    expect(screen.getByText(providerProps.value.header.subtitle))
    expect(screen.getByText(providerProps.value.header.website))
    expect(screen.getByText(providerProps.value.header.contact))
    expect(markdownProps).toHaveBeenCalledWith({ text: providerProps.value.invitationMessage })
    expect(screen.getByText(providerProps.value.invitationMessage))
    expect(screen.getByRole('button', { name: 'Accept' }))
    expect(screen.getByRole('button', { name: 'Decline' }))
  })

  test('call api to post response when user accept', async () => {
    responseEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: 'Yes' } },
    }
    const postResponse = jest.fn(() => Promise.resolve({}))
    api.post = postResponse
    const providerProps = {
      value: {
        venueId: 'ICML.cc/2023/Conference',
        header: {
          contact: 'conact@email.com',
          subtitle: 'ICML 2023',
          title: 'International Conference on Machine Learning',
          website: 'https://openreview.net',
        },
        entity: {
          apiVersion: 2,
          edit: {
            note: {
              content: {},
            },
          },
        },
        args: {
          id: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
          user: 'test@email.com',
          key: 'somekey',
        },
        invitationMessage: '# You have been invited #',
        acceptMessage: 'Thank you {{user}} for accepting this invitation',
        declineMessage: 'You have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }))
    await waitFor(() => {
      expect(screen.getByText('Thank you test@email.com for accepting this invitation'))
      expect(postResponse).toHaveBeenCalledWith('/notes/edits', responseEditMock, { version: 2 })
    })
  })

  test('call api to post response when user decline', async () => {
    responseEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'No' } } },
    }
    const postResponse = jest.fn(() => Promise.resolve({}))
    api.post = postResponse
    const providerProps = {
      value: {
        venueId: 'ICML.cc/2023/Conference',
        header: {
          contact: 'conact@email.com',
          subtitle: 'ICML 2023',
          title: 'International Conference on Machine Learning',
          website: 'https://openreview.net',
        },
        entity: {
          apiVersion: 2,
          edit: {
            note: {
              content: {},
            },
          },
        },
        args: {
          id: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
          user: 'test@email.com',
          key: 'somekey',
        },
        invitationMessage: '# You have been invited #',
        acceptMessage: 'Thank you for accepting this invitation',
        declineMessage: 'You {{user}} have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))
    await waitFor(() => {
      expect(screen.getByText('You test@email.com have declined the invitation'))
      expect(postResponse).toHaveBeenCalledWith('/notes/edits', responseEditMock, { version: 2 })
      expect(screen.queryByRole('button')).not.toBeInTheDocument() // invitation does not have content
    })
  })

  test('display comment textarea and enabled submit button if defined', async () => {
    responseEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'No' } } },
    }
    responseUpdateEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'No' }, comment: { value: 'some comment' } } },
    }
    const postResponse = jest.fn(() => Promise.resolve({}))
    api.post = postResponse
    const providerProps = {
      value: {
        venueId: 'ICML.cc/2023/Conference',
        header: {
          contact: 'conact@email.com',
          subtitle: 'ICML 2023',
          title: 'International Conference on Machine Learning',
          website: 'https://openreview.net',
        },
        entity: {
          apiVersion: 2,
          edit: {
            note: {
              content: {
                comment: {
                  description: '(Optional) Leave a comment to the organizers of the venue.',
                  value: {
                    param: {
                      type: 'string',
                      input: 'textarea',
                      optional: true, // optional is always true so that yes/no response can be submitted
                      maxLength: 5000,
                    },
                  },
                },
              },
            },
          },
        },
        args: {
          id: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
          user: 'test@email.com',
          key: 'somekey',
        },
        invitationMessage: '# You have been invited #',
        acceptMessage: 'Thank you for accepting this invitation',
        declineMessage: 'You have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))
    await waitFor(() => {
      expect(screen.getByText('You have declined the invitation'))
      expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
    })

    await userEvent.type(screen.getByRole('textbox'), 'some comment')

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(postResponse).toHaveBeenLastCalledWith(
      expect.anything(),
      responseUpdateEditMock,
      expect.anything()
    )
    expect(screen.getByText('You have declined the invitation'))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument() // only show message after submit comment
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  })

  test('display request reduced load if defined', async () => {
    responseEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'No' } } },
    }
    responseUpdateEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'Yes' }, reduced_load: { value: 3 } } },
    }
    const postResponse = jest.fn(() => Promise.resolve({}))
    api.post = postResponse
    const providerProps = {
      value: {
        venueId: 'ICML.cc/2023/Conference',
        header: {
          contact: 'conact@email.com',
          subtitle: 'ICML 2023',
          title: 'International Conference on Machine Learning',
          website: 'https://openreview.net',
        },
        entity: {
          apiVersion: 2,
          edit: {
            note: {
              content: {
                reduced_load: {
                  description:
                    'Please select the number of submissions that you would be comfortable reviewing.',
                  value: {
                    param: {
                      type: 'string',
                      enum: ['1', '2', '3', '4'],
                      input: 'select',
                      optional: true,
                    },
                  },
                },
              },
            },
          },
        },
        args: {
          id: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
          user: 'test@email.com',
          key: 'somekey',
        },
        invitationMessage: '# You have been invited #',
        acceptMessage: 'Thank you for accepting this invitation',
        declineMessage: 'You have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))
    await waitFor(() => {
      expect(
        screen.getByText(
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below'
        )
      )
      expect(screen.getByRole('button', { name: 'Request a reduced load' }))
    })

    await userEvent.click(screen.getByRole('button', { name: 'Request a reduced load' }))
    expect(screen.getByText('Reduced Load'))
    expect(
      screen.getByText(
        'Please select the number of submissions that you would be comfortable reviewing.'
      )
    )
    expect(screen.getByRole('combobox'))
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' }))

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Request a reduced load' })) // go back to reduced load link

    await userEvent.click(screen.getByRole('button', { name: 'Request a reduced load' }))
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('3'))
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(postResponse).toHaveBeenLastCalledWith(
      expect.anything(),
      responseUpdateEditMock,
      expect.anything()
    )
    expect(screen.getByText('You have requested a reduced load of 3 papers'))
    expect(screen.getByText('Thank you for accepting this invitation'))
  })

  test('display only comment and reduced_load field', async () => {
    responseEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'No' } } },
    }
    responseUpdateEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'Yes' }, reduced_load: { value: 3 } } },
    }
    const postResponse = jest.fn(() => Promise.resolve({}))
    api.post = postResponse
    const providerProps = {
      value: {
        venueId: 'ICML.cc/2023/Conference',
        header: {
          contact: 'conact@email.com',
          subtitle: 'ICML 2023',
          title: 'International Conference on Machine Learning',
          website: 'https://openreview.net',
        },
        entity: {
          apiVersion: 2,
          edit: {
            note: {
              content: {
                comment: {
                  description: '(Optional) Leave a comment to the organizers of the venue.',
                  value: {
                    param: {
                      type: 'string',
                      input: 'textarea',
                      optional: true, // optional is always true so that yes/no response can be submitted
                      maxLength: 5000,
                    },
                  },
                },
                reduced_load: {
                  description:
                    'Please select the number of submissions that you would be comfortable reviewing.',
                  value: {
                    param: {
                      type: 'string',
                      enum: ['1', '2', '3', '4'],
                      input: 'select',
                      optional: true,
                    },
                  },
                },
                test_field: {
                  description: ' test description',
                  value: {
                    param: {
                      type: 'string',
                      input: 'text',
                      optional: true,
                    },
                  },
                },
              },
            },
          },
        },
        args: {
          id: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
          user: 'test@email.com',
          key: 'somekey',
        },
        invitationMessage: '# You have been invited #',
        acceptMessage: 'Thank you for accepting this invitation',
        declineMessage: 'You have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))
    expect(screen.getByRole('button', { name: 'Request a reduced load' }))
    expect(screen.getByRole('textbox'))
    expect(screen.queryByText('test_field')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Request a reduced load' }))
    expect(screen.queryByText('test_field')).not.toBeInTheDocument()
  })
})
