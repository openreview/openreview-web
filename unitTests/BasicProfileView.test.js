import { render, screen } from '@testing-library/react'
import BasicProfileView from '../components/profile/BasicProfileView'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

const profile = {
  id: '~Test_User1',
  preferredId: '~Test_User1',
  names: [{ fullname: 'Test User', username: '~Test_User1', preferred: true }],
  emails: [
    { email: 'test@umass.edu', confirmed: true, preferred: true },
    { email: 'test@gmail.com', confirmed: true, preferred: false },
  ],
  links: [],
  history: [],
  relations: [],
  expertise: [],
}

describe('BasicProfileView', () => {
  test('do not show the emails section to the profile owner', () => {
    render(<BasicProfileView profile={profile} publicProfile={false} serviceRoles={[]} />)

    expect(screen.queryByText('Emails')).not.toBeInTheDocument()
    expect(screen.queryByText('test@umass.edu')).not.toBeInTheDocument()
    expect(screen.queryByText('test@gmail.com')).not.toBeInTheDocument()
  })

  test('do not show the emails section in a public profile', () => {
    render(<BasicProfileView profile={profile} publicProfile={true} serviceRoles={[]} />)

    expect(screen.queryByText('Emails')).not.toBeInTheDocument()
    expect(screen.queryByText('test@umass.edu')).not.toBeInTheDocument()
    expect(screen.queryByText('test@gmail.com')).not.toBeInTheDocument()
  })

  test('show the verified icon only next to the verified institutions', () => {
    const profileWithHistory = {
      ...profile,
      history: [
        {
          position: 'PhD Student',
          institution: { name: 'University of Massachusetts', domain: 'umass.edu' },
          start: 2020,
          end: null,
          verified: true,
        },
        {
          position: 'Intern',
          institution: { name: 'Some Company', domain: 'company.com' },
          start: 2018,
          end: 2019,
        },
      ],
    }
    render(
      <BasicProfileView profile={profileWithHistory} publicProfile={true} serviceRoles={[]} />
    )

    expect(screen.getByText('University of Massachusetts')).toBeInTheDocument()
    expect(screen.getByText('Some Company')).toBeInTheDocument()
    const verifiedIcons = screen.getAllByLabelText('Verified institution')
    expect(verifiedIcons).toHaveLength(1)
    expect(
      screen.getByText('University of Massachusetts').closest('.ant-col')
    ).toContainElement(verifiedIcons[0])
  })

  test('show the emails in the moderation view', () => {
    render(<BasicProfileView profile={profile} moderation={true} serviceRoles={[]} />)

    expect(screen.getByText('Emails')).toBeInTheDocument()
    expect(screen.getByText('test@umass.edu')).toBeInTheDocument()
    expect(screen.getByText('test@gmail.com')).toBeInTheDocument()
  })
})
