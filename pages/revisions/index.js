/* globals promptLogin: false */

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

const RevisionsList = ({ revisions, selectedIndexes, setSelectedIndexes }) => {
  const toggleSelected = (idx, checked) => {
    if (checked) {
      setSelectedIndexes([...selectedIndexes, idx].sort((a, b) => a - b))
    } else {
      setSelectedIndexes(selectedIndexes.filter(existingIdx => existingIdx !== idx))
    }
  }

  if (!revisions) return <LoadingSpinner />

  return (
    <div className={`references-list submissions-list ${selectedIndexes ? '' : 'hide-sidebar'}`}>
      {selectedIndexes && (
        <div className="alert alert-warning">
          To view a full comparison, select two revisions by checking the corresponding
          checkboxes, then click the View Differences button.
        </div>
      )}

      {revisions.map(([reference, invitation], index) => (
        <div key={reference.id} className="row" data-id={reference.id}>
          <div className="checkbox col-sm-1">
            <label>
              <input
                type="checkbox"
                checked={selectedIndexes && selectedIndexes.includes(index)}
                onChange={e => toggleSelected(index, e.target.checked)}
              />
            </label>
          </div>
          <div className="col-sm-11">
            <Note
              note={reference}
              invitation={invitation}
              options={{ showContents: true, pdfLink: true, htmlLink: true }}
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
  const [parentNoteId, setParentNoteId] = useState('')
  const [revisions, setRevisions] = useState(null)
  const [error, setError] = useState(null)
  const [selectedIndexes, setSelectedIndexes] = useState(null)
  const { accessToken, userLoading } = useContext(UserContext)
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent, setBannerHidden } = appContext

  const enterSelectMode = () => {
    if (!accessToken) {
      promptLogin()
      return
    }
    setSelectedIndexes([])
  }

  const compareRevisions = () => {
    // selectedIndexes is always stored in ascending order, so the first element
    // in the array represents the index of the most recent revision and the second
    // element represents the older revision, which should go on the left
    const leftId = revisions[selectedIndexes[1]][0].id
    const rightId = revisions[selectedIndexes[0]][0].id
    router.push(`/revisions/compare?id=${parentNoteId}&left=${leftId}&right=${rightId}`)
  }

  useEffect(() => {
    if (userLoading || !query) return

    const noteId = query.id
    if (!noteId) {
      setError({ message: 'Missing required parameter id' })
      return
    }
    setParentNoteId(noteId)

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
      let apiRes
      try {
        apiRes = await api.get('/references', {
          referent: noteId, original: true, trash: true,
        }, { accessToken })
      } catch (apiError) {
        setError(apiError)
        return
      }

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
    loadRevisions()
  }, [userLoading, query, accessToken])

  return (
    <>
      <Head>
        <title key="title">Revisions | OpenReview</title>
      </Head>

      <header>
        <h1>Revision History</h1>
        <div className="button-container">
          {selectedIndexes ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selectedIndexes.length !== 2}
                onClick={compareRevisions}
              >
                View Differences
              </button>
              <button
                type="button"
                className="btn btn-default"
                onClick={() => setSelectedIndexes(null)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!revisions}
              onClick={() => enterSelectMode()}
            >
              Compare Revisions
            </button>
          )}
        </div>
      </header>

      {error ? (
        <ErrorAlert error={error} />
      ) : (
        <RevisionsList
          revisions={revisions}
          selectedIndexes={selectedIndexes}
          setSelectedIndexes={setSelectedIndexes}
        />
      )}
    </>
  )
}

Revisions.bodyClass = 'revisions'

export default Revisions
