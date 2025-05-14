import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import api from '../lib/api-client'
import { reRenderWithWebFieldContext, renderWithWebFieldContext } from './util'
import AreaChairConsole from '../components/webfield/AreaChairConsole'

let useUserReturnValue
let routerParams
let noteSummaryProps
let noteReviewStatusProps

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: jest.fn((params) => {
      routerParams = params
      return {
        catch: jest.fn(),
      }
    }),
  }),
}))
jest.mock('../hooks/useUser', () => () => useUserReturnValue)
jest.mock('../components/webfield/NoteSummary', () => (props) => {
  noteSummaryProps(props)
  return <span>note summary</span>
})
jest.mock('../components/webfield/NoteReviewStatus', () => ({
  AcPcConsoleNoteReviewStatus: (props) => {
    noteReviewStatusProps(props)
    return <span>note review status</span>
  },
}))

global.promptError = jest.fn()
global.DOMPurify = {
  sanitize: jest.fn(),
}
global.marked = jest.fn()
global.$ = jest.fn(() => ({ on: jest.fn(), off: jest.fn(), modal: jest.fn() }))

beforeEach(() => {
  useUserReturnValue = { user: { profile: { id: '~Test_User1' } }, accessToken: 'some token' }
  routerParams = null
  noteSummaryProps = jest.fn()
  noteReviewStatusProps = jest.fn()
})

