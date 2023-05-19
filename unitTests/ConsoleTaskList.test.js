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
  authorConsoleReferrer = encodeURIComponent(
    `[Author Console](/group?id=${venueId}/${authorName}#author-tasks)`
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

  test.skip('show tasks of authors (v2 venue)', async () => {
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
        apiVersion={2}
      />
    )
    fail('not implemented')
  })

  test.skip('show tasks of reviewers (v1 venue)', () => {
    noteInvitations = []
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
        apiVersion={1}
      />
    )
    fail('not implemented')
  })

  test.skip('show tasks of reviewers (v2 venue)', () => {
    noteInvitations = []
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
    fail('not implemented')
  })

  test.skip('show tasks of area chairs (v2 only)', () => {
    noteInvitations = []
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
    fail('not implemented')
  })

  test.skip('show tasks of senior area chairs (v2 only)', () => {
    noteInvitations = []
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
    fail('not implemented')
  })
})
