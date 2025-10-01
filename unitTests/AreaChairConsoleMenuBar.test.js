import { screen, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import AreaChairConsoleMenuBar from '../components/webfield/AreaChairConsoleMenuBar'

let baseMenuBarProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/webfield/BaseMenuBar', () => (props) => {
  baseMenuBarProps = props
  return <span>Base Menu Bar</span>
})

beforeEach(() => {
  baseMenuBarProps = null
})

describe('AreaChairConsoleMenuBar', () => {
  test('display base menu bar', () => {
    const props = {
      reviewerName: 'Reviewers', // error thrown by ac console when undefined
      officialReviewName: 'Official_Review', // error thrown by ac console when undefined
      officialMetaReviewName: 'Official_Meta_Review', // error thrown by ac console when undefined
      submissionName: 'Submission', // error thrown by ac console when undefined
      reviewRatingName: 'rating', // error thrown by ac console when undefined
      metaReviewRecommendationName: 'recommendation', // have default value in AC console
      areaChairName: 'Senior_Program_Committee', // error thrown by ac console when undefined
    }
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(screen.getByText('Base Menu Bar')).toBeInTheDocument()
  })

  test('all filter operators to be overwritten', () => {
    const props = {
      reviewerName: 'Reviewers',
      officialReviewName: 'Official_Review',
      officialMetaReviewName: 'Official_Meta_Review',
      submissionName: 'Submission',
      reviewRatingName: 'rating',
      metaReviewRecommendationName: 'recommendation',
      areaChairName: 'Senior_Program_Committee',
      filterOperators: undefined,
    }
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.filterOperators).toEqual(['!=', '>=', '<=', '>', '<', '==', '='])

    props.filterOperators = ['!=', '=']
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.filterOperators).toEqual(['!=', '='])
  })

  test('add additional meta review fields to query search param', () => {
    const props = {
      reviewerName: 'Reviewers',
      officialReviewName: 'Official_Review',
      officialMetaReviewName: 'Official_Meta_Review',
      submissionName: 'Submission',
      reviewRatingName: 'rating',
      metaReviewRecommendationName: 'recommendation',
      areaChairName: 'Senior_Program_Committee',
      additionalMetaReviewFields: [], // default value by ac console
    }
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(
      Object.keys(baseMenuBarProps.propertiesAllowed).filter((p) => p.startsWith('MetaReview'))
    ).toHaveLength(0)

    props.additionalMetaReviewFields = ['final_recommendation', 'last_recommendation']
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('MetaReviewFinalRecommendation')
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('MetaReviewLastRecommendation')
  })

  test('add propertiesAllowed field to query search param', () => {
    const props = {
      reviewerName: 'Reviewers',
      officialReviewName: 'Official_Review',
      officialMetaReviewName: 'Official_Meta_Review',
      submissionName: 'Submission',
      reviewRatingName: 'rating',
      metaReviewRecommendationName: 'recommendation',
      areaChairName: 'Senior_Program_Committee',
      propertiesAllowed: "stringProperty: ['note.content.stringProperty.value']",
    }
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed).not.toHaveProperty('stringProperty')

    props.propertiesAllowed = {
      testProperty: ['note.content.testProperty.value'],
      anotherTestProperty: [
        'note.content.anotherTestProperty',
        'note.content.anotherTestProperty.value',
      ],
    }
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed.testProperty).toEqual([
      'note.content.testProperty.value',
    ])
    expect(baseMenuBarProps.propertiesAllowed.anotherTestProperty).toEqual([
      'note.content.anotherTestProperty',
      'note.content.anotherTestProperty.value',
    ])
  })

  test('update query search key,sort label names based on submissionName, reviewerName and officialReviewName', () => {
    const props = {
      reviewerName: 'Reviewers',
      officialReviewName: 'Official_Review',
      officialMetaReviewName: 'Official_Meta_Review',
      submissionName: 'Submission',
      reviewRatingName: 'rating',
      metaReviewRecommendationName: 'recommendation',
      areaChairName: 'Senior_Program_Committee',
    }
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('reviewers')
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('numOfficialReviewDone')
    expect(
      baseMenuBarProps.sortOptions.find((p) => p.label === 'Submission Number')
    ).toBeTruthy()
    expect(
      baseMenuBarProps.sortOptions.find(
        (p) => p.label === 'Number of Official Reviews Submitted'
      )
    ).toBeTruthy()
    expect(
      baseMenuBarProps.messageOptions.find(
        (p) => p.label === 'All Reviewers of selected Submissions'
      )
    ).toBeTruthy()

    props.submissionName = 'Paper'
    props.reviewerName = 'Program_Committee'
    props.officialReviewName = 'First_Round_Review'
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('programCommittee')
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('numFirstRoundReviewDone')
    expect(baseMenuBarProps.sortOptions.find((p) => p.label === 'Paper Number')).toBeTruthy()
    expect(
      baseMenuBarProps.sortOptions.find(
        (p) => p.label === 'Number of First Round Reviews Submitted'
      )
    ).toBeTruthy()
    expect(
      baseMenuBarProps.messageOptions.find(
        (p) => p.label === 'All Program Committees of selected Papers'
      )
    ).toBeTruthy()
  })

  test('add extraExportColumns to export columns', () => {
    const props = {
      reviewerName: 'Reviewers',
      officialReviewName: 'Official_Review',
      officialMetaReviewName: 'Official_Meta_Review',
      submissionName: 'Submission',
      reviewRatingName: 'rating',
      metaReviewRecommendationName: 'recommendation',
      areaChairName: 'Senior_Program_Committee',
      extraExportColumns: [
        {
          header: 'test export COLUMN',
          getValue: (p) => p.note?.number,
        },
      ],
    }
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(
      baseMenuBarProps.exportColumns.find((p) => p.header === 'num Reviewers')
    ).toBeTruthy()
    expect(
      baseMenuBarProps.exportColumns.find(
        (p) => p.header === 'seniorProgramCommittee recommendation'
      )
    ).toBeTruthy()
    expect(
      baseMenuBarProps.exportColumns.find((p) => p.header === 'test export COLUMN')
    ).toBeTruthy()

    props.submissionName = 'Paper'
    props.reviewerName = 'Program_Committee'
    props.officialReviewName = 'First_Round_Review'
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('programCommittee')
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('numFirstRoundReviewDone')
    expect(baseMenuBarProps.sortOptions.find((p) => p.label === 'Paper Number')).toBeTruthy()
    expect(
      baseMenuBarProps.sortOptions.find(
        (p) => p.label === 'Number of First Round Reviews Submitted'
      )
    ).toBeTruthy()
  })

  test('support string, array and object array rating names', () => {
    const props = {
      reviewerName: 'Reviewers',
      officialReviewName: 'Official_Review',
      officialMetaReviewName: 'Official_Meta_Review',
      submissionName: 'Submission',
      reviewRatingName: 'rating', // string
      metaReviewRecommendationName: 'recommendation',
      areaChairName: 'Senior_Program_Committee',
    }
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('ratingAvg')
    expect(
      baseMenuBarProps.exportColumns.find((p) => p.header === 'average rating')
    ).toBeTruthy()
    expect(baseMenuBarProps.sortOptions.find((p) => p.label === 'Average Rating')).toBeTruthy()

    // array
    props.reviewRatingName = ['rating_one', 'rating_two']
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('rating_oneAvg')
    expect(
      baseMenuBarProps.exportColumns.find((p) => p.header === 'average rating_one')
    ).toBeTruthy()
    expect(
      baseMenuBarProps.sortOptions.find((p) => p.label === 'Average Rating One')
    ).toBeTruthy()

    // object array
    props.reviewRatingName = [
      'rating_one',
      { 'rating display name': ['rating_two', 'rating_three'] },
    ]
    render(<AreaChairConsoleMenuBar {...props} />)
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('rating_oneAvg')
    expect(baseMenuBarProps.propertiesAllowed).toHaveProperty('rating display nameAvg')
    expect(
      baseMenuBarProps.exportColumns.find((p) => p.header === 'average rating_one')
    ).toBeTruthy()
    expect(
      baseMenuBarProps.exportColumns.find((p) => p.header === 'average rating display name')
    ).toBeTruthy()
    expect(
      baseMenuBarProps.sortOptions.find((p) => p.label === 'Average Rating One')
    ).toBeTruthy()
    expect(
      baseMenuBarProps.sortOptions.find((p) => p.label === 'Average Rating Display Name')
    ).toBeTruthy()
  })
})
