import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextAreaWidget from '../components/EditorComponents/TextAreaWidget'
import { renderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

jest.mock('../hooks/useUser', () => () => ({ user: {} }))

jest.mock('../components/MarkdownPreviewTab', () => () => 'markdown preview tab')

jest.mock('../lib/utils', () => {
  const original = jest.requireActual('../lib/utils')
  return {
    ...original,
    getAutoStorageKey: jest.fn(() => 'some key'),
  }
})

describe('TextAreaWidget', () => {
  test('display textarea', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          abstract: {},
        },
      },
    }
    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    expect(screen.getByDisplayValue('')).toBeInTheDocument()
  })

  test('display markdown preview tab if markdown is true', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          abstract: {
            value: {
              param: {
                markdown: true,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    expect(screen.getByText('markdown preview tab')).toBeInTheDocument()
  })

  test('display mathjax warning if value contains formula', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          abstract: {
            value: {
              param: {
                markdown: true,
              },
            },
          },
        },
        value: '$\\\\$',
      },
    }

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    expect(screen.getByText('Learn more about adding LaTeX formulas', { exact: false })).toBeInTheDocument()
  })

  test('display char counter for min length', async () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          abstract: {
            value: {
              param: {
                minLength: 2,
                maxLength: 152,
              },
            },
          },
        },
        value: 'a',
        onChange: jest.fn(),
        clearError: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    const textarea = screen.getByDisplayValue('a')
    await userEvent.type(textarea, ' ')
    expect(screen.getByText('Additional characters required:')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  test('display char counter for max length', async () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          abstract: {
            value: {
              param: {
                minLength: 2,
                maxLength: 152,
              },
            },
          },
        },
        value: 'ab',
        onChange: jest.fn(),
        clearError: jest.fn(),
      },
    }

    providerProps.value.value = 'ab'
    providerProps.value.onChange = jest.fn()

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    const textarea = screen.getByDisplayValue('ab')
    await userEvent.type(textarea, ' ')
    expect(screen.getByText('Characters remaining:')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  test('not to display char counter when there is no maxLength or maxLength is 0', async () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          abstract: {
            value: {
              param: {
                minLength: undefined,
                maxLength: undefined,
              },
            },
          },
        },
        value: 'ab',
        onChange: jest.fn(),
        clearError: jest.fn(),
      },
    }

    providerProps.value.value = 'ab'
    providerProps.value.onChange = jest.fn()

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  test('display char counter for over max length', async () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          abstract: {
            value: {
              param: {
                minLength: 2,
                maxLength: 3,
              },
            },
          },
        },
        value: 'abcd',
        onChange: jest.fn(),
        clearError: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    const textarea = screen.getByDisplayValue('abcd')
    await userEvent.type(textarea, ' ')
    expect(screen.getByText('Characters remaining:')).toHaveClass('danger')
    expect(screen.getByText('-1')).toBeInTheDocument()
  })

  test('read saved value from localstroage', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          abstract: {
            value: {
              param: {
                type: 'string',
                maxLength: 5000,
                input: 'textarea',
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    const getItem = jest.fn(() => 'some saved value')
    Object.defineProperty(window, 'localStorage', {
      value: { getItem },
    })

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    expect(getItem).toHaveBeenCalledWith('some key')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'some saved value' })
    )
    expect(clearError).toHaveBeenCalled()
  })
})
