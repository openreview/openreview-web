import { getErrorFieldName } from '../lib/webfield-utils'

describe('webfield-utils', () => {
  test('return field name in getErrorFieldName', () => {
    let errorPath = 'note/content/pdf'
    let resultExpected = 'pdf'

    expect(getErrorFieldName(errorPath)).toBe(resultExpected)

    errorPath = 'note/content/title/value'
    resultExpected = 'title'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)

    errorPath = 'note/content/authorids/value/0'
    resultExpected = 'authorids'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)
  })
})
