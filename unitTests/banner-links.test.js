import { screen, render } from '@testing-library/react'
import { groupModeToggle } from '../lib/banner-links'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('banner-links', () => {
  test('show link to go to group info page from view page in groupModeToggle', () => {
    const mode = 'view'
    const groupId = 'ICML.cc/2024/Conference'

    render(groupModeToggle(mode, groupId))
    expect(screen.getByText('Currently showing group in View mode')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/group/info?id=ICML.cc/2024/Conference'
    )
    expect(screen.getByRole('link').textContent).toEqual('Edit Group Info')
  })

  test('show link to go back to group view page from info page in groupModeToggle', () => {
    const mode = 'info'
    const groupId = 'ICML.cc/2024/Conference'

    render(groupModeToggle(mode, groupId))
    expect(screen.getByText('Currently showing group in Info mode')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/group?id=ICML.cc/2024/Conference'
    )
    expect(screen.getByRole('link').textContent).toEqual('View Group')
  })

  test('show link to go to view group page from edit page in groupModeToggle', () => {
    const mode = 'edit'
    const groupId = 'ICML.cc/2024/Conference'

    render(groupModeToggle(mode, groupId))
    expect(screen.getByText('Currently showing group in Edit mode')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/group?id=ICML.cc/2024/Conference'
    )
    expect(screen.getByRole('link').textContent).toEqual('View Group')
  })

  test('show link to go to group info page from revisions page in groupModeToggle', () => {
    const mode = 'revisions'
    const groupId = 'ICML.cc/2024/Conference'

    render(groupModeToggle(mode, groupId))
    expect(screen.getByText('Currently showing group in Revisions mode')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/group/info?id=ICML.cc/2024/Conference'
    )
    expect(screen.getByRole('link').textContent).toEqual('Edit Group Info')
  })

  test('not to show anything when mode is invalid in groupModeToggle', () => {
    const mode = 'invalidMode'
    const groupId = 'ICML.cc/2024/Conference'

    const { container } = render(groupModeToggle(mode, groupId))
    expect(container).toBeEmptyDOMElement()
  })
})
