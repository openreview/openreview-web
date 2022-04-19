import Table from './Table'

export default function DblpPublicationTable({
  dblpPublications,
  orPublications,
  selectedPublications,
  setSelectedPublications,
  orPublicationsImportedByOtherProfile,
}) {
  const pubsCouldNotImport = [] // either existing or associated with other profile
  const pubsCouldImport = []
  dblpPublications.forEach((dblpPub, index) => {
    const titleMatch = (orPub) =>
      orPub.title === dblpPub.formattedTitle &&
      orPub.authorCount === dblpPub.authorCount &&
      orPub.venue === dblpPub.venue
    const existing = orPublications.find(titleMatch)
    const existingWithOtherProfile = orPublicationsImportedByOtherProfile.find(titleMatch)
    if (existing || existingWithOtherProfile) {
      pubsCouldNotImport.push(index)
    } else {
      pubsCouldImport.push(index)
    }
  })
  const allExistInOpenReview = dblpPublications.length === pubsCouldNotImport.length
  const allChecked =
    dblpPublications.length - pubsCouldNotImport.length === selectedPublications.length

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedPublications([])
      return
    }
    setSelectedPublications(pubsCouldImport)
  }

  const selectPublication = (index) => (checked) => {
    if (checked) {
      setSelectedPublications([...selectedPublications, index])
    } else {
      setSelectedPublications(selectedPublications.filter((p) => p !== index))
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
    <Table headings={headings}>
      {dblpPublications.map((publication, index) => {
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
            key={index}
            title={publication.title}
            authors={publication.authorNames}
            openReviewId={existingPublication?.id || existingPublicationOfOtherProfile?.noteId}
            selected={selectedPublications.includes(index)}
            toggleSelected={selectPublication(index)}
            otherProfileId={existingPublicationOfOtherProfile?.existingProfileId}
            category={category}
            venue={publication.venue}
          />
        )
      })}
    </Table>
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
  <tr className={category === 'nonExisting' ? '' : `${category}-row`}>
    <th scope="row">
      <input
        type="checkbox"
        onChange={(e) => toggleSelected(e.target.checked)}
        checked={selected}
        disabled={openReviewId}
      />
    </th>

    <td>
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
    </td>
  </tr>
)
