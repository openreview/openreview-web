const SelectAllCheckBox = ({ selectedIds, setSelectedIds, allIds }) => {
  const allIdsSelected = selectedIds.length === allIds?.length

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(allIds)
      return
    }
    setSelectedIds([])
  }
  return (
    <input
      type="checkbox"
      id="select-all-papers"
      checked={allIdsSelected}
      onChange={handleSelectAll}
    />
  )
}

export default SelectAllCheckBox
