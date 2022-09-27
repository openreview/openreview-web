import { useState } from 'react'

const ExportCSV = ({ records, fileName }) => {
  const [href, setHref] = useState(null)
  const exportColumns = [
    { header: 'number', getValue: (p) => p.note?.number },
    { header: 'forum', getValue: (p) => `https://openreview.net/forum?id=${p.note?.forum}` },
    {
      header: 'title',
      getValue: (p, isV2Note) =>
        isV2Note ? p.note?.content?.title?.value : p.note?.content?.title,
    },
    {
      header: 'abstract',
      getValue: (p, isV2Note) =>
        isV2Note ? p.note?.content?.abstract?.value : p.note?.content?.abstract,
    },
    { header: 'num reviewers', getValue: (p) => p.reviewProgressData?.numReviewersAssigned },
    {
      header: 'num submitted reviewers',
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
    },
    {
      header: 'missing reviewers',
      getValue: (p) =>
        p.reviewers
          ?.filter((q) => !q.hasReview)
          ?.map((r) => r.reviewerProfileId)
          ?.join('|'),
    },
    {
      header: 'reviewer contact info',
      getValue: (p) =>
        p.reviewers.map((q) => `${q.preferredName}<${q.preferredEmail}>`).join(','),
    },
    { header: 'min rating', getValue: (p) => p.reviewProgressData?.ratingMin },
    { header: 'max rating', getValue: (p) => p.reviewProgressData?.ratingMax },
    { header: 'average rating', getValue: (p) => p.reviewProgressData?.ratingAvg },
    { header: 'min confidence', getValue: (p) => p.reviewProgressData?.confidenceMin },
    { header: 'max confidence', getValue: (p) => p.reviewProgressData?.confidenceMax },
    { header: 'average confidence', getValue: (p) => p.reviewProgressData?.confidenceAvg },
    { header: 'ac recommendation', getValue: (p) => p.metaReviewData?.recommendation },
  ]

  const handleExportClick = () => {
    const headerRow = `${exportColumns.map((p) => p.header).join(',')}\n`
    const dataRows = records.map(
      (p) =>
        `${exportColumns
          .map((column) => {
            const value = column.getValue(p, p.note?.version === 2)?.toString()
            return `"${value?.replaceAll('"', '""')}"`
          })
          .join(',')}\n`
    )

    const blob = new Blob([headerRow, ...dataRows], { type: 'text/csv' })
    const url = window.URL || window.webkitURL
    setHref(url.createObjectURL(blob))
  }
  return (
    <button className="btn btn-export-data">
      <a download={fileName} href={href} onClick={handleExportClick}>
        Export
      </a>
    </button>
  )
}

export default ExportCSV
