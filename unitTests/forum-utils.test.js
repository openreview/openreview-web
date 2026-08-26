import { getUniqueInstitutions } from '../lib/forum-utils'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('getUniqueInstitutions', () => {
  test('dedup author institutions by domain and drop institutions without domain', () => {
    const authors = [
      {
        fullname: 'Author One',
        institutions: [
          { domain: 'umass.edu', name: 'UMASS' },
          { name: 'No Domain Institution' },
        ],
      },
      { fullname: 'Author Two', institutions: [{ domain: 'umass.edu', name: 'UMass Amherst' }] },
      { fullname: 'Author Three', institutions: null },
    ]
    expect(getUniqueInstitutions(authors)).toEqual([{ domain: 'umass.edu', name: 'UMASS' }])
  })

  test('return empty list for missing or string authors', () => {
    expect(getUniqueInstitutions(undefined)).toEqual([])
    expect(getUniqueInstitutions(['First Last'])).toEqual([])
  })
})
