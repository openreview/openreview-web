import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import VersionChecker from '../components/VersionChecker'
import { useDispatch, useSelector } from 'react-redux'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(() => ({ version: '1.0.0' })),
}))

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ version: '1.0.1' }),
  })
)

beforeEach(() => {
  global.generalPrompt = jest.fn()
})

describe('VersionChecker', () => {
  test('show prompt when server has newer version', async () => {
    render(<VersionChecker />)

    await waitFor(() => {
      expect(generalPrompt).toHaveBeenCalled()
    })
  })

  test('not to show prompt when server has the version as store', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' }),
      })
    )
    render(<VersionChecker />)

    await waitFor(() => {
      expect(generalPrompt).not.toHaveBeenCalled()
    })
  })

  test('set local store version when store has no version', async () => {
    const mockedDispatch = jest.fn()
    useSelector.mockReturnValue({ version: undefined })
    useDispatch.mockReturnValue(mockedDispatch)
    render(<VersionChecker />)

    await waitFor(() => {
      expect(mockedDispatch).toHaveBeenCalledWith({
        payload: { value: '1.0.0' },
        type: 'version/setVersion',
      })
      expect(generalPrompt).not.toHaveBeenCalled()
    })
  })
})
