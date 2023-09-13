import { stringToObject } from '../lib/utils'

describe('utils', () => {
  test('convert string to object in stringToObject', () => {
    let prefilledValues = {}
    expect(stringToObject(prefilledValues)).toEqual(undefined)

    prefilledValues = { 'edit.note.content.title': 'some prefilled title' }
    expect(stringToObject(prefilledValues)).toEqual({
      content: { title: { value: 'some prefilled title' } },
    })

    // query has duplicated key to pass array type
    prefilledValues = {
      'edit.note.content.reject_reason': [
        'Other',
        'Other',
        'Reviewer never submitted their review',
      ],
    }
    expect(stringToObject(prefilledValues)).toEqual({
      content: {
        reject_reason: { value: ['Other', 'Reviewer never submitted their review'] },
      },
    })

    // fill multiple fields
    prefilledValues = {
      'edit.note.content.title': 'some prefilled title',
      'edit.note.content.reject_reason': [
        'Other',
        'Other',
        'Reviewer never submitted their review',
      ],
      'edit.note.content.comment': 'some prefilled comment',
    }
    expect(stringToObject(prefilledValues)).toEqual({
      content: {
        title: { value: 'some prefilled title' },
        reject_reason: { value: ['Other', 'Reviewer never submitted their review'] },
        comment: { value: 'some prefilled comment' },
      },
    })
  })
})
