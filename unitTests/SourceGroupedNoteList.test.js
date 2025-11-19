import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import SourceGroupedNoteList from '../components/SourceGroupedNoteList'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

jest.mock('../components/Note', () => ({
  __esModule: true,
  default: (props) => <span>NoteV1</span>,
  NoteV2: (props) => <span>NoteV2</span>,
}))

jest.mock('../components/NoteAuthors', () => ({
  NoteAuthorsV2: () => <div>NoteAuthorsV2</div>,
}))

jest.mock('../components/ClientForumDate', () => () => <span>client forum date</span>)

describe('SourceGroupedNoteList', () => {
  test('not to group v1 note', () => {
    const notes = [
      {
        id: 'note1',
        version: 1,
      },
      { id: 'note2', version: 1 },
      {
        id: 'note3',
        version: 2,
        invitations: ['DBLP.org/-/Record'],
        content: {
          title: { value: 'Some title' },
          authors: { value: ['Some author'] },
        },
      },
    ]
    render(<SourceGroupedNoteList notes={notes} />)

    expect(screen.getAllByText('NoteV1').length).toBe(2)
    expect(screen.getAllByText('NoteV2').length).toBe(1)
  })

  test('not to group note when title and authors do not match', () => {
    const notes = [
      {
        id: 'note1',
        version: 2,
        invitations: ['DBLP.org/-/Record'],
        content: {
          title: { value: 'Some title One' },
          authors: { value: ['Author One', 'Author Two'] },
        },
      },
      {
        id: 'note2',
        version: 2,
        invitations: ['DBLP.org/-/Record'],
        content: {
          title: { value: 'Some title Two' }, // same author but different title from note1
          authors: { value: ['Author One', 'Author Two'] }, // same title but different authors from note3
        },
      },
      {
        id: 'note3',
        version: 2,
        invitations: ['DBLP.org/-/Record'],
        content: {
          title: { value: 'Some title Two' },
          authors: { value: ['Author One', 'Author Two', 'Author Three'] },
        },
      },
    ]
    render(<SourceGroupedNoteList notes={notes} />)
    expect(screen.getAllByText('NoteV2').length).toBe(3)
  })

  test('show grouped notes and meta or first note by default', async () => {
    const notes = [
      {
        id: 'note1',
        version: 2,
        invitations: ['DBLP.org/-/Record'],
        content: {
          title: { value: 'Some title' },
          authors: { value: ['Author One', 'Author Two'] },
        },
        readers: ['everyone'],
      },
      {
        id: 'note2',
        version: 2,
        invitations: [`${process.env.SUPER_USER}/Public_Article/ORCID.org/-/Record`],
        content: {
          title: { value: 'Some title' },
          authors: { value: ['Author One', 'Author Two'] },
        },
        readers: ['Author One', 'Author Two'],
      },
    ]
    render(<SourceGroupedNoteList notes={notes} displayOptions={{}} />)

    expect(screen.queryByText('NoteV2')).not.toBeInTheDocument() // render MultiSourceNote instead of NoteV2
    expect(screen.getByText('Some title')).toBeInTheDocument()
    expect(screen.getByText('NoteAuthorsV2')).toBeInTheDocument()

    expect(screen.getByText('client forum date')).toBeInTheDocument() // meta of first (dblp) note
    expect(screen.getByText('DBLP Record')).toBeInTheDocument()

    // show dblp and orcid icons and buttons
    expect(screen.getByRole('img', { name: 'DBLP' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'ORCID' })).toBeInTheDocument()

    expect(screen.getAllByRole('button')[0]).toHaveClass('active') // first source button is active
    expect(screen.getAllByRole('button')[1]).not.toHaveClass('active')

    // click orcid should show orcid info
    await userEvent.click(screen.getAllByRole('button')[1])
    expect(screen.getByText('Public Article ORCID Record')).toBeInTheDocument()
    expect(screen.getAllByRole('button')[0]).not.toHaveClass('active') // first source button is active
    expect(screen.getAllByRole('button')[1]).toHaveClass('active')
  })
})
