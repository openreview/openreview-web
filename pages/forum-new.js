import { useEffect, useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import truncate from 'lodash/truncate'
import groupBy from 'lodash/groupBy'
import LoadingSpinner from '../components/LoadingSpinner'
import Dropdown from '../components/Dropdown'
import ForumReply from '../components/ForumReply'
import NoteAuthors from '../components/NoteAuthors'
import NoteReaders from '../components/NoteReaders'
import Icon from '../components/Icon'
import NoteContent from '../components/NoteContent'
import withError from '../components/withError'
import ForumReplyContext from '../components/ForumReplyContext'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import { auth, isSuperUser } from '../lib/auth'
import {
  prettyId, inflect, forumDate, getConferenceName, prettyInvitationId,
} from '../lib/utils'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

// Page Styles
import '../styles/pages/forum-new.less'

const ForumTitle = ({
  id, title, pdf, html,
}) => (
  <div className="title_pdf_row">
    <h2 className="note_content_title citation_title">
      {title}

      {pdf && (
        // eslint-disable-next-line react/jsx-no-target-blank
        <a className="note_content_pdf citation_pdf_url" href={`/pdf?id=${id}`} title="Download PDF" target="_blank">
          <img src="/images/pdf_icon_blue.svg" alt="Download PDF" />
        </a>
      )}
      {html && (
        <a className="note_content_pdf html-link" href={html} title="Open Website" target="_blank" rel="noopener noreferrer">
          <img src="/images/html_icon_blue.svg" alt="Open Website" />
        </a>
      )}
    </h2>
  </div>
)

const ForumAuthors = ({
  authors, authorIds, signatures, original,
}) => (
  <div className="meta_row">

    <h3 className="signatures author">
      <NoteAuthors
        authors={authors}
        authorIds={authorIds}
        signatures={signatures}
        original={original}
      />
    </h3>
  </div>
)

const ForumMeta = ({ note }) => (
  <div className="meta_row">
    <span className="date item">
      {forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content.year)}
    </span>

    {note.content.venue ? (
      <span className="item">{note.content.venue}</span>
    ) : (
      <span className="item">{prettyId(note.invitation)}</span>
    )}

    {note.readers && (
      <span className="item">
        Readers:
        {' '}
        <NoteReaders readers={note.readers} />
      </span>
    )}
  </div>
)

const ForumReplyCount = () => (
  <div className="reply-container" />
)

