import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { NewNoteReaders, NewReplyEditNoteReaders } from '../components/NoteEditorReaders'
import api from '../lib/api-client'

let mockUser
let tagProps
jest.mock('../hooks/useUser', () => () => mockUser)
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

    expect(screen.getByText('tags')).toBeInTheDocument()
    expect(tagProps).toHaveBeenCalledWith({
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

    expect(screen.getByText('tags')).toBeInTheDocument()
    expect(tagProps).toHaveBeenCalledWith({
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

    expect(getGroups).toHaveBeenCalledWith(
      expect.anything(),
      { regex: 'regex1.*|regex2.*' },
      expect.objectContaining({ version: 1 })
    )
    await waitFor(() =>
      expect(promptError).toHaveBeenCalledWith('You do not have permission to create a note')
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

    expect(getGroups).toHaveBeenCalledWith(
      expect.anything(),
      { prefix: 'regex1.*' },
      expect.objectContaining({ version: 2 })
    )
    await waitFor(() =>
      expect(promptError).toHaveBeenCalledWith('You do not have permission to create a note')
    )
  })

  test('show regex group results with everyone on top (both dropdown and checkbox)', async () => {
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
    const user = userEvent.setup()

    const { rerender } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      const dropdownList = screen.getByText('Everyone').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Everyone')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdOne')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[3].textContent).toEqual('Test IdThree')
    })

    rerender(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )
    await waitFor(() => {
      const checkboxContainer = screen.getByRole('checkbox', { name: 'Everyone' })
        .parentElement.parentElement.parentElement

      expect(checkboxContainer.childNodes[0].textContent).toEqual('Everyone')
      expect(screen.getByRole('checkbox', { name: 'Everyone' })).toHaveAttribute(
        'value',
        'everyone'
      )
      expect(checkboxContainer.childNodes[1].textContent).toEqual('Test IdOne')
      expect(screen.getByRole('checkbox', { name: 'Test IdOne' })).toHaveAttribute(
        'value',
        '~Test_IdOne1'
      )
      expect(checkboxContainer.childNodes[2].textContent).toEqual('Test IdTwo')
      expect(screen.getByRole('checkbox', { name: 'Test IdTwo' })).toHaveAttribute(
        'value',
        '~Test_IdTwo1'
      )
      expect(checkboxContainer.childNodes[3].textContent).toEqual('Test IdThree')
      expect(screen.getByRole('checkbox', { name: 'Test IdThree' })).toHaveAttribute(
        'value',
        '~Test_IdThree1'
      )
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
      expect(getGroups).toHaveBeenCalledTimes(2)
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
    const user = userEvent.setup()

    const { rerender } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).not.toHaveBeenCalled()
    })

    await user.click(screen.getByRole('combobox'))
    expect(screen.getAllByText('does not matter')).toHaveLength(2)

    rerender(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(getGroups).not.toHaveBeenCalled()
    })

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
      expect(getGroups).toHaveBeenCalledTimes(2)
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
      expect(getGroups).toHaveBeenCalledTimes(2)
      expect(promptError).toHaveBeenCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toHaveBeenCalled()
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
      expect(getGroups).toHaveBeenCalledTimes(2)
      expect(promptError).toHaveBeenCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toHaveBeenCalled()
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
      expect(getGroups).toHaveBeenCalledTimes(2)
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith(
        expect.objectContaining({ values: ['Test IdOne'] })
      )
      expect(onChange).toHaveBeenCalledWith(['~Test_IdOne1'])
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
    const user = userEvent.setup()

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
      expect(getGroups).toHaveBeenCalledTimes(2)
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith(
        expect.objectContaining({ values: ['description one'] })
      )
      expect(onChange).toHaveBeenCalledWith(['~Test_IdOne1'])
    })
  })

  test('show multiselect dropdown for enum values when useCheckboxWidget is not set', async () => {
    const getGroups = jest.fn(() =>
      Promise.resolve({
        groups: [
          { id: 'ICML.cc/2023/Conference/Submission5/Reviewer_abc' },
          { id: 'ICML.cc/2023/Conference/Submission5/Reviewer_xyz' },
        ],
      })
    )
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1', 'ICML.cc/2023/Conference/Submission5/Reviewer_.*'],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      const dropdownList = screen.getByText('Test IdOne').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Test IdOne')
      expect(dropdownList.childNodes[1].textContent).toEqual(
        'ICML 2023 Conference Submission5 Reviewer abc'
      )
      expect(dropdownList.childNodes[2].textContent).toEqual(
        'ICML 2023 Conference Submission5 Reviewer xyz'
      )
    })
  })

  test('show checkboxes for enum values when useCheckboxWidget is true', async () => {
    const getGroups = jest.fn(() =>
      Promise.resolve({
        groups: [
          { id: 'ICML.cc/2023/Conference/Submission5/Reviewer_abc' },
          { id: 'ICML.cc/2023/Conference/Submission5/Reviewer_xyz' },
        ],
      })
    )
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: ['~Test_IdOne1', 'ICML.cc/2023/Conference/Submission5/Reviewer_.*'],
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
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      const checkboxContainer = screen.getByRole('checkbox', { name: 'Test IdOne' })
        .parentElement.parentElement.parentElement
      expect(checkboxContainer.childNodes[0].textContent).toEqual('Test IdOne')
      expect(screen.getByRole('checkbox', { name: 'Test IdOne' })).toHaveAttribute(
        'value',
        '~Test_IdOne1'
      )
      expect(checkboxContainer.childNodes[1].textContent).toEqual(
        'ICML 2023 Conference Submission5 Reviewer abc'
      )
      expect(
        screen.getByRole('checkbox', { name: 'ICML 2023 Conference Submission5 Reviewer abc' })
      ).toHaveAttribute('value', 'ICML.cc/2023/Conference/Submission5/Reviewer_abc')
      expect(checkboxContainer.childNodes[2].textContent).toEqual(
        'ICML 2023 Conference Submission5 Reviewer xyz'
      )
      expect(
        screen.getByRole('checkbox', { name: 'ICML 2023 Conference Submission5 Reviewer xyz' })
      ).toHaveAttribute('value', 'ICML.cc/2023/Conference/Submission5/Reviewer_xyz')
    })
  })

  test('show dropdown for items values (no mandatory value) when useCheckboxWidget is not set', async () => {
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      const dropdownList = screen.getByText('test id one description').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('test id one description')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdThree')
      expect(screen.queryByText('does not matter')).not.toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  test('show checkboxes for items values (no mandatory value)', async () => {
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
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      const checkboxesContainer = screen.getByText('test id one description').parentElement
        .parentElement
      expect(checkboxesContainer.childNodes[0].textContent).toEqual('test id one description')
      expect(checkboxesContainer.childNodes[1].textContent).toEqual('Test IdTwo')
      expect(checkboxesContainer.childNodes[2].textContent).toEqual('Test IdThree')
      expect(screen.queryByText('does not matter')).not.toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  test('show dropdown for items values (with mandatory value) when useCheckboxWidget is not set', async () => {
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
                  value: '~Test_IdZero1',
                  description: undefined,
                  optional: true,
                },
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      const dropdownList = screen.getByText('test id one description').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Test IdZero')
      expect(dropdownList.childNodes[1].textContent).toEqual('test id one description')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[3].textContent).toEqual('Test IdThree')
      expect(screen.queryByText('does not matter')).not.toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled() // mandatory values are not handled specially
    })
  })

  test('show checkboxes for items values (with mandatory value) when useCheckboxWidget is true', async () => {
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
                  value: '~Test_IdZero1',
                  description: undefined,
                  optional: true,
                },
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
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      const checkboxContainer = screen.getByText('test id one description').parentElement
        .parentElement
      expect(checkboxContainer.childNodes[0].textContent).toEqual('Test IdZero')
      expect(checkboxContainer.childNodes[1].textContent).toEqual('test id one description')
      expect(checkboxContainer.childNodes[2].textContent).toEqual('Test IdTwo [Mandatory]') // mandatory values are marked with [Mandatory]
      expect(screen.getByRole('checkbox', { name: 'Test IdTwo [Mandatory]' })).toHaveAttribute(
        'value',
        '~Test_IdTwo1'
      )
      expect(checkboxContainer.childNodes[3].textContent).toEqual('Test IdThree [Mandatory]')
      expect(screen.queryByText('does not matter')).not.toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled() // mandatory values are not auto checked
    })
  })

  test('show dropdown for items values (with mandatory value and default value) when useCheckboxWidget is not set', async () => {
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdOne1']} // default has triggerd value change
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test id one description')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Remove test id one description' })
      ).toBeInTheDocument()
    })
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      const dropdownList = screen.getByText('Test IdTwo').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdThree')
      expect(screen.queryByText('does not matter')).not.toBeInTheDocument()
    })
  })

  test('show checkboxes for items values (with mandatory value and default value) when useCheckboxWidget is true', async () => {
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
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'test id one description' })).toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'Test IdTwo [Mandatory]' })
      ).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'Test IdThree [Mandatory]' })
      ).not.toBeChecked()
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test IdTwo')).toBeInTheDocument()
      expect(screen.queryByText('Test IdOne')).not.toBeInTheDocument()
      expect(screen.queryByText('Test IdThree')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Remove Test IdTwo' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(undefined))

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Test IdThree'))
    await waitFor(() =>
      expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdTwo1', '~Test_IdThree1'])
    )
  })

  test('set readers value in note editor when checkbox value is checked/unchecked (enum)', async () => {
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Test IdTwo' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Test IdOne' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Test IdThree' })).not.toBeChecked()
    })

    await user.click(screen.getByRole('checkbox', { name: 'Test IdTwo' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(undefined))

    await user.click(screen.getByRole('checkbox', { name: 'Test IdThree' }))
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
    const user = userEvent.setup()

    const { container } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test id two description')).toBeInTheDocument()
      expect(screen.queryByText('test id one description')).not.toBeInTheDocument()
      expect(screen.queryByText('test id three description')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Remove test id two description' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(undefined))

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('test id three description'))
    expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdTwo1', '~Test_IdThree1'])

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await user.click(clearButton)
    expect(onChange).toHaveBeenNthCalledWith(3, undefined)
  })

  test('set readers value in note editor when checkbox value is checked/unchecked (items no mandatory value)', async () => {
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    let testIdTwoCheckbox
    let testIdThreeCheckbox
    await waitFor(() => {
      testIdTwoCheckbox = screen.getByRole('checkbox', { name: 'test id two description' })
      testIdThreeCheckbox = screen.getByRole('checkbox', { name: 'test id three description' })

      expect(testIdTwoCheckbox).toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'test id one description' })
      ).not.toBeChecked()
      expect(testIdThreeCheckbox).not.toBeChecked()
    })

    await user.click(testIdTwoCheckbox)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(undefined))

    await user.click(testIdThreeCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdTwo1', '~Test_IdThree1'])
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
    const user = userEvent.setup()

    const { container } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test id two description')).toBeInTheDocument()
      expect(screen.queryByText('test id one description')).not.toBeInTheDocument()
      expect(screen.queryByText('test id three description')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Remove test id two description' })
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('test id three description'))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1', '~Test_IdThree1'])
    )

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await user.click(clearButton)
    expect(onChange).toHaveBeenNthCalledWith(2, undefined)
  })

  test('set readers value in note editor when checkbox value is checked/unchecked (items with mandatory value)', async () => {
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdThree1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    let testIdThreeCheckbox
    let testIdTwoCheckbox
    await waitFor(() => {
      testIdThreeCheckbox = screen.getByRole('checkbox', { name: 'test id three description' })
      testIdTwoCheckbox = screen.getByRole('checkbox', {
        name: 'test id two description [Mandatory]',
      })

      expect(testIdTwoCheckbox).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'test id one description' })
      ).not.toBeChecked()
      expect(testIdThreeCheckbox).toBeChecked()
    })

    await user.click(testIdTwoCheckbox)
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1', '~Test_IdThree1'])
    )

    await user.click(testIdThreeCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(2, undefined)
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
    const user = userEvent.setup()

    const { container } = render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1', '~Test_IdThree1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test id two description')).toBeInTheDocument()
      expect(screen.queryByText('test id one description')).not.toBeInTheDocument()
      expect(screen.getByText('test id three description')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Remove test id two description' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Remove test id three description' })
      ).toBeInTheDocument()
    })

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('test id one description'))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1', '~Test_IdThree1', '~Test_IdOne1'])
    )

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await user.click(clearButton)
    expect(onChange).toHaveBeenNthCalledWith(2, undefined)
  })

  test('set readers value in note editor when checkbox value is checked/unchecked (items with mandatory value and default value)', async () => {
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdTwo1', '~Test_IdThree1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    let testIdTwoCheckbox
    let testIdOneCheckbox
    let testIdThreeCheckbox
    await waitFor(() => {
      testIdTwoCheckbox = screen.getByRole('checkbox', {
        name: 'test id two description [Mandatory]',
      })
      testIdOneCheckbox = screen.getByRole('checkbox', { name: 'test id one description' })
      testIdThreeCheckbox = screen.getByRole('checkbox', { name: 'test id three description' })

      expect(testIdTwoCheckbox).toBeChecked()
      expect(testIdTwoCheckbox).not.toHaveAttribute('disabled')
      expect(testIdOneCheckbox).not.toBeChecked()
      expect(testIdThreeCheckbox).toBeChecked()
    })

    await user.click(testIdOneCheckbox)
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdThree1'])
    )

    await user.click(testIdTwoCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdThree1'])

    await user.click(testIdThreeCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(3, ['~Test_IdTwo1'])
  })

  test('call clearError when user update selection', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
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
    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        clearError={clearError}
      />
    )

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('Test IdThree'))
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(['~Test_IdThree1'])
      expect(clearError).toHaveBeenCalled()
    })
  })

  test('uncheck all other value when everyone is in options', async () => {
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
    const onChange = jest.fn()

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
        value={['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdThree1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    let everyoneCheckbox
    const user = userEvent.setup()
    await waitFor(() => {
      everyoneCheckbox = screen.getByRole('checkbox', { name: 'Everyone' })
    })

    await user.click(everyoneCheckbox)
    expect(onChange).toHaveBeenCalledWith(['everyone'])
  })

  test('uncheck other options when everyone is checked', async () => {
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
    const onChange = jest.fn()
    const clearError = jest.fn()

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

    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdThree1']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
        clearError={clearError}
      />
    )

    let testIdOneCheckbox
    let testIdTwoCheckbox
    let testIdThreeCheckbox
    let everyoneCheckbox
    await waitFor(() => {
      testIdOneCheckbox = screen.getByRole('checkbox', { name: 'Test IdOne' })
      testIdTwoCheckbox = screen.getByRole('checkbox', { name: 'Test IdTwo' })
      testIdThreeCheckbox = screen.getByRole('checkbox', { name: 'Test IdThree' })
      everyoneCheckbox = screen.getByRole('checkbox', { name: 'Everyone' })
    })

    expect(clearError).not.toHaveBeenCalled()
    expect(testIdOneCheckbox).toBeChecked()
    expect(testIdTwoCheckbox).toBeChecked()
    expect(testIdThreeCheckbox).toBeChecked()

    await user.click(everyoneCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(1, ['everyone'])
    expect(clearError).toHaveBeenCalledTimes(1)
  })

  test('uncheck everyone when another options is checked', async () => {
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
    const onChange = jest.fn()
    const clearError = jest.fn()

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

    const user = userEvent.setup()

    render(
      <NewNoteReaders
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['everyone']}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
        clearError={clearError}
      />
    )

    let testIdOneCheckbox
    let testIdTwoCheckbox
    let testIdThreeCheckbox
    let everyoneCheckbox
    await waitFor(() => {
      testIdOneCheckbox = screen.getByRole('checkbox', { name: 'Test IdOne' })
      testIdTwoCheckbox = screen.getByRole('checkbox', { name: 'Test IdTwo' })
      testIdThreeCheckbox = screen.getByRole('checkbox', { name: 'Test IdThree' })
      everyoneCheckbox = screen.getByRole('checkbox', { name: 'Everyone' })
    })

    expect(clearError).not.toHaveBeenCalled()
    expect(testIdOneCheckbox).not.toBeChecked()
    expect(testIdTwoCheckbox).not.toBeChecked()
    expect(testIdThreeCheckbox).not.toBeChecked()
    expect(everyoneCheckbox).toBeChecked()

    await user.click(testIdOneCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(1, ['~Test_IdOne1'])
    expect(clearError).toHaveBeenCalledTimes(1)
    await user.click(testIdTwoCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(2, ['~Test_IdTwo1'])
    expect(clearError).toHaveBeenCalledTimes(2)
    await user.click(testIdThreeCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(3, ['~Test_IdThree1'])
    expect(clearError).toHaveBeenCalledTimes(3)
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

  test('display const readers without reply (editing a note)', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith(
        expect.objectContaining({
          values: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
          ],
        })
      )
    })
  })

  test('display readers of replyToNote when first reader is ${{note.replyto}.readers}', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith(
        expect.objectContaining({
          values: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
          ],
        })
      )
    })
  })

  test('display const readers when replyToNote readers is everyone', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith(
        expect.objectContaining({
          values: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
          ],
        })
      )
    })
  })

  test('display const readers when it is the same as replyToNote readers', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith(
        expect.objectContaining({
          values: [
            'ICML.cc/2023/Conference/Program_Chairs',
            'ICML.cc/2023/Conference/Submission1/Area_Chairs',
            'ICML.cc/2023/Conference/Submission1/Reviewer_acbd',
          ],
        })
      )
    })
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

    expect(screen.getByText('tags')).toBeInTheDocument()
    expect(tagProps).toHaveBeenCalledWith(
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
    expect(promptError).toHaveBeenCalledWith(
      'Can not create note, readers must match parent note'
    )
  })

  test('display const readers when const readers is not a subset of replyToNote readers if reply to forum', () => {
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

    expect(screen.getByText('tags')).toBeInTheDocument()
    expect(tagProps).toHaveBeenCalledWith(
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

    expect(getGroups).toHaveBeenCalledWith(
      expect.anything(),
      { regex: 'regex1.*|regex2.*' },
      expect.objectContaining({ version: 1 })
    )
    await waitFor(() =>
      expect(promptError).toHaveBeenCalledWith('You do not have permission to create a note')
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

    expect(getGroups).toHaveBeenCalledWith(
      expect.anything(),
      { prefix: 'regex1.*' },
      expect.objectContaining({ version: 2 })
    )
    await waitFor(() =>
      expect(promptError).toHaveBeenCalledWith('You do not have permission to create a note')
    )
  })

  test('show regex group results with everyone on top (dropdown and checkbox)', async () => {
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
    const user = userEvent.setup()

    const { rerender } = render(
      <NewReplyEditNoteReaders
        replyToNote={null}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      const dropdownList = screen.getByText('Everyone').parentElement
      expect(dropdownList.childNodes[0].textContent).toEqual('Everyone')
      expect(dropdownList.childNodes[1].textContent).toEqual('Test IdOne')
      expect(dropdownList.childNodes[2].textContent).toEqual('Test IdTwo')
      expect(dropdownList.childNodes[3].textContent).toEqual('Test IdThree')
    })

    rerender(
      <NewReplyEditNoteReaders
        replyToNote={null}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      const checkboxContainer = screen.getByRole('checkbox', { name: 'Everyone' })
        .parentElement.parentElement.parentElement

      expect(checkboxContainer.childNodes[0].textContent).toEqual('Everyone')
      expect(screen.getByRole('checkbox', { name: 'Everyone' })).toHaveAttribute(
        'value',
        'everyone'
      )
      expect(checkboxContainer.childNodes[1].textContent).toEqual('Test IdOne')
      expect(screen.getByRole('checkbox', { name: 'Test IdOne' })).toHaveAttribute(
        'value',
        '~Test_IdOne1'
      )
      expect(checkboxContainer.childNodes[2].textContent).toEqual('Test IdTwo')
      expect(screen.getByRole('checkbox', { name: 'Test IdTwo' })).toHaveAttribute(
        'value',
        '~Test_IdTwo1'
      )
      expect(checkboxContainer.childNodes[3].textContent).toEqual('Test IdThree')
      expect(screen.getByRole('checkbox', { name: 'Test IdThree' })).toHaveAttribute(
        'value',
        '~Test_IdThree1'
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
      expect(getGroups).toHaveBeenCalledTimes(2)
      expect(promptError).toHaveBeenCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toHaveBeenCalled()
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
      expect(getGroups).toHaveBeenCalledTimes(2)
      expect(getGroups).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({ prefix: 'regex2.*' }),
        expect.anything()
      )
      expect(getGroups).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({ prefix: 'regex3' }),
        expect.anything()
      )
      expect(promptError).toHaveBeenCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toHaveBeenCalled()
    })
  })

  test('show tags when enum return 1 group, without default value, without replyToNote readers', async () => {
    const onChange = jest.fn()
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
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith({
        fieldNameOverwrite: 'Readers',
        values: ['Test IdOne'],
      })
      expect(onChange).toHaveBeenCalledWith(['~Test_IdOne1'])
    })
  })

  test('show tags when items return 1 group, without default value, without replyToNote readers', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: false,
                },
              ],
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
        onChange={onChange}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith(
        expect.objectContaining({ values: ['description of test id one'] })
      )
      expect(onChange).toHaveBeenCalledWith(['~Test_IdOne1'])
    })
  })

  test('show error when enum return 1 group, does not match with default value, without replyToNote readers', async () => {
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
      expect(promptError).toHaveBeenCalledWith('Default reader is not in the list of readers')
    })
  })

  test('show error when items return 1 group, does not match with default value, without replyToNote readers', async () => {
    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: false,
                },
              ],
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
      expect(promptError).toHaveBeenCalledWith('Default reader is not in the list of readers')
    })
  })

  test('show error when enum return multiple groups, does not match with default value, without replyToNote readers', async () => {
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
      expect(promptError).toHaveBeenCalledWith('Default reader is not in the list of readers')
    })
  })

  test('show error when items return multiple groups, does not match with default value, without replyToNote readers', async () => {
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
              items: [
                { prefix: 'regex', description: 'description of regex', optional: false },
              ],
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
      expect(promptError).toHaveBeenCalledWith('Default reader is not in the list of readers')
    })
  })

  test('show dropdown/checkbox when enum return multiple groups, with replyToNote readers includes everyone', async () => {
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
    const user = userEvent.setup()

    const { rerender } = render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IDFive1', 'everyone'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      expect(screen.getByText('Test IdOne').parentElement.childElementCount).toEqual(3)
    })

    rerender(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IDFive1', 'everyone'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(3)
    })
  })

  test('show dropdown/checkbox when items return multiple groups, with replyToNote readers includes everyone (no mandatory)', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: true,
                },
              ],
              default: ['~Test_IdOne1', '~Test_IdTwo1'],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    const { rerender } = render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IDFive1', 'everyone'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      expect(
        screen.getByText('description of test id one').parentElement.childElementCount
      ).toEqual(3)
    })

    rerender(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IDFive1', 'everyone'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(3)
    })
  })

  test('show dropdown when items return multiple groups, with replyToNote readers includes everyone (with mandatory)', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: false,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: true,
                },
              ],
              default: ['~Test_IdOne1'],
            },
          },
        },
      },
    }
    const user = userEvent.setup()
    const onChange = jest.fn()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IDFive1', 'everyone'], signatures: ['~Test_IDSix1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdOne1']} // triggered by onChange of default value
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Remove description of test id one' })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Remove description of test id two' }) // no special treatment of mandatory values
      ).not.toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    })

    await user.click(await screen.findByRole('combobox'))
    expect(
      screen.getByText('description of test id two').parentElement.childElementCount
    ).toEqual(2)
  })

  test('show checkbox when items return multiple groups, with replyToNote readers includes everyone (with mandatory)', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: false,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: true,
                },
              ],
              default: ['~Test_IdOne1'],
            },
          },
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IDFive1', 'everyone'], signatures: ['~Test_IDSix1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdOne1']} // triggered by onChange of default value
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(3)
      expect(
        screen.getByRole('checkbox', { name: 'description of test id one' })
      ).toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'description of test id two [Mandatory]' }) // no special treatment of mandatory values
      ).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'description of test id three' })
      ).not.toBeChecked()
    })
  })

  test('show dropdown/checkbox of enum groups,skip parentReaders logic when replyToNote is forumNote', async () => {
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
    const user = userEvent.setup()

    const { rerender } = render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        isDirectReplyToForum={true}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      expect(screen.getByText('Test IdTwo').parentElement.childElementCount).toEqual(3)
    })

    rerender(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        isDirectReplyToForum={true}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(3)
    })
  })

  test('show dropdown/checkbox of intersection of enum groups and replyToNote readers and auto select those values', async () => {
    const onChange = jest.fn()
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
    const user = userEvent.setup()

    const { rerender } = render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      expect(screen.getByText('Test IdTwo').parentElement.childElementCount).toEqual(1)
    })

    rerender(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(1)
    })
  })

  test('show dropdown of intersection of items groups(no mandatory no default) and replyToNote readers and auto select those values', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      expect(
        screen.getByText('description of test id two').parentElement.childElementCount
      ).toEqual(1)
      expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1'])
    })
  })

  test('show checkbox of intersection of items groups(no mandatory no default) and replyToNote readers and auto select those values', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(1)
    })
    expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1'])
  })

  test('show dropdown of intersection of items groups(with mandatory no default) and replyToNote readers and auto select those values', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: false,
                },
              ],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1'])
    })
  })

  test('show checkbox of intersection of items groups(with mandatory no default) and replyToNote readers and auto select those values', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: false,
                },
              ],
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
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1'])
    })
  })

  test('show dropdown of intersection of items groups(with mandatory with default) and replyToNote readers and auto select those values', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: false,
                },
              ],
              default: ['~Test_IdTwo1'],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByRole('combobox'))
    await waitFor(() => {
      expect(
        screen.getByText('description of test id two').parentElement.childElementCount
      ).toEqual(1)
      expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1'])
    })
  })

  test('show checkbox of intersection of items groups(with mandatory with default) and replyToNote readers and auto select those values', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: false,
                },
              ],
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
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(1)
      expect(
        screen.getByRole('checkbox', { name: 'description of test id two' })
      ).toBeInTheDocument()
      expect(onChange).toHaveBeenCalledWith(['~Test_IdTwo1'])
    })
  })

  test('show error when default is not in intersection of items groups(with mandatory with default) and replyToNote readers', async () => {
    const promptError = jest.fn()
    global.promptError = promptError

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: false,
                },
              ],
              default: ['~Test_IdOne1'], // intersection of replyToNote and items is ~Test_IdTwo1
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

    await waitFor(() => {
      expect(promptError).toHaveBeenCalledWith('Default reader is not in the list of readers')
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
  })

  test('show dropdown/checkbox of intersection of enum groups and replyToNote readers (adding anonymized reviewer group)', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: [
                'ICML.cc/2023/Conference/Submission1/Reviewers',
                'ICML.cc/2023/Conference/Submission1/Reviewer_abcd',
              ],
              default: ['ICML.cc/2023/Conference/Submission1/Reviewers'],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    const { rerender } = render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['ICML.cc/2023/Conference/Submission1/Reviewers'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
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

    rerender(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['ICML.cc/2023/Conference/Submission1/Reviewers'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(2)
      expect(screen.getAllByRole('checkbox')[0].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Reviewers'
      )
      expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute(
        'value',
        'ICML.cc/2023/Conference/Submission1/Reviewers'
      )
      expect(screen.getAllByRole('checkbox')[1].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Reviewer abcd'
      )
      expect(screen.getAllByRole('checkbox')[1]).toHaveAttribute(
        'value',
        'ICML.cc/2023/Conference/Submission1/Reviewer_abcd'
      )
    })
  })

  test('show dropdown/checkbox of intersection of enum groups with prefix and replyToNote readers (adding anonymized reviewer group)', async () => {
    const getGroups = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = getGroups

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: [
                'ICML.cc/2023/Conference/Submission1/Reviewers',
                'ICML.cc/2023/Conference/Submission1/Reviewer_.*',
                'ICML.cc/2023/Conference/Submission1/Authors',
              ],
              default: ['ICML.cc/2023/Conference/Submission1/Authors'],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    const { rerender } = render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: [
            'ICML.cc/2023/Conference/Submission1/Authors',
            'ICML.cc/2023/Conference/Submission1/Reviewer_abcd',
          ],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      const dropdownList = screen.getByText(
        'ICML 2023 Conference Submission1 Authors'
      ).parentElement
      expect(dropdownList.childElementCount).toEqual(2)
      expect(dropdownList.childNodes[0].textContent).toEqual(
        'ICML 2023 Conference Submission1 Authors'
      )
      expect(dropdownList.childNodes[1].textContent).toEqual(
        'ICML 2023 Conference Submission1 Reviewer abcd'
      )
    })

    rerender(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: [
            'ICML.cc/2023/Conference/Submission1/Authors',
            'ICML.cc/2023/Conference/Submission1/Reviewer_abcd',
          ],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(2)
      expect(screen.getAllByRole('checkbox')[0].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Authors'
      )
      expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute(
        'value',
        'ICML.cc/2023/Conference/Submission1/Authors'
      )
      expect(screen.getAllByRole('checkbox')[1].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Reviewer abcd'
      )
      expect(screen.getAllByRole('checkbox')[1]).toHaveAttribute(
        'value',
        'ICML.cc/2023/Conference/Submission1/Reviewer_abcd'
      )
    })
  })

  test('show dropdown/checkbox of intersection of enum groups and replyToNote readers (adding mismatching groups)', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              enum: [
                'ICML.cc/2023/Conference/Submission1/Authors',
                'ICML.cc/2023/Conference/Submission1/Action_Editors',
                'ICML.cc/2023/Conference/Submission1/Area_Chairs',
                'ICML.cc/2023/Conference/Submission1/Senior_Area_Chairs',
                'ICML.cc/2023/Conference/Submission1/Action_Editor_xcvb',
              ],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    const { rerender } = render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: [
            'ICML.cc/2023/Conference/Submission1/Authors',
            'ICML.cc/2023/Conference/Action_Editors',
            'ICML.cc/2023/Conference/Area_Chairs',
            'ICML.cc/2023/Conference/Senior_Area_Chairs',
          ],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      const dropdownList = screen.getByText(
        'ICML 2023 Conference Submission1 Authors'
      ).parentElement
      expect(dropdownList.childElementCount).toEqual(5)
      expect(dropdownList.childNodes[0].textContent).toEqual(
        'ICML 2023 Conference Submission1 Authors'
      )
      expect(dropdownList.childNodes[1].textContent).toEqual(
        'ICML 2023 Conference Submission1 Action Editors'
      )
      expect(dropdownList.childNodes[2].textContent).toEqual(
        'ICML 2023 Conference Submission1 Area Chairs'
      )
      expect(dropdownList.childNodes[3].textContent).toEqual(
        'ICML 2023 Conference Submission1 Senior Area Chairs'
      )
      expect(dropdownList.childNodes[4].textContent).toEqual(
        'ICML 2023 Conference Submission1 Action Editor xcvb'
      )
    })

    rerender(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: [
            'ICML.cc/2023/Conference/Submission1/Authors',
            'ICML.cc/2023/Conference/Action_Editors',
            'ICML.cc/2023/Conference/Area_Chairs',
            'ICML.cc/2023/Conference/Senior_Area_Chairs',
          ],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(5)
      expect(screen.getAllByRole('checkbox')[0].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Authors'
      )
      expect(screen.getAllByRole('checkbox')[1].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Action Editors'
      )
      expect(screen.getAllByRole('checkbox')[2].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Area Chairs'
      )
      expect(screen.getAllByRole('checkbox')[3].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Senior Area Chairs'
      )
      expect(screen.getAllByRole('checkbox')[4].nextSibling.textContent).toEqual(
        'ICML 2023 Conference Submission1 Action Editor xcvb'
      )
    })
  })

  test('show dropdown of intersection of items groups and replyToNote readers (adding anonymized reviewer group)', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: 'ICML.cc/2023/Conference/Submission1/Reviewer_abcd',
                  description: 'description of reviewer abcd',
                  optional: true,
                },
                {
                  value: 'ICML.cc/2023/Conference/Submission1/Reviewers',
                  description: 'description of reviewers',
                  optional: true,
                },
              ],
              default: ['ICML.cc/2023/Conference/Submission1/Reviewers'],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['ICML.cc/2023/Conference/Submission1/Reviewers'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByText('Select readers'))
    await waitFor(() => {
      const dropdownList = screen.getByText('description of reviewers').parentElement
      expect(dropdownList.childElementCount).toEqual(2)
      expect(dropdownList.childNodes[0].textContent).toEqual('description of reviewer abcd')
      expect(onChange).toHaveBeenCalledWith(['ICML.cc/2023/Conference/Submission1/Reviewers'])
    })
  })

  test('show checkbox of intersection of items groups and replyToNote readers (adding anonymized reviewer group)', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: 'ICML.cc/2023/Conference/Submission1/Reviewer_abcd',
                  description: 'description of reviewer abcd',
                  optional: true,
                },
                {
                  value: 'ICML.cc/2023/Conference/Submission1/Reviewers',
                  description: 'description of reviewers',
                  optional: true,
                },
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
        onChange={onChange}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(2)
      expect(
        screen.getByRole('checkbox', { name: 'description of reviewers' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'description of reviewer abcd' })
      ).toBeInTheDocument()
      expect(onChange).toHaveBeenCalledWith(['ICML.cc/2023/Conference/Submission1/Reviewers'])
    })
  })

  test('not to auto select parent readers if note is direct reply to forum (dropdown)', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: false,
                },
              ],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        isDirectReplyToForum={true}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByRole('combobox'))
    await waitFor(() => {
      expect(
        screen.getByText('description of test id two').parentElement.childElementCount
      ).toEqual(3) // also skip parent reader logic
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  test('not to auto check parent readers if note is direct reply to forum (checkbox)', async () => {
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: false,
                },
              ],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        isDirectReplyToForum={true}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(3)
      expect(
        screen.getByRole('checkbox', { name: 'description of test id one' })
      ).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'description of test id two' })
      ).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'description of test id three [Mandatory]' })
      ).not.toBeChecked()
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  test('call clearError when user update selection', async () => {
    const clearError = jest.fn()
    const onChange = jest.fn()
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: 'ICML.cc/2023/Conference/Submission1/AnonReviewer',
                  description: 'description of anon reviewer',
                  optional: true,
                },
                {
                  value: 'ICML.cc/2023/Conference/Submission1/Reviewers',
                  description: 'description of reviewers',
                  optional: true,
                },
              ],
              default: ['ICML.cc/2023/Conference/Submission1/Reviewers'],
            },
          },
        },
      },
    }
    const user = userEvent.setup()

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['ICML.cc/2023/Conference/Submission1/Reviewers'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={undefined}
        onChange={onChange}
        setLoading={jest.fn()}
        clearError={clearError}
        useCheckboxWidget={undefined}
      />
    )

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('description of reviewers'))
    await waitFor(() => {
      expect(clearError).toHaveBeenCalled()
    })
  })

  test('show inGroup group members when items include inGroup', async () => {
    const getInGroup = jest.fn(() =>
      Promise.resolve({
        groups: [
          { members: ['venue/Submission1/Reviewer_aaaa', 'venue/Submission1/Reviewer_bbbb'] },
        ],
      })
    )
    api.get = getInGroup

    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: 'venue/Submission1/Program_Chairs',
                  optional: true,
                },
                {
                  value: 'venue/Submission1/Area_Chairs',
                  optional: true,
                },
                {
                  inGroup: 'venue/Submission1/Reviewers',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={undefined}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={null} // triggered by onChange of default value
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toEqual(4)
      expect(
        screen.getByRole('checkbox', { name: 'Submission1 Program Chairs' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'Submission1 Area Chairs' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'Submission1 Reviewer aaaa' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'Submission1 Reviewer bbbb' })
      ).toBeInTheDocument()
    })
  })

  test('show warning when parent note signature is not in the list of readers', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{ readers: ['~Test_IdTwo1'], signatures: ['~Test_IdThree1'] }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdOne1', '~Test_IdTwo1']} // signature ~Test_IdThree1 is not selected
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByText("This reply won't be visible to the parent note author")
      ).toBeInTheDocument()
    })
  })

  test('no warning when parent note signature is anon role and readers contains role group', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: 'TMLR/Editors_In_Chief',
                  description: 'description of EIC',
                  optional: true,
                },
                {
                  value: 'TMLR/Paper1/Action_Editors',
                  description: 'description of Paper 1 AE',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: ['TMLR/Editors_In_Chief'],
          signatures: ['TMLR/Paper1/Action_Editor_1234'],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['TMLR/Paper1/Action_Editors']} // signature TMLR/Paper1/Action_Editor_1234 is not selected but the whole paper 1 AE group is selected
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(
        screen.queryByText("This reply won't be visible to the parent note author")
      ).not.toBeInTheDocument()
    })
  })

  test('no warning when everyone is selected', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: 'everyone',
                  optional: true,
                },
                {
                  value: 'TMLR/Editors_In_Chief',
                  description: 'description of EIC',
                  optional: true,
                },
                {
                  value: 'TMLR/Paper1/Action_Editors',
                  description: 'description of Paper 1 AE',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: ['everyone'], // replying to a public comment
          signatures: ['TMLR/Paper1/Action_Editor_1234'],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['everyone']} // parent reader is auto selected
        onChange={jest.fn()}
        setLoading={jest.fn()}
        useCheckboxWidget={true}
      />
    )

    await waitFor(() => {
      expect(
        screen.queryByText("This reply won't be visible to the parent note author")
      ).not.toBeInTheDocument()
    })
  })

  test('show warning when list of readers do not include all parent reply readers', async () => {
    const invitation = {
      edit: {
        note: {
          readers: {
            param: {
              items: [
                {
                  value: '~Test_IdOne1',
                  description: 'description of test id one',
                  optional: true,
                },
                {
                  value: '~Test_IdTwo1',
                  description: 'description of test id two',
                  optional: true,
                },
                {
                  value: '~Test_IdThree1',
                  description: 'description of test id three',
                  optional: true,
                },
                {
                  value: '~Test_IdFour1',
                  description: 'description of test id four',
                  optional: true,
                },
              ],
            },
          },
        },
      },
    }

    render(
      <NewReplyEditNoteReaders
        replyToNote={{
          readers: ['~Test_IdOne1', '~Test_IdTwo1', '~Test_IdThree1'],
          signatures: ['~Test_IdThree1'],
        }}
        fieldDescription={invitation.edit.note.readers}
        closeNoteEditor={jest.fn()}
        value={['~Test_IdOne1', '~Test_IdThree1', '~Test_IdFour1']} // reply reader ~Test_IdTwo1 is not selected
        onChange={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByText("This reply won't be visible to all the readers of the parent note")
      ).toBeInTheDocument()
    })
  })
})
