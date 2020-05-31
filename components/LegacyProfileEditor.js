/* globals $: false */
/* globals promptMessage: false */
/* globals Webfield: false */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
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

  const showDblpModal = () => {
    console.log('show modal here')
  }

  const unlinkPublication = (profileId, noteId) => Webfield.get('/notes', { id: noteId })
    .then((notes) => {
      const authorIds = get(notes, 'notes[0].content.authorids')
      if (!authorIds) {
        return $.Deferred().reject()
      }
      const idx = authorIds.indexOf(profileId)
      if (idx < 0) {
        $.Deferred().reject()
      }
      authorIds[idx] = null

      const updateAuthorIdsObject = {
        id: null,
        referent: noteId,
        invitation: 'dblp.org/-/author_coreference',
        signatures: [profileId],
        readers: ['everyone'],
        writers: [],
        content: {
          authorids: authorIds,
        },
      }
      return Webfield.post('/notes', updateAuthorIdsObject)
    })

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
      onDblpButtonClick: showDblpModal,
    }, (newProfileData, done) => {
      // Save profile handler
      const { publicationIdsToUnlink } = newProfileData.content
      const dataToSubmit = {
        id: newProfileData.id,
        content: omit(newProfileData.content, [
          'preferredName', 'currentInstitution', 'options', 'publicationIdsToUnlink',
        ]),
      }
      Webfield.post('/profiles', dataToSubmit)
        .then(updatedProfile => Promise.all(publicationIdsToUnlink.map(publicationId => (
          unlinkPublication(profile.id, publicationId)
        ))))
        .then(() => {
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
