import {
  getErrorFieldName,
  filterCollections,
  isNonDeletableError,
  convertToString,
  convertToArray,
} from '../lib/webfield-utils'

const filterOperators = ['!=', '>=', '<=', '>', '<', '==', '=']
const uniqueIdentifier = 'id'

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

    errorPath = 'signatures' // edit signatures
    resultExpected = 'editSignatureInputValues'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)

    errorPath = 'note/signatures' // note signatures
    resultExpected = 'noteSignatureInputValues'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)

    errorPath = 'readers' // edit readers
    resultExpected = 'editReaderValues'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)

    errorPath = 'note/readers' // note readers
    resultExpected = 'noteReaderValues'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)

    errorPath = 'note/license' // note license
    resultExpected = 'noteLicenseValue'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)

    errorPath = 'content/author_id/value' // edit content
    resultExpected = 'content.author_id'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)

    errorPath = 'content/author_index/value/0'
    resultExpected = 'content.author_index'
    expect(getErrorFieldName(errorPath)).toBe(resultExpected)
  })

  test('return whether the error invalidValue is {delete:true} in isNonDeletableError', () => {
    let invalidValue = null
    expect(isNonDeletableError(invalidValue)).toBe(false)

    invalidValue = undefined
    expect(isNonDeletableError(invalidValue)).toBe(false)

    invalidValue = 5
    expect(isNonDeletableError(invalidValue)).toBe(false)

    invalidValue = 'some text'
    expect(isNonDeletableError(invalidValue)).toBe(false)

    invalidValue = {}
    expect(isNonDeletableError(invalidValue)).toBe(false)

    invalidValue = { delete: true }
    expect(isNonDeletableError(invalidValue)).toBe(true)

    invalidValue = { delete: true, someOtherKey: 'some other value' }
    expect(isNonDeletableError(invalidValue)).toBe(false)
  })
})

