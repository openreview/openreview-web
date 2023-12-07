/* globals promptMessage: false */

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import useQuery from '../../hooks/useQuery'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import { forumLink } from '../../lib/banner-links'
import {
  prettyField,
  prettyContentValue,
  formatTimestamp,
  noteContentDiff,
  editNoteContentDiff,
} from '../../lib/utils'

const CompareRevisions = ({ appContext }) => {
  const [references, setReferences] = useState(null)
  const [draftableUrl, setDraftableUrl] = useState('')
  const [contentDiff, setContentDiff] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken, userLoading } = useLoginRedirect()
  const query = useQuery()
  const { setBannerContent, setBannerHidden } = appContext

  const setBanner = async () => {
    try {
      const note = await api.getNoteById(query.id, accessToken)
      if (note) {
        setBannerContent(forumLink(note))
      } else {
        setBannerHidden(true)
      }
    } catch (apiError) {
      setBannerHidden(true)
    }
  }

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
      setError({ statusCode: 404, message: 'Reference not found' })
    } catch (apiError) {
      setError(apiError)
    }
  }

  const loadEdits = async () => {
    try {
      const apiRes = await api.get(
        '/notes/edits',
        { 'note.id': query.id, trash: true },
        { accessToken }
      )

      if (apiRes.edits?.length > 1) {
        const leftEdit = apiRes.edits.find((edit) => edit.id === query.left)
        const rightEdit = apiRes.edits.find((edit) => edit.id === query.right)
        if (leftEdit && rightEdit) {
          setReferences([leftEdit, rightEdit])
          return
        }
      }
      setError({ statusCode: 404, message: 'Reference not found' })
    } catch (apiError) {
      setError(apiError)
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
        { accessToken, version: query.version === '2' ? 2 : 1 }
      )
      setReferences([leftNote, rightNote])
      setDraftableUrl(viewerUrl)
    } catch (apiError) {
      if (query.version === '2') {
        loadEdits()
      } else {
        loadReferences()
      }
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
    if (userLoading || !query) return

    if (!(query.id && query.left && query.right)) {
      setError({ statusCode: 404, message: 'Missing required parameter' })
      return
    }

    setBanner()

    if (query.pdf) {
      loadComparison()
    } else if (query.version === '2') {
      loadEdits()
    } else {
      loadReferences()
    }
  }, [userLoading, query, accessToken])

  useEffect(() => {
    if (!references) return

    const diffFn = query.version === '2' ? editNoteContentDiff : noteContentDiff
    const diff = diffFn(references[0], references[1])
    if (Object.keys(diff).length > 0) {
      setContentDiff(diff)
    }
  }, [references])

  useEffect(() => {
    if (!error) return

    setBannerContent(null)
  }, [error])

  if (error) return <ErrorDisplay statusCode={error.status} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">Compare Revisions | OpenReview</title>
      </Head>

      <header>
        <h1>Revision Comparison</h1>
        <div className="button-container">
          <Link href={`/revisions?id=${query?.id}`} className="btn btn-primary">
            Show Revisions List
          </Link>
        </div>
      </header>

      {references ? (
        <div className="comparison-viewer-container">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>
                    Last Modified{' '}
                    {formatTimestamp(references[0].mdate) ||
                      formatTimestamp(references[0].tmdate)}
                  </th>
                  <th style={{ width: '50%' }}>
                    Last Modified{' '}
                    {formatTimestamp(references[1].mdate) ||
                      formatTimestamp(references[1].tmdate)}
                  </th>
                </tr>
              </thead>

              <tbody>
                {query.version === '2' ? (
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
                ) : (
                  renderDiffSection(contentDiff)
                )}
              </tbody>
            </table>
          </div>

          {draftableUrl && (
            <iframe title="Draftable PDF Comparison" src={draftableUrl} allowFullScreen />
          )}
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </>
  )
}

CompareRevisions.bodyClass = 'revisions-compare'

export default CompareRevisions
