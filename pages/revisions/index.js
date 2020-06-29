import { useEffect, useContext, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useQuery from '../../hooks/useQuery'
import UserContext from '../../components/UserContext'
import api from '../../lib/api-client'
import { forumLink } from '../../lib/banner-links'

const Revisions = ({ appContext }) => {
  const [revisions, setRevisions] = useState(null)
  const [noteInvitations, setNoteInvitations] = useState(null)
  const [error, setError] = useState(null)
  const [selectedIds, setSelectedIds] = useState(null)
  const { accessToken, userLoading } = useContext(UserContext)
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent, setBannerHidden } = appContext

  const compareRevisions = () => {
    router.push('/revisions/compare')
  }

  useEffect(() => {
    if (userLoading || !query) return

    const noteId = query.id
    if (!noteId) {
      setError({ message: 'Missing required parameter id' })
    }

    const setBanner = async () => {
      try {
        const { notes } = await api.get('/notes', { id: noteId }, { accessToken })
        if (notes?.length > 0) {
          setBannerContent(forumLink(notes[0]))
        } else {
          setBannerHidden(true)
        }
      } catch (apiError) {
        setBannerHidden(true)
      }
    }
    setBanner()

    const loadRevisions = async () => {
      const apiRes = await api.get('/references', {
        referent: noteId, original: true, trash: true,
      }, { accessToken })
      const references = apiRes.references || []
      setRevisions(references)

      const invitationIds = Array.from(new Set(references.map(reference => (
        reference.details?.original?.invitation || reference.invitation
      ))))
      const { invitations } = await api.get('/invitations', { ids: invitationIds })
      setNoteInvitations(invitations || [])
    }

    try {
      loadRevisions()
    } catch (apiError) {
      setError(apiError)
    }
  }, [userLoading, query, accessToken])

  return (
    <>
      <Head>
        <title key="title">Revisions | OpenReview</title>
      </Head>

      <header>
        <h1>Revision History</h1>
        <div className="button-container">
          {selectedIds ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selectedIds.length !== 2}
                onClick={compareRevisions}
              >
                View Differences
              </button>
              <button
                type="button"
                className="btn btn-default"
                onClick={() => setSelectedIds(null)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!revisions}
              onClick={() => setSelectedIds([])}
            >
              Compare Revisions
            </button>
          )}
        </div>
      </header>

      <div className="references-list" />
    </>
  )
}

Revisions.bodyClass = 'revisions'

export default Revisions
