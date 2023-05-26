import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { NewNoteReaders, NewReplyEditNoteReaders } from '../components/NoteEditorReaders'
import api from '../lib/api-client'

let mockUser
let tagProps
jest.mock('../hooks/useUser', () => {
  return () => mockUser
})
jest.mock('../components/EditorComponents/TagsWidget', () => (props) => {
  tagProps(props)
  return <span>tags</span>
})

beforeEach(() => {
  mockUser = { user: { id: '~Test_User1' }, accessToken: 'some token' }
  tagProps = jest.fn()
})

describe('NewNoteReaders', () => {
  test('display nothing if user has not logged in', () => {
    mockUser = {}

    const { container } = render(
      <NewNoteReaders
        fieldDescription={['ICML.cc/2023/Conference', '${2/content/authorids/value}']}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('display nothing if readers field does not exist', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/-/Submission',
      edit: {
        note: {
          readers: undefined,
        },
      },
    }
    const { container } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('display tags widget when readers is a const array', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/-/Submission',
      edit: {
        note: {
          readers: ['ICML.cc/2023/Conference', '${2/content/authorids/value}'],
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined} // const value does not need to be passed
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(screen.getByText('tags'))
    expect(tagProps).toBeCalledWith({
      fieldNameOverwrite: 'Readers',
      values: ['ICML.cc/2023/Conference', '${2/content/authorids/value}'],
    })
  })

  test('display tags widget when readers is a const array in param', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/-/Submission',
      edit: {
        note: {
          readers: {
            param: {
              const: ['ICML.cc/2023/Conference', '${2/content/authorids/value}'],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(screen.getByText('tags'))
    expect(tagProps).toBeCalledWith({
      fieldNameOverwrite: 'Readers',
      values: ['ICML.cc/2023/Conference', '${2/content/authorids/value}'],
    })
  })

  test('call api 1 to get groups when readers is regex with pipe', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              regex: 'regex1.*|regex2.*',
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(getGroups).toBeCalledWith(
      expect.anything(),
      { regex: 'regex1.*|regex2.*' },
      expect.objectContaining({ version: 1 })
    )
    await waitFor(() =>
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
    )
  })

  test('call api 2 to get groups when readers is regex without pipe', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              regex: 'regex1.*',
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(getGroups).toBeCalledWith(
      expect.anything(),
      { prefix: 'regex1.*' },
      expect.objectContaining({ version: 2 })
    )
    await waitFor(() =>
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
    )
  })

  test('show regex group results with everyone on top', async () => {
    const getGroups = jest.fn(() =>
      Promise.resolve({
        groups: [
          { id: '~Test_IdOne1' },
          { id: '~Test_IdTwo1' },
          { id: 'everyone' },
          { id: '~Test_IdThree1' },
        ],
      })
    )
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              regex: 'regex1.*',
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      const dropdownList = screen.getByText('Everyone').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Everyone')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdOne')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[3].textContent).toEqual('Test IdThree')
    })
  })

  test('call api to get groups when enum value contains .*', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1', 'regex1.*', '~Test_IdThree1', 'regex2.*'],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(getGroups).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        { prefix: 'regex1.*' },
        expect.anything()
      )
      expect(getGroups).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        { prefix: 'regex2.*' },
        expect.anything()
      )
    })
  })

  test('not to call api to get groups when items value contains .*', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                { value: '~Test_IdOne1', description: 'description one', optional: true },
                { value: 'regex1.*', description: 'does not matter', optional: true },
                { value: '~Test_IdThree1', description: 'description two', optional: true },
                { value: 'regex2.*', description: 'does not matter', optional: true },
              ],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).not.toBeCalled()
    })

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getAllByText('does not matter')).toHaveLength(2)
  })

  test('call api to get groups when items prefix (may or may not contains .*)', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                { value: '~Test_IdOne1', description: 'description one', optional: true },
                { prefix: 'regex1.*', description: 'does not matter', optional: true }, // with .*
                { value: '~Test_IdThree1', description: 'description two', optional: true },
                { prefix: 'regex2', description: 'does not matter', optional: true }, // without .*
              ],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(getGroups).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        { prefix: 'regex1.*' },
        expect.anything()
      )
      expect(getGroups).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        { prefix: 'regex2' },
        expect.anything()
      )
    })
  })

  test('show error if enum values have no matching group', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const closeNoteEditor = jest.fn()

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['regex1.*', 'regex2.*'],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={closeNoteEditor}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toBeCalled()
    })
  })

  test('show error if items values have no matching group', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const closeNoteEditor = jest.fn()

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                { prefix: 'regex1.*', description: 'does not matter', optional: true },
                { prefix: 'regex2', description: 'does not matter', optional: true },
              ],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={closeNoteEditor}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toBeCalled()
    })
  })

  test('show tags widget if enum values match only 1 group', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    const onChange = jest.fn()
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['regex1.*', '~Test_IdOne1', 'regex2.*'],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(screen.getByText('tags'))
      expect(tagProps).toBeCalledWith(expect.objectContaining({ values: ['Test IdOne'] }))
      expect(onChange).toBeCalledWith(['~Test_IdOne1'])
    })
  })

  test('show tags widget if items values match only 1 group', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    const onChange = jest.fn()
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                { prefix: 'regex1.*', description: 'does not matter', optional: true },
                { value: '~Test_IdOne1', description: 'description one', optional: true },
                { prefix: 'regex2', description: 'does not matter', optional: true },
              ],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(screen.getByText('tags'))
      expect(tagProps).toBeCalledWith(expect.objectContaining({ values: ['description one'] }))
      expect(onChange).toBeCalledWith(['~Test_IdOne1'])
    })
  })

  test('show multiselect dropdown for enum values', async () => {
    const getGroups = jest.fn(() =>
      Promise.resolve({ groups: [{ id: '~Test_IdTwo1' }, { id: '~Test_IdThree1' }] })
    )
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1', 'regex1.*'],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      const dropdownList = screen.getByText('Test IdOne').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Test IdOne')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdThree')
    })
  })

  test('show dropdown for items values (no mandatory value)', async () => {
    const getGroups = jest.fn(() =>
      Promise.resolve({ groups: [{ id: '~Test_IdTwo1' }, { id: '~Test_IdThree1' }] })
    )
    const onChange = jest.fn()
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'test id one description',
                  optional: true,
                },
                { prefix: 'regex1.*', description: 'does not matter', optional: true },
              ],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      const dropdownList = screen.getByText('test id one description').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('test id one description')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdThree')
      expect(screen.queryByText('does not matter')).not.toBeInTheDocument()
      expect(onChange).not.toBeCalled()
    })
  })

  test('show dropdown for items values (with mandatory value)', async () => {
    const getGroups = jest.fn(() =>
      Promise.resolve({ groups: [{ id: '~Test_IdTwo1' }, { id: '~Test_IdThree1' }] })
    )
    const onChange = jest.fn()
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'test id one description',
                  optional: true,
                },
                { prefix: 'regex1.*', description: 'does not matter', optional: false },
              ],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      const dropdownList = screen.getByText('test id one description').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('test id one description')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdThree')
      expect(screen.queryByText('does not matter')).not.toBeInTheDocument()
      expect(onChange).toBeCalledWith(['~Test_IdTwo1', '~Test_IdThree1'])
    })
  })

  test('show dropdown for items values (with mandatory value and default value)', async () => {
    const getGroups = jest.fn(() =>
      Promise.resolve({ groups: [{ id: '~Test_IdTwo1' }, { id: '~Test_IdThree1' }] })
    )
    const onChange = jest.fn()
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'test id one description',
                  optional: true,
                },
                { prefix: 'regex1.*', description: 'does not matter', optional: false },
              ],
              default: ['~Test_IdOne1'],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdOne1']} // default has triggerd value change
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test id one description')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Remove test id one description' })
      ).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('combobox'))
    await waitFor(() => {
      const dropdownList = screen.getByText('Test IdTwo').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdThree')
      expect(screen.queryByText('does not matter')).not.toBeInTheDocument()
    })
  })

  test('set readers value in note editor when dropdown value is changed (enum)', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdThree1'],
            },
          },
        },
      },
    }
    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1']}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test IdTwo'))
      expect(screen.queryByText('Test IdOne')).not.toBeInTheDocument()
      expect(screen.queryByText('Test IdThree')).not.toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Remove Test IdTwo' }))
    await waitFor(() => expect(onChange).toBeCalledWith(undefined))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('Test IdThree'))
    await waitFor(() =>
      expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdTwo1', '~Test_IdThree1'])
    )
  })

  test('set readers value in note editor when dropdown value is changed (items no mandatory value)', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'test id one description',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'test id two description',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'test id three description',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }
    const { container } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1']}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test id two description'))
      expect(screen.queryByText('test id one description')).not.toBeInTheDocument()
      expect(screen.queryByText('test id three description')).not.toBeInTheDocument()
    })

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove test id two description' })
    )
    await waitFor(() => expect(onChange).toBeCalledWith(undefined))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('test id three description'))
    expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdTwo1', '~Test_IdThree1'])

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await userEvent.click(clearButton)
    expect(onChange).toHaveBeenNthCalledWith(3, undefined)
  })

  test('set readers value in note editor when dropdown value is changed (items with mandatory value)', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'test id one description',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'test id two description',
                  optional: false,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'test id three description',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }
    const { container } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1']}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test id two description'))
      expect(screen.queryByText('test id one description')).not.toBeInTheDocument()
      expect(screen.queryByText('test id three description')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Remove test id two description' })
      ).not.toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('test id three description'))
    await waitFor(() => expect(onChange).toBeCalledWith(['~Test_IdTwo1', '~Test_IdThree1']))

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await userEvent.click(clearButton)
    expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdTwo1'])
  })

  test('set readers value in note editor when dropdown value is changed (items with mandatory value and default value)', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'test id one description',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'test id two description',
                  optional: false,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'test id three description',
                  optional: true,
                },
              ],
              default: ['~Test_IdThree1'],
            },
          },
        },
      },
    }
    const { container } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1', '~Test_IdThree1']}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test id two description'))
      expect(screen.queryByText('test id one description')).not.toBeInTheDocument()
      expect(screen.getByText('test id three description'))
      expect(
        screen.queryByRole('button', { name: 'Remove test id two description' })
      ).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Remove test id three description' }))
    })

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('test id one description'))
    await waitFor(() =>
      expect(onChange).toBeCalledWith(['~Test_IdTwo1', '~Test_IdThree1', '~Test_IdOne1'])
    )

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await userEvent.click(clearButton)
    expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdTwo1'])
  })
})