describe('filterCollections', () => {
  test('return input collection when query is invalid', () => {
    const collections = [{ id: 1 }, { id: 2 }, { id: 3 }]
    let filterString = 'some invalid query that can not be parsed to a tree' // non-sense search query
    const propertiesAllowed = {}

    let result
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )

    expect(result.filteredRows).toEqual(collections)
    expect(result.queryIsInvalid).toEqual(true)

    filterString = 'title=test' // property not in propertiesAllowed
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual(collections)
    expect(result.queryIsInvalid).toEqual(true)
  })

  test('filter collection with simple query unnested property', () => {
    const collections = [{ id: 1 }, { id: 2 }, { id: 3 }]
    let filterString = 'id=2'
    const propertiesAllowed = {
      id: ['id'],
    }
    let result

    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([{ id: 2 }])

    filterString = 'id==2'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([{ id: 2 }])

    filterString = 'id!=2'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([{ id: 1 }, { id: 3 }])

    filterString = 'id>2'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([{ id: 3 }])

    filterString = 'id>=2'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([{ id: 2 }, { id: 3 }])

    filterString = 'id<=2'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([{ id: 1 }, { id: 2 }])

    filterString = 'id<2'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([{ id: 1 }])
  })

  test('filter collection with complex query unnested property', () => {
    const collections = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
      { id: 6 },
      { id: 7 },
      { id: 8 },
      { id: 9 },
      { id: 10 },
    ]
    const filterString =
      '((id!=1 OR id!=2) AND (id>3 OR (id<=5 AND id!=4))) AND (id>=6 AND id<8) OR id=8'
    const propertiesAllowed = {
      id: ['id'],
    }

    const result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([{ id: 6 }, { id: 7 }, { id: 8 }])
  })

  test('filter collection with nested property', () => {
    const collections = [
      { id: 1, note: { content: { title: { value: 'some value' } } } },
      { id: 2, note: { content: { title: { value: 'some different value' } } } },
      { id: 3 }, // no such value
    ]
    const filterString = "key='some value'"
    const propertiesAllowed = {
      key: ['note.content.title.value'],
    }

    const result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows).toEqual([
      {
        id: 1,
        note: { content: { title: { value: 'some value' } } },
      },
    ])
  })

  test('filter collection with multiple propertie fields', () => {
    const collections = [
      { id: 1, note: { content: { title: { value: 'some value' } } } },
      {
        id: 2,
        note: { content: { title: { value: 'some different value' } } },
        decision: 'some value',
      },
      { id: 3 }, // no such value
    ]
    const filterString = "key='some value'"
    const propertiesAllowed = {
      key: ['note.content.title.value', 'decision'],
    }

    const result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 2])
  })

  test('filter collection with between properties', () => {
    // should default value to 0 when both property and value are single value
    const collections = [
      {
        id: 1,
        filterProperties: {
          'TMLR/Action_Editors/-/Custom_Max_Papers': 7,
          'TMLR/Action_Editors/-/Assignment': 3,
        },
      },
      {
        id: 2,
        filterProperties: {
          'TMLR/Action_Editors/-/Custom_Max_Papers': 5,
          'TMLR/Action_Editors/-/Assignment': 6,
        },
      },
      {
        id: 3,
        filterProperties: {
          'TMLR/Action_Editors/-/Custom_Max_Papers': 1,
        },
      },
    ]
    let filterString =
      'TMLR/Action_Editors/-/Assignment<TMLR/Action_Editors/-/Custom_Max_Papers'
    const propertiesAllowed = {
      'TMLR/Action_Editors/-/Custom_Max_Papers': [
        'filterProperties.TMLR/Action_Editors/-/Custom_Max_Papers',
      ],
      'TMLR/Action_Editors/-/Assignment': [
        'filterProperties.TMLR/Action_Editors/-/Assignment',
      ],
    }
    let result

    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 3])

    filterString = 'TMLR/Action_Editors/-/Custom_Max_Papers>TMLR/Action_Editors/-/Assignment' // to verify both property and value get the default value
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 3])
  })

  test('filter collection with between properties (single property field multi value fields)', () => {
    const collections = [
      {
        id: 1,
        note: {
          content: {
            value1: 'some value',
            value2: 'some different value',
            value3: 'some different value',
            value4: 5,
            value5: 6,
            value6: 4,
          },
        },
      },
      {
        id: 2,
        note: {
          content: {
            value1: 'some value',
            value2: 'some value',
            value3: 'some different value',
            value4: 5,
            value5: 4,
            value6: 6,
          },
        },
      },
      {
        id: 3,
        note: {
          content: {
            value1: 'some value',
            value2: 'some different value',
            value3: 'some value',
            value4: 5,
            value5: 6,
            value6: 6,
          },
        },
      },
    ]
    let filterString = 'key1 = key2'
    const propertiesAllowed = {
      key1: ['note.content.value1'],
      key2: ['note.content.value2', 'note.content.value3'],
      key3: ['note.content.value4'],
      key4: ['note.content.value5', 'note.content.value6'],
    }
    let result

    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([2, 3])

    filterString = 'key3>=key4'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 2])
  })

  test('filter collection with between properties (multi property and value fields)', () => {
    const collections = [
      {
        id: 1,
        note: {
          content: {
            value1: 'some value',
            value2: 'some different value',
            value3: 'some value',
            value4: 'some other value',
          },
        },
      },
      {
        id: 2,
        note: {
          content: {
            value1: 'some value',
            value2: 'some other value',
            value3: 'some different value',
            value4: 'some other value',
          },
        },
      },
      {
        id: 3,
        note: {
          content: {
            value1: 'some value',
            value2: 'some different value',
            value3: 'some other value',
            value4: 'some unique value',
          },
        },
      },
    ]
    const filterString = 'key1 = key2'
    const propertiesAllowed = {
      key1: ['note.content.value1', 'note.content.value2'],
      key2: ['note.content.value3', 'note.content.value4'],
    }

    const result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 2])
  })

  test('filter string with single equal single property (includes)', () => {
    const collections = [
      { id: 1, note: { content: { title: { value: 'some VaLuE' } } } },
      { id: 2, note: { content: { title: { value: 'some different vAlUe' } } } },
      { id: 3 },
    ]
    const filterString = "key='VALUE'"
    const propertiesAllowed = {
      key: ['note.content.title.value'],
    }

    const result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 2])
  })

  test('filter string with single equal multi property (some includes)', () => {
    const collections = [
      { id: 1, note: { content: { title: { value1: 'some VaLuE' } } } },
      { id: 2, note: { content: { title: { value2: 'some different vAlUe' } } } },
      { id: 3 },
    ]
    const filterString = "key='VALUE'"
    const propertiesAllowed = {
      key: ['note.content.title.value1', 'note.content.title.value2'],
    }

    const result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 2])
  })

  test('filter string with double equal single property (exact match)', () => {
    const collections = [
      { id: 1, note: { content: { title: { value: 'some VaLuE' } } } },
      { id: 2, note: { content: { title: { value: 'some different vAlUe' } } } },
      { id: 3, note: { content: { title: { value: 'VALUE' } } } },
    ]
    const filterString = 'key==VALUE'
    const propertiesAllowed = {
      key: ['note.content.title.value'],
    }

    const result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([3])
  })

  test('filter string with double equal multi property (some exact match)', () => {
    const collections = [
      { id: 1, note: { content: { title: { value1: 'some VaLuE', value2: 'VALUE' } } } },
      { id: 2, note: { content: { title: { value2: 'some different vAlUe' } } } },
      { id: 3, note: { content: { title: { value3: 'VALUE' } } } },
    ]
    const filterString = 'key==VALUE'
    const propertiesAllowed = {
      key: [
        'note.content.title.value1',
        'note.content.title.value2',
        'note.content.title.value3',
      ],
    }

    const result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 3])
  })

  test('filter profiles', () => {
    const collections = [
      {
        id: 1,
        metaReviewData: {
          seniorAreaChairs: [
            {
              preferredName: 'Name One',
              preferredId: '~Id1',
              type: 'profile',
            },
          ],
        },
      },
      {
        id: 2,
        metaReviewData: {
          seniorAreaChairs: [
            {
              preferredName: 'Name TWO',
              preferredId: '~Id2',
              type: 'profile',
            },
          ],
        },
      },
      {
        id: 3,
        metaReviewData: {
          seniorAreaChairs: [
            {
              preferredName: 'Name two',
              preferredId: undefined, // no id, should not throw error
              type: 'profile',
            },
          ],
        },
      },
    ]
    let filterString = 'sac=two'
    const propertiesAllowed = {
      sac: ['metaReviewData.seniorAreaChairs'],
    }

    let result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([2, 3])

    // exact match
    filterString = 'sac=="Name two"'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([3])

    // email exact match
    filterString = 'sac=="two@email.com"'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.length).toEqual(0) // email is stored in edges so not available for filtering

    // filter by id
    filterString = 'sac=~Id'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([1, 2])

    // filter by exact id
    filterString = 'sac=~Id2'
    result = filterCollections(
      collections,
      filterString,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    expect(result.filteredRows.map((p) => p.id)).toEqual([2])
  })
})

