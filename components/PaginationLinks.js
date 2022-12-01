import Link from 'next/link'
import { stringify } from 'query-string'

export default function PaginationLinks({
  currentPage = 1,
  setCurrentPage,
  itemsPerPage,
  totalCount,
  baseUrl,
  queryParams = {},
  options = {},
}) {
  if (totalCount <= itemsPerPage) {
    return null
  }

  const overflow = totalCount % itemsPerPage === 0 ? 0 : 1
  const pageCount = Math.floor(totalCount / itemsPerPage) + overflow
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

  const startCount = (currentPage - 1) * itemsPerPage + 1
  let endCount = (currentPage - 1) * itemsPerPage + itemsPerPage
  if (endCount > totalCount) endCount = totalCount

  return (
    <nav className="pagination-container text-center" aria-label="page navigation">
      <ul className="pagination">
        {pageList.map((page) => {
          const classList = []
          if (page.disabled) classList.push('disabled')
          if (page.active) classList.push('active')
          if (page.extraClasses) classList.push(page.extraClasses)

          let pageLink
          if (page.disabled) {
            pageLink = <span>{page.label}</span>
          } else if (typeof setCurrentPage === 'function') {
            const onClickHandler = (e) => {
              e.preventDefault()
              if (!page.active) {
                setCurrentPage(page.number)
                if (!options.noScroll) window.scrollTo(0, 0)
              }
            }
            pageLink = (
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <a href="#" role="button" onClick={onClickHandler}>
                {page.label}
              </a>
            )
          } else {
            const queryString = stringify(
              { ...queryParams, page: page.number },
              { skipNull: true }
            )
            pageLink = (
              <Link
                href={`${baseUrl}?${queryString}`}
                shallow={options.useShallowRouting ?? false}
              >
                <a>{page.label}</a>
              </Link>
            )
          }

          return (
            <li key={page.key || page.number} className={classList.join(' ')}>
              {pageLink}
            </li>
          )
        })}
      </ul>

      {options.showCount && (
        <span className="pagination-count">{`Showing ${startCount}${
          itemsPerPage === 1 ? '' : `-${endCount}`
        } of ${totalCount}`}</span>
      )}
    </nav>
  )
}
