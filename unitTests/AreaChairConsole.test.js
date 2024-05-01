import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import api from '../lib/api-client'
import { reRenderWithWebFieldContext, renderWithWebFieldContext } from './util'
import AreaChairConsole from '../components/webfield/AreaChairConsole'

let useUserReturnValue
let routerParams
let noteSummaryProps
let noteReviewStatusProps

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: (params) => {
      routerParams = params
      return jest.fn()
    },
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

beforeEach(() => {
  useUserReturnValue = { user: { profile: { id: '~Test_User1' } }, accessToken: 'some token' }
  routerParams = null
  noteSummaryProps = jest.fn()
  noteReviewStatusProps = jest.fn()
})

describe('AreaChairConsole', () => {
  test('redirects to login page if user has not signed in', async () => {
    useUserReturnValue = { user: null, accessToken: null }
    const providerProps = { value: {} }
    renderWithWebFieldContext(
      <AreaChairConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(routerParams).toContain('/login')
  })

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
    const officialReviewName = 'First_Rount_Review'
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

  test('show assigned papers tab and ac tasks tab', async () => {
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
        officialReviewName: 'First_Rount_Review',
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
      // assigned papers tab
      expect(screen.getAllByText('No assigned submission.', { exact: false })).toHaveLength(1)
      expect(screen.getByRole('tab', { name: 'Assigned Submissions' })).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'Secondary Senior Program Committee Assignments' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'Senior Program Committee Tasks' })
      ).toBeInTheDocument()
    })
  })
})
