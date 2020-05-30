/* globals $: false */
/* globals promptMessage: false */
/* globals Webfield: false */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import omit from 'lodash/omit'
import api from '../lib/api-client'

import '../styles/legacy-profile-editor.less'

export default function LegacyProfileEditor({ profile, loading }) {
  const containerEl = useRef(null)
  const [dropdownOptions, setDropdownOptions] = useState(null)
  const router = useRouter()

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
    if (loading || !profile || !dropdownOptions) return

    // eslint-disable-next-line global-require
    const editController = require('../client/profileView')

    const { view } = editController(profile, {
      buttonText: 'Save Profile Changes',
      prefixedPositions: dropdownOptions.prefixedPositions || [],
      prefixedRelations: dropdownOptions.prefixedRelations || [],
      institutions: dropdownOptions.institutions || [],
    }, (newProfileData, done) => {
      // Save profile handler
      const dataToSubmit = {
        id: newProfileData.id,
        content: omit(newProfileData.content, ['preferredName', 'currentInstitution', 'options']),
      }
      Webfield.post('/profiles', dataToSubmit)
        .then((updatedProfile) => {
          promptMessage('Your profile information has successfully been updated')
        })
        .always(() => {
          done()
        })
    }, () => {
      // Cancel handler
      router.push(`/profile?id=${profile.id}`)
    })

    $(containerEl.current).empty().append(view)
  }, [loading, profile, dropdownOptions])

  return <div ref={containerEl} />
}
