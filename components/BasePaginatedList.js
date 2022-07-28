import PaginationLinks from './PaginationLinks'

export default function BasePaginatedList({
  listItems,
  totalCount,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  ListItem,
  emptyMessage,
  className,
}) {
  return (
    <div className={className}>
      <ul className="list-unstyled list-paginated">
        {listItems?.length > 0 ? (
          listItems.map((item) => (
            <li key={item.id}>
              <ListItem item={item} />
            </li>
          ))
        ) : (
          <li>
            <p className="empty-message">{emptyMessage || 'No items to display'}</p>
          </li>
        )}
      </ul>

      <PaginationLinks
        setCurrentPage={setCurrentPage}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        options={{ noScroll: true }}
      />
    </div>
  )
}
