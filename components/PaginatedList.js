import PaginationLinks from './PaginationLinks'

const PaginatedList = ({
  items, totalCount, loadItems, currentPage, setCurrentPage, renderItem,
}) => (
    <>
      <ul className="list-unstyled">
        {items.map(item => (
          renderItem(item)
        ))}
      </ul>
      <PaginationLinks
        setCurrentPage={(pageNumber) => { setCurrentPage(pageNumber); loadItems(15, (pageNumber - 1) * 15) }}
        totalCount={totalCount}
        itemsPerPage={15}
        currentPage={currentPage}
        options={{ noScroll: true, noBottomMargin: true }}
      />
    </>
)

export default PaginatedList
