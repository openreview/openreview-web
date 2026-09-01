import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdentityDocumentsSection from '../components/profile/IdentityDocumentsSection'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/LoadingSpinner', () => () => <span>loading spinner</span>)
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  Image: { PreviewGroup: () => <span>preview</span> },
}))

describe('IdentityDocumentsSection', () => {
  test('show loading spinner when documents are being loaded', () => {
    const props = {
      profileDocuments: undefined,
    }

    render(<IdentityDocumentsSection {...props} />)
    expect(screen.getByText('loading spinner')).toBeInTheDocument()
  })

  test('show empty text when there are no documents', () => {
    const props = {
      profileDocuments: [],
    }

    render(<IdentityDocumentsSection {...props} />)
    expect(screen.queryByText('loading spinner')).not.toBeInTheDocument()
    expect(screen.getByText('No Identity Documents')).toBeInTheDocument()
  })

  test('show image preview', () => {
    const props = {
      profileDocuments: [
        {
          id: 'some id',
          type: 'identity',
          extension: 'pdf',
          filename: 'some name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
    }

    render(<IdentityDocumentsSection {...props} />)

    expect(screen.getByText('preview')).toBeInTheDocument()
  })

  test('show default deleteAllLabel when not passed', () => {
    const props = {
      profileDocuments: [
        {
          id: 'some id',
          type: 'identity',
          extension: 'pdf',
          filename: 'some name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      deleteAllLabel: undefined,
    }

    render(<IdentityDocumentsSection {...props} />)

    expect(
      screen.getByRole('button', { name: 'Delete All Identity Documents' })
    ).toBeInTheDocument()
  })

  test('allow custom deleteAllLabel', () => {
    const props = {
      profileDocuments: [
        {
          id: 'some id',
          type: 'identity',
          extension: 'pdf',
          filename: 'some name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      deleteAllLabel: 'Activate with ID check',
    }

    render(<IdentityDocumentsSection {...props} />)

    expect(screen.getByRole('button', { name: 'Activate with ID check' })).toBeInTheDocument()
  })

  test('show confirm window before deleting all documents', async () => {
    window.confirm = jest.fn()
    const props = {
      profileDocuments: [
        {
          id: 'some id',
          type: 'identity',
          extension: 'pdf',
          filename: 'some name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      deleteAllLabel: undefined,
    }

    render(<IdentityDocumentsSection {...props} />)

    const deleteButton = screen.getByRole('button', { name: 'Delete All Identity Documents' })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        `Identity documents of undefined will be deleted. This action cannot be undone.`
      )
    })
  })

  test('call beforeDelete, delete and afterDelete', async () => {
    window.confirm = jest.fn(() => true)
    beforeDelete = jest.fn()
    afterDelete = jest.fn()
    api.delete = jest.fn(() => Promise.resolve({ deletedCount: 1 }))
    loadIdentityDocuments = jest.fn()
    global.promptMessage = jest.fn()

    const props = {
      profileId: '~Test_Id1',
      profileDocuments: [
        {
          id: 'some id',
          type: 'identity',
          extension: 'pdf',
          filename: 'some name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      deleteAllLabel: undefined,
      onBeforeDeleteAll: beforeDelete,
      onAfterDeleteAll: afterDelete,
      loadIdentityDocuments: loadIdentityDocuments,
    }

    render(<IdentityDocumentsSection {...props} />)

    const deleteButton = screen.getByRole('button', { name: 'Delete All Identity Documents' })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(beforeDelete).toHaveBeenCalled()
      expect(api.delete).toHaveBeenCalledWith('/profile-documents/identity/profiles/~Test_Id1')
      expect(global.promptMessage).toHaveBeenCalledWith('1 document has been deleted')
      expect(loadIdentityDocuments).toHaveBeenCalled()
      expect(afterDelete).toHaveBeenCalled()
    })
  })
})
