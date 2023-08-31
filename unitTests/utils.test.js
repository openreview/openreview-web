import { stringToObject } from '../lib/utils'

describe('utils', () => {
  test('convert string to object in stringToObject', () => {
    let prefilledValue = null
    expect(stringToObject(prefilledValue)).toEqual(undefined)

    prefilledValue = 'test'
    expect(stringToObject(prefilledValue)).toEqual(undefined)

    prefilledValue = 'test='
    expect(stringToObject(prefilledValue)).toEqual(undefined)

    prefilledValue = 'test=1'
    expect(stringToObject(prefilledValue)).toEqual({ test: '1' })

    prefilledValue = 'test=some test value'
    expect(stringToObject(prefilledValue)).toEqual({ test: 'some test value' })

    prefilledValue = 'content.some_field.value= some prefilled value'
    expect(stringToObject(prefilledValue)).toEqual({
      content: { some_field: { value: ' some prefilled value' } },
    })

    prefilledValue = 'some.ve_ry.deep_ly.nest_ed.object.value= some prefilled value'
    expect(stringToObject(prefilledValue)).toEqual({
      some: {
        ve_ry: { deep_ly: { nest_ed: { object: { value: ' some prefilled value' } } } },
      },
    })
  })
})
