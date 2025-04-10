import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessageReviewersModal from '../components/webfield/MessageReviewersModal'
import { renderWithWebFieldContext } from './util'
import api from '../lib/api-client'

let basicModalProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
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
      ).toEqual(expect.stringContaining('Your message...'))
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
      ).toEqual(expect.stringContaining('Your message...'))
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

  test('group note ids by batch size 1000', async () => {
    api.post = jest.fn()
    const providerProps = {
      value: { officialReviewName: 'Official_Review', shortPhrase: 'Test Venue' },
    }
    const numberOfNotes = 10000
    const componentProps = {
      tableRowsDisplayed: Array.from({ length: numberOfNotes }, (_, i) => ({
        note: { id: `noteId${i}`, number: i, forum: `noteId${i}` },
        reviewers: [
          {
            reviewerProfileId: '~Reviewer_One1',
            preferredId: '~Reviewer_One1',
            preferredEmail: '****@test.com',
            anonymizedGroup: `TestVenue/Submission${i}/Reviewer_ABCD`,
            hasReview: true,
            noteNumber: i,
          },
        ],
      })),
      messageModalId: 'message-reviewers',
      messageOption: { value: 'allReviewers', label: 'All Reviewers of Selected Submission' },
      selectedIds: Array.from({ length: numberOfNotes }, (_, i) => `noteId${i}`),
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    await waitFor(async () => {
      // go to step2
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(async () => {
      // send messages
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(10000)
    })
  })

  test('allow sending email to authors', async () => {
    api.post = jest.fn()
    const providerProps = {
      value: {
        shortPhrase: 'Test Venue',
        emailReplyTo: 'email@program.chairs',
        venueId: 'testVenue',
        submissionName: 'Paper',
      },
    }

    const componentProps = {
      tableRowsDisplayed: [
        {
          note: { id: 'noteId1', number: 1 },
          authors: [
            {
              preferredId: 'authorId1',
              preferredName: 'Author One',
              noteNumber: 1,
              anonymizedGroup: 'authorId1',
            },
            {
              preferredId: 'authorId2',
              preferredName: 'Author Two',
              noteNumber: 1,
              anonymizedGroup: 'authorId2',
            },
            {
              preferredId: 'author@three.email', // no profile
              preferredName: 'Author Three',
              noteNumber: 1,
              anonymizedGroup: 'author@three.email',
            },
          ],
        },
        {
          note: { id: 'noteId2', number: 2 },
          authors: [
            {
              preferredId: 'authorId4',
              preferredName: 'Author Four',
              noteNumber: 2,
              anonymizedGroup: 'authorId4',
            },
            {
              preferredId: 'author@fiv.email', // no profile
              preferredName: 'Author Five',
              noteNumber: 2,
              anonymizedGroup: 'author@five.email',
            },
          ],
        },
      ],
      messageModalId: 'message-reviewers',
      messageOption: { value: 'allAuthors', label: 'All Authors of Selected Submissions' },
      selectedIds: ['noteId1', 'noteId2'],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    await waitFor(async () => {
      // go to step2
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(async () => {
      // send messages
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2)
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          groups: ['authorId1', 'authorId2', 'author@three.email'],
          replyTo: 'email@program.chairs',
          parentGroup: 'testVenue/Paper1/Authors',
        }),
        expect.anything()
      )
      expect(api.post).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          groups: ['authorId4', 'author@five.email'],
          replyTo: 'email@program.chairs',
          parentGroup: 'testVenue/Paper2/Authors',
        }),
        expect.anything()
      )
    })
  })

  test('allow sending email to senior area chairs', async () => {
    api.post = jest.fn()
    const providerProps = {
      value: {
        shortPhrase: 'Test Venue',
        emailReplyTo: 'email@program.chairs',
        venueId: 'testVenue',
        submissionName: 'Paper',
      },
    }
    const componentProps = {
      tableRowsDisplayed: [
        {
          note: { id: 'noteId1', number: 1 },
          metaReviewData: {
            seniorAreaChairs: [
              {
                anonymizedGroup: '~Test_SAC1',
                noteNumber: 1,
                preferredId: '~Test_SAC1',
                preferredName: 'SAC_One',
              },
              {
                anonymizedGroup: '~Test_SAC2',
                noteNumber: 1,
                preferredId: '~Test_SAC2',
                preferredName: 'SAC_Two',
              },
            ],
          },
        },
        {
          note: { id: 'noteId2', number: 2 },
          metaReviewData: {
            seniorAreaChairs: [
              {
                anonymizedGroup: '~Test_SAC1',
                noteNumber: 2,
                preferredId: '~Test_SAC1',
                preferredName: 'SAC_One',
              },
              {
                anonymizedGroup: '~Test_SAC3',
                noteNumber: 2,
                preferredId: '~Test_SAC3',
                preferredName: 'SAC_Three',
              },
            ],
          },
        },
      ],
      messageModalId: 'message-reviewers',
      messageOption: {
        value: 'allSACs',
        label: 'All Senior Area Chairs of Selected Papers',
      },
      selectedIds: ['noteId1', 'noteId2'],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    await waitFor(async () => {
      // title
      expect(basicModalProps.title).toEqual('All Senior Area Chairs of Selected Papers')
      // instruction
      expect(basicModalProps.children[1].props.children[0].props.children).toEqual(
        'You may customize the message that will be sent to Senior Area Chairs. You can also use {{fullname}} to replace the recipient full name and {{paper_number}} to replace the paper number. If your message is not specific to a paper, please email from the Senior Area Chairs group.'
      )
      // go to step2
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(async () => {
      // send messages
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2)
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          groups: ['~Test_SAC1', '~Test_SAC2'],
          replyTo: 'email@program.chairs',
          parentGroup: 'testVenue/Paper1/Senior_Area_Chairs',
        }),
        expect.anything()
      )
      expect(api.post).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          groups: ['~Test_SAC1', '~Test_SAC3'],
          replyTo: 'email@program.chairs',
          parentGroup: 'testVenue/Paper2/Senior_Area_Chairs',
        }),
        expect.anything()
      )
    })
  })

  test('allow sending email to area chairs', async () => {
    api.post = jest.fn()
    const providerProps = {
      value: {
        shortPhrase: 'Test Venue',
        emailReplyTo: 'email@program.chairs',
        venueId: 'testVenue',
        submissionName: 'Paper',
        areaChairName: 'Senior_Program_Committee',
        officialReviewName: 'Official_Review',
        officialMetaReviewName: 'Official_Meta_Review',
      },
    }
    const componentProps = {
      tableRowsDisplayed: [
        {
          note: { id: 'noteId1', number: 1 },
          metaReviewData: {
            areaChairs: [
              {
                anonymizedGroup: '~Test_AC1',
                noteNumber: 1,
                preferredId: '~Test_AC1',
                preferredName: 'AC_One',
              },
              {
                anonymizedGroup: '~Test_AC2',
                noteNumber: 1,
                preferredId: '~Test_AC2',
                preferredName: 'AC_Two',
              },
            ],
          },
        },
        {
          note: { id: 'noteId2', number: 2 },
          metaReviewData: {
            areaChairs: [
              {
                anonymizedGroup: '~Test_AC1',
                noteNumber: 2,
                preferredId: '~Test_AC1',
                preferredName: 'AC_One',
              },
              {
                anonymizedGroup: '~Test_AC3',
                noteNumber: 2,
                preferredId: '~Test_AC3',
                preferredName: 'AC_Three',
              },
            ],
          },
        },
      ],
      messageModalId: 'message-reviewers',
      messageOption: {
        value: 'allAreaChairs',
        label: 'All Area Chairs of Selected Papers',
      },
      selectedIds: ['noteId1', 'noteId2'],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    await waitFor(async () => {
      // title
      expect(basicModalProps.title).toEqual('All Area Chairs of Selected Papers')
      // instruction
      expect(basicModalProps.children[1].props.children[0].props.children).toEqual(
        'You may customize the message that will be sent to the senior program committee. In the email body, the text {{submit_review_link}} will be replaced with a hyperlink to the form where the senior program committee can fill out his or her official meta review. You can also use {{fullname}} to personalize the recipient full name.'
      )
      // go to step2
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(async () => {
      // send messages
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2)
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          groups: ['~Test_AC1', '~Test_AC2'],
          replyTo: 'email@program.chairs',
          parentGroup: 'testVenue/Paper1/Senior_Program_Committee',
        }),
        expect.anything()
      )
      expect(api.post).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          groups: ['~Test_AC1', '~Test_AC3'],
          replyTo: 'email@program.chairs',
          parentGroup: 'testVenue/Paper2/Senior_Program_Committee',
        }),
        expect.anything()
      )
    })
  })

  test('allow sending email to secondary area chairs', async () => {
    api.post = jest.fn()
    const providerProps = {
      value: {
        shortPhrase: 'Test Venue',
        emailReplyTo: 'email@program.chairs',
        venueId: 'testVenue',
        submissionName: 'Paper',
        areaChairName: 'Senior_Program_Committee',
        secondaryAreaChairName: 'Secondary_Senior_Program_Committee',
        officialReviewName: 'Official_Review',
        officialMetaReviewName: 'Official_Meta_Review',
        messageSubmissionSecondaryAreaChairsInvitationId:
          'TestVenue/Paper{number}/Secondary_Area_Chairs/-/Message',
      },
    }
    const componentProps = {
      tableRowsDisplayed: [
        {
          note: { id: 'noteId1', number: 1 },
          metaReviewData: {
            secondaryAreaChairs: [
              {
                anonymizedGroup: '~Test_AC1',
                noteNumber: 1,
                preferredId: '~Test_AC1',
                preferredName: 'AC_One',
              },
              {
                anonymizedGroup: '~Test_AC2',
                noteNumber: 1,
                preferredId: '~Test_AC2',
                preferredName: 'AC_Two',
              },
            ],
          },
        },
        {
          note: { id: 'noteId2', number: 2 },
          metaReviewData: {
            secondaryAreaChairs: [
              {
                anonymizedGroup: '~Test_AC1',
                noteNumber: 2,
                preferredId: '~Test_AC1',
                preferredName: 'AC_One',
              },
              {
                anonymizedGroup: '~Test_AC3',
                noteNumber: 2,
                preferredId: '~Test_AC3',
                preferredName: 'AC_Three',
              },
            ],
          },
        },
      ],
      messageModalId: 'message-reviewers',
      messageOption: {
        value: 'allSecondaryAreaChairs',
        label: 'All Secondary Area Chairs of Selected Papers',
      },
      selectedIds: ['noteId1', 'noteId2'],
    }

    renderWithWebFieldContext(<MessageReviewersModal {...componentProps} />, providerProps)

    await waitFor(async () => {
      // title
      expect(basicModalProps.title).toEqual('All Secondary Area Chairs of Selected Papers')
      // instruction
      expect(basicModalProps.children[1].props.children[0].props.children).toEqual(
        'You may customize the message that will be sent to the secondary senior program committee. In the email body, the text {{submit_review_link}} will be replaced with a hyperlink to the form where the secondary senior program committee can fill out his or her official meta review. You can also use {{fullname}} to personalize the recipient full name.'
      )
      // go to step2
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(async () => {
      // send messages
      await basicModalProps.onPrimaryButtonClick()
    })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2)
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          groups: ['~Test_AC1', '~Test_AC2'],
          replyTo: 'email@program.chairs',
          parentGroup: 'testVenue/Paper1/Senior_Program_Committee',
          invitation: 'TestVenue/Paper1/Secondary_Area_Chairs/-/Message',
        }),
        expect.anything()
      )
      expect(api.post).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          groups: ['~Test_AC1', '~Test_AC3'],
          replyTo: 'email@program.chairs',
          parentGroup: 'testVenue/Paper2/Senior_Program_Committee',
          invitation: 'TestVenue/Paper2/Secondary_Area_Chairs/-/Message',
        }),
        expect.anything()
      )
    })
  })
})
