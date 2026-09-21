import { screen, render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BasicProfileView from '../components/profile/BasicProfileView'
import { formatDateTime } from '../lib/utils'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('Names Section', () => {
  test('render check for names confirmed by edit', async () => {
    const profileEditCreationDate = new Date('2023-01-01T00:00:00Z').getTime()
    const props = {
      profile: { names: [{ fullname: 'Tést Name' }] },
      serviceRoles: [],
      contentToShow: ['names'],
      profileEdits: [
        {
          profile: {
            content: {
              fullname: { value: 'Test Name' },
            },
          },
          content: { source: { value: 'Student ID' } },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
        },
        {
          profile: {
            content: {
              fullname: { value: 'moderator typo Name' },
            },
          },
          content: { source: { value: 'Student ID' } },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
          ddate: 'some ddate',
        },
      ],
    }

    render(<BasicProfileView {...props} />)

    expect(screen.getByText('Tést Name', { exact: true })).toBeInTheDocument()
    const checkmark = screen.getByRole('img', { name: 'check' })
    await userEvent.hover(checkmark)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
    expect(within(popover).getByText('Student ID')).toBeInTheDocument()
  })

  test('render names confirmed by edit but removed by user', async () => {
    const profileEditCreationDate = new Date('2023-01-01T00:00:00Z').getTime()
    const props = {
      profile: { names: [{ fullname: 'Tést Name' }] },
      serviceRoles: [],
      contentToShow: ['names'],
      profileEdits: [
        {
          profile: {
            content: {
              fullname: { value: 'Test Name' },
            },
          },
          content: { source: { value: 'Student ID' } },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
        },
        {
          profile: {
            content: {
              fullname: { value: 'Some Funny Name User Removed' },
            },
          },
          content: { source: { value: 'some proof' } },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
        },
      ],
    }

    render(<BasicProfileView {...props} />)

    expect(screen.getByText('Some Funny Name User Removed')).toBeInTheDocument()
    const folderIcon = screen.getByRole('img', { name: 'folder' })
    await userEvent.hover(folderIcon)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
    expect(within(popover).getByText('some proof')).toBeInTheDocument()
  })
})
