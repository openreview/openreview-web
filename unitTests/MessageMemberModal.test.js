import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessageMemberModal from '../components/group/MessageMemberModal'

let signaturesProps = null

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
global.$ = jest.fn(() => ({ on: jest.fn(), off: jest.fn() }))

jest.mock('../components/Signatures', () => (props) => {
  signaturesProps(props)
  return <div>Signature Select</div>
})

beforeEach(() => {
  signaturesProps = jest.fn()
})

describe('MessageMemberModal', () => {
  test('not to show signature tag/dropdown when message invitation is not specified', () => {
    const props = {
      groupId: 'test.conference/Authors',
      membersToMessage: ['~Test_User1'],
      messageMemberInvitation: undefined,
    }
    render(<MessageMemberModal {...props} />)
    expect(screen.queryByText('Signature')).not.toBeInTheDocument()
    expect(screen.queryByText('Signature Select')).not.toBeInTheDocument()
  })

  test('show signature tag/dropdown when message invitation is specified (const)', () => {
    const props = {
      groupId: 'test.conference/Authors',
      membersToMessage: ['~Test_User1'],
      messageMemberInvitation: {
        id: 'test.conference/-/Message',
        message: {
          signature: 'test.conference',
        },
      },
    }
    render(<MessageMemberModal {...props} />)
    expect(screen.getByText('Signature')).toBeInTheDocument()
    expect(screen.getByText('Signature Select')).toBeInTheDocument()
    expect(signaturesProps).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldDescription: 'test.conference',
      })
    )
  })

  test('show signature tag/dropdown when message invitation is specified (enum)', () => {
    const props = {
      groupId: 'test.conference/Authors',
      membersToMessage: ['~Test_User1'],
      messageMemberInvitation: {
        id: 'test.conference/-/Message',
        message: {
          signature: {
            param: { enum: ['test.conference', 'test.conference/Program_Chairs'] },
          },
        },
      },
    }
    render(<MessageMemberModal {...props} />)
    expect(screen.getByText('Signature')).toBeInTheDocument()
    expect(screen.getByText('Signature Select')).toBeInTheDocument()
    expect(signaturesProps).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldDescription: {
          param: { enum: ['test.conference', 'test.conference/Program_Chairs'] },
        },
      })
    )
  })
})
