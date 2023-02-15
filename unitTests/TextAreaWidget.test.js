import TextAreaWidget from '../components/EditorComponents/TextAreaWidget'
import { renderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { prettyDOM } from '@testing-library/dom'
import '@testing-library/jest-dom'

jest.mock('../hooks/useUser', () => {
  return () => ({ user: {} })
})

jest.mock('../components/MarkdownPreviewTab', () => {
  return () => 'markdown preview tab'
})

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
          ['abstract']: {},
        },
      },
    }
    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    expect(screen.getByDisplayValue(''))
  })

  test('display markdown preview tab if markdown is true', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['abstract']: {
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
    expect(screen.getByText('markdown preview tab'))
  })

  test('display mathjax warning if value contains formula', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['abstract']: {
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
    expect(screen.getByText('Learn more about adding LaTeX formulas', { exact: false }))
  })

  test('display text counter for max length', async () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['abstract']: {
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
      },
    }

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    const textarea = screen.getByDisplayValue('a')
    await userEvent.type(textarea, ' ')
    expect(screen.getByText('Additional characters required:'))
    expect(screen.getByText('1'))
  })

  test('display text counter for max length', async () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['abstract']: {
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
      },
    }

    providerProps.value.value = 'ab'
    providerProps.value.onChange = jest.fn()

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    const textarea = screen.getByDisplayValue('ab')
    await userEvent.type(textarea, ' ')
    expect(screen.getByText('Characters remaining:'))
    expect(screen.getByText('150'))
  })

  test('display text counter for max length', async () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['abstract']: {
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
      },
    }

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    const textarea = screen.getByDisplayValue('abcd')
    await userEvent.type(textarea, ' ')
    expect(screen.getByText('Characters remaining:')).toHaveClass('danger')
    expect(screen.getByText('-1'))
  })

  test('read saved value from localstroage', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['abstract']: {
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
      },
    }

    const getItem = jest.fn(() => 'some saved value')
    Object.defineProperty(window, 'localStorage', {
      value: { getItem },
    })

    renderWithEditorComponentContext(<TextAreaWidget />, providerProps)
    expect(getItem).toBeCalledWith('some key')
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'some saved value' }))
  })
})
