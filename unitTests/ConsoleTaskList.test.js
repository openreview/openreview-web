import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ConsoleTaskList from '../components/webfield/ConsoleTaskList'

jest.mock('../lib/api-client')
import api from '../lib/api-client'
jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))

let venueId, submissionName
let authorName, reviewerName, areaChairName, seniorAreaChairName
let authorConsoleReferrer,
  reviewerConsoleReferrer,
  areaChairConsoleReferrer,
  seniorAreaChairConsoleReferrer
let noteInvitations, edgeInvitations, tagInvitations
let oneDay, fourDays

beforeAll(() => {
  venueId = 'ICML.cc/2023/Conference'
  submissionName = 'Submission'
  authorName = 'Authors'
  reviewerName = 'Reviewers'
  areaChairName = 'Area_Chairs'
  seniorAreaChairName = 'Senior_Area_Chairs'
  authorConsoleReferrer = encodeURIComponent(
    `[Author Console](/group?id=${venueId}/${authorName}#author-tasks)`
  )
  reviewerConsoleReferrer = encodeURIComponent(
    `[Reviewer Console](/group?id=${venueId}/${reviewerName}#reviewer-tasks)`
  )
  areaChairConsoleReferrer = encodeURIComponent(
    `[Area Chair Console](/group?id=${venueId}/${areaChairName}#areachair-tasks)`
  )
  seniorAreaChairConsoleReferrer = encodeURIComponent(
    `[Senior Area Chair Console](/group?id=${venueId}/${seniorAreaChairName}#seniorareachair-tasks)`
  )

  oneDay = 24 * 60 * 60 * 1000
  fourDays = 4 * oneDay
})

beforeEach(() => {
  api.getAll = jest.fn((_, body) => {
    switch (body.type) {
      case 'notes':
        return noteInvitations
      case 'edges':
        return edgeInvitations
      case 'tags':
        return tagInvitations
      default:
        return null
    }
  })
})

