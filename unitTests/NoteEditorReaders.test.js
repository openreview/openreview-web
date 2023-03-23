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

  test('call api to get groups when enum value contains .*', async () => {
    const getGroups = jest.fn(() => Promise.resolve({}))
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={closeNoteEditor}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
    api.get = getGroups

    const setNoteEditorData = jest.fn()

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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={setNoteEditorData}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(screen.getByText('tags'))
      expect(tagProps).toBeCalledWith(expect.objectContaining({ values: ['~Test_IdOne1'] }))
    })
  })

  test('show dropdown for enum values', async () => {
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('list').childNodes[0].textContent).toEqual('Select All')
      expect(screen.getByRole('list').childNodes[1].textContent).toEqual('Test IdOne')
      expect(screen.getByRole('list').childNodes[2].textContent).toEqual('Test IdTwo')
      expect(screen.getByRole('list').childNodes[3].textContent).toEqual('Test IdThree')
    })
  })

  test('set readers value in note editor when dropdown value is checked/unchecked', async () => {
    const setNoteEditorData = jest.fn()
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{ noteReaderValues: ['~Test_IdTwo1'] }}
        setNoteEditorData={setNoteEditorData}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked() // 0 is select all checkbox
      expect(screen.getAllByRole('checkbox')[2]).toBeChecked()
      expect(screen.getAllByRole('checkbox')[3]).not.toBeChecked()
    })

    await userEvent.click(screen.getAllByRole('checkbox')[2])
    await waitFor(() =>
      expect(setNoteEditorData).toBeCalledWith(expect.objectContaining({ value: [] }))
    )
    await userEvent.click(screen.getAllByRole('checkbox')[3])
    await waitFor(() =>
      expect(setNoteEditorData).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ value: ['~Test_IdTwo1', '~Test_IdThree1'] })
      )
    )
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
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
      <NewReplyEditNoteReaders
        replyToNote={null}
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
      <NewReplyEditNoteReaders
        replyToNote={null}
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
        fieldName="noteReaderValues"
        closeNoteEditor={closeNoteEditor}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(getGroups).toBeCalledTimes(2)
      expect(promptError).toBeCalledWith('You do not have permission to create a note')
      expect(closeNoteEditor).toBeCalled()
    })
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('tags'))
    })
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(promptError).toBeCalledWith('Default reader is not in the list of readers')
    })
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(promptError).toBeCalledWith('Default reader is not in the list of readers')
    })
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('list').childElementCount).toEqual(4) // select all + 3 enum values
    })
  })

  test.only('show dropdown of intersection of enum groups and replyToNote readers', async () => {
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
        fieldName="noteReaderValues"
        closeNoteEditor={jest.fn()}
        noteEditorData={{}}
        setNoteEditorData={jest.fn()}
        setLoading={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('list').childElementCount).toEqual(4) // select all + 3 enum values
    })
  })
})
