import { screen, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditSignatures from '../components/EditSignatures'

let signatureProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/Signatures', () => (props) => {
  signatureProps(props)
  return <span>Signature Component</span>
})

beforeEach(() => {
  signatureProps = jest.fn()
})

describe('EditSignatures', () => {
  test('display nothing if there is no field description', () => {
    const nullFieldDescription = null

    render(<EditSignatures fieldDescription={nullFieldDescription} />)

    expect(screen.queryByText('Signature Component')).not.toBeInTheDocument()
    expect(signatureProps).not.toHaveBeenCalled()
  })

  test('render "Signatures" field title and signatures component', () => {
    const fieldDescription = {
      param: {
        const: 'ICLR.cc/2025/Conference/Program_Chairs',
      },
    }
    render(<EditSignatures fieldDescription={fieldDescription} />)

    expect(screen.getByText('Signatures', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Signature Component')).toBeInTheDocument()
    expect(signatureProps).toHaveBeenCalledWith(expect.objectContaining({ fieldDescription }))
  })

  test('pass error to component header for display', () => {
    const fieldDescription = {
      param: {
        const: 'ICLR.cc/2025/Conference/Program_Chairs',
      },
    }
    const errors = [
      {
        fieldName: 'editSignatureInputValues',
        message: 'some test error',
      },
    ]
    render(<EditSignatures fieldDescription={fieldDescription} errors={errors} />)

    expect(screen.getByText('some test error')).toBeInTheDocument()
  })

  test('update loading state and value when receiving updates from signatures', () => {
    const fieldDescription = {
      param: {
        enum: ['ICLR.cc/2025/Conference/Program_Chairs'],
      },
    }
    const setLoading = jest.fn()
    const setEditorData = jest.fn()

    render(
      <EditSignatures
        fieldDescription={fieldDescription}
        setLoading={setLoading}
        setEditorData={setEditorData}
      />
    )

    signatureProps.mock.calls[0][0].onChange({ loading: true, value: 'test value' })
    expect(setLoading).toHaveBeenCalled()
    expect(setEditorData).toHaveBeenCalledWith({
      fieldName: 'editSignatureInputValues',
      value: 'test value',
    })
  })

  test('close editor when signatures component return error', () => {
    const fieldDescription = {
      param: {
        enum: ['ICLR.cc/2025/Conference/Program_Chairs'],
      },
    }
    const closeEditor = jest.fn()
    global.promptError = jest.fn()

    render(<EditSignatures fieldDescription={fieldDescription} closeEditor={closeEditor} />)

    signatureProps.mock.calls[0][0].onError('some error happened')
    expect(closeEditor).toHaveBeenCalled()
    expect(global.promptError).toHaveBeenCalledWith('some error happened')
  })
})
