/* eslint-disable jsx-a11y/interactive-supports-focus */
import Link from 'next/link'

const PaginationLinks = ({
  currentPage = 1, itemsPerPage, totalCount, baseUrl, options, updateParentPageNumber = null,
}) => {
  if (totalCount <= itemsPerPage) {
    return null
  }

  const overflow = totalCount % itemsPerPage === 0 ? 0 : 1
  const pageCount = Math.floor(totalCount / itemsPerPage) + overflow
  if (currentPage < 0) {
    // eslint-disable-next-line no-param-reassign
    currentPage = pageCount + currentPage + 1
  }
  const pageListLength = Math.min(14, pageCount + 4)
  const pageList = Array(pageListLength)

  // Create entries for Next, Previous, First and Last links
  pageList[0] = {
    key: 'first',
    disabled: currentPage === 1,
    label: <span>&laquo;</span>,
    number: 1,
    extraClasses: 'left-arrow',
  }
  pageList[1] = {
    key: 'previous',
    disabled: currentPage === 1,
    label: <span>&lsaquo;</span>,
    number: currentPage - 1,
    extraClasses: 'left-arrow',
  }
  pageList[pageListLength - 2] = {
    key: 'next',
    disabled: currentPage === pageCount,
    label: <span>&rsaquo;</span>,
    number: currentPage + 1,
    extraClasses: 'right-arrow',
  }
  pageList[pageListLength - 1] = {
    key: 'last',
    disabled: currentPage === pageCount,
    label: <span>&raquo;</span>,
    number: pageCount,
    extraClasses: 'right-arrow',
  }

  // Create entries for numbered page links, try to display an equal number of
  // pages on either side of the current page
  let counter = Math.min(Math.max(currentPage - 5, 1), Math.max(pageCount - 9, 1))
  for (let i = 2; i < pageListLength - 2; i += 1) {
    pageList[i] = {
      active: counter === currentPage,
      label: counter,
      number: counter,
    }
    counter += 1
  }

  return (
    <nav className="pagination-container text-center" aria-label="page navigation">
      <ul className="pagination">
        {pageList.map((page, i) => {
          const classList = []
          if (page.disabled) classList.push('disabled')
          if (page.active) classList.push('active')
          if (page.extraClasses) classList.push(page.extraClasses)

          return (
            <li key={page.key || page.number} className={classList.join(' ')} data-page-number={page.number}>
              {/* eslint-disable-next-line no-nested-ternary */}
              {page.disabled ? (
                <span>{page.label}</span>
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              ) : (updateParentPageNumber ? <a role="button" onClick={() => { updateParentPageNumber(page.number) }}>{page.label}</a>
                : (
                  <Link href={`${baseUrl || ''}&page=${page.number}`}>
                    <a>{page.label}</a>
                  </Link>
                )
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default PaginationLinks
