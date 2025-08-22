import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import api from '../lib/api-client'
import { renderWithWebFieldContext } from './util'
import RecruitmentForm from '../components/webfield/RecruitmentForm'

let markdownProps
let responseEditMock
let contentParam
let responseUpdateEditMock

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/EditorComponents/Markdown', () => (props) => {
  markdownProps(props)
  return <span>{props.text}</span>
})
jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))
jest.mock('../hooks/useTurnstileToken', () => () => ({ turnstileToken: 'some token' }))
jest.mock('../lib/utils', () => {
  const original = jest.requireActual('../lib/utils')
  return {
    ...original,
    constructRecruitmentResponseNote: jest.fn((invitation, content, existingNote) => {
      contentParam(content)
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
  contentParam = jest.fn()
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
    expect(
      screen.getByText('The link is invalid, please refer back to recruitment email.')
    ).toBeInTheDocument()
  })

  test('show title, contact, invitation message, extra fields and action buttons (no accept with reduced load)', async () => {
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
                arbitrary_field: {
                  description: 'this is a custom field to be displayed above action buttons',
                  value: {
                    param: {
                      type: 'string',
                      enum: ['Yes', 'No'],
                      input: 'radio',
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
    expect(screen.getByText(providerProps.value.header.title)).toBeVisible()
    expect(screen.getByText(providerProps.value.header.subtitle)).toBeVisible()
    expect(screen.getByText(providerProps.value.header.website)).toBeVisible()
    expect(screen.getByText(providerProps.value.header.contact)).toBeVisible()
    expect(markdownProps).toHaveBeenCalledWith({ text: providerProps.value.invitationMessage })
    expect(screen.getByText(providerProps.value.invitationMessage)).toBeVisible()
    expect(
      screen.getByText('this is a custom field to be displayed above action buttons')
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Yes' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'No' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Accept' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Decline' })).toBeVisible()
  })

  test('show title, contact, invitation message and action buttons (with accept with reduced load)', () => {
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
        allowAcceptWithReducedLoad: true,
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)
    expect(screen.getByText(providerProps.value.header.title)).toBeVisible()
    expect(screen.getByText(providerProps.value.header.subtitle)).toBeVisible()
    expect(screen.getByText(providerProps.value.header.website)).toBeVisible()
    expect(screen.getByText(providerProps.value.header.contact)).toBeVisible()
    expect(markdownProps).toHaveBeenCalledWith({ text: providerProps.value.invitationMessage })
    expect(screen.getByText(providerProps.value.invitationMessage)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Accept' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Accept (Reduced Load)' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Decline' })).toBeVisible()
  })

  test('call api to post response when user accept (no extra field)', async () => {
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
      expect(
        screen.getByText('Thank you test@email.com for accepting this invitation')
      ).toBeVisible()
      expect(postResponse).toHaveBeenCalledWith('/notes/edits', responseEditMock, {
        version: 2,
      })
    })
  })

  test('call api to post response when user accept (with extra field)', async () => {
    responseEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'Yes' }, arbitrary_field: { value: 'No' } } },
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
                arbitrary_field: {
                  description: 'this is a custom field to be displayed above action buttons',
                  value: {
                    param: {
                      type: 'string',
                      enum: ['Yes', 'No'],
                      input: 'radio',
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
          arbitrary_field: 'No',
        },
        invitationMessage: '# You have been invited #',
        acceptMessage: 'Thank you {{user}} for accepting this invitation',
        declineMessage: 'You have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)
    expect(screen.getByRole('radio', { name: 'No' })).toBeChecked()
    await waitFor(() => {
      userEvent.click(screen.getByRole('radio', { name: 'Yes' }))
      userEvent.click(screen.getByRole('button', { name: 'Accept' }))
    })
    await waitFor(() => {
      expect(
        screen.getByText('Thank you test@email.com for accepting this invitation')
      ).toBeVisible()
      expect(contentParam).toHaveBeenCalledWith(
        expect.objectContaining({ arbitrary_field: 'Yes' })
      )
      expect(postResponse).toHaveBeenCalledWith('/notes/edits', responseEditMock, {
        version: 2,
      })
    })
  })

  test('call api to post response when user accept with reduced load', async () => {
    responseEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'No' }, reduced_load: { value: 3 } } },
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
        allowAcceptWithReducedLoad: true,
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)

    await userEvent.click(screen.getByRole('button', { name: 'Accept (Reduced Load)' }))
    await waitFor(() => {
      expect(
        screen.getByText(
          'Please select the number of submissions that you would be comfortable reviewing.'
        )
      ).toBeVisible()
      expect(screen.getByRole('combobox')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('3'))
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(postResponse).toHaveBeenLastCalledWith(
      expect.anything(),
      responseEditMock,
      expect.anything()
    )
    expect(screen.getByText('You have requested a reduced load of 3 papers')).toBeVisible()
    expect(screen.getByText('Thank you for accepting this invitation')).toBeVisible()
  })

  test('call api to post response when user decline (no extra field)', async () => {
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
      expect(screen.getByText('You test@email.com have declined the invitation')).toBeVisible()
      expect(postResponse).toHaveBeenCalledWith('/notes/edits', responseEditMock, {
        version: 2,
      })
      expect(screen.queryByRole('button')).not.toBeInTheDocument() // invitation does not have content
    })
  })

  test('call api to post response when user decline (with extra field)', async () => {
    responseEditMock = {
      invitation: 'ICML.cc/2023/Conference/Area_Chairs/-/Recruitment',
      note: { content: { response: { value: 'No' }, arbitrary_field: { value: 'No' } } },
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
                submission_id: {
                  description: 'submission id',
                  value: {
                    param: {
                      type: 'string',
                      regex: '.*',
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
          submission_id: 'param value of submission id',
        },
        invitationMessage: '# You have been invited #',
        acceptMessage: 'Thank you for accepting this invitation',
        declineMessage: 'You {{user}} have declined the invitation',
        reducedLoadMessage:
          'If you chose to decline the invitation because the paper load is too high, you can request to reduce your load. You can request a reduced reviewer load below',
      },
    }

    renderWithWebFieldContext(<RecruitmentForm />, providerProps)

    await waitFor(() => {
      expect(screen.getByDisplayValue('param value of submission id')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByDisplayValue('param value of submission id'), ' modified')
    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))
    await waitFor(() => {
      expect(screen.getByText('You test@email.com have declined the invitation')).toBeVisible()
      expect(contentParam).toHaveBeenCalledWith(
        expect.objectContaining({ submission_id: 'param value of submission id modified' })
      )
      expect(postResponse).toHaveBeenCalledWith('/notes/edits', responseEditMock, {
        version: 2,
      })
      expect(screen.queryByRole('button')).not.toBeInTheDocument() // invitation does not have comment field in content
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
      expect(screen.getByText('You have declined the invitation')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
    })

    await userEvent.type(screen.getByRole('textbox'), 'some comment')

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(postResponse).toHaveBeenLastCalledWith(
      expect.anything(),
      responseUpdateEditMock,
      expect.anything()
    )
    expect(screen.getByText('You have declined the invitation')).toBeVisible()
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
      ).toBeVisible()
      expect(screen.getByRole('button', { name: 'Request a reduced load' })).toBeVisible()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Request a reduced load' }))
    expect(screen.getByText('Reduced Load')).toBeVisible()
    expect(
      screen.getByText(
        'Please select the number of submissions that you would be comfortable reviewing.'
      )
    ).toBeVisible()
    expect(screen.getByRole('combobox')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible()

    // go back to reduced load link
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Request a reduced load' })).toBeVisible()

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
    expect(screen.getByText('You have requested a reduced load of 3 papers')).toBeVisible()
    expect(screen.getByText('Thank you for accepting this invitation')).toBeVisible()
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
    expect(screen.getByRole('button', { name: 'Request a reduced load' })).toBeVisible()
    expect(screen.getByRole('textbox')).toBeVisible()
    expect(screen.queryByText('test_field')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Request a reduced load' }))
    expect(screen.queryByText('test_field')).not.toBeInTheDocument()
  })
})
