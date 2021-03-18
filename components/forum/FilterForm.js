/* globals promptMessage: false */

import { useState } from 'react'
import groupBy from 'lodash/groupBy'
import { stringify } from 'query-string'
import copy from 'copy-to-clipboard'
import Icon from '../Icon'
import Dropdown from '../Dropdown'
import ToggleButtonGroup from '../form/ToggleButtonGroup'
import { prettyId, prettyInvitationId, inflect } from '../../lib/utils'
import { stringifyFilters } from '../../lib/forum-utils'

export default function FilterForm({
  forumId, selectedFilters, setSelectedFilters, filterOptions, sort, setSort,
  layout, setLayout, setCollapseLevel, numReplies, numRepliesHidden,
}) {
  const [collapse, setCollapse] = useState(1)

  // Options for multiselect dropdown
  const dropdownFilterOptions = [
    {
      label: 'Reply Type',
      options: filterOptions.invitations.map(invitationId => ({
        value: invitationId,
        label: prettyInvitationId(invitationId),
        type: 'invitation',
      })),
    },
    {
      label: 'Author',
      options: filterOptions.signatures.map(groupId => ({
        value: groupId,
        label: prettyId(groupId, true),
        type: 'signature',
      })),
    },
  ]
  const selectedInvitationOptions = dropdownFilterOptions[0].options.filter(invOption => (
    selectedFilters.invitations?.includes(invOption.value)
  ))
  const selectedSginatureOptions = dropdownFilterOptions[1].options.filter(sigOption => (
    selectedFilters.signatures?.some((selectedSig) => {
      if (selectedSig.includes('.*')) {
        return (new RegExp(selectedSig)).test(sigOption.value)
      }
      return selectedSig === sigOption.value
    })
  ))
  const readersToggleOptions = filterOptions.readers.map(groupId => ({
    value: groupId,
    label: prettyId(groupId, true),
  }))

  const updateFilters = (modifiedFilters) => {
    setSelectedFilters({
      ...selectedFilters,
      ...modifiedFilters,
    })
  }

  const copyFilterUrl = () => {
    if (!window.location) return
    const urlParams = { layout, sort }

    const filterStr = stringifyFilters(selectedFilters)
    if (filterStr) {
      urlParams.filter = filterStr
    }
    if (selectedFilters.keywords) {
      urlParams.keywords = selectedFilters.keywords
    }
    copy(`${window.location.origin}${window.location.pathname}?id=${forumId}&${stringify(urlParams)}`)
    promptMessage('Forum URL copied to clipboard', { scrollToTop: false })
  }

  return (
    <form className="form-inline filter-controls">
      <div>
        <div className="form-group expand">
          {/* TODO: https://codesandbox.io/s/v638kx67w7 */}
          <Dropdown
            name="filters"
            className="replies-filter"
            options={dropdownFilterOptions}
            value={[...selectedInvitationOptions, ...selectedSginatureOptions]}
            isDisabled={!filterOptions}
            onChange={(selectedOptions) => {
              const groupedOptions = groupBy(selectedOptions, 'type')
              updateFilters({
                invitations: groupedOptions.invitation?.map(option => option.value) ?? null,
                signatures: groupedOptions.signature?.map(option => option.value) ?? null,
              })
            }}
            placeholder="Filter..."
            instanceId="replies-filter"
            height={32}
            isMulti
            isSearchable
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            className="form-control"
            id="keyword-input"
            placeholder="Search..."
            defaultValue={selectedFilters.keywords ? selectedFilters.keywords[0] : ''}
            onBlur={(e) => {
              updateFilters({
                keywords: e.target.value ? [e.target.value.toLowerCase()] : null,
              })
            }}
          />
        </div>

        <div className="form-group">
          <select id="sort-dropdown" className="form-control" value={sort} onChange={(e) => { setSort(e.target.value) }}>
            <option value="date-desc">Sort: Newest First</option>
            <option value="date-asc">Sort: Oldest First</option>
            {/* <option value="tag-desc">Sort: Most Tagged</option> */}
          </select>
        </div>

        <div className="form-group">
          <div className="btn-group btn-group-sm" role="group" aria-label="nesting level">
            <button type="button" className={`btn btn-default ${layout === 0 ? 'active' : ''}`} onClick={(e) => { setLayout(0) }}>
              <Icon name="list" tooltip="Linear discussion" />
              <span className="sr-only">Linear</span>
            </button>
            <button type="button" className={`btn btn-default ${layout === 1 ? 'active' : ''}`} onClick={(e) => { setLayout(1) }}>
              <Icon name="align-left" tooltip="Threaded discussion" />
              <span className="sr-only">Threaded</span>
            </button>
            <button type="button" className={`btn btn-default ${layout === 2 ? 'active' : ''}`} onClick={(e) => { setLayout(2) }}>
              <Icon name="indent-left" tooltip="Nested discussion" />
              <span className="sr-only">Nested</span>
            </button>
          </div>

          <div className="btn-group btn-group-sm" role="group" aria-label="collapse level">
            <button type="button" className={`btn btn-default ${collapse === 0 ? 'active' : ''}`} onClick={(e) => { setCollapse(0); setCollapseLevel(0) }}>
              <Icon name="resize-small" tooltip="Collapse content" />
              <span className="sr-only">Collapsed</span>
            </button>
            <button type="button" className={`btn btn-default ${collapse === 1 ? 'active' : ''}`} onClick={(e) => { setCollapse(1); setCollapseLevel(1) }}>
              <Icon name="resize-full" tooltip="Partially expand content" />
              <span className="sr-only">Default</span>
            </button>
            <button type="button" className={`btn btn-default ${collapse === 2 ? 'active' : ''}`} onClick={(e) => { setCollapse(2); setCollapseLevel(2) }}>
              <Icon name="fullscreen" tooltip="Fully expand content" />
              <span className="sr-only">Expanded</span>
            </button>
          </div>

          <div className="btn-group btn-group-sm" role="group" aria-label="copy url">
            <button type="button" className="btn btn-default" onClick={(e) => { copyFilterUrl() }}>
              <Icon name="link" tooltip="Copy filter URL" />
              <span className="sr-only">Copy link</span>
            </button>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="control-label icon-label" data-toggle="tooltip" data-placement="top" title="Visible to"><Icon name="eye-open" /></label>
          <ToggleButtonGroup
            name="readers-filter"
            className="readers-filter"
            options={readersToggleOptions}
            values={[
              selectedFilters.readers ?? [],
              selectedFilters.excludedReaders ?? [],
            ]}
            onChange={([selectedOptions, unselectedOptions]) => {
              updateFilters({
                readers: selectedOptions.length > 0 ? selectedOptions.map(option => option.value) : null,
                excludedReaders: unselectedOptions.length > 0 ? unselectedOptions.map(option => option.value) : null,
              })
            }}
          />
        </div>

        <div className="form-group">
          <em className="control-label filter-count">
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            {numReplies - numRepliesHidden} / {inflect(numReplies, 'reply', 'replies', true)} shown
          </em>
        </div>
      </div>
    </form>
  )
}
