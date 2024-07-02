import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessageReviewersModal from '../components/webfield/MessageReviewersModal'
import { renderWithWebFieldContext } from './util'
import api from '../lib/api-client'

let basicModalProps

jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))
jest.mock('../components/BasicModal', () => (props) => {
  basicModalProps = props
  return <span>Basic Modal</span>
})

beforeEach(() => {
  basicModalProps = jest.fn()
})

describe('MessageReviewersModal', () => {
  test('display basic modal', () => {
    const providerProps = { value: { officialReviewName: 'Official_Review' } }
    const componentProps = {
      messageModalId: 'message-reviewers',
      messageOption: { value: 'allReviewers', label: 'All Reviewers of Selected Submission' },
      selectedIds: [],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    expect(screen.getByText('Basic Modal')).toBeInTheDocument()
    expect(basicModalProps.id).toEqual('message-reviewers')
    expect(basicModalProps.title).toEqual('All Reviewers of Selected Submission')
  })

  test('show default message template in step1', async () => {
    const providerProps = {
      value: { officialReviewName: 'Official_Review', shortPhrase: 'Test Venue' },
    }
    const componentProps = {
      tableRowsDisplayed: [
        {
          note: { id: 'noteId1', number: 1, forum: 'noteId1' },
          reviewers: [
            {
              reviewerProfileId: '~Reviewer_One1',
              preferredId: '~Reviewer_One1',
              anonymizedGroup: 'TestVenue/Submission1/Reviewer_ABCD',
              hasReview: true,
              noteNumber: 1,
            },
          ],
          messageSignature: 'messageSignature1',
        },
      ],
      messageModalId: 'message-reviewers',
      messageOption: { value: 'allReviewers', label: 'All Reviewers of Selected Submission' },
      selectedIds: ['noteId1'],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    expect(screen.getByText('Basic Modal')).toBeInTheDocument()
    expect(basicModalProps.id).toEqual('message-reviewers')
    expect(basicModalProps.title).toEqual('All Reviewers of Selected Submission')

    await waitFor(() => {
      expect(basicModalProps.children[1].props.children[0].props.children).toEqual(
        expect.stringContaining(
          'You may customize the message that will be sent to the reviewers'
        )
      )
      expect(basicModalProps.children[1].props.children[0].props.children).toEqual(
        expect.stringContaining('where the reviewers can fill out his or her official review')
      )
      expect(
        basicModalProps.children[1].props.children[1].props.children[1].props.value
      ).toEqual('Test Venue Reminder')
      expect(
        basicModalProps.children[1].props.children[1].props.children[3].props.value
      ).toEqual(
        expect.stringContaining('Your message...')
      )
    })
  })

  test('show default message template in step1 (missingReviews option)', async () => {
    const providerProps = {
      value: { officialReviewName: 'Official_Review', shortPhrase: 'Test Venue' },
    }
    const componentProps = {
      tableRowsDisplayed: [
        {
          note: { id: 'noteId1', number: 1, forum: 'noteId1' },
          reviewers: [
            {
              reviewerProfileId: '~Reviewer_One1',
              preferredId: '~Reviewer_One1',
              anonymizedGroup: 'TestVenue/Submission1/Reviewer_ABCD',
              hasReview: true,
              noteNumber: 1,
            },
          ],
          messageSignature: 'messageSignature1',
        },
      ],
      messageModalId: 'message-reviewers',
      messageOption: {
        value: 'missingReviews',
        label: 'Reviewers of Selected Submissions with unsubmitted Official Reviews',
      },
      selectedIds: ['noteId1'],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    expect(screen.getByText('Basic Modal')).toBeInTheDocument()
    expect(basicModalProps.id).toEqual('message-reviewers')
    expect(basicModalProps.title).toEqual(
      'Reviewers of Selected Submissions with unsubmitted Official Reviews'
    )

    await waitFor(() => {
      expect(
        basicModalProps.children[1].props.children[1].props.children[3].props.value
      ).toEqual(
        expect.stringContaining(
          'Your message...'
        )
      )
    })
  })

  test('show total number of messages and recipients', async () => {
    const providerProps = {
      value: { officialReviewName: 'Official_Review', shortPhrase: 'Test Venue' },
    }
    const componentProps = {
      tableRowsDisplayed: [
        {
          note: { id: 'noteId1', number: 1, forum: 'noteId1' },
          reviewers: [
            {
              reviewerProfileId: '~Reviewer_One1',
              preferredId: '~Reviewer_One1',
              anonymizedGroup: 'TestVenue/Submission1/Reviewer_ABCD',
              hasReview: true,
              noteNumber: 1,
            },
          ],
          messageSignature: 'messageSignature1',
        },
      ],
      messageModalId: 'message-reviewers',
      messageOption: { value: 'allReviewers', label: 'All Reviewers of Selected Submission' },
      selectedIds: ['noteId1'],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    await waitFor(async () => {
      // go to step2
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(() => {
      expect(
        basicModalProps.children[1].props.children[0].props.children[1].props.children
      ).toEqual(1) // total number of messages
      expect(
        basicModalProps.children[1].props.children[1].props.children.props.data[0]
      ).toEqual({
        reviewerProfileId: '~Reviewer_One1',
        preferredId: '~Reviewer_One1',
        anonymizedGroup: 'TestVenue/Submission1/Reviewer_ABCD',
        hasReview: true,
        count: 1,
        noteNumber: 1,
      })
    })
  })

  test('show total number of messages and recipients grouped by profile id', async () => {
    api.post = jest.fn()
    const providerProps = {
      value: { officialReviewName: 'Official_Review', shortPhrase: 'Test Venue' },
    }
    const componentProps = {
      tableRowsDisplayed: [
        {
          note: { id: 'noteId1', number: 1, forum: 'noteId1' },
          reviewers: [
            {
              reviewerProfileId: '~Reviewer_One1',
              preferredId: '~Reviewer_One1',
              anonymizedGroup: 'TestVenue/Submission1/Reviewer_ABCD',
              hasReview: true,
              noteNumber: 1,
            },
            {
              reviewerProfileId: '~Reviewer_Two1',
              preferredId: '~Reviewer_Two1',
              anonymizedGroup: 'TestVenue/Submission1/Reviewer_QWER',
              hasReview: false,
              noteNumber: 1,
            },
            {
              reviewerProfileId: '~Reviewer_Three1',
              preferredId: '~Reviewer_Three1',
              anonymizedGroup: 'TestVenue/Submission1/Reviewer_XXYY',
              hasReview: true,
              noteNumber: 1,
            },
          ],
          messageSignature: 'TestVenue/Program_Chairs',
        },
        {
          note: { id: 'noteId2', number: 2, forum: 'noteId2' },
          reviewers: [
            {
              reviewerProfileId: '~Reviewer_One1',
              preferredId: '~Reviewer_One1',
              anonymizedGroup: 'TestVenue/Submission2/Reviewer_DCBA',
              hasReview: true,
              noteNumber: 2,
            },
            {
              reviewerProfileId: '~Reviewer_Two2', // an alternate id of reviewer two
              preferredId: '~Reviewer_Two2',
              anonymizedGroup: 'TestVenue/Submission2/Reviewer_RRSS',
              hasReview: true,
              noteNumber: 2,
            },
          ],
          messageSignature: 'TestVenue/Program_Chairs',
        },
      ],
      messageModalId: 'message-reviewers',
      messageOption: { value: 'allReviewers', label: 'All Reviewers of Selected Submission' },
      selectedIds: ['noteId1', 'noteId2'],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    await waitFor(async () => {
      // go to step2
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(() => {
      expect(
        basicModalProps.children[1].props.children[0].props.children[1].props.children
      ).toEqual(5) // total number of messages
      expect(
        basicModalProps.children[1].props.children[1].props.children.props.data.length
      ).toEqual(4)
      expect(
        basicModalProps.children[1].props.children[1].props.children.props.data[0]
      ).toEqual(expect.objectContaining({ count: 2, preferredId: '~Reviewer_One1' }))
    })

    await waitFor(async () => {
      // send messages
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2)
      expect(api.post).toHaveBeenNthCalledWith(
        // message for submission 1
        1,
        expect.anything(),
        expect.objectContaining({
          groups: [
            'TestVenue/Submission1/Reviewer_ABCD',
            'TestVenue/Submission1/Reviewer_QWER',
            'TestVenue/Submission1/Reviewer_XXYY',
          ],
        }),
        expect.anything()
      )
      expect(api.post).toHaveBeenNthCalledWith(
        // message for submission 2
        2,
        expect.anything(),
        expect.objectContaining({
          groups: [
            'TestVenue/Submission2/Reviewer_DCBA',
            'TestVenue/Submission2/Reviewer_RRSS',
          ],
        }),
        expect.anything()
      )
    })
  })
})
