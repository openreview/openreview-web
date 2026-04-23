/* globals promptLogin: false */
import { truncate } from 'lodash'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ErrorAlert from '../../components/ErrorAlert'
import { V1RevisionsList } from './RevisionsList'
import api from '../../lib/api-client'

export default function V1Revisions({ parentNoteId, user }) {
  const [revisions, setRevisions] = useState(null)
  const [selectedIndexes, setSelectedIndexes] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const enterSelectMode = () => {
    if (!user) {
      promptLogin()
      return
    }
    setSelectedIndexes([])
  }

  const getPageTitle = () => {
    if (!revisions?.length) return 'Revision History'

    let latestNoteTitle = revisions.find((q) => q[0]?.content?.title)?.[0]?.content?.title
    latestNoteTitle = truncate(latestNoteTitle, {
      length: 40,
      omission: '...',
      separator: ' ',
    })
    return `Revision History${latestNoteTitle ? ` for ${latestNoteTitle}` : ''}`
  }

  const compareRevisions = () => {
    // selectedIndexes is always stored in ascending order, so the first element
    // in the array represents the index of the most recent revision and the second
    // element represents the older revision, which should go on the left
    const leftId = revisions[selectedIndexes[1]][0].id
    const rightId = revisions[selectedIndexes[0]][0].id

    const hasPdf =
      revisions[selectedIndexes[0]][0].content?.pdf &&
      revisions[selectedIndexes[1]][0].content?.pdf
    router.push(
      `/revisions/compare?id=${parentNoteId}&left=${leftId}&right=${rightId}${
        hasPdf ? '&pdf=true' : ''
      }`
    )
  }

  const loadRevisions = async () => {
    let apiRes
    try {
      apiRes = await api.get(
        '/references',
        {
          referent: parentNoteId,
          original: true,
          trash: true,
        },
        { version: 1 }
      )
    } catch (apiError) {
      setError(apiError)
      return
    }

    const references = apiRes.references || []
    const invitationIds = Array.from(
      new Set(
        references.map(
          (reference) => reference.details?.original?.invitation || reference.invitation
        )
      )
    )

    try {
      const { invitations } = await api.get(
        '/invitations',
        {
          ids: invitationIds,
          expired: true,
        },
        { version: 1 }
      )

      if (invitations?.length > 0) {
        setRevisions(
          references
            .map((reference) => {
              const invId = reference.details?.original
                ? reference.details.original.invitation
                : reference.invitation
              const referenceInvitation = invitations.find(
                (invitation) => invitation.id === invId
              )
              return [reference, referenceInvitation]
            })
            .sort((p) => p[0].tcdate)
        )
      } else {
        setRevisions([])
      }
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    loadRevisions()
  }, [parentNoteId])

  return (
    <>
      <header>
        <h1>{getPageTitle()}</h1>

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
              disabled={!revisions || revisions.length === 0}
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
        <V1RevisionsList
          revisions={revisions}
          user={user}
          selectedIndexes={selectedIndexes}
          setSelectedIndexes={setSelectedIndexes}
        />
      )}
    </>
  )
}
