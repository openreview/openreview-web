/* globals $: false */

import { useEffect, useState, useRef } from 'react'
import api from '../lib/api-client'
import editController from '../client/profileView'

import '../styles/components/legacy-profile-editor.less'

export default function LegacyProfileEditor({
  profile, onSubmit, onCancel, submitButtonText = 'Save Profile',
  hideCancelButton = false, hideDblpButton = false, hidePublicationEditor = false,
}) {
  const containerEl = useRef(null)
  const [dropdownOptions, setDropdownOptions] = useState(null)

  const loadOptions = async () => {
    try {
      const optionsRes = await api.get('/profiles/options')
      setDropdownOptions(optionsRes)
    } catch (error) {
      setDropdownOptions({})
    }
  }

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    if (!profile || !dropdownOptions) return

    const { view, renderPublicationEditor } = editController(
      profile,
      {
        prefixedPositions: dropdownOptions.prefixedPositions || [],
        prefixedRelations: dropdownOptions.prefixedRelations || [],
        institutions: dropdownOptions.institutions || [],
        submitButtonText,
        hideCancelButton,
        hideDblpButton,
        hidePublicationEditor,
      },
      onSubmit,
      onCancel,
    )
    $(containerEl.current).empty().append(view)

    if (!hideDblpButton && !hidePublicationEditor) {
      $('#dblp-import-modal').on('hidden.bs.modal', () => {
        renderPublicationEditor()
      })
    }
  }, [profile, dropdownOptions])

  return <div ref={containerEl} />
}
