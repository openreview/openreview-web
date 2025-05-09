'use client'

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import NoteList from '../../components/NoteList'
import PaginationLinks from '../../components/PaginationLinks'
import api from '../../lib/api-client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { prettyId } from '../../lib/utils'
import useUser from '../../hooks/useUser'

export default function V1Submissions({ groupId }) {
  const { token } = useUser()
  const [currentPage, setCurrentPage] = useState(1)
  const [notes, setNotes] = useState([])
  const [count, setCount] = useState(null)
  const [invitationId, setInvitationId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const notesPerPage = 25

  const displayOptions = {
    pdfLink: false,
    htmlLink: false,
    showContents: false,
    emptyMessage: 'No submissions found.',
  }

  const getInvitationId = (idToTest) =>
    api
      .get(
        '/invitations',
        { id: idToTest, expired: true },
        {
          accessToken: token,
          version: 1,
        }
      )
      .then((res) => res.invitations?.[0]?.id || null)
      .catch((err) => null)

  const getSubmissionInvitationId = async () => {
    const potentialIds = await Promise.all([
      getInvitationId(`${groupId}/-/Blind_Submission`),
      getInvitationId(`${groupId}/-/blind_submission`),
      getInvitationId(`${groupId}/-/Submission`),
      getInvitationId(`${groupId}/-/submission`),
    ])

    setInvitationId(potentialIds.filter(Boolean)[0])
    setIsLoading(false)
  }

  const getNotes = async (page) => {
    if (!invitationId) return
    const response = await api.get(
      '/notes',
      {
        invitation: invitationId,
        limit: notesPerPage,
        offset: notesPerPage * (page - 1),
      },
      {
        accessToken: token,
        version: 1,
      }
    )
    setNotes(response.notes)
    setCount(response.count)
  }

  useEffect(() => {
    getNotes(currentPage)
  }, [currentPage, invitationId])

  useEffect(() => {
    getSubmissionInvitationId()
  }, [groupId])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <>
      <header className="clearfix">
        <h1>{prettyId(groupId)} Submissions</h1>
        <hr />
      </header>
      <div className="notes">
        <NoteList notes={notes} displayOptions={displayOptions} />
      </div>
      <PaginationLinks
        currentPage={currentPage}
        itemsPerPage={notesPerPage}
        totalCount={count}
        setCurrentPage={setCurrentPage}
      />
    </>
  )
}
