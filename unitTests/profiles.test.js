import { formatProfileData } from '../lib/profiles'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('profiles', () => {
  test('not to fail when formatting profile with no email', () => {
    const apiProfileResponse = {
      id: '~Test_User1',
      content: {
        emails: undefined, // pre-created empty profile with no email
        names: [{ first: 'Test', last: 'User', username: '~Test_User1' }],
      },
    }
    expect(typeof formatProfileData(apiProfileResponse)).toBe('object')
  })
})
