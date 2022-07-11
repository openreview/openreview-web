import { useContext, useEffect, useState } from 'react'
import api from '../../lib/api-client'
import Table from '../Table'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import TaskList from '../TaskList'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { ReviewerConsoleNoteReviewStatus } from './NoteReviewStatus'
import NoteSummary from './NoteSummary'
import useUser from '../../hooks/useUser'

const AssignedPaperRow = ({
  note,
  invitations,
  officialReviews,
  venueId,
  reviewerName,
  officialReviewName,
  reviewRatingName,
}) => {
  const referrerUrl = encodeURIComponent(
    `[Reviewer Console](/group?id=${venueId}/${reviewerName}#assigned-papers)`
  )
  const officialReviewInvitaitonId = `${venueId}/Paper${note.number}/-/${officialReviewName}`
  const officialReviewInvitation = invitations.find((p) => p.id === officialReviewInvitaitonId)
  const officialReview = officialReviews.find(
    (p) => p.invitation === officialReviewInvitaitonId
  )
  const isV2Note = note.version === 2
  return (
    <tr>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={isV2Note} />
      </td>
      <td>
        <ReviewerConsoleNoteReviewStatus
          editUrl={
            officialReview
              ? `/forum?id=${note.forum}&noteId=${officialReview.id}&referrer=${referrerUrl}`
              : null
          }
          paperRating={officialReview.content[reviewRatingName]}
          review={officialReview.content.review}
          invitaitonUrl={
            officialReviewInvitation
              ? `/forum?id=${note.forum}&noteId=${note.id}&invitationId=${officialReviewInvitation.id}&referrer=${referrerUrl}`
              : null
          }
        />
      </td>
    </tr>
  )
}

const ReviewerConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    reviewerName,
    officialReviewName,
    reviewRatingName,
    blindSubmissionId,
    customLoadInvitation,
    reviewLoad,
  } = useContext(WebFieldContext)
  const { user, accessToken, userLoading } = useUser()
  const [customLoad, setCustomLoad] = useState(null)
  const [blindedNotes, setBlindedNotes] = useState([])
  const [invitations, setInvitations] = useState([])
  const [officialReviews, setOfficialReviews] = useState([])
  const wildcardInvitation = `${venueId}/.*`
  const customMaxPapersId = `${venueId}/${reviewerName}/-/Custom_Max_Papers`

  const getNumberFromGroup = (groupId, name = 'Paper') => {
    const paper = groupId.split('/').find((p) => p.indexOf(name) === 0)
    return paper ? parseInt(paper.substring(name.length), 10) : null
  }

  const loadData = async () => {
    const userIds = [...user.profile.usernames, ...user.profile.emails]

    try {
      // #region get reviewer note number
      const singularName = reviewerName.endsWith('s')
        ? reviewerName.slice(0, -1)
        : reviewerName
      const memberGroups = await api.getAll(
        '/groups',
        {
          regex: wildcardInvitation,
          member: user.id,
        },
        { accessToken, version: 1 }
      )
      const anonGroups = memberGroups.filter((p) => p.id.includes(`/${singularName}_`))
      const groupByNumber = memberGroups
        .filter((p) => p.id.endsWith(`/${reviewerName}`))
        .reduce((prev, curr) => {
          const num = getNumberFromGroup(curr.id)
          const anonGroup = anonGroups.find((p) =>
            p.id.startsWith(`${venueId}/Paper/${num}/${singularName}_`)
          )
          return anonGroup ? { ...prev, [num]: anonGroup.id } : prev
        }, {})
      //#endregion

      const noteNumbers = Object.keys(groupByNumber)

      // #region get blinded notes
      const getBlindedNotesP = noteNumbers.length
        ? api
            .get(
              '/notes',
              {
                invitation: blindSubmissionId,
                number: noteNumbers.join(','),
                select:
                  'id,number,forum,content.title,content.authors,content.authorDomains,content.pdf',
                details: 'invitation',
                sort: 'number:asc',
              },
              { accessToken }
            )
            .then((result) => result.notes ?? [])
        : Promise.resolve([])
      //#endregion

      // #region get official reviews
      const getOfficialReviewsPs = noteNumbers.length
        ? Promise.all(
            noteNumbers.map((noteNumber) => {
              return api
                .get(
                  '/notes',
                  { invitation: `${venueId}/Paper${noteNumber}/-/${officialReviewName}` },
                  { accessToken }
                )
                .then((result) => result.notes ?? [])
            })
          ).then((results) => results.flat())
        : Promise.resolve([])
      // #endregion

      // #region get all invitations
      const invitationsP = api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          replyto: true,
          type: 'notes',
          details: 'replytoNote,repliedNotes',
        },
        { accessToken, version: 1 }
      )
      const edgeInvitationsP = api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'edges',
          details: 'repliedEdges',
        },
        { accessToken, version: 1 }
      )
      const tagInvitationsP = api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'tags',
          details: 'repliedTags',
        },
        { accessToken, version: 1 }
      )
      const getAllInvitationsP = Promise.all([
        invitationsP,
        edgeInvitationsP,
        tagInvitationsP,
      ]).then(([noteInvitations, edgeInvitations, tagInvitations]) => {
        noteInvitations
          .concat(edgeInvitations)
          .concat(tagInvitations)
          .filter((p) => p.invitees?.some((q) => q.indexOf(reviewerName) !== -1))
      })
      // #endregion

      // #region get custom load
      const getCustomLoadP = api
        .get(
          '/edges',
          {
            invitation: customMaxPapersId,
            tail: user.id,
          },
          { accessToken }
        )
        .then((result) => {
          if (result.edges?.length) return edges[0].weight
          return api
            .get(
              '/notes',
              {
                invitation: customLoadInvitation,
                select: 'content.reviewer_load,content.user,content.reduced_load',
              },
              { accessToken }
            )
            .then((result) => {
              if (!result.notes?.length) return reviewLoad
              if (result.notes.length === 1) {
                return (
                  result.notes[0].content.reviewer_load || result.notes[0].content.reduced_load
                )
              } else {
                // If there is more than one there might be a Program Chair
                const loads = result.notes.filter((p) => userIds.includes(note.content.user))
                return loads.length
                  ? loads[0].content.reviewer_load || loads[0].content.reduced_load
                  : reviewLoad
              }
            })
        })
      // #endregion

      // #region get area chair groups
      const getAreaChairGroupsP = api
        .getAll(
          '/groups',
          {
            regex: `${venueId}/Paper.*/Area_Chairs`,
            select: 'id,members',
          },
          { accessToken, version: 1 }
        )
        .then((groups) => {
          return groups.reduce((prev, curr) => {
            const num = getNumberFromGroup(curr.id)
            prev[num] = curr.members[0]
          }, {})
        })
      // #endregion

      Promise.all([
        getBlindedNotesP,
        getOfficialReviewsPs,
        getAllInvitationsP,
        getCustomLoadP,
        getAreaChairGroupsP,
      ]).then(([blindedNotes, officialReviews, invitations, customLoad, areaChairMap]) => {
        setCustomLoad(customLoad)
      })
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!userLoading && (!user || !user.profile || user.profile.id === 'guest')) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  useEffect(() => {
    if (userLoading || !user || !group) return
    loadData()
  }, [user, userLoading, group])

  useEffect(() => {
    if (blindedNotes) {
      typesetMathJax()
    }
  }, [blindedNotes])

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={header.instructions}
        customLoad={customLoad}
      />
      <Tabs>
        <TabList>
          <Tab id="assigned-papers" active>
            Assigned Papers
          </Tab>
          <Tab id="reviewer-tasks">Reviewer Tasks</Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="assigned-papers">
            {blindedNotes?.length === 0 ? (
              <p className="empty-message">
                You have no assigned papers. Please check again after the paper assignment
                process is complete.
              </p>
            ) : (
              <div className="table-container">
                <Table
                  className="console-table table-striped"
                  headings={[
                    { id: 'number', content: '#' },
                    { id: 'summary', content: 'Paper Summary' },
                    { id: 'ratings', content: 'Your Ratings' },
                  ]}
                >
                  {blindedNotes.map((note) => {
                    const abc = 123
                    return (
                      <AssignedPaperRow
                        key={note.id}
                        note={note}
                        invitations={invitations}
                        venueId={venueId}
                        reviewerName={reviewerName}
                        officialReviewName={officialReviewName}
                        reviewRatingName={reviewRatingName}
                      />
                    )
                  })}
                </Table>
              </div>
            )}
          </TabPanel>
          <TabPanel id="reviewer-tasks">
            <TaskList
              invitations={invitations}
              emptyMessage="No outstanding tasks for this conference"
              referrer={`${encodeURIComponent(
                `[Reviewer Console](/group?id=${venueId}/${reviewerName}'#reviewer-tasks)`
              )}&t=${Date.now()}`}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ReviewerConsole
