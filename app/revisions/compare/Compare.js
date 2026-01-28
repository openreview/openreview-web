/* globals promptError: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  editNoteContentDiff,
  formatTimestamp,
  prettyContentValue,
  prettyField,
} from '../../../lib/utils'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'

const renderDiffSection = (diff, prefixToRemove = null, shouldPrettyField = true) => {
  if (!diff) return null

  return Object.entries(diff).map(([fieldName, fieldValue]) => {
    if (fieldName.startsWith(prefixToRemove))
      fieldName = fieldName.substring(prefixToRemove.length)
    if (fieldName.endsWith('.value')) fieldName = fieldName.slice(0, -6)
    if (fieldName.endsWith('.readers')) fieldName = `${fieldName.slice(0, -8)} readers`

    const prettifiedFieldName = shouldPrettyField ? prettyField(fieldName) : fieldName
    const prettifiedLeftValue = prettyContentValue(fieldValue.left)
    const prettifiedRightValue = prettyContentValue(fieldValue.right)

    return (
      <tr key={fieldName}>
        <td>
          {fieldValue.left && (
            <>
              <strong>{prettifiedFieldName}:</strong> {prettifiedLeftValue}
            </>
          )}
        </td>
        <td>
          {fieldValue.right && (
            <>
              <strong>{prettifiedFieldName}:</strong> {prettifiedRightValue}
            </>
          )}
        </td>
      </tr>
    )
  })
}

export default function Compare({ query, accessToken }) {
  const [references, setReferences] = useState(null)
  const [viewerUrl, setViewerUrl] = useState(null)
  const { id, left, right } = query

  const [contentDiff, setContentDiff] = useState(null)

  const loadEdits = async () => {
    try {
      await api
        .get(
          '/pdf/compare',
          {
            noteId: id,
            leftId: left,
            rightId: right,
          },
          { accessToken, version: 2 }
        )
        .then((result) => {
          const { leftNote, rightNote } = result
          setReferences([leftNote, rightNote])
          setViewerUrl(result.viewerUrl)
        })
        .catch(async (_) => {
          const editsResponse = await api.get(
            '/notes/edits',
            { 'note.id': id, trash: true },
            { accessToken }
          )

          if (editsResponse.edits?.length <= 1) throw new Error('Reference not found')
          const leftEdit = editsResponse.edits.find((edit) => edit.id === query.left)
          const rightEdit = editsResponse.edits.find((edit) => edit.id === query.right)
          if (leftEdit && rightEdit) {
            setReferences([leftEdit, rightEdit])
            return
          }
          throw new Error('Reference not found')
        })
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!references) return

    const diff = editNoteContentDiff(references[0], references[1])
    if (Object.keys(diff).length > 0) {
      setContentDiff(diff)
    }
  }, [references])

  useEffect(() => {
    if (!(query.id && query.left && query.right)) return
    loadEdits()
  }, [query])

  if (!references) return <LoadingSpinner />

  return (
    <div className="comparison-viewer-container">
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>
                Last Modified{' '}
                {formatTimestamp(references[0].mdate) || formatTimestamp(references[0].tmdate)}
              </th>
              <th style={{ width: '50%' }}>
                Last Modified{' '}
                {formatTimestamp(references[1].mdate) || formatTimestamp(references[1].tmdate)}
              </th>
            </tr>
          </thead>

          <tbody>
            <>
              <tr>
                <th colSpan="4" className="section-title">
                  Edit Properties
                </th>
              </tr>
              {renderDiffSection(contentDiff?.edit, null, false)}

              <tr>
                <th colSpan="4" className="section-title">
                  Note Properties
                </th>
              </tr>
              {renderDiffSection(contentDiff?.editNote, 'note.', false)}

              <tr>
                <th colSpan="4" className="section-title">
                  Note Content Properties
                </th>
              </tr>
              {renderDiffSection(contentDiff?.editNoteContent, 'note.content.')}
            </>
          </tbody>
        </table>
      </div>

      {viewerUrl && (
        <iframe title="Draftable PDF Comparison" src={viewerUrl} allowFullScreen />
      )}
    </div>
  )
}
