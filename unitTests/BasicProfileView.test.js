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
    expect(checkmark).toHaveStyle({ color: 'rgb(92, 184, 92)' }) // green check
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

describe('DOB Section', () => {
  test('render check dob confirmed by edit', async () => {
    const claimedDob = new Date('2000-01-01T00:00:00Z').getTime()
    const profileEditCreationDate = new Date('2023-01-01T00:00:00Z').getTime()
    const props = {
      profile: { names: [], dob: claimedDob },
      serviceRoles: [],
      contentToShow: ['dob'],
      profileEdits: [
        {
          profile: {
            content: {
              dob: { value: claimedDob },
            },
          },
          content: { source: { value: 'Driver License' } },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
        },
        {
          profile: {
            content: {
              dob: { value: claimedDob },
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

    expect(screen.getByText(/January 01, 2000/)).toBeInTheDocument()
    const checkmark = screen.getByRole('img', { name: 'check' })
    expect(checkmark).toHaveStyle({ color: 'rgb(92, 184, 92)' }) // green check
    await userEvent.hover(checkmark)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
    expect(within(popover).getByText('Driver License')).toBeInTheDocument()
  })

  test('render dob asserted that is different from claimed dob', async () => {
    const claimedDob = new Date('2000-01-01T00:00:00Z').getTime()
    const assertedDob = new Date('2001-01-01T00:00:00Z').getTime()
    const profileEditCreationDate = new Date('2023-01-01T00:00:00Z').getTime()

    const props = {
      profile: { names: [], dob: claimedDob },
      serviceRoles: [],
      contentToShow: ['dob'],
      profileEdits: [
        {
          profile: {
            content: {
              dob: { value: assertedDob },
            },
          },
          content: { source: { value: 'Driver License' } },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
        },
      ],
    }

    render(<BasicProfileView {...props} />)

    expect(screen.getByText(/January 01, 2000/)).toBeInTheDocument()
    const checkmark = screen.getByRole('img', { name: 'check' })
    expect(checkmark).toHaveStyle({ color: 'rgb(240, 173, 78)' }) // contradicting check

    expect(screen.getByText('January 01, 2001')).toBeInTheDocument()
    const folderIcon = screen.getByRole('img', { name: 'folder' })
    await userEvent.hover(folderIcon)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Driver License')).toBeInTheDocument()
  })

  test('render parental consent for minor', async () => {
    const now = new Date()
    const claimedDob = Date.UTC(now.getUTCFullYear() - 16, now.getUTCMonth(), now.getUTCDate()) // 16 years old
    const profileEditCreationDate = new Date('2023-01-01T00:00:00Z').getTime()

    const props = {
      profile: { names: [], dob: claimedDob },
      serviceRoles: [],
      contentToShow: ['dob'],
      profileEdits: [
        {
          profile: {
            content: {
              relations: { value: 'Parent' }, // a parental consent profile edit
            },
          },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
        },
      ],
    }

    render(<BasicProfileView {...props} />)

    expect(screen.getByText('Minor'))
    const checkmark = within(screen.getByText('Minor').parentElement).getByRole('img', {
      name: 'check',
    }) // checkmark inside Minor tag
    expect(checkmark).toBeInTheDocument()

    await userEvent.hover(checkmark)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
  })
})

describe('History Section', () => {
  test('render history confirmed by edit', async () => {
    const profileEditCreationDate = new Date('2023-01-01T00:00:00Z').getTime()
    const props = {
      profile: {
        names: [],
        history: [
          {
            position: 'Researcher',
            institution: {
              name: 'UMass',
              domain: 'umass.edu',
              start: 1999,
              end: 2000,
            },
          },
        ],
      },
      serviceRoles: [],
      contentToShow: ['history'],
      profileEdits: [
        {
          profile: {
            content: {
              history: {
                value: {
                  position: 'Researcher',
                  institution: {
                    name: 'UMass',
                    domain: 'umass.edu',
                    start: 1999,
                    end: 2000,
                  },
                },
              },
            },
          },
          content: { source: { value: 'Diploma' } },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
        },
      ],
    }

    render(<BasicProfileView {...props} />)

    const checkmark = screen.getByRole('img', { name: 'check' })
    expect(checkmark).toBeInTheDocument()
    expect(checkmark).toHaveStyle({ color: 'rgb(92, 184, 92)' }) // green check
    await userEvent.hover(checkmark)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
    expect(within(popover).getByText('Diploma')).toBeInTheDocument()
  })
})
