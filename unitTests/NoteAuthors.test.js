import { render, screen, waitFor } from '@testing-library/react'
import { NoteAuthorsV2 } from '../components/NoteAuthors'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

beforeEach(() => {
  api.get = jest.fn(() => Promise.resolve())
})

describe('NoteAuthorsV2', () => {
  // Reviewer can see forum note but not authors/authorids
  test('show signature when authors and authorIds are not visible', () => {
    render(
      <NoteAuthorsV2
        authors={undefined}
        authorIds={undefined}
        signatures={['test/conference/Submission1/Authors']}
        noteReaders={[
          'test/Conference',
          'test/Conference/Submission1/Reviewers',
          'test/Conference/Submission1/Authors',
        ]}
        showAuthorInstitutions
      />
    )
    expect(screen.getByText('Submission1 Authors')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  // object authors has no authorids field
  test('renders institutions when there are only authors', async () => {
    const authors = {
      value: [
        {
          fullname: 'First Last',
          username: '~First_Last1',
          institutions: [{ domain: 'test.domain', name: 'Test Domain' }],
        },
      ],
      readers: ['everyone'],
    }
    const { container } = render(
      <NoteAuthorsV2
        authors={authors}
        authorIds={undefined}
        noteReaders={['everyone']}
        showAuthorInstitutions
      />
    )
    await waitFor(() => {
      expect(container.querySelector('.note-authors-institutions')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'First Last' })).toBeInTheDocument()
      expect(screen.getByText(/Test Domain/)).toBeInTheDocument()
    })
  })

  test('consolidate domains that user entered which map to the same institution object', async () => {
    // both ustc.edu.cn and mail.ustc.edu.cn map to institution object ustc.edu
    // so they are consolidated and the fullname from institution object should be used
    api.get = jest.fn(() => ({
      institutions: [
        {
          id: 'ustc.edu',
          fullname: 'University of Science and Technology of China',
          domains: ['ustc.edu', 'ustc.edu.cn', 'mail.ustc.edu.cn'],
        },
        {
          id: 'umass.edu',
          fullname: 'University of Massachusetts at Amherst',
          domains: ['umass.edu'],
        },
      ],
    }))
    const authors = {
      value: [
        {
          fullname: 'Author One',
          username: '~Authro_One1',
          institutions: [
            { domain: 'test.domain', name: 'Test Domain' },
            { domain: 'umass.edu', name: 'UMASS' },
          ],
        },
        {
          fullname: 'Author Two',
          username: '~Authro_Two1',
          institutions: [
            {
              domain: 'mail.ustc.edu.cn',
              name: 'University of Science and Technology of China',
            },
            {
              domain: 'ustc.edu.cn',
              name: 'Some Other Name',
            },
          ],
        },
        {
          fullname: 'Author Three',
          username: '~Author_Three1',
          institutions: [
            {
              domain: 'ustc.edu.cn',
              name: 'University of Science and Technology of China',
            },
          ],
        },
      ],
      readers: ['everyone'],
    }
    const { container } = render(
      <NoteAuthorsV2
        authors={authors}
        authorIds={undefined}
        noteReaders={['everyone']}
        showAuthorInstitutions
      />
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/settings/institutions', {
        domains: ['test.domain', 'umass.edu', 'mail.ustc.edu.cn', 'ustc.edu.cn'],
      })

      expect(container.querySelectorAll('.note-authors-institutions>div')).toHaveLength(3) // test,umass,single ustc
      expect(screen.queryByText(/Some Other Name/)).not.toBeInTheDocument() // replaced by institution obj fullname
      expect(screen.queryByText(/ustc\.edu\.cn/)).not.toBeInTheDocument() // both replaced by institution id ustc.edu
      expect(screen.queryByText(/mail\.ustc\.edu\.cn/)).not.toBeInTheDocument()

      const authorTwo = screen.getByRole('link', { name: 'Author Two' })
      expect(authorTwo.nextSibling.textContent).toEqual('3') // no duplicated ustc

      const authorThree = screen.getByRole('link', { name: 'Author Three' })
      expect(authorThree.nextSibling.textContent).toEqual('3')
    })
  })

  test('skip institution consolidation when there are more than 20 unique domains', async () => {
    const authors = {
      value: Array.from({ length: 21 }, (_, i) => ({
        fullname: `Author ${i}`,
        username: `~Author_${i}1`,
        institutions: [{ domain: `domain${i}`, name: `Domain ${i}` }],
      })),
      readers: ['everyone'],
    }
    const { container } = render(
      <NoteAuthorsV2
        authors={authors}
        authorIds={undefined}
        noteReaders={['everyone']}
        showAuthorInstitutions
      />
    )

    await waitFor(() => {
      expect(container.querySelectorAll('.note-authors-institutions>div')).toHaveLength(21)
      expect(api.get).not.toHaveBeenCalled()
      expect(screen.getByText('Domain 20 (domain20)')).toBeInTheDocument()
    })
  })

  // email author added with object author schema has no profile link
  test('renders institution email author as plain text', () => {
    const authors = {
      value: [{ fullname: 'Custom Author', username: 'custom@author.com', institutions: [] }],
      readers: ['everyone'],
    }
    render(
      <NoteAuthorsV2
        authors={authors}
        authorIds={undefined}
        noteReaders={['everyone']}
        showAuthorInstitutions
      />
    )
    expect(screen.getByText('Custom Author')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('builds profile link with id param for ~ ids', () => {
    render(<NoteAuthorsV2 authors={['First Last']} authorIds={['~First_Last1']} />)
    expect(screen.getByRole('link', { name: 'First Last' })).toHaveAttribute(
      'href',
      '/profile?id=~First_Last1'
    )
  })

  test('builds profile link with email param for email ids', () => {
    render(<NoteAuthorsV2 authors={['First Last']} authorIds={['first.last@test.domain']} />)
    expect(screen.getByRole('link', { name: 'First Last' })).toHaveAttribute(
      'href',
      '/profile?email=first.last%40test.domain'
    )
  })

  test('builds external link for dblp ids', () => {
    render(
      <NoteAuthorsV2
        authors={['First Last']}
        authorIds={['https://dblp.org/pid/f/First_Last']}
      />
    )
    const link = screen.getByRole('link', { name: 'First Last' })
    expect(link).toHaveAttribute('href', 'https://dblp.org/pid/f/First_Last')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('deduplicates repeated (author, authorId) pairs', () => {
    render(
      <NoteAuthorsV2
        authors={['First Last', 'First Last']}
        authorIds={['~First_Last1', '~First_Last1']}
      />
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  test('unwraps .value from both authors and authorIds (v2 wrapper input)', () => {
    render(
      <NoteAuthorsV2
        authors={{ value: ['First Last'], readers: ['everyone'] }}
        authorIds={{ value: ['~First_Last1'], readers: ['everyone'] }}
        noteReaders={['everyone']}
      />
    )
    expect(screen.getByRole('link', { name: 'First Last' })).toHaveAttribute(
      'href',
      '/profile?id=~First_Last1'
    )
  })

  test('not to show eye icon when authorIds.readers matches noteReaders', () => {
    const { container } = render(
      <NoteAuthorsV2
        authors={{ value: ['First Last'], readers: ['everyone'] }}
        authorIds={{ value: ['~First_Last1'], readers: ['everyone'] }}
        noteReaders={['everyone']}
      />
    )
    expect(container.querySelector('.private-contents-icon')).not.toBeInTheDocument()
  })

  test('not to show eye icon when readers differ but include "everyone"', () => {
    const { container } = render(
      <NoteAuthorsV2
        authors={{ value: ['First Last'], readers: ['everyone'] }}
        authorIds={{ value: ['~First_Last1'], readers: ['everyone'] }}
        noteReaders={['test/Conference/Submission1/Reviewers', 'everyone']}
      />
    )
    expect(container.querySelector('.private-contents-icon')).not.toBeInTheDocument()
  })

  test('shows private label when readers differ', () => {
    const { container } = render(
      <NoteAuthorsV2
        authors={{ value: ['First Last'], readers: ['everyone'] }}
        authorIds={{
          value: ['~First_Last1'],
          readers: ['test/Conference/Submission1/Reviewers'],
        }}
        noteReaders={['everyone']}
      />
    )
    const icon = container.querySelector('.private-contents-icon')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute(
      'title',
      'Identities privately revealed to Conference Submission1 Reviewers'
    )
  })
})
