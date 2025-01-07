'use client'

import { use, useEffect, useState } from 'react'
import {
  editNoteContentDiff,
  formatTimestamp,
  prettyContentValue,
  prettyField,
} from '../../../lib/utils'

const renderDiffSection = (diff, prefixToRemove = null, shouldPrettyField = true) => {
  if (!diff) return null

  return Object.entries(diff).map(([fieldName, fieldValue]) => {
    if (fieldName.startsWith(prefixToRemove))
      // eslint-disable-next-line no-param-reassign
      fieldName = fieldName.substring(prefixToRemove.length)
    // eslint-disable-next-line no-param-reassign
    if (fieldName.endsWith('.value')) fieldName = fieldName.slice(0, -6)
    // eslint-disable-next-line no-param-reassign
    if (fieldName.endsWith('.readers')) fieldName = `${fieldName.slice(0, -8)} readers`

    const prettifiedFieldName = shouldPrettyField ? prettyField(fieldName) : fieldName
    const prettifiedLeftValue = prettyContentValue(fieldValue.left)
    const prettifiedRightValue = prettyContentValue(fieldValue.right)

    return (
      <tr key={fieldName}>
        <td>
          {fieldValue.left && (
            <>
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              <strong>{prettifiedFieldName}:</strong> {prettifiedLeftValue}
            </>
          )}
        </td>
        <td>
          {fieldValue.right && (
            <>
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              <strong>{prettifiedFieldName}:</strong> {prettifiedRightValue}
            </>
          )}
        </td>
      </tr>
    )
  })
}

export default function Compare({ loadEditsP }) {
  const { references, viewerUrl } = use(loadEditsP)
  const [contentDiff, setContentDiff] = useState(null)

  useEffect(() => {
    if (!references) return

    const diff = editNoteContentDiff(references[0], references[1])
    if (Object.keys(diff).length > 0) {
      setContentDiff(diff)
    }
  }, [references])

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
