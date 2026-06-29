import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import DocumentUploadSection from '../components/profile/DocumentUploadSection'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('../lib/api-client')
jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useTurnstileToken', () => () => ({}))

const selectFiles = (container, files) => {
  const fileInput = container.querySelector('input[type="file"]')
  fireEvent.change(fileInput, { target: { files } })
}

const clickUpload = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
}

const makeFile = (name) => new File(['bytes'], name, { type: 'application/pdf' })

beforeEach(() => {
  global.promptError = jest.fn()
  api.put = jest.fn(() => Promise.resolve({ url: 'test url' }))
})

describe('DocumentUploadSection', () => {
  test('does not upload until the upload button is clicked', async () => {
    const updateDocuments = jest.fn()
    const { container } = render(<DocumentUploadSection updateDocuments={updateDocuments} />)

    selectFiles(container, [makeFile('id.pdf')])

    await waitFor(() => {
      expect(screen.getByText('id.pdf')).toBeInTheDocument()
    })
    expect(api.put).not.toHaveBeenCalled()

    clickUpload()

    await waitFor(() => {
      expect(updateDocuments).toHaveBeenCalledWith(['test url'])
    })
    expect(api.put).toHaveBeenCalledTimes(1)
  })

  test('limits the number of files to 3', async () => {
    const updateDocuments = jest.fn()
    const { container } = render(<DocumentUploadSection updateDocuments={updateDocuments} />)

    selectFiles(container, [
      makeFile('a.pdf'),
      makeFile('b.pdf'),
      makeFile('c.pdf'),
      makeFile('d.pdf'),
    ])

    await waitFor(() => {
      expect(screen.getByText('c.pdf')).toBeInTheDocument()
    })
    expect(screen.queryByText('d.pdf')).not.toBeInTheDocument()

    clickUpload()

    await waitFor(() => {
      expect(updateDocuments).toHaveBeenCalledWith(['test url', 'test url', 'test url'])
    })
    expect(api.put).toHaveBeenCalledTimes(3)
    expect(updateDocuments.mock.calls.every(([value]) => value.length <= 3)).toBe(true)
  })

  test('rejects a file that is too large', async () => {
    const updateDocuments = jest.fn()
    const { container } = render(<DocumentUploadSection updateDocuments={updateDocuments} />)

    const file = makeFile('big.pdf')
    Object.defineProperty(file, 'size', { value: 1024 * 1000 * 5 + 1 })
    selectFiles(container, [file])

    await waitFor(() => {
      expect(global.promptError).toHaveBeenCalledWith(
        expect.stringContaining('File is too large.')
      )
    })
    expect(api.put).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
  })

  test('removes a file locally without any api call', async () => {
    const updateDocuments = jest.fn()
    const { container } = render(<DocumentUploadSection updateDocuments={updateDocuments} />)

    selectFiles(container, [makeFile('id.pdf')])

    await waitFor(() => {
      expect(screen.getByText('id.pdf')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'trash' }))

    await waitFor(() => {
      expect(screen.queryByText('id.pdf')).not.toBeInTheDocument()
    })
    expect(api.put).not.toHaveBeenCalled()
  })
})
