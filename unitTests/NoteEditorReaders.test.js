import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { NewNoteReaders } from '../components/NoteEditorReaders'
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

describe('NoteEditorReaders', () => {
  test('display nothing if user has not logged in', () => {
    mockUser = {}

    const { container } = render(
      <NewNoteReaders
        fieldDescription={['ICML.cc/2023/Conference', '${2/content/authorids/value}']}
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('list').childNodes[0].textContent).toEqual('Select All')
      expect(screen.getByRole('list').childNodes[1].textContent).toEqual('Everyone')
      expect(screen.getByRole('list').childNodes[2].textContent).toEqual('Test IdOne')
      expect(screen.getByRole('list').childNodes[3].textContent).toEqual('Test IdTwo')
      expect(screen.getByRole('list').childNodes[4].textContent).toEqual('Test IdThree')
    })
  })
})