describe('convertToString', () => {
  test('return string when value to cast is string', () => {
    const valueToCast = 'some string'
    expect(convertToString(valueToCast)).toBe(valueToCast)
  })
  test('return string when value to cast is array', () => {
    const valueToCast = ['value one', 'value two', 'value three']
    const expectedValue = 'value one,value two,value three'
    expect(convertToString(valueToCast)).toBe(expectedValue)
  })
  test('return undefined when value to cast is object', () => {
    const valueToCast = { value: 'some value' }
    const expectedValue = undefined
    expect(convertToString(valueToCast)).toBe(expectedValue)
  })
  test('return undefined when value to cast is null', () => {
    const valueToCast = null
    const expectedValue = undefined
    expect(convertToString(valueToCast)).toBe(expectedValue)
  })
})

describe('convertToArray', () => {
  test('return array when value to cast is array', () => {
    const valueToCast = ['value one', 'value two', 'value three']
    expect(convertToArray(valueToCast)).toEqual(valueToCast)
  })
  test('return array when value to cast is string with no comma', () => {
    const valueToCast = 'some string'
    const expectedValue = ['some string']
    expect(convertToArray(valueToCast)).toEqual(expectedValue)
  })
  test('return array when value to cast is string with comma', () => {
    const valueToCast = 'value one,value two,value three'
    const expectedValue = ['value one', 'value two', 'value three']
    expect(convertToArray(valueToCast)).toEqual(expectedValue)
  })
  test('return undefined when value to cast is non-array object', () => {
    const valueToCast = { value: 'some string' }
    const expectedValue = undefined
    expect(convertToArray(valueToCast)).toBe(expectedValue)
  })
  test('return undefined when value to cast is undefined', () => {
    const valueToCast = undefined
    const expectedValue = undefined
    expect(convertToArray(valueToCast)).toBe(expectedValue)
  })
})
