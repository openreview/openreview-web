/* eslint-disable max-len */
export default ({
  dblpPublications, openReviewPublications, selectedPublications, setSelectedPublications,
}) => {
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
        return (
          <DblpPublicationRow
            key={index}
            title={publication.title}
            authors={publication.authorNames}
            openReviewId={existingPublication?.id}
            selected={selectedPublications.includes(index)}
            toggleSelected={selectPublication(index)}
          />
        )
      })}
    </Table>
  )
}


const DblpPublicationRow = ({
  title, authors, openReviewId, selected, toggleSelected,
}) => {
  return (
    <tr className={openReviewId ? 'existing-publication-row' : ''}>
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
          {openReviewId ? (
            <a href={`/forum?id=${openReviewId}`} target="_blank" rel="noreferrer">{title}</a>
          ) : (
            <span>{title}</span>
          )}
        </div>
        <div className="publication-author-names">
          {authors.join(', ')}
        </div>
      </td>
    </tr>
  )
}

const Table = ({ headings, children }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          {headings.map((heading, index) => (
            <th scope="col" key={index} style={heading.width ? { width: heading.width } : {}} >
              {heading.content}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  )
}
