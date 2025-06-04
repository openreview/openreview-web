/* globals promptError: false */
import { useEffect, useState } from 'react'
import api from '../../../lib/api-client'
import LoadingSpinner from '../../../components/LoadingSpinner'
import {
  formatTimestamp,
  noteContentDiff,
  prettyContentValue,
  prettyField,
} from '../../../lib/utils'

export default function V1Compare({ query, accessToken }) {
  const [references, setReferences] = useState(null)
  const [draftableUrl, setDraftableUrl] = useState('')
  const [contentDiff, setContentDiff] = useState(null)

  const loadReferences = async () => {
    try {
      const apiRes = await api.get(
        '/references',
        {
          referent: query.id,
          original: true,
          trash: true,
        },
        { accessToken, version: 1 }
      )

      if (apiRes.references?.length > 1) {
        const leftNote = apiRes.references.find((reference) => reference.id === query.left)
        const rightNote = apiRes.references.find((reference) => reference.id === query.right)
        if (leftNote && rightNote) {
          setReferences([leftNote, rightNote])
          return
        }
      }
      throw new Error('Reference not found')
    } catch (error) {
      promptError(error.message)
    }
  }

  const loadComparison = async () => {
    try {
      const { leftNote, rightNote, viewerUrl } = await api.get(
        '/pdf/compare',
        {
          noteId: query.id,
          leftId: query.left,
          rightId: query.right,
        },
        { accessToken, version: 1 }
      )
      setReferences([leftNote, rightNote])
      setDraftableUrl(viewerUrl)
    } catch (apiError) {
      loadReferences()
    }
  }

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

  useEffect(() => {
    if (!(query.id && query.left && query.right)) {
      return
    }
    if (!query?.id) return
    if (query.pdf) {
      loadComparison()
      return
    }
    loadReferences()
  }, [query])

  useEffect(() => {
    if (!references) return

    const diff = noteContentDiff(references[0], references[1])
    if (Object.keys(diff).length > 0) {
      setContentDiff(diff)
    }
  }, [references])

  return references ? (
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

          <tbody>{renderDiffSection(contentDiff)}</tbody>
        </table>
      </div>

      {draftableUrl && (
        <iframe title="Draftable PDF Comparison" src={draftableUrl} allowFullScreen />
      )}
    </div>
  ) : (
    <LoadingSpinner />
  )
}
