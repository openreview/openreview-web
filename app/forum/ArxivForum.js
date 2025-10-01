'use client'

/* globals $: false */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import useUser from '../../hooks/useUser'
import { xpathSelect } from '../../lib/profiles'
import api from '../../lib/api-client'
import ErrorDisplay from '../../components/ErrorDisplay'
import CommonLayout from '../CommonLayout'
import Forum from '../../components/forum/Forum'
import LoadingSpinner from '../../components/LoadingSpinner'

const entrySelector = '//atom:feed/atom:entry'
const titleSelector = '//atom:feed/atom:entry/atom:title/text()'
const authorsSelector = '//atom:feed/atom:entry/atom:author/atom:name/text()'
const pdateSelector = '//atom:feed/atom:entry/atom:published/text()'
const mdateSelector = '//atom:feed/atom:entry/atom:updated/text()'
const idSelector = '//atom:feed/atom:entry/atom:id/text()'

const ArxivForum = ({ id }) => {
  const router = useRouter()
  const { user, accessToken, isRefreshing } = useUser()
  const [arxivNote, setArvixNote] = useState(null)
  const [error, setError] = useState(null)

  const loadArvixNote = async () => {
    try {
      const arxivUrl = `https://export.arxiv.org/api/query?id_list=${id.split('v')[0]}`
      const xmlDoc = await $.ajax(arxivUrl)

      const arxivIdWithLatestVersion = xpathSelect(idSelector, xmlDoc, true)?.[0]
        ?.nodeValue?.split('/')
        ?.pop()

      // get all past versions of the note below arxivIdWithLatestVersion
      const arxivIdWithVersion = arxivIdWithLatestVersion.split('v')[0]
      const arxivVersion = Number(arxivIdWithLatestVersion.split('v')[1])
      const allVersionIds = [...Array(arxivVersion).keys()].map(
        (i) => `arxiv:${arxivIdWithVersion}v${arxivVersion - i}`
      )

      const notesResult = await Promise.all(
        allVersionIds.map((arxivId) =>
          api
            .get('/notes', {
              externalId: arxivId,
              details: 'writable,presentation',
            })
            .then((result) => result.notes?.[0])
        )
      )

      const latestExistingVersionNote = notesResult.find((note) => note)

      if (
        latestExistingVersionNote &&
        latestExistingVersionNote.externalIds.includes(`arxiv:${arxivIdWithLatestVersion}`)
      ) {
        // already the latest version
        setArvixNote(latestExistingVersionNote)
        return
      }

      const title = xpathSelect(titleSelector, xmlDoc, true)?.[0]
        ?.nodeValue?.trim()
        ?.replace(/\n/g, ' ')
      if (!title) throw new Error(`The Note ${id} was not found`)

      const authorNames = xpathSelect(authorsSelector, xmlDoc, true)?.map((author) =>
        author.nodeValue.trim()
      )
      const pdate = dayjs(xpathSelect(pdateSelector, xmlDoc, true)?.[0]?.nodeValue).valueOf()
      const mdate = dayjs(xpathSelect(mdateSelector, xmlDoc, true)?.[0]?.nodeValue).valueOf()
      const rawXml = xpathSelect(entrySelector, xmlDoc, true)[0].outerHTML

      const notePostResult = await api.post(
        '/notes/edits',
        {
          invitation: `${process.env.SUPER_USER}/Public_Article/arXiv.org/-/Record`,
          signatures: [user.profile.id],
          content: {
            xml: {
              value: rawXml,
            },
          },
          note: {
            id: latestExistingVersionNote?.id,
            content: {
              title: {
                value: title,
              },
              authors: {
                value: authorNames,
              },
            },
            pdate,
            mdate,
            externalId: `arxiv:${arxivIdWithLatestVersion}`,
          },
        },
        { accessToken }
      )
      const noteId = notePostResult.note.id
      const noteResult = await api.getNoteById(noteId, accessToken, null, {
        trash: true,
        details: 'writable,presentation',
      })
      setArvixNote(noteResult)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!accessToken) router.replace(`/login?redirect=/forum?arxivid=${id}`)
    loadArvixNote()
  }, [id, isRefreshing])

  if (error) return <ErrorDisplay message={error} />
  if (!arxivNote) return <LoadingSpinner />
  return (
    <CommonLayout>
      <Forum
        forumNote={arxivNote}
        editInvitationIdToHide={`${process.env.SUPER_USER}/Public_Article/arXiv.org/-/Record`}
      />
    </CommonLayout>
  )
}

export default ArxivForum
