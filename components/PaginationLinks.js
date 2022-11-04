import BasePaginationLinks from './BasePaginationLinks'
import Dropdown from './Dropdown'

export default function PaginationLinks({
  currentPage = 1,
  setCurrentPage,
  itemsPerPage,
  totalCount,
  baseUrl,
  queryParams = {},
  options = {},
}) {
  const pageSizeOptions = (options.pageSizes ?? [15, 30, 50, 100]).map((p) => ({
    label: `${p} items`,
    value: p,
  }))

  if (totalCount <= itemsPerPage) {
    return null
  }

  return (
    <div className="pagination-container-with-control">
      <BasePaginationLinks
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalCount={totalCount}
        baseUrl={baseUrl}
        queryParams={queryParams}
        options={options}
      />
      {options.showPageSizeOptions && (
        <Dropdown
          className="dropdown-select dropdown-pagesize"
          options={pageSizeOptions}
          value={pageSizeOptions.find((p) => p.value === itemsPerPage)}
          onChange={(e) => {
            setCurrentPage(1)
            options.setPageSize(e.value)
          }}
        />
      )}
    </div>
  )
}
