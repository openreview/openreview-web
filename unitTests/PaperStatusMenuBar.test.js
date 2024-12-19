import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaperStatusMenuBar from '../components/webfield/ProgramChairConsole/PaperStatusMenuBar'
import { renderWithWebFieldContext } from './util'

let baseMenuBarProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/webfield/BaseMenuBar', () => (props) => {
  baseMenuBarProps = props
  return <span>Base Menu Bar</span>
})

beforeEach(() => {
  baseMenuBarProps = null
})

describe('PaperStatusMenuBar', () => {
  test('display base menu bar', () => {
    const providerProps = {
      value: {
        reviewerName: 'Reviewers',
        anonReviewerName: 'Reviewer_',
        officialReviewName: 'Offical_Review',
      },
    }
    const componentProps = { reviewRatingName: 'rating' }
    renderWithWebFieldContext(<PaperStatusMenuBar {...componentProps} />, providerProps)
    expect(screen.getByText('Base Menu Bar')).toBeInTheDocument()
  })

  test('add propertiesAllowd to query search filters', () => {
    const providerProps = {
      value: {
        reviewerName: 'Reviewers',
        anonReviewerName: 'Reviewer_',
        officialReviewName: 'Offical_Review',
        propertiesAllowed: {
          testProperty: ['note.content.testProperty.value'],
        },
      },
    }
    const componentProps = { reviewRatingName: 'rating' }
    renderWithWebFieldContext(<PaperStatusMenuBar {...componentProps} />, providerProps)
    expect(baseMenuBarProps.propertiesAllowed.testProperty).toEqual([
      'note.content.testProperty.value',
    ])
  })

  test('support function in propertiesAllowd', () => {
    const providerProps = {
      value: {
        reviewerName: 'Reviewers',
        anonReviewerName: 'Reviewer_',
        officialReviewName: 'Offical_Review',
        propertiesAllowed: {
          testProperty: ['note.content.testProperty.value'],
          hasMetaReview: `
const invitationToCheck="Meta_Review";
const metaReview = row.note?.details?.replies?.find(reply => {
  const hasReply = reply.invitations.some(invitation => invitation.includes(invitationToCheck));
  return hasReply;
})
return metaReview?true:false;
`,
          officialReviewCount: `
const invitationToCheck="Official_Review";
const officialReviews = row.note?.details?.replies?.filter(reply => (reply.invitations.some(invitation => invitation.includes(invitationToCheck))))
return officialReviews.length;
`,
        },
      },
    }
    const componentProps = {
      reviewRatingName: 'rating',
      tableRowsAll: [
        {
          note: {
            content: {
              testProperty: {
                value: 'testValue',
              },
            },
            details: {
              replies: [
                {
                  invitations: ['venue/Submission1/-/Official_Review'],
                },
                {
                  invitations: ['venue/Submission1/-/Official_Review'],
                },
                {
                  invitations: ['venue/Submission1/-/Official_Review'],
                },
              ],
            },
          },
        },
        {
          note: {
            content: {
              testProperty: {
                value: 'testValue2',
              },
            },
            details: {
              replies: [
                {
                  invitations: ['venue/Submission2/-/Meta_Review'],
                },
                {
                  invitations: ['venue/Submission2/-/Official_Review'],
                },
              ],
            },
          },
        },
      ],
    }

    renderWithWebFieldContext(<PaperStatusMenuBar {...componentProps} />, providerProps)
    // add key to query filter key
    expect(baseMenuBarProps.propertiesAllowed.hasMetaReview).toEqual(['hasMetaReview'])
    expect(baseMenuBarProps.propertiesAllowed.officialReviewCount).toEqual([
      'officialReviewCount',
    ])

    // calculate property based on function defined
    expect(baseMenuBarProps.tableRowsAll[0].hasMetaReview).toEqual(false)
    expect(baseMenuBarProps.tableRowsAll[0].officialReviewCount).toEqual(3)
    expect(baseMenuBarProps.tableRowsAll[1].hasMetaReview).toEqual(true)
    expect(baseMenuBarProps.tableRowsAll[1].officialReviewCount).toEqual(1)
  })

  test('not to throw error when function expression is invalid', () => {
    // eslint-disable-next-line no-console
    console.error = jest.fn()
    const providerProps = {
      value: {
        reviewerName: 'Reviewers',
        anonReviewerName: 'Reviewer_',
        officialReviewName: 'Offical_Review',
        propertiesAllowed: {
          testProperty: ['note.content.testProperty.value'],
          hasMetaReview: `
const invitationToCheck="Meta_Review";
const metaReview = row.note?.details?.replies?.find(reply => {
  const hasReply = reply.invitations.some(invitation => invitation.includes(invitationToCheck));
  return hasReply;
})
return metaReview?true:false;
`,
          // expression of officialReviewCount is invalid with extra )))
          officialReviewCount: `
const invitationToCheck="Official_Review")));
const officialReviews = row.note?.details?.replies?.filter(reply => (reply.invitations.some(invitation => invitation.includes(invitationToCheck))))
return officialReview.length;
`,
        },
      },
    }
    const componentProps = {
      reviewRatingName: 'rating',
      tableRowsAll: [
        {
          note: {
            content: {
              testProperty: {
                value: 'testValue',
              },
            },
            details: {
              replies: [
                {
                  invitations: ['venue/Submission1/-/Official_Review'],
                },
                {
                  invitations: ['venue/Submission1/-/Official_Review'],
                },
                {
                  invitations: ['venue/Submission1/-/Official_Review'],
                },
              ],
            },
          },
        },
        {
          note: {
            content: {
              testProperty: {
                value: 'testValue2',
              },
            },
            details: {
              replies: [
                {
                  invitations: ['venue/Submission2/-/Meta_Review'],
                },
                {
                  invitations: ['venue/Submission2/-/Official_Review'],
                },
              ],
            },
          },
        },
      ],
    }

    renderWithWebFieldContext(<PaperStatusMenuBar {...componentProps} />, providerProps)

    expect(baseMenuBarProps.tableRowsAll[0]).not.toHaveProperty('officialReviewCount')
    expect(baseMenuBarProps.tableRowsAll[1]).not.toHaveProperty('officialReviewCount')
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('officialReviewCount'))
  })
})
