/* globals $,promptError: false */
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Head from 'next/head'
import { truncate } from 'lodash'
import { useRouter } from 'next/router'
import useUser from '../../hooks/useUser'
import { xpathSelect } from '../../lib/profiles'
import api from '../../lib/api-client'
import Forum from './Forum'
import LoadingSpinner from '../LoadingSpinner'
import ErrorDisplay from '../ErrorDisplay'

const titleSelector = '//atom:feed/atom:entry/atom:title/text()'
const abstractSelector = '//atom:feed/atom:entry/atom:summary/text()'
const authorsSelector = '//atom:feed/atom:entry/atom:author/atom:name/text()'
const subjectAreasSelector = '//atom:feed/atom:entry/atom:category/@term'
const pdateSelector = '//atom:feed/atom:entry/atom:published/text()'
const mdateSelector = '//atom:feed/atom:entry/atom:updated/text()'
const pdfSelector = '//atom:feed/atom:entry/atom:link[@title="pdf"]/@href'

const ArvixForum = ({ id }) => {
  const { user, accessToken, userLoading } = useUser()
  const [arxivNote, setArvixNote] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const content = Object.keys(arxivNote?.content ?? {}).reduce((translatedContent, key) => {
    // eslint-disable-next-line no-param-reassign
    translatedContent[key] = arxivNote.content[key].value
    return translatedContent
  }, {})

  const truncatedTitle = truncate(content.title, { length: 70, separator: /,? +/ })
  const truncatedAbstract = truncate(content.abstract, {
    length: 200,
    separator: /,? +/,
  })

  const loadArvixNote = async () => {
    try {
      const arxivUrl = `https://export.arxiv.org/api/query?id_list=${id}`
      const xmlDoc = await $.ajax(arxivUrl)
      const title = xpathSelect(titleSelector, xmlDoc, true)?.[0]
        ?.nodeValue?.trim()
        ?.replace(/\n/g, ' ')
      if (!title) throw new Error(`The Note ${id} was not found`)
      const abstract = xpathSelect(abstractSelector, xmlDoc, true)?.[0]?.nodeValue?.trim()
      const authorNames = xpathSelect(authorsSelector, xmlDoc, true)?.map((author) =>
        author.nodeValue.trim()
      )
      const authorIds = authorNames.map(
        (p) => `https://arxiv.org/search/?query=${p}&searchtype=all`
      )
      const subjectAreas = xpathSelect(subjectAreasSelector, xmlDoc, true)?.map((subject) =>
        subject.nodeValue.trim()
      )
      const pdate = dayjs(xpathSelect(pdateSelector, xmlDoc, true)?.[0]?.nodeValue).valueOf()
      const mdate = dayjs(xpathSelect(mdateSelector, xmlDoc, true)?.[0]?.nodeValue).valueOf()
      const notePostResult = await api.post(
        '/notes/edits',
        {
          invitation: 'arXiv.org/-/Record',
          signatures: [user.profile.id],
          note: {
            content: {
              title: {
                value: title,
              },
              abstract: {
                value: abstract,
              },
              authors: {
                value: authorNames,
              },
              authorids: {
                value: authorIds,
              },
              subject_areas: {
                value: subjectAreas,
              },
            },
            pdate,
            mdate,
            externalId: id,
          },
        },
        { accessToken }
      )
      const noteId = notePostResult.note.id
      const noteResult = await api.getNoteById(noteId, accessToken, null, {
        trash: true,
        details: 'original,replyCount,writable',
      })
      setArvixNote(noteResult)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
      return
    }
    loadArvixNote()
  }, [id, userLoading])

  if (error) return <ErrorDisplay message={error} />
  if (!arxivNote) return <LoadingSpinner />

  return (
    <>
      <Head>
        <title key="title">{`${content.title || 'Forum'} | OpenReview`}</title>
        <meta name="description" content={content['TL;DR'] || content.abstract || ''} />

        <meta property="og:title" key="og:title" content={truncatedTitle} />
        <meta property="og:description" key="og:description" content={truncatedAbstract} />
        <meta property="og:type" key="og:type" content="article" />
        <meta name="robots" content="noindex" />
      </Head>

      <Forum forumNote={arxivNote} />
    </>
  )
}

export default ArvixForum
