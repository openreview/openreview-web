import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  IdentityDocumentsSection,
  ParentalConsentSection,
  ProfileDocumentsPreview,
} from '../components/profile/IdentityDocumentsSection'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/LoadingSpinner', () => () => <span>loading spinner</span>)
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  Image: { PreviewGroup: () => <span>preview</span> },
}))

describe('ProfileDocumentsPreview', () => {
  test('show loading spinner when documents are being loaded', () => {
    const props = {
      profileDocuments: undefined,
    }

    render(<ProfileDocumentsPreview {...props} />)
    expect(screen.getByText('loading spinner')).toBeInTheDocument()
  })

  test('show empty text when there are no documents', () => {
    const props = {
      profileDocuments: [],
    }

    render(<ProfileDocumentsPreview {...props} />)
    expect(screen.queryByText('loading spinner')).not.toBeInTheDocument()
    expect(screen.getByText('No Documents')).toBeInTheDocument()
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

    render(<ProfileDocumentsPreview {...props} />)

    expect(screen.getByText('preview')).toBeInTheDocument()
  })
})

describe('IdentityDocumentsSection', () => {
  test('not to show button when there are no documents', () => {
    const props = {
      profileDocuments: undefined,
    }

    render(<IdentityDocumentsSection {...props} />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  test('not to show button when all documents are deleted documents', () => {
    const props = {
      profileDocuments: [
        {
          id: 'some id',
          type: 'identity',
          extension: 'pdf',
          filename: 'some name',
          size: '12345',
          tcdate: 'test tcdate',
          ddate: 'some ddate',
        },
        {
          id: 'another id',
          type: 'identity',
          extension: 'pdf',
          filename: 'another name',
          size: '12345',
          tcdate: 'test tcdate',
          ddate: 'some ddate',
        },
      ],
    }

    render(<IdentityDocumentsSection {...props} />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  test('show delete documents button', () => {
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
        {
          id: 'another id',
          type: 'identity',
          extension: 'pdf',
          filename: 'another name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      isProfileActivatable: false, // for exmaple profile is already active
    }

    render(<IdentityDocumentsSection {...props} />)

    expect(screen.queryAllByRole('button')).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Delete Identity Documents' })
    ).toBeInTheDocument()
  })

  test('show delete documents and activate profile button', () => {
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
        {
          id: 'another id',
          type: 'identity',
          extension: 'pdf',
          filename: 'another name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      isProfileActivatable: true,
    }

    render(<IdentityDocumentsSection {...props} />)

    expect(screen.queryAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Delete Documents Only' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activate with ID check' })).toBeInTheDocument()
  })

  test('show confirm window before deleting all documents', async () => {
    window.confirm = jest.fn()
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
        {
          id: 'another id',
          type: 'identity',
          extension: 'pdf',
          filename: 'another name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      isProfileActivatable: false,
    }

    render(<IdentityDocumentsSection {...props} />)

    const deleteButton = screen.getByRole('button', { name: 'Delete Identity Documents' })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        `Identity documents of ~Test_Id1 will be deleted. This action cannot be undone.`
      )
    })
  })

  test('delete all documents when delete documents button is clicked', async () => {
    window.confirm = jest.fn(() => true)
    const loadIdentityDocuments = jest.fn()
    const tagAndActivateProfile = jest.fn()
    const loadTags = jest.fn()
    api.delete = jest.fn(() => Promise.resolve({ deletedCount: 1 }))
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
        {
          id: 'another id',
          type: 'identity',
          extension: 'pdf',
          filename: 'another name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      isProfileActivatable: true,
      loadIdentityDocuments,
      tagAndActivateProfile,
      loadTags,
    }

    render(<IdentityDocumentsSection {...props} />)

    const deleteButton = screen.getByRole('button', { name: 'Delete Documents Only' })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/profile-documents/identity/profiles/~Test_Id1')
      expect(global.promptMessage).toHaveBeenCalledWith('1 document has been deleted')
      expect(loadIdentityDocuments).toHaveBeenCalled()
      expect(tagAndActivateProfile).not.toHaveBeenCalled()
      expect(loadTags).not.toHaveBeenCalled()
    })
  })

  test('delete all documents and activate profile when activate with id check button is clicked', async () => {
    window.confirm = jest.fn(() => true)
    const loadIdentityDocuments = jest.fn()
    const tagAndActivateProfile = jest.fn()
    const loadTags = jest.fn()
    api.delete = jest.fn(() => Promise.resolve({ deletedCount: 1 }))
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
        {
          id: 'another id',
          type: 'identity',
          extension: 'pdf',
          filename: 'another name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
      isProfileActivatable: true,
      loadIdentityDocuments,
      tagAndActivateProfile,
      loadTags,
    }

    render(<IdentityDocumentsSection {...props} />)

    const activateWithIDCheckButton = screen.getByRole('button', {
      name: 'Activate with ID check',
    })
    await userEvent.click(activateWithIDCheckButton)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/profile-documents/identity/profiles/~Test_Id1')
      expect(global.promptMessage).toHaveBeenCalledWith('1 document has been deleted')
      expect(loadIdentityDocuments).toHaveBeenCalled()
      expect(tagAndActivateProfile).toHaveBeenCalled()
      expect(loadTags).toHaveBeenCalled()
    })
  })
})

describe('ParentalConsentSection', () => {
  test('show parental consent documents', () => {
    const props = {
      profileDocuments: [
        {
          id: 'some id',
          type: 'parentalConsent',
          extension: 'pdf',
          filename: 'some name',
          size: '12345',
          tcdate: 'test tcdate',
        },
      ],
    }

    render(<ParentalConsentSection {...props} />)

    expect(screen.getByText('preview')).toBeInTheDocument()
  })

  test('not to show identity documents', () => {
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

    render(<ParentalConsentSection {...props} />)

    expect(screen.queryByText('preview')).not.toBeInTheDocument()
  })
})