// reply to a note or editing existing note
describe('NewReplyEditNoteReaders', () => {
  test('display nothing if user has not logged in', () => {
    mockUser = {}

    const { container } = render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['ICML.cc/2023/Conference/Program_Chairs'] }}
        fieldDescription={['ICML.cc/2023/Conference', '${2/content/authorids/value}']}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('display nothing if readers field does not exist', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/Submission1/-/Official_Comment',
      edit: {
        note: {
          readers: undefined,
        },
      },
    }

    const { container } = render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['ICML.cc/2023/Conference/Program_Chairs'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('display const readers without reply (editing a note)', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/Submission1/-/Official_Comment',
      edit: {
        note: {
          readers: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
          ],
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={null}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(screen.getByText('tags'))
    expect(tagProps).toBeCalledWith(
      expect.objectContaining({
        values: [
          'ICML.cc/2023/Conference/Program_Chairs',
          'ICML.cc/2023/Conference/Submission1/Area_Chairs',
        ],
      })
    )
  })

  test('display readers of replyToNote when first reader is ${{note.replyto}.readers}', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/Submission1/-/Official_Comment',
      edit: {
        note: {
          readers: ['${{note.replyto}.readers}'],
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
          ],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(screen.getByText('tags'))
    expect(tagProps).toBeCalledWith(
      expect.objectContaining({
        values: [
          'ICML.cc/2023/Conference/Program_Chairs',
          'ICML.cc/2023/Conference/Submission1/Area_Chairs',
        ],
      })
    )
  })

  test('display const readers when replyToNote readers is everyone', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/Submission1/-/Official_Comment',
      edit: {
        note: {
          readers: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
          ],
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: ['everyone'],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(screen.getByText('tags'))
    expect(tagProps).toBeCalledWith(
      expect.objectContaining({
        values: [
          'ICML.cc/2023/Conference/Program_Chairs',
          'ICML.cc/2023/Conference/Submission1/Area_Chairs',
        ],
      })
    )
  })

  test('display const readers when it is the same as replyToNote readers', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/Submission1/-/Official_Comment',
      edit: {
        note: {
          readers: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
            'ICML.cc/2023/Conference/Submission1/Reviewer_acbd',
          ],
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
            'ICML.cc/2023/Conference/Submission1/Reviewers',
          ],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(screen.getByText('tags'))
    expect(tagProps).toBeCalledWith(
      expect.objectContaining({
        values: [
          'ICML.cc/2023/Conference/Program_Chairs',
          'ICML.cc/2023/Conference/Submission1/Area_Chairs',
          'ICML.cc/2023/Conference/Submission1/Reviewer_acbd',
        ],
      })
    )
  })

  test('display const readers when it is a subset of replyToNote readers', () => {
    const invitation = {
      id: 'ICML.cc/2023/Conference/Submission1/-/Official_Comment',
      edit: {
        note: {
          readers: ['ICML.cc/2023/Conference/Reviewer_abcd'],
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
            'ICML.cc/2023/Conference/Submission1/Senior_Area_Chairs',
            'ICML.cc/2023/Conference/Submission1/Reviewers',
          ],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(screen.getByText('tags'))
    expect(tagProps).toBeCalledWith(
      expect.objectContaining({
        values: ['ICML.cc/2023/Conference/Reviewer_abcd'],
      })
    )
  })

  test('display error when const readers is not a subset of replyToNote readers', () => {
    const promptError = jest.fn()
    global.promptError = promptError

    const invitationReaders = [
      'ICML.cc/2023/Conference', // diff
      'ICML.cc/2023/Conference/Submission1/Area_Chairs',
      'ICML.cc/2023/Conference/Submission1/Senior_Area_Chairs',
      'ICML.cc/2023/Conference/Submission1/Reviewers',
    ]
    const replyToNoteReaders = [
      'ICML.cc/2023/Conference/Program_Chairs', // diff
      'ICML.cc/2023/Conference/Submission1/Area_Chairs',
      'ICML.cc/2023/Conference/Submission1/Senior_Area_Chairs',
      'ICML.cc/2023/Conference/Submission1/Reviewers',
    ]

    const invitation = {
      id: 'ICML.cc/2023/Conference/Submission1/-/Official_Comment',
      edit: {
        note: {
          readers: invitationReaders,
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: replyToNoteReaders,
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        isDirectReplyToForum={false}
      />
    )

    expect(screen.queryByText('tags')).not.toBeInTheDocument()
    expect(promptError).toBeCalledWith('Can not create note, readers must match parent note')
  })

  test('display const readers when const readers is not a subset of replyToNote readers if reply to form', () => {
    const promptError = jest.fn()
    global.promptError = promptError

    const invitationReaders = [
      'ICML.cc/2023/Conference', // diff
      'ICML.cc/2023/Conference/Submission1/Area_Chairs',
      'ICML.cc/2023/Conference/Submission1/Senior_Area_Chairs',
      'ICML.cc/2023/Conference/Submission1/Reviewers',
    ]
    const replyToNoteReaders = [
      'ICML.cc/2023/Conference/Program_Chairs', // diff
      'ICML.cc/2023/Conference/Submission1/Area_Chairs',
      'ICML.cc/2023/Conference/Submission1/Senior_Area_Chairs',
      'ICML.cc/2023/Conference/Submission1/Reviewers',
    ]

    const invitation = {
      id: 'ICML.cc/2023/Conference/Submission1/-/Official_Comment',
      edit: {
        note: {
          readers: invitationReaders,
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: replyToNoteReaders,
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        isDirectReplyToForum={true}
      />
    )

    expect(screen.getByText('tags'))
    expect(tagProps).toBeCalledWith(
      expect.objectContaining({
        values: invitationReaders,
      })
    )
  })

  test('call api 1 to get groups when readers is regex with pipe', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              regex: 'regex1.*|regex2.*',
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={null}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(getGroups).toBeCalledWith(
      expect.anything(),
      { regex: 'regex1.*|regex2.*' },
      expect.objectContaining({ version: 1 })
    )
    await waitFor(() =>
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
    )
  })

  test('call api 2 to get groups when readers is regex without pipe', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              regex: 'regex1.*',
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={null}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    expect(getGroups).toBeCalledWith(
      expect.anything(),
      { prefix: 'regex1.*' },
      expect.objectContaining({ version: 2 })
    )
    await waitFor(() =>
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
    )
  })

  test('show regex group results with everyone on top', async () => {
    const getGroups = jest.fn(() =>
      Promise.resolve({
        groups: [
          { id: '~Test_IdOne1' },
          { id: '~Test_IdTwo1' },
          { id: 'everyone' },
          { id: '~Test_IdThree1' },
        ],
      })
    )
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              regex: 'regex1.*',
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={null}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      const dropdownList = screen.getByText('Everyone').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Everyone')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdOne')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[3].textContent).toEqual('Test IdThree')
    })
  })

  test('show error if enum values have no matching group', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const closeNoteEditor = jest.fn()

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['regex1.*', 'regex2.*'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={null}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={closeNoteEditor}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toBeCalled()
    })
  })

  test('show error if items values have no matching group', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const promptError = jest.fn()
    global.promptError = promptError

    const closeNoteEditor = jest.fn()

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                { value: 'regex1.*', description: 'does not matter', optional: true }, // no group call
                { prefix: 'regex2.*', description: 'does not matter', optional: true },
                { prefix: 'regex3', description: 'does not matter too', optional: true },
              ],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={null}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={closeNoteEditor}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toBeCalled()
    })
    fail()
  })

  test('show tags when enum return 1 group, without default value, without replyToNote readers ', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: undefined }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('tags'))
    })
  })

  test('show tags when items return 1 group, without default value, without replyToNote readers ', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: undefined }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('tags'))
    })
    fail()
  })

  test('show error when enum return 1 group, does not match with default value, without replyToNote readers ', async () => {
    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1'],
              default: ['~Test_IdOne1', '~Test_IdTwo1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: undefined }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(promptError).toBeCalledWith('Default reader is not in the list of readers')
    })
  })

  test('show error when items return 1 group, does not match with default value, without replyToNote readers ', async () => {
    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1'],
              default: ['~Test_IdOne1', '~Test_IdTwo1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: undefined }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(promptError).toBeCalledWith('Default reader is not in the list of readers')
    })
    fail()
  })

  test('show error when enum return multiple groups, does not match with default value, without replyToNote readers ', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: '~Test_IdOne1' }, { id: '~Test_IdTwo1' }, { id: '~Test_IdThree1' }],
      })
    )
    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['regex.*'],
              default: ['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdFour1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: undefined }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(promptError).toBeCalledWith('Default reader is not in the list of readers')
    })
  })

  test('show error when items return multiple groups, does not match with default value, without replyToNote readers ', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: '~Test_IdOne1' }, { id: '~Test_IdTwo1' }, { id: '~Test_IdThree1' }],
      })
    )
    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['regex.*'],
              default: ['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdFour1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: undefined }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(promptError).toBeCalledWith('Default reader is not in the list of readers')
    })
    fail()
  })

  test('show dropdown when enum return multiple groups, with replyToNote readers includes everyone', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdThree1'],
              default: ['~Test_IdOne1', '~Test_IdTwo1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IDFive1', 'everyone'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )
    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      expect(screen.getByText('Test IdOne').parentElement.childElementCount).toEqual(3)
    })
  })

  test('show dropdown when items return multiple groups, with replyToNote readers includes everyone', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdThree1'],
              default: ['~Test_IdOne1', '~Test_IdTwo1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IDFive1', 'everyone'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )
    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      expect(screen.getByText('Test IdOne').parentElement.childElementCount).toEqual(3)
    })
    fail()
  })

  test('show dropdown of intersection of enum groups and replyToNote readers', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdThree1'],
              default: ['~Test_IdTwo1'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      expect(screen.getByText('Test IdTwo').parentElement.childElementCount).toEqual(1)
    })
  })

  test('show dropdown of intersection of items groups(no mandatory no default) and replyToNote readers', async () => {
    fail()
  })

  test('show dropdown of intersection of items groups(with mandatory no default) and replyToNote readers', async () => {
    fail()
  })

  test('show dropdown of intersection of items groups(with mandatory with default) and replyToNote readers', async () => {
    fail()
  })

  test('show dropdown of intersection of enum groups and replyToNote readers (adding anonymized reviewer group)', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: [
                'ICML.cc/2023/Conference/Submission1/Reviewer_abcd',
                'ICML.cc/2023/Conference/Submission1/Reviewers',
              ],
              default: ['ICML.cc/2023/Conference/Submission1/Reviewers'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['ICML.cc/2023/Conference/Submission1/Reviewers'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      const dropdownList = screen.getByText(
        'ICML 2023 Conference Submission1 Reviewers'
      ).parentElement
      expect(dropdownList.childElementCount).toEqual(2)
      expect(dropdownList.childNodes[0].textContent).toEqual(
        'ICML 2023 Conference Submission1 Reviewers'
      )
      expect(dropdownList.childNodes[1].textContent).toEqual(
        'ICML 2023 Conference Submission1 Reviewer abcd'
      )
    })
  })

  test('show dropdown of intersection of enum groups and replyToNote readers (adding AnonReviewer group)', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: [
                'ICML.cc/2023/Conference/Submission1/AnonReviewer',
                'ICML.cc/2023/Conference/Submission1/Reviewers',
              ],
              default: ['ICML.cc/2023/Conference/Submission1/Reviewers'],
            },
          },
        },
      },
    }
    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['ICML.cc/2023/Conference/Submission1/Reviewers'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => userEvent.click(screen.getByText('Select readers')))
    await waitFor(() => {
      const dropdownList = screen.getByText(
        'ICML 2023 Conference Submission1 Reviewers'
      ).parentElement
      expect(dropdownList.childElementCount).toEqual(2)
      expect(dropdownList.childNodes[0].textContent).toEqual(
        'ICML 2023 Conference Submission1 Reviewers'
      )
      expect(dropdownList.childNodes[1].textContent).toEqual(
        'ICML 2023 Conference Submission1 AnonReviewer'
      )
    })
  })
})
