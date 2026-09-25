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
    const checkmark = screen.getByRole('img', { name: 'safety-certificate' })
    expect(checkmark).toHaveStyle({ color: 'rgb(63, 105, 120)' }) // agreeing badge
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
    const badges = screen.getAllByRole('img', { name: 'safety-certificate' })
    expect(badges).toHaveLength(2)
    expect(badges[0]).toHaveStyle({ color: 'rgb(63, 105, 120)' }) // agreeing badge
    expect(badges[1]).toHaveStyle({ color: 'rgb(140, 27, 19)' }) // missing badge
    await userEvent.hover(badges[1])
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Not listed in the profile')).toBeInTheDocument()
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
    const checkmark = screen.getByRole('img', { name: 'safety-certificate' })
    expect(checkmark).toHaveStyle({ color: 'rgb(63, 105, 120)' }) // agreeing badge
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
    expect(screen.getByText('January 01, 2001')).toBeInTheDocument()
    const badges = screen.getAllByRole('img', { name: 'safety-certificate' })
    expect(badges).toHaveLength(2) // next to the claimed dob and next to the asserted dob
    badges.forEach((badge) => expect(badge).toHaveStyle({ color: 'rgb(240, 173, 78)' }))
    await userEvent.hover(badges[1])
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Differs from the profile')).toBeInTheDocument()
    expect(within(popover).getByText('Driver License')).toBeInTheDocument()
  })

  test('render minor tag without parental consent details', () => {
    const now = new Date()
    const claimedDob = Date.UTC(now.getUTCFullYear() - 16, now.getUTCMonth(), now.getUTCDate()) // 16 years old

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
          tcdate: new Date('2023-01-01T00:00:00Z').getTime(),
        },
      ],
    }

    render(<BasicProfileView {...props} />)

    expect(screen.getByText('Minor')).toBeInTheDocument()
    // parental consent is not shown on the tag; it belongs in the relations section
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
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

    const checkmark = screen.getByRole('img', { name: 'safety-certificate' })
    expect(checkmark).toBeInTheDocument()
    expect(checkmark).toHaveStyle({ color: 'rgb(63, 105, 120)' }) // agreeing badge
    await userEvent.hover(checkmark)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
    expect(within(popover).getByText('Diploma')).toBeInTheDocument()
  })

  test('render history contradicting with edit', async () => {
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
            },
            start: 1999,
            end: 2000,
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
                  position: 'Intern',
                  institution: {
                    name: 'University of Massachusetts Amherst',
                    domain: 'umass.edu',
                  },
                  start: 1999,
                  end: 1999,
                },
              },
            },
          },
          content: { source: { value: 'Degree' } },
          signatures: ['~Some_Moderator1'],
          tcdate: profileEditCreationDate,
        },
      ],
    }

    render(<BasicProfileView {...props} />)

    screen.debug()

    // only the values that differ are shown under the profile record: the position and
    // the dates, not the institution name, which is matched by domain
    expect(screen.getByText('Intern')).toBeInTheDocument()
    expect(screen.queryByText('University of Massachusetts Amherst')).not.toBeInTheDocument()
    const badges = screen.getAllByRole('img', { name: 'safety-certificate' })
    expect(badges).toHaveLength(2) // one on the differing position, one on the differing dates
    badges.forEach((badge) => expect(badge).toHaveStyle({ color: 'rgb(240, 173, 78)' }))
    await userEvent.hover(badges[1])
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
    expect(within(popover).getByText('Degree')).toBeInTheDocument()
    expect(within(popover).getByText('Differs from the profile')).toBeInTheDocument()
  })

  test('render history confirmed by edit but removed by user', async () => {
    const profileEditCreationDate = new Date('2023-01-01T00:00:00Z').getTime()
    const props = {
      profile: {
        names: [],
        history: [
          {
            position: 'Researcher',
            institution: {
              name: 'Google',
              domain: 'google.com',
            },
            start: 2001,
            end: 2002,
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
                  position: 'Intern',
                  institution: {
                    name: 'UMass',
                    domain: 'umass.edu',
                  },
                  start: 1999,
                  end: 2000,
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

    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('UMass')).toBeInTheDocument() // asserted record no longer in profile
    const badge = screen.getByRole('img', { name: 'safety-certificate' })
    expect(badge).toHaveStyle({ color: 'rgb(140, 27, 19)' }) // missing badge
    await userEvent.hover(badge)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
    expect(within(popover).getByText('Diploma')).toBeInTheDocument()
    expect(within(popover).getByText('Not listed in the profile')).toBeInTheDocument()
  })
})

describe('Relations Section', () => {
  const profileEditCreationDate = new Date('2023-01-01T00:00:00Z').getTime()
  const consentEdit = {
    invitation: `${process.env.SUPER_USER}/Support/-/Parent_Consent`,
    profile: {
      content: {
        relations: {
          value: {
            relation: 'Parent',
            name: 'Gustavo Verified',
            email: 'gustavo@profile.org',
          },
        },
      },
    },
    content: { comment: { value: 'Consent form received' } },
    signatures: ['~Some_Moderator1'],
    tcdate: profileEditCreationDate,
  }

  test('show parental consent as its own row next to the listed relations', async () => {
    render(
      <BasicProfileView
        profile={{
          names: [],
          relations: [
            { relation: 'Advisor', name: 'Some Advisor', username: '~Some_Advisor1' },
          ],
        }}
        serviceRoles={[]}
        contentToShow={['relations']}
        profileEdits={[consentEdit]}
      />
    )

    expect(screen.getByText('Some Advisor')).toBeInTheDocument()
    expect(screen.getByText('Gustavo Verified')).toBeInTheDocument()
    const badge = screen.getByRole('img', { name: 'safety-certificate' }) // only on the consent row
    expect(badge).toHaveStyle({ color: 'rgb(63, 105, 120)' })
    await userEvent.hover(badge)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Parental consent')).toBeInTheDocument()
    expect(within(popover).getByText('Some Moderator')).toBeInTheDocument()
    expect(
      within(popover).getByText(formatDateTime(profileEditCreationDate))
    ).toBeInTheDocument()
    expect(within(popover).getByText('Consent form received')).toBeInTheDocument()
  })

  test('show parental consent as a relation row when the profile lists no relations', async () => {
    render(
      <BasicProfileView
        profile={{ names: [], relations: [] }}
        serviceRoles={[]}
        contentToShow={['relations']}
        profileEdits={[consentEdit]}
      />
    )

    expect(screen.queryByText('No relations added')).not.toBeInTheDocument()
    expect(screen.getByText('Parent')).toBeInTheDocument()
    expect(screen.getByText('Gustavo Verified')).toBeInTheDocument()
    expect(screen.getByText('gustavo@profile.org')).toBeInTheDocument()
    expect(screen.getByText('Present')).toBeInTheDocument()
    const badge = screen.getByRole('img', { name: 'safety-certificate' })
    expect(badge).toHaveStyle({ color: 'rgb(63, 105, 120)' })
    await userEvent.hover(badge)
    const popover = await screen.findByRole('tooltip')
    expect(within(popover).getByText('Parental consent')).toBeInTheDocument()
  })

  test('show empty message when there are neither relations nor consents', () => {
    render(
      <BasicProfileView
        profile={{ names: [], relations: [] }}
        serviceRoles={[]}
        contentToShow={['relations']}
      />
    )

    expect(screen.getByText('No relations added')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