const Forum = ({ forumNote, query, appContext }) => {
  const { userLoading, accessToken } = useUser()
  const [replyNoteMap, setReplyNoteMap] = useState(null)
  const [parentMap, setParentMap] = useState(null)
  const [displayOptionsMap, setDisplayOptionsMap] = useState(null)
  const [orderedReplies, setOrderedReplies] = useState(null)
  const [nestingLevel, setNestingLevel] = useState(1)
  const [filterOptions, setFilterOptions] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState({
    invitations: null, signatures: null, keywords: null,
  })

  const { setBannerContent } = appContext
  const { id, content, details } = forumNote

  const truncatedTitle = truncate(content.title, { length: 70, separator: /,? +/ })
  const truncatedAbstract = truncate(content['TL;DR'] || content.abstract, { length: 200, separator: /,? +/ })
  const authors = (Array.isArray(content.authors) || typeof content.authors === 'string')
    ? [content.authors].flat()
    : []
  const creationDate = new Date(forumNote.cdate || forumNote.tcdate || Date.now()).toISOString().slice(0, 10).replace(/-/g, '/')
  const modificationDate = new Date(forumNote.tmdate || Date.now()).toISOString().slice(0, 10).replace(/-/g, '/')
  // eslint-disable-next-line no-underscore-dangle
  const conferenceName = getConferenceName(content._bibtex)

  const numRepliesHidden = displayOptionsMap
    ? Object.values(displayOptionsMap).reduce((count, options) => count + (options.hidden ? 1 : 0), 0)
    : 0

  const loadReplies = async () => {
    const { notes } = await api.get('/notes', {
      forum: id, details: 'replyCount,writable,revisions,original,overwriting,invitation,tags',
    }, { accessToken })

    if (notes?.length > 0) {
      const replyMap = {}
      const displayOptions = {}
      const parentIdMap = {}
      const invitationIds = new Set()
      const groupIds = new Set()
      notes.forEach((note) => {
        // Don't include forum note
        if (note.id === note.forum) return

        replyMap[note.id] = note
        displayOptions[note.id] = { collapsed: false, contentExpanded: false, hidden: false }

        const parentId = note.replyto || id
        if (!parentIdMap[parentId]) {
          parentIdMap[parentId] = []
        }
        parentIdMap[parentId].push(note.id)

        // For filter dropdown
        invitationIds.add(note.invitation)
        groupIds.add(note.signatures[0])
      })
      setReplyNoteMap(replyMap)
      setDisplayOptionsMap(displayOptions)
      setParentMap(parentIdMap)
      setFilterOptions([
        {
          label: 'Reply Type',
          options: Array.from(invitationIds).map(invitationId => ({
            value: invitationId,
            label: prettyInvitationId(invitationId),
            type: 'invitation',
          })),
        },
        {
          label: 'Author',
          options: Array.from(groupIds).map(groupId => ({
            value: groupId,
            label: prettyId(groupId, true),
            type: 'signature',
          })),
        },
      ])
    } else {
      setReplyNoteMap({})
    }
  }

  const setCollapseLevel = (level) => {
    const newDisplayOptions = {}
    Object.keys(displayOptionsMap).forEach((noteId) => {
      newDisplayOptions[noteId] = {
        ...displayOptionsMap[noteId],
        collapsed: level === 0,
        contentExpanded: level === 2,
      }
    })
    setDisplayOptionsMap(newDisplayOptions)
  }

  const setReplyCollapsed = noteId => (newCollapsed) => {
    setDisplayOptionsMap({
      ...displayOptionsMap,
      [noteId]: {
        ...displayOptionsMap[noteId],
        collapsed: newCollapsed,
      },
    })
  }

  // Set banner link
  useEffect(() => {
    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      const groupId = content.venueid
        ? content.venueid
        : forumNote.invitation.split('/-/')[0]
      setBannerContent(venueHomepageLink(groupId))
    }
  }, [forumNote, query])

  // Load forum replies
  useEffect(() => {
    if (userLoading) return

    loadReplies()
  }, [userLoading, accessToken])

  // Update view
  useEffect(() => {
    if (!replyNoteMap || !parentMap) return

    const leastRecentComp = (a, b) => replyNoteMap[a].cdate - replyNoteMap[b].cdate
    const mostRecentComp = (a, b) => replyNoteMap[b].cdate - replyNoteMap[a].cdate

    let orderedNotes = []
    if (nestingLevel === 0) {
      // Linear view
      orderedNotes = Object.keys(replyNoteMap).sort(mostRecentComp).map(noteId => ({
        id: noteId,
        replies: [],
      }))
    } else if (nestingLevel === 1) {
      // Threaded view
      const getAllReplies = (noteId) => {
        if (!parentMap[noteId]) return []
        return parentMap[noteId].reduce((replies, childId) => replies.concat(childId, getAllReplies(childId)), [])
      }

      orderedNotes = (parentMap[id] ?? []).map(childId => ({
        id: childId,
        replies: getAllReplies(childId).sort(leastRecentComp),
      }))
    } else if (nestingLevel === 2) {
      // TODO: Nested view
    }
    setOrderedReplies(orderedNotes)

    setTimeout(() => {
      // eslint-disable-next-line no-undef
      typesetMathJax()
    }, 200)
  }, [replyNoteMap, parentMap, nestingLevel])

  useEffect(() => {
    if (!replyNoteMap || !displayOptionsMap) return

    const newDisplayOptions = {}
    Object.values(replyNoteMap).forEach((note) => {
      const isVisible = (
        (!selectedFilters.invitations || selectedFilters.invitations.includes(note.invitation))
        && (!selectedFilters.signatures || selectedFilters.signatures.includes(note.signatures[0]))
        && (!selectedFilters.keywords || note.searchText.includes(selectedFilters.keywords))
      )
      newDisplayOptions[note.id] = {
        ...displayOptionsMap[note.id],
        hidden: !isVisible,
      }
    })
    setDisplayOptionsMap(newDisplayOptions)
  }, [replyNoteMap, selectedFilters])

  return (
    <div className="forum-container">
      <Head>
        <title key="title">{`${content.title || 'Forum'} | OpenReview`}</title>
        <meta name="description" content={content['TL;DR'] || content.abstract || ''} />

        <meta property="og:title" key="og:title" content={truncatedTitle} />
        <meta property="og:description" key="og:description" content={truncatedAbstract} />
        <meta property="og:type" key="og:type" content="article" />

        {/* For more information on required meta tags for Google Scholar see: */}
        {/* https://scholar.google.com/intl/en/scholar/inclusion.html#indexing */}
        {forumNote.invitation.startsWith(`${process.env.SUPER_USER}`) ? (
          <meta name="robots" content="noindex" />
        ) : (
          <>
            {content.title && (
              <meta name="citation_title" content={content.title} />
            )}
            {/*
            {authors.map(author => (
              <meta key={author} name="citation_author" content={author} />
            ))}
            */}
            {/* temporary hack to get google scholar to work, revert to above code when Next.js issue is solved */}
            <meta name="citation_authors" content={authors.join('; ')} />
            <meta name="citation_publication_date" content={creationDate} />
            <meta name="citation_online_date" content={modificationDate} />
            {content.pdf && (
              <meta name="citation_pdf_url" content={`https://openreview.net/pdf?id=${id}`} />
            )}
            {conferenceName && (
              <meta name="citation_conference_title" content={conferenceName} />
            )}
          </>
        )}
      </Head>

      <div className="note">
        <ForumTitle
          id={id}
          title={content.title}
          pdf={content.pdf}
          html={content.html || content.ee}
        />

        <ForumAuthors
          authors={content.authors}
          authorIds={content.authorids}
          signatures={forumNote.signatures}
          original={details.original}
        />

        <ForumMeta note={forumNote} />

        <NoteContent
          id={id}
          content={content}
          invitation={details.originalInvitation || details.invitation}
        />

        <ForumReplyCount />
      </div>

      <hr />

      <div className="row">
        <div className="col-xs-12">
          <form className="form-inline controls">
            <div className="form-group">
              {/* TODO: https://codesandbox.io/s/v638kx67w7 */}
              <Dropdown
                name="filters"
                className="replies-filter"
                options={filterOptions || []}
                isDisabled={!filterOptions}
                onChange={(selectedOptions) => {
                  const groupedOptions = groupBy(selectedOptions, 'type')
                  setSelectedFilters({
                    ...selectedFilters,
                    invitations: groupedOptions.invitation?.map(option => option.value) ?? null,
                    signatures: groupedOptions.signature?.map(option => option.value) ?? null,
                  })
                }}
                placeholder="Filter..."
                instanceId="replies-filter"
                height={32}
                isMulti
                isSearchable
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-control"
                id="keyword-input"
                placeholder="Search..."
                onBlur={(e) => { setSelectedFilters({ ...selectedFilters, keywords: e.target.value.toLowerCase() }) }}
              />
            </div>

            <div className="form-group">
              {/* <label htmlFor="keyword-input" className="control-label">Sort:</label> */}
              <select className="form-control">
                <option>Sort: Most Recent</option>
                <option>Sort: Least Recent</option>
                <option>Sort: Most Tagged</option>
              </select>
            </div>

            <div className="form-group">
              <div className="btn-group btn-group-sm" role="group" aria-label="Nesting control">
                <button type="button" className="btn btn-default" onClick={e => setNestingLevel(0)}>
                  <Icon name="list" />
                  <span className="sr-only">Linear</span>
                </button>
                <button type="button" className="btn btn-default" onClick={e => setNestingLevel(1)}>
                  <Icon name="align-left" />
                  <span className="sr-only">Threaded</span>
                </button>
                <button type="button" className="btn btn-default" onClick={e => setNestingLevel(2)}>
                  <Icon name="indent-left" />
                  <span className="sr-only">Nested</span>
                </button>
              </div>
              <div className="btn-group btn-group-sm" role="group" aria-label="Nesting control">
                <button type="button" className="btn btn-default" onClick={e => setCollapseLevel(0)}>
                  <Icon name="resize-small" />
                  <span className="sr-only">Collapsed</span>
                </button>
                <button type="button" className="btn btn-default" onClick={e => setCollapseLevel(1)}>
                  <Icon name="resize-full" />
                  <span className="sr-only">Default</span>
                </button>
                <button type="button" className="btn btn-default" onClick={e => setCollapseLevel(2)}>
                  <Icon name="fullscreen" />
                  <span className="sr-only">Expanded</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <em className="control-label">
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Showing {details.replyCount - numRepliesHidden} / {inflect(details.replyCount, 'Reply', 'Replies', true)}
              </em>
            </div>
          </form>
        </div>
      </div>

      <div className="row">
        <ForumReplyContext.Provider value={{ displayOptionsMap, setDisplayOptionsMap }}>
          <div id="note-children" className="col-md-9">
            {(replyNoteMap && displayOptionsMap && orderedReplies) ? orderedReplies.map(reply => (
              <ForumReply
                key={reply.id}
                note={replyNoteMap[reply.id]}
                replies={reply.replies.map(childId => replyNoteMap[childId])}
                collapsed={displayOptionsMap[reply.id].collapsed}
                setCollapsed={setReplyCollapsed(reply.id)}
                contentExpanded={displayOptionsMap[reply.id].contentExpanded}
                hidden={displayOptionsMap[reply.id].hidden}
              />
            )) : (
              <LoadingSpinner />
            )}
          </div>

          <div className="col-md-3">
            {/*
            <aside className="filters">
              <form className="form-horizontal">
                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Sort:</label>
                  <div className="col-sm-9">
                    <select className="form-control">
                      <option>Most Recent</option>
                      <option>Most Tagged</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Type:</label>
                  <div className="col-sm-9">
                    <select className="form-control">
                      <option>All</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Author:</label>
                  <div className="col-sm-9">
                    <select className="form-control">
                      <option>All</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Tag:</label>
                  <div className="col-sm-9">
                    <select className="form-control" disabled>
                      <option> </option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Search:</label>
                  <div className="col-sm-9">
                    <input type="text" className="form-control" id="keyword-input" placeholder="Keywords" />
                  </div>
                </div>
              </form>
            </aside>
            */}
          </div>
        </ForumReplyContext.Provider>
      </div>
    </div>
  )
}