describe('AreaChairConsole', () => {
  test('show error when config is not complete', async () => {
    const providerProps = { value: { areaChairName: undefined } }
    const { rerender } = renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(
      screen.getByText('Console is missing required properties', { exact: false })
    ).toBeInTheDocument()

    providerProps.value.areaChairName = 'Senior_Program_Committee'
    reRenderWithWebFieldContext(
      rerender,
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(
      screen.getByText('Senior Program Committee Console is missing required properties', {
        exact: false,
      })
    ).toBeInTheDocument()
  })

  test('not to load data when required config is missing', async () => {
    api.getAll = jest.fn()
    api.get = jest.fn()
    api.post = jest.fn()

    const venueId = 'AAAI.org/2025/Conference'
    const submissionName = 'Submission'
    const officialReviewName = 'First_Round_Review'
    const submissionInvitationId = 'AAAI.org/2025/Conference/-/Submission'

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: { id: 'AAAI.org/2025/Conference/Senior_Program_Committee' },
        venueId,
        reviewerAssignment: {
          showEdgeBrowserUrl: true,
          proposedAssignmentTitle: '',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId,
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        submissionName,
        officialReviewName,
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: undefined,
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
      },
    }

    // no venue id
    providerProps.value.venueId = undefined
    const { rerender } = renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()

    // no submissionName
    providerProps.value.venueId = venueId
    providerProps.value.submissionName = undefined
    reRenderWithWebFieldContext(
      rerender,
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()

    // no officialReviewName
    providerProps.value.submissionName = submissionName
    providerProps.value.officialReviewName = undefined
    reRenderWithWebFieldContext(
      rerender,
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()

    // no submissionInvitationId
    providerProps.value.officialReviewName = officialReviewName
    providerProps.value.submissionInvitationId = undefined
    reRenderWithWebFieldContext(
      rerender,
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('show assigned papers tab and ac tasks tab and tasks tabs specified by extraRoleNames', async () => {
    api.getAll = jest.fn((path) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([])
        case '/notes':
          return Promise.resolve([])
        default:
          return null
      }
    })
    api.get = jest.fn((path) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({ groups: [] })
        case '/edges': // sac assignments
          return Promise.resolve([])
        default:
          return null
      }
    })
    api.post = jest.fn(() => Promise.resolve()) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: { id: 'AAAI.org/2025/Conference/Senior_Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: true,
          proposedAssignmentTitle: '',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: undefined,
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
        extraRoleNames: ['Secondary_Area_Chairs'],
      },
    }

    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      // assigned papers tab
      expect(screen.getAllByText('No assigned submission.', { exact: false })).toHaveLength(1)
      expect(screen.getByRole('tab', { name: 'Assigned Submissions' })).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'Secondary Senior Program Committee Assignments' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'Senior Program Committee Tasks' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'Secondary Area Chair Tasks' })
      ).toBeInTheDocument()
    })
  })

  test('show assigned SACs and assigned Secondary Area Chairs in header instuction (No preferred email edge)', async () => {
    api.getAll = jest.fn((path) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([])
        case '/notes':
          return Promise.resolve([])
        default:
          return null
      }
    })
    api.get = jest.fn((path, param) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({ groups: [] })
        case '/edges': // sac assignments
          if (!param.domain) {
            return Promise.resolve({ edges: [] }) // call to get sac emails from edges
          }
          if (param.invitation.includes('Secondary_Senior_Program_Committee')) {
            return Promise.resolve({
              edges: [
                { tail: '~Secondary_Senior_Program_Committee1' },
                { tail: 'secondary@seniorprogramcommittee.two' },
              ],
            })
          }
          return Promise.resolve({
            edges: [{ tail: '~Senior_AC1' }, { tail: 'senior@AC.two' }],
          })
        default:
          return null
      }
    })
    api.post = jest.fn((_, param) =>
      Promise.resolve(
        param.ids
          ? {
              profiles: [
                {
                  id: '~Senior_AC1',
                  content: {
                    names: [{ username: '~Senior_AC1' }],
                    emails: ['senior@AC.one'],
                  },
                },
                {
                  id: '~Secondary_Senior_Program_Committee1',
                  content: {
                    names: [{ username: '~Secondary_Senior_Program_Committee1' }],
                    emails: ['secondary@seniorprogramcommittee.one'],
                  },
                },
              ],
            }
          : {
              profiles: [
                {
                  id: '~Senior_AC2',
                  content: {
                    names: [{ username: '~Senior_AC2' }],
                    emails: ['senior@AC.two'],
                  },
                  email: 'senior@AC.two',
                },
                {
                  id: '~Secondary_Senior_Program_Committee2',
                  content: {
                    names: [{ username: '~Secondary_Senior_Program_Committee2' }],
                    emails: ['secondary@seniorprogramcommittee.two'],
                  },
                  email: 'secondary@seniorprogramcommittee.two',
                },
              ],
            }
      )
    ) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: {
          id: 'AAAI.org/2025/Conference/Senior_Program_Committee',
          domain: 'AAAI.org/2025/Conference',
        },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: false,
          proposedAssignmentTitle: '',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: undefined,
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
      },
    }

    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(global.marked).toHaveBeenCalledWith(
        expect.stringContaining(
          'Your assigned Area Chairs are <a href="/profile?id=~Senior_AC1" >Senior AC</a> and <a href="/profile?id=~Senior_AC2" >Senior AC</a>'
        )
      )
      expect(global.marked).toHaveBeenCalledWith(
        expect.stringContaining(
          'Your assigned Secondary Senior Program Committees are <a href="/profile?id=~Secondary_Senior_Program_Committee1" >Secondary Senior Program Committee</a> and <a href="/profile?id=~Secondary_Senior_Program_Committee2" >Secondary Senior Program Committee</a>'
        )
      )
    })
  })

  test('show assigned SACs and assigned Secondary Area Chair in header instuction (With preferred email edge)', async () => {
    api.getAll = jest.fn((path) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([])
        case '/notes':
          return Promise.resolve([])
        default:
          return null
      }
    })
    api.get = jest.fn((path, param) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({ groups: [] })
        case '/edges': // sac and secondary ac assignments
          if (param.head === '~Senior_AC1') {
            return Promise.resolve({
              edges: [{ head: '~Senior_AC1', tail: 'senior@ac.1' }],
            }) // call to get sac emails from edges
          }
          if (param.head === '~Senior_AC2') {
            return Promise.resolve({
              edges: [{ head: '~Senior_AC2', tail: 'senior@ac.2' }],
            }) // call to get sac emails from edges
          }
          if (param.head === '~Secondary_Senior_Program_Committee1') {
            return Promise.resolve({
              edges: [
                {
                  head: '~Secondary_Senior_Program_Committee1',
                  tail: 'secondary@seniorprogramcommittee.one',
                },
              ],
            }) // call to get sac emails from edges
          }
          if (param.invitation.includes('Secondary_Senior_Program_Committee')) {
            // secondary ac assignments
            return Promise.resolve({
              edges: [{ tail: '~Secondary_Senior_Program_Committee1' }],
            })
          }
          return Promise.resolve({
            edges: [{ tail: '~Senior_AC1' }, { tail: 'senior@AC.two' }],
          })
        default:
          return null
      }
    })
    api.post = jest.fn((_, param) =>
      Promise.resolve(
        param.ids
          ? {
              profiles: [
                {
                  id: '~Senior_AC1',
                  content: {
                    names: [{ username: '~Senior_AC1' }],
                    emails: ['senior@AC.one'],
                  },
                },
                {
                  id: '~Secondary_Senior_Program_Committee1',
                  content: {
                    names: [{ username: '~Secondary_Senior_Program_Committee1' }],
                    emails: ['secondary@seniorprogramcommittee.one'],
                  },
                },
              ],
            }
          : {
              profiles: [
                {
                  id: '~Senior_AC2',
                  content: {
                    names: [{ username: '~Senior_AC2' }],
                    emails: ['senior@AC.two'],
                  },
                  email: 'senior@AC.two',
                },
              ],
            }
      )
    ) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: {
          id: 'AAAI.org/2025/Conference/Senior_Program_Committee',
          domain: 'AAAI.org/2025/Conference',
        },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: false,
          proposedAssignmentTitle: '',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: undefined,
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
        preferredEmailInvitationId: 'test_invitation',
      },
    }

    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(global.marked).toHaveBeenCalledWith(
        expect.stringContaining(
          'Your assigned Area Chairs are <a href="/profile?id=~Senior_AC1" >Senior AC</a>(senior@ac.1) and <a href="/profile?id=~Senior_AC2" >Senior AC</a>(senior@ac.2)'
        )
      )
      expect(global.marked).toHaveBeenCalledWith(
        expect.stringContaining(
          'Your assigned Secondary Senior Program Committee is <a href="/profile?id=~Secondary_Senior_Program_Committee1" >Secondary Senior Program Committee</a>(secondary@seniorprogramcommittee.one)'
        )
      )
    })
  })

  test('show assigned papers (no review)', async () => {
    const acAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn((path, param) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([
            {
              id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
            },
            {
              id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
            },
          ])
        case '/notes':
          if (param.number === '1')
            return Promise.resolve([
              {
                id: 'note1Id',
                number: 1,
                details: {
                  replies: [],
                },
              },
            ])
          return Promise.resolve([])
        case '/edges': // ithenticate edges
          return Promise.resolve([{ values: [{ head: 'note1Id', label: 'Created' }] }])
        default:
          return null
      }
    })
    api.get = jest.fn((path) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({ groups: [] })
        case '/edges': // sac assignments
          return Promise.resolve([])
        default:
          return null
      }
    })
    api.post = jest.fn(() => Promise.resolve()) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: { id: 'AAAI.org/2025/Conference/Senior_Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: true,
          proposedAssignmentTitle: '',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: undefined,
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
        ithenticateInvitationId: 'AAAI.org/2025/Conference/-/iThenticate_Plagiarism_Check',
      },
    }

    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(global.marked).toHaveBeenCalledWith(expect.stringContaining('some instructions'))
      expect(global.marked).toHaveBeenCalledWith(
        expect.stringContaining('deployed edge browser url')
      )
      expect(screen.getAllByRole('row')).toHaveLength(2) // header + 1 note
      expect(screen.getByText('note summary')).toBeInTheDocument()
      expect(screen.getByText('note review status')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Download PDFs' })).toBeInTheDocument()
      expect(noteSummaryProps).toHaveBeenCalledWith(
        expect.objectContaining({
          note: expect.objectContaining({ id: 'note1Id' }),
          ithenticateEdge: { head: 'note1Id', label: 'Created' },
        })
      )
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerUrl: expect.stringContaining(
            encodeURIComponent('[Senior Program Committee Console]')
          ),
        })
      )
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerUrl: expect.stringContaining(encodeURIComponent('#assigned-submissions')),
        })
      )
      expect(screen.getByText('No recommendation')).toBeInTheDocument() // meta review status column
    })
  })

  test('show assigned papers (with review)', async () => {
    // the AC is AC of paper1 and secondary AC of paper 5
    const acAnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const paper5Reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const paper5Reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const paper5AssignedACAnonId = Math.random().toString(36).substring(2, 6)
    const paper5SecondaryACAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn((path, param) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([
            {
              id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
            },
            {
              id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
            },
            {
              id: `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee`,
            },
          ])
        case '/notes':
          return Promise.resolve([
            {
              id: 'note1Id',
              forum: 'note1Id',
              number: 1,
              details: {
                replies: [
                  // reviewer 1 review
                  {
                    content: {
                      review: { value: 'some review from reviewer1' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                    ],
                  },
                  // reviewer 2 review
                  {
                    content: {
                      review: { value: 'some review from reviewer2' },
                      rating: { value: 10 },
                      confidence: { value: 10 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                    ],
                  },
                  // meta review
                  {
                    id: 'metaReviewId',
                    content: {
                      recommendation: { value: 'Accept' },
                      final_recommendation: { value: 'Reject' },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/Meta_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${acAnonId}`,
                    ],
                  },
                ],
              },
            },
            {
              id: 'note5Id',
              forum: 'note5Id',
              number: 5,
              details: {
                replies: [
                  // reviewer 1 review
                  {
                    content: {
                      review: { value: 'some review for paper5 from reviewer1' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission5/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                    ],
                  },
                  // reviewer 2 review
                  {
                    content: {
                      review: { value: 'some review for paper5 from reviewer2' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission5/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                    ],
                  },
                  // meta review
                  {
                    id: 'metaReviewId',
                    content: {
                      recommendation: { value: 'Accept' },
                      final_recommendation: { value: 'Reject' },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/Meta_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${acAnonId}`,
                    ],
                  },
                ],
              },
            },
          ])
        default:
          return null
      }
    })
    api.get = jest.fn((path) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({
            groups: [
              // paper 1 all reviewers group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                ],
              },
              // paper 1 reviewer1 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                members: ['~PaperOne_Reviewer1'],
              },
              // paper 1 reviewer2 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                members: ['~PaperOne_Reviewer2'],
              },
              // paper 1 all ac group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                ],
              },
              // paper 1 ac group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~PaperOne_AC1'],
              },
              // paper 5 all reviewers group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                  `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                ],
              },
              // paper 5 reviewer1 group
              {
                id: `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                members: ['~PaperFive_Reviewer1'],
              },
              // paper 5 reviewer2 group
              {
                id: `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                members: ['~PaperFive_Reviewer2'],
              },
              // paper 5 all ac group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Senior_Program_Committee_${paper5AssignedACAnonId}`,
                ],
              },
              // paper 5 ac group
              {
                id: `AAAI.org/2025/Conference/Submission5/Senior_Program_Committee_${paper5AssignedACAnonId}`,
                members: ['~PaperFive_AC1'],
              },
              // paper 5 all secondary ac group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee${paper5SecondaryACAnonId}`,
                ],
              },
              // paper 5 secondary ac group
              {
                id: `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee${paper5SecondaryACAnonId}`,
                members: ['~Test_User1'], // the user using this ac console
              },
            ],
          })
        case '/edges': // sac assignments
          return Promise.resolve({ edges: [{ tail: '~Senior_AC1' }, { tail: '~Senior_AC2' }] })
        default:
          return null
      }
    })
    api.post = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer1', fullname: 'PaperOne Reviewer1' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer2', fullname: 'PaperOne Reviewer2' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperFive_Reviewer1', fullname: 'PaperFive Reviewer1' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperFive_Reviewer2', fullname: 'PaperFive Reviewer2' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~Senior_AC1' }],
              emails: ['senior@AC.one'],
            },
          },
          {
            content: {
              names: [{ username: '~Senior_AC2' }],
              emails: ['senior@AC.two'],
            },
          },
        ],
      })
    ) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: { id: 'AAAI.org/2025/Conference/Senior_Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: true,
          proposedAssignmentTitle: 'Proposed Assignment',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: ['final_recommendation'],
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
      },
    }

    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(global.marked).toHaveBeenCalledWith(
        expect.stringContaining('proposed edge browser url')
      )
      expect(screen.getByText('note summary')).toBeInTheDocument()
      expect(screen.getByText('note review status')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Download PDFs' })).toBeInTheDocument()
      expect(noteSummaryProps).toHaveBeenCalledWith(
        expect.objectContaining({ note: expect.objectContaining({ id: 'note1Id' }) })
      )
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerUrl: expect.stringContaining(
            encodeURIComponent('[Senior Program Committee Console]')
          ),
        })
      )
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerUrl: expect.stringContaining(encodeURIComponent('#assigned-submissions')),
        })
      )
      const paper1AvgConfidence = (0 + 10) / 2
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.objectContaining({
            reviewProgressData: expect.objectContaining({
              confidenceAvg: paper1AvgConfidence.toFixed(2),
              ratings: {
                rating: {
                  ratingAvg: '5.00',
                  ratingMax: 10,
                  ratingMin: 0,
                },
              },
            }),
          }),
        })
      )
      expect(screen.getByText('Accept')).toBeInTheDocument() // meta review status column
      expect(screen.getByText('Reject')).toBeInTheDocument() // meta review status column
      expect(screen.getByRole('link', { name: 'Read' })).toHaveAttribute(
        'href',
        `/forum?id=note1Id&noteId=metaReviewId&referrer=${encodeURIComponent(
          '[Senior Program Committee Console](/group?id=AAAI.org/2025/Conference/Senior_Program_Committee#assigned-submissions)'
        )}`
      )
    })
  })

  test('show assigned papers (with review which has invisible content)', async () => {
    const acAnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn((path, param) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([
            {
              id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
            },
            {
              id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
            },
          ])
        case '/notes':
          return Promise.resolve([
            {
              id: 'note1Id',
              forum: 'note1Id',
              number: 1,
              details: {
                replies: [
                  // reviewer 1 review
                  {
                    content: {
                      review: { value: 'some review from reviewer1' },
                      rating: { value: 5 },
                      confidence: { value: 5 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                    ],
                  },
                  // reviewer 2 review
                  {
                    content: undefined, // content field readers do not contain AC
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                    ],
                  },
                ],
              },
            },
          ])
        default:
          return null
      }
    })
    api.get = jest.fn((path) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({
            groups: [
              // paper 1 all reviewers group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                ],
              },
              // paper 1 reviewer1 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                members: ['~PaperOne_Reviewer1'],
              },
              // paper 1 reviewer2 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                members: ['~PaperOne_Reviewer2'],
              },
              // paper 1 all ac group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                ],
              },
              // paper 1 ac group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~PaperOne_AC1'],
              },
            ],
          })
        case '/edges': // sac assignments
          return Promise.resolve({ edges: [] })
        default:
          return null
      }
    })
    api.post = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer1', fullname: 'PaperOne Reviewer1' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer2', fullname: 'PaperOne Reviewer2' }],
              emails: [],
            },
          },
        ],
      })
    ) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: { id: 'AAAI.org/2025/Conference/Senior_Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: true,
          proposedAssignmentTitle: 'Proposed Assignment',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: ['final_recommendation'],
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
      },
    }

    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(global.marked).toHaveBeenCalledWith(
        expect.stringContaining('proposed edge browser url')
      )
      expect(screen.getByText('note summary')).toBeInTheDocument()
      expect(screen.getByText('note review status')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Download PDFs' })).toBeInTheDocument()
      expect(noteSummaryProps).toHaveBeenCalledWith(
        expect.objectContaining({ note: expect.objectContaining({ id: 'note1Id' }) })
      )
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerUrl: expect.stringContaining(
            encodeURIComponent('[Senior Program Committee Console]')
          ),
        })
      )
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerUrl: expect.stringContaining(encodeURIComponent('#assigned-submissions')),
        })
      )

      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.objectContaining({
            reviewProgressData: expect.objectContaining({
              confidenceAvg: '5.00',
              ratings: {
                rating: {
                  ratingAvg: '5.00',
                  ratingMax: 5,
                  ratingMin: 5,
                },
              },
            }),
          }),
        })
      )
    })
  })

  test('switch to secondary ac tab and tasks tab', async () => {
    // the AC is AC of paper1 and secondary AC of paper 5
    const acAnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const paper5Reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const paper5Reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const paper5AssignedACAnonId = Math.random().toString(36).substring(2, 6)
    const paper5SecondaryACAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn((path) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([
            {
              id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
            },
            {
              id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
            },
            {
              id: `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee`,
            },
          ])
        case '/notes':
          return Promise.resolve([
            {
              id: 'note1Id',
              forum: 'note1Id',
              number: 1,
              details: {
                replies: [
                  // reviewer 1 review
                  {
                    content: {
                      review: { value: 'some review from reviewer1' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                    ],
                  },
                  // reviewer 2 review
                  {
                    content: {
                      review: { value: 'some review from reviewer2' },
                      rating: { value: 10 },
                      confidence: { value: 10 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                    ],
                  },
                  // meta review
                  {
                    id: 'metaReviewId',
                    content: {
                      recommendation: { value: 'Accept' },
                      final_recommendation: { value: 'Reject' },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/Meta_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${acAnonId}`,
                    ],
                  },
                ],
              },
            },
            {
              id: 'note5Id',
              forum: 'note5Id',
              number: 5,
              details: {
                replies: [
                  // reviewer 1 review
                  {
                    content: {
                      review: { value: 'some review for paper5 from reviewer1' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission5/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                    ],
                  },
                  // reviewer 2 review
                  {
                    content: {
                      review: { value: 'some review for paper5 from reviewer2' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission5/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                    ],
                  },
                  // meta review
                  {
                    id: 'metaReviewId',
                    content: {
                      recommendation: { value: 'Accept' },
                      final_recommendation: { value: 'Reject' },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/Meta_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${acAnonId}`,
                    ],
                  },
                ],
              },
            },
          ])
        default:
          return null
      }
    })
    api.get = jest.fn((path) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({
            groups: [
              // paper 1 all reviewers group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                ],
              },
              // paper 1 reviewer1 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                members: ['~PaperOne_Reviewer1'],
              },
              // paper 1 reviewer2 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                members: ['~PaperOne_Reviewer2'],
              },
              // paper 1 all ac group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                ],
              },
              // paper 1 ac group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~PaperOne_AC1'],
              },
              // paper 5 all reviewers group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                  `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                ],
              },
              // paper 5 reviewer1 group
              {
                id: `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                members: ['~PaperFive_Reviewer1'],
              },
              // paper 5 reviewer2 group
              {
                id: `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                members: ['~PaperFive_Reviewer2'],
              },
              // paper 5 all ac group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Senior_Program_Committee_${paper5AssignedACAnonId}`,
                ],
              },
              // paper 5 ac group
              {
                id: `AAAI.org/2025/Conference/Submission5/Senior_Program_Committee_${paper5AssignedACAnonId}`,
                members: ['~PaperFive_AC1'],
              },
              // paper 5 all secondary ac group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee${paper5SecondaryACAnonId}`,
                ],
              },
              // paper 5 secondary ac group
              {
                id: `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee${paper5SecondaryACAnonId}`,
                members: ['~Test_User1'], // the user using this ac console
              },
            ],
          })
        case '/edges': // sac assignments
          return Promise.resolve({ edges: [{ tail: '~Senior_AC1' }, { tail: '~Senior_AC2' }] })
        default:
          return null
      }
    })
    api.post = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer1', fullname: 'PaperOne Reviewer1' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer2', fullname: 'PaperOne Reviewer2' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperFive_Reviewer1', fullname: 'PaperFive Reviewer1' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperFive_Reviewer2', fullname: 'PaperFive Reviewer2' }],
              emails: [],
            },
          },
          {
            id: '~Senior_AC1',
            content: {
              names: [{ username: '~Senior_AC1' }],
              emails: ['senior@AC.one'],
            },
          },
          {
            id: '~Senior_AC2',
            content: {
              names: [{ username: '~Senior_AC2' }],
              emails: ['senior@AC.two'],
            },
          },
        ],
      })
    ) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: { id: 'AAAI.org/2025/Conference/Senior_Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: false,
          proposedAssignmentTitle: '',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: ['final_recommendation'],
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
      },
    }

    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(global.marked).toHaveBeenCalledWith(
        expect.stringContaining(
          'Your assigned Area Chairs are <a href="/profile?id=~Senior_AC1" >Senior AC</a> and <a href="/profile?id=~Senior_AC2" >Senior AC</a>'
        )
      )
      expect(screen.getByRole('button', { name: 'Export' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Download PDFs' })).toBeVisible()
      expect(noteSummaryProps).not.toHaveBeenCalledWith(
        expect.objectContaining({ note: expect.objectContaining({ id: 'note5Id' }) })
      )
    })

    const secondaryACTab = screen.getByRole('tab', {
      name: 'Secondary Senior Program Committee Assignments',
    })
    await userEvent.click(secondaryACTab)

    await waitFor(() => {
      expect(noteSummaryProps).toHaveBeenCalledWith(
        expect.objectContaining({ note: expect.objectContaining({ id: 'note5Id' }) })
      )

      expect(noteSummaryProps).toHaveBeenLastCalledWith(
        expect.objectContaining({ note: expect.objectContaining({ id: 'note5Id' }) })
      )
      expect(noteReviewStatusProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          referrerUrl: expect.stringContaining(
            encodeURIComponent('[Senior Program Committee Console]')
          ),
        })
      )
      expect(noteReviewStatusProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          referrerUrl: expect.stringContaining(
            encodeURIComponent('#secondary-senior-program-committee-assignments')
          ),
        })
      )
    })

    const tasksTab = screen.getByRole('tab', {
      name: 'Senior Program Committee Tasks',
    })
    await userEvent.click(tasksTab)
    await waitFor(() => {
      expect(screen.getByText('No outstanding tasks for this conference')).toBeInTheDocument()
    })
  })

  test('switch to tab specified by location hash', async () => {
    // the AC is AC of paper1 and secondary AC of paper 5
    const acAnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const paper5Reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const paper5Reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const paper5AssignedACAnonId = Math.random().toString(36).substring(2, 6)
    const paper5SecondaryACAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn((path) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([
            {
              id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
            },
            {
              id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
            },
            {
              id: `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee`,
            },
          ])
        case '/notes':
          return Promise.resolve([
            {
              id: 'note1Id',
              forum: 'note1Id',
              number: 1,
              details: {
                replies: [
                  // reviewer 1 review
                  {
                    content: {
                      review: { value: 'some review from reviewer1' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                    ],
                  },
                  // reviewer 2 review
                  {
                    content: {
                      review: { value: 'some review from reviewer2' },
                      rating: { value: 10 },
                      confidence: { value: 10 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                    ],
                  },
                  // meta review
                  {
                    id: 'metaReviewId',
                    content: {
                      recommendation: { value: 'Accept' },
                      final_recommendation: { value: 'Reject' },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/Meta_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${acAnonId}`,
                    ],
                  },
                ],
              },
            },
            {
              id: 'note5Id',
              forum: 'note5Id',
              number: 5,
              details: {
                replies: [
                  // reviewer 1 review
                  {
                    content: {
                      review: { value: 'some review for paper5 from reviewer1' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission5/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                    ],
                  },
                  // reviewer 2 review
                  {
                    content: {
                      review: { value: 'some review for paper5 from reviewer2' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission5/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                    ],
                  },
                  // meta review
                  {
                    id: 'metaReviewId',
                    content: {
                      recommendation: { value: 'Accept' },
                      final_recommendation: { value: 'Reject' },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/Meta_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${acAnonId}`,
                    ],
                  },
                ],
              },
            },
          ])
        default:
          return null
      }
    })
    api.get = jest.fn((path) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({
            groups: [
              // paper 1 all reviewers group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                ],
              },
              // paper 1 reviewer1 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                members: ['~PaperOne_Reviewer1'],
              },
              // paper 1 reviewer2 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                members: ['~PaperOne_Reviewer2'],
              },
              // paper 1 all ac group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                ],
              },
              // paper 1 ac group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~PaperOne_AC1'],
              },
              // paper 5 all reviewers group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                  `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                ],
              },
              // paper 5 reviewer1 group
              {
                id: `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer1AnonId}`,
                members: ['~PaperFive_Reviewer1'],
              },
              // paper 5 reviewer2 group
              {
                id: `AAAI.org/2025/Conference/Submission5/Program_Committee_${paper5Reviewer2AnonId}`,
                members: ['~PaperFive_Reviewer2'],
              },
              // paper 5 all ac group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Senior_Program_Committee_${paper5AssignedACAnonId}`,
                ],
              },
              // paper 5 ac group
              {
                id: `AAAI.org/2025/Conference/Submission5/Senior_Program_Committee_${paper5AssignedACAnonId}`,
                members: ['~PaperFive_AC1'],
              },
              // paper 5 all secondary ac group
              {
                id: 'AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee${paper5SecondaryACAnonId}`,
                ],
              },
              // paper 5 secondary ac group
              {
                id: `AAAI.org/2025/Conference/Submission5/Secondary_Senior_Program_Committee${paper5SecondaryACAnonId}`,
                members: ['~Test_User1'], // the user using this ac console
              },
            ],
          })
        case '/edges': // sac assignments
          return Promise.resolve({ edges: [{ tail: '~Senior_AC1' }, { tail: '~Senior_AC2' }] })
        default:
          return null
      }
    })
    api.post = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer1', fullname: 'PaperOne Reviewer1' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer2', fullname: 'PaperOne Reviewer2' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperFive_Reviewer1', fullname: 'PaperFive Reviewer1' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperFive_Reviewer2', fullname: 'PaperFive Reviewer2' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~Senior_AC1' }],
            },
          },
          {
            content: {
              names: [{ username: '~Senior_AC2' }],
            },
          },
        ],
      })
    ) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: { id: 'AAAI.org/2025/Conference/Senior_Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: true,
          proposedAssignmentTitle: '',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: ['final_recommendation'],
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
      },
    }

    window.location.hash = '#senior-program-committee-tasks'

    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      // menu bar not rendered
      expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Download PDFs' })).not.toBeInTheDocument()
      // assigned papers tab not rendered
      expect(noteSummaryProps).not.toHaveBeenCalledWith(
        expect.objectContaining({ note: expect.objectContaining({ id: 'note1Id' }) })
      )

      // ac triplet tab is not rendered
      expect(noteSummaryProps).not.toHaveBeenCalledWith(
        expect.objectContaining({ note: expect.objectContaining({ id: 'note5Id' }) })
      )
      // tasks tab is rendered
      expect(
        screen.queryByText('No outstanding tasks for this conference')
      ).toBeInTheDocument()
    })
  })

  test('select/unselect paper and enable/disable message button', async () => {
    const acAnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const paper1Reviewer2AnonId = Math.random().toString(36).substring(2, 6)

    api.getAll = jest.fn((path) => {
      switch (path) {
        case '/groups': // all groups
          return Promise.resolve([
            {
              id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
            },
            {
              id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
            },
          ])
        case '/notes':
          return Promise.resolve([
            {
              id: 'note1Id',
              forum: 'note1Id',
              number: 1,
              details: {
                replies: [
                  // reviewer 1 review
                  {
                    content: {
                      review: { value: 'some review from reviewer1' },
                      rating: { value: 0 },
                      confidence: { value: 0 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                    ],
                  },
                  // reviewer 2 review
                  {
                    content: {
                      review: { value: 'some review from reviewer2' },
                      rating: { value: 10 },
                      confidence: { value: 10 },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/First_Round_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                    ],
                  },
                  // meta review
                  {
                    id: 'metaReviewId',
                    content: {
                      recommendation: { value: 'Accept' },
                      final_recommendation: { value: 'Reject' },
                    },
                    invitations: ['AAAI.org/2025/Conference/Submission1/-/Meta_Review'],
                    signatures: [
                      `AAAI.org/2025/Conference/Submission1/Program_Committee_${acAnonId}`,
                    ],
                  },
                ],
              },
            },
          ])
        default:
          return null
      }
    })
    api.get = jest.fn((path) => {
      switch (path) {
        case '/groups': // reviewer groups
          return Promise.resolve({
            groups: [
              // paper 1 all reviewers group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                  `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                ],
              },
              // paper 1 reviewer1 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer1AnonId}`,
                members: ['~PaperOne_Reviewer1'],
              },
              // paper 1 reviewer2 group
              {
                id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${paper1Reviewer2AnonId}`,
                members: ['~PaperOne_Reviewer2'],
              },
              // paper 1 all ac group
              {
                id: 'AAAI.org/2025/Conference/Submission1/Senior_Program_Committee',
                members: [
                  `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                ],
              },
              // paper 1 ac group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~PaperOne_AC1'],
              },
            ],
          })
        case '/edges': // sac assignments
          return Promise.resolve({ edges: [] })
        default:
          return null
      }
    })
    api.post = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer1', fullname: 'PaperOne Reviewer1' }],
              emails: [],
            },
          },
          {
            content: {
              names: [{ username: '~PaperOne_Reviewer2', fullname: 'PaperOne Reviewer2' }],
              emails: [],
            },
          },
        ],
      })
    ) // profile search

    const providerProps = {
      value: {
        header: { title: 'Senior Program Committee', instructions: 'some instructions' },
        entity: { id: 'AAAI.org/2025/Conference/Senior_Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerAssignment: {
          showEdgeBrowserUrl: true,
          proposedAssignmentTitle: '',
          edgeBrowserProposedUrl: 'proposed edge browser url',
          edgeBrowserDeployedUrl: 'deployed edge browser url',
        },
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        seniorAreaChairsId: 'AAAI.org/2025/Conference/Area_Chairs',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: undefined,
        submissionName: 'Submission',
        officialReviewName: 'First_Round_Review',
        reviewRatingName: 'rating',
        reviewConfidenceName: 'confidence',
        officialMetaReviewName: 'Meta_Review',
        reviewerName: 'Program_Committee',
        anonReviewerName: 'Program_Committee_',
        metaReviewRecommendationName: undefined,
        additionalMetaReviewFields: ['final_recommendation'],
        shortPhrase: 'AAAI 2025',
        filterOperators: undefined,
        propertiesAllowed: undefined,
        enableQuerySearch: true,
        emailReplyTo: 'pc@aaai.org',
        extraExportColumns: undefined,
      },
    }

    window.location.hash = undefined
    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    const assignedSubmissionsTab = screen.getByRole('tab', {
      name: 'Assigned Submissions',
    })
    await userEvent.click(assignedSubmissionsTab)
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(2) // select all in menu bar and checkbox for paper1
      expect(screen.getByRole('button', { name: 'Message' })).toHaveClass('disabled')
    })

    await userEvent.click(screen.getAllByRole('checkbox')[0])
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')[1]).toBeChecked()
      expect(screen.getByRole('button', { name: 'Message' })).not.toHaveClass('disabled')
    })

    await userEvent.click(screen.getAllByRole('checkbox')[1])
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked()
      expect(screen.getByRole('button', { name: 'Message' })).toHaveClass('disabled')
    })
  })
})
