import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import Signatures from '../components/Signatures'

jest.mock('../lib/api-client')
import api from '../lib/api-client'

let mockUseUserHookValue
jest.mock('../hooks/useUser', () => {
  return () => mockUseUserHookValue
})

jest.mock('../components/EditorComponents/TagsWidget', () => () => <span>tags</span>)

beforeEach(() => {
  mockUseUserHookValue = {
    user: { profile: { id: '~Test_User1' }, id: '~Test_User1' },
    accessToken: 'some token',
  }
})

describe('Signatures', () => {
  test('display nothing if there is no field description', () => {
    const nullFieldDescription = null

    render(<Signatures fieldDescription={nullFieldDescription} />)

    expect(screen.queryByText('tags')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  test('display nothing if user has not logged in/expired', () => {
    mockUseUserHookValue = {}
    render(<Signatures fieldDescription={['${3/signatures}']} onChange={jest.fn()} />)

    expect(screen.queryByText('tags')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  test('display constant signatures as tags widget', () => {
    const constSignaturesFieldDescription = ['${3/signatures}']
    const onChange = jest.fn()

    render(
      <Signatures fieldDescription={constSignaturesFieldDescription} onChange={onChange} />
    )

    expect(screen.getByText('tags'))
    expect(onChange).toHaveBeenCalledWith({ type: 'const' })
  })

  test('display ~.* regex signatures as tags widget and call update', () => {
    const onChange = jest.fn()
    const currentUserFieldDescription = {
      param: {
        regex: '~.*',
      },
    }

    render(<Signatures fieldDescription={currentUserFieldDescription} onChange={onChange} />)

    expect(screen.getByText('tags'))
    expect(onChange).toBeCalledWith({ value: ['~Test_User1'], type: 'const' })
  })

  test('call v1 api if regex has pipe value', async () => {
    const onChange = jest.fn()
    const regexPipeFieldDescription = {
      param: {
        regex: '~.*|ICML.cc/2023/Conference/Program_Chairs',
      },
    }
    const apiGet = jest.fn(() => Promise.resolve({ groups: [{ id: 'some_test_group' }] }))
    api.get = apiGet

    render(<Signatures fieldDescription={regexPipeFieldDescription} onChange={onChange} />)

    await waitFor(() =>
      expect(apiGet).toBeCalledWith(
        expect.anything(),
        expect.objectContaining({ regex: expect.anything() }),
        expect.objectContaining({ version: 1 })
      )
    )
  })

  test('call v2 api if regex has no pipe value', async () => {
    const onChange = jest.fn()
    const regexNoPipeFieldDescription = {
      param: {
        regex: 'ICML.cc/2023/Conference/Program_Chairs',
      },
    }
    const apiGet = jest.fn(() => Promise.resolve({ groups: [{ id: 'some_test_group' }] }))
    api.get = apiGet

    render(<Signatures fieldDescription={regexNoPipeFieldDescription} onChange={onChange} />)

    await waitFor(() =>
      expect(apiGet).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ version: 2 })
      )
    )
  })

  test('throw error if regex call return 0 group', async () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const regexFieldDescription = {
      param: {
        regex: 'ICML.cc/2023/Conference/Program_Chairs',
      },
    }
    const apiGet = jest.fn(() => Promise.resolve({ groups: [] }))
    api.get = apiGet

    render(
      <Signatures
        fieldDescription={regexFieldDescription}
        onChange={onChange}
        onError={onError}
      />
    )

    await waitFor(() =>
      expect(onError).toBeCalledWith('You do not have permission to create a note')
    )
  })

  test('display tags widget if regex call return only 1 group', async () => {
    const onChange = jest.fn()
    const regexFieldDescription = {
      param: {
        regex: 'ICML.cc/2023/Conference/Program_Chairs',
      },
    }
    const apiGet = jest.fn(() => Promise.resolve({ groups: [{ id: 'some_test_group' }] }))
    api.get = apiGet

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getByText('tags'))
      expect(onChange).toBeCalledTimes(3)
      expect(onChange).toHaveBeenNthCalledWith(1, { loading: true })
      expect(onChange).toHaveBeenNthCalledWith(2, {
        value: ['some_test_group'],
        type: 'const',
      })
      expect(onChange).toHaveBeenNthCalledWith(3, { loading: false })
    })
  })

  test('display dropdown if regex call return multiple groups', async () => {
    const onChange = jest.fn()
    const regexFieldDescription = {
      param: {
        regex: 'ICML.cc/2023/Conference/Program_Chairs',
      },
    }
    const apiGet = jest.fn(() =>
      Promise.resolve({
        groups: [
          { id: 'some_test_group', members: ['~Test_User2', '~Test_User3'] },
          { id: '~Test_User2' },
        ],
      })
    )
    api.get = apiGet

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox'))
      expect(onChange).toHaveBeenNthCalledWith(2, { type: 'list' }) // 1,3 is loading state change
    })
    await userEvent.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group'))
      expect(screen.getByText('Test User'))
    })
  })

  test('display unique values if regex call return duplicated groups', async () => {
    const onChange = jest.fn()
    const regexFieldDescription = {
      param: {
        regex: 'ICML.cc/2023/Conference/Program_Chairs',
      },
    }
    const apiGet = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: 'some_test_group' }, { id: '~Test_User2' }, { id: 'some_test_group' }],
      })
    )
    api.get = apiGet

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await waitFor(() => expect(screen.getByRole('combobox')))
    await userEvent.click(screen.getByRole('combobox'))
    await waitFor(() => expect(screen.getAllByText('some_test_group')).toHaveLength(1))
  })

  test('display member of group if regex call return groups which has single tildeid member', async () => {
    const onChange = jest.fn()
    const regexFieldDescription = {
      param: {
        regex: 'ICML.cc/2023/Conference/Program_Chairs',
      },
    }
    const apiGet = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: 'some_test_group', members: ['~Test_User3'] }, { id: '~Test_User2' }],
      })
    )
    api.get = apiGet

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await waitFor(() => expect(screen.getByRole('combobox')))
    await userEvent.click(screen.getByRole('combobox'))
    await waitFor(() => expect(screen.getAllByText('some_test_group (Test User)')))
  })

  test('call update when user select a value from dropdown', async () => {
    const onChange = jest.fn()
    const regexFieldDescription = {
      param: {
        regex: 'ICML.cc/2023/Conference/Program_Chairs',
      },
    }

    api.get = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: 'option_1' }, { id: 'option_2' }, { id: 'option_3' }],
      })
    )

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await waitFor(() => expect(screen.getByRole('combobox')))
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option_2'))
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ value: ['option_2'] }))
  })

  test('display tags widget if enum group call returned single group', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: ['~.*'],
      },
    }
    const apiGet = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: 'some_test_group' }],
      })
    )
    api.get = apiGet

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getByText('tags'))
      expect(onChange).toBeCalledTimes(3)
      expect(onChange).toHaveBeenNthCalledWith(1, { loading: true })
      expect(onChange).toHaveBeenNthCalledWith(2, {
        value: ['some_test_group'],
        type: 'const',
      })
      expect(onChange).toHaveBeenNthCalledWith(3, { loading: false })
    })
  })

  test('call api with prefix if enum has regex', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: ['~.*'],
      },
    }
    const apiGet = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: 'some_test_group' }, { id: '~Test_User2' }],
      })
    )
    api.get = apiGet

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(apiGet).toBeCalledTimes(1)
      expect(apiGet).toBeCalledWith(
        expect.anything(),
        expect.objectContaining({ prefix: '~.*' }),
        expect.anything()
      )
      expect(screen.getByRole('combobox'))
    })
  })

  test('display dropdown if enum call return multiple groups', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: ['~.*', 'ICML.cc/2023/Conference/Program_Chairs'],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'some_test_group1' }] }
          : { groups: [{ id: 'some_test_group2' }] }
      )
    )
    api.get = apiGet

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox'))
      expect(onChange).toHaveBeenNthCalledWith(2, { type: 'list' })
    })
    await userEvent.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group1'))
      expect(screen.getByText('some_test_group2'))
    })
  })

  test('throw error is error is encounterd getting enum groups', async () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: ['~.*'],
      },
    }
    const apiGet = jest.fn(() => Promise.reject({ message: 'some api error occured' }))
    api.get = apiGet

    render(
      <Signatures
        fieldDescription={enumFieldDescription}
        onChange={onChange}
        onError={onError}
      />
    )

    await waitFor(() => {
      expect(onError).toBeCalledWith('some api error occured')
    })
  })

  test('remove duplcated values from enum groups results', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: ['~.*', 'ICML.cc/2023/Conference/Program_Chairs'],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'some_test_group1' }] }
          : { groups: [{ id: 'some_test_group1' }] }
      )
    )
    api.get = apiGet

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(apiGet).toBeCalledTimes(2)
      expect(screen.getByText('tags'))
    })
  })

  test('display member of group if enum call return groups which has single tildeid member', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: ['~.*', 'ICML.cc/2023/Conference/Program_Chairs'],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'some_test_group1' }] }
          : { groups: [{ id: 'some_test_group2', members: ['~Tilde_Id1'] }] }
      )
    )
    api.get = apiGet

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await waitFor(() => expect(screen.getByRole('combobox')))
    await userEvent.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group1'))
      expect(screen.getByText('some_test_group2 (Tilde Id)'))
    })
  })

  test('allow dropdown place holder text to be overwritten', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: ['~.*', 'ICML.cc/2023/Conference/Program_Chairs'],
      },
    }

    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'some_test_group1' }] }
          : { groups: [{ id: 'some_test_group2', members: ['~Tilde_Id1'] }] }
      )
    )
    api.get = apiGet

    render(
      <Signatures
        fieldDescription={enumFieldDescription}
        onChange={onChange}
        placeholder="dropdown Placeholder"
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Select Signature...')).not.toBeInTheDocument()
      expect(screen.getByText('dropdown Placeholder'))
    })
  })
})