Forum.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Forum ID is required' }
  }

  const { user, token } = auth(ctx)
  const shouldRedirect = async (noteId) => {
    // if it is the original of a blind submission, do redirection
    const blindNotesResult = await api.get('/notes', { original: noteId }, { accessToken: token })

    // if no blind submission found return the current forum
    if (blindNotesResult.notes?.length) {
      return blindNotesResult.notes[0]
    }

    return false
  }
  const redirectForum = (forumId) => {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: `/forum?id=${encodeURIComponent(forumId)}` }).end()
    } else {
      Router.replace(`/forum?id=${forumId}`)
    }
    return {}
  }

  try {
    const result = await api.get('/notes', {
      id: ctx.query.id, trash: true, details: 'original,invitation,replyCount,writable',
    }, { accessToken: token })
    const note = result.notes[0]

    // Only super user can see deleted forums
    if (note.ddate && !note.details.writable) {
      return { statusCode: 404, message: 'Not Found' }
    }

    // if blind submission return the forum
    if (note.original) {
      return { forumNote: note, query: ctx.query }
    }

    const redirect = await shouldRedirect(note.id)
    if (redirect) {
      return redirectForum(redirect.id)
    }
    return { forumNote: note, query: ctx.query }
  } catch (error) {
    if (error.name === 'forbidden') {
      const redirect = await shouldRedirect(ctx.query.id)
      if (redirect) {
        return redirectForum(redirect.id)
      }

      if (!token) {
        if (ctx.req) {
          ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: 'You don\'t have permission to read this forum' }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

Forum.bodyClass = 'forum'

export default withError(Forum)
