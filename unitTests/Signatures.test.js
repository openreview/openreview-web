import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Signatures from '../components/Signatures'
import api from '../lib/api-client'

let mockUseUserHookValue
let tagProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => mockUseUserHookValue)
jest.mock('../lib/api-client')
jest.mock('../components/EditorComponents/TagsWidget', () => (props) => {
  tagProps(props)
  return <span>tags</span>
})

beforeEach(() => {
  mockUseUserHookValue = {
    user: { profile: { id: '~Test_User1' }, id: '~Test_User1' },
    accessToken: 'some token',
  }
  tagProps = jest.fn()
})

// for note editor signatures will be single value array
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

    expect(screen.getByText('tags')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith({
      type: 'const',
      value: constSignaturesFieldDescription,
    })
  })

  test('display ~.* regex signatures as tags widget and call update', () => {
    const onChange = jest.fn()
    const currentUserFieldDescription = {
      param: {
        regex: '~.*',
      },
    }

    render(<Signatures fieldDescription={currentUserFieldDescription} onChange={onChange} />)

    expect(screen.getByText('tags')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith({ value: ['~Test_User1'], type: 'const' })
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
      expect(apiGet).toHaveBeenCalledWith(
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
      expect(apiGet).toHaveBeenCalledWith(
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
      expect(onError).toHaveBeenCalledWith('You do not have permission to create a note')
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
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(onChange).toHaveBeenCalledTimes(3)
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
    const user = userEvent.setup()

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(onChange).toHaveBeenNthCalledWith(2, { type: 'list' }) // 1,3 is loading state change
    })

    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
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
    const user = userEvent.setup()

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await user.click(await screen.findByRole('combobox'))
    expect(await screen.findAllByText('some_test_group')).toHaveLength(1)
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
    const user = userEvent.setup()

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await user.click(await screen.findByRole('combobox'))
    expect(await screen.findAllByText('some_test_group (Test User)')).toHaveLength(1)
  })

  test('display tags widget if enum group call returned single group', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: ['ICML.cc/2023/Conference/Submission5/Reviewer_.*'],
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
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith({ values: ['some_test_group'] })
      expect(onChange).toHaveBeenCalledTimes(3)
      expect(onChange).toHaveBeenNthCalledWith(1, { loading: true })
      expect(onChange).toHaveBeenNthCalledWith(2, {
        value: ['some_test_group'],
        type: 'const',
      })
      expect(onChange).toHaveBeenNthCalledWith(3, { loading: false })
    })
  })

  test('display tags widget if items group call returned single group', async () => {
    const onChange = jest.fn()
    const itemsFieldDescription = {
      param: {
        items: [
          {
            value: 'ICML.cc/2023/Conference/Submission5/Reviewer_.*',
            description: 'does not matter',
            optional: true,
          },
        ],
      },
    }
    const apiGet = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: 'some_test_group' }],
      })
    )
    api.get = apiGet

    render(<Signatures fieldDescription={itemsFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getByText('tags')).toBeInTheDocument()
      expect(tagProps).toHaveBeenCalledWith({ values: ['some_test_group'] })
      expect(onChange).toHaveBeenCalledTimes(3)
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
        enum: ['ICML.cc/2023/Conference/Submission5/Reviewer_.*'],
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
      expect(apiGet).toHaveBeenCalledTimes(1)
      expect(apiGet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ prefix: 'ICML.cc/2023/Conference/Submission5/Reviewer_.*' }),
        expect.anything()
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  test('call api with prefix if items has regex', async () => {
    const onChange = jest.fn()
    const itemsFieldDescription = {
      param: {
        items: [
          {
            prefix: 'ICML.cc/2023/Conference/Submission5/Reviewer_.*',
            description: 'yourself',
            optional: true,
          },
        ],
      },
    }
    const apiGet = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: 'some_test_group' }, { id: '~Test_User2' }],
      })
    )
    api.get = apiGet

    render(<Signatures fieldDescription={itemsFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledTimes(1)
      expect(apiGet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ prefix: 'ICML.cc/2023/Conference/Submission5/Reviewer_.*' }),
        expect.anything()
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  test('display dropdown if enum call return multiple groups (no default value)', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: [
          'ICML.cc/2023/Conference/Submission5/Reviewer_.*',
          'ICML.cc/2023/Conference/Program_Chairs',
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'ICML.cc/2023/Conference/Submission5/Reviewer_abc' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(onChange).toHaveBeenNthCalledWith(2, { type: 'list' })
    })
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(
        screen.getByText('ICML 2023 Conference Submission5 Reviewer abc')
      ).toBeInTheDocument()
      expect(screen.getByText('ICML 2023 Conference Program Chairs')).toBeInTheDocument()
    })
  })

  test('display dropdown if enum call return multiple groups (with default value)', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: [
          'ICML.cc/2023/Conference/Submission5/Reviewer_.*',
          'ICML.cc/2023/Conference/Program_Chairs',
        ],
        default: ['ICML.cc/2023/Conference/Program_Chairs'],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? {
              groups: [
                { id: 'ICML.cc/2023/Conference/Submission5/Reviewer_abc' },
                { id: 'ICML.cc/2023/Conference/Submission5/Reviewer_xyz' },
              ],
            }
          : { groups: [{ id: 'some_test_group2' }] }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(onChange).toHaveBeenNthCalledWith(2, {
        value: ['ICML.cc/2023/Conference/Program_Chairs'], // will trigger default value to be selected
        type: 'list',
      })
    })
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(
        screen.getByText('ICML 2023 Conference Submission5 Reviewer abc')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ICML 2023 Conference Submission5 Reviewer xyz')
      ).toBeInTheDocument()
    })
  })

  test('display dropdown if items call return multiple groups (no default value)', async () => {
    const onChange = jest.fn()
    const itemsFieldDescription = {
      param: {
        items: [
          { prefix: 'some_regex.*', description: 'some description', optional: true },
          {
            value: 'ICML.cc/2023/Conference/Program_Chairs',
            description: 'program chairs',
            optional: true,
          },
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'some_test_group1' }, { id: 'some_test_group2' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={itemsFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(onChange).toHaveBeenNthCalledWith(2, { type: 'list' })
    })
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group1')).toBeInTheDocument()
      expect(screen.getByText('some_test_group2')).toBeInTheDocument()
      expect(screen.getByText('ICML 2023 Conference Program Chairs')).toBeInTheDocument()
    })
  })

  test('display dropdown if items call return multiple groups (with default value)', async () => {
    const onChange = jest.fn()
    const itemsFieldDescription = {
      param: {
        items: [
          { prefix: '~.*', description: 'yourself', optional: true },
          {
            value: 'ICML.cc/2023/Conference/Program_Chairs',
            description: 'program chairs',
            optional: true,
          },
        ],
        default: ['ICML.cc/2023/Conference/Program_Chairs'],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'some_test_group1' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={itemsFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(onChange).toHaveBeenNthCalledWith(2, {
        value: ['ICML.cc/2023/Conference/Program_Chairs'],
        type: 'list',
      })
    })
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group1')).toBeInTheDocument()
      expect(screen.getByText('ICML 2023 Conference Program Chairs')).toBeInTheDocument()
    })
  })

  // for signatures, optional true and false does not make a difference
  // because this field is always mandatory and allows only 1 value
  test('display dropdown if items call return multiple groups (with mandatory value)', async () => {
    const onChange = jest.fn()
    const itemsFieldDescription = {
      param: {
        items: [
          { prefix: 'some regex', description: 'does not matter', optional: false },
          {
            value: 'ICML.cc/2023/Conference/Program_Chairs',
            description: 'program chairs',
            optional: true,
          },
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'some_test_group1' }, { id: 'some_test_group2' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={itemsFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(onChange).toHaveBeenNthCalledWith(2, {
        type: 'list',
      })
    })
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group1')).toBeInTheDocument()
      expect(screen.getByText('some_test_group2')).toBeInTheDocument()
      expect(screen.getByText('ICML 2023 Conference Program Chairs')).toBeInTheDocument()
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
      expect(onError).toHaveBeenCalledWith('some api error occured')
    })
  })

  test('remove duplcated values from enum groups results', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: [
          'ICML.cc/2023/Conference/Program_Chairs.*',
          'ICML.cc/2023/Conference/Program_Chairs',
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledTimes(2)
      expect(screen.getByText('tags')).toBeInTheDocument()
    })
  })

  test('remove duplcated values from items groups results', async () => {
    const onChange = jest.fn()
    const itemsFieldDescription = {
      param: {
        items: [
          {
            prefix: 'ICML.cc/2023/Conference/Program_Chairs.*',
            description: 'program chairs',
            optional: true,
          },
          {
            value: 'ICML.cc/2023/Conference/Program_Chairs',
            description: 'also program chairs',
            optional: true,
          },
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet

    render(<Signatures fieldDescription={itemsFieldDescription} onChange={onChange} />)

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledTimes(2)
      expect(screen.getByText('tags')).toBeInTheDocument()
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
          : {
              groups: [
                { id: 'ICML.cc/2023/Conference/Program_Chairs', members: ['~PC_TildeId1'] },
              ],
            }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await user.click(await screen.findByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group1')).toBeInTheDocument()
      expect(
        screen.getByText('ICML 2023 Conference Program Chairs (PC TildeId)')
      ).toBeInTheDocument()
    })
  })

  test('display member of group if items call return groups which has single tildeid member', async () => {
    const onChange = jest.fn()
    const itemsFieldDescription = {
      param: {
        items: [
          { prefix: '~.*', description: 'yourself', optional: true },
          {
            value: 'ICML.cc/2023/Conference/Program_Chairs',
            description: 'program chairs',
            optional: true,
          },
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'some_test_group1' }] }
          : {
              groups: [
                { id: 'ICML.cc/2023/Conference/Program_Chairs', members: ['~PC_TildeId1'] },
              ],
            }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={itemsFieldDescription} onChange={onChange} />)

    await user.click(await screen.findByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('some_test_group1')).toBeInTheDocument()
      expect(
        screen.getByText('ICML 2023 Conference Program Chairs (PC TildeId)')
      ).toBeInTheDocument()
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
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
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
      expect(screen.getByText('dropdown Placeholder')).toBeInTheDocument()
    })
  })

  test('call update when user select a value from dropdown (regex)', async () => {
    const onChange = jest.fn()
    const regexFieldDescription = {
      param: {
        regex: 'some_regex.*',
      },
    }

    api.get = jest.fn(() =>
      Promise.resolve({
        groups: [{ id: 'option_1' }, { id: 'option_2' }, { id: 'option_3' }],
      })
    )
    const user = userEvent.setup()

    render(<Signatures fieldDescription={regexFieldDescription} onChange={onChange} />)

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('option_2'))
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ value: ['option_2'] })
    })
  })

  test('call update when user select a value from dropdown (enum)', async () => {
    const onChange = jest.fn()
    const enumFieldDescription = {
      param: {
        enum: [
          'ICML.cc/2023/Conference/Submission5/Reviewer_.*',
          'ICML.cc/2023/Conference/Program_Chairs',
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'ICML.cc/2023/Conference/Submission5/Reviewer_abcd' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={enumFieldDescription} onChange={onChange} />)

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('ICML 2023 Conference Program Chairs'))
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        value: ['ICML.cc/2023/Conference/Program_Chairs'],
      })
    })
  })

  test('call update when user select a value from dropdown (items)', async () => {
    const onChange = jest.fn()
    const itemsFieldDescription = {
      param: {
        items: [
          {
            prefix: 'ICML.cc/2023/Conference/Submission5/Reviewer_.*',
            description: 'som reviewer',
            optional: true,
          },
          {
            value: 'ICML.cc/2023/Conference/Program_Chairs',
            description: 'program chairs',
            optional: true,
          },
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'ICML.cc/2023/Conference/Submission5/Reviewer_abcd' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(<Signatures fieldDescription={itemsFieldDescription} onChange={onChange} />)

    // await waitFor(() => expect(screen.getByRole('combobox')))

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('ICML 2023 Conference Program Chairs'))
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        value: ['ICML.cc/2023/Conference/Program_Chairs'],
      })
    })
  })

  test('call clearError when user update selection', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()

    const enumFieldDescription = {
      param: {
        enum: [
          'ICML.cc/2023/Conference/Submission5/Reviewer_.*',
          'ICML.cc/2023/Conference/Program_Chairs',
        ],
      },
    }
    const apiGet = jest.fn((_, body) =>
      Promise.resolve(
        body.prefix
          ? { groups: [{ id: 'ICML.cc/2023/Conference/Submission5/Reviewer_abcd' }] }
          : { groups: [{ id: 'ICML.cc/2023/Conference/Program_Chairs' }] }
      )
    )
    api.get = apiGet
    const user = userEvent.setup()

    render(
      <Signatures
        fieldDescription={enumFieldDescription}
        onChange={onChange}
        clearError={clearError}
      />
    )

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('ICML 2023 Conference Program Chairs'))
    await waitFor(() => {
      expect(clearError).toHaveBeenCalledTimes(1)
    })
  })
})
