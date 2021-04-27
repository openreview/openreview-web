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
  prettyField, prettyContentValue, formatTimestamp, noteContentDiff,
} from '../../lib/utils'

import '../../styles/pages/revisions-compare.less'

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
      const { notes } = await api.get('/notes', { id: query.id }, { accessToken })
      if (notes?.length > 0) {
        setBannerContent(forumLink(notes[0]))
      } else {
        setBannerHidden(true)
      }
    } catch (apiError) {
      setBannerHidden(true)
    }
  }

  const loadReferences = async () => {
    try {
      const apiRes = await api.get('/references', {
        referent: query.id, original: true, trash: true,
      }, { accessToken })

      if (apiRes.references?.length > 1) {
        const leftNote = apiRes.references.find(reference => reference.id === query.left)
        const rightNote = apiRes.references.find(reference => reference.id === query.right)
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

  const loadComparison = async () => {
    try {
      const { leftNote, rightNote, viewerUrl } = await api.get('/pdf/compare', {
        noteId: query.id, leftId: query.left, rightId: query.right,
      }, { accessToken })
      setReferences([leftNote, rightNote])
      setDraftableUrl(viewerUrl)
    } catch (apiError) {
      loadReferences()
    }
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
    } else {
      loadReferences()
    }
  }, [userLoading, query, accessToken])

  useEffect(() => {
    if (!references) return

    const diff = noteContentDiff(references[0], references[1])
    if (Object.keys(diff).length > 0) {
      setContentDiff(diff)
    }
  }, [references])

  if (error) {
    return <ErrorDisplay statusCode={error.status} message={error.message} details={error.details} />
  }
  return (
    <>
      <Head>
        <title key="title">Revisions | OpenReview</title>
      </Head>

      <header>
        <h1>Revision Comparison</h1>
        <div className="button-container">
          <Link href={`/revisions?id=${query?.id}`}>
            <a className="btn btn-primary">Show Revisions List</a>
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
                    Last Modified
                    {' '}
                    {formatTimestamp(references[0].mdate) || formatTimestamp(references[0].tmdate)}
                  </th>
                  <th style={{ width: '50%' }}>
                    Last Modified
                    {' '}
                    {formatTimestamp(references[1].mdate) || formatTimestamp(references[1].tmdate)}
                  </th>
                </tr>
              </thead>

              <tbody>
                {contentDiff && Object.entries(contentDiff).map(([fieldName, fieldValue]) => (
                  <tr key={fieldName}>
                    <td>
                      {fieldValue.left && (
                        <>
                          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                          <strong>{prettyField(fieldName)}:</strong> {prettyContentValue(fieldValue.left)}
                        </>
                      )}
                    </td>
                    <td>
                      {fieldValue.right && (
                        <>
                          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                          <strong>{prettyField(fieldName)}:</strong> {prettyContentValue(fieldValue.right)}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
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
