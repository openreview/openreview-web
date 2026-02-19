import { screen, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import api from '../lib/api-client'
import GroupRestrictGroup from '../components/group/GroupRestrictGroup'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

global.promptMessage = jest.fn()
global.promptError = jest.fn()

beforeEach(() => {
  global.promptMessage = jest.fn()
  global.promptError = jest.fn()
})

describe('GroupRestrictGroup', () => {
  test('show restrict status, input and button (unrestricted)', async () => {
    api.get = jest.fn(() => Promise.resolve({ status: 'unrestricted' }))
    const setIsGroupRestricted = jest.fn()

    const props = {
      group: {
        id: 'some/conference',
      },
      setIsGroupRestricted,
    }
    render(<GroupRestrictGroup {...props} />)

    await waitFor(() => {
      expect(screen.getByText('Group Emergency Shutdown')).toBeInTheDocument()
      expect(screen.getByText('Type the group id to shut down this venue')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('some/conference')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Shut Down Venue' })).toBeDisabled()

      expect(setIsGroupRestricted).toHaveBeenCalledWith(false)
    })
  })

  test('show restrict status, input and button (restricted)', async () => {
    api.get = jest.fn(() => Promise.resolve({ status: 'restricted' }))
    const setIsGroupRestricted = jest.fn()

    const props = {
      group: {
        id: 'some/conference',
      },
      setIsGroupRestricted,
    }
    render(<GroupRestrictGroup {...props} />)

    await waitFor(() => {
      expect(screen.getByText('Group Emergency Shutdown')).toBeInTheDocument()
      expect(
        screen.getByText('Type the group id to lift emergency shutdown')
      ).toBeInTheDocument()
      expect(screen.getByPlaceholderText('some/conference')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Lift Emergency Shutdown' })).toBeDisabled()

      expect(setIsGroupRestricted).toHaveBeenCalledWith(true)
    })
  })

  test('call api to shutdown venue', async () => {
    api.get = jest.fn(() => Promise.resolve({ status: 'unrestricted' }))
    api.post = jest.fn(() => Promise.resolve({ status: 'ok' }))
    const setIsGroupRestricted = jest.fn()

    const props = {
      group: {
        id: 'some/conference',
      },
      setIsGroupRestricted,
    }
    render(<GroupRestrictGroup {...props} />)

    await waitFor(async () => {
      const venueIdInput = screen.getByPlaceholderText('some/conference')
      const shutdownButton = screen.getByRole('button', { name: 'Shut Down Venue' })

      await userEvent.type(venueIdInput, 'another/conference')
      expect(shutdownButton).toBeDisabled()

      await userEvent.clear(venueIdInput)
      await userEvent.type(venueIdInput, 'some/conference')
      expect(shutdownButton).toBeEnabled()

      await userEvent.click(shutdownButton)

      expect(api.post).toHaveBeenCalledWith('/domains/restriction', {
        domain: 'some/conference',
        action: 'restrict',
      })
      expect(global.promptMessage).toHaveBeenCalledWith(
        'Venue is now under emergency shutdown'
      )
    })
  })

  test('call api to lift shutdown', async () => {
    api.get = jest.fn(() => Promise.resolve({ status: 'restricted' }))
    api.post = jest.fn(() => Promise.resolve({ status: 'ok' }))

    const props = {
      group: {
        id: 'some/conference',
      },
      setIsGroupRestricted: jest.fn(),
    }
    render(<GroupRestrictGroup {...props} />)

    await waitFor(async () => {
      const venueIdInput = screen.getByPlaceholderText('some/conference')
      const shutdownButton = screen.getByRole('button', { name: 'Lift Emergency Shutdown' })

      await userEvent.type(venueIdInput, 'another/conference')
      expect(shutdownButton).toBeDisabled()

      await userEvent.clear(venueIdInput)
      await userEvent.type(venueIdInput, 'some/conference')
      expect(shutdownButton).toBeEnabled()

      await userEvent.click(shutdownButton)

      expect(api.post).toHaveBeenCalledWith('/domains/restriction', {
        domain: 'some/conference',
        action: 'unrestrict',
      })
      expect(global.promptMessage).toHaveBeenCalledWith('Emergency shutdown has been lifted')
    })
  })
})
