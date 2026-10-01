import { screen, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImportedPublicationsSection from '../components/profile/ImportedPublicationsSection'
import api from '../lib/api-client'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

jest.mock('../lib/api-client', () => ({ getAll: jest.fn() }))

jest.mock('../components/NoteList', () => (props) => (
  <div>
    {props.notes.map((note) => (
      <span key={note.id}>{note.content.title.value}</span>
    ))}
  </div>
))

jest.mock('../components/PaginationLinks', () => () => <div>pagination</div>)

const aclNote = {
  id: 'aclNote',
  version: 2,
  invitations: [`${process.env.SUPER_USER}/Public_Article/ACL_Anthology.org/-/Record`],
  content: { title: { value: 'An ACL Anthology Paper' } },
}

describe('ImportedPublicationsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('list a publication imported from the ACL Anthology so it can be unlinked', async () => {
    api.getAll.mockImplementation((_, query) =>
      Promise.resolve(
        query.invitations?.includes(
          `${process.env.SUPER_USER}/Public_Article/ACL_Anthology.org/-/Record`
        )
          ? [aclNote]
          : []
      )
    )

    render(
      <ImportedPublicationsSection
        profileId="~Test_User1"
        updatePublicationIdsToUnlink={() => {}}
        reRender={1}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('An ACL Anthology Paper')).toBeInTheDocument()
    })
  })
})
