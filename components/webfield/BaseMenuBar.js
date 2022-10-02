import { debounce, orderBy } from 'lodash'
import React, { Children, useCallback, useEffect, useState } from 'react'
import { filterCollections } from '../../lib/webfield-utils'
import Dropdown from '../Dropdown'
import ExportCSV from '../ExportCSV'
import Icon from '../Icon'

const BaseMenuBar = ({
  tableRowsAll, // filter; export filename
  tableRows,
  selectedIds, // for messaging
  setData,
  shortPhrase,
  enableQuerySearch,
  filterOperators,
  propertiesAllowed,
  messageDropdownLabel = 'Message',
  messageOptions,
  messageModalId,
  messageParentGroup,
  exportColumns,
  sortOptions,
  basicSearchFunction,
  messageModal,
  querySearchInfoModal,
  extraClasses,
}) => {
  const disabledMessageButton = selectedIds?.length === 0

  const [messageOption, setMessageOption] = useState(null)
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [queryIsInvalidStatus, setQueryIsInvalidStatus] = useState(false)
  const [isQuerySearch, setIsQuerySearch] = useState(false)
  const [sortOption, setSortOption] = useState(sortOptions[0])

  const shouldEnableQuerySearch = enableQuerySearch && filterOperators && propertiesAllowed

  const exportFileName = `${shortPhrase}${
    tableRows?.length === tableRowsAll?.length ? ' paper status' : 'paper status(Filtered)'
  }`

  const handleMessageDropdownChange = (option) => {
    setMessageOption(option)
    $(`#${messageModalId}`).modal('show')
  }

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  )

  const keyDownHandler = (e) => {
    if (e.key !== 'Enter' || !shouldEnableQuerySearch) return
    const cleanImmediateSearchTerm = immediateSearchTerm.trim()
    if (!cleanImmediateSearchTerm.startsWith('+')) return
    // query search
    const { filteredRows, queryIsInvalid } = filterCollections(
      tableRowsAll,
      cleanImmediateSearchTerm.slice(1),
      filterOperators,
      propertiesAllowed,
      'note.id'
    )
    if (queryIsInvalid) {
      setQueryIsInvalidStatus(true)
      return
    }
    setData((tabData) => ({
      ...tabData,
      tableRows: filteredRows,
    }))
  }

  const handleQuerySearchInfoClick = () => {
    $('#query-search-info').modal('show')
  }

  const handleReverseSort = () => {
    const reversedTableRows = [...tableRows].reverse()
    setData((tabData) => ({
      ...tabData,
      tableRows: reversedTableRows,
    }))
  }

  useEffect(() => {
    if (!tableRows) return
    if (!searchTerm) {
      setData((tabData) => ({
        ...tabData,
        tableRows: [...tabData.tableRowsAll],
      }))
      return
    }
    const cleanSearchTerm = searchTerm.trim().toLowerCase()
    if (shouldEnableQuerySearch && cleanSearchTerm.startsWith('+')) return // handled in keyDownHandler
    setData((tabData) => ({
      ...tabData,
      tableRows: tabData.tableRowsAll.filter((row) =>
        basicSearchFunction(row, cleanSearchTerm)
      ),
    }))
  }, [searchTerm])

  useEffect(() => {
    setData((data) => ({
      ...data,
      tableRows: orderBy(data.tableRowsAll, sortOption.getValue),
    }))
  }, [sortOption])

  return (
    <div className={`menu-bar ${extraClasses ? extraClasses : ''}`}>
      {messageModal && (
        <div className="message-button-container">
          <button className={`btn message-button${disabledMessageButton ? ' disabled' : ''}`}>
            <Icon name="envelope" />
            <Dropdown
              className={`dropdown-sm message-button-dropdown${
                disabledMessageButton ? ' dropdown-disable' : ''
              }`}
              options={messageOptions}
              components={{
                IndicatorSeparator: () => null,
                DropdownIndicator: () => null,
              }}
              value={{ label: messageDropdownLabel, value: '' }}
              onChange={handleMessageDropdownChange}
              isSearchable={false}
            />
          </button>
        </div>
      )}
      {exportColumns && (
        <div className="btn-group">
          <ExportCSV
            records={tableRows}
            fileName={exportFileName}
            exportColumns={exportColumns}
          />
        </div>
      )}
      <span className="search-label">Search:</span>
      {isQuerySearch && shouldEnableQuerySearch && (
        <div role="button" onClick={handleQuerySearchInfoClick}>
          <Icon name="info-sign" />
        </div>
      )}
      <input
        className={`form-control search-input${queryIsInvalidStatus ? ' invalid-value' : ''}`}
        placeholder={`Enter search term${
          shouldEnableQuerySearch ? ' or type + to start a query and press enter' : ''
        }`}
        value={immediateSearchTerm}
        onChange={(e) => {
          setImmediateSearchTerm(e.target.value)
          setQueryIsInvalidStatus(false)
          setIsQuerySearch(e.target.value.trim().startsWith('+'))
          delaySearch(e.target.value)
        }}
        onKeyDown={(e) => keyDownHandler(e)}
      />
      <span className="sort-label">Sort by:</span>
      <Dropdown
        className="dropdown-sm sort-dropdown"
        value={sortOption}
        options={sortOptions}
        onChange={(e) => setSortOption(e)}
      />
      <button className="btn btn-icon sort-button" onClick={handleReverseSort}>
        <Icon name="sort" />
      </button>

      {messageModal &&
        messageModal({
          tableRowsDisplayed: tableRows,
          messageOption,
          messageModalId,
          selectedIds,
          messageParentGroup,
        })}
      {isQuerySearch &&
        shouldEnableQuerySearch &&
        querySearchInfoModal({ filterOperators, propertiesAllowed })}
    </div>
  )
}

export default BaseMenuBar
