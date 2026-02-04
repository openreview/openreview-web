/* globals promptError: false */
import isEqual from 'lodash/isEqual'
import { useState } from 'react'
import { forumDate, getNotePdfUrl } from '../../lib/utils'
import Collapse from '../Collapse'
import Icon from '../Icon'
import NoteContent, { NoteContentV2 } from '../NoteContent'
import NoteReaders from '../NoteReaders'
import ExpandableList from '../ExpandableList'
import api from '../../lib/api-client'
import ProfileLink from './ProfileLink'

const getAuthorsValue = (note, isV2Note) => {
  if (isV2Note) return note.content?.authors?.value
  const noteAuthors = note.content?.authors
  const originalAuthors = note.details?.original?.content?.authors
  if (originalAuthors && !isEqual(noteAuthors, originalAuthors)) return originalAuthors
  return noteAuthors
}

const NoteSummary = ({
  note,
  referrerUrl,
  isV2Note,
  profileMap,
  showDates = false,
  showReaders = false,
  ithenticateEdge,
  accessToken,
  preferredEmailInvitationId,
}) => {
  const titleValue = isV2Note ? note.content?.title?.value : note.content?.title
  const pdfValue = isV2Note ? note.content?.pdf?.value : note.content?.pdf
  const authorsValue = getAuthorsValue(note, isV2Note)
  const authorIdsValue = isV2Note ? note.content?.authorids?.value : note.content?.authorids
  const privatelyRevealed = !note.readers?.includes('everyone')
  const maxAuthors = 15

  const [reportLink, setReportLink] = useState(null)
  const [isLoadingReportLink, setIsLoadingReportLink] = useState(false)

  const authorNames = authorsValue?.map((authorName, i) => {
    const authorId = authorIdsValue[i]
    const authorProfile = profileMap?.[authorIdsValue[i]]
    const errorTooltip = authorProfile
      ? 'Profile not yet activated'
      : 'Profile not yet created or email not confirmed'

    return (
      <span key={authorId}>
        <ProfileLink
          id={authorId}
          name={authorName}
          preferredEmailInvitationId={preferredEmailInvitationId}
        />
        {profileMap &&
          (authorProfile?.active ? (
            <Icon
              name="ok-sign"
              tooltip="Profile is active and email confirmed"
              extraClasses="pl-1 text-success"
            />
          ) : (
            <Icon name="remove-sign" tooltip={errorTooltip} extraClasses="pl-1 text-danger" />
          ))}
      </span>
    )
  })

  const getPlagiarismReport = async () => {
    if (reportLink) {
      window.open(reportLink, '_blank')
      return
    }
    setIsLoadingReportLink(true)
    try {
      const { viewerUrl } = await api.get(
        '/ithenticate/viewer-url',
        { edgeId: ithenticateEdge.id },
        { accessToken }
      )
      setReportLink(viewerUrl)
      window.open(viewerUrl, '_blank')
    } catch (error) {
      promptError(error.message)
    }
    setIsLoadingReportLink(false)
  }

  return (
    <div className="note">
      <h4>
        <a
          href={`/forum?id=${note.forum}&referrer=${referrerUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          {titleValue}
        </a>
      </h4>

      {pdfValue && (
        <div className="download-pdf-link">
          <a
            href={getNotePdfUrl(note, false, isV2Note)}
            className="attachment-download-link"
            title="Download PDF"
            target="_blank"
            download={`${note.number}.pdf`}
            rel="noreferrer"
          >
            <span className="glyphicon glyphicon-download-alt" aria-hidden="true"></span>{' '}
            Download PDF
          </a>
        </div>
      )}

      {authorsValue && (
        <div className="note-authors">
          <ExpandableList
            items={authorNames}
            maxItems={maxAuthors}
            expandLabel={`+ ${authorNames.length - maxAuthors} more authors`}
            collapseLabel="Hide authors"
          />
        </div>
      )}

      {showReaders && (
        <div className="note-readers">
          {privatelyRevealed && <Icon name="eye-open" />}
          <NoteReaders readers={note.readers} />
        </div>
      )}

      {showDates && (
        <div>
          <span className="date">
            <strong>Submission date</strong>:{' '}
            {forumDate(
              note.cdate,
              note.tcdate,
              note.mdate,
              note.tmdate,
              isV2Note ? note.content.year?.value : note.content.year,
              note.pdate
            )}
          </span>
        </div>
      )}

      <div className="venue-ithenticate-container">
        {isV2Note && note?.content?.venue?.value && (
          <span className="note-venue">{note.content.venue.value}</span>
        )}

        {ithenticateEdge &&
          (ithenticateEdge.label === 'Similarity Complete' ? (
            <div className="ithenticate-container">
              <div
                className="note-ithenticate report-complete"
                title="Click to Open iThenticate Report"
                data-toggle="tooltip"
                data-placement="top"
                onClick={getPlagiarismReport}
              >
                iThenticate Report {ithenticateEdge.weight}%
              </div>

              {isLoadingReportLink && (
                <div className="spinner spinner-small">
                  <div className="rect1" />
                  <div className="rect2" />
                  <div className="rect3" />
                  <div className="rect4" />
                </div>
              )}
            </div>
          ) : (
            <div className="note-ithenticate">iThenticate Report: {ithenticateEdge.label}</div>
          ))}
      </div>

      <Collapse showLabel="Show details" hideLabel="Hide details">
        {isV2Note ? (
          <NoteContentV2 id={note.id} content={note.content} invitation={note.invitation} />
        ) : (
          <NoteContent
            id={note.id}
            content={note.content}
            invitation={note.invitation}
            include={['html']}
          />
        )}
      </Collapse>
    </div>
  )
}

export default NoteSummary
