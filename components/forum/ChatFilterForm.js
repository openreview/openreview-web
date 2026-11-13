import { useState } from 'react'
import { checkFiltersMatch } from '../../lib/forum-utils'
import { prettyId, prettyInvitationId } from '../../lib/utils'
import Dropdown from '../Dropdown'
import Icon from '../Icon'

import styles from '../../styles/components/ChatFilterForm.module.scss'

export default function ChatFilterForm({
  defaultFilters,
  selectedFilters,
  setSelectedFilters,
  filterOptions,
  replyNotes = [],
}) {
  const selectedKeywords = selectedFilters.keywords?.[0] ?? ''
  const [keywords, setKeywords] = useState(selectedKeywords)
  const [prevSelectedKeywords, setPrevSelectedKeywords] = useState(selectedKeywords)

  if (selectedKeywords !== prevSelectedKeywords) {
    setPrevSelectedKeywords(selectedKeywords)
    if (keywords.toLowerCase().trim() !== selectedKeywords) {
      setKeywords(selectedKeywords)
    }
  }

  // Options for dropdowns
  const invDropdownFilterOptions = [
    { value: 'all', label: 'All Message Types', type: 'invitation' },
    ...(defaultFilters?.invitations ?? []).map((invitationId) => ({
      value: invitationId,
      label: prettyInvitationId(invitationId),
      type: 'invitation',
    })),
  ]
  const tabSignatures = new Set(
    replyNotes
      .filter((note) => checkFiltersMatch(note, defaultFilters ?? {}))
      .flatMap((note) => note.signatures)
  )
  const sigDropdownFilterOptions = [...tabSignatures].map((groupId) => ({
    value: groupId,
    label: prettyId(groupId, true),
    type: 'signature',
  }))

  // Selected options
  let selectedInvitationOptions
  if (selectedFilters.invitations === defaultFilters?.invitations) {
    selectedInvitationOptions = invDropdownFilterOptions[0]
  } else {
    selectedInvitationOptions = invDropdownFilterOptions.find((invOption) =>
      selectedFilters.invitations?.includes(invOption.value)
    )
  }
  const selectedSginatureOptions = sigDropdownFilterOptions.filter((sigOption) =>
    selectedFilters.signatures?.some((selectedSig) => {
      if (selectedSig.includes('.*')) {
        return new RegExp(selectedSig).test(sigOption.value)
      }
      return selectedSig === sigOption.value
    })
  )

  const updateFilters = (modifiedFilters) => {
    setSelectedFilters({
      ...selectedFilters,
      ...modifiedFilters,
    })
  }

  return (
    <form className={`form-inline filter-controls ${styles.container}`}>
      <div className="wrap">
        <div className="form-group">
          <Icon name="search" tooltip="Filter messages" />
        </div>
        <div className="form-group expand">
          <input
            type="text"
            className="form-control"
            id="keyword-input"
            placeholder="Search keywords..."
            value={keywords}
            maxLength={100}
            onChange={(e) => {
              setKeywords(e.target.value)
              updateFilters({
                keywords: e.target.value ? [e.target.value.toLowerCase().trim()] : null,
              })
            }}
          />
        </div>
        {defaultFilters?.invitations?.length > 1 && (
          <div className="form-group expand">
            <Dropdown
              name="filter-invitations"
              className="replies-filter invitations-filter"
              options={invDropdownFilterOptions}
              value={selectedInvitationOptions}
              isDisabled={!filterOptions}
              onChange={(selectedOption) => {
                if (!selectedOption) return

                if (selectedOption.value === 'all') {
                  updateFilters({ invitations: defaultFilters?.invitations })
                } else {
                  updateFilters({ invitations: [selectedOption.value] })
                }
              }}
              placeholder="Filter by reply type..."
              instanceId="invitations-filter"
              height={32}
            />
          </div>
        )}

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
      </div>
    </form>
  )
}
