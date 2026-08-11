/* globals promptMessage: false */

import { stringify } from 'query-string'
import copy from 'copy-to-clipboard'
import Icon from '../Icon'
import Dropdown from '../Dropdown'
import ToggleButtonGroup from '../form/ToggleButtonGroup'
import { prettyId, prettyInvitationId, inflect } from '../../lib/utils'
import { stringifyFilters } from '../../lib/forum-utils'

export default function FilterForm({
  forumId,
  selectedFilters,
  setSelectedFilters,
  filterOptions,
  sort,
  setSort,
  nesting,
  setNesting,
  defaultCollapseLevel,
  setDefaultCollapseLevel,
  numReplies,
  numRepliesHidden,
}) {
  // Options for multiselect dropdown
  const invDropdownFilterOptions = filterOptions.invitations.map((invitationId) => ({
    value: invitationId,
    label: prettyInvitationId(invitationId),
    type: 'invitation',
  }))
  const sigDropdownFilterOptions = filterOptions.signatures.map((groupId) => ({
    value: groupId,
    label: prettyId(groupId, true),
    type: 'signature',
  }))
  const readersToggleOptions = filterOptions.readers.map((groupId) => ({
    value: groupId,
    label: prettyId(groupId, true, true),
  }))

  // Selected options
  const selectedInvitationOptions = invDropdownFilterOptions.filter((invOption) =>
    selectedFilters.invitations?.includes(invOption.value)
  )
  const selectedSginatureOptions = sigDropdownFilterOptions.filter((sigOption) =>
    selectedFilters.signatures?.some((selectedSig) => {
      if (selectedSig.includes('.*')) {
        return new RegExp(selectedSig).test(sigOption.value)
      }
      return selectedSig === sigOption.value
    })
  )
  const selectedReadersOptions = readersToggleOptions.filter((invOption) =>
    selectedFilters.readers?.includes(invOption.value)
  )
  const selectedExReadersOptions = readersToggleOptions.filter((invOption) =>
    selectedFilters.excludedReaders?.includes(invOption.value)
  )

  const updateFilters = (modifiedFilters) => {
    setSelectedFilters({
      ...selectedFilters,
      ...modifiedFilters,
    })

    const activeTab = document.querySelector('.filter-tabs li.active')
    if (activeTab) {
      activeTab.classList.remove('active')
    }
  }

  const copyFilterUrl = () => {
    if (!window.location) return
    const urlParams = { nesting, sort }

    const filterStr = stringifyFilters(selectedFilters)
    if (filterStr) {
      urlParams.filter = filterStr
    }
    if (selectedFilters.keywords) {
      urlParams.keywords = selectedFilters.keywords
    }
    copy(
      `${window.location.origin}${window.location.pathname}?id=${forumId}&${stringify(
        urlParams
      )}`
    )
    promptMessage('Forum URL copied to clipboard')
  }

  return (
    <form className="form-inline filter-controls">
      <div className="wrap">
        <div className="form-group expand">
          {/* For more customization examples see: https://codesandbox.io/s/v638kx67w7 */}
          <Dropdown
            name="filter-invitations"
            className="replies-filter invitations-filter"
            options={invDropdownFilterOptions}
            value={selectedInvitationOptions}
            isDisabled={!filterOptions}
            onChange={(selectedOptions) => {
              updateFilters({
                invitations:
                  selectedOptions.length === 0
                    ? null
                    : selectedOptions.map((option) => option.value),
              })
            }}
            placeholder="Filter by reply type..."
            instanceId="invitations-filter"
            height={32}
            isMulti
            isSearchable
          />
        </div>

        <div className="form-group expand">
          <Dropdown
            name="filter-signatures"
            className="replies-filter"
            options={sigDropdownFilterOptions}
            value={selectedSginatureOptions}
            isDisabled={!filterOptions}
            onChange={(selectedOptions) => {
              updateFilters({
                signatures:
                  selectedOptions.length === 0
                    ? null
                    : selectedOptions.map((option) => option.value),
              })
            }}
            placeholder="Filter by author..."
            instanceId="signatures-filter"
            height={32}
            isMulti
            isSearchable
          />
        </div>

        <div className="form-group expand">
          <input
            aria-label="Search keywords..."
            type="text"
            className="form-control"
            id="keyword-input"
            placeholder="Search keywords..."
            defaultValue={selectedFilters.keywords ? selectedFilters.keywords[0] : ''}
            maxLength={100}
            onChange={(e) => {
              updateFilters({
                keywords: e.target.value ? [e.target.value.toLowerCase().trim()] : null,
              })
            }}
          />
        </div>

        <div className="form-group no-expand">
          <select
            id="sort-dropdown"
            className="form-control"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
            }}
            aria-label="Order By"
          >
            <option value="date-desc">Sort: Newest First</option>
            <option value="date-asc">Sort: Oldest First</option>
            {/* <option value="tag-desc">Sort: Most Tagged</option> */}
          </select>
        </div>

        <div className="form-group no-expand layout-buttons">
          <div className="btn-group btn-group-sm" role="group" aria-label="nesting level">
            <button
              type="button"
              className={`btn btn-default ${nesting === 1 ? 'active' : ''}`}
              onClick={(e) => {
                setNesting(1)
              }}
            >
              <img
                className="icon"
                src="/images/linear_icon.svg"
                alt="back arrow"
                data-toggle="tooltip"
                title="Linear discussion layout"
              />
              <span className="sr-only">Linear</span>
            </button>
            <button
              type="button"
              className={`btn btn-default ${nesting === 2 ? 'active' : ''}`}
              onClick={(e) => {
                setNesting(2)
              }}
            >
              <img
                className="icon"
                src="/images/threaded_icon.svg"
                alt="back arrow"
                data-toggle="tooltip"
                title="Threaded discussion layout"
              />
              <span className="sr-only">Threaded</span>
            </button>
            <button
              type="button"
              className={`btn btn-default ${nesting === 3 ? 'active' : ''}`}
              onClick={(e) => {
                setNesting(3)
              }}
            >
              <img
                className="icon"
                src="/images/nested_icon.svg"
                alt="back arrow"
                data-toggle="tooltip"
                title="Nested discussion layout"
              />
              <span className="sr-only">Nested</span>
            </button>
          </div>

          <div className="btn-group btn-group-sm" role="group" aria-label="collapse level">
            <button
              type="button"
              className={`btn btn-default ${defaultCollapseLevel === 0 ? 'active' : ''}`}
              onClick={(e) => {
                setDefaultCollapseLevel(0)
              }}
            >
              <span data-toggle="tooltip" title="Collapse content">
                −
              </span>
              <span className="sr-only">Collapsed</span>
            </button>
            <button
              type="button"
              className={`btn btn-default ${defaultCollapseLevel === 1 ? 'active' : ''}`}
              onClick={(e) => {
                setDefaultCollapseLevel(1)
              }}
            >
              <span data-toggle="tooltip" title="Partially expand content">
                ＝
              </span>
              <span className="sr-only">Default</span>
            </button>
            <button
              type="button"
              className={`btn btn-default ${defaultCollapseLevel === 2 ? 'active' : ''}`}
              onClick={(e) => {
                setDefaultCollapseLevel(2)
              }}
            >
              <span data-toggle="tooltip" title="Fully expand content">
                ≡
              </span>
              <span className="sr-only">Expanded</span>
            </button>
          </div>

          <div className="btn-group btn-group-sm" role="group" aria-label="copy url">
            <button
              type="button"
              className="btn btn-default"
              onClick={(e) => {
                copyFilterUrl()
              }}
            >
              <Icon name="link" tooltip="Copy filter URL" />
              <span className="sr-only">Copy link</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <span className="control-label icon-label">
          <Icon name="eye-open" tooltip="Visible to" />
        </span>

        {filterOptions.readers.length > 25 ? (
          <div className="form-group readers-filter-container">
            <Dropdown
              name="readers-filter"
              className="replies-filter"
              options={readersToggleOptions}
              value={selectedReadersOptions}
              isDisabled={!filterOptions}
              onChange={(selectedOptions) => {
                updateFilters({
                  readers:
                    selectedOptions.length > 0
                      ? selectedOptions.map((option) => option.value)
                      : null,
                })
              }}
              placeholder="Visible to..."
              instanceId="readers-filter"
              height={32}
              isMulti
              isSearchable
            />
            <Dropdown
              name="readers-filter"
              className="replies-filter"
              options={readersToggleOptions}
              value={selectedExReadersOptions}
              isDisabled={!filterOptions}
              onChange={(selectedOptions) => {
                updateFilters({
                  excludedReaders:
                    selectedOptions.length > 0
                      ? selectedOptions.map((option) => option.value)
                      : null,
                })
              }}
              placeholder="Hidden from..."
              instanceId="excluded-readers-filter"
              height={32}
              isMulti
              isSearchable
            />
          </div>
        ) : (
          <div className="form-group readers-filter-container">
            <ToggleButtonGroup
              name="readers-filter"
              className="readers-filter"
              options={readersToggleOptions}
              values={[selectedFilters.readers ?? [], selectedFilters.excludedReaders ?? []]}
              onChange={([selectedOptions, unselectedOptions]) => {
                updateFilters({
                  readers:
                    selectedOptions.length > 0
                      ? selectedOptions.map((option) => option.value)
                      : null,
                  excludedReaders:
                    unselectedOptions.length > 0
                      ? unselectedOptions.map((option) => option.value)
                      : null,
                })
              }}
              includeReset
            />
          </div>
        )}

        <div className="form-group filtered-reply-count">
          <em className="control-label filter-count">
            {numReplies - numRepliesHidden} / {inflect(numReplies, 'reply', 'replies', true)}{' '}
            shown
          </em>
        </div>
      </div>
    </form>
  )
}