describe('ConsoleTaskList', () => {
  test('show empty message if there is no task (v1 venue)', async () => {
    noteInvitations = []
    edgeInvitations = []
    tagInvitations = []

    render(
      <ConsoleTaskList
        venueId={venueId}
        roleName={authorName}
        referrer={authorConsoleReferrer}
        filterAssignedInvitaiton={true}
        submissionName={submissionName}
        apiVersion={1}
      />
    )
    await waitFor(() => expect(screen.getByText('No outstanding tasks for this conference')))
  })

  test('show empty message if there is no task (v2 venue)', async () => {
    noteInvitations = []
    edgeInvitations = []
    tagInvitations = []

    render(
      <ConsoleTaskList
        venueId={venueId}
        roleName={authorName}
        referrer={authorConsoleReferrer}
        filterAssignedInvitaiton={false}
        submissionName={undefined}
        apiVersion={2}
      />
    )
    await waitFor(() => expect(screen.getByText('No outstanding tasks for this conference')))
  })

  test('show tasks of authors (v1 venue)', async () => {
    const now = Date.now()
    noteInvitations = [
      {
        id: `${venueId}/${submissionName}5/-/CommentOne`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        reply: {
          replyto: 'commentOneReplytoForum',
        },
        details: {
          repliedNotes: [],
          replytoNote: {
            forum: 'paper5Id',
            content: {
              title: 'title of note that comment one replied to',
            },
          },
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/CommentTwo`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        reply: {
          replyto: 'paper5Id',
        },
        details: {
          repliedNotes: [{ id: 'commentTwoId' }],
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
          },
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/CommentThree`,
        reply: {
          replyto: undefined,
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/${authorName}CommentFour`,
        duedate: now - fourDays,
        invitees: [`${venueId}/${submissionName}5/authors`],
        reply: {
          replyto: 'noteThatCommentFourRepliedTo',
        },
        details: {
          repliedNotes: [],
          replytoNote: {
            forum: 'paper5Id',
            content: {
              title: 'title of note that comment four replied to',
            },
          },
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/${authorName}CommentFive`,
        duedate: now + fourDays,
        invitees: [`${venueId}/${submissionName}5/authors`],
        reply: {
          replyto: 'paper5Id',
        },
        details: {
          repliedNotes: [{ id: 'commentFiveId' }],
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
          },
        },
      },
    ]
    edgeInvitations = [
      {
        id: `${venueId}/-/Expertise_Selection_One`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        reply: {
          content: {
            head: {
              type: 'Note',
            },
          },
        },
        web: undefined,
      },
      {
        id: `${venueId}/-/Expertise_Selection_Two`,
        duedate: now + fourDays,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        reply: {
          content: {
            head: {
              type: 'Note',
            },
          },
        },
        web: 'some web code',
      },
      {
        id: `${venueId}/-/Expertise_Selection_Three`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        reply: {
          content: {
            head: {
              type: 'Note',
            },
          },
        },
        web: undefined,
        details: {
          repliedEdges: [],
        },
      },
      {
        id: `${venueId}/-/Expertise_Selection_Four`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        reply: {
          content: {
            head: {
              type: 'Note',
            },
          },
        },
        web: 'some web code',
        details: {
          repliedEdges: [{ id: 'some edge' }],
        },
      },
      {
        id: `${venueId}/-/Expertise_Selection_Five`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${authorName}`],
        minReplies: 1,
        reply: {
          content: {
            head: {
              type: 'Note',
            },
          },
        },
        web: 'some web code',
        details: {
          repliedEdges: [{ id: 'some edge' }],
        },
      },
    ]
    tagInvitations = [
      {
        id: `${venueId}/-/Paper_Ranking_One`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        reply: {
          content: {
            tag: {
              // definition of tag control
            },
          },
        },
        web: undefined,
      },
      {
        id: `${venueId}/-/Paper_Ranking_Two`,
        duedate: now + fourDays,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        reply: {
          content: {
            tag: {
              // definition of tag control
            },
          },
        },
        web: 'some web code',
      },
      {
        id: `${venueId}/-/Paper_Ranking_Three`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        reply: {
          content: {
            head: {
              type: 'Note',
            },
          },
        },
        web: undefined,
        details: {
          repliedTags: [],
        },
      },
      {
        id: `${venueId}/-/Paper_Ranking_Four`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        reply: {
          content: {
            tag: {
              // definition of tag control
            },
          },
        },
        web: 'some web code',
        details: {
          repliedTags: [{ id: 'some tag' }],
        },
      },
      {
        id: `${venueId}/-/Paper_Ranking_Five`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${authorName}`],
        minReplies: 1,
        reply: {
          content: {
            tag: {
              // definition of tag control
            },
          },
        },
        web: 'some web code',
        details: {
          repliedTags: [{ id: 'some tag' }],
        },
      },
    ]

    render(
      <ConsoleTaskList
        venueId={venueId}
        roleName={authorName}
        referrer={authorConsoleReferrer}
        filterAssignedInvitaiton={true}
        submissionName={submissionName}
        apiVersion={1}
      />
    )
    await waitFor(() => {
      //#region note invitation assertions
      const commentOneLink = screen.getByText('Submission5 CommentOne')
      const commentTwoLink = screen.getByText('Submission5 CommentTwo')
      const commentThreeLink = screen.queryByText('Submission5 CommentThree')
      const commentFourLink = screen.getByText('Submission5 AuthorsCommentFour')
      const commentFiveLink = screen.queryByText('Submission5 AuthorsCommentFive')

      expect(commentOneLink).toBeInTheDocument()
      expect(commentOneLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=commentOneReplytoForum')
      )
      expect(commentOneLink.nextElementSibling).toHaveClass('warning')
      expect(commentOneLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(screen.getByText('title of note that comment one replied to'))

      expect(commentTwoLink).toBeInTheDocument()
      expect(commentTwoLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=commentTwoId')
      )
      expect(commentTwoLink.parentElement.parentElement).toHaveClass('completed')

      expect(commentThreeLink).not.toBeInTheDocument()

      expect(commentFourLink).toBeInTheDocument()
      expect(commentFourLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=noteThatCommentFourRepliedTo')
      )
      expect(commentFourLink.nextElementSibling).toHaveClass('expired')
      expect(commentFourLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(screen.getByText('title of note that comment four replied to'))

      expect(commentFiveLink).toBeInTheDocument()
      expect(commentFiveLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=commentFiveId')
      )
      expect(commentFiveLink.nextElementSibling).toHaveClass('duedate', { exact: true })
      expect(commentFiveLink.parentElement.parentElement).toHaveClass('completed')

      //#endregion

      //#region edge invitation assertions
      const expSel1Link = screen.getByText('Expertise Selection One')
      const expSel2Link = screen.getByText('Expertise Selection Two')
      const expSel3Link = screen.queryByText('Expertise Selection Three')
      const expSel4Link = screen.getByText('Expertise Selection Four')
      const expSel5Link = screen.queryByText('Expertise Selection Five')

      expect(expSel1Link).toBeInTheDocument()
      expect(expSel1Link).toHaveAttribute('href', expect.stringContaining(`id=${venueId}`))
      expect(expSel1Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(expSel1Link.nextElementSibling).toHaveClass('warning')

      expect(expSel2Link).toBeInTheDocument()
      expect(expSel2Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Expertise_Selection_Two`)
      )
      expect(expSel2Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(expSel2Link.nextElementSibling).toHaveClass('duedate', { exact: true })

      expect(expSel3Link).toBeInTheDocument()
      expect(expSel3Link).toHaveAttribute('href', expect.stringContaining(`id=${venueId}`))
      expect(expSel3Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(expSel3Link.nextElementSibling).toHaveClass('expired')

      expect(expSel4Link).toBeInTheDocument()
      expect(expSel4Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Expertise_Selection_Four`)
      )
      expect(expSel4Link.parentElement.parentElement).toHaveClass('completed')
      expect(expSel4Link.nextElementSibling).toHaveClass('expired')

      expect(expSel5Link).toBeInTheDocument()
      expect(expSel5Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Expertise_Selection_Five`)
      )
      expect(expSel5Link.parentElement.parentElement).toHaveClass('completed')
      expect(expSel5Link.nextElementSibling).toHaveClass('warning')

      //#endregion

      //#region tag invitation assertions
      const paperRank1Link = screen.getByText('Paper Ranking One')
      const paperRank2Link = screen.getByText('Paper Ranking Two')
      const paperRank3Link = screen.queryByText('Paper Ranking Three')
      const paperRank4Link = screen.getByText('Paper Ranking Four')
      const paperRank5Link = screen.queryByText('Paper Ranking Five')

      expect(paperRank1Link).toBeInTheDocument()
      expect(paperRank1Link).toHaveAttribute('href', expect.stringContaining(`id=${venueId}`))
      expect(paperRank1Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(paperRank1Link.nextElementSibling).toHaveClass('warning')

      expect(paperRank2Link).toBeInTheDocument()
      expect(paperRank2Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Paper_Ranking_Two`)
      )
      expect(paperRank2Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(paperRank2Link.nextElementSibling).toHaveClass('duedate', { exact: true })

      expect(paperRank3Link).toBeInTheDocument()
      expect(paperRank3Link).toHaveAttribute('href', expect.stringContaining(`id=${venueId}`))
      expect(paperRank3Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(paperRank3Link.nextElementSibling).toHaveClass('expired')

      expect(paperRank4Link).toBeInTheDocument()
      expect(paperRank4Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Paper_Ranking_Four`)
      )
      expect(paperRank4Link.parentElement.parentElement).toHaveClass('completed')
      expect(paperRank4Link.nextElementSibling).toHaveClass('expired')

      expect(paperRank5Link).toBeInTheDocument()
      expect(paperRank5Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Paper_Ranking_Five`)
      )
      expect(paperRank5Link.parentElement.parentElement).toHaveClass('completed')
      expect(paperRank5Link.nextElementSibling).toHaveClass('warning')

      //#endregion
    })
  })

  test('show tasks of authors (v2 venue)', async () => {
    const now = Date.now()
    noteInvitations = [
      {
        id: `${venueId}/${submissionName}5/-/No_Reply`, // filter out by has replyto
        duedate: now + oneDay,
        edit: {
          note: {
            id: undefined,
            replyto: undefined,
          },
        },
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
      },
      {
        id: `${venueId}/${submissionName}5/-/Revision`, // id is string no replyto
        duedate: now - oneDay,
        edit: {
          note: {
            id: 'paper5Id',
            replyto: undefined,
          },
        },
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        details: {
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
          },
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Revision_Complete`, // id is string no replyto
        duedate: now - oneDay,
        edit: {
          note: {
            id: 'paper5Id',
            replyto: undefined,
          },
        },
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        details: {
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
          },
          repliedNotes: [
            {
              id: 'paper5Id',
              forum: 'paper5Id',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Camera_Ready_Revision`, // no id replyto is string
        duedate: now + fourDays,
        edit: {
          note: {
            id: undefined,
            forum: 'paper5Id',
            replyto: 'paper5Id',
          },
        },
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        details: {
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
          },
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Camera_Ready_Revision_Complete`, // no id replyto is string
        duedate: now - fourDays,
        edit: {
          note: {
            id: undefined,
            forum: 'paper5Id',
            replyto: {
              param: {
                const: 'paper5Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        details: {
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
          },
          repliedNotes: [
            {
              id: 'paper5Id',
              forum: 'paper5Id',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Rebuttal`, // no id replyto is string
        duedate: now + oneDay,
        edit: {
          note: {
            id: { param: { withInvitation: `${venueId}/${submissionName}5/-/Rebuttal` } },
            forum: 'paper5Id',
            replyto: {
              param: {
                withForum: 'paper5Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        details: {
          replytoNote: undefined,
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Rebuttal_Single_Reply`, // no id replyto is string
        duedate: now + oneDay,
        edit: {
          note: {
            id: { param: { withInvitation: `${venueId}/${submissionName}5/-/Rebuttal` } },
            forum: 'paper5Id',
            replyto: {
              param: {
                withForum: 'paper5Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        details: {
          replytoNote: undefined,
          repliedNotes: [
            {
              id: 'rebuttalId1',
              forum: 'paper5Id',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Rebuttal_Multi_Reply`,
        duedate: now + oneDay,
        edit: {
          note: {
            id: { param: { withInvitation: `${venueId}/${submissionName}5/-/Rebuttal` } },
            forum: 'paper5Id',
            replyto: {
              param: {
                withForum: 'paper5Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}5/${authorName}`],
        details: {
          replytoNote: undefined,
          repliedNotes: [
            {
              id: 'rebuttalId1',
              forum: 'paper5Id',
            },
            {
              id: 'rebuttalId2',
              forum: 'paper5Id',
            },
          ],
        },
      },
    ]
    edgeInvitations = [
      {
        id: `${venueId}/Action_Editors/-/Recommendation`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        edge: {
          head: {
            param: { type: 'Note' },
          },
        },
        web: undefined,
      },
      {
        id: `${venueId}/Action_Editors/-/Recommendation_Two`,
        duedate: now + fourDays,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        edge: {
          head: {
            param: { type: 'Note' },
          },
        },
        web: 'some web code',
      },
      {
        id: `${venueId}/Action_Editors/-/Recommendation_Three`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        edge: {
          head: {
            param: { type: 'Note' },
          },
        },
        web: undefined,
        details: {
          repliedEdges: [],
        },
      },
      {
        id: `${venueId}/Action_Editors/-/Recommendation_Four`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        edge: {
          head: {
            param: { type: 'Note' },
          },
        },
        web: 'some web code',
        details: {
          repliedEdges: [{ id: 'some edge' }],
        },
      },
      {
        id: `${venueId}/Action_Editors/-/Recommendation_Five`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${authorName}`],
        minReplies: 1,
        edge: {
          head: {
            param: { type: 'Note' },
          },
        },
        web: 'some web code',
        details: {
          repliedEdges: [{ id: 'some edge' }],
        },
      },
    ]
    tagInvitations = [
      {
        id: `${venueId}/-/Paper_Ranking_One`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        tag: {
          // definition of tag control
        },
        web: undefined,
      },
      {
        id: `${venueId}/-/Paper_Ranking_Two`,
        duedate: now + fourDays,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        tag: {
          // definition of tag control
        },
        web: 'some web code',
      },
      {
        id: `${venueId}/-/Paper_Ranking_Three`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        tag: {
          // definition of tag control
        },
        web: undefined,
        details: {
          repliedTags: [],
        },
      },
      {
        id: `${venueId}/-/Paper_Ranking_Four`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${authorName}`],
        taskCompletionCount: 1,
        tag: {
          // definition of tag control
        },
        web: 'some web code',
        details: {
          repliedTags: [{ id: 'some tag' }],
        },
      },
      {
        id: `${venueId}/-/Paper_Ranking_Five`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${authorName}`],
        minReplies: 1,
        tag: {
          // definition of tag control
        },
        web: 'some web code',
        details: {
          repliedTags: [{ id: 'some tag' }],
        },
      },
    ]
    render(
      <ConsoleTaskList
        venueId={venueId}
        roleName={authorName}
        referrer={authorConsoleReferrer}
        filterAssignedInvitaiton={true}
        submissionName={submissionName}
        apiVersion={2}
      />
    )

    await waitFor(() => {
      //#region note invitation assertions
      const noReplyLink = screen.queryByText('Submission5 No Reply')
      const revisionLink = screen.getByText('Submission5 Revision')
      const revisionCompleteLink = screen.getByText('Submission5 Revision Complete')
      const cameraReadyRevisionLink = screen.getByText('Submission5 Camera Ready Revision')
      const cameraReadyRevisionCompleteLink = screen.getByText(
        'Submission5 Camera Ready Revision Complete'
      )
      const rebuttalLink = screen.getByText('Submission5 Rebuttal')
      const rebuttalSingleReplyLink = screen.getByText('Submission5 Rebuttal Single Reply')
      const rebuttalMultiReplyLink = screen.getByText('Submission5 Rebuttal Multi Reply')

      expect(noReplyLink).not.toBeInTheDocument()

      expect(revisionLink).toBeInTheDocument()
      expect(revisionLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(revisionLink.nextElementSibling).toHaveClass('expired')
      expect(revisionLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&invitationId=')
      )

      expect(revisionCompleteLink).toBeInTheDocument()
      expect(revisionCompleteLink.parentElement.parentElement).toHaveClass('completed')
      expect(revisionCompleteLink.nextElementSibling).toHaveClass('expired')
      expect(revisionCompleteLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id')
      )

      expect(cameraReadyRevisionLink).toBeInTheDocument()
      expect(cameraReadyRevisionLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(cameraReadyRevisionLink.nextElementSibling).toHaveClass('duedate', {
        exact: true,
      })
      expect(cameraReadyRevisionLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=paper5Id&invitationId=')
      )

      expect(cameraReadyRevisionCompleteLink).toBeInTheDocument()
      expect(cameraReadyRevisionCompleteLink.parentElement.parentElement).toHaveClass(
        'completed'
      )
      expect(cameraReadyRevisionCompleteLink.nextElementSibling).toHaveClass('expired')
      expect(cameraReadyRevisionCompleteLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=paper5Id')
      )

      expect(rebuttalLink).toBeInTheDocument()
      expect(rebuttalLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(rebuttalLink.nextElementSibling).toHaveClass('warning')
      expect(rebuttalLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=[object%20Object]&invitationId=') // issue #1467
      )

      expect(rebuttalSingleReplyLink).toBeInTheDocument()
      expect(rebuttalSingleReplyLink.parentElement.parentElement).toHaveClass('completed')
      expect(rebuttalSingleReplyLink.nextElementSibling).toHaveClass('warning')
      expect(rebuttalSingleReplyLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=rebuttalId1')
      )

      expect(rebuttalMultiReplyLink).toBeInTheDocument()
      expect(rebuttalMultiReplyLink.parentElement.parentElement).toHaveClass('completed')
      expect(rebuttalMultiReplyLink.nextElementSibling).toHaveClass('warning')
      expect(rebuttalMultiReplyLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=[object%20Object]')
      )
      //#endregion

      //#region edge invitation assertions
      const acRecom1Link = screen.getByText('Action Editor Recommendation')
      const acRecom2Link = screen.getByText('Action Editor Recommendation Two')
      const acRecom3Link = screen.queryByText('Action Editor Recommendation Three')
      const acRecom4Link = screen.getByText('Action Editor Recommendation Four')
      const acRecom5Link = screen.queryByText('Action Editor Recommendation Five')

      expect(acRecom1Link).toBeInTheDocument()
      expect(acRecom1Link).toHaveAttribute('href', expect.stringContaining(`id=${venueId}`))
      expect(acRecom1Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(acRecom1Link.nextElementSibling).toHaveClass('warning')

      expect(acRecom2Link).toBeInTheDocument()
      expect(acRecom2Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/Action_Editors/-/Recommendation_Two`)
      )
      expect(acRecom2Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(acRecom2Link.nextElementSibling).toHaveClass('duedate', { exact: true })

      expect(acRecom3Link).toBeInTheDocument()
      expect(acRecom3Link).toHaveAttribute('href', expect.stringContaining(`id=${venueId}`))
      expect(acRecom3Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(acRecom3Link.nextElementSibling).toHaveClass('expired')

      expect(acRecom4Link).toBeInTheDocument()
      expect(acRecom4Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/Action_Editors/-/Recommendation_Four`)
      )
      expect(acRecom4Link.parentElement.parentElement).toHaveClass('completed')
      expect(acRecom4Link.nextElementSibling).toHaveClass('expired')

      expect(acRecom5Link).toBeInTheDocument()
      expect(acRecom5Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/Action_Editors/-/Recommendation_Five`)
      )
      expect(acRecom5Link.parentElement.parentElement).toHaveClass('completed')
      expect(acRecom5Link.nextElementSibling).toHaveClass('warning')

      //#endregion

      //#region tag invitation assertions
      const paperRank1Link = screen.getByText('Paper Ranking One')
      const paperRank2Link = screen.getByText('Paper Ranking Two')
      const paperRank3Link = screen.queryByText('Paper Ranking Three')
      const paperRank4Link = screen.getByText('Paper Ranking Four')
      const paperRank5Link = screen.queryByText('Paper Ranking Five')

      expect(paperRank1Link).toBeInTheDocument()
      expect(paperRank1Link).toHaveAttribute('href', expect.stringContaining(`id=${venueId}`))
      expect(paperRank1Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(paperRank1Link.nextElementSibling).toHaveClass('warning')

      expect(paperRank2Link).toBeInTheDocument()
      expect(paperRank2Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Paper_Ranking_Two`)
      )
      expect(paperRank2Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(paperRank2Link.nextElementSibling).toHaveClass('duedate', { exact: true })

      expect(paperRank3Link).toBeInTheDocument()
      expect(paperRank3Link).toHaveAttribute('href', expect.stringContaining(`id=${venueId}`))
      expect(paperRank3Link.parentElement.parentElement).not.toHaveClass('completed')
      expect(paperRank3Link.nextElementSibling).toHaveClass('expired')

      expect(paperRank4Link).toBeInTheDocument()
      expect(paperRank4Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Paper_Ranking_Four`)
      )
      expect(paperRank4Link.parentElement.parentElement).toHaveClass('completed')
      expect(paperRank4Link.nextElementSibling).toHaveClass('expired')

      expect(paperRank5Link).toBeInTheDocument()
      expect(paperRank5Link).toHaveAttribute(
        'href',
        expect.stringContaining(`id=${venueId}/-/Paper_Ranking_Five`)
      )
      expect(paperRank5Link.parentElement.parentElement).toHaveClass('completed')
      expect(paperRank5Link.nextElementSibling).toHaveClass('warning')

      //#endregion
    })
  })

  test('show tasks of reviewers (v1 venue)', async () => {
    const now = Date.now()
    const submissionNumbers = ['5']
    noteInvitations = [
      {
        id: `${venueId}/${submissionName}5/-/CommentOne`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        reply: {
          replyto: 'commentOneReplytoForum',
        },
        details: {
          repliedNotes: [],
          replytoNote: {
            forum: 'paper5Id',
            content: {
              title: 'title of note that comment one replied to',
            },
          },
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/CommentTwo`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        reply: {
          replyto: 'paper5Id',
        },
        details: {
          repliedNotes: [{ id: 'commentTwoId' }],
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
          },
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/CommentThree`,
        duedate: now - fourDays,
        reply: {
          replyto: undefined,
        },
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        details: {
          repliedNotes: [],
          replytoNote: {
            forum: 'paper5Id',
            id: 'paper5Id',
          },
        },
      },
      {
        id: `${venueId}/${submissionName}123/-/CommentOne`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${submissionName}123/${reviewerName}`],
        reply: {
          replyto: 'commentOneReplytoForum',
        },
        details: {
          repliedNotes: [],
          replytoNote: {
            forum: 'paper123Id',
            content: {
              title: 'title of note that comment one replied to',
            },
          },
        },
      },
      {
        id: `${venueId}/${submissionName}123/-/CommentTwo`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${submissionName}123/${reviewerName}`],
        reply: {
          replyto: 'paper123Id',
        },
        details: {
          repliedNotes: [{ id: 'commentTwoId' }],
          replytoNote: {
            id: 'paper123Id',
            forum: 'paper123Id',
          },
        },
      },
    ]
    edgeInvitations = [] // same as author console
    tagInvitations = [] // same as author console
    render(
      <ConsoleTaskList
        venueId={venueId}
        roleName={reviewerName}
        referrer={reviewerConsoleReferrer}
        filterAssignedInvitaiton={true}
        submissionName={submissionName}
        submissionNumbers={submissionNumbers}
        apiVersion={1}
      />
    )

    await waitFor(() => {
      const commentOneLink = screen.getByText('Submission5 CommentOne')
      const commentTwoLink = screen.getByText('Submission5 CommentTwo')
      const commentThreeLink = screen.queryByText('Submission5 CommentThree')
      const Paper123CommentOneLink = screen.queryByText('Submission123 CommentOne')
      const Paper123CommentTwoLink = screen.queryByText('Submission123 CommentTwo')

      expect(commentOneLink).toBeInTheDocument()
      expect(commentOneLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(commentOneLink.nextElementSibling).toHaveClass('warning')
      expect(commentOneLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=commentOneReplytoForum')
      )
      expect(screen.getByText('title of note that comment one replied to')).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id')
      )

      expect(commentTwoLink).toBeInTheDocument()
      expect(commentTwoLink.parentElement.parentElement).toHaveClass('completed')
      expect(commentTwoLink.nextElementSibling).toHaveClass('expired')
      expect(commentTwoLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=commentTwoId')
      )

      expect(commentThreeLink).not.toBeInTheDocument()
      expect(Paper123CommentOneLink).not.toBeInTheDocument()
      expect(Paper123CommentTwoLink).not.toBeInTheDocument()
    })
  })

  test('show tasks of reviewers (v2 venue)', async () => {
    const now = Date.now()
    const submissionNumbers = ['5']
    noteInvitations = [
      {
        id: `${venueId}/-/No_Reply`, // filter out by has replyto
        duedate: now + oneDay,
        edit: {
          note: {
            id: undefined,
            replyto: undefined,
          },
        },
        invitees: [`${venueId}/${reviewerName}`],
      },
      {
        id: `${venueId}/${submissionName}5/-/Official_Comment_One`, // id is string no replyto
        duedate: now - oneDay,
        edit: {
          note: {
            id: 'paper5Id',
            replyto: undefined,
          },
        },
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        details: {
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
          },
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Official_Comment_Two`, // id is string no replyto
        duedate: now - oneDay,
        edit: {
          note: {
            id: 'paper5Id',
            forum: 'paper5Id',
            replyto: undefined,
          },
        },
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        details: {
          repliedNotes: [
            {
              id: 'commend2Id',
              forum: 'paper5Id',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Official_Comment_Three`, // no id replyto is string
        duedate: now + fourDays,
        edit: {
          note: {
            id: undefined,
            forum: 'paper5Id',
            replyto: 'paper5Id',
          },
        },
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        details: {
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Official_Comment_Four`, // no id replyto is string
        duedate: now - fourDays,
        edit: {
          note: {
            id: undefined,
            forum: 'paper5Id',
            replyto: {
              param: {
                const: 'paper5Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        details: {
          repliedNotes: [
            {
              id: 'comment4Id',
              forum: 'paper5Id',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Official_Comment_Five`, // no id replyto is string
        duedate: now + oneDay,
        edit: {
          note: {
            id: {
              param: {
                withInvitation: `${venueId}/${submissionName}5/-/Official_Comment_Five`,
              },
            },
            forum: 'paper5Id',
            replyto: {
              param: {
                withForum: 'paper5Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        details: {
          replytoNote: undefined,
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Official_Comment_Six`, // no id replyto is string
        duedate: now + oneDay,
        edit: {
          note: {
            id: {
              param: {
                withInvitation: `${venueId}/${submissionName}5/-/Official_Comment_Six`,
              },
            },
            forum: 'paper5Id',
            replyto: {
              param: {
                withForum: 'paper5Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        details: {
          replytoNote: undefined,
          repliedNotes: [
            {
              id: 'comment6Id',
              forum: 'paper5Id',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Official_Comment_Seven`,
        duedate: now + oneDay,
        edit: {
          note: {
            id: {
              param: {
                withInvitation: `${venueId}/${submissionName}5/-/Official_Comment_Seven`,
              },
            },
            forum: 'paper5Id',
            replyto: {
              param: {
                withForum: 'paper5Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}5/${reviewerName}`],
        details: {
          replytoNote: undefined,
          repliedNotes: [
            {
              id: 'comment7IdOne',
              forum: 'paper5Id',
            },
            {
              id: 'comment7IdTwo',
              forum: 'paper5Id',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}123/-/Official_Comment_Seven`,
        duedate: now + oneDay,
        edit: {
          note: {
            id: {
              param: {
                withInvitation: `${venueId}/${submissionName}123/-/Official_Comment_Seven`,
              },
            },
            forum: 'paper123Id',
            replyto: {
              param: {
                withForum: 'paper123Id',
              },
            },
          },
        },
        invitees: [`${venueId}/${submissionName}123/${reviewerName}`],
        details: {
          replytoNote: undefined,
          repliedNotes: [
            {
              id: 'comment7IdOne',
              forum: 'paper123Id',
            },
            {
              id: 'comment7IdTwo',
              forum: 'paper123Id',
            },
          ],
        },
      },
    ]
    edgeInvitations = []
    tagInvitations = []
    render(
      <ConsoleTaskList
        venueId={venueId}
        roleName={reviewerName}
        referrer={reviewerConsoleReferrer}
        filterAssignedInvitaiton={true}
        submissionName={submissionName}
        submissionNumbers={submissionNumbers}
      />
    )
    await waitFor(() => {
      const commentOneLink = screen.getByText('Submission5 Official Comment One')
      const commentTwoLink = screen.getByText('Submission5 Official Comment Two')
      const commentThreeLink = screen.queryByText('Submission5 Official Comment Three')
      const commentFourLink = screen.getByText('Submission5 Official Comment Four')
      const commentFiveLink = screen.queryByText('Submission5 Official Comment Five')
      const commentSixLink = screen.getByText('Submission5 Official Comment Six')
      const commentSevenLink = screen.getByText('Submission5 Official Comment Seven')
      const Paper123CommentSevenLink = screen.queryByText(
        'Submission123 Official Comment Seven'
      )

      expect(commentOneLink).toBeInTheDocument()
      expect(commentOneLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(commentOneLink.nextElementSibling).toHaveClass('expired')
      expect(commentOneLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&invitationId=')
      )

      expect(commentTwoLink).toBeInTheDocument()
      expect(commentTwoLink.parentElement.parentElement).toHaveClass('completed')
      expect(commentTwoLink.nextElementSibling).toHaveClass('expired')
      expect(commentTwoLink).toHaveAttribute('href', expect.stringContaining('id=paper5Id'))

      expect(commentThreeLink).toBeInTheDocument()
      expect(commentThreeLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(commentThreeLink.nextElementSibling).toHaveClass('duedate', { exact: true })
      expect(commentThreeLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=paper5Id&invitationId=')
      )

      expect(commentFourLink).toBeInTheDocument()
      expect(commentFourLink.parentElement.parentElement).toHaveClass('completed')
      expect(commentFourLink.nextElementSibling).toHaveClass('expired')
      expect(commentFourLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=comment4Id')
      )

      expect(commentFiveLink).toBeInTheDocument()
      expect(commentFiveLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(commentFiveLink.nextElementSibling).toHaveClass('warning')
      expect(commentFiveLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=[object%20Object]&invitationId=') // issue #1467
      )

      expect(commentSixLink).toBeInTheDocument()
      expect(commentSixLink.parentElement.parentElement).toHaveClass('completed')
      expect(commentSixLink.nextElementSibling).toHaveClass('warning')
      expect(commentSixLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=comment6Id')
      )

      expect(commentSevenLink).toBeInTheDocument()
      expect(commentSevenLink.parentElement.parentElement).toHaveClass('completed')
      expect(commentSevenLink.nextElementSibling).toHaveClass('warning')
      expect(commentSevenLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=[object%20Object]')
      )

      expect(Paper123CommentSevenLink).not.toBeInTheDocument()
    })
  })

  test('show tasks of area chairs (v2 only)', async () => {
    const now = Date.now()
    noteInvitations = [
      {
        id: `${venueId}/${areaChairName}/-/Registration`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${areaChairName}`],
        edit: {
          note: {
            forum: 'registrationForumId',
            replyto: 'registrationForumId',
          },
        },
        details: {
          replytoNote: {
            forum: 'registrationForumId',
            content: {
              title: {
                value: 'ICML 2023 Conference - Area Chair registration',
              },
            },
          },
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${areaChairName}/-/Registration_Two`,
        duedate: now - oneDay,
        invitees: [`${venueId}/${areaChairName}`],
        edit: {
          note: {
            forum: 'registrationForumId2',
            replyto: 'registrationForumId2',
          },
        },
        details: {
          replytoNote: {
            forum: 'registrationForumId2',
            content: {
              title: {
                value: 'ICML 2023 Conference - Area Chair registration Two',
              },
            },
          },
          repliedNotes: [
            {
              id: 'registrationReplyId',
              forum: 'registrationForumId2',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Meta_Review`,
        duedate: now + fourDays,
        invitees: [`${venueId}/${areaChairName}`],
        edit: {
          note: {
            forum: 'paper5Id',
            replyto: 'paper5Id',
          },
        },
        details: {
          replytoNote: {
            forum: 'paper5Id',
            content: {
              title: {
                value: 'Paper 5 Title',
              },
            },
          },
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${submissionName}123/-/Meta_Review`,
        duedate: now - fourDays,
        invitees: [`${venueId}/${areaChairName}`],
        edit: {
          note: {
            forum: 'paper123Id',
            replyto: 'paper123Id',
          },
        },
        details: {
          replytoNote: {
            forum: 'paper123Id',
            content: {
              title: {
                value: 'Paper 123 Title',
              },
            },
          },
          repliedNotes: [
            {
              id: 'paper123ReplyId',
              forum: 'paper123Id',
              replyto: 'paper123Id',
            },
          ],
        },
      },
      {
        id: `${venueId}/${submissionName}456/-/Revision`, // AC is also author of this paper
        duedate: now - oneDay,
        edit: {
          note: {
            id: 'paper456Id',
            replyto: undefined,
          },
        },
        invitees: [`${venueId}/${submissionName}456/${authorName}`],
        details: {
          replytoNote: {
            id: 'paper456Id',
            forum: 'paper456Id',
          },
          repliedNotes: [],
        },
      },
    ]
    edgeInvitations = []
    tagInvitations = []

    render(
      <ConsoleTaskList
        venueId={venueId}
        roleName={areaChairName}
        referrer={areaChairConsoleReferrer}
        filterAssignedInvitaiton={false}
        submissionName={undefined}
        submissionNumbers={undefined}
      />
    )

    await waitFor(() => {
      const registrationLink = screen.getByText('Area Chair Registration')
      const registrationTwoLink = screen.getByText('Area Chair Registration Two')
      const Paper5metaReviewLink = screen.getByText('Submission5 Meta Review')
      const Paper123metaReviewLink = screen.getByText('Submission123 Meta Review')
      const Paper456revisionLink = screen.queryByText('Submission456 Revision')

      expect(registrationLink).toBeInTheDocument()
      expect(registrationLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(registrationLink.nextElementSibling).toHaveClass('warning')
      expect(registrationLink).toHaveAttribute(
        'href',
        expect.stringContaining(
          'id=registrationForumId&noteId=registrationForumId&invitationId='
        )
      )
      expect(
        screen.getByText('ICML 2023 Conference - Area Chair registration')
      ).toHaveAttribute('href', expect.stringContaining('id=registrationForumId'))

      expect(registrationTwoLink).toBeInTheDocument()
      expect(registrationTwoLink.parentElement.parentElement).toHaveClass('completed')
      expect(registrationTwoLink.nextElementSibling).toHaveClass('expired')
      expect(registrationTwoLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=registrationForumId2&noteId=registrationReplyId')
      )
      expect(
        screen.getByText('ICML 2023 Conference - Area Chair registration Two')
      ).toHaveAttribute('href', expect.stringContaining('id=registrationForumId2'))

      expect(Paper5metaReviewLink).toBeInTheDocument()
      expect(Paper5metaReviewLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(Paper5metaReviewLink.nextElementSibling).toHaveClass('duedate', { exact: true })
      expect(Paper5metaReviewLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=paper5Id&invitationId=')
      )
      expect(screen.getByText('Paper 5 Title')).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id')
      )

      expect(Paper123metaReviewLink).toBeInTheDocument()
      expect(Paper123metaReviewLink.parentElement.parentElement).toHaveClass('completed')
      expect(Paper123metaReviewLink.nextElementSibling).toHaveClass('expired')
      expect(Paper123metaReviewLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper123Id&noteId=paper123ReplyId')
      )
      expect(screen.getByText('Paper 123 Title')).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper123Id')
      )

      expect(Paper456revisionLink).not.toBeInTheDocument()
    })
  })

  test('show tasks of senior area chairs (v2 only)', async () => {
    const now = Date.now()
    noteInvitations = [
      {
        id: `${venueId}/${seniorAreaChairName}/-/Registration`,
        duedate: now + oneDay,
        invitees: [`${venueId}/${seniorAreaChairName}`],
        edit: {
          note: {
            forum: 'registrationForumId',
            replyto: 'registrationForumId',
          },
        },
        details: {
          replytoNote: {
            forum: 'registrationForumId',
            content: {
              title: {
                value: 'ICML 2023 Conference - Senior Area Chair registration',
              },
            },
          },
          repliedNotes: [],
        },
      },
      {
        id: `${venueId}/${submissionName}5/Area_Chair_AnonId/-/Meta_Review_Agreement`,
        duedate: now + fourDays,
        invitees: [`${venueId}/${submissionName}5/${seniorAreaChairName}`],
        edit: {
          note: {
            forum: 'paper5Id',
            replyto: 'metaReviewId',
          },
          details: {
            replytoNote: {
              id: 'metaReviewId',
              forum: 'paper5Id',
              replyto: 'paper5Id',
              content: {
                title: undefined, // meta review may not have title
                metareview: { value: 'meta review content' },
                recommendation: { value: 'meta review recommendation' },
              },
            },
            repliedNotes: [
              {
                id: 'metaReviewAgreementId',
                forum: 'paper5Id',
                replyto: 'metaReviewId',
              },
            ],
          },
        },
      },
      {
        id: `${venueId}/${submissionName}5/-/Meta_Review_SAC_Revision`,
        duedate: now - fourDays,
        invitees: [`${venueId}/${submissionName}5/${seniorAreaChairName}`],
        edit: {
          note: {
            id: {
              param: {
                withInvitation: `${venueId}/${submissionName}5/-/Meta_Review`,
              },
            },
            forum: 'paper5Id',
            replyto: 'paper5Id',
          },
        },
        details: {
          replytoNote: {
            id: 'paper5Id',
            forum: 'paper5Id',
            content: {
              title: { value: 'Paper 5 Title' },
            },
          },
          repliedNotes: [], // signature is still ac so repliedNotes is empty
          repliedEdits: [
            {
              id: 'metaReviewSACEditId',
            },
          ],
        },
      },
    ]
    edgeInvitations = []
    tagInvitations = []
    render(
      <ConsoleTaskList
        venueId={venueId}
        roleName={seniorAreaChairName}
        referrer={seniorAreaChairConsoleReferrer}
        filterAssignedInvitaiton={false}
        submissionName={undefined}
        submissionNumbers={undefined}
      />
    )

    await waitFor(() => {
      const registrationLink = screen.getByText('Senior Area Chair Registration')
      const metaReviewAgreementLink = screen.getByText('Submission5 Meta Review Agreement')
      const metaReviewRevisionLink = screen.getByText('Submission5 Meta Review SAC Revision')

      expect(registrationLink).toBeInTheDocument()
      expect(registrationLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(registrationLink.nextElementSibling).toHaveClass('warning')
      expect(registrationLink).toHaveAttribute(
        'href',
        expect.stringContaining(
          'id=registrationForumId&noteId=registrationForumId&invitationId='
        )
      )
      expect(
        screen.getByText('ICML 2023 Conference - Senior Area Chair registration')
      ).toHaveAttribute('href', expect.stringContaining('id=registrationForumId'))

      expect(metaReviewAgreementLink).toBeInTheDocument()
      expect(metaReviewAgreementLink.parentElement.parentElement).not.toHaveClass('completed')
      expect(metaReviewAgreementLink.nextElementSibling).toHaveClass('duedate', {
        exact: true,
      })
      expect(metaReviewAgreementLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=metaReviewId&invitationId=')
      )

      expect(metaReviewRevisionLink).toBeInTheDocument()
      expect(metaReviewRevisionLink.parentElement.parentElement).toHaveClass('completed')
      expect(metaReviewRevisionLink.nextElementSibling).toHaveClass('expired')
      expect(metaReviewRevisionLink).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id&noteId=paper5Id')
      )
      expect(screen.getByText('Paper 5 Title')).toHaveAttribute(
        'href',
        expect.stringContaining('id=paper5Id')
      )
    })
  })
})
