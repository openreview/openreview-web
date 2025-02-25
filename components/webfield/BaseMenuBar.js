/* globals $: false */
import { debounce, orderBy } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { filterCollections } from '../../lib/webfield-utils'
import DownloadPDFButton from '../DownloadPDFButton'
import Dropdown from '../Dropdown'
import ExportFile from '../ExportFile'
import Icon from '../Icon'

const BaseMenuBar = ({
  tableRowsAll, // filter; export filename
  tableRows,
  selectedIds, // for messaging
  setSelectedIds,
  setData,
  shortPhrase,
  enableQuerySearch,
  filterOperators,
  propertiesAllowed,
  messageDropdownLabel = 'Message',
  messageOptions,
  messageModalId,
  messageParentGroup,
  messageSignature,
  exportColumns,
  exportFileName = 'Paper Status',
  sortOptions,
  basicSearchFunction,
  messageModal,
  querySearchInfoModal,
  searchPlaceHolder,
  extraClasses,
  enablePDFDownload = false,
}) => {
  const disabledMessageButton = selectedIds?.length === 0

  const [messageOption, setMessageOption] = useState(null)
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [queryIsInvalidStatus, setQueryIsInvalidStatus] = useState(false)
  const [isQuerySearch, setIsQuerySearch] = useState(false)
  const [sortOption, setSortOption] = useState(sortOptions[0])

  const shouldEnableQuerySearch = enableQuerySearch && filterOperators && propertiesAllowed

  const fullExportFileName = `${shortPhrase}${
    tableRows?.length === tableRowsAll?.length
      ? ` ${exportFileName}`
      : ` ${exportFileName}(Filtered)`
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
    setSelectedIds?.([])
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
      setSelectedIds?.([])
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
    setSelectedIds?.([])
  }, [searchTerm])

  useEffect(() => {
    if (!sortOption) return
    let getValueFn = sortOption.getValue
    if (typeof sortOption.getValue === 'string') {
      try {
        getValueFn = Function('row', sortOption.getValue) // eslint-disable-line no-new-func
      } catch (error) {
        return
      }
    }
    setData((data) => ({
      ...data,
      tableRows: orderBy(data.tableRowsAll, getValueFn, sortOption.initialDirection ?? 'asc'),
    }))
  }, [sortOption])

  return (
    <div className={`menu-bar ${extraClasses ?? ''}`}>
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
          <ExportFile
            records={tableRows}
            fileName={fullExportFileName}
            exportColumns={exportColumns}
          />
        </div>
      )}
      {enablePDFDownload && (
        <div className="btn-group">
          <DownloadPDFButton
            records={tableRowsAll}
            fileName={`${shortPhrase.replaceAll(/\s/g, '_')}_pdfs.zip`}
          />
        </div>
      )}
      <div className="search-controls">
        <span className="search-label">Search:</span>
        {isQuerySearch && shouldEnableQuerySearch && (
          <div role="button" onClick={handleQuerySearchInfoClick}>
            <Icon name="info-sign" />
          </div>
        )}
        <input
          className={`form-control search-input${
            queryIsInvalidStatus ? ' invalid-value' : ''
          }`}
          placeholder={`${searchPlaceHolder ?? 'Enter search term'}${
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
      </div>
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
          messageSignature,
        })}
      {isQuerySearch &&
        shouldEnableQuerySearch &&
        querySearchInfoModal({ filterOperators, propertiesAllowed })}
    </div>
  )
}

export default BaseMenuBar
