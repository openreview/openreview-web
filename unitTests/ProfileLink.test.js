import userEvent from '@testing-library/user-event'
import { screen, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import api from '../lib/api-client'
import ProfileLink from '../components/webfield/ProfileLink'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

beforeEach(() => {
  api.get = jest.fn()
  global.promptError = jest.fn()
  delete window.open
  window.open = jest.fn()
})

describe('ProfileLink', () => {
  test('show link to profile page when id is tilde id', () => {
    const props = {
      id: '~Test_User1',
      name: 'Test User',
    }
    render(<ProfileLink {...props} />)
    expect(screen.getByRole('link', { name: 'Test User' })).toHaveAttribute(
      'href',
      '/profile?id=~Test_User1'
    )
  })

  test('show plain text if id is not email', () => {
    const props = {
      id: 'some group id',
      name: 'Test User',
      preferredEmailInvitationId: 'preferredEmailInvitationId',
    }
    render(<ProfileLink {...props} />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  test('show plain text if id is email but no preferredEmailInvitationId', () => {
    const props = {
      id: 'test@user.email',
      name: 'Test User',
      preferredEmailInvitationId: undefined,
    }
    render(<ProfileLink {...props} />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  test('show link when id is email and has preferredEmailInvitationId', () => {
    const props = {
      id: 'test@user.email',
      name: 'Test User',
      preferredEmailInvitationId: 'preferredEmailInvitationId',
    }
    render(<ProfileLink {...props} />)
    expect(screen.getByRole('button', { name: 'Test User' })).toBeInTheDocument()
  })

  test('open profile page when tilded id can be found in edge', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        edges: [{ head: '~Test_User1' }],
      })
    )

    const props = {
      id: 'test@user.email',
      name: 'Test User',
      preferredEmailInvitationId: 'preferredEmailInvitationId',
    }
    render(<ProfileLink {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Test User' }))
    expect(api.get).toHaveBeenCalledWith('/edges', {
      invitation: 'preferredEmailInvitationId',
      tail: 'test@user.email',
    })
    expect(window.open).toHaveBeenCalledWith(
      '/profile?id=~Test_User1',
      '_blank',
      'noopener,noreferrer'
    )
  })

  test('show error when tilded id can not be found in edge', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        edges: [],
      })
    )

    const props = {
      id: 'test@user.email',
      name: 'Test User',
      preferredEmailInvitationId: 'preferredEmailInvitationId',
    }
    render(<ProfileLink {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Test User' }))
    expect(api.get).toHaveBeenCalledWith('/edges', {
      invitation: 'preferredEmailInvitationId',
      tail: 'test@user.email',
    })
    expect(global.promptError).toHaveBeenCalledWith('Profile is not available.')
    expect(window.open).not.toHaveBeenCalled()
  })

  test('show error when tilded id look up call failed', async () => {
    api.get = jest.fn(() => Promise.reject(new Error('some error from api')))

    const props = {
      id: 'test@user.email',
      name: 'Test User',
      preferredEmailInvitationId: 'preferredEmailInvitationId',
    }
    render(<ProfileLink {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Test User' }))
    expect(api.get).toHaveBeenCalledWith('/edges', {
      invitation: 'preferredEmailInvitationId',
      tail: 'test@user.email',
    })
    expect(global.promptError).toHaveBeenCalledWith('some error from api')
    expect(window.open).not.toHaveBeenCalled()
  })
})
