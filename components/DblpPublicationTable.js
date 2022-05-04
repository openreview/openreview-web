import { groupBy } from 'lodash'
import Accordion from './Accordion'
import Table from './Table'
import { inflect } from '../lib/utils'

export default function DblpPublicationTable({
  dblpPublications,
  orPublications,
  selectedPublications,
  setSelectedPublications,
  orPublicationsImportedByOtherProfile,
}) {
  const pubsCouldNotImport = [] // either existing or associated with other profile
  const pubsCouldImport = []
  dblpPublications.forEach((dblpPub) => {
    const titleMatch = (orPub) =>
      orPub.title === dblpPub.formattedTitle &&
      orPub.authorCount === dblpPub.authorCount &&
      orPub.venue === dblpPub.venue
    const existing = orPublications.find(titleMatch)
    const existingWithOtherProfile = orPublicationsImportedByOtherProfile.find(titleMatch)
    if (existing || existingWithOtherProfile) {
      pubsCouldNotImport.push(dblpPub.key)
    } else {
      pubsCouldImport.push(dblpPub.key)
    }
  })
  const allExistInOpenReview = dblpPublications.length === pubsCouldNotImport.length
  const allChecked =
    dblpPublications.length - pubsCouldNotImport.length === selectedPublications.length

  const dblpPublicationsGroupedByYear = groupBy(dblpPublications, (p) => p.year)

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedPublications([])
      return
    }
    setSelectedPublications(pubsCouldImport)
  }

  const toggleSelectYear = (e, year) => {
    const publicationKeysOfYear = dblpPublicationsGroupedByYear[year]
      ?.map((p) => p.key)
      .filter((q) => pubsCouldImport.includes(q))
    if (e.target.checked) {
      setSelectedPublications([...selectedPublications, ...publicationKeysOfYear])
    } else {
      setSelectedPublications(
        selectedPublications.filter((p) => !publicationKeysOfYear.includes(p))
      )
    }
    e.stopPropagation()
  }

  const selectPublication = (publicationKey) => (checked) => {
    if (checked) {
      setSelectedPublications([...selectedPublications, publicationKey])
    } else {
      setSelectedPublications(selectedPublications.filter((p) => p !== publicationKey))
    }
  }

  if (!dblpPublications.length) {
    return null
  }

  const headings = [
    {
      content: (
        <input
          type="checkbox"
          onChange={(e) => toggleSelectAll(e.target.checked)}
          checked={allChecked}
          disabled={allExistInOpenReview}
        />
      ),
      width: '24px',
    },
    {
      content: 'Select All',
    },
  ]

  return (
    <>
      <Table headings={headings} />
      <div>
        <Accordion
          sections={Object.keys(dblpPublicationsGroupedByYear)
            .reverse()
            .map((p) => {
              const publicationsOfYear = dblpPublicationsGroupedByYear[p]
              const publicationsCouldImportOfYear = publicationsOfYear.filter((q) =>
                pubsCouldImport.includes(q.key)
              )
              return {
                id: p,
                heading: (
                  <>
                    <input
                      className="year-checkbox"
                      type="checkbox"
                      onChange={(e) => toggleSelectYear(e, p)}
                      checked={
                        publicationsCouldImportOfYear.length &&
                        publicationsCouldImportOfYear.every((r) =>
                          selectedPublications.includes(r.key)
                        )
                      }
                      disabled={publicationsCouldImportOfYear.length === 0}
                    />
                    {`${p} - ${inflect(
                      publicationsOfYear.length,
                      'publication',
                      'publications',
                      true
                    )}`}
                  </>
                ),
                body: (
                  <>
                    {publicationsOfYear.map((publication) => {
                      const titleMatch = (orPub) =>
                        orPub.title === publication.formattedTitle &&
                        orPub.authorCount === publication.authorCount &&
                        orPub.venue === publication.venue
                      const existingPublication = orPublications.find(titleMatch)
                      const existingPublicationOfOtherProfile =
                        orPublicationsImportedByOtherProfile.find(titleMatch)
                      // eslint-disable-next-line no-nested-ternary
                      const category = existingPublication
                        ? 'existing-publication'
                        : existingPublicationOfOtherProfile
                        ? 'existing-different-profile'
                        : 'nonExisting'

                      return (
                        <DblpPublicationRow
                          // eslint-disable-next-line react/no-array-index-key
                          key={publication.key}
                          title={publication.title}
                          authors={publication.authorNames}
                          openReviewId={
                            existingPublication?.id ||
                            existingPublicationOfOtherProfile?.noteId
                          }
                          selected={selectedPublications.includes(publication.key)}
                          toggleSelected={selectPublication(publication.key)}
                          otherProfileId={existingPublicationOfOtherProfile?.existingProfileId}
                          category={category}
                          venue={publication.venue}
                        />
                      )
                    })}
                  </>
                ),
              }
            })}
          options={{ id: 'dblp-papers', collapsed: false, html: false, bodyContainer: '' }}
        />
      </div>
    </>
  )
}

const DblpPublicationRow = ({
  title,
  authors,
  openReviewId,
  selected,
  toggleSelected,
  otherProfileId,
  category,
  venue,
}) => (
  <div
    className={
      category === 'nonExisting' ? 'publication-info' : `publication-info ${category}-row`
    }
  >
    <input
      type="checkbox"
      onChange={(e) => toggleSelected(e.target.checked)}
      checked={selected}
      disabled={openReviewId}
    />
    <div>
      <div className="publication-title">
        {category === 'existing-publication' || category === 'existing-different-profile' ? (
          <a href={`/forum?id=${openReviewId}`} target="_blank" rel="noreferrer">
            {title}
          </a>
        ) : (
          <span>{title}</span>
        )}
        <span className="venue">({venue})</span>
      </div>
      <div className="publication-author-names">{authors.join(', ')}</div>
      {category === 'existing-different-profile' && (
        <>
          <a
            className="different-profile-link"
            href={`/profile?id=${otherProfileId}`}
            target="_blank"
            rel="noreferrer"
          >
            This paper is associated with the user {otherProfileId}
          </a>
          <div className="different-profile-link">
            Please contact us if you think this profile might be yours
          </div>
        </>
      )}
    </div>
  </div>
)
