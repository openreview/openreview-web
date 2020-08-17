import Table from './Table'

export default function DblpPublicationTable({
  dblpPublications,
  openReviewPublications,
  selectedPublications,
  setSelectedPublications,
  openReviewPublicationsImportedByOtherProfile,
}) {
  const dblpPubsInOpenReview = []
  const dblpPubsNotInOpenReview = []
  dblpPublications.forEach((dblpPub, index) => {
    const existing = openReviewPublications.find(orPub => orPub.title === dblpPub.formattedTitle)
    if (existing) {
      dblpPubsInOpenReview.push(index)
    } else {
      dblpPubsNotInOpenReview.push(index)
    }
  })
  const allExistInOpenReview = dblpPublications.length === dblpPubsInOpenReview.length
  const allChecked = dblpPublications.length - dblpPubsInOpenReview.length === selectedPublications.length

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedPublications([])
      return
    }
    setSelectedPublications(dblpPubsNotInOpenReview)
  }

  const selectPublication = index => (checked) => {
    if (checked) {
      setSelectedPublications([...selectedPublications, index])
    } else {
      setSelectedPublications(selectedPublications.filter(p => p !== index))
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
          onChange={e => toggleSelectAll(e.target.checked)}
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
        const existingPublication = openReviewPublications.find(orPub => orPub.title === publication.formattedTitle)
        const existingPublicationOfOtherProfile = openReviewPublicationsImportedByOtherProfile.find(
          p => p.title === publication.formattedTitle,
        )
        // eslint-disable-next-line no-nested-ternary
        const category = existingPublication ? 'existing-publication' : (existingPublicationOfOtherProfile ? 'existing-different-profile' : 'nonExisting')
        return (
          <DblpPublicationRow
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            title={publication.title}
            authors={publication.authorNames}
            openReviewId={existingPublication?.id}
            selected={selectedPublications.includes(index)}
            toggleSelected={selectPublication(index)}
            otherProfileId={existingPublicationOfOtherProfile?.existingProfileId}
            otherProfileNoteId={existingPublicationOfOtherProfile?.noteId}
            category={category}
          />
        )
      })}
    </Table>
  )
}

const PublicationLink = (category, openReviewId, title, otherProfileNoteId, otherProfileId) => {
  switch (category) {
    case 'existing-publication':
      return <a href={`/forum?id=${openReviewId}`} target="_blank" rel="noreferrer">{title}</a>
    case 'existing-different-profile':
      return (
        <>
          <a href={`/forum?id=${otherProfileNoteId}`} target="_blank" rel="noreferrer">{title}</a>
          <a className="different-profile-link" href={`/profile?id=${otherProfileId}`} target="_blank" rel="noreferrer">{`(associated with ${otherProfileId})`}</a>
        </>
      )
    default:
      return <span>{title}</span>
  }
}

const DblpPublicationRow = ({
  title, authors, openReviewId, selected, toggleSelected, otherProfileId, otherProfileNoteId, category,
}) => (
  <tr className={category === 'nonExisting' ? '' : `${category}-row`}>
    <th scope="row">
      <input
        type="checkbox"
        onChange={e => toggleSelected(e.target.checked)}
        checked={selected}
        disabled={openReviewId}
      />
    </th>

    <td>
      <div className="publication-title">
        {PublicationLink(category, openReviewId, title, otherProfileNoteId, otherProfileId)}
      </div>
      <div className="publication-author-names">
        {authors.join(', ')}
      </div>
    </td>
  </tr>
)
