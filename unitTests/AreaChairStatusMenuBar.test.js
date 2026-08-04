import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { renderWithWebFieldContext } from './util'
import AreaChairStatusMenuBar from '../components/webfield/ProgramChairConsole/AreaChairStatusMenuBar'

let baseMenuBarProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/webfield/BaseMenuBar', () => (props) => {
  baseMenuBarProps = props
  return <span>Base Menu Bar</span>
})

beforeEach(() => {
  baseMenuBarProps = null
})

describe('AreaChairStatusMenuBar', () => {
  test('use default query search param when areaChairStatusPropertiesAllowed is not defined', () => {
    const providerProps = {
      value: {
        officialReviewName: 'Offical_Review',
        areaChairStatusPropertiesAllowed: undefined,
      },
    }
    const componentProps = {
      reviewRatingName: 'rating',
      tableRowsAll: [
        {
          areaChairProfile: { id: '~Area_Chair1' },
          notes: [{ noteNumber: 1 }, { noteNumber: 2 }, { noteNumber: 3 }],
        },
        {
          areaChairProfile: { id: '~Area_Chair2' },
          notes: [{ noteNumber: 4 }, { noteNumber: 5 }, { noteNumber: 6 }],
        },
      ],
    }

    renderWithWebFieldContext(<AreaChairStatusMenuBar {...componentProps} />, providerProps)

    expect(baseMenuBarProps.propertiesAllowed.number).toEqual(['number'])
    expect(baseMenuBarProps.propertiesAllowed.name).toEqual(['areaChairProfile.preferredName'])
    expect(baseMenuBarProps.propertiesAllowed.seniorAreaChairs).toEqual([
      'seniorAreaChair.seniorAreaChairId',
    ])
  })

  test('allow query search param to be overwritten by areaChairStatusPropertiesAllowed', () => {
    const providerProps = {
      value: {
        officialReviewName: 'Offical_Review',
        areaChairStatusPropertiesAllowed: {
          number: ['number'],
          numTotalReplyCount: `
            const notesAssigned = row.notes
            const replyCounts = notesAssigned.map(note => note.replyCount ?? 0)
            const totalReplyCount = replyCounts.reduce((sum, count) => sum + count, 0)
            return totalReplyCount
          `,
        },
      },
    }
    const componentProps = {
      reviewRatingName: 'rating',
      tableRowsAll: [
        {
          areaChairProfile: { id: '~Area_Chair1' },
          notes: [
            { noteNumber: 1, replyCount: 3 },
            { noteNumber: 2, replyCount: 3 },
            { noteNumber: 3, replyCount: 3 },
          ],
        },
        {
          areaChairProfile: { id: '~Area_Chair2' },
          notes: [
            { noteNumber: 4, replyCount: 3 },
            { noteNumber: 5, replyCount: 4 },
            { noteNumber: 6, replyCount: 5 },
          ],
        },
      ],
    }

    renderWithWebFieldContext(<AreaChairStatusMenuBar {...componentProps} />, providerProps)

    expect(baseMenuBarProps.propertiesAllowed.number).toEqual(['number'])
    expect(baseMenuBarProps.propertiesAllowed.numTotalReplyCount).toEqual([
      'numTotalReplyCount',
    ])

    expect(baseMenuBarProps.tableRowsAll[0].numTotalReplyCount).toEqual(9)
    expect(baseMenuBarProps.tableRowsAll[1].numTotalReplyCount).toEqual(12)

    expect(baseMenuBarProps.uniqueIdentifier).toEqual('areaChairProfileId') // is note.id by default
  })
})
