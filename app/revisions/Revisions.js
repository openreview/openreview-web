'use client'

/* globals promptLogin: false */
import { truncate } from 'lodash'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RevisionsList from './RevisionsList'
import api from '../../lib/api-client'
import ErrorAlert from '../../components/ErrorAlert'

export default function Revisions({ parentNote, user }) {
  const [revisions, setRevisions] = useState(null)
  const [selectedIndexes, setSelectedIndexes] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const getPageTitle = () => {
    if (!revisions?.length) return 'Revision History'

    let latestNoteTitle = revisions.find((q) => q[0].note?.content?.title)?.[0]?.note?.content
      ?.title?.value
    latestNoteTitle = truncate(latestNoteTitle, {
      length: 40,
      omission: '...',
      separator: ' ',
    })
    return `Revision History${latestNoteTitle ? ` for ${latestNoteTitle}` : ''}`
  }

  const loadEdits = async () => {
    try {
      const { edits } = await api.get('/notes/edits', {
        'note.id': parentNote.id,
        sort: 'tcdate',
        details: 'writable,presentation,invitation',
        trash: true,
      })
      setRevisions((edits ?? []).map((edit) => [edit, edit.details.invitation]))
    } catch (apiError) {
      setError(apiError)
    }
  }

  const compareRevisions = () => {
    // selectedIndexes is always stored in ascending order, so the first element
    // in the array represents the index of the most recent revision and the second
    // element represents the older revision, which should go on the left
    const leftId = revisions[selectedIndexes[1]][0].id
    const rightId = revisions[selectedIndexes[0]][0].id

    const hasPdf =
      revisions[selectedIndexes[0]][0].note.content?.pdf?.value &&
      revisions[selectedIndexes[1]][0].note.content?.pdf?.value
    router.push(
      `/revisions/compare?id=${parentNote.id}&left=${leftId}&right=${rightId}${
        hasPdf ? '&pdf=true' : ''
      }&version=2`
    )
  }

  const enterSelectMode = () => {
    if (!user) {
      promptLogin()
      return
    }
    setSelectedIndexes([])
  }

  useEffect(() => {
    loadEdits()
  }, [parentNote])

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
        <RevisionsList
          revisions={revisions}
          selectedIndexes={selectedIndexes}
          setSelectedIndexes={setSelectedIndexes}
          loadEdits={loadEdits}
          isNoteWritable={parentNote.details.writable}
        />
      )}
    </>
  )
}
