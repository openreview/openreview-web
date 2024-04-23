import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import api from '../lib/api-client'
import { reRenderWithWebFieldContext, renderWithWebFieldContext } from './util'
import ReviewerConsole from '../components/webfield/ReviewerConsole'

jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))
jest.mock('../hooks/useQuery', () => () => ({}))
jest.mock('../components/webfield/NoteSummary', () => (props) => <span>note summary</span>)
jest.mock('../components/webfield/NoteReviewStatus', () => ({
  ReviewerConsoleNoteReviewStatus: (props) => <span>note review status</span>,
}))
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

global.promptError = jest.fn()

describe('ReviewerConsole', () => {
  test('show missing config error when config does not have reviewerName', () => {
    const providerProps = { value: { reviewerName: undefined } }
    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(screen.getByText('Console is missing', { exact: false })).toBeInTheDocument()
  })

  test('show error with console name when config is empty', () => {
    const providerProps = {
      value: {
        reviewerName: 'Program_Committee',
      },
    }
    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(
      screen.getByText('Program Committee Console is missing', { exact: false })
    ).toBeInTheDocument()
  })

  test('not to call API when there is no submission invitation, submission name, venue id or reviewer name config', () => {
    api.getAll = jest.fn()
    api.getInvitationById = jest.fn()

    const submissionInvitationId = 'AAAI.org/2025/Conference/-/Submission'
    const submissionName = 'Submission'
    const venueId = 'AAAI.org/2025/Conference'
    const reviewerName = 'Program_Committee'

    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Console',
          instruction: 'some instructions',
        },
        entity: { id: 'AAAI.org/2025/Conference/Program_Committee' },
        venueId,
        reviewerName,
        officialReviewName: 'Official_Review',
        reviewRatingName: 'rating',
        areaChairName: 'Senior_Program_Committee',
        submissionName,
        submissionInvitationId,
        recruitmentInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Recruitment',
        customMaxPapersInvitationId:
          'AAAI.org/2025/Conference/Program_Committee/-/Custom_Max_Papers',
        reviewLoad: '',
        hasPaperRanking: false,
        reviewDisplayFields: undefined,
      },
    }

    // no submission invitation
    providerProps.value.submissionInvitationId = undefined
    const { rerender } = renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.getInvitationById).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'Program Committee Console is missing required properties: submissionInvitationId'
      )
    ).toBeInTheDocument()

    // no submission name
    providerProps.value.submissionInvitationId = submissionInvitationId
    providerProps.value.submissionName = undefined
    reRenderWithWebFieldContext(
      rerender,
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.getInvitationById).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'Program Committee Console is missing required properties: submissionName'
      )
    ).toBeInTheDocument()

    // no venue id
    providerProps.value.submissionName = submissionName
    providerProps.value.venueId = undefined
    reRenderWithWebFieldContext(
      rerender,
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.getInvitationById).not.toHaveBeenCalled()
    expect(
      screen.getByText('Program Committee Console is missing required properties: venueId')
    ).toBeInTheDocument()

    // no reviewer name
    providerProps.value.venueId = venueId
    providerProps.value.reviewerName = undefined
    reRenderWithWebFieldContext(
      rerender,
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.getInvitationById).not.toHaveBeenCalled()
    expect(
      screen.getByText('Console is missing required properties: reviewerName')
    ).toBeInTheDocument()
  })
})
