import { useEffect, useContext, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useQuery from '../../hooks/useQuery'
import UserContext from '../../components/UserContext'
import Note from '../../components/Note'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorAlert from '../../components/ErrorAlert'
import api from '../../lib/api-client'
import { forumLink } from '../../lib/banner-links'

import '../../styles/pages/revisions.less'

const RevisionsList = ({ revisions, selectedIds, setSelectedIds }) => {
  const toggleSelected = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(existingId => existingId !== id))
    }
  }

  if (!revisions) return <LoadingSpinner />

  return (
    <div className="references-list submissions-list">
      {selectedIds && (
        <div className="alert alert-warning">
          To view a full comparison, select two revisions by checking the corresponding
          checkboxes, then click the View Differences button.
        </div>
      )}

      {revisions.map(([reference, invitation]) => (
        <div className="row" data-id={reference.id}>
          <div className="checkbox col-sm-1">
            <label>
              <input type="checkbox" onChange={e => toggleSelected(reference.id, e.target.checked)} />
            </label>
          </div>
          <div className="col-sm-11">
            <Note
              note={reference}
              invitation={invitation}
              options={{
                showContents: true, replyCount: true, pdfLink: true, htmlLink: true,
              }}
            />
          </div>
        </div>
      ))}

      {revisions.length === 0 && (
        <div className="alert alert-danger">No revisions to display.</div>
      )}
    </div>
  )
}

const Revisions = ({ appContext }) => {
  const [revisions, setRevisions] = useState(null)
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

      const invitationIds = Array.from(new Set(references.map(reference => (
        reference.details?.original?.invitation || reference.invitation
      ))))
      const { invitations } = await api.get('/invitations', { ids: invitationIds })

      setRevisions(references.map((reference) => {
        const invId = (reference.details && reference.details.original)
          ? reference.details.original.invitation
          : reference.invitation
        const referenceInvitation = invitations.find(invitation => invitation.id === invId)
        return [reference, referenceInvitation]
      }))
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

      {error ? (
        <ErrorAlert error={error} />
      ) : (
        <RevisionsList revisions={revisions} selectedIds={selectedIds} setSelectedIds={setSelectedIds} />
      )}
    </>
  )
}

Revisions.bodyClass = 'revisions'

export default Revisions
